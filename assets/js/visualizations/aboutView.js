class AboutView {
  constructor(aboutData, canvas, onBack) {
    this.aboutData = aboutData;
    this.canvas = canvas;
    this.onBack = onBack;
    this.infoBox = new InfoBox();
    this.backButton = { x: 40, y: 40, radius: 20 };
    this.backgroundStars = [];
    this.pulse = 0;
    this.radius = 100;

    // Generate a simple, static starfield for the background
    for (let i = 0; i < 400; i++) {
        this.backgroundStars.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.5 + 0.1
        });
    }
  }

  update() {
    // Add the same pulsing effect for consistency
    this.pulse = Math.sin(Date.now() * 0.001) * 5;
  }

  draw(ctx, globalAlpha = 1.0) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Layer 1: Draw the background stars
    for (const star of this.backgroundStars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * globalAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Layer 2: Draw the main "Black Hole" object
    const currentRadius = this.radius + this.pulse;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, currentRadius * 1.5);
    gradient.addColorStop(0, `rgba(10, 5, 20, ${globalAlpha})`);
    gradient.addColorStop(0.8, `rgba(50, 30, 80, ${globalAlpha * 0.5})`);
    gradient.addColorStop(1, `rgba(100, 80, 150, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(0, 0, 0, ${globalAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Layer 3: Draw UI
    ctx.strokeStyle = `rgba(255, 255, 255, ${globalAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.backButton.x, this.backButton.y, this.backButton.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '20px monospace';
    ctx.fillStyle = `rgba(255, 255, 255, ${globalAlpha})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('<', this.backButton.x, this.backButton.y);

    // Center the info box when it's open
    if (this.infoBox.isOpen) {
        this.infoBox.x = (this.canvas.width - this.infoBox.boxWidth) / 2;
        this.infoBox.y = (this.canvas.height - this.infoBox.boxHeight) / 2;
    }
    this.infoBox.draw(ctx, globalAlpha);
  }

  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (this.infoBox.isOpen) {
        this.infoBox.hide();
        return;
    }

    const distToBack = Math.sqrt(Math.pow(mouseX - this.backButton.x, 2) + Math.pow(mouseY - this.backButton.y, 2));
    if (distToBack < this.backButton.radius) {
      if (this.onBack) this.onBack();
      return;
    }

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const distToCenter = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
    if (distToCenter < this.radius) {
        this.infoBox.show(this.aboutData.title, this.aboutData.info, 0, 0); // Position is recalculated in draw
    }
  }
}