# Commented out - AWS Config already configured in this account with delivery channel limit
# AWS only allows one Config delivery channel per region
# Keeping Config role and S3 bucket for potential future use

# resource "aws_config_configuration_recorder" "main" {
#   name     = "${var.environment_suffix}-${var.project_name}-config-recorder"
#   role_arn = aws_iam_role.config_role.arn
#
#   recording_group {
#     all_supported                 = true
#     include_global_resource_types = true
#   }
#
#   depends_on = [aws_config_delivery_channel.main]
# }
#
# resource "aws_config_delivery_channel" "main" {
#   name           = "${var.environment_suffix}-${var.project_name}-config-delivery-channel"
#   s3_bucket_name = aws_s3_bucket.config_logs.id
# }