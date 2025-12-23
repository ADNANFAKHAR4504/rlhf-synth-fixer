# waf.tf

# WAF v2 Web ACL
resource "aws_wafv2_web_acl" "main" {
  name        = "waf-acl-${var.environment_suffix}"
  description = "WAF ACL for ALB with SQL injection and XSS protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # SQL Injection Rule
  rule {
    name     = "SQLInjectionRule"
    priority = 1

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesSQLiRuleSet"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionRule"
      sampled_requests_enabled   = true
    }
  }

  # XSS Protection Rule
  rule {
    name     = "XSSProtectionRule"
    priority = 2

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "XSSProtectionRule"
      sampled_requests_enabled   = true
    }
  }

  # Common Rule Set
  rule {
    name     = "CommonRuleSet"
    priority = 3

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rate Limiting Rule
  rule {
    name     = "RateLimitRule"
    priority = 4

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "WAFWebACL"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "waf-acl-${var.environment_suffix}"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }
}

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  name              = "/aws/wafv2/acl-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "waf-logs-${var.environment_suffix}"
  }
}
