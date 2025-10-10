class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.imageSmoothingEnabled = false;
    
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

    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    this.lastResizeTime = 0;
    this.resizeDebounceDelay = 250;
    
    this.lastMouseTime = 0;
    this.mouseThrottleDelay = 33;
    
    this.backgroundColor = '#00001a';
    
    this.rafId = null;
    this.isRunning = false;
    
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
    if (this.useOffscreenCanvas && typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      this.offscreenCtx.imageSmoothingEnabled = false;
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      const now = performance.now();
      if (now - this.lastResizeTime > this.resizeDebounceDelay) {
        this.resizeCanvas();
        this.lastResizeTime = now;
      }
    }, { passive: true });
    
    // Defensive mouse handlers: catch errors so they don't stop the RAF loop
    this.canvas.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - this.lastMouseTime > this.mouseThrottleDelay) {
        try {
          this.handleMouseMove(e);
        } catch (err) {
          console.error('handleMouseMove error:', err);
        }
        this.lastMouseTime = now;
      }
    }, { passive: true });
    
    this.canvas.addEventListener('click', (e) => {
      try {
        this.handleClick(e);
      } catch (err) {
        console.error('handleClick error:', err);
      }
    });
    
    window.addEventListener('popstate', () => this.handleRouteChange());
    
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
    this.activeView = new GalaxyView(this.projectData, this.canvas, this.aboutData);
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
    this.transitionState.duration = 60;
    document.getElementById('floating-profile-box').style.display = 'none';
  }

  async loadData() {
    try {
      const projectResponse = await fetch('data/projects.json');
      if (!projectResponse.ok) throw new Error('Failed to load projects.json');
      this.projectData = await projectResponse.json();

      let aboutData = null;
      try {
        const aboutResp = await fetch('data/about.json');
        if (aboutResp.ok) {
          aboutData = await aboutResp.json();
        }
      } catch (e) {
        // fall through to txt-based loading if about.json is missing/invalid
      }

      if (!aboutData) {
        let aboutText = '';
        let infoMeta = null;

        // load about.txt (long body)
        try {
          const aboutTxtResp = await fetch('data/about.txt');
          if (aboutTxtResp.ok) aboutText = await aboutTxtResp.text();
        } catch (e) {
          // ignore
        }

        // load info.txt (small metadata or plain help text)
        try {
          const infoTxtResp = await fetch('data/info.txt');
          if (infoTxtResp.ok) {
            const infoText = await infoTxtResp.text();
            try {
              infoMeta = JSON.parse(infoText);
            } catch (parseErr) {
              
              infoMeta = { help: { title: 'Hey...', body: infoText } };
            }
          }
        } catch (e) {
          
        }

        const helpObj = (infoMeta && infoMeta.help)
          ? infoMeta.help
          : { title: (infoMeta && infoMeta.title) || 'Hey...', body: (aboutText ? aboutText : (infoMeta && (infoMeta.info || infoMeta.body)) || 'This is my dev portfolio site.') };

        aboutData = {
          title: (infoMeta && infoMeta.title) || 'A Little About Me',
          info: aboutText || (infoMeta && (infoMeta.info || infoMeta.body)) || 'About content unavailable.',
          profileImage: (infoMeta && infoMeta.profileImage) || 'assets/images/james-escobedo-pfp-nobg.png',
          help: helpObj
        };
      }

      this.aboutData = aboutData;
    } catch (error) {
      console.error('Error loading data:', error);
      this.projectData = {};
      this.aboutData = { title: "About", info: "Content loading failed.", profileImage: 'assets/images/james-escobedo-pfp-nobg.png', help: { title: 'Help', body: '' } };
    }
  }

  update(currentTime) {
    if (!this.isRunning) return;

    if (currentTime - this.lastFrameTime < this.frameInterval) {
      this.rafId = requestAnimationFrame((time) => this.update(time));
      return;
    }

    let deltaTime = currentTime - this.lastFrameTime;
    // clamp deltaTime to avoid huge first-frame or resumed-frame jumps (ms)
    deltaTime = Math.min(deltaTime, 40);
    this.lastFrameTime = currentTime;

    const ts = this.transitionState;

    switch (this.appState) {
      case 'GALAXY':
      case 'SOLAR_SYSTEM':
      case 'ABOUT_VIEW':
        if (this.activeView) {
          try {
            this.activeView.update(this.mouseX, this.mouseY, deltaTime);
          } catch (err) {
            console.error('activeView.update error:', err);
          }
        }
        break;

      case 'FADING_OUT_GALAXY':
      case 'FADING_OUT_VIEW':
        ts.progress += 2;
        if (ts.progress >= ts.duration) {
          this.appState = this.appState === 'FADING_OUT_GALAXY' ? 'HYPERSPEED_IN' : 'HYPERSPEED_OUT';
          this.activeView = new Hyperspeed(this.canvas, this.appState === 'HYPERSPEED_IN' ? 'in' : 'out');
          ts.progress = 0;
          ts.duration = 120;
        }
        break;
        
      case 'HYPERSPEED_IN':
      case 'HYPERSPEED_OUT':
        if (this.activeView) {
          try {
            this.activeView.update(deltaTime);
          } catch (err) {
            console.error('hyperspeed.update error:', err);
          }
        }
        ts.progress += 2;
        if (ts.progress >= ts.duration) {
          this.appState = this.appState === 'HYPERSPEED_IN' ? 'PAUSE_BEFORE_NEW_VIEW' : 'PAUSE_BEFORE_GALAXY';
          this.activeView = null;
          ts.progress = 0;
          ts.duration = 30;
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
            this.activeView = new GalaxyView(this.projectData, this.canvas, this.aboutData);
            this.activeView.setTransitionCallback((project) => this.beginTransitionToSystem(project));
            this.activeView.setAboutTransitionCallback(() => this.beginTransitionToAbout());
          }
          ts.progress = 0;
          ts.duration = 60;
        }
        break;
        
      case 'FADING_IN_SOLAR':
      case 'FADING_IN_GALAXY':
      case 'FADING_IN_ABOUT':
        ts.progress += 2;
        if (this.activeView) this.activeView.update(this.mouseX, this.mouseY, deltaTime);
        if (ts.progress >= ts.duration) {
          if (this.appState === 'FADING_IN_SOLAR') this.appState = 'SOLAR_SYSTEM';
          else if (this.appState === 'FADING_IN_ABOUT') this.appState = 'ABOUT_VIEW';
          else this.appState = 'GALAXY';
        }
        break;
    }
    
    // defensive draw: ensure errors during draw don't stop the RAF loop
    try {
      this.draw();
    } catch (err) {
      console.error('draw error:', err);
    }
    this.rafId = requestAnimationFrame((time) => this.update(time));
  }

  draw() {
    const targetCtx = this.useOffscreenCanvas && this.offscreenCtx ? this.offscreenCtx : this.ctx;
    
    targetCtx.fillStyle = this.backgroundColor;
    targetCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const ts = this.transitionState;
    let fadeAlpha;

    switch (this.appState) {
      case 'GALAXY':
      case 'SOLAR_SYSTEM':
      case 'ABOUT_VIEW':
        if (this.activeView) {
          try {
            this.activeView.draw(targetCtx, 1.0);
          } catch (err) {
            console.error('activeView.draw error:', err);
          }
        }
        break;
        
      case 'FADING_OUT_GALAXY':
      case 'FADING_OUT_VIEW':
        fadeAlpha = 1.0 - (ts.progress / ts.duration);
        if (this.activeView) {
          try {
            this.activeView.draw(targetCtx, fadeAlpha);
          } catch (err) {
            console.error('activeView.draw error:', err);
          }
        }
        break;
        
      case 'HYPERSPEED_IN':
      case 'HYPERSPEED_OUT':
        const t = ts.progress / ts.duration;
        fadeAlpha = Math.sin(t * Math.PI);
        if (this.activeView) {
          try {
            this.activeView.draw(targetCtx, fadeAlpha);
          } catch (err) {
            console.error('activeView.draw error:', err);
          }
        }
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

  destroy() {
    this.pauseAnimations();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}

window.addEventListener('load', () => {
  const canvas = document.getElementById('galaxy-canvas');
  if (canvas) {
    try {
      const app = new App(canvas);
      app.start();
      
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