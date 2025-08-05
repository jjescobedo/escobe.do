class GalaxyView {
  constructor(data, canvas) {
    this.canvas = canvas;
    this.starSystems = [];
    this.layers = [];
    this.onStarSystemClick = null;

    this.layerConfigs = [
        { numParticles: 2000, armTightness: 1.2, armSpread: 1.6, minSize: 0.4, maxSize: 0.8, minAlpha: 0.1, maxAlpha: 0.3, rotationSpeed: 0.0001, color: 'hsl(240, 80%, 70%)' },
        { numParticles: 2400, armTightness: 0.1, armSpread: 0.6, minSize: 0.5, maxSize: 1.2, minAlpha: 0.4, maxAlpha: 0.8, rotationSpeed: 0.00075, color: 'hsl(260, 90%, 80%)' },
        { numParticles: 1400, armTightness: 0.2, armSpread: 0.3, minSize: 0.8, maxSize: 1.8, minAlpha: 0.7, maxAlpha: 1.0, rotationSpeed: 0.0004, color: 'white' }
    ];
    this.numArms = 6;

    for (const project of Object.values(data)) {
      this.starSystems.push(new StarSystem(project, canvas));
    }

    this.layerConfigs.forEach(config => {
      this.layers.push(this.generateLayer(config));
    });
  }

  setTransitionCallback(callback) {
    this.onStarSystemClick = callback;
  }

  generateLayer(config) {
    const particles = [];
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxDist = Math.max(centerX, centerY);

    for (let i = 0; i < config.numParticles; i++) {
        let dist = Math.pow(Math.random(), 2) * maxDist;
        let angle = (dist / maxDist) * Math.PI * 2 * config.armTightness;
        let armOffset = Math.pow(Math.random(), 3) * config.armSpread;
        if (Math.random() < 0.5) armOffset *= -1;
        angle += armOffset;
        let armIndex = Math.floor(Math.random() * this.numArms);
        angle += (armIndex / this.numArms) * Math.PI * 2;
        particles.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: Math.random() * (config.maxSize - config.minSize) + config.minSize, alpha: Math.random() * (config.maxAlpha - config.minAlpha) + config.minAlpha, color: config.color });
    }
    return { particles, rotation: 0, config };
  }

  update(mouseX, mouseY) {
    this.layers.forEach(layer => { layer.rotation += layer.config.rotationSpeed; });

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const midgroundRotation = this.layers[1].rotation;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const rotatedX = Math.cos(angle - midgroundRotation) * dist;
    const rotatedY = Math.sin(angle - midgroundRotation) * dist;
    
    let starIsHovered = false;
    for (const system of this.starSystems) {
        system.setHover(system.isClicked(rotatedX, rotatedY));
        if (system.isHovered) starIsHovered = true;
        system.update();
    }
    this.canvas.style.cursor = starIsHovered ? 'pointer' : 'default';
  }

  draw(ctx, globalAlpha = 1.0) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.layers.forEach((layer, index) => {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(layer.rotation);
      for (const p of layer.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * globalAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      if (index === 1) {
        ctx.globalAlpha = 1.0;
        for (const system of this.starSystems) {
          system.draw(ctx, globalAlpha);
        }
      }
      ctx.restore();
    });

    for (const system of this.starSystems) {
      if (system.isHovered) {
        const midgroundRotation = this.layers[1].rotation;
        const cosR = Math.cos(midgroundRotation);
        const sinR = Math.sin(midgroundRotation);
        const screenX = centerX + (system.x * cosR - system.y * sinR);
        const screenY = centerY + (system.x * sinR + system.y * cosR);
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
        break;
      }
    }
  }
  
  handleClick(event) {
    if (this.onStarSystemClick) {
        this.onStarSystemClick(this.starSystems.find(s => s.isHovered)?.projectData);
    }
  }
}