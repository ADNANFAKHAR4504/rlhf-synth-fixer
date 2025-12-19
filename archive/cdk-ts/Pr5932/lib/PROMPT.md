# Infrastructure as Code Generation Prompt

## Objective
Create a CDK TypeScript program that establishes a single-region AWS environment with advanced networking architecture for a financial services trading platform.

## Platform & Language
- **Platform**: AWS CDK
- **Language**: TypeScript
- **Requirement**: Strict type checking enabled
- **File Structure**: All resources must be defined in a single file: `lib/tap-stack.ts`

## Architecture Requirements

### 1. VPC Configuration
- **Region**: ap-northeast-1
- **Availability Zones**: 3
- **CIDR Block**: 10.0.0.0/16
- **Subnet Types**: Public, Private, and Database subnets with separate route tables
- **Routing**: Appropriate routing rules for each subnet type

### 2. Transit Gateway
- Deploy Transit Gateway within ap-northeast-1 for centralized connectivity management
- Configure Transit Gateway route tables to deny all traffic between development and production VPCs
- All inter-region traffic must traverse Transit Gateway peering connections
- Output Transit Gateway attachment IDs for verification

### 3. NAT Gateway
- Deploy NAT Gateways in each of the 3 availability zones for high availability
- Ensure proper routing through NAT Gateways for private subnets

### 4. S3 Buckets
- Enable versioning for data protection and recovery
- Bucket names must include region codes and be globally unique
- Configure VPC Flow Logs to S3 with 5-minute aggregation intervals
- VPC Flow Logs must exclude traffic to AWS service endpoints to reduce costs
- Output S3 bucket ARNs for verification

### 5. DynamoDB Tables
- Configure with on-demand billing mode
- Enable point-in-time recovery for global tables
- Implement appropriate table structure for the use case

### 6. Route 53
- Implement health checks using HTTPS endpoints with 30-second intervals
- Configure routing policies for DNS resolution
- Output hosted zone IDs for verification

### 7. Lambda Functions
- Monitor infrastructure health and trigger automated responses
- Use ARM-based Graviton2 processors (arm64 architecture) for cost optimization
- Implement appropriate monitoring and alerting mechanisms

### 8. VPC Flow Logs
- Send to S3 with 5-minute aggregation intervals
- Exclude traffic to AWS service endpoints to reduce costs
- Ensure proper IAM permissions for Flow Logs delivery

### 9. AWS Systems Manager Parameter Store
- Use for configuration management
- Encrypt values using AWS-managed KMS keys
- Store appropriate configuration parameters

### 10. Security & Compliance
- Implement strict network isolation between production and development workloads
- Maintain cross-region connectivity capabilities
- Enable automated failover capabilities
- Ensure all resources follow financial services compliance standards

## Expected Outputs
The CDK stacks should output the following for verification:
1. Transit Gateway attachment IDs
2. Route 53 hosted zone IDs
3. S3 bucket ARNs

## Constraints Summary
1. Use CDK TypeScript with strict type checking enabled
2. Transit Gateway route tables must deny all traffic between development and production VPCs
3. S3 bucket names must include region codes and be globally unique
4. Lambda functions must use ARM-based Graviton2 processors for cost optimization
5. All inter-region traffic must traverse Transit Gateway peering connections
6. VPC Flow Logs must exclude traffic to AWS service endpoints to reduce costs
7. DynamoDB global tables must have point-in-time recovery enabled
8. Route 53 health checks must use HTTPS endpoints with 30-second intervals
9. Parameter Store values must be encrypted using AWS-managed KMS keys

## Business Context
This infrastructure is for a financial services company establishing a new cloud environment with single-region presence for their trading platform. The infrastructure must support active-active deployment across regions with automated failover capabilities, requiring strict network isolation between production and development workloads while maintaining cross-region connectivity.

## Deliverables
- **Single Stack File**: All infrastructure resources must be defined in `lib/tap-stack.ts`
- Well-architected CDK TypeScript code with proper stack organization
- Automated health monitoring implementation
- Data versioning capabilities
- DNS-based routing configuration
- All required outputs for verification
- Comprehensive integration tests that validate:
  - VPC and subnet configurations
  - Transit Gateway connectivity
  - S3 versioning and Flow Logs
  - DynamoDB table configuration
  - Route 53 health checks
  - Lambda function execution
  - Parameter Store encryption
  - Network isolation between environments

## Implementation Notes
- All AWS resources (VPC, Transit Gateway, S3, DynamoDB, Route 53, Lambda, etc.) must be created within a single CDK stack class in `lib/tap-stack.ts`
- Do not split resources across multiple files or nested stacks
- Organize code with clear comments and logical grouping within the single file