class StarSystem {
  constructor(project, canvas) {
    this.projectData = project;
    this.name = project.name;
    this.color = project.color;
    const maxDist = Math.min(canvas.width, canvas.height) / 2;

    this.x = (project.galaxyPosition.x - 0.5) * maxDist * 1.5;
    this.y = (project.galaxyPosition.y - 0.5) * maxDist * 1.5;
    
    // --- Properties for smooth animation ---
    this.baseRadius = 8;
    this.hoverRadius = 12;
    this.currentRadius = this.baseRadius;
    this.targetRadius = this.baseRadius;
    this.easingFactor = 0.1; // Controls how fast the animation is
    this.isHovered = false;
  }

  setHover(isHovered) {
    this.isHovered = isHovered;
    this.targetRadius = isHovered ? this.hoverRadius : this.baseRadius;
  }
  
  // --- NEW METHOD ---
  // This runs every frame to smoothly adjust the radius
  update() {
    let ease = (this.targetRadius - this.currentRadius) * this.easingFactor;
    this.currentRadius += ease;
  }

  draw(ctx) {
    // This class is now ONLY responsible for drawing the star circle.
    // The tooltip is handled by GalaxyView to ensure it's on top and not rotated.
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    // Use the smoothly-animated currentRadius
    ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  isClicked(mouseX, mouseY) {
    const distance = Math.sqrt(Math.pow(mouseX - this.x, 2) + Math.pow(mouseY - this.y, 2));
    return distance < this.hoverRadius;
  }
}