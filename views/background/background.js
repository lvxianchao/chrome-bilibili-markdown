import db from '../../utils/Db.js'

chrome.browserAction.onClicked.addListener(() => {
    db.get(['extensionTabId'], data => {
        if (data.extensionTabId) {
            // 如果插件的服务页面已经转到别的链接去了，重新创建一个
            chrome.tabs.get(data.extensionTabId, tab => {
                if (tab.url === chrome.extension.getURL('views/index/index.html')) {
                    chrome.tabs.update(data.extensionTabId, {selected: true});
                } else {
                    chrome.tabs.create({url: chrome.extension.getURL('views/index/index.html')}, tab => {
                        db.set({extensionTabId: tab.id});
                    });
                }
            });
        } else {
            chrome.tabs.create({url: chrome.extension.getURL('views/index/index.html')}, tab => {
                db.set({extensionTabId: tab.id});
            });
        }
    });

    chrome.webRequest.onBeforeRequest.addListener(details => {
        // B 站的逻辑是：标题更改以后触发一次请求，获取 aid 参数，然后再发起一次请求保存内容。
        // 所以这里忽略第一次请求，因为拿不到 aid 参数。
        const form = details.requestBody.formData;
        if (form.aid) {
            db.set({
                aid: form.aid[0],
                csrf: form.csrf[0],
                title: form.title[0],
                status: true,
            });
        }
    }, {
        urls: ['https://api.bilibili.com/x/article/creative/draft/addupdate'],
        types: ['xmlhttprequest'],
    }, ['requestBody']);
});

chrome.tabs.onRemoved.addListener(tabId => {
    db.get(['extensionTabId'], result => {
        if (tabId === result.extensionTabId) {
            db.set({extensionTabId: null});
        }
    });
});
