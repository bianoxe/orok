// ================= ФУНКЦИИ ОРУЖИЯ =================

// Инициализация системы оружий
function initializeWeaponSystem() {
    // Обработка выбора оружия по цифрам
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        if (key === '1' || key === '2' || key === '3' || key === '4' || key === '5') {
            e.preventDefault();
            switchWeapon(
                key === '1' ? 'pistol' : 
                key === '2' ? 'ak47' : 
                key === '3' ? 'sniper' : 
                key === '4' ? 'shotgun' :
                'grenade'
            );
        }
    });
    
    // Обработка кликов по панели оружий
    const weaponSlots = document.querySelectorAll('.weapon-slot');
    weaponSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            const weaponType = slot.dataset.weapon;
            switchWeapon(weaponType);
        });
    });
    
    // Инициализация оружий игрока
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
        },
        sniper: {
            ammo: WEAPONS.sniper.maxAmmo,
            isReloading: false,
            reloadProgress: 0,
            lastShotTime: 0
        },
        shotgun: {
            ammo: 4,
            isReloading: false,
            reloadProgress: 0,
            lastShotTime: 0
        },
        grenade: {
            ammo: WEAPONS.grenade.maxAmmo,
            isReloading: false,
            reloadProgress: 0,
            lastShotTime: 0
        }
    };
    
    updateWeaponPanel();
}

// Переключение оружия
function switchWeapon(weaponType) {
    const now = Date.now();
    if (now - lastWeaponSwitchTime < weaponSwitchCooldown) return;
    
    if (WEAPONS[weaponType] && currentWeapon !== weaponType) {
        currentWeapon = weaponType;
        lastWeaponSwitchTime = now;
        
        updateWeaponPanel();
        showWeaponInfo(WEAPONS[weaponType].name);
    }
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
            
            const reloadIndicator = slot.querySelector('.reload-indicator');
            if (reloadIndicator) {
                if (playerWeaponData.isReloading) {
                    reloadIndicator.style.transform = `scaleX(${playerWeaponData.reloadProgress})`;
                    reloadIndicator.style.backgroundColor = playerWeaponData.reloadProgress > 0.7 ? '#4CAF50' : 
                                                            playerWeaponData.reloadProgress > 0.3 ? '#FF9800' : '#F44336';
                    reloadIndicator.style.display = 'block';
                    reloadIndicator.classList.add('reloading');
                    
                    if (weaponType === currentWeapon) {
                        reloadIndicator.style.height = '4px';
                        reloadIndicator.style.boxShadow = '0 0 5px ' + (playerWeaponData.reloadProgress > 0.7 ? '#4CAF50' : '#FF9800');
                    } else {
                        reloadIndicator.style.height = '3px';
                        reloadIndicator.style.boxShadow = 'none';
                    }
                } else {
                    reloadIndicator.style.transform = 'scaleX(0)';
                    reloadIndicator.style.display = 'none';
                    reloadIndicator.classList.remove('reloading');
                }
            }
            
            if (playerWeaponData.isReloading) {
                slot.style.borderColor = '#FF9800';
                slot.style.boxShadow = '0 0 8px rgba(255, 152, 0, 0.5)';
            } else if (playerWeaponData.ammo === 0) {
                slot.style.borderColor = '#F44336';
                slot.style.boxShadow = '0 0 8px rgba(244, 67, 54, 0.3)';
            } else {
                slot.style.borderColor = weaponType === currentWeapon ? '#4CAF50' : '#666';
                slot.style.boxShadow = weaponType === currentWeapon ? '0 0 10px #4CAF50' : 'none';
            }
            
            if (weaponType === currentWeapon) {
                slot.classList.add('active');
                if (playerWeaponData.isReloading) {
                    const weaponName = slot.querySelector('.weapon-name');
                    if (weaponName) {
                        weaponName.textContent = 'ПЕРЕЗАРЯДКА';
                        weaponName.style.color = '#FF9800';
                    }
                }
            } else {
                slot.classList.remove('active');
                const weaponName = slot.querySelector('.weapon-name');
                if (weaponName && weaponName.textContent === 'ПЕРЕЗАРЯДКА') {
                    weaponName.textContent = weaponData.name;
                    weaponName.style.color = 'white';
                }
            }
        }
    });
}

// Показ информации об оружии
function showWeaponInfo(weaponName) {
    const weaponInfo = document.getElementById('weapon-info');
    weaponInfo.textContent = `Выбрано: ${weaponName}`;
    weaponInfo.style.display = 'block';
    
    setTimeout(() => {
        weaponInfo.style.display = 'none';
    }, 1500);
}

// Обновление КД оружий
function updateWeaponCooldowns() {
    const now = Date.now();
    let needsPanelUpdate = false;
    
    for (const weaponType in playerWeapons) {
        const weaponData = playerWeapons[weaponType];
        
        if (weaponData.isReloading) {
            const reloadTime = WEAPONS[weaponType].reloadTime;
            const elapsed = now - weaponData.reloadStartTime;
            weaponData.reloadProgress = Math.min(1, elapsed / reloadTime);
            needsPanelUpdate = true;
            
            if (elapsed >= reloadTime) {
                weaponData.isReloading = false;
                weaponData.reloadProgress = 0;
                weaponData.ammo = WEAPONS[weaponType].maxAmmo;
                
                if (weaponType === currentWeapon) {
                    showWeaponInfo(`${WEAPONS[weaponType].name} перезаряжен`);
                }
            }
        }
    }
    
    if (needsPanelUpdate) {
        updateWeaponPanel();
    }
}

// Проверка возможности стрельбы
function canShoot() {
    const weapon = WEAPONS[currentWeapon];
    const playerWeapon = playerWeapons[currentWeapon];
    const now = Date.now();
    
    if (playerWeapon.isReloading) {
        return false;
    }
    
    if (playerWeapon.ammo <= 0) {
        if (!playerWeapon.isReloading) {
            startReload();
        }
        return false;
    }
    
    if (now - playerWeapon.lastShotTime < weapon.fireRate) {
        return false;
    }
    
    return true;
}

// Начать перезарядку
function startReload() {
    const playerWeapon = playerWeapons[currentWeapon];
    const weapon = WEAPONS[currentWeapon];
    
    if (playerWeapon.ammo >= weapon.maxAmmo) return;
    if (playerWeapon.isReloading) return;
    
    playerWeapon.isReloading = true;
    playerWeapon.reloadStartTime = Date.now();
    playerWeapon.reloadProgress = 0;
    
    showWeaponInfo(`${weapon.name} перезаряжается...`);
    updateWeaponPanel();
}

// Стрельба
function shootWeapon() {
    const weapon = WEAPONS[currentWeapon];
    const playerWeapon = playerWeapons[currentWeapon];
    const now = Date.now();
    
    if (!canShoot()) return false;
    
    playerWeapon.ammo--;
    playerWeapon.lastShotTime = now;
    
    const baseDirection = player.direction;
    const accuracyOffset = weapon.accuracy > 0 ? 
        (Math.random() * weapon.accuracy * 2 - weapon.accuracy) : 0;
    const bulletDirection = baseDirection + accuracyOffset;
    
    if (currentWeapon === 'shotgun') {
        const pelletsCount = weapon.pellets || 5;
        for (let i = 0; i < pelletsCount; i++) {
            const pelletSpread = (Math.random() * weapon.accuracy * 2 - weapon.accuracy);
            const pelletDirection = bulletDirection + pelletSpread;
            
            const pellet = {
                x: player.x,
                y: player.y,
                direction: pelletDirection,
                speed: weapon.bulletSpeed,
                playerId: playerId,
                weaponType: currentWeapon,
                color: weapon.bulletColor,
                size: weapon.bulletSize,
                isPellet: true
            };
            
            bullets.push(pellet);
            
            if (database) {
                const newBulletRef = firebase.database().ref('bullets').push();
                newBulletRef.set({
                    x: pellet.x,
                    y: pellet.y,
                    direction: pellet.direction,
                    playerId: playerId,
                    weaponType: currentWeapon,
                    timestamp: Date.now()
                });
            }
        }
    } else if (currentWeapon === 'grenade') {
        const grenadeDirection = baseDirection + accuracyOffset;
        
        const grenade = {
            x: player.x,
            y: player.y,
            direction: grenadeDirection,
            speed: weapon.bulletSpeed * 1.2,
            playerId: playerId,
            weaponType: currentWeapon,
            color: weapon.grenadeColor,
            size: weapon.bulletSize,
            fuseTime: weapon.fuseTime,
            fuseStartTime: Date.now(),
            explosionRadius: weapon.explosionRadiusTiles,
            explosionDamage: weapon.explosionDamage,
            state: 'flying',
            bouncesLeft: 3,
            travelDistance: 0,
            maxTravelDistance: 7 * TILE_SIZE,
            initialSpeed: weapon.bulletSpeed * 1.2
        };
        
        grenades.push(grenade);
        
        if (database) {
            const newGrenadeRef = firebase.database().ref('grenades').push();
            newGrenadeRef.set({
                x: grenade.x,
                y: grenade.y,
                direction: grenade.direction,
                playerId: playerId,
                weaponType: currentWeapon,
                timestamp: Date.now(),
                fuseTime: grenade.fuseTime,
                bouncesLeft: grenade.bouncesLeft,
                travelDistance: grenade.travelDistance,
                maxTravelDistance: grenade.maxTravelDistance
            });
        }
    } else {
        const bullet = {
            x: player.x,
            y: player.y,
            direction: bulletDirection,
            speed: weapon.bulletSpeed,
            playerId: playerId,
            weaponType: currentWeapon,
            color: weapon.bulletColor,
            size: weapon.bulletSize,
            penetration: weapon.penetration || 0
        };
        
        bullets.push(bullet);
        
        if (database) {
            const newBulletRef = firebase.database().ref('bullets').push();
            newBulletRef.set({
                x: bullet.x,
                y: bullet.y,
                direction: bullet.direction,
                playerId: playerId,
                weaponType: currentWeapon,
                timestamp: Date.now()
            });
        }
    }
    
    updateWeaponPanel();
    
    if (isPlayerInBush(player)) {
        const now = Date.now();
        if (now >= playerBushRevealEndTime) {
            playerBushRevealEndTime = now + BUSH_REVEAL_DURATION;
            
            if (database) {
                firebase.database().ref('players/' + playerId).update({
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
                    lastUpdate: Date.now(),
                    isVisibleFromBush: true,
                    bushVisibilityEndTime: Date.now() + BUSH_REVEAL_DURATION
                });
                
                if (window.bushHideTimeout) {
                    clearTimeout(window.bushHideTimeout);
                    window.bushHideTimeout = null;
                }
                
                window.bushHideTimeout = setTimeout(() => {
                    if (player && isPlayerInBush(player)) {
                        playerBushRevealEndTime = 0;
                        firebase.database().ref('players/' + playerId).update({
                            isVisibleFromBush: false,
                            bushVisibilityEndTime: null
                        });
                    }
                    window.bushHideTimeout = null;
                }, BUSH_REVEAL_DURATION);
            }
        }
    }
    
    return true;
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
        
        let hitPlayer = false;
        for (const id in players) {
            const targetPlayer = players[id];
            if (!targetPlayer || targetPlayer.hp <= 0 || id === bullet.playerId) continue;
            
            const dx = bullet.x - targetPlayer.x;
            const dy = bullet.y - targetPlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 15) {
                const weaponDamage = WEAPONS[bullet.weaponType]?.damage || 1;
                const currentServerHp = targetPlayer.hp || MAX_HP;
                const newHp = Math.max(0, currentServerHp - weaponDamage);
                
                if (isPlayerInBush(targetPlayer)) {
                    const now = Date.now();
                    if (now >= (targetPlayer.bushVisibilityEndTime || 0)) {
                        if (players[id]) {
                            players[id].hp = newHp;
                        }
                        
                        if (database) {
                            firebase.database().ref('players/' + id).update({
                                hp: newHp,
                                isVisibleFromBush: true,
                                bushVisibilityEndTime: Date.now() + BUSH_REVEAL_DURATION,
                                x: targetPlayer.x,
                                y: targetPlayer.y
                            });
                            
                            targetPlayer.isVisibleFromBush = true;
                            targetPlayer.bushVisibilityEndTime = now + BUSH_REVEAL_DURATION;
                            
                            setTimeout(() => {
                                if (players[id] && isPlayerInBush(players[id])) {
                                    players[id].isVisibleFromBush = false;
                                    players[id].bushVisibilityEndTime = 0;
                                    
                                    firebase.database().ref('players/' + id).update({
                                        isVisibleFromBush: false,
                                        bushVisibilityEndTime: null
                                    });
                                }
                            }, BUSH_REVEAL_DURATION);
                        }
                    } else {
                        if (database) {
                            firebase.database().ref('players/' + id).update({
                                hp: newHp
                            });
                        }
                    }
                } else {
                    if (database) {
                        firebase.database().ref('players/' + id).update({
                            hp: newHp
                        });
                    }
                }
                
                if (newHp <= 0) {
                    const respawnPos = getRandomSandPosition();
                    targetPlayer.x = respawnPos.x;
                    targetPlayer.y = respawnPos.y;
                    targetPlayer.hp = MAX_HP;
                    
                    if (database) {
                        firebase.database().ref('players/' + id).update({
                            x: targetPlayer.x,
                            y: targetPlayer.y,
                            hp: MAX_HP
                        });
                    }
                }
                
                hitPlayer = true;
                break;
            }
        }
        
        if (hitPlayer) {
            bullets.splice(i, 1);
            continue;
        }
        
        if (bullet.x < 0 || bullet.x > MAP_WIDTH * TILE_SIZE || 
            bullet.y < 0 || bullet.y > MAP_HEIGHT * TILE_SIZE) {
            bullets.splice(i, 1);
        }
    }
    
    // Обновление чужих пуль
    for (let i = remoteBullets.length - 1; i >= 0; i--) {
        const bullet = remoteBullets[i];
        if (!bullet.x || !bullet.y) {
            remoteBullets.splice(i, 1);
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
                        remoteBullets.splice(i, 1);
                    }
                    continue;
                } else {
                    destroyCactus(bulletTileX, bulletTileY);
                    remoteBullets.splice(i, 1);
                    continue;
                }
            } else if (tileType === 'wall' || tileType === 'rock') {
                remoteBullets.splice(i, 1);
                continue;
            }
        }
        
        if (player && player.hp > 0 && bullet.playerId !== playerId) {
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                const weaponDamage = WEAPONS[bullet.weaponType]?.damage || 1;
                const newHp = Math.max(0, player.hp - weaponDamage);
                
                player.localHp = newHp;
                player.hp = newHp;
                
                if (player.ignoreServerHpUntil) {
                    player.ignoreServerHpUntil = Math.max(player.ignoreServerHpUntil, Date.now() + 500);
                } else {
                    player.ignoreServerHpUntil = Date.now() + 500;
                }
                
                if (isPlayerInBush(player)) {
                    const now = Date.now();
                    if (now >= playerBushRevealEndTime) {
                        playerBushRevealEndTime = now + BUSH_REVEAL_DURATION;
                        
                        if (database) {
                            firebase.database().ref('players/' + playerId).update({
                                hp: newHp,
                                isVisibleFromBush: true,
                                bushVisibilityEndTime: Date.now() + BUSH_REVEAL_DURATION
                            });
                            
                            if (window.bushHideTimeout) {
                                clearTimeout(window.bushHideTimeout);
                            }
                            
                            window.bushHideTimeout = setTimeout(() => {
                                if (player && isPlayerInBush(player)) {
                                    playerBushRevealEndTime = 0;
                                    firebase.database().ref('players/' + playerId).update({
                                        isVisibleFromBush: false,
                                        bushVisibilityEndTime: null
                                    });
                                }
                            }, BUSH_REVEAL_DURATION);
                        }
                    } else {
                        if (database) {
                            firebase.database().ref('players/' + playerId).update({
                                hp: newHp
                            });
                        }
                    }
                } else {
                    if (database) {
                        firebase.database().ref('players/' + playerId).update({
                            hp: newHp
                        });
                    }
                }
                
                if (newHp <= 0) {
                    const respawnPos = getRandomSandPosition();
                    player.x = respawnPos.x;
                    player.y = respawnPos.y;
                    player.hp = MAX_HP;
                    player.localHp = MAX_HP;
                    playerBushRevealEndTime = 0;
                    
                    if (database) {
                        firebase.database().ref('players/' + playerId).update({
                            x: player.x,
                            y: player.y,
                            hp: MAX_HP,
                            isVisibleFromBush: false,
                            bushVisibilityEndTime: null
                        });
                    }
                }
                
                remoteBullets.splice(i, 1);
                continue;
            }
        }
        
        if (bullet.x < 0 || bullet.x > MAP_WIDTH * TILE_SIZE || 
            bullet.y < 0 || bullet.y > MAP_HEIGHT * TILE_SIZE) {
            remoteBullets.splice(i, 1);
        }
    }
}

// Обновление гранат
function updateGrenades() {
    const now = Date.now();
    
    for (let i = grenades.length - 1; i >= 0; i--) {
        const grenade = grenades[i];
        
        if (grenade.state === 'flying') {
            const moveX = Math.cos(grenade.direction * Math.PI / 180) * grenade.speed;
            const moveY = Math.sin(grenade.direction * Math.PI / 180) * grenade.speed;
            
            grenade.x += moveX;
            grenade.y += moveY;
            grenade.speed *= 0.98;
            
            if (grenade.speed < 0.5) {
                grenade.state = 'landed';
                grenade.fuseStartTime = now;
            }
            
            grenade.travelDistance += Math.sqrt(moveX * moveX + moveY * moveY);
            
            if (grenade.travelDistance >= grenade.maxTravelDistance) {
                grenade.state = 'landed';
                grenade.fuseStartTime = now;
                continue;
            }
            
            const grenadeTileX = Math.floor(grenade.x / TILE_SIZE);
            const grenadeTileY = Math.floor(grenade.y / TILE_SIZE);
            
            if (grenadeTileX >= 0 && grenadeTileX < MAP_WIDTH && 
                grenadeTileY >= 0 && grenadeTileY < MAP_HEIGHT) {
                
                const tileType = map[grenadeTileX] && map[grenadeTileX][grenadeTileY];
                
                if (tileType === 'wall' || tileType === 'rock' || tileType === 'cactus') {
                    if (grenade.bouncesLeft > 0) {
                        grenade.bouncesLeft--;
                        
                        const prevX = grenade.x - moveX;
                        const prevY = grenade.y - moveY;
                        const prevTileX = Math.floor(prevX / TILE_SIZE);
                        const prevTileY = Math.floor(prevY / TILE_SIZE);
                        
                        if (prevTileX !== grenadeTileX) {
                            grenade.direction = 180 - grenade.direction;
                        }
                        if (prevTileY !== grenadeTileY) {
                            grenade.direction = -grenade.direction;
                        }
                        
                        grenade.direction = ((grenade.direction % 360) + 360) % 360;
                        grenade.x = prevX;
                        grenade.y = prevY;
                        grenade.speed *= 0.8;
                    } else {
                        grenade.state = 'landed';
                        grenade.fuseStartTime = now;
                        
                        if (tileType === 'cactus') {
                            destroyCactus(grenadeTileX, grenadeTileY);
                        }
                    }
                }
            }
            
            if (grenade.x < 0 || grenade.x > MAP_WIDTH * TILE_SIZE || 
                grenade.y < 0 || grenade.y > MAP_HEIGHT * TILE_SIZE) {
                grenade.state = 'landed';
                grenade.fuseStartTime = now;
                continue;
            }
        } else if (grenade.state === 'landed') {
            if (now - grenade.fuseStartTime >= grenade.fuseTime) {
                createExplosion(grenade.x, grenade.y, grenade.explosionRadius, grenade.explosionDamage, grenade.playerId);
                
                if (database) {
                    const explosionRef = firebase.database().ref('explosions').push();
                    explosionRef.set({
                        x: grenade.x,
                        y: grenade.y,
                        radius: grenade.explosionRadius,
                        damage: 6,
                        playerId: grenade.playerId,
                        timestamp: Date.now()
                    });
                }
                
                grenades.splice(i, 1);
            } else if (!grenade.fuseStartTime) {
                grenade.fuseStartTime = now;
            }
        }
    }
    
    // Обновление гранат других игроков
    for (let i = remoteGrenades.length - 1; i >= 0; i--) {
        const grenade = remoteGrenades[i];
        
        if (grenade.state === 'flying') {
            const moveX = Math.cos(grenade.direction * Math.PI / 180) * grenade.speed;
            const moveY = Math.sin(grenade.direction * Math.PI / 180) * grenade.speed;
            
            grenade.x += moveX;
            grenade.y += moveY;
            grenade.speed *= 0.98;
            
            if (grenade.speed < 0.5) {
                grenade.state = 'landed';
                grenade.fuseStartTime = now;
            }
            
            grenade.travelDistance += Math.sqrt(moveX * moveX + moveY * moveY);
            
            if (grenade.travelDistance >= grenade.maxTravelDistance) {
                grenade.state = 'landed';
                grenade.fuseStartTime = now;
                continue;
            }
            
            const grenadeTileX = Math.floor(grenade.x / TILE_SIZE);
            const grenadeTileY = Math.floor(grenade.y / TILE_SIZE);
            
            if (grenadeTileX >= 0 && grenadeTileX < MAP_WIDTH && 
                grenadeTileY >= 0 && grenadeTileY < MAP_HEIGHT) {
                
                const tileType = map[grenadeTileX] && map[grenadeTileX][grenadeTileY];
                
                if (tileType === 'wall' || tileType === 'rock' || tileType === 'cactus') {
                    if (grenade.bouncesLeft > 0) {
                        grenade.bouncesLeft--;
                        
                        const prevX = grenade.x - moveX;
                        const prevY = grenade.y - moveY;
                        const prevTileX = Math.floor(prevX / TILE_SIZE);
                        const prevTileY = Math.floor(prevY / TILE_SIZE);
                        
                        if (prevTileX !== grenadeTileX) {
                            grenade.direction = 180 - grenade.direction;
                        }
                        if (prevTileY !== grenadeTileY) {
                            grenade.direction = -grenade.direction;
                        }
                        
                        grenade.direction = ((grenade.direction % 360) + 360) % 360;
                        grenade.x = prevX;
                        grenade.y = prevY;
                        grenade.speed *= 0.8;
                    } else {
                        grenade.state = 'landed';
                        grenade.fuseStartTime = now;
                        
                        if (tileType === 'cactus') {
                            destroyCactus(grenadeTileX, grenadeTileY);
                        }
                    }
                }
            }
            
            if (grenade.x < 0 || grenade.x > MAP_WIDTH * TILE_SIZE || 
                grenade.y < 0 || grenade.y > MAP_HEIGHT * TILE_SIZE) {
                grenade.state = 'landed';
                grenade.fuseStartTime = now;
                continue;
            }
        } else if (grenade.state === 'landed') {
            if (now - grenade.fuseStartTime >= grenade.fuseTime) {
                createExplosion(grenade.x, grenade.y, grenade.explosionRadius, grenade.explosionDamage, grenade.playerId);
                remoteGrenades.splice(i, 1);
            } else if (!grenade.fuseStartTime) {
                grenade.fuseStartTime = now;
            }
        }
    }
    
    // Обновление взрывов
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        
        if (now - explosion.startTime >= explosion.duration) {
            explosions.splice(i, 1);
        }
    }
}

// Создание взрыва
function createExplosion(x, y, radius, damage, playerId) {
    const now = Date.now();
    for (const exp of explosions) {
        const distance = Math.sqrt(Math.pow(exp.x - x, 2) + Math.pow(exp.y - y, 2));
        if (distance < 10 && now - exp.startTime < 100) {
            return;
        }
    }
    
    const explosion = {
        x: x,
        y: y,
        radius: radius * TILE_SIZE,
        damage: damage,
        playerId: playerId,
        startTime: now,
        duration: GRENADE_SETTINGS.explosionDuration
    };
    
    explosions.push(explosion);
    
    const centerTileX = Math.floor(x / TILE_SIZE);
    const centerTileY = Math.floor(y / TILE_SIZE);
    
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const tileX = centerTileX + dx;
            const tileY = centerTileY + dy;
            
            if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
                const tileType = map[tileX] && map[tileX][tileY];
                if (tileType === 'cactus') {
                    map[tileX][tileY] = 'sand';
                    if (database) {
                        firebase.database().ref('map/data/' + tileX + '/' + tileY).set('sand');
                    }
                }
            }
        }
    }
    
    const explosionRadiusPixels = radius * TILE_SIZE;
    const maxDamage = 6;
    
    if (player && player.hp > 0) {
        const distanceToPlayer = Math.sqrt(
            Math.pow(player.x - x, 2) + 
            Math.pow(player.y - y, 2)
        );
        
        if (distanceToPlayer <= explosionRadiusPixels) {
            const distanceInTiles = Math.floor(distanceToPlayer / TILE_SIZE);
            let grenadeDamage = maxDamage;
            grenadeDamage = Math.max(1, maxDamage - distanceInTiles);
            
            const newHp = Math.max(0, player.hp - grenadeDamage);
            
            player.localHp = newHp;
            player.hp = newHp;
            
            if (player.ignoreServerHpUntil) {
                player.ignoreServerHpUntil = Math.max(player.ignoreServerHpUntil, Date.now() + 500);
            } else {
                player.ignoreServerHpUntil = Date.now() + 500;
            }
            
            if (database) {
                firebase.database().ref('players/' + playerId).update({
                    hp: newHp
                });
            }
            
            if (newHp <= 0) {
                const respawnPos = getRandomSandPosition();
                player.x = respawnPos.x;
                player.y = respawnPos.y;
                player.hp = MAX_HP;
                player.localHp = MAX_HP;
                playerBushRevealEndTime = 0;
                
                if (database) {
                    firebase.database().ref('players/' + playerId).update({
                        x: player.x,
                        y: player.y,
                        hp: MAX_HP,
                        isVisibleFromBush: false,
                        bushVisibilityEndTime: null
                    });
                }
            }
        }
    }
}

// Отрисовка пуль и гранат
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
    
    for (const grenade of grenades) {
        if (!grenade.x || !grenade.y) continue;
        
        ctx.fillStyle = grenade.color || '#228B22';
        ctx.beginPath();
        ctx.arc(grenade.x, grenade.y, grenade.size || 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#32CD32';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(grenade.x, grenade.y, grenade.size || 8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#90EE90';
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI / 4) + (Date.now() / 1000);
            const dotX = grenade.x + Math.cos(angle) * 5;
            const dotY = grenade.y + Math.sin(angle) * 5;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (grenade.state === 'landed') {
            const timeLeft = grenade.fuseTime - (Date.now() - grenade.fuseStartTime);
            
            if (Math.floor(Date.now() / 200) % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, grenade.size || 8, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((timeLeft / 1000).toFixed(1) + 's', grenade.x, grenade.y - 15);
        }
    }
    
    for (const grenade of remoteGrenades) {
        if (!grenade.x || !grenade.y) continue;
        
        ctx.fillStyle = grenade.color || '#228B22';
        ctx.beginPath();
        ctx.arc(grenade.x, grenade.y, grenade.size || 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#32CD32';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(grenade.x, grenade.y, grenade.size || 8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#90EE90';
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI / 4) + (Date.now() / 1000);
            const dotX = grenade.x + Math.cos(angle) * 5;
            const dotY = grenade.y + Math.sin(angle) * 5;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (grenade.state === 'landed') {
            const timeLeft = grenade.fuseTime - (Date.now() - grenade.fuseStartTime);
            
            if (Math.floor(Date.now() / 200) % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, grenade.size || 8, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((timeLeft / 1000).toFixed(1) + 's', grenade.x, grenade.y - 15);
        }
    }
    
    for (const explosion of explosions) {
        const progress = (Date.now() - explosion.startTime) / explosion.duration;
        const currentRadius = explosion.radius * Math.min(1, progress * 1.5);
        
        const gradient = ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, currentRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.7)');
        gradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        if (progress < 0.5) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 - progress * 1.6})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, currentRadius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = currentRadius * Math.random();
            const particleX = explosion.x + Math.cos(angle) * distance;
            const particleY = explosion.y + Math.sin(angle) * distance;
            const size = 2 + Math.random() * 3;
            
            ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${0.8 - progress})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Настройки слушателей для оружия
function setupBulletsListener() {
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
    
    firebase.database().ref('grenades').on('child_added', (snapshot) => {
        const grenadeData = snapshot.val();
        
        if (grenadeData.playerId === playerId) return;
        
        const weaponConfig = WEAPONS[grenadeData.weaponType] || WEAPONS.grenade;
        
        remoteGrenades.push({
            x: grenadeData.x,
            y: grenadeData.y,
            direction: grenadeData.direction,
            speed: weaponConfig.bulletSpeed,
            playerId: grenadeData.playerId,
            weaponType: grenadeData.weaponType,
            color: weaponConfig.grenadeColor,
            size: weaponConfig.bulletSize,
            fuseTime: grenadeData.fuseTime || weaponConfig.fuseTime,
            fuseStartTime: Date.now(),
            explosionRadius: weaponConfig.explosionRadiusTiles,
            explosionDamage: weaponConfig.explosionDamage,
            state: 'flying',
            bouncesLeft: grenadeData.bouncesLeft || 3,
            travelDistance: grenadeData.travelDistance || 0,
            maxTravelDistance: grenadeData.maxTravelDistance || (7 * TILE_SIZE)
        });
        
        setTimeout(() => {
            snapshot.ref.remove();
        }, 10000);
    });
    
    firebase.database().ref('explosions').on('child_added', (snapshot) => {
        const explosionData = snapshot.val();
        const now = Date.now();
        let explosionExists = false;
        
        for (const exp of explosions) {
            const distance = Math.sqrt(Math.pow(exp.x - explosionData.x, 2) + Math.pow(exp.y - explosionData.y, 2));
            if (distance < 10 && now - exp.startTime < 100) {
                explosionExists = true;
                break;
            }
        }
        
        if (!explosionExists) {
            createExplosion(
                explosionData.x,
                explosionData.y,
                explosionData.radius,
                6,
                explosionData.playerId
            );
        }
        
        setTimeout(() => {
            snapshot.ref.remove();
        }, 1000);
    });
}