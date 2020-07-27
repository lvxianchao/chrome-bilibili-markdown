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
                document.getElementById('aid').value = data.aid;
                document.getElementById('csrf').value = data.csrf;
            }
        });
    }, 500);


    // 发布
    document.getElementById('btn-publish').addEventListener('click', () => {

        db.get(null, data => {
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
                    content: BilibiliMarkdown(data.csrf, document.getElementById('content').value),
                }
            }).then(response => {
                response.data.code === 0 ? alert('成功') : alert('失败');
            });
        });
    });

    function BilibiliMarkdown(csrf, markdown) {
        const html = new showdown.Converter().makeHtml(markdown);

        const content = html.replace(/<img src="(.*)" alt="(.*)" \/>/g, function (match, src, alt) {
            let image = new Image();
            image.src = src + '?v=' + Math.random(); // 处理缓存
            image.crossOrigin = "*";  // 支持跨域图片
            image.onload = () => {
                let file = dataURLtoBlob(getBase64Image(image));
                console.log(file);

                let form = new FormData();
                form.append('csrf', csrf);
                form.append('binary', file);

                axios({
                    method: 'post',
                    url: 'https://api.bilibili.com/x/article/creative/article/upcover',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    data: form,
                }).then(res => {
                    console.log('----上传图片结果----');
                    // {"code":0,"message":"0","ttl":1,"data":{"size":4815447,"url":"http://i0.hdslb.com/bfs/article/cd048a462fccf0349abfc9020d4241247042f312.png"}}
                    console.log(res);
                });
            }
        });
    }

    /**
     * 图像转Base64
     */
    function getBase64Image(img) {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();
        var dataURL = canvas.toDataURL("image/" + ext);
        return dataURL;
    }

    function dataURLtoBlob(dataurl) {
        var arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {
            type: mime
        });
    }
})();
