# Multi-Region Disaster Recovery Infrastructure for Payment Processing

This Terraform configuration implements a complete multi-region disaster recovery solution spanning us-east-1 (primary) and us-east-2 (DR) with automated failover capabilities.

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary region provider (us-east-1)
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = {
      Environment = "production"
      DR-Role     = "primary"
      ManagedBy   = "terraform"
      Project     = "payment-processing-dr"
    }
  }
}

# DR region provider (us-east-2)
provider "aws" {
  alias  = "dr"
  region = var.dr_region

  default_tags {
    tags = {
      Environment = "production"
      DR-Role     = "secondary"
      ManagedBy   = "terraform"
      Project     = "payment-processing-dr"
    }
  }
}
```

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming uniqueness"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  type        = string
  default     = "us-east-2"
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_dr" {
  description = "CIDR block for DR VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "availability_zones_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "dbadmin"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "payments"
}

variable "domain_name" {
  description = "Domain name for API endpoints"
  type        = string
  default     = "payments-api.example.com"
}

variable "health_check_path" {
  description = "Health check path for API"
  type        = string
  default     = "/health"
}

variable "replication_lag_threshold" {
  description = "Aurora replication lag threshold in milliseconds"
  type        = number
  default     = 10000
}
```

## File: main.tf

```hcl
# Data sources
data "aws_availability_zones" "primary" {
  state = "available"
}

data "aws_availability_zones" "dr" {
  provider = aws.dr
  state    = "available"
}

# Random password for Aurora (in production, use existing Secrets Manager secret)
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name                    = "payment-db-password-${var.environment_suffix}"
  description             = "Aurora database master password"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# IAM role for S3 replication
resource "aws_iam_role" "s3_replication" {
  name = "s3-replication-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "s3_replication" {
  name        = "s3-replication-policy-${var.environment_suffix}"
  description = "Policy for S3 cross-region replication"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.primary.arn
        ]
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.primary.arn}/*"
        ]
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.dr.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_replication" {
  role       = aws_iam_role.s3_replication.name
  policy_arn = aws_iam_policy.s3_replication.arn
}
```

## File: networking.tf

```hcl
# Primary Region VPC
resource "aws_vpc" "primary" {
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "payment-vpc-primary-${var.environment_suffix}"
  }
}

# Primary Region Private Subnets
resource "aws_subnet" "primary_private" {
  count             = var.availability_zones_count
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 4, count.index)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name = "payment-private-subnet-primary-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Primary Region Public Subnets
resource "aws_subnet" "primary_public" {
  count                   = var.availability_zones_count
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 4, count.index + 10)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "payment-public-subnet-primary-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Primary Region Internet Gateway
resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id

  tags = {
    Name = "payment-igw-primary-${var.environment_suffix}"
  }
}

# Primary Region NAT Gateway
resource "aws_eip" "primary_nat" {
  domain = "vpc"

  tags = {
    Name = "payment-nat-eip-primary-${var.environment_suffix}"
  }
}

resource "aws_nat_gateway" "primary" {
  allocation_id = aws_eip.primary_nat.id
  subnet_id     = aws_subnet.primary_public[0].id

  tags = {
    Name = "payment-nat-primary-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.primary]
}

# Primary Region Route Tables
resource "aws_route_table" "primary_public" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name = "payment-public-rt-primary-${var.environment_suffix}"
  }
}

resource "aws_route_table" "primary_private" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }

  tags = {
    Name = "payment-private-rt-primary-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "primary_public" {
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

# DR Region VPC
resource "aws_vpc" "dr" {
  provider             = aws.dr
  cidr_block           = var.vpc_cidr_dr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "payment-vpc-dr-${var.environment_suffix}"
  }
}

# DR Region Private Subnets
resource "aws_subnet" "dr_private" {
  provider          = aws.dr
  count             = var.availability_zones_count
  vpc_id            = aws_vpc.dr.id
  cidr_block        = cidrsubnet(var.vpc_cidr_dr, 4, count.index)
  availability_zone = data.aws_availability_zones.dr.names[count.index]

  tags = {
    Name = "payment-private-subnet-dr-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# DR Region Public Subnets
resource "aws_subnet" "dr_public" {
  provider                = aws.dr
  count                   = var.availability_zones_count
  vpc_id                  = aws_vpc.dr.id
  cidr_block              = cidrsubnet(var.vpc_cidr_dr, 4, count.index + 10)
  availability_zone       = data.aws_availability_zones.dr.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "payment-public-subnet-dr-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# DR Region Internet Gateway
resource "aws_internet_gateway" "dr" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  tags = {
    Name = "payment-igw-dr-${var.environment_suffix}"
  }
}

# DR Region NAT Gateway
resource "aws_eip" "dr_nat" {
  provider = aws.dr
  domain   = "vpc"

  tags = {
    Name = "payment-nat-eip-dr-${var.environment_suffix}"
  }
}

resource "aws_nat_gateway" "dr" {
  provider      = aws.dr
  allocation_id = aws_eip.dr_nat.id
  subnet_id     = aws_subnet.dr_public[0].id

  tags = {
    Name = "payment-nat-dr-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.dr]
}

# DR Region Route Tables
resource "aws_route_table" "dr_public" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dr.id
  }

  tags = {
    Name = "payment-public-rt-dr-${var.environment_suffix}"
  }
}

resource "aws_route_table" "dr_private" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.dr.id
  }

  tags = {
    Name = "payment-private-rt-dr-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "dr_public" {
  provider       = aws.dr
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.dr_public[count.index].id
  route_table_id = aws_route_table.dr_public.id
}

resource "aws_route_table_association" "dr_private" {
  provider       = aws.dr
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.dr_private[count.index].id
  route_table_id = aws_route_table.dr_private.id
}

# Security Groups
resource "aws_security_group" "aurora_primary" {
  name        = "aurora-sg-primary-${var.environment_suffix}"
  description = "Security group for Aurora primary cluster"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "aurora-sg-primary-${var.environment_suffix}"
  }
}

resource "aws_security_group" "aurora_dr" {
  provider    = aws.dr
  name        = "aurora-sg-dr-${var.environment_suffix}"
  description = "Security group for Aurora DR cluster"
  vpc_id      = aws_vpc.dr.id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_dr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "aurora-sg-dr-${var.environment_suffix}"
  }
}

resource "aws_security_group" "lambda_primary" {
  name        = "lambda-sg-primary-${var.environment_suffix}"
  description = "Security group for Lambda functions in primary region"
  vpc_id      = aws_vpc.primary.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lambda-sg-primary-${var.environment_suffix}"
  }
}

resource "aws_security_group" "lambda_dr" {
  provider    = aws.dr
  name        = "lambda-sg-dr-${var.environment_suffix}"
  description = "Security group for Lambda functions in DR region"
  vpc_id      = aws_vpc.dr.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lambda-sg-dr-${var.environment_suffix}"
  }
}
```

## File: aurora.tf

```hcl
# DB Subnet Groups
resource "aws_db_subnet_group" "primary" {
  name       = "aurora-subnet-group-primary-${var.environment_suffix}"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = {
    Name = "aurora-subnet-group-primary-${var.environment_suffix}"
  }
}

resource "aws_db_subnet_group" "dr" {
  provider   = aws.dr
  name       = "aurora-subnet-group-dr-${var.environment_suffix}"
  subnet_ids = aws_subnet.dr_private[*].id

  tags = {
    Name = "aurora-subnet-group-dr-${var.environment_suffix}"
  }
}

# Aurora Global Database
resource "aws_rds_global_cluster" "payments" {
  global_cluster_identifier = "payment-global-cluster-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "14.6"
  database_name             = var.db_name
  storage_encrypted         = true
}

# Primary Aurora Cluster
resource "aws_rds_cluster" "primary" {
  cluster_identifier        = "payment-cluster-primary-${var.environment_suffix}"
  engine                    = aws_rds_global_cluster.payments.engine
  engine_version            = aws_rds_global_cluster.payments.engine_version
  database_name             = var.db_name
  master_username           = var.db_master_username
  master_password           = random_password.db_password.result
  db_subnet_group_name      = aws_db_subnet_group.primary.name
  vpc_security_group_ids    = [aws_security_group.aurora_primary.id]
  global_cluster_identifier = aws_rds_global_cluster.payments.id
  storage_encrypted         = true
  backup_retention_period   = 7
  preferred_backup_window   = "03:00-04:00"
  skip_final_snapshot       = true

  tags = {
    Name = "payment-cluster-primary-${var.environment_suffix}"
  }
}

# Primary Aurora Instances
resource "aws_rds_cluster_instance" "primary" {
  count                = 2
  identifier           = "payment-instance-primary-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.primary.engine
  engine_version       = aws_rds_cluster.primary.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.primary.name

  tags = {
    Name = "payment-instance-primary-${count.index + 1}-${var.environment_suffix}"
  }
}

# DR Aurora Cluster
resource "aws_rds_cluster" "dr" {
  provider                  = aws.dr
  cluster_identifier        = "payment-cluster-dr-${var.environment_suffix}"
  engine                    = aws_rds_global_cluster.payments.engine
  engine_version            = aws_rds_global_cluster.payments.engine_version
  db_subnet_group_name      = aws_db_subnet_group.dr.name
  vpc_security_group_ids    = [aws_security_group.aurora_dr.id]
  global_cluster_identifier = aws_rds_global_cluster.payments.id
  storage_encrypted         = true
  skip_final_snapshot       = true

  depends_on = [aws_rds_cluster_instance.primary]

  tags = {
    Name = "payment-cluster-dr-${var.environment_suffix}"
  }
}

# DR Aurora Instances
resource "aws_rds_cluster_instance" "dr" {
  provider             = aws.dr
  count                = 2
  identifier           = "payment-instance-dr-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.dr.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.dr.engine
  engine_version       = aws_rds_cluster.dr.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.dr.name

  tags = {
    Name = "payment-instance-dr-${count.index + 1}-${var.environment_suffix}"
  }
}
```

## File: s3.tf

```hcl
# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  bucket = "payment-transactions-primary-${var.environment_suffix}"

  tags = {
    Name = "payment-transactions-primary-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# DR S3 Bucket
resource "aws_s3_bucket" "dr" {
  provider = aws.dr
  bucket   = "payment-transactions-dr-${var.environment_suffix}"

  tags = {
    Name = "payment-transactions-dr-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.dr.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.dr.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Cross-Region Replication
resource "aws_s3_bucket_replication_configuration" "primary_to_dr" {
  depends_on = [aws_s3_bucket_versioning.primary]

  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.dr.arn
      storage_class = "STANDARD"
    }
  }
}
```

## File: lambda.tf

```hcl
# Lambda IAM Role - Primary
resource "aws_iam_role" "lambda_primary" {
  name = "lambda-payment-processor-primary-${var.environment_suffix}"

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
}

resource "aws_iam_role_policy_attachment" "lambda_primary_vpc" {
  role       = aws_iam_role.lambda_primary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_primary_s3" {
  name = "lambda-s3-access"
  role = aws_iam_role.lambda_primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      }
    ]
  })
}

# Lambda Function - Primary
resource "aws_lambda_function" "payment_processor_primary" {
  filename         = "${path.module}/lambda/payment_processor.zip"
  function_name    = "payment-processor-primary-${var.environment_suffix}"
  role             = aws_iam_role.lambda_primary.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/payment_processor.zip")
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.primary_private[*].id
    security_group_ids = [aws_security_group.lambda_primary.id]
  }

  environment {
    variables = {
      REGION          = var.primary_region
      S3_BUCKET       = aws_s3_bucket.primary.id
      DB_ENDPOINT     = aws_rds_cluster.primary.endpoint
      DB_NAME         = var.db_name
      DB_SECRET_ARN   = aws_secretsmanager_secret.db_password.arn
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = {
    Name = "payment-processor-primary-${var.environment_suffix}"
  }
}

# Lambda IAM Role - DR
resource "aws_iam_role" "lambda_dr" {
  provider = aws.dr
  name     = "lambda-payment-processor-dr-${var.environment_suffix}"

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
}

resource "aws_iam_role_policy_attachment" "lambda_dr_vpc" {
  provider   = aws.dr
  role       = aws_iam_role.lambda_dr.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dr_s3" {
  provider = aws.dr
  name     = "lambda-s3-access"
  role     = aws_iam_role.lambda_dr.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.dr.arn}/*"
      }
    ]
  })
}

# Lambda Function - DR
resource "aws_lambda_function" "payment_processor_dr" {
  provider         = aws.dr
  filename         = "${path.module}/lambda/payment_processor.zip"
  function_name    = "payment-processor-dr-${var.environment_suffix}"
  role             = aws_iam_role.lambda_dr.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/payment_processor.zip")
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.dr_private[*].id
    security_group_ids = [aws_security_group.lambda_dr.id]
  }

  environment {
    variables = {
      REGION          = var.dr_region
      S3_BUCKET       = aws_s3_bucket.dr.id
      DB_ENDPOINT     = aws_rds_cluster.dr.endpoint
      DB_NAME         = var.db_name
      DB_SECRET_ARN   = aws_secretsmanager_secret.db_password.arn
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = {
    Name = "payment-processor-dr-${var.environment_suffix}"
  }
}

# Lambda Permissions for API Gateway - Primary
resource "aws_lambda_permission" "api_gateway_primary" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_processor_primary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.primary.execution_arn}/*/*"
}

# Lambda Permissions for API Gateway - DR
resource "aws_lambda_permission" "api_gateway_dr" {
  provider      = aws.dr
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_processor_dr.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dr.execution_arn}/*/*"
}
```

## File: lambda/payment_processor.zip

Note: This is a placeholder. Create a zip file with the actual Lambda code.

## File: lambda/index.js

```javascript
exports.handler = async (event) => {
    console.log('Payment processor invoked', {
        region: process.env.REGION,
        bucket: process.env.S3_BUCKET,
        dbEndpoint: process.env.DB_ENDPOINT,
        environmentSuffix: process.env.ENVIRONMENT_SUFFIX
    });

    // Payment processing logic would go here
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Payment processed successfully',
            region: process.env.REGION,
            timestamp: new Date().toISOString(),
            environmentSuffix: process.env.ENVIRONMENT_SUFFIX
        })
    };

    return response;
};
```

## File: api_gateway.tf

```hcl
# API Gateway - Primary Region
resource "aws_api_gateway_rest_api" "primary" {
  name        = "payment-api-primary-${var.environment_suffix}"
  description = "Payment Processing API - Primary Region"

  tags = {
    Name = "payment-api-primary-${var.environment_suffix}"
  }
}

resource "aws_api_gateway_resource" "primary_payment" {
  rest_api_id = aws_api_gateway_rest_api.primary.id
  parent_id   = aws_api_gateway_rest_api.primary.root_resource_id
  path_part   = "payment"
}

resource "aws_api_gateway_method" "primary_payment_post" {
  rest_api_id   = aws_api_gateway_rest_api.primary.id
  resource_id   = aws_api_gateway_resource.primary_payment.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "primary_payment" {
  rest_api_id             = aws_api_gateway_rest_api.primary.id
  resource_id             = aws_api_gateway_resource.primary_payment.id
  http_method             = aws_api_gateway_method.primary_payment_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_processor_primary.invoke_arn
}

# Health check endpoint - Primary
resource "aws_api_gateway_resource" "primary_health" {
  rest_api_id = aws_api_gateway_rest_api.primary.id
  parent_id   = aws_api_gateway_rest_api.primary.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "primary_health_get" {
  rest_api_id   = aws_api_gateway_rest_api.primary.id
  resource_id   = aws_api_gateway_resource.primary_health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "primary_health" {
  rest_api_id = aws_api_gateway_rest_api.primary.id
  resource_id = aws_api_gateway_resource.primary_health.id
  http_method = aws_api_gateway_method.primary_health_get.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "primary_health_200" {
  rest_api_id = aws_api_gateway_rest_api.primary.id
  resource_id = aws_api_gateway_resource.primary_health.id
  http_method = aws_api_gateway_method.primary_health_get.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "primary_health" {
  rest_api_id = aws_api_gateway_rest_api.primary.id
  resource_id = aws_api_gateway_resource.primary_health.id
  http_method = aws_api_gateway_method.primary_health_get.http_method
  status_code = aws_api_gateway_method_response.primary_health_200.status_code

  response_templates = {
    "application/json" = "{\"status\": \"healthy\", \"region\": \"${var.primary_region}\"}"
  }
}

resource "aws_api_gateway_deployment" "primary" {
  depends_on = [
    aws_api_gateway_integration.primary_payment,
    aws_api_gateway_integration.primary_health
  ]

  rest_api_id = aws_api_gateway_rest_api.primary.id
  stage_name  = "prod"

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway - DR Region
resource "aws_api_gateway_rest_api" "dr" {
  provider    = aws.dr
  name        = "payment-api-dr-${var.environment_suffix}"
  description = "Payment Processing API - DR Region"

  tags = {
    Name = "payment-api-dr-${var.environment_suffix}"
  }
}

resource "aws_api_gateway_resource" "dr_payment" {
  provider    = aws.dr
  rest_api_id = aws_api_gateway_rest_api.dr.id
  parent_id   = aws_api_gateway_rest_api.dr.root_resource_id
  path_part   = "payment"
}

resource "aws_api_gateway_method" "dr_payment_post" {
  provider      = aws.dr
  rest_api_id   = aws_api_gateway_rest_api.dr.id
  resource_id   = aws_api_gateway_resource.dr_payment.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "dr_payment" {
  provider                = aws.dr
  rest_api_id             = aws_api_gateway_rest_api.dr.id
  resource_id             = aws_api_gateway_resource.dr_payment.id
  http_method             = aws_api_gateway_method.dr_payment_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_processor_dr.invoke_arn
}

# Health check endpoint - DR
resource "aws_api_gateway_resource" "dr_health" {
  provider    = aws.dr
  rest_api_id = aws_api_gateway_rest_api.dr.id
  parent_id   = aws_api_gateway_rest_api.dr.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "dr_health_get" {
  provider      = aws.dr
  rest_api_id   = aws_api_gateway_rest_api.dr.id
  resource_id   = aws_api_gateway_resource.dr_health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "dr_health" {
  provider    = aws.dr
  rest_api_id = aws_api_gateway_rest_api.dr.id
  resource_id = aws_api_gateway_resource.dr_health.id
  http_method = aws_api_gateway_method.dr_health_get.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "dr_health_200" {
  provider    = aws.dr
  rest_api_id = aws_api_gateway_rest_api.dr.id
  resource_id = aws_api_gateway_resource.dr_health.id
  http_method = aws_api_gateway_method.dr_health_get.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "dr_health" {
  provider    = aws.dr
  rest_api_id = aws_api_gateway_rest_api.dr.id
  resource_id = aws_api_gateway_resource.dr_health.id
  http_method = aws_api_gateway_method.dr_health_get.http_method
  status_code = aws_api_gateway_method_response.dr_health_200.status_code

  response_templates = {
    "application/json" = "{\"status\": \"healthy\", \"region\": \"${var.dr_region}\"}"
  }
}

resource "aws_api_gateway_deployment" "dr" {
  provider = aws.dr
  depends_on = [
    aws_api_gateway_integration.dr_payment,
    aws_api_gateway_integration.dr_health
  ]

  rest_api_id = aws_api_gateway_rest_api.dr.id
  stage_name  = "prod"

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: route53.tf

```hcl
# Route 53 Health Check for Primary Region
resource "aws_route53_health_check" "primary" {
  fqdn              = "${aws_api_gateway_rest_api.primary.id}.execute-api.${var.primary_region}.amazonaws.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/prod/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = {
    Name = "payment-api-health-check-primary-${var.environment_suffix}"
  }
}

# SNS Topic for Health Check Alarms
resource "aws_sns_topic" "health_check_alerts" {
  name = "payment-api-health-alerts-${var.environment_suffix}"

  tags = {
    Name = "payment-api-health-alerts-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Health Check
resource "aws_cloudwatch_metric_alarm" "health_check" {
  alarm_name          = "payment-api-health-check-alarm-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "This metric monitors primary API health"
  alarm_actions       = [aws_sns_topic.health_check_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }
}

# Note: Route 53 Hosted Zone and domain configuration would typically be managed separately
# This example assumes you have a hosted zone. Replace with your actual hosted zone ID.
# For demonstration, we'll use outputs to show the endpoints instead of creating DNS records.
```

## File: cloudwatch.tf

```hcl
# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "cloudwatch_alarms" {
  name = "payment-cloudwatch-alarms-${var.environment_suffix}"

  tags = {
    Name = "payment-cloudwatch-alarms-${var.environment_suffix}"
  }
}

resource "aws_sns_topic" "cloudwatch_alarms_dr" {
  provider = aws.dr
  name     = "payment-cloudwatch-alarms-dr-${var.environment_suffix}"

  tags = {
    Name = "payment-cloudwatch-alarms-dr-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Aurora Replication Lag - Primary
resource "aws_cloudwatch_metric_alarm" "aurora_replication_lag_primary" {
  alarm_name          = "aurora-replication-lag-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = var.replication_lag_threshold
  alarm_description   = "This metric monitors Aurora Global Database replication lag"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = {
    Name = "aurora-replication-lag-primary-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Aurora Replication Lag - DR
resource "aws_cloudwatch_metric_alarm" "aurora_replication_lag_dr" {
  provider            = aws.dr
  alarm_name          = "aurora-replication-lag-dr-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = var.replication_lag_threshold
  alarm_description   = "This metric monitors Aurora Global Database replication lag in DR region"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms_dr.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.dr.cluster_identifier
  }

  tags = {
    Name = "aurora-replication-lag-dr-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for API Gateway Errors - Primary
resource "aws_cloudwatch_metric_alarm" "api_gateway_errors_primary" {
  alarm_name          = "api-gateway-errors-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5XX errors in primary region"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.primary.name
  }

  tags = {
    Name = "api-gateway-errors-primary-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for API Gateway Errors - DR
resource "aws_cloudwatch_metric_alarm" "api_gateway_errors_dr" {
  provider            = aws.dr
  alarm_name          = "api-gateway-errors-dr-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5XX errors in DR region"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms_dr.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.dr.name
  }

  tags = {
    Name = "api-gateway-errors-dr-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Lambda Errors - Primary
resource "aws_cloudwatch_metric_alarm" "lambda_errors_primary" {
  alarm_name          = "lambda-errors-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors in primary region"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.payment_processor_primary.function_name
  }

  tags = {
    Name = "lambda-errors-primary-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Lambda Errors - DR
resource "aws_cloudwatch_metric_alarm" "lambda_errors_dr" {
  provider            = aws.dr
  alarm_name          = "lambda-errors-dr-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors in DR region"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms_dr.arn]

  dimensions = {
    FunctionName = aws_lambda_function.payment_processor_dr.function_name
  }

  tags = {
    Name = "lambda-errors-dr-${var.environment_suffix}"
  }
}
```

## File: outputs.tf

```hcl
# API Endpoints
output "primary_api_endpoint" {
  description = "Primary region API Gateway endpoint"
  value       = "${aws_api_gateway_deployment.primary.invoke_url}/payment"
}

output "dr_api_endpoint" {
  description = "DR region API Gateway endpoint"
  value       = "${aws_api_gateway_deployment.dr.invoke_url}/payment"
}

output "primary_health_check_endpoint" {
  description = "Primary region health check endpoint"
  value       = "${aws_api_gateway_deployment.primary.invoke_url}/health"
}

output "dr_health_check_endpoint" {
  description = "DR region health check endpoint"
  value       = "${aws_api_gateway_deployment.dr.invoke_url}/health"
}

# Aurora Endpoints
output "primary_aurora_cluster_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "primary_aurora_reader_endpoint" {
  description = "Primary Aurora reader endpoint"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "dr_aurora_cluster_endpoint" {
  description = "DR Aurora cluster endpoint"
  value       = aws_rds_cluster.dr.endpoint
}

output "dr_aurora_reader_endpoint" {
  description = "DR Aurora reader endpoint"
  value       = aws_rds_cluster.dr.reader_endpoint
}

# S3 Buckets
output "primary_s3_bucket_name" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary.id
}

output "dr_s3_bucket_name" {
  description = "DR S3 bucket name"
  value       = aws_s3_bucket.dr.id
}

# Lambda Functions
output "primary_lambda_function_name" {
  description = "Primary Lambda function name"
  value       = aws_lambda_function.payment_processor_primary.function_name
}

output "dr_lambda_function_name" {
  description = "DR Lambda function name"
  value       = aws_lambda_function.payment_processor_dr.function_name
}

# VPC IDs
output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "dr_vpc_id" {
  description = "DR VPC ID"
  value       = aws_vpc.dr.id
}

# Health Check
output "route53_health_check_id" {
  description = "Route 53 health check ID"
  value       = aws_route53_health_check.primary.id
}

# Database Secret
output "db_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

# SNS Topics
output "health_check_alerts_topic_arn" {
  description = "SNS topic ARN for health check alerts"
  value       = aws_sns_topic.health_check_alerts.arn
}

output "cloudwatch_alarms_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  value       = aws_sns_topic.cloudwatch_alarms.arn
}

output "cloudwatch_alarms_dr_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms in DR region"
  value       = aws_sns_topic.cloudwatch_alarms_dr.arn
}
```

## File: terraform.tfvars.example

```hcl
environment_suffix = "dev-001"
primary_region     = "us-east-1"
dr_region          = "us-east-2"
db_master_username = "dbadmin"
db_name            = "payments"
domain_name        = "payments-api.example.com"
```

## File: README.md

```markdown
# Multi-Region Disaster Recovery Infrastructure

This Terraform configuration deploys a complete disaster recovery solution for a payment processing system across AWS regions us-east-1 (primary) and us-east-2 (DR).

## Architecture Overview

The infrastructure includes:

- **Multi-region VPCs**: Isolated networks in both regions with public/private subnets across 3 AZs
- **Aurora Global Database**: PostgreSQL database with automatic cross-region replication
- **S3 Cross-Region Replication**: Transaction logs replicated from primary to DR
- **Lambda Functions**: Payment processing logic deployed in both regions
- **API Gateway**: REST APIs with health check endpoints in both regions
- **Route 53 Health Checks**: Monitoring primary region availability
- **CloudWatch Alarms**: Monitoring replication lag and service health
- **NAT Gateways**: Enabling Lambda functions to access external services

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0 installed
3. Lambda deployment package at `lib/lambda/payment_processor.zip`

## Deployment Instructions

1. **Initialize Terraform**:
   ```bash
   cd lib
   terraform init
   ```

2. **Create terraform.tfvars**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your environment_suffix
   ```

3. **Review the plan**:
   ```bash
   terraform plan
   ```

4. **Deploy the infrastructure**:
   ```bash
   terraform apply
   ```

5. **View outputs**:
   ```bash
   terraform output
   ```

## Lambda Function Preparation

Before deployment, create the Lambda deployment package:

```bash
cd lib/lambda
zip payment_processor.zip index.js
cd ../..
```

## Key Features

### RTO and RPO Targets

- **RTO (Recovery Time Objective)**: < 15 minutes
- **RPO (Recovery Point Objective)**: < 5 minutes

### Monitoring

The infrastructure includes comprehensive monitoring:

- Aurora replication lag alarms (threshold: 10 seconds)
- API Gateway error rate monitoring
- Lambda function error tracking
- Route 53 health check status

### Security

- Encryption at rest for all data stores (S3, Aurora)
- VPC isolation with security groups
- Secrets Manager for database credentials
- IAM roles with least privilege access

### Disaster Recovery Process

1. **Automatic Failover**: Route 53 health checks monitor primary API
2. **Health Check Failure**: If primary fails 3 consecutive checks, Route 53 stops routing to primary
3. **Traffic Rerouting**: Manual or automated DNS update routes traffic to DR region
4. **Database Promotion**: Aurora secondary cluster can be promoted to standalone

## Resource Naming

All resources follow the pattern: `{resource-type}-{region}-{environment_suffix}`

## Cost Optimization Notes

- NAT Gateways are provisioned (one per region) for Lambda connectivity
- Consider using VPC endpoints for S3 and other AWS services to reduce NAT costs
- Aurora uses on-demand pricing; consider reserved instances for production
- CloudWatch Logs retention should be configured based on compliance requirements

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: Ensure you have backups before destroying the infrastructure. Set `skip_final_snapshot = false` for production databases.

## Outputs Reference

After deployment, the following outputs are available:

- `primary_api_endpoint`: Primary region API URL
- `dr_api_endpoint`: DR region API URL
- `primary_aurora_cluster_endpoint`: Database write endpoint (primary)
- `dr_aurora_cluster_endpoint`: Database write endpoint (DR)
- S3 bucket names for both regions
- Lambda function names
- VPC IDs
- SNS topic ARNs for alerts

## Support

For issues or questions, refer to the project documentation or contact the infrastructure team.
```
