# ECR Repositories for each microservice
resource "aws_ecr_repository" "services" {
  for_each = toset(var.microservices)

  name                 = "ecr-${each.key}-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name    = "ecr-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# ECR Lifecycle Policy to retain only last 10 images
resource "aws_ecr_lifecycle_policy" "services" {
  for_each   = toset(var.microservices)
  repository = aws_ecr_repository.services[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.ecr_image_retention_count} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.ecr_image_retention_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
