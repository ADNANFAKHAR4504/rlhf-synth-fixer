# Current AWS Account ID
data "aws_caller_identity" "current" {}

# Current AWS Region
data "aws_region" "current" {}
