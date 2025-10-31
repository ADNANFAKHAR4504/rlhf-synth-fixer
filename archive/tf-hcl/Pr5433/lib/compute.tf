# EC2 instances across multiple availability zones using for_each
resource "aws_instance" "app_server" {
  for_each = toset(var.availability_zones)

  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  subnet_id              = element(var.subnet_ids, index(var.availability_zones, each.key))
  vpc_security_group_ids = [aws_security_group.imported_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.imported_role_profile.name

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl enable httpd
              systemctl start httpd
              echo "Application server in ${terraform.workspace} environment" > /var/www/html/index.html
              EOF

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = {
    Name             = "app-server-${each.key}-${var.environment_suffix}"
    AvailabilityZone = each.key
    Environment      = terraform.workspace
    MigrationPhase   = var.migration_phase
  }
}

# EBS volumes for application data
resource "aws_ebs_volume" "app_data" {
  for_each = toset(var.availability_zones)

  availability_zone = each.key
  size              = var.ebs_volume_size
  type              = "gp3"
  encrypted         = true

  tags = {
    Name           = "app-data-volume-${each.key}-${var.environment_suffix}"
    Environment    = terraform.workspace
    MigrationPhase = var.migration_phase
  }
}

# Attach EBS volumes to EC2 instances
resource "aws_volume_attachment" "app_data" {
  for_each = toset(var.availability_zones)

  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.app_data[each.key].id
  instance_id = aws_instance.app_server[each.key].id
}
