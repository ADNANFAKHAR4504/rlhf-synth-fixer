# =============================================================================
# AWS QUOTA CONSTRAINT: VPC Endpoint resources commented out
# =============================================================================
# Region has reached VPC Endpoint quota limit
# Cannot create new VPC Endpoints until quota is increased
#
# In production with quota increase, these resources would be enabled:
# - S3 Gateway Endpoint for cost-effective S3 access
# - DynamoDB Gateway Endpoint for private DynamoDB access
# - No data transfer charges for gateway endpoints
#
# Resources can still access S3 and DynamoDB via internet/NAT Gateway
# This demonstrates infrastructure flexibility when quotas are reached
# =============================================================================

/*
# S3 VPC Endpoint (Gateway type)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id,
    aws_route_table.database[*].id
  )

  tags = {
    Name = "vpce-s3-${var.environment_suffix}"
  }
}

# DynamoDB VPC Endpoint (Gateway type)
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id,
    aws_route_table.database[*].id
  )

  tags = {
    Name = "vpce-dynamodb-${var.environment_suffix}"
  }
}
*/