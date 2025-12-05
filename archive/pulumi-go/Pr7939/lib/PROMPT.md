# PCI-DSS Compliant CI/CD Pipeline Infrastructure

## Problem Statement

Design and implement a PCI-DSS compliant CI/CD pipeline infrastructure using Pulumi in **Go** for a financial transaction processing system that handles credit card data.

## Requirements

### 1. Secure Source Code Management
- Implement AWS CodeCommit repository with:
  - Encryption at rest using AWS KMS
  - Encrypted transfer in transit
  - Branch protection for main/production branches
  - Required pull request reviews
  - Audit logging enabled

### 2. Secure Build Environment
- Create AWS CodeBuild projects with:
  - Isolated build environments (VPC-based)
  - Docker-based builds with secure base images
  - Encryption of build artifacts
  - No hardcoded secrets (use AWS Secrets Manager)
  - Build logs encrypted and retained for audit

### 3. Artifact Management
- Implement S3 bucket for artifacts with:
  - Server-side encryption (AES-256 or KMS)
  - Versioning enabled
  - Lifecycle policies for retention
  - Access logging enabled
  - Bucket policies restricting access

### 4. Deployment Pipeline
- Create AWS CodePipeline with:
  - Multi-stage deployment (dev, staging, prod)
  - Manual approval gates for production
  - Automated security scanning (SAST/DAST)
  - Deployment artifacts encrypted
  - Pipeline execution history retained

### 5. Secrets Management
- Implement AWS Secrets Manager for:
  - Database credentials
  - API keys
  - Encryption keys
  - Automatic rotation policies
  - Fine-grained IAM access controls

### 6. Security Scanning
- Integrate security scanning tools:
  - Static Application Security Testing (SAST)
  - Dependency vulnerability scanning
  - Container image scanning
  - Infrastructure as Code scanning

### 7. Monitoring and Logging
- Configure CloudWatch for:
  - Pipeline execution metrics
  - Build failure alerts
  - Security event monitoring
  - Log aggregation and retention (1 year minimum)

### 8. Compliance Controls
- Implement PCI-DSS required controls:
  - Network segmentation (VPC, security groups)
  - Encryption in transit and at rest
  - Access controls and authentication
  - Audit trails and logging
  - Change management processes

### 9. IAM and Access Control
- Create IAM roles and policies with:
  - Least privilege principle
  - Separate roles for build, deploy, and admin
  - MFA enforcement for sensitive operations
  - Service-linked roles for AWS services

### 10. Disaster Recovery
- Implement backup and recovery:
  - Cross-region replication for critical artifacts
  - Automated backup of pipeline configurations
  - Recovery procedures documented
  - Regular testing of recovery processes

## Technical Constraints

1. **Platform**: Pulumi with Go runtime
2. **Cloud Provider**: AWS only
3. **Encryption**: All data must be encrypted (in transit and at rest)
4. **Region**: Support for multi-region deployment
5. **Tagging**: All resources must be tagged for compliance tracking
6. **Naming**: Use consistent naming convention with environment suffix
7. **Network**: Deploy build resources in private subnets with VPC endpoints

## Outputs Required

The infrastructure must export:
- Repository clone URL (HTTPS)
- CodeBuild project ARN
- CodePipeline ARN
- S3 bucket name for artifacts
- Secrets Manager secret ARN
- CloudWatch log group names
- VPC ID and subnet IDs
- Security group IDs

## Success Criteria

1. All infrastructure deploys successfully
2. Pipeline can execute end-to-end builds
3. Security scanning integrated and functional
4. All PCI-DSS controls implemented
5. Audit logging captures all relevant events
6. Secrets properly encrypted and rotated
7. Network isolation properly configured
8. All resources tagged appropriately
9. Integration tests pass against deployed infrastructure
10. Documentation complete with security considerations
