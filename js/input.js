// ================= ФУНКЦИИ УПРАВЛЕНИЯ =================

// Инициализация настроек
function initializeSettings() {
    const deviceTypeSelect = document.getElementById('device-type');
    const settingsDeviceType = document.getElementById('settings-device-type');
    const pcShootTypeSelect = document.getElementById('pc-shoot-type');
    const mobileShootTypeSelect = document.getElementById('mobile-shoot-type');
    
    if (isMobileDevice()) {
        deviceTypeSelect.value = 'mobile';
        settingsDeviceType.value = 'mobile';
    }
    
    pcShootTypeSelect.value = 'mouse';
    mobileShootTypeSelect.value = 'button';
    
    updateSettingsVisibility();
}

function updateSettingsVisibility() {
    const pcSection = document.getElementById('pc-controls-section');
    const mobileSection = document.getElementById('mobile-controls-section');
    const settingsDeviceType = document.getElementById('settings-device-type');
    
    if (settingsDeviceType.value === 'pc') {
        pcSection.style.display = 'block';
        mobileSection.style.display = 'none';
    } else {
        pcSection.style.display = 'none';
        mobileSection.style.display = 'block';
    }
}

// Определение устройства
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Обработка ввода мыши
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

function handleMouseClick(e) {
    if (deviceType === 'pc' && pcShootType === 'mouse') {
        if (e.button === 0) {
            isShootingHeld = true;
            handleShooting();
        }
    }
}

function handleMouseUp(e) {
    if (deviceType === 'pc' && pcShootType === 'mouse') {
        if (e.button === 0) {
            isShootingHeld = false;
        }
    }
}

// Обработка тач-ввода
function handleTouchShoot(e) {
    if (deviceType === 'mobile' && mobileShootType === 'touch' && player) {
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        const canvasRect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - canvasRect.left;
        const touchY = touch.clientY - canvasRect.top;
        
        const worldTouchX = touchX - (canvas.width/2 - player.x);
        const worldTouchY = touchY - (canvas.height/2 - player.y);
        
        const deltaX = worldTouchX - player.x;
        const deltaY = worldTouchY - player.y;
        player.direction = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        if (typeof shootWeapon === 'function') {
            shootWeapon();
        }
    }
}

// Обработка стрельбы
function handleShooting() {
    if (typeof WEAPONS === 'undefined' || !WEAPONS[currentWeapon]) return;
    
    const weapon = WEAPONS[currentWeapon];
    
    if (weapon.isAutomatic) {
        if (isShootingHeld && typeof shootWeapon === 'function') {
            shootWeapon();
        }
    } else {
        if (isShootingHeld && typeof shootWeapon === 'function') {
            shootWeapon();
            isShootingHeld = false;
        }
    }
}

// Инициализация мобильного управления
function initializeMobileControls() {
    const moveJoystick = document.getElementById('move-joystick');
    const joystickHandle = moveJoystick.querySelector('.joystick-handle');
    const joystickBase = moveJoystick.querySelector('.joystick-base');
    const shootButton = document.getElementById('shoot-button');
    
    let isJoystickActive = false;
    let isShootingActive = false;
    const baseRect = joystickBase.getBoundingClientRect();
    const baseCenterX = baseRect.left + baseRect.width / 2;
    const baseCenterY = baseRect.top + baseRect.height / 2;
    const maxDistance = baseRect.width / 3;

    moveJoystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isJoystickActive = true;
        updateJoystick(e);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (isJoystickActive) {
            e.preventDefault();
            updateJoystick(e);
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const shootButtonRect = shootButton.getBoundingClientRect();
            const isTouchOnShootButton = (
                touch.clientX >= shootButtonRect.left &&
                touch.clientX <= shootButtonRect.right &&
                touch.clientY >= shootButtonRect.top &&
                touch.clientY <= shootButtonRect.bottom
            );
            
            if (!isTouchOnShootButton) {
                resetJoystick();
                isJoystickActive = false;
            }
        }
    });

    shootButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isShootingActive = true;
        mobileControls.shooting = true;
        isShootingHeld = true;
        handleShooting();
    }, { passive: false });

    shootButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        isShootingActive = false;
        mobileControls.shooting = false;
        isShootingHeld = false;
    }, { passive: false });

    function updateJoystick(e) {
        const touch = e.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        const deltaX = touchX - baseCenterX;
        const deltaY = touchY - baseCenterY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);

        const limitedDistance = Math.min(distance, maxDistance);
        
        const handleX = Math.cos(angle) * limitedDistance;
        const handleY = Math.sin(angle) * limitedDistance;

        joystickHandle.style.transform = `translate(${handleX}px, ${handleY}px)`;

        const magnitude = Math.sqrt(handleX * handleX + handleY * handleY);
        if (magnitude > 0) {
            mobileControls.moveX = limitedDistance > 10 ? (handleX / magnitude) : 0;
            mobileControls.moveY = limitedDistance > 10 ? (handleY / magnitude) : 0;
        } else {
            mobileControls.moveX = 0;
            mobileControls.moveY = 0;
        }

        if (mobileShootType === 'button' && (mobileControls.moveX !== 0 || mobileControls.moveY !== 0)) {
            player.direction = Math.atan2(mobileControls.moveY, mobileControls.moveX) * 180 / Math.PI;
        }
    }

    function resetJoystick() {
        joystickHandle.style.transform = 'translate(0, 0)';
        mobileControls.moveX = 0;
        mobileControls.moveY = 0;
    }
}

function initializeMobileButtons() {
    const upButton = document.getElementById('up-button');
    const downButton = document.getElementById('down-button');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const shootButtonButtons = document.getElementById('shoot-button-buttons');

    function setupButton(button, direction) {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            buttonControls[direction] = true;
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            buttonControls[direction] = false;
        }, { passive: false });
    }

    setupButton(upButton, 'up');
    setupButton(downButton, 'down');
    setupButton(leftButton, 'left');
    setupButton(rightButton, 'right');

    shootButtonButtons.addEventListener('touchstart', (e) => {
        e.preventDefault();
        buttonControls.shooting = true;
        isShootingHeld = true;
        handleShooting();
    }, { passive: false });

    shootButtonButtons.addEventListener('touchend', (e) => {
        e.preventDefault();
        buttonControls.shooting = false;
        isShootingHeld = false;
    }, { passive: false });
}

function initializePCMobileJoystick() {
    const pcMobileJoystickContainer = document.getElementById('pc-mobile-joystick-container');
    const pcMobileJoystickHandle = pcMobileJoystickContainer.querySelector('.pc-mobile-joystick-handle');
    const joystickBase = pcMobileJoystickContainer.querySelector('.pc-mobile-joystick-base');
    
    let isJoystickActive = false;
    const baseRect = joystickBase.getBoundingClientRect();
    const baseCenterX = baseRect.left + baseRect.width / 2;
    const baseCenterY = baseRect.top + baseRect.height / 2;
    const maxDistance = baseRect.width / 3;

    pcMobileJoystickContainer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isJoystickActive = true;
        updatePCMobileJoystick(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (isJoystickActive) {
            e.preventDefault();
            updatePCMobileJoystick(e);
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (isJoystickActive) {
            e.preventDefault();
            resetPCMobileJoystick();
            isJoystickActive = false;
        }
    });

    function updatePCMobileJoystick(e) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const deltaX = mouseX - baseCenterX;
        const deltaY = mouseY - baseCenterY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);

        const limitedDistance = Math.min(distance, maxDistance);
        
        const handleX = Math.cos(angle) * limitedDistance;
        const handleY = Math.sin(angle) * limitedDistance;

        pcMobileJoystickHandle.style.transform = `translate(${handleX}px, ${handleY}px)`;

        const magnitude = Math.sqrt(handleX * handleX + handleY * handleY);
        if (magnitude > 0) {
            mobileControls.moveX = limitedDistance > 10 ? (handleX / magnitude) : 0;
            mobileControls.moveY = limitedDistance > 10 ? (handleY / magnitude) : 0;
        } else {
            mobileControls.moveX = 0;
            mobileControls.moveY = 0;
        }

        if (pcShootType === 'keyboard' && (mobileControls.moveX !== 0 || mobileControls.moveY !== 0)) {
            player.direction = Math.atan2(mobileControls.moveY, mobileControls.moveX) * 180 / Math.PI;
        }
    }

    function resetPCMobileJoystick() {
        pcMobileJoystickHandle.style.transform = 'translate(0, 0)';
        mobileControls.moveX = 0;
        mobileControls.moveY = 0;
    }
}

function updateControlSystem() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mousedown', handleMouseClick);
    document.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('touchstart', handleTouchShoot);
    
    const mobileControlsElement = document.getElementById('mobile-controls');
    const mobileButtonsControlsElement = document.getElementById('mobile-buttons-controls');
    const pcMobileJoystickElement = document.getElementById('pc-mobile-joystick');
    
    mobileControlsElement.style.display = 'none';
    mobileButtonsControlsElement.style.display = 'none';
    pcMobileJoystickElement.style.display = 'none';
    
    if (deviceType === 'pc') {
        if (pcControlLayout === 'joystick') {
            pcMobileJoystickElement.style.display = 'flex';
            initializePCMobileJoystick();
        }
        
        if (pcShootType === 'mouse') {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mousedown', handleMouseClick);
            document.addEventListener('mouseup', handleMouseUp);
        }
    } else {
        if (mobileControlLayout === 'joystick') {
            mobileControlsElement.style.display = 'flex';
            initializeMobileControls();
        } else if (mobileControlLayout === 'buttons') {
            mobileButtonsControlsElement.style.display = 'flex';
            initializeMobileButtons();
        }
        
        if (mobileShootType === 'touch') {
            canvas.addEventListener('touchstart', handleTouchShoot);
        }
    }
}

// Обработка клавиатуры
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
    
    if (key === 'r' || key === 'к' || key === 'К') {
        e.preventDefault();
        if (typeof startReload === 'function') {
            startReload();
        }
    }
    
    if (key === 'x' || key === 'ч') {
        e.preventDefault();
        if (typeof switchWeapon === 'function') {
            switchWeapon('grenade');
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});