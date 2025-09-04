# secure_env/ec2.tf
# Get the first available subnet in the default VPC
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# EC2 instance with security group attached
resource "aws_instance" "secure_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name != null ? var.key_pair_name : null
  vpc_security_group_ids = [aws_security_group.secure_web_sg.id]
  subnet_id              = data.aws_subnets.default.ids[0]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  # Enable detailed monitoring
  monitoring = true

  # EBS optimization
  ebs_optimized = true

  # Root block device configuration
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true

    tags = merge(local.common_tags, {
      Name = "secure-instance-root-volume"
      Type = "EBSVolume"
    })
  }

  # User data script for basic hardening
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    
    # Configure automatic security updates
    yum install -y yum-cron
    systemctl enable yum-cron
    systemctl start yum-cron
    
    # Basic security hardening
    echo "net.ipv4.conf.all.send_redirects = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.default.send_redirects = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.all.accept_redirects = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.default.accept_redirects = 0" >> /etc/sysctl.conf
    sysctl -p
    
    # Install and configure fail2ban
    amazon-linux-extras install epel -y
    yum install -y fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
  EOF
  )

  tags = merge(local.common_tags, {
    Name = "secure-production-instance"
    Type = "EC2Instance"
  })

  # Allow termination for automated testing
  disable_api_termination = false

  lifecycle {
    ignore_changes = [ami]
  }
}