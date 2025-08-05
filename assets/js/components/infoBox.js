class InfoBox {
  constructor() {
    this.isOpen = false;
    this.title = '';
    this.text = '';
    this.x = 0;
    this.y = 0;
  }

  show(title, text, x, y) {
    this.title = title;
    this.text = text;
    this.x = x;
    this.y = y;
    this.isOpen = true;
  }

  hide() {
    this.isOpen = false;
  }

  draw(ctx) {
    if (!this.isOpen) return;

    ctx.font = '14px monospace';
    const lines = this.text.split('\n'); // Simple line breaks
    let maxWidth = ctx.measureText(this.title).width;
    lines.forEach(line => {
      const lineWidth = ctx.measureText(line).width;
      if (lineWidth > maxWidth) maxWidth = lineWidth;
    });

    const padding = 15;
    const lineHeight = 20;
    const boxWidth = maxWidth + padding * 2;
    const boxHeight = (lines.length + 1) * lineHeight + padding * 2;

    // Draw box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.fillRect(this.x, this.y, boxWidth, boxHeight);
    ctx.strokeRect(this.x, this.y, boxWidth, boxHeight);

    // Draw title (bold)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.title, this.x + padding, this.y + padding);

    // Draw info text
    ctx.font = '14px monospace';
    lines.forEach((line, i) => {
      ctx.fillText(line, this.x + padding, this.y + padding + lineHeight * (i + 1.2));
    });
  }
}