/* eslint-disable eqeqeq */
// @ts-nocheck

(function () {
    const vscode = acquireVsCodeApi();

    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: function (code, _lang) {
            return hljs.highlightAuto(code).value;
        },
        langPrefix: 'hljs language-',
        pedantic: false,
        gfm: true,
        breaks: true,
        sanitize: false,
        smartypants: false,
        xhtml: false
    });

    const aiPng = `data:image/png;base64,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`;

    const userSvg = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1689660922627" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="14976" width="20" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M629.546667 640a95.957333 95.957333 0 0 1 95.914666 95.957333v24.533334c0 38.144-13.653333 75.093333-38.4 104.064C620.032 942.762667 518.186667 981.333333 384 981.333333s-236.032-38.613333-302.848-116.906666a160 160 0 0 1-38.314667-103.850667v-24.661333a95.957333 95.957333 0 0 1 95.957334-96h490.752z m0 64H138.752a31.957333 31.957333 0 0 0-32 31.957333v24.661334c0 22.826667 8.192 44.928 23.04 62.293333 53.461333 62.634667 137.386667 94.464 254.165333 94.464 116.864 0 200.789333-31.829333 254.421334-94.464a96 96 0 0 0 23.04-62.421333v-24.533334a31.957333 31.957333 0 0 0-31.914667-32z m183.466666-644.096a32 32 0 0 1 43.648 11.904A541.610667 541.610667 0 0 1 928 341.333333c0 96.170667-25.002667 188.757333-71.808 270.336a32 32 0 0 1-55.509333-31.829333A477.610667 477.610667 0 0 0 864 341.333333c0-84.608-21.888-165.973333-62.933333-237.781333a32 32 0 0 1 11.946666-43.648zM384 128.170667a213.333333 213.333333 0 1 1 0 426.666666 213.333333 213.333333 0 0 1 0-426.666666z m281.130667 16.853333a32 32 0 0 1 43.648 12.032A371.754667 371.754667 0 0 1 757.333333 341.333333c0 65.621333-16.981333 128.853333-48.768 184.661334a32 32 0 1 1-55.637333-31.701334A307.754667 307.754667 0 0 0 693.333333 341.333333a307.754667 307.754667 0 0 0-40.192-152.661333 32 32 0 0 1 11.946667-43.648zM384 192.213333a149.333333 149.333333 0 1 0 0 298.666667 149.333333 149.333333 0 0 0 0-298.666667z" fill="#ffffff" p-id="14977"></path></svg>`;

    const clipboardSvg = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1689911395957" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1579" width="16" height="16" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M720 192h-544A80.096 80.096 0 0 0 96 272v608C96 924.128 131.904 960 176 960h544c44.128 0 80-35.872 80-80v-608C800 227.904 764.128 192 720 192z m16 688c0 8.8-7.2 16-16 16h-544a16 16 0 0 1-16-16v-608a16 16 0 0 1 16-16h544a16 16 0 0 1 16 16v608z" p-id="1580" fill="#ffffff"></path><path d="M848 64h-544a32 32 0 0 0 0 64h544a16 16 0 0 1 16 16v608a32 32 0 1 0 64 0v-608C928 99.904 892.128 64 848 64z" p-id="1581" fill="#ffffff"></path><path d="M608 360H288a32 32 0 0 0 0 64h320a32 32 0 1 0 0-64zM608 520H288a32 32 0 1 0 0 64h320a32 32 0 1 0 0-64zM480 678.656H288a32 32 0 1 0 0 64h192a32 32 0 1 0 0-64z" p-id="1582" fill="#ffffff"></path></svg>`;

    const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;

    const cancelSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3 mr-1"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;

    const sendSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3 mr-1"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>`;

    const pencilSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`;

    const plusSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`;

    const insertSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>`;

    const textSvg = `<svg xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" ><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

    const closeSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;

    const refreshSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>`;

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", (event) => {
        const message = event.data;
        const list = document.getElementById("qa-list");
        const addRepoBtn = document.getElementById('add-repo') || {};
        switch (message.type) {
            case "addRepoResponse":
                // const result = message.value == 'success' ? `${checkSvg} 已入库` : `${cancelSvg} 入库失败`;
                // addRepoBtn.innerHTML = result;

                // setTimeout(() => {
                //     addRepoBtn.innerHTML = `${plusSvg} 入库`;
                // }, 2000);
                break;
            case "showInProgress":
                const stopBtn = document.getElementById('stop-button');

                if (message.showStopButton && stopBtn?.classList) {
                    stopBtn.classList.remove("hidden");
                } else {
                    stopBtn?.classList && stopBtn.classList.add("hidden");
                }

                if (message.inProgress) {
                    document.getElementById("in-progress").classList.remove("hidden");
                    document.getElementById("question-input").setAttribute("disabled", true);
                    document.getElementById("question-input-buttons").classList.add("hidden");
                } else {
                    document.getElementById("in-progress").classList.add("hidden");
                    document.getElementById("question-input").removeAttribute("disabled");
                    document.getElementById("question-input-buttons").classList.remove("hidden");
                }
                break;
            case "addQuestion":
                list.classList.remove("hidden");
                document.getElementById("introduction")?.classList?.add("hidden");
                document.getElementById("conversation-list").classList.add("hidden");

                const escapeHtml = (unsafe) => {
                    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
                };

                list.innerHTML +=
                    `<div class="p-3 self-end question-element-ext relative input-background">
                        <h3 class="mb-2 flex mt-0"><span class="mr-1">${userSvg}</span> ${message.username}</h3>
                        <no-export class="mb-2 flex items-center">
                            <div class="hidden send-cancel-elements-ext flex gap-2">
                                <button title="Send this prompt" class="send-element-ext p-1 pr-2 flex items-center">${sendSvg}&nbsp;Send</button>
                                <button title="Cancel" class="cancel-element-ext p-1 pr-2 flex items-center">${cancelSvg}&nbsp;Cancel</button>
                            </div>
                        </no-export>
                        <div class="overflow-y-auto">${escapeHtml(message.value)}</div>
                    </div>`;

                if (message.autoScroll) {
                    list.lastChild?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
                }
                break;
            case "addResponse":
                let existingMessage = message.id && document.getElementById(message.id);
                let updatedValue = "";

                const unEscapeHtml = (unsafe) => {
                    return unsafe.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#039;', "'");
                };

                if (!message.responseInMarkdown) {
                    updatedValue = "```\r\n" + unEscapeHtml(message.value) + " \r\n ```";
                } else {
                    // 如果markdown文本没有结束，则让他结束
                    updatedValue = message.value.split("```").length % 2 === 1 ? message.value : message.value + "\n\n```\n\n";
                }

                const markedResponse = marked.parse(updatedValue);

                if (existingMessage) {
                    existingMessage.innerHTML = markedResponse;
                } else {
                    list.innerHTML +=
                        `<div class="p-3 self-end pb-8 answer-element-ext">
                        <h3 class="mb-2 flex mt-0 ai-title"><img src="${aiPng}"/>Aily</h3>
                        <div class="result-streaming" id="${message.id}">${markedResponse}</div>
                    </div>`;
                }

                if (message.done) {
                    const preCodeList = list.lastChild.querySelectorAll("pre > code");

                    preCodeList.forEach((preCode) => {
                        preCode.classList.add("input-background", "p-4", "pb-2", "block", "whitespace-pre", "overflow-x-scroll");
                        preCode.parentElement.classList.add("pre-code-element", "relative");

                        const buttonWrapper = document.createElement("no-export");
                        buttonWrapper.classList.add("code-actions-wrapper", "flex", "gap-3", "pr-2", "pt-1", "pb-1", "flex-wrap", "items-center", "justify-end", "rounded-t-lg", "input-background");

                        // Create copy to clipboard button
                        const copyButton = document.createElement("button");
                        copyButton.title = "复制到剪贴板";
                        copyButton.innerHTML = `${clipboardSvg} 复制`;

                        copyButton.classList.add("code-element-ext", "p-1", "pr-2", "flex", "items-center", "rounded-lg");

                        const insert = document.createElement("button");
                        insert.title = "Insert the below code to the current file";
                        insert.innerHTML = `${insertSvg} Insert`;

                        insert.classList.add("edit-element-ext", "p-1", "pr-2", "flex", "items-center", "rounded-lg");

                        const addToRepo = document.createElement("button");
                        addToRepo.title = "将代码添加到代码库";
                        addToRepo.innerHTML = `${plusSvg} 入库`;
                        addToRepo.id = 'add-repo';

                        addToRepo.classList.add("add-code-element-ext", "p-1", "pr-2", "flex", "items-center", "rounded-lg");

                        buttonWrapper.append(copyButton);

                        if (preCode.parentNode.previousSibling) {
                            preCode.parentNode.parentNode.insertBefore(buttonWrapper, preCode.parentNode.previousSibling);
                        } else {
                            preCode.parentNode.parentNode.prepend(buttonWrapper);
                        }
                    });

                    existingMessage = document.getElementById(message.id);
                    existingMessage?.classList?.remove("result-streaming");
                }

                if (message.autoScroll && (message.done || markedResponse.endsWith("\n"))) {
                    list.lastChild?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
                }

                break;
            case "addError":
                if (!list.innerHTML) {
                    return;
                }

                const messageValue = message.value || "An error occurred. If this issue persists please clear your session token with `Aily: Reset session` command and/or restart your Visual Studio Code. If you still experience issues, it may be due to outage on https://openai.com services.";

                list.innerHTML +=
                    `<div class="p-4 self-end mt-4 pb-8 error-element-ext">
                        <h3 class="mb-5 flex ai-title"><img src="${aiPng}"/>Aily</h3>
                        <div class="text-red-400">${marked.parse(messageValue)}</div>
                    </div>`;

                if (message.autoScroll) {
                    list.lastChild?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
                }
                break;
            case "clearConversation":
                clearConversation();
                break;
            case "exportConversation":
                exportConversation();
                break;
            case "loginSuccessful":
                document.getElementById("login-button")?.classList?.add("hidden");
                if (message.showConversations) {
                    document.getElementById("list-conversations-link")?.classList?.remove("hidden");
                }
                break;
            case "listConversations":
                list.classList.add("hidden");
                document.getElementById("introduction")?.classList?.add("hidden");
                const conversationList = document.getElementById("conversation-list");
                conversationList.classList.remove("hidden");
                const conversation_list = message.conversations.items.map(conversation => {
                    const chatDate = new Date(conversation.create_time).toLocaleString();
                    return `<button id="show-conversation-button" data-id="${conversation.id}" data-title="${conversation.title.replace(/"/g, '')}" data-time="${chatDate}" class="flex py-3 px-3 items-center gap-3 relative rounded-lg input-background cursor-pointer break-all group">${textSvg}<div class="flex flex-col items-start gap-2 truncate"><span class="text-left font-bold">${conversation.title}</span><div class="text-xs text-left">${chatDate}</div></div></button>`;
                });
                conversationList.innerHTML = `<div class="flex flex-col gap-4 text-sm relative overflow-y-auto p-8">
                    <div class="flex justify-center gap-4">
                        <button id="refresh-conversations-button" title="Reload conversations" class="p-1 pr-2 flex items-center rounded-lg">${refreshSvg}&nbsp;Reload</button>
                        <button id="close-conversations-button" title="Close conversations panel" class="p-1 pr-2 flex items-center rounded-lg">${closeSvg}&nbsp;Close</button>
                    </div>
                    <div class="flex flex-col gap-4">${conversation_list.join("")}</div>
                </div>`;
                break;
            default:
                break;
        }
    });

    const addFreeTextQuestion = () => {
        const input = document.getElementById("question-input");
        if (input.value?.length > 0) {
            vscode.postMessage({
                type: "addFreeTextQuestion",
                value: input.value,
            });

            input.value = "";
        }
    };

    const handleGenerateCode = () => {
        const input = document.getElementById("question-input");
        if (input.value?.length > 0) {
            vscode.postMessage({
                type: "generateCode",
                value: input.value,
            });

            input.value = "";
        }
    };

    const clearConversation = () => {
        document.getElementById("qa-list").innerHTML = "";

        document.getElementById("introduction")?.classList?.remove("hidden");

        vscode.postMessage({
            type: "clearConversation"
        });

    };

    document.getElementById('question-input').addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            handleGenerateCode();
        }
    });

    document.addEventListener("click", (e) => {
        const targetButton = e.target.closest('button');

        if (targetButton?.id === "more-button") {
            e.preventDefault();
            document.getElementById('chat-button-wrapper')?.classList.toggle("hidden");

            return;
        } else {
            document.getElementById('chat-button-wrapper')?.classList.add("hidden");
        }

        if (e.target?.id === "settings-button") {
            e.preventDefault();
            vscode.postMessage({
                type: "openSettings",
            });
            return;
        }

        if (e.target?.id === "settings-prompt-button") {
            e.preventDefault();
            vscode.postMessage({
                type: "openSettingsPrompt",
            });
            return;
        }

        if (targetButton?.id === "login-button") {
            e.preventDefault();
            vscode.postMessage({
                type: "login",
            });
            return;
        }

        if (targetButton?.id === "ask-button") {
            e.preventDefault();
            // addFreeTextQuestion();
            handleGenerateCode();
            return;
        }

        if (targetButton?.id === "clear-button") {
            e.preventDefault();
            clearConversation();
            return;
        }

        if (targetButton?.id === "export-button") {
            e.preventDefault();
            exportConversation();
            return;
        }

        if (targetButton?.id === "list-conversations-button" || targetButton?.id === "list-conversations-link") {
            e.preventDefault();

            vscode.postMessage({ type: "listConversations" });
            return;
        }

        if (targetButton?.id === "show-conversation-button") {
            e.preventDefault();

            vscode.postMessage({ type: "showConversation", value: targetButton.getAttribute("data-id") });

            document.getElementById("qa-list").innerHTML = `<div class="flex flex-col p-6 pt-2">
                <h2 class="text-lg">${targetButton.getAttribute("data-title")}</h2>
                <span class="text-xs">Started on: ${targetButton.getAttribute("data-time")}</span>
            </div>`;

            document.getElementById("qa-list").classList.remove("hidden");
            document.getElementById("introduction").classList.add("hidden");
            document.getElementById("conversation-list").classList.add("hidden");
            return;
        }

        if (targetButton?.id === "refresh-conversations-button") {
            e.preventDefault();

            vscode.postMessage({ type: "listConversations" });
            return;
        }

        if (targetButton?.id === "close-conversations-button") {
            e.preventDefault();
            const qaList = document.getElementById('qa-list');
            qaList.classList.add("hidden");
            document.getElementById('conversation-list').classList.add("hidden");
            document.getElementById('introduction').classList.add("hidden");
            if (qaList.innerHTML?.length > 0) {
                qaList.classList.remove("hidden");
            } else {
                document.getElementById('introduction').classList.remove("hidden");
            }
            return;
        }

        if (targetButton?.id === "stop-button") {
            e.preventDefault();
            vscode.postMessage({
                type: "stopGenerating",
            });

            return;
        }

        if (targetButton?.classList?.contains("resend-element-ext")) {
            e.preventDefault();
            const question = targetButton.closest(".question-element-ext");
            const elements = targetButton.nextElementSibling;
            elements.classList.remove("hidden");
            question.lastElementChild?.setAttribute("contenteditable", true);

            targetButton.classList.add("hidden");

            return;
        }

        if (targetButton?.classList?.contains("send-element-ext")) {
            e.preventDefault();

            const question = targetButton.closest(".question-element-ext");
            const elements = targetButton.closest(".send-cancel-elements-ext");
            const resendElement = targetButton.parentElement.parentElement.firstElementChild;
            elements.classList.add("hidden");
            resendElement.classList.remove("hidden");
            question.lastElementChild?.setAttribute("contenteditable", false);

            if (question.lastElementChild.textContent?.length > 0) {
                vscode.postMessage({
                    type: "addFreeTextQuestion",
                    value: question.lastElementChild.textContent,
                });
            }
            return;
        }

        if (targetButton?.classList?.contains("cancel-element-ext")) {
            e.preventDefault();
            const question = targetButton.closest(".question-element-ext");
            const elements = targetButton.closest(".send-cancel-elements-ext");
            const resendElement = targetButton.parentElement.parentElement.firstElementChild;
            elements.classList.add("hidden");
            resendElement.classList.remove("hidden");
            question.lastElementChild?.setAttribute("contenteditable", false);
            return;
        }

        if (targetButton?.classList?.contains("code-element-ext")) {
            e.preventDefault();
            navigator.clipboard.writeText(targetButton.parentElement?.nextElementSibling?.lastChild?.textContent).then(() => {
                targetButton.innerHTML = `${checkSvg} 已复制`;

                setTimeout(() => {
                    targetButton.innerHTML = `${clipboardSvg} 复制`;
                }, 1500);
            });

            return;
        }

        if (targetButton?.classList?.contains("edit-element-ext")) {
            e.preventDefault();
            vscode.postMessage({
                type: "editCode",
                value: targetButton.parentElement?.nextElementSibling?.lastChild?.textContent,
            });

            return;
        }

        if (targetButton?.classList?.contains("add-code-element-ext")) {
            e.preventDefault();
            vscode.postMessage({
                type: "addToRepo",
                value: targetButton.parentElement?.nextElementSibling?.lastChild?.textContent,
            });

            return;
        }
    });

})();
