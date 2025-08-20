Initial Model Faiures -
Input Variable Declarations Missing or Incorrect
Tests failed because expected input variables were not fully declared in the Terraform file or regex didn't match those variables.

Missing Locals Definitions
Locals such as primary_azs, secondary_azs, primary_tags, and secondary_tags were expected but not found in the Terraform file.

NAT Gateways and Elastic IPs Missing in Secondary Region
The tests expected NAT Gateway and Elastic IP resources for the secondary region, but these were removed or not present.

Route Tables and Associations Missing or Incomplete
Tests expected route tables and route table associations (especially for secondary private subnets) which were not defined in your updated configuration.

RDS Security Groups and Instances Missing in Secondary Region
Tests failed because security groups for RDS and RDS instances for the secondary region were expected but removed.

KMS Keys and Aliases Missing in Secondary Region
KMS key and alias resource expectations for the secondary region were not met due to their removal.

Secrets Manager Resources Missing for RDS Passwords (both regions)
Tests expected aws_secretsmanager_secret resources that were no longer in the configuration.

IAM Roles, Policies, and Groups Missing or Incomplete
Some IAM-related resources were expected but not present, causing failures.

CloudWatch Log Groups Missing for RDS and Security
Expected CloudWatch log groups specifically tied to RDS and security events were missing.

Output Declarations Missing or Incomplete
Tests expected outputs for VPCs, subnets, RDS endpoints, IAM groups, KMS keys, CloudTrail, and others that were missing or incomplete.
