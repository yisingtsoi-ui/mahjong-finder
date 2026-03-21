import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputSvg = path.join(__dirname, 'public', 'icon.svg');
const outputDir = path.join(__dirname, 'public');

async function generateIcons() {
  try {
    await sharp(inputSvg).resize(192, 192).png().toFile(path.join(outputDir, 'pwa-192x192.png'));
    await sharp(inputSvg).resize(512, 512).png().toFile(path.join(outputDir, 'pwa-512x512.png'));
    console.log('Successfully generated PWA icons!');
  } catch (error) {
    console.error('Error:', error);
  }
}
generateIcons();