resource "aws_lambda_function" "search_function" {
  function_name    = "${var.app_name}-search"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  filename         = "${path.module}/search_function.zip"
  source_code_hash = filebase64sha256("${path.module}/search_function.zip")
  timeout          = 30
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private_subnets[*].id
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.search_data.name
      REDIS_ENDPOINT = aws_elasticache_cluster.redis_cache.cache_nodes[0].address
      REDIS_PORT     = aws_elasticache_cluster.redis_cache.cache_nodes[0].port
      EVENT_BUS      = aws_cloudwatch_event_bus.notification_bus.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name        = "${var.app_name}-search-function"
    Environment = var.environment
  }
}