const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = 'FfN1FuFrrLjkz41e35nNtgbr';
const CARS_DIR = path.join(__dirname, '../assets/cars');
const TEMP_DIR = path.join(__dirname, '../assets/cars-temp');

// Create temp directory
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Get all PNG files
const carImages = fs.readdirSync(CARS_DIR).filter(file => file.endsWith('.png'));

console.log(`Found ${carImages.length} car images to process...\n`);

let processed = 0;
let failed = 0;

function removeBackground(filename) {
  return new Promise((resolve, reject) => {
    const inputPath = path.join(CARS_DIR, filename);
    const outputPath = path.join(TEMP_DIR, filename);

    const formData = {
      size: 'auto',
      image_file: fs.createReadStream(inputPath)
    };

    const options = {
      method: 'POST',
      hostname: 'api.remove.bg',
      path: '/v1.0/removebg',
      headers: {
        'X-Api-Key': API_KEY
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        const writeStream = fs.createWriteStream(outputPath);
        res.pipe(writeStream);
        
        writeStream.on('finish', () => {
          processed++;
          console.log(`✓ [${processed}/${carImages.length}] ${filename} - Background removed`);
          resolve();
        });

        writeStream.on('error', (err) => {
          failed++;
          console.error(`✗ ${filename} - Write error:`, err.message);
          reject(err);
        });
      } else {
        failed++;
        let errorData = '';
        res.on('data', chunk => errorData += chunk);
        res.on('end', () => {
          console.error(`✗ ${filename} - API error (${res.statusCode}):`, errorData);
          reject(new Error(`API returned ${res.statusCode}`));
        });
      }
    });

    req.on('error', (err) => {
      failed++;
      console.error(`✗ ${filename} - Request error:`, err.message);
      reject(err);
    });

    // Send multipart form data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16);
    req.setHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);

    const imageData = fs.readFileSync(inputPath);
    const parts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="size"\r\n\r\n`,
      `auto\r\n`,
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="image_file"; filename="${filename}"\r\n`,
      `Content-Type: image/png\r\n\r\n`
    ];
    
    for (const part of parts) {
      req.write(part);
    }
    req.write(imageData);
    req.write(`\r\n--${boundary}--\r\n`);
    req.end();
  });
}

// Process images sequentially to avoid rate limiting
async function processAll() {
  console.log('Starting background removal process...\n');
  
  for (const filename of carImages) {
    try {
      await removeBackground(filename);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      // Continue with next image even if one fails
    }
  }

  console.log(`\n========================================`);
  console.log(`Processing complete!`);
  console.log(`✓ Success: ${processed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`========================================\n`);

  if (processed > 0) {
    console.log(`Transparent images saved to: ${TEMP_DIR}`);
    console.log(`\nTo use them, run:`);
    console.log(`Move-Item "${TEMP_DIR}\\*" "${CARS_DIR}" -Force`);
  }
}

processAll().catch(console.error);
