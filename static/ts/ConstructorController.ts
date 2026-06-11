interface AssetItem {
    id: string;
    name: string;
    path: string;
    category: string;
    width?: number;
    height?: number;
}

class ConstructorController {
    private isActive: boolean = false;
    private selectedAsset: AssetItem | null = null;
    private rotation: number = 0;
    private hoverGridX: number = -1;
    private hoverGridY: number = -1;
    private assets: AssetItem[] = [];

    private modal: HTMLElement;
    private assetGrid: HTMLElement;
    private selectedPreview: HTMLElement;
    private rotationDisplay: HTMLElement;
    private placeBtn: HTMLElement;
    private deleteBtn: HTMLElement;
    private roomTypeSelect: HTMLSelectElement;

    constructor() {
        this.modal = document.getElementById('constructor-modal')!;
        this.assetGrid = document.getElementById('asset-grid')!;
        this.selectedPreview = document.getElementById('selected-asset')!;
        this.rotationDisplay = document.getElementById('rotation-degrees')!;
        this.placeBtn = document.getElementById('place-asset-btn')!;
        this.deleteBtn = document.getElementById('delete-asset-btn')!;
        this.roomTypeSelect = document.getElementById('room-type-select') as HTMLSelectElement;

        this.initAssetLibrary();
        this.setupEventListeners();
    }

    private initAssetLibrary(): void {
        this.assets = [
            { id: 'fridge', name: 'Холодильник', path: 'vendor/interior/fridge.png', category: 'furniture' },
            { id: 'stove', name: 'Плита', path: 'vendor/interior/stove.png', category: 'furniture' },
            { id: 'table', name: 'Стол', path: 'vendor/interior/table.png', category: 'furniture' },
            { id: 'chair', name: 'Стул', path: 'vendor/interior/chair.png', category: 'furniture' },
            { id: 'sofa', name: 'Диван', path: 'vendor/interior/sofa.png', category: 'furniture' },
            { id: 'bed', name: 'Кровать', path: 'vendor/interior/bed.png', category: 'furniture' },
            { id: 'toilet', name: 'Туалет', path: 'vendor/interior/toilet.png', category: 'furniture' },
            { id: 'sink', name: 'Раковина', path: 'vendor/interior/mirror.png', category: 'furniture' },
            { id: 'shower', name: 'Душ', path: 'vendor/interior/bathtub.png', category: 'furniture' },
            { id: 'bookshelf', name: 'Стеллаж', path: 'vendor/interior/bookshelf.png', category: 'furniture' },
            { id: 'computer', name: 'Компьютер', path: 'vendor/interior/papers.png', category: 'furniture' },
            { id: 'tv', name: 'ТВ', path: 'vendor/interior/bookshelf.png', category: 'furniture' },
            { id: 'radio', name: 'Радио', path: 'vendor/interior/bottle.png', category: 'furniture' },

            { id: 'plant', name: 'Растение', path: 'vendor/interior/plant_small.png', category: 'props' },
            { id: 'rug', name: 'Ковёр', path: 'vendor/interior/crate.png', category: 'props' },
            { id: 'mirror', name: 'Зеркало', path: 'vendor/interior/mirror.png', category: 'props' },
            { id: 'bottle', name: 'Бутылка', path: 'vendor/interior/bottle.png', category: 'props' },
            { id: 'papers', name: 'Бумаги', path: 'vendor/interior/papers.png', category: 'props' },
            { id: 'crate', name: 'Ящик', path: 'vendor/interior/crate.png', category: 'props' },
            { id: 'barrel', name: 'Бочка', path: 'vendor/interior/barrel.png', category: 'props' },

            { id: 'door_wood', name: 'Деревянная дверь', path: 'vendor/interior/door_wood_dark.png', category: 'walls' },
            { id: 'door_open', name: 'Открытая дверь', path: 'vendor/interior/door_open_frame_wood.png', category: 'walls' },
            { id: 'window_small', name: 'Маленькое окно', path: 'vendor/interior/window_small.png', category: 'walls' },
            { id: 'window_medium', name: 'Среднее окно', path: 'vendor/interior/window_medium.png', category: 'walls' },
            { id: 'window_large', name: 'Большое окно', path: 'vendor/interior/window_large.png', category: 'walls' },
            { id: 'window_curtain', name: 'Окошко с занавеской', path: 'vendor/interior/window_small_curtain.png', category: 'walls' },
            { id: 'stairs', name: 'Лестница', path: 'vendor/interior/stairs_wood.png', category: 'walls' },

            { id: 'floor_wood', name: 'Деревянный пол', path: 'vendor/interior/floor_wood.png', category: 'floors' },
            { id: 'floor_tile', name: 'Плиточный пол', path: 'vendor/interior/floor_tile.png', category: 'floors' },
            { id: 'floor_concrete', name: 'Бетонный пол', path: 'vendor/interior/floor_concrete.png', category: 'floors' },
        ];

        this.renderAssets('furniture');
    }

    private renderAssets(category: string): void {
        this.assetGrid.innerHTML = '';
        const filtered = this.assets.filter(a => a.category === category);

        filtered.forEach(asset => {
            const item = document.createElement('div');
            item.className = 'asset-item';
            item.dataset.id = asset.id;
            item.innerHTML = `
                <img src="assets/${asset.path}" alt="${asset.name}">
                <span class="asset-name">${asset.name}</span>
            `;
            item.addEventListener('click', () => this.selectAsset(asset));
            this.assetGrid.appendChild(item);
        });
    }

    private selectAsset(asset: AssetItem): void {
        this.selectedAsset = asset;
        this.rotation = 0;
        this.updateRotationDisplay();

        this.assetGrid.querySelectorAll('.asset-item').forEach(el => {
            el.classList.remove('selected');
        });
        const selectedEl = this.assetGrid.querySelector(`[data-id="${asset.id}"]`);
        if (selectedEl) selectedEl.classList.add('selected');

        this.selectedPreview.innerHTML = `<img src="assets/${asset.path}" alt="${asset.name}">`;
        (this.placeBtn as HTMLButtonElement).disabled = false;
    }

    private setupEventListeners(): void {
        document.getElementById('close-constructor-btn')!.addEventListener('click', () => {
            this.close();
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                this.renderAssets(target.dataset.category || 'furniture');
            });
        });

        document.getElementById('rotate-left-btn')!.addEventListener('click', () => {
            this.rotateLeft();
        });

        document.getElementById('rotate-right-btn')!.addEventListener('click', () => {
            this.rotateRight();
        });

        this.placeBtn.addEventListener('click', () => {
            this.placeAsset();
        });

        this.deleteBtn.addEventListener('click', () => {
            this.deleteAtHover();
        });

        document.getElementById('generate-room-btn')!.addEventListener('click', () => {
            this.generateRoom();
        });

        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (!this.isActive) return;

            switch (e.key.toLowerCase()) {
                case 'q':
                    this.rotateLeft();
                    break;
                case 'e':
                    this.rotateRight();
                    break;
                case 'r':
                    this.deleteAtHover();
                    break;
                case 'escape':
                    this.selectedAsset = null;
                    this.updateRotationDisplay();
                    this.selectedPreview.innerHTML = '<span class="no-selection">Не выбрано</span>';
                    (this.placeBtn as HTMLButtonElement).disabled = true;
                    break;
            }
        });

        renderer.canvas.addEventListener('click', (e: MouseEvent) => {
            if (!this.isActive) return;
            if (e.target !== renderer.canvas) return;

            const grid = renderer.screenToGrid(e.clientX, e.clientY);
            this.hoverGridX = grid.x;
            this.hoverGridY = grid.y;

            if (this.selectedAsset) {
                this.placeAsset();
            }
        });

        renderer.canvas.addEventListener('mousemove', (e: MouseEvent) => {
            if (!this.isActive) return;
            const grid = renderer.screenToGrid(e.clientX, e.clientY);
            this.hoverGridX = grid.x;
            this.hoverGridY = grid.y;
        });
    }

    private rotateLeft(): void {
        this.rotation = (this.rotation - 90 + 360) % 360;
        this.updateRotationDisplay();
    }

    private rotateRight(): void {
        this.rotation = (this.rotation + 90) % 360;
        this.updateRotationDisplay();
    }

    private updateRotationDisplay(): void {
        this.rotationDisplay.textContent = `${this.rotation}°`;
    }

    private placeAsset(): void {
        if (!this.selectedAsset || this.hoverGridX < 0 || this.hoverGridY < 0) return;

        const id = `${this.selectedAsset.id}_${Date.now()}`;
        world.addObject({
            id: id,
            type: this.selectedAsset.path,
            x: this.hoverGridX,
            y: this.hoverGridY,
            blocksMovement: this.selectedAsset.category === 'furniture'
        });

        syncObjectObstacles();
        rebuildStaticList();
    }

    private deleteAtHover(): void {
        if (this.hoverGridX < 0 || this.hoverGridY < 0) return;

        const objToRemove = world.objects.find(o => {
            const ox = Math.round(o.x);
            const oy = Math.round(o.y);
            return ox === this.hoverGridX && oy === this.hoverGridY;
        });

        if (objToRemove) {
            world.removeObject(objToRemove.id);
            syncObjectObstacles();
            rebuildStaticList();
        }
    }

    private generateRoom(): void {
        const roomType = this.roomTypeSelect.value;
        if (!roomType) return;

        const gridX = Math.max(1, Math.floor(GRID_SIZE / 2 - 5));
        const gridY = Math.max(1, Math.floor(GRID_SIZE / 2 - 4));

        generateAndPlaceRoom(roomType, gridX, gridY, (success) => {
            if (success) {
                console.log(`Room "${roomType}" generated at (${gridX}, ${gridY})`);
            }
        });
    }

    open(): void {
        this.isActive = true;
        this.modal.classList.remove('hidden');
    }

    close(): void {
        this.isActive = false;
        this.modal.classList.add('hidden');
        this.selectedAsset = null;
    }

    getActive(): boolean {
        return this.isActive;
    }
}
