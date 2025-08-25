class SolarSystemView {
  constructor(projectData, canvas, onBack) {
    this.projectData = projectData;
    this.canvas = canvas;
    this.onBack = onBack;
    this.planets = [];
    this.modal = new ProjectModal();
    this.backButton = { x: 40, y: 40, radius: 20 };
    
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    
    this.backgroundStars = [];
    this.starCount = 200;
    this.initializeBackgroundStars();
    
    if (this.projectData.planets) {
      this.projectData.planets.forEach(pData => {
        this.planets.push(new Planet(pData));
      });
    }
    
    const sunData = this.projectData.sun;
    this.sunColor = sunData.color || 'hsl(60, 100%, 100%)';
    this.sunRadius = 50;
    
    this.lastUpdateTime = 0;
    this.updateInterval = 16; // ~60fps
    
    this.recycledStars = [];
    this.animatedName = '';
    this.animatedDate = '';
    this.nameTypingProgress = 0;
    this.dateTypingProgress = 0;
    this.nameTypingDone = false;
    this.dateTypingDone = false;
    this.typingStartTime = null;
    this.typingSpeed = 150;
    this.dateTypingSpeed = 80;
  }

  initializeBackgroundStars() {
    for (let i = 0; i < this.starCount; i++) {
      this.backgroundStars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        speed: 0.05 + Math.random() * 0.1
      });
    }
  }

  update(mouseX, mouseY) {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = currentTime;

    for (let i = 0; i < this.planets.length; i++) {
      this.planets[i].update();
    }
    
    for (let i = 0; i < this.backgroundStars.length; i++) {
      const star = this.backgroundStars[i];
      star.y += star.speed;
      
      if (star.y > this.canvas.height) {
        star.y = -star.size;
        star.x = Math.random() * this.canvas.width;
      }
    }
    
    if (this.centerX !== this.canvas.width / 2 || this.centerY !== this.canvas.height / 2) {
      this.centerX = this.canvas.width / 2;
      this.centerY = this.canvas.height / 2;
    }
    if (!this.nameTypingDone) {
      if (!this.typingStartTime) {
        this.typingStartTime = currentTime;
      }
      const name = this.projectData.name || '';
      const elapsed = currentTime - this.typingStartTime;
      const charsToShow = Math.min(name.length, Math.floor(elapsed / this.typingSpeed));
      this.animatedName = name.substring(0, charsToShow);
      this.nameTypingProgress = charsToShow;
      if (charsToShow === name.length) {
        this.nameTypingDone = true;
        this.dateTypingStartTime = currentTime;
      }
    } else if (!this.dateTypingDone) {
      const dateStr = this.projectData.date ? `Discovered ${this.projectData.date}` : '';
      if (!this.dateTypingStartTime) {
        this.dateTypingStartTime = currentTime;
      }
      const elapsedDate = currentTime - this.dateTypingStartTime;
      const charsToShow = Math.min(dateStr.length, Math.floor(elapsedDate / this.dateTypingSpeed));
      this.animatedDate = dateStr.substring(0, charsToShow);
      this.dateTypingProgress = charsToShow;
      if (charsToShow === dateStr.length) {
        this.dateTypingDone = true;
      }
    }
  }

  draw(ctx, globalAlpha = 1.0) {
    this.drawBackgroundStars(ctx, globalAlpha);
    
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * globalAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < this.planets.length; i++) {
      ctx.moveTo(this.planets[i].orbitRadius, 0);
      ctx.arc(0, 0, this.planets[i].orbitRadius, 0, Math.PI * 2);
    }
    ctx.stroke();

    this.drawSun(ctx, globalAlpha);

    for (let i = 0; i < this.planets.length; i++) {
      this.planets[i].draw(ctx, globalAlpha);
    }
    
    ctx.restore();
    
    this.drawUI(ctx, globalAlpha);
    this.drawAnimatedHeader(ctx, globalAlpha);
  }

  drawBackgroundStars(ctx, globalAlpha) {
    ctx.save();
    
    for (let i = 0; i < this.backgroundStars.length; i++) {
      const star = this.backgroundStars[i];
      const alpha = star.alpha * globalAlpha;
      
      if (alpha > 0.05) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }

  drawSun(ctx, globalAlpha) {
    const sunFillColor = this.sunColor.replace(')', `, ${globalAlpha})`).replace('hsl', 'hsla');
    
    ctx.fillStyle = sunFillColor;
    ctx.shadowColor = this.sunColor;
    ctx.shadowBlur = 50;
    
    ctx.beginPath();
    ctx.arc(0, 0, this.sunRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }

  drawUI(ctx, globalAlpha) {
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
  }

  drawAnimatedHeader(ctx, globalAlpha) {
    const leftPad = this.backButton.x + this.backButton.radius + 18;
    const topPad = 18;
    ctx.save();
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = `rgba(255,255,255,${globalAlpha})`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.animatedName, leftPad, topPad);

    if (this.animatedDate) {
      ctx.font = '16px monospace';
      ctx.fillStyle = `rgba(200,200,255,${globalAlpha})`;
      ctx.fillText(this.animatedDate, leftPad, topPad + 34);
    }
    ctx.restore();
  }
  handleClick(event) {
    if (this.modal.isOpen) {
      this.modal.hide();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const backDeltaX = mouseX - this.backButton.x;
    const backDeltaY = mouseY - this.backButton.y;
    const backDistance = backDeltaX * backDeltaX + backDeltaY * backDeltaY;
    
    if (backDistance < this.backButton.radius * this.backButton.radius) {
      if (this.onBack) this.onBack();
      return;
    }

    const clickX = mouseX - this.centerX;
    const clickY = mouseY - this.centerY;
    
    const sunDistanceSquared = clickX * clickX + clickY * clickY;
    const sunClickRadius = 55;
    if (sunDistanceSquared < sunClickRadius * sunClickRadius) {
      let sunData = { ...this.projectData.sun };
      if (this.projectData.image) {
        sunData.image = `assets/images/projects/${this.projectData.image}`;
      }
      this.modal.show(sunData);
      return;
    }

    for (let i = 0; i < this.planets.length; i++) {
      if (this.planets[i].isClicked(clickX, clickY)) {
        this.modal.show(this.planets[i].data);
        return;
      }
    }
  }

  resize(canvas) {
    this.canvas = canvas;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    
    for (let i = 0; i < this.backgroundStars.length; i++) {
      const star = this.backgroundStars[i];
      if (star.x > canvas.width || star.y > canvas.height) {
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
      }
    }
  }
}