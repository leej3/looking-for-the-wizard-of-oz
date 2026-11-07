"""Render published aggregate estimates without interpolation."""
import csv
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "figures"
OUT.mkdir(exist_ok=True)
plt.rcParams.update({"font.size": 11, "axes.spines.top": False,
                     "axes.spines.right": False, "axes.spines.left": False})

with (ROOT / "data/pew.csv").open() as stream:
    overall = next(csv.DictReader(stream))
topics = {"environment": "Environment", "energy": "Home energy costs",
          "quality": "Nearby quality of life", "jobs": "Local jobs", "tax": "Local tax revenue"}
fig, ax = plt.subplots(figsize=(8, 4.4), layout="constrained")
for y, key in enumerate(topics):
    jan, aug = [int(overall[f"{key}_{month}"]) for month in ("jan", "aug")]
    ax.plot([jan, aug], [y, y], color="#a6afb1", linewidth=3)
    for value, color, offset in [(jan, "#52667b", -3), (aug, "#9e461c", 3)]:
        ax.scatter(value, y, color=color, s=65)
        ax.text(value + offset, y, str(value), ha="center", va="center")
ax.set(yticks=list(range(5)), yticklabels=list(topics.values()), xlim=(0, 100),
       ylim=(4.5, -0.65), xlabel="U.S. adults saying the effect is mostly bad (%)")
ax.set_title("Perceived harms increased across all five questions", loc="left")
fig.text(0.99, 0.01, "Pew Research Center · January (blue) and August (orange), 2026",
         ha="right", fontsize=8)
fig.savefig(OUT / "opinion.png", dpi=160, pad_inches=0.2)
plt.close(fig)

with (ROOT / "data/energy.csv").open() as stream:
    records = list(csv.DictReader(stream))
fig, ax = plt.subplots(figsize=(6, 3.5), layout="constrained")
values = [int(row["estimate_twh"]) for row in records]
bars = ax.barh([row["year"] for row in records], values, color="#386b68", height=0.55)
ax.bar_label(bars, padding=6)
ax.set(xlim=(0, 210), xlabel="Annual electricity use (TWh)")
ax.set_title("U.S. data-center electricity consumption", loc="left")
fig.text(0.99, 0.01, "Berkeley Lab · historical estimates, 2024 report", ha="right", fontsize=8)
fig.savefig(OUT / "energy.png", dpi=160)
