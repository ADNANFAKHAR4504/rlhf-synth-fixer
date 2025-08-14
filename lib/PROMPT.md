## Context
You are an AWS CloudFormation expert tasked with creating secure infrastructure-as-code templates. This exercise focuses on implementing comprehensive security controls for sensitive data storage environments.

## Task Description
Create a **CloudFormation template in YAML format** that establishes a secure AWS infrastructure for storing sensitive data across multiple regions. Your solution must demonstrate advanced security practices and compliance with enterprise-grade requirements.

## Requirements Specification

### Core Security Requirements
1. **Encryption Standards**
   - Configure all S3 buckets with server-side encryption using AES-256
   - Utilize AWS Key Management Service (KMS) for encryption key management
   - Ensure encryption at rest for all sensitive resources

2. **Access Control & IAM**
   - Implement IAM roles following strict least privilege principle
   - Enable multi-factor authentication (MFA) for all IAM users handling sensitive data
   - Create restrictive IAM policies limiting users/roles to specific required actions per service

3. **Monitoring & Compliance**
   - Configure AWS CloudTrail to log all S3 bucket access requests
   - Ensure comprehensive audit trail for compliance requirements
   - Implement monitoring for security events

4. **Network Security**
   - Ensure no resources are publicly accessible by default unless explicitly required
   - Implement proper security group configurations
   - Follow defense-in-depth principles

5. **Data Lifecycle Management**
   - Apply lifecycle policies to S3 buckets for automatic transition to Amazon S3 Glacier after 30 days
   - Optimize storage costs while maintaining data accessibility

## Technical Constraints
- **Platform**: AWS CloudFormation
- **Format**: YAML syntax only
- **Validation**: Template must pass AWS CloudFormation validation
- **Deployment**: Must successfully create infrastructure when deployed
- **Compliance**: Demonstrate adherence to all security specifications

## Deliverable Requirements

### Template Structure
Your CloudFormation template should include:
- **Parameters**: Allow customization for different environments
- **Mappings**: Region-specific configurations if needed
- **Conditions**: Environment-based resource creation logic
- **Resources**: All required AWS resources with proper dependencies
- **Outputs**: Key resource identifiers and endpoints

### Security Implementation
Focus on these critical areas:
- S3 bucket configurations with encryption and access controls
- IAM roles, policies, and users with MFA requirements
- KMS key creation and management
- CloudTrail configuration for audit logging
- Lifecycle policies for cost optimization
- Network security configurations

### Best Practices
- Use descriptive resource names and consistent naming conventions
- Include comprehensive documentation through comments
- Implement proper resource dependencies and ordering
- Follow AWS Well-Architected Framework security pillar guidelines
- Ensure template reusability across environments

## Success Criteria
1. **Functional**: Template deploys successfully without errors
2. **Secure**: All security requirements are properly implemented
3. **Compliant**: Meets enterprise compliance standards
4. **Maintainable**: Code is well-structured and documented
5. **Scalable**: Design supports multi-region deployment

## Additional Considerations
- Consider cross-region replication for disaster recovery
- Implement proper tagging strategy for resource management
- Include cost optimization strategies where applicable
- Ensure template supports different environment configurations (dev, staging, prod)

## Expected Output Format
Provide a complete YAML CloudFormation template that:
- Starts with `AWSTemplateFormatVersion: '2010-09-09'`
- Includes a meaningful `Description`
- Contains all required sections (Parameters, Resources, Outputs)
- Implements every security requirement specified
- Includes inline comments explaining security decisions
- Follows YAML syntax best practices

**Note**: Your template will be validated against AWS CloudFormation standards and tested for successful deployment. Ensure all security controls are properly configured and documented.