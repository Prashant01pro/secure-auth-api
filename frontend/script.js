const API_BASE = "http://localhost:4000";

const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

const signInContainer = document.querySelector('.sign-in-container');
const signUpContainer = document.querySelector('.sign-up-container');

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const authMessage = document.getElementById("authMessage");
const oauthMessage = document.getElementById("oauthMessage");
const verifyStatus = document.getElementById("verifyStatus");
const verifyBtn = document.getElementById("verifyBtn");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");
const resendForm = document.getElementById("resendForm");
const resendEmail = document.getElementById("resendEmail");
const forgetForm = document.getElementById("forgetForm");
const forgetEmail = document.getElementById("forgetEmail");
const resetForm = document.getElementById("resetForm");
const resetTokenInput = document.getElementById("resetToken");
const newPasswordInput = document.getElementById("newPassword");
const googleSignInContainer = document.getElementById("googleSignIn");
const googleSignUpContainer = document.getElementById("googleSignUp");
let googleInitAttempts = 0;
const MAX_GOOGLE_INIT_ATTEMPTS = 20;

const googleClientIdMeta = document.querySelector('meta[name="google-client-id"]');
const GOOGLE_CLIENT_ID = googleClientIdMeta?.content?.trim() || "";

const getTokenFromURL = () => {
  const tokenInPath = window.location.pathname.split("/verify-email/")[1];
  if (tokenInPath) return tokenInPath;

  const params = new URLSearchParams(window.location.search);
  return params.get("verifyToken");
};

const getResetTokenFromURL = () => {
  const tokenInPath = window.location.pathname.split("/reset-password/")[1];
  if (tokenInPath) return tokenInPath;

  const params = new URLSearchParams(window.location.search);
  return params.get("resetToken");
};

const setStatus = (message, isError = false) => {
  verifyStatus.textContent = message;
  verifyStatus.style.color = isError ? "#b42318" : "#175c2f";
};

const setOAuthMessage = (message, isError = false) => {
  if (!oauthMessage) return;

  oauthMessage.textContent = message;
  oauthMessage.style.color = isError ? "#b42318" : "#175c2f";
};

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  localStorage.removeItem("verifyToken");
};

const handleOAuthLoginSuccess = (data) => {
  if (!data?.accessToken) {
    throw new Error("Backend did not return an access token for Google login.");
  }

  localStorage.setItem("token", data.accessToken);
  localStorage.removeItem("refreshToken");

  const oauthUsername = data.user?.username || data.user?.name || "";
  localStorage.setItem("username", oauthUsername);

  window.location.href = "./dashboard.html";
};

const handleGoogleCredentialResponse = async (response) => {
  const token = response?.credential;

  if (!token) {
    setOAuthMessage("Google credential token missing.", true);
    return;
  }

  setOAuthMessage("Completing Google sign in...");

  try {
    const res = await fetch(`${API_BASE}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Google login failed");

    setOAuthMessage("Google login successful. Redirecting...");
    handleOAuthLoginSuccess(data);
  } catch (err) {
    setOAuthMessage(err.message, true);
  }
};

const initGoogleOAuth = () => {
  if (!googleSignInContainer && !googleSignUpContainer) return;

  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
    setOAuthMessage("Set your Google client ID in index.html meta tag to enable OAuth.", true);
    return;
  }

  if (!window.google?.accounts?.id) {
    googleInitAttempts += 1;

    if (googleInitAttempts <= MAX_GOOGLE_INIT_ATTEMPTS) {
      setOAuthMessage("Loading Google OAuth...");
      setTimeout(initGoogleOAuth, 250);
      return;
    }

    setOAuthMessage("Google script did not load. Refresh and try again.", true);
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse
  });

  const buttonOptions = {
    theme: "outline",
    size: "large",
    shape: "pill",
    text: "continue_with",
    width: 280
  };

  if (googleSignInContainer) {
    window.google.accounts.id.renderButton(googleSignInContainer, buttonOptions);
  }

  if (googleSignUpContainer) {
    window.google.accounts.id.renderButton(googleSignUpContainer, buttonOptions);
  }

  setOAuthMessage("Google OAuth ready.");
};

signUpButton.addEventListener('click', () => {
  signInContainer.style.display = "none";   // instant hide
  signUpContainer.style.display = "flex";   // show register
  container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
  signInContainer.style.display = "flex";   // show login
  signUpContainer.style.display = "none";   // hide register
  container.classList.remove("right-panel-active");
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMessage.textContent = "";

  const payload = {
    username: document.getElementById("registerUsername").value.trim(),
    email: document.getElementById("registerEmail").value.trim(),
    password: document.getElementById("registerPassword").value.trim()
  }

  try {

    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration Fail")

    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("username", data.user?.username || payload.username)
    localStorage.setItem("verifyToken", data.verificationToken || "");
    resendEmail.value = payload.email;

    authMessage.textContent = "Registration successful. Verify your email before using full access.";
    setStatus("Registration complete. Click 'Verify Email Token' or use resend if token expired.");

  } catch (err) {
    authMessage.textContent = err.message;
    setStatus(err.message, true);
  }

})


loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMessage.textContent = "";

  const payload = {
    email: document.getElementById("loginEmail").value.trim(),
    password: document.getElementById("loginPassword").value
  };

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("username", data.username || "");
    window.location.href = "./dashboard.html";
  } catch (err) {
    authMessage.textContent = err.message;
    setStatus(err.message, true);
  }
});

verifyBtn.addEventListener("click", async () => {
  const token = getTokenFromURL() || localStorage.getItem("verifyToken");
  if (!token) {
    setStatus("No verification token found. Register or paste token in URL as ?verifyToken=<token>.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/verify-email/${token}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Email verification failed");

    setStatus(data.message || "Email verified successfully.");
    localStorage.removeItem("verifyToken");
  } catch (err) {
    setStatus(err.message, true);
  }
});

resendForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = resendEmail.value.trim();
  if (!email) {
    setStatus("Email is required for resend verification.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Resend verification failed");

    setStatus(data.message || "Verification link sent.");
  } catch (err) {
    setStatus(err.message, true);
  }
});

refreshBtn.addEventListener("click", async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    setStatus("No refresh token found. Please login again.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not refresh access token");

    localStorage.setItem("token", data.accessToken);
    setStatus("Access token refreshed successfully.");
  } catch (err) {
    setStatus(err.message, true);
  }
});

forgetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = forgetEmail.value.trim();

  if (!email) {
    setStatus("Email is required for forgot password.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/forget-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not send password reset link");

    setStatus(data.message || "Password reset link sent.");
  } catch (err) {
    setStatus(err.message, true);
  }
});

resetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = resetTokenInput.value.trim() || getResetTokenFromURL();
  const newPassword = newPasswordInput.value.trim();

  if (!token) {
    setStatus("Reset token is required. Paste it or use ?resetToken=<token>.", true);
    return;
  }

  if (!newPassword) {
    setStatus("New password is required.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reset-password/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Password reset failed");

    setStatus(data.message || "Password reset successful. Please login.");
    resetForm.reset();
  } catch (err) {
    setStatus(err.message, true);
  }
});

logoutBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    clearAuthStorage();
    setStatus("Already logged out.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Logout failed");

    clearAuthStorage();
    setStatus(data.message || "Logged out successfully.");
  } catch (err) {
    setStatus(err.message, true);
  }
});

const resetTokenFromURL = getResetTokenFromURL();
if (resetTokenFromURL) {
  resetTokenInput.value = resetTokenFromURL;
}

initGoogleOAuth();
