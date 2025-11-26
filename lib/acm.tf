# Note: In production, you would create an ACM certificate for your domain
# For this implementation, we'll reference a certificate that should be created manually
# or use the ALB with HTTP for testing purposes

# Uncomment and configure if you have a domain:
# resource "aws_acm_certificate" "alb" {
#   domain_name       = "loanapp.example.com"
#   validation_method = "DNS"
#
#   tags = {
#     Name = "loan-processing-cert-${local.env_suffix}"
#   }
#
#   lifecycle {
#     create_before_destroy = true
#   }
# }
