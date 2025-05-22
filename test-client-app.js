const http = require('http');

// Configuration - Adjust these as needed
const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || 'http://localhost:4000'; // Or your backend service name if in the same Docker network
const PROJECT_IDENTIFIER = process.env.PROJECT_IDENTIFIER || 'test-project-123'; // Identifier for this test app
const CHECK_INTERVAL_MS = 5000; // Check every 5 seconds for testing

let currentStatus = 'UNKNOWN'; // Can be UNKNOWN, ACTIVE, DISABLED_PAYMENT_DUE, FULLY_LICENSED
let lastCheckDate = null;
let gracePeriodFailures = 0;
const GRACE_PERIOD_MAX_FAILURES = 3; // Allow 3 failed checks before disabling due to error

const performLicenseCheck = async () => {
  if (currentStatus === 'FULLY_LICENSED') {
    console.log(`[${new Date().toISOString()}] TestClientApp (${PROJECT_IDENTIFIER}): Status is FULLY_LICENSED. No need to check.`);
    return;
  }

  console.log(`[${new Date().toISOString()}] TestClientApp (${PROJECT_IDENTIFIER}): Checking license status... Current local status: ${currentStatus}`);
  
  try {
    const response = await fetch(`${LICENSE_SERVER_URL}/api/license/check_status?project_identifier=${PROJECT_IDENTIFIER}`);
    lastCheckDate = new Date().toISOString();

    if (response.ok) {
      const data = await response.json();
      gracePeriodFailures = 0; // Reset failures on successful check
      console.log(`[${lastCheckDate}] TestClientApp (${PROJECT_IDENTIFIER}): Received status from server: ${data.status}`);

      switch (data.status) {
        case 'NOT_PAID':
          currentStatus = 'DISABLED_PAYMENT_DUE';
          console.warn(`[${lastCheckDate}] TestClientApp (${PROJECT_IDENTIFIER}): !!! APPLICATION DISABLED due to NOT_PAID status !!!`);
          // TODO: Implement actual disablement logic here (e.g., stop a web server, exit process, etc.)
          break;
        case 'PARTIALLY_PAID':
          currentStatus = 'ACTIVE';
          console.log(`[${lastCheckDate}] TestClientApp (${PROJECT_IDENTIFIER}): Application is ACTIVE.`);
          break;
        case 'FULLY_PAID':
          currentStatus = 'FULLY_LICENSED';
          console.log(`[${lastCheckDate}] TestClientApp (${PROJECT_IDENTIFIER}): Application is FULLY_LICENSED. No further checks needed.`);
          break;
        default:
          console.error(`[${lastCheckDate}] TestClientApp (${PROJECT_IDENTIFIER}): Unknown status received: ${data.status}`);
          currentStatus = 'UNKNOWN'; // Or maintain previous status with caution
      }
    } else {
      const errorText = await response.text();
      console.error(`[${lastCheckDate}] TestClientApp (${PROJECT_IDENTIFIER}): API Error ${response.status}: ${errorText}`);
      handleApiError();
    }
  } catch (error) {
    lastCheckDate = new Date().toISOString();
    console.error(`[${lastCheckDate}] TestClientApp (${PROJECT_IDENTIFIER}): Network or fetch error during license check:`, error.message);
    handleApiError();
  }
};

const handleApiError = () => {
  gracePeriodFailures++;
  console.warn(`[${lastCheckDate}] TestClientApp (${PROJECT_IDENTIFIER}): API check failed. Failure ${gracePeriodFailures} of ${GRACE_PERIOD_MAX_FAILURES}.`);
  if (gracePeriodFailures >= GRACE_PERIOD_MAX_FAILURES) {
    currentStatus = 'DISABLED_GRACE_PERIOD_EXPIRED';
    console.error(`[${lastCheckDate}] TestClientApp (${PROJECT_IDENTIFIER}): !!! APPLICATION DISABLED due to grace period expired after API errors !!!`);
    // TODO: Implement disablement
  }
};

// Initial check and then set interval
console.log(`[${new Date().toISOString()}] TestClientApp (${PROJECT_IDENTIFIER}): Starting up. Will check license status every ${CHECK_INTERVAL_MS / 1000} seconds.`);
performLicenseCheck();
setInterval(performLicenseCheck, CHECK_INTERVAL_MS);

// Simulate some app work based on status
setInterval(() => {
  if (currentStatus === 'ACTIVE' || currentStatus === 'FULLY_LICENSED') {
    console.log(`[${new Date().toISOString()}] TestClientApp (${PROJECT_IDENTIFIER}): ...doing work... (Status: ${currentStatus})`);
  } else {
    console.log(`[${new Date().toISOString()}] TestClientApp (${PROJECT_IDENTIFIER}): ...application is currently NOT operational... (Status: ${currentStatus})`);
  }
}, 10000); // Log work status every 10 seconds

// Keep the process running
process.stdin.resume(); 