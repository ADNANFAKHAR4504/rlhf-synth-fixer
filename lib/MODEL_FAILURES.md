# Model Response Infrastructure Failures

This document outlines the infrastructure changes needed to fix the MODEL_RESPONSE to arrive at the IDEAL_RESPONSE.

## 1. Removal Policy Issues

The MODEL_RESPONSE uses `RemovalPolicy.RETAIN` for all resources including KMS keys, S3 buckets, DynamoDB tables, log groups, and secrets. This prevents stack deletion in test environments.

Fix: Change all `RemovalPolicy.RETAIN` to `RemovalPolicy.DESTROY` and add `auto_delete_objects=True` for S3 buckets.

## 2. S3 Bucket Creation Order

The MODEL_RESPONSE references `self.audit_logs_bucket` in `_create_secure_s3_bucket` for server access logging before the audit logs bucket is created, causing a circular reference error.

Fix: Create the audit logs bucket first as a separate method `_create_audit_logs_bucket` without access logging, then create the raw-data and processed-data buckets with access logging pointing to the audit bucket.

## 3. API Gateway Custom Domain with Invalid Certificate

The MODEL_RESPONSE creates an API Gateway DomainName with a placeholder certificate ARN that will fail deployment:

```python
certificate_arn=f"arn:aws:acm:us-east-1:{self.account}:certificate/placeholder"
```

Fix: Remove the custom domain configuration entirely for test environments. Use the default API Gateway endpoint URL which does not require a custom certificate.

## 4. Secret Rotation Lambda Circular Dependency

The MODEL_RESPONSE creates a rotation Lambda function that references `self.api_certificate_secret` before the secret is fully created, and the secret references the rotation Lambda, causing a circular dependency.

Fix: Use the hosted rotation option provided by AWS CDK instead of a custom rotation Lambda:

```python
secret.add_rotation_schedule(
    "RotationSchedule",
    automatically_after=Duration.days(30),
    hosted_rotation=secretsmanager.HostedRotation.mysql_single_user(
        vpc=self.vpc,
        vpc_subnets=ec2.SubnetSelection(
            subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
        )
    )
)
```

## 5. Invalid IAM Deny Internet Condition

The MODEL_RESPONSE uses an invalid IAM condition for denying internet access:

```python
conditions={
    "StringNotEquals": {
        "aws:SourceVpc": self.vpc.vpc_id
    }
}
```

This condition does not work with `*` actions and resources as intended.

Fix: The Lambda already runs in an isolated VPC with no internet gateway or NAT gateway, so internet access is inherently denied. The IAM deny statement should be restructured or removed as it provides no additional security benefit.

## 6. VPC Endpoint Subnet Selection

The MODEL_RESPONSE passes `subnets` as a list to Gateway VPC endpoints which is incorrect:

```python
subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)]
```

Fix: Gateway VPC endpoints do not require subnet selection - remove the subnets parameter from Gateway endpoints (S3 and DynamoDB).

## 7. Missing CloudWatch Logs VPC Endpoint

The MODEL_RESPONSE does not include a CloudWatch Logs VPC endpoint, which is required for Lambda to write logs from within the isolated VPC.

Fix: Add a CloudWatch Logs interface VPC endpoint:

```python
vpc_endpoints['logs'] = ec2.InterfaceVpcEndpoint(
    self,
    "CloudWatchLogsVPCEndpoint",
    vpc=vpc,
    service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    private_dns_enabled=True,
    security_groups=[endpoint_sg],
    subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
)
```

## 8. Lambda and KMS VPC Endpoints Unnecessary

The MODEL_RESPONSE creates Lambda and KMS interface VPC endpoints that are not strictly required for the architecture. Lambda invocation happens via API Gateway (not from within VPC), and KMS operations can work through the existing S3 and DynamoDB gateway endpoints.

Fix: Remove unnecessary Lambda and KMS VPC endpoints. Add only CloudWatch Logs endpoint which is required for Lambda logging.

## 9. Hardcoded Region Values

The MODEL_RESPONSE hardcodes region values in multiple places instead of using CDK constructs:

```python
kwargs['env']['region'] = 'us-east-1'
```

Fix: Allow region to be passed via CDK context or environment, supporting flexibility for deployment.

## 10. DynamoDB Stream Not Required

The MODEL_RESPONSE enables DynamoDB streams which is not required by the specifications:

```python
stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
```

Fix: Remove the stream configuration as it adds unnecessary complexity and cost.

## 11. Global Secondary Index Not Required

The MODEL_RESPONSE adds a GSI on the DynamoDB table which is not specified in requirements.

Fix: Remove the GSI configuration to keep the table simple and aligned with requirements.

## 12. Lambda Reserved Concurrency

The MODEL_RESPONSE sets `reserved_concurrent_executions=10` which may be too restrictive for production workloads.

Fix: Remove the reserved concurrency limit or make it configurable via props.

## 13. S3 Bucket Naming

The MODEL_RESPONSE uses account ID in bucket names but includes region redundantly:

```python
bucket_name=f"{self.account}-{bucket_suffix}-{self.region}"
```

Fix: Use environment suffix for uniqueness across deployments:

```python
bucket_name=f"{bucket_suffix}-{self.account}-{self.environment_suffix}"
```

## 14. API Gateway Resource Policy Too Restrictive

The MODEL_RESPONSE includes an IP-based resource policy that restricts access to 10.0.0.0/8:

```python
"aws:SourceIp": ["10.0.0.0/8"]
```

Fix: Remove the restrictive IP policy for test environments. Use IAM authorization which is already configured.

## 15. Missing Stack Props Integration

The MODEL_RESPONSE uses a standalone main() function pattern instead of integrating with the existing tap.py entry point and TapStackProps class.

Fix: Use the existing TapStackProps pattern and integrate with tap.py entry point for consistency with the project structure.
