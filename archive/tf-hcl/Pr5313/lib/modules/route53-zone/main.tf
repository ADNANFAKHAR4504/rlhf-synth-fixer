resource "aws_route53_zone" "private" {
  name = var.domain_name

  vpc {
    vpc_id     = var.primary_vpc_id
    vpc_region = var.primary_vpc_region
  }

  tags = merge(
    var.project_tags,
    {
      Name      = var.domain_name
      ManagedBy = "terraform"
    }
  )
}
