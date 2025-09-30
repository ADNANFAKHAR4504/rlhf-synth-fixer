# Main Terraform configuration for Search API infrastructure
# This file includes all the resource modules for a scalable API deployment

# All resources are defined in the modules directory
# Terraform will automatically load all .tf files in this directory and modules/

# The modules directory contains:
# - network.tf: VPC, subnets, gateways, security groups
# - iam.tf: IAM roles and policies for Lambda
# - dynamodb.tf: DynamoDB table for search data
# - elasticache.tf: Redis cluster for caching
# - lambda.tf: Lambda function for search processing
# - api_gateway.tf: API Gateway REST API
# - cloudwatch.tf: CloudWatch monitoring and alarms
# - xray.tf: X-Ray tracing and EventBridge
# - output.tf: Stack outputs

# Note: Terraform automatically handles dependencies based on resource references
# No explicit module blocks needed since all resources are in the same configuration
