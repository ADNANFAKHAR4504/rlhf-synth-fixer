# Multi-Environment CloudFormation Setup

Need a CloudFormation template that can deploy the same infrastructure to dev, test, staging, and prod without copying the whole template for each environment.

## What I Need

Single CFN template in YAML that:
- Deploys VPC + EC2 instances connected via security groups
- Uses Parameters and Mappings to handle environment differences
- Different configs per environment like instance types, CIDR ranges, tags
- Can deploy to any environment by just changing parameter values

## Requirements

The template should handle these environment-specific things via parameters and mappings:
- Instance types: t2.micro for dev, larger for prod
- VPC CIDR blocks: different ranges per environment
- AMI IDs if needed
- Resource tags with Environment showing dev/test/stage/prod
- Any scaling or capacity differences

Don't duplicate the template logic - just use one template with Parameters and Mappings sections that change based on environment input.

## Infrastructure Components and How They Connect

Need these resources with proper connectivity:
- VPC with public and private subnets in multiple AZs
- Internet Gateway attached to VPC, providing public subnet internet access
- NAT Gateway deployed in public subnet to provide private subnet outbound traffic
- Route tables: public subnets route to IGW, private subnets route to NAT Gateway
- EC2 web servers deployed in public subnets
- EC2 app servers deployed in private subnets
- Security groups:
  - Web SG: allows inbound HTTP/HTTPS from internet, connects to App SG for backend communication
  - App SG: receives traffic from Web SG only, communicates with internet via NAT for updates

The traffic flow: Internet traffic connects to IGW, which routes to Web tier EC2 instances in public subnet. Web tier EC2 instances communicate with App tier EC2 in private subnet through security group rules. App tier accesses internet via NAT Gateway for outbound traffic only.

Security groups enforce this connectivity: web tier receives traffic from internet on ports 80/443, app tier only receives traffic from web tier security group, with no direct internet access to app tier.

## Tagging

All resources need these tags at minimum:
- Environment
- Owner
- Project
- CostCenter

## Outputs

Include outputs for:
- VPC ID
- Public Subnet IDs
- Private Subnet IDs
- Web tier security group ID
- App tier security group ID
- Instance IPs

## Deployment

Should work like:
```
aws cloudformation deploy --template-file template.yml --parameter-overrides Environment=dev
```

Then deploy to prod with:
```
aws cloudformation deploy --template-file template.yml --parameter-overrides Environment=prod
```

Same template, different environments. Keep it straightforward - this is for setting up consistent infrastructure across our deployment pipeline.
