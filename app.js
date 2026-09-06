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
        loadTracklistFlower();

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
function setExportStatus(message, clearAfter) {
    const exportStatus = document.getElementById('exportStatus');
    exportStatus.textContent = message;
    if (clearAfter) {
        setTimeout(() => {
            if (exportStatus.textContent === message) exportStatus.textContent = "";
        }, clearAfter);
    }
}

function getExportFileName() {
    return (document.getElementById('fileName').value || "image") + '.png';
}

// Canvas -> Blob. Blobs are far more reliable than data URLs on mobile, where
// multi-megabyte data: URLs are often silently dropped by the browser.
function getCanvasBlob(onBlob, onError) {
    if (!titleImage || !titleImage.complete) {
        onError(new Error("Title image not loaded. Try again."));
        return;
    }
    try {
        canvas.toBlob(function(blob) {
            if (blob) {
                onBlob(blob);
            } else {
                onError(new Error("Could not generate the image."));
            }
        }, 'image/png');
    } catch (err) {
        onError(err);
    }
}

document.getElementById('exportBtn').addEventListener('click', function() {
    setExportStatus("Preparing download...");

    getCanvasBlob(function(blob) {
        const fileName = getExportFileName();

        // On mobile the share sheet ("Save Image" / "Save to Photos") is the only
        // reliable way to get a file onto the device, so prefer it when available.
        if (navigator.canShare && navigator.share) {
            let file = null;
            try {
                file = new File([blob], fileName, { type: 'image/png' });
            } catch (err) {
                file = null;
            }
            if (file && navigator.canShare({ files: [file] })) {
                navigator.share({ files: [file] })
                    .then(() => setExportStatus("Image saved or shared!", 3000))
                    .catch((err) => {
                        if (err && err.name === 'AbortError') {
                            setExportStatus("");
                        } else {
                            downloadBlob(blob, fileName);
                        }
                    });
                return;
            }
        }

        downloadBlob(blob, fileName);
    }, function(err) {
        console.error("Export error:", err);
        setExportStatus("Error exporting: " + err.message);
    });
});

function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Give the browser time to start the download before dropping the object URL.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    setExportStatus("Download started. If nothing happened, use \u201cOpen Image in New Tab\u201d below.", 8000);
}

// Backup for browsers (mainly older mobile Safari) that ignore the download attribute.
document.getElementById('openTabBtn').addEventListener('click', function() {
    // The tab must be opened synchronously inside the click handler, otherwise
    // popup blockers reject it once toBlob's callback fires.
    const newTab = window.open('', '_blank');

    setExportStatus("Opening image...");

    getCanvasBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        if (newTab && !newTab.closed) {
            newTab.location.href = url;
            setExportStatus("Image opened in a new tab \u2014 press and hold it to save.", 8000);
        } else {
            // Popup blocked: fall back to navigating this tab.
            setExportStatus("Pop-up blocked \u2014 opening the image here instead. Use the back button to return.", 8000);
            window.location.href = url;
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, function(err) {
        console.error("Open in new tab error:", err);
        if (newTab && !newTab.closed) newTab.close();
        setExportStatus("Error opening image: " + err.message);
    });
});

// Tracklist row management
function updateTracklistState() {
    settings.tracklistItems = [];
    document.querySelectorAll('#tracklistRows .tracklist-row').forEach(function(row) {
        settings.tracklistItems.push({
            artist: row.querySelector('.tracklist-artist').value,
            track: row.querySelector('.tracklist-track').value,
        });
    });
}

function addTracklistRow() {
    const container = document.getElementById('tracklistRows');
    const row = document.createElement('div');
    row.className = 'tracklist-row';
    row.innerHTML =
        '<input type="text" class="tracklist-track" placeholder="Track Title">' +
        '<input type="text" class="tracklist-artist" placeholder="Artist">';
    container.appendChild(row);
}

document.getElementById('tracklistRows').addEventListener('input', function(e) {
    if (!e.target.matches('.tracklist-artist, .tracklist-track')) return;
    updateTracklistState();

    const rows = document.querySelectorAll('#tracklistRows .tracklist-row');
    const lastRow = rows[rows.length - 1];
    const lastHasContent = Array.from(lastRow.querySelectorAll('input')).some(function(i) { return i.value.trim(); });
    if (lastHasContent) addTracklistRow();

    redrawCanvas();
});

loadConfig();
