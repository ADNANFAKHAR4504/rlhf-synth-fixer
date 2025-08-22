Hey team, we’ve got a big security-focused infrastructure project on our hands. The goal is to build out a robust AWS environment using CloudFormation that checks every box for best practices and compliance.

Here’s what we need: every S3 bucket must have server-side encryption turned on with AES-256—no exceptions. IAM policies should be locked down tight, only giving users and services the permissions they absolutely need. For EC2, we’re attaching IAM roles to every instance and making sure SSH isn’t open to the world (in fact, let’s avoid SSH access entirely unless it’s strictly necessary).

CloudTrail logging needs to be enabled everywhere, and those logs should be encrypted with KMS. Our VPC setup should be highly available, with both public and private subnets spread across different AZs. RDS instances need automated backups with at least 7 days of retention, and DynamoDB tables should have point-in-time recovery and continuous backups enabled.

For Lambda, any environment variables must be encrypted at rest using KMS. ALBs should have access logs enabled and sent to a dedicated S3 bucket that’s locked down so only logging services can write to it. Security groups should be as restrictive as possible—only the necessary ports and protocols allowed, everything else denied.

Tagging is important too: every resource should have tags for owner and environment so we can keep track of what’s what. And don’t forget GuardDuty—it needs to be switched on and set up to aggregate findings across all accounts into our central security account.

Naming conventions should follow the `<Service>-<Team>-<Name>` format, and everything should work out of the box in `us-west-2` (but be flexible for other regions if needed). The template should pass compliance checks with zero errors.

So, let’s pull all this together into a single CloudFormation YAML template that’s ready for production. Make sure it’s secure, scalable, and resilient, and that it exports all the important resource IDs so we can integrate with other stacks down the line.