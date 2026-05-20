function getMaxPositionOffsets() {
    if (!userImage) return { maxX: 0, maxY: 0 };

    const imgWidth = userImage.width;
    const imgHeight = userImage.height;
    const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
    const imgRatio = imgWidth / imgHeight;
    const dragMultiplier = config ? config.controls.position.dragMultiplier : 5;

    let minScaleFactor;
    if (imgRatio > canvasRatio) {
        minScaleFactor = CANVAS_HEIGHT / imgHeight;
    } else {
        minScaleFactor = CANVAS_WIDTH / imgWidth;
    }

    const zoomMultiplier = 1 + (settings.zoom / 100);
    const actualScaleFactor = minScaleFactor * zoomMultiplier;
    const drawWidth = imgWidth * actualScaleFactor;
    const drawHeight = imgHeight * actualScaleFactor;
    const xOverhang = Math.max(0, (drawWidth - CANVAS_WIDTH) / 2);
    const yOverhang = Math.max(0, (drawHeight - CANVAS_HEIGHT) / 2);

    return { maxX: xOverhang / dragMultiplier, maxY: yOverhang / dragMultiplier };
}

function constrainPosition() {
    const { maxX, maxY } = getMaxPositionOffsets();
    settings.xPos = Math.max(-maxX, Math.min(maxX, settings.xPos));
    settings.yPos = Math.max(-maxY, Math.min(maxY, settings.yPos));
}

function getCanvasScaleFactor() {
    return canvas.width / canvas.clientWidth;
}

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener('mousedown', function(e) {
    if (!userImage) return;
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', function(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    const scaleFactor = getCanvasScaleFactor();

    settings.xPos += deltaX / scaleFactor;
    settings.yPos += deltaY / scaleFactor;
    constrainPosition();

    document.getElementById('xPosSlider').value = settings.xPos;
    document.getElementById('yPosSlider').value = settings.yPos;
    document.getElementById('xPosValue').textContent = Math.round(settings.xPos);
    document.getElementById('yPosValue').textContent = Math.round(settings.yPos);

    redrawCanvas();

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

window.addEventListener('mouseup', function() {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'move';
    }
});

window.addEventListener('mouseleave', function() {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'move';
    }
});
