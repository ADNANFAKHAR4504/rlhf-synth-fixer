resource "aws_flow_log" "main" {
  log_destination_type = "s3"
  log_destination      = "${var.s3_bucket_arn}/${var.log_prefix}"
  traffic_type         = "ALL"
  vpc_id               = var.vpc_id

  tags = merge(
    var.project_tags,
    {
      Name      = "${var.flow_log_name}-${var.environment_suffix}"
      ManagedBy = "terraform"
    }
  )
}
