# Payment Processing Migration Infrastructure

CDKTF Python implementation for migrating a payment processing system from on-premises to AWS with phased migration support, monitoring, and rollback capabilities.

## Architecture Overview

This infrastructure provisions:
- VPC with 3 public and 3 private subnets across 3 availability zones
- RDS Aurora MySQL cluster (1 writer, 2 readers)
- Auto Scaling group (3-9 instances) with Application Load Balancer
- AWS DMS for database replication from on-premises
- Route 53 weighted routing for gradual traffic migration
- CloudWatch dashboards for monitoring migration progress
- KMS encryption for all data at rest

## Prerequisites

- Python 3.9+
- pipenv
- Node.js 16+ (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform 1.5+
- Existing VPN connection to on-premises (referenced via data source)
- Existing Secrets Manager secret named `payment-db-credentials` with structure:
  ```json
  {
    "password": "aurora-admin-password",
    "dms_password": "dms-source-password"
  }
  ```

## Installation

```bash
# Install dependencies
pipenv install

# Install CDKTF CLI
npm install -g cdktf-cli

# Verify installation
cdktf --version
```

## Configuration

### Workspaces

This configuration supports two workspaces for phased migration:

```bash
# Create workspaces
cdktf deploy --auto-approve
terraform workspace new legacy-sync
terraform workspace new aws-production

# List workspaces
terraform workspace list

# Switch workspace
terraform workspace select aws-production
```

### Variables

Key variables you can configure:

- `environment_suffix`: Unique suffix for resource naming (default: "dev")
- `workspace`: Workspace name - "legacy-sync" or "aws-production" (default: "aws-production")
- `traffic_weight`: Traffic weight for Route53 routing, 0-100 (default: 50)

## Deployment

### Initial Deployment

```bash
# Synthesize CDKTF to Terraform
pipenv run cdktf synth

# Deploy infrastructure
pipenv run cdktf deploy

# Or with custom variables
pipenv run cdktf deploy -var="environment_suffix=prod" -var="traffic_weight=10"
```

### Phased Migration Process

1. **Initial Setup (0% traffic to AWS)**
   ```bash
   pipenv run cdktf deploy -var="traffic_weight=0"
   ```

2. **Start DMS Replication**
   - Monitor CloudWatch dashboard for replication lag
   - Verify data consistency

3. **Gradual Traffic Shift**
   ```bash
   # 10% to AWS
   pipenv run cdktf deploy -var="traffic_weight=10"

   # Monitor and verify
   # Then increase gradually
   pipenv run cdktf deploy -var="traffic_weight=25"
   pipenv run cdktf deploy -var="traffic_weight=50"
   pipenv run cdktf deploy -var="traffic_weight=75"
   pipenv run cdktf deploy -var="traffic_weight=100"
   ```

4. **Rollback if Needed**
   ```bash
   # Reduce traffic back to on-premises
   pipenv run cdktf deploy -var="traffic_weight=0"
   ```

## Monitoring

### CloudWatch Dashboard

Access the CloudWatch dashboard in AWS Console:
- Dashboard name: `payment-migration-{environment_suffix}`
- Metrics include:
  - ALB response time and request count
  - RDS CPU and database connections
  - DMS replication lag (source and target)
  - EC2 Auto Scaling CPU utilization

### Key Metrics to Monitor

1. **DMS Replication Lag**: Should be < 5 seconds
2. **ALB Target Health**: All targets should be healthy
3. **RDS Performance**: Monitor CPU, connections, and slow queries
4. **Auto Scaling**: Ensure 3-9 instances based on load

## Outputs

After deployment, the following outputs are available:

```bash
pipenv run cdktf output
```

- `alb_dns_name`: ALB DNS for application access
- `rds_cluster_endpoint`: Aurora writer endpoint
- `rds_reader_endpoint`: Aurora reader endpoint
- `dms_replication_status`: Current DMS task status
- `vpc_id`: VPC identifier
- `vpn_connection_id`: VPN connection to on-premises

## Testing

### Unit Tests

```bash
# Run unit tests
pipenv run pytest tests/unit/ -v
```

### Integration Tests

```bash
# Run integration tests (requires deployed infrastructure)
pipenv run pytest tests/integration/ -v
```

## Security

- All data encrypted at rest using KMS
- All data in transit encrypted using TLS/SSL
- Security groups follow principle of least privilege
- IAM roles with minimal required permissions
- Database credentials stored in AWS Secrets Manager
- VPC with public/private subnet isolation

## Cleanup

```bash
# Destroy infrastructure
pipenv run cdktf destroy

# Clean up CDKTF generated files
rm -rf cdktf.out
```

## Troubleshooting

### DMS Replication Issues
- Check CloudWatch Logs for DMS task
- Verify source and target endpoints are reachable
- Ensure security groups allow MySQL traffic

### Auto Scaling Not Working
- Check target group health checks
- Verify application is responding on port 8080
- Check CloudWatch metrics for scaling policies

### Route 53 Routing Issues
- Verify hosted zone configuration
- Check weighted routing policy weights
- Ensure ALB is healthy

## Cost Optimization

This configuration uses:
- Aurora Serverless v2 (consider for lower costs)
- t3.medium instances (right-sized for workload)
- Single NAT gateway per AZ (high availability)
- DMS t3.medium instance

To reduce costs:
- Use Aurora Serverless v2 instead of provisioned
- Reduce NAT gateways to 1 (lower availability)
- Use smaller instance types if workload permits

## Support

For issues or questions, refer to:
- AWS DMS Documentation
- CDKTF Python Documentation
- RDS Aurora Best Practices
