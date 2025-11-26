locals {
  # Short prefix for resources with length constraints (ALB, Target Group, IAM roles)
  # ALB name max: 32 chars, Target Group max: 32 chars, IAM role name_prefix max: 38 chars
  # Format: "payproc-dev-84f4f7" = 18 chars (allows up to 20 chars for suffixes)
  short_prefix = "${substr(replace(var.project_name, "-", ""), 0, 6)}-${substr(var.environment_suffix, 0, 3)}-${substr(random_id.suffix.hex, 0, 6)}"

  # Resource naming prefix with random suffix for uniqueness (for resources without length constraints)
  name_prefix = "${var.project_name}-${var.environment_suffix}-${substr(random_id.suffix.hex, 0, 8)}"

  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_id
    ManagedBy   = "terraform"
  }
}
