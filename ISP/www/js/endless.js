
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

// this is the game pretty much
var JIA = {

    // inital values
    WIDTH: 320, 
    HEIGHT:  480, 
    scale:  1,
    // the position of the canvas
    offset: {top: 0, left: 0},
    // store everything
    entities: [],
    // the amount of game ticks till bubble spawns (default will be changed for different levels)
    nextBubble: 100,
    // for tracking player's progress, only endless will it be displayed
    // but different levels will still use this
    score: {
        taps: 0,
        hit: 0,
        escaped: 0,
        accuracy: 0
    },
    RATIO:  null,
    currentWidth:  null,
    currentHeight:  null,
    canvas: null,
    ctx:  null,
    ua:  null,
    android: null,
    ios:  null,

    init: function() {
   
        // the proportion of width to height
        JIA.RATIO = JIA.WIDTH / JIA.HEIGHT;
        // these will change when the screen is resize
        JIA.currentWidth = JIA.WIDTH;
        JIA.currentHeight = JIA.HEIGHT;
        // this is our canvas element
        JIA.canvas = document.getElementsByTagName('canvas')[0];
        // prevent browser from defaulting size
        JIA.canvas.width = JIA.WIDTH;
        JIA.canvas.height = JIA.HEIGHT;
        JIA.ctx = JIA.canvas.getContext('2d');
        JIA.ua = navigator.userAgent.toLowerCase();
        JIA.android = JIA.ua.indexOf('android') > -1 ? true : false;
        JIA.ios = ( JIA.ua.indexOf('iphone') > -1 || JIA.ua.indexOf('ipad') > -1  ) ? true : false;

        // set up our wave effect
        JIA.wave = {
            x: -25, // x coord of first circle
            y: -40, // y coord of first circle
            r: 50, // circle radius
            time: 0, // for the sine wave
            offset: 0 // this will be the sine wave offset
        }; 
        // calculate how many circles we need to 
        // cover the screen width
        JIA.wave.total = Math.ceil(JIA.WIDTH / JIA.wave.r) + 1;

        // listen for clicks
        window.addEventListener('click', function(e) {
            e.preventDefault();
            JIA.Input.set(e);
        }, false);

        // listen for touches
        window.addEventListener('touchstart', function(e) {
            e.preventDefault();
            // the event object has an array
            // called touches, we just want
            // the first touch
            JIA.Input.set(e.touches[0]);
        }, false);
        window.addEventListener('touchmove', function(e) { // prevent random swipes and weird moving
            e.preventDefault();
        }, false);
        window.addEventListener('touchend', function(e) {
            // as above
            e.preventDefault();
        }, false);

        // we're ready to resize
        JIA.resize();

        JIA.loop();

    },


    resize: function() {
    
        JIA.currentHeight = window.innerHeight;
        // resize the width in proportion
        // to the new height
        JIA.currentWidth = JIA.currentHeight * JIA.RATIO;

        // this will create some extra space on the
        // page, allowing us to scroll pass
        // the address bar, and thus hide it.
        if (JIA.android || JIA.ios) {
            document.body.style.height = (window.innerHeight + 50) + 'px';
        }

        // set the new canvas style width & height
        // note: our canvas is still 320x480 but
        // we're essentially scaling it with CSS
        JIA.canvas.style.width = JIA.currentWidth + 'px';
        JIA.canvas.style.height = JIA.currentHeight + 'px';

        // the amount by which the css resized canvas
        // is different to the actual (480x320) size.
        JIA.scale = JIA.currentWidth / JIA.WIDTH;
        // position of canvas in relation to
        // the screen
        JIA.offset.top = JIA.canvas.offsetTop;
        JIA.offset.left = JIA.canvas.offsetLeft;

        // we use a timeout here as some mobile
        // browsers won't scroll if there is not
        // a small delay
        window.setTimeout(function() {
                window.scrollTo(0,1);
        }, 1);
    },

    // this is where all entities will be moved
    // and checked for collisions etc
    update: function() {
        var i,
            checkCollision = false; // we only need to check for a collision
                                // if the user tapped on this game tick
 

        // decrease our nextBubble counter
        JIA.nextBubble -= 1;
        // if the counter is less than zero
        if (JIA.nextBubble < 0) {
            // put a new instance of bubble into our entities array
            JIA.entities.push(new JIA.Bubble());
            // reset the counter with a random value
            JIA.nextBubble = ( Math.random() * 100 ) + 100;
        }

        // spawn a new instance of Touch
        // if the user has tapped the screen
        if (JIA.Input.tapped) {
            // keep track of taps; needed to 
            // calculate accuracy
            JIA.score.taps += 1;
            // add a new touch
            JIA.entities.push(new JIA.Touch(JIA.Input.x, JIA.Input.y));
            // set tapped back to false
            // to avoid spawning a new touch
            // in the next cycle
            JIA.Input.tapped = false;
            checkCollision = true;
        }

        // cycle through all entities and update as necessary
        for (i = 0; i < JIA.entities.length; i += 1) {
            JIA.entities[i].update();

            if (JIA.entities[i].type === 'bubble' && checkCollision) {
                hit = JIA.collides(JIA.entities[i], 
                                    {x: JIA.Input.x, y: JIA.Input.y, r: 7});
                if (hit) {
                    // spawn an exposion
                    for (var n = 0; n < 5; n +=1 ) {
                        JIA.entities.push(new JIA.Particle(
                            JIA.entities[i].x, 
                            JIA.entities[i].y, 
                            2, 
                            // random opacity to spice it up a bit
                            'rgba(255,255,255,'+Math.random()*1+')'
                        )); 
                    }
                    JIA.score.hit += 1;
                }

                JIA.entities[i].remove = hit;
            }

            // delete from array if remove property
            // flag is set to true
            if (JIA.entities[i].remove) {
                JIA.entities.splice(i, 1);
            }
        }

        // update wave offset
        // feel free to play with these values for
        // either slower or faster waves
        JIA.wave.time = new Date().getTime() * 0.002;
        JIA.wave.offset = Math.sin(JIA.wave.time * 0.8) * 5;

        // calculate accuracy
        JIA.score.accuracy = (JIA.score.hit / JIA.score.taps) * 100;
        JIA.score.accuracy = isNaN(JIA.score.accuracy) ?
            0 :
            ~~(JIA.score.accuracy); // a handy way to round floats

    },


    // this is where we draw all the entities
    render: function() {

        var i;


        JIA.Draw.rect(0, 0, JIA.WIDTH, JIA.HEIGHT, '#036');

        // display snazzy wave effect
        for (i = 0; i < JIA.wave.total; i++) {

            JIA.Draw.circle(
                        JIA.wave.x + JIA.wave.offset +  (i * JIA.wave.r), 
                        JIA.wave.y,
                        JIA.wave.r, 
                        '#fff'); 
        }

            // cycle through all entities and render to canvas
            for (i = 0; i < JIA.entities.length; i += 1) {
                JIA.entities[i].render();
        }

        // display scores
        JIA.Draw.text('Hit: ' + JIA.score.hit, 20, 30, 14, '#fff');
        JIA.Draw.text('Escaped: ' + JIA.score.escaped, 20, 50, 14, '#fff');
        JIA.Draw.text('Accuracy: ' + JIA.score.accuracy + '%', 20, 70, 14, '#fff');

    },


    // the actual loop
    // requests animation frame
    // then proceeds to update
    // and render
    loop: function() {

        requestAnimFrame( JIA.loop );

        JIA.update();
        JIA.render();
    }


};

// checks if two entties are touching
JIA.collides = function(a, b) {

        var distance_squared = ( ((a.x - b.x) * (a.x - b.x)) + 
                                ((a.y - b.y) * (a.y - b.y)));

        var radii_squared = (a.r + b.r) * (a.r + b.r);

        if (distance_squared < radii_squared) {
            return true;
        } else {
            return false;
        }
};


// abstracts various canvas operations into
// standalone functions
JIA.Draw = {

    clear: function() {
        JIA.ctx.clearRect(0, 0, JIA.WIDTH, JIA.HEIGHT);
    },


    rect: function(x, y, w, h, col) {
        JIA.ctx.fillStyle = col;
        JIA.ctx.fillRect(x, y, w, h);
    },

    circle: function(x, y, r, col) {
        JIA.ctx.fillStyle = col;
        JIA.ctx.beginPath();
        JIA.ctx.arc(x + 5, y + 5, r, 0,  Math.PI * 2, true);
        JIA.ctx.closePath();
        JIA.ctx.fill();
    },


    text: function(string, x, y, size, col) {
        JIA.ctx.font = 'bold '+size+'px Monospace';
        JIA.ctx.fillStyle = col;
        JIA.ctx.fillText(string, x, y);
    }

};



JIA.Input = {

    x: 0,
    y: 0,
    tapped :false,

    set: function(data) {
        this.x = (data.pageX - JIA.offset.left) / JIA.scale;
        this.y = (data.pageY - JIA.offset.top) / JIA.scale;
        this.tapped = true;

    }

};

JIA.Touch = function(x, y) {

    this.type = 'touch';    // we'll need this later
    this.x = x;             // the x coordinate
    this.y = y;             // the y coordinate
    this.r = 5;             // the radius
    this.opacity = 1;       // inital opacity. the dot will fade out
    this.fade = 0.05;       // amount by which to fade on each game tick
    // this.remove = false;    // flag for removing this entity. JIA.update
                            // will take care of this

    this.update = function() {
        // reduct the opacity accordingly
        this.opacity -= this.fade; 
        // if opacity if 0 or less, flag for removal
        this.remove = (this.opacity < 0) ? true : false;
    };

    this.render = function() {
        JIA.Draw.circle(this.x, this.y, this.r, 'rgba(255,0,0,'+this.opacity+')');
    };

};

JIA.Bubble = function() {

    this.type = 'bubble';
    this.r = (Math.random() * 20) + 10;
    this.speed = (Math.random() * 3) + 1;
 
    this.x = (Math.random() * (JIA.WIDTH) - this.r);
    this.y = JIA.HEIGHT + (Math.random() * 100) + 100;

    // the amount by which the bubble
    // will move from side to side
    this.waveSize = 5 + this.r;
    // we need to remember the original
    // x position for our sine wave calculation
    this.xConstant = this.x;

    this.remove = false;


    this.update = function() {

        // a sine wave is commonly a function of time
        var time = new Date().getTime() * 0.002;

        this.y -= this.speed;
        // the x coord to follow a sine wave
        this.x = this.waveSize * Math.sin(time) + this.xConstant;

        // if offscreen flag for removal
        if (this.y < -10) {
            JIA.score.escaped += 1; // update score
            this.remove = true;
        }

    };

    this.render = function() {

        JIA.Draw.circle(this.x, this.y, this.r, 'rgba(255,255,255,1)');
    };

};

JIA.Particle = function(x, y,r, col) {

    this.x = x;
    this.y = y;
    this.r = r;
    this.col = col;

    // determines whether particle will
    // travel to the right of left
    // 50% chance of either happening
    this.dir = (Mgath.random() * 2 > 1) ? 1 : -1;

    // random values so particles do not 
    this.vx = ~~(Math.random() * 4) * this.dir;
    this.vy = ~~(Math.random() * 7);

    this.remove = false;

    this.update = function() {

        // update coordinates
        this.x += this.vx;
        this.y += this.vy;

        // increase velocity so particle
        // accelerates off screen
        this.vx *= 0.99;
        this.vy *= 0.99;

        // adding this negative amount to the
        // y velocity exerts an upward pull on
        // the particle, as if drawn to the
        // surface
        this.vy -= 0.25;

        // offscreen
        if (this.y < 0) {
            this.remove = true;
        }

    };


    this.render = function() {
        JIA.Draw.circle(this.x, this.y, this.r, this.col);
    };

};

//$('#endlessButton').click(JIA.init);
window.addEventListener('resize', JIA.resize, false);
