# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-${var.environment}-lambda-sg-${var.aws_region}"
  description = "Security group for Lambda function"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-lambda-sg-${var.aws_region}"
  }
}

# Lambda function
resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-api-${var.aws_region}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_HOST     = aws_db_instance.main.endpoint
      DB_NAME     = aws_db_instance.main.db_name
      DB_USERNAME = aws_db_instance.main.username
      DB_PASSWORD = var.rds_password
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-${var.aws_region}"
  }
}

# Create Lambda function code
resource "local_file" "lambda_code" {
  filename = "${path.module}/index.py"
  content  = <<EOF
import json
import os
import pymysql
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = pymysql.connect(
            host=os.environ['DB_HOST'],
            user=os.environ['DB_USERNAME'],
            password=os.environ['DB_PASSWORD'],
            database=os.environ['DB_NAME'],
            port=3306,
            connect_timeout=10,
            read_timeout=10,
            write_timeout=10
        )
        return connection
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise

def handler(event, context):
    """Lambda handler function"""
    try:
        # Get database connection
        conn = get_db_connection()
        
        with conn.cursor() as cursor:
            # Test query
            cursor.execute("SELECT VERSION() as version, NOW() as current_time")
            result = cursor.fetchone()
            
            response_data = {
                'message': 'Hello from Lambda with RDS!',
                'environment': os.environ.get('ENVIRONMENT', 'unknown'),
                'database_version': result[0] if result else 'Unknown',
                'database_time': str(result[1]) if result else 'Unknown',
                'connection_status': 'Success'
            }
            
        conn.close()
        
        return {
            'statusCode': 200,
            'body': json.dumps(response_data),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
        
    except Exception as e:
        logger.error(f"Error in Lambda handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
EOF
}

# Create requirements.txt for Lambda dependencies
resource "local_file" "lambda_requirements" {
  filename = "${path.module}/requirements.txt"
  content  = <<EOF
pymysql==1.1.0
EOF
}

# Create Lambda zip file with dependencies
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = local_file.lambda_code.filename
  output_path = "${path.module}/lambda.zip"
  depends_on  = [local_file.lambda_code, local_file.lambda_requirements]
}
