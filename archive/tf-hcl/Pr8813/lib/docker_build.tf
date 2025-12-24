# Build and push Lambda container images to ECR

# Get ECR login credentials and build/push images
resource "null_resource" "build_and_push_lambda_images" {
  triggers = {
    ecr_repository_url = aws_ecr_repository.lambda_images.repository_url
    validator_handler  = filemd5("${path.module}/lambda/validator/handler.py")
    validator_reqs     = filemd5("${path.module}/lambda/validator/requirements.txt")
    validator_docker   = filemd5("${path.module}/lambda/validator/Dockerfile")
    processor_handler  = filemd5("${path.module}/lambda/processor/handler.py")
    processor_reqs     = filemd5("${path.module}/lambda/processor/requirements.txt")
    processor_docker   = filemd5("${path.module}/lambda/processor/Dockerfile")
    enricher_handler   = filemd5("${path.module}/lambda/enricher/handler.py")
    enricher_reqs      = filemd5("${path.module}/lambda/enricher/requirements.txt")
    enricher_docker    = filemd5("${path.module}/lambda/enricher/Dockerfile")
    trigger_handler    = filemd5("${path.module}/lambda/trigger/handler.py")
    trigger_reqs       = filemd5("${path.module}/lambda/trigger/requirements.txt")
    trigger_docker     = filemd5("${path.module}/lambda/trigger/Dockerfile")
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e

      # ECR repository URL
      ECR_REPO="${aws_ecr_repository.lambda_images.repository_url}"

      # Build and push validator image
      echo "Building validator image..."
      docker build -t $ECR_REPO:validator-latest ${path.module}/lambda/validator
      docker push $ECR_REPO:validator-latest

      # Build and push processor image
      echo "Building processor image..."
      docker build -t $ECR_REPO:processor-latest ${path.module}/lambda/processor
      docker push $ECR_REPO:processor-latest

      # Build and push enricher image
      echo "Building enricher image..."
      docker build -t $ECR_REPO:enricher-latest ${path.module}/lambda/enricher
      docker push $ECR_REPO:enricher-latest

      # Build and push trigger image
      echo "Building trigger image..."
      docker build -t $ECR_REPO:trigger-latest ${path.module}/lambda/trigger
      docker push $ECR_REPO:trigger-latest

      echo "All images built and pushed successfully"
    EOT
  }

  depends_on = [
    aws_ecr_repository.lambda_images
  ]
}
