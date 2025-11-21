# Fetch latest PostgreSQL engine version
data "aws_rds_engine_version" "postgresql" {
  provider = aws.primary
  engine   = "postgres"
  version  = "15.8"
}

# Fetch availability zones for primary region
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

# Fetch availability zones for DR region
data "aws_availability_zones" "dr" {
  provider = aws.dr
  state    = "available"
}
