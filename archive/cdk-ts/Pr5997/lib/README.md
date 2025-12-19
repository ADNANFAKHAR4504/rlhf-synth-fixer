# Three-Tier Web Application Infrastructure

AWS CDK TypeScript implementation of a complete three-tier web application with React frontend, Node.js API backend, and PostgreSQL database.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CloudFront                            │
│  (/* → S3, /api/* → ALB)                                    │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │                            │
      ┌──────▼──────┐            ┌───────▼────────┐
      │  S3 Bucket  │            │      ALB       │
      │  (Frontend) │            │  (Port 80/443) │
      └─────────────┘            └────────┬───────┘
                                          │
                                  ┌───────▼────────┐
                                  │  ECS Fargate   │
                                  │  (API Backend) │
                                  │  Auto: 2-10    │
                                  └────────┬───────┘
                                           │
                                  ┌────────▼────────┐
                                  │ RDS PostgreSQL  │
                                  │   (Multi-AZ)    │
                                  └─────────────────┘
```

## Features

- **VPC**: Public and private subnets across 2 availability zones
- **NAT Gateway**: Enables private subnet outbound connectivity
- **RDS PostgreSQL**: Multi-AZ deployment with encryption at rest
- **ECS Fargate**: Container orchestration with auto-scaling (2-10 tasks)
- **Application Load Balancer**: Path-based routing for frontend and backend
- **S3 + CloudFront**: Static frontend hosting with global CDN
- **Secrets Manager**: Secure storage for database credentials
- **Parameter Store**: Application configuration management
- **CloudWatch**: Centralized logging for ECS and ALB
- **Custom Resource**: Automatic ECS service updates on configuration changes

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18.x or later
- AWS CDK CLI (`npm install -g aws-cdk`)
- Docker (for building container images)

## Project Structure

```
.
├── bin/
│   └── tap.ts                 # CDK app entry point
├── lib/
│   ├── tap-stack.ts           # Main stack definition
│   ├── PROMPT.md              # Original requirements
│   ├── MODEL_RESPONSE.md      # Initial LLM response
│   ├── MODEL_FAILURES.md      # Documented issues
│   ├── IDEAL_RESPONSE.md      # Corrected implementation
│   └── README.md              # This file
├── test/
│   └── tap-stack.test.ts      # Comprehensive unit tests
└── metadata.json              # Task metadata
```

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Bootstrap CDK (First Time Only)

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

### 3. Review Infrastructure

```bash
cdk synth --context environmentSuffix=dev
```

### 4. Deploy Stack

```bash
cdk deploy --context environmentSuffix=dev
```

### 5. Update Container Image

The default deployment uses a placeholder Node.js image. Replace it with your application:

1. Build and push your container image:
```bash
docker build -t customer-portal-api .
docker tag customer-portal-api:latest ACCOUNT-ID.dkr.ecr.us-east-1.amazonaws.com/customer-portal-api:latest
docker push ACCOUNT-ID.dkr.ecr.us-east-1.amazonaws.com/customer-portal-api:latest
```

2. Update `lib/tap-stack.ts` line 135:
```typescript
image: ecs.ContainerImage.fromRegistry('ACCOUNT-ID.dkr.ecr.us-east-1.amazonaws.com/customer-portal-api:latest'),
```

3. Redeploy:
```bash
cdk deploy --context environmentSuffix=dev
```

### 6. Deploy Frontend

```bash
# Build React app
npm run build

# Upload to S3
aws s3 sync ./build s3://customer-portal-frontend-dev-ACCOUNT-ID/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION-ID \
  --paths "/*"
```

## Application Requirements

Your Node.js API must:

1. **Listen on port 3000**
2. **Implement health endpoint**: `GET /health` returning 200 OK
3. **Read database credentials** from `DB_SECRET` environment variable
4. **Read configuration** from SSM Parameter Store using `PARAMETER_PATH` env var
5. **Connect to database** using:
   - `DB_HOST` - RDS endpoint
   - `DB_PORT` - Database port (5432)
   - `DB_NAME` - Database name (customerportal)

Example Node.js code:

```javascript
const express = require('express');
const app = express();

// Health check endpoint (required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// API endpoints
app.get('/api/users', async (req, res) => {
  // Your logic here
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Configuration Management

### Update API Configuration

```bash
# Update SSM parameter
aws ssm put-parameter \
  --name "/customer-portal/dev/api-config" \
  --value '{"apiPort":3000,"nodeEnv":"development","feature":"enabled"}' \
  --overwrite

# Trigger deployment (automatic via Custom Resource)
cdk deploy --context environmentSuffix=dev
```

The Custom Resource automatically triggers an ECS service update when configuration changes, ensuring zero-downtime deployments.

## Testing

### Run Unit Tests

```bash
npm test
```

Tests cover:
- VPC and networking resources
- RDS database configuration
- ECS cluster and service
- Auto-scaling policies
- Load balancer setup
- CloudFront and S3
- Security groups
- IAM roles and policies
- Custom resources
- Outputs and tagging

### Manual Testing

1. **Check CloudFront distribution**:
```bash
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
  --stack-name TapStackdev \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
  --output text)
echo $CLOUDFRONT_URL
```

2. **Test API health**:
```bash
curl https://${CLOUDFRONT_URL}/api/health
```

3. **Monitor logs**:
```bash
# ECS logs
aws logs tail /ecs/customer-portal-dev --follow

# ALB logs
aws logs tail /aws/alb/customer-portal-dev --follow
```

## Monitoring

### CloudWatch Dashboards

Access CloudWatch to monitor:
- ECS CPU/Memory utilization
- ALB request count and latency
- RDS database metrics
- Auto-scaling events

### Logs

- **ECS Container Logs**: `/ecs/customer-portal-{env}`
- **ALB Access Logs**: `/aws/alb/customer-portal-{env}`

## Cost Optimization

This infrastructure uses cost-effective resources:
- **VPC**: 1 NAT Gateway (consider Aurora Serverless for production)
- **RDS**: t3.micro instance (Multi-AZ for HA)
- **ECS**: Fargate spot pricing option available
- **CloudFront**: Pay-per-use with free tier
- **S3**: Standard storage with lifecycle policies

### Estimated Monthly Costs

- NAT Gateway: ~$32/month
- RDS t3.micro Multi-AZ: ~$30/month
- ECS Fargate (2 tasks): ~$20/month
- ALB: ~$23/month
- CloudFront: Variable based on traffic
- **Total**: ~$105-150/month (excluding traffic)

## Cleanup

To destroy all resources:

```bash
cdk destroy --context environmentSuffix=dev
```

This will remove:
- All infrastructure resources
- S3 bucket contents (autoDeleteObjects enabled)
- CloudWatch logs (7-day retention)
- Secrets Manager secrets
- Parameter Store parameters

## Key Fixes Applied

1. **Region Correction**: Changed from `ca-central-1` to `us-east-1`
2. **Custom Resource**: Added Lambda function for automatic ECS service updates
3. **Configuration Management**: SSM Parameter Store integration with auto-update
4. **Documentation**: Clear deployment and application requirements
5. **Security**: Proper IAM roles, security groups, and encryption
6. **High Availability**: Multi-AZ RDS, auto-scaling ECS, CloudFront CDN

## Troubleshooting

### ECS Tasks Not Starting

Check:
1. Container image is accessible
2. Task role has required permissions
3. Security groups allow ALB → ECS communication
4. Logs in CloudWatch for error messages

### ALB Health Checks Failing

Verify:
1. Application implements `/health` endpoint
2. Application listens on port 3000
3. Health check returns 200 status code
4. Security group allows ALB → ECS on port 3000

### Database Connection Issues

Check:
1. ECS security group in database security group ingress
2. Database credentials in Secrets Manager
3. Environment variables set correctly in task definition
4. RDS instance is available (Multi-AZ takes longer)

### CloudFront Not Serving Content

Verify:
1. S3 bucket has files uploaded
2. CloudFront OAC configured correctly
3. Bucket policy allows CloudFront access
4. Wait for distribution to deploy (15-20 minutes)

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review security group rules
3. Verify IAM permissions
4. Check AWS service quotas

## License

MIT
