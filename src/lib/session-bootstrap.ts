// Implements "Remember me" on top of the auto-generated Supabase client,
// which always persists the session in localStorage.
//
// - Remembered sessions: token stays in localStorage → survives refresh,
//   new tabs, and browser restarts.
// - Non-remembered sessions: on tab/window close we move the token out of
//   localStorage into sessionStorage. sessionStorage survives a refresh but
//   is cleared when the browser/tab is closed, so the user is signed out on
//   return visits — but stays signed in across refreshes.
//
// This module MUST be imported before the Supabase client is created, so it
// runs first in main.tsx.

const REMEMBER_KEY = "sb-remember";
const TOKEN_RE = /^sb-.*-auth-token$/;

const forEachKey = (store: Storage, fn: (key: string) => void) => {
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k && TOKEN_RE.test(k)) keys.push(k);
  }
  keys.forEach(fn);
};

if (typeof window !== "undefined") {
  // On load: restore a non-remembered session that was parked in sessionStorage
  // (e.g. after a refresh) back into localStorage so the client can read it.
  try {
    forEachKey(window.sessionStorage, (k) => {
      const val = window.sessionStorage.getItem(k);
      if (val) window.localStorage.setItem(k, val);
    });
  } catch {
    /* storage unavailable */
  }

  // Before unload: if the current session is not "remembered", stash the token
  // in sessionStorage and remove it from localStorage.
  const parkSession = () => {
    try {
      if (window.localStorage.getItem(REMEMBER_KEY) === "false") {
        forEachKey(window.localStorage, (k) => {
          const val = window.localStorage.getItem(k);
          if (val) window.sessionStorage.setItem(k, val);
          window.localStorage.removeItem(k);
        });
      }
    } catch {
      /* storage unavailable */
    }
  };

  window.addEventListener("pagehide", parkSession);
  window.addEventListener("beforeunload", parkSession);
}

/** Call after a successful sign-in to record the user's choice. */
export const setRememberSession = (remember: boolean) => {
  try {
    window.localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
  } catch {
    /* storage unavailable */
  }
};
