class Db {
    constructor() {
        this._data = {
            extensionTabId: null,
            aid: null,
            csrf: null,
            status: false,
            error: false,
            title: null,
        }

        this.set(this._data);
    }

    set(item, callback) {
        Object.assign(this._data, item);
        chrome.storage.local.set(this._data, () => {
            if (callback) {
                callback();
            }
        });
    }

    get(key, callback) {
        if (key === null) {
            key = Object.keys(this._data);
        }
        chrome.storage.local.get(key, result => {
            if (callback) {
                callback(result);
            }
        });
    }
}

export default new Db();
