/* The page that runs a visitor's code for the JavaScript game, inside a
   sandboxed <iframe> (see Game.jsx). It waits for { code, fn, tests }, runs
   the code with console.log captured, then the tests, and posts back what
   happened. Kept in its own file so vite.config.js can hash it for the
   Content-Security-Policy. */
window.addEventListener("message", (e) => {
  const { code, fn, tests } = e.data || {};
  const logs = [];
  const show = (a) => { try { return typeof a === "object" ? JSON.stringify(a) : String(a); } catch { return String(a); } };
  // a runaway loop of console.log must not hand the page millions of lines
  console.log = (...args) => { if (logs.length < 500) logs.push(args.map(show).join(" ")); };
  try { new Function(code); } catch (err) { parent.postMessage({ syntaxError: String(err.message) }, "*"); return; }
  // the code runs once (it used to run twice, so everything it printed showed twice)
  let target = null;
  try {
    target = new Function(code + "\nreturn typeof " + fn + " === 'function' ? " + fn + " : null;")();
  } catch (err) { parent.postMessage({ logs, runtimeError: String(err && err.message || err) }, "*"); return; }
  const printed = logs.slice();   // what the code itself printed - not what the tests make it print again
  try {
    const results = target ? tests.map((src) => Boolean(new Function("return (" + src + ")")()(target))) : null;
    parent.postMessage({ logs: printed, results }, "*");
  } catch (err) { parent.postMessage({ logs: printed, testError: String(err && err.message || err) }, "*"); }
});
