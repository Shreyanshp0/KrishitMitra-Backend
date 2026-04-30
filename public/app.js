const mount = document.getElementById("api-summary");

if (mount) {
  mount.innerHTML = `
    <li><code>GET /health</code> - backend health check</li>
    <li><code>POST /api/auth/signup</code> - create or refresh an unverified user and email an OTP</li>
    <li><code>POST /api/auth/verify-otp</code> - verify email + OTP and receive an app token</li>
    <li><code>POST /api/auth/resend-otp</code> - send a fresh OTP to an unverified user</li>
    <li><code>GET /api/auth/me</code> - fetch the current user using the backend bearer token</li>
  `;
}
