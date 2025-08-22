# Lambda function
resource "aws_lambda_function" "example" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.project_prefix}-example-lambda"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.9"
  timeout          = 30

  vpc_config {
    subnet_ids         = [aws_subnet.public["dev-${var.availability_zones[0]}"].id]
    security_group_ids = [aws_security_group.lambda["dev"].id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-example-lambda"
  })

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
  ]
}

# Lambda function code
resource "local_file" "lambda_code" {
  content  = <<-EOT
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Hello from Lambda!'
    }
EOT
  filename = "${path.module}/lambda_function.py"
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = local_file.lambda_code.filename
  output_path = "${path.module}/lambda_function.zip"
  depends_on  = [local_file.lambda_code]
}