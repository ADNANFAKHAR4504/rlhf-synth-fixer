Below are the few model failures which I got -

Region-Related Errors
Provider Region Mismatch or Misconfiguration:
Resources specifically tied to aws.us_east_2 (primary) and aws.us_west_1 (secondary) must use providers with correct regions. Errors occur if:

Providers are incorrectly referenced or not configured.

Resources use incorrect provider aliases, causing mismatch in region resources.

Cross-Region Resource Referencing:
Some resources depend on others across regions, such as the RDS read replica in the secondary region referring to the primary RDS ARN. Any DNS resolution, network, or IAM permission issues can cause failures.

Availability Zones:
Availability zones for the primary and secondary regions are fetched via data sources. Errors could arise if an AZ is unavailable or mismatched in references.

RDS-Related Errors
Cross-Region RDS Read Replica Setup:
The secondary RDS instance is configured as a read replica (replicate_source_db = aws_db_instance.primary.arn).
Possible problems include:

Network connectivity or VPC peering issues between regions preventing replication.

Insufficient permission or misconfigured IAM policies for replication.

Version or engine incompatibility between primary and replica instances.

Partial resource definitions or truncations like auto_minor_version_upgrade = false... can cause Terraform parsing errors.

Credentials and Secrets Handling:
RDS master username and password are generated randomly (random_string.db_username, random_password.db_password). Errors arise if these are not properly referenced or inconsistent.

Backup and Maintenance Windows:
Misconfigured backup retention or maintenance windows could cause deployment warnings or failures depending on AWS constraints.

Security Group Ingress from EC2:
The RDS security group allows ingress on port 3306 from EC2 security groups. Errors if this security group relationship is incorrect.

Final Snapshot Settings:
skip_final_snapshot = true disables snapshot before deletion. For production, this may be dangerous; misconfiguration might cause warnings or accidental data loss.
