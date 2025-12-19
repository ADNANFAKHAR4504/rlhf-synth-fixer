module "ec2_instances" {
  source = "./modules/ec2"

  for_each = var.ec2_instances

  instance_name        = each.key
  instance_type        = each.value.instance_type
  ami_id               = data.aws_ami.amazon_linux_2023.id
  subnet_id            = aws_subnet.public[each.value.subnet_key].id
  security_group_ids   = [aws_security_group.web.id]
  iam_instance_profile = aws_iam_instance_profile.ec2.name
  environment_suffix   = var.environmentSuffix
  enable_monitoring    = var.enable_monitoring

  common_tags = local.common_tags
}