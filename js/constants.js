// ================= ГЛОБАЛЬНЫЕ КОНСТАНТЫ =================
const MAP_WIDTH = 40;
const MAP_HEIGHT = 40;
const TILE_SIZE = 40;
const MAP_UPDATE_INTERVAL = 4 * 60 * 1000;

const MAX_HP = 7;
const PLAYER_SPEED = 1.5;
const VISION_RADIUS = 10;

const SPAWN_POINTS = [
    { x: 2, y: 2 },
    { x: MAP_WIDTH - 3, y: 2 },
    { x: 2, y: MAP_HEIGHT - 3 },
    { x: MAP_WIDTH - 3, y: MAP_HEIGHT - 3 }
];

const TANK_COLORS = [
    { name: "Зелёный", value: "#4CAF50" },
    { name: "Синий", value: "#2196F3" },
    { name: "Оранжевый", value: "#FF9800" },
    { name: "Розовый", value: "#E91E63" }
];

const WEAPONS = {
    pistol: {
        name: "ПИСТОЛЕТ",
        maxAmmo: 13,
        fireRate: 300,
        reloadTime: 3000,
        accuracy: 3,
        bulletSpeed: 20,
        damage: 1,
        isAutomatic: false,
        bulletColor: "#FF5722",
        bulletSize: 5,
        key: "1"
    },
    ak47: {
        name: "АК-47",
        maxAmmo: 31,
        fireRate: 100,
        reloadTime: 4000,
        accuracy: 6,
        bulletSpeed: 20,
        damage: 1,
        isAutomatic: true,
        bulletColor: "#2196F3",
        bulletSize: 5,
        key: "2"
    }
};

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCGE1Wx2UJKW9yW_smMaxLNPs6ifApOUKc",
    authDomain: "pomorok-a6aad.firebaseapp.com",
    databaseURL: "https://pomorok-a6aad-default-rtdb.firebaseio.com",
    projectId: "pomorok-a6aad",
    storageBucket: "pomorok-a6aad.firebasestorage.app",
    messagingSenderId: "1079148253568",
    appId: "1:1079148253568:web:629f5904f3f93912423165",
    measurementId: "G-S2X6Y2W6VM"
};

// ================= ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =================
let player = null;
let playerId = null;
let players = {};
let canvas, ctx;
let database;
let map = [];
let mapLoaded = false;
let currentWeapon = 'pistol'; // ИСПРАВЛЕНО: задано значение по умолчанию
let playerWeapons = {};
let isShootingHeld = false;
let selectedTankColor = TANK_COLORS[0];
let firebaseApp;

let deviceType = 'pc';
let pcControlLayout = 'keyboard';
let pcShootType = 'mouse';
let mobileControlLayout = 'joystick';
let mobileShootType = 'button';

const keys = {
    'w': false, 'a': false, 's': false, 'd': false,
    ' ': false,
    'arrowup': false, 'arrowleft': false, 'arrowdown': false, 'arrowright': false
};

let bullets = [];
let remoteBullets = [];

let lastMapUpdateTime = Date.now();
let mapUpdateTimer = MAP_UPDATE_INTERVAL;
let mapUpdateInterval;