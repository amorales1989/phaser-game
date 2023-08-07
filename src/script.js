let config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

let score = 0;
let scoreText;
let gameOver = false;

let game = new Phaser.Game(config);

let platforms;
let player;
let cursors;
let stars;
let bombs;
let restartButton;

// Botones en pantalla
let leftButton;
let rightButton;
let jumpButton;

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function preload() {
  this.load.image("sky", "assets/sky.png");
  this.load.image("ground", "assets/platform.png");
  this.load.image("star", "assets/star.png");
  this.load.image("bomb", "assets/bomb.png");
  this.load.spritesheet("dude", "assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48,
  });

  let url =
    "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js";
  this.load.plugin("rexvirtualjoystickplugin", url, true);
}

function create() {
  // Agregar la imagen y escalarla para ocupar el 100% de la pantalla
  const image = this.add.image(
    window.innerWidth / 2,
    window.innerHeight / 2,
    "sky"
  );
  image.displayWidth = window.innerWidth;
  image.displayHeight = window.innerHeight;

  // Ajustar el tamaño del juego a las dimensiones de la ventana del navegador
  this.scale.resize(window.innerWidth, window.innerHeight);
  platforms = this.physics.add.staticGroup();

  platforms.create(400, 600, "ground").setScale(5).refreshBody();

  platforms.create(50, 250, "ground");
  platforms.create(600, 400, "ground");
  platforms.create(750, 220, "ground");
  platforms.create(1100, 100, "ground");

  player = this.physics.add.sprite(100, 450, "dude");

  player.setCollideWorldBounds(true);
  player.setBounce(0.2);

  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  this.physics.add.collider(player, platforms);

  cursors = this.input.keyboard.createCursorKeys();

  this.joyStick = this.plugins.get("rexvirtualjoystickplugin").add(this, {
    x: 80,
    y: 750,
    radius: 100,
    base: this.add.circle(0, 0, 50, 0x888888, 0.3),
    thumb: this.add.circle(0, 0, 25, 0xcccccc, 0.3),
  });
  this.joystickCursors = this.joyStick.createCursorKeys();

  this.cursors = this.input.keyboard.createCursorKeys();

  if (isMobileDevice()) {
    stars = this.physics.add.group({
      key: "star",
      repeat: 6,
      setXY: { x: 10, y: 0, stepX: 65 }, // Ajustar el stepX
    });
  } else {
    stars = this.physics.add.group({
      key: "star",
      repeat: 19,
      setXY: { x: 10, y: 0, stepX: 70 }, // Ajustar el stepX
    });
  }

  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  this.physics.add.collider(stars, platforms);

  this.physics.add.overlap(player, stars, collectStar, null, this);

  // Texto del puntaje con estilo limpio (sin fondo)
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    fontFamily: "Arial",
    color: "#000",
  });

  bombs = this.physics.add.group();

  this.physics.add.collider(bombs, platforms);

  this.physics.add.collider(player, bombs, hitBomb, null, this);

  // Mostrar los botones solo en dispositivos móviles
  if (this.sys.game.device.input.touch) {
    platforms.create(400, 600, "ground").setScale(5).refreshBody();

    // platforms.create(30, 250, "ground").setScale(0, 7).refreshBody();

    // Botón de salto
    const jumpButton = this.add.circle(370, 750, 30, 0x3498db, 0.3);
    jumpButton.setStrokeStyle(2, 0x888888);

    jumpButton.setOrigin(0.5);
    jumpButton.setInteractive();

    jumpButton.on("pointerdown", function () {
      if (player.body.touching.down) {
        player.setVelocityY(-330);
      }
    });
  } else {
    // Ocultar el joystick si no es un dispositivo móvil
    this.joyStick.visible = false;
  }
}

function update() {
  if (gameOver) {
    return;
  }

  if (cursors.left.isDown || this.joystickCursors.left.isDown) {
    player.setVelocityX(-160);
    player.anims.play("left", true);
  } else if (cursors.right.isDown || this.joystickCursors.right.isDown) {
    player.setVelocityX(160);
    player.anims.play("right", true);
  } else {
    player.setVelocityX(0);
    player.anims.play("turn", true);
  }
  if (cursors.space.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }
}

function collectStar(player, star) {
  star.disableBody(true, true);

  score += Math.floor(Math.random() * 10) + 1;
  scoreText.setText("Score: " + score);

  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    let x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    let bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }
}

function hitBomb(player, bomb) {
  this.physics.pause();

  player.setTint(0xff0000);
  player.anims.play("turn");

  gameOver = true;

  // Mostrar el botón "Reiniciar" con estilo de botón
  let buttonWidth = 200; // Ancho del botón
  let buttonHeight = 50; // Alto del botón

  let centerX = window.innerWidth / 2;
  let centerY = window.innerHeight / 2;

  let restartButton = this.add.text(centerX, centerY, "Reiniciar", {
    fontSize: "24px",
    fontFamily: "Arial",
    color: "#fff",
    backgroundColor: "blue",
    padding: { left: 10, right: 10, top: 5, bottom: 5 },
    borderRadius: 20,
  });

  // Ajustar el botón al centro de la pantalla
  restartButton.setOrigin(0.5);
  restartButton.setVisible(true); // Mostrar el botón de reinicio
  restartButton.setOrigin(0.5);
  restartButton.setInteractive();
  restartButton.on("pointerdown", restartGame);
}
  
  function restartGame() {
    window.location.reload();
  }
  