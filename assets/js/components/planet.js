class Planet {
  constructor(planetData) {
    this.data = planetData;
    this.orbitRadius = planetData.orbitRadius;
    this.size = planetData.size;
    this.color = planetData.color;
    this.angle = Math.random() * Math.PI * 2; // Random starting position
    this.speed = (1 / this.orbitRadius) * 0.5;
    
    // Position is calculated in update
    this.x = 0;
    this.y = 0;
  }

  update() {
    this.angle += this.speed;
    this.x = Math.cos(this.angle) * this.orbitRadius;
    this.y = Math.sin(this.angle) * this.orbitRadius;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  isClicked(mouseX, mouseY) {
    const distance = Math.sqrt(Math.pow(mouseX - this.x, 2) + Math.pow(mouseY - this.y, 2));
    return distance < this.size + 5;
  }
}