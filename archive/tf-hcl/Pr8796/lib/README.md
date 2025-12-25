# VPC Network Isolation for Payment Processing

This Terraform configuration deploys a production-grade AWS VPC with strict network isolation for a payment processing system that meets PCI DSS compliance requirements.

## Architecture

The infrastructure consists of:

- **VPC**: 10.0.0.0/16 CIDR block with DNS support enabled
- **9 Subnets across 3 Availability Zones**:
  - 3 Public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
  - 3 Private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
  - 3 Database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
- **Internet Gateway**: For public subnet internet access
- **3 NAT Gateways**: High availability across all AZs
- **5 Route Tables**: 1 public, 3 private, 1 database
- **3 Network ACLs**: Strict port-based access control
- **VPC Flow Logs**: CloudWatch Logs with 30-day retention

## Three-Tier Network Architecture

1. **Public Tier**: Load balancers and internet-facing resources
   - Direct internet access via Internet Gateway
   - Allows inbound ports 80 and 443

2. **Private Tier**: Application servers
   - Outbound internet via NAT Gateway
   - Allows inbound ports 8080-8090

3. **Database Tier**: Isolated database resources
   - No internet access (inbound or outbound)
   - Only allows port 5432 from private subnets

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC resources

## Deployment

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Review the plan**:
   ```bash
   terraform plan
   ```

3. **Apply the configuration**:
   ```bash
   terraform apply
   ```

4. **Provide the environment suffix when prompted** or set in `terraform.tfvars`:
   ```bash
   environment_suffix = "prod-payment"
   ```

## Configuration

### Variables

Key variables that can be customized in `terraform.tfvars`:

- `environment_suffix`: Unique identifier for the environment (required)
- `aws_region`: AWS region for deployment (default: us-east-1)
- `vpc_cidr`: VPC CIDR block (default: 10.0.0.0/16)
- `availability_zones`: List of AZs (default: us-east-1a, us-east-1b, us-east-1c)
- `public_subnet_cidrs`: CIDR blocks for public subnets
- `private_subnet_cidrs`: CIDR blocks for private subnets
- `database_subnet_cidrs`: CIDR blocks for database subnets

### Resource Naming

All resources include the `environment_suffix` variable in their names to ensure uniqueness:
- VPC: `vpc-{environment_suffix}`
- Subnets: `{tier}-subnet-{environment_suffix}-{az}`
- NAT Gateways: `nat-gateway-{environment_suffix}-{az}`

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `database_subnet_ids`: List of database subnet IDs
- `nat_gateway_ids`: List of NAT Gateway IDs
- `nat_gateway_public_ips`: Public IP addresses of NAT Gateways
- `vpc_flow_log_group_name`: CloudWatch Log Group for VPC Flow Logs

## Security Features

1. **Network ACLs**:
   - Default deny all traffic
   - Explicit allow rules for required ports only
   - Separate NACLs for each tier

2. **Network Isolation**:
   - Database subnets have no internet access
   - Private subnets use NAT for outbound only
   - Public subnets restricted to ports 80/443

3. **VPC Flow Logs**:
   - All traffic logged to CloudWatch
   - 30-day retention for audit compliance
   - Supports forensic analysis

4. **High Availability**:
   - Resources spread across 3 AZs
   - NAT Gateway in each AZ for redundancy
   - Independent route tables per AZ for private subnets

## Compliance

This configuration supports PCI DSS compliance requirements:

- Network segmentation enforced via subnets and NACLs
- All network traffic logged via VPC Flow Logs
- Database tier completely isolated from internet
- Proper tagging for audit trails

## Cost Considerations

Main cost components:
- **NAT Gateways**: ~$0.045/hour each (3 total) + data transfer
- **VPC Flow Logs**: CloudWatch Logs storage and ingestion
- **Elastic IPs**: Free when attached to running NAT Gateways

Estimated monthly cost: ~$100-150 (depending on data transfer)

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: All resources are fully destroyable with no retain policies.

## Testing

After deployment, verify the configuration:

1. **Check VPC and Subnets**:
   ```bash
   aws ec2 describe-vpcs --filters "Name=tag:Name,Values=vpc-prod-payment"
   aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>"
   ```

2. **Verify NAT Gateways**:
   ```bash
   aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=<vpc-id>"
   ```

3. **Check Route Tables**:
   ```bash
   aws ec2 describe-route-tables --filters "Name=vpc-id,Values=<vpc-id>"
   ```

4. **Verify VPC Flow Logs**:
   ```bash
   aws logs describe-log-groups --log-group-name-prefix "/aws/vpc/flow-logs"
   ```

## Troubleshooting

### NAT Gateway Creation Fails
- Ensure Internet Gateway is attached to VPC first
- Verify Elastic IPs are available in the region

### VPC Flow Logs Not Appearing
- Check IAM role has correct permissions
- Verify CloudWatch Logs group exists
- Wait 5-10 minutes for initial log delivery

### Route Table Association Issues
- Ensure subnet IDs are correct
- Verify no conflicting associations exist

## Support

For issues or questions, refer to:
- AWS VPC Documentation: https://docs.aws.amazon.com/vpc/
- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
