"""Check frozen inputs, rebuild products, and check report references."""
from pathlib import Path
import hashlib
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, "scripts/figures.py"], cwd=root, check=True)
subprocess.run([sys.executable, "scripts/state_poll.py"], cwd=root, check=True)
for line in (root / "SHA256SUMS").read_text().splitlines():
    expected, filename = line.split("  ", 1)
    actual = hashlib.sha256((root / filename).read_bytes()).hexdigest()
    if actual != expected:
        raise SystemExit(f"Content differs from recorded artifact: {filename}")
report = (root / "REPORT.md").read_text()
for filename in re.findall(r"!\[[^\]]*\]\(([^)]+)\)", report):
    if not (root / filename).is_file():
        raise SystemExit(f"Missing figure: {filename}")
print("Verified input and rebuilt figure hashes, environment lock, and report images.")
