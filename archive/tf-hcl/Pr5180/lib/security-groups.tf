# security-groups.tf - Security group rules for database access

# Security group for Aurora cluster
resource "aws_security_group" "aurora" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-sg"
  description = "Security group for Aurora Serverless cluster"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Allow MySQL traffic from application security groups
resource "aws_security_group_rule" "aurora_ingress_mysql" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  security_group_id        = aws_security_group.aurora.id
  source_security_group_id = aws_security_group.application.id
  description              = "MySQL access from application servers"
}

# Allow MySQL traffic from specific CIDR blocks (for bastion/admin access)
resource "aws_security_group_rule" "aurora_ingress_admin" {
  count = length(var.admin_cidr_blocks) > 0 ? 1 : 0

  type              = "ingress"
  from_port         = 3306
  to_port           = 3306
  protocol          = "tcp"
  security_group_id = aws_security_group.aurora.id
  cidr_blocks       = var.admin_cidr_blocks
  description       = "MySQL access from admin networks"
}

# Egress rule for Aurora
resource "aws_security_group_rule" "aurora_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.aurora.id
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
}

# Security group for application servers (placeholder for app infrastructure)
resource "aws_security_group" "application" {
  name        = "${var.project_name}-${var.environment_suffix}-app-sg"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-app-sg"
    }
  )
}

# Add variable for admin CIDR blocks
variable "admin_cidr_blocks" {
  description = "CIDR blocks allowed to access Aurora for administration"
  type        = list(string)
  default     = []
}