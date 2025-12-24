# General application log group
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/${var.project_name}/${var.environment_suffix}/application"
  retention_in_days = var.retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-app-logs"
    }
  )
}

# Payment processing log group
resource "aws_cloudwatch_log_group" "payment" {
  name              = "/aws/${var.project_name}/${var.environment_suffix}/payment"
  retention_in_days = var.retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-payment-logs"
    }
  )
}
