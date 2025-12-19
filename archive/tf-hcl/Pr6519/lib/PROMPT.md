Hey team,

We need to build out a production-grade VPC infrastructure for our new banking application. The operations team has been asking for a highly available multi-AZ setup that can handle production traffic while maintaining strict security controls. I've been asked to create this using **Terraform with HCL** so we can version control everything and make it repeatable across environments.

The banking app needs to run across three availability zones for redundancy, and we need separate public and private subnets in each zone. The security team is particularly concerned about network isolation and visibility, so they want VPC Flow Logs enabled and custom Network ACLs that only allow web traffic from the internet. The architecture team also wants NAT Gateways in each AZ to avoid cross-zone data transfer charges and provide better fault tolerance.

This is a greenfield deployment, so we're starting from scratch with the VPC setup. Everything needs to be tagged properly for cost tracking since this is going under the banking cost center.

## What we need to build

Create a production VPC infrastructure using **Terraform with HCL** for a multi-AZ banking application deployment.

### Core Requirements

1. **VPC Configuration**
   - CIDR block: 10.0.0.0/16
   - Enable DNS support and DNS hostnames
   - Deploy to us-east-1 region

2. **Public Subnets (3 subnets across 3 AZs)**
   - 10.0.1.0/24 in us-east-1a
   - 10.0.2.0/24 in us-east-1b
   - 10.0.3.0/24 in us-east-1c
   - Each subnet must map public IPs on launch

3. **Private Subnets (3 subnets across 3 AZs)**
   - 10.0.11.0/24 in us-east-1a
   - 10.0.12.0/24 in us-east-1b
   - 10.0.13.0/24 in us-east-1c

4. **Internet Gateway**
   - Create and attach to VPC for public internet access

5. **NAT Gateway Setup (3 NAT Gateways)**
   - One NAT Gateway in each public subnet (us-east-1a, us-east-1b, us-east-1c)
   - Allocate Elastic IP for each NAT Gateway
   - Provides outbound internet for private subnets

6. **Route Tables Configuration**
   - One public route table with route 0.0.0.0/0 pointing to Internet Gateway
   - Associate all public subnets with public route table
   - Three separate private route tables (one per AZ)
   - Each private route table routes 0.0.0.0/0 to its respective NAT Gateway
   - Associate each private subnet with its AZ-specific private route table

7. **VPC Flow Logs**
   - Enable VPC Flow Logs with CloudWatch Logs as destination
   - Create CloudWatch Log Group with 7-day retention period
   - Create IAM role and policy for Flow Logs to write to CloudWatch

8. **Network ACLs**
   - Create custom Network ACL for public subnets
   - Allow inbound HTTP (port 80) from 0.0.0.0/0
   - Allow inbound HTTPS (port 443) from 0.0.0.0/0
   - Allow ephemeral ports (1024-65535) inbound for return traffic
   - Allow all outbound traffic
   - Associate Network ACL with all public subnets

9. **Resource Tags**
   - All resources must include these tags:
   - Environment: production
   - CostCenter: banking
   - Resource names must include environmentSuffix for uniqueness

10. **Deletion Policy**
    - All resources must be destroyable with terraform destroy
    - Do not use prevent_destroy lifecycle rules

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation
- Use **NAT Gateway** for private subnet internet access
- Use **CloudWatch Logs** for Flow Logs storage
- Use **Network ACL** for network security
- Resource naming convention: include environmentSuffix variable for uniqueness
- Deploy to **us-east-1** region
- Follow Terraform best practices with variables and outputs

### Constraints

- Multi-AZ deployment required across 3 availability zones
- Production-grade security with Network ACLs restricting inbound traffic
- VPC Flow Logs required for compliance and monitoring
- All resources must be tagged for cost allocation
- All resources must be fully destroyable (no lifecycle prevent_destroy)
- Include proper IAM roles and policies for Flow Logs

## Success Criteria

- Functionality: Complete VPC with 6 subnets across 3 AZs, functioning internet and NAT gateway routing
- Performance: NAT Gateways in each AZ to minimize cross-zone traffic
- Reliability: Multi-AZ architecture with redundant NAT Gateways
- Security: Network ACLs limiting inbound traffic, VPC Flow Logs enabled, proper IAM policies
- Resource Naming: All resources include environmentSuffix variable for uniqueness
- Code Quality: Clean HCL code, well-organized with variables and outputs, fully tested

## What to deliver

- Complete Terraform HCL implementation
- VPC, Subnet, Internet Gateway, NAT Gateway, Route Table resources
- CloudWatch Logs setup for VPC Flow Logs with IAM role
- Network ACL configuration with security rules
- Elastic IP allocation for NAT Gateways
- Variables file for environmentSuffix and region
- Outputs file with VPC ID, subnet IDs, and gateway IDs
- All resources properly tagged and destroyable