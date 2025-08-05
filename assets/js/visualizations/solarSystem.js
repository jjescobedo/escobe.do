class SolarSystemView {
  constructor(projectData, canvas, onBack) {
    this.projectData = projectData;
    this.canvas = canvas;
    this.onBack = onBack;
    this.planets = [];
    this.infoBox = new InfoBox();
    this.backButton = { x: 40, y: 40, radius: 20 };
    this.backgroundStars = [];

    for (let i = 0; i < 400; i++) {
        this.backgroundStars.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.5 + 0.1
        });
    }

    this.projectData.planets.forEach(pData => {
      this.planets.push(new Planet(pData));
    });
  }

  update(mouseX, mouseY) {
    this.planets.forEach(planet => planet.update());
    for (const star of this.backgroundStars) {
        star.y += 0.1;
        if (star.y > this.canvas.height) {
            star.y = 0;
            star.x = Math.random() * this.canvas.width;
        }
    }
  }

  draw(ctx, globalAlpha = 1.0) {
    for (const star of this.backgroundStars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * globalAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * globalAlpha})`;
    ctx.lineWidth = 1;
    this.planets.forEach(planet => {
      ctx.beginPath();
      ctx.arc(0, 0, planet.orbitRadius, 0, Math.PI * 2);
      ctx.stroke();
    });

    const sunData = this.projectData.sun;
    const sunColor = sunData.color.replace(')', `, ${globalAlpha})`).replace('hsl', 'hsla');
    ctx.fillStyle = sunColor;
    ctx.shadowColor = sunData.color;
    ctx.shadowBlur = 50;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    this.planets.forEach(planet => planet.draw(ctx, globalAlpha));
    ctx.restore();
    
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

    this.infoBox.draw(ctx, globalAlpha);
  }

  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const distToBack = Math.sqrt(Math.pow(mouseX - this.backButton.x, 2) + Math.pow(mouseY - this.backButton.y, 2));
    if (distToBack < this.backButton.radius) {
      if (this.onBack) this.onBack();
      return;
    }

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const clickX = mouseX - centerX;
    const clickY = mouseY - centerY;
    
    const sunDist = Math.sqrt(clickX * clickX + clickY * clickY);
    if (sunDist < 55) {
      this.infoBox.show(this.projectData.sun.name, this.projectData.sun.info, mouseX + 15, mouseY);
      return;
    }

    for (const planet of this.planets) {
      if (planet.isClicked(clickX, clickY)) {
        this.infoBox.show(planet.data.name, planet.data.info, mouseX + 15, mouseY);
        return;
      }
    }
    
    this.infoBox.hide();
  }
}