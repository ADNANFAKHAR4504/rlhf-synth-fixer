variable "enable_guardduty" {
  description = "Whether to enable GuardDuty"
  type        = bool
  default     = true
}

variable "member_accounts" {
  description = <<EOT
Map of member accounts to invite to GuardDuty.
Format:
{
  "account_id" = {
    email              = "member@example.com"
    invitation_message = "Optional message"
  }
}
EOT
  type    = map(object({
    email              = string
    invitation_message = string
  }))
  default = {}
}

variable "findings_export_bucket_arn" {
  description = "S3 bucket ARN to export GuardDuty findings (optional)"
  type        = string
  default     = ""
}

variable "kms_key_arn" {
  description = "KMS key ARN for encrypting exported findings"
  type        = string
  default     = ""
}
