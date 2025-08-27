# Model Failures

**Security Enhancements**

- IAM role for EC2 with SSM policy was missing in the response.
- WebServer Security Group should only allow HTTP (80) from ALB; adding HTTPS (443) was unnecessary.
- HTTPS listener should forward with ACM certificate; redirect to HTTP is insecure.
- Explicit outbound (egress) rules should be defined instead of relying on defaults.

**Configuration \& High Availability**

- AMI mappings for multiple regions were missing.
- Health check threshold should be set to 3 for faster failover (5 was too high).
- EC2 instances should be registered directly inside the Target Group rather than separate attachments.

**Best Practices \& Usability**

- Parameters should be simplified (avoid excess inputs like VPC CIDR / KeyName).
- Outputs should include LoadBalancerHostedZone for Route 53 and use `https://` in LoadBalancerURL.
