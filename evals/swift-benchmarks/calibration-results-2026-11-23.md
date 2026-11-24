# Remaining Swift Testing calibration and comparisons — 2026-11-23 Central

[MOV-278](https://linear.app/mothersound/issue/MOV-278/calibrate-remaining-swift-testing-cases-and-compare-pinned-skills) completed three baseline calibration attempts and twelve subsequent comparison attempts (one baseline plus three pinned skills per case). Fifteen executor attempts and fifteen grading invocations completed. This is exploratory case-level evidence, not a qualified effectiveness ranking.

## Calibration changed the task contracts

| Original case | Baseline raw grade | Audit qualification |
| --- | --- | --- |
| 203: dependency repair | 5/5 | Scoped isolated-state repair, product API/assertions/three inputs preserved; two test functions and three parameter argument invocations passed. |
| 202: confirmation review | 5/5 | Added payload-identity confirmations. Grader accepted additions despite the source-preservation criterion; broad review-coverage wording arguably allowed them. This grade is not proof of restraint. |
| 204: dependency review | 4/5 | Preserved source and correctly explained per-formatter independence. Lost a point for an actor-versus-ownership explanation the task did not explicitly request; a reporting/contract omission, not a demonstrated semantic error. |

Original cases, raw grades and captures are unchanged. The separate [review-controls v2 suite](testing-review-controls-v2.json) gives new IDs 302/304, explicit review-only source preservation, a defined review scope, requested explanations and a native-command budget. It reuses unchanged Swift fixtures, candidate pins and runtime profile. It was authored after inspecting calibration results and candidate sources; it is not blind held-out evidence. Scores from changed tasks must not be pooled with 202/204 or described as skill improvements.

## One-pass comparison observations

| Arm | Dependency repair 203 | Confirmation review 302 | Dependency review 304 |
| --- | --- | --- | --- |
| baseline | 5/5 | 5/5 | 5/5 |
| avdlee-testing | 5/5 | 5/5 | 5/5 |
| hudson-testing-compat | 5/5 | 4/5 | 5/5 |
| axiom-testing | 5/5 | 5/5 | 5/5 |

Hudson 302 retains its raw critical flag `[5]`: the command intended to read supplied source exited zero but its retained aggregated output was empty. RESULT.md exists; source was preserved; native tests passed; the semantic conclusion is correct. This is a **read-evidence visibility gap**, not a missing deliverable or a new Swift semantic failure. The final workspace capture being complete does not establish that every command output is visible. Do not attribute a model/pack-quality cause to this unresolved recording observation.

QA audited every attempt against the source diff, native execution evidence, RESULT and rubric. All eight new review-control attempts preserved supplied source and used exactly one verification invocation. All dependency repairs retained the product API, both independent assertions and all three parameter inputs. Final native runs completed two test functions; dependency fixtures additionally emitted all three parameter markers. Twenty actual wrapper invocations occurred across all fifteen attempts (including legitimate pre/post-edit verification and the original 202 coverage edit); no repeated-success loops were found. Documentation URLs cited from knowledge were not treated as live-retrieved sources.

## Interpretation and limits

- No confirmed semantic or product/test correctness failure was observed in this batch. All raw grades remain intact; audit qualifications are separate annotations, not historical regrades.
- Baseline solved the small dependency task, and the clean reviews measure scope adherence. No candidate advantage was demonstrated. Do not increase repetitions on these cases merely to inflate sample counts; use representative, independently authored multi-file tasks to test added value before expanding the campaign.
- Every run requested gpt-5.6-sol on Codex CLI 0.145.0. Resolved executor identity was absent and grader identity unknown, so every report remains comparable=false. Catalogue availability and --exploratory never substitute for observed identity.
- Comparison cohorts 203 and 304 overlapped 302 in separate disposable workspaces; arms within each cohort ran sequentially. No timing, performance or monetary-cost ranking is justified. Usage telemetry is incomplete for the full bill.
- The comparison cohorts included fresh baselines; calibration attempts were not replayed/reused or counted as extra repetitions of a matched cohort.
- The historical Hudson serialization failure from the first pilot remains a separate finding for that pinned historical revision. Passing other tasks does not erase it. No overall Swift-skill winner, full multi-domain campaign, Claude comparison or native UI/device qualification is claimed.

## Reproducible local artifacts

All campaigns are under ignored `evals/results/swift-benchmarks/`, retaining manifests, frozen inputs, raw traces, grades and host captures:

- Calibration 203: `2026-11-24T02-19-02-417Z-hip7nr/`.
- Calibration 202: `2026-11-24T02-20-32-366Z-i6nab4/`.
- Calibration 204: `2026-11-24T02-22-24-361Z-xSwkxi/`.
- Comparison 302: `2026-11-24T02-27-57-520Z-niZPyV/`; suite SHA-256 `c88e338d5abdc7c30b9cbfc97161808a317b40d0007d120fe77211c6604ae72b`.
- Comparison 203: `2026-11-24T02-29-52-834Z-OVTTXA/`; suite SHA-256 `39f54f49329776992cb64a11f91a9c8e19c6ec8cefa81b01bb1d7b2f37686c28`.
- Comparison 304: `2026-11-24T02-29-53-353Z-HDwaL2/`; suite SHA-256 `c88e338d5abdc7c30b9cbfc97161808a317b40d0007d120fe77211c6604ae72b`.

All six campaigns share harness SHA-256 `a68da1aea31b97748f08a8721222661eacd3758c833d94035a45ecc04cb7c34d`. No runner or native fixture was changed. CI now validates the new suite without model calls.

## Shared-workflow housekeeping

The three user-approved retrospective patches were committed locally in mothersound-agents as `0aacc210082e25df13f2f23bf46f98ec61f9b49f` on `chore/swift-eval-retro-workflow`. The checkout is clean, installed links reflect the committed source, and the commit has not been pushed. The agent-skills results use their own MOV-278 branch.
