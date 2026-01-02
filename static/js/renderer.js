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
        this.tileW = 64;
        this.tileH = 32; // Half height (top face)

        // Camera offset
        this.offsetX = this.width / 2;
        this.offsetY = 100;
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

        if (imgName.includes('wall')) {
             // Wall (64x96).
             // Bottom of wall should be at Bottom of Floor Tile.
             // Floor Tile Top is at pos.y. Bottom is at pos.y + 32.
             // Wall Image Height is 96.
             // Top-Left = pos.x - 32, pos.y + 32 - 96 = pos.y - 64.
             drawY = pos.y - 64;
        } else if (imgName.includes('char') || imgName.includes('fridge')) {
             // Furniture/Char (varying height).
             // Anchor: Bottom Center matches Grid Center (pos.x, pos.y + 16).
             // Image Bottom Center -> Grid Center.
             drawX = pos.x - (img.width / 2);
             drawY = pos.y + (this.tileH) - img.height;
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

        this.ctx.drawImage(img, drawX, drawY);
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
