I need help designing a secure AWS infrastructure for our financial services company. We're looking to use Pulumi with Java to set this up, and I want to make sure we're following all the best practices and compliance requirements.

Here's what we're trying to accomplish:

**Core Infrastructure:**
- Set up VPCs in us-east-1 for our production workloads
- Make sure everything is encrypted at rest (S3, EBS, RDS, Lambda, you name it)
- Use proper IAM roles with managed policies - no direct admin access for users
- Get AWS Config running with compliance rules to keep an eye on our security posture
- Enable CloudTrail in us-east-1 for audit trails and governance
- For Lambda functions that need sensitive environment variables, we need KMS encryption
- Tag everything with Environment=production

**Key Requirements:**
- Encryption at rest is non-negotiable for all resources
- Stick to managed IAM policies where possible
- Zero admin access through IAM user policies
- AWS Config rules need to be actively monitoring compliance
- CloudTrail must be enabled and configured properly
- Lambda environment variables containing sensitive data must be encrypted
- Every single resource needs the Environment=production tag

Can you create a Pulumi Java program that handles all of this? The code should be production-ready, well-organized, and maintainable. We need it to pass security reviews and compliance checks without any issues.
