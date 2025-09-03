*** Flaw 1 ***

No CICD pipeline included for the provisioning the resources on AWS

*** Flaw 2 ***
No proper provider script created
terraform {
  required_version = ">= 1.3.0"
}

*** Flaw 3 ***
Terraform expect state locking using dynamodb, however the latest version of terraform now use s3 state locking to stale the state of resource to validate desire and actual state

*** Flaw 4 ***
No mention of how to validate CIDR overlap or manage address space allocation, which is critical in multi-region networking.

*** Flaw 5 ***
There's no mention of how environment variables, secrets, and DB passwords should be managed.

*** Flaw 6 ***
It’s not clear how centralization is achieved, cross-region log aggregation in CloudWatch is not automatic.

*** Flaw 7 ***
No mention who to approve production deployment

** Flaw 8 ***
Read replica for production not completed

# Read Replica (Production only)
resource "aws_db_instance" "replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "${var.name_prefix}-db-