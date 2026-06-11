class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    assets: Record<string, HTMLImageElement>;
    loaded: number;
    toLoad: number;
    baseTileW: number;
    baseTileH: number;
    zoom: number;
    tileW: number;
    tileH: number;
    offsetX: number;
    offsetY: number;
    isDragging: boolean;
    lastMouseX: number;
    lastMouseY: number;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.assets = {};
        this.loaded = 0;
        this.toLoad = 0;

        this.baseTileW = 64;
        this.baseTileH = 32;
        this.zoom = 1.0;
        this.tileW = this.baseTileW * this.zoom;
        this.tileH = this.baseTileH * this.zoom;
        this.offsetX = this.width / 2;
        this.offsetY = 100;

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.setupInput();
    }

    setupInput(): void {
        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        window.addEventListener('mousemove', (e: MouseEvent) => {
            if (this.isDragging) {
                const dx: number = e.clientX - this.lastMouseX;
                const dy: number = e.clientY - this.lastMouseY;
                this.offsetX += dx;
                this.offsetY += dy;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        this.canvas.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();
            const zoomSpeed: number = 0.1;
            if (e.deltaY < 0) {
                this.zoom = Math.min(2.0, this.zoom + zoomSpeed);
            } else {
                this.zoom = Math.max(0.5, this.zoom - zoomSpeed);
            }
            this.tileW = this.baseTileW * this.zoom;
            this.tileH = this.baseTileH * this.zoom;
        }, { passive: false });
    }

    loadAssets(assetList: string[], callback: () => void): void {
        this.toLoad = assetList.length;
        assetList.forEach((name: string) => {
            const img: HTMLImageElement = new Image();
            img.src = `assets/${name}`;
            img.onload = () => {
                this.loaded++;
                if (this.loaded === this.toLoad) callback();
            };
            this.assets[name] = img;
        });
    }

    isoToScreen(gx: number, gy: number): ScreenPos {
        return {
            x: (gx - gy) * (this.tileW / 2) + this.offsetX,
            y: (gx + gy) * (this.tileH / 2) + this.offsetY
        };
    }

    clear(): void {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawTile(imgName: string, gx: number, gy: number, zIndexOffset: number = 0): void {
        if (!this.assets[imgName]) return;
        const pos: ScreenPos = this.isoToScreen(gx, gy);
        const img: HTMLImageElement = this.assets[imgName];

        let drawX: number = pos.x - (this.tileW / 2);
        let drawY: number = pos.y;

        const scaledW: number = img.width * this.zoom;
        const scaledH: number = img.height * this.zoom;

        if (imgName.includes('wall')) {
            drawY = pos.y + this.tileH - scaledH;
            drawX = pos.x - (scaledW / 2);
        } else if (imgName.includes('char') || imgName.includes('fridge') || imgName.includes('chair') || imgName.includes('table') || imgName.includes('bed') || imgName.includes('toilet')) {
            drawX = pos.x - (scaledW / 2);
            drawY = pos.y + this.tileH - scaledH;
        } else {
            drawX = pos.x - (scaledW / 2);
            drawY = pos.y;
        }

        if (imgName.includes('ghost')) {
            this.ctx.globalAlpha = 0.6;
        }
        if (imgName.includes('glitch')) {
            if (Math.random() > 0.5) this.ctx.globalAlpha = 0.8;
            drawX += (Math.random() - 0.5) * 5;
            drawY += (Math.random() - 0.5) * 5;
        }

        this.ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
        this.ctx.globalAlpha = 1.0;
    }

    drawText(text: string, gx: number, gy: number, color: string = "white"): void {
        if (!text) return;
        const pos: ScreenPos = this.isoToScreen(gx, gy);

        const tx: number = pos.x;
        const ty: number = pos.y - 40;

        this.ctx.font = "12px monospace";
        const padding: number = 6;
        const width: number = this.ctx.measureText(text).width + (padding * 2);
        const height: number = 20;

        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        this.ctx.beginPath();
        this.ctx.roundRect(tx - width / 2, ty - height / 2, width, height, 4);
        this.ctx.fill();

        this.ctx.fillStyle = color;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(text, tx, ty);
    }
}
