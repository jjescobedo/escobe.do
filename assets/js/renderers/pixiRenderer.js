class PixiRenderer2D {
  constructor(pixiCanvasOrElement) {
    // Accept either an element id, a DOM element, or null to auto-find #pixi-canvas
    const view = typeof pixiCanvasOrElement === 'string'
      ? document.getElementById(pixiCanvasOrElement)
      : (pixiCanvasOrElement || document.getElementById('pixi-canvas'));

    // If PIXI isn't available, fail gracefully
    if (typeof PIXI === 'undefined' || !view) {
      console.warn('PixiRenderer2D: PIXI not found or canvas missing.');
      return;
    }

    // Create PIXI application using the provided canvas element
    this.app = new PIXI.Application({
      view,
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });

    this.layers = []; // each entry: { container, sprites[], config }
    this.textures = {}; // cache generated textures (small circle)
    this.running = true;

    // default center (0,0) until set by caller
    this.centerX = this.app.renderer.screen.width / 2;
    this.centerY = this.app.renderer.screen.height / 2;
  }

  // create a simple circular texture for particles (color-independent: we tint sprites)
  _createCircleTexture(size = 16, color = 0xFFFFFF) {
    const key = `circle_${size}`;
    if (this.textures[key]) return this.textures[key];
    const g = new PIXI.Graphics();
    g.beginFill(0xFFFFFF);
    g.drawCircle(0, 0, size);
    g.endFill();
    const texture = this.app.renderer.generateTexture(g);
    this.textures[key] = texture;
    g.destroy();
    return texture;
  }

  // layerConfigs: array of configs (same shape you already use)
  // positions should be Float32Array if you want to reuse your generator; here we accept config.numParticles and will create sprites
  initLayers(layerConfigs) {
    if (!this.app) return;
    // clear previous
    this.layers.forEach(l => this.app.stage.removeChild(l.container));
    this.layers.length = 0;

    for (let li = 0; li < layerConfigs.length; li++) {
      const cfg = layerConfigs[li];
      // ParticleContainer is optimized for many similar sprites
      const container = new PIXI.ParticleContainer(cfg.numParticles, {
        scale: true, position: true, rotation: false, uvs: false, alpha: true
      });
      container.sortableChildren = false;

      // position container at the logical galaxy center so sprites can use centered positions
      container.position.set(this.centerX, this.centerY);
      this.app.stage.addChild(container);

      const sprites = new Array(cfg.numParticles);
      const tex = this._createCircleTexture(8); // base texture (we tint and scale per-sprite)

      for (let i = 0; i < cfg.numParticles; i++) {
        const s = new PIXI.Sprite(tex);
        s.anchor.set(0.5);
        s.tint = 0xFFFFFF; // will be set later by user code if desired
        s.alpha = 1.0;
        s.x = 0;
        s.y = 0;
        s.scale.set(1);
        container.addChild(s);
        sprites[i] = s;
      }

      this.layers.push({ container, sprites, config: cfg, rotation: 0 });
    }
  }

  // allow caller to change the logical center (e.g., when main canvas resizes)
  setCenter(cx, cy) {
    if (!this.app) return;
    this.centerX = cx;
    this.centerY = cy;
    for (let i = 0; i < this.layers.length; i++) {
      const l = this.layers[i];
      l.container.position.set(cx, cy);
    }
  }

  // positions per-layer: array with per-layer position buffers (Float32Array pairs) OR you can update sprite positions with your own logic
  // For convenience, pass an array of layer objects having `positions`, `sizes`, `alphas`, `rotation` like your CPU-layer object.
  update(layersData) {
    if (!this.app || !this.running || !layersData) return;
    // iterate layersData and apply to Pixi sprites
    // Note: layersData should be an array of layer objects corresponding to this.layers order.
    for (let li = 0; li < Math.min(this.layers.length, layersData.length); li++) {
      const pixLayer = this.layers[li];
      const src = layersData[li];
      pixLayer.rotation = src.rotation || 0;

      const sprites = pixLayer.sprites;
      const positions = src.positions;
      const sizes = src.sizes;
      const alphas = src.alphas;
      if (!positions || positions.length === 0) continue;
      const num = Math.min(sprites.length, positions.length / 2);

      for (let i = 0; i < num; i++) {
        try {
          const sx = positions[i * 2];
          const sy = positions[i * 2 + 1];

          // sprites positions are relative to their container (which we positioned at the galaxy center)
          sprites[i].position.set(sx, sy);
          // scale based on size (normalize with an arbitrary factor)
          const s = sizes ? (sizes[i] / 8) : 0.5;
          sprites[i].scale.set(s, s);
          if (alphas) sprites[i].alpha = alphas[i];
        } catch (err) {
          // Defensive: skip this sprite update if data is invalid; prevents the entire app from throwing
          console.warn('PixiRenderer2D.update: skipping sprite update due to invalid data', err);
          continue;
        }
      }
      // rotate the container for the layer (cheap)
      pixLayer.container.rotation = pixLayer.rotation;
    }
  }

  resize() {
    if (!this.app) return;
    // PIXI.Application with resizeTo handles resizing. Keep center in sync if needed by caller.
  }

  destroy() {
    if (!this.app) return;
    this.running = false;
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    this.app = null;
    this.layers = [];
    this.textures = {};
  }
}

// Expose globally so GalaxyView can detect and use it without module bundling
window.PixiRenderer2D = PixiRenderer2D;
