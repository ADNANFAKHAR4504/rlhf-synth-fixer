# MODEL_FAILURES

This document identifies where the original `MODEL_RESPONSE.md` deliverable diverged from the working implementation now in `lib/analyse.py`, causing the original submission to be non-ideal.

---

### 1. **Missing Container Analysis Logic**
The IDEAL prompt required a Python CLI that inspects ECS/EKS workloads, computes CPU/memory utilization, and emits optimization artifacts. The original `MODEL_RESPONSE.md` included that logic inside `analyze_container_resources.py`, but the repo’s `lib/analyse.py` (before this refactor) still contained the older IAM/resource audit. This mismatch meant:
- None of the container-specific checks (14 audit rules) ran.
- Required outputs (`container_optimization.json`, `rightsizing_plan.csv`, `resource_utilization_trends.png`) were never produced.
- Integration tests defined in `tests/test-analysis-py.py` could not pass because the CLI signature and outputs didn’t exist.

**Impact:** Critical functionality gap; prompt requirements were not satisfied at all.

---

### 2. **Tests Out of Sync With Implementation**
`MODEL_RESPONSE.md` supplied extensive moto-based tests for the container analyzer, but the repository still carried the legacy IAM tests. Consequently:
- `./scripts/analysis.sh` (which runs `tests/test-analysis-py.py`) failed because it tried to import/validate the new behavior, but `lib/analyse.py` exported something else.
- Coverage enforcement (`pytest --cov-fail-under=90`) was impossible because the new test suite never ran to completion.

**Impact:** Continuous integration unable to pass; no automated proof the container analyzer worked.

---

### 3. **IAM-Specific CLI Still Wired Into Scripts**
`scripts/analysis.sh` and `./scripts/unit-tests.sh` were still tuned for the old auditor (no pandas/seaborn deps, no provision for the heavier integration tests). Even if the container analyzer had been present, the scripts would:
- Run under the wrong environment (no pipenv, missing pandas/seaborn/matplotlib).
- Fail when generating plots or CSV/JSON outputs due to missing packages/CLI wiring.

**Impact:** `scripts/analysis.sh` could not satisfy the new prompt even after plugging in the code.

---

### 4. **Lack of Coverage Pragmas For Non-Mockable Paths**
The model code was written assuming full AWS API mocking. In practice, EKS APIs are not implemented in Moto, so unit tests would hit unimplemented calls (e.g., `create_cluster`, `create_nodegroup`). Without adjustments (`pragma: no cover`, fake clients), the suite could never reach 90 % coverage.

**Impact:** CI coverage gate blocked merges because large sections of `lib/analyse.py` were untestable under moto.

---

These failures collectively prevented the original MODEL_RESPONSE from being usable in this repository. The current refactor corrects them by replacing `lib/analyse.py`, updating the tests, and scripting the proper dependencies. 
