// client_license_check_example.js
//
// This is a basic example of how a Node.js client application (like your GreenCooling backend)
// can check its license status with the License Manager.
//
// You'll need to integrate this logic into your actual application code,
// likely calling it at startup and/or periodically, or before critical operations.

const https = require('https'); // Or 'http' if your license manager is not using HTTPS

// --- Configuration ---
// IMPORTANT: These values need to be configured securely in your application.
// Consider using environment variables or a configuration file.
const LICENSE_SERVER_URL = 'http://localhost:4000'; // Replace with your actual License Manager URL
const PROJECT_IDENTIFIER = 'your-unique-project-identifier'; // Replace with the identifier created in the License Manager

// Application-specific state (example)
let isAppFunctional = false;
let currentLicenseStatus = null;
let gracePeriodDays = 3; // Example: 3 days grace period
let failedCheckAttempts = 0;

const GRACE_PERIOD_EXPIRED_STATUS = 'GRACE_PERIOD_EXPIRED';
const UNKNOWN_STATUS = 'UNKNOWN';

/**
 * Checks the license status with the License Manager.
 * @returns {Promise<string>} A promise that resolves with the license status string
 *                            (e.g., 'NOT_PAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'GRACE_PERIOD_EXPIRED')
 *                            or rejects with an error.
 */
function checkLicenseStatus() {
  return new Promise((resolve, reject) => {
    const url = `${LICENSE_SERVER_URL}/api/license/check_status?project_identifier=${PROJECT_IDENTIFIER}`;

    const protocol = LICENSE_SERVER_URL.startsWith('https') ? https : require('http');

    protocol.get(url, (res) => {
      let data = '';

      if (res.statusCode === 404) {
        console.error(`[LicenseCheck] Project identifier "${PROJECT_IDENTIFIER}" not found on the license server.`);
        // This is a critical configuration error. The app should likely not function.
        currentLicenseStatus = 'NOT_PAID'; // Treat as not paid or handle as critical error
        failedCheckAttempts++;
        resolve(currentLicenseStatus); // Or reject with a specific error
        return;
      }

      if (res.statusCode !== 200) {
        console.error(`[LicenseCheck] Error contacting license server. Status Code: ${res.statusCode}`);
        failedCheckAttempts++;
        // Enter grace period or handle error
        if (failedCheckAttempts > gracePeriodDays) {
            currentLicenseStatus = GRACE_PERIOD_EXPIRED_STATUS;
        } else {
            // Maintain current status or a specific 'grace period' status if you have one
            console.warn(`[LicenseCheck] Operating in grace period. Attempt ${failedCheckAttempts}/${gracePeriodDays}`);
        }
        resolve(currentLicenseStatus || UNKNOWN_STATUS); // Resolve with current or unknown status
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData && parsedData.status) {
            console.log(`[LicenseCheck] Successfully retrieved status: ${parsedData.status}`);
            currentLicenseStatus = parsedData.status;
            failedCheckAttempts = 0; // Reset on successful check
            resolve(currentLicenseStatus);
          } else {
            console.error('[LicenseCheck] Invalid response format from license server.', parsedData);
            failedCheckAttempts++;
            resolve(currentLicenseStatus || UNKNOWN_STATUS); // Maintain current status or unknown
          }
        } catch (e) {
          console.error('[LicenseCheck] Error parsing response from license server:', e);
          failedCheckAttempts++;
          resolve(currentLicenseStatus || UNKNOWN_STATUS); // Maintain current status or unknown
        }
      });
    }).on('error', (err) => {
      console.error('[LicenseCheck] Error during license check request:', err.message);
      failedCheckAttempts++;
      if (failedCheckAttempts > gracePeriodDays) {
          currentLicenseStatus = GRACE_PERIOD_EXPIRED_STATUS;
      } else {
          console.warn(`[LicenseCheck] Operating in grace period due to request error. Attempt ${failedCheckAttempts}/${gracePeriodDays}`);
      }
      resolve(currentLicenseStatus || UNKNOWN_STATUS); // Maintain current status or unknown
    });
  });
}

/**
 * Applies application logic based on the current license status.
 */
function applyLicenseLogic() {
  console.log(`[AppLogic] Applying logic for status: ${currentLicenseStatus}`);
  switch (currentLicenseStatus) {
    case 'NOT_PAID':
      isAppFunctional = false;
      console.log('[AppLogic] Application is DISABLED due to unpaid license.');
      // TODO: Implement logic to disable your application's core features.
      // Example: stop services, block API requests, show maintenance page.
      break;
    case 'PARTIALLY_PAID':
      isAppFunctional = true;
      console.log('[AppLogic] Application is FUNCTIONAL (Partially Paid). Daily checks continue.');
      // TODO: Ensure application is fully functional.
      break;
    case 'FULLY_PAID':
      isAppFunctional = true;
      console.log('[AppLogic] Application is FULLY FUNCTIONAL (Fully Paid). Daily checks can stop if desired.');
      // TODO: Ensure application is fully functional.
      // Optionally, you can stop the periodic license checks here if this status is persistent.
      break;
    case GRACE_PERIOD_EXPIRED_STATUS:
      isAppFunctional = false;
      console.error('[AppLogic] Grace period expired. Application is DISABLED.');
      // TODO: Disable application features.
      break;
    case UNKNOWN_STATUS:
    default:
      // Decide on default behavior if status is unknown after checks (e.g., due to repeated errors)
      // For safety, you might disable the app or run in a limited mode.
      // Here, we assume it might still be functional if it was before, relying on grace period logic.
      console.warn('[AppLogic] License status is UNKNOWN. Application behavior might be restricted or based on last known status within grace period.');
      if (failedCheckAttempts > gracePeriodDays) isAppFunctional = false; // Double check disable if grace period expired
      // TODO: Implement behavior for unknown status.
      break;
  }
  console.log(`[AppLogic] Application functional state: ${isAppFunctional}`);
}

/**
 * Main function to perform license check and apply logic.
 * This could be called on application startup and then periodically.
 */
async function performLicenseCheckAndApplyLogic() {
  console.log('[Main] Performing license check...');
  try {
    await checkLicenseStatus(); // currentLicenseStatus is updated by this function
    applyLicenseLogic();

    // If status is FULLY_PAID, you might decide to stop further checks.
    if (currentLicenseStatus === 'FULLY_PAID') {
      console.log('[Main] License is fully paid. Stopping periodic checks.');
      //clearInterval(licenseCheckInterval); // If using an interval
    }

  } catch (error) {
    console.error('[Main] An unexpected error occurred during the license check process:', error);
    // Fallback logic if checkLicenseStatus itself rejects unexpectedly
    // (though in current design it resolves with a status even on error)
    currentLicenseStatus = UNKNOWN_STATUS;
    applyLicenseLogic();
  }
}

// --- How to use ---

// 1. Call on application startup:
// performLicenseCheckAndApplyLogic();

// 2. Optionally, set up a periodic check (e.g., daily) if not fully paid:
// const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
// let licenseCheckInterval;

// if (currentLicenseStatus !== 'FULLY_PAID') {
//   licenseCheckInterval = setInterval(() => {
//     if (currentLicenseStatus !== 'FULLY_PAID') {
//        console.log('[Scheduler] Performing scheduled daily license check...');
//        performLicenseCheckAndApplyLogic();
//     } else {
//        console.log('[Scheduler] License is fully paid. Clearing scheduled check.');
//        clearInterval(licenseCheckInterval);
//     }
//   }, CHECK_INTERVAL_MS);
// }


// --- Example Invocation (for testing this script directly) ---
// Uncomment to test:
/*
(async () => {
  console.log("Initial application state: " + (isAppFunctional ? "Functional" : "Disabled"));
  console.log("Initial license status: " + currentLicenseStatus);

  await performLicenseCheckAndApplyLogic();

  console.log("Application state after check: " + (isAppFunctional ? "Functional" : "Disabled"));
  console.log("Final license status: " + currentLicenseStatus);

  // Simulate a scenario where you might check again later if not fully paid
  if (currentLicenseStatus !== 'FULLY_PAID') {
    console.log("\nSimulating another check after some time (e.g. next day)...");
    // In a real app, you might manipulate server state or config for testing different responses.
    // For this example, we'll just call it again.
    await performLicenseCheckAndApplyLogic();
    console.log("Application state after second check: " + (isAppFunctional ? "Functional" : "Disabled"));
    console.log("Final license status after second check: " + currentLicenseStatus);
  }
})();
*/

// Make sure to export functions if you intend to use this as a module
module.exports = {
  checkLicenseStatus,
  applyLicenseLogic,
  performLicenseCheckAndApplyLogic,
  getAppFunctionalStatus: () => isAppFunctional,
  getCurrentLicenseStatus: () => currentLicenseStatus
}; 