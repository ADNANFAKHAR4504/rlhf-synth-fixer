# WAF Web ACL for Application Load Balancer
resource "aws_wafv2_web_acl" "main" {
  name  = "${local.name_prefix}-waf-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule 1: Rate limiting to prevent DDoS
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
      metric_name                = "${local.name_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"

        # Exclude specific rules if needed
        rule_action_override {
          name = "SizeRestrictions_BODY"
          action_to_use {
            count {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-common-rule-set"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: AWS Managed Rules - SQL Injection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesSQLiRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-sqli"
      sampled_requests_enabled   = true
    }
  }

  # Rule 5: Geo-blocking (example: block specific countries if needed)
  # Only created if blocked_countries list is not empty
  dynamic "rule" {
    for_each = length(var.blocked_countries) > 0 ? [1] : []

    content {
      name     = "GeoBlockingRule"
      priority = 5

      action {
        count {} # Using count for monitoring, change to block if needed
      }

      statement {
        geo_match_statement {
          country_codes = var.blocked_countries
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name_prefix}-geo-block"
        sampled_requests_enabled   = true
      }
    }
  }

  # Rule 6: IP Reputation List
  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 6

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesAmazonIpReputationList"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  # Rule 7: Custom IP whitelist (allow specific IPs)
  # Note: Removed overly restrictive User-Agent rule that was blocking legitimate traffic
  dynamic "rule" {
    for_each = length(var.allowed_ip_addresses) > 0 ? [1] : []

    content {
      name     = "IPWhitelistRule"
      priority = 7

      action {
        allow {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.whitelist[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name_prefix}-ip-whitelist"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-waf-acl"
  })
}

# IP Set for whitelisted IPs (optional)
resource "aws_wafv2_ip_set" "whitelist" {
  count = length(var.allowed_ip_addresses) > 0 ? 1 : 0

  name               = "${local.name_prefix}-ip-whitelist"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.allowed_ip_addresses

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ip-whitelist"
  })
}

# IP Set for blacklisted IPs
resource "aws_wafv2_ip_set" "blacklist" {
  name               = "${local.name_prefix}-ip-blacklist"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.blocked_ip_addresses

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ip-blacklist"
  })
}

# Rule for IP blacklist
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = module.alb.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# CloudWatch Log Group for WAF logs
# Note: WAFv2 requires log group name to start with "aws-waf-logs-"
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${local.name_prefix}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-waf-logs"
  })
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = ["${aws_cloudwatch_log_group.waf.arn}:*"]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}
