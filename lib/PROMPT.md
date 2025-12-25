Need a CloudFormation template for our IAM security setup that enforces MFA and follows least privilege principles. We're trying to tighten up our access controls and make sure everyone has to use MFA to assume roles.

The setup should have three main IAM roles with different permission levels - one for developers working on projects, one for read-only access for auditors and monitoring, and one for operations team doing production work. All three roles need to require MFA when someone tries to assume them.

For the developer role, I want them to be able to work with EC2 instances (but only smaller instance types like t3.micro, t3.small, t3.medium), access S3 buckets that start with "dev-", manage CloudFormation stacks prefixed with "dev-", and work with Lambda functions also prefixed with "dev-". The MFA session should be valid for 1 hour before they need to re-authenticate.

The read-only role should give full describe/get permissions across EC2, S3, Lambda, CloudFormation, and IAM so auditors can see everything but not make changes. Also include CloudTrail read access so they can review audit logs. MFA session can be a bit longer here, maybe 2 hours since they're just looking at things.

The operations role needs broader EC2 permissions for the current region, S3 access to production and backup buckets, CloudWatch for monitoring and logging, and Systems Manager for running commands and managing parameters. This one should have a shorter MFA timeout of 30 minutes since they're doing sensitive production work.

Also set up a CloudTrail for audit logging that writes to an S3 bucket named "security-audit-logs-{account-id}". Make sure the bucket policy allows CloudTrail to write logs there. Enable log file validation and make it multi-region so we capture everything.

The roles should use the trust policy pattern where they trust the account root but require MFA present and check the MFA age. Each role gets its own managed policy with the specific permissions needed. Tag everything appropriately so we can track which role is for what purpose.

Make sure to follow the usual CloudFormation best practices - don't hardcode the region, use Fn::Sub for account ID references, make sure the IsLogging property is set to true for CloudTrail. Output the ARNs of all three roles and the CloudTrail so we can reference them later.

The whole template needs to pass cfn-lint validation and should be deployable without errors. Looking for production-ready code that I can deploy right away to tighten up our security posture.
