# Terraform variables for ML Pipeline deployment

# Skip SageMaker endpoints for initial deployment
# Set to true after running a real SageMaker training job
create_sagemaker_endpoints = false

# Skip Step Functions for testing (IAM permission issues)
# Set to true when IAM permissions are configured
create_step_functions = false

# AWS Region
aws_region = "us-east-1"

# Environment
environment = "dev"

# Project name
project_name = "ml-pipeline"

