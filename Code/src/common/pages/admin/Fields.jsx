import { useRef, useState } from "react";
import { asJson, uploadWithProgress } from "../../content/api";

/* The input controls the admin knows how to draw. schema.js picks one per
   field with `type`:
     text | url | textarea | number | select | color | colorAuto
     image | pdf | certificate | model | modelThumb */

/* Upload a file to server.js; resolves to its URL. */
const upload = (file, endpoint = "/api/admin/upload") =>
  fetch(endpoint, { method: "POST", body: file }).then((r) => asJson(r, "Upload failed.")).then((d) => d.url);

const IMAGE_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
const PDF_ACCEPT = "application/pdf,.pdf";
const isPdfFile = (file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name);

/* One upload control for images, PDFs and certificates: a preview, an Upload
   / Replace button, Open for a file that can't be previewed, Remove, and a
   text box for a path or URL. `endpoint` is the server route, or a function
   of the file (a certificate sends PDFs one way and images the other). */
const FileField = ({ id, value, onChange, accept, endpoint, kind, labels, placeholder }) => {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isPdf = kind === "pdf" || (kind === "auto" && /\.pdf$/i.test(value || ""));

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await upload(file, typeof endpoint === "function" ? endpoint(file) : endpoint));
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="adm-image">
      <div className={`adm-image-preview${isPdf ? " adm-pdf-preview" : ""}`}>
        {!value ? <span>{labels.empty}</span> : isPdf ? <span className="adm-pdf-badge">PDF</span> : <img src={value} alt="" />}
      </div>
      <div className="adm-image-side">
        <div className="adm-image-row">
          <button type="button" className="adm-btn" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? "Uploading…" : value ? labels.replace : labels.upload}
          </button>
          {value ? (
            <>
              {labels.open ? <a className="adm-btn is-ghost" href={value} target="_blank" rel="noreferrer">Open</a> : null}
              <button type="button" className="adm-btn is-ghost" onClick={() => onChange("")}>Remove</button>
            </>
          ) : null}
        </div>
        <input
          id={id}
          className="adm-input"
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {error ? <span className="adm-gate-err">{error}</span> : null}
      </div>
      <input ref={fileRef} type="file" accept={accept} onChange={pick} hidden />
    </div>
  );
};

const ImageField = (props) => (
  <FileField
    {...props}
    kind="image"
    accept={IMAGE_ACCEPT}
    endpoint="/api/admin/upload"
    labels={{ empty: "No image", upload: "Upload image", replace: "Upload image" }}
    placeholder="…or a path / URL, e.g. /images/minecraft.jpg"
  />
);

/* the CV: one PDF, checked by its first bytes on the server */
const PdfField = (props) => (
  <FileField
    {...props}
    kind="pdf"
    accept={PDF_ACCEPT}
    endpoint="/api/admin/upload-cv"
    labels={{ empty: "No file", upload: "Upload PDF", replace: "Replace PDF", open: true }}
    placeholder="…or a path / URL to a PDF"
  />
);

/* a certificate: an image or a PDF, each to the upload that checks its kind */
const CertificateField = (props) => (
  <FileField
    {...props}
    kind="auto"
    accept={`${IMAGE_ACCEPT},${PDF_ACCEPT}`}
    endpoint={(file) => (isPdfFile(file) ? "/api/admin/upload-cv" : "/api/admin/upload")}
    labels={{ empty: "No file", upload: "Upload image or PDF", replace: "Replace", open: true }}
    placeholder="…or a path / URL, e.g. /certificates/2025-networking.png"
  />
);

/* A 3D model: streamed to the server with a progress bar. Fills in the
   format, and the name if it's still empty. */
const MODEL_ACCEPT = ".vrm,.glb,.gltf,.fbx,.obj,.stl,.ply,.dae";
const ModelField = ({ id, value, onChange, item, patch }) => {
  const fileRef = useRef(null);
  const [progress, setProgress] = useState(-1);
  const [error, setError] = useState("");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setProgress(0);
    try {
      const body = await uploadWithProgress(`/api/admin/models/upload?name=${encodeURIComponent(file.name)}`, file, setProgress);
      onChange(body.url);
      patch?.("format", body.format);
      if (!item?.name) patch?.("name", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    } catch (err) {
      setError(err.message);
    }
    setProgress(-1);
  };

  return (
    <div className="adm-image">
      <div className="adm-image-preview adm-pdf-preview">
        {value ? <span className="adm-pdf-badge">{(item?.format || value.split(".").pop()).toUpperCase()}</span> : <span>No model</span>}
      </div>
      <div className="adm-image-side">
        <div className="adm-image-row">
          <button type="button" className="adm-btn" disabled={progress >= 0} onClick={() => fileRef.current?.click()}>
            {progress >= 0 ? `Uploading… ${Math.round(progress * 100)}%` : value ? "Replace model" : "Upload model"}
          </button>
          {value ? <button type="button" className="adm-btn is-ghost" onClick={() => onChange("")}>Remove</button> : null}
        </div>
        <input id={id} className="adm-input" type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          placeholder="…or a path to a model" />
        {error ? <span className="adm-gate-err">{error}</span> : null}
      </div>
      <input ref={fileRef} type="file" accept={MODEL_ACCEPT} onChange={pick} hidden />
    </div>
  );
};

/* A model's card picture: upload one, or render one from the model itself */
const ModelThumbField = ({ id, value, onChange, item }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const make = async () => {
    setBusy(true);
    setError("");
    try {
      const { snapshot } = await import("../models/engine");      // three.js only loads when needed
      const blob = await snapshot(item.file, item.format || undefined);
      onChange(await upload(blob));
    } catch (err) {
      setError(err.message || "Couldn't make a picture from this model.");
    }
    setBusy(false);
  };
  return (
    <div className="adm-model-thumb">
      <ImageField id={id} value={value} onChange={onChange} />
      <button type="button" className="adm-btn is-ghost" disabled={busy || !item?.file} onClick={make}>
        {busy ? "Rendering…" : "Make from model"}
      </button>
      {error ? <span className="adm-gate-err">{error}</span> : null}
    </div>
  );
};

const ColorInput = ({ id, value, onChange, disabled }) => (
  <div className="adm-color">
    <input
      type="color"
      className="adm-swatch"
      value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#F39C12"}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label="Pick a colour"
    />
    <input
      id={id}
      className="adm-input"
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  </div>
);

export const Field = ({ field, value, onChange, content, item, patch }) => {
  const id = `f-${field.name}`;
  const common = {
    id,
    className: "adm-input",
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
  };

  let control;
  switch (field.type) {
    case "textarea":
      control = <textarea {...common} className="adm-input adm-textarea" rows={field.rows || 3} />;
      break;
    case "select": {
      const options = typeof field.options === "function" ? field.options(content) : field.options;
      control = (
        <select {...common} className="adm-input adm-select">
          {!options.some((o) => o.value === value) ? <option value={value ?? ""}>— choose —</option> : null}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
      break;
    }
    case "number":
      control = (
        <input
          {...common}
          type="number"
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );
      break;
    case "color":
      control = <ColorInput id={id} value={value} onChange={onChange} />;
      break;
    case "colorAuto": {
      const auto = !value || value === "auto";
      control = (
        <div className="adm-color-auto">
          <label className="adm-check">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => onChange(e.target.checked ? "auto" : "#F39C12")}
            />
            {field.autoLabel || "Auto (from the image)"}
          </label>
          <ColorInput id={id} value={auto ? "" : value} onChange={onChange} disabled={auto} />
        </div>
      );
      break;
    }
    case "image":
      control = <ImageField id={id} value={value} onChange={onChange} />;
      break;
    case "pdf":
      control = <PdfField id={id} value={value} onChange={onChange} />;
      break;
    case "certificate":
      control = <CertificateField id={id} value={value} onChange={onChange} />;
      break;
    case "model":
      control = <ModelField id={id} value={value} onChange={onChange} item={item} patch={patch} />;
      break;
    case "modelThumb":
      control = <ModelThumbField id={id} value={value} onChange={onChange} item={item} />;
      break;
    default:
      control = <input {...common} type={field.type === "url" ? "url" : "text"} />;
  }

  return (
    <div className={`adm-field ${field.width === "narrow" ? "is-narrow" : ""} ${field.width === "wide" ? "is-wide" : ""}`}>
      <label className="adm-label" htmlFor={id}>{field.label}</label>
      {control}
      {field.hint ? <span className="adm-hint">{field.hint}</span> : null}
    </div>
  );
};

/* One record inside a list section: a header you click to open, plus
   move / delete buttons. */
export const Row = ({ section, item, index, count, content, onPatch, onMove, onRemove, startOpen }) => {
  const [open, setOpen] = useState(Boolean(startOpen));

  return (
    <li className="adm-row" data-open={open}>
      <div className="adm-row-head">
        <button
          type="button"
          className="adm-row-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className="adm-caret" aria-hidden="true">{open ? "▾" : "▸"}</span>
          {section.swatch?.(item) ? (
            <span className="adm-row-swatch" style={{ background: section.swatch(item) }} aria-hidden="true" />
          ) : null}
          <span className="adm-row-title">{section.title(item)}</span>
        </button>

        <div className="adm-row-tools">
          <button type="button" className="adm-icon" title="Move up"
            disabled={index === 0} onClick={() => onMove(index, -1)}>↑</button>
          <button type="button" className="adm-icon" title="Move down"
            disabled={index === count - 1} onClick={() => onMove(index, 1)}>↓</button>
          <button type="button" className="adm-icon is-danger" title="Delete"
            onClick={() => onRemove(index)}>✕</button>
        </div>
      </div>

      {open ? (
        <div className="adm-grid">
          {section.fields.map((f) => (
            <Field
              key={f.name}
              field={f}
              value={item[f.name]}
              content={content}
              item={item}
              patch={(name, v) => onPatch(index, name, v)}
              onChange={(v) => onPatch(index, f.name, v)}
            />
          ))}
        </div>
      ) : null}
    </li>
  );
};
