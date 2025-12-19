# VPC Endpoints for AWS services to reduce data transfer costs and improve security

# S3 Gateway Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    var.private_route_table_ids,
    var.database_route_table_ids
  )

  tags = {
    Name        = "vpce-s3-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "Gateway"
  }
}

# Secrets Manager Interface Endpoint
resource "aws_vpc_endpoint" "secrets_manager" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = var.private_subnet_ids
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = {
    Name        = "vpce-secrets-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "Interface"
  }
}

# CloudWatch Logs Interface Endpoint
resource "aws_vpc_endpoint" "cloudwatch_logs" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.logs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = var.private_subnet_ids
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = {
    Name        = "vpce-logs-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "Interface"
  }
}

# CloudWatch Monitoring Interface Endpoint
resource "aws_vpc_endpoint" "cloudwatch_monitoring" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.monitoring"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = var.private_subnet_ids
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = {
    Name        = "vpce-monitoring-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "Interface"
  }
}

# SNS Interface Endpoint
resource "aws_vpc_endpoint" "sns" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.sns"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = var.private_subnet_ids
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = {
    Name        = "vpce-sns-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "Interface"
  }
}

# KMS Interface Endpoint
resource "aws_vpc_endpoint" "kms" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.kms"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = var.private_subnet_ids
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = {
    Name        = "vpce-kms-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "Interface"
  }
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "vpc-endpoints-${var.dr_role}-${var.environment_suffix}-"
  description = "Security group for VPC endpoints"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Allow HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "sg-vpc-endpoints-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}