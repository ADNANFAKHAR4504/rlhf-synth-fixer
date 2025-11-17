resource "aws_ssm_parameter" "app_config" {
  for_each = var.ssm_parameters

  name  = "/${local.name_prefix}/${each.key}"
  type  = "SecureString"
  value = each.value

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${each.key}"
  })
}