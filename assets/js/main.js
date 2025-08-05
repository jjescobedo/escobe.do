class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.projectData = null;
    this.activeView = null;
    this.mouseX = 0;
    this.mouseY = 0;
    
    // --- Advanced State Management ---
    this.appState = 'GALAXY';
    this.transitionState = {
        progress: 0,
        duration: 60, // Default duration for fades (1 sec)
        targetViewData: null
    };

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('mousemove', e => this.handleMouseMove(e));
    this.canvas.addEventListener('click', e => this.handleClick(e));
  }

  async start() {
    await this.loadData();
    this.showGalaxy();
    this.update();
  }

  // --- STATE TRANSITION INITIATORS ---
  showGalaxy() {
    this.appState = 'GALAXY';
    this.activeView = new GalaxyView(this.projectData, this.canvas);
    this.activeView.setTransitionCallback((project) => this.beginTransitionToSystem(project));
  }

  beginTransitionToSystem(projectData) {
    this.appState = 'FADING_OUT_GALAXY';
    this.transitionState.progress = 0;
    this.transitionState.duration = 60; // 1 second fade out
    this.transitionState.targetViewData = projectData;
  }
  
  beginTransitionToGalaxy() {
    this.appState = 'FADING_OUT_SOLAR';
    this.transitionState.progress = 0;
    this.transitionState.duration = 60; // 1 second fade out
  }

  async loadData() {
    const response = await fetch('data/projects.json');
    this.projectData = await response.json();
  }

  // --- MAIN UPDATE LOOP (THE STATE MACHINE) ---
  update() {
    const ts = this.transitionState;

    switch (this.appState) {
        case 'GALAXY':
        case 'SOLAR_SYSTEM':
            if (this.activeView) this.activeView.update(this.mouseX, this.mouseY);
            break;

        case 'FADING_OUT_GALAXY':
        case 'FADING_OUT_SOLAR':
            ts.progress++;
            if (ts.progress >= ts.duration) {
                this.appState = this.appState === 'FADING_OUT_GALAXY' ? 'HYPERSPEED_IN' : 'HYPERSPEED_OUT';
                this.activeView = new Hyperspeed(this.canvas, this.appState === 'HYPERSPEED_IN' ? 'in' : 'out');
                ts.progress = 0;
                ts.duration = 180; // 3 seconds for hyperspeed
            }
            break;
            
        case 'HYPERSPEED_IN':
        case 'HYPERSPEED_OUT':
            this.activeView.update();
            ts.progress++;
            if (ts.progress >= ts.duration) {
                this.appState = this.appState === 'HYPERSPEED_IN' ? 'PAUSE_BEFORE_SOLAR' : 'PAUSE_BEFORE_GALAXY';
                this.activeView = null; // Clear the hyperspeed view
                ts.progress = 0;
                ts.duration = 90; // 1.5 second pause
            }
            break;

        case 'PAUSE_BEFORE_SOLAR':
        case 'PAUSE_BEFORE_GALAXY':
            ts.progress++;
            if (ts.progress >= ts.duration) {
                if (this.appState === 'PAUSE_BEFORE_SOLAR') {
                    this.appState = 'FADING_IN_SOLAR';
                    this.activeView = new SolarSystemView(ts.targetViewData, this.canvas, () => this.beginTransitionToGalaxy());
                } else {
                    this.appState = 'FADING_IN_GALAXY';
                    this.activeView = new GalaxyView(this.projectData, this.canvas);
                    this.activeView.setTransitionCallback((project) => this.beginTransitionToSystem(project));
                }
                ts.progress = 0;
                ts.duration = 120; // 2 second fade in
            }
            break;
            
        case 'FADING_IN_SOLAR':
        case 'FADING_IN_GALAXY':
            ts.progress++;
            if (this.activeView) this.activeView.update(this.mouseX, this.mouseY); // Allow hover effects during fade in
            if (ts.progress >= ts.duration) {
                this.appState = this.appState === 'FADING_IN_SOLAR' ? 'SOLAR_SYSTEM' : 'GALAXY';
            }
            break;
    }
    
    this.draw();
    requestAnimationFrame(() => this.update());
  }

  // --- MAIN DRAW LOOP (STATE-DRIVEN) ---
  draw() {
    this.ctx.fillStyle = '#00001a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const ts = this.transitionState;
    let fadeAlpha;

    switch (this.appState) {
        case 'GALAXY':
        case 'SOLAR_SYSTEM':
            if (this.activeView) this.activeView.draw(this.ctx, 1.0);
            break;
        case 'FADING_OUT_GALAXY':
        case 'FADING_OUT_SOLAR':
            fadeAlpha = 1.0 - (ts.progress / ts.duration);
            if (this.activeView) this.activeView.draw(this.ctx, fadeAlpha);
            break;
        case 'HYPERSPEED_IN':
        case 'HYPERSPEED_OUT':
            const t = ts.progress / ts.duration;
            fadeAlpha = Math.sin(t * Math.PI);
            if (this.activeView) this.activeView.draw(this.ctx, fadeAlpha);
            break;
        case 'PAUSE_BEFORE_SOLAR':
        case 'PAUSE_BEFORE_GALAXY':
            break;
        case 'FADING_IN_SOLAR':
        case 'FADING_IN_GALAXY':
            fadeAlpha = ts.progress / ts.duration;
            if (this.activeView) this.activeView.draw(this.ctx, fadeAlpha);
            break;
    }
  }
  
  // --- Event Handlers ---
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
  }
  
  handleClick(event) {
    if (this.activeView && this.activeView.handleClick && (this.appState === 'GALAXY' || this.appState === 'SOLAR_SYSTEM')) {
        this.activeView.handleClick(event);
    }
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.projectData) {
      this.showGalaxy();
    }
  }
}

window.addEventListener('load', () => {
  const canvas = document.getElementById('galaxy-canvas');
  const app = new App(canvas);
  app.start();
});