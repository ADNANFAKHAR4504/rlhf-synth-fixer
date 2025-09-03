resource "aws_cloudwatch_log_group" "vpc1_ec2_logs" {
  name              = "/aws/ec2/vpc1-${var.environment}"
  retention_in_days = 30
  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-logs-${var.environment}"
  })
}

resource "aws_cloudwatch_log_group" "vpc2_ec2_logs" {
  name              = "/aws/ec2/vpc2-${var.environment}"
  retention_in_days = 30
  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-logs-${var.environment}"
  })
}