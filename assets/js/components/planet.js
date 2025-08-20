class Planet {
  constructor(planetData) {
    this.data = planetData;
    this.orbitRadius = planetData.orbitRadius;
    this.size = planetData.size;
    this.color = planetData.color;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = (1 / this.orbitRadius) * 0.5;
    
    // Pre-calculate position
    this.x = 0;
    this.y = 0;
    
    // Cache color calculations
    this.cachedColor = null;
    this.lastAlpha = -1;
    
    // Pre-calculate click radius squared for faster collision detection
    this.clickRadiusSquared = Math.pow(this.size + 5, 2);
  }

  update() {
    this.angle += this.speed;
    
    // Use pre-calculated sin/cos for better performance
    this.x = Math.cos(this.angle) * this.orbitRadius;
    this.y = Math.sin(this.angle) * this.orbitRadius;
  }

  draw(ctx, globalAlpha = 1.0) {
    // Cache color calculation if alpha changed
    if (this.lastAlpha !== globalAlpha) {
      this.cachedColor = this.color.replace(')', `, ${globalAlpha})`).replace('hsl', 'hsla');
      this.lastAlpha = globalAlpha;
    }
    
    ctx.fillStyle = this.cachedColor;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  isClicked(mouseX, mouseY) {
    // Use squared distance to avoid expensive sqrt calculation
    const deltaX = mouseX - this.x;
    const deltaY = mouseY - this.y;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;
    return distanceSquared < this.clickRadiusSquared;
  }
}