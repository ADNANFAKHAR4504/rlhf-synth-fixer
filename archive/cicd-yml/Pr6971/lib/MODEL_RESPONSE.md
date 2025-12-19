### Reasoning Trace
---

Let's approach this systematically. I need to create a single GitHub Actions workflow file and two bash scripts that meet the requirements.

First, let's outline the structure of the workflow file:

```yaml
# .github/workflows/ci-cd.yml
name: ML Platform CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - '.github/workflows/ci-cd.yml'
      - 'infra/**'
      - 'src/**'
      - 'train.py'
      - 'Dockerfile'
  pull_request:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  id-token: write

env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GCP_WIF_PROVIDER: ${{ secrets.GCP_WIF_PROVIDER }}
  GCP_SERVICE_ACCOUNT: ${{ secrets.GCP_SERVICE_ACCOUNT }}
  GCP_REGION: ${{ vars.GCP_REGION }}
  GCS_MODEL_BUCKET: ${{ vars.GCS_MODEL_BUCKET }}
  TF_WORKING_DIR: "infra"
  PYTHON_VERSION: "3.11"
  IMAGE_NAME: "ml-app"
  REGISTRY_HOST: "${{ vars.GCP_REGION }}-docker.pkg.dev"
  REGISTRY_REPO: "${{ env.GCP_PROJECT_ID }}/ml-platform"

jobs:
  validation:
    # Static checks & validations job
    
  tests:
    # Unit/integration tests job
    
  docker_build_push:
    # Docker build & push job
    
  model-build:
    # Model build job
    
  infra-deploy:
    # Infrastructure deployment job
    
  model-deploy:
    # Model deployment job
```

Now let's flesh out each job:

1. Validation job:

```yaml
  validation:
    name: Code Validation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          
      - name: Install validation tools
        run: |
          python -m pip install --upgrade pip
          pip install black pylint mypy bandit detect-secrets gitleaks
      
      - name: Black code style check
        run: black --check .
        
      - name: Pylint check
        run: |
          find . -type f -name "*.py" | grep -v ".venv/" | xargs pylint
          
      - name: Mypy type check
        run: mypy .
        
      - name: Bandit security check
        run: bandit -r .
        
      - name: Detect secrets
        run: detect-secrets scan --all-files
        
      - name: Lint Dockerfile
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile
          
      - name: Git leaks check
        run: gitleaks detect --no-banner --redact --source .
        
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        
      - name: Terraform init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init -input=false
        
      - name: Terraform validate
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform validate
```

2. Tests job:

```yaml
  tests:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: validation
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          
      - name: Install Poetry
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
          echo "$HOME/.local/bin" >> $GITHUB_PATH
          
      - name: Configure Poetry
        run: poetry config virtualenvs.in-project true
      
      - name: Cache Poetry dependencies
        uses: actions/cache@v4
        with:
          path: .venv
          key: ${{ runner.os }}-poetry-${{ hashFiles('**/poetry.lock') }}
      
      - name: Install dependencies
        run: poetry install
        
      - name: Run tests
        run: poetry run pytest
```

3. Docker build and push job:

```yaml
  docker_build_push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    needs: tests
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Configure Docker for Artifact Registry
        run: |
          gcloud auth configure-docker ${{ env.REGISTRY_HOST }} --quiet
      
      - name: Build and push Docker image
        run: |
          docker build -t ${{ env.REGISTRY_HOST }}/${{ env.REGISTRY_REPO }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
          docker push ${{ env.REGISTRY_HOST }}/${{ env.REGISTRY_REPO }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

4. Model build job:

```yaml
  model-build:
    name: Build ML Model
    runs-on: ubuntu-latest
    needs: tests
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      
      - name: Install Poetry
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
          echo "$HOME/.local/bin" >> $GITHUB_PATH
      
      - name: Configure Poetry
        run: poetry config virtualenvs.in-project true
      
      - name: Cache Poetry dependencies
        uses: actions/cache@v4
        with:
          path: .venv
          key: ${{ runner.os }}-poetry-${{ hashFiles('**/poetry.lock') }}
      
      - name: Install dependencies
        run: poetry install
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Build and upload model
        run: |
          chmod +x scripts/train_model.sh
          ./scripts/train_model.sh
      
      - name: Upload model version artifact
        uses: actions/upload-artifact@v4
        with:
          name: model-version
          path: .model_version
```

5. Infrastructure deployment job:

```yaml
  infra-deploy:
    name: Deploy Infrastructure
    runs-on: ubuntu-latest
    needs: [docker_build_push, model-build]
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
      - name: Terraform init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init -input=false
      
      - name: Terraform plan
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform plan -input=false -out=tfplan
      
      - name: Terraform apply
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform apply -input=false -auto-approve tfplan
```

6. Model deployment job:

```yaml
  model-deploy:
    name: Deploy ML Model
    runs-on: ubuntu-latest
    needs: infra-deploy
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download model version artifact
        uses: actions/download-artifact@v4
        with:
          name: model-version
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Deploy model to Vertex AI
        run: |
          chmod +x scripts/deploy_vertex_model.sh
          ./scripts/deploy_vertex_model.sh
```

Now let's create the two bash scripts:

1. scripts/train_model.sh:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Constants
DATE_FORMAT=$(date '+%Y%m%d%H%M%S')
SHORT_SHA="${GITHUB_SHA:0:7}"
VERSION="v${DATE_FORMAT}_${SHORT_SHA}"
MODEL_DIR="artifacts/models/${VERSION}"

echo "[Sub_T05] Starting model training process..."
echo "[Sub_T05] Using model version: ${VERSION}"

# Create model directory
mkdir -p "${MODEL_DIR}"
echo "[Sub_T05] Created model directory at ${MODEL_DIR}"

# Train the model
echo "[Sub_T05] Starting model training..."
poetry run python train.py --model-dir "${MODEL_DIR}"
echo "[Sub_T05] Model training complete."

# Check if model artifacts were created
if [ ! -d "${MODEL_DIR}" ] || [ -z "$(ls -A ${MODEL_DIR})" ]; then
  echo "[Sub_T05] ERROR: Model training failed or produced no artifacts."
  exit 1
fi
echo "[Sub_T05] Model artifacts successfully generated."

# Upload artifacts to GCS
echo "[Sub_T05] Uploading model artifacts to GCS..."
if [ -z "${GCS_MODEL_BUCKET}" ]; then
  echo "[Sub_T05] ERROR: GCS_MODEL_BUCKET environment variable not set."
  exit 1
fi

GCS_PATH="gs://${GCS_MODEL_BUCKET}/models/${VERSION}"
gsutil -m cp -r "${MODEL_DIR}"/* "${GCS_PATH}/"
echo "[Sub_T05] Model artifacts uploaded to: ${GCS_PATH}"

# Write version to file
echo "${VERSION}" > .model_version
echo "[Sub_T05] Model version saved to .model_version file"

echo "[Sub_T05] Model build and upload process completed successfully."
```

2. scripts/deploy_vertex_model.sh:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Read model version from file
if [ ! -f ".model_version" ]; then
  echo "[Sub_T05] ERROR: .model_version file not found."
  exit 1
fi

VERSION=$(cat .model_version)
if [ -z "${VERSION}" ]; then
  echo "[Sub_T05] ERROR: Empty model version in .model_version file."
  exit 1
fi

echo "[Sub_T05] Deploying model version: ${VERSION}"

# Compute GCS URI
if [ -z "${GCS_MODEL_BUCKET}" ]; then
  echo "[Sub_T05] ERROR: GCS_MODEL_BUCKET environment variable not set."
  exit 1
fi

if [ -z "${GCP_REGION}" ]; then
  echo "[Sub_T05] ERROR: GCP_REGION environment variable not set."
  exit 1
fi

GCS_URI="gs://${GCS_MODEL_BUCKET}/models/${VERSION}/"
echo "[Sub_T05] Model artifacts located at: ${GCS_URI}"

# Define model and endpoint names
MODEL_NAME="subt05-model-${VERSION}"
ENDPOINT_NAME="subt05-endpoint"
CONTAINER_IMAGE="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-0:latest"

echo "[Sub_T05] Uploading model to Vertex AI..."
MODEL_ID=$(gcloud ai models upload \
  --region="${GCP_REGION}" \
  --display-name="${MODEL_NAME}" \
  --artifact-uri="${GCS_URI}" \
  --container-image-uri="${CONTAINER_IMAGE}" \
  --format="value(name)")

if [ -z "${MODEL_ID}" ]; then
  echo "[Sub_T05] ERROR: Failed to upload model to Vertex AI."
  exit 1
fi

echo "[Sub_T05] Model uploaded with ID: ${MODEL_ID}"

# Check if endpoint exists, create if it doesn't
ENDPOINT_ID=$(gcloud ai endpoints list \
  --region="${GCP_REGION}" \
  --filter="displayName=${ENDPOINT_NAME}" \
  --format="value(name)")

if [ -z "${ENDPOINT_ID}" ]; then
  echo "[Sub_T05] Creating new Vertex AI endpoint..."
  ENDPOINT_ID=$(gcloud ai endpoints create \
    --region="${GCP_REGION}" \
    --display-name="${ENDPOINT_NAME}" \
    --format="value(name)")
  
  if [ -z "${ENDPOINT_ID}" ]; then
    echo "[Sub_T05] ERROR: Failed to create Vertex AI endpoint."
    exit 1
  fi
  
  echo "[Sub_T05] Endpoint created with ID: ${ENDPOINT_ID}"
else
  echo "[Sub_T05] Using existing endpoint with ID: ${ENDPOINT_ID}"
fi

# Deploy model to endpoint with 100% traffic
echo "[Sub_T05] Deploying model to endpoint..."
DEPLOYMENT_ID=$(gcloud ai endpoints deploy-model "${ENDPOINT_ID}" \
  --region="${GCP_REGION}" \
  --model="${MODEL_ID}" \
  --display-name="${MODEL_NAME}" \
  --traffic-split="0=100" \
  --format="value(deployedModel.id)")

if [ -z "${DEPLOYMENT_ID}" ]; then
  echo "[Sub_T05] ERROR: Failed to deploy model to endpoint."
  exit 1
fi

echo "[Sub_T05] Model successfully deployed to endpoint with deployment ID: ${DEPLOYMENT_ID}"
echo "[Sub_T05] Model deployment process completed successfully."
```

Now let's put it all together into the full workflow file:

```yaml
# .github/workflows/ci-cd.yml
name: ML Platform CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - '.github/workflows/ci-cd.yml'
      - 'infra/**'
      - 'src/**'
      - 'train.py'
      - 'Dockerfile'
  pull_request:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  id-token: write

env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GCP_WIF_PROVIDER: ${{ secrets.GCP_WIF_PROVIDER }}
  GCP_SERVICE_ACCOUNT: ${{ secrets.GCP_SERVICE_ACCOUNT }}
  GCP_REGION: ${{ vars.GCP_REGION }}
  GCS_MODEL_BUCKET: ${{ vars.GCS_MODEL_BUCKET }}
  TF_WORKING_DIR: "infra"
  PYTHON_VERSION: "3.11"
  IMAGE_NAME: "ml-app"
  REGISTRY_HOST: "${{ vars.GCP_REGION }}-docker.pkg.dev"
  REGISTRY_REPO: "${{ env.GCP_PROJECT_ID }}/ml-platform"

jobs:
  validation:
    name: Code Validation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          
      - name: Install validation tools
        run: |
          python -m pip install --upgrade pip
          pip install black pylint mypy bandit detect-secrets gitleaks
      
      - name: Black code style check
        run: black --check .
        
      - name: Pylint check
        run: |
          find . -type f -name "*.py" | grep -v ".venv/" | xargs pylint
          
      - name: Mypy type check
        run: mypy .
        
      - name: Bandit security check
        run: bandit -r .
        
      - name: Detect secrets
        run: detect-secrets scan --all-files
        
      - name: Lint Dockerfile
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile
          
      - name: Git leaks check
        run: gitleaks detect --no-banner --redact --source .
        
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        
      - name: Terraform init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init -input=false
        
      - name: Terraform validate
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform validate

  tests:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: validation
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          
      - name: Install Poetry
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
          echo "$HOME/.local/bin" >> $GITHUB_PATH
          
      - name: Configure Poetry
        run: poetry config virtualenvs.in-project true
      
      - name: Cache Poetry dependencies
        uses: actions/cache@v4
        with:
          path: .venv
          key: ${{ runner.os }}-poetry-${{ hashFiles('**/poetry.lock') }}
      
      - name: Install dependencies
        run: poetry install
        
      - name: Run tests
        run: poetry run pytest

  docker_build_push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    needs: tests
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Configure Docker for Artifact Registry
        run: |
          gcloud auth configure-docker ${{ env.REGISTRY_HOST }} --quiet
      
      - name: Build and push Docker image
        run: |
          docker build -t ${{ env.REGISTRY_HOST }}/${{ env.REGISTRY_REPO }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
          docker push ${{ env.REGISTRY_HOST }}/${{ env.REGISTRY_REPO }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  model-build:
    name: Build ML Model
    runs-on: ubuntu-latest
    needs: tests
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      
      - name: Install Poetry
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
          echo "$HOME/.local/bin" >> $GITHUB_PATH
      
      - name: Configure Poetry
        run: poetry config virtualenvs.in-project true
      
      - name: Cache Poetry dependencies
        uses: actions/cache@v4
        with:
          path: .venv
          key: ${{ runner.os }}-poetry-${{ hashFiles('**/poetry.lock') }}
      
      - name: Install dependencies
        run: poetry install
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Build and upload model
        run: |
          chmod +x scripts/train_model.sh
          ./scripts/train_model.sh
      
      - name: Upload model version artifact
        uses: actions/upload-artifact@v4
        with:
          name: model-version
          path: .model_version

  infra-deploy:
    name: Deploy Infrastructure
    runs-on: ubuntu-latest
    needs: [docker_build_push, model-build]
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
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
    name: Deploy ML Model
    runs-on: ubuntu-latest
    needs: infra-deploy
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download model version artifact
        uses: actions/download-artifact@v4
        with:
          name: model-version
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Deploy model to Vertex AI
        run: |
          chmod +x scripts/deploy_vertex_model.sh
          ./scripts/deploy_vertex_model.sh
```

Now let's review if everything meets the requirements:

1. We have a single workflow file with 6 jobs: validation, tests, docker_build_push, model-build, infra-deploy, and model-deploy.
2. The workflow triggers on push to main branch with the specified paths, on pull request to main branch, and on workflow_dispatch.
3. We're using Workload Identity Federation (WIF) for GCP authentication.
4. The validation job includes all the required checks.
5. The tests job installs Poetry and runs pytest.
6. The docker_build_push job builds and pushes the Docker image to Artifact Registry.
7. The model-build job trains the model and uploads artifacts to GCS.
8. The infra-deploy job applies the Terraform configuration.
9. The model-deploy job deploys the model to Vertex AI.
10. We have the two required scripts: train_model.sh and deploy_vertex_model.sh.

I think this meets all the requirements. Let me double-check a few details:

- The environment variables and secrets are correctly set.
- The permissions are correctly set to allow WIF.
- The docker_build_push, infra-deploy, and model-deploy jobs only run on the main branch.
- The model-build job creates a versioned directory for the model artifacts and saves the version to a file.
- The model-deploy job reads the version from the file and uses it to deploy the model.
- Both scripts include error checking and logging with the [Sub_T05] prefix.

Everything looks good. Now I'll present the complete solution.
### Answer 
---

# ML Platform CI/CD Implementation

I'll create the required files for a production-grade GitHub Actions workflow for a GCP-based ML platform, focusing on single workflow optimization with proper Workload Identity Federation (WIF) integration.

## File 1: `.github/workflows/ci-cd.yml`

```yaml
name: ML Platform CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - '.github/workflows/ci-cd.yml'
      - 'infra/**'
      - 'src/**'
      - 'train.py'
      - 'Dockerfile'
  pull_request:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  id-token: write

env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GCP_WIF_PROVIDER: ${{ secrets.GCP_WIF_PROVIDER }}
  GCP_SERVICE_ACCOUNT: ${{ secrets.GCP_SERVICE_ACCOUNT }}
  GCP_REGION: ${{ vars.GCP_REGION }}
  GCS_MODEL_BUCKET: ${{ vars.GCS_MODEL_BUCKET }}
  TF_WORKING_DIR: "infra"
  PYTHON_VERSION: "3.11"
  IMAGE_NAME: "ml-app"
  REGISTRY_HOST: "${{ vars.GCP_REGION }}-docker.pkg.dev"
  REGISTRY_REPO: "${{ secrets.GCP_PROJECT_ID }}/ml-platform"

jobs:
  validation:
    name: Static Code Validation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
        
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          
      - name: Install validation tools
        run: |
          python -m pip install --upgrade pip
          pip install black pylint mypy bandit detect-secrets gitleaks
      
      - name: Black code style check
        run: black --check .
        
      - name: Pylint check
        run: |
          find . -type f -name "*.py" | grep -v ".venv/" | xargs pylint
          
      - name: Mypy type check
        run: mypy .
        
      - name: Bandit security check
        run: bandit -r .
        
      - name: Detect secrets
        run: detect-secrets scan --all-files
        
      - name: Lint Dockerfile
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile
          
      - name: Git leaks check
        run: gitleaks detect --no-banner --redact --source .
        
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        
      - name: Terraform init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init -input=false
        
      - name: Terraform validate
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform validate

  tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    needs: validation
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          
      - name: Install Poetry
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
          echo "$HOME/.local/bin" >> $GITHUB_PATH
          
      - name: Configure Poetry
        run: poetry config virtualenvs.in-project true
      
      - name: Cache Poetry dependencies
        uses: actions/cache@v4
        with:
          path: .venv
          key: ${{ runner.os }}-poetry-${{ hashFiles('**/poetry.lock') }}
          restore-keys: |
            ${{ runner.os }}-poetry-
      
      - name: Install dependencies
        run: poetry install
        
      - name: Run tests
        run: poetry run pytest

  docker_build_push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    needs: tests
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Configure Docker for Artifact Registry
        run: |
          gcloud auth configure-docker ${{ env.REGISTRY_HOST }} --quiet
      
      - name: Build and push Docker image
        run: |
          docker build -t ${{ env.REGISTRY_HOST }}/${{ env.REGISTRY_REPO }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
          docker push ${{ env.REGISTRY_HOST }}/${{ env.REGISTRY_REPO }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  model-build:
    name: Build ML Model
    runs-on: ubuntu-latest
    needs: tests
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      
      - name: Install Poetry
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
          echo "$HOME/.local/bin" >> $GITHUB_PATH
      
      - name: Configure Poetry
        run: poetry config virtualenvs.in-project true
      
      - name: Cache Poetry dependencies
        uses: actions/cache@v4
        with:
          path: .venv
          key: ${{ runner.os }}-poetry-${{ hashFiles('**/poetry.lock') }}
          restore-keys: |
            ${{ runner.os }}-poetry-
      
      - name: Install dependencies
        run: poetry install
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Build and upload model
        run: |
          chmod +x scripts/train_model.sh
          ./scripts/train_model.sh
      
      - name: Upload model version artifact
        uses: actions/upload-artifact@v4
        with:
          name: model-version
          path: .model_version

  infra-deploy:
    name: Deploy Infrastructure
    runs-on: ubuntu-latest
    needs: [docker_build_push, model-build]
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
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
    name: Deploy ML Model to Vertex AI
    runs-on: ubuntu-latest
    needs: infra-deploy
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download model version artifact
        uses: actions/download-artifact@v4
        with:
          name: model-version
      
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.GCP_WIF_PROVIDER }}
          service_account: ${{ env.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Deploy model to Vertex AI
        run: |
          chmod +x scripts/deploy_vertex_model.sh
          ./scripts/deploy_vertex_model.sh
```

## File 2: `scripts/train_model.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Constants
DATE_FORMAT=$(date '+%Y%m%d%H%M%S')
SHORT_SHA="${GITHUB_SHA:0:7}"
VERSION="v${DATE_FORMAT}_${SHORT_SHA}"
MODEL_DIR="artifacts/models/${VERSION}"

echo "[Sub_T05] Starting model training process..."
echo "[Sub_T05] Using model version: ${VERSION}"

# Create model directory
mkdir -p "${MODEL_DIR}"
echo "[Sub_T05] Created model directory at ${MODEL_DIR}"

# Train the model
echo "[Sub_T05] Starting model training..."
poetry run python train.py --model-dir "${MODEL_DIR}"
echo "[Sub_T05] Model training complete."

# Check if model artifacts were created
if [ ! -d "${MODEL_DIR}" ] || [ -z "$(ls -A ${MODEL_DIR})" ]; then
  echo "[Sub_T05] ERROR: Model training failed or produced no artifacts."
  exit 1
fi
echo "[Sub_T05] Model artifacts successfully generated."

# Upload artifacts to GCS
echo "[Sub_T05] Uploading model artifacts to GCS..."
if [ -z "${GCS_MODEL_BUCKET}" ]; then
  echo "[Sub_T05] ERROR: GCS_MODEL_BUCKET environment variable not set."
  exit 1
fi

GCS_PATH="gs://${GCS_MODEL_BUCKET}/models/${VERSION}"
gsutil -m cp -r "${MODEL_DIR}"/* "${GCS_PATH}/"
echo "[Sub_T05] Model artifacts uploaded to: ${GCS_PATH}"

# Write version to file
echo "${VERSION}" > .model_version
echo "[Sub_T05] Model version saved to .model_version file"

echo "[Sub_T05] Model build and upload process completed successfully."
```

## File 3: `scripts/deploy_vertex_model.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Read model version from file
if [ ! -f ".model_version" ]; then
  echo "[Sub_T05] ERROR: .model_version file not found."
  exit 1
fi

VERSION=$(cat .model_version)
if [ -z "${VERSION}" ]; then
  echo "[Sub_T05] ERROR: Empty model version in .model_version file."
  exit 1
fi

echo "[Sub_T05] Deploying model version: ${VERSION}"

# Compute GCS URI
if [ -z "${GCS_MODEL_BUCKET}" ]; then
  echo "[Sub_T05] ERROR: GCS_MODEL_BUCKET environment variable not set."
  exit 1
fi

if [ -z "${GCP_REGION}" ]; then
  echo "[Sub_T05] ERROR: GCP_REGION environment variable not set."
  exit 1
fi

GCS_URI="gs://${GCS_MODEL_BUCKET}/models/${VERSION}/"
echo "[Sub_T05] Model artifacts located at: ${GCS_URI}"

# Define model and endpoint names
MODEL_NAME="subt05-model-${VERSION}"
ENDPOINT_NAME="subt05-endpoint"
CONTAINER_IMAGE="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-0:latest"

echo "[Sub_T05] Uploading model to Vertex AI..."
MODEL_ID=$(gcloud ai models upload \
  --region="${GCP_REGION}" \
  --display-name="${MODEL_NAME}" \
  --artifact-uri="${GCS_URI}" \
  --container-image-uri="${CONTAINER_IMAGE}" \
  --format="value(name)")

if [ -z "${MODEL_ID}" ]; then
  echo "[Sub_T05] ERROR: Failed to upload model to Vertex AI."
  exit 1
fi

echo "[Sub_T05] Model uploaded with ID: ${MODEL_ID}"

# Check if endpoint exists, create if it doesn't
ENDPOINT_ID=$(gcloud ai endpoints list \
  --region="${GCP_REGION}" \
  --filter="displayName=${ENDPOINT_NAME}" \
  --format="value(name)")

if [ -z "${ENDPOINT_ID}" ]; then
  echo "[Sub_T05] Creating new Vertex AI endpoint..."
  ENDPOINT_ID=$(gcloud ai endpoints create \
    --region="${GCP_REGION}" \
    --display-name="${ENDPOINT_NAME}" \
    --format="value(name)")
  
  if [ -z "${ENDPOINT_ID}" ]; then
    echo "[Sub_T05] ERROR: Failed to create Vertex AI endpoint."
    exit 1
  fi
  
  echo "[Sub_T05] Endpoint created with ID: ${ENDPOINT_ID}"
else
  echo "[Sub_T05] Using existing endpoint with ID: ${ENDPOINT_ID}"
fi

# Deploy model to endpoint with 100% traffic
echo "[Sub_T05] Deploying model to endpoint..."
DEPLOYMENT_ID=$(gcloud ai endpoints deploy-model "${ENDPOINT_ID}" \
  --region="${GCP_REGION}" \
  --model="${MODEL_ID}" \
  --display-name="${MODEL_NAME}" \
  --traffic-split="0=100" \
  --format="value(deployedModel.id)")

if [ -z "${DEPLOYMENT_ID}" ]; then
  echo "[Sub_T05] ERROR: Failed to deploy model to endpoint."
  exit 1
fi

echo "[Sub_T05] Model successfully deployed to endpoint with deployment ID: ${DEPLOYMENT_ID}"
echo "[Sub_T05] Model deployment process completed successfully."
```