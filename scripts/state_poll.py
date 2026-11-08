"""Fetch selected public state aggregates or reproduce the rank analysis offline."""
import argparse
import csv
import io
import json
import math
import statistics
import subprocess
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data"
API = "https://dcmap.us/agent-api/v2"
STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split()
QUESTIONS = {159, 11001, 260, 1951, 248, 100351, 100356, 100359}


def fetch(url):
    result = subprocess.run(["curl", "-sSL", "--retry", "2", "--max-time", "30",
                             "-w", "\n%{http_code}", url], check=True, capture_output=True)
    body, status = result.stdout.rsplit(b"\n", 1)
    if status == b"404":
        return None
    if status != b"200":
        raise RuntimeError(f"{url}: HTTP {status!r}")
    return json.loads(body)


def encode(rows):
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=rows[0], lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()


def read(name):
    with (DATA / name).open() as stream:
        return list(csv.DictReader(stream))


def capture():
    summary = fetch(f"{API}/summary.json")
    states = fetch(f"{API}/states.json")
    assert states["data_as_of"] == summary["data_as_of"]
    exposure, votes, inventory = [], [], []
    for row in states["data"]:
        state = row["code"]
        if state not in STATES:
            continue
        water = row["water_stress"]["score"]
        entry = dict(state=state, as_of=states["data_as_of"], source=row["source_url"],
                     water_score=water["average"], water_n=water["record_count"],
                     counted_records=row["counted_physical_record_count"])
        for status in ("operational", "construction", "planned"):
            entry[f"{status}_n"] = row["status_counts"].get(status, 0)
            entry[f"{status}_mw"] = row["reported_power_by_status_mw"].get(status)
        for key, value in row["power_coverage"].items():
            entry[key] = value
        exposure.append(entry)

    # One main file per office and state; no double-counting across offices.
    for state in STATES:
        for office in ("SG", "GG"):
            url = f"https://politics.api.cnn.io/results/exit-poll/2026-{office}-{state}.json"
            d = fetch(url)
            time.sleep(0.08)
            inventory.append(dict(state=state, office=office, source=url,
                                  available=int(bool(d and d.get("hasData")))))
            if not inventory[-1]["available"]:
                continue
            assert d["state"]["abbreviation"] == state and d["electionDate"] == "2026-11-03"
            dem = {c["candidateId"] for c in d["candidates"] if c["majorPartyId"] == "DEM"}
            rep = {c["candidateId"] for c in d["candidates"] if c["majorPartyId"] == "REP"}
            for q in d["questions"]:
                if q["mxId"] not in QUESTIONS:
                    continue
                for a in q["answers"]:
                    candidates = [c for c in a["candidateAnswers"] if c["candidateId"] in dem]
                    c = candidates[0] if len(candidates) == 1 else {}
                    republicans = [c for c in a["candidateAnswers"] if c["candidateId"] in rep]
                    r = republicans[0] if len(republicans) == 1 else {}
                    def pct(value):
                        return value if isinstance(value, (float, int)) and 0 <= value <= 100 else None
                    votes.append(dict(state=state, office=office, question_id=q["mxId"],
                                      question=q["question"], answer=a["answer"].strip(),
                                      pct_electorate=pct(a["totalPercentage"]),
                                      pct_voting_dem=pct(c.get("percentage")),
                                      pct_among_dem_voters=pct(c.get("vPercentage")),
                                      pct_among_rep_voters=pct(r.get("vPercentage")),
                                      total_respondents=d["respondents"], source_time=d["timestamp"],
                                      source=url))
    assert {r["state"] for r in exposure} == set(STATES)
    for name, rows in [("state_exposure.csv", exposure), ("state_poll.csv", votes),
                       ("state_poll_inventory.csv", inventory)]:
        (DATA / name).write_text(encode(rows))


def ranks(values):
    positions = defaultdict(list)
    for pos, value in enumerate(sorted(values), 1):
        positions[value].append(pos)
    return [statistics.mean(positions[v]) for v in values]


def analyze():
    states = {r["state"]: r for r in read("state_exposure.csv")}
    joined = []
    groups = defaultdict(list)
    for row in read("state_poll.csv"):
        metric = "pct_electorate" if row["question_id"] in ("100356", "100359") else "pct_voting_dem"
        state = states[row["state"]]
        joined.append({**row, **{k: state[k] for k in ("as_of", "operational_mw", "construction_mw", "planned_mw", "water_score", "water_n", "counted_records")}, "map_source": state["source"]})
        if row["question_id"] in ("100356", "100359"):
            for column in ("pct_among_dem_voters", "pct_among_rep_voters"):
                if row[column]:
                    groups[(row["office"], row["question"], row["answer"], column)].append((state, float(row[column])))
        if row[metric]:
            groups[(row["office"], row["question"], row["answer"], metric)].append(
                (states[row["state"]], float(row[metric])))
    (DATA / "state_joined.csv").write_text(encode(joined))
    results = []
    fig, axes = plt.subplots(1, 3, figsize=(11, 3.5), layout="constrained")
    fields = ["operational_mw", "construction_mw", "planned_mw", "water_score", "operational_n", "construction_n", "planned_n"]
    for key, group in sorted(groups.items()):
        for field in fields:
            pairs = [(s, y) for s, y in group if s[field] and
                     (not field.endswith("_mw") or float(s[field]) > 0)]
            if len(pairs) < 8:
                continue
            x = [float(s[field]) for s, _ in pairs]
            y = [y for _, y in pairs]
            if len(set(x)) < 2 or len(set(y)) < 2:
                continue
            rho = float(np.corrcoef(ranks(x), ranks(y))[0, 1])
            results.append(dict(office=key[0], question=key[1], answer=key[2],
                                metric=key[3], exposure=field, states=len(pairs),
                                rho=round(rho, 3), included_states=" ".join(sorted(s["state"] for s, _ in pairs))))
            if key[0] == "SG" and key[2] == "Oppose" and key[3] == "pct_electorate" and field in ("operational_mw", "planned_mw", "water_score"):
                ax = axes[["operational_mw", "planned_mw", "water_score", "operational_n", "construction_n", "planned_n"].index(field)]
                ax.scatter(x, y, color="#216864", s=20)
                if field != "water_score":
                    ax.set_xscale("log")
                ax.set(xlabel={"planned_mw":"Planned MW (log scale)", "operational_mw":"Operational MW (log scale)",
                               "water_score":"Mean site water-stress score"}[field],
                       title=f"ρ = {rho:.2f} · {len(x)} states")
    axes[0].set_ylabel("Oppose a local data center (%)")
    fig.suptitle("2026 Senate voter polls, one observation per state")
    fig.savefig(BASE / "figures/state_opposition.png", dpi=160)
    plt.close(fig)
    (DATA / "state_correlations.csv").write_text(encode(results))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--fetch", action="store_true")
    args = parser.parse_args()
    if args.fetch:
        capture()
    analyze()
