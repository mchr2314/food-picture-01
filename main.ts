// food-picture-01 entry: Masterpiece Gourmet Artisanal Tonkotsu Ramen (V3 Final)
// Node 22 standard library only, fully deterministic procedural high-detail culinary PNG renderer.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync, crc32 } from 'node:zlib';

const WIDTH = 768;
const HEIGHT = 768;

// Deterministic PRNG (Mulberry32)
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(7771337);

// Deterministic 2D Noise Primitives
function hash2d(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

function noise2d(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash2d(ix, iy);
  const b = hash2d(ix + 1, iy);
  const c = hash2d(ix, iy + 1);
  const d = hash2d(ix + 1, iy + 1);

  return a * (1 - ux) + b * ux + (c - a) * uy * (1 - ux) + (d - b) * ux * uy;
}

function fbm(x: number, y: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise2d(x * freq, y * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return val;
}

// Scallion ring coordinates
interface Scallion {
  x: number;
  y: number;
  r: number;
  angle: number;
}

const scallions: Scallion[] = [
  { x: -25, y: -10, r: 11, angle: 0.3 },
  { x: -5, y: 15, r: 13, angle: -0.4 },
  { x: 18, y: -25, r: 10, angle: 0.8 },
  { x: -35, y: 35, r: 12, angle: 0.1 },
  { x: 30, y: 10, r: 9, angle: -0.6 },
  { x: -10, y: -45, r: 11, angle: 0.5 },
  { x: 45, y: -15, r: 10, angle: 0.2 },
  { x: -50, y: -5, r: 12, angle: -0.2 },
  { x: 8, y: 45, r: 11, angle: 0.7 },
  { x: -20, y: 60, r: 10, angle: -0.3 },
];

// Sesame seed coordinates
interface Sesame {
  x: number;
  y: number;
  rot: number;
}

const sesameSeeds: Sesame[] = [];
for (let i = 0; i < 28; i++) {
  const a = rng() * Math.PI * 2;
  const d = 25 + rng() * 110;
  sesameSeeds.push({
    x: Math.cos(a) * d,
    y: Math.sin(a) * d,
    rot: rng() * Math.PI,
  });
}

// Standard compliant PNG Chunk & Stream Encoder
function encodePNG(width: number, height: number, rgba: Uint8Array): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(typeStr: string, data: Buffer): Buffer {
    const typeBuf = Buffer.from(typeStr, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlineLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLen);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLen;
    rawData[rowOffset] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(rawData, rowOffset + 1);
  }

  const compressedIDAT = deflateSync(rawData, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressedIDAT),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderV3(): Uint8Array {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  const cx = WIDTH * 0.5;
  const cy = HEIGHT * 0.53;
  const bowlOuterR = WIDTH * 0.435;
  const bowlInnerR = WIDTH * 0.388;

  for (let y = 0; y < HEIGHT; y++) {
    const ny = y / HEIGHT;
    for (let x = 0; x < WIDTH; x++) {
      const nx = x / WIDTH;
      const idx = (y * WIDTH + x) * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Studio key lighting from upper-left with soft warm fill
      const keyDist = Math.hypot(nx - 0.28, ny - 0.22);
      const lightFactor = Math.max(0.24, 1.08 - keyDist * 0.88);

      // 1. Rustic izakaya dark polished wooden tabletop
      const woodRing = Math.sin((x * 0.038 + y * 0.007) + fbm(x * 0.012, y * 0.012, 3) * 6.5);
      const woodGrain = fbm(x * 0.06, y * 0.025, 4);
      let r = 36 + woodRing * 11 + woodGrain * 18;
      let g = 25 + woodRing * 8 + woodGrain * 11;
      let b = 17 + woodRing * 5 + woodGrain * 7;

      // Soft ambient table occlusion shadow beneath the bowl
      const shadowDist = Math.hypot(dx - 14, dy - 26);
      if (shadowDist < bowlOuterR + 52) {
        const sf = Math.max(0.12, (shadowDist - bowlOuterR) / 52);
        r *= sf;
        g *= sf;
        b *= sf;
      }

      // 2. Artisanal Kuro-Oribe Stoneware Ramen Bowl
      if (dist <= bowlOuterR) {
        if (dist > bowlInnerR) {
          // Rim stoneware with natural iron-speckled glaze texture
          const rimT = (dist - bowlInnerR) / (bowlOuterR - bowlInnerR);
          const speckle = fbm(x * 0.09, y * 0.09, 4);
          const rimGlint = Math.max(0, Math.cos(angle - 2.38)) ** 14;
          
          const baseColor = 20 + speckle * 20;
          r = baseColor + rimGlint * 155;
          g = baseColor * 0.92 + rimGlint * 142;
          b = baseColor * 0.82 + rimGlint * 120;

          // Chamfered outer edge highlight
          if (rimT > 0.82) {
            const edgeBevel = (rimT - 0.82) / 0.18;
            r += edgeBevel * 28;
            g += edgeBevel * 22;
            b += edgeBevel * 18;
          }
        } else {
          // Inner bowl depth drop shadow
          const innerShadow = Math.min(1.0, (bowlInnerR - dist) / 26);

          // 3. Luxurious Rich Tonkotsu Broth (Silky, collagen-rich creamy broth)
          const brothWave = fbm(x * 0.024, y * 0.024, 3);
          const brothSwirl = Math.sin(angle * 3.2 + dist * 0.038 + brothWave * 4.2);
          
          r = 230 + brothSwirl * 12 + brothWave * 16;
          g = 194 + brothSwirl * 10 + brothWave * 13;
          b = 144 + brothSwirl * 8 + brothWave * 10;

          // 4. Shimmering Golden Aroma Oil Droplets (Chiyu & Mayu)
          const oilField = fbm(x * 0.058 + 15.0, y * 0.058 + 15.0, 4);
          if (oilField > 0.61) {
            const oilIntensity = (oilField - 0.61) / 0.39;
            r = r * (1 - oilIntensity) + 248 * oilIntensity;
            g = g * (1 - oilIntensity) + 168 * oilIntensity;
            b = b * (1 - oilIntensity) + 32 * oilIntensity;

            // Specular meniscus bead glint
            const beadSpec = Math.max(0, Math.sin(x * 0.45 + y * 0.45)) ** 18;
            r += beadSpec * 80;
            g += beadSpec * 70;
            b += beadSpec * 45;
          }

          // 5. Crisp Dark Nori Seaweed Sheet (Standing tall at top-left rim)
          const noriX = dx + 95;
          const noriY = dy + 115;
          const rotNoriX = noriX * 0.86 - noriY * 0.51;
          const rotNoriY = noriX * 0.51 + noriY * 0.86;
          if (Math.abs(rotNoriX) < 52 && Math.abs(rotNoriY) < 92) {
            const noriTexture = fbm(rotNoriX * 0.12, rotNoriY * 0.12, 4);
            r = 14 + noriTexture * 16;
            g = 22 + noriTexture * 20;
            b = 16 + noriTexture * 14;
          }

          // 6. Seasoned Menma Bamboo Shoots (Top-center right)
          const menmaX = dx - 20;
          const menmaY = dy + 105;
          const rotMenmaX = menmaX * 0.95 - menmaY * 0.31;
          const rotMenmaY = menmaX * 0.31 + menmaY * 0.95;
          if (Math.abs(rotMenmaX) < 18 && Math.abs(rotMenmaY) < 55) {
            const mGrain = fbm(rotMenmaX * 0.1, rotMenmaY * 0.03, 3);
            r = 195 + mGrain * 25;
            g = 138 + mGrain * 20;
            b = 75 + mGrain * 15;
          }

          // 7. Double Braised Chashu Pork Belly Slices (Center-left)
          // Primary Torched Slice
          const cdx = dx + 70;
          const cdy = dy - 18;
          const cDist = Math.hypot(cdx * 0.74, cdy * 1.14);
          if (cDist < 92) {
            const meatFiber = fbm(cdx * 0.085, cdy * 0.042, 4);
            const fatBand = Math.sin(cdy * 0.13 + meatFiber * 3.2);

            if (fatBand > 0.38) {
              // Melt-in-mouth rendered pork fat ribbon
              r = 238 + meatFiber * 14;
              g = 208 + meatFiber * 14;
              b = 188 + meatFiber * 10;
            } else {
              // Juicy, tender braised chashu pork
              r = 172 + meatFiber * 32;
              g = 98 + meatFiber * 22;
              b = 62 + meatFiber * 16;
            }

            // Torched caramelized glaze along outer edge
            if (cDist > 76) {
              const charFactor = (cDist - 76) / 16;
              r = r * (1 - charFactor) + 60 * charFactor;
              g = g * (1 - charFactor) + 30 * charFactor;
              b = b * (1 - charFactor) + 15 * charFactor;
            }
          }

          // 8. Wavy Handcrafted Ramen Noodles
          const inNoodleZone = (dy > -65 && dy < 155 && Math.abs(dx) < 185);
          if (inNoodleZone) {
            const wave1 = Math.sin(dx * 0.26 + Math.sin(dy * 0.11) * 2.6);
            const wave2 = Math.cos(dy * 0.22 + Math.cos(dx * 0.12) * 2.2);
            const nDist = Math.min(Math.abs(wave1), Math.abs(wave2));

            if (nDist < 0.36) {
              const nT = 1.0 - (nDist / 0.36);
              const noodleR = 244;
              const noodleG = 208;
              const noodleB = 122;
              // High gloss reflection on noodle curve
              const nGlint = Math.max(0, Math.sin(dx * 0.26 - 0.42)) ** 9;
              r = r * (1 - nT * 0.76) + (noodleR + nGlint * 48) * (nT * 0.76);
              g = g * (1 - nT * 0.76) + (noodleG + nGlint * 42) * (nT * 0.76);
              b = b * (1 - nT * 0.76) + (noodleB + nGlint * 22) * (nT * 0.76);
            }
          }

          // 9. Ajitsuke Tamago (Soy Marinated Ramen Egg with Molten Jammy Yolk, Center-Right)
          const edx = dx - 78;
          const edy = dy + 48;
          const eggDist = Math.hypot(edx * 0.91, edy * 1.14);
          if (eggDist < 82) {
            if (eggDist < 46) {
              // Glowing molten jammy yolk with liquid center
              const yolkT = eggDist / 46;
              r = 255 - yolkT * 22;
              g = 118 + yolkT * 48;
              b = 14 + yolkT * 18;

              // Specular shine on luscious moist yolk
              const yolkGlint = Math.hypot(edx + 14, edy + 11);
              if (yolkGlint < 18) {
                const specT = (1 - yolkGlint / 18) ** 2.2;
                r += specT * 115;
                g += specT * 115;
                b += specT * 98;
              }
            } else {
              // Soy sauce marinade soaked egg white
              const whiteT = (eggDist - 46) / 36;
              const soyDepth = whiteT ** 1.7;
              r = 246 * (1 - soyDepth) + 138 * soyDepth;
              g = 239 * (1 - soyDepth) + 96 * soyDepth;
              b = 216 * (1 - soyDepth) + 60 * soyDepth;
            }
          }

          // 10. Narutomaki (Japanese Fish Cake Slice with Pink Spiral, Bottom-Right)
          const ndx = dx - 65;
          const ndy = dy - 85;
          const narutoDist = Math.hypot(ndx, ndy);
          if (narutoDist < 36) {
            const narutoAngle = Math.atan2(ndy, ndx);
            const spiral = Math.sin(narutoAngle * 2.0 - narutoDist * 0.38);
            if (narutoDist > 10 && narutoDist < 26 && spiral > 0.15) {
              // Vibrant pink swirl
              r = 248;
              g = 88;
              b = 128;
            } else {
              // Pure white steamed fish paste
              r = 248;
              g = 248;
              b = 250;
            }
          }

          // 11. Sliced Scallion Rings (Fresh Negi Greens)
          for (const sc of scallions) {
            const sdx = dx - sc.x;
            const sdy = dy - sc.y;
            const sDist = Math.hypot(sdx, sdy);
            if (sDist < sc.r) {
              if (sDist > sc.r - 3.2) {
                // Crisp dark jade green scallion rim
                r = 42;
                g = 148;
                b = 52;
              } else if (sDist > sc.r - 5.5) {
                // Tender light green ring
                r = 135;
                g = 205;
                b = 115;
              } else {
                // Pale white-green core
                r = 225;
                g = 245;
                b = 215;
              }
            }
          }

          // 12. Scattered Toasted White Sesame Seeds
          for (const s of sesameSeeds) {
            const ssdx = dx - s.x;
            const ssdy = dy - s.y;
            const rdx = ssdx * Math.cos(s.rot) - ssdy * Math.sin(s.rot);
            const rdy = ssdx * Math.sin(s.rot) + ssdy * Math.cos(s.rot);
            if (Math.hypot(rdx * 0.7, rdy * 1.8) < 3.2) {
              r = 245;
              g = 232;
              b = 202;
            }
          }

          // Apply inner bowl depth vignette
          r *= innerShadow;
          g *= innerShadow;
          b *= innerShadow;
        }
      }

      // 13. Rising Warm Steam Wisps (Curl upwards with translucent alpha)
      if (y < cy + 80 && dist < bowlOuterR + 40) {
        const steamPhase = fbm(x * 0.015, (y + 120) * 0.012, 4);
        const steamColumn = Math.sin((x - cx) * 0.02 + steamPhase * 3.5);
        if (steamColumn > 0.45 && y < cy - 20) {
          const steamAlpha = Math.min(0.28, (steamColumn - 0.45) * 0.6 * ((cy - y) / (cy * 0.8)));
          r = r * (1 - steamAlpha) + 255 * steamAlpha;
          g = g * (1 - steamAlpha) + 250 * steamAlpha;
          b = b * (1 - steamAlpha) + 242 * steamAlpha;
        }
      }

      // 14. Global Studio Lighting & Radial Vignette
      r *= lightFactor;
      g *= lightFactor;
      b *= lightFactor;

      // Lens vignette falloff towards canvas corners
      const cornerDist = Math.hypot(nx - 0.5, ny - 0.5);
      const vignette = Math.max(0.68, 1.0 - cornerDist * 0.42);
      r *= vignette;
      g *= vignette;
      b *= vignette;

      pixels[idx + 0] = Math.min(255, Math.max(0, Math.round(r)));
      pixels[idx + 1] = Math.min(255, Math.max(0, Math.round(g)));
      pixels[idx + 2] = Math.min(255, Math.max(0, Math.round(b)));
      pixels[idx + 3] = 255;
    }
  }

  return pixels;
}

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const pixels = renderV3();
const pngBuffer = encodePNG(WIDTH, HEIGHT, pixels);
const outputPath = join(outputDir, 'entry.png');
writeFileSync(outputPath, pngBuffer);
console.log(`Rendered V3 Masterpiece to ${outputPath} (${pngBuffer.length} bytes, ${WIDTH}x${HEIGHT})`);
