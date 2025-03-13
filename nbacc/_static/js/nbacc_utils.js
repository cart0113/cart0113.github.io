async function readGzJson(url) {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const decompressed = pako.inflate(uint8Array, { to: "string" });
        const jsonData = JSON.parse(decompressed);
        return jsonData;
    } catch (error) {
        console.error("Error reading or parsing gzipped JSON:", error);
        throw error;
    }
}
function normalPPF(sigma) {
    // Ensure sigma is within the valid range (0 to 1)
    sigma = Math.max(0, Math.min(sigma, 1));

    // Calculate the inverse of the error function
    function inverseErf(x) {
        const a = 0.147;
        return Math.sign(x) * Math.sqrt(Math.log(1 - x * x) / -2 + a * x * x);
    }

    // Calculate the PPF using the inverse error function
    const ppfValue = 0.5 * (1 + inverseErf(2 * sigma - 1));

    return ppfValue;
}

/**
 * Calculate the cumulative distribution function (CDF) of the normal distribution.
 * This gives the probability that a random variable with normal distribution
 * will be found at a value less than or equal to x.
 *
 * @param {number} x - The value to calculate the CDF at
 * @param {number} [mean=0] - The mean of the normal distribution (default: 0)
 * @param {number} [std=1.0] - The standard deviation of the normal distribution (default: 1.0)
 * @returns {number} - The probability (between 0 and 1)
 */
function normalCDF(x, mean = 0, std = 1.0) {
    const z = (x - mean) / std;
    const t = 1 / (1 + 0.2315419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    let prob =
        d *
        t *
        (0.3193815 +
            t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (z > 0) {
        prob = 1 - prob;
    }
    return prob;
}

// Function to completely clean up tooltip content and reset state
function clearTooltipContent() {
    const tooltipEl = document.getElementById("chartjs-tooltip");
    if (tooltipEl) {
        tooltipEl.style.opacity = 0;
        tooltipEl.setAttribute("data-sticky", "false");

        // Completely replace the table to remove all event listeners
        const oldTable = tooltipEl.querySelector("table");
        if (oldTable) {
            tooltipEl.removeChild(oldTable);
            const newTable = document.createElement("table");
            tooltipEl.appendChild(newTable);
        }

        // Reset cursor
        document.body.style.cursor = "default";
    }
}

function chartJsToolTipClearer(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    // Force clear any lingering tooltip completely
    // Use our comprehensive cleanup function
    if (typeof clearTooltipContent === "function") {
        clearTooltipContent();
    } else {
        throw new Error("AssertionError");
    }
}

/**
 * Utility function to detect if the user is on a mobile device
 * Uses a combination of screen size and user agent detection for better accuracy
 *
 * @returns {boolean} true if the user is on a mobile device, false otherwise
 */
function isMobile() {
    // First check for touch capability - most reliable for iOS Safari
    const hasTouchScreen = (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0)
    );
    
    // Check screen width - for responsive design
    const isNarrowScreen = window.innerWidth <= 768;
    const isVeryNarrowScreen = window.innerWidth <= 480;
    
    // Check user agent - provides additional context
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Regular expressions to match common mobile devices
    const mobileRegex =
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
    const tabletRegex = /android|ipad|playbook|silk/i;
    
    // Special case for iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    // Consider a device mobile in any of these cases:
    // 1. It has a very narrow screen (width <= 480px)
    // 2. It has a narrow screen AND matches mobile/tablet user agent
    // 3. It has a touch screen AND matches iOS detection
    return (
        isVeryNarrowScreen ||
        (isNarrowScreen && (mobileRegex.test(userAgent) || tabletRegex.test(userAgent))) ||
        (hasTouchScreen && isIOS)
    );
}
