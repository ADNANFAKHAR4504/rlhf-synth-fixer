Alright, so here's what I'm looking for. Need a single terraform file that sets up our basic AWS infrastructure without any of the usual headaches.

Just put everything in lib/tap_stack.tf since we already have the provider stuff sorted out in provider.tf. Don't want to duplicate that. And I really need this to work with just "terraform plan" without having to answer a bunch of prompts every time, so please add reasonable defaults for everything.

Security is important here - make sure S3 buckets are locked down with TLS enforcement, turn on encryption everywhere, use proper security groups, and keep IAM permissions as tight as possible.

For the region, we're using an aws_region variable already, so just wire everything to that and default it to us-west-2. I don't want to have to specify a million variables just to run a plan, so if you can auto-discover things like VPC info or provide sane defaults, do that. The only tricky bit is bucket names need to be unique globally, so just use some obvious placeholder pattern.

Here's what needs to be in there:

Two S3 buckets - one for logs, one for data. Both need versioning enabled, public access blocked completely, and TLS-only policies. The data bucket should use SSE with KMS (the default aws/s3 key is fine unless someone provides a custom one). Route the bucket access logs from the data bucket to the logs bucket.

IAM wise, need a role that EC2 instances can use to read/write S3 objects based on tags, plus an IAM user for deployments. Keep the policies minimal. Also add one of those account-level MFA policies and attach it through a group that the user belongs to.

For EC2, put it behind a toggle since we don't always need it. When enabled, create a security group that only allows SSH and HTTPS from whatever CIDR gets specified. The actual instance needs IMDSv2 enforced and an encrypted root volume.

CloudTrail should also be toggleable since some accounts already have too many trails. When enabled, create a regional trail with its own bucket and the standard delivery policy. Would be nice to have an option to reuse existing trail/bucket instead of always creating new ones.

Same deal with AWS Config - toggleable recorder and delivery channel that writes to the logs bucket, plus a few of the standard managed rules. Make it easy to turn off completely if there's already a recorder in the account.

GuardDuty is simple, just the detector, also behind a toggle.

The outputs our tests need are data_bucket_name, trail_bucket_name, cloudtrail_arn, ec2_instance_id, security_group_id, iam_role_name, and iam_user_name. Some of these can be empty strings if the corresponding resources are disabled.

Couple other things - don't add any provider blocks to tap_stack.tf, keep the code readable with comments where things might not be obvious, and default to having CloudTrail and Config disabled so we don't break shared accounts. But make it trivial to turn them on with terraform variables.
