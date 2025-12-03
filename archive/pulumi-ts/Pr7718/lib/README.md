# ECS Fargate Optimization - Deployment Guide

This Pulumi TypeScript project provides an optimized ECS Fargate deployment with cost-effective resource allocation, proper IAM permissions, CloudWatch log retention, auto-scaling, and comprehensive tagging.

## Prerequisites

- Node.js 20+
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Docker (for building and pushing container images)

## Project Structure

```
.
├── lib/
│   ├── index.ts           # Main infrastructure code
│   ├── PROMPT.md          # Original requirements
│   ├── MODEL_RESPONSE.md  # Generated code documentation
│   └── optimize.py        # Optimization script (if needed)
├── test/                  # Unit and integration tests
├── Pulumi.yaml           # Pulumi project configuration
├── package.json          # Node.js dependencies
└── tsconfig.json         # TypeScript configuration
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

## Configuration

Set the required Pulumi configuration:

```bash
# Set environment suffix (required)
pulumi config set environmentSuffix dev123

# Verify configuration
pulumi config
```

## Container Image Preparation

Before deploying, you need to build and push your container image:

1. Create a minimal test application (if you don't have one):
   ```bash
   mkdir -p app
   cat > app/server.js << 'EOF'
   const http = require('http');
   const PORT = process.env.PORT || 3000;

   const server = http.createServer((req, res) => {
     if (req.url === '/health') {
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify({ status: 'healthy' }));
     } else {
       res.writeHead(200, { 'Content-Type': 'text/plain' });
       res.end('Hello from ECS Fargate!');
     }
   });

   server.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   EOF

   cat > app/Dockerfile << 'EOF'
   FROM node:20-alpine
   WORKDIR /app
   COPY server.js .
   EXPOSE 3000
   CMD ["node", "server.js"]
   EOF
   ```

2. Deploy the infrastructure first to create ECR repository:
   ```bash
   pulumi up
   ```

3. Get ECR repository URL:
   ```bash
   export ECR_REPO=$(pulumi stack output ecrRepositoryUrl)
   echo "ECR Repository: $ECR_REPO"
   ```

4. Build and push the image:
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPO

   # Build image
   docker build -t app:latest app/

   # Tag image
   docker tag app:latest $ECR_REPO:latest

   # Push image
   docker push $ECR_REPO:latest
   ```

5. Update the stack to use the new image:
   ```bash
   pulumi up
   ```

## Deployment

Deploy the infrastructure:

```bash
pulumi up
```

Review the preview and confirm to deploy all resources.

## Accessing the Application

Get the service URL:

```bash
pulumi stack output serviceUrl
```

Test the application:

```bash
# Get service URL
SERVICE_URL=$(pulumi stack output serviceUrl)

# Test main endpoint
curl $SERVICE_URL

# Test health check endpoint
curl $SERVICE_URL/health
```

## Stack Outputs

The stack exports the following outputs:

- `serviceUrl`: Load balancer DNS name for accessing the application
- `taskDefinitionArn`: ECS task definition ARN
- `ecrRepositoryUrl`: ECR repository URL for pushing images
- `clusterName`: ECS cluster name
- `serviceName`: ECS service name

View all outputs:

```bash
pulumi stack output
```

## Cost Optimizations Implemented

1. **Right-sized Resources**
   - CPU: 512 units (down from 2048)
   - Memory: 1024 MB (down from 4096 MB)
   - Estimated savings: ~75% on compute costs

2. **CloudWatch Logs**
   - 7-day retention period
   - Prevents infinite log storage costs

3. **IAM Security**
   - Minimal permissions (no AdministratorAccess)
   - Separate task execution and task roles

4. **Auto-Scaling**
   - Scales based on 70% CPU utilization
   - Only pay for what you need

5. **Resource Tagging**
   - Enables cost tracking and allocation
   - Tags: Environment, Team, CostCenter

## Monitoring

View ECS service status:

```bash
aws ecs describe-services \
  --cluster $(pulumi stack output clusterName) \
  --services $(pulumi stack output serviceName) \
  --region us-east-1
```

View CloudWatch logs:

```bash
aws logs tail /ecs/fargate-app-$(pulumi config get environmentSuffix) --follow
```

## Scaling

The service auto-scales based on CPU utilization:

- **Target**: 70% CPU
- **Min tasks**: 2
- **Max tasks**: 10
- **Scale out cooldown**: 60 seconds
- **Scale in cooldown**: 300 seconds

Force manual scaling (if needed):

```bash
aws ecs update-service \
  --cluster $(pulumi stack output clusterName) \
  --service $(pulumi stack output serviceName) \
  --desired-count 3 \
  --region us-east-1
```

## Testing

Run unit tests:

```bash
npm test
```

Run unit tests only:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```

## Cleanup

Destroy all resources:

```bash
pulumi destroy
```

Confirm the destruction when prompted.

Remove the stack:

```bash
pulumi stack rm
```

## Troubleshooting

### ECS Task Fails to Start

1. Check CloudWatch logs:
   ```bash
   aws logs tail /ecs/fargate-app-$(pulumi config get environmentSuffix) --follow
   ```

2. Check ECS service events:
   ```bash
   aws ecs describe-services \
     --cluster $(pulumi stack output clusterName) \
     --services $(pulumi stack output serviceName) \
     --query 'services[0].events[0:10]' \
     --region us-east-1
   ```

### Image Pull Errors

Verify ECR repository has the image:

```bash
aws ecr describe-images \
  --repository-name app-repo-$(pulumi config get environmentSuffix) \
  --region us-east-1
```

### Health Check Failures

The health check expects:
- **Path**: `/health`
- **Port**: 3000
- **Response**: HTTP 200

Ensure your application responds to health checks on port 3000.

### Permission Errors

Verify IAM roles:

```bash
aws iam get-role --role-name ecs-task-execution-$(pulumi config get environmentSuffix)
aws iam get-role --role-name ecs-task-$(pulumi config get environmentSuffix)
```

## Architecture

The infrastructure consists of:

- **ECS Fargate Cluster**: Container orchestration
- **Application Load Balancer**: HTTP traffic distribution
- **ECR Repository**: Container image storage
- **CloudWatch Log Group**: Centralized logging with 7-day retention
- **IAM Roles**: Task execution and task permissions
- **Security Groups**: Network access control
- **Auto Scaling**: Automatic capacity management based on CPU

## Security Features

- Minimal IAM permissions (least privilege)
- Security groups restrict traffic to necessary ports only
- Container image scanning enabled on ECR
- CloudWatch Container Insights enabled
- No public IP exposure (ALB handles ingress)

## Performance Characteristics

- **CPU**: 512 units (0.5 vCPU)
- **Memory**: 1024 MB
- **Network**: awsvpc mode with enhanced networking
- **Launch Type**: Fargate (serverless)
- **Health Check**: 30s interval, 5s timeout

## Support

For issues or questions:
1. Check CloudWatch logs for application errors
2. Review ECS service events for deployment issues
3. Verify security group rules for connectivity problems
4. Check IAM roles for permission errors
