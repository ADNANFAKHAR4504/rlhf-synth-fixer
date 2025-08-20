resource "aws_flow_log" "main" {
  iam_role_arn    = var.flow_log_role_arn
  log_destination = aws_cloudwatch_log_group.main.arn
  traffic_type    = "ALL"
  vpc_id          = var.vpc_id
}

resource "aws_cloudwatch_log_group" "main" {
  name_prefix = "${var.project_name}-log-group"
}
