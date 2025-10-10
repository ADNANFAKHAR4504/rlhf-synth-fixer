output "vault_name" {
  description = "Backup vault name"
  value       = aws_backup_vault.main.name
}

output "plan_name" {
  description = "Backup plan name"
  value       = aws_backup_plan.daily.name
}

output "backup_configuration" {
  description = "Backup configuration details"
  value = {
    vault_name          = aws_backup_vault.main.name
    plan_name           = aws_backup_plan.daily.name
    schedule            = "Daily at 2 AM UTC"
    retention           = "30 days"
    protected_resources = "Aurora Primary Cluster, DynamoDB Global Table"
  }
}

