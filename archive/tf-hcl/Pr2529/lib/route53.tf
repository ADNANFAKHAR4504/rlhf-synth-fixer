resource "aws_route53_record" "vpc1_ec2" {
  count   = var.create_route53_records ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "vpc1-app.${var.route53_zone_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.vpc1_ec2_eip.public_ip]

  depends_on = [aws_eip_association.vpc1_ec2_eip_assoc]
}

resource "aws_route53_record" "vpc2_ec2" {
  count   = var.create_route53_records ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "vpc2-app.${var.route53_zone_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.vpc2_ec2_eip.public_ip]

  depends_on = [aws_eip_association.vpc2_ec2_eip_assoc]
}
