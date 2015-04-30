var POP = {

    WIDTH: 320,
    HEIGHT: 480,

    RATIO: null,
    currentWidth: null,
    canvas: null,
    ctx: null,

    init: function() {

        POP.RATIO = POP.WIDTH / POP.HEIGHT;
        POP.currentWidth = POP.WIDTH;
        POP.currentHeight = POP.HEIGHT;
        POP.canvas = document.getElementsByTagName('canvas')[0];

        POP.canvas.width = POP.WIDTH;
        POP.canvas.height = POP.HEIGHT;

        POP.ctx = POP.canvas.getContext("2d");

        POP.resize();
        POP.Draw.clear();
        POP.Draw.rect(120, 120, 150, 150, 'green');
        POP.Draw.circle(100, 100, 50, 'rgba(255,0,0,0.5)');
        POP.Draw.text('Hello World', 100, 100, 10, '#000');

        window.addEventListener("click" , function(e){
            e.preventDefault();
            POP.Input.sset(e);
        }, false);

        window.addEventListener('touchstart', function(e){
            e.preventDefault();
            POP.Input.set(e.touches[0]);
        }, false);
        window.addEventListener('touchmove', function(e){
            e.preventDefault();
        }, false);

        window.addEventListener("touchend", function(e){
            e.preventDefault();
        }, false);

    },

    resize: function() {
        POP.currentHeight = window.innerHeight;
        POP.currentWidth = POP.currentHeight * POP.RATIO;
        if (POP.android || POP.ios) {
            document.body.style.height = (window.innerHeight + 50) + 'px';
        }
        POP.canvas.style.width = POP.currentWidth + 'px';
        POP.canvas.style.height = POP.currentHeight + 'px';

        window.setTimeout(function() {
            window.scrollTo(0, 1);
        }, 1);
    }

};

window.addEventListener('load', POP.init, false);
window.addEventListener('resize', POP.resize, false);

POP.Draw = {

    clear: function() {
        POP.ctx.clearRect(0, 0, POP.WIDTH, POP.HEIGHT);
    },

    rect: function(x, y, w, h, col) {
        POP.ctx.fillStyle = col;
        POP.ctx.fillRect(x, y, w, h);
    },

    circle: function(x, y, r, col) {
        POP.ctx.fillStyle = col;
        POP.ctx.beginPath();
        POP.ctx.arc(x + 5, y + 5, r, 0, Math.PI * 2, true);
        POP.ctx.closePath();
        POP.ctx.fill();
    },

    text: function(string, x, y, size, col) {
        POP.ctx.font = "bold" + size + "px Monospace";
        POP.ctx.fillStyle = col;
        POP.ctx.fillText(string, x, y);
    }
};
