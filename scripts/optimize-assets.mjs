import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const repoRoot = process.cwd();
const publicRoot = path.join(repoRoot, 'public');
const sourceRoot = path.join(repoRoot, '_source-assets', 'optimized-originals');

const TARGETS = [
  { dir: 'assets/logo', max: 256, quality: 82 },
  { dir: 'assets/profile', max: 256, quality: 82 },
  { dir: 'assets/items', max: 256, quality: 82 },
  { dir: 'assets/fish/species', max: 384, quality: 82 },
  { dir: 'assets/fish/catch-cards', max: 384, quality: 82 },
  { dir: 'assets/fish', max: 640, quality: 82, shallow: true },
  { dir: 'assets/maps', max: 1600, quality: 82 },
  { dir: 'assets/locations', max: 1600, quality: 82 },
  { dir: 'assets/time-of-day', max: 1600, quality: 82 },
];

const SOURCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

const summary = {
  converted: 0,
  moved: 0,
  skipped: 0,
  beforeBytes: 0,
  afterBytes: 0,
  folders: new Set(),
};

for (const target of TARGETS) {
  const absoluteDir = path.join(publicRoot, target.dir);
  if (!(await exists(absoluteDir))) {
    continue;
  }

  const files = await listSourceImages(absoluteDir, target.shallow);
  for (const file of files) {
    await optimizeImage(file, target);
  }
}

const savedBytes = Math.max(0, summary.beforeBytes - summary.afterBytes);
console.log(`Optimized image folders: ${[...summary.folders].sort().join(', ') || 'none'}`);
console.log(`Converted: ${summary.converted}`);
console.log(`Moved originals: ${summary.moved}`);
console.log(`Skipped: ${summary.skipped}`);
console.log(`Original bytes moved: ${formatBytes(summary.beforeBytes)}`);
console.log(`WebP bytes written: ${formatBytes(summary.afterBytes)}`);
console.log(`Estimated image bytes saved from public: ${formatBytes(savedBytes)}`);

async function optimizeImage(file, target) {
  const extension = path.extname(file).toLowerCase();
  if (!SOURCE_EXTENSIONS.has(extension)) {
    summary.skipped += 1;
    return;
  }

  const relativeFromPublic = path.relative(publicRoot, file);
  const output = file.replace(/\.(png|jpe?g)$/i, '.webp');
  const originalStats = await fs.stat(file);
  summary.beforeBytes += originalStats.size;
  summary.folders.add(target.dir);

  const image = sharp(file, { animated: false });
  const metadata = await image.metadata();
  const resize = shouldResize(metadata, target.max)
    ? { width: target.max, height: target.max, fit: 'inside', withoutEnlargement: true }
    : null;

  let pipeline = sharp(file, { animated: false }).rotate();
  if (resize) {
    pipeline = pipeline.resize(resize);
  }

  await pipeline
    .webp({
      quality: target.quality,
      alphaQuality: 90,
      effort: 5,
    })
    .toFile(output);

  const outputStats = await fs.stat(output);
  summary.afterBytes += outputStats.size;
  summary.converted += 1;

  const sourceCopy = path.join(sourceRoot, relativeFromPublic);
  await fs.mkdir(path.dirname(sourceCopy), { recursive: true });
  await moveOriginal(file, sourceCopy);
}

async function listSourceImages(dir, shallow = false) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shallow) {
        files.push(...await listSourceImages(absolute));
      }
      continue;
    }

    if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolute);
    }
  }

  return files;
}

function shouldResize(metadata, max) {
  return Boolean(max && ((metadata.width ?? 0) > max || (metadata.height ?? 0) > max));
}

async function moveOriginal(from, to) {
  if (await exists(to)) {
    await fs.unlink(from);
  } else {
    await fs.rename(from, to);
  }
  summary.moved += 1;
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
