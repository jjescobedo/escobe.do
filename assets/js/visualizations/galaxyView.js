class GalaxyView {
  constructor(data, canvas, aboutData) {
    this.canvas = canvas;
    this.starSystems = [];
    this.layers = [];
    this.onStarSystemClick = null;
    this.onCenterClick = null;
    
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.lastCanvasWidth = canvas.width;
    this.lastCanvasHeight = canvas.height;
  
    this.aboutData = aboutData;
    this.infoModal = new ProjectModal();
    this.infoButton = { radius: 22 };
    
    this.center = new GalaxyCenter(canvas);

    this.layerConfigs = [
        { numParticles: 800, armTightness: 1.2, armSpread: 1.6, minSize: 0.4, maxSize: 0.8, minAlpha: 0.1, maxAlpha: 0.3, rotationSpeed: 0.0001, color: 'hsl(240, 80%, 70%)' },
        { numParticles: 1000, armTightness: 0.1, armSpread: 3, minSize: 0.5, maxSize: 1.2, minAlpha: 0.4, maxAlpha: 0.8, rotationSpeed: 0.00095, color: 'hsl(260, 90%, 80%)' },
        { numParticles: 600, armTightness: 0.6, armSpread: 1.8, minSize: 0.5, maxSize: 0.8, minAlpha: 0.6, maxAlpha: 0.9, rotationSpeed: 0.0006, color: 'hsl(260, 90%, 80%)' },
        { numParticles: 800, armTightness: 0.2, armSpread: 0.3, minSize: 0.8, maxSize: 1.8, minAlpha: 0.7, maxAlpha: 1.0, rotationSpeed: 0.0004, color: 'white' }
    ];
    
    this.numArms = 6;

    for (const project of Object.values(data)) {
      this.starSystems.push(new StarSystem(project, canvas));
    }

    this.layerConfigs.forEach(config => {
      this.layers.push(this.generateLayer(config));
    });

    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mouseThrottleDistance = 5;
    this.hoveredSystem = null;
    this.foregroundRotation = 0;
    
    this.rotationCache = new Float32Array(2);
    this.helpModal = new GalaxyHelpModal(); // <-- Add this line
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
    if (this.canvas.width !== this.lastCanvasWidth || this.canvas.height !== this.lastCanvasHeight) {
      this.centerX = this.canvas.width / 2;
      this.centerY = this.canvas.height / 2;
      this.lastCanvasWidth = this.canvas.width;
      this.lastCanvasHeight = this.canvas.height;
    }

    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i].rotation += this.layers[i].config.rotationSpeed;
    }

    this.foregroundRotation = this.layers[this.layers.length - 1].rotation;

    const mouseDeltaX = mouseX - this.lastMouseX;
    const mouseDeltaY = mouseY - this.lastMouseY;
    const mouseDistance = Math.sqrt(mouseDeltaX * mouseDeltaX + mouseDeltaY * mouseDeltaY);
    
    if (mouseDistance > this.mouseThrottleDistance) {
      this.updateHover(mouseX, mouseY);
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
    }

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
    
    const cosR = Math.cos(angle - this.foregroundRotation);
    const sinR = Math.sin(angle - this.foregroundRotation);
    const rotatedX = cosR * dist;
    const rotatedY = sinR * dist;
    
    let isHoveringSomething = false;
    
    if (this.hoveredSystem) {
      this.hoveredSystem.setHover(false);
      this.hoveredSystem = null;
    }
    
    for (let i = 0; i < this.starSystems.length; i++) {
      const system = this.starSystems[i];
      if (system.isClicked(rotatedX, rotatedY)) {
        system.setHover(true);
        this.hoveredSystem = system;
        isHoveringSomething = true;
        break;
      }
    }
    
    const centerHovered = this.center.isClicked(rotatedX, rotatedY);
    this.center.setHover(centerHovered);
    if (centerHovered) isHoveringSomething = true;

    this.canvas.style.cursor = isHoveringSomething ? 'pointer' : 'default';
  }

  draw(ctx, globalAlpha = 1.0) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      const layer = this.layers[layerIndex];
      ctx.save();
      ctx.rotate(layer.rotation);
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
        if (alpha > 0.05) {
          ctx.globalAlpha = alpha;
          ctx.moveTo(x + size, y);
          ctx.arc(x, y, size, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      ctx.globalAlpha = 1.0;
      if (layerIndex === this.layers.length - 1) {
        for (let i = 0; i < this.starSystems.length; i++) {
          this.starSystems[i].draw(ctx, globalAlpha);
        }
        this.center.draw(ctx, globalAlpha);
      }
      ctx.restore();
    }
    ctx.restore();
    if (this.hoveredSystem) {
      this.drawHoverTooltip(ctx, globalAlpha);
    }
    
    this.drawInfoButton(ctx, globalAlpha);
  }

  drawInfoButton(ctx, globalAlpha) {
    const pad = 24;
    const x = this.canvas.width - pad - this.infoButton.radius;
    const y = pad + this.infoButton.radius;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, this.infoButton.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${globalAlpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = `rgba(200,200,255,${globalAlpha})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('i', x, y+1);
    ctx.restore();
  }

  drawHoverTooltip(ctx, globalAlpha) {
    const system = this.hoveredSystem;
    const cosR = Math.cos(this.foregroundRotation);
    const sinR = Math.sin(this.foregroundRotation);
    const screenX = this.centerX + (system.x * cosR - system.y * sinR);
    const screenY = this.centerY + (system.x * sinR + system.y * cosR);

    // Get date string if present
    const dateStr = system.projectData && system.projectData.date ? `Discovered ${system.projectData.date}` : '';

    // Measure both lines
    ctx.font = '14px monospace';
    const nameWidth = ctx.measureText(system.name).width;
    ctx.font = '12px monospace';
    const dateWidth = dateStr ? ctx.measureText(dateStr).width : 0;
    const maxWidth = Math.max(nameWidth, dateWidth);
    const padding = 8;
    const lineHeight = 20;
    const boxX = screenX + 15;
    const boxY = screenY - 35;
    const boxHeight = dateStr ? lineHeight + 16 + padding : lineHeight + padding;

    ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * globalAlpha})`;
    ctx.fillRect(boxX, boxY, maxWidth + padding * 2, boxHeight);
    ctx.fillStyle = `rgba(255, 255, 255, ${globalAlpha})`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '14px monospace';
    ctx.fillText(system.name, boxX + padding, boxY + padding / 2 + 2);
    if (dateStr) {
      ctx.font = '12px monospace';
      ctx.fillStyle = `rgba(200, 200, 255, ${globalAlpha})`;
      ctx.fillText(dateStr, boxX + padding, boxY + padding / 2 + 2 + lineHeight);
      ctx.fillStyle = `rgba(255, 255, 255, ${globalAlpha})`;
    }
  }
  
  handleClick(event) {
    const pad = 24;
    const x = this.canvas.width - pad - this.infoButton.radius;
    const y = pad + this.infoButton.radius;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const dist = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
    if (dist < this.infoButton.radius) {
      if (this.helpModal.isOpen) {
        this.helpModal.hide();
      } else {
        if (this.aboutData && this.aboutData.help) {
          this.helpModal.show(
            this.aboutData.help.title || 'Help',
            this.aboutData.help.body || ''
          );
        }
      }
      return;
    }
    if (this.center.isHovered && this.onCenterClick) {
        this.onCenterClick();
        return;
    }
    if (this.hoveredSystem && this.onStarSystemClick) {
      this.onStarSystemClick(this.hoveredSystem.projectData);
    }
  }
}