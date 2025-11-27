# Security group for primary RDS cluster
resource "aws_security_group" "primary_db" {
  name        = "rds-aurora-primary-${var.environment_suffix}"
  description = "Security group for RDS Aurora primary cluster"
  vpc_id      = aws_vpc.primary.id

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-sg-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_security_group_rule" "primary_db_ingress" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = var.application_subnet_cidrs
  security_group_id = aws_security_group.primary_db.id
  description       = "Allow PostgreSQL access from application subnets"
}

resource "aws_security_group_rule" "primary_db_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.primary_db.id
  description       = "Allow all outbound traffic"
}

# Security group for secondary RDS cluster
resource "aws_security_group" "secondary_db" {
  provider    = aws.secondary
  name        = "rds-aurora-secondary-${var.environment_suffix}"
  description = "Security group for RDS Aurora secondary cluster"
  vpc_id      = aws_vpc.secondary.id

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-sg-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_security_group_rule" "secondary_db_ingress" {
  provider          = aws.secondary
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = var.application_subnet_cidrs
  security_group_id = aws_security_group.secondary_db.id
  description       = "Allow PostgreSQL access from application subnets"
}

resource "aws_security_group_rule" "secondary_db_egress" {
  provider          = aws.secondary
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.secondary_db.id
  description       = "Allow all outbound traffic"
}
