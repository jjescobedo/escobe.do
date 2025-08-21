class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Enable hardware acceleration and optimizations
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.imageSmoothingEnabled = false; // Disable for pixel-perfect rendering
    
    this.projectData = null;
    this.aboutData = null;
    this.activeView = null;
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.appState = 'LOADING';
    this.transitionState = {
      progress: 0,
      duration: 100,
      targetViewData: null
    };

    // Enhanced performance optimizations
    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    this.lastResizeTime = 0;
    this.resizeDebounceDelay = 250;
    
    // Mouse event throttling - more aggressive
    this.lastMouseTime = 0;
    this.mouseThrottleDelay = 33; // ~30fps instead of 60fps for mouse
    
    // Pre-allocate frequently used values
    this.backgroundColor = '#00001a';
    
    // RAF management
    this.rafId = null;
    this.isRunning = false;
    
    // Canvas optimization
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    this.useOffscreenCanvas = true;
    
    this.init();
  }

  init() {
    this.resizeCanvas();
    this.bindEvents();
    this.initOffscreenCanvas();
  }

  initOffscreenCanvas() {
    // Create offscreen canvas for complex scenes
    if (this.useOffscreenCanvas && typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      this.offscreenCtx.imageSmoothingEnabled = false;
    }
  }

  bindEvents() {
    // Passive event listeners for better performance
    window.addEventListener('resize', () => {
      const now = performance.now();
      if (now - this.lastResizeTime > this.resizeDebounceDelay) {
        this.resizeCanvas();
        this.lastResizeTime = now;
      }
    }, { passive: true });
    
    // More aggressive mouse throttling
    this.canvas.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - this.lastMouseTime > this.mouseThrottleDelay) {
        this.handleMouseMove(e);
        this.lastMouseTime = now;
      }
    }, { passive: true });
    
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    window.addEventListener('popstate', () => this.handleRouteChange());
    
    // Enhanced visibility API
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
      }
    }, { passive: true });
  }

  pauseAnimations() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resumeAnimations() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.update(this.lastFrameTime);
    }
  }

  async start() {
    await this.loadData();
    this.handleRouteChange();
    this.isRunning = true;
    this.update(performance.now());
  }

  // --- ROUTING LOGIC (unchanged) ---
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
    this.transitionState.duration = 40; // Reduced from 60
    this.transitionState.targetViewData = projectData;
  }

  beginTransitionToAbout() {
    history.pushState({}, 'About', '/about');
    this.appState = 'FADING_OUT_GALAXY';
    this.transitionState.progress = 0;
    this.transitionState.duration = 60; // Reduced from 60
    this.transitionState.targetViewData = { isAbout: true };
  }
  
  beginTransitionToGalaxy() {
    history.pushState({}, 'Galaxy', '/');
    this.appState = 'FADING_OUT_VIEW';
    this.transitionState.progress = 0;
    this.transitionState.duration = 60; // Reduced from 60
  }

  async loadData() {
    try {
      const [projectResponse, aboutResponse] = await Promise.all([
        fetch('data/projects.json'),
        fetch('data/about.json')
      ]);
      
      if (!projectResponse.ok || !aboutResponse.ok) {
        throw new Error('Failed to load data');
      }
      
      this.projectData = await projectResponse.json();
      this.aboutData = await aboutResponse.json();
    } catch (error) {
      console.error('Error loading data:', error);
      this.projectData = {};
      this.aboutData = { title: "About", info: "Content loading failed." };
    }
  }

  update(currentTime) {
    if (!this.isRunning) return;

    // More aggressive frame rate limiting
    if (currentTime - this.lastFrameTime < this.frameInterval) {
      this.rafId = requestAnimationFrame((time) => this.update(time));
      return;
    }

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    const ts = this.transitionState;

    switch (this.appState) {
      case 'GALAXY':
      case 'SOLAR_SYSTEM':
      case 'ABOUT_VIEW':
        if (this.activeView) {
          this.activeView.update(this.mouseX, this.mouseY, deltaTime);
        }
        break;

      case 'FADING_OUT_GALAXY':
      case 'FADING_OUT_VIEW':
        ts.progress += 2; // Faster transitions
        if (ts.progress >= ts.duration) {
          this.appState = this.appState === 'FADING_OUT_GALAXY' ? 'HYPERSPEED_IN' : 'HYPERSPEED_OUT';
          this.activeView = new Hyperspeed(this.canvas, this.appState === 'HYPERSPEED_IN' ? 'in' : 'out');
          ts.progress = 0;
          ts.duration = 120; // Reduced from 180
        }
        break;
        
      case 'HYPERSPEED_IN':
      case 'HYPERSPEED_OUT':
        if (this.activeView) this.activeView.update(deltaTime);
        ts.progress += 2; // Faster transitions
        if (ts.progress >= ts.duration) {
          this.appState = this.appState === 'HYPERSPEED_IN' ? 'PAUSE_BEFORE_NEW_VIEW' : 'PAUSE_BEFORE_GALAXY';
          this.activeView = null;
          ts.progress = 0;
          ts.duration = 30; // Reduced from 90
        }
        break;

      case 'PAUSE_BEFORE_NEW_VIEW':
      case 'PAUSE_BEFORE_GALAXY':
        ts.progress += 2; // Faster transitions
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
          ts.duration = 60; // Reduced from 120
        }
        break;
        
      case 'FADING_IN_SOLAR':
      case 'FADING_IN_GALAXY':
      case 'FADING_IN_ABOUT':
        ts.progress += 2; // Faster transitions
        if (this.activeView) this.activeView.update(this.mouseX, this.mouseY, deltaTime);
        if (ts.progress >= ts.duration) {
          if (this.appState === 'FADING_IN_SOLAR') this.appState = 'SOLAR_SYSTEM';
          else if (this.appState === 'FADING_IN_ABOUT') this.appState = 'ABOUT_VIEW';
          else this.appState = 'GALAXY';
        }
        break;
    }
    
    this.draw();
    this.rafId = requestAnimationFrame((time) => this.update(time));
  }

  draw() {
    // Use double buffering for complex scenes
    const targetCtx = this.useOffscreenCanvas && this.offscreenCtx ? this.offscreenCtx : this.ctx;
    
    // More efficient background clear
    targetCtx.fillStyle = this.backgroundColor;
    targetCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const ts = this.transitionState;
    let fadeAlpha;

    switch (this.appState) {
      case 'GALAXY':
      case 'SOLAR_SYSTEM':
      case 'ABOUT_VIEW':
        if (this.activeView) this.activeView.draw(targetCtx, 1.0);
        break;
        
      case 'FADING_OUT_GALAXY':
      case 'FADING_OUT_VIEW':
        fadeAlpha = 1.0 - (ts.progress / ts.duration);
        if (this.activeView) this.activeView.draw(targetCtx, fadeAlpha);
        break;
        
      case 'HYPERSPEED_IN':
      case 'HYPERSPEED_OUT':
        const t = ts.progress / ts.duration;
        fadeAlpha = Math.sin(t * Math.PI);
        if (this.activeView) this.activeView.draw(targetCtx, fadeAlpha);
        break;
        
      case 'PAUSE_BEFORE_NEW_VIEW':
      case 'PAUSE_BEFORE_GALAXY':
        break;
        
      case 'FADING_IN_SOLAR':
      case 'FADING_IN_GALAXY':
      case 'FADING_IN_ABOUT':
        fadeAlpha = ts.progress / ts.duration;
        if (this.activeView) this.activeView.draw(targetCtx, fadeAlpha);
        break;
    }

    // Copy offscreen canvas to main canvas if using double buffering
    if (this.useOffscreenCanvas && this.offscreenCtx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
  }
  
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    this.mouseY = (event.clientY - rect.top) * (this.canvas.height / rect.height);
  }
  
  handleClick(event) {
    if (this.activeView && this.activeView.handleClick && 
        ['GALAXY', 'SOLAR_SYSTEM', 'ABOUT_VIEW'].includes(this.appState)) {
      this.activeView.handleClick(event);
    }
  }

  resizeCanvas() {
    const devicePixelRatio = 1
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    this.canvas.width = width * devicePixelRatio;
    this.canvas.height = height * devicePixelRatio;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.ctx.imageSmoothingEnabled = false;
    
    if (this.useOffscreenCanvas && this.offscreenCanvas) {
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.offscreenCtx.scale(devicePixelRatio, devicePixelRatio);
      this.offscreenCtx.imageSmoothingEnabled = false;
    }
    
    if (this.activeView && this.activeView.resize) {
      this.activeView.resize(this.canvas);
    }
    
    if (this.projectData && this.aboutData) {
      this.handleRouteChange();
    }
  }

  // Cleanup method
  destroy() {
    this.pauseAnimations();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}

// Performance-aware initialization with error handling
window.addEventListener('load', () => {
  const canvas = document.getElementById('galaxy-canvas');
  if (canvas) {
    try {
      const app = new App(canvas);
      app.start();
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        app.destroy();
      });
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  } else {
    console.error('Canvas element not found');
  }
});