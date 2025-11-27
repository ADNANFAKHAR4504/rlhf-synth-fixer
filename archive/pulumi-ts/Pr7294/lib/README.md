# Production-Ready Web Application Infrastructure

A complete Pulumi TypeScript implementation for deploying a highly available, production-grade web application infrastructure on AWS with real-time WebSocket support, global content delivery, and multi-AZ deployment.

## Architecture Overview

This infrastructure provides a complete SaaS platform with:

- **Multi-AZ High Availability**: VPC spanning 3 availability zones in us-west-2
- **Scalable Compute**: Auto Scaling Groups with ARM-based Graviton instances
- **Load Balancing**: Application Load Balancer with WebSocket sticky session support
- **Database**: Aurora PostgreSQL Serverless v2 with IAM authentication
- **Global CDN**: CloudFront distribution for sub-50ms static content delivery
- **Monitoring**: CloudWatch Logs with JSON-structured logging
- **Security**: Least-privilege IAM roles, encryption at rest and in transit
- **Configuration Management**: AWS Systems Manager Parameter Store

## Infrastructure Components

### 1. Network Infrastructure
- VPC with public and private subnets across 3 AZs
- Internet Gateway for public internet access
- NAT Gateways (one per AZ) for private subnet outbound access
- Route tables and associations

### 2. Security Groups
- ALB security group (allows HTTP/HTTPS from internet)
- EC2 security group (allows traffic only from ALB)
- RDS security group (allows PostgreSQL from EC2 only)

### 3. IAM Roles
- EC2 instance role with:
  - SSM access for management
  - CloudWatch agent permissions
  - RDS IAM database authentication
  - Parameter Store read access

### 4. Compute Resources
- Launch Template with ARM-based t4g.micro instances
- Auto Scaling Group (2-6 instances)
- Auto Scaling policies based on CPU metrics
- CloudWatch alarms for scale up/down triggers

### 5. Load Balancing
- Application Load Balancer in public subnets
- Target group with health checks
- Sticky sessions enabled for WebSocket support

### 6. Database
- Aurora PostgreSQL Serverless v2 cluster
- IAM authentication enabled
- Multi-AZ deployment
- Automated backups with 7-day retention

### 7. Content Delivery
- CloudFront distribution with two origins:
  - S3 for static assets
  - ALB for dynamic content
- Origin Access Identity for secure S3 access

### 8. Storage
- S3 bucket for static assets
- Versioning enabled
- Encryption at rest
- Block all public access

### 9. Monitoring
- CloudWatch Log Groups with 30-day retention
- JSON-structured logging
- Route 53 health checks

### 10. Configuration
- Systems Manager Parameter Store for:
  - Database endpoint
  - Application configuration

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 18.x or later
- AWS CLI configured with credentials
- AWS account with appropriate permissions

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Pulumi stack:
```bash
pulumi config set environmentSuffix prod-001
pulumi config set environment production
pulumi config set project saas-webapp
pulumi config set costCenter engineering
pulumi config set --secret dbPassword <your-secure-password>
pulumi config set enableDeletionProtection false  # or true for production
```

## Deployment

### Deploy Infrastructure

```bash
pulumi up
```

Review the preview and select "yes" to proceed.

### Verify Deployment

After deployment completes, Pulumi will export:
- `vpcId`: The VPC ID
- `albDnsName`: ALB DNS name for direct access
- `cloudFrontDomain`: CloudFront domain for global access
- `dbClusterEndpoint`: Aurora cluster endpoint
- `staticAssetsBucketName`: S3 bucket name
- `asgName`: Auto Scaling Group name

### Access Application

1. Via CloudFront (recommended):
```bash
curl https://$(pulumi stack output cloudFrontDomain)
```

2. Via ALB (direct):
```bash
curl http://$(pulumi stack output albDnsName)
```

3. Health check:
```bash
curl http://$(pulumi stack output albDnsName)/health
```

## Configuration Parameters

All configuration is managed via Pulumi config:

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| environmentSuffix | Yes | - | Unique suffix for resource names |
| environment | No | production | Environment name (dev/staging/prod) |
| project | No | saas-webapp | Project name for tagging |
| costCenter | No | engineering | Cost center for billing |
| dbPassword | Yes | - | Database master password (secret) |
| enableDeletionProtection | No | false | Enable deletion protection for RDS/ALB |

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Examples:
- VPC: `vpc-prod-001`
- ALB: `alb-prod-001`
- RDS: `aurora-cluster-prod-001`
- ASG: `asg-prod-001`

## Cost Optimization

This infrastructure is optimized for cost efficiency:

- **ARM-based instances**: t4g.micro Graviton instances (~40% cheaper than x86)
- **Aurora Serverless v2**: Scales down to 0.5 ACU when idle
- **Right-sized NAT Gateways**: Only as many as needed per AZ
- **Efficient caching**: CloudFront reduces origin requests

### Estimated Monthly Costs (Base Configuration)

| Service | Monthly Cost |
|---------|--------------|
| VPC/Networking | Free |
| NAT Gateways (3x) | $96 |
| EC2 (2x t4g.micro) | $12 |
| Aurora Serverless v2 | $50-100 |
| ALB | $23 |
| CloudFront | $10 |
| CloudWatch Logs | $5 |
| S3 | $5 |
| Route 53 | $1 |
| **Total** | **$202-252** |

Well under the $500/month target!

## Security Features

1. **Network Isolation**: Private subnets for compute and database
2. **Least Privilege IAM**: Minimal permissions for each service
3. **Encryption**: Data encrypted at rest (S3, RDS) and in transit (HTTPS)
4. **No Hard-coded Credentials**: IAM authentication for database
5. **Security Groups**: Strict ingress/egress rules
6. **IMDSv2**: Required for EC2 metadata access

## High Availability

1. **Multi-AZ**: Resources span 3 availability zones
2. **Auto Scaling**: Automatically adjusts capacity based on demand
3. **Health Checks**: ALB and Route 53 health checks
4. **Database Failover**: Aurora automatically fails over to standby
5. **CloudFront**: Global edge locations for resilience

## Monitoring and Logging

1. **CloudWatch Logs**: Centralized logging with 30-day retention
2. **JSON Format**: Structured logs for easy parsing
3. **Metrics**: CPU, memory, and custom metrics
4. **Alarms**: Auto Scaling triggered by CloudWatch alarms
5. **Health Checks**: Route 53 monitors endpoint health

## Blue-Green Deployment Support

The infrastructure supports blue-green deployments:

1. Create new Auto Scaling Group with updated AMI
2. Register new ASG with ALB target group
3. Gradually shift traffic using weighted routing
4. Deregister old ASG when confident
5. Zero downtime during deployment

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

**Note**: With `enableDeletionProtection: false`, all resources can be destroyed. Set to `true` in production to prevent accidental deletion.

## Troubleshooting

### EC2 Instances Not Healthy
- Check security group rules
- Verify user data script execution: `sudo cat /var/log/cloud-init-output.log`
- Check application logs: `sudo cat /var/log/app.log`

### Database Connection Issues
- Verify security group allows traffic from EC2
- Check IAM authentication is configured
- Verify database endpoint in Parameter Store

### CloudFront Not Serving Content
- Check S3 bucket policy allows CloudFront OAI
- Verify ALB security group allows CloudFront traffic
- Check CloudFront distribution status (wait 15-20 minutes after creation)

### Auto Scaling Not Working
- Verify CloudWatch alarms are in ALARM state
- Check scaling policies are attached
- Review ASG activity history

## Development

### Project Structure
```
.
├── index.ts              # Main infrastructure code
├── Pulumi.yaml           # Pulumi project configuration
├── Pulumi.dev.yaml       # Development stack configuration
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
└── lib/
    ├── PROMPT.md         # Original requirements
    ├── MODEL_RESPONSE.md # Generated code documentation
    └── README.md         # This file
```

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run build
```

## Best Practices

1. **Always use environmentSuffix**: Enables multiple deployments
2. **Use secrets for sensitive data**: `pulumi config set --secret`
3. **Enable deletion protection in production**: Prevents accidental deletion
4. **Tag all resources**: Enables cost tracking and management
5. **Review changes before deployment**: Always check `pulumi preview`

## Support

For issues or questions:
1. Check CloudWatch Logs for application errors
2. Review Pulumi state: `pulumi stack`
3. Validate configuration: `pulumi config`
4. Check AWS Console for resource status

## License

This infrastructure code is provided as-is for the SaaS web application project.
