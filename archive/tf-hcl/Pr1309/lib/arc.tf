# Application Recovery Controller Cluster
resource "aws_route53recoverycontrolconfig_cluster" "main" {
  provider = aws.arc
  name     = "${local.resource_prefix}-cluster"
}

# Application Recovery Controller Control Panel
resource "aws_route53recoverycontrolconfig_control_panel" "main" {
  provider    = aws.arc
  name        = "${local.resource_prefix}-control-panel"
  cluster_arn = aws_route53recoverycontrolconfig_cluster.main.arn
}

# Routing Control for Primary Region
resource "aws_route53recoverycontrolconfig_routing_control" "primary" {
  provider          = aws.arc
  name              = "${local.resource_prefix}-primary-routing"
  cluster_arn       = aws_route53recoverycontrolconfig_cluster.main.arn
  control_panel_arn = aws_route53recoverycontrolconfig_control_panel.main.arn
}

# Routing Control for Secondary Region  
resource "aws_route53recoverycontrolconfig_routing_control" "secondary" {
  provider          = aws.arc
  name              = "${local.resource_prefix}-secondary-routing"
  cluster_arn       = aws_route53recoverycontrolconfig_cluster.main.arn
  control_panel_arn = aws_route53recoverycontrolconfig_control_panel.main.arn
}

# Safety Rule - Assertion Rule (At least one region should be active)
resource "aws_route53recoverycontrolconfig_safety_rule" "assertion" {
  provider          = aws.arc
  name              = "${local.resource_prefix}-assertion-rule"
  control_panel_arn = aws_route53recoverycontrolconfig_control_panel.main.arn
  rule_config {
    inverted  = false
    threshold = 1
    type      = "ATLEAST"
  }

  asserted_controls = [
    aws_route53recoverycontrolconfig_routing_control.primary.arn,
    aws_route53recoverycontrolconfig_routing_control.secondary.arn
  ]

  wait_period_ms = 5000
}

# Health Check with Routing Control for Primary
resource "aws_route53_health_check" "primary_routing_control" {
  type                = "RECOVERY_CONTROL"
  routing_control_arn = aws_route53recoverycontrolconfig_routing_control.primary.arn

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-routing-control-health"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Health Check with Routing Control for Secondary
resource "aws_route53_health_check" "secondary_routing_control" {
  type                = "RECOVERY_CONTROL"
  routing_control_arn = aws_route53recoverycontrolconfig_routing_control.secondary.arn

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-routing-control-health"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Recovery Group
resource "aws_route53recoveryreadiness_recovery_group" "main" {
  recovery_group_name = "${local.resource_prefix}-recovery-group"

  cells = [
    aws_route53recoveryreadiness_cell.primary.arn,
    aws_route53recoveryreadiness_cell.secondary.arn
  ]

  tags = local.common_tags
}

# Cell for Primary Region
resource "aws_route53recoveryreadiness_cell" "primary" {
  cell_name = "${local.resource_prefix}-primary-cell"

  cells = []

  tags = local.common_tags
}

# Cell for Secondary Region
resource "aws_route53recoveryreadiness_cell" "secondary" {
  cell_name = "${local.resource_prefix}-secondary-cell"

  cells = []

  tags = local.common_tags
}

# Resource Set for Primary Region ALB
resource "aws_route53recoveryreadiness_resource_set" "primary" {
  resource_set_name = "${local.resource_prefix}-primary-resources"
  resource_set_type = "AWS::ElasticLoadBalancingV2::LoadBalancer"

  resources {
    resource_arn = aws_lb.primary.arn
  }

  tags = local.common_tags
}

# Resource Set for Secondary Region ALB
resource "aws_route53recoveryreadiness_resource_set" "secondary" {
  resource_set_name = "${local.resource_prefix}-secondary-resources"
  resource_set_type = "AWS::ElasticLoadBalancingV2::LoadBalancer"

  resources {
    resource_arn = aws_lb.secondary.arn
  }

  tags = local.common_tags
}

# ARC Readiness Check - Primary Region
resource "aws_route53recoveryreadiness_readiness_check" "primary" {
  readiness_check_name = "${local.resource_prefix}-primary-readiness"
  resource_set_name    = aws_route53recoveryreadiness_resource_set.primary.resource_set_name

  tags = local.common_tags
}

# ARC Readiness Check - Secondary Region
resource "aws_route53recoveryreadiness_readiness_check" "secondary" {
  readiness_check_name = "${local.resource_prefix}-secondary-readiness"
  resource_set_name    = aws_route53recoveryreadiness_resource_set.secondary.resource_set_name

  tags = local.common_tags
}