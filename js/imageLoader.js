function loadPaperEffectImage() {
    paperEffectImage = new Image();
    paperEffectImage.onload = function() {
        redrawCanvas();
    };
    paperEffectImage.src = 'assets/PAPER EFFECT.png';
    paperEffectImage.onerror = function(e) {
        console.error('Error loading paper effect image:', e);
    };
}

function loadTracklistFlower() {
    tracklistFlowerImage = new Image();
    tracklistFlowerImage.onload = function() { redrawCanvas(); };
    tracklistFlowerImage.src = 'assets/drawings/flower.svg';
}

function loadTracklistDecorationLeft(filename) {
    tracklistDecorationLeftImage = new Image();
    tracklistDecorationLeftImage.onload = function() { redrawCanvas(); };
    tracklistDecorationLeftImage.src = 'assets/drawings/' + encodeURIComponent(filename);
}

function loadTracklistDecorationRight(filename) {
    tracklistDecorationRightImage = new Image();
    tracklistDecorationRightImage.onload = function() { redrawCanvas(); };
    tracklistDecorationRightImage.src = 'assets/drawings/' + encodeURIComponent(filename);
}

function loadDrawingImage(filename) {
    drawingImage = new Image();
    drawingImage.onload = function() { redrawCanvas(); };
    drawingImage.src = 'assets/drawings/' + encodeURIComponent(filename);
}

function loadTitleImage() {
    titleImage = new Image();
    titleImage.onload = function() {
        redrawCanvas();
    };
    titleImage.src = 'assets/Text Title.svg';
    titleImage.onerror = function(e) {
        console.error('Error loading title SVG:', e);
    };
}

function loadTitleImage2() {
    titleImage2 = new Image();
    titleImage2.onload = function() {
        redrawCanvas();
    };
    titleImage2.src = 'assets/Text Title 2.svg';
    titleImage2.onerror = function(e) {
        console.error('Error loading title 2 SVG:', e);
    };
}

function loadUserImage(src) {
    const img = new Image();
    img.onload = function() {
        userImage = img;
        document.getElementById('zoomSlider').value = 0;
        document.getElementById('zoomValue').textContent = '0%';
        document.getElementById('xPosSlider').value = 0;
        document.getElementById('xPosValue').textContent = '0';
        document.getElementById('yPosSlider').value = 0;
        document.getElementById('yPosValue').textContent = '0';
        settings.zoom = 0;
        settings.xPos = 0;
        settings.yPos = 0;
        calculateInitialZoom();
        redrawCanvas();
    };
    img.src = src;
}

function calculateInitialZoom() {
    if (!userImage) return;
    const zoomSlider = document.getElementById('zoomSlider');
    zoomSlider.min = 0;
    const initialZoomPercent = config ? config.image.initialZoomFactor : 5;
    zoomSlider.value = initialZoomPercent;
    document.getElementById('zoomValue').textContent = initialZoomPercent + '%';
    settings.zoom = initialZoomPercent;
}
