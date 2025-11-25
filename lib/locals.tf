locals {
  # Resource naming prefix
  name_prefix = "${var.project_name}-${var.environment_suffix}"

  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_id
    ManagedBy   = "terraform"
  }
}
