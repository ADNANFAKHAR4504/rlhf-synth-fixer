# Web Application Infrastructure

Build a scalable web application infrastructure using Terraform on AWS.

## Requirements 

- **Region**: us-west-2
- **Platform**: Terraform (version 1.1.0+)
- **Environment**: Production

## Infrastructure Components

1. **VPC Network**
   - Multi-AZ deployment across 3 availability zones
   - Public and private subnets
   - Internet gateway and NAT gateways

2. **Compute**  
   - Auto Scaling Group with EC2 instances
   - Application Load Balancer
   - Target groups for health checks

3. **Storage**
   - S3 bucket with access logging enabled
   - Appropriate bucket policies and versioning

4. **Security**
   - Security groups restricting access to necessary ports only
   - All resources tagged with "Environment: Production"

## Deliverables

- Complete Terraform HCL configuration files
- Infrastructure should deploy without errors
- All code properly formatted per HashiCorp standards
