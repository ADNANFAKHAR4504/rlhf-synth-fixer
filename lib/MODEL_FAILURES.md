# Terraform Configuration Issues and Fixes

This document identifies common failures, missing components, and incorrect configurations in Terraform infrastructure code.

---

## 1. PROVIDER CONFIGURATION FAILURES

### Missing S3 Backend Configuration
**Issue:**
```hcl
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

**Fix:**
```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}
```

**Issues:**
- Missing S3 backend configuration for remote state management
- Version constraint too restrictive (`~> 5.0` vs `>= 5.0`)

### Incorrect Peer Provider Configuration
**Issue:**
```hcl
provider "aws" {
  alias   = "peer"
  region  = var.peer_region
  
  assume_role {
    role_arn = var.peer_account_role_arn
  }
}
```

**Fix:**
```hcl
provider "aws" {
  alias  = "peer"
  region = var.peer_region
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}
```

**Issues:**
- Unnecessary `assume_role` configuration for same-account peering
- Missing `default_tags` configuration
- References non-existent `peer_account_role_arn` variable

---

## 2. VARIABLE CONFIGURATION FAILURES

### Unnecessary Variable
**Issue:**
```hcl
variable "peer_account_role_arn" {
  description = "IAM role ARN in peer account for VPC peering"
  type        = string
  sensitive   = true
}
```

**Fix:**
- Variable removed (not needed for same-account peering)

**Issues:**
- Unnecessary variable for same-account VPC peering

---

## 3. VPC CONFIGURATION FAILURES

### Missing Resource Naming with Regions
**Issue:**
```hcl
tags = {
  Name = "${var.project_name}-${var.environment}-vpc"
}
```

**Fix:**
```hcl
tags = {
  Name = "${var.project_name}-${var.environment}-vpc-${var.aws_region}"
}
```

**Issues:**
- Missing region suffix in resource names, causing naming conflicts in multi-region deployments

### Incorrect VPC Flow Logs Configuration
**Issue:**
```hcl
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_log.arn
  log_destination = aws_s3_bucket.logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}
```

**Fix:**
```hcl
# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs/${var.project_name}-${var.environment}-${var.aws_region}-${formatdate("YYYYMMDD-hhmm", timestamp())}"
  retention_in_days = 30
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}
```

**Issues:**
- VPC Flow Logs incorrectly configured to use S3 instead of CloudWatch Logs
- Missing CloudWatch Log Group for VPC Flow Logs
- Missing timestamp for log group name uniqueness

---

## 4. S3 CONFIGURATION FAILURES

### Missing S3 Lifecycle Filter
**Issue:**
```hcl
rule {
  id     = "retain-logs"
  status = "Enabled"
  
  transition {
    days          = 30
    storage_class = "STANDARD_IA"
  }
}
```

**Fix:**
```hcl
rule {
  id     = "retain-logs"
  status = "Enabled"

  filter {
    prefix = ""
  }

  transition {
    days          = 30
    storage_class = "STANDARD_IA"
  }
}
```

**Issues:**
- Missing required `filter` block in S3 lifecycle configuration

### Incorrect S3 Bucket Policy
**Issue:**
- CloudFront logging permissions (not needed for ALB origin)
- Missing CloudTrail logging permissions

**Fix:**
- Proper ALB and CloudTrail logging permissions
- CloudTrail bucket ACL permissions

**Issues:**
- Incorrect CloudFront logging permissions
- Missing CloudTrail logging permissions

---

## 5. LAMBDA CONFIGURATION FAILURES

### Incorrect Lambda Code Packaging
**Issue:**
```hcl
resource "null_resource" "lambda_zip" {
  provisioner "local-exec" {
    command = <<EOF
cat > index.py << 'LAMBDA'
import json
import os

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            'environment': os.environ.get('ENVIRONMENT', 'unknown')
        })
    }
LAMBDA
zip lambda.zip index.py
rm index.py
EOF
  }
}
```

**Fix:**
```hcl
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

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = local_file.lambda_code.filename
  output_path = "${path.module}/lambda.zip"
  depends_on  = [local_file.lambda_code, local_file.lambda_requirements]
}
```

**Issues:**
- Using `null_resource` with `local-exec` instead of proper Terraform resources
- Missing RDS connectivity in Lambda code
- Missing proper error handling and logging
- Missing `pymysql` dependency
- Missing environment variables for RDS connection

---

## 6. API GATEWAY CONFIGURATION FAILURES

### Incorrect API Gateway Deployment
**Issue:**
```hcl
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.lambda
  ]
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = var.environment
}
```

**Fix:**
```hcl
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.lambda
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
}
```

**Issues:**
- Invalid `stage_name` attribute in `aws_api_gateway_deployment` (not supported)

### Incorrect API Gateway URL Output
**Issue:**
```hcl
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = aws_api_gateway_deployment.main.invoke_url
}
```

**Fix:**
```hcl
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.main.stage_name}"
}
```

**Issues:**
- `aws_api_gateway_deployment.main.invoke_url` attribute doesn't exist
- Should construct URL using REST API ID, region, and stage name

---

## 7. CLOUDFRONT CONFIGURATION FAILURES

### Incorrect CloudFront Logging Configuration
**Issue:**
```hcl
logging_config {
  include_cookies = false
  bucket          = aws_s3_bucket.logs.bucket_domain_name
  prefix          = "cloudfront/"
}
```

**Fix:**
- Logging configuration removed

**Issues:**
- CloudFront logging requires S3 bucket with ACL access enabled
- Not needed for ALB origin

### Incorrect WAF Association
**Issue:**
```hcl
web_acl_id = aws_wafv2_web_acl.cloudfront.arn
```

**Fix:**
```hcl
# web_acl_id = aws_wafv2_web_acl.cloudfront.arn  # Commented out - CloudFront WAF must be in us-east-1
```

**Issues:**
- CloudFront WAF must be created in us-east-1 region
- WAF association should be commented out for regional deployments

---

## 8. RDS CONFIGURATION FAILURES

### Incorrect MySQL Version
**Issue:**
```hcl
engine_version = "8.0.35"
```

**Fix:**
```hcl
engine_version = "8.0.40"
```

**Issues:**
- Unsupported MySQL version (8.0.35 not available)

### Incorrect Deletion Protection
**Issue:**
```hcl
deletion_protection = true
```

**Fix:**
```hcl
deletion_protection = false
```

**Issues:**
- RDS deletion protection enabled (should be false for development/testing)

---

## 9. MISSING COMPONENTS

### Missing terraform.tfvars File
**Issue:**
- No terraform.tfvars file provided

**Fix:**
```hcl
# Example values for required variables
# Replace these with your actual values

project_name = "myapp"
environment  = "production"

# CIDR block allowed for SSH access (replace with your IP range)
allowed_ssh_cidr = "10.0.0.0/8"

# RDS master password (use AWS Secrets Manager in production)
rds_password = "YourSecurePassword123!"
```

**Issues:**
- Missing example terraform.tfvars file for easy deployment
