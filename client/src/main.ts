import { Game } from "./app/game";
import { io } from 'socket.io-client';

window.addEventListener('load', function () {
    const socket = io(`${window.location.hostname}:3000`);
    const gameCanvas = document.getElementById('render') as HTMLCanvasElement;
    const foregroundCanvas = document.getElementById('foreground') as HTMLCanvasElement;
    var lastTime = Date.now();
    var updates = 0;
    var timer = 0;
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    foregroundCanvas.width = window.innerWidth;
    foregroundCanvas.height = window.innerHeight;

    const game = new Game(gameCanvas, foregroundCanvas, socket);
    game.start();
    gameLoop();

    window.addEventListener('resize', function () {
        gameCanvas.width = window.innerWidth;
        gameCanvas.height = window.innerHeight;
        foregroundCanvas.width = window.innerWidth;
        foregroundCanvas.height = window.innerHeight;
        game.width = gameCanvas.width;
        game.height = gameCanvas.height;
        game.drawCtx.updateScale(game.drawCtx.scale);
        game.drawCtx.updateTransform(game.drawCtx.transformX, game.drawCtx.transformY);
        game.level.needsRedraw = true;
        game.level.foregroundNeedsRedraw = true;
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