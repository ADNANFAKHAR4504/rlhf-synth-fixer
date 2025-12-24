# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-lambda-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-lambda-role"
    }
  )
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-lambda-policy-"
  role        = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-payment-processor"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-lambda-logs"
    }
  )
}

# Lambda function code archive
data "archive_file" "lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = <<-EOT
      const { Client } = require('pg');

      exports.handler = async (event) => {
        console.log('Processing payment:', JSON.stringify(event));
        
        const client = new Client({
          host: process.env.DB_HOST.split(':')[0],
          port: 5432,
          database: process.env.DB_NAME,
          user: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
        });

        try {
          await client.connect();
          const result = await client.query('SELECT NOW()');
          console.log('Database connection successful:', result.rows[0]);
          
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Payment processed successfully',
              timestamp: result.rows[0].now
            })
          };
        } catch (error) {
          console.error('Error:', error);
          throw error;
        } finally {
          await client.end();
        }
      };
    EOT
    filename = "index.js"
  }
}

# Lambda Function
resource "aws_lambda_function" "main" {
  function_name = "${var.project_name}-${var.environment_suffix}-payment-processor"
  description   = "Payment processing function for ${var.environment}"

  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  role    = aws_iam_role.lambda.arn
  handler = "index.handler"
  runtime = "nodejs18.x"

  memory_size = var.memory_size
  timeout     = var.timeout

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = {
      ENVIRONMENT = var.environment
      DB_HOST     = var.db_host
      DB_NAME     = var.db_name
      DB_USERNAME = var.db_username
      DB_PASSWORD = var.db_password
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-payment-processor"
    }
  )
}
