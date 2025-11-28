# WAF Web ACL for ALB
resource "aws_wafv2_web_acl" "alb" {
  name  = "waf-${local.env_suffix}-${random_string.unique_suffix.result}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # SQL Injection Rule
  rule {
    name     = "sql-injection-rule"
    priority = 1

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "sql-injection-rule"
      sampled_requests_enabled   = true
    }
  }

  # XSS Rule
  rule {
    name     = "xss-rule"
    priority = 2

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "xss-rule"
      sampled_requests_enabled   = true
    }
  }

  # Common Rule Set
  rule {
    name     = "common-rule-set"
    priority = 3

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "common-rule-set"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "loan-processing-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "loan-processing-waf-${local.env_suffix}"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.alb.arn
}
