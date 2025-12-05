# ECR Module - Container registries with vulnerability scanning

# ECR Repository for Frontend microservices
resource "aws_ecr_repository" "frontend" {
  name                 = "frontend-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name     = "frontend-${var.environment_suffix}"
    Workload = "frontend"
  })
}

# ECR Repository for Backend microservices
resource "aws_ecr_repository" "backend" {
  name                 = "backend-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name     = "backend-${var.environment_suffix}"
    Workload = "backend"
  })
}

# ECR Repository for Data Processing microservices
resource "aws_ecr_repository" "data_processing" {
  name                 = "data-processing-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name     = "data-processing-${var.environment_suffix}"
    Workload = "data-processing"
  })
}

# Lifecycle policy for Frontend repository
resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Lifecycle policy for Backend repository
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Lifecycle policy for Data Processing repository
resource "aws_ecr_lifecycle_policy" "data_processing" {
  repository = aws_ecr_repository.data_processing.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
