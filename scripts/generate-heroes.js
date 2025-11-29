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

async function generateBasecamp20Hero() {
  try {
    const outputDir = path.join('public', 'images', 'models', 'heroes');
    await ensureDir(outputDir);

    const canvas = createCanvas(1200, 675);
    const ctx = canvas.getContext('2d');

    // Dusk cliff sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 675);
    skyGradient.addColorStop(0, '#1e0f1a');
    skyGradient.addColorStop(0.4, '#3d1f2b');
    skyGradient.addColorStop(0.7, '#6b3a2a');
    skyGradient.addColorStop(1, '#4a2e1e');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, 1200, 675);

    // Rocky pad
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(100, 450, 1000, 225);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `hsl(${20 + Math.random()*30}, 25%, ${20 + Math.random()*25}%)`;
      ctx.beginPath();
      ctx.ellipse(Math.random()*1100 + 100, 450 + Math.random()*225, 20 + Math.random()*40, 10 + Math.random()*20, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }

    // Raster SVG to PNG with sharp
    const svgPath = path.join('public', 'images', 'models', 'basecamp-20-exterior.svg');
    const svgPngBuffer = await rasterizeSVG(svgPath);
    const svgImg = await loadImage(svgPngBuffer);
    ctx.drawImage(svgImg, 380, 190, 440, 250);

    // Solar glint
    ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
    ctx.fillRect(430, 175, 320, 18);

    // Door glow
    const doorGlow = ctx.createRadialGradient(610, 360, 0, 610, 360, 70);
    doorGlow.addColorStop(0, 'rgba(255, 200, 100, 0.85)');
    doorGlow.addColorStop(0.6, 'rgba(255, 165, 0, 0.4)');
    doorGlow.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = doorGlow;
    ctx.fillRect(560, 310, 110, 140);

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = '#000';
    ctx.fillRect(390, 440, 420, 30);
    ctx.restore();

    const canvasBuffer = canvas.toBuffer('image/png');
    const outputPath = path.join(outputDir, 'basecamp-20-hero.png');
    const optimized = await sharp(canvasBuffer)
      .resize(1200, 675, { fit: 'cover' })
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(outputPath, optimized);
    console.log(`✓ Basecamp 20 hero saved: ${outputPath}`);
  } catch (error) {
    console.error('Basecamp 20 error:', error.message);
  }
}

async function generateOutfitter40Hero() {
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
    const svgPath = path.join('public', 'images', 'models', 'outfitter-40-plus-exterior.svg');
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
    const outputPath = path.join(outputDir, 'outfitter-40-plus-hero.png');
    const optimized = await sharp(canvasBuffer)
      .resize(1200, 675, { fit: 'cover' })
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(outputPath, optimized);
    console.log(`✓ Outfitter 40+ hero saved: ${outputPath}`);
  } catch (error) {
    console.error('Outfitter error:', error.message);
  }
}

// Run
generateBasecamp20Hero();
generateOutfitter40Hero();
