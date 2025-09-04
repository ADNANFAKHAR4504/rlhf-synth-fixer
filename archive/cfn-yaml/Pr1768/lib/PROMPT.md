I need help creating a comprehensive secure AWS infrastructure using CloudFormation YAML. The infrastructure should demonstrate enterprise-level security best practices with the following requirements:

**Core Security Requirements:**
- IAM roles and policies following least privilege access principles
- All data encrypted at rest and in transit using AWS KMS customer-managed keys with FIPS 140-3 validated HSMs
- Detailed security groups with specific ingress and egress rules (no 0.0.0.0/0 unless absolutely necessary)
- S3 buckets with versioning enabled, access logging, and server-side encryption
- MFA enforcement for all IAM users where applicable
- AWS Config rules for continuous compliance monitoring
- Trusted AMI validation for EC2 instances
- Proper resource naming conventions with environment-specific suffixes

**Latest AWS Features to Include:**
- AWS Security Hub unified security solution with enhanced correlation capabilities for risk prioritization
- AWS Config integration with Security Hub CSPM for continuous compliance monitoring

**Infrastructure Components:**
The template should include a mix of storage, compute, and networking resources that showcase these security practices. Focus on commonly used services like S3, DynamoDB, Lambda, EC2, and VPC components.

**Additional Requirements:**
- All resources deployed in us-east-1 region
- Use parameter-driven configuration for environment flexibility
- Include comprehensive outputs for integration with other stacks
- Ensure resources deploy quickly (avoid long-running resources like RDS clusters)
- Add detailed descriptions and comments for maintainability

Please provide the complete CloudFormation YAML template with one code block per file. The template should be production-ready and demonstrate current AWS security best practices.