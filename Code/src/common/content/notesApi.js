/* notesApi.js - talking to the notes library on server.js.
   The library is a plain folder tree (data/notes); paths here are relative
   to it, with "/" between folders, e.g. "Machine Learning/Module 1". */

import { asJson, postJson, uploadWithProgress } from "./api";

/* one folder: { path, folders: [{ name, items }], files: [{ name, size, modified, view }] }
   view is "image" | "pdf" | "video" | null (download only) */
export const fetchFolder = (path = "") =>
  fetch(`/api/notes?path=${encodeURIComponent(path)}`).then(asJson);

/* names matching q anywhere in the library */
export const searchNotes = (q) =>
  fetch(`/api/notes/search?q=${encodeURIComponent(q)}`).then(asJson).then((b) => b.results);

/* the address of a file - shown in the page, or saved with download=true */
export const fileUrl = (path, download = false) =>
  `/files/notes/${path.split("/").map(encodeURIComponent).join("/")}${download ? "?download=1" : ""}`;

export const joinPath = (...parts) => parts.filter(Boolean).join("/");

export const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u++; }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[u]}`;
};

/* ---- admin ---- */
export const makeFolder = (path, name) => postJson("/api/admin/notes/folder", { path, name });
export const renameItem = (path, name) => postJson("/api/admin/notes/rename", { path, name });
export const deleteItem = (path) =>
  fetch(`/api/admin/notes?path=${encodeURIComponent(path)}`, { method: "DELETE" }).then(asJson);

/* upload one file into `folder`, reporting progress (0-1) as it goes */
export const uploadFile = (folder, file, onProgress) =>
  uploadWithProgress(`/api/admin/notes/upload?path=${encodeURIComponent(folder)}&name=${encodeURIComponent(file.name)}`, file, onProgress);
