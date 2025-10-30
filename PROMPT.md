# Cloud Environment Setup

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **eu-central-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup needs to establish a new AWS environment for their payment processing application. The infrastructure must provide network isolation between different application tiers while maintaining secure connectivity for administrative access. The company requires a foundation that can be easily replicated across multiple regions.

## Problem Statement
Create a Pulumi TypeScript program to deploy a multi-tier network infrastructure with proper security boundaries. The configuration must: 

1. Create a VPC with CIDR block 10.0.0.0/16 in the eu-central-1 region. 
2. Deploy three pairs of subnets (public and private) across three availability zones. 
3. Configure an Internet Gateway and attach it to the VPC for public subnet connectivity. 
4. Set up NAT Gateways in each public subnet for outbound internet access from private subnets. 
5. Create route tables with appropriate routes for public subnets (0.0.0.0/0 to IGW) and private subnets (0.0.0.0/0 to NAT). 
6. Deploy a bastion host in the first public subnet using Amazon Linux 2 AMI (t3.micro instance). 
7. Configure security groups allowing SSH access to bastion from specific IP ranges only. 
8. Create an S3 bucket for storing VPC Flow Logs with lifecycle policy to delete logs after 30 days. 
9. Enable VPC Flow Logs for all traffic and send to the S3 bucket. 
10. Output the VPC ID, subnet IDs, and bastion host public IP address. 

Expected output: A fully functional VPC with proper network segmentation, secure bastion access, and flow log monitoring. The infrastructure should be tagged with Environment=Development and ManagedBy=Pulumi tags on all resources.

## Constraints and Requirements
- Use Pulumi's automatic naming feature for all resources except the S3 bucket which must have a unique name
- Implement all infrastructure in a single Pulumi stack without component resources
- Use only the @pulumi/aws package without additional NPM dependencies
- Configure all security group rules inline rather than as separate rule resources
- Ensure all private subnets use different NAT Gateways for high availability

## Environment Setup
AWS

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in ts
- Follow pulumi best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region
Deploy all resources to: **eu-central-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
