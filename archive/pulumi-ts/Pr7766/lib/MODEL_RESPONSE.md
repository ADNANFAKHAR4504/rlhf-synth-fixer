# Model Response

This file should contain the initial model output for the CI/CD Pipeline YAML configuration task.

## Expected Content

The model's response should include:

1. **Analysis Phase**
   - Understanding the platform requirements
   - Identifying the Node.js application needs
   - Determining the deployment target (AWS ECR + infrastructure)

2. **Pipeline Design**
   - Multi-stage pipeline architecture
   - Build → Scan → Deploy flow
   - Environment-specific configurations

3. **Implementation**
   - Complete `lib/ci-cd.yml` file
   - Platform-specific syntax (GitHub Actions, GitLab CI, etc.)
   - External scripts in `scripts/` directory if needed

4. **Key Components**
   - Source checkout
   - Docker image build
   - Container vulnerability scanning
   - Private registry push (ECR)
   - Multi-environment deployment
   - Manual approval gates
   - Notifications

## Example Initial Response Structure

```yaml
# lib/ci-cd.yml

name: Docker Build and Deploy Pipeline

on:
  push:
    branches: [main, dev]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Build Docker image
        run: |
          docker build -t nodejs-app:${{ github.sha }} .

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: docker-image
          path: nodejs-app-${{ github.sha }}.tar

  scan:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: docker-image

      - name: Run Trivy scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: nodejs-app:${{ github.sha }}
          severity: HIGH,CRITICAL
          exit-code: 1

  deploy-dev:
    needs: scan
    environment: dev
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Dev
        run: ./scripts/deploy.sh dev

  deploy-staging:
    needs: deploy-dev
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: ./scripts/deploy.sh staging

  deploy-prod:
    needs: deploy-staging
    environment: production
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: ./scripts/deploy.sh prod

      - name: Notify on success
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"Production deployment successful"}'
```

## Evaluation Criteria

The response will be evaluated against:
- Platform syntax correctness
- Script length compliance (>5 lines external)
- Private registry usage
- Secret management
- Container scanning
- Environment declarations
- Artifact handling
- Notifications
