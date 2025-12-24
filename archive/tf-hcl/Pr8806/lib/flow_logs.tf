# flow_logs.tf - VPC Flow Logs with S3 and CloudWatch destinations
# NOTE: VPC Flow Logs disabled for LocalStack compatibility
# LocalStack has issues with max_aggregation_interval parameter

# # VPC Flow Logs to S3
# resource "aws_flow_log" "vpc_to_s3" {
#   vpc_id               = aws_vpc.main.id
#   traffic_type         = "ALL"
#   log_destination_type = "s3"
#   log_destination      = aws_s3_bucket.flow_logs.arn
#
#   tags = {
#     Name = "vpc-flow-logs-s3-${var.environment_suffix}"
#   }
# }

# # VPC Flow Logs to CloudWatch
# resource "aws_flow_log" "vpc_to_cloudwatch" {
#   vpc_id          = aws_vpc.main.id
#   traffic_type    = "ALL"
#   iam_role_arn    = aws_iam_role.flow_logs.arn
#   log_destination = aws_cloudwatch_log_group.flow_logs.arn
#
#   tags = {
#     Name = "vpc-flow-logs-cloudwatch-${var.environment_suffix}"
#   }
# }
