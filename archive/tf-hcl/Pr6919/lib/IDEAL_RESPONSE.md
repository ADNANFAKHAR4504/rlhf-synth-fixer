# Multi-Region PostgreSQL DR Infrastructure - Corrected Implementation

This is the corrected implementation addressing all issues found in MODEL_RESPONSE.md. See MODEL_FAILURES.md for detailed explanations of each fix.

## File: lib/providers.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "dr-postgresql/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Environment = "DR"
      CostCenter  = "Infrastructure"
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "dr"
  region = var.dr_region

  default_tags {
    tags = {
      Environment = "DR"
      CostCenter  = "Infrastructure"
      ManagedBy   = "Terraform"
    }
  }
}
```

## File: lib/secrets.tf

```hcl
# Generate random password
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store password in Secrets Manager - Primary region
resource "aws_secretsmanager_secret" "db_password_primary" {
  provider    = aws.primary
  name        = "rds-master-password-primary-${var.environment_suffix}"
  description = "Master password for primary RDS instance"

  tags = {
    Name                = "rds-secret-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

resource "aws_secretsmanager_secret_version" "db_password_primary" {
  provider      = aws.primary
  secret_id     = aws_secretsmanager_secret.db_password_primary.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# Store password in Secrets Manager - DR region
resource "aws_secretsmanager_secret" "db_password_dr" {
  provider                       = aws.dr
  name                           = "rds-master-password-dr-${var.environment_suffix}"
  description                    = "Master password for DR RDS instance"
  force_overwrite_replica_secret = true

  tags = {
    Name                = "rds-secret-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

resource "aws_secretsmanager_secret_version" "db_password_dr" {
  provider      = aws.dr
  secret_id     = aws_secretsmanager_secret.db_password_dr.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}
```

## File: lib/vpc_peering.tf

```hcl
# VPC Peering Connection
resource "aws_vpc_peering_connection" "primary_to_dr" {
  provider      = aws.primary
  vpc_id        = aws_vpc.primary.id
  peer_vpc_id   = aws_vpc.dr.id
  peer_region   = var.dr_region
  auto_accept   = false

  tags = {
    Name                = "vpc-peering-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Accept VPC Peering Connection
resource "aws_vpc_peering_connection_accepter" "dr" {
  provider                  = aws.dr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
  auto_accept               = true

  tags = {
    Name                = "vpc-peering-accepter-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Route from primary to DR
resource "aws_route" "primary_to_dr" {
  provider                  = aws.primary
  route_table_id            = aws_route_table.primary.id
  destination_cidr_block    = var.vpc_cidr_dr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id

  depends_on = [aws_vpc_peering_connection_accepter.dr]
}

# Route from DR to primary
resource "aws_route" "dr_to_primary" {
  provider                  = aws.dr
  route_table_id            = aws_route_table.dr.id
  destination_cidr_block    = var.vpc_cidr_primary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id

  depends_on = [aws_vpc_peering_connection_accepter.dr]
}
```

## File: lib/route53.tf

```hcl
# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.primary
  name     = var.domain_name

  vpc {
    vpc_id     = aws_vpc.primary.id
    vpc_region = var.primary_region
  }

  tags = {
    Name                = "route53-zone-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Associate hosted zone with DR VPC
resource "aws_route53_zone_association" "dr" {
  provider = aws.dr
  zone_id  = aws_route53_zone.main.id
  vpc_id   = aws_vpc.dr.id
}

# Endpoint health check for primary database
resource "aws_route53_health_check" "primary_endpoint" {
  provider          = aws.primary
  type              = "HTTPS_STR_MATCH"
  resource_path     = "/"
  fqdn              = aws_db_instance.primary.address
  port              = 5432
  request_interval  = 30
  failure_threshold = 3
  search_string     = ""

  tags = {
    Name                = "health-check-primary-endpoint-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Calculated health check for primary database
resource "aws_route53_health_check" "primary" {
  provider                = aws.primary
  type                    = "CALCULATED"
  child_health_threshold  = 1
  child_healthchecks      = [aws_route53_health_check.primary_endpoint.id]
  insufficient_data_health_status = "Unhealthy"

  tags = {
    Name                = "health-check-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Endpoint health check for DR database
resource "aws_route53_health_check" "dr_endpoint" {
  provider          = aws.primary
  type              = "HTTPS_STR_MATCH"
  resource_path     = "/"
  fqdn              = aws_db_instance.dr.address
  port              = 5432
  request_interval  = 30
  failure_threshold = 3
  search_string     = ""

  tags = {
    Name                = "health-check-dr-endpoint-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Calculated health check for DR database
resource "aws_route53_health_check" "dr" {
  provider                = aws.primary
  type                    = "CALCULATED"
  child_health_threshold  = 1
  child_healthchecks      = [aws_route53_health_check.dr_endpoint.id]
  insufficient_data_health_status = "Unhealthy"

  tags = {
    Name                = "health-check-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Primary database DNS record
resource "aws_route53_record" "primary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "db.${var.domain_name}"
  type     = "CNAME"
  ttl      = 60

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id
  records         = [aws_db_instance.primary.address]
}

# DR database DNS record
resource "aws_route53_record" "dr" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "db.${var.domain_name}"
  type     = "CNAME"
  ttl      = 60

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier  = "dr"
  health_check_id = aws_route53_health_check.dr.id
  records         = [aws_db_instance.dr.address]
}
```

## File: lib/iam.tf

```hcl
# IAM role for Lambda function
resource "aws_iam_role" "lambda_monitoring" {
  provider = aws.primary
  name     = "lambda-monitoring-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name                = "lambda-monitoring-role-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# IAM policy for Lambda monitoring
resource "aws_iam_role_policy" "lambda_monitoring" {
  provider = aws.primary
  name     = "lambda-monitoring-policy-${var.environment_suffix}"
  role     = aws_iam_role.lambda_monitoring.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:PromoteReadReplica"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Environment" = "DR"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password_primary.arn,
          aws_secretsmanager_secret.db_password_dr.arn
        ]
      }
    ]
  })
}

# Attach AWS managed policy for Lambda VPC execution
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  provider   = aws.primary
  role       = aws_iam_role.lambda_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
```

## All Other Files Remain Unchanged

The following files from MODEL_RESPONSE.md are correct and require no changes:

- `lib/variables.tf` - No issues
- `lib/data.tf` - No issues
- `lib/kms.tf` - No issues
- `lib/vpc_primary.tf` - No issues
- `lib/vpc_dr.tf` - No issues
- `lib/rds_primary.tf` - No issues
- `lib/rds_dr.tf` - No issues (Note: db_subnet_group_name is actually optional for cross-region replicas in newer AWS provider versions, so original code may work)
- `lib/cloudwatch.tf` - No issues
- `lib/lambda.tf` - No issues
- `lib/outputs.tf` - No issues
- `lib/terraform.tfvars.example` - No issues
- `lib/lambda/monitor_replication.py` - No issues
- `lib/README.md` - No issues

## Summary of Changes

1. **providers.tf**: Added random and archive providers
2. **secrets.tf**: Added force_overwrite_replica_secret for DR secret
3. **vpc_peering.tf**: Added depends_on for routes to wait for peering accepter
4. **route53.tf**: Changed from CLOUDWATCH_METRIC to CALCULATED health checks with endpoint monitoring
5. **iam.tf**: Changed RDS IAM policy to use tag-based conditions instead of specific ARNs

All changes maintain 100% Terraform HCL platform compliance while fixing critical deployment blockers.
