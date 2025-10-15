## Error 1: Incorrect User Data Encoding Attribute

**Issue**: Used user_data attribute with base64encode() function instead of user_data_base64.

**Original Code**:
```
resource "aws_instance" "webapp_instance" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  availability_zone      = var.availability_zone
  subnet_id              = aws_subnet.webapp_subnet.id
  private_ip             = local.private_ip
  vpc_security_group_ids = [aws_security_group.webapp_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.webapp_instance_profile.name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  user_data = base64encode(local.user_data_script)

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "webapp-instance"
    }
  )
}
```

**Error Message**:
```
Warning: Value is base64 encoded

  with aws_instance.webapp_instance,
  on main.tf line 233, in resource "aws_instance" "webapp_instance":
 233:   user_data = base64encode(local.user_data_script)

The value is base64 encoded. If you want to use base64 encoding, please use the user_data_base64 argument. user_data attribute is set as cleartext in state
```

**Root Cause**: 

The user_data attribute expects cleartext input. When using base64encode() function, AWS Provider 5.x requires the user_data_base64 attribute to ensure proper state management.

**Corrected Code**:
```
resource "aws_instance" "webapp_instance" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  availability_zone      = var.availability_zone
  subnet_id              = aws_subnet.webapp_subnet.id
  private_ip             = local.private_ip
  vpc_security_group_ids = [aws_security_group.webapp_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.webapp_instance_profile.name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  user_data_base64 = base64encode(local.user_data_script)

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "webapp-instance"
    }
  )
}
```