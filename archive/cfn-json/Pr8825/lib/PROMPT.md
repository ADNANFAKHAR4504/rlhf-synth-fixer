# Task: Cloud Environment Setup

## Background

A financial services company needs to establish a secure network foundation in AWS for their new microservices platform. They require strict network isolation between development and production workloads while maintaining controlled internet access for software updates.

## Problem Statement

Create a CloudFormation template in JSON format to deploy a production-ready VPC infrastructure. The configuration must: 1. Create a VPC with CIDR block 10.0.0.0/16 in us-east-1. 2. Create 6 subnets total - 3 public with /24 netmask and 3 private with /24 netmask across us-east-1a, us-east-1b, and us-east-1c. 3. Deploy an Internet Gateway attached to the VPC providing public internet access. 4. Deploy 3 NAT Gateways placed in each public subnet enabling private subnet outbound connectivity. 5. Configure route tables connecting public subnets to Internet Gateway via 0.0.0.0/0 route and private subnets to their respective NAT Gateway via 0.0.0.0/0 route. 6. Enable VPC Flow Logs streaming ACCEPT and REJECT traffic to a new CloudWatch Log Group for monitoring. 7. Create custom Network ACLs blocking inbound SSH on port 22 from 0.0.0.0/0 while permitting standard HTTP/HTTPS traffic. 8. Apply consistent tagging with Environment: Production and CostCenter: Infrastructure on all resources. 9. Configure DHCP options to use AmazonProvidedDNS. 10. Output the VPC ID, subnet IDs grouped by type, and NAT Gateway IDs for cross-stack references. Expected output: A fully deployed VPC with NAT Gateways providing high-availability outbound connectivity for private workloads, Internet Gateway serving public subnets, Flow Logs feeding CloudWatch for traffic analysis, and proper network segmentation with security controls. The stack outputs resource identifiers allowing other CloudFormation stacks to reference and integrate with this foundational network.

## Environment

New AWS account in us-east-1 region requiring foundational networking setup for multi-tier applications. Infrastructure includes VPC with public and private subnets across 3 availability zones, NAT Gateways for outbound connectivity, Internet Gateway for public access, and CloudWatch Logs for VPC Flow Logs. Requires AWS CLI configured with appropriate credentials for CloudFormation deployment. The VPC will support future deployments of ECS services, RDS databases, and Lambda functions in isolated network tiers.

## Constraints

1. VPC must use RFC 1918 address space with /16 CIDR block
2. Subnets must be distributed across exactly 3 availability zones
3. Private subnets must have no direct internet routing
4. NAT Gateways must be highly available with one per AZ
5. All resources must be tagged with Environment and CostCenter tags
6. VPC Flow Logs must be enabled and sent to CloudWatch Logs
7. Network ACLs must explicitly deny SSH from 0.0.0.0/0
8. Route tables must be explicitly associated with each subnet
9. DHCP options set must use Amazon-provided DNS

