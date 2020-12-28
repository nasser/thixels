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
    lineNumbers: false,
    theme: "liquibyte"
  });

editor.on('change', e => {
    let compiled = wisp.compile(editor.getDoc().getValue())
    if(compiled.code) {
        console.log(compiled.code);
        draw = new Function(['t', 'f'], compiled.code)
    } else {
        console.error(compiled)
    }
})

window.onload = function() {
    editor.setValue(`;; T H I X E L S
;; no documentation for now :(
;; from https://twitter.com/2DArray/status/1335788983838765059

(cls)

(cyc 64 nil (text "T*H*I*X*E*L*S" 10 10 (cyc 8 10 12)))

(let [b t
        l (+ (/ (cos (/ b 2)) 2) 0.5)]
    (loop [yy -1
            w 0.618]
    (let [y yy
            r (sqrt (- 1 (* y y)))
            x (* r (cos w))
            z (* r (sin w))
            i (clamp (* x 2) -1 1)
            j (clamp (* y 2) -1 1)
            k (clamp (* z 2) -1 1)
            x (+ x (* l (- i x)))
            y (+ y (* l (- j y)))
            z (+ z (* l (- k z)))
            c (cos b)
            s (sin b)
            x (+ (* x s) (* z c))
            z (- (* x c) (* z s))
            u (+ 64 (* x 30))
            v (+ 64 (+ (* y 30) (* z 8)))]
        (pset u v (+ x (/ z 2) 6))
        (when (< yy 1)
        (recur (+ yy 0.002)
                (+ w 0.618))))))
    
`)
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
    this.width = width
    this.height = height
    this.data = new Uint8Array(width * height)
    this.unit = 0
    this.update = function () {
        gl.activeTexture(gl.TEXTURE0 + this.unit);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.width, this.height, gl.RED_INTEGER, gl.UNSIGNED_BYTE, this.data)
    }

    makeTexture(width, height, this.unit, gl.R8UI, gl.RED_INTEGER, gl.UNSIGNED_BYTE, this.data)
    gl.uniform1i(gl.getUniformLocation(program, "framebuffer"), this.unit)

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
        const key = `thixels:palette${url}`
        if (localStorage.getItem(key))
            return this.populateFromData(JSON.parse(localStorage.getItem(key)))
        fetch(`https://cors-anywhere.herokuapp.com/${url}`)
            .then(response => response.json())
            .then(data => {
                localStorage.setItem(key, JSON.stringify(data))
                this.populateFromData(data)
            });
    }
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