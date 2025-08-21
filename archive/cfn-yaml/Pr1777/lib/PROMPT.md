I'm working on a CloudFormation template for our security baseline infrastructure in us-east-1 and need to make sure it follows all the compliance requirements we've been discussing. The template needs to be production-ready and pass both AWS validation and cfn-lint.

Here's what I need to set up:

For the core security foundation, I want a customer-managed KMS key with rotation enabled that we can use across different services. CloudTrail should be configured for multi-region logging with KMS encryption, writing to a dedicated S3 bucket that's locked down properly.

The S3 setup is pretty important - I need account-level public access blocking plus individual bucket policies that enforce TLS. The CloudTrail bucket needs the specific permissions that AWS requires (the ACL check and PutObject permissions with the bucket-owner-full-control condition), otherwise we'll hit those annoying "Incorrect S3 bucket policy" errors.

Since we're reusing existing VPCs instead of creating new ones, the template should accept a VPC ID parameter and create a security group that only allows SSH from our office IP range. No other inbound traffic for now.

For the parameters, I'm thinking we need VPC ID (with validation), the allowed SSH CIDR block, and the usual tagging stuff like Environment, Owner, and Application. There should probably be a parameter to control whether CloudTrail gets created since some accounts might already have trails set up.

Everything needs proper tagging - Environment, Owner, Application, and Name tags that include the stack name. The bucket names should be auto-generated to avoid collisions and case issues.

One thing I want to be careful about is avoiding the legacy S3 properties that cfn-lint flags. No AccessControl property, and making sure the public access blocking is done the right way.

The outputs should include the key identifiers we'll need for other stacks - trail name, bucket names, KMS key ARN, security group ID, that kind of stuff.

I'm planning to call the file secure-infra.yml and it needs to validate cleanly. Should I include any specific deployment instructions or prerequisites documentation along with the template?

Let me know if this approach makes sense or if there are other security considerations I should be thinking about for the baseline setup.