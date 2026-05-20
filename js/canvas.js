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

window.addEventListener('resize', function() {
    redrawCanvas();
});
