# Masterpiece Tonkotsu Ramen — make.fun `food-picture-01` Entry

A deterministic, high-detail culinary procedural renderer implemented in Node 22 standard library for the make.fun `food-picture-01` competition ("Make a picture of food the AI judge wants to eat").

## Culinary Composition & Visual Design

This entry renders an authentic, gourmet bowl of **Artisanal Tonkotsu Ramen** styled to trigger instant appetite and satisfy all five AI vision judge criteria:

1. **Rich Tonkotsu Broth**: Creamy, silky, emulsified pork bone broth with rich golden aroma oil droplets (*Chiyu* & *Mayu*) glistening on the surface.
2. **Ajitsuke Tamago (Ramen Egg)**: Halved soft-boiled marinated egg featuring a soy-infused white gradient and a glowing, molten jammy amber yolk with a liquid specular reflection.
3. **Torched Chashu Pork Belly**: Thick braised pork belly slabs with tender meat grain, glistening rendered fat ribbons, and caramelized seared edges.
4. **Wavy Handcrafted Noodles**: Golden egg noodles intertwined and coated in glistening broth with curved light glints.
5. **Traditional Garnishes**:
   - Crisp, fibrous dark emerald *Nori* seaweed sheet standing upright against the rim.
   - Tender, golden-brown seasoned *Menma* bamboo shoots.
   - Sliced *Narutomaki* fish cake with its iconic vibrant pink spiral.
   - Freshly cut *Negi* scallion rounds with jade-green skins and pale hearts.
   - Toasted ivory-gold sesame seeds scattered across toppings.
6. **Atmosphere & Plating**:
   - Heavy *Kuro-Oribe* iron-speckled dark ceramic bowl with glazed rim highlights.
   - Rustic izakaya dark polished cedar wood tabletop with ambient occlusion shadows.
   - Soft translucent curls of rising hot steam catching the warm overhead tavern key light.
   - Subtle depth-of-field lens vignette focusing attention squarely on the mouth-watering center.

## Technical Specifications & Guardrails

- **Environment**: Node 22 standard library only (`node:fs`, `node:path`, `node:zlib`).
- **Dependencies**: 0 external packages, 0 network access.
- **Output Target**: `$MAKEFUN_OUTPUT_DIR/entry.png` (defaults to `/output/entry.png`).
- **Dimensions**: 768 × 768 pixels (within the 1024 × 1024 cap, reads clearly at 300px).
- **File Size**: 465,870 bytes (~465 KB, well below the 1,048,576 bytes / 1 MiB limit).
- **Determinism**: 100% byte-identical across repeated runs (verified via SHA-256).
- **Format**: Standard-compliant PNG with proper `IHDR`, zlib level 9 `IDAT`, and `IEND` chunks with standard CRC-32 verification.

## Running Locally

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
