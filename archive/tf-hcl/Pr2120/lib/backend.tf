terraform {
  backend "s3" {
    bucket                      = "tap-terraform-state-291686"
    key                         = "tap/terraform.tfstate"
    region                      = "us-east-1"
    dynamodb_table              = "tap-terraform-locks"
    encrypt                     = true
    
    # Configure retry settings
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_credentials_validation = true
    
    # Custom HTTP client configuration
    max_retries                 = 5
    retry_mode                  = "standard"
  }
}
