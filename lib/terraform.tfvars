resource_suffix   = "dev"
db_username       = "admin"
db_name           = "mydb"
db_instance_class = "db.t3.micro"
ec2_instance_type = "t3.micro"
ssh_cidr_blocks   = ["10.0.0.0/24"] # Restrictive dummy CIDR for testing
ssh_public_key    = ""              # Not needed for SSM-based testing
