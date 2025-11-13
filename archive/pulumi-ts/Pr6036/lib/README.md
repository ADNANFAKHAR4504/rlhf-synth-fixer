# Order Processing API Infrastructure

This Pulumi TypeScript program deploys a production-grade containerized order processing API on AWS.

## Architecture

- **VPC**: 3 availability zones with public and private subnets
- **NAT Gateways**: One per AZ for outbound connectivity from private subnets
- **ECS Fargate**: Containerized application with Spot and regular capacity providers (50/50 split)
- **Application Load Balancer**: Internet-facing ALB with health checks
- **RDS Aurora MySQL**: Multi-AZ cluster with read replicas
- **AWS WAF**: Rate limiting (100 requests per 5 minutes per IP)
- **Secrets Manager**: Database credentials storage
- **Parameter Store**: Application configuration
- **CloudWatch**: Container Insights, custom dashboard, alarms
- **Blue-Green Deployment**: Two target groups for traffic shifting

## Prerequisites

1. Pulumi CLI installed
2. AWS CLI configured with appropriate credentials
3. Node.js 18+ and npm
4. Docker image pushed to ECR repository

## Configuration

Create a Pulumi stack and set the required configuration:

```bash
pulumi stack init dev
pulumi config set environmentSuffix <your-suffix>
pulumi config set aws:region us-east-1
```

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Preview changes:
   ```bash
   pulumi preview
   ```

3. Deploy infrastructure:
   ```bash
   pulumi up
   ```

4. Push your Docker image to the created ECR repository:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-url>
   docker tag order-api:latest <ecr-url>:latest
   docker push <ecr-url>:latest
   ```

5. Update ECS service to pull the new image:
   ```bash
   aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment
   ```

## Outputs

After deployment, the following outputs are available:

- `albDnsName`: DNS name of the Application Load Balancer
- `ecsServiceArn`: ARN of the ECS service
- `rdsClusterEndpoint`: Writer endpoint of the Aurora cluster
- `rdsReaderEndpoint`: Reader endpoint for read operations
- `ecrRepositoryUrl`: URL of the ECR repository
- `blueTargetGroupArn`: ARN of the blue target group
- `greenTargetGroupArn`: ARN of the green target group
- `dashboardUrl`: CloudWatch dashboard URL

## Blue-Green Deployment

To perform a blue-green deployment:

1. Deploy new version to green target group
2. Test the green environment
3. Update ALB listener to shift traffic from blue to green
4. Monitor the deployment
5. Roll back by switching listener back to blue if issues occur

## Auto-Scaling

The service automatically scales based on:

- **CPU Utilization**: Target 70%, scales between 3-10 tasks
- **Pending Orders**: Custom metric, target 100 orders, scales between 3-10 tasks

## Monitoring

- **Container Insights**: Enabled at cluster level for detailed metrics
- **CloudWatch Dashboard**: Visual representation of key metrics
- **Alarms**:
  - High error rate (5XX responses > 10 in 5 minutes)
  - High database connections (> 80 connections)

## Security

- **VPC Isolation**: ECS tasks and RDS in private subnets
- **Security Groups**: Least privilege access between components
- **Secrets Manager**: Database credentials encrypted at rest
- **WAF**: Rate limiting to prevent abuse
- **Encryption**: RDS storage encrypted, HTTPS for ALB

## Cost Optimization

- **Fargate Spot**: 50% of tasks run on Spot instances (60-70% cost savings)
- **Aurora Serverless**: Consider for variable workloads
- **Auto-scaling**: Scales down during low traffic periods
- **Log Retention**: 7 days to reduce storage costs

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Troubleshooting

### ECS Tasks Not Starting

- Check CloudWatch logs: `/ecs/order-api-<suffix>`
- Verify ECR image exists and is accessible
- Check security group rules allow ALB to ECS communication

### High Database Connections

- Review connection pooling in application
- Check for connection leaks
- Consider read replicas for read-heavy workloads

### WAF Blocking Legitimate Traffic

- Review WAF metrics in CloudWatch
- Adjust rate limit threshold if needed
- Add IP whitelist rules for known good actors

## Support

For issues or questions, please contact the DevOps team.
