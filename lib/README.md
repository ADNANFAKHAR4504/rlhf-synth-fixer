```markdown
# Multi-Region Payment Processing API with Automated Failover

## Overview

This Pulumi TypeScript program deploys a highly available payment processing API with automatic regional failover between AWS us-east-1 and us-east-2 regions. The infrastructure includes API Gateway REST APIs, Lambda functions, DynamoDB global tables, S3 cross-region replication, Route53 health checks with failover DNS, CloudWatch Synthetics canaries, Secrets Manager replication, SNS notifications, and comprehensive CloudWatch monitoring.

## Architecture

### Multi-Region Design
- Primary Region: us-east-1
- Secondary Region: us-east-2
- Failover Time: < 2 minutes (Route53 health checks every 30 seconds with 3 failure threshold)

### Components

**Compute & API:**
- API Gateway REST APIs in both regions
- Lambda functions for payment processing (10s timeout)
- Lambda functions for health checks (1s timeout)
- VPC configuration with private subnets

**Data Storage:**
- DynamoDB Global Tables with point-in-time recovery
- S3 buckets with cross-region replication for audit logs
- Lifecycle policies (30d IA, 90d Glacier)

**Networking:**
- VPCs in both regions (10.0.0.0/16 and 10.1.0.0/16)
- Private subnets across multiple AZs
- VPC endpoints for DynamoDB, Secrets Manager, CloudWatch Logs

**DNS & Failover:**
- Route53 hosted zone for custom domain
- Health checks monitoring API Gateway endpoints
- Failover routing (PRIMARY/SECONDARY)

**Monitoring:**
- CloudWatch Synthetics canaries testing endpoints every 5 minutes
- CloudWatch alarms for latency (>500ms) and errors (>1%)
- SNS topics for email notifications

**Security:**
- Secrets Manager with cross-region replication
- Systems Manager Parameter Store for configuration
- IAM roles with least privilege
- S3 public access blocks

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions for multi-region deployments

## Deployment Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Pulumi Stack

```bash
# Initialize stack
pulumi stack init dev

# Set required configuration
pulumi config set environmentSuffix <unique-suffix>  # e.g., dev123
pulumi config set notificationEmail <your-email>
pulumi config set hostedZoneDomain <domain>  # e.g., payment-api-dev123.example.com
pulumi config set aws:region us-east-1
```

### 3. Deploy Infrastructure

```bash
pulumi up
```

Review the preview and confirm deployment. Deployment takes approximately 15-20 minutes.

### 4. Post-Deployment Steps

1. **Confirm SNS subscriptions**: Check your email for SNS subscription confirmation emails from both regions

2. **Update secrets**: Rotate placeholder secrets in Secrets Manager:
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id payment-api-secret-<suffix> \
     --secret-string '{"apiKey":"real-key","dbPassword":"real-password"}' \
     --region us-east-1
   ```

3. **Configure DNS**: Update your domain registrar to use the Route53 nameservers:
   ```bash
   pulumi stack output hostedZoneNameServers
   ```

## Testing

### Test Health Endpoints

```bash
# Primary region
curl https://$(pulumi stack output primaryApiUrl | tr -d '"')/health

# Secondary region
curl https://$(pulumi stack output secondaryApiUrl | tr -d '"')/health

# Failover domain (after DNS propagation)
curl https://$(pulumi stack output failoverDomain | tr -d '"')/health
```

### Test Payment Endpoint

```bash
curl -X POST https://$(pulumi stack output primaryApiUrl | tr -d '"')/payment \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"USD","customerId":"test-123"}'
```

### Test Failover

1. Monitor Route53 health checks in AWS Console
2. Simulate primary region failure (stop Lambda or API Gateway)
3. Verify health check status changes
4. Confirm failover DNS switches to secondary within 2 minutes
5. Test payment endpoint continues working via failover domain

### Verify Data Replication

```bash
# Query DynamoDB in primary region
aws dynamodb scan --table-name payment-transactions-<suffix> --region us-east-1

# Verify same data in secondary region
aws dynamodb scan --table-name payment-transactions-<suffix> --region us-east-2
```

## Monitoring

### CloudWatch Dashboards

View in AWS Console:
- API Gateway metrics (latency, errors, requests)
- Lambda metrics (duration, errors, throttles)
- DynamoDB metrics (read/write capacity, replication lag)
- Route53 health check status

### CloudWatch Alarms

Alarms will send SNS notifications when:
- Primary or secondary health check fails
- API latency exceeds 500ms
- API error count exceeds 10 in 5 minutes

### Synthetics Canaries

View canary test results in CloudWatch Synthetics console:
- Success/failure rates
- Endpoint response times
- Screenshot and HAR file artifacts

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Confirm deletion when prompted. All resources are fully destroyable.

## Resource Naming

All resources include the `environmentSuffix` for uniqueness:
- S3 buckets: `payment-audit-logs-primary-<suffix>`
- DynamoDB tables: `payment-transactions-<suffix>`
- Lambda functions: `payment-processor-primary-<suffix>`
- API Gateway APIs: `payment-api-primary-<suffix>`
- SNS topics: `payment-failover-topic-primary-<suffix>`
- Secrets: `payment-api-secret-<suffix>`
- Parameters: `/payment-processing/<suffix>/config`

## Cost Optimization

This infrastructure uses:
- Pay-per-request DynamoDB billing
- Lambda with reasonable memory (256MB payment, 128MB health)
- VPC endpoints instead of NAT Gateways (saves ~$90/month)
- S3 lifecycle policies (reduces storage costs)
- Short CloudWatch log retention (7 days)

Estimated monthly cost: $50-100 depending on request volume.

## Troubleshooting

### Lambda Functions Timeout

- Check VPC endpoint connectivity
- Verify security group egress rules
- Check CloudWatch Logs for errors

### Failover Not Working

- Verify health checks are passing
- Check Route53 health check configuration
- Confirm DNS has propagated (use `dig` or `nslookup`)

### Canaries Failing

- Check canary CloudWatch Logs
- Verify API Gateway stage is deployed
- Confirm Lambda permissions for API Gateway

### DynamoDB Replication Lag

- Check DynamoDB streams are enabled
- Verify cross-region replication status in console
- Monitor replication metrics in CloudWatch

## Security Considerations

- All S3 buckets have public access blocked
- Lambda functions use VPC isolation
- IAM roles follow least privilege
- Secrets stored in Secrets Manager with encryption
- API Gateway uses AWS_PROXY integration (input validation needed in Lambda)

## Future Enhancements

- Add API Gateway custom domains with ACM certificates
- Implement API Gateway WAF rules
- Add CloudWatch dashboard
- Implement Lambda layer for shared dependencies
- Add X-Ray tracing
- Implement automated backup testing
- Add cost allocation tags
```
