# Model Failures - E-Commerce Monitoring Infrastructure

## Overview

This document tracks errors encountered during the development of a comprehensive CloudWatch monitoring and alerting system for an e-commerce platform. The infrastructure includes VPC networking, EC2 web servers, RDS PostgreSQL database, Application Load Balancer, Lambda functions for custom metrics, CloudWatch monitoring, and SNS alerting.

## Error Summary

## Error 1: Security Group Naming Violation

### Description

Terraform plan failed with error "invalid value for name (cannot begin with sg-)" when attempting to create three security groups for the Application Load Balancer, EC2 instances, and RDS database. The error occurred on lines 173, 183, and 193 of main.tf during resource validation.

### Root Cause

AWS reserves the "sg-" prefix for auto-generated security group IDs. When AWS creates a security group, it assigns an identifier like "sg-0123456789abcdef0" for internal tracking. Using this prefix in custom security group names conflicts with AWS naming conventions and is explicitly prohibited by the AWS API.

The model attempted to create security groups with names following the pattern "sg-{resource}-production", which violated this AWS restriction.

### Impact

**Impact Type:** Operational

**Severity:** Medium

**Details:** This error prevents infrastructure deployment entirely. Security groups are foundational networking components required before EC2 instances, RDS databases, and load balancers can be created. Without functioning security groups, the entire monitoring infrastructure cannot be deployed, blocking the project from addressing the business need for proactive monitoring and alerting.

### Fix Applied

```hcl
# BEFORE - Incorrect naming with sg- prefix
resource "aws_security_group" "alb" {
  name        = "sg-alb-production"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-alb-production"
  }
}

resource "aws_security_group" "ec2" {
  name        = "sg-ec2-production"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-ec2-production"
  }
}

resource "aws_security_group" "rds" {
  name        = "sg-rds-production"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-rds-production"
  }
}

# AFTER - Corrected naming without reserved prefix
resource "aws_security_group" "alb" {
  name        = "alb-production"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-alb-production"
  }
}

resource "aws_security_group" "ec2" {
  name        = "ec2-production"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-ec2-production"
  }
}

resource "aws_security_group" "rds" {
  name        = "rds-production"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-rds-production"
  }
}
```

The fix removes the "sg-" prefix from the name attribute while retaining it in the Name tag for human readability. AWS uses the name attribute for API operations but the tag only for display purposes.

### Prevention Strategy

**Rule:** Never use AWS reserved resource prefixes in custom resource names.

**Reserved Prefixes:**
- Security Groups: sg-
- VPCs: vpc-
- Subnets: subnet-
- Internet Gateways: igw-
- Network Interfaces: eni-
- NAT Gateways: nat-
- Route Tables: rtb-

**Best Practice:** Use descriptive names without prefixes for the name attribute, and include prefixes only in tags for visual identification. For example, name the security group "alb-production" but tag it "sg-alb-production" to maintain clarity in the console while avoiding API conflicts.

**Validation:** Before deployment, review all AWS resource names against the AWS service documentation for reserved prefixes. Implement pre-commit hooks or linting rules that detect and flag reserved prefixes in Terraform resource names.

***

## Error 2: Invalid Metric Filter Pattern

### Description

CloudWatch Logs metric filter creation failed with "InvalidParameterException: Invalid metric filter pattern" when attempting to create a filter for tracking failed login attempts. The error occurred during terraform apply when creating the aws_cloudwatch_log_metric_filter.failed_logins resource on line 466 of main.tf.

### Root Cause

CloudWatch Logs metric filter patterns use a specific syntax that differs from general regular expressions or boolean logic. The model attempted to use a complex pattern with OR logic (||) and structured log parsing syntax that is not supported by CloudWatch Logs filter pattern grammar.

The attempted pattern was:
```
[time, id, level=ERROR, msg=*failed*login*] || [time, id, level=ERROR, msg=*authentication*failed*]
```

CloudWatch Logs filter patterns do not support the OR operator (||) or structured field extraction in this format. The service expects either space-delimited terms for term-based filtering or JSON field extraction syntax for JSON logs.

### Impact

**Impact Type:** Operational

**Severity:** Medium

**Details:** This error prevents security monitoring capabilities from functioning. Failed login tracking is critical for detecting credential stuffing attacks, brute force attempts, and unauthorized access attempts against customer accounts. Without this metric filter, security events go undetected, and the corresponding CloudWatch alarm cannot function, leaving the e-commerce platform vulnerable to account compromise attacks.

### Fix Applied

```hcl
# BEFORE - Invalid pattern with OR logic and structured parsing
resource "aws_cloudwatch_log_metric_filter" "failed_logins" {
  name           = "metricfilter-failed-logins-production"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[time, id, level=ERROR, msg=*failed*login*] || [time, id, level=ERROR, msg=*authentication*failed*]"

  metric_transformation {
    name      = "FailedLoginAttempts"
    namespace = "Production/ECommerce"
    value     = "1"
  }
}

# AFTER - Simple term-based pattern
resource "aws_cloudwatch_log_metric_filter" "failed_logins" {
  name           = "metricfilter-failed-logins-production"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "?failed ?login ?authentication"

  metric_transformation {
    name      = "FailedLoginAttempts"
    namespace = "Production/ECommerce"
    value     = "1"
  }
}
```

The corrected pattern uses term-based filtering with the question mark prefix, which makes terms optional. The pattern matches any log entry containing "failed", "login", or "authentication" in any combination, providing flexible matching for various authentication failure message formats.

### Prevention Strategy

**Rule:** Always reference CloudWatch Logs filter pattern syntax documentation before creating metric filters.

**Valid Pattern Types:**
1. Term-based: Space-delimited terms, use ? prefix for optional terms
2. JSON field extraction: {$.fieldName = value} for JSON logs
3. Space-delimited extraction: [field1, field2=value, field3] for structured text

**Testing Approach:** Test filter patterns using the CloudWatch Logs Insights console before implementing in Terraform. The console provides immediate feedback on pattern syntax and allows validation against actual log data.

**Best Practice:** For complex matching requirements involving multiple conditions, create separate metric filters rather than attempting complex boolean logic in a single pattern. CloudWatch alarms can then combine multiple metrics using metric math expressions.

***

## Error 3: Composite Alarm Missing Dependencies

### Description

CloudWatch composite alarm creation failed with "ValidationError: Could not save the composite alarm as alarms in the alarm rule do not exist" during terraform apply. The error occurred when creating aws_cloudwatch_composite_alarm.infrastructure on line 762, referencing three alarms that had not yet been created in AWS.

### Root Cause

Terraform's dependency graph did not correctly establish the creation order between individual CloudWatch metric alarms and the composite alarm that references them. While Terraform automatically creates dependencies when using resource attributes directly, the composite alarm's alarm_rule attribute contains alarm names as strings within an expression, which Terraform cannot parse for implicit dependencies.

The composite alarm attempted to reference:
- alarm-ec2-cpu-1-production
- alarm-ec2-cpu-2-production  
- alarm-rds-connections-production

However, these alarms had not completed creation in AWS before the composite alarm creation was attempted, causing the AWS API to reject the composite alarm configuration.

### Impact

**Impact Type:** Operational

**Severity:** Medium

**Details:** This error prevents intelligent multi-component failure detection from functioning. The composite alarm is designed to trigger only when both web server CPU utilization is high AND database connections are saturated, indicating a systemic problem rather than isolated component issues. Without the composite alarm, operations teams receive excessive false positive alerts from individual alarms, leading to alert fatigue and potentially missing real incidents that require immediate attention.

### Fix Applied

```hcl
# BEFORE - Missing explicit dependencies
resource "aws_cloudwatch_composite_alarm" "infrastructure" {
  alarm_name          = "composite-infrastructure-production"
  alarm_description   = "Composite alarm for multiple infrastructure failures"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alerts.arn]

  alarm_rule = "(ALARM('alarm-ec2-cpu-1-production') OR ALARM('alarm-ec2-cpu-2-production')) AND ALARM('alarm-rds-connections-production')"

  tags = {
    Name = "composite-infrastructure-production"
  }
}

# AFTER - Explicit dependencies and string interpolation
resource "aws_cloudwatch_composite_alarm" "infrastructure" {
  alarm_name          = "composite-infrastructure-production"
  alarm_description   = "Composite alarm for multiple infrastructure failures"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alerts.arn]

  alarm_rule = "(ALARM(${aws_cloudwatch_metric_alarm.ec2_cpu_1.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.ec2_cpu_2.alarm_name})) AND ALARM(${aws_cloudwatch_metric_alarm.rds_connections.alarm_name})"

  depends_on = [
    aws_cloudwatch_metric_alarm.ec2_cpu_1,
    aws_cloudwatch_metric_alarm.ec2_cpu_2,
    aws_cloudwatch_metric_alarm.rds_connections
  ]

  tags = {
    Name = "composite-infrastructure-production"
  }
}
```

The fix adds explicit depends_on declarations to ensure the referenced alarms are created first, and uses string interpolation to reference alarm names from resource attributes rather than hardcoded strings. This ensures both correct dependencies and protection against alarm name changes.

### Prevention Strategy

**Rule:** Always use explicit depends_on for composite alarms that reference other alarms by name.

**Best Practice:** Use string interpolation for alarm names in composite alarm rules rather than hardcoded strings. This ensures that:
1. Terraform establishes correct dependencies
2. Alarm name changes are automatically reflected
3. Typos are caught at plan time rather than apply time

**Pattern:**
```hcl
alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.name.alarm_name})"
depends_on = [aws_cloudwatch_metric_alarm.name]
```

**Validation:** After adding composite alarms, always review the terraform graph to verify dependency relationships are correctly established. Use "terraform graph" and visualize with Graphviz to identify missing dependencies.

***

## Error 4: CloudWatch Dashboard Invalid Metric Syntax

### Description

CloudWatch dashboard creation failed with "InvalidParameterInput: The dashboard body is invalid, there are 8 validation errors" during terraform apply. The errors indicated invalid metric field types and incorrect array lengths in the dashboard JSON structure on line 776 of main.tf.

### Root Cause

CloudWatch dashboard metric array syntax requires a specific structure that differs from other AWS service configurations. The model used an incorrect format with metric options as objects in the third position of the array, but CloudWatch expects dimensions in alternating name-value pairs starting at position three, with options appearing only at the end of the array.

**Incorrect Structure:**
```
["Namespace", "MetricName", {options}, {dimensions}]
```

**Correct Structure:**
```
["Namespace", "MetricName", "DimensionName", "DimensionValue", {options}]
```

Additionally, some metrics included more than two items when using the shorthand "..." syntax for repeated namespace/metric combinations, violating CloudWatch's validation rules.

### Impact

**Impact Type:** Operational

**Severity:** Medium

**Details:** This error prevents centralized visibility into infrastructure health and application performance. The CloudWatch dashboard provides the single pane of glass for monitoring EC2 CPU utilization, RDS connections, Lambda metrics, order processing times, and ALB health status. Without the dashboard, operations teams must navigate between multiple AWS console pages to assess system health, significantly increasing mean time to detect (MTTD) for incidents and making it difficult to correlate issues across components during troubleshooting.

### Fix Applied

```hcl
# BEFORE - Incorrect metric array structure
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "dashboard-ecommerce-production"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", { id = "m1", stat = "Average", label = "EC2 Instance 1" }, { "InstanceId" = aws_instance.web_1.id }],
            [".", ".", { id = "m2", stat = "Average", label = "EC2 Instance 2" }, { "InstanceId" = aws_instance.web_2.id }]
          ]
          # Additional configuration
        }
      }
    ]
  })
}

# AFTER - Correct metric array structure with dimensions
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "dashboard-ecommerce-production"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.web_1.id, { stat = "Average", label = "EC2 Instance 1" }],
            ["...", aws_instance.web_2.id, { stat = "Average", label = "EC2 Instance 2" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "EC2 CPU Utilization"
          start  = "-PT24H"
          annotations = {
            horizontal = [
              {
                label = "Alarm Threshold"
                value = 80
              }
            ]
          }
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.main.id]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "RDS Database Connections"
          start  = "-PT24H"
          annotations = {
            horizontal = [
              {
                label = "Alarm Threshold"
                value = 150
              }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.metrics.function_name, { stat = "Sum", label = "Invocations" }],
            [".", "Errors", ".", ".", { stat = "Sum", label = "Errors" }],
            [".", "Throttles", ".", ".", { stat = "Sum", label = "Throttles" }]
          ]
          view    = "timeSeries"
          stacked = true
          period  = 300
          stat    = "Sum"
          region  = "us-east-1"
          title   = "Lambda Metrics"
          start   = "-PT24H"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["Production/ECommerce", "OrderProcessingTime"]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Order Processing Time"
          start  = "-PT24H"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 24
        width  = 12
        height = 3
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HealthyHostCount", "TargetGroup", aws_lb_target_group.main.arn_suffix, "LoadBalancer", aws_lb.main.arn_suffix],
            [".", "UnHealthyHostCount", ".", ".", ".", "."]
          ]
          view   = "singleValue"
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "ALB Target Health"
          start  = "-PT1H"
        }
      }
    ]
  })
}
```

The corrected structure places dimensions in alternating name-value pairs immediately after the metric name, uses the "..." shorthand correctly for repeated namespace/metric combinations, and includes proper widget positioning with x, y, width, and height attributes for dashboard layout.

### Prevention Strategy

**Rule:** Always structure CloudWatch dashboard metrics as alternating dimension name-value pairs with options last.

**Metric Array Format:**
```
["Namespace", "MetricName", "DimensionName1", "DimensionValue1", "DimensionName2", "DimensionValue2", {...options}]
```

**Shorthand Syntax:** Use "..." to repeat namespace, "." to repeat metric name, and "." for each dimension value being repeated. Maximum two items when using shorthand.

**Testing Approach:** Build dashboard widgets interactively in the AWS CloudWatch console first, then use the "View/edit source" feature to export the correct JSON structure. This provides validated syntax that can be translated directly into Terraform jsonencode blocks.

**Best Practice:** Add widget positioning (x, y, width, height) to ensure consistent dashboard layout across deployments. Without explicit positioning, widgets may appear in unexpected locations or overlap.

**Validation:** Before applying dashboard changes, test the JSON structure by creating a temporary dashboard in the console with the "Source" editor to catch syntax errors before deployment.

***

## Lessons Learned

### AWS Service Constraints

Understanding AWS service-specific constraints is critical for successful infrastructure deployment. Reserved resource naming prefixes, CloudWatch Logs filter pattern syntax, and dashboard metric array structures are service-specific details that require consultation of AWS documentation rather than general Terraform knowledge.

### Dependency Management

Terraform's automatic dependency detection has limitations when resources are referenced through string expressions rather than direct attribute access. Complex resources like composite alarms require explicit depends_on declarations to ensure correct creation order.

### Testing Strategy

Validating AWS-specific syntax through the AWS console before implementing in Terraform significantly reduces error rates. Interactive console features provide immediate feedback and validated JSON structures that can be adapted for Terraform code.

### Documentation Requirements

Clear documentation of AWS service constraints and Terraform patterns prevents repeated errors. This MODEL_FAILURES document serves as a reference for future infrastructure development, capturing institutional knowledge about common pitfalls and their solutions.

---

## Conclusion

All four errors were configuration-related issues stemming from misunderstanding AWS service constraints and CloudWatch-specific syntax requirements. None represented fundamental architecture flaws or security vulnerabilities. The fixes applied follow AWS best practices and Terraform conventions, resulting in a production-ready monitoring infrastructure that provides comprehensive visibility into the e-commerce platform's health and performance.

The corrected infrastructure successfully deploys and provides:
- Real-time monitoring of EC2, RDS, Lambda, and ALB resources
- Intelligent alerting with composite alarm logic
- Centralized logging with security event tracking
- Custom business metrics for order processing times
- Unified dashboard for infrastructure visibility