```markdown
Summary
-------
This document lists concrete failures and gaps found in the generated CDK TypeScript stack.

Detected Failures
-----------------

1) Invalid VPC endpoint type for S3
	- Description: The stack calls `vpc.addInterfaceEndpoint(...)` for S3. S3 uses a gateway VPC endpoint (GatewayVpcEndpoint), not an interface endpoint.
	- Evidence: `vpc.addInterfaceEndpoint('S3Endpoint' + suffix, { service: ec2.InterfaceVpcEndpointAwsService.S3, });`
	

2) Incorrect attempt to add Interface endpoints for services that may require different endpoint types or service identifiers
	- Description: Some endpoint additions are suspicious (S3 above) and others rely on `InterfaceVpcEndpointAwsService.*` names which must match available constants for the CDK/region. This may produce runtime/CFN errors if a constant does not exist for a service.
	- Evidence: Multiple `vpc.addInterfaceEndpoint(...)` calls including `EC2Endpoint`, `RDSEndpoint`, etc.

3) IAM policies are not least-privilege
	- Description: Several IAM inline policy statements use resources: `['*']` (or `cloudwatch:PutMetricData` with `resources:['*']`). This violates the requirement to implement least-privilege IAM roles for Lambdas.
	- Evidence: Policy statements like:
	  - `actions: ['ec2:DescribeInstances', 'ec2:DescribeTags', ...], resources: ['*']`
	  - `actions: ['cloudwatch:PutMetricData'], resources: ['*']`

4) Cross-region SNS replication not implemented correctly
	- Description: The prompt requires SNS topics to support cross-region replication for DR. The stack creates a second topic named `ComplianceViolationsTopicDR` and publishes to it, but both topics are created in the same stack/region — there is no explicit cross-region replication setup.
	- Evidence: Two topics are declared in the same stack and publishes are performed to both ARNs. There is no resource or mechanism ensuring the DR topic exists in another region or that messages are automatically replicated.

5) Hardcoded or invented SSM Parameter values and possible violation of "do not change provided data"
	- Description: The stack creates a SSM parameter `/compliance/approved-amis` with hard-coded sample AMI IDs. The prompt stated "Systems Manager Parameter Store contains approved AMI IDs" and also required "All provided data and configuration must remain intact and unchanged." Creating/overwriting a parameter with example AMIs can violate that instruction.
	- Evidence: `new ssm.StringParameter(..., { parameterName: '/compliance/approved-amis', stringValue: JSON.stringify(['ami-0abcdef1234567890', 'ami-1234567890abcdef0']), ... })`

6) Resource name suffix handling may produce invalid/undesirable names (esp. S3 bucket name)
	- Description: The implementation derives a `suffix = '-' + this.stackName` and appends it to several resource names (including bucketName) which may produce invalid S3 bucket names (uppercase characters, slashes, or lengths) or non-deterministic names across regions/environments.
	- Evidence: `const suffix = '-' + this.stackName;` and `bucketName: \\`compliance-scan-results${suffix}\\`.toLowerCase(),`

7) Dashboard auto-refresh setting may not be implemented via CDK as required
	- Description: The prompt asks for CloudWatch dashboard auto-refresh every 60 seconds. The stack sets `defaultInterval: Duration.seconds(60)` on the Dashboard construct; CDK does not guarantee this sets the dashboard console auto-refresh interval — the console refresh setting may be client-side. This is an implementation risk.
	- Evidence: `const complianceDashboard = new cloudwatch.Dashboard(this, 'ComplianceDashboard' + suffix, { dashboardName: 'infrastructure-compliance' + suffix, periodOverride: cloudwatch.PeriodOverride.AUTO, defaultInterval: Duration.seconds(60), });`

8) Metrics and alarms: time-range / 30-day trend explicitness
	- Description: The prompt asks dashboards showing compliance trends over 30 days. The widgets use metrics with daily or hourly periods, but the dashboard configuration does not explicitly fix a 30-day time window.
	- Evidence: Graph widgets use `period: Duration.hours(1)` or `Duration.days(1)` but no explicit `start`/`end` range for 30 days.

9) Use of `cloudwatch:PutMetricData` with resource '*' may be unnecessary / not supported
	- Description: `cloudwatch:PutMetricData` is a service-level action and defining `resources: ['*']` is typical, but it was included along with other broad `*` statements — combined with other `*` statements it weakens least-privilege posture.
	- Evidence: policy statement includes `actions: ['cloudwatch:PutMetricData'], resources: ['*']`

10) Publishing to DR topic: publishing code assumes CROSS_REGION_TOPIC_ARN exists in same region
	 - Description: The lambda publishes to `CROSS_REGION_TOPIC_ARN` which is created in the same stack — this does not ensure the DR topic exists in a different region. If the intent is DR, ensure that `CROSS_REGION_TOPIC_ARN` points to a different-region topic.
	 - Evidence: `await withRetry(() => sns.publish({ TopicArn: CROSS_REGION_TOPIC_ARN, ... }).promise());` and DR topic created in the same stack.

``` 