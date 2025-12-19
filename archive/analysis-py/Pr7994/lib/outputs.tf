output "analysis_summary" {
  description = "Summary of infrastructure analysis"
  value = {
    timestamp                 = local.timestamp
    total_ec2_instances       = length(local.ec2_instances)
    total_security_groups     = length(local.security_groups)
    total_s3_buckets          = length(local.s3_buckets)
    total_iam_roles           = length(local.iam_roles)
    total_vpcs                = length(local.vpc_analysis)
    total_subnets             = length(local.subnet_analysis)
    total_rds_instances       = length(local.rds_instances)
    ec2_compliance_violations = length([for id, instance in local.ec2_instances : instance if instance.has_compliance_issues])
    sg_security_issues        = length([for id, sg in local.security_groups : sg if sg.has_unrestricted_access || sg.has_ssh_open || sg.has_rdp_open])
    rds_compliance_violations = length([for id, db in local.rds_instances : db if !db.has_backup_enabled || !db.has_encryption_enabled || db.is_publicly_accessible])
    estimated_monthly_cost    = local.total_ec2_cost
    reports_location          = var.output_dir
  }
}

output "critical_findings" {
  description = "Critical security and compliance findings"
  value = {
    unrestricted_security_groups = [
      for id, sg in local.security_groups : sg.name if sg.has_unrestricted_access
    ]
    ssh_open_to_world = [
      for id, sg in local.security_groups : sg.name if sg.has_ssh_open
    ]
    rdp_open_to_world = [
      for id, sg in local.security_groups : sg.name if sg.has_rdp_open
    ]
    publicly_accessible_rds = [
      for id, db in local.rds_instances : db.identifier if db.is_publicly_accessible
    ]
    rds_without_encryption = [
      for id, db in local.rds_instances : db.identifier if !db.has_encryption_enabled
    ]
    rds_insufficient_backups = [
      for id, db in local.rds_instances : db.identifier if !db.has_backup_enabled
    ]
  }
}

output "reports_generated" {
  description = "List of generated analysis reports"
  value = [
    local_file.ec2_analysis.filename,
    local_file.security_group_analysis.filename,
    local_file.s3_analysis.filename,
    local_file.iam_analysis.filename,
    local_file.vpc_analysis.filename,
    local_file.rds_analysis.filename,
    local_file.cost_estimation.filename,
    local_file.summary.filename
  ]
}
