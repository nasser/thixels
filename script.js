// based on https://gist.github.com/strangerintheq/27b8fc4e53432d8b9284364713ce8608

const vertexShader = `#version 300 es

precision highp float;

void main(void) {
    float x = float((gl_VertexID & 1) << 2);
    float y = float((gl_VertexID & 2) << 1);
    gl_Position = vec4(x - 1.0, y - 1.0, 0, 1);
}
`

const fragmentShader = `#version 300 es

precision highp float;
precision highp int;
precision highp usampler2D;

uniform usampler2D framebuffer;
uniform sampler2D palette;
uniform vec2 screen;
uniform float paletteSize;

out vec4 color;

void main(void) {
    float smallest_side = min(screen.y, screen.x);
    float biggest_side = max(screen.y, screen.x);
    float difference = biggest_side - smallest_side;
    vec2 padding = vec2(0.0);
    if(screen.x <= screen.y)
        padding.y = difference / 2.;
    else
        padding.x = difference / 2.;
    float ix = (gl_FragCoord.x - padding.x) / smallest_side;
    float iy = (gl_FragCoord.y - padding.y) / smallest_side;
    if(ix < 0. || ix >= 1. || iy < 0. || iy >= 1.) {
        color = texture(palette, vec2(0));
    } else {
        uint idx = texture(framebuffer, vec2(ix, iy)).r;
        color = texture(palette, vec2(idx, 0) / paletteSize);
    }
}
`

// dom setup
let canvas = document.body.appendChild(document.createElement('canvas'));

let textarea = document.createElement('textarea')
document.body.appendChild(textarea)
var editor = CodeMirror.fromTextArea(textarea, {
    autofocus: true,
    scrollbarStyle: null,
    cursorBlinkRate: 0,
    lineNumbers: false,
    matchBrackets:true,
    theme: "liquibyte",
    extraKeys: {
        Tab: function(cm) {
            if (cm.somethingSelected()) {
                cm.indentSelection("add");
              } else {
                cm.replaceSelection(cm.getOption("indentWithTabs")? "\t":
                  Array(cm.getOption("indentUnit") + 1).join(" "), "end", "+input");
              }
        }
    }
  });

var sketchName = "#scratch#"

const initialSketch =`;; T H I X E L S
;; from ramsey nasser aka DOOM OF THE ROCK
;; (https://nas.sr/, https://merveilles.town/@nasser)
;; new year's resolution: documentation
;; ctrl+enter after change to update

(pal (lospec :blk-neo))

(defn draw [t]
  (cls)
  (let [k 20]
    (forl [i 0 k]
      (forl [j 0 k]
        (let [i (+ (* 16 t) i)
              cc (mod (+ i j) (/ $c 1))
              [x y z] (polar 10 (/ i k) (/ j k))
              [x y z] (rotate3 x y z (* 0.1 t) (* 0.5 t) 0)]
          (plot (+ (* 3 (sin t)) x)
                (+ 1 y)
                (+ 5 (* 1 (sin t)) (* 0.5 z)) cc)))))
  (forl [i 0 10]
    (let [x (* 10 (sin (+ (* i 0.01) t)))
          c (+ (* 200 t) i)]
      (text "HAPPY NEW YEAR" x (+ 50 i) c)
      (text "  ** 2021 **  " x (+ 50 (- i 12)) c))))



(defn td [x y z]
  (let [d 10
        dz (/ d z)
        u (+ 64 (* x dz))
        v (+ 64 (* y dz))]
    [u v]))

(defn plot [x y z c]
  (let [[u v] (td x y z)]
    (pset u v c)))

(defn rotate3 [x y z m n p]
  (let 
    [a (* (cos n) (cos p))
     b (* (* -1 (cos n)) (sin p))
     c (sin n)
     d (+ (* (sin m) (sin n) (cos p)) (* (cos m) (sin p)))
     e (- (* (cos m) (cos p)) (* (sin m) (sin n) (sin p)))
     f (* (sin m) (* -1 (cos n)))
     g (- (* (sin m) (sin p)) (* (cos m) (sin n) (cos p)))
     h (+ (* (cos m) (sin n) (sin p)) (* (sin m) (cos p)))
     i (* (cos m) (cos n))
     x1 (+ (* a x) (* b y) (* c z))
     y1 (+ (* d x) (* e y) (* f z))
     z1 (+ (* g x) (* h y) (* i z))]
    [x1 y1 z1]))

(defn polar [r t a]
  (let [t (mod t 0.5)
        a (mod a 1)
        x (* r (sin t) (cos a))
        y (* r (sin t) (sin a))
        z (* r (cos t))]
    [x y z]))
`

const sketchKey = n => `thixels:sketch:${n}`

function evalEditor() {
    let source = editor.getDoc().getValue()
    let compiled = wisp.compile(source, { 'source-uri':'', 'no-map':true })
    if(compiled.code) {
        console.log(compiled.code);
        eval(compiled.code)
    } else {
        console.error(compiled)
    }
}

// editor.on('change', e => {
//     // disabled for nye
//     // evalEditor()
//     // let source = editor.getDoc().getValue()
//     // localStorage.setItem(sketchKey(sketchName), source)
// })

window.onload = function() {
    // disabling localstorage stuff for now
    // let source = localStorage.getItem(sketchKey(sketchName)) || initialSketch
    let source = initialSketch
    editor.setValue(source)
    evalEditor()
}

// gl setup
let gl = canvas.getContext('webgl2');
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

// shader setup
let program = createProgram(vertexShader, fragmentShader);
gl.useProgram(program);

window.onresize = function () {
    gl.viewport(0, 0, canvas.width = window.innerWidth, canvas.height = window.innerHeight);
    gl.uniform2f(gl.getUniformLocation(program, "screen"), canvas.width, canvas.height);
}
window.onresize()

var framebuffer = new Framebuffer(128, 128)
var palette = new Palette("https://lospec.com/palette-list/pico-8.json")
api(framebuffer, palette)

function draw(t, f) {
    
}

let f = 0
function render(now = 0) {
    now *= 0.0001
    requestAnimationFrame(render)
    draw(now, f++)
    framebuffer.update()
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 3);
}

function Framebuffer(width, height) {
    this.unit = 0
    this.update = function () {
        gl.activeTexture(gl.TEXTURE0 + this.unit);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.width, this.height, gl.RED_INTEGER, gl.UNSIGNED_BYTE, this.data)
    }

    this.resize = function(width, height) {
        this.width = width
        this.height = height
        this.data = new Uint8Array(width * height)    
        makeTexture(width, height, this.unit, gl.R8UI, gl.RED_INTEGER, gl.UNSIGNED_BYTE, this.data)
        gl.uniform1i(gl.getUniformLocation(program, "framebuffer"), this.unit)    
        this.update()
    }

    this.resize(width, height)
}

function Palette(init) {
    this.unit = 1
    this.update = function () {
        gl.activeTexture(gl.TEXTURE0 + this.unit);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.size, 1, gl.RGB, gl.UNSIGNED_BYTE, this.data)
    }
    this.resize = function (newSize) {
        this.size = newSize
        this.data = new Uint8Array(this.size * 3)
        makeTexture(this.size, 1, this.unit, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.data)
        gl.uniform1i(gl.getUniformLocation(program, "palette"), this.unit)
        gl.uniform1f(gl.getUniformLocation(program, "paletteSize"), this.size)
    }
    this.populateFromData = function (data) {
        console.log(`loaded palette ${data.name} by ${data.author}`);
        this.resize(data.colors.length)
        let i = 0;
        for (const color of data.colors) {
            let r = parseInt(color.substr(0, 2), 16)
            let g = parseInt(color.substr(2, 2), 16)
            let b = parseInt(color.substr(4, 2), 16)
            this.data[i + 0] = r
            this.data[i + 1] = g
            this.data[i + 2] = b
            i += 3
        }
        this.update()
    }
    this.populateFromUrl = function (url) {
        const key = `thixels:palette:${url}`
        if (localStorage.getItem(key))
            return this.populateFromData(JSON.parse(localStorage.getItem(key)))
        fetch(`https://cors-anywhere.herokuapp.com/${url}`)
            .then(response => response.json())
            .then(data => {
                localStorage.setItem(key, JSON.stringify(data))
                this.populateFromData(data)
            });
    }
    this.source = init
    if (typeof init == 'number')
        this.resize(size)
    else if (typeof init == 'string')
        this.populateFromUrl(init)
}

function makeTexture(width, height, unit, internalFormat, format, type, data) {
    let texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0,
        format, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}

function createShader(source, type) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(shader));
    return shader;
}

function createProgram(vertex, fragment) {
    let program = gl.createProgram();
    gl.attachShader(program, createShader(vertex, gl.VERTEX_SHADER));
    gl.attachShader(program, createShader(fragment, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);

    return program;
}

render();