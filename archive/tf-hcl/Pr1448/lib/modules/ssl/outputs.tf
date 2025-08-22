output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.main.arn
}

output "certificate_domain_name" {
  description = "Domain name of the certificate"
  value       = aws_acm_certificate.main.domain_name
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener"
  value       = aws_lb_listener.https.arn
}

output "http_redirect_listener_arn" {
  description = "ARN of the HTTP redirect listener"
  value       = aws_lb_listener.http_redirect.arn
}
