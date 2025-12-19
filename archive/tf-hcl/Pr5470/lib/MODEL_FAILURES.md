1. Critical Error - the Terraform resource "aws_lambda_function" does not have an attribute called inline_code.

Terraform's AWS provider does support creating Lambda functions with inline code, but the correct attribute to use is filename with the special source_code_hash or alternatively the source_code or zip_file attributes depending on the Terraform AWS provider version.

However, for inline Lambda function code written directly in the Terraform file (without a ZIP file), the correct attribute name is filename pointing to a local file, or the source_code for inline code is not always supported directly by a heredoc string in older versions.

But nowadays, the supported way of using inline source code (the Lambda code in Terraform file itself without a zip archive) is using the filename with a local file or using the s3_bucket and s3_key.

Given your requirement:

Use inline Lambda code in the tap_stack.tf file itself,

Without using a zip file,

And Terraform AWS provider rejects inline_code as unsupported.

The current best approach is:

Use the filename attribute with a local file path if possible (but this is a zip file, so you do not want that).

Use the source_code_hash along with a packed zip file (you want to avoid).

Or, for small functions, use the filename attribute for a file that contains the code.

Alternative: Use the aws_lambda_function resource with runtime, handler, and provide the inline code using the attribute code.

Note: The correct attribute for inline code in the aws_lambda_function resource is code.

```
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 1481, in resource "aws_lambda_function" "failover_orchestrator":
│ 1481:   inline_code = <<EOF
│ 
│ An argument named "inline_code" is not expected here.
╵
Error: Terraform exited with code 1.
Plan creation failed, attempting direct apply...
╷
│ Error: Failed to load "tfplan" as a plan file
│ 

│ Error: stat tfplan: no such file or directory
╵
Error: Terraform exited with code 1.
⚠️Direct apply with plan failed, trying without plan...
╷
│ Warning: Argument is deprecated
│ 
│   with aws_cloudwatch_event_rule.failover_test,
│   on tap_stack.tf line 1724, in resource "aws_cloudwatch_event_rule" "failover_test":
│ 1724:   is_enabled          = false  # Disabled by default, enable for testing
│ 
│ is_enabled is deprecated. Use state instead.
╵
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 1481, in resource "aws_lambda_function" "failover_orchestrator":
│ 1481:   inline_code = 
│ 
│ An argument named "inline_code" is not expected here.
╵
Error: Terraform exited with code 1.
All deployment attempts failed. Check for state lock issues.

```

2. Medium Failures: Aurora global postgres SQL version.

This means that the Aurora PostgreSQL engine version specified in your aws_rds_global_cluster resource does not support the global database feature or is incorrect. Global databases require specific supported engine versions in AWS Aurora.

Fix -  Used the version 17.4 which is latest.
```
│ Error: creating RDS Global Cluster (prod-aurora-global-slmr): operation error RDS: CreateGlobalCluster, https response error StatusCode: 400, RequestID: c64fb94a-5078-4d3d-a997-f576e6389ab8, api error InvalidParameterValue: The requested engine version was not found or does not support global functionality
│ 
│   with aws_rds_global_cluster.aurora_global,
│   on tap_stack.tf line 636, in resource "aws_rds_global_cluster" "aurora_global":
│  636: resource "aws_rds_global_cluster" "aurora_global" {
│ 
╵
```

3. Critical Failures -  have versioning enabled on both the primary and secondary buckets, your replication configuration does not depend on the versioning resource of the secondary bucket (backup_secondary).

AWS requires versioning enabled on both source and destination buckets for replication to succeed. If the secondary bucket's versioning isn't applied before replication configuration, the replication fails.

fix - Your main fix is adding dependency on the secondary bucket versioning in your replication configuration, ensuring that both source and destination buckets have versioning enabled before replication is set.

```
╷
│ Error: creating S3 Bucket (prod-rds-backup-primary-slmr) Replication Configuration: operation error S3: PutBucketReplication, https response error StatusCode: 400, RequestID: GKBZ1DBPX92VM6YB, HostID: Ovtk0gn727lYgDmLFubgZRmZOY2fK11MDu55mV15QiTP01slidb+KUU/s04JSj3G13zbeRXCLMQ=, api error InvalidRequest: Destination bucket must have versioning enabled.
│ 
│   with aws_s3_bucket_replication_configuration.backup_replication,
│   on tap_stack.tf line 1090, in resource "aws_s3_bucket_replication_configuration" "backup_replication":
│ 1090: resource "aws_s3_bucket_replication_configuration" "backup_replication" {
│ 
╵
Error: Terraform exited with code 1.
```

4. Medium Failures - the backtrack feature cannot be enabled on an Aurora cluster which is part of a global database.

fix - Since backtrack is not supported on clusters that belong to global clusters, you should disable backtrack for those clusters.


```
╷
│ Error: creating RDS Cluster (prod-aurora-cluster-slmr-primary): operation error RDS: CreateDBCluster, https response error StatusCode: 400, RequestID: 215a2f4e-2cc8-4070-bbbf-a308155348c6, api error InvalidParameterCombination: Backtrack is not supported for global databases.
│ 
│   with aws_rds_cluster.primary,
│   on tap_stack.tf line 646, in resource "aws_rds_cluster" "primary":
│  646: resource "aws_rds_cluster" "primary" {
│ 
╵
Error: Terraform exited with code 1.
```

5. Medium Failures - Model wornlgy used resource path for route 53 check

Fix:
Remove resource_path property or parameter from aws_route53_health_check if type = "TCP".

For TCP health checks, AWS expects no resource path because TCP checks operate solely on port connectivity.

If you need to perform HTTP or HTTPS checks, then you can specify resource_path, but not for TCP.


```
╷
│ Error: creating Route53 Health Check: operation error Route 53: CreateHealthCheck, https response error StatusCode: 400, RequestID: 268e91c1-2f77-406b-8d68-689b28ee5be9, InvalidInput: TCP health checks must not have a resource path specified.
│ 
│   with aws_route53_health_check.primary,
│   on tap_stack.tf line 1124, in resource "aws_route53_health_check" "primary":
│ 1124: resource "aws_route53_health_check" "primary" {
│ 
╵
╷
│ Error: creating Route53 Health Check: operation error Route 53: CreateHealthCheck, https response error StatusCode: 400, RequestID: ed5f9d5f-5de5-4723-80b4-f58b301cd5c9, InvalidInput: TCP health checks must not have a resource path specified.
│ 
│   with aws_route53_health_check.secondary,
│   on tap_stack.tf line 1139, in resource "aws_route53_health_check" "secondary":
│ 1139: resource "aws_route53_health_check" "secondary" {
│ 
╵
Error: Terraform exited with code 1.

```
