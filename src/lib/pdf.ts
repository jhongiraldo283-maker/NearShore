// pdfjs-dist (used internally by pdf-parse) references `DOMMatrix` for text-positioning math
// even during plain text extraction. In a browser that global exists natively; in some
// serverless Node runtimes (observed on Vercel) its own fallback — which tries to borrow
// `DOMMatrix` from the optional `@napi-rs/canvas` native dependency — fails silently, leaving
// `DOMMatrix` undefined and crashing with "DOMMatrix is not defined". This installs a minimal,
// dependency-free polyfill implementing only the 2D affine-matrix operations pdfjs actually
// calls, so we never depend on a native canvas binary being loadable at runtime.
function installDomMatrixPolyfill() {
  if (typeof (globalThis as Record<string, unknown>).DOMMatrix !== "undefined") return;

  class MinimalDOMMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;

    constructor(init?: number[]) {
      if (Array.isArray(init) && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      } else {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
      }
    }

    multiply(o: MinimalDOMMatrix): MinimalDOMMatrix {
      return new MinimalDOMMatrix([
        this.a * o.a + this.c * o.b,
        this.b * o.a + this.d * o.b,
        this.a * o.c + this.c * o.d,
        this.b * o.c + this.d * o.d,
        this.a * o.e + this.c * o.f + this.e,
        this.b * o.e + this.d * o.f + this.f,
      ]);
    }

    multiplySelf(o: MinimalDOMMatrix): this {
      return this.assign(this.multiply(o));
    }

    preMultiplySelf(o: MinimalDOMMatrix): this {
      return this.assign(o.multiply(this));
    }

    translate(tx: number, ty = 0): MinimalDOMMatrix {
      return this.multiply(new MinimalDOMMatrix([1, 0, 0, 1, tx, ty]));
    }

    scale(sx: number, sy = sx): MinimalDOMMatrix {
      return this.multiply(new MinimalDOMMatrix([sx, 0, 0, sy, 0, 0]));
    }

    invertSelf(): this {
      const det = this.a * this.d - this.b * this.c;
      if (det === 0) {
        return this.assign(new MinimalDOMMatrix([NaN, NaN, NaN, NaN, NaN, NaN]));
      }
      const { a, b, c, d, e, f } = this;
      return this.assign(
        new MinimalDOMMatrix([d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det])
      );
    }

    private assign(m: MinimalDOMMatrix): this {
      this.a = m.a;
      this.b = m.b;
      this.c = m.c;
      this.d = m.d;
      this.e = m.e;
      this.f = m.f;
      return this;
    }
  }

  (globalThis as Record<string, unknown>).DOMMatrix = MinimalDOMMatrix;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  installDomMatrixPolyfill();
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
