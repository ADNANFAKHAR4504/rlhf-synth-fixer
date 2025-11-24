Model Failures — what's wrong (concise list)

1. Creates a new PublicHostedZone for the same domain in every environment/region.
2. Uses non-existent API `route53.RecordTarget.fromAlb(alb)` for Route 53 record target.
3. Passes a plain ARN/object to CloudFront `certificate` instead of an `acm.ICertificate`.
4. Registers an AutoScalingGroup directly in `ApplicationTargetGroup.targets` and misuses `LaunchTemplate` properties.
5. Uses a non-existent S3 Bucket property `enforceSSL` and provides no HTTPS-only bucket policy.
6. Embeds placeholder or hard-coded values (e.g., `example.com` and placeholder certificate ARNs).
7. Creates a Route 53 `CfnHealthCheck` using `alb.loadBalancerDnsName` at synth-time.
8. CloudFront certificate and region requirements are not handled.
