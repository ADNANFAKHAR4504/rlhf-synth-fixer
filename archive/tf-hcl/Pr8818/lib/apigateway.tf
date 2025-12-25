# API Gateway REST API
resource "aws_api_gateway_rest_api" "payment_api" {
  provider    = aws.primary
  name        = "${local.resource_prefix}-payment-api-${local.current_region}"
  description = "Payment Processing API in ${local.current_region}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-payment-api-${local.current_region}"
    }
  )
}

# API Gateway Resource
resource "aws_api_gateway_resource" "payment" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = "payment"
}

# API Gateway Method
resource "aws_api_gateway_method" "payment_post" {
  provider      = aws.primary
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.payment.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration with Lambda
resource "aws_api_gateway_integration" "payment_lambda" {
  provider                = aws.primary
  rest_api_id             = aws_api_gateway_rest_api.payment_api.id
  resource_id             = aws_api_gateway_resource.payment.id
  http_method             = aws_api_gateway_method.payment_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_processor.invoke_arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "apigw" {
  provider      = aws.primary
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "payment" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.payment_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.payment.id,
      aws_api_gateway_method.payment_post.id,
      aws_api_gateway_integration.payment_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.payment_lambda
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "payment" {
  provider      = aws.primary
  deployment_id = aws_api_gateway_deployment.payment.id
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  stage_name    = var.environment_suffix

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-payment-stage-${local.current_region}"
    }
  )
}

# API Gateway Account (for CloudWatch logging)
resource "aws_api_gateway_account" "main" {
  provider            = aws.primary
  cloudwatch_role_arn = data.aws_iam_role.apigateway_cloudwatch.arn
}
