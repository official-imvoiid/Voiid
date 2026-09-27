/* api.js - talking to server.js. Every reply is JSON; a failed one is thrown
   as an Error carrying the server's message and `.status` (401 = logged out). */

export async function asJson(res, fallback = `Request failed (${res.status}).`) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || fallback), { status: res.status });
  return data;
}

export const getJson = (url, fallback) => fetch(url).then((r) => asJson(r, fallback));

export const postJson = (url, body, fallback) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) })
    .then((r) => asJson(r, fallback));

/* send one file (or blob) as the request body, reporting progress (0-1) as it
   goes; resolves to the JSON reply */
export const uploadWithProgress = (url, file, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    xhr.onload = () => {
      let body = {};
      try { body = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(Object.assign(new Error(body.error || `Upload failed (${xhr.status}).`), { status: xhr.status }));
    };
    xhr.onerror = () => reject(new Error("Upload failed - is the server running?"));
    xhr.send(file);
  });
