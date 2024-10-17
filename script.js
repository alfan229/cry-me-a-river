// script.js

const imageInput = document.getElementById('image-input');
const dropArea = document.getElementById('drop-area');
const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d');
const squareCountInput = document.getElementById('square-count');
const squareCountValue = document.getElementById('square-count-value');
const minSizeInput = document.getElementById('min-size');
const maxSizeInput = document.getElementById('max-size');
const shuffleButton = document.getElementById('shuffle-button');
const copyButton = document.getElementById('copy-button');
const dashboard = document.getElementById('dashboard');

let img = new Image();
let originalImg = new Image();
let squares = [];

let dragging = false;
let resizing = false;
let dragIndex = -1;
let resizeIndex = -1;
let offsetX, offsetY;
let resizeStartX, resizeStartY;
let resizeStartWidth, resizeStartHeight;

// Event listeners for image upload
imageInput.addEventListener('change', handleImageUpload);
dropArea.addEventListener('dragover', (e) => e.preventDefault());
dropArea.addEventListener('drop', handleDrop);

// Add an event listener for the 'paste' event
window.addEventListener('paste', handlePasteImage);

// Update square count display
squareCountInput.addEventListener('input', () => {
    squareCountValue.textContent = squareCountInput.value;
    updateSquareCount();
});

// Adjust square sizes without changing positions
minSizeInput.addEventListener('input', adjustSquareSizes);
maxSizeInput.addEventListener('input', adjustSquareSizes);

// Shuffle squares when button is clicked
shuffleButton.addEventListener('click', generateSquares);

// Copy image to clipboard
copyButton.addEventListener('click', copyImageToClipboard);

// Mouse event listeners for dragging and resizing squares
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', stopAction);
canvas.addEventListener('mouseleave', stopAction);

// Function to handle image upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        loadImage(file);
    }
}

// Function to handle drag and drop
function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
        loadImage(file);
    }
}

// Function to handle pasting image from clipboard
function handlePasteImage(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
        const item = items[index];
        if (item.kind === 'file') {
            const blob = item.getAsFile();
            if (blob.type.startsWith('image/')) {
                loadImageBlob(blob);
                return;
            }
        }
    }
    alert('No image found in clipboard.');
}

// Load and display the image from file
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        loadImageSrc(event.target.result);
    };
    reader.readAsDataURL(file);
}

// Load and display the image from blob
function loadImageBlob(blob) {
    const reader = new FileReader();
    reader.onload = function(event) {
        loadImageSrc(event.target.result);
    };
    reader.readAsDataURL(blob);
}

// Load image from source
function loadImageSrc(src) {
    img.onload = function() {
        originalImg.src = src; // Keep original image
        resizeCanvas();
        dashboard.style.display = 'block';
        generateSquares();
    };
    img.src = src;
    originalImg.src = src;
}

// Resize canvas to fit max dimensions while maintaining aspect ratio
function resizeCanvas() {
    const maxWidth = 1280;
    const maxHeight = 720;
    let width = img.width;
    let height = img.height;

    // Calculate the new dimensions
    if (width > maxWidth || height > maxHeight) {
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio);
        width = width * ratio;
        height = height * ratio;
    }

    canvas.width = width;
    canvas.height = height;
}

// Function to enable or disable the dashboard
function updateDashboardState(enabled) {
    const controls = dashboard.querySelectorAll('input, button');
    controls.forEach(control => {
        control.disabled = !enabled;
    });
}

// Update the number of squares without reshuffling existing ones
function updateSquareCount() {
    const newCount = parseInt(squareCountInput.value);
    const currentCount = squares.length;

    if (newCount > currentCount) {
        // Add new squares
        const squaresToAdd = newCount - currentCount;
        for (let i = 0; i < squaresToAdd; i++) {
            const square = generateSingleSquare();
            squares.push(square);
        }
    } else if (newCount < currentCount) {
        // Remove extra squares
        squares.splice(newCount);
    }

    draw();
}

// Adjust the sizes of existing squares based on new min/max values
function adjustSquareSizes() {
    const minSize = parseInt(minSizeInput.value * 10);
    const maxSize = parseInt(maxSizeInput.value * 10);

    squares.forEach(square => {
        const height = getRandomInt(minSize, maxSize);
        const width = Math.floor(height * 0.66); // Width is 66% of height
        square.width = width;
        square.height = height;
    });

    draw();
}

// Generate a new square with random position and size
function generateSingleSquare() {
    const minSize = parseInt(minSizeInput.value * 10);
    const maxSize = parseInt(maxSizeInput.value * 10);
    const height = getRandomInt(minSize, maxSize);
    const width = Math.floor(height * 0.66); // Width is 66% of height

    let attempts = 0;
    const maxAttempts = 100; // Limit attempts to prevent infinite loops
    let x, y, newSquare;

    do {
        x = getRandomInt(0, canvas.width - width);
        y = getRandomInt(0, canvas.height - height);
        newSquare = { x, y, width, height, aspectRatio: width / height };

        // Check for overlap
        let overlap = false;
        for (let i = 0; i < squares.length; i++) {
            if (isOverlap(newSquare, squares[i])) {
                overlap = true;
                break;
            }
        }

        if (!overlap) {
            return newSquare;
        }

        attempts++;
    } while (attempts < maxAttempts);

    // If unable to find a non-overlapping position, return the square anyway
    return newSquare;
}

// Generate initial squares
function generateSquares() {
    if (!img.src) {
        // No image is loaded, do not generate squares
        squares = []; // Clear any existing squares
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        updateDashboardState(false); // Disable dashboard
        return;
    }

    updateDashboardState(true); // Enable dashboard

    squares = [];
    const count = parseInt(squareCountInput.value);

    for (let i = 0; i < count; i++) {
        const square = generateSingleSquare();
        squares.push(square);
    }

    draw();
}

// Function to check if two rectangles overlap
function isOverlap(rect1, rect2) {
    return !(
        rect1.x + rect1.width <= rect2.x ||
        rect1.x >= rect2.x + rect2.width ||
        rect1.y + rect1.height <= rect2.y ||
        rect1.y >= rect2.y + rect2.height
    );
}

// Draw the image and squares
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!img.src) {
        // No image is loaded, nothing to draw
        return;
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;

    squares.forEach(square => {
        ctx.strokeRect(square.x, square.y, square.width, square.height);
        // Removed the code that draws the resize handle
    });
}

// Copy image with squares to clipboard at original size
function copyImageToClipboard() {
    if (!img.src) {
        alert('No image to copy.');
        return;
    }

    // Create an off-screen canvas
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = originalImg.width;
    offscreenCanvas.height = originalImg.height;

    // Scale factor between displayed image and original
    const scaleX = originalImg.width / canvas.width;
    const scaleY = originalImg.height / canvas.height;

    // Draw the original image
    offscreenCtx.drawImage(originalImg, 0, 0);

    // Draw the squares scaled to the original image size
    offscreenCtx.strokeStyle = 'red';
    offscreenCtx.lineWidth = 2 * scaleX; // Adjust line width based on scale

    squares.forEach(square => {
        offscreenCtx.strokeRect(
            square.x * scaleX,
            square.y * scaleY,
            square.width * scaleX,
            square.height * scaleY
        );
    });

    offscreenCanvas.toBlob(blob => {
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
            // alert('Image copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy image: ', err);
            alert('Failed to copy image to clipboard.');
        });
    });
}

// Utility function to get random integer between min and max
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Initialize dashboard as disabled on page load
updateDashboardState(false);

// Handle mouse down event for dragging or resizing
function handleMouseDown(e) {
    if (!img.src) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if mouse is near the bottom-right corner for resizing
    for (let i = squares.length - 1; i >= 0; i--) {
        const square = squares[i];
        const resizeMargin = 10; // Area around the corner where resizing is allowed

        if (
            mouseX >= square.x + square.width - resizeMargin &&
            mouseX <= square.x + square.width + resizeMargin &&
            mouseY >= square.y + square.height - resizeMargin &&
            mouseY <= square.y + square.height + resizeMargin
        ) {
            resizing = true;
            resizeIndex = i;
            resizeStartX = mouseX;
            resizeStartY = mouseY;
            resizeStartWidth = square.width;
            resizeStartHeight = square.height;
            break;
        }
    }

    if (!resizing) {
        // Check if mouse is over a square for dragging
        for (let i = squares.length - 1; i >= 0; i--) {
            const square = squares[i];
            if (
                mouseX >= square.x &&
                mouseX <= square.x + square.width &&
                mouseY >= square.y &&
                mouseY <= square.y + square.height
            ) {
                dragging = true;
                dragIndex = i;
                offsetX = mouseX - square.x;
                offsetY = mouseY - square.y;
                break;
            }
        }
    }
}

// Handle mouse move event for dragging or resizing
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (resizing) {
        const square = squares[resizeIndex];
        const deltaX = mouseX - resizeStartX;
        const deltaY = mouseY - resizeStartY;

        // Adjust the width and height while maintaining aspect ratio
        let newWidth = resizeStartWidth + deltaX;
        let newHeight = resizeStartHeight + deltaY;

        // Ensure minimum size
        const minSize = parseInt(minSizeInput.value * 10);
        const maxSize = parseInt(maxSizeInput.value * 10);

        newHeight = Math.max(minSize, Math.min(newHeight, maxSize));
        newWidth = newHeight * square.aspectRatio;

        // Ensure the square stays within canvas bounds
        newWidth = Math.min(newWidth, canvas.width - square.x);
        newHeight = Math.min(newHeight, canvas.height - square.y);

        square.width = newWidth;
        square.height = newHeight;

        draw();
    } else if (dragging) {
        const square = squares[dragIndex];
        square.x = mouseX - offsetX;
        square.y = mouseY - offsetY;

        // Ensure the square stays within canvas bounds
        square.x = Math.max(0, Math.min(square.x, canvas.width - square.width));
        square.y = Math.max(0, Math.min(square.y, canvas.height - square.height));

        draw();
    } else {
        // Change cursor when hovering over resize area or square
        let cursorStyle = 'default';

        for (let i = squares.length - 1; i >= 0; i--) {
            const square = squares[i];
            const resizeMargin = 10; // Area around the corner where resizing is allowed

            // Check for resize area hover
            if (
                mouseX >= square.x + square.width - resizeMargin &&
                mouseX <= square.x + square.width + resizeMargin &&
                mouseY >= square.y + square.height - resizeMargin &&
                mouseY <= square.y + square.height + resizeMargin
            ) {
                cursorStyle = 'nwse-resize';
                break;
            }
            // Check for square hover
            else if (
                mouseX >= square.x &&
                mouseX <= square.x + square.width &&
                mouseY >= square.y &&
                mouseY <= square.y + square.height
            ) {
                cursorStyle = 'move';
                break;
            }
        }

        canvas.style.cursor = cursorStyle;
    }
}

// Handle mouse up and mouse leave events
function stopAction() {
    dragging = false;
    resizing = false;
    dragIndex = -1;
    resizeIndex = -1;
}
