const axios = require("axios");

/**
 * Pings the server at a regular interval to prevent it from sleeping.
 * @param {string} url - The base URL of the backend.
 * @param {number} intervalMinutes - The interval in minutes between pings.
 */
const startKeepAwake = (url, intervalMinutes = 14) => {
  if (!url) {
    console.log("Keep-awake: No backend URL provided. Self-pinging disabled.");
    return;
  }

  const pingUrl = `${url.replace(/\/$/, "")}/api/keep-awake`;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`Keep-awake: Starting self-pinging for ${pingUrl} every ${intervalMinutes} minutes.`);

  // Immediate ping on start
  axios.get(pingUrl)
    .then(() => console.log("Keep-awake: Initial ping successful."))
    .catch(err => console.error("Keep-awake: Initial ping failed.", err.message));

  // Set up the interval
  setInterval(() => {
    axios.get(pingUrl)
      .then(() => {
        console.log(`Keep-awake: Pinged at ${new Date().toLocaleTimeString()}`);
      })
      .catch(err => {
        console.error("Keep-awake: Ping failed:", err.message);
      });
  }, intervalMs);
};

module.exports = startKeepAwake;
