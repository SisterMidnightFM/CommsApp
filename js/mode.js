const TRACKLIST_DRAWINGS = [
    'cat.svg', 'disco.svg', 'flower.svg', 'guitar 2.svg',
    'moon.svg', 'plant.svg', 'Stars.svg', 'sun.svg'
];

function randomiseTracklistDrawings() {
    const drawing = TRACKLIST_DRAWINGS[Math.floor(Math.random() * TRACKLIST_DRAWINGS.length)];
    settings.tracklistDrawingLeft = drawing;
    settings.tracklistDrawingRight = drawing;
    loadTracklistDecorationLeft(drawing);
    loadTracklistDecorationRight(drawing);
}

function switchMode(mode) {
    currentMode = mode;

    const artistCard = document.getElementById('modeArtistImage');
    const smfmCard = document.getElementById('modeSMFMTemplate');
    const tracklistCard = document.getElementById('modeTracklist');
    const stageUpload = document.getElementById('stageUpload');
    const stageBgColor = document.getElementById('stageBgColor');
    const stageDrawing = document.getElementById('stageDrawing');
    const stageTracklist = document.getElementById('stageTracklist');
    const stageColour = document.getElementById('stageColour');
    const stage2 = document.getElementById('stage2');
    const dateTimeFields = document.getElementById('dateTimeFields');
    const showTimeSection = document.getElementById('showTimeSection');
    const artistNameSection = document.getElementById('artistNameSection');
    const tracklistDecorationsSection = document.getElementById('tracklistDecorationsSection');

    if (mode === 'artist-image') {
        artistCard.classList.add('active');
        smfmCard.classList.remove('active');
        tracklistCard.classList.remove('active');
        stageUpload.classList.remove('hidden');
        stageBgColor.classList.add('hidden');
        stageDrawing.classList.add('hidden');
        stageTracklist.classList.add('hidden');
        stageColour.classList.remove('hidden');
        stage2.classList.remove('hidden');
        dateTimeFields.classList.add('hidden');
        showTimeSection.classList.remove('hidden');
        artistNameSection.classList.remove('hidden');
        tracklistDecorationsSection.classList.add('hidden');
        document.querySelector('#stageUpload .stage-title').textContent = 'Stage 2: Upload Image';
        document.querySelector('#stage2 .stage-title').textContent = 'Stage 3: Adjust Image';
        document.querySelector('#stage3 .stage-title').textContent = 'Stage 4: Show Details';
        document.querySelector('#stageColour .stage-title').textContent = 'Stage 5: Choose Colour';
        document.querySelector('#stage4 .stage-title').textContent = 'Stage 6: Export';
    } else if (mode === 'tracklist') {
        tracklistCard.classList.add('active');
        artistCard.classList.remove('active');
        smfmCard.classList.remove('active');
        stageUpload.classList.add('hidden');
        stageBgColor.classList.remove('hidden');
        stageDrawing.classList.add('hidden');
        stageTracklist.classList.remove('hidden');
        stageColour.classList.add('hidden');
        stage2.classList.add('hidden');
        dateTimeFields.classList.remove('hidden');
        showTimeSection.classList.add('hidden');
        artistNameSection.classList.add('hidden');
        tracklistDecorationsSection.classList.remove('hidden');
        document.querySelector('#stageBgColor .stage-title').textContent = 'Stage 2: Colour';
        document.querySelector('#stage3 .stage-title').textContent = 'Stage 3: Show Details';
        document.querySelector('#stageTracklist .stage-title').textContent = 'Stage 4: Tracklist';
        document.querySelector('#stage4 .stage-title').textContent = 'Stage 5: Export';
        settings.tracklistDrawingsHidden = false;
        document.getElementById('hideDrawingsBtn').textContent = 'Hide Drawings';
        if (!settings.tracklistDrawingLeft) randomiseTracklistDrawings();
    } else {
        smfmCard.classList.add('active');
        artistCard.classList.remove('active');
        tracklistCard.classList.remove('active');
        stageUpload.classList.add('hidden');
        stageBgColor.classList.remove('hidden');
        stageDrawing.classList.remove('hidden');
        stageTracklist.classList.add('hidden');
        stageColour.classList.add('hidden');
        stage2.classList.add('hidden');
        dateTimeFields.classList.remove('hidden');
        showTimeSection.classList.remove('hidden');
        artistNameSection.classList.remove('hidden');
        tracklistDecorationsSection.classList.add('hidden');
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

document.getElementById('modeTracklist').addEventListener('click', function() {
    switchMode('tracklist');
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

document.getElementById('randomiseDrawingsBtn').addEventListener('click', function() {
    randomiseTracklistDrawings();
});

document.getElementById('hideDrawingsBtn').addEventListener('click', function() {
    settings.tracklistDrawingsHidden = !settings.tracklistDrawingsHidden;
    this.textContent = settings.tracklistDrawingsHidden ? 'Show Drawings' : 'Hide Drawings';
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
