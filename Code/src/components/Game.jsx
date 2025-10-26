import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';

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

  // Add the missing getLevelButtonStyle function
  const getLevelButtonStyle = (levelNumber) => {
    const baseStyle = {
      padding: '0.75rem 1.5rem',
      margin: '0 0.5rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontWeight: 'bold',
      border: 'none',
      transition: 'all 0.3s ease'
    };

    if (levelNumber > unlockedLevels) {
      // Locked level
      return {
        ...baseStyle,
        backgroundColor: '#374151',
        color: '#9ca3af',
        cursor: 'not-allowed'
      };
    } else if (levelNumber === currentLevel) {
      // Current level
      return {
        ...baseStyle,
        backgroundColor: '#f59e0b',
        color: '#ffffff',
        transform: 'scale(1.05)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      };
    } else {
      // Unlocked but not current level
      return {
        ...baseStyle,
        backgroundColor: '#2563eb',
        color: '#ffffff'
      };
    }
  };

  const isValidJavaScript = (code) => {
    try {
      new Function(code);
      return true;
    } catch (e) {
      return false;
    }
  };

  const extractFunction = (code, expectedFunctionName) => {
    try {
      const func = new Function(`
        ${code}
        return typeof ${expectedFunctionName} === 'function' ? ${expectedFunctionName} : null;
      `);
      return func();
    } catch (_e) {
      return null;
    }
  };

  const runTests = (code) => {
    let passedTests = 0;
    let totalTests = levelData[currentLevel].testCases.length;
    let testResults = [];
    let mainFunction = null;
    
    try {
      if (currentLevel === 1) {
        mainFunction = extractFunction(code, "guessTheNumber");
      } else if (currentLevel === 2) {
        mainFunction = extractFunction(code, "calculator");
      } else if (currentLevel === 3) {
        mainFunction = extractFunction(code, "checkPasswordStrength");
      }
      
      if (!mainFunction) {
        testResults.push("❌ Function not found or defined correctly");
      } else {
        levelData[currentLevel].testCases.forEach((testCase, index) => {
          const passed = testCase.test(mainFunction);
          testResults.push(`${passed ? "✅" : "❌"} Test ${index + 1}: ${testCase.description}`);
          if (passed) passedTests++;
        });
      }
      
      const allPassed = passedTests === totalTests;
      setTestsPassed(allPassed);
      
      if (allPassed && currentLevel === unlockedLevels && currentLevel < Object.keys(levelData).length) {
        setUnlockedLevels(prevLevel => Math.max(prevLevel, currentLevel + 1));
      }
      
      if (allPassed && currentLevel === Object.keys(levelData).length) {
        setTimeout(() => setShowCompletionPopup(true), 500);
      }
      
      return {
        success: allPassed,
        message: `Passed ${passedTests}/${totalTests} tests\n${testResults.join('\n')}`
      };
    } catch (e) {
      return {
        success: false,
        message: `Error running tests: ${e.message}`
      };
    }
  };

  const runCode = () => {
    setErrorMessage("");
    setOutput("");
    setIsRunning(true);
    setTestsPassed(false);
    
    if (!codeValue.trim()) {
      setErrorMessage("Please write some code before running.");
      setIsRunning(false);
      return;
    }

    if (!isValidJavaScript(codeValue)) {
      setErrorMessage("Invalid JavaScript syntax. Please check your code.");
      setIsRunning(false);
      return;
    }

    try {
      const originalConsoleLog = console.log;
      const logs = [];
      
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
      };
      
      try {
        const executeFunction = new Function(codeValue);
        executeFunction();
        
        const testResults = runTests(codeValue);
        logs.push("\n=== Test Results ===");
        logs.push(testResults.message);
        
        setOutput(logs.join('\n'));
      } catch (e) {
        setErrorMessage(`Runtime Error: ${e.message}`);
      }
      
      console.log = originalConsoleLog;
    } catch (e) {
      setErrorMessage(`Syntax Error: ${e.message}`);
    }
    
    setIsRunning(false);
  };

  const CompletionPopup = () => {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        fontFamily: 'Dancing Script, cursive',
        animation: 'fadeIn 0.5s ease-in'
      }}>
        <div style={{
          backgroundColor: '#111827',
          padding: '2.5rem',
          borderRadius: '0.75rem',
          border: '2px solid #f59e0b',
          maxWidth: '32rem',
          textAlign: 'center',
          transform: 'rotate(-2deg)',
          animation: 'sway 3s ease-in-out infinite',
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glow effect pseudo-element */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            right: '-50%',
            bottom: '-50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 60%)',
            pointerEvents: 'none'
          }} />

          <h2 style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: '#f59e0b',
            marginBottom: '1.5rem',
            textShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
          }}>✨ Magic Unlocked! ✨</h2>

          <div style={{
            fontSize: '1.5rem',
            marginBottom: '2rem',
            color: '#f3f4f6',
            lineHeight: '1.6'
          }}>
            <p style={{ marginBottom: '1rem' }}>Bravo, coding wizard! 🧙‍♂️</p>
            <p>Conquered all 3 JavaScript realms!</p>
          </div>

          <button
            onClick={resetGame}
            style={{
              padding: '1rem 2.5rem',
              background: 'transparent',
              color: '#f59e0b',
              fontWeight: '700',
              borderRadius: '999px',
              cursor: 'pointer',
              border: '2px solid #f59e0b',
              fontSize: '1.25rem',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(245, 158, 11, 0.1)';
              e.target.style.transform = 'scale(1.05) rotate(2deg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.transform = 'scale(1) rotate(0deg)';
            }}
          >
            <span style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span
                dangerouslySetInnerHTML={{
                  __html: `<span style="font-family: Pacifico, cursive !important; font-weight: 500; font-size: 1.2rem;">&lt;&lt; Dance Again 💃</span>`,
                }}
              />
            </span>
          </button>
        </div>

        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');

          @keyframes sway {
            0%, 100% { transform: rotate(-2deg) translateY(0); }
            50% { transform: rotate(2deg) translateY(-10px); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    );
  };

  const containerStyle = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '1.5rem',
    backgroundColor: '#111827',
    color: '#ffffff',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#f59e0b'
  };

  const levelButtonsContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  };

  const challengeContainerStyle = {
    padding: '1.5rem',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    backgroundColor: '#1f2937',
    marginBottom: '1.5rem'
  };

  const editorContainerStyle = {
    padding: '1.5rem',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    backgroundColor: '#1f2937'
  };

  const textareaStyle = {
    width: '100%',
    height: '16rem',
    fontFamily: 'monospace',
    padding: '1rem',
    backgroundColor: '#111827',
    color: '#d1d5db',
    border: '1px solid #374151',
    borderRadius: '0.25rem',
    resize: 'vertical'
  };

  const errorStyle = {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#7f1d1d',
    borderRadius: '0.25rem',
    color: '#fecaca'
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '1rem'
  };

  const runButtonStyle = {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#059669',
    color: '#ffffff',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    border: 'none'
  };

  const answerButtonStyle = {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    border: 'none'
  };

  const nextLevelButtonStyle = {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    border: 'none'
  };

  const solutionContainerStyle = {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '0.5rem'
  };

  const preStyle = {
    backgroundColor: '#111827',
    color: '#d1d5db',
    padding: '1rem',
    borderRadius: '0.25rem',
    overflowX: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.875rem'
  };

  const outputContainerStyle = {
    marginTop: '1.5rem',
    padding: '1.5rem',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    backgroundColor: '#1f2937'
  };

  const outputPreStyle = {
    backgroundColor: '#000000',
    color: '#4ade80',
    padding: '1rem',
    borderRadius: '0.25rem',
    fontFamily: 'monospace',
    height: '12rem',
    overflowY: 'auto'
  };

  return (
    <div style={containerStyle}>
      {/* Top Bar */}
      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 0",
        fontFamily: "Arial, sans-serif",
        marginBottom: "1.5rem"
      }}>
        <h1 style={{
          color: "#f39c12",
          margin: "0",
          fontSize: "40px",
          fontWeight: "bold"
        }}>
          Code Clash JavaScript ☕︎
        </h1>
        <Link
          to="/"
          style={{
            position: "relative",
            display: "inline-block",
            padding: "0.4rem 1rem",
            color: "#000",
            fontWeight: "500",
            textDecoration: "none",
            overflow: "hidden",
            borderRadius: "9999px",
            background: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(6px)",
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "color 0.4s ease",
          }}
          onMouseEnter={(e) => {
            const bg = e.currentTarget.querySelector(".bg");
            bg.style.width = "100%";
            e.currentTarget.style.color = "#000";
          }}
          onMouseLeave={(e) => {
            const bg = e.currentTarget.querySelector(".bg");
            bg.style.width = "35%";
            e.currentTarget.style.color = "#000";
          }}
        >
          <span
            className="bg"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "35%",
              height: "100%",
              background: "rgba(0, 255, 170, 0.93)",
              borderRadius: "9999px",
              transition: "all 0.4s ease",
              zIndex: 0,
            }}
          />
          <span
            style={{
              position: "relative",
              zIndex: 1,
              whiteSpace: "nowrap",
            }}
            dangerouslySetInnerHTML={{
              __html: `<span style="font-family: Pacifico, cursive !important; font-weight: 500; font-size: 0.85rem;">&lt;&lt; Back home</span>`,
            }}
          />
        </Link>
      </div>

      <div style={levelButtonsContainerStyle}>
        {Object.keys(levelData).map((levelNum) => {
          const levelNumber = parseInt(levelNum);
          return (
            <button 
              key={levelNum}
              onClick={() => levelNumber <= unlockedLevels && setCurrentLevel(levelNumber)}
              style={getLevelButtonStyle(levelNumber)}
              disabled={levelNumber > unlockedLevels}
            >
              {levelNumber > unlockedLevels ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: `<span style="font-family: Pacifico, cursive !important; font-weight: 500; font-size: 1rem;">🔒 Level ${levelNum}</span>`,
                  }}
                />
              ) : (
                <span
                  dangerouslySetInnerHTML={{
                    __html: `<span style="font-family: Pacifico, cursive !important; font-weight: 500; font-size: 1rem;">Level ${levelNum}</span>`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Challenge Description Section */}
      <div style={challengeContainerStyle}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f59e0b' }}>
          Challenge Description
        </h2>
        <div style={{ color: '#d1d5db', whiteSpace: 'pre-wrap' }}>
          {levelData[currentLevel].challenge}
        </div>
      </div>
      
      <div style={editorContainerStyle}>
        <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem'}}>Code Editor</h2>
        <textarea
          value={codeValue}
          onChange={(e) => setCodeValue(e.target.value)}
          placeholder="Write your JavaScript code here..."
          style={textareaStyle}
        />
        
        {errorMessage && (
          <div style={errorStyle}>
            {errorMessage}
          </div>
        )}
        
        <div style={buttonContainerStyle}>
          <button 
            onClick={runCode}
            disabled={isRunning}
            style={runButtonStyle}
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
          
          <div style={{display: 'flex', gap: '0.75rem'}}>
            <button 
              onClick={() => setShowAnswer(!showAnswer)}
              style={answerButtonStyle}
            >
              {showAnswer ? "Hide Answer" : "View Answer"}
            </button>
            
            {testsPassed && currentLevel < Object.keys(levelData).length && currentLevel === unlockedLevels && (
              <button 
                onClick={() => setCurrentLevel(currentLevel + 1)}
                style={nextLevelButtonStyle}
              >
                Next Level
              </button>
            )}
          </div>
        </div>
        
        {showAnswer && (
          <div style={solutionContainerStyle}>
            <h3 style={{fontWeight: 'bold', marginBottom: '0.5rem'}}>Solution:</h3>
            <pre style={preStyle}>
              {levelData[currentLevel].solution}
            </pre>
            <button 
              onClick={() => {
                setCodeValue(levelData[currentLevel].solution);
                setShowAnswer(false);
              }}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              Apply Solution
            </button>
          </div>
        )}
      </div>

      {output && (
        <div style={outputContainerStyle}>
          <h3 style={{fontWeight: 'bold', marginBottom: '0.5rem'}}>Output:</h3>
          <pre style={outputPreStyle}>
            {output}
          </pre>
        </div>
      )}

      {showCompletionPopup && <CompletionPopup />}
    </div>
  );
};

export default JavaScriptCodingGame;