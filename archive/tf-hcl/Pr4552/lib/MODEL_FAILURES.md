## Error 1: Incorrect User Data Encoding Attribute

**Issue**: Used user_data attribute with base64encode() function instead of user_data_base64.

**Original Code**:
```
resource "aws_instance" "webapp_instance" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  availability_zone      = var.availability_zone
  subnet_id              = aws_subnet.webapp_subnet.id
  private_ip             = local.private_ip
  vpc_security_group_ids = [aws_security_group.webapp_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.webapp_instance_profile.name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  user_data = base64encode(local.user_data_script)

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "webapp-instance"
    }
  )
}
```

**Error Message**:
```
Warning: Value is base64 encoded

  with aws_instance.webapp_instance,
  on main.tf line 233, in resource "aws_instance" "webapp_instance":
 233:   user_data = base64encode(local.user_data_script)

The value is base64 encoded. If you want to use base64 encoding, please use the user_data_base64 argument. user_data attribute is set as cleartext in state
```

**Corrected Code**:
```
resource "aws_instance" "webapp_instance" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  availability_zone      = var.availability_zone
  subnet_id              = aws_subnet.webapp_subnet.id
  private_ip             = local.private_ip
  vpc_security_group_ids = [aws_security_group.webapp_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.webapp_instance_profile.name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  user_data_base64 = base64encode(local.user_data_script)

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "webapp-instance"
    }
  )
}
```

## Error 2: Missing CloudWatch Monitoring

**Issue**: Infrastructure lacked operational monitoring with CloudWatch alarms and SNS notifications, reducing production readiness.

**Original Code**: No monitoring infrastructure present in original code.

**Root Cause**: The model focused on basic infrastructure requirements but missed critical operational monitoring needed for production environments. Without monitoring, operational issues would go undetected.

**Fix Applied**:
```hcl
# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "webapp_alerts" {
  name = "webapp-alerts-${random_string.unique_suffix.result}"
  tags = merge(local.common_tags, { Name = "webapp-alerts" })
}

resource "aws_sns_topic_subscription" "webapp_alerts_email" {
  topic_arn = aws_sns_topic.webapp_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "instance_cpu_high" {
  alarm_name          = "webapp-cpu-${random_string.unique_suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.webapp_alerts.arn]
  dimensions = { InstanceId = aws_instance.webapp_instance.id }
  tags = merge(local.common_tags, { Name = "webapp-cpu-alarm" })
}

# Additional alarms for status checks and EBS throughput...
```

**Prevention**: Include operational monitoring as a core requirement for all production infrastructure, not an optional enhancement.

**AWS Best Practice**: CloudWatch alarms with SNS notifications are essential for production workloads to ensure rapid incident response.

---

## Error 3: Missing VPC Flow Logs

**Issue**: Infrastructure lacked VPC Flow Logs for security compliance and network traffic monitoring.

**Original Code**: No VPC Flow Logs configuration present.

**Root Cause**: The model did not include security compliance requirements for network monitoring, which are critical for production environments and security auditing.

**Fix Applied**:
```hcl
# VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/webapp-${random_string.unique_suffix.result}"
  retention_in_days = 7
  tags = merge(local.common_tags, { Name = "webapp-vpc-flow-logs" })
}

resource "aws_iam_role" "vpc_flow_log_role" {
  name = "webapp-vpc-flow-log-role-${random_string.unique_suffix.result}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "vpc-flow-logs.amazonaws.com" }
    }]
  })
  tags = merge(local.common_tags, { Name = "webapp-vpc-flow-log-role" })
}

resource "aws_flow_log" "webapp_vpc_flow_log" {
  iam_role_arn    = aws_iam_role.vpc_flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.webapp_vpc.id
  tags = merge(local.common_tags, { Name = "webapp-vpc-flow-log" })
}
```

**Prevention**: Include VPC Flow Logs as a standard security requirement for all VPC-based infrastructure.

**AWS Best Practice**: VPC Flow Logs are essential for security compliance, network troubleshooting, and audit requirements in production environments.

---

## Error 4: Limited Cost Allocation Tags

**Issue**: Infrastructure had only 4 cost allocation tags instead of the recommended 6+ for comprehensive financial tracking.

**Original Code**:
```hcl
locals {
  common_tags = {
    Environment = "production"
    ManagedBy   = "terraform"
    Project     = "webapp"
    CreatedAt   = timestamp()
  }
}
```

**Root Cause**: The model included basic tagging but missed comprehensive cost allocation tags needed for detailed billing analysis and cost optimization.

**Fix Applied**:
```hcl
locals {
  common_tags = {
    Environment  = "production"
    ManagedBy    = "terraform"
    Project      = "webapp"
    CostCenter   = "engineering"
    Application  = "web-application"
    Owner        = "infrastructure-team"
  }
}
```

**Prevention**: Define comprehensive tagging strategy including CostCenter, Application, and Owner tags for all resources.

**AWS Best Practice**: Use detailed cost allocation tags to enable accurate billing analysis, cost optimization, and resource ownership tracking.

---

## Error 5: timestamp() in Tags Causes Plan Inconsistencies

**Issue**: Used `timestamp()` function in tags which causes "Provider produced inconsistent final plan" errors on subsequent runs.

**Original Code**:
```hcl
locals {
  common_tags = {
    Environment = "production"
    ManagedBy   = "terraform"
    Project     = "webapp"
    CreatedAt   = timestamp()
  }
}
```

**Error Message**: "Provider produced inconsistent final plan" due to timestamp() changing on each plan.

**Root Cause**: The `timestamp()` function returns different values on each Terraform run, causing the plan to be inconsistent and preventing successful applies.

**Fix Applied**: Removed the `CreatedAt = timestamp()` line completely.

**Prevention**: Avoid using time-based functions in resource configurations that cause plan inconsistencies.

**AWS Best Practice**: Use static values for tags or generate timestamps external to Terraform configuration.

---

## Summary

The MODEL_RESPONSE required **5 critical infrastructure fixes** to reach production-ready state:

1. Fix user_data encoding to use user_data_base64 attribute
2. Add CloudWatch monitoring with alarms and SNS notifications
3. Add VPC Flow Logs for security compliance
4. Enhance cost allocation tags for financial tracking
5. Remove timestamp() function to prevent plan inconsistencies
