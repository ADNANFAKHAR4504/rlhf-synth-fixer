# main.tf
# Data sources and main infrastructure resources

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
