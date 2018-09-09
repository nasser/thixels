(ns user
  (:refer-clojure :exclude [time])
  (:import [Pico Parameter Demo]))

;; todo
; [ ] name
; [ ] noise
; [ ] 3d shit
; [ ] lightning
; [ ] cities
; [ ] set palette (from code, from image?)
; [ ] fill pattern
; [ ] coros
; [ ] stress test
; [ ] clip (draw state)
; [ ] get pixel color (pget,pset)
; [ ] color (drawing state)
; [ ] camera x y (drawing state)
; [ ] put core functions in own ns
; [x] interpolators
; [x] atom vs sublime live code experience
; [x] glitch filters
; [x] star field
; [x] arabic input
; [x] text direction/script selection
; [x] atom: select paragraph
; [x] get out of .....
; [x] negative rolls
; [x] chapters (birth, life, death)
; [x] text
; [x] rnd
; [x] srnd
; [x] time, frame
; [x] clear to color
; [x] catch clojure exceptions in draw
; [x] time macros (e.g. every, for flashing/strobe)
; [x] rect, frect

(def pi Math/PI)

(defn sin [x] (System.Math/Sin x))
(defn cos [x] (System.Math/Cos x))
(defn cls [] (Pico.Demo/ClearScreen))
(defn abs [x] (System.Math/Abs x))

(defn text
  ([str x y c] (Pico.Demo/Text str x y c))
  ([str x y c dir scr] (Pico.Demo/Text str x y c dir scr)))


(defn rnd
  ([] (Pico.Demo/Random))
  ([max] (* (rnd) max))
  ([min max] (+ min (rnd (- max min)))))

(defn srand
  ([] (srand 0))
  ([x] (Pico.Demo/SeedRandom x)))

(defn line [x1 y1 x2 y2 c] (Pico.Demo/Line x1 y1 x2 y2 c))
(defn rect [x1 y1 x2 y2 c] (Pico.Demo/Rectangle x1 y1 x2 y2 c))
(defn frect [x1 y1 x2 y2 c] (Pico.Demo/FilledRectangle x1 y1 x2 y2 c))
(defn point [x y c] (Pico.Demo/Set x y c))
(defn circ [x y r c] (Pico.Demo/Circle x y r c))
(defn fcirc [x y r c] (Pico.Demo/FilledCircle x y r c))
(defn lerp [a b t] (+ (* a (- 1 t)) (* b t)))

(defn time [] (Pico.Demo/Time))
(defn frame [] (Pico.Demo/Frame))

(defn rec
  ([] (Pico.Demo/Record))
  ([m] (Pico.Demo/Record m)))

(defn bg [c] (frect 0 0 128 128 c))

(defmacro when-frame [m & body]
`(when (= 0 (mod (frame) ~m))
   ~@body))

(defmacro if-frame [m then else]
`(if (= 0 (mod (frame) ~m))
   ~then
   ~else))

(defmacro forl [[idx from to] & body]
`(loop [~idx ~from]
   ~@body
   (when (< ~idx ~to)
     (recur (inc ~idx)))))

(defn draw-palette [x y]
(forl [i 0 15]
      (point (+ i x) y i)))

(defmacro cyc [speed & clauses]
`(case (mod (int (/ (frame) ~speed))
            ~(count clauses))
   ~@(mapcat (fn [clause i]
               [i clause])
             clauses
             (range))
   nil))

(defmacro every-frames [speed size idx-sym & body]
`(let [~idx-sym (mod (int (/ (frame) ~speed))
                     ~size)]
   ~@body))

(defmacro defparam [name value]
(if-let [existing-var (resolve name)]
  (let [param @existing-var]
    (.SetNextValue param value))
  `(do
     (def ~name (Parameter. ~value))
     (.Add Demo/parameters ~name))))

(defn rcol [row dist]
(Pico.Demo/RollColumn row dist))

(defn rrow [row dist]
(Pico.Demo/RollRow row dist))

(defn fps []
(Pico.Demo/GetFps))

;;;;;;;;

(defn heart [x y r]
  (forl [i 0 (* 3 r)]
        (line (+ i (- x (* 2 r))) y x (+ y (* 3 r)) 8)
        (line (- (+ x (* 2 r)) i) y x (+ y (* 3 r)) 9))
  (fcirc (+ x (/ r 1)) y r 4)
  (fcirc x (- y r) r 14)
  (fcirc (- x (/ r 1)) y r 6))

(defn flasher [x y]
  (cyc 64
       (every-frames
        8 32 i
        (frect x y (+ i 1) 10 12)
        (rect x y (+ i 1) 10 11)
        (rect x y (- i 1) 10 10))
       (every-frames
        8 32 i
        (let [i (- 32 i)]
          (fcirc x y (+ i 1) 12)
          (circ x y (+ i 1) 11)
          (circ x y (- i 1) 10))
        )
       ))

(defn sphere [x y r]
  (fcirc x y r 8)
  (fcirc (+ (* 0.1 r) x)
         (- y (* 0.1 r))
         (* 0.75 r) 15)
  (fcirc (+ (* 0.25 r) x)
         (- y (* 0.25 r))
         (* 0.4 r) 6)
  )

(defn draw [t]
  (cls)
  #_
  (cyc 64
       nil
       (do
         (line 64 64 128 96 1)
         (line 64 64 0 96 1))
       (do
         (line 64 64 128 96 1)
         (line 64 64 64 128 1)
         (line 64 64 0 96 1))
       (do
         (line 64 64 128 96 1)
         (line 64 64 64 128 1)
         (line 64 64 0 96 1))
       )
  (forl [i 0 64]
        (let [t (mod (* 4 (+ i (* 1 t))) 128)
              tt (- 64 t)]
          (frect (- 64 tt) (- 64 tt)
                 (+ 64 tt) (+ 64 tt)
                 (int (mod (* 0.5 tt) 16)))))
  #_
  (forl [i 0 64]
        (let [tt (mod (* 1 (+ i t)) 64)
              y (* tt tt)
              c 13]
          (line (- 66 (* 2 y)) (+ 64 y)
                (+ 64 (* 2 y)) (+ 64 y) c)))
  (let [t (* 0.1 t)]
    (forl [j 0 18]
          (heart (+ 64 (* 20 (sin (+ t j))))
                 (+ 8 (* j 8))
                 (* (+ 10 (* 3 (cos (+ t j))))
                    (sin (* 4 (+ t (* 2 j))))))))
  (forl [i 0 64]
        (line i i
              i (- 128 i)
              (mod (+ (* 20 t) i) 16))
        (line (- 128 i) i
              (- 128 i) (- 128 i)
              (mod (+ (* 20 t) i) 16))
        )
  (forl [i 0 16]
        (let [tt (mod (* 16 (+ i (* 0.05 t))) 256)]
          (sphere (+ 64 (* 0.2 tt (cos (* 0.1 tt))))
                  (+ 64 (* 0.2 tt (sin (* 0.1 tt))))
                  (* 0.2 tt))))
  )


(defn draw [t]
  (srand)
  (bg 14)
  (cyc 2
       (bg 8)
       (bg 1)
       (bg 15)
       (bg 10)
       (bg 15)
       (bg 13)
       )
  (doall (for [i [8 32 48 64 80 96]
               j [8 32 48 64 80 96]]
           (flasher (rnd 128) (rnd 128))))
  )


(defparam flum 0.9)

(defparam plump 300)

(defparam circx 64)

(defn draw [t]
  (cls)
  (circ @circx 64 (* @plump (abs (sin (* 1 t)))) 8)
  )

(loop [i 100]
  ;; ...
  (if (pos? i)
    (recur (dec i))
    (str "i is " i)))

(defn draw [t]
  (cls)
  (let [a (+ (* 0.001 (sin t)) -2)
        b -2
        c -1.2
        d 2
        col (cyc 8 8 9 10)]
    (loop [x 0 y 0 i 5000]
      (point (+ 64 (* 20 x))
             (+ 80 (* 20 y))
             (mod (+ x y (* 0.1 t) col) 15)
             )
      (when (pos? i)
        (recur (- (sin (* a y)) (cos (* b x)))
          (- (sin (* c x)) (cos (* d y)))
          (dec i))))))


(defn draw [t]
  (cls)
  (srand)
  (fcirc 64 64 64 12)
  (forl [i 0 (mod (* 5000 t) 10000)]
        (point (rnd 128) (rnd 128) (mod i 15))
        )
  (forl [j 0 100]
        (rrow (mod  (+ j (mod (* 50 t) 128)) 128) (+ j 64)))
  (fcirc 64 64 55 0)
  (let [x0 (+ (* 22 (cos (+ t 3.14))) 64)
        y0 (+ (* 22 (sin (+ t 3.14))) 64)
        x1 (+ (* 22 (cos t)) 64)
        y1 (+ (* 22 (sin t)) 64)]
    (line x0 y0 x1 y1 6)
    (fcirc x0 y0 8 10)
    (fcirc x1 y1 8 11))
  )


(defn star [x y]
  (cyc (rnd 10)
       (point x y 5)
       (point x y 6)))

(defn draw [t])

(defn draw [t]
(cls)
(srand 2)
(forl [i 0 100]
      (star (rnd 128) (rnd 128)))
(forl [i 0 1000]
      (let [z (min 0.1 (- (rnd 16)
                          (- 16 (mod (+ (* 0.5 t) i) 16))))
            x (+ 64 (/ (rnd -64 64) z))
            y (+ 64 (/ (rnd -64 64) z))]
        (star x y)))
(fcirc 64 64 32 1)
(forl [i 0 20]
      (let [z (min 0.1 (- (rnd 16)
                          (- 16 (mod (+ (* 0.5 t) i) 16))))
            x (+ 64 (/ (rnd -64 64) z))
            y (+ 64 (/ (rnd -64 64) z))]
        (star x y)))
(srand t)
(cyc 260
     nil
     (cyc 120
          (let [y (rnd 128)]
            (line 0 y 128 y 5))))
(cyc 512
     nil
     (forl [i 0 5]
           (rrow (mod (+ (* 23 t) i) 128) (* i 2))
           )
     (forl [i 0 30]
           (rrow (mod (+ (* 30 t) i) 128) (+ i 32))
           ))
)

(defn draw [t]
  (forl [i 0 100]
        (star (rnd 128) (rnd 128)))
  (forl [i 0 1000]
        (let [z (min 0.1 (- (rnd 16)
                            (- 16 (mod (+ (* 0.5 t) i) 16))))
              x (+ 64 (/ (rnd -64 64) z))
              y (+ 64 (/ (rnd -64 64) z))]
          (star x y)))
  (fcirc 64 64 32 1)
  (forl [i 0 20]
        (let [z (min 0.1 (- (rnd 16)
                            (- 16 (mod (+ (* 0.5 t) i) 16))))
              x (+ 64 (/ (rnd -64 64) z))
              y (+ 64 (/ (rnd -64 64) z))]
          (star x y)))
  (srand t)
  (cyc 260
       nil
       (cyc 120
            (let [y (rnd 128)]
              (line 0 y 128 y 5))))
  (cyc 512
       nil
       (forl [i 0 5]
             (rrow (mod (+ (* 23 t) i) 128) (* i 2))
             )
       (forl [i 0 30]
             (rrow (mod (+ (* 30 t) i) 128) (+ i 32))
             ))
  )

(defn draw [t]
  (cyc 4
       (bg 11)
       (bg 5)
       (bg 12)
       )
  (cyc 64
       (forl [i 0 8]
             (forl [j 8 16]
                   (frect (+ (if (odd? j) 8 0) (* 8 2 i)) (* 8 j)
                          (+ 8 (* 8 2 i))
                          (+ 8 (* 8 j))
                          (mod (+ i j (* 20 t)) 15)
                          )))
       )
  (cyc 8
       (circ (+ 64 (sin (* 20 t))) (+ 64 (sin (* 20 t))) 32 9)
       (fcirc (+ 64 (sin (* 20 t))) (+ 64 (sin (* 20 t))) 32 9)
       (circ (+ 64 (sin (* 20 t))) (+ 64 (sin (* 20 t))) 32 10)
       (fcirc (+ 64 (sin (* 20 t))) (+ 64 (sin (* 20 t))) 32 10)
       )
  (cyc 8
       (fcirc 64 64 16 8)
       (fcirc 64 64 16 9)
       )
  )

(defn draw [t]
  (cls)
  (forl [i 0 32]
        (text "DOOM OF THE ROCK"
              0
              (+ 64 (* i 2))
              (mod (+ ( * 20 t) i) 15))
        (text "DOOM OF THE ROCK"
              0
              (- 64 (* i 2))
              (mod (+ ( * 20 t) i) 15)))
  (cyc 2
       (text "DOOM OF THE ROCK" 0 64 6)
       (text "DOOM OF THE ROCK" 0 64 5))
  (forl [i 0 64]
        (rrow (mod (+ i (* 8 t)) 128)
              0)
        )
  )

(defn draw [t]
  (cls)
  (text "الرسومات"
        3 32 6)
  (text "من"
        3 64 6)
  (text "الماضي"
        3 96 7)
  (text "﷽"
        77 96 6)
  )

(defn draw [t]
  (cls)
  (sphere 64 64 (* 32 (abs (sin (* 0.7 t)))))
  (forl [i 64 96]
        (rrow (+ 32 (* 2 (int (mod i 64))))
              (* 20 (abs (sin (* 0.01 i))))))
  )

(defn draw [t]
  (cls)
  (cyc 32
       (bg 9)
       (bg 13)
       )
  (let [t (* 0.5 t)]
    (forl [i 0 8]
          (text "المستقبل"
                (+ 22 (* 8 (sin (* 10 (+ (* 0.025 i) t)))))
                (+ 96 (* 2 i)) (mod (- i (* 20 t)) 15))
          (text "هو"
                (+ 50 (* 8 (sin (* 10 (+ (* 0.025 i) (+ 1 t))))))
                (+ 64 (* 2 i)) (mod (- i (* 20 t)) 15))
          (text "الماضي"
                (+ 32 (* 8 (sin (* 10 (+ (* 0.025 i) (+ 2 t))))))
                (+ 32 (* 2 i)) (mod (- i (* 20 t)) 15))
          )
    (text "المستقبل"
          (+ 22 (* 8 (sin (* 10 t))))
          96 7)
    (text "هو"
          (+ 50 (* 8 (sin (* 10 (+ 1 t)))))
          64 7)
    (text "الماضي"
          (+ 32 (* 8 (sin (* 10 (+ 2 t)))))
          32 7)))

(defn draw [t]
  (cyc 80 (bg 4) (bg 3))
  (text (cyc 8
             "طويل"
             "طـويـل"
             "طــويــل"
             "طـويـل"
             "طويل")
        0 70 7))

;; 1: intro: "energetic" but simple. E.g. single drum loop, small #of pico8 objects, but moving quickly (dot circle)
;; 2: Suddenly make section 1 fuller. Same theme but bigger (radar bkg)
;; 3: "In stride", "calmer" than section 2 but still energetic (spiral)
;; 4: "Take it slow" - kind of a cooldown/serenity. At the end, slowly build to... (ice creams, life is a desert)
;; 5: "Planned chaos" - like the chaos we were working on last jam. Structured/pre-planned. (rrow, text)
;; 6: Improvised chaos. Smoothly transition from section 5 to improvised (maybe by slowly breaking things) (star field, planet, fade out text, ice cream)
;; 7: smoothly transition back to "order" from section 6. Should have the code from section 1 (or a variation on it) at the heart of it, so we we can abruptly go to... (calm plant field, fade to point)
;; 8: outro: same or similar as section 1.

;; 1-3
(defn draw [t]
  (cls)
  (point 64 64 (cyc 32 6 5))
  #_ ;; radar
  (forl [j 0 (int (mod (* 0.1 t) 64))]
        (let [c (if (odd? j) 3 9)]
          (circ 64 64 (* 2 j) c))
        )
  #_ ;; lollies
  (let [n (int (mod (* 3 t) 32))]
    (forl [i 0 n]
          (let [x (* (* n 4) (cos (+ (* 0.25 t) (* (/ (* 2 3.14) n) i))))
                y (* (* n 4) (sin (+ (* 0.25 t) (* (/ (* 2 3.14) n) i))))
                c (inc (mod (+ i n (* 4 t)) 15))]
            (fcirc (+ 64 x)
                   (+ 64 y)
                   3
                   c)
            (line 64 64
                  (+ 64 x)
                  (+ 64 y)
                  c))))
  #_ ;; spiral
  (forl [i 0 32]
        (let [rad 0.05
              spd 0.01
              scl 0.02
              len 2048
              aspd 0.5
              tt (mod (* 64 (+ i (* aspd t))) len)]
          (sphere (+ 64 (* rad tt (cos (* spd tt))))
                  (+ 64 (* rad tt (sin (* spd tt))))
                  (* scl tt))))
  )

(defn ice-cream [x y r s]
  (let [ss (* 1 s)]
    (forl [i 0 ss]
          (let [x0 (lerp (+ x (* (/ s 4) (cos (+ r (/ pi 4)))))
                         (+ x (* (/ s 4) (cos (- r (/ pi 4)))))
                         (/ i ss))
                y0 (lerp (+ y (* (/ s 4) (sin (+ r (/ pi 4)))))
                         (+ y (* (/ s 4) (sin(- r (/ pi 4)))))
                         (/ i ss))
                x1 (+ x (* s (cos r)))
                y1 (+ y (* s (sin r)))
                ]
            (line x0 y0 x1 y1 9))))
  (fcirc x y (/ s 4) 4)
  )

;; 4
(defn draw [t]
  (cls)
  (srand)
  (cyc 96
       (bg 8)
       (bg 14))
  (point 64 64 (cyc 32 6 5))
  (forl [i 0 16]
        (forl [j 0 8]
              (ice-cream (* 8 i)
                         (mod (+ (* 16 t) (* 16 j)) 128)
                         (+ (/ pi 2) (* 0.75 (sin (+ j (* 2 t)))))
                         (+ 16 (* 8 (sin (+ j t)))))))
  (forl [i 0 16]
        (text "LIFE IS A DESERT" 0 (* i 8)
              (cyc 96 8 14)))
  )

(defparam starlife 1000)

;; 5-8
(defn draw [t]
  (cls)
  (srand)
  (point 64 64 (cyc 32 6 5))
  #_
  (forl [i 0 3]
        (forl [j 0 4]
              (ice-cream (* 64 i)
                         (mod (+ (* 64 t) (* 16 j)) 128)
                         (+ (/ pi 2) (* 0.75 (sin (+ j (* 12 t)))))
                         (+ 16 (* 8 (sin (+ j t)))))))
  #_ ;;  clean up
  (forl [i 0 1280]
        (point (rnd 128) (rnd 128) 0)
        )
  #_ ;; texts
  (forl [i 0 16]
        (text (cyc 128
                   "EAT TRASH"
                   "BE FREE"
                   "LIFE IS A CHAOS"
                   "كل زبالة"
                   "كن حر"
                   "الحية فوضة"
                   )
              (cyc 128 0 64 0) (* i 8)
               (mod (+ (* 10 t) i) 15)
              #_ (cyc 128 1 2 3 4 5)
              ))
  #_ ;; rolls
  (forl [i 0 50]
        (rrow (mod (+ (* t 8) i) 128) (* i 2))
        )
  #_ ;; rolls
  (forl [i 0 8]
        (rrow (mod (+ (* t 32) i) 128) (* i 4))
        )
  #_ ;; planet
  (cyc 128
       (cls)
       (fcirc 64 64 32 1))
  #_ (cls)
  #_ ;; starfield
  (forl [i 0 @starlife]
        (let [z (min 0.1 (- (rnd 16)
                            (- 16 (mod (+ (* 0.5 t) i) 16))))
              x (+ 64 (/ (rnd -64 64) z))
              y (+ 64 (/ (rnd -64 64) z))]
          (star x y)))
  )

(defparam ff 0.125)

(defn draw [t]
  (let [f (/ (frame) 16)
        bgc (cyc 64 8 9 1 13)
        dir (cyc 64 -1 1)]
    (bg bgc)
    (let [y (+ 64 (* 32 (sin f)))]
      (fcirc 64 y 32 10)
      (fcirc 64 y 16 bgc)
      )
    (forl [i 0 32]
          (rrow (+ 64 (* i 2)) (* dir i))))
  )

(defparam xx 1)

(defn cc [t x y rr]
  (let [r (* 32 (abs (sin (* rr t))))
        xx (+ x (* 32 (sin (+ (* 0.05 y) (* 2 t)))))]
    (fcirc xx y r (+ 8 (mod (+ (* t (* 0.01 y) 8) x) 8)))
    (fcirc xx y (max 0 (- r (mod (* 32 (+ (* 4 y) (* 2 rr) t)) 32))) 0)))

(defn draw1 [t]
  (let [t (mod t (* 4 pi))]
    (forl [i 0 16]
          (cc t 64 (* 8 i) (* i 0.01)))))

(defn draw2 [t]
  (rcol (mod (* 32 t) 128) (mod (* 32 t) 128))
  )

(defn draw [t]
  (cyc 256
       (draw1 t)
       (draw2 t))
  )
