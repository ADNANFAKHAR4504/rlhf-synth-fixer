## **Issue 1 — Duplicate Variable Declaration**

**Error:**
```
Error: Duplicate variable declaration

  on variables.tf line 3:
   3: variable "aws_region" {

A variable named "aws_region" was already declared at tapstack.tf:37,1-22. 
Variable names must be unique within a module.
```

**Root Cause:** The `aws_region` variable was declared in both `tapstack.tf` and `variables.tf`, causing a conflict during Terraform initialization.

**Fix:** Removed the duplicate `aws_region` variable declaration from `variables.tf` since it was already properly defined in `tapstack.tf` with appropriate defaults and description.


## **Issue 2 — Invalid SageMaker Data Source**

**Error:**
```
Error: Invalid data source

  on tapstack.tf line 362, in data "aws_sagemaker_endpoint" "fraud_model":
  362: data "aws_sagemaker_endpoint" "fraud_model" {

The provider hashicorp/aws does not support data source "aws_sagemaker_endpoint".
```

**Root Cause:** The AWS provider does not have a `aws_sagemaker_endpoint` data source. SageMaker endpoints cannot be queried as data sources in the current AWS provider version.

**Fix:** 
1. Removed the invalid data source declaration
2. Updated the IAM policy to construct the SageMaker endpoint ARN directly using the variable:
   ```hcl
   Resource = "arn:aws:sagemaker:${var.aws_region}:${data.aws_caller_identity.current.account_id}:endpoint/${var.fraud_model_endpoint_name}"
   ```
3. Added a comment noting that the SageMaker endpoint should be created separately and its name passed via the `fraud_model_endpoint_name` variable


## **Issue 3 — Missing S3 Lifecycle Filter**

**Error:**
```
Warning: Invalid Attribute Combination

  with aws_s3_bucket_lifecycle_configuration.evidence,
  on tapstack.tf line 703, in resource "aws_s3_bucket_lifecycle_configuration" "evidence":
 703: resource "aws_s3_bucket_lifecycle_configuration" "evidence" {

No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required

This will be an error in a future version of the provider
```

**Root Cause:** AWS provider version 5.x requires S3 lifecycle configuration rules to have either a `filter` block or a `prefix` attribute. The lifecycle rules were missing this required attribute.

**Fix:** Added empty `filter` blocks to both S3 lifecycle configurations:
- `aws_s3_bucket_lifecycle_configuration.evidence`
- `aws_s3_bucket_lifecycle_configuration.athena_results`

```hcl
filter {
  prefix = ""
}
```

This applies the lifecycle rule to all objects in the bucket (empty prefix matches everything).


## **Issue 4 — Redis Automatic Failover Configuration**

**Error:**
```
Error: "num_cache_clusters": must be at least 2 if automatic_failover_enabled is true

  with aws_elasticache_replication_group.redis,
  on tapstack.tf line 793, in resource "aws_elasticache_replication_group" "redis":
 793: resource "aws_elasticache_replication_group" "redis" {
```

**Root Cause:** ElastiCache Redis automatic failover requires at least 2 cache clusters for high availability. The dev environment was configured with only 1 node but had `automatic_failover_enabled = true`.

**Fix:** Added conditional logic to automatically disable failover when there's only 1 node:
```hcl
# Automatic failover requires at least 2 nodes
automatic_failover_enabled = var.redis_num_cache_clusters >= 2 ? var.redis_automatic_failover_enabled : false
multi_az_enabled           = var.redis_num_cache_clusters >= 2 ? var.redis_automatic_failover_enabled : false
```

This allows dev environments to run with a single node while staging/prod can use multi-AZ failover.


## **Issue 5 — Missing KMS Key Policy**

**Error:** While not causing an immediate Terraform error, the Aurora KMS key lacked a proper key policy, which would cause runtime errors when RDS tries to use the key for encryption operations.

**Root Cause:** Custom KMS keys require explicit policies to grant permissions to AWS services (like RDS) and the account root user. Without these policies, services cannot use the key even if they have IAM permissions.

**Fix:** Added comprehensive KMS key policy for the Aurora encryption key with three key statements:

1. **Enable IAM User Permissions** - Grants root account full access to manage the key
2. **Allow RDS to use the key** - Grants RDS service permissions for encryption operations:
   - `kms:Decrypt`
   - `kms:DescribeKey`
   - `kms:CreateGrant`
   - `kms:GenerateDataKey`
   - `kms:GenerateDataKeyWithoutPlaintext`
   - `kms:ReEncrypt*`
3. **Allow CloudWatch Logs** - Grants CloudWatch Logs permissions to encrypt log data

Also enabled automatic key rotation for security best practices:
```hcl
enable_key_rotation = true
```

**Note:** Kinesis and SNS use AWS-managed keys (`alias/aws/kinesis` and `alias/aws/sns`) which don't require custom policies.


## **Issue 6 — Invalid Aurora PostgreSQL Version**

**Error:**
```
Error: creating RDS Cluster (fraud-detection-dev-aurora): operation error RDS: CreateDBCluster, https response error StatusCode: 400, RequestID: bd97ce2b-8f25-4c59-b3b8-5fe4301d5afb, api error InvalidParameterCombination: Cannot find version 15.3 for aurora-postgresql
```

**Root Cause:** PostgreSQL version 15.3 is not available in the us-east-1 region. AWS periodically deprecates older minor versions and only maintains recent versions.

**Fix:** Updated `aurora_engine_version` from `15.3` to `15.14`, which is the latest available version in us-east-1:
```hcl
variable "aurora_engine_version" {
  description = "Aurora engine version"
  type        = string
  default     = "15.14"
}
```

Available versions were verified using:
```bash
aws rds describe-db-engine-versions --engine aurora-postgresql --query "DBEngineVersions[?contains(EngineVersion, '15.')].EngineVersion"
```


## **Issue 7 — Missing Secrets Manager Lambda Permission**

**Error:**
```
Error: creating Secrets Manager Secret Rotation (arn:aws:secretsmanager:us-east-1:679047180946:secret:fraud-detection-dev-aurora-credentials-aALkBc): operation error Secrets Manager: RotateSecret, https response error StatusCode: 400, RequestID: 765498c9-4f07-4d3f-8859-1843bb251b88, api error AccessDeniedException: Secrets Manager cannot invoke the specified Lambda function. Ensure that the function policy grants access to the principal secretsmanager.amazonaws.com.
```

**Root Cause:** The Lambda function for secret rotation didn't have a resource-based policy allowing Secrets Manager service to invoke it. Even though the Lambda has an execution role, Secrets Manager needs explicit permission to invoke the function.

**Fix:** Added `aws_lambda_permission` resource to grant Secrets Manager invoke access:
```hcl
resource "aws_lambda_permission" "secrets_manager_invoke" {
  statement_id  = "AllowSecretsManagerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secret_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}
```


## **Issue 8 — Missing Redis AUTH Token**

**Error:**
```
Error: modifying ElastiCache Replication Group (fraud-detection-dev-redis): operation error ElastiCache: ModifyReplicationGroup, https response error StatusCode: 400, RequestID: 103b8e7d-b4c6-4ee5-831d-f0c3b193d7c3, InvalidParameterValue: Invalid AUTH token provided. Please check valid AUTH token format.
```

**Root Cause:** When `transit_encryption_enabled = true` is set for Redis, an AUTH token is required. The configuration had transit encryption enabled but no auth_token was provided.

**Fix:** Added a random password resource for the Redis AUTH token:
```hcl
resource "random_password" "redis_auth_token" {
  length  = 32
  special = true
  # Redis AUTH token requirements: 16-128 printable characters
  override_special = "!&#$^<>-"
}

resource "aws_elasticache_replication_group" "redis" {
  # ... other configuration ...
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result
}
```


## **Issue 9 — Missing SQS Queue Policy**

**Error:**
High severity issue where SNS topic `compliance_alerts` cannot deliver messages to SQS queue `compliance_notifications` due to missing permissions.

**Root Cause:** SQS queues are private by default. Even if an SNS subscription is created, the SQS queue itself must
have an access policy that explicitly allows the SNS topic to send messages (`sqs:SendMessage`).

**Fix:** Added `aws_sqs_queue_policy` resource to grant the necessary permissions:

```hcl
resource "aws_sqs_queue_policy" "compliance_notifications" {
  queue_url = aws_sqs_queue.compliance_notifications.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.compliance_notifications.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.compliance_alerts.arn
        }
      }
    }]
  })
}
```

## **Issue 10 — Unused Availability Zones Variable**

**Error:**
The `availability_zones` variable was declared but never used, creating confusion as the code uses
`data.aws_availability_zones` dynamically.

**Fix:** Removed the unused variable declaration to clean up the code and avoid ambiguity.

## **Issue 11 — Unused Capacity Map Local**

**Error:**
A `capacity_map` local was defined with environment-specific values but never referenced, as individual variables were
used instead.

**Fix:** Removed the unused `capacity_map` local to eliminate dead code.

## **Issue 12 — Missing Network ACLs**

**Error:**
The VPC configuration lacked Network ACLs, which are recommended for defense in depth, especially for financial systems.

**Fix:** Added `aws_network_acl` resources for both public and private subnets:

- **Public NACL:** Allows all traffic (standard for public subnets)
- **Private NACL:** Allows inbound from VPC CIDR and all outbound (via NAT)

## **Issue 13 — Missing Lambda Layer for Dependencies**

**Error:**
Lambda functions import external libraries (`psycopg2`, `redis`) that are not part of the standard Python runtime,
causing runtime failures.

**Fix:**

1. Created a `aws_lambda_layer_version` resource to manage dependencies.
2. Updated relevant Lambda functions (`fraud_scorer`, `analyzer`, `aurora_updater`, `query_history`, `reconciliation`)
   to include the layer.
3. Created a placeholder `layer.zip` (users should replace this with a properly built layer containing `psycopg2-binary`
   and `redis`).

## **Issue 14 — Invalid Aurora Password Characters**

**Error:**

```text
Error: creating RDS Cluster ... api error InvalidParameterValue: The parameter MasterUserPassword is not a valid password. Only printable ASCII characters besides '/', '@', '"', ' ' may be used.
```

**Root Cause:** The `random_password` resource was generating passwords containing characters that are not allowed by
RDS (specifically `/`, `@`, `"`, or space) because `override_special` was not defined.

**Fix:** Updated `random_password.aurora_password` to explicitly define allowed special characters using `override_special`:

```hcl
resource "random_password" "aurora_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}
```