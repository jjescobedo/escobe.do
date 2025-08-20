class GalaxyView {
  constructor(data, canvas) {
    this.canvas = canvas;
    this.starSystems = [];
    this.layers = [];
    this.onStarSystemClick = null;
    this.onCenterClick = null;
    
    // Pre-calculate values for performance
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.lastCanvasWidth = canvas.width;
    this.lastCanvasHeight = canvas.height;
    
    // Create the galaxy center
    this.center = new GalaxyCenter(canvas);

    // Optimized galaxy configuration - reduced particle counts
    this.layerConfigs = [
        { numParticles: 800, armTightness: 1.2, armSpread: 1.6, minSize: 0.4, maxSize: 0.8, minAlpha: 0.1, maxAlpha: 0.3, rotationSpeed: 0.0001, color: 'hsl(240, 80%, 70%)' },
        { numParticles: 1000, armTightness: 0.1, armSpread: 3, minSize: 0.5, maxSize: 1.2, minAlpha: 0.4, maxAlpha: 0.8, rotationSpeed: 0.00095, color: 'hsl(260, 90%, 80%)' },
        { numParticles: 600, armTightness: 0.6, armSpread: 1.8, minSize: 0.5, maxSize: 0.8, minAlpha: 0.6, maxAlpha: 0.9, rotationSpeed: 0.0006, color: 'hsl(260, 90%, 80%)' },
        { numParticles: 800, armTightness: 0.2, armSpread: 0.3, minSize: 0.8, maxSize: 1.8, minAlpha: 0.7, maxAlpha: 1.0, rotationSpeed: 0.0004, color: 'white' }
    ];
    
    this.numArms = 6;

    // Cache star systems
    for (const project of Object.values(data)) {
      this.starSystems.push(new StarSystem(project, canvas));
    }

    // Pre-generate all layers
    this.layerConfigs.forEach(config => {
      this.layers.push(this.generateLayer(config));
    });

    // Performance optimizations
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mouseThrottleDistance = 5; // Only update hover if mouse moved more than 5px
    this.hoveredSystem = null;
    this.foregroundRotation = 0;
    
    // Pre-calculate rotation matrices
    this.rotationCache = new Float32Array(2);
  }

  setTransitionCallback(callback) {
    this.onStarSystemClick = callback;
  }

  setAboutTransitionCallback(callback) {
    this.onCenterClick = callback;
  }

  generateLayer(config) {
    const particles = [];
    const maxDist = Math.max(this.centerX, this.centerY);

    // Use typed arrays for better performance
    const particlePositions = new Float32Array(config.numParticles * 2);
    const particleSizes = new Float32Array(config.numParticles);
    const particleAlphas = new Float32Array(config.numParticles);

    for (let i = 0; i < config.numParticles; i++) {
        const dist = Math.pow(Math.random(), 2) * maxDist;
        let angle = (dist / maxDist) * Math.PI * 2 * config.armTightness;
        let armOffset = Math.pow(Math.random(), 3) * config.armSpread;
        if (Math.random() < 0.5) armOffset *= -1;
        angle += armOffset;
        const armIndex = Math.floor(Math.random() * this.numArms);
        angle += (armIndex / this.numArms) * Math.PI * 2;
        
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        
        particlePositions[i * 2] = x;
        particlePositions[i * 2 + 1] = y;
        particleSizes[i] = Math.random() * (config.maxSize - config.minSize) + config.minSize;
        particleAlphas[i] = Math.random() * (config.maxAlpha - config.minAlpha) + config.minAlpha;
    }
    
    return { 
      positions: particlePositions,
      sizes: particleSizes,
      alphas: particleAlphas,
      rotation: 0, 
      config,
      color: config.color
    };
  }

  update(mouseX, mouseY) {
    // Check if canvas was resized
    if (this.canvas.width !== this.lastCanvasWidth || this.canvas.height !== this.lastCanvasHeight) {
      this.centerX = this.canvas.width / 2;
      this.centerY = this.canvas.height / 2;
      this.lastCanvasWidth = this.canvas.width;
      this.lastCanvasHeight = this.canvas.height;
    }

    // Update layer rotations
    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i].rotation += this.layers[i].config.rotationSpeed;
    }

    // Cache foreground rotation
    this.foregroundRotation = this.layers[this.layers.length - 1].rotation;

    // Throttle mouse hover calculations
    const mouseDeltaX = mouseX - this.lastMouseX;
    const mouseDeltaY = mouseY - this.lastMouseY;
    const mouseDistance = Math.sqrt(mouseDeltaX * mouseDeltaX + mouseDeltaY * mouseDeltaY);
    
    if (mouseDistance > this.mouseThrottleDistance) {
      this.updateHover(mouseX, mouseY);
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
    }

    // Update star systems
    for (let i = 0; i < this.starSystems.length; i++) {
      this.starSystems[i].update();
    }
    
    this.center.update();
  }

  updateHover(mouseX, mouseY) {
    const dx = mouseX - this.centerX;
    const dy = mouseY - this.centerY;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Pre-calculate rotation values
    const cosR = Math.cos(angle - this.foregroundRotation);
    const sinR = Math.sin(angle - this.foregroundRotation);
    const rotatedX = cosR * dist;
    const rotatedY = sinR * dist;
    
    let isHoveringSomething = false;
    
    // Reset previous hover state
    if (this.hoveredSystem) {
      this.hoveredSystem.setHover(false);
      this.hoveredSystem = null;
    }
    
    // Check star systems
    for (let i = 0; i < this.starSystems.length; i++) {
      const system = this.starSystems[i];
      if (system.isClicked(rotatedX, rotatedY)) {
        system.setHover(true);
        this.hoveredSystem = system;
        isHoveringSomething = true;
        break; // Only one can be hovered at a time
      }
    }
    
    // Check center
    const centerHovered = this.center.isClicked(rotatedX, rotatedY);
    this.center.setHover(centerHovered);
    if (centerHovered) isHoveringSomething = true;

    this.canvas.style.cursor = isHoveringSomething ? 'pointer' : 'default';
  }

  draw(ctx, globalAlpha = 1.0) {
    // Use transform caching
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    
    // Draw layers with optimized rendering
    for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      const layer = this.layers[layerIndex];
      
      ctx.save();
      ctx.rotate(layer.rotation);
      
      // Batch rendering with minimal state changes
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      
      const positions = layer.positions;
      const sizes = layer.sizes;
      const alphas = layer.alphas;
      const numParticles = positions.length / 2;
      
      for (let i = 0; i < numParticles; i++) {
        const x = positions[i * 2];
        const y = positions[i * 2 + 1];
        const size = sizes[i];
        const alpha = alphas[i] * globalAlpha;
        
        // Only draw particles that are reasonably visible
        if (alpha > 0.05) {
          ctx.globalAlpha = alpha;
          ctx.moveTo(x + size, y);
          ctx.arc(x, y, size, 0, Math.PI * 2);
        }
      }
      
      ctx.fill();
      ctx.globalAlpha = 1.0;
      
      // Draw star systems and center only on the final layer
      if (layerIndex === this.layers.length - 1) {
        for (let i = 0; i < this.starSystems.length; i++) {
          this.starSystems[i].draw(ctx, globalAlpha);
        }
        this.center.draw(ctx, globalAlpha);
      }
      
      ctx.restore();
    }
    
    ctx.restore();

    // Draw hover tooltip only if needed
    if (this.hoveredSystem) {
      this.drawHoverTooltip(ctx, globalAlpha);
    }
  }

  drawHoverTooltip(ctx, globalAlpha) {
    const system = this.hoveredSystem;
    const cosR = Math.cos(this.foregroundRotation);
    const sinR = Math.sin(this.foregroundRotation);
    const screenX = this.centerX + (system.x * cosR - system.y * sinR);
    const screenY = this.centerY + (system.x * sinR + system.y * cosR);
    
    // Use cached font measurements if possible
    ctx.font = '14px monospace';
    const textWidth = ctx.measureText(system.name).width;
    const padding = 8;
    const boxX = screenX + 15;
    const boxY = screenY - 35;
    
    ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * globalAlpha})`;
    ctx.fillRect(boxX, boxY, textWidth + padding * 2, 20 + padding);
    ctx.fillStyle = `rgba(255, 255, 255, ${globalAlpha})`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(system.name, boxX + padding, boxY + padding / 2 + 2);
  }
  
  handleClick(event) {
    // Check for center click first
    if (this.center.isHovered && this.onCenterClick) {
        this.onCenterClick();
        return;
    }

    // Check for star system click
    if (this.hoveredSystem && this.onStarSystemClick) {
      this.onStarSystemClick(this.hoveredSystem.projectData);
    }
  }
}