# Blue-Green Payment Processing Infrastructure

This infrastructure implements a complete blue-green deployment architecture for payment processing with PCI DSS compliance on AWS using Pulumi and Python.

## Architecture Overview

The infrastructure includes:

- **Dual VPC Architecture**: Separate VPCs for blue and green environments with Transit Gateway
- **Application Load Balancer**: Weighted routing between blue and green target groups
- **RDS Aurora MySQL**: Encrypted clusters in both environments with cross-region DR
- **Lambda Functions**: Payment processing functions in both environments
- **SQS Queues**: Message queues with dead letter queues for failure handling
- **Route 53**: Health checks and failover routing
- **CloudWatch**: Monitoring dashboards and alarms
- **AWS WAF**: Web application firewall with OWASP rules
- **AWS Config**: Compliance monitoring
- **VPC Endpoints**: Cost-optimized private connectivity

## Deployment

### Prerequisites

- Python 3.9+
- Pulumi CLI 3.x
- AWS credentials configured

### Deploy

```bash
pulumi up
```

### Outputs

- ALB DNS Name
- Blue RDS Endpoint
- Green RDS Endpoint
- CloudWatch Dashboard URL

## Security Features

- KMS encryption for all data at rest
- TLS 1.2+ for data in transit
- WAF protection against OWASP Top 10
- VPC Flow Logs for audit trail
- Secrets Manager for credentials
- IAM least privilege policies
- Network isolation with security groups

## Blue-Green Deployment Strategy

The infrastructure supports gradual traffic migration:

1. Deploy green environment alongside blue
2. Use ALB weighted routing to shift traffic (80/20, 50/50, 20/80)
3. Monitor CloudWatch dashboards for issues
4. Failback to blue within 5 minutes if needed
5. Decommission blue after successful migration

## Compliance

- PCI DSS compliant architecture
- AWS Config for continuous compliance monitoring
- CloudWatch Logs retention
- Encrypted storage and transit
