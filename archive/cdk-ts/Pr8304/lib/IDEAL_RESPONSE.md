# Ideal Response: AWS CDK TypeScript Secure Network Infrastructure

Platform: cdk/ts

## Expected Solution

A comprehensive AWS CDK TypeScript implementation using `aws-cdk-lib` that creates an enterprise-level secure network infrastructure with the following components:

### Core Infrastructure
- Multi-region VPC deployment (us-east-1 and us-west-2)
- VPC with multi-AZ configuration (at least 2 availability zones)
- Three-tier subnet architecture (Public, Private with Egress, Private Isolated)
- VPC Flow Logs enabled with S3 storage and KMS encryption

### Security Features
- Security Groups with restricted ingress (SSH port 22, HTTP port 80) from specific CIDR blocks
- Security Groups with controlled egress rules
- IAM roles with minimal permissions following least privilege
- KMS key with automatic rotation for encryption
- S3 bucket with SSL enforcement and blocked public access

### Monitoring and Compliance
- CloudWatch alarms for unauthorized SSH access detection
- CloudWatch log groups for VPC Flow Logs analysis
- Comprehensive resource tagging (CostCenter, Environment)
- S3 lifecycle policies for cost optimization

### LocalStack Compatibility
- NAT Gateways disabled or configured for LocalStack
- Removal policies set to DESTROY for testing
- LocalStack-compatible resource configurations
- Skip or conditionally implement AWS Config and CloudTrail (LocalStack limitations)

### Code Structure
- Main orchestration stack (tap-stack.ts) using `aws-cdk-lib.Stack`
- Separate secure network stack module (secure-network-stack.ts) importing from `aws-cdk-lib`
- CDK constructs using `@aws-cdk` patterns
- Comprehensive unit and integration tests with CDK assertions
- Multi-region deployment support using CDK environments

### Testing
- Unit tests covering stack synthesis and resource creation
- Integration tests validating actual deployment to LocalStack
- Test coverage for security groups, VPC configuration, and S3 buckets

### Documentation
- Clear implementation overview
- Explanation of LocalStack compatibility decisions
- AWS Well-Architected Framework alignment