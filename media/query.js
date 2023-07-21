/* eslint-disable @typescript-eslint/naming-convention */
(function () {
    const vscode = acquireVsCodeApi();
    let loading = false;
    const btnSearch = document.getElementById('btnSearch');
    const btnOriginHtml = btnSearch.innerHTML;
    const spinIcon = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1686299243169" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1997" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M832 448H896a64 64 0 0 1 0 128h-64a64 64 0 0 1 0-128z m-146.773333-197.504l45.269333-45.226667a64 64 0 0 1 90.538667 90.496l-45.269334 45.226667a64 64 0 1 1-90.496-90.453333z m0 525.269333a64 64 0 1 1 90.538666-90.496l45.226667 45.226667a64 64 0 0 1-90.453333 90.538667l-45.269334-45.269334zM128 448h64a64 64 0 0 1 0 128H128a64 64 0 0 1 0-128z m384-384A64 64 0 0 1 576 128v64a64 64 0 0 1-128 0V128A64 64 0 0 1 512 64zM512 768a64 64 0 0 1 64 64V896a64 64 0 0 1-128 0v-64A64 64 0 0 1 512 768zM205.226667 205.226667a64 64 0 0 1 90.538666 0l45.226667 45.269333a64 64 0 0 1-90.453333 90.538667L205.226667 295.765333a64 64 0 0 1 0-90.496z m0 615.808a64 64 0 0 1 0-90.538667l45.269333-45.226667a64 64 0 1 1 90.538667 90.496l-45.269334 45.226667a64 64 0 0 1-90.496 0z" fill="#cccccc" opacity=".3" p-id="1998"></path></svg>';

    window.addEventListener("message", (event) => {
        const message = event.data;
        switch (message.type) {
            case "searchCodeResponse":
                loading = false;
                btnSearch.innerHTML = btnOriginHtml;
                btnSearch.style.cursor = 'pointer';
                btnSearch.disabled = false;
                console.log('message.value', message.value);
                if (message.value === 'failed') {
                    document.getElementById('result').innerHTML = '查询失败，请稍后再试';
                } else {
                    handleResponse(message.value);
                }
                break;
            default:
                break;
        }
    });
    const handleResponse = (res) => {
        const result = res;

        const html = result?.map((item, index) => {
            const { function_code, function_description, similarity } = item;

            const codeRes = hljs.highlight(function_code, { language: 'cpp' }).value;

            const matchRate = similarity * 100 + "%";

            return `<div class="item-wrap">
                        <div class="title">
                            <div class="txt">${function_description}</div> 
                            <div class="right">
                                <span class="subtxt">匹配度：${matchRate}</span> 
                                <span class="apply" data-index="${index}">应用</span>
                            </div>
                        </div>
                        <div class="content code language-cpp"><pre>${codeRes}</pre></div>
                    </div>`;
        }).join('');

        document.getElementById('result').innerHTML = html;

        document.getElementById('result').addEventListener('click', function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var target = ev.target || ev.srcElement;
            if (target.className.toLowerCase() === 'apply') {
                const index = target.getAttribute('data-index');
                const text = result[index]?.function_code; // 假设结果数组为 results

                // 向 VSCode 编辑器发送消息，并插入文本到当前编辑器中
                vscode.postMessage({
                    type: 'applyText',
                    value: text
                });
            }
            return false;
        });

    };

    document.getElementById('keywords').addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            handleSearch();
        }
    });

    btnSearch.addEventListener('click', () => {
        handleSearch();
    });

    const handleSearch = () => {
        const inputKeywords = document.getElementById('keywords');
        const keywords = inputKeywords.value;
        if (!keywords || loading) {
            return;
        }
        btnSearch.style.cursor = 'not-allowed';
        btnSearch.disabled = true;
        loading = true;
        btnSearch.innerHTML = spinIcon;

        vscode.postMessage({
            type: "searchCode",
            value: keywords,
        });
    };

}());;