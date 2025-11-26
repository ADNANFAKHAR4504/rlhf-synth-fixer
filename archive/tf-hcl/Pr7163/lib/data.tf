# Get latest PostgreSQL engine version
data "aws_rds_engine_version" "postgresql" {
  engine = "postgres"
  latest = true
}

# Get availability zones for primary region
data "aws_availability_zones" "primary" {
  state = "available"
}

# Get availability zones for DR region
data "aws_availability_zones" "dr" {
  provider = aws.us-west-2
  state    = "available"
}
