# Deployment Prerequisites

## Critical Blocker: Lambda Container Images Required

This infrastructure uses Lambda functions with **container images** stored in ECR. Deployment **CANNOT proceed** without building and pushing Docker images first.

### Lambda Functions Requiring Container Images

1. **CSV Validator** - `csv-validator-{environment_suffix}`
2. **Data Transformer** - `data-transformer-{environment_suffix}`
3. **Notification Sender** - `notification-sender-{environment_suffix}`

### Prerequisites for Deployment

#### 1. Docker Images Must Be Built

Each Lambda function requires:
- A Dockerfile defining the container image
- Lambda runtime base image (e.g., `public.ecr.aws/lambda/python:3.12`)
- Application code and dependencies
- Proper ENTRYPOINT/CMD configuration

#### 2. ECR Repositories

The stack creates ECR repositories automatically:
```
csv-validator-{ENVIRONMENT_SUFFIX}
data-transformer-{ENVIRONMENT_SUFFIX}
notification-sender-{ENVIRONMENT_SUFFIX}
```

#### 3. Build and Push Process

**Required steps before `cdktf deploy`:**

```bash
# 1. Set environment variables
export ENVIRONMENT_SUFFIX="synthu4j0l7"
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 2. First deployment to create ECR repositories
cdktf deploy --auto-approve

# 3. Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# 4. Build and push csv-validator
cd lambdas/csv-validator
docker build -t csv-validator:latest .
docker tag csv-validator:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/csv-validator-${ENVIRONMENT_SUFFIX}:latest
docker push \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/csv-validator-${ENVIRONMENT_SUFFIX}:latest

# 5. Build and push data-transformer
cd ../data-transformer
docker build -t data-transformer:latest .
docker tag data-transformer:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/data-transformer-${ENVIRONMENT_SUFFIX}:latest
docker push \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/data-transformer-${ENVIRONMENT_SUFFIX}:latest

# 6. Build and push notification-sender
cd ../notification-sender
docker build -t notification-sender:latest .
docker tag notification-sender:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/notification-sender-${ENVIRONMENT_SUFFIX}:latest
docker push \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/notification-sender-${ENVIRONMENT_SUFFIX}:latest

# 7. Deploy again to create Lambda functions
cd ../../..
cdktf deploy --auto-approve
```

### Why This Blocks Deployment

The Lambda functions reference container images that don't exist yet:
```python
image_uri=f"{validator_ecr.repository_url}:latest"
```

When Terraform tries to create the Lambda function, AWS will fail because the image doesn't exist in ECR.

### Typical Error Without Images

```
Error: creating Lambda Function: InvalidParameterValueException:
The image with imageUri 123456789012.dkr.ecr.us-east-1.amazonaws.com/csv-validator-test:latest
does not exist. Provide a valid imageUri.
```

## Deployment Strategy

Since Lambda container images and application code are not provided in the MODEL_RESPONSE, deployment cannot be completed in this QA phase. The infrastructure code is correct, but missing the runtime components.

### What CAN Be Done

1. ✅ Validate infrastructure code (synth succeeds)
2. ✅ Run unit tests (100% coverage achieved)
3. ✅ Verify resource configuration
4. ❌ Deploy to AWS (blocked on Docker images)
5. ❌ Run integration tests (requires deployment)

### Recommendation

This is a common pattern for serverless applications. The MODEL_RESPONSE should have included:
- Sample Dockerfiles for each Lambda function
- Basic application code for each function
- Instructions for building and deploying images

Without these, the infrastructure is structurally sound but not deployable.
