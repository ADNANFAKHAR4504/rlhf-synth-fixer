# Educational Content Delivery Platform

CDKTF TypeScript infrastructure for educational content delivery with CI/CD integration.

## Architecture

- **Content Delivery**: S3 + CloudFront for fast, global content delivery
- **User Management**: Cognito User Pool for authentication
- **Data Storage**: DynamoDB for user profiles and course progress
- **API Layer**: API Gateway + Lambda for serverless backend
- **Monitoring**: CloudWatch logs, alarms, and SNS notifications
- **CI/CD**: GitHub Actions workflow with OIDC and multi-stage deployment

## Resources Created

- S3 bucket with encryption and versioning for course content
- CloudFront distribution with Origin Access Identity
- DynamoDB tables for user profiles and course progress
- Cognito User Pool with MFA support
- Lambda functions for enrollment and progress tracking
- API Gateway REST API with Lambda integration
- CloudWatch log groups and metric alarms
- SNS topic for alerts and notifications
- IAM roles for Lambda execution and CI/CD deployment

## Environment Variables

- `environmentSuffix`: Environment identifier (dev/staging/prod)
- `USER_PROFILES_TABLE`: DynamoDB table for user profiles
- `COURSE_PROGRESS_TABLE`: DynamoDB table for course progress
- `ALERT_TOPIC_ARN`: SNS topic ARN for notifications

## Deployment

```bash
# Install dependencies
npm install

# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy

# Destroy infrastructure
cdktf destroy
```

## CI/CD Integration

See `lib/ci-cd.yml` for GitHub Actions workflow configuration featuring:
- OIDC authentication (no long-lived credentials)
- Multi-stage deployment (dev → staging → prod)
- Manual approval gates
- Security scanning
- Cross-account role assumptions

## Security Features

- Encryption at rest for S3 and DynamoDB
- HTTPS-only access via CloudFront
- Cognito authentication with MFA support
- IAM roles with least privilege
- Private S3 buckets with CloudFront OAI
- CloudWatch logging for audit trails

## Compliance

- 30-day log retention for audit requirements
- Point-in-time recovery for DynamoDB
- Encrypted data storage
- Access logging and monitoring
