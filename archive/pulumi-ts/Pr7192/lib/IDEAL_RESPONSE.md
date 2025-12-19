# Multi-Region Database Migration Infrastructure - Deployment Guide

This infrastructure provides a production-ready multi-region disaster recovery and database migration system using Pulumi with TypeScript.

## Architecture

- **Aurora PostgreSQL Global Database** (Serverless v2) across us-east-1, eu-west-1, and ap-southeast-1
- **ECS Fargate** clusters in all three regions with Application Load Balancers and blue-green deployment
- **DynamoDB** table for migration state tracking
- **Systems Manager Parameter Store** for configuration management
- **CloudWatch** dashboards and alarms with SNS notifications
- **Lambda** function for automated data validation
- **Optional**: AWS DMS replication and Site-to-Site VPN

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18.x or later
- Pulumi CLI installed
- AWS account with appropriate permissions

## Configuration

The infrastructure uses Pulumi configuration for environment-specific values. See `Pulumi.dev.yaml` for example configuration.

### Required Configuration

```bash
pulumi config set environmentSuffix "yourenv"  # Required: Unique identifier for your deployment
```

### Optional Configuration

```bash
pulumi config set createDms false              # Optional: Enable AWS DMS replication (default: false)
pulumi config set createVpn false              # Optional: Enable Site-to-Site VPN (default: false)
pulumi config set oracleEndpoint "oracle.example.com"  # Optional: Oracle source endpoint
pulumi config set customerGatewayIp "203.0.113.1"      # Optional: Customer gateway IP for VPN
```

## Deployment

1. **Initialize Pulumi Stack**:
   ```bash
   pulumi stack init dev
   ```

2. **Configure Environment**:
   ```bash
   pulumi config set environmentSuffix "test001"
   pulumi config set aws:region us-east-1
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Preview Infrastructure**:
   ```bash
   pulumi preview
   ```

5. **Deploy Infrastructure**:
   ```bash
   pulumi up
   ```

## Cost Optimization Features

- Aurora Serverless v2 with auto-scaling (0.5-1.0 ACU)
- Single NAT Gateway per region (not per AZ)
- Minimal ECS task sizes (256 CPU, 512 MB memory)
- VPC Endpoints for S3 and DynamoDB (no NAT charges)
- DMS and VPN are optional and disabled by default
- 7-day log retention for CloudWatch logs

**Estimated Monthly Cost**: $300-$500 (with optional features disabled)

## Outputs

After deployment, Pulumi provides these outputs:

- `vpcIds`: VPC IDs for all three regions
- `globalClusterIdentifier`: Aurora Global Cluster identifier
- `migrationTableName`: DynamoDB table name for migration state
- `validationLambdaArn`: Lambda function ARN for data validation
- `notificationTopicArn`: SNS topic ARN for notifications

## Validation

The infrastructure includes automated data validation:

- Lambda function runs every hour via EventBridge
- Validates row counts and checksums between source and target
- Publishes results to SNS topic
- Stores validation history in DynamoDB

## Optional Features

### AWS DMS Replication

To enable DMS replication:

```bash
pulumi config set createDms true
pulumi config set oracleEndpoint "your-oracle-host.example.com"
```

Note: DMS requires a real Oracle database connection. The default placeholder endpoint will not work for actual replication.

### Site-to-Site VPN

To enable VPN:

```bash
pulumi config set createVpn true
pulumi config set customerGatewayIp "YOUR.PUBLIC.IP.ADDRESS"
```

Note: VPN requires a real customer gateway IP address. The default RFC 5737 placeholder will not establish a connection.

## Monitoring

### CloudWatch Dashboard

Access the CloudWatch dashboard `migration-dashboard-{environmentSuffix}` to view:
- Aurora cluster metrics (connections, CPU, replication lag)
- ECS service metrics (CPU, memory utilization)
- Application health checks

### CloudWatch Alarms

Alarms are configured for:
- Aurora CPU utilization > 80%
- ECS CPU utilization > 80% (per region)

Notifications are sent to the SNS topic.

## Blue-Green Deployment

The ECS infrastructure supports blue-green deployments:

1. Both blue and green target groups are created
2. ALB listener initially routes 100% traffic to blue
3. To shift traffic:
   ```bash
   # Update ALB listener to route 50% to green
   # Then gradually increase green traffic weight
   ```

## Cleanup

To destroy all infrastructure:

```bash
pulumi destroy
```

All resources are configured to be destroyable (no Retain policies).

## Troubleshooting

### Aurora Global Database Timing

Aurora Global Database replication requires the primary cluster to reach "available" state before secondary clusters can attach. This can take 20-30 minutes. If secondary cluster creation fails:

1. Wait for primary cluster to be fully available
2. Run `pulumi up` again to retry secondary cluster creation

### Lambda VPC Configuration

The validation Lambda is deployed in a VPC. Ensure:
- Private subnets have NAT Gateway access
- VPC endpoints are configured for AWS services
- Security groups allow outbound HTTPS traffic

### Cost Management

Monitor costs using AWS Cost Explorer. Key cost drivers:
- NAT Gateways (~$32/month each)
- Aurora Serverless ACU consumption
- ECS Fargate task hours
- Data transfer between regions

## Security Considerations

- All Aurora clusters use encryption at rest (KMS)
- Security groups follow least privilege principles
- IAM roles use minimal required permissions
- Database credentials use Pulumi secrets
- Systems Manager parameters use SecureString type

## Support

For issues or questions about this infrastructure:

1. Review CloudWatch logs for error messages
2. Check Pulumi stack outputs for resource identifiers
3. Verify configuration values in Pulumi.dev.yaml
4. Consult AWS service documentation for specific services