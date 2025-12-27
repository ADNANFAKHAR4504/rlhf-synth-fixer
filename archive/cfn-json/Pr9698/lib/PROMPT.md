Application Deployment

CRITICAL: Use cloudformation with json. No exceptions.
Platform: cloudformation
Language: json
Region: ap-southeast-1

Background

Infrastructure task for CloudFormation. Need to set up educational content platform.

Problem

Design and implement CloudFormation template for educational content delivery platform with ECS hosting web application, S3 for static assets served through CloudFront CDN, DynamoDB for user data, and CodePipeline for automated deployments.

Requirements:
- ECS cluster running containerized web application behind Application Load Balancer
- S3 bucket for static content connected to CloudFront distribution for global delivery
- DynamoDB table storing user progress data accessible by ECS tasks
- CodePipeline watching CodeCommit repository to trigger automated builds and deployments
- EventBridge rules monitoring pipeline events to send notifications via SNS
- Secure infrastructure with KMS encryption
- Educational data handling compliance
- Cloud security best practices

Constraints

- Must use CloudFormation with JSON
- Must deploy to ap-southeast-1
- Must be fully destroyable

Setup

Standard CloudFormation environment

Implementation

Platform:
- Use cloudformation framework
- Write in json
- Follow cloudformation best practices
- Use environmentSuffix variable for naming

Security:
- Encrypt data at rest with AWS KMS
- Use TLS/SSL for transit
- Least privilege IAM
- Enable CloudWatch logging
- Tag all resources

Testing:
- Unit tests with good coverage
- Integration tests validate end-to-end workflows
- Load outputs from cfn-outputs/flat-outputs.json

Resources:
- Infrastructure fully destroyable for CI/CD
- Fetch secrets from Secrets Manager, don't create new ones
- Avoid DeletionPolicy: Retain

Success Criteria

- Infrastructure deploys
- Security and compliance met
- Tests pass
- Resources tagged and named correctly
- Clean destruction works
