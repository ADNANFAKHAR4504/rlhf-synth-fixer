# Cloud Environment Setup

> **CRITICAL REQUIREMENT: This task MUST be implemented using CloudFormation with JSON**
>
> Platform: **CloudFormation / cfn**
> Language: **JSON**
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

A fintech startup needs to establish a secure network foundation in AWS for their payment processing application. The infrastructure must comply with PCI-DSS requirements for network segmentation and access control.

## Problem Statement

Create a CloudFormation template in JSON format to deploy a production-ready VPC with proper network segmentation. The configuration must:

1. Create a VPC with CIDR 10.0.0.0/16 and enable DNS hostnames and DNS support
2. Deploy 2 public subnets across 2 availability zones using 10.0.1.0/24 and 10.0.2.0/24
3. Deploy 2 private subnets across the same AZs using 10.0.10.0/24 and 10.0.11.0/24
4. Create an Internet Gateway and attach it to the VPC
5. Deploy NAT Gateways in each public subnet with Elastic IPs
6. Configure route tables for public subnets with routes to the Internet Gateway
7. Configure route tables for private subnets with routes to the respective NAT Gateway in the same AZ
8. Apply proper tags to all resources including Environment, Project, and ManagedBy tags
9. Output the VPC ID, subnet IDs, and NAT Gateway IPs for reference

**Expected Output:** A fully functional multi-AZ VPC with proper routing that allows resources in private subnets to access the internet through NAT Gateways while maintaining security isolation.

## Environment Details

AWS VPC infrastructure in ap-southeast-1 region with multi-AZ deployment across 2 availability zones. Creates a standard 3-tier network architecture with:
- Public subnets for load balancers
- Private subnets for application servers
- Database subnets for RDS instances, implied for future use

Infrastructure includes:
- NAT Gateways in each AZ for high availability outbound internet access from private subnets
- Internet Gateway for inbound public traffic
- Full route table configuration with proper associations

## Constraints and Requirements

1. VPC CIDR must be 10.0.0.0/16 to align with corporate network standards
2. Public subnets must use the first /24 blocks in each AZ: 10.0.1.0/24 and 10.0.2.0/24
3. Private subnets must use /24 blocks starting from 10.0.10.0/24: 10.0.10.0/24 and 10.0.11.0/24
4. All resources must be tagged with Environment, Project, and ManagedBy tags
5. NAT Gateways must have Elastic IPs with specific Name tags
6. Route tables must have explicit names following the pattern: vpc-name-public-rt-az or vpc-name-private-rt-az

## Project-Specific Conventions

### Resource Naming
- All resources must use the `EnvironmentSuffix` parameter in their names to support multiple PR environments
- Example: Use `!Sub 'resource-name-${EnvironmentSuffix}'` for resource naming
- Apply EnvironmentSuffix tag to all resources

### CloudFormation Best Practices
- Define Parameters section with EnvironmentSuffix parameter
- Use intrinsic functions (!Sub, !Ref, !GetAtt) appropriately
- Define explicit DependsOn relationships where necessary
- Use Outputs section to export key resource IDs and attributes

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources
- Outputs should include VPC ID, subnet IDs, NAT Gateway IPs, route table IDs

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- Do not use DeletionPolicy: Retain unless absolutely necessary
- Ensure proper cleanup of all resources during stack deletion

### Security Baseline
- Implement encryption at rest and in transit where applicable
- Follow principle of least privilege for IAM roles
- Enable appropriate logging and monitoring
- Ensure PCI-DSS compliance for network segmentation

## Target Region
All resources should be deployed to: **ap-southeast-1**

## AWS Services Required

- AWS::EC2::VPC
- AWS::EC2::Subnet
- AWS::EC2::InternetGateway
- AWS::EC2::VPCGatewayAttachment
- AWS::EC2::EIP
- AWS::EC2::NatGateway
- AWS::EC2::RouteTable
- AWS::EC2::Route
- AWS::EC2::SubnetRouteTableAssociation

## Implementation Notes

- Use AWS CloudFormation native JSON syntax
- Leverage CloudFormation parameters for configurability
- Define clear outputs for downstream stack consumption
- Ensure idempotent stack updates
- Follow AWS CloudFormation best practices for template organization
- Consider using CloudFormation Mappings for AZ selection if needed
