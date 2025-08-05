// nebula.js - James Escobedo's Mathematical Nebula Visualization

class NebulaVisualization {
    constructor(containerId, customName = "james escobedo") {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.canvas = null;
        this.isRunning = false;
        
        this.myName = customName;
        this.scl = 25;
        this.noiseFactor = 0.04;
        this.evolutionSpeed = 0.005;
        this.loadingDuration = 480;
        this.nameSeed = 0;
        this.zoff = 0;
        this.loadingProgress = 0;
        this.loadingSignalSent = false;
        
        this.initSketch();
    }
    
    initSketch() {
        this.p5Instance = new p5((sketch) => {
            this.sketch = sketch;
            
            sketch.setup = () => {
                const containerRect = this.container.getBoundingClientRect();
                
                this.canvas = sketch.createCanvas(containerRect.width, containerRect.height);
                this.canvas.parent(this.containerId);
                
                this.setupNebula(sketch);
                
                this.isRunning = true;
            };
            
            sketch.draw = () => {
                if (!this.isRunning) return;
                
                this.drawNebula(sketch);
            };
            
            sketch.windowResized = () => {
                this.handleResize(sketch);
            };
            
        }, this.container);
    }
    
    nameToSeed(name) {
        let seed = 0;
        for (let i = 0; i < name.length; i++) {
            seed += name.charCodeAt(i);
        }
        return seed;
    }
    
    onLoadingComplete() {
        console.log("Signal Sent: Nebula growth complete. All pixels are now active.");
    }
    
    setupNebula(sketch) {
        sketch.colorMode(sketch.HSB, 360, 100, 100, 100);
        this.nameSeed = this.nameToSeed(this.myName);
        sketch.noiseSeed(this.nameSeed);
        sketch.background(230, 60, 10);
        sketch.noStroke();
    }
    
    drawNebula(sketch) {
        this.loadingProgress = sketch.min(1.0, sketch.frameCount / this.loadingDuration);
        sketch.background(230, 60, 10, 15);
        
        let growthThreshold = sketch.pow(this.loadingProgress, 2.5);
        
        for (let y = 0; y < sketch.height; y += this.scl) {
            for (let x = 0; x < sketch.width; x += this.scl) {
                let n = sketch.noise(x * this.noiseFactor, y * this.noiseFactor, this.zoff);
                
                if (n < growthThreshold) {
                    let hue = sketch.map(n, 0, 1, 180, 280);
                    let saturation = sketch.map(n, 0, 1, 70, 100);
                    let brightness = sketch.map(n, 0, 1, 100, 80);
                    let alpha = sketch.map(this.loadingProgress, 0, 1, 40, 90);
                    
                    sketch.fill(hue, saturation, brightness, alpha);
                    sketch.rect(x, y, this.scl, this.scl);
                }
            }
        }
        
        this.zoff += this.evolutionSpeed;
        
        if (this.loadingProgress >= 1.0 && !this.loadingSignalSent) {
            this.onLoadingComplete();
            this.loadingSignalSent = true;
        }
    }
    
    handleResize(sketch) {
        const containerRect = this.container.getBoundingClientRect();
        sketch.resizeCanvas(containerRect.width, containerRect.height);
        
        sketch.frameCount = 0;
        this.loadingProgress = 0;
        this.loadingSignalSent = false;
        sketch.background(230, 60, 10);
    }
    
    start() {
        this.isRunning = true;
    }
    
    stop() {
        this.isRunning = false;
    }
    
    restart() {
        if (this.sketch) {
            this.sketch.frameCount = 0;
            this.loadingProgress = 0;
            this.loadingSignalSent = false;
            this.zoff = 0;
            this.sketch.background(230, 60, 10);
        }
    }
    
    changeName(newName) {
        this.myName = newName;
        this.nameSeed = this.nameToSeed(newName);
        if (this.sketch) {
            this.sketch.noiseSeed(this.nameSeed);
            this.restart();
        }
    }
    
    destroy() {
        if (this.p5Instance) {
            this.p5Instance.remove();
        }
    }
}

window.NebulaVisualization = NebulaVisualization;