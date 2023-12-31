/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable eqeqeq */
import delay from 'delay';
import fetch from 'isomorphic-fetch';
import * as vscode from 'vscode';
import { ChatGPTAPI as ChatGPTAPI35 } from '../chatgpt-5.1.1/index';
import { AuthType, LoginMethod } from "./types";
import { getRandomId } from "./utils";

export default class ChatGptViewProvider implements vscode.WebviewViewProvider {
	private webView?: vscode.WebviewView;

	public subscribeToResponse: boolean;
	public autoScroll: boolean;
	public useAutoLogin?: boolean;
	public useGpt3?: boolean;
	public profilePath?: string;
	public model?: string;

	private apiGpt35?: ChatGPTAPI35;
	private conversationId?: string;
	private messageId?: string;
	private loginMethod?: LoginMethod;
	private authType?: AuthType;

	private questionCounter: number = 0;
	private inProgress: boolean = false;
	private abortController?: AbortController;
	private currentMessageId: string = "";
	private response: string = "";
	// private apiKey: string = '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';
	private apiKey: string = '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';
	// private azureApiKey: string = 'cd475067c8384e20a89fdd7ca0a7d881';
	// private azureUrl: string = 'https://koteiopenai.openai.azure.com';
	private apiAiBaseUrl: string = 'https://121.40.104.79';
	private apiQueryBaseUrl: string = 'http://121.40.104.79:5000';
	private username: string;
	private description: string = '';


	/**
	 * Message to be rendered lazily if they haven't been rendered
	 * in time before resolveWebviewView is called.
	 */
	private leftOverMessage?: any;
	constructor(private context: vscode.ExtensionContext) {
		this.subscribeToResponse = false;
		this.autoScroll = true;
		this.model = vscode.workspace.getConfiguration("aily").get("llm.model") as string;
		this.username = vscode.workspace.getConfiguration("aily").get("username") as string;
		this.setMethod();
		this.setAuthType();
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this.webView = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this.context.extensionUri
			]
		};

		webviewView.webview.html = this.getWebviewHtml(webviewView.webview);
		this.sendMessage({ type: 'username', value: this.username }, true);

		webviewView.webview.onDidReceiveMessage(async data => {
			switch (data.type) {
				case 'addFreeTextQuestion':
					this.sendApiRequest(data.value, { command: "freeText" });
					break;
				case 'generateCode':
					// 记录第一次的问题，作为入库的描述
					if (this.questionCounter === 0) {
						this.description = data.value;
					}
					const prompt = vscode.workspace.getConfiguration("aily").get<string>(`promptPrefix.generateCode`) || '';
					this.sendApiRequest(`${prompt}: ${data.value}`, { command: "generateCode" });
					break;
				case 'addToRepo':
					this.addToRepo({ code: data.value });
					break;
				case 'editCode':
					const escapedString = (data.value as string).replace(/\$/g, '\\$');;
					vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(escapedString));

					this.logEvent("code-inserted");
					break;
				case 'clearConversation':
					this.messageId = undefined;
					this.conversationId = undefined;

					this.logEvent("conversation-cleared");
					break;

				case 'openSettings':
					vscode.commands.executeCommand('workbench.action.openSettings', "@ext:YOUR_PUBLISHER_NAME.aily aily.");

					this.logEvent("settings-opened");
					break;
				case 'openSettingsPrompt':
					vscode.commands.executeCommand('workbench.action.openSettings', "@ext:YOUR_PUBLISHER_NAME.aily promptPrefix");

					this.logEvent("settings-prompt-opened");
					break;
				case 'listConversations':
					this.logEvent("conversations-list-attempted");
					break;
				case 'showConversation':
					/// ...
					break;
				case "stopGenerating":
					this.stopGenerating();
					break;
				default:
					break;
			}
		});

		if (this.leftOverMessage != null) {
			// If there were any messages that wasn't delivered, render after resolveWebView is called.
			this.sendMessage(this.leftOverMessage);
			this.leftOverMessage = null;
		}
	}

	private stopGenerating(): void {
		this.abortController?.abort?.();
		this.inProgress = false;
		this.sendMessage({ type: 'showInProgress', inProgress: this.inProgress });
		const responseInMarkdown = true;
		// this.sendMessage({ type: 'addResponse', value: this.response, done: true, id: this.currentMessageId, autoScroll: this.autoScroll, responseInMarkdown });
		this.logEvent("stopped-generating");
	}

	public clearSession(): void {
		this.stopGenerating();
		this.messageId = undefined;
		this.conversationId = undefined;
		this.logEvent("cleared-session");
	}

	public setMethod(): void {
		this.loginMethod = 'GPT3 OpenAI API Key';

		this.useGpt3 = true;
		this.useAutoLogin = false;
		this.clearSession();
	}

	public setAuthType(): void {
		this.authType = 'OpenAI Authentication';
		this.clearSession();
	}

	private get isGpt35Model(): boolean {
		return !!this.model?.startsWith("gpt-");
	}

	public async prepareConversation(modelChanged = false): Promise<boolean> {
		if (modelChanged && this.useAutoLogin) {
			// no need to reinitialize in autologin when model changes
			return false;
		}

		const state = this.context.globalState;
		const configuration = vscode.workspace.getConfiguration("aily");
		if (this.useGpt3) {
			if ((this.isGpt35Model && !this.apiGpt35) || (!this.isGpt35Model) || modelChanged) {
				// let apiKey = configuration.get("gpt3.apiKey") as string || state.get("chatgpt-gpt3-apiKey") as string;
				let apiKey = this.apiKey;
				const temperature = 1;
				const apiBaseUrl = this.apiAiBaseUrl;

				if (!apiKey) {
					/**
					 * 显示错误消息并询问用户是否将 API Key 存储在会话中或打开设置
					 *
					 * @returns {Promise<string>} 用户的选项："Open settings" 或 "Store in session (Recommended)"
					 */

					vscode.window.showErrorMessage("Please add your API Key to use OpenAI official APIs. Storing the API Key in Settings is discouraged due to security reasons, though you can still opt-in to use it to persist it in settings. Instead you can also temporarily set the API Key one-time: You will need to re-enter after restarting the vs-code.", "Store in session (Recommended)", "Open settings").then(async choice => {
						if (choice === "Open settings") {
							vscode.commands.executeCommand('workbench.action.openSettings', "chatgpt.gpt3.apiKey");
							return false;
						} else if (choice === "Store in session (Recommended)") {
							await vscode.window
								.showInputBox({
									title: "Store OpenAI API Key in session",
									prompt: "Please enter your OpenAI API Key to store in your session only. This option won't persist the token on your settings.json file. You may need to re-enter after restarting your VS-Code",
									ignoreFocusOut: true,
									placeHolder: "API Key",
									value: apiKey || ""
								})
								.then((value) => {
									if (value) {
										apiKey = value;
										state.update("chatgpt-gpt3-apiKey", apiKey);
										this.sendMessage({ type: 'loginSuccessful', showConversations: this.useAutoLogin }, true);
									}
								});
						}
					});

					return false;
				}

				if (this.isGpt35Model) {
					this.apiGpt35 = new ChatGPTAPI35({
						apiKey,
						fetch: fetch,
						apiBaseUrl: apiBaseUrl?.trim() || undefined,
						completionParams: {
							model: this.model,
							temperature,
						}
					});
				}
			}
		}

		this.sendMessage({ type: 'loginSuccessful', showConversations: this.useAutoLogin }, true);

		return true;
	}

	private get systemContext() {
		return `You are ChatGPT helping the User with coding. 
			You are intelligent, helpful and an expert developer, who always gives the correct answer and only does what instructed. You always answer truthfully and don't make things up. 
			(When responding to the following prompt, please make sure to properly style your response using Github Flavored Markdown. 
			Use markdown syntax for things like headings, lists, colored text, code blocks, highlights etc. Make sure not to mention markdown or styling in your actual response.)`;
	}

	private processQuestion(question: string, code?: string, language?: string) {
		if (code != null) {
			// Add prompt prefix to the code if there was a code block selected
			question = `${question}${language ? ` (The following code is in ${language} programming language)` : ''}: ${code}`;
		}
		return question + "\r\n";
	}

	public async sendApiRequest(prompt: string, options: { command: string, code?: string, previousAnswer?: string, language?: string; }) {
		if (this.inProgress) {
			// The AI is still thinking... Do not accept more questions.
			return;
		}

		this.questionCounter++;

		this.logEvent("api-request-sent", { "aily.command": options.command, "aily.hasCode": String(!!options.code), "aily.hasPreviousAnswer": String(!!options.previousAnswer) });

		if (!await this.prepareConversation()) {
			return;
		}

		this.response = '';
		let question = this.processQuestion(prompt, options.code, options.language);
		const responseInMarkdown = true;

		// If the ChatGPT view is not in focus/visible; focus on it to render Q&A
		if (this.webView == null) {
			vscode.commands.executeCommand('aily.conversation.view.focus');
		} else {
			this.webView?.show?.(true);
		}

		this.inProgress = true;
		this.abortController = new AbortController();
		this.sendMessage({ type: 'showInProgress', inProgress: this.inProgress, showStopButton: this.useGpt3 });
		this.currentMessageId = getRandomId();

		this.sendMessage({ type: 'addQuestion', value: prompt, code: options.code, autoScroll: this.autoScroll, username: this.username });

		try {
			if (this.useGpt3) {
				if (this.isGpt35Model && this.apiGpt35) {
					const gpt3Response = await this.apiGpt35.sendMessage(question, {
						systemMessage: this.systemContext,
						messageId: this.conversationId,
						parentMessageId: this.messageId,
						abortSignal: this.abortController.signal,
						timeoutMs: 15000,
						onProgress: (partialResponse) => {
							this.response = partialResponse.text;
							// console.log('this.response', this.response);
							this.sendMessage({ type: 'addResponse', value: this.response, id: this.currentMessageId, autoScroll: this.autoScroll, responseInMarkdown });
						},
					});
					({ text: this.response, id: this.conversationId, parentMessageId: this.messageId } = gpt3Response);
				}
			}

			if (options.previousAnswer != null) {
				this.response = options.previousAnswer + this.response;
			}

			const hasContinuation = ((this.response.split("```").length) % 2) === 0;

			if (hasContinuation) {
				this.response = this.response + " \r\n ```\r\n";
				vscode.window.showInformationMessage("It looks like ChatGPT didn't complete their answer for your coding question. You can ask it to continue and combine the answers.", "Continue and combine answers")
					.then(async (choice) => {
						if (choice === "Continue and combine answers") {
							this.sendApiRequest("Continue", { command: options.command, code: undefined, previousAnswer: this.response });
						}
					});
			}

			this.sendMessage({ type: 'addResponse', value: this.response, done: true, id: this.currentMessageId, autoScroll: this.autoScroll, responseInMarkdown });

			if (this.subscribeToResponse) {
				vscode.window.showInformationMessage("ChatGPT responded to your question.", "Open conversation").then(async () => {
					await vscode.commands.executeCommand('vscode-chatgpt.view.focus');
				});
			}
		} catch (error: any) {
			let message;
			let apiMessage = error?.response?.data?.error?.message || error?.tostring?.() || error?.message || error?.name;

			this.logError("api-request-failed");

			if (error?.response?.status || error?.response?.statusText) {
				message = `${error?.response?.status || ""} ${error?.response?.statusText || ""}`;

				vscode.window.showErrorMessage("An error occured. If this is due to max_token you could try `ChatGPT: Clear Conversation` command and retry sending your prompt.", "Clear conversation and retry").then(async choice => {
					if (choice === "Clear conversation and retry") {
						await vscode.commands.executeCommand("vscode-chatgpt.clearConversation");
						await delay(250);
						this.sendApiRequest(prompt, { command: options.command, code: options.code });
					}
				});
			} else if (error.statusCode === 400) {
				message = `Your method: '${this.loginMethod}' and your model: '${this.model}' may be incompatible or one of your parameters is unknown. Reset your settings to default. (HTTP 400 Bad Request)`;

			} else if (error.statusCode === 401) {
				message = 'Make sure you are properly signed in. If you are using Browser Auto-login method, make sure the browser is open (You could refresh the browser tab manually if you face any issues, too). If you stored your API key in settings.json, make sure it is accurate. If you stored API key in session, you can reset it with `ChatGPT: Reset session` command. (HTTP 401 Unauthorized) Potential reasons: \r\n- 1.Invalid Authentication\r\n- 2.Incorrect API key provided.\r\n- 3.Incorrect Organization provided. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.';
			} else if (error.statusCode === 403) {
				message = 'Your token has expired. Please try authenticating again. (HTTP 403 Forbidden)';
			} else if (error.statusCode === 404) {
				message = `Your method: '${this.loginMethod}' and your model: '${this.model}' may be incompatible or you may have exhausted your ChatGPT subscription allowance. (HTTP 404 Not Found)`;
			} else if (error.statusCode === 429) {
				message = "Too many requests try again later. (HTTP 429 Too Many Requests) Potential reasons: \r\n 1. You exceeded your current quota, please check your plan and billing details\r\n 2. You are sending requests too quickly \r\n 3. The engine is currently overloaded, please try again later. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
			} else if (error.statusCode === 500) {
				message = "The server had an error while processing your request, please try again. (HTTP 500 Internal Server Error)\r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
			}

			if (apiMessage) {
				message = `${message ? message + " " : ""}

	${apiMessage}
`;
			}

			this.sendMessage({ type: 'addError', value: message, autoScroll: this.autoScroll });

			return;
		} finally {
			this.inProgress = false;
			this.sendMessage({ type: 'showInProgress', inProgress: this.inProgress });
		}
	}

	/**
	 * 将代码和描述入库
	 * @param  
	 */
	public async addToRepo({ code, description = this.description }: any, sendMsg = true) {

		const thisfetch = globalThis.fetch;
		// console.log('description', description);
		try {
			const body = JSON.stringify({ function_code: code, function_description: description });
			thisfetch(`${this.apiQueryBaseUrl}/add_data`, { headers: { 'Content-Type': 'application/json' }, method: 'POST', body }).then(res => {
				vscode.window.showInformationMessage('已入库');
			});
			// if (sendMsg) {
			// 	this.sendMessage({ type: 'addRepoResponse', value: 'success' });
			// }
			// return Promise.resolve('success');
		} catch (error) {
			vscode.window.showInformationMessage('入库失败');

		}
	}
	/**
	 * Message sender, stores if a message cannot be delivered
	 * @param message Message to be sent to WebView
	 * @param ignoreMessageIfNullWebView We will ignore the command if webView is null/not-focused
	 */
	public sendMessage(message: any, ignoreMessageIfNullWebView?: boolean) {
		if (this.webView) {
			this.webView?.webview.postMessage(message);
		} else if (!ignoreMessageIfNullWebView) {
			this.leftOverMessage = message;
		}
	}

	private logEvent(eventName: string, properties?: {}): void {
		// You can initialize your telemetry reporter and consume it here - *replaced with console.debug to prevent unwanted telemetry logs
		// this.reporter?.sendTelemetryEvent(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown", ...properties }, { "chatgpt.questionCounter": this.questionCounter });
		console.debug(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown", ...properties }, { "chatgpt.questionCounter": this.questionCounter });
	}

	private logError(eventName: string): void {
		// You can initialize your telemetry reporter and consume it here - *replaced with console.error to prevent unwanted telemetry logs
		// this.reporter?.sendTelemetryErrorEvent(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown" }, { "chatgpt.questionCounter": this.questionCounter });
		console.error(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown" }, { "chatgpt.questionCounter": this.questionCounter });
	}

	private getWebviewHtml(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js'));
		const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.css'));

		const vendorHighlightCss = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'highlight.min.css'));
		const vendorHighlightJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'highlight.min.js'));
		const vendorMarkedJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'marked.min.js'));
		const vendorTailwindJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'tailwindcss.3.2.4.min.js'));
		const vendorTurndownJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'turndown.js'));

		const nonce = getRandomId();

		const imgLogo = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'images', 'code-aily.png'));


		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesMainUri}" rel="stylesheet">
				<link href="${vendorHighlightCss}" rel="stylesheet">
				<script src="${vendorHighlightJs}"></script>
				<script src="${vendorMarkedJs}"></script>
				<script src="${vendorTailwindJs}"></script>
				<script src="${vendorTurndownJs}"></script>
			</head>
			<body class="overflow-hidden">
				<div class="flex flex-col h-screen">
					<div id="introduction" class="flex flex-col justify-between h-full justify-center px-6 w-full relative login-screen overflow-auto">
						<div class="flex items-start text-center features-block my-5">
							<div class="flex flex-col gap-3.5 flex-1">
								<img src="${imgLogo}" class="img-logo">
								<h2>欢迎使用Aily</h2>
								<ul class="flex flex-col gap-3.5 text-xs">
									<li class="features-li w-full border border-zinc-700 p-3 rounded-md">通过自然语言对话，智能生成代码</li>
									<li class="features-li w-full border border-zinc-700 p-3 rounded-md">代码入库</li>
									<li class="features-li w-full border border-zinc-700 p-3 rounded-md">代码检索和应用</li>
								</ul>
							</div>
						</div>
						<div class="flex flex-col gap-4 h-full items-center justify-end text-center">
							
							<button id="list-conversations-link" class="hidden mb-4 btn btn-primary flex gap-2 justify-center p-3 rounded-md" title="You can access this feature via the kebab menu below. NOTE: Only available with Browser Auto-login method">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>&nbsp;Show conversations
							</button>
							<p class="max-w-sm text-center text-xs text-slate-500">
							</p>
						</div>
					</div>
					<div class="flex-1 overflow-y-auto" id="qa-list"></div>

					<div class="flex-1 overflow-y-auto hidden" id="conversation-list"></div>

					<div id="in-progress" class="pl-4 pt-2 flex items-center hidden">
						<div class="typing">AI正在思考中</div>
						<div class="spinner">
							<div class="bounce1"></div>
							<div class="bounce2"></div>
							<div class="bounce3"></div>
						</div>

					</div>
					
					<div class="p-4 flex items-center pt-2">
						<div class="flex-1 textarea-wrapper">
							<textarea
								type="text"
								rows="1"
								id="question-input"
								placeholder="请输入描述来生成代码"
								onInput="this.parentNode.dataset.replicatedValue = this.value"></textarea>
						</div>
						
						<div id="question-input-buttons" class="right-6 absolute p-0.5 ml-5 flex items-center gap-2">
							

							<button id="ask-button" title="Submit prompt" class="ask-button rounded-lg p-0.5">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
							</button>
						</div>
					</div>
				</div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}


}
