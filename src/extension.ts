import * as vscode from "vscode";
import ConversationViewProvider from './conversation-view-provider';
import QueryViewProvider from "./query-view-provider";

const menuCommands = ["generateCode"];

export async function activate(context: vscode.ExtensionContext) {
	// fix 自签名证书 certificate issue
	process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
	const provider = new ConversationViewProvider(context);

	const queryProvider = new QueryViewProvider(context);
	const view = vscode.window.registerWebviewViewProvider(
		"aily.conversation.view",
		provider,
		{
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		}
	);

	// 在状态栏注册代码检索的入口, 点击该入口触发aily.queryCode命令
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	const queryTitle = '代码检索';
	statusBarItem.text = `$(open-preview) ${queryTitle}`;
	statusBarItem.command = 'aily.queryCode';
	statusBarItem.show();


	// 注册命令：aily.queryCode 触发时，显示webview
	const queryCode = vscode.commands.registerCommand('aily.queryCode', () => {
		queryProvider.show();
	});

	const clearSession = vscode.commands.registerCommand("aily.clearSession", () => {
		context.globalState.update("aily-session-token", null);
		context.globalState.update("aily-clearance-token", null);
		context.globalState.update("aily-user-agent", null);
		context.globalState.update("aily-gpt3-apiKey", null);
		provider?.clearSession();
	});

	const configChanged = vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('aily.response.showNotification')) {
			provider.subscribeToResponse = vscode.workspace.getConfiguration("aily").get("response.showNotification") || false;
		}

		if (e.affectsConfiguration('aily.llm.model')) {
			provider.model = vscode.workspace.getConfiguration("aily").get("llm.model");
		}

		if (e.affectsConfiguration('aily.llm.model')) {
			provider.prepareConversation(true);
		}

		if (e.affectsConfiguration('aily.promptPrefix') || e.affectsConfiguration('aily.llm.model')) {
			setContext();
		}
	});


	const generateCodeCommand = vscode.commands.registerCommand(`aily.generateCode`, () => {
		const prompt = vscode.workspace.getConfiguration("aily").get<string>(`promptPrefix.generateCode`) || '';

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
					provider.addToRepo({ code: selection, description: value }, false);
					// .then(res => {
					// 	vscode.window.showInformationMessage('已入库');
					// }).catch(res => {
					// 	vscode.window.showErrorMessage('入库失败');
					// });
				}
			});

	});
	// Skip AdHoc - as it was registered earlier
	const registeredCommands = menuCommands.filter(command => command !== "generateCode").map((command) => vscode.commands.registerCommand(`aily.${command}`, () => {
		const prompt = vscode.workspace.getConfiguration("aily").get<string>(`promptPrefix.${command}`);
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
				const enabled = !!vscode.workspace.getConfiguration("aily.promptPrefix").get<boolean>(`${command}-enabled`);
				vscode.commands.executeCommand('setContext', `${command}-enabled`, enabled);
			}
		});
	};

	setContext();
}

export function deactivate() { }
