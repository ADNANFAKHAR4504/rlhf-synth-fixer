data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.ec2_instance_type
  key_name               = var.key_pair_name
  subnet_id              = var.public_subnet_id
  vpc_security_group_ids = [var.bastion_sg_id]
  iam_instance_profile   = var.iam_instance_profile

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y aws-cli
              EOF
  )

  tags = merge(var.common_tags, { Name = "${var.project}-bastion", Type = "Bastion" })
}

resource "aws_instance" "private" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.ec2_instance_type
  key_name               = var.key_pair_name
  subnet_id              = var.private_subnet_id
  vpc_security_group_ids = [var.private_sg_id]
  iam_instance_profile   = var.iam_instance_profile

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y aws-cli
              EOF
  )
  tags = merge(var.common_tags, { Name = "${var.project}-private", Type = "Private" })
}