## Infrastructure Changes Required

### Multi-Region Deployment Was Over-Engineering

The MODEL_RESPONSE initially deployed to multiple regions, but the PROMPT requirements do not specify multi-region deployment. This added unnecessary complexity and cost.

Simplified to single-region deployment as per actual requirements, with region configurable via CDK_DEFAULT_REGION environment variable

### Incorrect CloudWatch Actions Import

The MODEL_RESPONSE attempted to use cloudwatch.SnsAction which does not exist in the aws-cloudwatch module.

Added import for aws-cdk-lib/aws-cloudwatch-actions and used cloudwatchActions.SnsAction instead.

### Unnecessary VPC Configuration

The MODEL_RESPONSE included VPC, subnets, NAT gateways, and security groups which add cost and complexity without adding value for this use case. SageMaker endpoints and Lambda functions can operate without VPC when accessing AWS services.

Removed all VPC-related resources including ec2.Vpc, security groups, and VPC configurations from SageMaker model and Lambda function.

### Resource Retention Policy

The MODEL_RESPONSE used RemovalPolicy.RETAIN for S3 bucket and DynamoDB table, preventing clean stack deletion.

Changed to RemovalPolicy.DESTROY with autoDeleteObjects: true for S3 bucket to enable complete stack cleanup.

### Incompatible SageMaker Configuration

The MODEL_RESPONSE attempted to use serverlessConfig alongside initialInstanceCount in the endpoint configuration, which is invalid. These are mutually exclusive options.

Removed serverlessConfig and kept only instance-based configuration with ml.t2.medium instance type.

### Missing Stack Export Names

The MODEL_RESPONSE CloudFormation outputs lacked exportName properties, preventing cross-stack references in multi-region deployment.

Added exportName using stack name prefix for all outputs to enable cross-stack imports.

### Overcomplicated Drift Detection

The MODEL_RESPONSE included a separate drift detection Lambda function triggered by EventBridge, adding unnecessary complexity when CloudWatch alarms with SNS actions provide sufficient alerting.

Removed the drift detection Lambda and rely solely on CloudWatch alarms with SNS topic actions for drift and health monitoring.

### Deprecated API Usage

The MODEL_RESPONSE used pointInTimeRecovery property which is deprecated in favor of pointInTimeRecoverySpecification.

This is a minor deprecation warning that does not affect functionality but should use the current API.

### Instance Type Selection

The MODEL_RESPONSE used ml.c5.large instances which have higher cost and may not be necessary for the workload requirements.

Changed to ml.t2.medium for cost optimization while meeting the 500k predictions per day requirement.

### Missing ECR Repository Permissions

The MODEL_RESPONSE lacked explicit ECR repository policies and proper permission scoping for SageMaker to pull container images.

Added ECR repository policy to grant SageMaker service principal access, and split execution role permissions into separate policies for GetAuthorizationToken (wildcard) and pull permissions (scoped to specific repositories).

### Security Hub Implementation Gap

The MODEL_RESPONSE did not include AWS Security Hub configuration, which is critical for fintech compliance requirements. Financial services require continuous security monitoring and compliance auditing.

Added Security Hub implementation with:
- **Custom resource check** to detect if Security Hub is already enabled (common in enterprise AWS accounts)
- **Conditional enablement** to avoid conflicts when Security Hub is already active at the organization level
- **PCI-DSS v3.2.1 standard** for payment card industry compliance
- **AWS Foundational Security Best Practices v1.0.0** for baseline security controls
- **Proper IAM permissions** for the check function (securityhub:DescribeHub, securityhub:GetFindings, securityhub:ListEnabledProductsForImport)

This approach prevents deployment failures in accounts where Security Hub is already enabled while ensuring compliance requirements are met.