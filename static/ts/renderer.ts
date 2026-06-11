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
    viewVersion: number;

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

        this.baseTileW = VISUAL.TILE_WIDTH;
        this.baseTileH = VISUAL.TILE_HEIGHT;
        this.zoom = 1.0;
        this.tileW = this.baseTileW * this.zoom;
        this.tileH = this.baseTileH * this.zoom;
        this.offsetX = VISUAL.MODE === 'topdown' ? 120 : this.width / 2;
        this.offsetY = 80;

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.viewVersion = 0;

        this.setupInput();
    }

    markViewDirty(): void {
        this.viewVersion++;
    }

    setupInput(): void {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.markViewDirty();
        });

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
                this.markViewDirty();
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
            this.markViewDirty();
        }, { passive: false });
    }

    loadAssets(assetList: string[], callback: () => void): void {
        this.toLoad = assetList.length;
        if (this.toLoad === 0) {
            callback();
            return;
        }
        assetList.forEach((name: string) => {
            const img: HTMLImageElement = new Image();
            const markDone = () => {
                this.loaded++;
                if (this.loaded === this.toLoad) callback();
            };
            img.onload = markDone;
            img.onerror = () => {
                console.warn('Failed to load asset:', name);
                markDone();
            };
            img.src = `assets/${name}`;
            this.assets[name] = img;
        });
    }

    isoToScreen(gx: number, gy: number): ScreenPos {
        if (VISUAL.MODE === 'topdown') {
            return {
                x: gx * this.tileW + this.offsetX,
                y: gy * this.tileH + this.offsetY
            };
        }
        return {
            x: (gx - gy) * (this.tileW / 2) + this.offsetX,
            y: (gx + gy) * (this.tileH / 2) + this.offsetY
        };
    }

    screenToGrid(screenX: number, screenY: number): PathNode {
        if (VISUAL.MODE === 'topdown') {
            return {
                x: Math.floor((screenX - this.offsetX) / this.tileW),
                y: Math.floor((screenY - this.offsetY) / this.tileH)
            };
        }
        const tileHalfW: number = this.tileW / 2;
        const tileHalfH: number = this.tileH / 2;
        const relX: number = screenX - this.offsetX;
        const relY: number = screenY - this.offsetY;
        return {
            x: Math.floor((relX / tileHalfW + relY / tileHalfH) / 2),
            y: Math.floor((relY / tileHalfH - relX / tileHalfW) / 2)
        };
    }

    clear(): void {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawTile(imgName: string, gx: number, gy: number, zIndexOffset: number = 0): void {
        if (VISUAL.MODE === 'topdown') {
            this.drawTopDownTile(imgName, gx, gy);
            return;
        }
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

    mapTopDownAsset(imgName: string): string {
        const map: Record<string, string> = {
            'floor.png': 'vendor/interior/floor_concrete.png',
            'floor_wood.png': 'vendor/interior/floor_wood.png',
            'floor_tile.png': 'vendor/interior/floor_tile.png',
            'wall_left.png': 'vendor/interior/wall.png',
            'wall_right.png': 'vendor/interior/wall.png',
            'fridge.png': 'vendor/interior/fridge.png',
            'stove.png': 'vendor/interior/stove.png',
            'table.png': 'vendor/interior/table.png',
            'chair.png': 'vendor/interior/chair.png',
            'sofa.png': 'vendor/interior/sofa.png',
            'bed.png': 'vendor/interior/bed.png',
            'toilet.png': 'vendor/interior/toilet.png',
            'shower.png': 'vendor/interior/bathtub.png',
            'sink.png': 'vendor/interior/mirror.png',
            'plant.png': 'vendor/interior/plant_small.png',
            'rug.png': 'vendor/interior/crate.png',
            'computer.png': 'vendor/interior/papers.png',
            'radio.png': 'vendor/interior/bottle.png',
            'tv.png': 'vendor/interior/bookshelf.png',
            'bottle.png': 'vendor/interior/bottle.png',
            'papers.png': 'vendor/interior/papers.png',
            'crate.png': 'vendor/interior/crate.png'
        };
        return map[imgName] || imgName;
    }

    drawTopDownTile(imgName: string, gx: number, gy: number): void {
        const mapped: string = this.mapTopDownAsset(imgName);
        const img: HTMLImageElement | undefined = this.assets[mapped];
        if (!img) return;

        const pos: ScreenPos = this.isoToScreen(gx, gy);
        const isFloorOrWall: boolean = mapped.includes('floor_') || mapped.includes('/wall');
        const drawW: number = isFloorOrWall ? this.tileW : img.width * this.zoom * VISUAL.PROP_SCALE;
        const drawH: number = isFloorOrWall ? this.tileH : img.height * this.zoom * VISUAL.PROP_SCALE;
        const drawX: number = isFloorOrWall ? pos.x : pos.x + this.tileW / 2 - drawW / 2;
        const drawY: number = isFloorOrWall ? pos.y : pos.y + this.tileH - drawH;

        this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    drawSpriteFrame(imgName: string, gx: number, gy: number, frameW: number, frameH: number, frame: number, scale: number = 1): void {
        const img: HTMLImageElement | undefined = this.assets[imgName];
        if (!img) return;

        const frames: number = Math.max(1, Math.floor(img.width / frameW));
        const frameIndex: number = Math.abs(frame) % frames;
        const pos: ScreenPos = this.isoToScreen(gx, gy);
        const drawW: number = frameW * this.zoom * scale;
        const drawH: number = frameH * this.zoom * scale;
        const drawX: number = VISUAL.MODE === 'topdown' ? pos.x + this.tileW / 2 - drawW / 2 : pos.x - drawW / 2;
        const drawY: number = VISUAL.MODE === 'topdown' ? pos.y + this.tileH - drawH : pos.y + this.tileH - drawH;

        this.ctx.drawImage(
            img,
            frameIndex * frameW,
            0,
            frameW,
            frameH,
            drawX,
            drawY,
            drawW,
            drawH
        );
    }

    drawText(text: string, gx: number, gy: number, color: string = "white"): void {
        if (!text) return;
        const pos: ScreenPos = this.isoToScreen(gx, gy);

        const tx: number = pos.x;
        const ty: number = VISUAL.MODE === 'topdown' ? pos.y - 14 : pos.y - 40;

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
