// https://github.com/tgsstdio/OpenTK-Demos/blob/master/ComputeDemo/Demo.cs

using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.IO;
using System.Net.Mime;
using System.Text;
using System.Threading;
using OpenTK.Graphics.OpenGL;
using OpenTK;
using OpenTK.Graphics;
using clojure.lang;
using Mono.Terminal;
using All = OpenTK.Graphics.OpenGL.All;
using SharpFont;
using SharpFont.HarfBuzz;
using Font = SharpFont.HarfBuzz.Font;

namespace Pico
{
    public class Parameter : IDeref
    {
        private float Value;
        private float NextValue;
        private float Speed = 1;

        public Parameter(float value)
        {
            Value = value;
            NextValue = Value;
        }

        public void Interpolate(float delta)
        {
            // TODO not linear
            var diff = (NextValue - Value) * delta * Speed;
            Value += diff;
        }

        public void SetNextValue(float nextValue)
        {
            NextValue = nextValue;
        }

        public void SetSpeed(float speed)
        {
            NextValue = speed;
        }

        public object deref()
        {
            return Value;
        }
    }

    public class Demo
    {
        public static List<Parameter> parameters = new List<Parameter>();

        private int _mRenderProgramId;

        public void Initialize()
        {
            _mRenderProgramId = SetupRenderProgram();
        }

        public static uint _bufferWidth = 128;
        public static uint[] _frameBuffer = new uint[_bufferWidth * _bufferWidth];
        public static int _frameBufferLocation;

        public static void Set(float xx, float yy, uint c)
        {
            int x = (int) xx;
            int y = (int) yy;
            if (x >= _bufferWidth || y >= _bufferWidth || x < 0 || y < 0)
                return;
            _frameBuffer[(x % _bufferWidth) + y * _bufferWidth] = c;
        }

        public static uint Get(float xx, float yy)
        {
            int x = (int) xx;
            int y = (int) yy;
            if (x >= _bufferWidth || y >= _bufferWidth || x < 0 || y < 0)
                return 0;
            return _frameBuffer[(x % _bufferWidth) + y * _bufferWidth];
        }

        // https://answers.unity.com/questions/380035/c-modulus-is-wrong-1.html
        public static int mod(int a, int n)
        {
            return ((a % n) + n) % n;
        }

        public static void RollRow(float row, float distance)
        {
            if (distance > 0)
            {
                for (int i = 0; i < _bufferWidth; i++)
                {
                    Set(i, row, Get(mod((int) (i + distance), (int) _bufferWidth), row));
                }
            }
            else
            {
                for (int i = (int) _bufferWidth; i >= 0; i--)
                {
                    Set(i, row, Get(mod((int) (i + distance), (int) _bufferWidth), row));
                }
            }
        }

        public static void RollColumn(float col, float distance)
        {
            for (int i = 0; i < _bufferWidth; i++)
            {
                Set(col, i, Get(col, (i + distance) % _bufferWidth));
            }
        }

        public static void XorSet(int x, int y, uint c)
        {
            if (x >= _bufferWidth || y >= _bufferWidth || x < 0 || y < 0)
                return;
            _frameBuffer[(x % _bufferWidth) + y * _bufferWidth] ^= c;
        }

        // http://members.chello.at/easyfilter/bresenham.html
        // special thanks to @porglezomp and @prathyvsh
        public static void Circle(float x0, float y0, float radius, uint c)
        {
            int x = (int) -radius;
            int y = 0;
            int err = (int) (2 - 2 * radius);
            do
            {
                Set(x0 - x, y0 + y, c);
                Set(x0 - y, y0 - x, c);
                Set(x0 + x, y0 - y, c);
                Set(x0 + y, y0 + x, c);
                radius = err;
                if (radius <= y) err += ++y * 2 + 1;
                if (radius > x || err > y) err += ++x * 2 + 1;
            } while (x < 0);
        }

        // https://en.wikipedia.org/wiki/Midpoint_circle_algorithm
        public static void FilledCircle(float x0, float y0, float radius, uint c)
        {
            int x = (int) -radius;
            int y = 0;
            int err = (int) (2 - 2 * radius);
            uint i = 0;
            do
            {
                Line(x0 - x, y0 + y, x0, y0 + y, c);
                Line(x0 - y, y0 - x, x0, y0 - x, c);
                Line(x0 + x, y0 - y, x0, y0 - y, c);
                Line(x0 + y, y0 + x, x0, y0 + x, c);
                i++;
                radius = err;
                if (radius <= y) err += ++y * 2 + 1;
                if (radius > x || err > y) err += ++x * 2 + 1;
            } while (x < 0);
        }

        // https://stackoverflow.com/questions/11678693/all-cases-covered-bresenhams-line-algorithm
        public static void Line(float x0, float y0, float x1, float y1, uint c)
        {
            if (y0 == y1)
            {
                if (x0 < x1)
                {
                    if (x0 < 0) x0 = 0;
                    if (x1 > _bufferWidth) x1 = _bufferWidth;
                    while (x0 < x1)
                    {
                        Set(x0, y0, c);
                        x0 += 1;
                    }
                }
                else
                {
                    if (x1 < 0) x1 = 0;
                    if (x0 > _bufferWidth) x0 = _bufferWidth;
                    while (x1 < x0)
                    {
                        Set(x1, y0, c);
                        x1 += 1;
                    }

                    return;
                }
            }

            if (x0 == x1)
            {
                if (y0 < y1)
                {
                    if (y0 < 0) y0 = 0;
                    if (y1 > _bufferWidth) y1 = _bufferWidth;
                    while (y0 < y1)
                    {
                        Set(x0, y0, c);
                        y0 += 1;
                    }
                }
                else
                {
                    if (y1 < 0) y1 = 0;
                    if (y0 > _bufferWidth) y0 = _bufferWidth;
                    while (y1 < y0)
                    {
                        Set(x0, y1, c);
                        y1 += 1;
                    }

                    return;
                    ;
                }
            }

            float w = x1 - x0;
            float h = y1 - y0;
            int dx1 = 0, dy1 = 0, dx2 = 0, dy2 = 0;
            if (w < 0) dx1 = -1;
            else if (w > 0) dx1 = 1;
            if (h < 0) dy1 = -1;
            else if (h > 0) dy1 = 1;
            if (w < 0) dx2 = -1;
            else if (w > 0) dx2 = 1;
            float longest = Math.Abs(w);
            float shortest = Math.Abs(h);
            if (!(longest > shortest))
            {
                longest = Math.Abs(h);
                shortest = Math.Abs(w);
                if (h < 0) dy2 = -1;
                else if (h > 0) dy2 = 1;
                dx2 = 0;
            }

            float numerator = longest / 2f;
            for (int i = 0; i <= longest; i++)
            {
                Set(x0, y0, c);
                numerator += shortest;
                if (!(numerator < longest))
                {
                    numerator -= longest;
                    x0 += dx1;
                    y0 += dy1;
                }
                else
                {
                    x0 += dx2;
                    y0 += dy2;
                }
            }
        }

        public static void Rectangle(float xx1, float yy1, float xx2, float yy2, uint c)
        {
            var x1 = Math.Min(xx1, xx2);
            var y1 = Math.Min(yy1, yy2);
            var x2 = Math.Max(xx1, xx2);
            var y2 = Math.Max(yy1, yy2);

            for (var y = y1; y <= y2; y += 1)
            {
                Set(x1, y, c);
                Set(x2, y, c);
            }

            for (var x = x1; x <= x2; x += 1)
            {
                Set(x, y1, c);
                Set(x, y2, c);
            }
        }

        public static void FilledRectangle(float xx1, float yy1, float xx2, float yy2, uint c)
        {
            var x1 = Math.Min(xx1, xx2);
            var y1 = Math.Min(yy1, yy2);
            var x2 = Math.Max(xx1, xx2);
            var y2 = Math.Max(yy1, yy2);

            for (var y = y1; y <= y2; y += 1)
            {
                for (var x = x1; x <= x2; x += 1)
                {
                    Set(x, y, c);
                }
            }
        }

        public static float[] palette =
        {
            40 / 255f, 0 / 255f, 40 / 255f,
            29 / 255f, 43 / 255f, 83 / 255f,
            126 / 255f, 37 / 255f, 83 / 255f,
            0 / 255f, 135 / 255f, 81 / 255f,
            171 / 255f, 82 / 255f, 54 / 255f,
            95 / 255f, 87 / 255f, 79 / 255f,
            194 / 255f, 195 / 255f, 199 / 255f,
            255 / 255f, 241 / 255f, 232 / 255f,
            255 / 255f, 0 / 255f, 77 / 255f,
            255 / 255f, 163 / 255f, 0 / 255f,
            255 / 255f, 236 / 255f, 39 / 255f,
            0 / 255f, 228 / 255f, 54 / 255f,
            41 / 255f, 173 / 255f, 255 / 255f,
            131 / 255f, 118 / 255f, 156 / 255f,
            255 / 255f, 204 / 255f, 170 / 255f,
            255 / 255f, 119 / 255f, 168 / 255f,
        };

        private static Color[] bitmapPalette;
        private static Bitmap bmp;

        public static void Record()
        {
            Record(0);
        }
        
        public static void Record(int modulo)
        {
            if (bitmapPalette == null)
            {
                bitmapPalette = new Color[16];
                for (int i = 0; i < 16; i++)
                {
                    bitmapPalette[i] = Color.FromArgb(
                        (int) (palette[i * 3 + 0] * 255),
                        (int) (palette[i * 3 + 1] * 255),
                        (int) (palette[i * 3 + 2] * 255));
                }
            }

            if (bmp == null)
            {
                bmp = new Bitmap(128, 128);
            }

            for (int i = 0; i < _bufferWidth; i++)
            {
                for (int j = 0; j < _bufferWidth; j++)
                {
                    var idx = j * _bufferWidth + i;
                    var c = _frameBuffer[idx];
                    var col = bitmapPalette[c];
                    bmp.SetPixel(i, j, col);
                }
            }

            var f = Frame();
            if (modulo > 0)
                f = f % modulo;
            bmp.Save($"pico-{f:D8}.png");
        }

//        public static Vector2 Project(Vector3 v, Vector3 cameraPosition, Vector3 cameraRotation, Vector3 surface)
//        {
//            var d = new Vector3(
//                Math.Cos(cameraRotation)
//                );
//        }

        private static Library freetypeLibrary;
        private static readonly Face fixedsysFace;
        private static Font fixedsysFont;


        static Demo()
        {
            freetypeLibrary = new Library();
            fixedsysFace = new Face(freetypeLibrary, "FSEX301-L2.ttf");
//            fixedsysFace = new Face(freetypeLibrary, "/usr/share/fonts/TTF/Amiri-Regular.ttf");
            fixedsysFace.SetCharSize(0, 16, 72, 72);
            fixedsysFont = Font.FromFTFace(fixedsysFace);
        }

        public static Script GuessScript(string s)
        {
            return GuessScript(s[0]);
        }

        // https://msdn.microsoft.com/en-us/library/20bw873z(v=vs.85).aspx#SupportedNamedBlocks
        public static Script GuessScript(char c)
        {
            if (c >= 0x0000 && c <= 0x007F)
                return Script.Latin;

            if (c >= 0x0080 && c <= 0x00FF)
                return Script.Latin;

            if (c >= 0x0100 && c <= 0x017F)
                return Script.Latin;

            if (c >= 0x0180 && c <= 0x024F)
                return Script.Latin;

            if (c >= 0x0370 && c <= 0x03FF)
                return Script.Greek;

            if (c >= 0x0400 && c <= 0x04FF)
                return Script.Cyrillic;

            if (c >= 0x0500 && c <= 0x052F)
                return Script.Cyrillic;

            if (c >= 0x0530 && c <= 0x058F)
                return Script.Armenian;

            if (c >= 0x0590 && c <= 0x05FF)
                return Script.Hebrew;

            if (c >= 0x0600 && c <= 0x06FF)
                return Script.Arabic;

            if (c >= 0x0700 && c <= 0x074F)
                return Script.Syriac;

            if (c >= 0x0780 && c <= 0x07BF)
                return Script.Thaana;

            if (c >= 0x0900 && c <= 0x097F)
                return Script.Devanagari;

            if (c >= 0x0980 && c <= 0x09FF)
                return Script.Bengali;

            if (c >= 0x0A00 && c <= 0x0A7F)
                return Script.Gurmukhi;

            if (c >= 0x0A80 && c <= 0x0AFF)
                return Script.Gujarati;

            if (c >= 0x0B00 && c <= 0x0B7F)
                return Script.Oriya;

            if (c >= 0x0B80 && c <= 0x0BFF)
                return Script.Tamil;

            if (c >= 0x0C00 && c <= 0x0C7F)
                return Script.Telugu;

            if (c >= 0x0C80 && c <= 0x0CFF)
                return Script.Kannada;

            if (c >= 0x0D00 && c <= 0x0D7F)
                return Script.Malayalam;

            if (c >= 0x0D80 && c <= 0x0DFF)
                return Script.Sinhala;

            if (c >= 0x0E00 && c <= 0x0E7F)
                return Script.Thai;

            if (c >= 0x0E80 && c <= 0x0EFF)
                return Script.Lao;

            if (c >= 0x0F00 && c <= 0x0FFF)
                return Script.Tibetan;

            if (c >= 0x1000 && c <= 0x109F)
                return Script.Myanmar;

            if (c >= 0x10A0 && c <= 0x10FF)
                return Script.Georgian;

            if (c >= 0x1100 && c <= 0x11FF)
                return Script.Hangul;

            if (c >= 0x1200 && c <= 0x137F)
                return Script.Ethiopic;

            if (c >= 0x13A0 && c <= 0x13FF)
                return Script.Cherokee;

            if (c >= 0x1400 && c <= 0x167F)
                return Script.CanadianSyllabics;

            if (c >= 0x1680 && c <= 0x169F)
                return Script.Ogham;

            if (c >= 0x16A0 && c <= 0x16FF)
                return Script.Runic;

            if (c >= 0x1700 && c <= 0x171F)
                return Script.Tagalog;

            if (c >= 0x1720 && c <= 0x173F)
                return Script.Hanunoo;

            if (c >= 0x1740 && c <= 0x175F)
                return Script.Buhid;

            if (c >= 0x1760 && c <= 0x177F)
                return Script.Tagbanwa;

            if (c >= 0x1780 && c <= 0x17FF)
                return Script.Khmer;

            if (c >= 0x1800 && c <= 0x18AF)
                return Script.Mongolian;

            if (c >= 0x1900 && c <= 0x194F)
                return Script.Limbu;

            if (c >= 0x1950 && c <= 0x197F)
                return Script.TaiLe;

            if (c >= 0x19E0 && c <= 0x19FF)
                return Script.Khmer;

//            if (c >= 0x1D00 && c <= 0x1D7F)
//                return Script.PhoneticExtensions;

            if (c >= 0x1E00 && c <= 0x1EFF)
                return Script.Latin;

            if (c >= 0x1F00 && c <= 0x1FFF)
                return Script.Greek;

//            if (c >= 0x2000 && c <= 0x206F)
//                return Script.GeneralPunctuation;
//
//            if (c >= 0x2070 && c <= 0x209F)
//                return Script.SuperscriptsandSubscripts;
//
//            if (c >= 0x20A0 && c <= 0x20CF)
//                return Script.CurrencySymbols;
//
//            if (c >= 0x20D0 && c <= 0x20FF)
//                return Script.CombiningDiacriticalMarksforSymbols;
//
//            if (c >= 0x - && 0xc <= -)
//                return Script.CombiningMarksforSymbols;
//
//            if (c >= 0x2100 && c <= 0x214F)
//                return Script.LetterlikeSymbols;
//
//            if (c >= 0x2150 && c <= 0x218F)
//                return Script.NumberForms;
//
//            if (c >= 0x2190 && c <= 0x21FF)
//                return Script.Arrows;
//
//            if (c >= 0x2200 && c <= 0x22FF)
//                return Script.MathematicalOperators;
//
//            if (c >= 0x2300 && c <= 0x23FF)
//                return Script.MiscellaneousTechnical;
//
//            if (c >= 0x2400 && c <= 0x243F)
//                return Script.ControlPictures;
//
//            if (c >= 0x2440 && c <= 0x245F)
//                return Script.OpticalCharacterRecognition;
//
//            if (c >= 0x2460 && c <= 0x24FF)
//                return Script.EnclosedAlphanumerics;
//
//            if (c >= 0x2500 && c <= 0x257F)
//                return Script.BoxDrawing;
//
//            if (c >= 0x2580 && c <= 0x259F)
//                return Script.BlockElements;
//
//            if (c >= 0x25A0 && c <= 0x25FF)
//                return Script.GeometricShapes;
//
//            if (c >= 0x2600 && c <= 0x26FF)
//                return Script.MiscellaneousSymbols;
//
//            if (c >= 0x2700 && c <= 0x27BF)
//                return Script.Dingbats;
//
//            if (c >= 0x27C0 && c <= 0x27EF)
//                return Script.MiscellaneousMathematicalSymbols - A;
//
//            if (c >= 0x27F0 && c <= 0x27FF)
//                return Script.SupplementalArrows - A;
//
//            if (c >= 0x2800 && c <= 0x28FF)
//                return Script.BraillePatterns;
//
//            if (c >= 0x2900 && c <= 0x297F)
//                return Script.SupplementalArrows - B;
//
//            if (c >= 0x2980 && c <= 0x29FF)
//                return Script.MiscellaneousMathematicalSymbols - B;
//
//            if (c >= 0x2A00 && c <= 0x2AFF)
//                return Script.SupplementalMathematicalOperators;
//
//            if (c >= 0x2B00 && c <= 0x2BFF)
//                return Script.MiscellaneousSymbolsandArrows;
//
//            if (c >= 0x2E80 && c <= 0x2EFF)
//                return Script.CJKRadicalsSupplement;
//
//            if (c >= 0x2F00 && c <= 0x2FDF)
//                return Script.KangxiRadicals;
//
//            if (c >= 0x2FF0 && c <= 0x2FFF)
//                return Script.IdeographicDescriptionCharacters;
//
//            if (c >= 0x3000 && c <= 0x303F)
//                return Script.CJKSymbolsandPunctuation;

            if (c >= 0x3040 && c <= 0x309F)
                return Script.Hiragana;

            if (c >= 0x30A0 && c <= 0x30FF)
                return Script.Katakana;

            if (c >= 0x3100 && c <= 0x312F)
                return Script.Bopomofo;

            if (c >= 0x3130 && c <= 0x318F)
                return Script.Hangul;

//            if (c >= 0x3190 && c <= 0x319F)
//                return Script.Kanbun;
//
//            if (c >= 0x31A0 && c <= 0x31BF)
//                return Script.BopomofoExtended;
//
//            if (c >= 0x31F0 && c <= 0x31FF)
//                return Script.KatakanaPhoneticExtensions;
//
//            if (c >= 0x3200 && c <= 0x32FF)
//                return Script.EnclosedCJKLettersandMonths;
//
//            if (c >= 0x3300 && c <= 0x33FF)
//                return Script.CJKCompatibility;
//
//            if (c >= 0x3400 && c <= 0x4DBF)
//                return Script.CJKUnifiedIdeographsExtensionA;
//
//            if (c >= 0x4DC0 && c <= 0x4DFF)
//                return Script.YijingHexagramSymbols;
//
//            if (c >= 0x4E00 && c <= 0x9FFF)
//                return Script.CJKUnifiedIdeographs;
//
//            if (c >= 0xA000 && c <= 0xA48F)
//                return Script.YiSyllables;
//
//            if (c >= 0xA490 && c <= 0xA4CF)
//                return Script.YiRadicals;
//
//            if (c >= 0xAC00 && c <= 0xD7AF)
//                return Script.HangulSyllables;
//
//            if (c >= 0xD800 && c <= 0xDB7F)
//                return Script.HighSurrogates;
//
//            if (c >= 0xDB80 && c <= 0xDBFF)
//                return Script.HighPrivateUseSurrogates;
//
//            if (c >= 0xDC00 && c <= 0xDFFF)
//                return Script.LowSurrogates;
//
//            if (c >= 0xE000 && c <= 0xF8FF)
//                return Script.PrivateUse;
//
//            if (c >= 0xF900 && c <= 0xFAFF)
//                return Script.PrivateUseArea;
//
//            if (c >= 0xFB00 && c <= 0xFB4F)
//                return Script.CJKCompatibilityIdeographs;
//
//            if (c >= 0xFB50 && c <= 0xFDFF)
//                return Script.AlphabeticPresentationForms;
//
//            if (c >= 0xFE00 && c <= 0xFE0F)
//                return Script.ArabicPresentationForms - A;
//
//            if (c >= 0xFE20 && c <= 0xFE2F)
//                return Script.VariationSelectors;
//
//            if (c >= 0xFE30 && c <= 0xFE4F)
//                return Script.CombiningHalfMarks;
//
//            if (c >= 0xFE50 && c <= 0xFE6F)
//                return Script.CJKCompatibilityForms;
//
//            if (c >= 0xFE70 && c <= 0xFEFF)
//                return Script.SmallFormVariants;

            if (c >= 0xFF00 && c <= 0xFFEF)
                return Script.Arabic;
//
//            if (c >= 0xFFF0 && c <= 0xFFFF)
//                return Script.HalfwidthandFullwidthForms;
            return Script.Unknown;
        }


        public static Direction GuessDirection(string s)
        {
            return GuessDirection(s[0]);
        }

        public static Direction GuessDirection(char c)
        {
            var script = GuessScript(c);
            switch (script)
            {
                case Script.Arabic:
                case Script.Hebrew:
                case Script.ImperialAramaic:
                    return Direction.RightToLeft;
                default:
                    return Direction.LeftToRight;
            }
        }

        public static void Text(string str, float startX, float startY, uint c)
        {
            Text(str, startX, startY, c, GuessDirection(str), GuessScript(str));
        }

        public static void Text(string str, float startX, float startY, uint c, Direction dir = Direction.LeftToRight,
            Script script = Script.Latin)
        {
            var buf = new SharpFont.HarfBuzz.Buffer
            {
                Direction = dir,
                Script = script
            };
            buf.AddText(str);
            fixedsysFont.Shape(buf);
            var glyphInfos = buf.GlyphInfo();
            var glyphPositions = buf.GlyphPositions();

            int penX = 0, penY = 0;
            //draw the string
            for (int i = 0; i < glyphInfos.Length; ++i)
            {
                fixedsysFace.LoadGlyph(glyphInfos[i].codepoint, LoadFlags.Monochrome, LoadTarget.Mono);
                fixedsysFace.Glyph.RenderGlyph(RenderMode.Mono);
                var bmap = fixedsysFace.Glyph.Bitmap;
//                Console.WriteLine("{2} bmap {0} {1}", i, bmap.Width, str);
                // https://dbader.org/blog/monochrome-font-rendering-with-freetype-and-python
                for (int y = 0; y < bmap.Rows; y++)
                {
                    for (int byteIndex = 0; byteIndex < bmap.Pitch; byteIndex++)
                    {
                        var bval = bmap.BufferData[y * bmap.Pitch + byteIndex];
                        var numDone = byteIndex * 8;
                        for (int bitIndex = 0; bitIndex < Math.Min(8, bmap.Width - numDone); bitIndex++)
                        {
                            var bit = bval & (1 << (7 - bitIndex));
                            if (bit != 0)
                            {
                                var xxx = penX + bitIndex + numDone + (glyphPositions[i].xOffset >> 6) +
                                          fixedsysFace.Glyph.BitmapLeft;
                                var yyy = penY - y - (glyphPositions[i].yOffset >> 6) + fixedsysFace.Glyph.BitmapTop;
                                Set(startX + xxx, startY - yyy, c);
                            }
                        }
                    }
                }

                penX += glyphPositions[i].xAdvance >> 6;
                penY -= glyphPositions[i].yAdvance >> 6;
            }
        }

        public static double _fps;

        public static double GetFps()
        {
            return _fps;
        }

        static Random rnd = new Random();

        public static double Random()
        {
            return rnd.NextDouble();
        }

        public static void SeedRandom(int seed)
        {
            rnd = new Random(seed);
        }

        private static int[] l = {1, 2, 3, 11, 13, 15};

        public static void ClearScreen()
        {
            Array.Clear(_frameBuffer, 0, _frameBuffer.Length);
        }

        private static Var drawVar = RT.var("user", "draw");

        private static double time = 0;
        private static long frame = 0;

        public static double Time()
        {
            return time;
        }

        public static long Frame()
        {
            return frame;
        }

        static void FakeDraw(float t)
        {
            for (int i = 0; i < 128; i++)
            {
                float r = (float) ((2 + Math.Sin((0.09 * i) + t)) * Math.Max(0, 128 - (i * 8)));
                var c = (((8 * t) + i) % 8) + 7;
                FilledCircle(64, 64, r, (uint) c);
            }
        }

        public void Draw(int w, int h, double deltaTime)
        {
            time += deltaTime;
            frame++;
//            FakeDraw((float) time);
            if (drawVar.isBound && drawVar.getRawRoot() != null)
            {
                try
                {
                    drawVar.invoke(time);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }

            /////////

            GL.UseProgram(_mRenderProgramId);
            GL.BindBuffer(BufferTarget.UniformBuffer, _frameBufferLocation);
            GL.BufferSubData(BufferTarget.UniformBuffer, IntPtr.Zero, sizeof(uint) * _frameBuffer.Length, _frameBuffer);

            GL.Uniform2(GL.GetUniformLocation(_mRenderProgramId, "screen"), (float) w, (float) h);
            GL.Uniform1(GL.GetUniformLocation(_mRenderProgramId, "width"), _bufferWidth);
            GL.Uniform3(GL.GetUniformLocation(_mRenderProgramId, "palette"), palette.Length / 3, palette);
            GL.DrawArrays(PrimitiveType.TriangleStrip, 0, 4);
        }

        private int SetupRenderProgram()
        {
            int progHandle = GL.CreateProgram();
            int vp = GL.CreateShader(ShaderType.VertexShader);
            int fp = GL.CreateShader(ShaderType.FragmentShader);

            const string vpSrc = @"#version 430
			                     in vec2 pos;
			                     void main() {
			                       gl_Position = vec4(pos.x, pos.y, 0.0, 1.0);
			                     }";

            const string fpSrc = @"#version 430
			                     out vec4 color;
                                 uniform vec2 screen;
                                 uniform uint width;
                                 uniform vec3 palette[16];

                                 layout (binding=0, packed) uniform pixelBufferLocation {
                                    uint pixelBuffer [16384];
                                 };

			                     void main() {
                                        float smallest_side = min(screen.y, screen.x);
                                        float biggest_side = max(screen.y, screen.x);
                                        float scale = smallest_side / width;
                                        vec2 padding = vec2(0.0);
                                        if(screen.x <= screen.y)
                                            padding.y = (biggest_side - smallest_side) / 2.0;
                                        else
                                            padding.x = (biggest_side - smallest_side) / 2.0;
                                        float ix = (gl_FragCoord.x - padding.x) / scale;
                                        float iy = ((screen.y - gl_FragCoord.y) - padding.y) / scale;
                                        if(ix < 0 || ix >= width || iy < 0 || iy >= width*width) {
                                            color = vec4(palette[0], 1.0);
                                        } else {
                                            int idx = int(ix) + int(iy) * int(width);
                                            uint c = pixelBuffer[idx];
                                            color = vec4(palette[c], 1.0);
                                        }
			                     }";

            GL.ShaderSource(vp, vpSrc);
            GL.ShaderSource(fp, fpSrc);

            GL.CompileShader(vp);
            int rvalue;
            GL.GetShader(vp, ShaderParameter.CompileStatus, out rvalue);
            if (rvalue != (int) All.True)
            {
                Console.WriteLine("Error in compiling vp");
                Console.WriteLine((All) rvalue);
                Console.WriteLine(GL.GetShaderInfoLog(vp));
            }

            GL.AttachShader(progHandle, vp);

            GL.CompileShader(fp);
            GL.GetShader(fp, ShaderParameter.CompileStatus, out rvalue);
            if (rvalue != (int) All.True)
            {
                Console.WriteLine("Error in compiling fp");
                Console.WriteLine((All) rvalue);
                Console.WriteLine(GL.GetShaderInfoLog(fp));
            }

            GL.AttachShader(progHandle, fp);

            GL.BindFragDataLocation(progHandle, 0, "color");
            GL.LinkProgram(progHandle);

            GL.GetProgram(progHandle, GetProgramParameterName.LinkStatus, out rvalue);
            if (rvalue != (int) All.True)
            {
                Console.WriteLine("Error in linking sp");
                Console.WriteLine((All) rvalue);
                Console.WriteLine(GL.GetProgramInfoLog(progHandle));
            }

            GL.UseProgram(progHandle);
            GL.Uniform1(GL.GetUniformLocation(progHandle, "srcTex"), 0);

            var vertArray = GL.GenVertexArray();
            GL.BindVertexArray(vertArray);

            var posBuf = GL.GenBuffer();
            GL.BindBuffer(BufferTarget.ArrayBuffer, posBuf);
            float[] data =
            {
                -1.0f, -1.0f,
                -1.0f, 1.0f,
                1.0f, -1.0f,
                1.0f, 1.0f
            };
            IntPtr dataSize = (IntPtr) (sizeof(float) * 8);

            GL.BufferData(BufferTarget.ArrayBuffer, dataSize, data, BufferUsageHint.StreamDraw);
            int posPtr = GL.GetAttribLocation(progHandle, "pos");
            GL.VertexAttribPointer(posPtr, 2, VertexAttribPointerType.Float, false, 0, 0);
            GL.EnableVertexAttribArray(posPtr);

            _frameBufferLocation = GL.GenBuffer();
            GL.BindBuffer(BufferTarget.UniformBuffer, _frameBufferLocation);
            GL.BufferData(BufferTarget.UniformBuffer, sizeof(uint) * _frameBuffer.Length, _frameBuffer,
                BufferUsageHint.StreamDraw);
            var blockIndex = GL.GetUniformBlockIndex(progHandle, "pixelBufferLocation");
            GL.BindBufferBase(BufferRangeTarget.UniformBuffer, 0, _frameBufferLocation); // TODO 0??
            GL.UniformBlockBinding(progHandle, blockIndex, 0); // TODO 0??

            GL.GenTexture();

            return progHandle;
        }
    }

    static class MainClass
    {
        static void StatusPrint(StringName n)
        {
            Console.WriteLine("{0}: {1}", n, GL.GetString(n));
        }

        static void StatusPrint(GetPName n)
        {
            Console.WriteLine("{0}: {1}", n, GL.GetInteger(n));
        }

        static Vector3 v = Vector3.One;

        [STAThread]
        public static void Main(string[] args)
        {
            const int width = 1024 * 4;
            const int height = 1024 * 4;

//            var versionVar = RT.var("clojure.core", "clojure-version");
//            var serverStartVar = RT.var("clojure.core.server", "start-server");
//            var ednReadVar = RT.var("clojure.edn", "read-string");
//            var serverOptions = ednReadVar.invoke("{:name \"pico\" :port 1987  :accept clojure.core.server/repl}");
//            Console.WriteLine("Clojure {0} listening on port {1}", versionVar.invoke(), 1987);
//            serverStartVar.invoke(serverOptions);

            using (var game = new GameWindow(width, height, GraphicsMode.Default, "Pico", GameWindowFlags.Default,
                DisplayDevice.Default, 4, 5, GraphicsContextFlags.Default))
            {
                Demo d = new Demo();
                StatusPrint(GetPName.MaxUniformBlockSize);
                game.Load += (sender, e) =>
                {
                    // setup settings, load textures, sounds
                    d.Initialize();
                    game.VSync = VSyncMode.On;

                    StatusPrint(StringName.Renderer);
                    StatusPrint(StringName.ShadingLanguageVersion);
                    StatusPrint(StringName.Vendor);
                    StatusPrint(StringName.Version);
                    new Thread(() =>
                    {
                        var readString = RT.var("clojure.core", "read-string");
                        var eval = RT.var("clojure.core", "eval");
                        var prStr = RT.var("clojure.core", "pr-str");
                        var le = new LineEditor("pico");
                        var nsVar = RT.var("clojure.core", "*ns*");
                        Var.pushThreadBindings(RT.mapUniqueKeys(nsVar,
                            Namespace.find(Symbol.intern("user"))));
                        try
                        {
                            string input;
                            var sb = new StringBuilder();
                            while ((input = le.Edit(
                                       sb.Length == 0
                                           ? $"{nsVar.deref()}> "
                                           : new string('.', $"{nsVar.deref()}> ".Length), "")) != null)
                            {
                                if (input == "::panic!")
                                {
                                    sb.Clear();
                                    continue;
                                }

                                sb.AppendLine(input);
                                try
                                {
                                    Console.WriteLine(prStr.invoke(eval.invoke(readString.invoke(sb.ToString()))));
                                    sb.Clear();
                                }
                                catch (EndOfStreamException exception)
                                {
                                }
                                catch (Exception exception)
                                {
                                    Console.WriteLine("{0} {1}", exception.GetType(), exception.Message);
                                    sb.Clear();
                                }
                            }
                        }
                        finally
                        {
                            Var.popThreadBindings();
                        }
                    }).Start();
                };

                game.RenderFrame += (sender, e) =>
                {
                    GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);
                    foreach (var parameter in Demo.parameters)
                    {
                        parameter.Interpolate((float) e.Time);
                    }

                    d.Draw(game.Width, game.Height, e.Time);
                    game.SwapBuffers();
                    Demo._fps = game.RenderFrequency;
                    // TODO grab fps
                    // TODO grab frame render time
                };

                game.Resize += (sender, e) => { GL.Viewport(0, 0, game.Width, game.Height); };

                game.Run(60.0);
            }
        }
    }
}
