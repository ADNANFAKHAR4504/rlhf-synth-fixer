# Infrastructure Changes Required to Fix MODEL_RESPONSE

This document outlines the infrastructure changes needed to transform the MODEL_RESPONSE into the IDEAL_RESPONSE.

## 1. Stack Class and Props Structure

**Issue:** MODEL_RESPONSE uses `SecureDataProcessingPipelineStack` class without proper props inheritance pattern.

**Fix:** Rename to `TapStack` and create `TapStackProps` class extending `cdk.StackProps`:

```python
class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
```

## 2. Removal Policy for Test Environment

**Issue:** MODEL_RESPONSE uses `RemovalPolicy.RETAIN` for resources.

**Fix:** Change all resources to use `RemovalPolicy.DESTROY` for easy cleanup:
- KMS Key: `removal_policy=RemovalPolicy.DESTROY`
- S3 Buckets: `removal_policy=RemovalPolicy.DESTROY, auto_delete_objects=True`
- DynamoDB Table: `removal_policy=RemovalPolicy.DESTROY`
- CloudWatch Log Groups: `removal_policy=RemovalPolicy.DESTROY`
- Secrets Manager Secret: `removal_policy=RemovalPolicy.DESTROY`

## 3. DynamoDB Point-in-Time Recovery

**Issue:** MODEL_RESPONSE uses deprecated `point_in_time_recovery=True` parameter.

**Fix:** Use the new specification format:

```python
point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
    point_in_time_recovery_enabled=True
)
```

## 4. Lambda IAM Role Managed Policy

**Issue:** MODEL_RESPONSE uses `add_managed_policy()` method which triggers CDK warnings.

**Fix:** Use `from_managed_policy_arn` and pass managed policies directly in the Role constructor:

```python
vpc_access_policy = iam.ManagedPolicy.from_managed_policy_arn(
    self,
    "VPCAccessPolicy",
    "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
)

lambda_role = iam.Role(
    self,
    "DataProcessorRole",
    assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
    managed_policies=[vpc_access_policy],
)
```

## 5. S3 Bucket Creation Order

**Issue:** MODEL_RESPONSE creates buckets referencing `self.audit_logs_bucket` before it is defined.

**Fix:** Create audit logs bucket first, then create other buckets that reference it for access logging:

```python
self.audit_logs_bucket = self._create_audit_logs_bucket()
self.raw_data_bucket = self._create_secure_s3_bucket("raw-data")
self.processed_data_bucket = self._create_secure_s3_bucket("processed-data")
```

## 6. VPC Endpoint Configuration

**Issue:** MODEL_RESPONSE includes unnecessary VPC endpoints (Lambda, KMS) and incorrect subnet configuration for gateway endpoints.

**Fix:** Remove unnecessary endpoints and fix gateway endpoint configuration:

```python
vpc_endpoints["s3"] = ec2.GatewayVpcEndpoint(
    self,
    "S3VPCEndpoint",
    vpc=vpc,
    service=ec2.GatewayVpcEndpointAwsService.S3,
)
```

Gateway endpoints do not require subnet selection parameter.

## 7. Secrets Manager Rotation

**Issue:** MODEL_RESPONSE creates a custom rotation Lambda function which is complex and error-prone. Hosted rotation generates Lambda function names that exceed 64 characters when combined with long stack names.

**Fix:** For test environments, remove rotation schedule entirely since:
- API certificate rotation requires custom logic (hosted rotation is for database credentials)
- Generated function names exceed AWS Lambda 64-character limit
- Test environments use placeholder certificates that do not require rotation

```python
secret = secretsmanager.Secret(
    self,
    "APICertificateSecret",
    secret_name=f"data-pipeline-api-certificates-{self.environment_suffix}",
    description="API certificates for mutual TLS authentication",
    encryption_key=self.kms_key,
    generate_secret_string=secretsmanager.SecretStringGenerator(...),
    removal_policy=RemovalPolicy.DESTROY
)
# No rotation schedule for test environment
return secret
```

## 8. API Gateway Mutual TLS

**Issue:** MODEL_RESPONSE attempts to configure mutual TLS with domain name which requires a custom domain and certificate.

**Fix:** Remove mutual TLS configuration for test environment without custom domain. Use IAM authorization instead:

```python
process_resource.add_method(
    "POST",
    lambda_integration,
    authorization_type=apigateway.AuthorizationType.IAM,
)
```

## 9. Lambda Runtime Version

**Issue:** MODEL_RESPONSE uses `PYTHON_3_11`.

**Fix:** Update to latest stable runtime:

```python
runtime=lambda_.Runtime.PYTHON_3_12
```

## 10. Environment Suffix in Resource Names

**Issue:** MODEL_RESPONSE hardcodes resource names without environment suffix.

**Fix:** Add environment suffix to all resource names for isolation:

```python
bucket_name=f"{bucket_suffix}-{self.account}-{self.environment_suffix}"
table_name=f"data-pipeline-metadata-{self.environment_suffix}"
function_name=f"secure-data-processor-{self.environment_suffix}"
```

## 11. Stack Outputs

**Issue:** MODEL_RESPONSE missing some required outputs.

**Fix:** Add all required outputs including bucket names and function name:

```python
CfnOutput(self, "RawDataBucketName", value=self.raw_data_bucket.bucket_name)
CfnOutput(self, "ProcessedDataBucketName", value=self.processed_data_bucket.bucket_name)
CfnOutput(self, "DynamoDBTableName", value=self.dynamodb_table.table_name)
CfnOutput(self, "LambdaFunctionName", value=self.lambda_function.function_name)
```

## 12. KMS Key Alias Format

**Issue:** MODEL_RESPONSE uses static alias without environment suffix.

**Fix:** Include environment suffix in KMS key alias:

```python
alias=f"alias/data-pipeline-key-{self.environment_suffix}"
```

## 13. CDK Synthesizer for CI/CD Deployment

**Issue:** MODEL_RESPONSE uses default synthesizer which attempts to assume CDK bootstrap roles that may not be accessible in all CI/CD environments.

**Fix:** Use CliCredentialsStackSynthesizer in tap.py to use CLI credentials directly:

```python
from aws_cdk import CliCredentialsStackSynthesizer

TapStack(
    app,
    stack_name,
    props=TapStackProps(environment_suffix=environment_suffix),
    stack_name=stack_name,
    synthesizer=CliCredentialsStackSynthesizer(),
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)
```

## Summary

The primary changes transform the MODEL_RESPONSE from a production-focused implementation with retained resources to a test-environment-focused implementation with:
- All resources using DESTROY removal policy
- Environment suffix in all resource names
- Simplified API Gateway without mutual TLS
- Updated DynamoDB PITR configuration
- Fixed Lambda role managed policy assignment
- Corrected resource creation order
- CliCredentialsStackSynthesizer for CI/CD compatibility
