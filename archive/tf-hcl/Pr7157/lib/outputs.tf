output "compliance_report" {
  description = "Comprehensive compliance report in JSON format"
  value = jsonencode({
    metadata = {
      environment_suffix = var.environment_suffix
      scan_timestamp     = timestamp()
      aws_account_id     = data.aws_caller_identity.current.account_id
      aws_region         = data.aws_region.current.name
    }
    summary  = module.compliance_validator.summary
    findings = module.compliance_validator.findings
  })
}

output "critical_findings_count" {
  description = "Number of critical severity findings"
  value       = module.compliance_validator.critical_findings_count
}

output "high_findings_count" {
  description = "Number of high severity findings"
  value       = module.compliance_validator.high_findings_count
}

output "medium_findings_count" {
  description = "Number of medium severity findings"
  value       = module.compliance_validator.medium_findings_count
}

output "low_findings_count" {
  description = "Number of low severity findings"
  value       = module.compliance_validator.low_findings_count
}

output "compliance_status" {
  description = "Overall compliance status"
  value       = module.compliance_validator.compliance_status
}

output "environment_suffix" {
  description = "Environment suffix used for this compliance check"
  value       = var.environment_suffix
}
