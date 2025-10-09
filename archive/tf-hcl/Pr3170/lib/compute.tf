resource "aws_instance" "web" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true

    tags = {
      Name    = "${var.environment}-web-root-volume"
      Project = "ProjectX"
    }
  }

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    amazon-linux-extras install -y nginx1
    systemctl start nginx
    systemctl enable nginx
  EOF

  tags = {
    Name    = "${var.environment}-web-server"
    Project = "ProjectX"
  }
}


