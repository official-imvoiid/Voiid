import { useState, useEffect, useRef, useCallback } from "react";
import PageShell from "../components/PageShell";
import sandboxRunner from "./gameSandbox.js?raw";

/* Looks: common/styles/pages/game.css
   Sizes: platforms/<device>/game.css

   The visitor's code never runs in this page. It runs inside a sandboxed
   <iframe> (allow-scripts only, so it has its own opaque origin): no cookies,
   no access to this page or to /api/admin, and an endless loop only hangs
   the iframe, which is thrown away after RUN_MS. The tests run in there too,
   and the results come back over postMessage. */

const RUN_MS = 2000;

// the levels: what to build, the model answer, and the tests (each test is
// sent into the sandbox as source text, so it must only use its argument)
const levelData = {
  1: {
    title: "Guess the Number Game",
    description: "Create a function that generates a random number between 1 and 10 and lets the user guess it.",
    solution: `function guessTheNumber() {
  const secretNumber = Math.floor(Math.random() * 10) + 1;
  let attempts = 0;
  
  console.log("I'm thinking of a number between 1 and 10.");
  
  // Simulate some guesses
  tryGuess(5);
  tryGuess(8);
  tryGuess(3);
  
  function tryGuess(guess) {
    attempts++;
    console.log(\`Guess #\${attempts}: \${guess}\`);
    
    if (isNaN(guess)) {
      console.log("❌ Please enter a valid number.");
      return;
    }
    
    if (guess === secretNumber) {
      console.log(\`🎉 Correct! You guessed it in \${attempts} tries!\`);
    } else if (guess < secretNumber) {
      console.log("⬆️ Too low! Try again.");
    } else {
      console.log("⬇️ Too high! Try again.");
    }
  }
  
  console.log(\`The secret number was: \${secretNumber}\`);
  return { secretNumber, attempts };
}

guessTheNumber();`,
    challenge: "Write a JavaScript function called guessTheNumber that creates a number guessing game. The function should generate a random number between 1 and 10 and simulate a few guesses, providing feedback for each guess.",
    testCases: [
      {
        test: (func) => {
          if (typeof func !== "function") return false;
          const result = func();
          return typeof result === "object" && 
                 typeof result.secretNumber === "number" && 
                 typeof result.attempts === "number" &&
                 result.secretNumber >= 1 && 
                 result.secretNumber <= 10;
        },
        description: "Function generates a random number between 1-10 and tracks attempts"
      }
    ]
  },
  2: {
    title: "Simple Calculator",
    description: "Create a calculator that can add, subtract, multiply, divide, and find remainders.",
    solution: `function calculator(num1, num2, operation) {
  if (isNaN(num1) || isNaN(num2)) {
    console.log("Error: Please provide valid numbers");
    return null;
  }
  
  let result;
  
  switch(operation) {
    case "add":
      result = num1 + num2;
      console.log(\`\${num1} + \${num2} = \${result}\`);
      break;
    case "subtract":
      result = num1 - num2;
      console.log(\`\${num1} - \${num2} = \${result}\`);
      break;
    case "multiply":
      result = num1 * num2;
      console.log(\`\${num1} × \${num2} = \${result}\`);
      break;
    case "divide":
      if (num2 === 0) {
        console.log("Error: Cannot divide by zero");
        return null;
      }
      result = num1 / num2;
      console.log(\`\${num1} ÷ \${num2} = \${result}\`);
      break;
    case "remainder":
      if (num2 === 0) {
        console.log("Error: Cannot divide by zero");
        return null;
      }
      result = num1 % num2;
      console.log(\`\${num1} % \${num2} = \${result}\`);
      break;
    default:
      console.log("Error: Invalid operation");
      return null;
  }
  
  return result;
}

// Test cases
calculator(10, 5, "add");
calculator(10, 5, "subtract");
calculator(10, 5, "multiply");
calculator(10, 5, "divide");
calculator(10, 3, "remainder");`,
    challenge: "Create a calculator function that takes two numbers and an operation string ('add', 'subtract', 'multiply', 'divide', or 'remainder') and performs the calculation. Include error handling for invalid inputs and division by zero.",
    testCases: [
      {
        test: (func) => {
          if (typeof func !== "function") return false;
          return func(10, 5, "add") === 15;
        },
        description: "Addition works: 10 + 5 = 15"
      },
      {
        test: (func) => {
          if (typeof func !== "function") return false;
          return func(10, 5, "subtract") === 5;
        },
        description: "Subtraction works: 10 - 5 = 5"
      },
      {
        test: (func) => {
          if (typeof func !== "function") return false;
          return func(10, 0, "divide") === null;
        },
        description: "Division by zero handled correctly"
      }
    ]
  },
  3: {
    title: "Password Strength Checker",
    description: "Build a function that evaluates password strength based on multiple criteria.",
    solution: `function checkPasswordStrength(password) {
  if (typeof password !== 'string') {
    console.log("Error: Password must be a string");
    return 0;
  }
  
  let score = 0;
  const feedback = [];
  
  // Check length
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push("at least 8 characters");
  }
  
  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("add uppercase letters");
  }
  
  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("add lowercase letters");
  }
  
  // Check for numbers
  if (/\\d/.test(password)) {
    score++;
  } else {
    feedback.push("add numbers");
  }
  
  // Check for special characters
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push("add special characters");
  }
  
  // Check for common passwords
  const commonPasswords = ["password", "123456", "qwerty", "admin", "welcome", "login"];
  for (const word of commonPasswords) {
    if (password.toLowerCase().includes(word)) {
      score = Math.max(0, score - 1);
      feedback.push(\`avoid common word: \${word}\`);
      break;
    }
  }
  
  // Output result
  console.log(\`Password: \${password.replace(/./g, '*')}\`);
  
  if (score === 0) {
    console.log(\`Very Weak: \${feedback.join(", ")}\`);
  } else if (score <= 2) {
    console.log(\`Weak: \${feedback.join(", ")}\`);
  } else if (score <= 4) {
    console.log(\`Moderate: \${feedback.join(", ")}\`);
  } else {
    console.log("Strong Password!");
  }
  
  return score;
}

// Test cases
checkPasswordStrength("password");
checkPasswordStrength("Password1");
checkPasswordStrength("StrongP@ssword123");`,
    challenge: "Create a function that checks password strength based on these criteria: length (8+ chars), uppercase letters, lowercase letters, numbers, special characters, and absence of common password words. The function should return a score and provide feedback.",
    testCases: [
      {
        test: (func) => {
          if (typeof func !== "function") return false;
          return func("abc") <= 2;
        },
        description: "Correctly identifies weak passwords"
      },
      {
        test: (func) => {
          if (typeof func !== "function") return false;
          return func("StrongP@ssword123") === 5;
        },
        description: "Correctly identifies strong passwords"
      },
      {
        test: (func) => {
          if (typeof func !== "function") return false;
          return func("password") <= 2;
        },
        description: "Penalizes common passwords"
      }
    ]
  }
};
const FUNCTION_NAMES = { 1: "guessTheNumber", 2: "calculator", 3: "checkPasswordStrength" };
const levelCount = Object.keys(levelData).length;

// the page inside the sandbox - its own file, hashed into the CSP by vite.config.js
const SANDBOX_HTML = `<!doctype html><script>${sandboxRunner}</script>`;

/* run `code` in a fresh sandbox; resolves to the sandbox's message, or
   { timeout: true } if it hasn't answered within RUN_MS */
function runInSandbox(code, level) {
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.style.display = "none";
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      frame.remove();
      resolve(result);
    };
    const onMessage = (e) => { if (e.source === frame.contentWindow) finish(e.data || {}); };
    const timer = setTimeout(() => finish({ timeout: true }), RUN_MS);
    window.addEventListener("message", onMessage);
    frame.onload = () => frame.contentWindow.postMessage({
      code,
      fn: FUNCTION_NAMES[level],
      tests: levelData[level].testCases.map((t) => t.test.toString()),
    }, "*");
    frame.srcdoc = SANDBOX_HTML;
    document.body.appendChild(frame);
  });
}

const CompletionPopup = ({ onReset }) => (
  <div className="game-done">
    <div className="game-done-box">
      <div className="game-done-glow" />

      <h2 className="game-done-title">✨ Magic Unlocked! ✨</h2>

      <div className="game-done-text">
        <p>Bravo, coding wizard! 🧙‍♂️</p>
        <p>Conquered all 3 JavaScript realms!</p>
      </div>

      <button onClick={onReset} className="game-done-btn">
        <span className="game-done-btn-inner">
          <span>
            <span className="game-done-btn-label">&lt;&lt; Dance Again 💃</span>
          </span>
        </span>
      </button>
    </div>
  </div>
);

const JavaScriptCodingGame = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [codeValue, setCodeValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [output, setOutput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testsPassed, setTestsPassed] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  useEffect(() => {
    setCodeValue("");
    setErrorMessage("");
    setOutput("");
    setShowAnswer(false);
    setTestsPassed(false);
  }, [currentLevel]);

  const resetGame = () => {
    setCurrentLevel(1);
    setUnlockedLevels(1);
    setCodeValue("");
    setErrorMessage("");
    setOutput("");
    setShowAnswer(false);
    setTestsPassed(false);
    setShowCompletionPopup(false);
  };

  const levelButtonClass = (levelNumber) =>
    levelNumber > unlockedLevels ? "game-level is-locked"
      : levelNumber === currentLevel ? "game-level is-current"
      : "game-level";

  const runCode = useCallback(async () => {
    setErrorMessage("");
    setOutput("");
    setTestsPassed(false);
    if (!codeValue.trim()) {
      setErrorMessage("Please write some code before running.");
      return;
    }
    setIsRunning(true);
    const r = await runInSandbox(codeValue, currentLevel);
    if (!alive.current) return;
    setIsRunning(false);

    if (r.timeout) return setErrorMessage("Your code took too long to run - is there an endless loop?");
    if (r.syntaxError) return setErrorMessage("Invalid JavaScript syntax. Please check your code.");
    if (r.runtimeError) return setErrorMessage(`Runtime Error: ${r.runtimeError}`);

    const logs = Array.isArray(r.logs) ? r.logs.map(String) : [];
    const tests = levelData[currentLevel].testCases;
    let summary;
    if (r.testError) {
      summary = `Error running tests: ${r.testError}`;
    } else if (!r.results) {
      summary = `Passed 0/${tests.length} tests\n❌ Function not found or defined correctly`;
    } else {
      const lines = tests.map((t, i) => `${r.results[i] ? "✅" : "❌"} Test ${i + 1}: ${t.description}`);
      const passed = r.results.filter(Boolean).length;
      const allPassed = passed === tests.length;
      setTestsPassed(allPassed);
      if (allPassed && currentLevel === unlockedLevels && currentLevel < levelCount) {
        setUnlockedLevels((prev) => Math.max(prev, currentLevel + 1));
      }
      if (allPassed && currentLevel === levelCount) {
        setTimeout(() => alive.current && setShowCompletionPopup(true), 500);
      }
      summary = `Passed ${passed}/${tests.length} tests\n${lines.join("\n")}`;
    }
    setOutput([...logs, "\n=== Test Results ===", summary].join("\n"));
  }, [codeValue, currentLevel, unlockedLevels]);

  const level = levelData[currentLevel];

  return (
    <PageShell
      title="Code Clash JavaScript ☕︎"
      accent="#F39C12"
      intro={`Three JavaScript challenges, each one unlocked by passing the tests of the one before. You are on level ${currentLevel} of ${levelCount}: ${level.title}.`}
    >
      <div className="game-levels">
        {Object.keys(levelData).map((levelNum) => {
          const levelNumber = parseInt(levelNum);
          return (
            <button
              key={levelNum}
              onClick={() => levelNumber <= unlockedLevels && setCurrentLevel(levelNumber)}
              className={levelButtonClass(levelNumber)}
              disabled={levelNumber > unlockedLevels}
            >
              <span className="game-level-label">
                {levelNumber > unlockedLevels ? `🔒 Level ${levelNum}` : `Level ${levelNum}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="game-layout">
        {/* left: what to build (+ the answer, when asked for) */}
        <div className="game-col">
          <div className="game-box">
            <h2 className="game-box-title is-accent">Challenge</h2>
            <p className="game-challenge">{level.challenge}</p>
            <h3 className="game-sub-title">Tests</h3>
            <ul className="game-tests">
              {level.testCases.map((t) => <li key={t.description}>{t.description}</li>)}
            </ul>
          </div>

          {showAnswer && (
            <div className="game-box">
              <h3 className="game-box-title">Solution</h3>
              <pre className="game-pre">{level.solution}</pre>
              <button
                onClick={() => {
                  setCodeValue(level.solution);
                  setShowAnswer(false);
                }}
                className="game-btn is-apply"
              >
                Apply Solution
              </button>
            </div>
          )}
        </div>

        {/* right: write it, run it, see what it printed */}
        <div className="game-col">
          <div className="game-box">
            <h2 className="game-box-title">Code Editor</h2>
            <textarea
              className="game-code"
              value={codeValue}
              onChange={(e) => setCodeValue(e.target.value)}
              placeholder="Write your JavaScript code here..."
              spellCheck={false}
            />

            {errorMessage && <div className="game-error">{errorMessage}</div>}

            <div className="game-actions">
              <button onClick={runCode} disabled={isRunning} className="game-btn is-run">
                {isRunning ? "Running..." : "Run Code"}
              </button>

              <div className="game-actions-right">
                <button onClick={() => setShowAnswer(!showAnswer)} className="game-btn is-answer">
                  {showAnswer ? "Hide Answer" : "View Answer"}
                </button>

                {testsPassed && currentLevel < unlockedLevels && (
                  <button onClick={() => setCurrentLevel(currentLevel + 1)} className="game-btn is-next">
                    Next Level
                  </button>
                )}
              </div>
            </div>
          </div>

          {output && (
            <div className="game-box">
              <h3 className="game-box-title">Output</h3>
              <pre className="game-output-pre">{output}</pre>
            </div>
          )}
        </div>
      </div>

      {showCompletionPopup && <CompletionPopup onReset={resetGame} />}
    </PageShell>
  );
};

export default JavaScriptCodingGame;
