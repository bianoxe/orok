// ================= ФУНКЦИИ КАРТЫ =================

// Уничтожение кактуса
async function destroyCactus(x, y) {
    if (map[x] && map[x][y] === 'cactus') {
        map[x][y] = 'sand';
        if (database) {
            await firebase.database().ref('map/data/' + x + '/' + y).set('sand');
        }
    }
}

// Настройка слушателя карты
function setupMapListener() {
    firebase.database().ref('map/data').on('value', (snapshot) => {
        const mapData = snapshot.val();
        if (mapData) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (mapData[x]) {
                    for (let y = 0; y < MAP_HEIGHT; y++) {
                        if (mapData[x][y]) {
                            map[x][y] = mapData[x][y];
                        }
                    }
                }
            }
        }
    });
}

// Обновление карты
async function updateMap() {
    console.log("Updating map...");
    const newMap = generateDeterministicMap();
    
    try {
        await firebase.database().ref('map').update({
            data: newMap,
            lastUpdated: Date.now()
        });
        
        map = newMap;
        lastMapUpdateTime = Date.now();
        mapUpdateTimer = MAP_UPDATE_INTERVAL;
    } catch (error) {
        console.error("Error updating map:", error);
    }
}

// Запуск таймера обновления карты
function startMapUpdateTimer() {
    if (mapUpdateInterval) {
        clearInterval(mapUpdateInterval);
    }
    
    mapUpdateInterval = setInterval(() => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastMapUpdateTime;
        const timeLeft = MAP_UPDATE_INTERVAL - timeSinceLastUpdate;
        
        if (timeLeft <= 0) {
            updateMap();
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        const timerElement = document.getElementById('map-timer');
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Генерация детерминированной карты
function generateDeterministicMap() {
    const newMap = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
        newMap[x] = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                newMap[x][y] = 'wall';
            } else {
                const rand = Math.random();
                if (rand < 0.05) {
                    newMap[x][y] = 'rock';
                } else if (rand < 0.1) {
                    newMap[x][y] = 'cactus';
                } else if (rand < 0.15) {
                    newMap[x][y] = 'bush';
                } else {
                    newMap[x][y] = 'sand';
                }
            }
        }
    }
    return newMap;
}

// Слушатель обновления карты (для всех игроков)
function listenForMapUpdates() {
    firebase.database().ref('map').on('value', (snapshot) => {
        const mapData = snapshot.val();
        if (mapData && mapData.data) {
            map = mapData.data;
            if (mapData.lastUpdated) {
                lastMapUpdateTime = mapData.lastUpdated;
            }
        }
    });
}