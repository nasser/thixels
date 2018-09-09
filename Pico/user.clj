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

(defn fcirc3 [x y z r c]
  (let [z (max z 1)]
    (fcirc (+ 64 (/ x (* 0.1 z)))
           (+ 64 y) (/ r (* 0.1 z)) c)))

(defn line3 [x y z xx yy zz c]
  (let [z (max z 1)]
    (line (+ 64 (/ x (* 0.1 z)))
          (+ 64 y)
          (+ 64 (/ xx (* 0.1 zz)))
          (+ 64 yy)
          c)))

(defn circ3 [x y z r c]
  (let [z (max z 1)]
    (circ (+ 64 (/ x (* 0.1 z)))
           (+ 64 y) (/ r (* 0.1 z)) c)))

(def bpm->cyc
  {115 30
   120 29
   150 22
   190 19})

;;;;;;;;

;; 115bpm == 30cyc
;; 120bpm == 29cyc
;; 150bpm == 22cyc
;; 190bpm == 18cyc

;; parade of circles
;; conected w lines
;; fill screen, cradle
;; text block on top
;; multi text
;; wind dow

;; TODO centered text
;; TODO trig 0 1
;; TODO 3d fns
;; TODO boxed text (bg color)

(defn draw [t]
  (do
    (bg 100)
    (frect 64 0 128 128 8))
  (let [t (* 0.04 t)]
    (forl [i 0 64]
          (let [x (* 30 (sin (* 2 t (* 0.5 i))))
                y (* 50 (sin (+ i (* 18 t))))
                z (+ 10 (* 10 (cos (* 2 t (* 0.05 i)))))
                xx (* 30 (sin (* 2 t (* 0.5 (inc i)))))
                yy (* 50 (sin (+ (inc i) (* 18 t))))
                zz (+ 10 (* 10 (cos (* 2 t (* 0.05 (inc i))))))
                ]
            (cyc 30
                 nil
                 (circ3 x y z 5 (mod (+ i 8) 16))
                 (fcirc3 x y z 5 (mod (+ i 8) 16)))
            (line (+ 64 x) (+ 64 y) (+ 64 xx) (+ 64 yy)
                  (cyc 30 13 7))))
    (cyc (* 2 29)
         nil
         (forl [i 0 64]
               (rrow (mod (+ i (* 4 t)) 128)
                     (* 4 i))))
    (forl [j 0 8]
          (text (cyc 15
                     "قالت"
                     "لي"
                     "الارض"
                     "لما"
                     "سألت"
                     "يا"
                     "امي"
                     "هل"
                     "تكرهين"
                     "البشر؟"
                     )
                40 (+ 64 (* j 2)) (+ 8 (mod (+ (* 1000 t) j) 8))))
    ))

(defn draw [t]
  (let [t (* 0.5 t)]
    (cyc (* 1 18)
         (bg 0))
    (forl [i 0 64]
          (let [ii (inc i)
                y (* 50 (sin (* 0.01 t i)))
                x (* 50 (cos (+ i (* 2 t))))
                z (+ 10 (* 5 (sin (+ i ( * 2 t)))))
                xx (* 50 (cos (+ ii (* 2 t))))
                yy (* 50 (sin (* 0.01 t ii)))
                zz (+ 10 (* 5 (sin (+ ii ( * 2 t)))))]
            (cyc 18
                 (circ3 x y z 5 (+ 8 (mod (+ i (* 8 t)) 8)))
                 (fcirc3 x y z 5 (+ 8 (mod (+ i (* 8 t)) 8))))
            (line3 x y z xx yy zz 7)))
    #_
    (forl [i 0 4]
          (cyc 50
               nil
               (text
                (cyc 20
                     "EXCHANGE"
                     "ANY"
                     "GOOD"
                     "STOCKS"
                     "TODAY"
                     "OR"
                     "LIKE"
                     "WHAT")
                40 (+ 50 (* i 8)) 7)))
    #_
    (forl [j 0 128]
          (rrow (mod (+ (* 1 j) (* t 60)) 128)
                (* 16 (sin (* 0.1 j)))))
    #_
    (let [yy (* 50 (sin (* t 8)))]
      (forl [i 0 32]
            (text "????" (mod (- 128 (+ (* t 500) (* 32 i))) 128)
                  (+ yy 60) 7)))
    ))


(defn draw [t]
  (let [t (* 0.5 t)]
    (cyc (/ 30 1)
         (bg 0)
         )
    #_
    (forl [j 0 9]
          (forl [i 0 9]
                (text
                 (cyc (/ 30 2)
                      "ROUND"
                      "AND")
                 (+ ( * j 10) 0) (+ (* i 12) 12) (mod (+ i j (* 20 t)) 16))))
    #_
    (forl [i 0 16]
          (let [ii (inc i)
                y (* 50 (sin (* 0.01 t i)))
                x (* 50 (cos (+ i (* 2 t))))
                z (+ 10 (* 5 (sin (+ i ( * 2 t)))))
                yy (* 50 (sin (* 0.01 t ii)))
                xx (* 50 (cos (+ ii (* 2 t))))
                zz (+ 10 (* 5 (sin (+ ii ( * 2 t)))))
                r (* 0.85 (sin (* 1 t i)) z)]
            (if (= i (int (mod (* 90 t) 64)))
              (fcirc3 x y z 4 7)
              (circ3 x y z 4 7)
              )
            (line3 x y z xx yy zz (if (odd? i) (cyc 8 8 9) (cyc 8 10 11)))))
    #_
    (forl [j 0 128]
          (rrow (mod (* 2 (+ (* 1 j) (* t 90))) 128)
                (* 32 (sin (* 0.1 j)))))
    (forl [i 0 0]
          (text
           (cyc 30
                "وقالت"
                "لي"
                "الأرض"
                "لما"
                "سالت"
                "ايا"
                "أم"
                "تكرهين"
                "البشر"
                "ابارك"
                "في"
                "الناس"
                "اهل"
                "الطموح"
                "ومن"
                "يستلذ"
                "ركوب"
                "الخطر"
                "والعن"
                "من"
                "لا"
                "يماشي"
                "الزمان"
                "وقنع"
                "بالعيش"
                "عيش"
                "الحجر"
                )
           (+ (* 0 (sin (+ (* t 2) (* i 0.05)))) 40)
           (- 64 (* i 2)) (- 13 (mod (+ i ( * t 5)) 5))))
    ))
