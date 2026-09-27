import { useSearchParams } from "react-router-dom";
import PageShell from "../components/PageShell";
import NotesBrowser from "./notes/NotesBrowser";

/**
 * My Study Notes - the notes library, browsed like folders on a computer.
 *
 * The files live in data/notes on the server (folders inside folders,
 * exactly as on disk). Add or change them at /admin -> Notes, or just copy
 * files into that folder - the page reads it live.
 *
 * The open folder is kept in the address (?path=...), so the back button
 * works and a folder can be shared as a link.
 */
const Notes = () => {
  const [params, setParams] = useSearchParams();
  const path = params.get("path") || "";
  const onPath = (next) => setParams(next ? { path: next } : {});

  return (
    <PageShell
      className="notes-page"
      title="My Study Notes"
      accent="#7CF2D0"
      intro="Everything from the B.Tech course, subject by subject - notes, mind maps, lecture videos and lab files. Open a folder, view it right here, or download what you need."
      footer="Notes are written to be re-read, not just submitted."
    >
      <NotesBrowser path={path} onPath={onPath} />
    </PageShell>
  );
};

export default Notes;
