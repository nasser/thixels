function api(fb, _pal) {

    //// math
    window.lerp = function (x, y, a) { return x * (1 - a) + y * a };
    window.ilerp = function (x, y, a) { return (a - x) / (y - x) };
    window.clamp = function (a, min = 0, max = 1) { return Math.min(max, Math.max(min, a)) };
    window.remap = function (x1, y1, x2, y2, a) { return window.lerp(x2, y2, window.ilerp(x1, y1, a)) };
    window.sgn = Math.sign;
    window.srnd = function(v) { Math.seedrandom(v) }
    window.rnd = function(min=0, max=1) { 
        const _min = Math.min(min, max)
        const _max = Math.max(min, max)
        return _min + Math.random() * (_max - _min)
    }
    window.ceil = Math.ceil;
    window.flr = Math.floor;
    window.abs = Math.abs;
    window.sqrt = Math.sqrt;
    window.atan2 = Math.atan2;
    window.cos = function (x) { return Math.cos(window.remap(0, 1, 0, 2 * Math.PI, x)) };
    window.sin = function (x) { return Math.sin(window.remap(0, 1, 0, 2 * Math.PI, x)) };
    window.cls = function (c) {
        fb.data.fill(c)
    };

    window.pset = function (xx, yy, c) {
        let x = Math.trunc(xx);
        let y = Math.trunc(yy);
        if (x >= fb.width || y >= fb.height || x < 0 || y < 0)
            return;
        fb.data[(x % fb.width) + y * fb.width] = c % _pal.size;
    };
    window.pget = function (xx, yy) {
        let x = Math.trunc(xx);
        let y = Math.trunc(yy);
        if (x >= fb.width || y >= fb.height || x < 0 || y < 0)
            return 0;
        return fb.data[(x % fb.width) + y * fb.width];
    };

    // https://answers.unity.com/questions/380035/c-modulus-is-wrong-1.html
    window.mod = function (a, n) {
        return ((a % n) + n) % n;
    };

    // http://members.chello.at/easyfilter/bresenham.html
    // special thanks to @porglezomp and @prathyvsh
    window.circ = function (x0, y0, radius, c) {
        let x = Math.trunc(-radius);
        let y = 0;
        let err = Math.trunc(2 - 2 * radius);
        do {
            window.pset(x0 - x, y0 + y, c);
            window.pset(x0 - y, y0 - x, c);
            window.pset(x0 + x, y0 - y, c);
            window.pset(x0 + y, y0 + x, c);
            radius = err;
            if (radius <= y) err += ++y * 2 + 1;
            if (radius > x || err > y) err += ++x * 2 + 1;
        } while (x < 0);
    };

    // https://en.wikipedia.org/wiki/Midpoint_circle_algorithm
    window.fcirc = function (x0, y0, radius, c) {
        let x = Math.trunc(-radius);
        let y = 0;
        let err = Math.trunc(2 - 2 * radius);
        let i = 0;
        do {
            window.line(x0 - x, y0 + y, x0, y0 + y, c);
            window.line(x0 - y, y0 - x, x0, y0 - x, c);
            window.line(x0 + x, y0 - y, x0, y0 - y, c);
            window.line(x0 + y, y0 + x, x0, y0 + x, c);
            i++;
            radius = err;
            if (radius <= y) err += ++y * 2 + 1;
            if (radius > x || err > y) err += ++x * 2 + 1;
        } while (x < 0);
    };

    // https://stackoverflow.com/questions/11678693/all-cases-covered-bresenhams-line-algorithm
    window.line = function (x0, y0, x1, y1, c) {
        if (y0 == y1) {
            if (x0 < x1) {
                if (x0 < 0) x0 = 0;
                if (x1 > fb.width) x1 = fb.width;
                while (x0 < x1) {
                    window.pset(x0, y0, c);
                    x0 += 1;
                }
            } else {
                if (x1 < 0) x1 = 0;
                if (x0 > fb.width) x0 = fb.width;
                while (x1 < x0) {
                    window.pset(x1, y0, c);
                    x1 += 1;
                }

                return;
            }
        }

        if (x0 == x1) {
            if (y0 < y1) {
                if (y0 < 0) y0 = 0;
                if (y1 > fb.width) y1 = fb.width;
                while (y0 < y1) {
                    window.pset(x0, y0, c);
                    y0 += 1;
                }
            } else {
                if (y1 < 0) y1 = 0;
                if (y0 > fb.width) y0 = fb.width;
                while (y1 < y0) {
                    window.pset(x0, y1, c);
                    y1 += 1;
                }

                return;
            }
        }

        let w = x1 - x0;
        let h = y1 - y0;
        let dx1 = 0, dy1 = 0, dx2 = 0, dy2 = 0;
        if (w < 0) dx1 = -1;
        else if (w > 0) dx1 = 1;
        if (h < 0) dy1 = -1;
        else if (h > 0) dy1 = 1;
        if (w < 0) dx2 = -1;
        else if (w > 0) dx2 = 1;
        let longest = Math.abs(w);
        let shortest = Math.abs(h);
        if (!(longest > shortest)) {
            longest = Math.abs(h);
            shortest = Math.abs(w);
            if (h < 0) dy2 = -1;
            else if (h > 0) dy2 = 1;
            dx2 = 0;
        }

        let numerator = longest / 2.0;
        for (let i = 0; i <= longest; i++) {
            window.pset(x0, y0, c);
            numerator += shortest;
            if (!(numerator < longest)) {
                numerator -= longest;
                x0 += dx1;
                y0 += dy1;
            }
            else {
                x0 += dx2;
                y0 += dy2;
            }
        }
    };

    window.rect = function (xx1, yy1, xx2, yy2, c) {
        let x1 = Math.min(xx1, xx2);
        let y1 = Math.min(yy1, yy2);
        let x2 = Math.max(xx1, xx2);
        let y2 = Math.max(yy1, yy2);

        for (let y = y1; y <= y2; y += 1) {
            window.pset(x1, y, c);
            window.pset(x2, y, c);
        }

        for (let x = x1; x <= x2; x += 1) {
            window.pset(x, y1, c);
            window.pset(x, y2, c);
        }
    };

    window.frect = function (xx1, yy1, xx2, yy2, c) {
        let x1 = Math.min(xx1, xx2);
        let y1 = Math.min(yy1, yy2);
        let x2 = Math.max(xx1, xx2);
        let y2 = Math.max(yy1, yy2);

        for (let y = y1; y <= y2; y += 1) {
            for (let x = x1; x <= x2; x += 1) {
                window.pset(x, y, c);
            }
        }
    };

    window.rrow = function (row, distance) {
        if (distance > 0) {
            for (let i = 0; i < fb.width; i++) {
                window.pset(i, row, window.pget(window.mod(Math.trunc(i + distance), Math.trunc(fb.width)), row));
            }
        }
        else {
            for (let i = Math.trunc(fb.width); i >= 0; i--) {
                window.pset(i, row, window.pget(window.mod(Math.trunc(i + distance), Math.trunc(fb.width)), row));
            }
        }
    };

    let textCanvas = document.createElement('canvas')
    let textContext = textCanvas.getContext('2d')
    textContext.font = "16px FSEX301"
    textContext.fillStyle = 'black'
    let _cachedString = null
    let _cachedPixels = null

    window.text = function (s, x, y, c) {
        if(_cachedString !== s) {
            let measure = textContext.measureText(s)
            let width = measure.width
            let height = measure.fontBoundingBoxAscent + measure.fontBoundingBoxDescent
            textCanvas.width = width
            textCanvas.height = height
            textContext.font = "16px FSEX301"
            textContext.fillStyle = 'black'
            textContext.fillText(s, 0, measure.fontBoundingBoxAscent)
            _cachedPixels = textContext.getImageData(0, 0, textCanvas.width, textCanvas.height)
        }
        _blit(_cachedPixels, x, y, c)
    }

    window._blit = function (pixels, x, y, c) {
        for (let i = 0; i < pixels.data.length; i+=4) {
            if(pixels.data[i+3] == 0) continue;
            const ix = (i/4) % pixels.width
            const iy = Math.floor((i/4) / pixels.width)
            pset(x + ix, y - iy + pixels.height, c)
        } 
    }

    // palettes
    window.pal = function (source) {
        if(_pal.source === source) return;
        if(typeof source == 'string') {
            _pal = new Palette(source)
        }
    }

    window.lospec = paletteName =>
        `https://lospec.com/palette-list/${paletteName}.json`       
}