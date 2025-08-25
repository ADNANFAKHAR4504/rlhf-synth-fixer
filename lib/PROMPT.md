Hey, I'm working on setting up AWS infrastructure for our company and could really use some help. We're a financial services company, so security is obviously a huge deal for us.

We want to use Pulumi with Java (our team is more comfortable with Java than other languages), but I'm not super familiar with all the AWS security best practices. Our compliance team is breathing down our necks about this, so I need to make sure we get it right the first time.

Here's what I'm trying to build:

**The main stuff we need:**
- VPC setup in us-east-1 (that's where most of our stuff is)
- Everything needs to be encrypted - S3 buckets, EBS volumes, RDS databases, Lambda functions, etc.
- IAM roles with managed policies (no direct admin access for users - our security team is strict about this)
- AWS Config with compliance rules (we need to monitor our security posture)
- CloudTrail enabled for audit trails (compliance requirement)
- Lambda functions with KMS encryption for sensitive env vars
- All resources tagged with Environment=production

**The non-negotiables:**
- Encryption at rest for ALL resources (no exceptions)
- Use managed IAM policies when possible
- Zero admin access through IAM user policies
- AWS Config rules actively monitoring compliance
- CloudTrail properly configured
- Lambda env vars with sensitive data must be encrypted
- Every resource needs the Environment=production tag

Can you help me create a Pulumi Java program that covers all this? The code needs to be production-ready and well-organized since other developers will be maintaining it. It has to pass our security reviews and compliance checks without any issues.

Thanks in advance!
