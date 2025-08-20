class StarSystem {
  constructor(project, canvas) {
    this.projectData = project;
    this.name = project.name;
    this.color = project.color;
    const maxDist = Math.min(canvas.width, canvas.height) / 2;

    this.x = (project.galaxyPosition.x - 0.5) * maxDist * 1.5;
    this.y = (project.galaxyPosition.y - 0.5) * maxDist * 1.5;
    
    this.baseRadius = 8;
    this.hoverRadius = 12;
    this.currentRadius = this.baseRadius;
    this.targetRadius = this.baseRadius;
    this.easingFactor = 0.1;
    this.isHovered = false;
  }

  setHover(isHovered) {
    this.isHovered = isHovered;
    this.targetRadius = isHovered ? this.hoverRadius : this.baseRadius;
  }
  
  update() {
    let ease = (this.targetRadius - this.currentRadius) * this.easingFactor;
    this.currentRadius += ease;
  }

  draw(ctx, globalAlpha = 1.0) {
    ctx.save();
    
    ctx.translate(this.x, this.y);

    const currentRadius = this.currentRadius;

    const starColor = this.color.replace(')', `, ${globalAlpha})`).replace('hsl', 'hsla');
    ctx.fillStyle = starColor;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    
    ctx.restore();
  }

  isClicked(mouseX, mouseY) {
    const distance = Math.sqrt(Math.pow(mouseX - this.x, 2) + Math.pow(mouseY - this.y, 2));
    return distance < this.hoverRadius;
  }
}