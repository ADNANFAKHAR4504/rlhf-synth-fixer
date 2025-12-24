We're building out a secure AWS environment for a modern organization, and we want to do it right using CloudFormation. The stack needs to cover all the essentials - S3, IAM, EC2, CloudTrail, VPC, RDS, Lambda, DynamoDB, ALB, and GuardDuty - while making sure everything is locked down, scalable, and resilient.

Here’s what matters: every S3 bucket should be encrypted with AES-256, no shortcuts. IAM policies need to be tight, only giving access where it’s truly needed. EC2 instances should always have IAM roles attached, and SSH access should be locked down or, better yet, disabled unless there’s a real reason for it.

Lambda functions? Make sure their environment variables are encrypted at rest using KMS. ALBs should have access logs enabled and sent to a dedicated S3 bucket that's locked down so only logging services can write to it. Security groups should be as restrictive as possible - only the necessary ports and protocols allowed, everything else denied.

Tagging is important too: every resource should have tags for owner and environment so we can keep track of what's what. And don't forget GuardDuty - it needs to be switched on and set up to aggregate findings across all accounts into our central security account.

Stick to the `<Service>-<Team>-<Name>` naming convention, and make sure everything works out of the box in `us-west-2`. The template should pass compliance checks with zero errors and export all the important resource IDs so we can hook it up to other stacks if needed.

Just give us a single, production-ready CloudFormation YAML template that brings all this together, following these requirements as closely as possible.