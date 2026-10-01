const sessions = new Map();
let activeLibrary = null;
let activeUrl = mediaStorage.getItem("goar_wisp_url") || "";

function closeSessions() {
  for (const session of sessions.values()) {
    try {
      if (session && typeof session.close === "function") session.close();
    } catch {}
  }
  sessions.clear();
}

export const mediaRelay = Object.freeze({
  getUrl() {
    return activeUrl;
  },
  configure(library, url) {
    if (!library || typeof library.set_websocket !== "function") {
      throw new Error("The shared relay requires a ready libcurl transport.");
    }
    const nextUrl = String(url || "").trim();
    if (!nextUrl) throw new Error("A shared relay URL is required.");
    if (activeLibrary !== library || activeUrl !== nextUrl) {
      closeSessions();
      if (typeof library.transport === "string" || "transport" in library) library.transport = "wisp";
      library.set_websocket(nextUrl);
      activeLibrary = library;
      activeUrl = nextUrl;
      try {
        mediaStorage.setItem("goar_wisp_url", nextUrl);
      } catch {}
      window.dispatchEvent(new CustomEvent("goar:relay-change", { detail: { url: nextUrl } }));
    }
    return activeUrl;
  },
  getSession(owner, library = activeLibrary) {
    if (!owner || !library || library !== activeLibrary || !activeUrl) return null;
    if (sessions.has(owner)) return sessions.get(owner);
    if (typeof library.HTTPSession !== "function") return null;
    const session = new library.HTTPSession({ enable_cookies: true });
    if (session.set_connections) session.set_connections(30, 20, 6);
    sessions.set(owner, session);
    return session;
  },
  resetSession(owner) {
    const session = sessions.get(owner);
    if (session && typeof session.close === "function") {
      try {
        session.close();
      } finally {
        sessions.delete(owner);
      }
    } else {
      sessions.delete(owner);
    }
  },
});
