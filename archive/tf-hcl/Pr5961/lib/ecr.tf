resource "aws_ecr_repository" "fraud_detection" {
  name                 = "fraud-detection-${var.environmentSuffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "fraud-detection-ecr-${var.environmentSuffix}"
  }
}

resource "aws_ecr_lifecycle_policy" "fraud_detection" {
  repository = aws_ecr_repository.fraud_detection.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_repository" "transaction_processor" {
  name                 = "transaction-processor-${var.environmentSuffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "transaction-processor-ecr-${var.environmentSuffix}"
  }
}

resource "aws_ecr_lifecycle_policy" "transaction_processor" {
  repository = aws_ecr_repository.transaction_processor.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}
