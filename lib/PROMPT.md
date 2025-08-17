You are a Senior Cloud Engineer specializing in multi-region AWS architectures. Your task is to create a complete Terraform configuration (HCL) for a multi-region infrastructure migration. All resource definitions must be consolidated into a single file, tap_stack.tf, supported by a separate provider configuration.

Task:

Create the HCL code for the following two files. The configuration must provision a mirrored, highly available, and secure infrastructure across two AWS regions: us-east-1 (primary) and eu-west-1 (secondary).

File 1: provider.tf
This file must define the AWS provider for both regions using aliases.

Primary Provider: Define the default aws provider for the us-east-1 region.

Secondary Provider: Define an aliased aws provider for the eu-west-1 region (e.g., alias = "eu_west_1").

File 2: tap_stack.tf
This single file must contain all variables, resources, and outputs. You must use the provider alias (e.g., provider = aws.eu_west_1) for every resource that needs to be created in the secondary region.

Variables
Define variables for ec2_instance_type and ec2_key_pair_name to ensure consistency.

Networking Resources
VPCs: An aws_vpc in us-east-1 and another aws_vpc in eu-west-1.

VPC Peering: A single aws_vpc_peering_connection resource to link the two VPCs. Remember to configure accepter and requester regions.

Routes: The necessary aws_route resources in each VPC's route table to enable traffic over the peering connection.

Data Tier Resources
S3 Buckets: An aws_s3_bucket in each region. The primary bucket must have a replication_configuration block to replicate objects to the secondary bucket.

DynamoDB Global Table: A single aws_dynamodb_global_table resource with replica blocks for both us-east-1 and eu-west-1. Also include aws_appautoscaling_target and aws_appautoscaling_policy for read/write capacity.

RDS Instances: An aws_db_instance in each region. Both instances must be Multi-AZ deployments (multi_az = true).

Compute Resources
EC2 Instances: An aws_instance in each region. Use a data source (aws_ami) to find the latest Amazon Linux 2 AMI for each respective region. The instance type and key pair must be set by the variables.

Security & Compliance Resources
KMS Keys: An aws_kms_key in us-east-1 and another in eu-west-1.

Encryption Mandate: Ensure all services (S3, DynamoDB, RDS, EC2 EBS volumes) are configured to use the KMS key from their respective region for encryption at rest.

IAM Role: A single, global aws_iam_role with an attached aws_iam_policy granting least-privilege permissions.

CloudTrail: An aws_cloudtrail in each region.

Central Logging: A single aws_s3_bucket (created in us-east-1) to receive logs from both CloudTrail instances. Attach an aws_s3_bucket_lifecycle_configuration to this bucket to manage log retention.

Outputs
Export critical information for both regions, such as the RDS instance endpoints and S3 bucket names.