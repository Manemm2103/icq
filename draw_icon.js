const { createCanvas } = require('canvas');
const fs = require('fs');

const size = 512;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Draw background (ICQ Green)
ctx.fillStyle = '#4CAF50';
ctx.fillRect(0, 0, size, size);

// Draw chat bubble
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.moveTo(100, 100);
ctx.lineTo(412, 100);
ctx.arcTo(452, 100, 452, 140, 40);
ctx.lineTo(452, 372);
ctx.arcTo(452, 412, 412, 412, 40);
ctx.lineTo(150, 412);
ctx.lineTo(100, 480);
ctx.lineTo(100, 412);
ctx.arcTo(60, 412, 60, 372, 40);
ctx.lineTo(60, 140);
ctx.arcTo(60, 100, 100, 100, 40);
ctx.fill();

// Draw Text "ICQ"
ctx.fillStyle = '#4CAF50';
ctx.font = 'bold 120px sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('ICQ', size/2, size/2 - 20);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/icon.png', buffer);
fs.writeFileSync('public/apple-touch-icon.png', buffer); // Also save explicitly for iOS
console.log('Icons generated successfully.');
