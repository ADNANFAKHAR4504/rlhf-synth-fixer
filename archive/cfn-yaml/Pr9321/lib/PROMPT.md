Need a CloudFormation template for our IAM security setup that enforces MFA and follows least privilege principles. We're trying to tighten up our access controls and make sure everyone has to use MFA to assume roles.

The setup should have three main IAM roles with different permission levels - one for developers working on projects, one for read-only access for auditors and monitoring, and one for operations team doing production work. All three roles need to require MFA when someone tries to assume them.

For the developer role, developers assume the role which grants access to work with EC2 instances restricted to smaller instance types like t3.micro, t3.small, and t3.medium. The role connects to S3 buckets starting with dev- for file storage and retrieval, invokes Lambda functions prefixed with dev- for testing code deployments, and manages CloudFormation stacks prefixed with dev- for infrastructure changes. The MFA session authenticates for 1 hour before requiring re-authentication.

The read-only role gives auditors permissions to describe EC2 resources, retrieve objects from S3 buckets, inspect Lambda function configurations, query CloudFormation stack details, and review IAM policies across the account. The role also connects to CloudTrail to lookup audit events and retrieve security logs for compliance reviews. MFA session duration extends to 2 hours since they're performing read-only operations.

The operations role provides broader access where operations staff assume the role to manage EC2 instances in the current region, upload and download objects from production and backup S3 buckets, write CloudWatch metrics and create log streams for monitoring, and execute Systems Manager commands on instances while reading parameters from Parameter Store. This role requires MFA re-authentication every 30 minutes due to the sensitive production access.

Set up CloudTrail that writes audit logs to an S3 bucket named security-audit-logs-ACCOUNTID where ACCOUNTID gets replaced with the actual AWS account number. The S3 bucket policy allows the CloudTrail service to write log files and check bucket ACLs. Enable log file validation and make it multi-region so we capture API calls across all regions.

The IAM roles trust the account root principal but require the MultiFactorAuthPresent condition to be true and check that MultiFactorAuthAge is within the specified timeout. Each role attaches to its own managed IAM policy defining the specific permissions needed. Tag all resources so we can track which role serves what purpose.

Use CloudFormation best practices where the template references AWS account ID dynamically instead of hardcoding, avoids hardcoded regions, and sets IsLogging property to true for the CloudTrail resource. Export the ARNs of all three IAM roles and the CloudTrail ARN as stack outputs for cross-stack references.

The template must pass cfn-lint validation and deploy without errors. Need production-ready infrastructure code to deploy immediately and tighten our security posture.
