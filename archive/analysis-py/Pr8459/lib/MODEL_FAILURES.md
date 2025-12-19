# MODEL_FAILURES

1. **Repo Entry Point Mismatch** – MODEL_RESPONSE delivers a standalone `analyze_container_resources.py`, but the project requires the analyzer to live in `lib/analyse.py` so `scripts/analysis.sh` and other tooling can import it.
2. **No AWS Endpoint Overrides** – The reference script never honors `AWS_ENDPOINT_URL`/related env vars, so it can’t talk to the Moto/server endpoint the repo’s analysis workflow depends on.
3. **Tests Not Wired to Project Structure** – MODEL_RESPONSE’s pytest module is `test_analyze_container_resources.py` with bespoke helpers instead of the mandated `tests/test-analysis-py.py` + `tests/unit/test__unit__analysis.py` layout that `scripts/analysis.sh` expects.
4. **Integration Workflow Not Covered** – The reference tests only cover unit-level behaviors and never exercise the analyzer via the CLI/console path, so artifact generation (JSON/CSV/PNG + console table) isn’t validated the way this repository requires.
5. **EKS Pod Limit Check Simulated** – MODEL_RESPONSE hard-codes `pods_without_limits = 2` instead of inspecting metrics or pod data, leaving the “missing resource limits” requirement effectively unimplemented.
6. **Rightsizing CSV Not Guaranteed** – The reference script writes `rightsizing_plan.csv` only when findings exist, so CI jobs fail when a clean environment produces no file; our implementation always emits the schema.
7. **Moto Support for EKS Missing** – The reference tests call real `boto3.client("eks")` APIs that Moto doesn’t implement, so the suite can’t even set up node groups; we replaced this with a FakeEKSClient to mirror expected data.
8. **No Dependency Bootstrapping** – The model code imports pandas/matplotlib/seaborn unconditionally and assumes they are pre-installed, which breaks `scripts/analysis.sh` environments that don’t vendor those wheels. Our `_lazy_import` logic installs them on demand.
