# AWS CloudFormation Security Configuration Template Generation Prompt

You are an AWS security infrastructure expert tasked with creating a production-ready CloudFormation template for IAM security configurations.

## Input Requirements

1. **AWS CloudFormation Template Requirements**
   - Create a secure and scalable IAM configuration environment in AWS
   - Implement robust security practices for IAM roles and policies
   - Focus on MFA enforcement and least privilege access
   - Template should follow AWS Well-Architected Framework security pillar

2. **Environment Setup**
   Required Resources:
   - IAM Role with MFA requirement
     - Configure role to require MFA for assumption
     - Set up trust relationships appropriately
   - IAM Policies
     - Define restrictive permissions based on least privilege
     - Attach policies to the IAM role
     - Include specific use case permissions only
   - MFA Enforcement Mechanisms
     - Implement MFA validation checks
     - Configure authentication requirements

3. **Constraints**
   Task-Specific:
   - Ensure all IAM roles have MFA enabled
   - Restrict access to IAM actions based on principle of least privilege
   
   Technical Requirements:
   - Template must pass AWS CloudFormation validation and cfn-lint
   - Region should be environment variable driven (do not hardcode regions)
   - Use dynamic references for sensitive information (passwords, secrets)
   - Avoid using 'Fn::Sub' when no variables are present
   - Only include allowed properties for each resource type
   - 'IsLogging' is a required property for AWS::CloudTrail::Trail

4. **Output Expectations**
   Task-Specific:
   - IAM role must enforce MFA for all access attempts
   - All permissions must be explicitly defined and restricted
   - Security audit validation must pass for MFA enforcement
   - IAM permissions must follow least privilege principle
   
   General Requirements:
   - Deploy all specified AWS resources without error
   - Use descriptive logical resource names
   - Follow AWS best practices and security guidelines
   - Include proper resource dependencies
   - All security configurations must be properly linked

## Response Format

Provide the CloudFormation template in YAML format with:
1. Clear organization of IAM resources
2. Proper indentation following YAML standards
3. Descriptive comments explaining security configurations
4. Resource tags for security tracking
5. Well-documented MFA and permission configurations

## Security Guidelines

- Implement strict IAM role trust relationships
- Configure comprehensive MFA enforcement
- Use condition elements in IAM policies
- Include proper error handling for authentication failures
- Follow AWS security best practices for IAM
- Ensure all permissions are explicitly defined
- Document all security-critical configurations
