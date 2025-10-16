# modules/security/main.tf - Security Module Main Configuration

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security Group for VPC-A
resource "aws_security_group" "vpc_a" {
  name_prefix = "vpc-a-peering-sg-${var.suffix}"
  description = "Security group for VPC-A allowing traffic from VPC-B"
  vpc_id      = var.vpc_a_id

  tags = merge(var.common_tags, {
    Name        = "vpc-a-peering-sg-${var.suffix}"
    VPC         = "VPC-A"
    Description = "Allows traffic from VPC-B on specified ports"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Ingress rules for VPC-A from VPC-B
resource "aws_vpc_security_group_ingress_rule" "vpc_a_from_vpc_b" {
  for_each = toset(["443", "8080"])

  security_group_id = aws_security_group.vpc_a.id
  cidr_ipv4         = var.vpc_b_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"
  description       = "Allow port ${each.value} from VPC-B"

  tags = merge(var.common_tags, {
    Name = "vpc-a-ingress-${each.value}-${var.suffix}"
  })
}

# Egress rules for VPC-A to VPC-B
resource "aws_vpc_security_group_egress_rule" "vpc_a_to_vpc_b" {
  for_each = toset(["443", "8080"])

  security_group_id = aws_security_group.vpc_a.id
  cidr_ipv4         = var.vpc_b_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"
  description       = "Allow port ${each.value} to VPC-B"

  tags = merge(var.common_tags, {
    Name = "vpc-a-egress-${each.value}-${var.suffix}"
  })
}

# Security Group for VPC-B
resource "aws_security_group" "vpc_b" {
  name_prefix = "vpc-b-peering-sg-${var.suffix}"
  description = "Security group for VPC-B allowing traffic from VPC-A"
  vpc_id      = var.vpc_b_id

  tags = merge(var.common_tags, {
    Name        = "vpc-b-peering-sg-${var.suffix}"
    VPC         = "VPC-B"
    Description = "Allows traffic from VPC-A on specified ports"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Ingress rules for VPC-B from VPC-A
resource "aws_vpc_security_group_ingress_rule" "vpc_b_from_vpc_a" {
  for_each = toset(["443", "3306"])

  security_group_id = aws_security_group.vpc_b.id
  cidr_ipv4         = var.vpc_a_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"
  description       = "Allow port ${each.value} from VPC-A"

  tags = merge(var.common_tags, {
    Name = "vpc-b-ingress-${each.value}-${var.suffix}"
  })
}

# Egress rules for VPC-B to VPC-A
resource "aws_vpc_security_group_egress_rule" "vpc_b_to_vpc_a" {
  for_each = toset(["443", "3306"])

  security_group_id = aws_security_group.vpc_b.id
  cidr_ipv4         = var.vpc_a_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"
  description       = "Allow port ${each.value} to VPC-A"

  tags = merge(var.common_tags, {
    Name = "vpc-b-egress-${each.value}-${var.suffix}"
  })
}

# ============================================================================
# IAM ROLE FOR VPC FLOW LOGS
# ============================================================================

resource "aws_iam_role" "flow_logs" {
  name_prefix = "vpc-flow-logs-role-${var.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "vpc-flow-logs-role-${var.suffix}"
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  name_prefix = "vpc-flow-logs-policy-${var.suffix}"
  role        = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${var.account_id}:*"
      }
    ]
  })
}

# ============================================================================
# AWS WAF Web ACL for Additional Protection
# ============================================================================

resource "aws_wafv2_web_acl" "vpc_protection" {
  name  = "vpc-peering-protection-${var.suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "SQLiRule"
    priority = 2

    action {
      block {}
    }

    statement {
      sqli_match_statement {
        field_to_match {
          body {
            oversize_handling = "MATCH"
          }
        }

        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }

        text_transformation {
          priority = 1
          type     = "HTML_ENTITY_DECODE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "vpc-peering-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(var.common_tags, {
    Name = "vpc-peering-waf-${var.suffix}"
  })
}

