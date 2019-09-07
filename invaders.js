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

function handlePreload() {
    // preload the sky
    this.load.image('images/starfield', 'images/starfield.png')
}

function handleCreate() {
    starfield = this.add.tileSprite(0, 0, 2048, 2048, 'images/starfield');
    starfield.setScale(1);
}

function handleUpdate() {
    starfield.tilePositionY += 2;
}
