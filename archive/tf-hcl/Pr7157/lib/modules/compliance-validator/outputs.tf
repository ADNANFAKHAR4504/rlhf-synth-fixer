output "summary" {
  description = "Summary of compliance findings"
  value = {
    total_findings     = length(local.all_findings)
    critical_count     = length(local.critical_findings)
    high_count         = length(local.high_findings)
    medium_count       = length(local.medium_findings)
    low_count          = length(local.low_findings)
    compliance_status  = local.compliance_status
    environment_suffix = var.environment_suffix
    resources_analyzed = {
      ec2_instances   = length(var.ec2_instances)
      rds_instances   = length(var.rds_instances)
      s3_buckets      = length(var.s3_buckets)
      iam_roles       = length(var.iam_roles)
      security_groups = length(var.security_groups)
    }
  }
}

output "findings" {
  description = "Detailed compliance findings"
  value = {
    critical = local.critical_findings
    high     = local.high_findings
    medium   = local.medium_findings
    low      = local.low_findings
  }
}

output "critical_findings_count" {
  description = "Count of critical findings"
  value       = length(local.critical_findings)
}

output "high_findings_count" {
  description = "Count of high findings"
  value       = length(local.high_findings)
}

output "medium_findings_count" {
  description = "Count of medium findings"
  value       = length(local.medium_findings)
}

output "low_findings_count" {
  description = "Count of low findings"
  value       = length(local.low_findings)
}

output "compliance_status" {
  description = "Overall compliance status"
  value       = local.compliance_status
}
