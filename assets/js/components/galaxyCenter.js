class GalaxyCenter {
  constructor(canvas) {
    this.x = 0; // Always at the center of the rotated context
    this.y = 0;
    
    this.baseRadius = 15;
    this.hoverRadius = 20;
    this.currentRadius = this.baseRadius;
    this.targetRadius = this.baseRadius;
    this.easingFactor = 0.1;
    this.isHovered = false;
    this.pulse = 0;
  }

  setHover(isHovered) {
    this.isHovered = isHovered;
    this.targetRadius = isHovered ? this.hoverRadius : this.baseRadius;
  }
  
  update() {
    // Smoothly animate the radius on hover
    this.currentRadius += (this.targetRadius - this.currentRadius) * this.easingFactor;
    // Add a subtle pulsing effect
    this.pulse = Math.sin(Date.now() * 0.001) * 2;
  }

draw(ctx, globalAlpha = 1.0) {
  const radius = this.currentRadius + this.pulse;

  // Create a radial gradient for a "white star" or "light core" effect
  const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${globalAlpha})`);
  gradient.addColorStop(0.3, `rgba(240, 248, 255, ${globalAlpha * 0.9})`);
  gradient.addColorStop(0.7, `rgba(200, 220, 255, ${globalAlpha * 0.6})`);
  gradient.addColorStop(1, `rgba(150, 180, 255, 0)`);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(this.x, this.y, radius * 2.5, 0, Math.PI * 2); // Larger gradient for a soft glow
  ctx.fill();

  // Draw the solid bright core
  ctx.fillStyle = `rgba(255, 255, 255, ${globalAlpha})`;
  ctx.beginPath();
  ctx.arc(this.x, this.y, radius * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Add a subtle outer ring for definition
  ctx.strokeStyle = `rgba(255, 255, 255, ${globalAlpha * 0.8})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

  isClicked(mouseX, mouseY) {
    const distance = Math.sqrt(Math.pow(mouseX - this.x, 2) + Math.pow(mouseY - this.y, 2));
    return distance < this.hoverRadius;
  }
}