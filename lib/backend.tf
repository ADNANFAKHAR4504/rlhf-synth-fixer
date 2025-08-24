terraform {
  backend "s3" {
    bucket         = "tap-terraform-state-291686"
    key            = "tap/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tap-terraform-locks"
    encrypt        = true
    
    # Increased timeouts for better handling of lock conflicts
    dynamodb_table_tags = {
      Name        = "Terraform State Lock Table"
      Environment = var.environment
    }
    
    # Configure retry settings
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_credentials_validation = true
    
    # Prevent accidental state file deletion
    force_destroy = false
    
    # Custom HTTP client configuration
    max_retries = 5
    retry_mode  = "standard"
  }
}
