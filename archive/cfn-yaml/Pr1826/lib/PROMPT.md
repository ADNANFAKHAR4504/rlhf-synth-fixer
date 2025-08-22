I need help creating a secure AWS infrastructure using CloudFormation YAML templates. The infrastructure should implement security best practices across multiple AWS accounts.

Requirements:
- Create IAM roles following least privilege principles for different user types (administrators, developers, read-only users)
- Implement MFA enforcement for all IAM users with support for FIDO2 passkeys
- Set up KMS encryption for data at rest across all services
- Configure AWS Security Hub for centralized security monitoring
- Use AWS IAM Access Analyzer to validate permissions
- Include proper resource tagging for security compliance
- Set up CloudTrail for audit logging with KMS encryption
- Configure password policies and access key rotation
- Create security groups with minimal required access
- Implement resource-based policies where appropriate

The solution should use the latest AWS security features including passkey MFA support and enhanced IAM Access Analyzer capabilities. All resources should be properly tagged and follow AWS Well-Architected security pillar guidelines.

Please provide the infrastructure code as CloudFormation YAML templates with one code block per file.