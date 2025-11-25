locals {
  # Resource naming prefix with random suffix for uniqueness
  name_prefix = "${var.project_name}-${var.environment_suffix}-${substr(random_id.suffix.hex, 0, 8)}"

  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_id
    ManagedBy   = "terraform"
  }
}
