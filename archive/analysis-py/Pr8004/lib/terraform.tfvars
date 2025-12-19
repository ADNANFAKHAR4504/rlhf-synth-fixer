# terraform.tfvars - Default configuration

aws_region                  = "us-east-1"
environmentSuffix           = "synthi6r8t3p6"
environment_suffix          = "synthi6r8t3p6"
lambda_memory_size          = 1024
lambda_timeout              = 10
lambda_reserved_concurrency = 100
api_throttle_rate_limit     = 83
api_throttle_burst_limit    = 200
api_version                 = "1.0.0"
rate_precision              = 4
cors_allowed_origins        = "*.example.com"
log_retention_days          = 7
repository                  = "iac-test-automations"
commit_author               = "iac-infra-qa-trainer"
pr_number                   = "synth-i6r8t3p6"
team                        = "synth"
