output "domain_id" {
  description = "OpenSearch domain ID"
  value       = aws_opensearch_domain.audit.domain_id
}

output "domain_name" {
  description = "OpenSearch domain name"
  value       = aws_opensearch_domain.audit.domain_name
}

output "endpoint" {
  description = "OpenSearch domain endpoint"
  value       = aws_opensearch_domain.audit.endpoint
}

output "kibana_endpoint" {
  description = "OpenSearch Dashboards endpoint"
  value       = aws_opensearch_domain.audit.kibana_endpoint
}

output "arn" {
  description = "OpenSearch domain ARN"
  value       = aws_opensearch_domain.audit.arn
}
