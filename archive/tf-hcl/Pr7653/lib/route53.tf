# Route53 Health Check for API Gateway endpoint
resource "aws_route53_health_check" "payment_api" {
  provider          = aws.route53
  type              = "HTTPS"
  resource_path     = "/${var.environment_suffix}/payment"
  fqdn              = "${aws_api_gateway_rest_api.payment_api.id}.execute-api.${local.current_region}.amazonaws.com"
  port              = 443
  request_interval  = 30
  failure_threshold = 3
  measure_latency   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-api-health-check-${local.current_region}"
    }
  )
}
