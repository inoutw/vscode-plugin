import * as vscode from "vscode";
import ChatGptViewProvider from './chatgpt-view-provider';
import QueryViewProvider from "./query-view-provider";

const menuCommands = ["addTests", "findProblems", "optimize", "explain", "addComments", "completeCode", "generateCode", "customPrompt1", "customPrompt2", "adhoc"];

export async function activate(context: vscode.ExtensionContext) {
	// fix 自签名证书 certificate issue
	process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
	const provider = new ChatGptViewProvider(context);

	const queryProvider = new QueryViewProvider(context);
	const view = vscode.window.registerWebviewViewProvider(
		"vscode-chatgpt.view",
		provider,
		{
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		}
	);

	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	const queryTitle = '代码检索';
	statusBarItem.text = `$(open-preview) ${queryTitle}`;
	statusBarItem.command = 'aily.queryCode';
	statusBarItem.show();


	const queryCode = vscode.commands.registerCommand('aily.queryCode', () => {
		queryProvider.show();
	});

	const clearSession = vscode.commands.registerCommand("vscode-chatgpt.clearSession", () => {
		context.globalState.update("chatgpt-session-token", null);
		context.globalState.update("chatgpt-clearance-token", null);
		context.globalState.update("chatgpt-user-agent", null);
		context.globalState.update("chatgpt-gpt3-apiKey", null);
		provider?.clearSession();
	});

	const configChanged = vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('chatgpt.response.showNotification')) {
			provider.subscribeToResponse = vscode.workspace.getConfiguration("chatgpt").get("response.showNotification") || false;
		}

		if (e.affectsConfiguration('chatgpt.useAutoLogin')) {
			provider.useAutoLogin = vscode.workspace.getConfiguration("chatgpt").get("useAutoLogin") || false;

			context.globalState.update("chatgpt-session-token", null);
			context.globalState.update("chatgpt-clearance-token", null);
			context.globalState.update("chatgpt-user-agent", null);
		}

		if (e.affectsConfiguration('chatgpt.profilePath')) {
			provider.setProfilePath();
		}

		if (e.affectsConfiguration('chatgpt.gpt3.model')) {
			provider.model = vscode.workspace.getConfiguration("chatgpt").get("gpt3.model");
		}

		if (e.affectsConfiguration('chatgpt.gpt3.apiBaseUrl')
			|| e.affectsConfiguration('chatgpt.gpt3.model')
			|| e.affectsConfiguration('chatgpt.gpt3.organization')
			|| e.affectsConfiguration('chatgpt.gpt3.maxTokens')) {
			provider.prepareConversation(true);
		}

		if (e.affectsConfiguration('chatgpt.promptPrefix') || e.affectsConfiguration('chatgpt.gpt3.model')) {
			setContext();
		}
	});


	const generateCodeCommand = vscode.commands.registerCommand(`vscode-chatgpt.generateCode`, () => {
		const prompt = vscode.workspace.getConfiguration("chatgpt").get<string>(`promptPrefix.generateCode`) || '';

		if (prompt) {
			provider?.sendApiRequest(prompt, { command: "generateCode" });
		}

	});

	const addToRepoCommand = vscode.commands.registerCommand(`aily.addToRepo`, () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const selection = editor.document.getText(editor.selection);

		vscode.window
			.showInputBox({
				title: "代码描述将存入代码库，支持代码检索",
				prompt: "",
				ignoreFocusOut: true,
				placeHolder: "请输入代码描述",
				value: ""
			})
			.then((value) => {
				console.log('value', value);
				if (value) {
					provider.addToRepo({ code: selection, description: value }, false).then(res => {
						vscode.window.showInformationMessage('已入库');
					}).catch(res => {
						vscode.window.showErrorMessage('入库失败');
					});
				}
			});

	});
	// Skip AdHoc - as it was registered earlier
	const registeredCommands = menuCommands.filter(command => command !== "adhoc" && command !== "generateCode").map((command) => vscode.commands.registerCommand(`vscode-chatgpt.${command}`, () => {
		const prompt = vscode.workspace.getConfiguration("chatgpt").get<string>(`promptPrefix.${command}`);
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const selection = editor.document.getText(editor.selection);
		if (selection && prompt) {
			provider?.sendApiRequest(prompt, { command, code: selection, language: editor.document.languageId });
		}
	}));

	context.subscriptions.push(statusBarItem, addToRepoCommand, view, queryCode, clearSession, configChanged, generateCodeCommand, ...registeredCommands);

	const setContext = () => {
		menuCommands.forEach(command => {
			if (command === "generateCode") {
				let generateCodeEnabled = true;
				vscode.commands.executeCommand('setContext', "generateCode-enabled", generateCodeEnabled);
			} else {
				const enabled = !!vscode.workspace.getConfiguration("chatgpt.promptPrefix").get<boolean>(`${command}-enabled`);
				vscode.commands.executeCommand('setContext', `${command}-enabled`, enabled);
			}
		});
	};

	setContext();
}

export function deactivate() { }
