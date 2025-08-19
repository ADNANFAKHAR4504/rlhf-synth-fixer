data "aws_cloudtrail" "main" {
  name = "${var.project_name}-trail"
}
