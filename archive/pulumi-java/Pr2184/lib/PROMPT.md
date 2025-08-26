I'm trying to set up our AWS infrastructure and running into some issues. We're a financial services company so security is critical.

We decided to go with Pulumi using Java since our dev team knows Java better than other languages. But I'm not that familiar with AWS security best practices and our compliance team is really strict about this stuff.

What I need to build:
- VPC in us-east-1 region
- Everything encrypted - S3, EBS, RDS, Lambda, etc.
- IAM roles with managed policies (no admin access allowed)
- AWS Config for compliance monitoring
- CloudTrail for audit logs (required by compliance)
- Lambda functions with KMS encryption for sensitive environment variables
- All resources tagged with Environment=production

The security requirements are:
- Encryption at rest for everything
- Use managed IAM policies where possible
- No admin access through IAM users
- AWS Config rules monitoring compliance
- CloudTrail properly set up
- Lambda env vars encrypted if they contain sensitive data
- Environment=production tag on all resources

Can you help me create a Pulumi Java program that handles all this? The code needs to be production-ready and well-organized since other developers will be maintaining it. It has to pass our security reviews and compliance checks.

Thanks!
