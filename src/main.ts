import { Game } from "./app/game";

window.addEventListener('load', function(){
    const canvas = document.getElementById('render') as HTMLCanvasElement;
    var lastTime = Date.now();
    var updates = 0;
    var timer = 0;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const game = new Game(canvas);
    game.start();
    gameLoop();

    window.addEventListener('resize', function (){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        game.width = canvas.width;
        game.height = canvas.height;
        game.drawCtx.updateScale(game.drawCtx.scale);
        game.drawCtx.updateTransform(game.drawCtx.transformX, game.drawCtx.transformY);
        game.level.needsRedraw = true;
    });

    function gameLoop(): void {
        if (!game.running) return;

        var thisTime = Date.now();
        var delta = thisTime - lastTime;
        timer += delta;
        updates++;

        game.update(delta);
        game.render();

        lastTime = thisTime;
        if (timer > 1000) {
            document.title = `Darkest DND | ${updates} fps`;
            timer = 0;
            updates = 0;
        }

        requestAnimationFrame(gameLoop);
    }
});