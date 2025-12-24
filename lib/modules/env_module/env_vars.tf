locals {
  env = terraform.workspace

  vpc_cidr = "10.0.0.0/16"

  availability_zones = ["us-east-1a", "us-east-1b"]

  project = "HCLTuring"

  # LocalStack does not support ELBv2 (ALB), Auto Scaling, or full EC2 in Community Edition
  # Set to false for LocalStack testing, true for real AWS
  enable_alb = false
  enable_asg = false
  enable_ec2 = false # Disable EC2 instance creation to avoid LocalStack timeout

  common_tags = {
    "Application" : "multi-env",
    "ManagedBy" : "HCL",
    "Owned" : "Turing"
  }

  env_type = {
    default    = "default"
    staging    = "staging"
    production = "production"
  }

  instance_type = {
    default    = "t2.micro"
    staging    = "t3.small"
    production = "t3.large"
  }

  as_group_desired = {
    default    = 1
    staging    = 1
    production = 2
  }

  as_group_min = {
    default    = 1
    staging    = 1
    production = 2
  }

  as_group_max = {
    default    = 2
    staging    = 2
    production = 4
  }
}