#  CI/CD Pipeline Optimization for GCP ML Platform (Single Workflow)

You are an expert DevOps / CI/CD engineer.  
Act like you are reviewing and then implementing a **production-grade GitHub Actions workflow** for a **GCP-based Machine Learning platform**.

The project is part of a sequence of “CI/CD optimization” tasks .  
For this task, we want a **single GitHub Actions workflow file** (`.github/workflows/ci-cd.yml`) that covers:

---

## 1. Platform & Tech Stack

- Cloud: **Google Cloud Platform (GCP)**
- ML services:
  - **Vertex AI** for model registry & online prediction endpoints
  - **Cloud Run** for serving containerized microservices
  - **GKE** for batch inference workloads
- Artifact & data:
  - **Artifact Registry** for Docker images
  - **Google Cloud Storage (GCS)** for model artifacts (ONNX / joblib)
- CI/CD:
  - **GitHub Actions** with **Workload Identity Federation (WIF)**  
    – no long-lived service account keys

- Code stack:
  - **Python 3.11**
  - Dependency management: **Poetry**
  - Tests: `pytest`

---

## 2. High-Level CI/CD Flow (Jobs in Single Workflow)

We want ONE workflow file (`ci-cd.yml`) with jobs wired like this:

1. ### `validation`
   Static checks & basic validations:
   - Python:
     - `black --check .`
     - `pylint` on tracked `.py` files
     - `mypy .`
     - `bandit -r .`
     - `detect-secrets scan --all-files`
   - Docker:
     - `hadolint` against the root `Dockerfile`
   - Git history:
     - `gitleaks detect --no-banner --redact --source .`
   - Terraform:
     - `terraform init -input=false` in `infra/`
     - `terraform validate` in `infra/`

2. ### `tests`
   - Run unit/integration tests using Poetry:
     - Install Poetry and project dependencies.
     - Run `pytest`.

3. ### `docker_build_push`
   - Only on `main` branch.
   - After `tests`.
   - Use **Workload Identity Federation** to authenticate to GCP.
   - Configure Docker to push to **Artifact Registry**:
     - Registry host: `${GCP_REGION}-docker.pkg.dev`
     - Repository: `${GCP_PROJECT_ID}/ml-platform`
     - Image name: `ml-app`
   - Build and push image:  
     `REGISTRY_HOST/REGISTRY_REPO/IMAGE_NAME:${GITHUB_SHA}`

4. ### `model-build`
   - After `tests`.
   - Python 3.11 + Poetry.
   - Uses **WIF** + `gcloud`.
   - Calls a shell script `scripts/train_model.sh` that must:
     - Create a version identifier, e.g. `vYYYYMMDDHHMMSS_<short-sha>`.
     - Train the model via `poetry run python train.py --model-dir <version dir>`.
       - You can assume `train.py` exists at repo root.
     - Save artifacts (ONNX/joblib/etc.) into a versioned folder:
       - e.g. `artifacts/models/<VERSION>/`.
     - Upload artifacts to GCS:
       - Bucket: `${GCS_MODEL_BUCKET}`
       - Path: `gs://${GCS_MODEL_BUCKET}/models/<VERSION>/...`
     - Write the version string into a `.model_version` file at repo root.
   - The job must upload `.model_version` as a GitHub Actions artifact named `model-version`.

5. ### `infra-deploy`
   - Needs: `docker_build_push` and `model-build`.
   - Only on `main` branch.
   - Environment: `staging`.
   - Uses WIF to authenticate to GCP.
   - Uses `gcloud` and `terraform`:
     - `terraform init -input=false` in `infra/`
     - `terraform plan -input=false -out=tfplan`
     - `terraform apply -input=false -auto-approve tfplan`
   - This job assumes Terraform code in `infra/` manages:
     - Vertex AI endpoints & config.
     - Cloud Run and/or GKE infra.
     - Any networking / IAM for the ML stack.

6. ### `model-deploy`
   - Needs: `infra-deploy`.
   - Only on `main` branch.
   - Environment: `staging`.
   - Downloads the `model-version` artifact (the `.model_version` file).
   - Uses WIF + `gcloud`.
   - Calls `scripts/deploy_vertex_model.sh` to:
     - Read `.model_version`.
     - Compute the GCS URI:
       - `gs://${GCS_MODEL_BUCKET}/models/<VERSION>/`
     - Upload a Vertex AI Model:
       - `gcloud ai models upload` with:
         - `--region="${GCP_REGION}"`
         - `--display-name="subt05-model-<VERSION>"`
         - `--artifact-uri="${GCS_URI}"`
         - For container image, assume:
           `us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-0:latest`
     - Create or reuse a Vertex AI Endpoint:
       - Display name: `"subt05-endpoint"`
     - Deploy the model **to that endpoint**:
       - 100% traffic to the new deployment.

---

## 3. Triggers & Env / Secrets / Vars

Workflow triggers:

- `on.push`:
  - branches: `[ main ]`
  - paths:
    - `.github/workflows/ci-cd.yml`
    - `infra/**`
    - `src/**`
    - `train.py`
    - `Dockerfile`
- `on.pull_request`:
  - branches: `[ main ]`
- `workflow_dispatch`

Environment and secrets expected:

- `secrets.GCP_PROJECT_ID`
- `secrets.GCP_WIF_PROVIDER`  
  (the full workload identity provider resource path)
- `secrets.GCP_SERVICE_ACCOUNT`  
  (the service account email for WIF)
- `vars.GCP_REGION`  
- `vars.GCS_MODEL_BUCKET`  

Global `env` in workflow:

- `GCP_PROJECT_ID`
- `GCP_WIF_PROVIDER`
- `GCP_SERVICE_ACCOUNT`
- `GCP_REGION`
- `GCS_MODEL_BUCKET`
- `TF_WORKING_DIR` → `"infra"`
- `PYTHON_VERSION` → `"3.11"`
- `IMAGE_NAME` → `"ml-app"`
- `REGISTRY_HOST` → `"${{ vars.GCP_REGION }}-docker.pkg.dev"`
- `REGISTRY_REPO` → `"${{ env.GCP_PROJECT_ID }}/ml-platform"`

Permissions at workflow level:

```yaml
permissions:
  contents: read
  id-token: write
```

---

## 4. Script Rules 

We are doing a **CI/CD optimization** task similar to previous sub-tasks:

1. GitHub Actions `run:` steps should stay small and readable.
2. If logic is longer or multi-step, **move it to a script**.
3. Scripts live under `scripts/` directory.

For this task, we want **exactly two scripts**:

1. `scripts/train_model.sh`
2. `scripts/deploy_vertex_model.sh`

Both scripts should:

- Be POSIX-compatible Bash with:
  - `#!/usr/bin/env bash`
  - `set -euo pipefail`
- Log key actions with `[Sub_T05]` prefix in `echo` output.
- Fail fast with clear error messages if any critical data is missing (`.model_version`, etc.).

---

## 5. Style & Quality Expectations

- **Human-readable, interview-ready** CI/CD code.
- Clear **job names** and descriptions .
- Use official, well-known GitHub Actions:
  - `actions/checkout@v4`
  - `actions/setup-python@v5`
  - `actions/cache@v4`
  - `hashicorp/setup-terraform@v3`
  - `google-github-actions/auth@v2`
  - `google-github-actions/setup-gcloud@v2`
  - `hadolint/hadolint-action@v3.1.0`
  - `actions/upload-artifact@v4`
  - `actions/download-artifact@v4`
- Use **WIF** correctly:
  ```yaml
  - name: Authenticate to GCP (WIF)
    uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
      service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
      token_format: access_token
  ```

- Make sure there is **only one workflow file** in the answer:
  - `.github/workflows/ci-cd.yml` (full content)
- Also output **full content** of:
  - `scripts/train_model.sh`
  - `scripts/deploy_vertex_model.sh`

3. Make the YAML and Bash **ready to copy-paste** into a repo without extra explanation needed.

Keep the tone clean and professional; don’t add unnecessary commentary. Focus on delivering **production-ready CI/CD artifacts**.
