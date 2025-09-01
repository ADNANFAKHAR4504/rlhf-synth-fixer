resource "aws_cloudwatch_log_group" "vpc1_ec2_logs" {
  name              = "/aws/ec2/vpc1"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-logs"
  })
}

resource "aws_cloudwatch_log_group" "vpc2_ec2_logs" {
  name              = "/aws/ec2/vpc2"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-logs"
  })
}