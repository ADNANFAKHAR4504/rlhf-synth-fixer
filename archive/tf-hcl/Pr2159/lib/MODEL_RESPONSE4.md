The error occurs because the primary RDS instance is encrypted, but the read replica doesn't have encryption explicitly configured for cross-region replication. Here's the fixed code snippet:

## Fixed RDS Read Replica Configuration:

```hcl
# RDS read replica in secondary region (UPDATED)
resource "aws_db_instance" "secondary" {
  provider = aws.us_west_2
  
  identifier                = "${var.project_name}-postgres-replica"
  replicate_source_db       = aws_db_instance.primary.arn
  instance_class            = "db.t3.micro"
  
  # Explicitly enable encryption for cross-region read replica
  storage_encrypted = true
  
  vpc_security_group_ids = [aws_security_group.rds_secondary.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-postgres-replica"
  })
}
```

## Alternative Solution with KMS Key for Cross-Region:

If you want more control over encryption, you can also create a KMS key in the secondary region and use it:

```hcl
# KMS Key for RDS encryption in secondary region (Add this with other KMS keys)
resource "aws_kms_key" "rds_secondary" {
  provider                = aws.us_west_2
  description             = "KMS key for RDS encryption in secondary region"
  deletion_window_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-kms-secondary"
  })
}

resource "aws_kms_alias" "rds_secondary" {
  provider      = aws.us_west_2
  name          = "alias/${var.project_name}-rds-secondary"
  target_key_id = aws_kms_key.rds_secondary.key_id
}

# RDS read replica in secondary region with specific KMS key
resource "aws_db_instance" "secondary" {
  provider = aws.us_west_2
  
  identifier                = "${var.project_name}-postgres-replica"
  replicate_source_db       = aws_db_instance.primary.arn
  instance_class            = "db.t3.micro"
  
  # Explicitly enable encryption with KMS key for cross-region read replica
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds_secondary.arn
  
  vpc_security_group_ids = [aws_security_group.rds_secondary.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-postgres-replica"
  })
}
```

## Recommended Simple Fix:

Use the first solution (just adding `storage_encrypted = true`) as it's simpler and AWS will handle the encryption automatically:

```hcl
# RDS read replica in secondary region
resource "aws_db_instance" "secondary" {
  provider = aws.us_west_2
  
  identifier                = "${var.project_name}-postgres-replica"
  replicate_source_db       = aws_db_instance.primary.arn
  instance_class            = "db.t3.micro"
  
  # Fix: Explicitly enable encryption for cross-region read replica
  storage_encrypted = true
  
  vpc_security_group_ids = [aws_security_group.rds_secondary.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-postgres-replica"
  })
}
```

The key change is adding `storage_encrypted = true` to the read replica configuration. This tells AWS to create an encrypted read replica from the encrypted source database, which is required for cross-region read replicas when the source is encrypted.
