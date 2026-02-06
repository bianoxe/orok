// ================= ФУНКЦИИ ИГРОКА =================

function updatePlayerPosition() {
    if (player && playerId) {
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
        // Исправлено: firebase.database().ref().update()
        firebase.database().ref('players/' + playerId).update(playerData);
    }
}

function setupPlayersListener() {
    // Исправлено: firebase.database().ref().on()
    firebase.database().ref('players').on('value', (snapshot) => {
        const playersData = snapshot.val() || {};
        
        for (const id in playersData) {
            const playerData = playersData[id];
            const now = Date.now();
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
        
        for (const id in players) {
            if (!playersData[id]) {
                delete players[id];
            }
        }
        
        updatePlayerList();
    });
}

function cleanupInactivePlayers() {
    setInterval(async () => {
        const now = Date.now();
        try {
            // Исправлено: firebase.database().ref().get()
            const snapshot = await firebase.database().ref('players').get();
            const playersData = snapshot.val() || {};
            for (const id in playersData) {
                if (now - (playersData[id].lastUpdate || 0) > 30000) {
                    // Исправлено: firebase.database().ref().remove()
                    await firebase.database().ref('players/' + id).remove();
                }
            }
        } catch (error) {
            console.error("Error cleaning up players:", error);
        }
    }, 5000);
}

function savePlayerPosition() {
    if (!player || !playerId) return;
    
    const playerName = document.getElementById('player-name').value.trim() || 'Игрок';
    const playerData = {
        x: player.x,
        y: player.y,
        direction: player.direction,
        color: player.color,
        name: playerName,
        hp: player.localHp || MAX_HP,
        currentWeapon: currentWeapon,
        ignoreServerHpUntil: player.ignoreServerHpUntil || 0,
        deviceType: player.deviceType,
        pcControlLayout: player.pcControlLayout,
        pcShootType: player.pcShootType,
        mobileControlLayout: player.mobileControlLayout,
        mobileShootType: player.mobileShootType,
        lastUpdate: Date.now()
    };
    
    localStorage.setItem('lastPlayerPosition', JSON.stringify({
        x: player.x,
        y: player.y,
        direction: player.direction,
        color: player.color,
        name: playerName,
        hp: player.localHp || MAX_HP,
        currentWeapon: currentWeapon,
        ignoreServerHpUntil: player.ignoreServerHpUntil || 0
    }));
    
    // Исправлено: firebase.database().ref().update()
    firebase.database().ref('players/' + playerId).update({
        ...playerData,
        hp: 0
    });
}