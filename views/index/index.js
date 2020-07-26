import db from '../../utils/Db.js'

(function () {
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
                    content: new showdown.Converter().makeHtml(document.getElementById('content').value),
                }
            }).then(response => {
                response.data.code === 0 ? alert('成功') : alert('失败');
            });
        });
    });
})();