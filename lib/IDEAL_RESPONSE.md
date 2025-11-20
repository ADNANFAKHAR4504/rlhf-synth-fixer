```yaml
name: ML Platform CI/CD (Sub_T05)

on:
  push:
    branches: [ main ]
    paths:
      - ".github/workflows/ci-cd.yml"
      - "infra/**"
      - "src/**"
      - "train.py"
      - "Dockerfile"
  pull_request:
    branches: [ main ]
  workflow_dispatch:

env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GCP_WIF_PROVIDER: ${{ secrets.GCP_WIF_PROVIDER }}
  GCP_SERVICE_ACCOUNT: ${{ secrets.GCP_SERVICE_ACCOUNT }}
  GCP_REGION: ${{ vars.GCP_REGION }}
  GCS_MODEL_BUCKET: ${{ vars.GCS_MODEL_BUCKET }}
  TF_WORKING_DIR: infra
  PYTHON_VERSION: "3.11"
  IMAGE_NAME: "ml-app"
  REGISTRY_HOST: "${{ vars.GCP_REGION }}-docker.pkg.dev"
  REGISTRY_REPO: "${{ env.GCP_PROJECT_ID }}/ml-platform"

permissions:
  contents: read
  id-token: write

jobs:
  validation:
    name: Validation (Terraform, Python, Dockerfile, Secrets)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/pyproject.toml', '**/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install Python tooling
        run: |
          python -m pip install --upgrade pip
          pip install black pylint mypy bandit detect-secrets

      - name: Black (format check)
        run: black --check .

      - name: Pylint
        run: pylint $(git ls-files '*.py') || true

      - name: Mypy
        run: mypy . || true

      - name: Bandit (security lint)
        run: bandit -r . || true

      - name: Detect-secrets (working tree)
        run: detect-secrets scan --all-files

      - name: Hadolint (Dockerfile)
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile

      - name: Install gitleaks
        run: |
          curl -sSL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_$(uname -s)_$(uname -m).tar.gz -o gitleaks.tar.gz
          tar -xzf gitleaks.tar.gz gitleaks
          sudo mv gitleaks /usr/local/bin/gitleaks

      - name: Gitleaks (full history)
        run: gitleaks detect --no-banner --redact --source .

      - name: Set up Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.8

      - name: Terraform init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init -input=false

      - name: Terraform validate
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform validate

  tests:
    name: Unit / Integration Tests
    runs-on: ubuntu-latest
    needs: validation

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/pyproject.toml', '**/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install dependencies (Poetry)
        run: |
          python -m pip install --upgrade pip
          pip install poetry
          poetry install --no-interaction --no-ansi

      - name: Run tests
        run: poetry run pytest

  docker_build_push:
    name: Build & Push Docker Image (Artifact Registry)
    runs-on: ubuntu-latest
    needs: tests
    if: github.ref == 'refs/heads/main'

    env:
      IMAGE_TAG: ${{ github.sha }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token

      - name: Set up gcloud
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ env.GCP_PROJECT_ID }}

      - name: Configure docker for Artifact Registry
        run: gcloud auth configure-docker "${{ env.REGISTRY_HOST }}"

      - name: Build Docker image
        run: docker build -t "${{ env.REGISTRY_HOST }}/${{ env.REGISTRY_REPO }}/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }}" .

      - name: Push Docker image
        run: docker push "${{ env.REGISTRY_HOST }}/${{ env.REGISTRY_REPO }}/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }}"

  model-build:
    name: Train & Package Model
    runs-on: ubuntu-latest
    needs: tests

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/pyproject.toml', '**/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install Poetry
        run: |
          python -m pip install --upgrade pip
          pip install poetry

      - name: Install dependencies
        run: poetry install --no-interaction --no-ansi

      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token

      - name: Set up gcloud
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ env.GCP_PROJECT_ID }}

      - name: Make scripts executable
        run: chmod +x scripts/train_model.sh

      - name: Train & upload model
        env:
          GCS_MODEL_BUCKET: ${{ env.GCS_MODEL_BUCKET }}
        run: ./scripts/train_model.sh

      - name: Persist model version artifact
        uses: actions/upload-artifact@v4
        with:
          name: model-version
          path: .model_version

  infra-deploy:
    name: Deploy Infra (Vertex AI / Cloud Run / GKE)
    runs-on: ubuntu-latest
    needs:
      - docker_build_push
      - model-build
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token

      - name: Set up gcloud
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ env.GCP_PROJECT_ID }}

      - name: Configure docker for Artifact Registry
        run: gcloud auth configure-docker "${{ env.REGISTRY_HOST }}"

      - name: Set up Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.8

      - name: Terraform init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init -input=false

      - name: Terraform plan
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform plan -input=false -out=tfplan

      - name: Terraform apply
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform apply -input=false -auto-approve tfplan

  model-deploy:
    name: Deploy Model to Vertex AI Endpoint
    runs-on: ubuntu-latest
    needs: infra-deploy
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download model version artifact
        uses: actions/download-artifact@v4
        with:
          name: model-version
          path: .

      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token

      - name: Set up gcloud
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ env.GCP_PROJECT_ID }}

      - name: Make scripts executable
        run: chmod +x scripts/deploy_vertex_model.sh

      - name: Deploy model to Vertex AI
        env:
          GCP_PROJECT_ID: ${{ env.GCP_PROJECT_ID }}
          GCP_REGION: ${{ env.GCP_REGION }}
          GCS_MODEL_BUCKET: ${{ env.GCS_MODEL_BUCKET }}
        run: ./scripts/deploy_vertex_model.sh

```