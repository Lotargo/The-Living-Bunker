const SAVE_FLAG: string = 'living-bunker-started';
const LOCAL_SETTINGS_KEY: string = 'living-bunker-settings';

const MainMenu = {
    init: function(): void {
        const newGameBtn = document.getElementById('new-game-btn') as HTMLButtonElement;
        const continueBtn = document.getElementById('continue-btn') as HTMLButtonElement;
        const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
        const saveSettingsBtn = document.getElementById('save-settings-btn') as HTMLButtonElement;
        const closeSettingsBtn = document.getElementById('close-settings-btn') as HTMLButtonElement;
        const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;

        continueBtn.disabled = localStorage.getItem(SAVE_FLAG) !== '1';

        newGameBtn.addEventListener('click', function(): void {
            restartSimulation();
            localStorage.setItem(SAVE_FLAG, '1');
            Runtime.paused = false;
            MainMenu.updatePauseButton();
            MainMenu.hide();
            addLog('SYSTEM', 'New simulation started.');
        });

        continueBtn.addEventListener('click', function(): void {
            localStorage.setItem(SAVE_FLAG, '1');
            Runtime.paused = false;
            MainMenu.updatePauseButton();
            MainMenu.hide();
            addLog('SYSTEM', 'Simulation continued.');
        });

        settingsBtn.addEventListener('click', function(): void {
            MainMenu.showSettings();
        });

        closeSettingsBtn.addEventListener('click', function(): void {
            MainMenu.hideSettings();
        });

        pauseBtn.addEventListener('click', function(): void {
            Runtime.paused = !Runtime.paused;
            if (Runtime.paused) {
                BrainClient.clearQueue();
            }
            MainMenu.updatePauseButton();
            addLog('SYSTEM', Runtime.paused ? 'Simulation paused.' : 'Simulation resumed.');
        });

        saveSettingsBtn.addEventListener('click', function(): void {
            MainMenu.saveSettings();
        });

        MainMenu.loadSettings();
        MainMenu.updatePauseButton();
    },

    hide: function(): void {
        document.getElementById('main-menu')!.classList.add('hidden');
    },

    showSettings: function(): void {
        document.getElementById('settings-menu')!.classList.remove('hidden');
    },

    hideSettings: function(): void {
        document.getElementById('settings-menu')!.classList.add('hidden');
    },

    readForm: function(): RuntimeSettings {
        return {
            providerMode: (document.getElementById('provider-mode') as HTMLSelectElement).value,
            openaiBaseUrl: (document.getElementById('openai-base-url') as HTMLInputElement).value,
            openaiApiKey: (document.getElementById('openai-api-key') as HTMLInputElement).value,
            openaiModel: (document.getElementById('openai-model') as HTMLInputElement).value
        };
    },

    applyForm: function(settings: RuntimeSettings): void {
        (document.getElementById('provider-mode') as HTMLSelectElement).value = settings.providerMode || 'default';
        (document.getElementById('openai-base-url') as HTMLInputElement).value = settings.openaiBaseUrl || '';
        (document.getElementById('openai-model') as HTMLInputElement).value = settings.openaiModel || '';
        (document.getElementById('spawn-rate') as HTMLInputElement).value = String(AnomalyManager.spawnChance);
    },

    loadSettings: function(): void {
        BrainClient.getSettings().then(function(settings: RuntimeSettings): void {
            const local = localStorage.getItem(LOCAL_SETTINGS_KEY);
            if (local) {
                try {
                    settings = Object.assign(settings, JSON.parse(local));
                } catch (_err) {
                    localStorage.removeItem(LOCAL_SETTINGS_KEY);
                }
            }
            MainMenu.applyForm(settings);
            MainMenu.setStatus(settings.openaiApiKeyConfigured ? 'Server has an API key configured.' : 'No server API key configured.');
        }).catch(function(err: Error): void {
            MainMenu.setStatus(err.message);
        });
    },

    saveSettings: function(): void {
        const settings: RuntimeSettings = MainMenu.readForm();
        const spawnRate = Number((document.getElementById('spawn-rate') as HTMLInputElement).value);
        if (!Number.isNaN(spawnRate)) {
            AnomalyManager.spawnChance = spawnRate;
        }

        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify({
            providerMode: settings.providerMode,
            openaiBaseUrl: settings.openaiBaseUrl,
            openaiModel: settings.openaiModel
        }));

        BrainClient.updateSettings(settings).then(function(): void {
            MainMenu.setStatus('Settings applied.');
        }).catch(function(err: Error): void {
            MainMenu.setStatus(err.message);
        });
    },

    setStatus: function(text: string): void {
        document.getElementById('settings-status')!.textContent = text;
    },

    updatePauseButton: function(): void {
        const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
        pauseBtn.textContent = Runtime.paused ? 'PAUSED' : 'PAUSE';
    }
};
