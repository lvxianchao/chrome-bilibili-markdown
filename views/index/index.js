import db from '../../utils/Db.js'

(function () {
    // 获取 CSRF 等数据
    const timer = setInterval(() => {
        db.get(null, data => {
            if (data.error) {
                clearInterval(timer);
            }

            if (data.status) {
                clearInterval(timer);

                document.getElementById('icon-status-success').style.display = '';
                document.getElementById('icon-status-error').style.display = 'none';
                document.getElementById('title').value = data.title;
            }
        });
    }, 500);


    // 点击发布：从 URL 获取图片上传到 B 站获取站内链接并替换，提交数据。
    document.getElementById('btn-publish').addEventListener('click', () => {
        db.get(null, data => {
            let markdown = document.getElementById('content').value;
            let loading = layer.load(1, {scrollbar: false, time: 5000, shade: 0.7});
            BilibiliMarkdown(data.csrf, markdown).then(content => {
                axios({
                    method: 'post',
                    url: 'https://api.bilibili.com/x/article/creative/draft/addupdate',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    transformRequest: [
                        obj => {
                            let str = ''
                            for (let [key, value] of Object.entries(obj)) {
                                str += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&'
                            }

                            return str.slice(0, -1);
                        }
                    ],
                    data: {
                        aid: data.aid,
                        csrf: data.csrf,
                        title: document.getElementById('title').value,
                        content: content,
                    }
                }).then(response => {
                    response.data.code === 0
                        ? layer.alert('成功', {icon: 1, title: 'Bilibili Markdown'})
                        : layer.alert('失败', {icon: 2, title: 'Bilibili Markdown'});
                    layer.close(loading);
                });
            });
        });
    });


    async function BilibiliMarkdown(csrf, markdown) {
        let html = new showdown.Converter().makeHtml(markdown);
        let result = [...html.matchAll(/<img src="(.*)" alt="(.*)" \/>/g)];
        let urls = [];

        result.forEach(value => {
            let image = new Image();
            image.src = value[1] + '?v=' + Math.random(); // 处理缓存
            image.crossOrigin = "*";  // 支持跨域图片
            image.onload = () => {
                let form = new FormData();
                form.append('csrf', csrf);
                form.append('binary', dataURLtoBlob(getBase64Image(image)));

                axios({
                    method: 'post',
                    url: 'https://api.bilibili.com/x/article/creative/article/upcover',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    data: form,
                }).then(res => {
                    urls.push([value[1], value[2], res.data.data.url]);
                });
            }
        });

        while (urls.length < result.length) {
            await sleep(1000);
        }

        urls.forEach(value => {
            html = html.replace(`<img src="${value[0]}" alt="${value[1]}" \/>`, `<img src="${value[2]}" alt="${value[1]}" \/>`);
        });

        return html;
    }


    function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }


    function getBase64Image(img) {
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        let ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();
        return canvas.toDataURL("image/" + ext);
    }


    function dataURLtoBlob(dataUrl) {
        let arr = dataUrl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            str = atob(arr[1]),
            n = str.length,
            u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = str.charCodeAt(n);
        }

        return new Blob([u8arr], {type: mime});
    }
})();
