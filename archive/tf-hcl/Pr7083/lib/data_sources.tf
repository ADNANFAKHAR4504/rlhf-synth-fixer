data "aws_caller_identity" "current" {}

# Resolve AWS-managed DynamoDB KMS alias (aws/dynamodb) in target account/region
data "aws_kms_alias" "dynamodb" {
  name = "alias/aws/dynamodb"
}

