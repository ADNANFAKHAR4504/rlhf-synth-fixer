```markdown
# Serverless Event Processing Pipeline

This Terraform configuration deploys a complete serverless event processing pipeline for handling real-time payment transaction notifications.

## Architecture

- **SNS Topic**: Receives incoming payment events with server-side encryption
- **Lambda Functions**: Three container-based functions (validator, processor, enricher) using ARM64 architecture
- **Step Functions**: Express workflow orchestrating Lambda execution in sequence
- **DynamoDB**: Stores processed events with point-in-time recovery enabled
- **SQS**: Dead letter queues for error handling
- **CloudWatch**: Log groups with KMS encryption for monitoring
- **ECR**: Private repository for Lambda container images
- **EventBridge**: Event routing via Lambda trigger

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Docker installed for building container images
- AWS account with permissions for all services

## Deployment Steps

### 1. Build and Push Container Images

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push validator
cd lib/lambda/validator
docker build --platform linux/arm64 -t payment-events-validator .
docker tag payment-events-validator:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/<repo-name>:validator-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/<repo-name>:validator-latest

# Build and push processor
cd ../processor
docker build --platform linux/arm64 -t payment-events-processor .
docker tag payment-events-processor:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/<repo-name>:processor-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/<repo-name>:processor-latest

# Build and push enricher
cd ../enricher
docker build --platform linux/arm64 -t payment-events-enricher .
docker tag payment-events-enricher:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/<repo-name>:enricher-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/<repo-name>:enricher-latest

# Build and push trigger
cd ../trigger
docker build --platform linux/arm64 -t payment-events-trigger .
docker tag payment-events-trigger:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/<repo-name>:trigger-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/<repo-name>:trigger-latest
