# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# EC2 Instances
resource "aws_instance" "web" {
  for_each = toset(["dev-web"]) # Only deploy dev to avoid resource limits

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public["${split("-", each.key)[0]}-${var.availability_zones[0]}"].id
  vpc_security_group_ids = [aws_security_group.web[split("-", each.key)[0]].id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.ebs_key.arn
    delete_on_termination = true
  }

  user_data_base64 = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = split("-", each.key)[0]
  }))

  tags = merge(local.env_tags[split("-", each.key)[0]], {
    Name = "${local.project_prefix}-${each.key}-instance"
  })
}

# Elastic IPs
resource "aws_eip" "web" {
  for_each = aws_instance.web

  instance = each.value.id
  domain   = "vpc"

  tags = merge(local.env_tags[split("-", each.key)[0]], {
    Name = "${local.project_prefix}-${each.key}-eip"
  })
}