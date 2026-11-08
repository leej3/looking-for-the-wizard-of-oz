# Behind the curtain research object

Read [the report and bibliography](REPORT.md).
The figure inputs, analysis code, outputs, environment lock, and local Git history travel together.
The reference design is [STAMPED examples PR 40](https://github.com/stamped-principles/stamped-examples/pull/40), inspected at head 9ad4eda90c5b71867c0c8d84b21eca4373872ed1.
This small object uses plain Git to version its data and outputs, and Pixi for the execution environment.

## Reproduce

On Apple Silicon macOS with Pixi installed, run from this folder:

```sh
pixi install --locked
pixi run --locked figures
pixi run --locked verify
git log --reverse --stat
```

The first installation requires network access.
Figure generation and verification work offline once installed.
Verification rebuilds the PNGs and compares SHA-256 digests with the creation record.
The platform and Matplotlib version are pinned by pixi.lock.
The primary text is authored Markdown; editing the interpretation is a human editorial action.

## Creation record

1. November 7, 2026.
   Reviewed the supplied Oz image, discussion, and cited literature.
   Preserved the image as background.
   The museum source supplies the historical attribution.
2. Manually transcribed the published aggregate table in bibliography item 4, appendix on mostly-bad effects.
   Selected the overall, four age, three community-type, and two party rows, retaining all five questions.
   Columns are whole percentages for January and August 2026; quality means quality of life nearby, and tax means local tax revenue.
   Subgroups overlap across dimensions and must never be added.
   The two historical electricity totals in data/energy.csv come from item 10’s endpoint summary.
   These are modeled annual TWh for all U.S. data centers.
   No respondent microdata or state vote-opinion linkage is included.
3. Initialized local Git, recorded source observations and installed the locked environment.
   Wrote scripts/figures.py, ran the figures task, and integrated the PNGs into REPORT.md with source and scope captions.
4. Compiled the bibliography and audited the separation of perceptions, historical estimates, projections, and counterfactuals.
   Recorded checksums and reran verify.
   Use git log for the authored stages and diffs.
   The source extracts are frozen at the research date; external articles may subsequently change.

To update, compare each CSV against the new source tables, preserve its survey dates and wording, regenerate figures, review captions and interpretations, and record reviewed hashes in a new revision.

November 8, 2026.
Added the Oregon Issue 25 case using reported county filing figures, preliminary returns, and a direct developer statement.
Bibliography entries 17–19 identify the source for each step.
November 8, 2026.
Added the Switch covenant litigation and Osawatomie legal fundraiser.
Checked the Nevada district court order, developer response, public donor entries, and reporting on the Kansas petition.
Bibliography entries 20–23 preserve the evidence trail.
November 8, 2026.
Compared grantmaker purpose statements, recipient disclosures, and site-specific actions in New York, Pennsylvania, and Virginia.
Sources 24–29 document the scope and unresolved attribution of each award.
November 8, 2026.
Compared existing capacity and blocked development in Prince William County and Oregon, Ohio.
Sources 30–32 distinguish marketed campus capacity, proposed electric load, and realized outcomes.

## State-level election analysis

On November 8, 2026 the state analysis captured the October 12 DCMap aggregate snapshot and selected public CNN/SSRS poll questions.
The DCMap research skill and the Workshop database-lookup skill guided retrieval.
Use `pixi run --locked python scripts/state_poll.py` for an offline rebuild; add `--fetch` only to refresh the inputs.
Live sources can change.

The exposure file includes 50 states, excluding DC and territories.
The inventory probes one regular Senate and one governor main poll in each state.
It found 33 Senate and 36 governor tables across 45 distinct states; IN, MO, ND, UT and WA lack both in this retrieval.
Special elections, primaries, and national House polls are outside this comparison.
Each poll record includes source time, source URL, and total race respondents.
A missing percentage denotes an unavailable or suppressed estimate.
Total respondents is never a subgroup sample size.

The joined CSV has one row per state, office, question and answer.
In the Texas Senate poll, 75% opposed a local facility, 65% of opponents backed the Democratic candidate, and 88% of Democratic-candidate voters opposed the facility.
These correspond to pct_electorate, pct_voting_dem, and pct_among_dem_voters, respectively. pct_among_rep_voters uses the Republican candidate as its denominator.
None of the latter three fields is a registered-party indicator.
The Party ID question separately captures self-identification.
State exposure metrics repeat across rows; each correlation uses each state at most once per office and category.

The correlation file lists the included states for every estimate with at least eight usable states.
Positive published MW totals qualify for MW analyses (zero disclosed MW cannot establish zero capacity); counts include zero.
Water averages require a matched score.
The exposure file includes record and additive-envelope coverage for power, plus the water match denominator.
Counts are facility, campus, or project records.
Additive power totals avoid duplicating shared envelopes, and stage labels describe October status.
The two source extracts, inventory, joined table, correlations and figure are checksummed.
Verification regenerates the analysis offline.
November 8, 2026.
Revised the interpretation of the state analysis: retained the reproducible aggregates and retired the correlation figure from the report narrative because geography and survey denominators do not support an exposure-based account of voter motives.
