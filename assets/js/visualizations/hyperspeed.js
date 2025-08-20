class Hyperspeed {
  constructor(canvas, direction = 'in') {
    this.canvas = canvas;
    this.direction = direction;
    
    // Calculate diagonal distance for full coverage
    const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    this.maxDistance = diagonal * 0.6;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    
    // Reduced star count for better performance
    this.starCount = 1000;
    
    // Use typed arrays for better performance
    this.starAngles = new Float32Array(this.starCount);
    this.starDistances = new Float32Array(this.starCount);
    this.starSpeeds = new Float32Array(this.starCount);
    this.starSizes = new Float32Array(this.starCount);
    this.starAlphas = new Float32Array(this.starCount);
    this.starTrailLengths = new Float32Array(this.starCount);
    
    // Pre-allocate arrays for drawing calculations
    this.starPositions = new Float32Array(this.starCount * 4); // x1, y1, x2, y2 for each star
    
    // Initialize stars
    this.initializeStars();
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.updateInterval = 15;
    
    // Viewport culling bounds (with buffer)
    this.cullBuffer = 200;
    this.minX = -this.cullBuffer;
    this.maxX = canvas.width + this.cullBuffer;
    this.minY = -this.cullBuffer;
    this.maxY = canvas.height + this.cullBuffer;
  }

  initializeStars() {
    for (let i = 0; i < this.starCount; i++) {
      this.starAngles[i] = Math.random() * Math.PI * 2;
      
      if (this.direction === 'in') {
        this.starDistances[i] = Math.random() * this.maxDistance;
      } else {
        this.starDistances[i] = Math.pow(Math.random(), 0.5) * this.maxDistance;
      }
      
      this.starSpeeds[i] = Math.random() * 3 + 1.5;
      this.starSizes[i] = Math.random() * 2 + 0.5;
      this.starAlphas[i] = Math.random() * 0.8 + 0.2;
      this.starTrailLengths[i] = Math.random() * 8 + 4;
    }
  }

  update() {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = currentTime;

    // Batch update all stars
    for (let i = 0; i < this.starCount; i++) {
      if (this.direction === 'in') {
        this.starDistances[i] += this.starSpeeds[i];
        if (this.starDistances[i] > this.maxDistance) {
          this.starDistances[i] = 0;
          this.starAngles[i] = Math.random() * Math.PI * 2;
          this.starSpeeds[i] = Math.random() * 3 + 1.5;
        }
      } else {
        this.starDistances[i] -= this.starSpeeds[i];
        if (this.starDistances[i] < 0) {
          this.starDistances[i] = this.maxDistance;
          this.starAngles[i] = Math.random() * Math.PI * 2;
          this.starSpeeds[i] = Math.random() * 3 + 1.5;
        }
      }
    }

    // Pre-calculate positions for drawing
    this.calculateStarPositions();
  }

  calculateStarPositions() {
    for (let i = 0; i < this.starCount; i++) {
      const angle = this.starAngles[i];
      const distance = this.starDistances[i];
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      
      // Current position
      const x = this.centerX + cosAngle * distance;
      const y = this.centerY + sinAngle * distance;
      
      // Trail start position
      const trailDistance = this.direction === 'in' 
        ? distance - this.starTrailLengths[i] 
        : distance + this.starTrailLengths[i];
      const px = this.centerX + cosAngle * trailDistance;
      const py = this.centerY + sinAngle * trailDistance;
      
      // Store positions
      this.starPositions[i * 4] = px;
      this.starPositions[i * 4 + 1] = py;
      this.starPositions[i * 4 + 2] = x;
      this.starPositions[i * 4 + 3] = y;
    }
  }

  draw(ctx, globalAlpha) {
    // Batch drawing with minimal context state changes
    ctx.save();
    ctx.lineCap = 'round';
    
    let visibleStars = 0;
    
    for (let i = 0; i < this.starCount; i++) {
      const px = this.starPositions[i * 4];
      const py = this.starPositions[i * 4 + 1];
      const x = this.starPositions[i * 4 + 2];
      const y = this.starPositions[i * 4 + 3];
      
      // Viewport culling - only draw stars that are visible
      if (x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY) {
        const alpha = this.starAlphas[i] * globalAlpha;
        const size = this.starSizes[i];
        
        if (alpha > 0.01) { // Skip nearly transparent stars
          // Use gradient for smooth trails (cached when possible)
          const gradient = ctx.createLinearGradient(px, py, x, y);
          gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
          gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
          
          visibleStars++;
        }
      }
    }
    
    ctx.restore();
  }

  // Method to handle canvas resize
  resize(canvas) {
    this.canvas = canvas;
    const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    this.maxDistance = diagonal * 0.6;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    
    // Update culling bounds
    this.minX = -this.cullBuffer;
    this.maxX = canvas.width + this.cullBuffer;
    this.minY = -this.cullBuffer;
    this.maxY = canvas.height + this.cullBuffer;
  }
}