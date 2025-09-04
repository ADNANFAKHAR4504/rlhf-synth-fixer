# Elastic IPs for EC2 instances
resource "aws_eip" "vpc1_ec2_eip" {
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-eip"
  })
}

resource "aws_eip" "vpc2_ec2_eip" {
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-eip"
  })
}

# EC2 Instance in VPC 1
resource "aws_instance" "vpc1_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.vpc1_private.id
  vpc_security_group_ids = [aws_security_group.vpc1_ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = var.key_pair_name

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = aws_cloudwatch_log_group.vpc1_ec2_logs.name
  }))

  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-instance"
  })
}

# EC2 Instance in VPC 2
resource "aws_instance" "vpc2_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.vpc2_private.id
  vpc_security_group_ids = [aws_security_group.vpc2_ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = var.key_pair_name

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = aws_cloudwatch_log_group.vpc2_ec2_logs.name
  }))

  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-instance"
  })
}

# Associate Elastic IPs with EC2 instances
resource "aws_eip_association" "vpc1_ec2_eip_assoc" {
  instance_id   = aws_instance.vpc1_ec2.id
  allocation_id = aws_eip.vpc1_ec2_eip.id
}

resource "aws_eip_association" "vpc2_ec2_eip_assoc" {
  instance_id   = aws_instance.vpc2_ec2.id
  allocation_id = aws_eip.vpc2_ec2_eip.id
}