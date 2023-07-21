/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable eqeqeq */
import { removeAllListeners } from "node:process";
import * as vscode from 'vscode';
import { focusEditor, getRandomId, getWebviewOptions } from './utils';
export default class QueryViewProvider {
    public static readonly viewType = 'codeQueryPanel';
    private apiQueryBaseUrl = 'http://127.0.0.1:5000';
    constructor(private context: vscode.ExtensionContext) {
    }
    public show(): void | Thenable<void> {
        const title = '代码检索';
        const panel = vscode.window.createWebviewPanel(
            QueryViewProvider.viewType,
            title,
            vscode.ViewColumn.Two,
            getWebviewOptions(this.context.extensionUri)
        );

        panel.webview.html = this.getHtmlForWebview(panel.webview, this.context.extensionUri);

        panel.webview.onDidReceiveMessage(async message => {
            switch (message.type) {
                case "applyText":
                    focusEditor().then(() => {
                        const editor = vscode.window.activeTextEditor || vscode.window.visibleTextEditors.at(0);
                        // console.log('editor--', editor);
                        editor?.edit(editBuilder => {
                            editBuilder.insert(editor.selection.start, message.value);
                        });
                    });
                    break;

                case "searchCode":
                    const thisfetch = globalThis.fetch;
                    try {
                        const body = JSON.stringify({ function_description: message.value });
                        let res = await thisfetch(`${this.apiQueryBaseUrl}/search_functions`, { headers: { 'Content-Type': 'application/json' }, method: 'POST', body });
                        res = await res.json();
                        this.sendMessage(panel, { type: 'searchCodeResponse', value: res });
                    } catch {
                        this.sendMessage(panel, { type: 'searchCodeResponse', value: 'failed' });
                    }
                    break;
                default:
                    break;
            }
        });

        panel.onDidDispose(() => {
            // When the panel is closed, cancel any future updates to the webview content
            removeAllListeners();
        },
            null,
            this.context.subscriptions);
    }
    public sendMessage(webView: vscode.WebviewPanel, message: any, ignoreMessageIfNullWebView?: boolean) {
        if (webView) {
            webView?.webview.postMessage(message);
        }
    }
    private getHtmlForWebview(webview: vscode.Webview, _extensionUri: vscode.Uri) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        // const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(_extensionUri, 'assets', 'main.js'));

        const notice = '请输入关键字检索代码';
        const keywords = '关键字';

        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'query.js'));
        const stylesqueryUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'query.css'));

        const vendorHighlightCss = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'highlight.min.css'));
        const vendorHighlightJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'highlight.min.js'));
        const vendorMarkedJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'marked.min.js'));
        // const vendorTailwindJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'tailwindcss.3.2.4.min.js'));
        const vendorTurndownJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'turndown.js'));

        const searchIcon = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'images', 'search.svg'));
        const nonce = getRandomId();
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
  
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
          <link href="${stylesqueryUri}" rel="stylesheet">
          <link href="${vendorHighlightCss}" rel="stylesheet">
          <script src="${vendorHighlightJs}"></script>
		  <script src="${vendorMarkedJs}"></script>
		  <script src="${vendorTurndownJs}"></script>
        </head>
        <body>
        <div class="title">${notice}</div>
        <div class="container">
          <div class="search-bar">
            <label for="keywords">${keywords}:</label>
            <input type="text" id="keywords" >
            <button id="btnSearch"><img src="${searchIcon}"/></button>
          </div>
          <div id="result"></div>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
        </html>`;
    }
}