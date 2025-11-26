# Model Failures and Common Issues

This document captures common failure patterns when generating Terraform infrastructure code for serverless payment processing systems.

## Resource Configuration Failures

### 1. Lambda Container Image Configuration
**Issue**: Models frequently generate incorrect Lambda container configurations
- Using `filename` instead of `image_uri` for container-based functions
- Missing `package_type = "Image"` configuration
- Incorrect ECR repository URL references

**Solution**: Always specify `package_type = "Image"` and use proper ECR URI format:
```hcl
resource "aws_lambda_function" "example" {
  package_type = "Image"
  image_uri    = "${aws_ecr_repository.example.repository_url}:${var.image_tag}"
  # NOT filename = "lambda.zip"
}
```

### 2. IAM Policy Overpermissioning
**Issue**: Generated IAM policies often grant excessive permissions
- Using `"*"` resources when specific ARNs are available
- Granting admin-level permissions instead of least privilege
- Missing condition statements for enhanced security

**Solution**: Use specific resource ARNs and minimal required actions:
```hcl
policy = jsonencode({
  Statement = [{
    Effect   = "Allow"
    Action   = ["dynamodb:GetItem", "dynamodb:PutItem"]
    Resource = aws_dynamodb_table.specific_table.arn
    # NOT Resource = "*"
  }]
})
```

### 3. Circular Dependencies
**Issue**: Models create resource dependencies that form circular references
- Lambda function depending on SQS queue that references the Lambda
- API Gateway depending on Lambda that needs API Gateway ARN
- Step Functions referencing Lambda functions that don't exist yet

**Solution**: Use explicit `depends_on` and break circular references:
```hcl
resource "aws_lambda_function" "processor" {
  # Configuration without circular reference
  depends_on = [aws_iam_role_policy.lambda_policy]
}
```

## Networking and VPC Issues

### 1. Subnet Configuration Errors
**Issue**: Incorrect subnet configurations for multi-AZ deployments
- Using hardcoded availability zones that may not exist
- Creating subnets with overlapping CIDR blocks
- Missing subnet associations with route tables

**Solution**: Use data sources and proper CIDR calculations:
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "private" {
  count             = 2
  availability_zone = data.aws_availability_zones.available.names[count.index]
  cidr_block        = "10.0.${count.index + 1}.0/24"
}
```

### 2. Security Group Ingress/Egress Rules
**Issue**: Overly permissive or missing security group rules
- Opening all ports (0.0.0.0/0 on all protocols)
- Missing egress rules for outbound connections
- Incorrect port ranges for specific services

**Solution**: Use principle of least privilege:
```hcl
resource "aws_security_group" "vpc_endpoints" {
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]  # Not 0.0.0.0/0
  }
}
```

## API Gateway and Integration Problems

### 1. Missing Lambda Permissions
**Issue**: API Gateway cannot invoke Lambda functions
- Forgetting `aws_lambda_permission` resource
- Incorrect source ARN patterns
- Missing integration configurations

**Solution**: Always include Lambda permissions:
```hcl
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
```

### 2. Deployment and Stage Issues
**Issue**: API Gateway changes not deployed properly
- Missing `aws_api_gateway_deployment` resource
- Deployment not depending on method/integration changes
- Stage configuration missing throttling/logging

**Solution**: Proper deployment with dependencies:
```hcl
resource "aws_api_gateway_deployment" "api" {
  depends_on = [
    aws_api_gateway_method.method,
    aws_api_gateway_integration.integration
  ]
  
  lifecycle {
    create_before_destroy = true
  }
}
```

## Step Functions and State Machine Errors

### 1. Invalid State Machine Definitions
**Issue**: JSON state machine definitions with syntax errors
- Malformed JSON in `definition` field
- Invalid state transitions
- Missing required fields like `StartAt`

**Solution**: Validate JSON structure and state transitions:
```hcl
definition = jsonencode({
  Comment = "Valid state machine"
  StartAt = "FirstState"
  States = {
    FirstState = {
      Type = "Task"
      Resource = aws_lambda_function.handler.arn
      End = true
    }
  }
})
```

### 2. Missing IAM Permissions for State Machines
**Issue**: Step Functions cannot invoke Lambda functions
- Missing `lambda:InvokeFunction` permissions
- Incorrect resource ARNs in policies
- No assume role policy for Step Functions service

## SQS and Event Source Mapping Issues

### 1. Lambda Concurrency and SQS Processing
**Issue**: Lambda functions overwhelm downstream services
- No reserved concurrency limits
- Batch size too large for processing capacity
- Missing dead letter queue configuration

**Solution**: Configure appropriate limits:
```hcl
resource "aws_lambda_function" "processor" {
  reserved_concurrent_executions = 50
}

resource "aws_lambda_event_source_mapping" "sqs" {
  batch_size = 10  # Appropriate for processing capacity
}
```

## DynamoDB Configuration Problems

### 1. Partition Key and Attribute Mismatches
**Issue**: DynamoDB table definitions with inconsistent attributes
- Hash key attribute not defined in `attribute` blocks
- Using wrong attribute types (S vs N vs B)
- Missing GSI attribute definitions

**Solution**: Ensure attribute consistency:
```hcl
resource "aws_dynamodb_table" "table" {
  hash_key = "webhook_id"
  
  attribute {
    name = "webhook_id"  # Must match hash_key
    type = "S"
  }
}
```

## Error Resolution Strategies

### 1. Terraform Plan and Apply Workflow
1. Always run `terraform plan` before `apply`
2. Review resource changes carefully
3. Use `-target` for incremental deployments
4. Enable debug logging: `TF_LOG=DEBUG terraform apply`

### 2. AWS CloudTrail for Debugging
1. Check CloudTrail for API call failures
2. Review IAM policy evaluation logs
3. Verify service quotas and limits

### 3. Resource-Specific Debugging
1. **Lambda**: Check CloudWatch logs and function configuration
2. **API Gateway**: Test endpoints and check execution logs
3. **IAM**: Use IAM policy simulator
4. **VPC**: Verify route tables and security groups

## Prevention Best Practices

### 1. Code Review Checklist
- [ ] All IAM policies follow least privilege
- [ ] No hardcoded values (use variables)
- [ ] Proper resource naming conventions
- [ ] Dependencies explicitly defined
- [ ] Error handling implemented

### 2. Testing Strategies
- [ ] Unit tests for resource configuration
- [ ] Integration tests for end-to-end workflows
- [ ] Security scanning of generated code
- [ ] Cost estimation before deployment

### 3. Documentation Standards
- [ ] Resource purpose clearly documented
- [ ] Variable descriptions provided
- [ ] Output values documented
- [ ] Architecture diagrams included

These patterns and solutions help avoid common pitfalls when generating complex serverless infrastructure with AI models.