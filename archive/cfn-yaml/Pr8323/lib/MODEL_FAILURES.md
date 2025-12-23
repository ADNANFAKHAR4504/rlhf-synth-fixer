# model_failure

## Summary

This document enumerates common failure modes for this stack and prescribes corrective actions. It focuses on encryption and control-plane integration points that typically cause create-time errors in CloudTrail, KMS, API Gateway logging, S3 notifications, and tag schemas.

## CloudTrail “insufficient permissions to access S3 bucket or KMS key”

Symptoms:

* Trail create fails with an error referencing the trail’s S3 bucket or the KMS key.

Root causes:

* Bucket policy does not pin `aws:SourceArn` to the exact trail ARN.
* KMS key policy does not allow CloudTrail with the encryption context that includes the trail ARN, or lacks `kms:CreateGrant` with `kms:GrantIsForAWSResource`.

Fix:

* Ensure the bucket policy write statement includes both `aws:SourceAccount` and the exact `aws:SourceArn` for the trail.
* Ensure the CMK policy includes a CloudTrail statement that:

  * Grants Encrypt/Decrypt/ReEncrypt/GenerateDataKey/DescribeKey/CreateGrant.
  * Uses `kms:GrantIsForAWSResource: 'true'` and `kms:ViaService` for CloudTrail.
  * Uses an `ArnEquals` condition on `kms:EncryptionContext:aws:cloudtrail:arn` matching the trail ARN.

## CloudWatch Logs KMS key usage

Symptoms:

* Log group creation or Lambda logging fails with a KMS error.

Root causes:

* CMK is missing permission for the regional CloudWatch Logs service principal.
* Wrong region string in the service principal pattern.

Fix:

* Include a key policy statement for `logs.${AWS::Region}.amazonaws.com` permitting Encrypt/Decrypt/ReEncrypt/GenerateDataKey/DescribeKey with the logs encryption context pattern.

## API Gateway account role errors

Symptoms:

* API Gateway account resource fails, reporting trust or policy issues.

Root causes:

* Missing trust for `apigateway.amazonaws.com`.
* Absent managed policy to push logs to CloudWatch.

Fix:

* Create an IAM role trusted by `apigateway.amazonaws.com` and attach `AmazonAPIGatewayPushToCloudWatchLogs`. Reference its ARN in the `AWS::ApiGateway::Account`.

## S3 event notifications creation order

Symptoms:

* S3 bucket notification to Lambda fails or deploys nondeterministically.

Root causes:

* Lambda permission not created before bucket notification attaches.

Fix:

* Add an explicit dependency from the bucket to the Lambda permission, or set `DependsOn` appropriately so the permission exists when S3 configures notifications.

## Duplicate template sections

Symptoms:

* Linter errors such as duplicate `Conditions`, duplicate `Outputs`, or repeated mappings.

Root causes:

* Fragment merges introduced multiple section blocks.

Fix:

* Keep a single `Conditions` and a single `Outputs` section; fold all entries into them and remove duplicates.

## Tag schema type errors

Symptoms:

* Linter errors like “is not of type string” for tags.

Root causes:

* Using `TagKey`/`TagValue` fields where `Key`/`Value` are required, or vice-versa.

Fix:

* For most resources, tags are an array of objects with `Key` and `Value` fields. Use the correct schema per resource type.

## KMS and S3 public access

Symptoms:

* Bucket or object encryption behavior inconsistent; public ACLs or policies rejected.

Root causes:

* Missing public access block configuration.
* TLS enforcement policy omitted.

Fix:

* Enable all four public access block flags and a deny-on-non-TLS policy on the data bucket. Ensure default SSE-KMS is configured with the CMK.

## RDS bootstrap failures

Symptoms:

* DB instance create fails due to credential or network issues.

Root causes:

* Secrets Manager reference not resolving or wrong key names.
* RDS security group not reachable from the application security group.
* Wrong engine version when switching from the default engine.

Fix:

* Use Secrets Manager dynamic references with `username` and `password` keys.
* Keep RDS in private subnets and allow ingress only from the application security group.
* Parameterize engine version and guard with a condition.

## DynamoDB autoscaling not attaching

Symptoms:

* ScalableTarget fails to create; scaling policy remains inactive.

Root causes:

* ScalableTarget `ResourceId` not matching the table name.
* IAM role for Application Auto Scaling missing required permissions.

Fix:

* Use `table/${TableName}` as the `ResourceId` and grant describe/update and CloudWatch alarm permissions to the scaling role.

## Ordering and implicit dependencies

Symptoms:

* Intermittent create-time race conditions.

Root causes:

* Missing `DependsOn` where the service API requires pre-existing permissions or roles.

Fix:

* Ensure `DependsOn` from the S3 bucket to `LambdaPermissionForS3`.
* Ensure CloudTrail depends on the bucket policy.
* Ensure API deployment depends on methods and integrations.

## Region and naming constraints

Symptoms:

* Stack deploys in an unintended region or resource names collide.

Root causes:

* No region informational check; environment naming too permissive.

Fix:

* Keep an informational condition asserting `us-east-1`.
* Validate `EnvironmentSuffix` with a safe regex and include it in all resource names.
