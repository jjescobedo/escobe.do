class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.projectData = null;
    this.aboutData = null; // New property for about content
    this.activeView = null;
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.appState = 'LOADING';
    this.transitionState = {
        progress: 0,
        duration: 60,
        targetViewData: null
    };

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('mousemove', e => this.handleMouseMove(e));
    this.canvas.addEventListener('click', e => this.handleClick(e));
    window.addEventListener('popstate', () => this.handleRouteChange());
  }

  async start() {
    await this.loadData();
    this.handleRouteChange();
    this.update();
  }

  // --- ROUTING LOGIC ---
  handleRouteChange() {
    const path = window.location.pathname;
    
    if (path.startsWith('/projects/')) {
        const projectId = path.split('/')[2];
        const project = Object.values(this.projectData).find(p => p.id === projectId);
        if (project) {
            this.appState = 'SOLAR_SYSTEM';
            this.activeView = new SolarSystemView(project, this.canvas, () => this.beginTransitionToGalaxy());
        } else {
            history.replaceState({}, '', '/');
            this.showGalaxy();
        }
    } else if (path === '/about') {
        this.appState = 'ABOUT_VIEW';
        this.activeView = new AboutView(this.aboutData, this.canvas, () => this.beginTransitionToGalaxy());
    } else {
        this.showGalaxy();
    }
  }

  // --- STATE TRANSITION INITIATORS ---
  showGalaxy() {
    this.appState = 'GALAXY';
    this.activeView = new GalaxyView(this.projectData, this.canvas);
    this.activeView.setTransitionCallback((project) => this.beginTransitionToSystem(project));
    this.activeView.setAboutTransitionCallback(() => this.beginTransitionToAbout());
  }

  beginTransitionToSystem(projectData) {
    if (!projectData) return;
    const url = `/projects/${projectData.id}`;
    history.pushState({}, projectData.name, url);

    this.appState = 'FADING_OUT_GALAXY';
    this.transitionState.progress = 0;
    this.transitionState.duration = 60;
    this.transitionState.targetViewData = projectData;
  }

  beginTransitionToAbout() {
    history.pushState({}, 'About', '/about');
    this.appState = 'FADING_OUT_GALAXY';
    this.transitionState.progress = 0;
    this.transitionState.duration = 60;
    this.transitionState.targetViewData = { isAbout: true }; // Use a flag
  }
  
  beginTransitionToGalaxy() {
    history.pushState({}, 'Galaxy', '/');
    this.appState = 'FADING_OUT_VIEW'; // A generic fade out state
    this.transitionState.progress = 0;
    this.transitionState.duration = 60;
  }

  async loadData() {
    const [projectResponse, aboutResponse] = await Promise.all([
        fetch('data/projects.json'),
        fetch('data/about.json')
    ]);
    this.projectData = await projectResponse.json();
    this.aboutData = await aboutResponse.json();
  }

  update() {
    const ts = this.transitionState;

    switch (this.appState) {
        case 'GALAXY':
        case 'SOLAR_SYSTEM':
        case 'ABOUT_VIEW':
            if (this.activeView) this.activeView.update(this.mouseX, this.mouseY);
            break;

        case 'FADING_OUT_GALAXY':
        case 'FADING_OUT_VIEW':
            ts.progress++;
            if (ts.progress >= ts.duration) {
                this.appState = this.appState === 'FADING_OUT_GALAXY' ? 'HYPERSPEED_IN' : 'HYPERSPEED_OUT';
                this.activeView = new Hyperspeed(this.canvas, this.appState === 'HYPERSPEED_IN' ? 'in' : 'out');
                ts.progress = 0;
                ts.duration = 180;
            }
            break;
            
        case 'HYPERSPEED_IN':
        case 'HYPERSPEED_OUT':
            if (this.activeView) this.activeView.update();
            ts.progress++;
            if (ts.progress >= ts.duration) {
                this.appState = this.appState === 'HYPERSPEED_IN' ? 'PAUSE_BEFORE_NEW_VIEW' : 'PAUSE_BEFORE_GALAXY';
                this.activeView = null;
                ts.progress = 0;
                ts.duration = 90;
            }
            break;

        case 'PAUSE_BEFORE_NEW_VIEW':
        case 'PAUSE_BEFORE_GALAXY':
            ts.progress++;
            if (ts.progress >= ts.duration) {
                if (this.appState === 'PAUSE_BEFORE_NEW_VIEW') {
                    if (ts.targetViewData.isAbout) {
                        this.appState = 'FADING_IN_ABOUT';
                        this.activeView = new AboutView(this.aboutData, this.canvas, () => this.beginTransitionToGalaxy());
                    } else {
                        this.appState = 'FADING_IN_SOLAR';
                        this.activeView = new SolarSystemView(ts.targetViewData, this.canvas, () => this.beginTransitionToGalaxy());
                    }
                } else {
                    this.appState = 'FADING_IN_GALAXY';
                    this.activeView = new GalaxyView(this.projectData, this.canvas);
                    this.activeView.setTransitionCallback((project) => this.beginTransitionToSystem(project));
                    this.activeView.setAboutTransitionCallback(() => this.beginTransitionToAbout());
                }
                ts.progress = 0;
                ts.duration = 120;
            }
            break;
            
        case 'FADING_IN_SOLAR':
        case 'FADING_IN_GALAXY':
        case 'FADING_IN_ABOUT':
            ts.progress++;
            if (this.activeView) this.activeView.update(this.mouseX, this.mouseY);
            if (ts.progress >= ts.duration) {
                if (this.appState === 'FADING_IN_SOLAR') this.appState = 'SOLAR_SYSTEM';
                else if (this.appState === 'FADING_IN_ABOUT') this.appState = 'ABOUT_VIEW';
                else this.appState = 'GALAXY';
            }
            break;
    }
    
    this.draw();
    requestAnimationFrame(() => this.update());
  }

  draw() {
    this.ctx.fillStyle = '#00001a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const ts = this.transitionState;
    let fadeAlpha;

    switch (this.appState) {
        case 'GALAXY':
        case 'SOLAR_SYSTEM':
        case 'ABOUT_VIEW':
            if (this.activeView) this.activeView.draw(this.ctx, 1.0);
            break;
        case 'FADING_OUT_GALAXY':
        case 'FADING_OUT_VIEW':
            fadeAlpha = 1.0 - (ts.progress / ts.duration);
            if (this.activeView) this.activeView.draw(this.ctx, fadeAlpha);
            break;
        case 'HYPERSPEED_IN':
        case 'HYPERSPEED_OUT':
            const t = ts.progress / ts.duration;
            fadeAlpha = Math.sin(t * Math.PI);
            if (this.activeView) this.activeView.draw(this.ctx, fadeAlpha);
            break;
        case 'PAUSE_BEFORE_NEW_VIEW':
        case 'PAUSE_BEFORE_GALAXY':
            break;
        case 'FADING_IN_SOLAR':
        case 'FADING_IN_GALAXY':
        case 'FADING_IN_ABOUT':
            fadeAlpha = ts.progress / ts.duration;
            if (this.activeView) this.activeView.draw(this.ctx, fadeAlpha);
            break;
    }
  }
  
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
  }
  
  handleClick(event) {
    if (this.activeView && this.activeView.handleClick && ['GALAXY', 'SOLAR_SYSTEM', 'ABOUT_VIEW'].includes(this.appState)) {
        this.activeView.handleClick(event);
    }
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.projectData && this.aboutData) {
      this.handleRouteChange();
    }
  }
}

window.addEventListener('load', () => {
  const canvas = document.getElementById('galaxy-canvas');
  const app = new App(canvas);
  app.start();
});