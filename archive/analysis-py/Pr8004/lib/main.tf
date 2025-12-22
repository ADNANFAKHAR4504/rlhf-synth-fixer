# main.tf - Currency Exchange API Infrastructure

locals {
  env_suffix = coalesce(var.environmentSuffix, var.environment_suffix)
}

resource "random_id" "lambda_suffix" {
  byte_length = 4
}

resource "local_file" "lambda_code" {
  content  = <<-EOT
    exports.handler = async (event) => {
      console.log('Event:', JSON.stringify(event, null, 2));
      const apiVersion = process.env.API_VERSION || '1.0.0';
      const ratePrecision = parseInt(process.env.RATE_PRECISION || '4', 10);

      try {
        const body = JSON.parse(event.body || '{}');
        const { fromCurrency, toCurrency, amount } = body;

        if (!fromCurrency || !toCurrency || !amount) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*.example.com'
            },
            body: JSON.stringify({
              error: 'Missing required parameters: fromCurrency, toCurrency, amount',
              apiVersion
            })
          };
        }

        const exchangeRates = {
          'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0, 'INR': 74.5 },
          'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 129.5, 'INR': 87.8 },
          'GBP': { 'USD': 1.37, 'EUR': 1.16, 'JPY': 150.7, 'INR': 102.1 }
        };

        if (!exchangeRates[fromCurrency] || !exchangeRates[fromCurrency][toCurrency]) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*.example.com'
            },
            body: JSON.stringify({
              error: `Unsupported currency pair: $${fromCurrency} to $${toCurrency}`,
              apiVersion
            })
          };
        }

        const rate = exchangeRates[fromCurrency][toCurrency];
        const convertedAmount = (amount * rate).toFixed(ratePrecision);

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*.example.com'
          },
          body: JSON.stringify({
            fromCurrency,
            toCurrency,
            amount: parseFloat(amount),
            rate,
            convertedAmount: parseFloat(convertedAmount),
            timestamp: new Date().toISOString(),
            apiVersion
          })
        };
      } catch (error) {
        console.error('Error:', error);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*.example.com'
          },
          body: JSON.stringify({
            error: 'Internal server error',
            message: error.message,
            apiVersion
          })
        };
      }
    };
  EOT
  filename = "${path.module}/lambda_function_payload/index.js"
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"
  source_dir  = "${path.module}/lambda_function_payload"

  depends_on = [local_file.lambda_code]
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/currency-converter-${local.env_suffix}-${random_id.lambda_suffix.hex}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "currency-converter-logs-${local.env_suffix}"
  }
}

resource "aws_iam_role" "lambda_execution" {
  name = "currency-converter-lambda-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "currency-converter-lambda-role-${local.env_suffix}"
  }
}

data "aws_iam_policy" "lambda_basic_execution" {
  arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

data "aws_iam_policy" "xray_write" {
  arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_xray" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = data.aws_iam_policy.xray_write.arn
}

resource "aws_lambda_function" "currency_converter" {
  function_name = "currency-converter-${local.env_suffix}-${random_id.lambda_suffix.hex}"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  # Reserved concurrency removed to avoid account limit issues
  # reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      API_VERSION    = var.api_version
      RATE_PRECISION = tostring(var.rate_precision)
    }
  }

  tracing_config {
    mode = "Active"
  }

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_iam_role_policy_attachment.lambda_logs,
    aws_iam_role_policy_attachment.lambda_xray
  ]

  tags = {
    Name = "currency-converter-${local.env_suffix}"
  }
}

resource "aws_api_gateway_rest_api" "currency_api" {
  name        = "currency-exchange-api-${local.env_suffix}"
  description = "Serverless currency exchange rate API"

  endpoint_configuration {
    types = ["EDGE"]
  }

  tags = {
    Name = "currency-exchange-api-${local.env_suffix}"
  }
}

resource "aws_api_gateway_resource" "convert" {
  rest_api_id = aws_api_gateway_rest_api.currency_api.id
  parent_id   = aws_api_gateway_rest_api.currency_api.root_resource_id
  path_part   = "convert"
}

resource "aws_api_gateway_method" "convert_post" {
  rest_api_id      = aws_api_gateway_rest_api.currency_api.id
  resource_id      = aws_api_gateway_resource.convert.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_method" "convert_options" {
  rest_api_id   = aws_api_gateway_rest_api.currency_api.id
  resource_id   = aws_api_gateway_resource.convert.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.currency_api.id
  resource_id             = aws_api_gateway_resource.convert.id
  http_method             = aws_api_gateway_method.convert_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.currency_converter.invoke_arn
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = aws_api_gateway_rest_api.currency_api.id
  resource_id = aws_api_gateway_resource.convert.id
  http_method = aws_api_gateway_method.convert_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.currency_api.id
  resource_id = aws_api_gateway_resource.convert.id
  http_method = aws_api_gateway_method.convert_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.currency_api.id
  resource_id = aws_api_gateway_resource.convert.id
  http_method = aws_api_gateway_method.convert_options.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*.example.com'"
  }

  depends_on = [aws_api_gateway_integration.options_integration]
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.currency_converter.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.currency_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.currency_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.convert.id,
      aws_api_gateway_method.convert_post.id,
      aws_api_gateway_integration.lambda_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_integration.options_integration
  ]
}

resource "aws_api_gateway_stage" "v1" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.currency_api.id
  stage_name    = "v1"

  xray_tracing_enabled = true

  variables = {
    lambdaAlias = "production"
  }

  tags = {
    Name = "currency-api-v1-${local.env_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/currency-api-${local.env_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "currency-api-logs-${local.env_suffix}"
  }
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "currency-api-gateway-cloudwatch-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "currency-api-gateway-cloudwatch-${local.env_suffix}"
  }
}

data "aws_iam_policy" "api_gateway_push_logs" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_iam_role_policy_attachment" "api_gateway_logs" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = data.aws_iam_policy.api_gateway_push_logs.arn
}

resource "aws_api_gateway_account" "api_gateway_account" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.currency_api.id
  stage_name  = aws_api_gateway_stage.v1.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled    = true
    logging_level      = "INFO"
    data_trace_enabled = true

    throttling_rate_limit  = var.api_throttle_rate_limit
    throttling_burst_limit = var.api_throttle_burst_limit
  }

  depends_on = [aws_api_gateway_account.api_gateway_account]
}

resource "aws_api_gateway_api_key" "currency_api_key" {
  name    = "currency-api-key-${local.env_suffix}"
  enabled = true

  tags = {
    Name = "currency-api-key-${local.env_suffix}"
  }
}

resource "aws_api_gateway_usage_plan" "currency_usage_plan" {
  name = "currency-api-usage-plan-${local.env_suffix}"

  api_stages {
    api_id = aws_api_gateway_rest_api.currency_api.id
    stage  = aws_api_gateway_stage.v1.stage_name
  }

  quota_settings {
    limit  = 300000
    period = "MONTH"
  }

  throttle_settings {
    rate_limit  = var.api_throttle_rate_limit
    burst_limit = var.api_throttle_burst_limit
  }

  tags = {
    Name = "currency-api-usage-plan-${local.env_suffix}"
  }
}

resource "aws_api_gateway_usage_plan_key" "currency_usage_plan_key" {
  key_id        = aws_api_gateway_api_key.currency_api_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.currency_usage_plan.id
}
