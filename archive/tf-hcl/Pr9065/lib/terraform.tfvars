environment        = "dev"
environment_suffix = "ls"
owner              = "platform-team"
primary_region     = "us-east-1"
secondary_region   = "us-west-2"
vpc_cidr_primary   = "10.0.0.0/16"
vpc_cidr_secondary = "10.1.0.0/16"
db_instance_class  = "db.t3.micro"
ec2_instance_type  = "t3.micro"

# LocalStack compatibility - these features may not be fully supported
enable_ec2         = false
enable_rds         = false
enable_nat_gateway = false
enable_cloudfront  = false
