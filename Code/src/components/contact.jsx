import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha"; // Install with npm i react-google-recaptcha
import emailjs from "emailjs-com"; // Install with npm i emailjs-com

const Contact = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [, setIsValid] = useState(true);
  const [error, setError] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Disable right-click and certain key shortcuts (superficial)
  useEffect(() => {
    const disableContextMenu = (e) => e.preventDefault();
    const disableKeys = (e) => {
      if ((e.ctrlKey && (e.key === "u" || e.key === "s" || e.key === "i")) || e.key === "F12") {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", disableContextMenu);
    document.addEventListener("keydown", disableKeys);
    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("keydown", disableKeys);
    };
  }, []);

  // Handle countdown and redirect after successful submission
  useEffect(() => {
    let countdownTimer;
    if (showSuccessPopup && redirectCountdown > 0) {
      countdownTimer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
    } else if (showSuccessPopup && redirectCountdown === 0) {
      navigate('/');
    }
    return () => clearTimeout(countdownTimer);
  }, [showSuccessPopup, redirectCountdown, navigate]);

  // Validate Email Format & Domain
  const validateEmail = async (email) => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setIsValid(false);
      return false;
    }
    
    const validDomains = ["gmail.com", "outlook.com"];
    const domain = email.split("@")[1];
    if (!validDomains.includes(domain)) {
      setError("Only Gmail and Outlook emails are allowed.");
      setIsValid(false);
      return false;
    }
    
    // Verify if Gmail exists
    if (domain === "gmail.com") {
      try {
        const response = await fetch(`https://api.eva.pingutil.com/email?email=${email}`);
        const data = await response.json();
        if (data.data && data.data.deliverable) {
          setIsValid(true);
          setError("");
          return true;
        } else {
          setIsValid(false);
          setError("Email address is not valid or does not exist.");
          return false;
        }
      } catch {
        setIsValid(false);
        setError("Could not verify email. Try again.");
        return false;
      }
    }
    
    setIsValid(true);
    setError("");
    return true;
  };

  // Handle reCAPTCHA Token
  const handleRecaptcha = (token) => {
    setRecaptchaToken(token);
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is in timeout
    if (timeoutActive) {
      alert("Too many attempts. Please wait 5 minutes before trying again.");
      return;
    }
    
    // Validate email before proceeding
    const emailValid = await validateEmail(email);
    if (!emailValid || !recaptchaToken) {
      alert("Please fix the errors and complete the reCAPTCHA challenge.");
      return;
    }
    
    setSubmitted(true);
    
    // Track attempts
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    // Set timeout if max attempts reached
    if (newAttempts >= 5) {
      setTimeoutActive(true);
      setTimeout(() => {
        setTimeoutActive(false);
        setAttempts(0);
      }, 5 * 60 * 1000); // 5 minutes timeout
    }
    
    const formData = {
      name: e.target.name.value,
      email: email,
      subject: e.target.subject.value,
      message: e.target.message.value,
      'g-recaptcha-response': recaptchaToken,
    };

    try {
      // Send email using EmailJS
      const result = await emailjs.send(
        "YOUR_EMAILJS_SERVICE_ID", // Replace with your EmailJS service ID
        "YOUR_EMAILJS_TEMPLATE_ID", // Replace with your EmailJS template ID
        formData,
        "YOUR_EMAILJS_USER_ID" // Replace with your EmailJS user ID
      );
      
      if (result.text === "OK") {
        // Show success popup and start redirect countdown
        setShowSuccessPopup(true);
        
        // Reset form
        e.target.reset();
        setEmail("");
        setRecaptchaToken(null);
      } else {
        alert("Error sending message.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again later.");
    }
    
    setSubmitted(false);
  };

  const styles = {
    body: {
      fontFamily: "'Outfit', sans-serif",
      background: "linear-gradient(to bottom, #ffdad5, #fff7f9)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "fadeIn 1.5s ease-in-out",
      position: "relative",
    },
    container: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "30px",
      width: "80%",
      maxWidth: "1000px",
      padding: "30px",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderRadius: "15px",
      boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.1)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      animation: "fadeInUp 1.5s ease-in-out",
    },
    left: {
      display: "flex",
      flexDirection: "column",
      alignItems: "start",
      gap: "20px",
      width: "50%",
    },
    title: {
      fontWeight: "600",
      color: "#a363aa",
      fontSize: "40px",
      marginBottom: "5px",
    },
    hr: {
      border: "none",
      width: "120px",
      height: "5px",
      backgroundColor: "#a363aa",
      borderRadius: "10px",
      margin: "10px 0",
    },
    input: {
      width: "100%",
      height: "50px",
      border: "2px solid rgba(200, 200, 200, 0.6)",
      background: "rgba(255, 255, 255, 0.8)",
      padding: "10px 15px",
      outline: "none",
      color: "#666",
      borderRadius: "25px",
      fontSize: "16px",
      backdropFilter: "blur(5px)",
    },
    textarea: {
      width: "100%",
      height: "140px",
      padding: "15px",
      border: "2px solid rgba(200, 200, 200, 0.6)",
      background: "rgba(255, 255, 255, 0.8)",
      outline: "none",
      color: "#666",
      borderRadius: "20px",
      fontSize: "16px",
      resize: "none",
      backdropFilter: "blur(5px)",
    },
    button: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "15px 30px",
      fontSize: "16px",
      color: "#fff",
      border: "none",
      borderRadius: "50px",
      background: "linear-gradient(270deg, #ff994f, #fa6d86)",
      cursor: "pointer",
      transition: "transform 0.2s ease-in-out, background 0.3s",
    },
    buttonDisabled: {
      background: "#cccccc",
      cursor: "not-allowed",
    },
    returnHome: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "15px 30px",
      fontSize: "16px",
      color: "#fff",
      border: "none",
      borderRadius: "50px",
      background: "linear-gradient(270deg, #a363aa, #9038a1)",
      cursor: "pointer",
      transition: "transform 0.2s ease-in-out, background 0.3s",
    },
    image: {
      width: "450px",
      height: "auto",
      borderRadius: "10px",
      animation: "fadeIn 2s ease-in-out",
    },
    error: {
      color: "red",
      fontSize: "14px",
      marginTop: "-10px",
    },
    attemptsWarning: {
      color: "#ff6b6b",
      fontSize: "14px",
    },
    // Success popup styles
    popupOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    popupContent: {
      backgroundColor: "white",
      padding: "30px",
      borderRadius: "15px",
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
      width: "90%",
      maxWidth: "500px",
      textAlign: "center",
      animation: "fadeInDown 0.5s ease-in-out",
    },
    popupIcon: {
      color: "#4CAF50",
      fontSize: "50px",
      marginBottom: "20px",
    },
    popupTitle: {
      color: "#333",
      fontSize: "24px",
      marginBottom: "10px",
    },
    popupMessage: {
      color: "#666",
      fontSize: "16px",
      marginBottom: "20px",
    },
    countdownText: {
      color: "#a363aa",
      fontWeight: "bold",
    },
    animations: `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeInDown {
        from { opacity: 0; transform: translateY(-30px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,
  };

  return (
    <>
      <style>{styles.animations}</style>
      <div style={styles.body}>
        <div style={styles.container}>
          <form style={styles.left} onSubmit={handleSubmit}>
            <div>
              <h2 style={styles.title}>Get in Touch</h2>
              <hr style={styles.hr} />
            </div>
            <input 
              type="text" 
              name="name" 
              placeholder="Your Name" 
              style={styles.input} 
              required 
              disabled={timeoutActive}
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              onBlur={() => validateEmail(email)}
              style={styles.input}
              required
              disabled={timeoutActive}
            />
            {error && <p style={styles.error}>{error}</p>}
            <input 
              type="text" 
              name="subject" 
              placeholder="Your Subject" 
              style={styles.input} 
              required 
              disabled={timeoutActive}
            />
            <textarea 
              name="message" 
              placeholder="Your Message" 
              style={styles.textarea} 
              required
              disabled={timeoutActive}
            ></textarea>

            {timeoutActive && (
              <p style={styles.attemptsWarning}>
                Too many attempts. Please wait 5 minutes before trying again.
              </p>
            )}
            
            {attempts > 0 && !timeoutActive && (
              <p style={styles.attemptsWarning}>
                Attempts: {attempts}/5
              </p>
            )}

            {/* Google reCAPTCHA */}
            <ReCAPTCHA
              sitekey="YOUR_RECAPTCHA_SITE_KEY" // Replace with your reCAPTCHA Site Key
              onChange={handleRecaptcha}
              disabled={timeoutActive}
            />

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(submitted || timeoutActive ? styles.buttonDisabled : {}),
              }}
              onMouseEnter={(e) => !submitted && !timeoutActive && (e.target.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => !submitted && !timeoutActive && (e.target.style.transform = "scale(1)")}
              disabled={submitted || timeoutActive}
            >
              {submitted ? "Sending..." : "Submit"}
            </button>
            <button
              type="button"
              style={styles.returnHome}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              onClick={() => navigate("/")}
            >
              Return Home
            </button>
          </form>
          <img src="/images/right_img.png" alt="Contact" style={styles.image} />
        </div>

        {/* Success Popup with Redirect Countdown */}
        {showSuccessPopup && (
          <div style={styles.popupOverlay}>
            <div style={styles.popupContent}>
              <div style={styles.popupIcon}>✓</div>
              <h3 style={styles.popupTitle}>Message Sent Successfully!</h3>
              <p style={styles.popupMessage}>
                Thank you for your message. We'll get back to you soon.
              </p>
              <p style={styles.popupMessage}>
                Redirecting to home page in <span style={styles.countdownText}>{redirectCountdown}</span> seconds...
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Contact;
