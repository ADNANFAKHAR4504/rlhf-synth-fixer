# Ideal Response

This CloudFormation template creates a highly available network infrastructure across multiple availability zones with public and private subnets, NAT Gateways, security groups, and network ACLs.

## Infrastructure Components

### VPC and Subnets
- VPC with CIDR 10.0.0.0/16
- 2 public subnets across different AZs (10.0.1.0/24, 10.0.2.0/24)
- 2 private subnets across different AZs (10.0.11.0/24, 10.0.12.0/24)

### Internet Connectivity
- Internet Gateway attached to VPC for public subnet internet access
- NAT Gateways in each public subnet for private subnet outbound access
- Elastic IPs for NAT Gateways

### Routing
- Public route table with route to Internet Gateway
- Private route tables (one per AZ) with routes to respective NAT Gateways
- Subnet associations to route tables

### Security
- Public Web Security Group: Allows HTTP/HTTPS from anywhere, restricted egress
- Private SSH Security Group: Allows SSH from VPC CIDR only, restricted egress
- Network ACL for private subnets with inbound/outbound rules

### LocalStack Compatibility
- Conditional NAT Gateway deployment (can be disabled for LocalStack)
- Parameter EnableNATGateway defaults to false for LocalStack compatibility
- All resources tagged with environment suffix for multi-deployment support

## Deployment

Deploy with AWS:
```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name ha-network-stack \
  --parameter-overrides EnvironmentSuffix=prod EnableNATGateway=true
```

For LocalStack:
```bash
awslocal cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name ha-network-stack \
  --parameter-overrides EnvironmentSuffix=dev EnableNATGateway=false
```

## Outputs

The stack exports VPC ID, Subnet IDs, Security Group IDs, Route Table IDs, NAT Gateway IDs, and Availability Zones.
