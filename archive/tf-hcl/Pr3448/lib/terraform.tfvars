aws_region = "us-east-1"

regions = [
  "eu-west-1",
  "ap-southeast-1"
]

environment = "prod"

vpc_cidrs = {
  "eu-west-1"      = "10.1.0.0/16"
  "ap-southeast-1" = "10.2.0.0/16"
}

availability_zones_per_region = 3

instance_type = "t3.medium"

asg_min_size         = 2
asg_max_size         = 10
asg_desired_capacity = 2

rds_instance_class    = "db.t3.medium"
rds_engine            = "mysql"
rds_engine_version    = "8.0.42"
rds_allocated_storage = 100

cloudtrail_retention_days = 90

alarm_email = "ops-team@example.com"

tags = {
  Owner      = "Platform Team"
  CostCenter = "Engineering"
  Compliance = "PCI-DSS"
}


