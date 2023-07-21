/* eslint-disable @typescript-eslint/naming-convention */
(function () {
    const vscode = acquireVsCodeApi();
    let loading = false;
    const btnSearch = document.getElementById('btnSearch');
    const btnOriginHtml = btnSearch.innerHTML;
    const spinIcon = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1686299243169" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1997" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M832 448H896a64 64 0 0 1 0 128h-64a64 64 0 0 1 0-128z m-146.773333-197.504l45.269333-45.226667a64 64 0 0 1 90.538667 90.496l-45.269334 45.226667a64 64 0 1 1-90.496-90.453333z m0 525.269333a64 64 0 1 1 90.538666-90.496l45.226667 45.226667a64 64 0 0 1-90.453333 90.538667l-45.269334-45.269334zM128 448h64a64 64 0 0 1 0 128H128a64 64 0 0 1 0-128z m384-384A64 64 0 0 1 576 128v64a64 64 0 0 1-128 0V128A64 64 0 0 1 512 64zM512 768a64 64 0 0 1 64 64V896a64 64 0 0 1-128 0v-64A64 64 0 0 1 512 768zM205.226667 205.226667a64 64 0 0 1 90.538666 0l45.226667 45.269333a64 64 0 0 1-90.453333 90.538667L205.226667 295.765333a64 64 0 0 1 0-90.496z m0 615.808a64 64 0 0 1 0-90.538667l45.269333-45.226667a64 64 0 1 1 90.538667 90.496l-45.269334 45.226667a64 64 0 0 1-90.496 0z" fill="#cccccc" opacity=".3" p-id="1998"></path></svg>';

    const mockResult = [{
        source: '1111111111111',
        code: `
            const response = await axios({
                url: proxyUrl + '/v1/chat/completions', 
                method: 'post',  
                data: req,
                headers: {
                    Authorization: 'Bearer sk-',
                    responseType: 'stream'
                }
            });`,
        explain: '这里是解释这里是解释\n这里是解释\这里是解释这里是解释这里是解释这里是解释\n'
    }, {
        source: '22222222222222',
        code: `<div class="container">
                <div class="search-bar">
                  <label for="keywords">Keywords:</label>
                  <input type="text" id="keywords" >
                  <button id="btnSearch"><?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1685929927659" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1445" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M192 480a256 256 0 1 1 512 0 256 256 0 0 1-512 0m631.776 362.496l-143.2-143.168A318.464 318.464 0 0 0 768 480c0-176.736-143.264-320-320-320S128 303.264 128 480s143.264 320 320 320a318.016 318.016 0 0 0 184.16-58.592l146.336 146.368c12.512 12.48 32.768 12.48 45.28 0 12.48-12.512 12.48-32.768 0-45.28" fill="#979797" p-id="1446"></path></svg></button>
                </div>
                <div id="result"></div>
              </div>`,
        explain: '这里是解释'
    }];
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
            const { function_code, function_description } = item;

            const codeRes = hljs.highlight(function_code, { language: 'cpp' }).value;

            return `<div class="item-wrap">
                        <div class="title"><div class="txt">${function_description}</div> <span class="apply" data-index="${index}">应用</span></div>
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
                console.log('text::::', text);

                // 向 VSCode 编辑器发送消息，并插入文本到当前编辑器中
                vscode.postMessage({
                    type: 'applyText',
                    value: text
                });
            }
            return false;
        });

    };



    // handleResponse(mockResult);
    btnSearch.addEventListener('click', () => {
        const inputKeywords = document.getElementById('keywords');
        const keywords = inputKeywords.value;
        console.log('keywords', keywords);
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

    });

}());