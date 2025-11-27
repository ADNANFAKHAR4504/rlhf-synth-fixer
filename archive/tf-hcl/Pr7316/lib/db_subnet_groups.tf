# DB subnet group for primary region
resource "aws_db_subnet_group" "primary" {
  name       = "aurora-subnet-primary-${var.environment_suffix}"
  subnet_ids = aws_subnet.primary[*].id

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-subnet-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# DB subnet group for secondary region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "aurora-subnet-secondary-${var.environment_suffix}"
  subnet_ids = aws_subnet.secondary[*].id

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-subnet-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}
