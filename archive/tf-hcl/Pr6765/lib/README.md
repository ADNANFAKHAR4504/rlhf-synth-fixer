# Hub-and-Spoke Network Architecture with AWS Transit Gateway

This Terraform configuration deploys a hub-and-spoke network topology using AWS Transit Gateway.

## Architecture

- **Hub VPC**: Central VPC with NAT Gateway for internet egress
- **Spoke VPCs**: Three spoke VPCs (production, staging, development)
- **Transit Gateway**: Central routing hub connecting all VPCs
- **Routing**: Spoke VPCs route traffic through hub for internet access
- **Security**: Security Groups and Network ACLs for access control

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPCs, Transit Gateway, and networking resources

## Configuration

### Variables

The configuration supports the following variables:

- `aws_region`: AWS region (default: us-east-1)
- `environment_suffix`: Unique suffix for resource naming (required)
- `hub_vpc_cidr`: CIDR block for hub VPC (default: 10.0.0.0/16)
- `spoke_vpc_cidrs`: Map of spoke VPC CIDR blocks
- `transit_gateway_asn`: BGP ASN for Transit Gateway (default: 64512)

### Example terraform.tfvars

```hcl
aws_region         = "us-east-1"
environment_suffix = "prod"

hub_vpc_cidr = "10.0.0.0/16"

spoke_vpc_cidrs = {
  production  = "10.1.0.0/16"
  staging     = "10.2.0.0/16"
  development = "10.3.0.0/16"
}
```

## Deployment

### Initialize Terraform

```bash
terraform init
```

### Plan the deployment

```bash
terraform plan -var="environment_suffix=dev"
```

### Apply the configuration

```bash
terraform apply -var="environment_suffix=dev"
```

### Destroy the infrastructure

```bash
terraform destroy -var="environment_suffix=dev"
```

## Network Flow

1. **Spoke to Internet**: Traffic routes through Transit Gateway → Hub VPC → NAT Gateway → Internet
2. **Spoke to Spoke**: Traffic routes through Transit Gateway (hub route table facilitates communication)
3. **Hub to Spoke**: Direct routing through Transit Gateway

## Security

- Security Groups allow traffic between hub and spokes
- Network ACLs provide subnet-level filtering
- No direct internet gateways on spoke VPCs (all internet traffic through hub)
- Separate security groups per environment (production, staging, development)

## Outputs

The configuration exports:

- Transit Gateway ID and ARN
- Hub and spoke VPC IDs
- Route table IDs
- NAT Gateway ID and public IP
- Security Group IDs
- Transit Gateway attachment IDs

## Resource Naming

All resources follow the pattern: `{resource-type}-{purpose}-{environment-suffix}`

Examples:
- `vpc-hub-dev`
- `tgw-hub-spoke-prod`
- `sg-spoke-production-staging`

## Cost Optimization

- Single NAT Gateway in hub VPC (can be scaled for HA)
- Transit Gateway charges apply per attachment and data transfer
- Consider using VPC endpoints for AWS services to reduce NAT Gateway costs

## High Availability

For production deployments, consider:
- Multiple NAT Gateways across availability zones
- Transit Gateway attachments in multiple AZs (already configured)
- Application-level redundancy in spoke VPCs

## Troubleshooting

### Transit Gateway attachment not working

Check:
1. Transit Gateway route table associations
2. VPC route tables point to Transit Gateway
3. Security Groups allow traffic
4. Network ACLs allow traffic

### No internet connectivity from spoke VPCs

Check:
1. NAT Gateway is running
2. Hub VPC route table routes to NAT Gateway
3. Transit Gateway default route points to hub VPC
4. Spoke VPC route tables point to Transit Gateway

## License

This configuration is provided as-is for infrastructure deployment purposes.
