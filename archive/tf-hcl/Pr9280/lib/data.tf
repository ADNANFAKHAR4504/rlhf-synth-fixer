# For LocalStack, use a fixed AMI ID instead of dynamic lookup
# data "aws_ami" "amazon_linux" {
#   most_recent = true
#   owners      = ["amazon"]
#
#   filter {
#     name   = "name"
#     values = ["amzn2-ami-hvm-*-x86_64-gp2"]
#   }
#
#   filter {
#     name   = "virtualization-type"
#     values = ["hvm"]
#   }
# }

# LocalStack-compatible approach: use a fixed AMI ID
locals {
  amazon_linux_ami_id = "ami-12345678" # LocalStack accepts any AMI ID format
}