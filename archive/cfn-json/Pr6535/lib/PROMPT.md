# Amazon EKS Cluster Infrastructure - CloudFormation JSON

## Overview
Create infrastructure using **CloudFormation with JSON** to deploy an Amazon EKS (Elastic Kubernetes Service) cluster for production workloads.

**CRITICAL CONSTRAINT**: This task MUST use CloudFormation with JSON format. The platform and language are non-negotiable requirements from metadata.json.

## Requirements

### Core Infrastructure
1. **Amazon EKS Cluster**
   - Production-grade EKS cluster configuration
   - Kubernetes version 1.28 or later
   - Cluster endpoint access configuration (public/private)
   - Cluster logging enabled (API, audit, authenticator, controller manager, scheduler)
   - Cluster encryption configuration for secrets using KMS

2. **VPC Networking**
   - VPC with public and private subnets across multiple AZs (minimum 2 AZs)
   - Internet Gateway for public subnets
   - NAT Gateway(s) for private subnet internet access
   - Route tables properly configured
   - VPC endpoint for S3 (cost optimization)

3. **EKS Node Groups**
   - Managed node group(s) for worker nodes
   - Auto-scaling configuration (min, max, desired capacity)
   - Instance types appropriate for production workloads
   - Nodes in private subnets for security
   - Node IAM role with required permissions

4. **Security**
   - IAM roles for EKS cluster and node groups
   - Security groups for cluster and nodes
   - Least privilege IAM policies
   - KMS encryption for EKS secrets
   - Private subnet placement for nodes

5. **Resource Naming**
   - All resource names MUST include `${EnvironmentSuffix}` parameter
   - Pattern: `resource-type-${EnvironmentSuffix}`
   - This is critical for parallel deployment testing

### AWS Services Required
- Amazon EKS (Elastic Kubernetes Service)
- Amazon VPC (Virtual Private Cloud)
- Amazon EC2 (for node groups)
- AWS IAM (Identity and Access Management)
- AWS KMS (Key Management Service)
- Amazon CloudWatch (for logging)

### Constraints
- **Platform**: CloudFormation (MANDATORY)
- **Language**: JSON (MANDATORY)
- **Region**: Use `${AWS::Region}` intrinsic function
- **Destroyability**: All resources must be destroyable (no DeletionPolicy: Retain)
- **Environment Suffix**: ALL resources must include `${EnvironmentSuffix}` parameter

### Production Best Practices
1. **High Availability**
   - Multi-AZ deployment for cluster and nodes
   - Auto-scaling for node groups
   
2. **Security**
   - Nodes in private subnets only
   - Security groups with minimal required access
   - IAM roles following least privilege principle
   - KMS encryption for cluster secrets
   
3. **Observability**
   - EKS cluster logging enabled (all log types)
   - CloudWatch log group for cluster logs
   - Resource tags for cost tracking
   
4. **Cost Optimization**
   - Use VPC endpoint for S3 (avoid NAT Gateway charges for S3 traffic)
   - Consider single NAT Gateway for dev/test (not production)
   - Appropriate instance types and auto-scaling policies

## Output Requirements
The CloudFormation template must output:
- EKS Cluster Name
- EKS Cluster Endpoint
- EKS Cluster Security Group ID
- Node Group Name(s)
- VPC ID
- Subnet IDs

## Template Structure
Create a single CloudFormation JSON template at `lib/template.json` that includes:
1. Parameters section (including EnvironmentSuffix)
2. Resources section with all required AWS resources
3. Outputs section with cluster and networking information

## Important Notes
- This task description mentions "Terraform" but the CSV platform constraint specifies "CloudFormation with JSON"
- The CSV platform is MANDATORY and takes precedence
- We MUST implement this using CloudFormation JSON format
- All resource names must be parameterized with EnvironmentSuffix
- Follow CloudFormation JSON syntax (not YAML)
