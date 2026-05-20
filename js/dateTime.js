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
