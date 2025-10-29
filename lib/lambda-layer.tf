# lambda-layer.tf

# Archive Lambda layer source
data "archive_file" "lambda_layer" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-layer"
  output_path = "${path.module}/.terraform/lambda-layer.zip"
}

# Lambda Layer for Shared Dependencies
resource "aws_lambda_layer_version" "dependencies" {
  layer_name               = local.lambda_layer_name
  filename                 = data.archive_file.lambda_layer.output_path
  source_code_hash         = data.archive_file.lambda_layer.output_base64sha256
  compatible_runtimes      = [var.lambda_runtime]
  compatible_architectures = [var.lambda_architecture]

  description = "Shared dependencies for webhook processing Lambda functions"
}
