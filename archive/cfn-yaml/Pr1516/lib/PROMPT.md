I'm working on a CloudFormation template for our production security baseline in us-west-2 and need to make sure we're covering all the compliance requirements properly. We're using an existing VPC (vpc-123456) so I can't create a new one.

The main things I need to implement:

We need proper logging with CloudTrail set up for multi-region management events, writing to both S3 and CloudWatch. The retention should be at least 90 days and we want log file validation turned on. There's also a requirement for VPC Flow Logs on our existing VPC.

For encryption, I'm planning to create a KMS key that we can use across services - CloudTrail, S3, and RDS encryption. The S3 bucket for logs needs to be locked down with public access blocked and default encryption enabled.

Security-wise, we need to enforce MFA for IAM users. I'm thinking of creating a policy that denies actions when MFA isn't present, except for the actions needed to actually set up MFA. This would go on a group that existing users get added to later.

For network security, all our security groups need to use specific CIDR ranges instead of 0.0.0.0/0 for admin access. We typically use 203.0.113.10/32 for our office connection but that should be parameterized.

We also need AWS WAF with some basic rules - probably the managed rule groups plus an IP blocklist. It should be flexible enough to attach to an ALB or API Gateway if we provide an ARN, but still validate when we don't.

Config rules are required too - the usual suspects like cloudtrail-enabled, s3 encryption, MFA checks, flow logs enabled, RDS encryption, etc. The delivery channel should point to our logs bucket.

For monitoring, we need CloudWatch alarms for security events like root logins, failed console logins, and logins without MFA. These should go to an SNS topic for our security team.

I might include an optional RDS instance to demonstrate the encryption setup, but it should be behind a condition so the template works either way.

Everything needs to be tagged with Environment=Production and names should start with "prod-". The template should fail if deployed outside us-west-2.

Looking for a single YAML file that passes cfn-lint validation. Parameters for admin CIDR and maybe the WAF target ARN would be helpful.

The outputs should include the main ARNs and identifiers we'll need for other stacks - CloudTrail, S3 bucket, KMS key, WAF ACL, log groups, and SNS topic.