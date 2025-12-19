# SageMaker Model Training Infrastructure

Create CDK infrastructure code in TypeScript for a model training platform in us-west-2.

## Requirements

### Networking
- VPC with CIDR 10.220.0.0/16
- Private subnets for SageMaker training
- VPC endpoints for S3, SageMaker, and ECR

### Compute Resources
- SageMaker notebook instance for development
- SageMaker training job configuration with spot instances enabled
- AWS Batch compute environment for batch inference jobs

### Storage
- S3 bucket for training datasets
- S3 bucket for model artifacts with lifecycle policy (archive after 180 days)
- ECR repository for custom training containers

### Monitoring
- CloudWatch log group for training job logs
- CloudWatch dashboard for training metrics

### Security
- IAM role for SageMaker notebook execution
- IAM role for SageMaker training jobs
- IAM role for Batch jobs

## Constraints
- Enable VPC mode for all SageMaker training jobs
- Use spot instances for cost optimization
- Implement S3 lifecycle policies for model archiving

Generate infrastructure code with one code block per file. Keep the solution minimal and focused on the requirements.