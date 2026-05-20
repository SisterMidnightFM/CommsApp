function redrawCanvas() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.letterSpacing = '-0.05em';

    if (currentMode === 'smfm-template' || currentMode === 'tracklist') {
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

    const activeTitleImage = currentMode === 'smfm-template' ? titleImage2
                           : currentMode === 'tracklist' ? null
                           : titleImage;
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

    let tracklistHeaderBottom = 30;

    if (settings.showName) {
        const margin = 30;
        const availableWidth = CANVAS_WIDTH - margin * 2;
        let fontSize = fitTextToWidth(ctx, settings.showName.toUpperCase(), availableWidth, showNameFont);

        if (currentMode === 'tracklist') {
            ctx.font = `${fontSize}pt ${showNameFont}`;
            ctx.textBaseline = 'top';
            ctx.fillText(settings.showName.toUpperCase(), CANVAS_WIDTH / 2, margin);
            const m = ctx.measureText(settings.showName.toUpperCase());
            tracklistHeaderBottom = margin + m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + 10;
        } else {
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
        }

        ctx.textBaseline = 'alphabetic';
    }

    if (currentMode === 'tracklist') {
        const trackFont = 'FOSSModern';
        const validItems = (settings.tracklistItems || []).filter(function(item) { return item.artist || item.track; });
        const ptToPx = 4 / 3;

        const contentTop = 250;
        const contentBottom = CANVAS_HEIGHT - 160;
        const availableHeight = contentBottom - contentTop;

        const colMargin = 40;
        const flowerCenterX = CANVAS_WIDTH / 2;

        // Measure effective line count at max font size (48pt) so wraps are factored
        // into the shrink decision before committing to a font size
        ctx.font = `48pt ${trackFont}`;
        const maxFlowerSize = (48 * ptToPx) * 0.7;
        const maxFlowerGap = maxFlowerSize * 0.5;
        const maxColMaxWidth = flowerCenterX - maxFlowerSize / 2 - maxFlowerGap - colMargin;
        const effectiveLineCount = validItems.reduce(function(total, item) {
            const artist = item.artist.trim();
            const track = item.track.trim();
            if (artist && track && tracklistFlowerImage) {
                const tl = splitTextToLines(ctx, track, maxColMaxWidth);
                const al = splitTextToLines(ctx, artist, maxColMaxWidth);
                return total + Math.max(tl.length, al.length);
            }
            return total + 1;
        }, 0);

        const trackFontSize = effectiveLineCount * (48 * ptToPx) * 1.25 > availableHeight
            ? Math.floor(availableHeight / (effectiveLineCount * ptToPx * 1.25))
            : 48;

        ctx.font = `${trackFontSize}pt ${trackFont}`;
        ctx.fillStyle = activeTextColor;
        ctx.textBaseline = 'top';

        const textHeight = trackFontSize * ptToPx;
        const lineHeight = textHeight * 1.25;

        // Flower separator dimensions
        const flowerSize = textHeight * 0.7;
        const flowerGap = flowerSize * 0.5;

        // Fixed center-split columns: flower always at canvas center,
        // track right-aligns to its left, artist left-aligns to its right
        const trackEndX = flowerCenterX - flowerSize / 2 - flowerGap;
        const artistStartX = flowerCenterX + flowerSize / 2 + flowerGap;
        const colMaxWidth = trackEndX - colMargin;

        // Pass 1: pre-compute wrapped lines for each row
        const rowData = validItems.map(function(item) {
            const artist = item.artist.trim();
            const track = item.track.trim();
            if (artist && track && tracklistFlowerImage) {
                const trackLines = splitTextToLines(ctx, track, colMaxWidth);
                const artistLines = splitTextToLines(ctx, artist, colMaxWidth);
                return { trackLines, artistLines, isSplit: true };
            }
            return { singleText: artist || track, isSplit: false };
        });

        // Row height = tallest column * lineHeight (so next track positions correctly)
        const rowHeights = rowData.map(function(row) {
            if (!row.isSplit) return lineHeight;
            return Math.max(row.trackLines.length, row.artistLines.length) * lineHeight;
        });

        const totalTracklistHeight = rowHeights.reduce(function(a, b) { return a + b; }, 0);
        const midY = (contentTop + contentBottom) / 2;
        let currentY = midY - totalTracklistHeight / 2;

        // Pass 2: render
        rowData.forEach(function(row, i) {
            if (!row.isSplit) {
                const textW = ctx.measureText(row.singleText).width;
                ctx.textAlign = 'left';
                ctx.fillText(row.singleText, (CANVAS_WIDTH - textW) / 2, currentY);
            } else {
                // Track: right-aligned, wraps downward
                ctx.textAlign = 'right';
                row.trackLines.forEach(function(line, li) {
                    ctx.fillText(line, trackEndX, currentY + li * lineHeight);
                });

                // Artist: left-aligned, wraps downward independently
                ctx.textAlign = 'left';
                row.artistLines.forEach(function(line, li) {
                    ctx.fillText(line, artistStartX, currentY + li * lineHeight);
                });

                // Flower: fixed center, vertically aligned with first line
                const flowerX = flowerCenterX - flowerSize / 2;
                const flowerY = currentY + (textHeight - flowerSize) / 2;
                const fTmp = document.createElement('canvas');
                fTmp.width = CANVAS_WIDTH;
                fTmp.height = CANVAS_HEIGHT;
                const fCtx = fTmp.getContext('2d');
                fCtx.drawImage(tracklistFlowerImage, flowerX, flowerY, flowerSize, flowerSize);
                fCtx.globalCompositeOperation = 'source-in';
                fCtx.fillStyle = activeTextColor;
                fCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.drawImage(fTmp, 0, 0);
            }

            currentY += rowHeights[i];
        });

        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'center';
    }

    if (currentMode === 'tracklist') {
        const footerFont = 'SisterMidnight';
        const footerFontSize = 38;
        ctx.font = `${footerFontSize}pt ${footerFont}`;
        ctx.fillStyle = activeTextColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const footerMargin = 35;
        const ptToPx = 4 / 3;
        const lineGap = footerFontSize * ptToPx * 1.4;

        ctx.fillText('radio.sistermidnight.org', CANVAS_WIDTH / 2, CANVAS_HEIGHT - footerMargin);
        ctx.fillText('listen back on', CANVAS_WIDTH / 2, CANVAS_HEIGHT - footerMargin - lineGap);

        ctx.textBaseline = 'alphabetic';

        const blockBottom = CANVAS_HEIGHT - footerMargin;
        const blockTop = blockBottom - lineGap - footerFontSize * ptToPx;
        const blockH = blockBottom - blockTop;

        if (!settings.tracklistDrawingsHidden) [tracklistDecorationLeftImage, tracklistDecorationRightImage].forEach(function(img, idx) {
            if (!img) return;
            const aspect = img.naturalWidth / img.naturalHeight;
            let dw, dh;
            if (aspect >= 1) { dw = blockH; dh = blockH / aspect; }
            else { dh = blockH; dw = blockH * aspect; }
            const x = idx === 0 ? footerMargin : CANVAS_WIDTH - footerMargin - dw;
            const y = blockTop + (blockH - dh) / 2;
            const tmp = document.createElement('canvas');
            tmp.width = CANVAS_WIDTH;
            tmp.height = CANVAS_HEIGHT;
            const tCtx = tmp.getContext('2d');
            tCtx.drawImage(img, x, y, dw, dh);
            tCtx.globalCompositeOperation = 'source-in';
            tCtx.fillStyle = activeTextColor;
            tCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.drawImage(tmp, 0, 0);
        });
    }

    if (settings.showDate && (currentMode === 'smfm-template' || currentMode === 'tracklist')) {
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

        let date;
        if (currentMode === 'tracklist') {
            const dateOnlyVal = document.getElementById('showDateOnly').value;
            if (dateOnlyVal) date = new Date(dateOnlyVal + 'T12:00:00');
        } else {
            date = new Date(getShowDateValue());
        }

        if (date && !isNaN(date.getTime())) {
            const dayName = days[date.getDay()];
            const dayNum = date.getDate();
            const v = dayNum % 100;
            const ordinal = ['th','st','nd','rd'][(v - 20) % 10] || ['th','st','nd','rd'][v] || 'th';
            const dateStr = `${dayNum}${ordinal} ${months[date.getMonth()]}`;

            const dateTimeFont = config ? config.fonts.dateTimeFont : 'Font2';
            ctx.font = `20pt ${dateTimeFont}`;
            ctx.fillStyle = activeTextColor;
            const margin = 35;

            if (currentMode === 'tracklist') {
                const year = date.getFullYear();
                ctx.textBaseline = 'top';
                const dateY = tracklistHeaderBottom;
                ctx.textAlign = 'left';
                ctx.fillText(dayName, margin, dateY);
                ctx.textAlign = 'center';
                ctx.fillText(`${dayNum}${ordinal} ${months[date.getMonth()]}`, CANVAS_WIDTH / 2, dateY);
                ctx.textAlign = 'right';
                ctx.fillText(year, CANVAS_WIDTH - margin, dateY);
            } else {
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
                    timeDisplay = startPeriod === endPeriod
                        ? `${startTimeStr}-${endTimeStr}${startPeriod}`
                        : `${startTimeStr}${startPeriod}-${endTimeStr}${endPeriod}`;
                } else {
                    const hour = date.getHours();
                    const min = date.getMinutes();
                    const period = hour >= 12 ? 'pm' : 'am';
                    const hour12 = hour % 12 || 12;
                    timeDisplay = min > 0 ? `${hour12}.${String(min).padStart(2, '0')}${period}` : `${hour12}${period}`;
                }
                ctx.textBaseline = 'bottom';
                const bottomY = CANVAS_HEIGHT - margin;
                ctx.textAlign = 'left';
                ctx.fillText(timeDisplay, margin, bottomY);
                ctx.textAlign = 'center';
                ctx.fillText(dayName, CANVAS_WIDTH / 2, bottomY);
                ctx.textAlign = 'right';
                ctx.fillText(dateStr, CANVAS_WIDTH - margin, bottomY);
            }

            ctx.textBaseline = 'alphabetic';
        }
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

function splitTextToLines(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
        const test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = words[i];
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
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
