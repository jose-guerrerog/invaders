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

    starfield = this.add.tileSprite(0, 0, 2048, 2048, 'starfield');
    starfield.setScale(1);

    player = this.physics.add.sprite(400, 500, 'ship');
    player.setOrigin(0.5, 0);
    player.setCollideWorldBounds(true);

    aliens = this.physics.add.group();
    createAliens()
    cursors = this.input.keyboard.createCursorKeys();
}

function handleUpdate() {
    starfield.tilePositionY += 2;

    console.log(cursors)
    if (cursors.left.isDown) {
        player.setVelocityX( -200 );
    }

    else if (cursors.right.isDown) {
        player.setVelocityX( 200 );
    }

    else {
        player.setVelocityX( 0 );
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