class Hyperspeed {
  constructor(canvas, direction = 'in') {
    this.canvas = canvas;
    this.direction = direction;
    this.stars = [];
    
    for (let i = 0; i < 3000; i++) {
      this.stars.push(this.createStar());
    }
  }

  createStar() {
    return {
      angle: Math.random() * Math.PI * 2,
      distance: Math.random() * this.canvas.width * 2,
      speed: Math.random() * 2.5 + 1,
      size: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.75 + 0.25,
    };
  }

  update() {
    for (const star of this.stars) {
      if (this.direction === 'in') {
        star.distance += star.speed;
        if (star.distance > this.canvas.width / 2) {
          star.distance = 0;
          star.angle = Math.random() * Math.PI * 2;
        }
      } else {
        star.distance -= star.speed;
        if (star.distance < 0) {
          star.distance = this.canvas.width / 2;
          star.angle = Math.random() * Math.PI * 2;
        }
      }
    }
  }

  draw(ctx, globalAlpha) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    for (const star of this.stars) {
      const x = centerX + Math.cos(star.angle) * star.distance;
      const y = centerY + Math.sin(star.angle) * star.distance;

      const prevDist = this.direction === 'in' ? star.distance - star.speed * 2 : star.distance + star.speed * 2;
      const px = centerX + Math.cos(star.angle) * prevDist;
      const py = centerY + Math.sin(star.angle) * prevDist;
      
      const alpha = star.alpha * globalAlpha;

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = star.size;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
}