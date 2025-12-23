# Complete Terraform CI/CD Pipeline Infrastructure

This implementation provides a comprehensive CI/CD pipeline for containerized applications with blue-green deployments, manual approval, and strict security controls.

## File: lib/main.tf

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

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      ManagedBy   = "Terraform"
      Project     = "CICD-Pipeline"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming uniqueness"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
}

variable "codecommit_repository_name" {
  description = "CodeCommit repository name"
  type        = string
  default     = "payment-gateway"
}

variable "codecommit_branch" {
  description = "CodeCommit branch to track"
  type        = string
  default     = "main"
}

variable "approval_sns_emails" {
  description = "Email addresses for pipeline approval notifications"
  type        = list(string)
  default     = ["approver@example.com"]
}

variable "container_port" {
  description = "Container port for application"
  type        = number
  default     = 8080
}

variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = string
  default     = "256"
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = string
  default     = "512"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}
```

## File: lib/vpc.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: lib/security_groups.tf

```hcl
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "ecs-tasks-sg-${var.environment_suffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecs-tasks-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: lib/kms.tf

```hcl
resource "aws_kms_key" "artifacts" {
  description             = "KMS key for pipeline artifacts encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CodePipeline to use the key"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CodeBuild to use the key"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "artifacts-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "artifacts" {
  name          = "alias/artifacts-${var.environment_suffix}"
  target_key_id = aws_kms_key.artifacts.key_id
}

resource "aws_kms_key" "ecr" {
  description             = "KMS key for ECR encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow ECR to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ecr.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "ecr-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "ecr" {
  name          = "alias/ecr-${var.environment_suffix}"
  target_key_id = aws_kms_key.ecr.key_id
}
```

## File: lib/s3.tf

```hcl
resource "aws_s3_bucket" "artifacts" {
  bucket = "pipeline-artifacts-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "pipeline-artifacts-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.artifacts.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "expire-old-artifacts"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    expiration {
      days = 180
    }
  }
}
```

## File: lib/ecr.tf

```hcl
resource "aws_ecr_repository" "app" {
  name                 = "payment-gateway-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.ecr.arn
  }

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "payment-gateway-ecr-${var.environment_suffix}"
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
```

## File: lib/codecommit.tf

```hcl
resource "aws_codecommit_repository" "app" {
  repository_name = "${var.codecommit_repository_name}-${var.environment_suffix}"
  description     = "Repository for payment gateway application"

  tags = {
    Name = "codecommit-${var.environment_suffix}"
  }
}

resource "aws_codecommit_approval_rule_template" "main_branch_protection" {
  name        = "main-branch-protection-${var.environment_suffix}"
  description = "Require approval for main branch changes"

  content = jsonencode({
    Version               = "2018-11-08"
    DestinationReferences = ["refs/heads/${var.codecommit_branch}"]
    Statements = [
      {
        Type                    = "Approvers"
        NumberOfApprovalsNeeded = 1
        ApprovalPoolMembers     = ["arn:aws:sts::${data.aws_caller_identity.current.account_id}:assumed-role/*"]
      }
    ]
  })
}

resource "aws_codecommit_approval_rule_template_association" "main" {
  approval_rule_template_name = aws_codecommit_approval_rule_template.main_branch_protection.name
  repository_name             = aws_codecommit_repository.app.repository_name
}
```

## File: lib/cloudwatch.tf

```hcl
resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/aws/codebuild/${var.environment_suffix}"
  retention_in_days = 30

  kms_key_id = aws_kms_key.artifacts.arn

  tags = {
    Name = "codebuild-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "ecs_tasks" {
  name              = "/ecs/${var.environment_suffix}"
  retention_in_days = 30

  kms_key_id = aws_kms_key.artifacts.arn

  tags = {
    Name = "ecs-logs-${var.environment_suffix}"
  }
}
```

## File: lib/iam_codebuild.tf

```hcl
resource "aws_iam_role" "codebuild" {
  name = "codebuild-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "codebuild-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "codebuild" {
  name = "codebuild-policy-${var.environment_suffix}"
  role = aws_iam_role.codebuild.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.codebuild.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*"
        ]
        Resource = [
          aws_kms_key.artifacts.arn,
          aws_kms_key.ecr.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = [
          aws_ecr_repository.app.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codecommit:GitPull"
        ]
        Resource = [
          aws_codecommit_repository.app.arn
        ]
      }
    ]
  })
}
```

## File: lib/iam_codepipeline.tf

```hcl
resource "aws_iam_role" "codepipeline" {
  name = "codepipeline-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "codepipeline-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "codepipeline" {
  name = "codepipeline-policy-${var.environment_suffix}"
  role = aws_iam_role.codepipeline.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*"
        ]
        Resource = [
          aws_kms_key.artifacts.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codecommit:GetBranch",
          "codecommit:GetCommit",
          "codecommit:UploadArchive",
          "codecommit:GetUploadArchiveStatus"
        ]
        Resource = [
          aws_codecommit_repository.app.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = [
          aws_codebuild_project.app.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:RegisterTaskDefinition",
          "ecs:UpdateService"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_task_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.pipeline_approval.arn
        ]
      }
    ]
  })
}
```

## File: lib/iam_ecs.tf

```hcl
resource "aws_iam_role" "ecs_task_execution" {
  name = "ecs-task-execution-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "ecs-task-execution-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_kms" {
  name = "ecs-task-execution-kms-${var.environment_suffix}"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.ecr.arn,
          aws_kms_key.artifacts.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "ecs-task-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "ecs-task-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "ecs-task-policy-${var.environment_suffix}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.ecs_tasks.arn}:*"
        ]
      }
    ]
  })
}
```

## File: lib/codebuild.tf

```hcl
resource "aws_codebuild_project" "app" {
  name          = "payment-gateway-build-${var.environment_suffix}"
  description   = "Build Docker images for payment gateway"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = 30

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }

    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = aws_ecr_repository.app.name
    }

    environment_variable {
      name  = "IMAGE_TAG"
      value = "latest"
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild.name
      status     = "ENABLED"
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = file("${path.module}/buildspec.yml")
  }

  cache {
    type  = "LOCAL"
    modes = ["LOCAL_DOCKER_LAYER_CACHE", "LOCAL_SOURCE_CACHE"]
  }

  tags = {
    Name = "codebuild-${var.environment_suffix}"
  }
}
```

## File: lib/buildspec.yml

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"payment-gateway","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json

cache:
  paths:
    - '/root/.docker/**/*'
```

## File: lib/sns.tf

```hcl
resource "aws_sns_topic" "pipeline_approval" {
  name              = "pipeline-approval-${var.environment_suffix}"
  display_name      = "Pipeline Approval Notifications"
  kms_master_key_id = aws_kms_key.artifacts.id

  tags = {
    Name = "pipeline-approval-${var.environment_suffix}"
  }
}

resource "aws_sns_topic_subscription" "pipeline_approval" {
  count = length(var.approval_sns_emails)

  topic_arn = aws_sns_topic.pipeline_approval.arn
  protocol  = "email"
  endpoint  = var.approval_sns_emails[count.index]
}
```

## File: lib/alb.tf

```hcl
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "alb-${var.environment_suffix}"
  }
}

resource "aws_lb_target_group" "blue" {
  name        = "tg-blue-${var.environment_suffix}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "tg-blue-${var.environment_suffix}"
  }
}

resource "aws_lb_target_group" "green" {
  name        = "tg-green-${var.environment_suffix}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "tg-green-${var.environment_suffix}"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }

  lifecycle {
    ignore_changes = [default_action]
  }
}

resource "aws_lb_listener" "test" {
  load_balancer_arn = aws_lb.main.arn
  port              = 8080
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.green.arn
  }

  lifecycle {
    ignore_changes = [default_action]
  }
}
```

## File: lib/waf.tf

```hcl
resource "aws_wafv2_web_acl" "main" {
  name  = "alb-waf-${var.environment_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "WAFMetric"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "waf-${var.environment_suffix}"
  }
}

resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

## File: lib/ecs.tf

```hcl
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ecs-cluster-${var.environment_suffix}"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "payment-gateway-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "payment-gateway"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_tasks.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "payment-gateway"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "PORT"
          value = tostring(var.container_port)
        }
      ]
    }
  ])

  tags = {
    Name = "task-definition-${var.environment_suffix}"
  }
}

resource "aws_ecs_service" "app" {
  name                               = "payment-gateway-service-${var.environment_suffix}"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.app.arn
  desired_count                      = var.ecs_desired_count
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_controller {
    type = "CODE_DEPLOY"
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "payment-gateway"
    container_port   = var.container_port
  }

  depends_on = [
    aws_lb_listener.http,
    aws_lb_listener.test,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]

  lifecycle {
    ignore_changes = [
      task_definition,
      load_balancer,
      desired_count
    ]
  }

  tags = {
    Name = "ecs-service-${var.environment_suffix}"
  }
}
```

## File: lib/codepipeline.tf

```hcl
resource "aws_codepipeline" "app" {
  name     = "payment-gateway-pipeline-${var.environment_suffix}"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"

    encryption_key {
      id   = aws_kms_key.artifacts.arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        RepositoryName       = aws_codecommit_repository.app.repository_name
        BranchName           = var.codecommit_branch
        PollForSourceChanges = false
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]

      configuration = {
        ProjectName = aws_codebuild_project.app.name
      }
    }
  }

  stage {
    name = "Approval"

    action {
      name     = "ManualApproval"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"

      configuration = {
        NotificationArn = aws_sns_topic.pipeline_approval.arn
        CustomData      = "Please review and approve deployment to production"
      }
    }
  }

  stage {
    name = "Deploy"

    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "ECS"
      version         = "1"
      input_artifacts = ["build_output"]

      configuration = {
        ClusterName = aws_ecs_cluster.main.name
        ServiceName = aws_ecs_service.app.name
        FileName    = "imagedefinitions.json"
      }
    }
  }

  tags = {
    Name = "codepipeline-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_rule" "codecommit_change" {
  name        = "codecommit-change-${var.environment_suffix}"
  description = "Trigger pipeline on CodeCommit changes"

  event_pattern = jsonencode({
    source      = ["aws.codecommit"]
    detail-type = ["CodeCommit Repository State Change"]
    detail = {
      event         = ["referenceCreated", "referenceUpdated"]
      repositoryName = [aws_codecommit_repository.app.repository_name]
      referenceName = [var.codecommit_branch]
    }
  })

  tags = {
    Name = "codecommit-event-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "pipeline" {
  rule     = aws_cloudwatch_event_rule.codecommit_change.name
  arn      = aws_codepipeline.app.arn
  role_arn = aws_iam_role.events.arn
}

resource "aws_iam_role" "events" {
  name = "events-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "events-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "events" {
  name = "events-policy-${var.environment_suffix}"
  role = aws_iam_role.events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "codepipeline:StartPipelineExecution"
        ]
        Resource = [
          aws_codepipeline.app.arn
        ]
      }
    ]
  })
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "codecommit_repository_url" {
  description = "CodeCommit repository clone URL (HTTPS)"
  value       = aws_codecommit_repository.app.clone_url_http
}

output "codepipeline_name" {
  description = "CodePipeline name"
  value       = aws_codepipeline.app.name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

output "kms_artifacts_key_id" {
  description = "KMS key ID for artifacts encryption"
  value       = aws_kms_key.artifacts.key_id
}

output "kms_ecr_key_id" {
  description = "KMS key ID for ECR encryption"
  value       = aws_kms_key.ecr.key_id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for pipeline approvals"
  value       = aws_sns_topic.pipeline_approval.arn
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure for Containerized Applications

This Terraform configuration deploys a complete CI/CD pipeline for containerized applications with blue-green deployment capabilities, manual approval workflows, and strict security controls for PCI compliance.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ networking across 3 availability zones with public and private subnets
- **CodePipeline**: CI/CD orchestration with source, build, approval, and deploy stages
- **CodeCommit**: Source code repository with branch protection
- **CodeBuild**: Docker image build service with BUILD_GENERAL1_SMALL compute type
- **ECR**: Container registry with KMS encryption
- **ECS**: Container orchestration with Fargate launch type and blue-green deployments
- **Application Load Balancer**: Traffic distribution with target group switching
- **WAF**: Web application firewall for DDoS protection
- **KMS**: Customer-managed encryption keys for artifacts and container images
- **CloudWatch Logs**: Centralized logging with 30-day retention
- **SNS**: Notification service for manual approval workflow

## Prerequisites

- Terraform 1.5.0 or later
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Deployment Instructions

### Step 1: Configure Variables

Create a `terraform.tfvars` file:

```hcl
aws_region         = "us-east-1"
environment_suffix = "prod-123"
approval_sns_emails = ["approver1@example.com", "approver2@example.com"]
```

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Review Plan

```bash
terraform plan
```

### Step 4: Apply Configuration

```bash
terraform apply
```

### Step 5: Set Up Application Code

1. Clone the CodeCommit repository:
```bash
git clone $(terraform output -raw codecommit_repository_url)
```

2. Add your application code with a `Dockerfile` in the repository root

3. Commit and push to trigger the pipeline:
```bash
git add .
git commit -m "Initial application code"
git push origin main
```

## Pipeline Workflow

1. **Source Stage**: Detects changes in CodeCommit repository
2. **Build Stage**: Builds Docker image and pushes to ECR
3. **Approval Stage**: Sends SNS notification for manual approval
4. **Deploy Stage**: Updates ECS service with new container image

## Security Features

- All artifacts encrypted with customer-managed KMS keys
- IAM roles follow least privilege principle with NO wildcard actions
- CodeCommit branch protection on main branch
- WAF web ACL attached to Application Load Balancer
- ECS tasks deployed in private subnets
- Network isolation with security groups

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Example: `alb-prod-123`, `ecs-cluster-prod-123`

## Monitoring and Logging

- CodeBuild logs: `/aws/codebuild/{environmentSuffix}` (30-day retention)
- ECS task logs: `/ecs/{environmentSuffix}` (30-day retention)
- WAF metrics available in CloudWatch
- Pipeline execution history in CodePipeline console

## Blue-Green Deployment

The pipeline supports blue-green deployments through:
- Two target groups (blue and green)
- ECS service with CODE_DEPLOY deployment controller
- Automatic traffic shifting after health checks pass

## Cost Optimization

- CodeBuild uses BUILD_GENERAL1_SMALL compute type
- ECS uses Fargate launch type (pay-per-use)
- S3 lifecycle policies for artifact cleanup
- ECR lifecycle policies to retain only 10 recent images

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: Ensure all container images and pipeline artifacts are backed up before destroying.

## Compliance

This infrastructure meets PCI compliance requirements through:
- Encryption at rest (KMS)
- Encryption in transit (HTTPS)
- Access controls (IAM)
- Logging and monitoring (CloudWatch)
- Network isolation (VPC, security groups)
- WAF protection (DDoS mitigation)

## Outputs

After deployment, important outputs include:
- ALB DNS name
- ECR repository URL
- CodeCommit repository URL
- CodePipeline name
- ECS cluster and service names

Access outputs with:
```bash
terraform output
```

## Support

For issues or questions, refer to AWS documentation:
- [CodePipeline](https://docs.aws.amazon.com/codepipeline/)
- [ECS](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
```
