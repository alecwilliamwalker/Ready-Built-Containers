const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function rasterizeSVG(svgPath) {
  const svgData = fs.readFileSync(svgPath, 'utf8');
  const pngBuffer = await sharp(Buffer.from(svgData))
    .png({ quality: 95 })
    .toBuffer();
  return pngBuffer;
}

async function generateDeluxeHero() {
  try {
    const outputDir = path.join('public', 'images', 'models', 'heroes');
    await ensureDir(outputDir);

    const canvas = createCanvas(1200, 675);
    const ctx = canvas.getContext('2d');

    // Dawn river sky
    const dawnGradient = ctx.createLinearGradient(0, 0, 0, 675);
    dawnGradient.addColorStop(0, '#0a1a2e');
    dawnGradient.addColorStop(0.3, '#1e3a4a');
    dawnGradient.addColorStop(0.6, '#5b3a2a');
    dawnGradient.addColorStop(1, '#2d1a0f');
    ctx.fillStyle = dawnGradient;
    ctx.fillRect(0, 0, 1200, 675);

    // River
    ctx.fillStyle = '#1e2a3a';
    ctx.fillRect(200, 450, 800, 225);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(300 + i*80, 500 + Math.sin(i)*10, 100, 0, Math.PI*2);
      ctx.stroke();
    }

    // SVG raster
    const svgPath = path.join('public', 'images', 'models', 'deluxe-exterior.svg');
    const svgPngBuffer = await rasterizeSVG(svgPath);
    const svgImg = await loadImage(svgPngBuffer);
    ctx.drawImage(svgImg, 350, 180, 500, 280);

    // Awning
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(450, 320, 300, 80);
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(450, 320, 300, 80);

    // ATVs
    ctx.fillStyle = '#2a1a0f';
    ctx.beginPath();
    ctx.ellipse(250, 520, 60, 30, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillRect(200, 510, 100, 20);
    ctx.beginPath();
    ctx.ellipse(950, 530, 55, 28, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillRect(900, 520, 100, 20);

    // Mist
    const mist = ctx.createLinearGradient(0, 450, 0, 675);
    mist.addColorStop(0, 'rgba(255,255,255,0.1)');
    mist.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 450, 1200, 225);

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#000';
    ctx.fillRect(360, 460, 480, 25);
    ctx.restore();

    const canvasBuffer = canvas.toBuffer('image/png');
    const outputPath = path.join(outputDir, 'deluxe-hero.png');
    const optimized = await sharp(canvasBuffer)
      .resize(1200, 675, { fit: 'cover' })
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(outputPath, optimized);
    console.log(`✓ Deluxe hero saved: ${outputPath}`);
  } catch (error) {
    console.error('Deluxe error:', error.message);
  }
}

// Run
generateDeluxeHero();
