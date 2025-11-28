# Note: Using created VPC resources instead of data sources for self-sufficient deployment
# In production, these would be data sources looking up existing VPC infrastructure

locals {
  vpc_id             = aws_vpc.main.id
  private_subnet_ids = aws_subnet.private[*].id
  public_subnet_ids  = aws_subnet.public[*].id
}

# AMI for EC2 instances
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
