import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* Looks: common/styles/pages/contact.css
   Sizes: platforms/<device>/contact.css

   Messages go to server.js, which checks the robot question, saves them
   encrypted, and shows them in /admin -> Inbox. No third-party services. */

const ALLOWED_DOMAINS = ["gmail.com", "outlook.com"];

const Contact = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [challenge, setChallenge] = useState(null);   // { question, nonce, issuedAt, sig }
  const [answer, setAnswer] = useState("");

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

  // a fresh robot question from the server
  const loadChallenge = useCallback(async () => {
    setAnswer("");
    try {
      const res = await fetch("/api/challenge");
      if (!res.ok) throw new Error();
      setChallenge(await res.json());
    } catch {
      setChallenge(null);
      setError("The contact form is offline right now. Please try again later.");
    }
  }, []);

  useEffect(() => { loadChallenge(); }, [loadChallenge]);

  // Email format + allowed domain (the server checks the same again)
  const validateEmail = (value) => {
    const domain = value.split("@")[1]?.toLowerCase();
    if (!value.includes("@") || !domain) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!ALLOWED_DOMAINS.includes(domain)) {
      setError("Only Gmail and Outlook emails are allowed.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (timeoutActive || !validateEmail(email)) return;
    if (!challenge) {
      setError("The contact form is offline right now. Please try again later.");
      return;
    }

    const form = e.target;
    const field = (name) => form.elements.namedItem(name).value;
    setSubmitted(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: field("name"),
          email,
          subject: field("subject"),
          message: field("message"),
          website: field("website"),          // the hidden trap field
          challenge: { nonce: challenge.nonce, issuedAt: challenge.issuedAt, sig: challenge.sig },
          answer,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        form.reset();
        setEmail("");
        setShowSuccessPopup(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        if (res.status === 429) {
          setTimeoutActive(true);
          setTimeout(() => setTimeoutActive(false), 5 * 60 * 1000);
        }
        loadChallenge();   // every question is single-use
      }
    } catch {
      setError("Could not reach the server. Please try again later.");
    }
    setSubmitted(false);
  };

  return (
    <div className="contact-page">
      <div className="contact-box">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div>
            <h2 className="contact-title">Get in Touch</h2>
            <hr className="contact-rule" />
          </div>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            className="contact-input"
            required
            disabled={timeoutActive}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => email && validateEmail(email)}
            className="contact-input"
            required
            disabled={timeoutActive}
          />
          {error && <p className="contact-error">{error}</p>}
          <input
            type="text"
            name="subject"
            placeholder="Your Subject"
            className="contact-input"
            required
            disabled={timeoutActive}
          />
          <textarea
            name="message"
            placeholder="Your Message"
            className="contact-message"
            required
            disabled={timeoutActive}
          ></textarea>

          {/* the trap: hidden from people, bots fill it in */}
          <div className="contact-trap" aria-hidden="true">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          {/* robot check - the question comes from server.js */}
          <label className="contact-robot">
            <span className="contact-robot-q">
              Robot check: {challenge ? `${challenge.question} = ?` : "loading…"}
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="contact-input contact-robot-a"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              disabled={timeoutActive || !challenge}
            />
          </label>

          {timeoutActive && (
            <p className="contact-warning">
              Too many attempts. Please wait 5 minutes before trying again.
            </p>
          )}

          <div className="contact-buttons">
          <button
            type="submit"
            className="contact-btn is-submit"
            disabled={submitted || timeoutActive || !challenge}
          >
            {submitted ? "Sending..." : "Submit"}
          </button>
          <button
            type="button"
            className="contact-btn is-home"
            onClick={() => navigate("/")}
          >
            Return Home
          </button>
          </div>
        </form>
        <img src="/images/right_img.png" alt="Contact" className="contact-image" />
      </div>

      {showSuccessPopup && (
        <div className="contact-popup">
          <div className="contact-popup-box">
            <div className="contact-popup-icon">✓</div>
            <h3 className="contact-popup-title">Message Sent Successfully!</h3>
            <p className="contact-popup-text">
              Thank you for your message. We'll get back to you soon.
            </p>
            <p className="contact-popup-text">
              Redirecting to home page in <span className="contact-countdown">{redirectCountdown}</span> seconds...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
