const fs = require('fs');
const path = require('path');

// Simple PNG generator function
function createPNG(width, height, color) {
  // Create a simple PNG with the given dimensions and solid color
  // This creates a minimal valid PNG structure
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk (image header)
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // Length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8); // Width
  ihdr.writeUInt32BE(height, 12); // Height
  ihdr.writeUInt8(8, 16); // Bit depth
  ihdr.writeUInt8(2, 17); // Color type (2 = RGB)
  ihdr.writeUInt8(0, 18); // Compression
  ihdr.writeUInt8(0, 19); // Filter
  ihdr.writeUInt8(0, 20); // Interlace
  const ihdrCrc = crc32(ihdr.slice(4, 21));
  ihdr.writeUInt32BE(ihdrCrc, 21);

  // Create image data
  const bytesPerPixel = 3;
  const stride = width * bytesPerPixel + 1; // +1 for filter byte
  const imageData = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    imageData[rowStart] = 0; // Filter type (0 = none)
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * bytesPerPixel;
      imageData[pixelStart] = r;
      imageData[pixelStart + 1] = g;
      imageData[pixelStart + 2] = b;
    }
  }

  // Compress data (simple deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(imageData);

  // IDAT chunk (image data)
  const idat = Buffer.alloc(compressed.length + 12);
  idat.writeUInt32BE(compressed.length, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);
  const idatCrc = crc32(idat.slice(4, idat.length - 4));
  idat.writeUInt32BE(idatCrc, idat.length - 4);

  // IEND chunk
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// CRC32 calculation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate assets
const assetsDir = path.join(__dirname, '..', 'assets');

console.log('Generating PNG assets...');

// Icon (1024x1024)
const icon = createPNG(1024, 1024, '#2563eb');
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon);
console.log('✓ icon.png (1024x1024)');

// Splash (1284x2778 for iPhone 13 Pro Max)
const splash = createPNG(1284, 2778, '#2563eb');
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splash);
console.log('✓ splash.png (1284x2778)');

// Adaptive Icon (1024x1024)
const adaptiveIcon = createPNG(1024, 1024, '#2563eb');
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveIcon);
console.log('✓ adaptive-icon.png (1024x1024)');

// Favicon (48x48)
const favicon = createPNG(48, 48, '#2563eb');
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), favicon);
console.log('✓ favicon.png (48x48)');

console.log('\nAll assets generated successfully!');
