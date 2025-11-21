aws_region      = "us-east-1"
project_name    = "payment-processing"
vpc_cidr_base   = "10.0"
container_image = "nginx:latest"  # Replace with actual payment app image

# Database credentials (use AWS Secrets Manager in production)
db_username = "dbadmin"
db_password = "DevPassword123!"  # Change this!

# Optional: ACM certificate for HTTPS
alb_certificate_arn = ""
