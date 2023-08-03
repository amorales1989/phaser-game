let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
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
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', {
      frameWidth: 32,
      frameHeight: 48,
    });
  }
  
  function create() {
    this.add.image(400, 300, 'sky');
  
    platforms = this.physics.add.staticGroup();
  
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
  
    platforms.create(50, 250, 'ground');
    platforms.create(600, 400, 'ground');
    platforms.create(750, 220, 'ground');
  
    player = this.physics.add.sprite(100, 450, 'dude');
  
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);
  
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
  
    this.anims.create({
      key: 'turn',
      frames: [{ key: 'dude', frame: 4 }],
      frameRate: 20,
    });
  
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
  
    this.physics.add.collider(player, platforms);
  
    cursors = this.input.keyboard.createCursorKeys();
  
    stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });
  
    stars.children.iterate(function (child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
  
    this.physics.add.collider(stars, platforms);
  
    this.physics.add.overlap(player, stars, collectStar, null, this);
  
    // Texto del puntaje con estilo limpio (sin fondo)
    scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#000',
    });
  
    bombs = this.physics.add.group();
  
    this.physics.add.collider(bombs, platforms);
  
    this.physics.add.collider(player, bombs, hitBomb, null, this);
  
    // Mostrar los botones solo en dispositivos móviles
    if (isMobileDevice()) {
      // Botón izquierdo
      leftButton = this.add.text(50, 500, '←', {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#fff',
        backgroundColor: '#3498db',
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
        borderRadius: 10,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000',
          blur: 2,
          fill: true,
        },
      }).setOrigin(0.5).setInteractive();
  
      // Botón derecho
      rightButton = this.add.text(150, 500, '→', {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#fff',
        backgroundColor: '#3498db',
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
        borderRadius: 10,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000',
          blur: 2,
          fill: true,
        },
      }).setOrigin(0.5).setInteractive();
  
      // Botón de salto
      jumpButton = this.add.text(700, 500, '↑', {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#fff',
        backgroundColor: '#3498db',
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
        borderRadius: 10,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000',
          blur: 2,
          fill: true,
        },
      }).setOrigin(0.5).setInteractive();
  
      leftButton.on('pointerdown', function () {
        player.setVelocityX(-160);
        player.anims.play('left', true);
      });
      leftButton.on('pointerup', function () {
        player.setVelocityX(0);
        player.anims.play('turn', true);
      });
  
      rightButton.on('pointerdown', function () {
        player.setVelocityX(160);
        player.anims.play('right', true);
      });
      rightButton.on('pointerup', function () {
        player.setVelocityX(0);
        player.anims.play('turn', true);
      });
  
      jumpButton.on('pointerdown', function () {
        if (player.body.touching.down) {
          player.setVelocityY(-330);
        }
      });
    }
  }
  
  function update() {
    if (gameOver) {
      return;
    }
  
    if (cursors.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play('left', true);
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
      player.anims.play('right', true);
    } else {
      player.setVelocityX(0);
      player.anims.play('turn', true);
    }
  
    if (cursors.space.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }
  
  function collectStar(player, star) {
    star.disableBody(true, true);
  
    score += 10;
    scoreText.setText('Score: ' + score);
  
    if (stars.countActive(true) === 0) {
      stars.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true);
      });
  
      let x = player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
  
      let bomb = bombs.create(x, 16, 'bomb');
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
  }
  
  function hitBomb(player, bomb) {
    this.physics.pause();
  
    player.setTint(0xff0000);
    player.anims.play('turn');
  
    gameOver = true;
  
   // Mostrar el botón "Reiniciar" con estilo de botón
  restartButton = this.add.text(400, 300, 'Reiniciar', {
    fontSize: '24px',
    fontFamily: 'Arial',
    color: '#fff',
    backgroundColor: '#3498db',
    padding: { left: 10, right: 10, top: 5, bottom: 5 },
    borderRadius: 10,
    shadow: {
      offsetX: 2,
      offsetY: 2,
      color: '#000',
      blur: 2,
      fill: true,
    },
  });
  restartButton.setOrigin(0.5);
  restartButton.setInteractive();
  restartButton.on('pointerdown', restartGame);
  restartButton.setVisible(true); // Mostrar el botón de reinicio
  }
  
  function restartGame() {
    window.location.reload();
  }
  