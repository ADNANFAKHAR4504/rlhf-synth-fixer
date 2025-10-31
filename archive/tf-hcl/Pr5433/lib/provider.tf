provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project        = "LegacyMigration"
      ManagedBy      = "Terraform"
      Environment    = terraform.workspace
      MigrationPhase = var.migration_phase
    }
  }
}
