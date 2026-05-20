const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

let config = null;

let CANVAS_WIDTH = 1080;
let CANVAS_HEIGHT = 1350;

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

let currentMode = 'artist-image';

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
