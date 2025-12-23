# Disaster Recovery Infrastructure for Payment Processing

I'll help you create a comprehensive active-passive disaster recovery architecture using Terraform. This solution implements Aurora Global Database, Lambda functions, Route 53 failover, DynamoDB global tables, and CloudWatch monitoring across two regions.

## File: lib/main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-dr-payments"
    key            = "dr-payment-system/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock-dr"
  }
}

# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "DR"
      Region      = "primary"
      CostCenter  = "payments"
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary region provider (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = "DR"
      Region      = "secondary"
      CostCenter  = "payments"
      ManagedBy   = "Terraform"
    }
  }
}

# Primary region VPC module
module "vpc_primary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.primary
  }

  region_name = "primary"
  vpc_cidr    = "10.0.0.0/16"
  private_subnets = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# Secondary region VPC module
module "vpc_secondary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.secondary
  }

  region_name = "secondary"
  vpc_cidr    = "10.1.0.0/16"
  private_subnets = [
    "10.1.1.0/24",
    "10.1.2.0/24",
    "10.1.3.0/24"
  ]
  availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

# VPC Peering Connection
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider = aws.primary

  vpc_id        = module.vpc_primary.vpc_id
  peer_vpc_id   = module.vpc_secondary.vpc_id
  peer_region   = "us-west-2"
  auto_accept   = false

  tags = {
    Name = "dr-payment-vpc-peering"
  }
}

resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider = aws.secondary

  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = {
    Name = "dr-payment-vpc-peering-accepter"
  }
}

# Aurora Global Database
module "aurora_global" {
  source = "./modules/aurora-global"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  global_cluster_identifier = "payment-dr-global-cluster"
  engine                    = "aurora-postgresql"
  engine_version            = "13.7"
  database_name             = "payments"

  # Primary cluster configuration
  primary_cluster_identifier = "payment-primary-cluster"
  primary_instance_class     = "db.r5.large"
  primary_instance_count     = 2
  primary_subnet_ids         = module.vpc_primary.private_subnet_ids
  primary_vpc_id             = module.vpc_primary.vpc_id

  # Secondary cluster configuration
  secondary_cluster_identifier = "payment-secondary-cluster"
  secondary_instance_class     = "db.r5.large"
  secondary_instance_count     = 1
  secondary_subnet_ids         = module.vpc_secondary.private_subnet_ids
  secondary_vpc_id             = module.vpc_secondary.vpc_id

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
}

# DynamoDB Global Table
module "dynamodb_global" {
  source = "./modules/dynamodb-global"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  table_name     = "payment-sessions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "session_id"

  attributes = [
    {
      name = "session_id"
      type = "S"
    }
  ]

  replica_regions = ["us-east-1", "us-west-2"]
}

# Lambda functions in primary region
module "lambda_primary" {
  source = "./modules/lambda"

  providers = {
    aws = aws.primary
  }

  function_name     = "payment-webhook-processor-primary"
  handler           = "index.handler"
  runtime           = "nodejs18.x"
  memory_size       = 1024
  timeout           = 30

  source_path       = "${path.module}/lambda/payment-processor"

  subnet_ids        = module.vpc_primary.private_subnet_ids
  security_group_ids = [module.vpc_primary.lambda_security_group_id]

  environment_variables = {
    AURORA_ENDPOINT      = module.aurora_global.primary_cluster_endpoint
    DYNAMODB_TABLE_NAME  = module.dynamodb_global.table_name
    AWS_REGION           = "us-east-1"
  }

  iam_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  ]
}

# Lambda functions in secondary region
module "lambda_secondary" {
  source = "./modules/lambda"

  providers = {
    aws = aws.secondary
  }

  function_name     = "payment-webhook-processor-secondary"
  handler           = "index.handler"
  runtime           = "nodejs18.x"
  memory_size       = 1024
  timeout           = 30

  source_path       = "${path.module}/lambda/payment-processor"

  subnet_ids        = module.vpc_secondary.private_subnet_ids
  security_group_ids = [module.vpc_secondary.lambda_security_group_id]

  environment_variables = {
    AURORA_ENDPOINT      = module.aurora_global.secondary_cluster_endpoint
    DYNAMODB_TABLE_NAME  = module.dynamodb_global.table_name
    AWS_REGION           = "us-west-2"
  }

  iam_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  ]
}

# Route 53 Health Checks and Failover
module "route53_failover" {
  source = "./modules/route53"

  domain_name = "payments.example.com"

  primary_endpoint   = module.lambda_primary.function_url
  secondary_endpoint = module.lambda_secondary.function_url

  health_check_primary_url = "https://${module.lambda_primary.function_url}/health"
  health_check_interval    = 30
  health_check_timeout     = 10
  failure_threshold        = 3
}

# CloudWatch Alarms for primary Aurora cluster
module "cloudwatch_primary" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.primary
  }

  cluster_identifier = module.aurora_global.primary_cluster_id
  alarm_prefix       = "dr-payment-primary"

  sns_topic_name = "dr-payment-alerts-primary"
  email_endpoints = var.alert_email_addresses

  alarms = {
    cpu_utilization = {
      threshold = 80
      period    = 300
    }
    database_connections = {
      threshold = 100
      period    = 300
    }
    aurora_replica_lag = {
      threshold = 1000
      period    = 60
    }
  }
}

# CloudWatch Alarms for secondary Aurora cluster
module "cloudwatch_secondary" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.secondary
  }

  cluster_identifier = module.aurora_global.secondary_cluster_id
  alarm_prefix       = "dr-payment-secondary"

  sns_topic_name = "dr-payment-alerts-secondary"
  email_endpoints = var.alert_email_addresses

  alarms = {
    cpu_utilization = {
      threshold = 80
      period    = 300
    }
    database_connections = {
      threshold = 100
      period    = 300
    }
    aurora_replica_lag = {
      threshold = 1000
      period    = 60
    }
  }
}
```

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  validation {
    condition     = length(var.environment_suffix) > 0
    error_message = "Environment suffix cannot be empty"
  }
}

variable "alert_email_addresses" {
  description = "Email addresses for CloudWatch alarm notifications"
  type        = list(string)
  default     = []
}

variable "enable_backup_module" {
  description = "Enable AWS Backup module for centralized backup management"
  type        = bool
  default     = false
}

variable "enable_eventbridge_failover" {
  description = "Enable EventBridge rules for automated failover"
  type        = bool
  default     = false
}

variable "enable_parameter_store" {
  description = "Enable Systems Manager Parameter Store for configuration"
  type        = bool
  default     = false
}

variable "master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "master_password" {
  description = "Master password for Aurora database"
  type        = string
  sensitive   = true
}
```

## File: lib/outputs.tf

```hcl
output "primary_vpc_id" {
  description = "Primary region VPC ID"
  value       = module.vpc_primary.vpc_id
}

output "secondary_vpc_id" {
  description = "Secondary region VPC ID"
  value       = module.vpc_secondary.vpc_id
}

output "aurora_global_cluster_id" {
  description = "Aurora Global Database cluster identifier"
  value       = module.aurora_global.global_cluster_id
}

output "primary_aurora_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = module.aurora_global.primary_cluster_endpoint
}

output "secondary_aurora_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = module.aurora_global.secondary_cluster_endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = module.dynamodb_global.table_name
}

output "primary_lambda_function_name" {
  description = "Primary Lambda function name"
  value       = module.lambda_primary.function_name
}

output "secondary_lambda_function_name" {
  description = "Secondary Lambda function name"
  value       = module.lambda_secondary.function_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.route53_failover.zone_id
}

output "primary_sns_topic_arn" {
  description = "Primary region SNS topic ARN for alerts"
  value       = module.cloudwatch_primary.sns_topic_arn
}

output "secondary_sns_topic_arn" {
  description = "Secondary region SNS topic ARN for alerts"
  value       = module.cloudwatch_secondary.sns_topic_arn
}
```

## File: lib/modules/vpc/main.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "dr-payment-vpc-${var.region_name}"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "dr-payment-private-subnet-${var.region_name}-${count.index + 1}"
  }
}

resource "aws_security_group" "lambda" {
  name_prefix = "dr-payment-lambda-${var.region_name}-"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "dr-payment-lambda-sg-${var.region_name}"
  }
}

resource "aws_security_group" "aurora" {
  name_prefix = "dr-payment-aurora-${var.region_name}-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = {
    Name = "dr-payment-aurora-sg-${var.region_name}"
  }
}
```

## File: lib/modules/vpc/variables.tf

```hcl
variable "region_name" {
  description = "Region name (primary or secondary)"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}
```

## File: lib/modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "lambda_security_group_id" {
  description = "Lambda security group ID"
  value       = aws_security_group.lambda.id
}

output "aurora_security_group_id" {
  description = "Aurora security group ID"
  value       = aws_security_group.aurora.id
}
```

## File: lib/modules/aurora-global/main.tf

```hcl
resource "aws_rds_global_cluster" "main" {
  provider = aws.primary

  global_cluster_identifier = var.global_cluster_identifier
  engine                    = var.engine
  engine_version            = var.engine_version
  database_name             = var.database_name
  storage_encrypted         = true
}

resource "aws_db_subnet_group" "primary" {
  provider = aws.primary

  name       = "${var.primary_cluster_identifier}-subnet-group"
  subnet_ids = var.primary_subnet_ids

  tags = {
    Name = "${var.primary_cluster_identifier}-subnet-group"
  }
}

resource "aws_rds_cluster" "primary" {
  provider = aws.primary

  cluster_identifier              = var.primary_cluster_identifier
  global_cluster_identifier       = aws_rds_global_cluster.main.id
  engine                          = var.engine
  engine_version                  = var.engine_version
  database_name                   = var.database_name
  master_username                 = var.master_username
  master_password                 = var.master_password
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [var.primary_security_group_id]

  backup_retention_period         = var.backup_retention_period
  preferred_backup_window         = var.preferred_backup_window

  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true

  skip_final_snapshot = true

  tags = {
    Name = var.primary_cluster_identifier
  }
}

resource "aws_rds_cluster_instance" "primary" {
  provider = aws.primary
  count    = var.primary_instance_count

  identifier         = "${var.primary_cluster_identifier}-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.primary_instance_class
  engine             = var.engine
  engine_version     = var.engine_version

  tags = {
    Name = "${var.primary_cluster_identifier}-instance-${count.index + 1}"
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider = aws.secondary

  name       = "${var.secondary_cluster_identifier}-subnet-group"
  subnet_ids = var.secondary_subnet_ids

  tags = {
    Name = "${var.secondary_cluster_identifier}-subnet-group"
  }
}

resource "aws_rds_cluster" "secondary" {
  provider = aws.secondary

  depends_on = [aws_rds_cluster_instance.primary]

  cluster_identifier        = var.secondary_cluster_identifier
  global_cluster_identifier = aws_rds_global_cluster.main.id
  engine                    = var.engine
  engine_version            = var.engine_version
  db_subnet_group_name      = aws_db_subnet_group.secondary.name
  vpc_security_group_ids    = [var.secondary_security_group_id]

  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true

  skip_final_snapshot = true

  tags = {
    Name = var.secondary_cluster_identifier
  }
}

resource "aws_rds_cluster_instance" "secondary" {
  provider = aws.secondary
  count    = var.secondary_instance_count

  identifier         = "${var.secondary_cluster_identifier}-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.secondary.id
  instance_class     = var.secondary_instance_class
  engine             = var.engine
  engine_version     = var.engine_version

  tags = {
    Name = "${var.secondary_cluster_identifier}-instance-${count.index + 1}"
  }
}
```

## File: lib/modules/aurora-global/variables.tf

```hcl
variable "global_cluster_identifier" {
  description = "Global cluster identifier"
  type        = string
}

variable "engine" {
  description = "Database engine"
  type        = string
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "master_username" {
  description = "Master username"
  type        = string
  sensitive   = true
}

variable "master_password" {
  description = "Master password"
  type        = string
  sensitive   = true
}

variable "primary_cluster_identifier" {
  description = "Primary cluster identifier"
  type        = string
}

variable "primary_instance_class" {
  description = "Primary instance class"
  type        = string
}

variable "primary_instance_count" {
  description = "Number of primary instances"
  type        = number
}

variable "primary_subnet_ids" {
  description = "Primary subnet IDs"
  type        = list(string)
}

variable "primary_vpc_id" {
  description = "Primary VPC ID"
  type        = string
}

variable "primary_security_group_id" {
  description = "Primary security group ID"
  type        = string
}

variable "secondary_cluster_identifier" {
  description = "Secondary cluster identifier"
  type        = string
}

variable "secondary_instance_class" {
  description = "Secondary instance class"
  type        = string
}

variable "secondary_instance_count" {
  description = "Number of secondary instances"
  type        = number
}

variable "secondary_subnet_ids" {
  description = "Secondary subnet IDs"
  type        = list(string)
}

variable "secondary_vpc_id" {
  description = "Secondary VPC ID"
  type        = string
}

variable "secondary_security_group_id" {
  description = "Secondary security group ID"
  type        = string
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
}
```

## File: lib/modules/aurora-global/outputs.tf

```hcl
output "global_cluster_id" {
  description = "Global cluster ID"
  value       = aws_rds_global_cluster.main.id
}

output "primary_cluster_id" {
  description = "Primary cluster ID"
  value       = aws_rds_cluster.primary.id
}

output "primary_cluster_endpoint" {
  description = "Primary cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "secondary_cluster_id" {
  description = "Secondary cluster ID"
  value       = aws_rds_cluster.secondary.id
}

output "secondary_cluster_endpoint" {
  description = "Secondary cluster endpoint"
  value       = aws_rds_cluster.secondary.endpoint
}
```

## File: lib/lambda/payment-processor/index.js

```javascript
const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

exports.handler = async (event) => {
  console.log('Processing payment webhook:', JSON.stringify(event));

  try {
    const paymentData = JSON.parse(event.body);
    const sessionId = paymentData.sessionId;
    const amount = paymentData.amount;
    const timestamp = new Date().toISOString();

    // Store session data in DynamoDB
    await dynamoClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: {
        session_id: sessionId,
        amount: amount,
        timestamp: timestamp,
        region: process.env.AWS_REGION
      }
    }));

    console.log('Session stored in DynamoDB:', sessionId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Payment processed successfully',
        sessionId: sessionId,
        region: process.env.AWS_REGION
      })
    };
  } catch (error) {
    console.error('Error processing payment:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing payment',
        error: error.message
      })
    };
  }
};
```

## File: lib/lambda/payment-processor/package.json

```json
{
  "name": "payment-processor",
  "version": "1.0.0",
  "description": "Payment webhook processor",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-rds-data": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/lib-dynamodb": "^3.400.0"
  }
}
```

## File: lib/README.md

```markdown
# Disaster Recovery Infrastructure for Payment Processing

This Terraform configuration implements an active-passive disaster recovery architecture for a payment processing system across AWS regions us-east-1 (primary) and us-west-2 (secondary).

## Architecture Overview

- **Aurora Global Database**: PostgreSQL 13.7 with multi-region replication
- **Lambda Functions**: Payment webhook processors in both regions (1GB memory)
- **DynamoDB Global Tables**: Session data replication
- **Route 53**: Failover routing with health checks
- **CloudWatch**: Monitoring and alerting
- **VPC**: Multi-region networking with VPC peering

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions for multi-region deployments

## Deployment

1. Initialize Terraform:
```bash
terraform init
```

2. Create terraform.tfvars:
```hcl
environment_suffix = "prod-001"
master_username = "postgres"
master_password = "your-secure-password"
alert_email_addresses = ["ops@example.com"]
```

3. Plan deployment:
```bash
terraform plan -out=dr-plan
```

4. Apply configuration:
```bash
terraform apply dr-plan
```

## Testing Failover

1. Check primary region health
2. Simulate primary region failure
3. Verify automatic failover to secondary region
4. Monitor CloudWatch alarms and SNS notifications

## RTO and RPO

- **RTO**: Under 5 minutes (automated failover via Route 53)
- **RPO**: Under 1 minute (Aurora Global Database replication lag)

## Cost Optimization

Secondary region runs minimal capacity (1 Aurora instance vs 2 in primary) until failover is triggered.

## Cleanup

```bash
terraform destroy
```

Note: All resources are configured with skip_final_snapshot = true for easy cleanup.
```
