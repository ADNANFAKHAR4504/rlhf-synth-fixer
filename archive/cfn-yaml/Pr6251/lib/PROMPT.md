# Environment Migration: Hub-and-Spoke Network Architecture

## Background

Your company is migrating from a legacy on-premises network architecture to AWS. The existing infrastructure uses a hub-and-spoke topology with isolated network segments for different departments. You need to replicate this architecture in AWS while preparing for a phased migration of workloads.

## Task

Create infrastructure using **AWS CloudFormation with YAML** to implement a hub-and-spoke network architecture for migrating departmental workloads from on-premises to AWS.

## Requirements

The CloudFormation template must:

1. **Hub VPC**: Create a hub VPC (10.0.0.0/16) with Transit Gateway attachment
   - 3 availability zones
   - Public subnets: 10.0.100.0/24, 10.0.101.0/24, 10.0.102.0/24
   - Private subnets: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24

2. **Spoke VPCs**: Create three spoke VPCs for different departments:
   - Finance VPC: 10.1.0.0/16
   - Engineering VPC: 10.2.0.0/16
   - Marketing VPC: 10.3.0.0/16
   - Each with 3 availability zones
   - Each with public subnets: x.x.100.0/24, x.x.101.0/24, x.x.102.0/24
   - Each with private subnets: x.x.0.0/24, x.x.1.0/24, x.x.2.0/24

3. **Transit Gateway**: Configure AWS Transit Gateway with:
   - Attachments to all VPCs (hub and 3 spokes)
   - Route tables allowing only hub-and-spoke communication:
     - Finance ↔ Hub
     - Engineering ↔ Hub
     - Marketing ↔ Hub
   - NO direct spoke-to-spoke communication
   - Proper route propagation enabled

4. **NAT Gateways**: Set up NAT Gateways in each spoke VPC for outbound internet access from private subnets

5. **VPC Flow Logs**: Configure VPC Flow Logs for all VPCs with:
   - 1-minute intervals
   - Store in CloudWatch Logs
   - Enabled for all VPCs (hub and all spokes)

6. **Security Groups**:
   - Web-tier security group: Allow ports 80/443 from 0.0.0.0/0
   - App-tier security group: Allow custom ports from web-tier only
   - Follow least-privilege principle with documented rules

7. **Network ACLs**: Implement network ACLs that:
   - Deny all traffic by default
   - Explicitly allow: HTTP/HTTPS inbound to public subnets
   - Allow established connections
   - Allow VPC-to-VPC traffic through Transit Gateway

8. **Custom Resource**: Add custom resource using Lambda to test connectivity between VPCs

9. **Resource Tagging**: All resources must be tagged with:
   - Department (Finance/Engineering/Marketing/Hub)
   - Environment
   - MigrationPhase

10. **Outputs**: Export the following for use by migration tools:
    - Transit Gateway ID
    - All VPC IDs (hub and spokes)
    - All subnet IDs (public and private)
    - Security group IDs

## Constraints

1. Platform: **CloudFormation** with **YAML** (ignore any mention of CDK/Go in original requirements)
2. Transit Gateway must connect all VPCs with proper route propagation
3. Each department VPC must have exactly 3 availability zones
4. CIDR blocks must not overlap and follow RFC1918 addressing
5. Network ACLs must deny all traffic by default except explicitly allowed
6. VPC Flow Logs must be enabled for all VPCs and stored in CloudWatch Logs
7. All resources must be tagged with Department, Environment, and MigrationPhase tags
8. Security groups must follow least-privilege principle with documented rules

## Environment

- Region: us-east-1
- Multi-VPC hub-and-spoke architecture using AWS Transit Gateway
- Architecture includes one central hub VPC and three spoke VPCs
- Each VPC spans 3 availability zones with public and private subnets
- Network segmentation enforced through Transit Gateway route tables and security groups

## AWS Services Required

- Amazon VPC
- AWS Transit Gateway
- NAT Gateway
- VPC Flow Logs
- Amazon CloudWatch Logs
- Security Groups
- Network ACLs
- AWS Lambda (for custom resource)
- IAM Roles (for Lambda execution)

## Expected Output

A fully functional CloudFormation template that creates isolated network segments connected through Transit Gateway, with proper security controls and monitoring in place for the migration process.
