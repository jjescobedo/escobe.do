class Planet {
  constructor(planetData) {
    this.data = planetData;
    this.orbitRadius = planetData.orbitRadius;
    this.size = planetData.size;
    this.color = planetData.color;
    this.angle = Math.random() * Math.PI * 2;
    
    // angular speed in radians per second; inner planets orbit faster
    // Increased base factor so planets are clearly visible moving
    // Tweak 4.5 up/down to taste (larger = faster)
    this.angularSpeed = (4.5 / Math.max(1, this.orbitRadius)) * (0.6 + Math.random() * 1.6);
    
    this.x = 0;
    this.y = 0;
    
    this.cachedColor = null;
    this.lastAlpha = -1;
    
    this.clickRadiusSquared = Math.pow(this.size + 5, 2);
  }

  // deltaTime in milliseconds
  update(deltaTime = 16) {
    const dtSeconds = Math.min(deltaTime, 100) / 1000; // convert ms -> s, clamp for safety
    this.angle += this.angularSpeed * dtSeconds;
    this.x = Math.cos(this.angle) * this.orbitRadius;
    this.y = Math.sin(this.angle) * this.orbitRadius;
  }

  draw(ctx, globalAlpha = 1.0) {
    // Isolate canvas state per-planet, translate to current position, draw at 0,0
    ctx.save();
    if (this.lastAlpha !== globalAlpha) {
      this.cachedColor = this.color.replace(')', `, ${globalAlpha})`).replace('hsl', 'hsla');
      this.lastAlpha = globalAlpha;
    }
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.cachedColor;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isClicked(mouseX, mouseY) {
    const deltaX = mouseX - this.x;
    const deltaY = mouseY - this.y;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;
    return distanceSquared < this.clickRadiusSquared;
  }
}