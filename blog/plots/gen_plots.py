#!/usr/bin/env python3
"""Generate the SVG figures for compounding_iterations_v2.md.

Pure standard library, no matplotlib. Each function writes one self-contained
SVG file into this directory. Re-run with:  python3 gen_plots.py
"""
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))

W, H = 660, 400
ML, MR, MT, MB = 70, 20, 54, 50  # margins (MT leaves room for a title)
PW, PH = W - ML - MR, H - MT - MB  # plot area

# Dark "Blade Runner" palette matching the site (style.css :root)
BG = "#0c1a28"    # panel, close to the blog card background
INK = "#d8e2ea"   # primary text and the total-outline line
GRID = "#1e3646"  # faint grid on dark
AXIS = "#6b8194"  # muted axis text and frame
C1 = "#01c6c7"    # cyan   (deposits / base / first series)
C2 = "#f4683c"    # orange (compounding)
C3 = "#ffd166"    # yellow (third series)
C4 = "#9945ff"    # purple (decay)

FONT = ("-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, "
        "'Helvetica Neue', Arial, sans-serif")


def _sx(x, xmin, xmax):
    return ML + (x - xmin) / (xmax - xmin) * PW


def _sy(y, ymin, ymax):
    return MT + (1 - (y - ymin) / (ymax - ymin)) * PH


def _header():
    return [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
            f'font-family="{FONT}" font-size="13" fill="{INK}">',
            f'<rect x="0" y="0" width="{W}" height="{H}" rx="8" fill="{BG}"/>']


def _title(parts, text):
    parts.append(f'<text x="{W/2:.0f}" y="30" text-anchor="middle" '
                 f'font-size="16" font-weight="600" fill="{INK}">{text}</text>')


def _axes(parts, xmin, xmax, ymin, ymax, xlabel, ylabel, xticks, yticks,
          xfmt=lambda v: f"{v:g}", yfmt=lambda v: f"{v:g}"):
    # frame
    parts.append(f'<rect x="{ML}" y="{MT}" width="{PW}" height="{PH}" '
                 f'fill="none" stroke="{AXIS}" stroke-width="1"/>')
    for xv in xticks:
        px = _sx(xv, xmin, xmax)
        parts.append(f'<line x1="{px:.1f}" y1="{MT}" x2="{px:.1f}" y2="{MT+PH}" '
                     f'stroke="{GRID}" stroke-width="1"/>')
        parts.append(f'<text x="{px:.1f}" y="{MT+PH+18}" text-anchor="middle" '
                     f'fill="{AXIS}">{xfmt(xv)}</text>')
    for yv in yticks:
        py = _sy(yv, ymin, ymax)
        parts.append(f'<line x1="{ML}" y1="{py:.1f}" x2="{ML+PW}" y2="{py:.1f}" '
                     f'stroke="{GRID}" stroke-width="1"/>')
        parts.append(f'<text x="{ML-8}" y="{py+4:.1f}" text-anchor="end" '
                     f'fill="{AXIS}">{yfmt(yv)}</text>')
    parts.append(f'<text x="{ML+PW/2:.0f}" y="{H-10}" text-anchor="middle" '
                 f'fill="{INK}">{xlabel}</text>')
    parts.append(f'<text x="16" y="{MT+PH/2:.0f}" text-anchor="middle" '
                 f'fill="{INK}" transform="rotate(-90 16 {MT+PH/2:.0f})">{ylabel}</text>')


def _poly(xs, ys, xmin, xmax, ymin, ymax, color, width=2.2, dash=None):
    pts = " ".join(f"{_sx(x,xmin,xmax):.1f},{_sy(y,ymin,ymax):.1f}" for x, y in zip(xs, ys))
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<polyline points="{pts}" fill="none" stroke="{color}" '
            f'stroke-width="{width}"{d}/>')


def _area(xs, y_lo, y_hi, xmin, xmax, ymin, ymax, color, opacity=0.85):
    top = " ".join(f"{_sx(x,xmin,xmax):.1f},{_sy(y,ymin,ymax):.1f}" for x, y in zip(xs, y_hi))
    bot = " ".join(f"{_sx(x,xmin,xmax):.1f},{_sy(y,ymin,ymax):.1f}"
                   for x, y in zip(reversed(xs), reversed(y_lo)))
    return f'<polygon points="{top} {bot}" fill="{color}" opacity="{opacity}"/>'


def _legend(parts, items, x, y):
    for i, (color, label, dash) in enumerate(items):
        yy = y + i * 20
        d = f' stroke-dasharray="{dash}"' if dash else ""
        parts.append(f'<line x1="{x}" y1="{yy}" x2="{x+26}" y2="{yy}" '
                     f'stroke="{color}" stroke-width="3"{d}/>')
        parts.append(f'<text x="{x+32}" y="{yy+4}" fill="{INK}">{label}</text>')


def _write(name, parts):
    parts.append("</svg>")
    with open(os.path.join(HERE, name), "w") as f:
        f.write("\n".join(parts))
    print("wrote", name)


# ---------------------------------------------------------------- plot 1
def plot1_deposits():
    """Value as additive learning plus compounding.

    Q_next = (1+r) Q + C, with Q0 = 0. The learning band is C*n (the value each
    cycle adds, linear). The compounding band is everything above it, the
    part that compounds because the loop earns r on the current value.
    """
    C_dep, r = 10.0, 0.05
    Ns = list(range(0, 61))
    deposits = [C_dep * N for N in Ns]                              # learning alone
    total = [(C_dep / r) * ((1 + r) ** N - 1) for N in Ns]          # annuity closed form
    ymax = 3600
    p = _header()
    _title(p, "Learning is linear; only the loop compounds")
    xt = [0, 10, 20, 30, 40, 50, 60]
    yt = [0, 600, 1200, 1800, 2400, 3000, 3600]
    _axes(p, 0, 60, 0, ymax, "number of iterations n",
          "cumulative value (early phase, no ceiling)", xt, yt)
    p.append(_area(Ns, [0] * len(Ns), deposits, 0, 60, 0, ymax, C1, 0.85))
    p.append(_area(Ns, deposits, total, 0, 60, 0, ymax, C2, 0.85))
    p.append(_poly(Ns, total, 0, 60, 0, ymax, INK, 1.6))
    _legend(p, [(C1, "learning  (C x n: additive, linear)", None),
                (C2, "compounding  (r·Q: multiplies value)", None)],
            ML + 14, MT + 22)
    _write("plot1_deposits.svg", p)


# ---------------------------------------------------------------- plot 2
def plot2_ceiling():
    """A single product S-curve, with the no-ceiling reference."""
    r = 0.05
    Qmax = 100.0
    k, N0 = 0.16, 28
    Ns = list(range(0, 61))
    comp = [min(400, 8 * (1 + r) ** N) for N in Ns]          # no-ceiling reference
    logi = [Qmax / (1 + math.exp(-k * (N - N0))) for N in Ns]  # the product curve
    ymax = 120
    p = _header()
    _title(p, "A product's value saturates into a single S-curve")
    _axes(p, 0, 60, 0, ymax, "number of iterations n", "delivered product value",
          [0, 10, 20, 30, 40, 50, 60], [0, 20, 40, 60, 80, 100, 120])
    # ceiling line
    p.append(f'<line x1="{_sx(0,0,60):.1f}" y1="{_sy(Qmax,0,ymax):.1f}" '
             f'x2="{_sx(60,0,60):.1f}" y2="{_sy(Qmax,0,ymax):.1f}" '
             f'stroke="{AXIS}" stroke-width="1" stroke-dasharray="3,3"/>')
    p.append(f'<text x="{_sx(60,0,60)-4:.1f}" y="{_sy(Qmax,0,ymax)-6:.1f}" '
             f'text-anchor="end" fill="{AXIS}">ceiling: best the product can be for a typical user</text>')
    p.append(_poly(Ns, comp, 0, 60, 0, ymax, C2, 2.0, dash="6,5"))   # no-ceiling reference
    p.append(_poly(Ns, logi, 0, 60, 0, ymax, C1, 2.8))              # product value
    _legend(p, [(C1, "product value (single S-curve)", None),
                (C2, "same compounding, no ceiling", "6,5")],
            ML + 14, MT + 22)
    _write("plot2_ceiling.svg", p)


# ---------------------------------------------------------------- plot 3
def plot3_amdahl():
    """Overall speedup vs iteration speedup, for several iteration-gated fractions."""
    ks = [1 + i * 0.1 for i in range(0, 91)]   # 1x .. 10x
    ymax = 10
    p = _header()
    _axes(p, 1, 10, 0, ymax, "iterate this many times faster (k)",
          "how much faster you reach the target", [1, 2, 4, 6, 8, 10],
          [0, 2, 4, 6, 8, 10], xfmt=lambda v: f"{v:g}x", yfmt=lambda v: f"{v:g}x")
    colors = {0.5: C1, 0.7: C3, 0.9: C2}
    for f in (0.5, 0.7, 0.9):
        ys = [1 / ((1 - f) + f / k) for k in ks]
        p.append(_poly(ks, ys, 1, 10, 0, ymax, colors[f], 2.4))
        cap = 1 / (1 - f)
        p.append(f'<line x1="{_sx(1,1,10):.1f}" y1="{_sy(cap,0,ymax):.1f}" '
                 f'x2="{_sx(10,1,10):.1f}" y2="{_sy(cap,0,ymax):.1f}" '
                 f'stroke="{colors[f]}" stroke-width="1" stroke-dasharray="2,4" opacity="0.7"/>')
    _legend(p, [(C1, "f = 0.5 of progress is iteration-gated (cap 2x)", None),
                (C3, "f = 0.7  (cap 3.3x)", None),
                (C2, "f = 0.9  (cap 10x)", None)], ML + 14, MT + 22)
    _write("plot3_amdahl.svg", p)


# ---------------------------------------------------------------- plot 4
def plot4_decay():
    """Faster iteration dilutes rate-per-iteration; outcome can be an inverted U."""
    r0 = 0.05
    N0 = 20                      # baseline iterations over the horizon
    d = 0.01                     # rate lost per unit of extra speed
    ks = [1 + i * 0.1 for i in range(0, 91)]   # speedup 1x..10x
    ideal, decayed = [], []
    for k in ks:
        N = N0 * k
        # no decay: full rate every iteration
        ideal.append((1 + r0) ** N - 1)
        # decay: each iteration is less validated, so rate shrinks with speed
        # and can go negative (shipping regressions / tech debt)
        r_eff = r0 - d * (k - 1)
        decayed.append((1 + r_eff) ** N - 1 if r_eff > -1 else -1)
    ymax = max(max(decayed) * 1.4, 6)
    # cap ideal for display so decayed stays visible
    ideal_disp = [min(y, ymax) for y in ideal]
    p = _header()
    _title(p, "There is a best iteration speed, not faster is better")
    yt = [round(i, 1) for i in _nice_ticks(0, ymax, 6)]
    _axes(p, 1, 10, 0, ymax, "iterate this many times faster (k)",
          "cumulative gain over fixed horizon", [1, 2, 4, 6, 8, 10], yt,
          xfmt=lambda v: f"{v:g}x", yfmt=lambda v: f"{v:g}x")
    p.append(_poly(ks, ideal_disp, 1, 10, 0, ymax, C1, 2.4))
    p.append(_poly(ks, decayed, 1, 10, 0, ymax, C4, 2.4))
    # mark the peak of the decayed curve
    peak_i = max(range(len(decayed)), key=lambda i: decayed[i])
    px, py = _sx(ks[peak_i], 1, 10), _sy(decayed[peak_i], 0, ymax)
    p.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="3.5" fill="{C4}"/>')
    p.append(f'<text x="{px+6:.1f}" y="{py-6:.1f}" fill="{C4}">best speed ~{ks[peak_i]:.1f}x</text>')
    _legend(p, [(C1, "rate holds every iteration (optimistic)", None),
                (C4, "rate decays with speed (less validation)", None)],
            ML + 14, MT + 22)
    _write("plot4_decay.svg", p)


# ---------------------------------------------------------------- plot 5
def plot5_feedback():
    """Learning cycles in fixed calendar time vs build speedup, by learning latency.

    A learning cycle is build then learn. Over a fixed horizon T the number
    of cycles is T / (build_time/k + learning_time). Speeding the build (k) only
    helps until learning latency dominates, which sets a hard ceiling.
    """
    T = 20.0                     # fixed calendar horizon, in baseline build times
    ks = [1 + i * 0.1 for i in range(0, 91)]     # build speedup 1x..10x
    lats = [(0.0, C2, "learning is instant"),
            (1.0, C1, "learning = 1 build time"),
            (3.0, C3, "learning = 3 build times"),
            (9.0, C4, "learning = 9 build times")]
    ymax = 22
    p = _header()
    _title(p, "Slow learning caps the payoff of faster builds")
    _axes(p, 1, 10, 0, ymax, "build this many times faster (k)",
          "learning cycles completed in fixed time", [1, 2, 4, 6, 8, 10],
          [0, 5, 10, 15, 20], xfmt=lambda v: f"{v:g}x")
    for ft, color, _ in lats:
        ys = [min(ymax, T / (1.0 / k + ft)) for k in ks]
        p.append(_poly(ks, ys, 1, 10, 0, ymax, color, 2.4))
        if ft > 0:
            cap = T / ft
            p.append(f'<line x1="{_sx(1,1,10):.1f}" y1="{_sy(cap,0,ymax):.1f}" '
                     f'x2="{_sx(10,1,10):.1f}" y2="{_sy(cap,0,ymax):.1f}" '
                     f'stroke="{color}" stroke-width="1" stroke-dasharray="2,4" opacity="0.6"/>')
    _legend(p, [(c, lbl, None) for _, c, lbl in lats], ML + 14, MT + 22)
    _write("plot5_feedback.svg", p)


# ---------------------------------------------------------------- plot 6
def plot6_conservation():
    """Once the rate is divided by the iterations, R/n, iterating once a year
    lands almost exactly where infinite iterations do: (1+R/n)^n only creeps
    from (1+R) up to e^R.
    """
    R = 0.1
    ns = list(range(1, 25))
    real = [(1 + R / n) ** n for n in ns]           # rate divided by n
    cap = math.e ** R                               # e^R limit as n -> infinity
    ylo, yhi = 1.098, 1.108
    p = _header()
    _title(p, "Infinitely more iterations produces a miniscule value multiplier")
    _axes(p, 1, 24, ylo, yhi, "iterations the period is split into (n)",
          "outcome multiplier", [1, 4, 8, 12, 16, 20, 24],
          [1.100, 1.102, 1.104, 1.106, 1.108], yfmt=lambda v: f"{v:.3f}x")
    # e^R limit (infinite iterations)
    p.append(f'<line x1="{_sx(1,1,24):.1f}" y1="{_sy(cap,ylo,yhi):.1f}" '
             f'x2="{_sx(24,1,24):.1f}" y2="{_sy(cap,ylo,yhi):.1f}" '
             f'stroke="{AXIS}" stroke-width="1" stroke-dasharray="3,3"/>')
    p.append(f'<text x="{_sx(24,1,24)-4:.1f}" y="{_sy(cap,ylo,yhi)-7:.1f}" '
             f'text-anchor="end" fill="{AXIS}">infinite iterations: e^R = 1.105</text>')
    p.append(_poly(ns, real, 1, 24, ylo, yhi, C1, 2.6))
    # mark the once-a-year starting point
    p.append(f'<circle cx="{_sx(1,1,24):.1f}" cy="{_sy(real[0],ylo,yhi):.1f}" '
             f'r="3.5" fill="{C1}"/>')
    p.append(f'<text x="{_sx(1,1,24)+9:.1f}" y="{_sy(real[0],ylo,yhi)+4:.1f}" '
             f'fill="{C1}">once a year: 1.100</text>')
    _legend(p, [(C1, "rate divided by n:  (1 + R/n)^n", None)], ML + 14, MT + 22)
    _write("plot6_conservation.svg", p)


def _nice_ticks(lo, hi, n):
    step = (hi - lo) / n
    mag = 10 ** math.floor(math.log10(step))
    for m in (1, 2, 2.5, 5, 10):
        if m * mag >= step:
            step = m * mag
            break
    t, out = lo, []
    while t <= hi + 1e-9:
        out.append(t)
        t += step
    return out


if __name__ == "__main__":
    plot6_conservation()
    plot1_deposits()
    plot2_ceiling()
    plot4_decay()
    plot5_feedback()
    # plot3_amdahl() is retained above as the general Amdahl form but is not
    # used in the post; plot5_feedback is the concrete learning-loop version.
