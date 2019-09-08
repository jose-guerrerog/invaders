// Phaser configuration
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade'
    },
    scene: {
        preload: handlePreload,
        create: handleCreate,
        update: handleUpdate
    }
}

// Jump-start Phaser with configuration
var game = new Phaser.Game( config );

// This is the background image
var background;

// This is the player
var player;

var cursors;

var aliens;

var bullets;

var enemyBullets;

var lastAlienBulletTime = 0;

var livingAliens = [];

var lastPlayerBulletTime = 0;

var explosions;

var score = 0;

var scorePrefix = 'SCORE: ';

var scoreText;

var playerLives;

var isGameOver = false;

var gameOverModal;

var gameOverText;

var Bullet = new Phaser.Class({
    Extends: Phaser.GameObjects.Image,

    initialize: function Bullet(scene, x, y, defaultKey) {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, defaultKey);

        this.isEnemyBullet = (defaultKey === 'enemyBullet');

        this.speed = 0.1;

        this.born = 0;

        this.direction = 0;

        this.xSpeed = 0;

        this.ySpeed = 0;

        if (this.isEnemyBullet) {
            this.setSize(9, 9, true);
        } else {
            this.setSize(6, 36, true);
        }
    },
    fire: function (shooter, target) {
        
        this.setPosition(shooter.x, shooter.y);

        this.direction = 90;
        this.xSpeed = 0;
        this.ySpeed = -this.speed;
        this.born = 0;

        if (this.isEnemyBullet) {
            var xDifference = target.x - this.x;
            var yDifference = target.y - this.y;
            this.direction = Math.atan( xDifference/yDifference );

            this.xSpeed = this.speed * Math.sin(this.direction);

            this.ySpeed = this.speed * Math.cos(this.direction);

            this.rotation = Phaser.Math.Angle.Between(
                shooter.x,
                shooter.y,
                target.x,
                target.y
            );
        }
    },
    update: function (time, delta) {
        this.x += this.xSpeed * delta;

        this.y += this.ySpeed * delta;

        this.born += delta;

        if (this.born > 5000) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
});

function handlePreload() {
    // preload the sky
    this.load.image('starfield', 'images/starfield.png')

    // preload the player
    this.load.image('ship', 'images/player.png')

    // preload the enemy
    this.load.spritesheet('invader', 'images/invader50x60x10.png', {
        frameWidth: 50,
        frameHeight: 60
    });

    // preload the player bullet
    this.load.image('bullet', 'images/bullet.png')

    // preload the enemy bullet
    this.load.image('enemyBullet', 'images/enemy-bullet.png')

    this.load.spritesheet('kaboom', 'images/explode.png', {
        frameWidth: 128,
        frameHeight: 128
    });
}

function handleCreate() {
    this.anims.create({
        key: 'hover',
        frames: this.anims.generateFrameNumbers('invader', {
            start: 0,
            end: 9
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('kaboom', {
            start: 0,
            end: 15
        }),
        frameRate: 16,
        repeat: 0,
        hideOnComplete: true
    });

    starfield = this.add.tileSprite(0, 0, 2048, 2048, 'starfield');
    starfield.setScale(1);

    scoreText = this.add.text(10, 15, scorePrefix + score);

    playerLives = this.add.group();
    this.add.text(
        this.sys.canvas.width - 185,
        15,
        `LIVES:`
    );
    createPlayerLives(this);

    player = this.physics.add.sprite(400, 500, 'ship');
    player.setOrigin(0.5, 0);
    player.setCollideWorldBounds(true);

    aliens = this.physics.add.group();
    createAliens();

    bullets = createBullets('bullet', this);
    enemyBullets = createBullets('enemyBullet', this);

    explosions = this.add.group({
        defaultKey: 'kaboom',
        maxSize: 35,
    });

    cursors = this.input.keyboard.createCursorKeys();

    firePlayerBullet(this);

    createGameOverModal(this);
}

function handleUpdate(time) {

    starfield.tilePositionY += isGameOver ? 0.5 : 2;

    if (cursors.left.isDown) {
        player.setVelocityX( -200 );
    }

    else if (cursors.right.isDown) {
        player.setVelocityX( 200 );
    }

    else {
        player.setVelocityX( 0 );
    }

    if (time > lastAlienBulletTime && !isGameOver) {
        fireEnemyBullet(player, time, this);
    }
}

function createAliens() {

    for (var y = 0; y < 3; y++ ) {
        for (var x = 0; x < 10; x++ ) {
            var alien = aliens.create( x*75, y*90, 'invader');
            alien.setOrigin(0.5, 0.5);
            alien.lastFired = 0;
            alien.play('hover')
        }
    }

    Phaser.Actions.IncX( aliens.getChildren(), 60)

    Phaser.Actions.IncY( aliens.getChildren(), 75)
}

function createBullets(imgaeName, sceneRef) {
    return sceneRef.physics.add.group({
        classType: Bullet,
        defaultKey: imgaeName,
        runChildUpdate: true
    });
}

function fireEnemyBullet(player, time, sceneRef) {
    var enemyBullet = enemyBullets.get().setActive(true).setVisible(true);

    livingAliens = aliens.getChildren().filter( alien => alien.active === true);

    if (enemyBullet && livingAliens.length > 0) {
        var randomAlienNumber = Phaser.Math.RND.integerInRange(
            0,
            livingAliens.length - 1
        );

        var randomAlien = livingAliens[randomAlienNumber];

        if (time - randomAlien.lastFired > 4000) {

            randomAlien.lastFired = time;
            enemyBullet.fire(randomAlien, player);
            sceneRef.physics.add.collider(player, enemyBullet, handlePlayerCollision);
            lastAlienBulletTime = time + 2000;
        }
    }
}

function firePlayerBullet(sceneRef) {
    sceneRef.input.keyboard.on( 'keydown_SPACE', () => {

        if (player.active === false) {
            return;
        }

        var playerBullet = bullets.get().setActive(true).setVisible(true);

        if (playerBullet && sceneRef.time.now - lastPlayerBulletTime > 1000) {
            playerBullet.fire(player);
            sceneRef.physics.add.collider(aliens, playerBullet, handleEnemyCollision);
            lastPlayerBulletTime = sceneRef.time.now;
        }
    }, sceneRef);
}

function handleCollision(target, bullet) {
    if (target.active === true && bullet.active === true ) {
        bullet.setActive(false).setVisible(false);
        var explosion = explosions.get()
        
        if (explosion) {
            explosion.setActive(true);
            explosion.setOrigin(0.5, 0.5);
            explosion.x = target.x;
            explosion.y = target.y;
            explosion.play('explode');
        }
    }
}

function handlePlayerCollision(player, bullet) {
    
    if (player.active === true && bullet.active === true) {
        handleCollision(player, bullet);

        var life = playerLives.getFirstAlive();
        if (life) {
            life.setActive(false).setVisible(false);
        }

        if (playerLives.countActive() < 1) {
            handleGameOver(false);
        }
    }
}

function handleEnemyCollision(bullet, alien) {
    if (bullet.active === true && alien.active === true) {
        handleCollision(alien, bullet);
        alien.setActive(false).setVisible(false);

        score += 20;
        scoreText.setText(scorePrefix + score);

        if (aliens.countActive() === 0) {
            score += 1000;
            scoreText.setText(scorePrefix + score);

            handleGameOver(true);
        }
    }
}

function createPlayerLives(sceneRef) {

    var x = sceneRef.sys.canvas.width - 105;

    for (var i = 0; i < 3; i++ ) {
        var lifeX = x + 40 * i;

        var life = playerLives.create(lifeX, 25, 'ship');

        life.setOrigin(0.5, 0.5);
        life.setScale(0.5);
        life.alpha = 0.4;
    }
}

function createGameOverModal(sceneRef) {
    gameOverModal = sceneRef.add.graphics();
    gameOverModal.fillStyle(0x303030, 0.8);
    gameOverModal.fillRect(
        0,
        0,
        sceneRef.sys.canvas.width,
        sceneRef.sys.canvas.height
    );
    gameOverModal.visible = false;

    gameOverText = sceneRef.add.text(
        sceneRef.sys.canvas.width / 2,
        sceneRef.sys.canvas.height / 2,
        ' ',
        {
            align: 'center'
        }
    );
    gameOverText.setOrigin(0.5, 0.5);
    gameOverText.visible = false;

    sceneRef.input.on('pointerdown', (pointer) => {
        if (isGameOver) {
            bullets.clear(true, true);
            enemyBullets.clear(true, true);
            explosions.clear(true, true);
            aliens.clear(true, true);
            playerLives.clear(true, true);
            createAliens();
            createPlayerLives(sceneRef);
            player.setActive(true).setVisible(true);
            gameOverText.visible = false;
            gameOverModal.visible = false;
            isGameOver = false;
        }
    }, sceneRef);
}

function handleGameOver(didPlayerWin) {
    isGameOver = true;

    var removeDisableItem = function(item) {
        item.setActive(false).setVisible(false);
    };

    Phaser.Utils.Array.Each(bullets.getChildren(), removeDisableItem);
    Phaser.Utils.Array.Each(enemyBullets.getChildren(), removeDisableItem);
    Phaser.Utils.Array.Each(aliens.getChildren(), removeDisableItem);

    player.setActive(false).setVisible(false);

    var displayText = (didPlayerWin)
        ? 'YOU WON! \n\n Click to restart.'
        : 'GAME OVER \n\n Click to restart.';
        
    gameOverText.setText(displayText);

    gameOverModal.visible = true;
    gameOverText.visible = true;
}