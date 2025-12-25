locals {
  # Auto-detect LocalStack deployment based on AWS_ENDPOINT_URL environment variable
  is_localstack = var.is_localstack || (
    try(length(regexall("localhost|127\\.0\\.0\\.1|localstack", lookup(var.common_tags, "AWS_ENDPOINT_URL", ""))) > 0, false) ||
    try(length(regexall("localhost|127\\.0\\.0\\.1|localstack", provider::aws::endpoint_url_cloudwatch)) > 0, false)
  )
}
