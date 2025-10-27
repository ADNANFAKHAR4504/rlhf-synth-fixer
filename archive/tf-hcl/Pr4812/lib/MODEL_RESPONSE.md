### Reasoning Trace
---

I'll create a comprehensive Terraform configuration file for a secure AWS environment with private networking and secure service access. Let's break this down into components:

1. **Provider configuration**
2. **VPC setup with private subnets**
3. **Security groups with tight restrictions**
4. **VPC endpoints for S3 and DynamoDB**
5. **VPC Flow Logs to CloudWatch**
6. **Lambda function for alerting**
7. **IAM roles and policies**

Let's build these components one by one:

```terraform
# Provider configuration
provider "aws" {
  region = "us-east-1"
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name = "financial-app-vpc"
  }
}

# Create private subnets across multiple AZs for high availability
resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    Name = "financial-app-private-subnet-1"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  
  tags = {
    Name = "financial-app-private-subnet-2"
  }
}

# Public subnets for NAT Gateway
resource "aws_subnet" "public_subnet_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.101.0/24"
  availability_zone = "us-east-1a"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "financial-app-public-subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.102.0/24"
  availability_zone = "us-east-1b"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "financial-app-public-subnet-2"
  }
}

# Internet Gateway for public subnets
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "financial-app-igw"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat_eip" {
  domain = "vpc"
  
  tags = {
    Name = "financial-app-nat-eip"
  }
}

# NAT Gateway
resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet_1.id
  
  tags = {
    Name = "financial-app-nat-gw"
  }
  
  depends_on = [aws_internet_gateway.igw]
}

# Route table for public subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  
  tags = {
    Name = "financial-app-public-rt"
  }
}

# Associate public route table with public subnets
resource "aws_route_table_association" "public_rta_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rta_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# Route table for private subnets
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }
  
  tags = {
    Name = "financial-app-private-rt"
  }
}

# Associate private route table with private subnets
resource "aws_route_table_association" "private_rta_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_rta_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private_rt.id
}

# Security Group for application
resource "aws_security_group" "app_sg" {
  name        = "financial-app-sg"
  description = "Security group for financial application"
  vpc_id      = aws_vpc.main.id
  
  # Restrict all inbound traffic by default
  ingress {
    description = "Allow internal traffic only"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  # Allow only necessary outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "financial-app-sg"
  }
}

# VPC Endpoints
# S3 Gateway Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
  
  tags = {
    Name = "financial-app-s3-endpoint"
  }
}

# Associate S3 endpoint with route tables
resource "aws_vpc_endpoint_route_table_association" "s3_private" {
  route_table_id  = aws_route_table.private_rt.id
  vpc_endpoint_id = aws_vpc_endpoint.s3.id
}

# DynamoDB Gateway Endpoint
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.dynamodb"
  
  tags = {
    Name = "financial-app-dynamodb-endpoint"
  }
}

# Associate DynamoDB endpoint with route tables
resource "aws_vpc_endpoint_route_table_association" "dynamodb_private" {
  route_table_id  = aws_route_table.private_rt.id
  vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  log_destination      = aws_cloudwatch_log_group.flow_log_group.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  iam_role_arn         = aws_iam_role.flow_log_role.arn
}

resource "aws_cloudwatch_log_group" "flow_log_group" {
  name              = "/aws/vpc/flowlogs/financial-app"
  retention_in_days = 90
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log_role" {
  name = "financial-app-flow-log-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "flow_log_policy" {
  name = "financial-app-flow-log-policy"
  role = aws_iam_role.flow_log_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# Lambda Function for Monitoring and Alerting
resource "aws_lambda_function" "monitoring_lambda" {
  function_name = "financial-app-monitoring"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs14.x"
  
  filename      = "lambda_function.zip"  # This would need to be created separately
  
  environment {
    variables = {
      LOG_GROUP = aws_cloudwatch_log_group.flow_log_group.name
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
    security_group_ids = [aws_security_group.app_sg.id]
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "financial-app-lambda-role"
  
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
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "financial-app-lambda-policy"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "sns:Publish"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Subscription for Lambda
resource "aws_cloudwatch_log_subscription_filter" "flow_log_filter" {
  name            = "financial-app-flow-log-filter"
  log_group_name  = aws_cloudwatch_log_group.flow_log_group.name
  filter_pattern  = "REJECT"  # Example: monitoring rejected traffic
  destination_arn = aws_lambda_function.monitoring_lambda.arn
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts_topic" {
  name = "financial-app-alerts"
}

# Lambda Permission to Allow CloudWatch to invoke the function
resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monitoring_lambda.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.flow_log_group.arn}:*"
}
```

I realized that I need to update the Lambda function to include both the code content and subscription to CloudWatch Logs properly. Let's make these adjustments:

```terraform
# Archive file for Lambda function
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"
  
  source {
    content  = <<EOF
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // Process VPC Flow Logs
  const records = event.awslogs.data;
  
  // Here you would implement your specific alert logic
  // For example, checking for patterns of suspicious activity
  // and sending alerts via SNS
  
  return { status: 'success' };
};
EOF
    filename = "index.js"
  }
}

# Lambda Function for Monitoring and Alerting
resource "aws_lambda_function" "monitoring_lambda" {
  function_name = "financial-app-monitoring"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs14.x"
  
  filename      = data.archive_file.lambda_zip.output_path
  
  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.alerts_topic.arn
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
    security_group_ids = [aws_security_group.app_sg.id]
  }
}
```

However, I realized that the Lambda function code I provided is a simplification - in a real-world scenario, you'd need more complex logic to decode and analyze the CloudWatch Logs. Let me improve this:

```terraform
# Archive file for Lambda function
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"
  
  source {
    content  = <<EOF
const zlib = require('zlib');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

exports.handler = async (event) => {
  // Decode and decompress CloudWatch Logs data
  const payload = Buffer.from(event.awslogs.data, 'base64');
  const decompressed = zlib.gunzipSync(payload).toString('utf8');
  const logData = JSON.parse(decompressed);
  
  console.log('Log data:', JSON.stringify(logData, null, 2));
  
  // Analyze log events for suspicious patterns
  const suspicious = logData.logEvents.filter(event => {
    const message = JSON.parse(event.message);
    
    // Example: Detect rejected traffic to sensitive services
    return (
      message.action === 'REJECT' && 
      (message.dstport === 22 || message.dstport === 3389)
    );
  });
  
  // Send alerts for suspicious events
  if (suspicious.length > 0) {
    const snsClient = new SNSClient({ region: process.env.AWS_REGION });
    const params = {
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Security Alert: Suspicious Network Activity Detected',
      Message: JSON.stringify(suspicious, null, 2)
    };
    
    try {
      const command = new PublishCommand(params);
      const response = await snsClient.send(command);
      console.log('Alert sent successfully:', response);
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }
  
  return { status: 'success', suspicious: suspicious.length };
};
EOF
    filename = "index.js"
  }
}
```

Now, let's compile all of this into a single, comprehensive terraform file for a secure, production-ready environment. I'll make sure all the components work together properly:

```terraform
provider "aws" {
  region = "us-east-1"
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name = "financial-app-vpc"
  }
}

# Create private subnets across multiple AZs for high availability
resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    Name = "financial-app-private-subnet-1"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  
  tags = {
    Name = "financial-app-private-subnet-2"
  }
}

# Public subnets for NAT Gateway
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.101.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "financial-app-public-subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.102.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "financial-app-public-subnet-2"
  }
}

# Internet Gateway for public subnets
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "financial-app-igw"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat_eip" {
  domain = "vpc"
  
  tags = {
    Name = "financial-app-nat-eip"
  }
}

# NAT Gateway
resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet_1.id
  
  tags = {
    Name = "financial-app-nat-gw"
  }
  
  depends_on = [aws_internet_gateway.igw]
}

# Route table for public subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  
  tags = {
    Name = "financial-app-public-rt"
  }
}

# Associate public route table with public subnets
resource "aws_route_table_association" "public_rta_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rta_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# Route table for private subnets
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }
  
  tags = {
    Name = "financial-app-private-rt"
  }
}

# Associate private route table with private subnets
resource "aws_route_table_association" "private_rta_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_rta_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private_rt.id
}

# Security Group for application
resource "aws_security_group" "app_sg" {
  name        = "financial-app-sg"
  description = "Security group for financial application"
  vpc_id      = aws_vpc.main.id
  
  # Restrict all inbound traffic by default
  ingress {
    description = "Allow internal traffic only"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  # Allow only necessary outbound traffic
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS outbound traffic"
  }
  
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP outbound traffic"
  }
  
  tags = {
    Name = "financial-app-sg"
  }
}

# VPC Endpoints
# S3 Gateway Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
  
  tags = {
    Name = "financial-app-s3-endpoint"
  }
}

# Associate S3 endpoint with route tables
resource "aws_vpc_endpoint_route_table_association" "s3_private" {
  route_table_id  = aws_route_table.private_rt.id
  vpc_endpoint_id = aws_vpc_endpoint.s3.id
}

# DynamoDB Gateway Endpoint
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.dynamodb"
  
  tags = {
    Name = "financial-app-dynamodb-endpoint"
  }
}

# Associate DynamoDB endpoint with route tables
resource "aws_vpc_endpoint_route_table_association" "dynamodb_private" {
  route_table_id  = aws_route_table.private_rt.id
  vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  log_destination      = aws_cloudwatch_log_group.flow_log_group.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  iam_role_arn         = aws_iam_role.flow_log_role.arn
}

resource "aws_cloudwatch_log_group" "flow_log_group" {
  name              = "/aws/vpc/flowlogs/financial-app"
  retention_in_days = 90
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log_role" {
  name = "financial-app-flow-log-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "flow_log_policy" {
  name = "financial-app-flow-log-policy"
  role = aws_iam_role.flow_log_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts_topic" {
  name = "financial-app-alerts"
}

# Archive file for Lambda function
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"
  
  source {
    content  = <<EOF
const zlib = require('zlib');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

exports.handler = async (event) => {
  // Decode and decompress CloudWatch Logs data
  const payload = Buffer.from(event.awslogs.data, 'base64');
  const decompressed = zlib.gunzipSync(payload).toString('utf8');
  const logData = JSON.parse(decompressed);
  
  console.log('Log data:', JSON.stringify(logData, null, 2));
  
  // Analyze log events for suspicious patterns
  const suspicious = logData.logEvents.filter(event => {
    const message = JSON.parse(event.message);
    
    // Example: Detect rejected traffic to sensitive services
    return (
      message.action === 'REJECT' && 
      (message.dstport === 22 || message.dstport === 3389)
    );
  });
  
  // Send alerts for suspicious events
  if (suspicious.length > 0) {
    const snsClient = new SNSClient({ region: process.env.AWS_REGION });
    const params = {
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Security Alert: Suspicious Network Activity Detected',
      Message: JSON.stringify(suspicious, null, 2)
    };
    
    try {
      const command = new PublishCommand(params);
      const response = await snsClient.send(command);
      console.log('Alert sent successfully:', response);
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }
  
  return { status: 'success', suspicious: suspicious.length };
};
EOF
    filename = "index.js"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "financial-app-lambda-role"
  
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
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "financial-app-lambda-policy"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:DescribeLogStreams",
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "sns:Publish"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# Lambda Function for Monitoring and Alerting
resource "aws_lambda_function" "monitoring_lambda" {
  function_name = "financial-app-monitoring"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs14.x"
  
  filename = data.archive_file.lambda_zip.output_path
  
  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.alerts_topic.arn
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
    security_group_ids = [aws_security_group.app_sg.id]
  }
}

# CloudWatch Log Subscription for Lambda
resource "aws_cloudwatch_log_subscription_filter" "flow_log_filter" {
  name            = "financial-app-flow-log-filter"
  log_group_name  = aws_cloudwatch_log_group.flow_log_group.name
  filter_pattern  = "REJECT"
  destination_arn = aws_lambda_function.monitoring_lambda.arn
  
  depends_on = [aws_lambda_permission.allow_cloudwatch]
}

# Lambda Permission to Allow CloudWatch to invoke the function
resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monitoring_lambda.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.flow_log_group.arn}:*"
}
```

This Terraform configuration establishes a complete, secure environment with:

1. A VPC with CIDR 10.0.0.0/16
2. Private subnets for application resources
3. Public subnets for NAT Gateway
4. Restrictive security groups
5. VPC endpoints for S3 and DynamoDB
6. VPC Flow Logs to CloudWatch
7. A Lambda function to monitor logs and alert on suspicious activity
8. SNS topic for sending alerts
9. Appropriate IAM roles and policies following least privilege

I realized I can make a few more improvements to make the infrastructure more robust:

1. Add resource encryption where possible
2. Ensure the Lambda function has proper dependencies
3. Implement AWS KMS for encryption keys
4. Add more specific tagging

Let me update the configuration:

```terraform
provider "aws" {
  region = "us-east-1"
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "financial-app-vpc"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# Create private subnets across multiple AZs for high availability
resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    Name        = "financial-app-private-subnet-1"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  
  tags = {
    Name        = "financial-app-private-subnet-2"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# Public subnets for NAT Gateway
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.101.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "financial-app-public-subnet-1"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.102.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "financial-app-public-subnet-2"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# Internet Gateway for public subnets
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name        = "financial-app-igw"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat_eip" {
  domain = "vpc"
  
  tags = {
    Name        = "financial-app-nat-eip"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# NAT Gateway
resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet_1.id
  
  tags = {
    Name        = "financial-app-nat-gw"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
  
  depends_on = [aws_internet_gateway.igw]
}

# Route table for public subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  
  tags = {
    Name        = "financial-app-public-rt"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# Associate public route table with public subnets
resource "aws_route_table_association" "public_rta_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rta_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# Route table for private subnets
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }
  
  tags = {
    Name        = "financial-app-private-rt"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# Associate private route table with private subnets
resource "aws_route_table_association" "private_rta_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_rta_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private_rt.id
}

# Security Group for application
resource "aws_security_group" "app_sg" {
  name        = "financial-app-sg"
  description = "Security group for financial application"
  vpc_id      = aws_vpc.main.id
  
  # Restrict all inbound traffic by default
  ingress {
    description = "Allow internal traffic only"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  # Allow only necessary outbound traffic
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS outbound traffic"
  }
  
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP outbound traffic"
  }
  
  tags = {
    Name        = "financial-app-sg"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# KMS Key for encryption
resource "aws_kms_key" "app_kms_key" {
  description             = "KMS key for financial application data encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name        = "financial-app-kms-key"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

resource "aws_kms_alias" "app_kms_alias" {
  name          = "alias/financial-app-key"
  target_key_id = aws_kms_key.app_kms_key.key_id
}

# Get current account ID
data "aws_caller_identity" "current" {}

# VPC Endpoints
# S3 Gateway Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
  
  tags = {
    Name        = "financial-app-s3-endpoint"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# Associate S3 endpoint with route tables
resource "aws_vpc_endpoint_route_table_association" "s3_private" {
  route_table_id  = aws_route_table.private_rt.id
  vpc_endpoint_id = aws_vpc_endpoint.s3.id
}

# DynamoDB Gateway Endpoint
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.dynamodb"
  
  tags = {
    Name        = "financial-app-dynamodb-endpoint"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# Associate DynamoDB endpoint with route tables
resource "aws_vpc_endpoint_route_table_association" "dynamodb_private" {
  route_table_id  = aws_route_table.private_rt.id
  vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  log_destination      = aws_cloudwatch_log_group.flow_log_group.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  iam_role_arn         = aws_iam_role.flow_log_role.arn
  
  tags = {
    Name        = "financial-app-vpc-flow-logs"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

resource "aws_cloudwatch_log_group" "flow_log_group" {
  name              = "/aws/vpc/flowlogs/financial-app"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.app_kms_key.arn
  
  tags = {
    Name        = "financial-app-flow-logs"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log_role" {
  name = "financial-app-flow-log-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "financial-app-flow-log-role"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy" "flow_log_policy" {
  name = "financial-app-flow-log-policy"
  role = aws_iam_role.flow_log_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.app_kms_key.arn
      }
    ]
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts_topic" {
  name              = "financial-app-alerts"
  kms_master_key_id = aws_kms_key.app_kms_key.id
  
  tags = {
    Name        = "financial-app-alerts"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# Archive file for Lambda function
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"
  
  source {
    content  = <<EOF
const zlib = require('zlib');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

exports.handler = async (event) => {
  // Decode and decompress CloudWatch Logs data
  const payload = Buffer.from(event.awslogs.data, 'base64');
  const decompressed = zlib.gunzipSync(payload).toString('utf8');
  const logData = JSON.parse(decompressed);
  
  console.log('Log data:', JSON.stringify(logData, null, 2));
  
  // Analyze log events for suspicious patterns
  const suspicious = logData.logEvents.filter(event => {
    const message = JSON.parse(event.message);
    
    // Example: Detect rejected traffic to sensitive services
    return (
      message.action === 'REJECT' && 
      (message.dstport === 22 || message.dstport === 3389)
    );
  });
  
  // Send alerts for suspicious events
  if (suspicious.length > 0) {
    const snsClient = new SNSClient({ region: process.env.AWS_REGION });
    const params = {
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Security Alert: Suspicious Network Activity Detected',
      Message: JSON.stringify(suspicious, null, 2)
    };
    
    try {
      const command = new PublishCommand(params);
      const response = await snsClient.send(command);
      console.log('Alert sent successfully:', response);
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }
  
  return { status: 'success', suspicious: suspicious.length };
};
EOF
    filename = "index.js"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "financial-app-lambda-role"
  
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
  
  tags = {
    Name        = "financial-app-lambda-role"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "financial-app-lambda-policy"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "sns:Publish"
        ]
        Effect   = "Allow"
        Resource = aws_sns_topic.alerts_topic.arn
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.app_kms_key.arn
      }
    ]
  })
}

# Lambda Function for Monitoring and Alerting
resource "aws_lambda_function" "monitoring_lambda" {
  function_name = "financial-app-monitoring"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs14.x"
  
  filename = data.archive_file.lambda_zip.output_path
  
  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.alerts_topic.arn
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
    security_group_ids = [aws_security_group.app_sg.id]
  }
  
  tags = {
    Name        = "financial-app-monitoring"
    Environment = "Production"
    Application = "FinancialApp"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Log Subscription for Lambda
resource "aws_cloudwatch_log_subscription_filter" "flow_log_filter" {
  name            = "financial-app-flow-log-filter"
  log_group_name  = aws_cloudwatch_log_group.flow_log_group.name
  filter_pattern  = "REJECT"
  destination_arn = aws_lambda_function.monitoring_lambda.arn
  
  depends_on = [aws_lambda_permission.allow_cloudwatch]
}

# Lambda Permission to Allow CloudWatch to invoke the function
resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monitoring_lambda.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.flow_log_group.arn}:*"
}
```

Now let me check and ensure this configuration is comprehensive and meets all the requirements:

1. ✓ VPC with CIDR 10.0.0.0/16
2. ✓ Private subnets for application resources
3. ✓ Public subnets for NAT Gateway
4. ✓ Restrictive security groups
5. ✓ VPC endpoints for S3 and DynamoDB
6. ✓ VPC Flow Logs to CloudWatch
7. ✓ A Lambda function to monitor logs and alert on suspicious activity
8. ✓ SNS topic for sending alerts
9. ✓ Appropriate IAM roles and policies following least privilege
10. ✓ KMS encryption for sensitive data
11. ✓ Proper tagging for all resources

This configuration meets all the specified requirements and provides a secure, private environment for the financial application. The infrastructure is entirely defined in Terraform with a focus on security, monitoring, and alerting capabilities.

Let's prepare this as the final version for the tap_stack.tf file, without any comments or explanations.
### Answer 
---

```terraform
provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "financial-app-vpc"
  }
}

resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "financial-app-private-subnet-1"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  tags = {
    Name = "financial-app-private-subnet-2"
  }
}

resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.101.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  tags = {
    Name = "financial-app-public-subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.102.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true
  tags = {
    Name = "financial-app-public-subnet-2"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "financial-app-igw"
  }
}

resource "aws_eip" "nat_eip" {
  domain = "vpc"
  tags = {
    Name = "financial-app-nat-eip"
  }
}

resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet_1.id
  tags = {
    Name = "financial-app-nat-gw"
  }
  depends_on = [aws_internet_gateway.igw]
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = {
    Name = "financial-app-public-rt"
  }
}

resource "aws_route_table_association" "public_rta_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rta_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }
  tags = {
    Name = "financial-app-private-rt"
  }
}

resource "aws_route_table_association" "private_rta_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_rta_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_security_group" "app_sg" {
  name        = "financial-app-sg"
  description = "Security group for financial application"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
    description = "Allow internal traffic only"
  }
  
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS outbound traffic"
  }
  
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP outbound traffic"
  }
  
  tags = {
    Name = "financial-app-sg"
  }
}

data "aws_caller_identity" "current" {}

resource "aws_kms_key" "app_kms_key" {
  description             = "KMS key for financial application data encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
  tags = {
    Name = "financial-app-kms-key"
  }
}

resource "aws_kms_alias" "app_kms_alias" {
  name          = "alias/financial-app-key"
  target_key_id = aws_kms_key.app_kms_key.key_id
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
  tags = {
    Name = "financial-app-s3-endpoint"
  }
}

resource "aws_vpc_endpoint_route_table_association" "s3_private" {
  route_table_id  = aws_route_table.private_rt.id
  vpc_endpoint_id = aws_vpc_endpoint.s3.id
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.dynamodb"
  tags = {
    Name = "financial-app-dynamodb-endpoint"
  }
}

resource "aws_vpc_endpoint_route_table_association" "dynamodb_private" {
  route_table_id  = aws_route_table.private_rt.id
  vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
}

resource "aws_cloudwatch_log_group" "flow_log_group" {
  name              = "/aws/vpc/flowlogs/financial-app"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.app_kms_key.arn
  tags = {
    Name = "financial-app-flow-logs"
  }
}

resource "aws_iam_role" "flow_log_role" {
  name = "financial-app-flow-log-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
  tags = {
    Name = "financial-app-flow-log-role"
  }
}

resource "aws_iam_role_policy" "flow_log_policy" {
  name = "financial-app-flow-log-policy"
  role = aws_iam_role.flow_log_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.app_kms_key.arn
      }
    ]
  })
}

resource "aws_flow_log" "vpc_flow_log" {
  log_destination      = aws_cloudwatch_log_group.flow_log_group.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  iam_role_arn         = aws_iam_role.flow_log_role.arn
  tags = {
    Name = "financial-app-vpc-flow-logs"
  }
}

resource "aws_sns_topic" "alerts_topic" {
  name              = "financial-app-alerts"
  kms_master_key_id = aws_kms_key.app_kms_key.id
  tags = {
    Name = "financial-app-alerts"
  }
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"
  source {
    content  = <<EOF
const zlib = require('zlib');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

exports.handler = async (event) => {
  const payload = Buffer.from(event.awslogs.data, 'base64');
  const decompressed = zlib.gunzipSync(payload).toString('utf8');
  const logData = JSON.parse(decompressed);
  
  console.log('Log data:', JSON.stringify(logData, null, 2));
  
  const suspicious = logData.logEvents.filter(event => {
    const message = JSON.parse(event.message);
    return (
      message.action === 'REJECT' && 
      (message.dstport === 22 || message.dstport === 3389)
    );
  });
  
  if (suspicious.length > 0) {
    const snsClient = new SNSClient({ region: process.env.AWS_REGION });
    const params = {
      TopicArn: process.env