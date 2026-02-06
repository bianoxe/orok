// ================= ГЛАВНЫЙ ФАЙЛ ИГРЫ =================

// Инициализация Firebase (с обработкой ошибок)
function initializeFirebase() {
    try {
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        database = firebase.database();
        console.log("Firebase initialized");
        return true;
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        console.log("Игра запущена в локальном режиме (без мультиплеера)");
        return false;
    }
}

// ================= ФУНКЦИИ КАРТЫ =================

// Уничтожение кактуса
async function destroyCactus(x, y) {
    if (map[x] && map[x][y] === 'cactus') {
        map[x][y] = 'sand';
        if (database) {
            try {
                await firebase.database().ref('map/data/' + x + '/' + y).set('sand');
            } catch (error) {
                console.log("Не удалось обновить карту в Firebase (оффлайн режим)");
            }
        }
    }
}

// Настройка слушателя карты
function setupMapListener() {
    if (!database) return;
    
    try {
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
    } catch (error) {
        console.log("Не удалось подключиться к карте Firebase");
    }
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

// Запуск таймера обновления карты
function startMapUpdateTimer() {
    if (mapUpdateInterval) {
        clearInterval(mapUpdateInterval);
    }
    
    // Только если есть подключение к Firebase
    if (!database) {
        const timerElement = document.getElementById('map-timer');
        if (timerElement) {
            timerElement.textContent = "Оффлайн";
        }
        return;
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

// Обновление карты
async function updateMap() {
    console.log("Updating map...");
    const newMap = generateDeterministicMap();
    
    if (!database) {
        map = newMap;
        lastMapUpdateTime = Date.now();
        console.log("Карта обновлена локально (оффлайн режим)");
        return;
    }
    
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
        map = newMap; // Все равно обновляем локально
    }
}

// Инициализация карты
async function initializeMap() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    
    // Проверяем, есть ли Firebase подключение
    if (!database) {
        // Локальный режим
        console.log("Инициализация локальной карты...");
        map = generateDeterministicMap();
        mapLoaded = true;
        lastMapUpdateTime = Date.now();
        
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        startMapUpdateTimer();
        return;
    }
    
    // Режим с Firebase
    const mapRef = firebase.database().ref('map/initialized');
    
    try {
        const snapshot = await mapRef.get();
        
        if (!snapshot.exists()) {
            console.log("Creating new map in Firebase...");
            const newMap = generateDeterministicMap();
            
            await firebase.database().ref('map').set({
                data: newMap,
                initialized: true,
                createdAt: Date.now(),
                lastUpdated: Date.now()
            });
            
            map = newMap;
            mapLoaded = true;
            lastMapUpdateTime = Date.now();
            startMapUpdateTimer();
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        } else {
            console.log("Loading map from Firebase...");
            const mapDataSnapshot = await firebase.database().ref('map/data').get();
            const mapData = mapDataSnapshot.val();
            
            if (mapData) {
                map = mapData;
                mapLoaded = true;
                
                const timeSnapshot = await firebase.database().ref('map/lastUpdated').get();
                if (timeSnapshot.exists()) {
                    lastMapUpdateTime = timeSnapshot.val();
                }
                startMapUpdateTimer();
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
            } else {
                const newMap = generateDeterministicMap();
                await firebase.database().ref('map/data').set(newMap);
                map = newMap;
                mapLoaded = true;
                lastMapUpdateTime = Date.now();
                startMapUpdateTimer();
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error("Error initializing map:", error);
        // При ошибке создаем локальную карту
        console.log("Создание локальной карты...");
        map = generateDeterministicMap();
        mapLoaded = true;
        lastMapUpdateTime = Date.now();
        
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        startMapUpdateTimer();
    }
}

// ================= ФУНКЦИИ ИГРОКА =================

function updatePlayerPosition() {
    if (player && playerId && database) {
        const playerData = {
            x: player.x,
            y: player.y,
            direction: player.direction,
            color: player.color,
            name: player.name,
            hp: player.hp,
            deviceType: player.deviceType,
            pcControlLayout: player.pcControlLayout,
            pcShootType: player.pcShootType,
            mobileControlLayout: player.mobileControlLayout,
            mobileShootType: player.mobileShootType,
            currentWeapon: currentWeapon,
            lastUpdate: Date.now()
        };
        
        try {
            firebase.database().ref('players/' + playerId).update(playerData);
        } catch (error) {
            console.log("Не удалось обновить позицию игрока (оффлайн)");
        }
    }
}

function setupPlayersListener() {
    if (!database) {
        // Локальный режим - создаем несколько ботов
        createLocalBots();
        return;
    }
    
    try {
        firebase.database().ref('players').on('value', (snapshot) => {
            const playersData = snapshot.val() || {};
            
            for (const id in playersData) {
                const playerData = playersData[id];
                const isCurrentPlayer = (id === playerId);
                const existingPlayer = players[id];
                const wasInBush = existingPlayer ? existingPlayer.wasInBush : false;
                
                if (isCurrentPlayer) {
                    const displayHp = existingPlayer && existingPlayer.localHp !== undefined 
                        ? existingPlayer.localHp 
                        : (playerData.hp !== undefined ? playerData.hp : MAX_HP);
                    
                    players[id] = {
                        ...playerData,
                        width: 30,
                        height: 30,
                        speed: PLAYER_SPEED,
                        hp: displayHp,
                        realHp: playerData.hp !== undefined ? playerData.hp : MAX_HP,
                        id: id,
                        isVisibleFromBush: playerData.isVisibleFromBush || false,
                        bushVisibilityEndTime: playerData.bushVisibilityEndTime || 0,
                        wasInBush: wasInBush,
                        localHp: existingPlayer ? existingPlayer.localHp : displayHp,
                        ignoreServerHpUntil: existingPlayer ? existingPlayer.ignoreServerHpUntil : 0
                    };
                    
                    if (players[id].ignoreServerHpUntil && Date.now() < players[id].ignoreServerHpUntil) {
                        players[id].hp = players[id].localHp || players[id].hp;
                    }
                } else {
                    players[id] = {
                        ...playerData,
                        width: 30,
                        height: 30,
                        speed: PLAYER_SPEED,
                        hp: playerData.hp !== undefined ? playerData.hp : MAX_HP,
                        id: id,
                        isVisibleFromBush: playerData.isVisibleFromBush || false,
                        bushVisibilityEndTime: playerData.bushVisibilityEndTime || 0,
                        wasInBush: wasInBush
                    };
                    
                    players[id].wasInBush = isPlayerInBush(players[id]);
                }
            }
            
            // Удаляем игроков, которых больше нет в Firebase
            for (const id in players) {
                if (!playersData[id]) {
                    delete players[id];
                }
            }
            
            updatePlayerList();
        });
    } catch (error) {
        console.log("Не удалось подключиться к списку игроков");
        createLocalBots();
    }
}

// Создание локальных ботов для оффлайн-игры
function createLocalBots() {
    console.log("Создание локальных ботов для оффлайн-игры");
    
    // Создаем 3 бота
    for (let i = 0; i < 3; i++) {
        const botId = 'bot_' + i;
        const spawnPoint = getRandomSpawnPoint();
        
        players[botId] = {
            x: spawnPoint.x,
            y: spawnPoint.y,
            width: 30,
            height: 30,
            speed: PLAYER_SPEED,
            direction: Math.random() * 360,
            color: TANK_COLORS[(i + 1) % TANK_COLORS.length].value,
            name: 'Бот ' + (i + 1),
            hp: MAX_HP,
            id: botId,
            isBot: true,
            lastMoveTime: Date.now(),
            moveTarget: null,
            moveDelay: 1000 + Math.random() * 2000
        };
    }
    
    updatePlayerList();
}

// Обновление ботов
function updateBots() {
    const now = Date.now();
    
    for (const id in players) {
        const bot = players[id];
        if (!bot.isBot) continue;
        
        // Обновляем движение ботов
        if (!bot.moveTarget || now - bot.lastMoveTime > bot.moveDelay) {
            const randomAngle = Math.random() * Math.PI * 2;
            bot.moveTarget = {
                x: bot.x + Math.cos(randomAngle) * 100,
                y: bot.y + Math.sin(randomAngle) * 100
            };
            bot.direction = randomAngle * 180 / Math.PI;
            bot.lastMoveTime = now;
            bot.moveDelay = 1000 + Math.random() * 3000;
        }
        
        // Двигаем бота к цели
        const dx = bot.moveTarget.x - bot.x;
        const dy = bot.moveTarget.y - bot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            bot.x += (dx / distance) * bot.speed;
            bot.y += (dy / distance) * bot.speed;
        }
        
        // Проверяем границы
        bot.x = Math.max(30, Math.min(MAP_WIDTH * TILE_SIZE - 30, bot.x));
        bot.y = Math.max(30, Math.min(MAP_HEIGHT * TILE_SIZE - 30, bot.y));
    }
}

function cleanupInactivePlayers() {
    if (!database) return;
    
    setInterval(async () => {
        const now = Date.now();
        try {
            const snapshot = await firebase.database().ref('players').get();
            const playersData = snapshot.val() || {};
            for (const id in playersData) {
                if (now - (playersData[id].lastUpdate || 0) > 30000) {
                    await firebase.database().ref('players/' + id).remove();
                }
            }
        } catch (error) {
            console.error("Error cleaning up players:", error);
        }
    }, 5000);
}

// ================= ФУНКЦИИ ВСПОМОГАТЕЛЬНЫЕ =================

// Сохранение позиции игрока
function getSavedPlayerPosition() {
    const saved = localStorage.getItem('lastPlayerPosition');
    return saved ? JSON.parse(saved) : null;
}

function savePlayerPosition() {
    if (!player || !playerId) return;
    
    const playerName = document.getElementById('player-name') ? 
        document.getElementById('player-name').value.trim() || 'Игрок' : 'Игрок';
    
    const playerData = {
        x: player.x,
        y: player.y,
        direction: player.direction,
        color: player.color,
        name: playerName,
        hp: player.localHp || MAX_HP,
        currentWeapon: currentWeapon,
        ignoreServerHpUntil: player.ignoreServerHpUntil || 0
    };
    
    localStorage.setItem('lastPlayerPosition', JSON.stringify(playerData));
    
    // Только если есть подключение к Firebase
    if (database) {
        try {
            firebase.database().ref('players/' + playerId).update({
                ...playerData,
                hp: 0
            });
        } catch (error) {
            console.log("Не удалось сохранить позицию в Firebase");
        }
    }
}

// Случайная точка спавна
function getRandomSpawnPoint() {
    const point = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
    return {
        x: point.x * TILE_SIZE + TILE_SIZE / 2,
        y: point.y * TILE_SIZE + TILE_SIZE / 2
    };
}

// Случайная позиция на песке
function getRandomSandPosition() {
    let x, y;
    let attempts = 0;
    
    do {
        x = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
        y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
        attempts++;
    } while ((map[x][y] !== 'sand' && attempts < 100));
    
    return {
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2
    };
}

// Определение в кусте
function isPlayerInBush(player) {
    if (!player || !map) return false;
    
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);
    
    if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
        return map[tileX][tileY] === 'bush';
    }
    
    return false;
}

// Умное движение
function smartMovement(newX, newY) {
    if (!player || !map) return;
    
    const playerHalfWidth = player.width / 2;
    const playerHalfHeight = player.height / 2;
    
    // Проверка по X
    let canMoveX = true;
    const leftTileX = Math.floor((newX - playerHalfWidth) / TILE_SIZE);
    const rightTileX = Math.floor((newX + playerHalfWidth) / TILE_SIZE);
    const midTileY = Math.floor(player.y / TILE_SIZE);
    
    if (leftTileX >= 0 && leftTileX < MAP_WIDTH && midTileY >= 0 && midTileY < MAP_HEIGHT) {
        if (map[leftTileX][midTileY] === 'wall' || map[leftTileX][midTileY] === 'rock') {
            canMoveX = false;
        }
    }
    
    if (rightTileX >= 0 && rightTileX < MAP_WIDTH && midTileY >= 0 && midTileY < MAP_HEIGHT) {
        if (map[rightTileX][midTileY] === 'wall' || map[rightTileX][midTileY] === 'rock') {
            canMoveX = false;
        }
    }
    
    // Проверка по Y
    let canMoveY = true;
    const topTileY = Math.floor((newY - playerHalfHeight) / TILE_SIZE);
    const bottomTileY = Math.floor((newY + playerHalfHeight) / TILE_SIZE);
    const midTileX = Math.floor(player.x / TILE_SIZE);
    
    if (topTileY >= 0 && topTileY < MAP_HEIGHT && midTileX >= 0 && midTileX < MAP_WIDTH) {
        if (map[midTileX][topTileY] === 'wall' || map[midTileX][topTileY] === 'rock') {
            canMoveY = false;
        }
    }
    
    if (bottomTileY >= 0 && bottomTileY < MAP_HEIGHT && midTileX >= 0 && midTileX < MAP_WIDTH) {
        if (map[midTileX][bottomTileY] === 'wall' || map[midTileX][bottomTileY] === 'rock') {
            canMoveY = false;
        }
    }
    
    // Применение движения
    if (canMoveX) player.x = newX;
    if (canMoveY) player.y = newY;
}

// ================= ОТРИСОВКА =================

// Отрисовка карты
function drawMapWithBushTransparency() {
    if (!map || !ctx || !player) return;
    
    const playerTileX = Math.floor(player.x / TILE_SIZE);
    const playerTileY = Math.floor(player.y / TILE_SIZE);
    
    // Определяем область видимости
    const startX = Math.max(0, playerTileX - 10);
    const endX = Math.min(MAP_WIDTH - 1, playerTileX + 10);
    const startY = Math.max(0, playerTileY - 10);
    const endY = Math.min(MAP_HEIGHT - 1, playerTileY + 10);
    
    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            if (!map[x] || !map[x][y]) continue;
            
            const tileType = map[x][y];
            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;
            
            switch (tileType) {
                case 'sand':
                    ctx.fillStyle = '#D2B48C';
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                    break;
                case 'wall':
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                    break;
                case 'rock':
                    ctx.fillStyle = '#696969';
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                    break;
                case 'cactus':
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                    break;
                case 'bush':
                    const isInBush = (x === playerTileX && y === playerTileY);
                    if (isInBush) {
                        ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
                    } else {
                        ctx.fillStyle = '#228B22';
                    }
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                    break;
                default:
                    ctx.fillStyle = '#D2B48C';
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

// Отрисовка игрока
function drawPlayer(p, isCurrentPlayer) {
    if (!ctx) return;
    
    const isInBush = isPlayerInBush(p);
    const now = Date.now();
    
    let shouldDraw = true;
    if (isInBush && !isCurrentPlayer) {
        if (p.isVisibleFromBush && now < p.bushVisibilityEndTime) {
            shouldDraw = true;
        } else {
            shouldDraw = false;
        }
    }
    
    if (!shouldDraw) return;
    
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.direction * Math.PI / 180);
    
    // Корпус танка
    ctx.fillStyle = p.color;
    ctx.fillRect(-15, -15, 30, 30);
    
    // Башня
    ctx.fillStyle = '#2A4A36';
    ctx.fillRect(-5, -5, 10, 10);
    
    // Ствол
    ctx.fillStyle = '#333';
    ctx.fillRect(0, -2.5, 25, 5);
    
    ctx.restore();
    
    // HP бар
    if (p.hp > 0) {
        const barX = p.x - 20;
        const barY = p.y - 35;
        const hpWidth = 40;
        const hpHeight = 6;
        const hpFillWidth = (p.hp / MAX_HP) * hpWidth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, hpWidth, hpHeight);
        ctx.fillStyle = p.hp > MAX_HP / 2 ? '#4CAF50' : '#F44336';
        ctx.fillRect(barX, barY, hpFillWidth, hpHeight);
        
        // Имя игрока
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.x, p.y - 45);
    }
}

// Отрисовка пуль
function drawBullets() {
    for (const bullet of bullets) {
        if (!bullet.x || !bullet.y) continue;
        
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(bullet.direction * Math.PI / 180);
        
        const length = 25;
        const width = 4;
        
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(-length/2, -width/2, length, width);
        
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(-length/4, -width/3, length/2, width * 0.66);
        
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-length/2, -width/2, length, width);
        
        ctx.fillStyle = 'rgba(255, 140, 0, 0.4)';
        ctx.fillRect(-length, -width/3, length/2, width * 0.66);
        
        ctx.restore();
    }
    
    for (const bullet of remoteBullets) {
        if (!bullet.x || !bullet.y) continue;
        
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(bullet.direction * Math.PI / 180);
        
        const length = 25;
        const width = 4;
        
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(-length/2, -width/2, length, width);
        
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(-length/4, -width/3, length/2, width * 0.66);
        
        ctx.strokeStyle = 'rgba(255, 150, 100, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-length/2, -width/2, length, width);
        
        ctx.fillStyle = 'rgba(255, 69, 0, 0.4)';
        ctx.fillRect(-length, -width/3, length/2, width * 0.66);
        
        ctx.restore();
    }
}

// Обновление пуль
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet.x || !bullet.y) {
            bullets.splice(i, 1);
            continue;
        }
        
        bullet.x += Math.cos(bullet.direction * Math.PI / 180) * bullet.speed;
        bullet.y += Math.sin(bullet.direction * Math.PI / 180) * bullet.speed;
        
        const bulletTileX = Math.floor(bullet.x / TILE_SIZE);
        const bulletTileY = Math.floor(bullet.y / TILE_SIZE);
        
        if (bulletTileX >= 0 && bulletTileX < MAP_WIDTH && 
            bulletTileY >= 0 && bulletTileY < MAP_HEIGHT) {
            
            const tileType = map[bulletTileX] && map[bulletTileX][bulletTileY];
            
            if (tileType === 'cactus') {
                if (bullet.weaponType === 'sniper' && bullet.penetration > 0) {
                    bullet.penetration--;
                    destroyCactus(bulletTileX, bulletTileY);
                    
                    if (bullet.penetration === 0) {
                        bullets.splice(i, 1);
                    }
                    continue;
                } else {
                    destroyCactus(bulletTileX, bulletTileY);
                    bullets.splice(i, 1);
                    continue;
                }
            } else if (tileType === 'wall' || tileType === 'rock') {
                bullets.splice(i, 1);
                continue;
            }
        }
        
        if (bullet.x < 0 || bullet.x > MAP_WIDTH * TILE_SIZE || 
            bullet.y < 0 || bullet.y > MAP_HEIGHT * TILE_SIZE) {
            bullets.splice(i, 1);
        }
    }
}

// ================= ФУНКЦИИ МЕНЮ =================

// Инициализация гардероба
function initializeWardrobe() {
    tankPreviewCanvas = document.getElementById('tank-preview-canvas');
    const colorOptionsElement = document.getElementById('color-options');
    const currentColorNameElement = document.getElementById('current-color-name');
    const saveWardrobeButton = document.getElementById('save-wardrobe');
    
    if (!tankPreviewCanvas || !colorOptionsElement) return;
    
    tankPreviewCtx = tankPreviewCanvas.getContext('2d');
    
    TANK_COLORS.forEach((color, index) => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color.value;
        colorOption.dataset.index = index;
        colorOption.dataset.name = color.name;
        colorOption.dataset.value = color.value;
        
        if (index === 0) {
            colorOption.classList.add('selected');
        }
        
        colorOption.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            colorOption.classList.add('selected');
            selectedTankColor = color;
            currentColorNameElement.textContent = color.name;
            updateTankPreview();
        });
        
        colorOptionsElement.appendChild(colorOption);
    });
    
    loadSavedColor();
    updateTankPreview();
    
    saveWardrobeButton.addEventListener('click', saveColor);
}

function updateTankPreview() {
    if (!tankPreviewCanvas || !tankPreviewCtx) return;
    
    tankPreviewCtx.clearRect(0, 0, tankPreviewCanvas.width, tankPreviewCanvas.height);
    
    const centerX = tankPreviewCanvas.width / 2;
    const centerY = tankPreviewCanvas.height / 2;
    
    tankPreviewCtx.save();
    tankPreviewCtx.translate(centerX, centerY);
    
    tankPreviewCtx.fillStyle = selectedTankColor.value;
    tankPreviewCtx.fillRect(-30, -30, 60, 60);
    
    tankPreviewCtx.fillStyle = '#2A4A36';
    tankPreviewCtx.fillRect(-10, -10, 20, 20);
    
    tankPreviewCtx.fillStyle = '#333';
    tankPreviewCtx.fillRect(0, -5, 40, 10);
    
    tankPreviewCtx.restore();
    
    tankPreviewCtx.fillStyle = 'white';
    tankPreviewCtx.font = '14px Arial';
    tankPreviewCtx.textAlign = 'center';
    tankPreviewCtx.fillText(selectedTankColor.name, centerX, centerY + 50);
}

function loadSavedColor() {
    const savedColor = localStorage.getItem('tankColor');
    if (savedColor) {
        try {
            const colorData = JSON.parse(savedColor);
            const foundColor = TANK_COLORS.find(c => c.value === colorData.value);
            if (foundColor) {
                selectedTankColor = foundColor;
                const currentColorNameElement = document.getElementById('current-color-name');
                if (currentColorNameElement) {
                    currentColorNameElement.textContent = foundColor.name;
                }
                
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                    if (opt.dataset.value === foundColor.value) {
                        opt.classList.add('selected');
                    }
                });
            }
        } catch (e) {
            console.log("Error loading saved color:", e);
        }
    }
}

function saveColor() {
    localStorage.setItem('tankColor', JSON.stringify(selectedTankColor));
    alert(`Цвет "${selectedTankColor.name}" сохранён!`);
}

// Инициализация настроек
function initializeSettings() {
    const deviceTypeSelect = document.getElementById('device-type');
    const settingsDeviceType = document.getElementById('settings-device-type');
    const pcShootTypeSelect = document.getElementById('pc-shoot-type');
    const mobileShootTypeSelect = document.getElementById('mobile-shoot-type');
    
    if (isMobileDevice()) {
        if (deviceTypeSelect) deviceTypeSelect.value = 'mobile';
        if (settingsDeviceType) settingsDeviceType.value = 'mobile';
    }
    
    if (pcShootTypeSelect) pcShootTypeSelect.value = 'mouse';
    if (mobileShootTypeSelect) mobileShootTypeSelect.value = 'button';
    
    updateSettingsVisibility();
}

function updateSettingsVisibility() {
    const pcSection = document.getElementById('pc-controls-section');
    const mobileSection = document.getElementById('mobile-controls-section');
    const settingsDeviceType = document.getElementById('settings-device-type');
    
    if (settingsDeviceType && pcSection && mobileSection) {
        if (settingsDeviceType.value === 'pc') {
            pcSection.style.display = 'block';
            mobileSection.style.display = 'none';
        } else {
            pcSection.style.display = 'none';
            mobileSection.style.display = 'block';
        }
    }
}

// Определение устройства
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Инициализация системы оружий
function initializeWeaponSystem() {
    // ИСПРАВЛЕНА ОШИБКА: Проверяем, что currentWeapon определен
    if (!currentWeapon) {
        currentWeapon = 'pistol'; // Устанавливаем значение по умолчанию
    }
    
    // ИСПРАВЛЕНА ОШИБКА: Проверяем, что WEAPONS определен
    if (!WEAPONS) {
        console.error("WEAPONS не определен!");
        return;
    }
    
    playerWeapons = {
        pistol: {
            ammo: WEAPONS.pistol.maxAmmo,
            isReloading: false,
            reloadProgress: 0,
            lastShotTime: 0
        },
        ak47: {
            ammo: WEAPONS.ak47.maxAmmo,
            isReloading: false,
            reloadProgress: 0,
            lastShotTime: 0
        }
    };
    
    updateWeaponPanel();
}

// Обновление панели оружий
function updateWeaponPanel() {
    const weaponSlots = document.querySelectorAll('.weapon-slot');
    weaponSlots.forEach(slot => {
        const weaponType = slot.dataset.weapon;
        const weaponData = WEAPONS[weaponType];
        const playerWeaponData = playerWeapons[weaponType];
        
        if (slot && playerWeaponData) {
            const ammoCount = slot.querySelector('.ammo-count');
            if (ammoCount) {
                ammoCount.textContent = `${playerWeaponData.ammo}/${weaponData.maxAmmo}`;
                
                if (playerWeaponData.ammo === 0) {
                    ammoCount.style.color = '#F44336';
                    ammoCount.style.fontWeight = 'bold';
                } else if (playerWeaponData.ammo <= weaponData.maxAmmo * 0.3) {
                    ammoCount.style.color = '#FF9800';
                    ammoCount.style.fontWeight = 'bold';
                } else {
                    ammoCount.style.color = '#FFD700';
                    ammoCount.style.fontWeight = 'normal';
                }
            }
            
            if (weaponType === currentWeapon) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        }
    });
}

// Обновление списка игроков
function updatePlayerList() {
    const playerListElement = document.getElementById('player-list');
    if (!playerListElement) return;
    
    let html = '<div style="font-weight: bold; margin-bottom: 5px;">';
    
    if (database) {
        html += 'Игроки онлайн:</div>';
    } else {
        html += 'Локальная игра (боты):</div>';
    }
    
    for (const id in players) {
        const p = players[id];
        if (p && p.name) {
            const hpPercentage = Math.floor((p.hp / MAX_HP) * 100);
            html += `<div style="margin: 3px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background-color: ${p.color}; border-radius: 50%; margin-right: 5px;"></span>
                ${p.name} (${hpPercentage}%)
            </div>`;
        }
    }
    
    playerListElement.innerHTML = html;
}

// ================= ОСНОВНОЙ ИГРОВОЙ ЦИКЛ =================

// Обработка ввода игрока
function handleInput() {
    if (!player) return;
    
    let newX = player.x;
    let newY = player.y;
    const speed = player.speed || PLAYER_SPEED;

    if (deviceType === 'pc') {
        if (pcControlLayout === 'keyboard') {
            let moveX = 0;
            let moveY = 0;
            
            if (keys.w || keys.arrowup || keys.ц) {
                moveY -= 1;
            }
            if (keys.s || keys.arrowdown || keys.ы) {
                moveY += 1;
            }
            if (keys.a || keys.arrowleft || keys.ф) {
                moveX -= 1;
            }
            if (keys.d || keys.arrowright || keys.в) {
                moveX += 1;
            }
            
            const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
            if (magnitude > 0) {
                moveX /= magnitude;
                moveY /= magnitude;
            }
            
            newX += moveX * speed;
            newY += moveY * speed;
        }
    }
    
    if (newX !== player.x || newY !== player.y) {
        smartMovement(newX, newY);
    }
    
    updatePlayerPosition();
}

// Присоединение к игре
async function joinGame() {
    if (!mapLoaded) {
        alert("Карта еще загружается. Пожалуйста, подождите...");
        return;
    }

    const playerNameInput = document.getElementById('player-name');
    const deviceTypeSelect = document.getElementById('device-type');
    const loginScreen = document.getElementById('login-screen');
    const settingsButton = document.getElementById('settings-button');
    const weaponPanel = document.getElementById('weapon-panel');
    
    const playerName = playerNameInput ? playerNameInput.value.trim() || 'Игрок' : 'Игрок';
    deviceType = deviceTypeSelect ? deviceTypeSelect.value : 'pc';
    
    // Генерируем ID игрока
    if (database) {
        playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    } else {
        playerId = 'local_player';
    }

    const savedPosition = getSavedPlayerPosition();
    let spawnPoint;
    
    if (savedPosition && savedPosition.name === playerName) {
        spawnPoint = {
            x: savedPosition.x,
            y: savedPosition.y
        };
        currentWeapon = savedPosition.currentWeapon || 'pistol';
    } else {
        spawnPoint = getRandomSpawnPoint();
    }
    
    player = {
        x: spawnPoint.x,
        y: spawnPoint.y,
        width: 30,
        height: 30,
        speed: PLAYER_SPEED,
        direction: savedPosition ? savedPosition.direction : 0,
        color: selectedTankColor.value,
        name: playerName,
        hp: MAX_HP,
        localHp: MAX_HP,
        currentWeapon: currentWeapon,
        ignoreServerHpUntil: 0,
        deviceType: deviceType,
        pcControlLayout: pcControlLayout,
        pcShootType: pcShootType,
        mobileControlLayout: mobileControlLayout,
        mobileShootType: mobileShootType,
        lastUpdate: Date.now()
    };
    
    if (database) {
        try {
            await firebase.database().ref('players/' + playerId).set(player);
        } catch (error) {
            console.error("Error saving player to Firebase:", error);
            // Если не удалось сохранить в Firebase, добавляем локально
            players[playerId] = player;
        }
    } else {
        // Локальный режим
        players[playerId] = player;
    }
    
    if (loginScreen) {
        loginScreen.style.display = 'none';
    }
    if (settingsButton) {
        settingsButton.style.display = 'block';
    }
    if (weaponPanel) {
        weaponPanel.style.display = 'flex';
    }
    
    updateWeaponPanel();
    
    setupPlayersListener();
    setupMapListener();
    cleanupInactivePlayers();
    
    if (!database) {
        // Показываем сообщение об оффлайн-режиме
        setTimeout(() => {
            alert("Игра запущена в локальном режиме. Multiplayer недоступен.\n\nВы играете против ботов.");
        }, 1000);
    }
}

// Настройка слушателя пуль (упрощенная версия для оффлайн)
function setupBulletsListener() {
    if (!database) return;
    
    try {
        firebase.database().ref('bullets').on('child_added', (snapshot) => {
            const bulletData = snapshot.val();
            
            if (bulletData.playerId === playerId) return;
            
            const weaponConfig = WEAPONS[bulletData.weaponType] || WEAPONS.pistol;
            
            remoteBullets.push({
                x: bulletData.x,
                y: bulletData.y,
                direction: bulletData.direction,
                speed: weaponConfig.bulletSpeed,
                playerId: bulletData.playerId,
                weaponType: bulletData.weaponType,
                color: weaponConfig.bulletColor,
                size: weaponConfig.bulletSize
            });
            
            setTimeout(() => {
                snapshot.ref.remove();
            }, 5000);
        });
    } catch (error) {
        console.log("Не удалось подключиться к пулям Firebase");
    }
}

// Игровой цикл
function gameLoop() {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (player && mapLoaded) {
        ctx.save();
        const offsetX = canvas.width/2 - player.x;
        const offsetY = canvas.height/2 - player.y;
        ctx.translate(offsetX, offsetY);
        
        drawMapWithBushTransparency();
        
        for (const id in players) {
            if (id !== playerId && players[id]) {
                drawPlayer(players[id], false);
            }
        }
        
        drawPlayer(player, true);
        drawBullets();
        
        ctx.restore();
        
        updateBullets();
        handleInput();
        
        // Обновляем ботов в локальном режиме
        if (!database) {
            updateBots();
        }
        
        updateWeaponPanel();
    }
    
    requestAnimationFrame(gameLoop);
}

// Инициализация игры
async function initGame() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        if (isMobileDevice()) {
            const container = document.getElementById('game-container');
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        } else {
            canvas.width = 800;
            canvas.height = 600;
        }
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Инициализация всех систем
    initializeWeaponSystem();
    initializeSettings();
    initializeWardrobe();
    
    // Пытаемся инициализировать Firebase
    const firebaseInitialized = initializeFirebase();
    
    // Инициализируем карту (локально или через Firebase)
    await initializeMap();
    
    // Настройка обработчиков событий для меню
    setupMenuHandlers();
    
    // Запуск игрового цикла
    gameLoop();
}

// Настройка обработчиков меню
function setupMenuHandlers() {
    const playButton = document.getElementById('play-button');
    const controlsButton = document.getElementById('controls-button');
    const wardrobeButton = document.getElementById('wardrobe-button');
    const quickPlayButton = document.getElementById('quick-play-button');
    const backToMainMenuButton = document.getElementById('back-to-main-menu');
    const backToMenuButton = document.getElementById('back-to-menu');
    const backToMenuFromSettings = document.getElementById('back-to-menu-from-settings');
    const backToMenuFromWardrobe = document.getElementById('back-to-menu-from-wardrobe');
    const joinGameButton = document.getElementById('join-game');
    const closeSettingsButton = document.getElementById('close-settings');
    const settingsDeviceType = document.getElementById('settings-device-type');
    
    const mainMenu = document.getElementById('main-menu');
    const gameMenu = document.getElementById('game-menu');
    const loginScreen = document.getElementById('login-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const wardrobeScreen = document.getElementById('wardrobe-screen');
    
    if (!mainMenu || !gameMenu || !loginScreen) {
        console.error("Menu elements not found!");
        return;
    }
    
    // Показываем главное меню
    mainMenu.style.display = 'flex';
    gameMenu.style.display = 'none';
    loginScreen.style.display = 'none';
    if (settingsScreen) settingsScreen.style.display = 'none';
    if (wardrobeScreen) wardrobeScreen.style.display = 'none';
    
    if (playButton) {
        playButton.addEventListener('click', () => {
            mainMenu.style.display = 'none';
            gameMenu.style.display = 'flex';
        });
    }
    
    if (controlsButton) {
        controlsButton.addEventListener('click', () => {
            mainMenu.style.display = 'none';
            if (settingsScreen) settingsScreen.style.display = 'flex';
        });
    }
    
    if (wardrobeButton) {
        wardrobeButton.addEventListener('click', () => {
            mainMenu.style.display = 'none';
            if (wardrobeScreen) wardrobeScreen.style.display = 'flex';
            updateTankPreview();
        });
    }
    
    if (quickPlayButton) {
        quickPlayButton.addEventListener('click', () => {
            gameMenu.style.display = 'none';
            loginScreen.style.display = 'flex';
        });
    }
    
    if (backToMainMenuButton) {
        backToMainMenuButton.addEventListener('click', () => {
            gameMenu.style.display = 'none';
            mainMenu.style.display = 'flex';
        });
    }
    
    if (backToMenuButton) {
        backToMenuButton.addEventListener('click', () => {
            loginScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
        });
    }
    
    if (backToMenuFromSettings) {
        backToMenuFromSettings.addEventListener('click', () => {
            if (settingsScreen) settingsScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
        });
    }
    
    if (backToMenuFromWardrobe) {
        backToMenuFromWardrobe.addEventListener('click', () => {
            if (wardrobeScreen) wardrobeScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
        });
    }
    
    if (closeSettingsButton) {
        closeSettingsButton.addEventListener('click', () => {
            if (settingsScreen) settingsScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
        });
    }
    
    if (settingsDeviceType) {
        settingsDeviceType.addEventListener('change', updateSettingsVisibility);
    }
    
    if (joinGameButton) {
        joinGameButton.addEventListener('click', joinGame);
    }
    
    const playerNameInput = document.getElementById('player-name');
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinGame();
            }
        });
    }
}

// Обработка клавиатуры
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// Обработка мыши
function handleMouseMove(e) {
    if (deviceType === 'pc' && pcShootType === 'mouse' && player) {
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;
        
        const worldMouseX = mouseX - (canvas.width/2 - player.x);
        const worldMouseY = mouseY - (canvas.height/2 - player.y);
        
        const deltaX = worldMouseX - player.x;
        const deltaY = worldMouseY - player.y;
        player.direction = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    }
}

document.addEventListener('mousemove', handleMouseMove);

// Обработка закрытия окна
window.addEventListener('beforeunload', () => {
    if (playerId && database) {
        savePlayerPosition();
        try {
            firebase.database().ref('players/' + playerId).remove();
        } catch (error) {
            console.log("Не удалось удалить игрока из Firebase");
        }
    }
});

// Запуск игры при загрузке страницы
window.addEventListener('load', initGame);