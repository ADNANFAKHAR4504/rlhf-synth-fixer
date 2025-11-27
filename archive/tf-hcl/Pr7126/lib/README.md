# Multi-VPC Hub-and-Spoke Network Architecture

This Terraform configuration deploys a hub-and-spoke network architecture using AWS Transit Gateway for a financial services company requiring strict network isolation between environments.

## Architecture

### Network Topology

- **Hub VPC** (10.0.0.0/16): Central VPC with NAT Gateways for centralized internet egress
  - Public subnets for NAT Gateways
  - Private subnets for workloads
  - Dedicated Transit Gateway subnets

- **Production VPC** (10.1.0.0/16): Isolated production environment
  - Private subnets only (no direct internet access)
  - Dedicated Transit Gateway subnets
  - Routes through hub for internet access

- **Development VPC** (10.2.0.0/16): Isolated development environment
  - Private subnets only (no direct internet access)
  - Dedicated Transit Gateway subnets
  - Routes through hub for internet access

### Key Features

1. **Network Isolation**: Production and development environments cannot communicate directly
2. **Centralized Egress**: All internet-bound traffic flows through hub VPC NAT Gateways
3. **Transit Gateway Routing**: Separate route tables enforce isolation policies
4. **VPC Flow Logs**: Network monitoring with S3 storage and Glacier lifecycle
5. **Private DNS**: Route53 Private Hosted Zones for cross-VPC name resolution
6. **High Availability**: Multi-AZ deployment with redundant NAT Gateways

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPCs, Transit Gateway, Route53, S3, etc.

## Quick Start

1. **Clone the repository**

   ```bash
   cd /path/to/terraform/config
   ```

2. **Configure variables**

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

   **Required variables:**
   - `environment_suffix`: Unique suffix for resource naming (e.g., "prod-001")

3. **Configure remote backend (optional but recommended)**

   ```bash
   cp backend.tf.example backend.tf
   # Edit backend.tf with your S3 bucket and DynamoDB table
   ```

4. **Initialize Terraform**

   ```bash
   terraform init
   ```

5. **Review the plan**

   ```bash
   terraform plan
   ```

6. **Deploy the infrastructure**

   ```bash
   terraform apply
   ```

## Configuration

### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `environment_suffix` | Unique suffix for resource naming | (required) |
| `region` | AWS region | `us-east-1` |
| `hub_vpc_cidr` | CIDR block for hub VPC | `10.0.0.0/16` |
| `prod_vpc_cidr` | CIDR block for production VPC | `10.1.0.0/16` |
| `dev_vpc_cidr` | CIDR block for development VPC | `10.2.0.0/16` |
| `availability_zones` | List of AZs | `["us-east-1a", "us-east-1b"]` |
| `enable_flow_logs` | Enable VPC Flow Logs | `true` |
| `flow_logs_retention_days` | Days before transitioning to Glacier | `30` |

### Outputs

The configuration outputs key resource identifiers:

- VPC IDs and CIDR blocks
- Transit Gateway ID and attachment IDs
- NAT Gateway IDs
- Route53 Private Hosted Zone ID
- S3 bucket for flow logs

## Network Routing

### Hub VPC Routing

- Public subnets → Internet Gateway (for internet access)
- Private subnets → NAT Gateway (for internet-bound traffic)
- Private subnets → Transit Gateway (for prod/dev VPCs)

### Production VPC Routing

- Private subnets → Transit Gateway (default route 0.0.0.0/0 to hub)
- Transit Gateway routes only to hub VPC (no direct dev access)

### Development VPC Routing

- Private subnets → Transit Gateway (default route 0.0.0.0/0 to hub)
- Transit Gateway routes only to hub VPC (no direct prod access)

### Transit Gateway Routing

- **Hub Route Table**: Routes to prod (10.1.0.0/16) and dev (10.2.0.0/16) VPCs
- **Production Route Table**: Default route (0.0.0.0/0) to hub only
- **Development Route Table**: Default route (0.0.0.0/0) to hub only

## Security

### Network Isolation

- Production and development VPCs cannot communicate directly
- All inter-VPC traffic flows through Transit Gateway with enforced route domains
- Transit Gateway route tables prevent prod-to-dev and dev-to-prod routing

### Monitoring

- VPC Flow Logs enabled on all VPCs
- Flow logs stored in S3 with encryption
- Automatic lifecycle policy transitions logs to Glacier after 30 days

### Best Practices

- All resources tagged for cost allocation and management
- Private subnets used for workloads in prod and dev
- NAT Gateways deployed across multiple AZs for redundancy
- Dedicated subnets for Transit Gateway attachments

## Cost Optimization

- **Centralized NAT Gateways**: Only in hub VPC reduces NAT Gateway costs
- **S3 Lifecycle Policies**: Automatic transition to Glacier for flow logs
- **Multi-AZ NAT**: Redundancy without excessive over-provisioning

## Maintenance

### Adding a New VPC

1. Create a new VPC module instance in `main.tf`
2. Create Transit Gateway attachment
3. Configure Transit Gateway route table
4. Add VPC routes to Transit Gateway
5. Associate with Route53 Private Hosted Zone

### Updating CIDR Blocks

Update the variables in `terraform.tfvars` and run:

```bash
terraform plan
terraform apply
```

**Note**: Changing VPC CIDR blocks requires recreating VPCs.

### Destroying Infrastructure

To remove all resources:

```bash
terraform destroy
```

**Warning**: This will delete all VPCs, Transit Gateway, and associated resources.

## Troubleshooting

### Common Issues

1. **Transit Gateway attachment timeout**
   - Ensure subnet CIDR blocks don't overlap
   - Verify Transit Gateway subnets are in different AZs

2. **No internet connectivity from prod/dev**
   - Check Transit Gateway routes are properly configured
   - Verify hub VPC NAT Gateways are operational
   - Confirm route tables point to Transit Gateway for 0.0.0.0/0

3. **VPC Flow Logs not appearing**
   - Verify S3 bucket policy allows log delivery
   - Check flow log resource is created successfully
   - Wait 10-15 minutes for initial log delivery

### Debugging

Enable Terraform debugging:

```bash
export TF_LOG=DEBUG
terraform apply
```

Check AWS console for:
- Transit Gateway route tables
- VPC route tables
- NAT Gateway status
- Flow log status

## Support

For issues or questions:
1. Review AWS Transit Gateway documentation
2. Check Terraform AWS provider documentation
3. Review VPC Flow Logs troubleshooting guide

## License

This configuration is provided as-is for infrastructure deployment.
