# Cloud Environment Setup - Production VPC Infrastructure for Payment Processing

## Platform and Language
**MANDATORY CONSTRAINT**: This task MUST use **Pulumi with Python**.

## Background
A fintech startup needs to establish a secure cloud foundation for their payment processing application. They require network isolation between different tiers of their application and compliance with PCI-DSS standards for handling sensitive financial data.

## Environment
AWS multi-AZ deployment in us-east-1 region for a payment processing application. Infrastructure includes VPC with public and private subnets across 3 availability zones, NAT Gateways for outbound connectivity, Internet Gateway for public access, and S3 bucket for VPC Flow Logs storage. Requires Pulumi CLI 3.x with Python 3.8 or higher, AWS CLI configured with appropriate credentials. Network architecture follows PCI-DSS compliance requirements with strict network segmentation.

## Requirements

Create a Pulumi Python program to deploy a production-ready VPC infrastructure for a payment processing system. The configuration must:

1. Create a VPC with CIDR 10.0.0.0/16 and enable DNS hostnames and DNS resolution.

2. Deploy 3 public subnets (one per AZ) with /24 CIDR blocks starting from 10.0.1.0/24.

3. Deploy 3 private subnets (one per AZ) with /23 CIDR blocks starting from 10.0.10.0/23.

4. Create an Internet Gateway and attach it to the VPC.

5. Deploy one NAT Gateway in each public subnet with Elastic IPs.

6. Configure route tables with appropriate routes for public subnets (0.0.0.0/0 via IGW) and private subnets (0.0.0.0/0 via NAT Gateway in same AZ).

7. Create Network ACLs that allow only HTTP (80), HTTPS (443), and SSH (22) inbound to public subnets, and all outbound traffic.

8. Enable VPC Flow Logs and store them in an S3 bucket with server-side encryption.

9. Tag all resources with Environment='production' and Project='payment-gateway'.

10. Export the VPC ID, subnet IDs, and NAT Gateway IDs as stack outputs.

## Constraints

1. VPC must use CIDR block 10.0.0.0/16
2. Public subnets must be sized /24 and private subnets must be sized /23
3. NAT Gateways must be deployed in high availability mode across all AZs
4. All resource names must follow the pattern: {environment}-{resource-type}-{az-suffix}
5. Network ACLs must explicitly deny all traffic except required ports
6. VPC Flow Logs must be enabled and stored in S3 with 30-day retention

## Expected Output

A fully functional VPC with high-availability NAT Gateways, proper network segmentation, and logging enabled. The infrastructure should support deploying application servers in private subnets with internet access through NAT Gateways, while load balancers can be placed in public subnets.

## AWS Services to Implement

- VPC (Virtual Private Cloud)
- Subnets (Public and Private)
- Internet Gateway
- NAT Gateways
- Elastic IPs
- Route Tables
- Network ACLs
- VPC Flow Logs
- S3 (for Flow Logs storage)

## Success Criteria

- All resources are created successfully and follow naming conventions
- VPC has proper CIDR block and DNS settings enabled
- Subnets are correctly sized and distributed across 3 AZs
- NAT Gateways provide high availability with one per AZ
- Route tables correctly route traffic for public and private subnets
- Network ACLs enforce security requirements for inbound traffic
- VPC Flow Logs are enabled and stored securely in S3
- All resources are properly tagged
- Stack outputs include VPC ID, subnet IDs, and NAT Gateway IDs
- Infrastructure is PCI-DSS compliant with proper network segmentation
