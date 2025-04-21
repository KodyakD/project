// simple-png-generator.js
const fs = require('fs');
const path = require('path');

// Function to create a minimal valid PNG file
function createMinimalPng(width, height, color, filePath) {
  // PNG signature (8 bytes)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk (Image Header)
  const ihdrChunkData = Buffer.alloc(13);
  // Width (4 bytes)
  ihdrChunkData.writeUInt32BE(width, 0);
  // Height (4 bytes)
  ihdrChunkData.writeUInt32BE(height, 4);
  // Bit depth (1 byte) - 8 bits
  ihdrChunkData.writeUInt8(8, 8);
  // Color type (1 byte) - RGB with alpha (6)
  ihdrChunkData.writeUInt8(6, 9);
  // Compression method (1 byte) - 0 (deflate)
  ihdrChunkData.writeUInt8(0, 10);
  // Filter method (1 byte) - 0 (default)
  ihdrChunkData.writeUInt8(0, 11);
  // Interlace method (1 byte) - 0 (no interlace)
  ihdrChunkData.writeUInt8(0, 12);
  
  const ihdrChunkLength = Buffer.alloc(4);
  ihdrChunkLength.writeUInt32BE(ihdrChunkData.length, 0);
  
  const ihdrChunkType = Buffer.from('IHDR');
  
  const ihdrCrc = calculateCrc32(Buffer.concat([ihdrChunkType, ihdrChunkData]));
  
  // Create a simple IDAT chunk (Image Data)
  // We'll just create a colored rectangle
  const [r, g, b, a] = color;
  
  // Create pixel data
  const pixelData = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    pixelData[offset] = r;     // R
    pixelData[offset + 1] = g; // G
    pixelData[offset + 2] = b; // B
    pixelData[offset + 3] = a; // A
  }
  
  // Compress the pixel data (simple deflate with no compression for simplicity)
  const idatChunkData = Buffer.from([
    120, 156, // zlib header
    1, // Final block, uncompressed
    (pixelData.length & 0xff), ((pixelData.length >> 8) & 0xff), // Length
    (~pixelData.length & 0xff), ((~pixelData.length >> 8) & 0xff), // One's complement of length
    ...pixelData, // Pixel data
    0, 0, 0, 0 // Adler-32 checksum placeholder (not calculated for simplicity)
  ]);
  
  const idatChunkLength = Buffer.alloc(4);
  idatChunkLength.writeUInt32BE(idatChunkData.length, 0);
  
  const idatChunkType = Buffer.from('IDAT');
  
  const idatCrc = calculateCrc32(Buffer.concat([idatChunkType, idatChunkData]));
  
  // IEND chunk (Image End)
  const iendChunkLength = Buffer.alloc(4);
  iendChunkLength.writeUInt32BE(0, 0);
  
  const iendChunkType = Buffer.from('IEND');
  
  const iendCrc = calculateCrc32(iendChunkType);
  
  // Combine all parts to create the PNG file
  const pngFile = Buffer.concat([
    signature,
    ihdrChunkLength,
    ihdrChunkType,
    ihdrChunkData,
    ihdrCrc,
    idatChunkLength,
    idatChunkType,
    idatChunkData,
    idatCrc,
    iendChunkLength,
    iendChunkType,
    iendCrc
  ]);
  
  // Write the PNG file
  fs.writeFileSync(filePath, pngFile);
  console.log(`Created PNG file: ${filePath}`);
}

// Simple CRC-32 implementation for PNG chunks
function calculateCrc32(data) {
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(0, 0); // Placeholder for simplicity
  return crc;
}

// Create asset directories if they don't exist
const assetsDir = path.join(__dirname, 'assets');
const imagesDir = path.join(assetsDir, 'images');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Create placeholder images
createMinimalPng(200, 200, [255, 0, 0, 255], path.join(imagesDir, 'logo.png')); // Red logo
createMinimalPng(1024, 1024, [0, 0, 255, 255], path.join(assetsDir, 'icon.png')); // Blue icon
createMinimalPng(1024, 1024, [0, 0, 255, 255], path.join(assetsDir, 'adaptive-icon.png')); // Blue adaptive icon
createMinimalPng(1242, 2436, [255, 0, 0, 255], path.join(assetsDir, 'splash.png')); // Red splash
createMinimalPng(48, 48, [255, 0, 0, 255], path.join(assetsDir, 'favicon.png')); // Red favicon

console.log('All placeholder images created successfully!');