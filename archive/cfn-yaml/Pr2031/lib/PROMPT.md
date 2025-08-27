# CloudFormation Template for IAM MFA Enforcement

I need help creating a CloudFormation YAML template that enhances security by enforcing Multi-Factor Authentication (MFA) for IAM roles. This is for deployment in both us-east-1 and us-west-1 regions.

## Requirements

Create a CloudFormation template that includes:

1. At least one IAM role that follows organizational security policies
2. IAM policies attached to the roles that enforce MFA as a requirement for login actions
3. The template must be region-agnostic and deployable in both us-east-1 and us-west-1 without modifications
4. Template must conform to CloudFormation standards with valid YAML syntax

## Technical Specifications

- Use CloudFormation YAML format
- Include proper IAM condition statements to enforce MFA authentication
- The roles should require MFA for assume role actions
- Include appropriate trust policies for the IAM roles
- Use AWS managed policies where appropriate for MFA enforcement
- Ensure the template includes proper resource naming with environment suffix support

## Security Requirements

The IAM policies must:
- Deny actions when MFA is not present using aws:MultiFactorAuthPresent condition
- Include time-based MFA age restrictions using aws:MultiFactorAuthAge
- Support both virtual MFA devices and FIDO2 security keys (latest 2025 AWS feature)
- Include policies for IAM Identity Center integration for centralized MFA management (2025 enhancement)

## Additional Considerations

- Include parameter for environment suffix (dev, staging, prod)
- Add appropriate outputs for role ARNs and policy references
- Include metadata section for CloudFormation interface
- The template should be production-ready and follow AWS security best practices
- Support the latest AWS IAM MFA enforcement features introduced in 2025

Please provide the infrastructure code with one code block per file. The main CloudFormation template should be comprehensive and include all necessary resources for MFA-enforced IAM roles.