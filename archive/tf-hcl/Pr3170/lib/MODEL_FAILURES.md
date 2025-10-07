# Model Failures

## RDS Subnet Group Multi-AZ Requirement Issue

**Problem**: RDS deployment failed because the DB subnet group didn't meet the minimum Availability Zone coverage requirement.

**Error**: 
```
Error: creating RDS DB Subnet Group (production-db-subnet-group): operation error RDS: CreateDBSubnetGroup, https response error StatusCode: 400, RequestID: 67056f8f-57aa-4c43-994c-52872ad8967e, DBSubnetGroupDoesNotCoverEnoughAZs: The DB subnet group doesn't meet Availability Zone (AZ) coverage requirement. Current AZ coverage: us-east-1b. Add subnets to cover at least 2 AZs.
```

**Root Cause**: RDS requires subnets in at least 2 different availability zones, but the original configuration only had one private subnet.

**Fix**: Added a second private subnet in a different AZ and updated the DB subnet group:

**Changes Made**:
1. **Added second private subnet variable** in `variables.tf`:
   ```hcl
   variable "private_subnet_2_cidr" {
     description = "CIDR block for second private subnet"
     type        = string
     default     = "10.0.3.0/24"
   }
   ```

2. **Created second private subnet** in `networking.tf`:
   ```hcl
   resource "aws_subnet" "private_2" {
     vpc_id            = aws_vpc.main.id
     cidr_block        = var.private_subnet_2_cidr
     availability_zone = data.aws_availability_zones.available.names[2]
     # ... tags
   }
   ```

3. **Updated DB subnet group** in `database.tf`:
   ```hcl
   resource "aws_db_subnet_group" "main" {
     name       = "${var.environment}-db-subnet-group"
     subnet_ids = [aws_subnet.private.id, aws_subnet.private_2.id]
     # ... tags
   }
   ```

4. **Added output for second private subnet** in `outputs.tf`:
   ```hcl
   output "private_subnet_2_id" {
     value       = aws_subnet.private_2.id
     description = "ID of the second private subnet"
   }
   ```

**Lesson Learned**: RDS requires multi-AZ subnet coverage for high availability. Always ensure DB subnet groups span at least 2 availability zones.

## RDS Password Character Restriction Issue

**Problem**: RDS deployment failed due to invalid characters in the randomly generated master password.

**Error**: 
```
Error: creating RDS DB Instance (production-database): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: 17182a38-2dfd-4c64-b823-5be31881412c, api error InvalidParameterValue: The parameter MasterUserPassword is not a valid password. Only printable ASCII characters besides '/', '@', '"', ' ' may be used.
```

**Root Cause**: The `random_password` resource was generating passwords with special characters that are not allowed by RDS, including `/`, `@`, `"`, and spaces.

**Fix**: Updated the `random_password` resource in `database.tf` to explicitly override special characters:

**Before**:
```hcl
resource "random_password" "db_password" {
  length  = 32
  special = true
}
```

**After**:
```hcl
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}
```

**Lesson Learned**: RDS has specific password requirements that exclude certain special characters (`/`, `@`, `"`, and spaces). Always use `override_special` with `random_password` to ensure compliance with AWS service password policies.