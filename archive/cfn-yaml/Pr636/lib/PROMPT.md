# CloudFormation Security Template Generation Prompt

## Objective

Create a production-ready CloudFormation YAML template named `FinApp-Security.yaml` that implements a secure AWS architecture for a financial application with enterprise-grade security controls.

## Core Requirements

### 1. S3 Bucket Configuration

- **Purpose**: Store sensitive financial documents
- **Naming**: Follow convention `FinApp-<ResourceType>`
- **Security Features**:
  - Enable versioning for audit compliance
  - Block all public access
  - Enable access logging
  - Configure lifecycle policies for cost optimization
  - Enable MFA delete protection

### 2. IAM Role Implementation

- **Principle**: Least-privilege access model
- **Capabilities**:
  - Read/write access to the specific S3 bucket only
  - List bucket contents
  - Manage object metadata
  - No administrative permissions
- **Trust Policy**: Allow assumption by EC2 instances or specific services
- **Include**: IAM instance profile for EC2 attachment

### 3. Encryption Requirements

- **Data at Rest**:
  - Use AWS S3-managed encryption (SSE-S3)
  - Set as default encryption on bucket
  - Deny unencrypted object uploads
- **Data in Transit**:
  - Enforce SSL/TLS for all requests
  - Implement bucket policy to deny non-HTTPS requests
  - Use secure transport condition in all policies

### 4. Security Best Practices

- **Monitoring**: Enable CloudTrail logging for S3 API calls
- **Network Security**: Configure VPC endpoint for S3 (optional but recommended)
- **Access Control**: Implement restrictive bucket policies
- **Compliance**: Add resource tags for governance and cost allocation

### 5. CloudFormation Best Practices

- **Region**: us-east-1 (hardcoded or parameterized)
- **Parameters**: Make template flexible with input parameters
- **Outputs**: Export key resource ARNs for cross-stack references
- **Metadata**: Include template description and version
- **Validation**: Ensure template passes `aws cloudformation validate-template`

## Security Validation Checklist

- [ ] No hardcoded secrets or credentials
- [ ] All resources follow least-privilege principle
- [ ] Encryption enabled for data at rest and in transit
- [ ] Public access explicitly blocked
- [ ] Proper resource tagging implemented
- [ ] CloudTrail integration for audit logging
- [ ] MFA delete protection enabled
- [ ] Bucket policy denies unencrypted uploads
- [ ] SSL/TLS enforcement implemented

## Expected Deliverable

A complete, deployment-ready CloudFormation YAML template that:

1. Deploys successfully in us-east-1
2. Passes AWS security best practice checks
3. Meets financial industry compliance standards
4. Includes comprehensive inline documentation
5. Provides clear outputs for integration with other stacks

## Additional Considerations

- Include parameter descriptions and allowed values
- Add condition logic for environment-specific configurations
- Implement proper error handling and rollback capabilities
- Consider cross-region replication for disaster recovery
- Document any manual post-deployment configuration steps

Generate the complete CloudFormation template with detailed comments explaining each security control and its purpose.
