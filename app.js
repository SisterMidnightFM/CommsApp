async function loadConfig() {
    try {
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

// Image upload
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

// Image position sliders
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

// Show details
document.getElementById('showName').addEventListener('input', function(e) {
    settings.showName = e.target.value;
    updateFileName();
    redrawCanvas();
});

document.getElementById('artistName').addEventListener('input', function(e) {
    settings.artistName = e.target.value;
    redrawCanvas();
});

document.getElementById('showLength').addEventListener('change', function(e) {
    settings.showLength = e.target.value;
    redrawCanvas();
});

// Export
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

loadConfig();
