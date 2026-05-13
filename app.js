// Populate the hour select (1–12)
(function() {
    const sel = document.getElementById('showHour');
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '--';
    sel.appendChild(blank);
    for (let h = 1; h <= 12; h++) {
        const opt = document.createElement('option');
        opt.value = String(h);
        opt.textContent = h;
        sel.appendChild(opt);
    }
})();

function getShowDateValue() {
    const dateVal = document.getElementById('showDateOnly').value;
    const hour12 = parseInt(document.getElementById('showHour').value);
    const minute = document.getElementById('showMinute').value;
    const ampm = document.getElementById('showAmPm').value;
    if (!dateVal || !hour12) return '';
    let hour24 = ampm === 'AM' ? (hour12 === 12 ? 0 : hour12) : (hour12 === 12 ? 12 : hour12 + 12);
    const hh = String(hour24).padStart(2, '0');
    return `${dateVal}T${hh}:${minute}`;
}

// Global variables
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

// Configuration object - will be loaded from config.json
let config = null;

// Standard Instagram size (fallback defaults)
let CANVAS_WIDTH = 1080;
let CANVAS_HEIGHT = 1350;

// Image holders
let userImage = null;
let titleImage = null;
let titleImage2 = null;
let paperEffectImage = null;
let drawingImage = null;
const paperEffectEnabled = true;

const DRAWINGS = [
    'cat.svg', 'dancers.svg', 'disco.svg', 'flower.svg', 'guitar.svg',
    'guitar 2.svg', 'hands.svg', 'moon.svg', 'plant.svg', 'potted plants.svg',
    'record.svg', 'record 2.svg', 'record 3.svg', 'saxophone.svg',
    'Stars.svg', 'sun.svg', 'trumpet.svg', 'turntable.svg'
];

// Current mode: 'artist-image' | 'smfm-template'
let currentMode = 'artist-image';

// Current settings
const settings = {
    zoom: 0,
    xPos: 0,
    yPos: 0,
    showName: '',
    artistName: '',
    showDate: '',
    showLength: '',
    textSize: 33,
    fontColor: 'white',
    textColor: '#ffffff',
    smfmTextColor: '#d14936',
    smfmBgColor: '#e7dfd9',
    smfmDrawing: null,
    drawingScale: 1.0,
};

// Load configuration file and initialize app
async function loadConfig() {
    try {
        // Cache-busting ensures fresh config on each load
        const response = await fetch('config.json?v=' + Date.now());
        config = await response.json();

        CANVAS_WIDTH = config.canvas.width;
        CANVAS_HEIGHT = config.canvas.height;
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        settings.textSize = config.textSizes.showNameDefault;
        settings.fontColor = config.colors.defaultFontColor;

        document.getElementById('zoomSlider').min = config.controls.zoom.min;
        document.getElementById('zoomSlider').max = config.controls.zoom.max;
        document.getElementById('zoomSlider').value = config.controls.zoom.default;

        document.getElementById('xPosSlider').min = config.controls.position.min;
        document.getElementById('xPosSlider').max = config.controls.position.max;
        document.getElementById('xPosSlider').value = config.controls.position.default;

        document.getElementById('yPosSlider').min = config.controls.position.min;
        document.getElementById('yPosSlider').max = config.controls.position.max;
        document.getElementById('yPosSlider').value = config.controls.position.default;

        loadTitleImage();
        loadTitleImage2();
        loadPaperEffectImage();

        initializeCanvas();
        updateFileName();

    } catch (error) {
        console.error('Error loading config:', error);
        alert('Error loading configuration file. Using default settings.');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        loadTitleImage();
        loadTitleImage2();
        loadPaperEffectImage();
        initializeCanvas();
        updateFileName();
    }
}

loadConfig();

// STAGE 1: Image Upload
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            loadUserImage(event.target.result);
        };
        reader.readAsDataURL(file);
    }
});

// STAGE 2: Adjust image
document.getElementById('zoomSlider').addEventListener('input', function(e) {
    settings.zoom = parseInt(e.target.value);
    document.getElementById('zoomValue').textContent = settings.zoom + '%';
    constrainPosition();
    document.getElementById('xPosSlider').value = settings.xPos;
    document.getElementById('xPosValue').textContent = Math.round(settings.xPos);
    document.getElementById('yPosSlider').value = settings.yPos;
    document.getElementById('yPosValue').textContent = Math.round(settings.yPos);
    redrawCanvas();
});

document.getElementById('xPosSlider').addEventListener('input', function(e) {
    settings.xPos = parseInt(e.target.value);
    constrainPosition();
    document.getElementById('xPosSlider').value = settings.xPos;
    document.getElementById('xPosValue').textContent = Math.round(settings.xPos);
    redrawCanvas();
});

document.getElementById('yPosSlider').addEventListener('input', function(e) {
    settings.yPos = parseInt(e.target.value);
    constrainPosition();
    document.getElementById('yPosSlider').value = settings.yPos;
    document.getElementById('yPosValue').textContent = Math.round(settings.yPos);
    redrawCanvas();
});

// STAGE 3: Text inputs
document.getElementById('showName').addEventListener('input', function(e) {
    settings.showName = e.target.value;
    updateFileName();
    redrawCanvas();
});

document.getElementById('artistName').addEventListener('input', function(e) {
    settings.artistName = e.target.value;
    redrawCanvas();
});

function onShowDateTimeChange() {
    const value = getShowDateValue();
    if (!value) return;
    const date = new Date(value);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    settings.showDate = date.toLocaleDateString('en-US', options);
    updateFileName();
    redrawCanvas();
}
document.getElementById('showDateOnly').addEventListener('change', onShowDateTimeChange);
document.getElementById('showHour').addEventListener('change', onShowDateTimeChange);
document.getElementById('showMinute').addEventListener('change', onShowDateTimeChange);
document.getElementById('showAmPm').addEventListener('change', onShowDateTimeChange);

document.getElementById('showLength').addEventListener('change', function(e) {
    settings.showLength = e.target.value;
    redrawCanvas();
});

// STAGE 4: Export
document.getElementById('exportBtn').addEventListener('click', function() {
    try {
        const exportStatus = document.getElementById('exportStatus');
        exportStatus.textContent = "Preparing download...";

        if (!titleImage || !titleImage.complete) {
            exportStatus.textContent = "Error: Title image not loaded. Try again.";
            return;
        }

        const fileName = document.getElementById('fileName').value || "image";
        const link = document.createElement('a');
        link.download = fileName + '.png';

        setTimeout(() => {
            try {
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                exportStatus.textContent = "Download complete!";
                setTimeout(() => { exportStatus.textContent = ""; }, 3000);
            } catch (err) {
                console.error("Export error:", err);
                exportStatus.textContent = "Error exporting: " + err.message;
            }
        }, 100);
    } catch (err) {
        console.error("Export setup error:", err);
        document.getElementById('exportStatus').textContent = "Error setting up export: " + err.message;
    }
});


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

function switchMode(mode) {
    currentMode = mode;

    const artistCard = document.getElementById('modeArtistImage');
    const smfmCard = document.getElementById('modeSMFMTemplate');
    const stageUpload = document.getElementById('stageUpload');
    const stageBgColor = document.getElementById('stageBgColor');
    const stageDrawing = document.getElementById('stageDrawing');
    const stageColour = document.getElementById('stageColour');
    const stage2 = document.getElementById('stage2');
    const dateTimeFields = document.getElementById('dateTimeFields');

    if (mode === 'artist-image') {
        artistCard.classList.add('active');
        smfmCard.classList.remove('active');
        stageUpload.classList.remove('hidden');
        stageBgColor.classList.add('hidden');
        stageDrawing.classList.add('hidden');
        stageColour.classList.remove('hidden');
        stage2.classList.remove('hidden');
        dateTimeFields.classList.add('hidden');
        document.querySelector('#stageUpload .stage-title').textContent = 'Stage 2: Upload Image';
        document.querySelector('#stage2 .stage-title').textContent = 'Stage 3: Adjust Image';
        document.querySelector('#stage3 .stage-title').textContent = 'Stage 4: Show Details';
        document.querySelector('#stageColour .stage-title').textContent = 'Stage 5: Choose Colour';
        document.querySelector('#stage4 .stage-title').textContent = 'Stage 6: Export';
    } else {
        smfmCard.classList.add('active');
        artistCard.classList.remove('active');
        stageUpload.classList.add('hidden');
        stageBgColor.classList.remove('hidden');
        stageDrawing.classList.remove('hidden');
        stageColour.classList.add('hidden');
        stage2.classList.add('hidden');
        dateTimeFields.classList.remove('hidden');
        document.querySelector('#stageBgColor .stage-title').textContent = 'Stage 2: Colour';
        document.querySelector('#stageDrawing .stage-title').textContent = 'Stage 3: Drawing';
        document.querySelector('#stage3 .stage-title').textContent = 'Stage 4: Show Details';
        document.querySelector('#stage4 .stage-title').textContent = 'Stage 5: Export';
        if (!settings.smfmDrawing) {
            settings.smfmDrawing = DRAWINGS[Math.floor(Math.random() * DRAWINGS.length)];
            document.getElementById('drawingSelect').value = settings.smfmDrawing;
            loadDrawingImage(settings.smfmDrawing);
        }
    }

    redrawCanvas();
}

document.getElementById('modeArtistImage').addEventListener('click', function() {
    switchMode('artist-image');
});

document.getElementById('modeSMFMTemplate').addEventListener('click', function() {
    switchMode('smfm-template');
});

document.getElementById('drawingSelect').addEventListener('change', function(e) {
    settings.smfmDrawing = e.target.value;
    loadDrawingImage(settings.smfmDrawing);
});

document.getElementById('drawingSizeSlider').addEventListener('input', function(e) {
    settings.drawingScale = parseInt(e.target.value) / 100;
    document.getElementById('drawingSizeValue').textContent = e.target.value + '%';
    redrawCanvas();
});

document.getElementById('colourComboGrid').addEventListener('click', function(e) {
    const swatch = e.target.closest('.combo-swatch');
    if (!swatch) return;
    document.querySelectorAll('.combo-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    settings.smfmTextColor = swatch.dataset.text;
    settings.smfmBgColor = swatch.dataset.bg;
    redrawCanvas();
});

document.getElementById('stageColour').addEventListener('click', function(e) {
    const swatch = e.target.closest('.colour-swatch');
    if (!swatch) return;
    document.querySelectorAll('.colour-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    settings.textColor = swatch.dataset.colour;
    redrawCanvas();
});

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

function updateFileName() {
    let dateStr = "";
    if (getShowDateValue()) {
        const date = new Date(getShowDateValue());
        dateStr = date.toISOString().split('T')[0];
    }
    const sanitizedName = settings.showName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedDate = dateStr.replace(/[^a-zA-Z0-9]/g, '_');
    document.getElementById('fileName').value = sanitizedName + '_' + sanitizedDate;
}


function redrawCanvas() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.letterSpacing = '-0.05em';

    if (currentMode === 'smfm-template') {
        ctx.fillStyle = settings.smfmBgColor;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        const bgColor = config ? config.canvas.backgroundColor : '#000000';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (userImage) {
            const imgWidth = userImage.width;
            const imgHeight = userImage.height;
            const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
            const imgRatio = imgWidth / imgHeight;

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

            const dragMultiplier = config ? config.controls.position.dragMultiplier : 5;
            const xOffset = (CANVAS_WIDTH - drawWidth) / 2 + settings.xPos * dragMultiplier;
            const yOffset = (CANVAS_HEIGHT - drawHeight) / 2 + settings.yPos * dragMultiplier;

            ctx.drawImage(userImage, xOffset, yOffset, drawWidth, drawHeight);
        } else {
            const placeholderBg = config ? config.colors.placeholderBackground : '#eeeeee';
            const placeholderText = config ? config.colors.placeholderText : '#999999';
            const dateTimeFont = config ? config.fonts.dateTimeFont : 'Font2';

            ctx.fillStyle = placeholderBg;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = placeholderText;
            ctx.font = `24px ${dateTimeFont}`;
            ctx.textAlign = 'center';
            ctx.fillText('Upload an image to get started', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
    }

    if (drawingImage && currentMode === 'smfm-template') {
        const maxSize = Math.min(CANVAS_WIDTH * 0.55, CANVAS_HEIGHT * 0.55) * settings.drawingScale;
        const imgRatio = drawingImage.naturalWidth / drawingImage.naturalHeight;
        let drawW, drawH;
        if (imgRatio >= 1) {
            drawW = maxSize;
            drawH = maxSize / imgRatio;
        } else {
            drawH = maxSize;
            drawW = maxSize * imgRatio;
        }
        const drawX = (CANVAS_WIDTH - drawW) / 2;
        const drawY = (CANVAS_HEIGHT - drawH) / 2;

        const dTmp = document.createElement('canvas');
        dTmp.width = CANVAS_WIDTH;
        dTmp.height = CANVAS_HEIGHT;
        const dCtx = dTmp.getContext('2d');
        dCtx.drawImage(drawingImage, drawX, drawY, drawW, drawH);
        dCtx.globalCompositeOperation = 'source-in';
        dCtx.fillStyle = settings.smfmTextColor;
        dCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(dTmp, 0, 0);
    }

    const activeTitleImage = currentMode === 'smfm-template' ? titleImage2 : titleImage;
    if (activeTitleImage) {
        const margin = 30;
        const drawWidth = CANVAS_WIDTH - margin * 2;
        const drawHeight = activeTitleImage.naturalWidth > 0
            ? drawWidth * (activeTitleImage.naturalHeight / activeTitleImage.naturalWidth)
            : 36;
        const tintColor = currentMode === 'artist-image' ? settings.textColor : settings.smfmTextColor;
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = CANVAS_WIDTH;
        tmpCanvas.height = CANVAS_HEIGHT;
        const tmpCtx = tmpCanvas.getContext('2d');
        tmpCtx.drawImage(activeTitleImage, margin, margin, drawWidth, drawHeight);
        tmpCtx.globalCompositeOperation = 'source-in';
        tmpCtx.fillStyle = tintColor;
        tmpCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(tmpCanvas, 0, 0);
    }

    const activeTextColor = currentMode === 'artist-image' ? settings.textColor : settings.smfmTextColor;
    const showNameFont = config ? config.fonts.showNameFont : 'CustomFont';
    ctx.fillStyle = activeTextColor;
    ctx.textAlign = 'center';

    if (settings.showName) {
        const margin = 30;
        const availableWidth = CANVAS_WIDTH - margin * 2;
        let fontSize = fitTextToWidth(ctx, settings.showName.toUpperCase(), availableWidth, showNameFont);
        if (currentMode === 'smfm-template') fontSize = Math.min(fontSize, 150);
        ctx.font = `${fontSize}pt ${showNameFont}`;
        ctx.textBaseline = 'bottom';
        const showNameY = currentMode === 'smfm-template' ? CANVAS_HEIGHT - 65 : CANVAS_HEIGHT - margin;
        ctx.fillText(settings.showName.toUpperCase(), CANVAS_WIDTH / 2, showNameY);

        if (settings.artistName) {
            const showNameMetrics = ctx.measureText(settings.showName.toUpperCase());
            const showNameTop = showNameY - showNameMetrics.actualBoundingBoxAscent;
            ctx.font = `60pt ${showNameFont}`;
            ctx.fillText('w/ ' + settings.artistName, CANVAS_WIDTH / 2, showNameTop - 3);
        }

        ctx.textBaseline = 'alphabetic';
    }

    if (settings.showDate && currentMode === 'smfm-template') {
        const date = new Date(getShowDateValue());

        let timeDisplay;
        if (settings.showLength) {
            const startDate = new Date(date);
            const endDate = new Date(date.getTime() + parseInt(settings.showLength) * 60000);

            const startHour = startDate.getHours();
            const startMin = startDate.getMinutes();
            const startPeriod = startHour >= 12 ? 'pm' : 'am';
            const startHour12 = startHour % 12 || 12;
            const startTimeStr = startMin > 0 ? `${startHour12}.${String(startMin).padStart(2, '0')}` : `${startHour12}`;

            const endHour = endDate.getHours();
            const endMin = endDate.getMinutes();
            const endPeriod = endHour >= 12 ? 'pm' : 'am';
            const endHour12 = endHour % 12 || 12;
            const endTimeStr = endMin > 0 ? `${endHour12}.${String(endMin).padStart(2, '0')}` : `${endHour12}`;

            if (startPeriod === endPeriod) {
                timeDisplay = `${startTimeStr}-${endTimeStr}${startPeriod}`;
            } else {
                timeDisplay = `${startTimeStr}${startPeriod}-${endTimeStr}${endPeriod}`;
            }
        } else {
            const hour = date.getHours();
            const min = date.getMinutes();
            const period = hour >= 12 ? 'pm' : 'am';
            const hour12 = hour % 12 || 12;
            timeDisplay = min > 0 ? `${hour12}.${String(min).padStart(2, '0')}${period}` : `${hour12}${period}`;
        }

        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const dayName = days[date.getDay()];

        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const dayNum = date.getDate();
        const v = dayNum % 100;
        const ordinal = ['th','st','nd','rd'][(v - 20) % 10] || ['th','st','nd','rd'][v] || 'th';
        const dateStr = `${dayNum}${ordinal} ${months[date.getMonth()]}`;

        const dateTimeFont = config ? config.fonts.dateTimeFont : 'Font2';
        ctx.font = `20pt ${dateTimeFont}`;
        ctx.fillStyle = activeTextColor;
        ctx.textBaseline = 'bottom';
        const margin = 35;
        const bottomY = CANVAS_HEIGHT - margin;

        ctx.textAlign = 'left';
        ctx.fillText(timeDisplay, margin, bottomY);

        ctx.textAlign = 'center';
        ctx.fillText(dayName, CANVAS_WIDTH / 2, bottomY);

        ctx.textAlign = 'right';
        ctx.fillText(dateStr, CANVAS_WIDTH - margin, bottomY);

        ctx.textBaseline = 'alphabetic';
    }

    if (paperEffectImage && paperEffectEnabled) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(paperEffectImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.globalCompositeOperation = 'source-over';
    }

}

function fitTextToWidth(context, text, maxWidth, fontName) {
    let low = 1, high = 400;
    while (low < high - 1) {
        const mid = Math.floor((low + high) / 2);
        context.font = `${mid}pt ${fontName}`;
        if (context.measureText(text).width <= maxWidth) {
            low = mid;
        } else {
            high = mid;
        }
    }
    return low;
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let yPos = y;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = context.measureText(testLine).width;

        if (testWidth > maxWidth && i > 0) {
            context.fillText(line, x, yPos);
            line = words[i] + ' ';
            yPos += lineHeight;
        } else {
            line = testLine;
        }
    }

    context.fillText(line, x, yPos);
}

window.addEventListener('resize', function() {
    redrawCanvas();
});

function initializeCanvas() {
    const placeholderBg = config ? config.colors.placeholderBackground : '#eeeeee';
    const placeholderText = config ? config.colors.placeholderText : '#999999';
    const dateTimeFont = config ? config.fonts.dateTimeFont : 'Font2';

    ctx.fillStyle = placeholderBg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = placeholderText;
    ctx.font = `24px ${dateTimeFont}`;
    ctx.textAlign = 'center';
    ctx.fillText('Upload an image to get started', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    redrawCanvas();
}

// Drag to reposition image
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

function getCanvasScaleFactor() {
    return canvas.width / canvas.clientWidth;
}

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
