environmentSuffix = "synth101912430"
aws_region        = "ap-southeast-1"
instance_type     = "t3.micro"
vpc_cidr          = "10.0.0.0/16"

public_subnet_cidrs = {
  "subnet-1" = "10.0.1.0/24"
  "subnet-2" = "10.0.2.0/24"
}

private_subnet_cidrs = {
  "subnet-1" = "10.0.10.0/24"
  "subnet-2" = "10.0.11.0/24"
}

availability_zones = {
  "subnet-1" = "ap-southeast-1a"
  "subnet-2" = "ap-southeast-1b"
}

db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
db_engine_version    = "8.0.35"

project_name = "infrastructure-refactor"
cost_center  = "engineering"

ec2_instances = {
  "web-1" = {
    instance_type = "t3.micro"
    subnet_key    = "subnet-1"
  }
  "web-2" = {
    instance_type = "t3.micro"
    subnet_key    = "subnet-2"
  }
}

enable_monitoring           = true
secrets_manager_secret_name = "rds-db-credentials"
