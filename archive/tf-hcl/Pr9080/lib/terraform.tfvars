# Terraform Variables for LocalStack Deployment
aws_region         = "us-east-1"
environment        = "production"
project_name       = "tap-stack"
vpc_cidr           = "10.0.0.0/16"
ami_id             = ""
instance_type      = "t3.micro"
min_size           = 2
desired_capacity   = 4
max_size           = 10
cpu_high_threshold = 80
cpu_low_threshold  = 20
environment_suffix = "dev"
# ALB is disabled for LocalStack (ELBv2 not supported in Community Edition)
enable_alb = false
# ASG is disabled for LocalStack (Auto Scaling not supported in Community Edition)
enable_asg = false
