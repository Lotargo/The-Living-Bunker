class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.assets = {};
        this.loaded = 0;
        this.toLoad = 0;

        // Iso constants
        this.baseTileW = 64;
        this.baseTileH = 32;

        // Zoom Level
        this.zoom = 1.0;

        // Calculated tile size
        this.tileW = this.baseTileW * this.zoom;
        this.tileH = this.baseTileH * this.zoom;

        // Camera offset (Pan)
        this.offsetX = this.width / 2;
        this.offsetY = 100;

        // Input Handling
        this.setupInput();
    }

    setupInput() {
        // Panning with Mouse Drag
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.offsetX += dx;
                this.offsetY += dy;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        // Zooming with Wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            if (e.deltaY < 0) {
                this.zoom = Math.min(2.0, this.zoom + zoomSpeed);
            } else {
                this.zoom = Math.max(0.5, this.zoom - zoomSpeed);
            }
            // Recalculate tile dimensions
            this.tileW = this.baseTileW * this.zoom;
            this.tileH = this.baseTileH * this.zoom;
        }, { passive: false });
    }

    loadAssets(assetList, callback) {
        this.toLoad = assetList.length;
        assetList.forEach(name => {
            const img = new Image();
            img.src = `assets/${name}`;
            img.onload = () => {
                this.loaded++;
                if (this.loaded === this.toLoad) callback();
            };
            this.assets[name] = img;
        });
    }

    // Convert Grid (x,y) to Screen (px, py)
    isoToScreen(gx, gy) {
        return {
            x: (gx - gy) * (this.tileW / 2) + this.offsetX,
            y: (gx + gy) * (this.tileH / 2) + this.offsetY
        };
    }

    clear() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawTile(imgName, gx, gy, zIndexOffset = 0) {
        if (!this.assets[imgName]) return;
        const pos = this.isoToScreen(gx, gy);
        const img = this.assets[imgName];

        // Center the image bottom on the tile center?
        // Tile Center in ISO is pos.x, pos.y + tileH/2
        // Our images are drawn from Top-Left.

        // floor.png is 64x48. Top-Left should be at pos.x - 32.
        // Wait.
        // Screen X,Y from isoToScreen usually points to the "Top Center" of the diamond.

        // Let's debug:
        // (0,0) -> offsetX, offsetY.
        // If we draw a 64x32 diamond at offsetX, offsetY...
        // x centered at offsetX. y starts at offsetY.

        // Image Top-Left should be (pos.x - tileW/2, pos.y)
        // For standard floor.

        let drawX = pos.x - (this.tileW / 2);
        let drawY = pos.y;

        // Adjust for "thickness" or wall height.
        // We assume the anchor point of the sprite corresponds to the top corner of the grid cell.

        // If it's a wall (64x96), it stands UP.
        // The "Top Corner" of the floor is at drawY.
        // The wall bottom should align with floor bottom?

        // Heuristic:
        // Floor (64x48): Anchor is top corner (0,0) relative to image? No.
        // Let's assume we align the logical "Center" or "Bottom".

        // Let's use Bottom-Center alignment for everything except floor?
        // Floor Top-Left is easiest.

        // Scale Image based on Zoom
        const scaledW = img.width * this.zoom;
        const scaledH = img.height * this.zoom;

        if (imgName.includes('wall')) {
             // Wall (64x96).
             // Top-Left Logic adapted for scale
             // Original: pos.y - 64.
             // With Scale: pos.y + this.tileH - scaledH
             // Assuming wall base is at bottom of tile
             drawY = pos.y + this.tileH - scaledH;
             drawX = pos.x - (scaledW / 2);
        } else if (imgName.includes('char') || imgName.includes('fridge') || imgName.includes('chair') || imgName.includes('table') || imgName.includes('bed') || imgName.includes('toilet')) {
             // Furniture/Char
             // Anchor: Bottom Center matches Grid Center.
             // Pos is Top Center of tile. Tile Center is pos.y + tileH/2.
             // Let's say we anchor to the "floor" level which is typically pos.y + tileH/2 for 2D sprites standing on it?
             // Actually, in ISO, the "feet" are at the center of the tile.
             drawX = pos.x - (scaledW / 2);
             drawY = pos.y + this.tileH - scaledH; // Align bottom
        } else {
             // Floor
             drawX = pos.x - (scaledW / 2);
             drawY = pos.y;
        }

        if (imgName.includes('ghost')) {
            this.ctx.globalAlpha = 0.6; // Transparent
        }
        if (imgName.includes('glitch')) {
            // Flicker effect
            if (Math.random() > 0.5) this.ctx.globalAlpha = 0.8;
            drawX += (Math.random() - 0.5) * 5;
            drawY += (Math.random() - 0.5) * 5;
        }

        this.ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
        this.ctx.globalAlpha = 1.0; // Reset
    }

    drawText(text, gx, gy, color = "white") {
        if (!text) return;
        const pos = this.isoToScreen(gx, gy);

        // Text Position: Above the tile/character
        const tx = pos.x;
        const ty = pos.y - 40; // Float above

        this.ctx.font = "12px monospace";
        const padding = 6;
        const width = this.ctx.measureText(text).width + (padding * 2);
        const height = 20;

        // Draw Bubble Background
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        this.ctx.beginPath();
        this.ctx.roundRect(tx - width/2, ty - height/2, width, height, 4);
        this.ctx.fill();

        // Draw Text
        this.ctx.fillStyle = color;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(text, tx, ty);
    }
}
