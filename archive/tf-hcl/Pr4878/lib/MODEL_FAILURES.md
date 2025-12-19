# Model Failures Comparison

## 1. Missing Application Load Balancer (ALB)
**Failure**: MODEL_RESPONSE completely lacks ALB infrastructure
- No ALB security group
- No Application Load Balancer resource
- No target group for ECS tasks
- No HTTP listener
- No ALB outputs (`alb_dns_name`, `alb_url`)
**Impact**: ECS tasks in private subnets cannot be accessed from the internet, making the service unreachable

## 2. Incorrect ECS Service Deployment Configuration Syntax
**Failure**: Uses deprecated `deployment_configuration` block
```hcl
deployment_configuration {
  maximum_percent         = 200
  minimum_healthy_percent = 100
}
```
**Should be**: Top-level arguments (as in IDEAL_RESPONSE)
```hcl
deployment_minimum_healthy_percent = 100
deployment_maximum_percent         = 200
```
**Impact**: Terraform deployment will fail with "Unsupported argument" error

## 3. Missing VPC Resources
**Failure**: Requires external VPC (`vpc_id` and `private_subnet_ids` variables)
**Should be**: Creates VPC internally with `vpc_cidr` variable
- Missing VPC creation
- Missing Internet Gateway
- Missing public/private subnets
- Missing NAT Gateway and routing
**Impact**: User must manually create VPC infrastructure separately, complicating deployment

## 4. ECS Security Group Missing Ingress Rules
**Failure**: Only has egress rules, no ingress from ALB
```hcl
# Only egress, no ingress
egress {
  from_port   = 0
  to_port     = 0
  protocol    = "-1"
  cidr_blocks = ["0.0.0.0/0"]
}
```
**Should be**: Allow ingress from ALB security group
```hcl
ingress {
  from_port       = var.container_port
  to_port         = var.container_port
  protocol        = "tcp"
  security_groups = [aws_security_group.alb.id]
  description     = "Allow traffic from ALB"
}
```
**Impact**: Even if ALB existed, it couldn't communicate with ECS tasks

## 5. ECS Service Not Connected to Load Balancer
**Failure**: Missing `load_balancer` block in ECS service
**Should include**:
```hcl
load_balancer {
  target_group_arn = aws_lb_target_group.app.arn
  container_name   = "app"
  container_port   = var.container_port
}
```
**Impact**: ALB would not route traffic to ECS tasks even if configured

## 6. Syntax Error in Buildspec
**Failure**: Typo in IMAGE_TAG variable assignment
```bash
IMAGE_TAG=$${emmanuelturing:=$COMMIT_HASH}  # WRONG - typo
```
**Should be**: 
```bash
IMAGE_TAG=$${COMMIT_HASH:=latest}  # CORRECT
```
**Impact**: Build will fail with undefined variable error

## 7. Unnecessary CodeBuild IAM Permissions
**Failure**: Includes excessive S3 permissions
- `s3:CreateBucket`, `s3:DeleteBucket`, `s3:PutBucketPolicy`, etc.
**Should be**: Only `s3:GetObject`, `s3:GetObjectVersion`, `s3:PutObject` for artifacts bucket
**Impact**: Violates least privilege security principle

## 8. Unnecessary CodePipeline IAM Permissions
**Failure**: Includes excessive S3 permissions
- `s3:ListObjects`, `s3:GetBucketVersioning`
**Should be**: Only required permissions for reading source and writing artifacts
**Impact**: Violates least privilege security principle

## 9. CodePipeline Deploy Stage Uses Dynamic Block
**Failure**: Uses conditional dynamic block
```hcl
dynamic "stage" {
  for_each = length(var.private_subnet_ids) > 0 ? [1] : []
  content {
    name = "Deploy"
    ...
  }
}
```
**Should be**: Regular stage block (since VPC is always created in ideal)
**Impact**: Unnecessary complexity, pipeline may not deploy if subnets not provided

## 10. Conditional ECS Service Creation
**Failure**: ECS service only created if subnets provided
```hcl
count = length(var.private_subnet_ids) > 0 ? 1 : 0
```
**Should be**: Always created (since VPC resources are always provisioned)
**Impact**: Service won't deploy if user forgets to provide subnet IDs

## 11. Conditional Security Group Creation
**Failure**: Security group only created if VPC ID provided
```hcl
count = var.vpc_id != "" ? 1 : 0
```
**Should be**: Always created (since VPC is always created)
**Impact**: Service will fail if VPC ID not provided

## 12. Missing VPC-Related Outputs
**Failure**: No VPC information exposed
**Missing outputs**:
- `vpc_id`
- `private_subnet_ids`
- `public_subnet_ids`
**Impact**: Users cannot reference VPC resources for other infrastructure

## 13. Wrong Container Port Default
**Failure**: Default container port is 8080
```hcl
default = 8080
```
**Should be**: 80 (standard HTTP port, matches ALB listener)
**Impact**: Port mismatch requires manual configuration

## 14. ECS Service Output Has Conditional Logic
**Failure**: Output conditionally returns message
```hcl
value = length(var.private_subnet_ids) > 0 ? aws_ecs_service.app[0].name : "Not deployed - set subnet IDs"
```
**Should be**: Direct reference (since service is always created)
**Impact**: Inconsistent output format

## 15. Missing Container Port Variable in S3 Object Key
**Failure**: CodePipeline source action uses hardcoded key
```hcl
S3ObjectKey = "${var.source_key_prefix}app.zip"
```
**Should be**: Uses `pipeline_files.zip` (to match uploaded object)
**Impact**: Pipeline will fail to find source artifact
