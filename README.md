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
