# Multi-Region Disaster Recovery Solution

This Pulumi TypeScript program implements a comprehensive automated multi-region disaster recovery solution for a financial services trading platform.

## Architecture

The solution spans two AWS regions (us-east-1 as primary and us-west-2 as secondary) with the following components:

### Data Layer
- **DynamoDB Global Table**: Transaction data replicated across both regions with point-in-time recovery enabled
- **S3 Cross-Region Replication**: Document storage with RTC enabled for faster replication

### Compute Layer
- **Lambda Functions**: Identical business logic deployed in both regions with reserved concurrency of 100 units
- Runtime: Node.js 18.x with 512MB memory

### Network Layer
- **VPCs**: Separate VPCs in each region with multi-AZ public subnets
- **Application Load Balancers**: ALBs in each region for distributing traffic to Lambda functions

### DNS and Health Monitoring
- **Route53 Hosted Zone**: DNS management with failover routing policy
- **Health Checks**: 30-second interval checks monitoring primary ALB
- **CloudWatch Alarms**: Alert on health check failures

### Configuration and Notifications
- **SSM Parameter Store**: SecureString parameters storing region-specific endpoints
- **SNS Topics**: Notification topics in both regions for failover events

## Prerequisites

- Pulumi CLI (v3.x or later)
- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- Access to us-east-1 and us-west-2 regions

## Configuration

Create a Pulumi stack configuration file:

```yaml
config:
  tap:environmentSuffix: "prod-01"
  tap:domainName: "trading.example.com"
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

3. Set required configuration:
```bash
pulumi config set environmentSuffix prod-01
pulumi config set domainName trading.example.com
```

4. Preview changes:
```bash
pulumi preview
```

5. Deploy infrastructure:
```bash
pulumi up
```

## Failover Behavior

The system automatically handles regional failures:

1. Route53 health checks monitor the primary ALB every 30 seconds
2. On failure (3 consecutive failed checks = 90 seconds), health check status changes
3. CloudWatch alarm triggers, sending notification to SNS topic
4. Route53 automatically routes traffic to secondary region record
5. Total failover time: < 5 minutes (90s detection + DNS propagation)

## Resource Naming Convention

All resources follow the pattern: `{service}-{region}-{environment}-{purpose}`

Examples:
- `dr-vpc-us-east-1-production-primary`
- `dr-alb-us-west-2-production-secondary`
- `dr-function-us-east-1-production-primary`

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Security Considerations

- All IAM roles follow least-privilege principle with no wildcard permissions
- S3 buckets have versioning enabled for data protection
- SSM parameters use SecureString encryption
- Lambda functions have reserved concurrency to prevent resource exhaustion
- ALB security groups restrict traffic to HTTPS/HTTP only

## Cost Optimization

- DynamoDB uses on-demand billing mode
- Lambda functions have reserved concurrency limits
- S3 lifecycle policies can be added for cost management
- Multi-AZ deployment provides availability without NAT Gateways

## Monitoring

Key metrics to monitor:
- Route53 health check status
- DynamoDB replication lag
- S3 replication time
- Lambda execution errors and duration
- ALB target health

## Support

For issues or questions, refer to the Pulumi documentation or AWS service documentation.
