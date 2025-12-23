# VPC Networking Infrastructure

Production-ready VPC setup with public and private subnets, Internet Gateway, and NAT Gateway.

## Architecture

This infrastructure creates:
- VPC with configurable CIDR block (default: 10.0.0.0/16)
- Public subnets across multiple AZs (default: 2)
- Private subnets across multiple AZs (default: 2)
- Internet Gateway for public subnet internet access
- NAT Gateway for private subnet outbound internet access
- Route tables with proper associations

## Network Design

### Public Subnets
- CIDR: 10.0.0.0/24, 10.0.1.0/24 (first N /24 blocks)
- Internet access: Direct via Internet Gateway
- Use case: Load balancers, bastion hosts, NAT Gateway

### Private Subnets
- CIDR: 10.0.2.0/24, 10.0.3.0/24 (next N /24 blocks)
- Internet access: Outbound only via NAT Gateway
- Use case: Application servers, databases

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC resources

## Usage

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Configure Variables

Copy the example file and modify:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
environment_suffix = "dev-abc123"  # REQUIRED: Unique identifier
vpc_cidr          = "10.0.0.0/16"  # Optional: VPC CIDR block
az_count          = 2              # Optional: Number of AZs
region            = "us-east-1"    # Optional: AWS region
```

### 3. Plan Deployment

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

### 5. Verify Deployment

Check outputs:

```bash
terraform output
```

Test connectivity:
- Launch EC2 instance in public subnet - should have internet access via IGW
- Launch EC2 instance in private subnet - should have outbound internet via NAT

### 6. Destroy Infrastructure

```bash
terraform destroy
```

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment_suffix | Unique environment suffix for resource naming | string | - | yes |
| vpc_cidr | CIDR block for VPC | string | "10.0.0.0/16" | no |
| az_count | Number of availability zones | number | 2 | no |
| region | AWS region | string | "us-east-1" | no |

## Outputs

| Name | Description |
|------|-------------|
| vpc_id | VPC ID |
| vpc_cidr | VPC CIDR block |
| public_subnet_ids | List of public subnet IDs |
| private_subnet_ids | List of private subnet IDs |
| internet_gateway_id | Internet Gateway ID |
| nat_gateway_id | NAT Gateway ID |
| nat_gateway_eip | NAT Gateway Elastic IP |
| public_route_table_id | Public route table ID |
| private_route_table_id | Private route table ID |

## Cost Optimization Notes

- NAT Gateway incurs hourly charges and data transfer costs
- Single NAT Gateway design reduces costs but creates single point of failure
- For production, consider NAT Gateway per AZ for high availability
- Elastic IP is free when associated with running resource

## Security Considerations

- Private subnets have no direct internet access
- NAT Gateway provides outbound-only internet for private subnets
- All resources tagged with environment suffix for tracking
- Network ACLs can be added for additional layer of security

## Troubleshooting

### Issue: Terraform init fails
- Ensure AWS credentials are configured
- Check internet connectivity

### Issue: Resources not destroyed
- Ensure no resources exist in subnets before destroying
- Check for ENIs or other dependencies

### Issue: NAT Gateway creation fails
- Verify Internet Gateway exists and is attached
- Check EIP quota in your account
