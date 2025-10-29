# Archive Lambda layer code
data "archive_file" "common_dependencies_layer" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-src/layers/common-dependencies"
  output_path = "${path.module}/.terraform/lambda-layers/common-dependencies.zip"
}

# Common Dependencies Layer
resource "aws_lambda_layer_version" "common_dependencies" {
  filename                 = data.archive_file.common_dependencies_layer.output_path
  layer_name               = "${local.name_prefix}-common-dependencies"
  source_code_hash         = data.archive_file.common_dependencies_layer.output_base64sha256
  compatible_runtimes      = ["nodejs18.x"]
  compatible_architectures = ["arm64"]
  description              = "Common dependencies including AWS SDK, lodash, and monitoring utilities"

  license_info = "MIT"
}

# Layer Permission Policy
resource "aws_lambda_layer_version_permission" "common_dependencies" {
  layer_name     = aws_lambda_layer_version.common_dependencies.layer_name
  version_number = aws_lambda_layer_version.common_dependencies.version
  principal      = data.aws_caller_identity.current.account_id
  action         = "lambda:GetLayerVersion"
  statement_id   = "allow-account-usage"
}