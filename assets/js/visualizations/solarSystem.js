class SolarSystemView {
  constructor(projectData, canvas, onBack) {
    this.projectData = projectData;
    this.canvas = canvas;
    this.onBack = onBack;
    this.planets = [];
    this.modal = new ProjectModal();
    this.backButton = { x: 40, y: 40, radius: 20 };
    
    // Pre-calculate center position
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    
    // Optimized background stars - fewer stars, better performance
    this.backgroundStars = [];
    this.starCount = 200; // Reduced from 400
    this.initializeBackgroundStars();
    
    // Initialize planets
    if (this.projectData.planets) {
      this.projectData.planets.forEach(pData => {
        this.planets.push(new Planet(pData));
      });
    }
    
    // Pre-calculate sun properties
    const sunData = this.projectData.sun;
    this.sunColor = sunData.color || 'hsl(60, 100%, 100%)';
    this.sunRadius = 50;
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.updateInterval = 16; // ~60fps
    
    // Star recycling pool
    this.recycledStars = [];
    // Animated system name reveal
    this.animatedName = '';
    this.animatedDate = '';
    this.nameTypingProgress = 0;
    this.dateTypingProgress = 0;
    this.nameTypingDone = false;
    this.dateTypingDone = false;
    this.typingStartTime = null;
    this.typingSpeed = 150; // ms per character
    this.dateTypingSpeed = 80; // ms per character (date types a bit faster)
  }

  initializeBackgroundStars() {
    for (let i = 0; i < this.starCount; i++) {
      this.backgroundStars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        speed: 0.05 + Math.random() * 0.1 // Variable speed for depth
      });
    }
  }

  update(mouseX, mouseY) {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = currentTime;

    // Always update planets - no modal checks
    for (let i = 0; i < this.planets.length; i++) {
      this.planets[i].update();
    }
    
    // Optimized star animation with recycling
    for (let i = 0; i < this.backgroundStars.length; i++) {
      const star = this.backgroundStars[i];
      star.y += star.speed;
      
      if (star.y > this.canvas.height) {
        // Recycle star instead of creating new properties
        star.y = -star.size;
        star.x = Math.random() * this.canvas.width;
      }
    }
    
    // Update center position if canvas was resized
    if (this.centerX !== this.canvas.width / 2 || this.centerY !== this.canvas.height / 2) {
      this.centerX = this.canvas.width / 2;
      this.centerY = this.canvas.height / 2;
    }
    // Animated system name and discovered date typing effect
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
      // Type out the discovered date
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
    // Batch draw background stars
    this.drawBackgroundStars(ctx, globalAlpha);
    
    // Save context once for all solar system elements
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Draw orbit paths with single style setting
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * globalAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < this.planets.length; i++) {
      ctx.moveTo(this.planets[i].orbitRadius, 0);
      ctx.arc(0, 0, this.planets[i].orbitRadius, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Draw sun with cached color
    this.drawSun(ctx, globalAlpha);

    // Draw all planets
    for (let i = 0; i < this.planets.length; i++) {
      this.planets[i].draw(ctx, globalAlpha);
    }
    
    ctx.restore();
    
    // Draw UI elements
    this.drawUI(ctx, globalAlpha);
    // Draw animated system name and date in top left
    this.drawAnimatedHeader(ctx, globalAlpha);
  }

  drawBackgroundStars(ctx, globalAlpha) {
    // Batch draw stars with minimal context changes
    ctx.save();
    
    for (let i = 0; i < this.backgroundStars.length; i++) {
      const star = this.backgroundStars[i];
      const alpha = star.alpha * globalAlpha;
      
      if (alpha > 0.05) { // Skip nearly invisible stars
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
    
    ctx.shadowBlur = 0; // Reset shadow to avoid affecting other elements
  }

  drawUI(ctx, globalAlpha) {
    // Draw back button
    ctx.strokeStyle = `rgba(255, 255, 255, ${globalAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.backButton.x, this.backButton.y, this.backButton.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw back arrow
    ctx.font = '20px monospace';
    ctx.fillStyle = `rgba(255, 255, 255, ${globalAlpha})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('<', this.backButton.x, this.backButton.y);
  }

  drawAnimatedHeader(ctx, globalAlpha) {
    // Position just right of back button
    const leftPad = this.backButton.x + this.backButton.radius + 18;
    const topPad = 18;
    // Use galaxy font style
    ctx.save();
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = `rgba(255,255,255,${globalAlpha})`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.animatedName, leftPad, topPad);

    // Draw date below name as it types out
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

    // Check back button with cached distance calculation
    const backDeltaX = mouseX - this.backButton.x;
    const backDeltaY = mouseY - this.backButton.y;
    const backDistance = backDeltaX * backDeltaX + backDeltaY * backDeltaY; // Skip sqrt for comparison
    
    if (backDistance < this.backButton.radius * this.backButton.radius) {
      if (this.onBack) this.onBack();
      return;
    }

    // Convert to solar system coordinates
    const clickX = mouseX - this.centerX;
    const clickY = mouseY - this.centerY;
    
    // Check sun click with cached calculation
    const sunDistanceSquared = clickX * clickX + clickY * clickY;
    const sunClickRadius = 55;
    
    if (sunDistanceSquared < sunClickRadius * sunClickRadius) {
      this.modal.show(this.projectData.sun);
      return;
    }

    // Check planet clicks
    for (let i = 0; i < this.planets.length; i++) {
      if (this.planets[i].isClicked(clickX, clickY)) {
        this.modal.show(this.planets[i].data);
        return;
      }
    }
  }

  // Method to handle canvas resize
  resize(canvas) {
    this.canvas = canvas;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    
    // Redistribute background stars
    for (let i = 0; i < this.backgroundStars.length; i++) {
      const star = this.backgroundStars[i];
      if (star.x > canvas.width || star.y > canvas.height) {
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
      }
    }
  }
}