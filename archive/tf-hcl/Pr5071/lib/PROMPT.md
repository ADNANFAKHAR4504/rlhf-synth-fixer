hey i need help with a terraform setup for our fintech test environment

so basically we're trying to replicate our prod setup for testing but with data masking. we have like 234 microservices in prod and need ~95% parity in test. the whole thing needs to fit in a SINGLE terraform file (tap_stack.tf) because of some constraints on our side.

i already got a provider.tf that sets up AWS provider with an aws_region variable, so don't redefine the provider - just declare the variable in tap_stack.tf with a default.

here's what we need:

NETWORKING:

- VPC setup similar to prod - 2-3 public subnets, 2-3 private subnets across at least 2 AZs
- NAT gateways, route tables, security groups (least privilege)
- VPC endpoints for S3, DynamoDB, SSM, CloudWatch Logs
- make the CIDRs configurable via variables

DATA LAYER:

- Aurora cluster (postgres or mysql, your choice) with proper subnet groups and parameter groups. test instance size should be variable
- DynamoDB tables - use for_each to create them from a var.ddb_tables map. need to handle both with and without range keys
- seed some basic test data in the dynamo tables
- 3 S3 buckets: one for artifacts (lambda zips), one for app data, one for staging masked data. all need versioning, lifecycle policies, KMS encryption

AUTOMATION STUFF (this is the important part):
need Lambda functions for:

- masking_handler - masks PII data based on rules
- dynamodb_refresh_handler - exports from prod dynamo, masks it, imports to test
- aurora_refresh_handler - copies prod snapshots, restores them, applies masking
- s3_sync_handler - syncs S3 data from prod
- integration_tests_handler - runs tests after refresh

use archive_file data source with inline python code (heredoc) to keep everything in one file.

then wire it all together with:

- Step Functions state machine that orchestrates: S3 sync -> DynamoDB refresh -> Aurora refresh -> run integration tests
- EventBridge rule to trigger the state machine daily (like 2am or something)
- another EventBridge rule weekly for parity validation
- SSM Automation Document for the Aurora snapshot restore and masking

OBSERVABILITY:

- CloudWatch dashboards - one main overview dashboard plus one per service
- log groups for all the lambdas (with retention)
- alarms for step function failures, lambda errors, etc
- the dashboards should show refresh success rates, test results, masked record counts

PARITY VALIDATION:
weekly job that compares what resources SHOULD exist vs what actually exists, writes a drift report to S3, emits cloudwatch metrics. if drift is small maybe try to auto-remediate.

SECURITY/ENCRYPTION:

- separate KMS keys for data, logs, SSM params, and S3
- aliases should match prod naming like alias/app-data-test
- one KMS key per service too (use for_each over service_names)

CROSS-ACCOUNT ACCESS:
some lambdas need to read from prod account to copy data. set up IAM roles with sts:AssumeRole for cross-account access. use prod_account_id as a variable.

DATA MASKING:

- for Aurora: SSM automation runs SQL to replace PII columns based on masking rules
- for DynamoDB: export to S3, mask with lambda, re-import
- for S3: copy objects and mask payloads as needed
- masking rules should be in an SSM parameter, format like {"email": "test+{{hash}}@example.com", "ssn": "XXX-XX-{{last:4}}"} etc

VARIABLES to expose:

- aws_region (default us-west-2)
- vpc_cidr, public_subnet_cidrs, private_subnet_cidrs, enable_nat
- service_names list - default to ["billing", "ledger", "auth"]
- ddb_tables map with name/hash_key/range_key/billing_mode
- aurora config: engine, instance_class, username, password (mark sensitive), db_name
- bucket names: artifact_bucket_name, data_bucket_name, staging_bucket_name
- masking_rules map
- prod_account_id, prod_data_bucket, prod_cluster_identifier
- tags map

we'll use dev.tfvars and prod.tfvars to set different values per environment.

OUTPUTS needed:

- vpc id, subnet ids, security group ids
- s3 bucket names/arns
- dynamodb table names
- aurora endpoint
- kms key arns
- step functions arn
- eventbridge rule names
- ssm document name
- cloudwatch dashboard names
- drift report S3 location

oh and for scaling - add autoscaling targets and policies for the tables/services where it makes sense. use for_each so it's easy to scale.

one more thing - this needs to work in a clean AWS account (after we set passwords/secrets). target is under 30 min to provision everything.

can you write the complete tap_stack.tf file? just give me the HCL code in one code block, no explanations outside of it.
