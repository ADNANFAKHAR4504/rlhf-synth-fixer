# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "alb-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 80
  to_port     = 80
  ip_protocol = "tcp"
  description = "Allow HTTP from anywhere (temporary for testing)"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
  description = "Allow HTTPS from anywhere"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_ec2" {
  security_group_id = aws_security_group.alb.id

  referenced_security_group_id = aws_security_group.ec2.id
  from_port                    = 80
  to_port                      = 80
  ip_protocol                  = "tcp"
  description                  = "Allow HTTP to EC2 instances"
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "ec2-sg-${var.environment_suffix}-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "ec2-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "ec2_from_alb" {
  security_group_id = aws_security_group.ec2.id

  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 80
  to_port                      = 80
  ip_protocol                  = "tcp"
  description                  = "Allow HTTP from ALB"
}

resource "aws_vpc_security_group_egress_rule" "ec2_to_internet" {
  security_group_id = aws_security_group.ec2.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
  description = "Allow HTTPS to internet"
}

resource "aws_vpc_security_group_egress_rule" "ec2_to_rds" {
  security_group_id = aws_security_group.ec2.id

  referenced_security_group_id = aws_security_group.rds.id
  from_port                    = 3306
  to_port                      = 3306
  ip_protocol                  = "tcp"
  description                  = "Allow MySQL to RDS"
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "rds-sg-${var.environment_suffix}-"
  description = "Security group for RDS MySQL"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "rds-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_ec2" {
  security_group_id = aws_security_group.rds.id

  referenced_security_group_id = aws_security_group.ec2.id
  from_port                    = 3306
  to_port                      = 3306
  ip_protocol                  = "tcp"
  description                  = "Allow MySQL from EC2"
}

resource "aws_vpc_security_group_egress_rule" "rds_deny_all" {
  security_group_id = aws_security_group.rds.id

  cidr_ipv4   = "127.0.0.1/32"
  ip_protocol = "-1"
  description = "Deny all egress"
}
