/* The page that runs a visitor's code for the JavaScript game, inside a
   sandboxed <iframe> (see Game.jsx). It waits for { code, fn, tests }, runs
   the code with console.log captured, then the tests, and posts back what
   happened. Kept in its own file so vite.config.js can hash it for the
   Content-Security-Policy. */
window.addEventListener("message", (e) => {
  const { code, fn, tests } = e.data || {};
  const logs = [];
  const show = (a) => { try { return typeof a === "object" ? JSON.stringify(a) : String(a); } catch { return String(a); } };
  console.log = (...args) => logs.push(args.map(show).join(" "));
  try { new Function(code); } catch (err) { parent.postMessage({ syntaxError: String(err.message) }, "*"); return; }
  try {
    new Function(code)();
  } catch (err) { parent.postMessage({ logs, runtimeError: String(err && err.message || err) }, "*"); return; }
  try {
    const target = new Function(code + "\nreturn typeof " + fn + " === 'function' ? " + fn + " : null;")();
    const results = target ? tests.map((src) => Boolean(new Function("return (" + src + ")")()(target))) : null;
    parent.postMessage({ logs, results }, "*");
  } catch (err) { parent.postMessage({ logs, testError: String(err && err.message || err) }, "*"); }
});
