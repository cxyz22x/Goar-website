const PREFIX = "goar_media:";
export const mediaStorage = Object.freeze({
  getItem(key) {
    return window.localStorage.getItem(PREFIX + key);
  },
  setItem(key, value) {
    window.localStorage.setItem(PREFIX + key, String(value));
  },
  removeItem(key) {
    window.localStorage.removeItem(PREFIX + key);
  },
});
globalThis.mediaStorage = mediaStorage;
