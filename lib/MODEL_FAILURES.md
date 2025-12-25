# Model Failures and Deviations

This document captures deviations from the original PROMPT.md requirements and explains why they were necessary for LocalStack compatibility.

## Deviations for LocalStack Compatibility

### 1. ACM Certificate Not Implemented

**Requirement**: Attach an ACM cert for var.domain_name with DNS validation via Route53 hosted zone ID var.

**Implementation**: ACM certificate and Route53 DNS validation were not implemented.

**Reason**: LocalStack Community edition has limited support for ACM certificate validation and Route53 DNS operations. The certificate validation workflow requires actual DNS propagation which cannot be simulated in LocalStack.

### 2. HTTPS Listener Not Implemented

**Requirement**: HTTP should redirect to HTTPS, and HTTPS terminates TLS and forwards to the target group.

**Implementation**: Only HTTP listener on port 80 that forwards directly to the target group.

**Reason**: Without a valid ACM certificate, HTTPS listeners cannot be properly configured. LocalStack does not fully support TLS termination on ALB in Community edition.

### 3. HTTP to HTTPS Redirect Not Implemented

**Requirement**: HTTP should redirect to HTTPS.

**Implementation**: HTTP listener forwards directly to target group instead of redirecting.

**Reason**: Without HTTPS listener, there is no endpoint to redirect to. The HTTP listener serves traffic directly.

### 4. File Naming Convention

**Requirement**: Call it main.tf.

**Implementation**: Named tap_stack.tf.

**Reason**: Project convention uses tap_stack.tf as the main infrastructure file to maintain consistency across all tasks in this repository.

### 5. CloudWatch Alarms Conditional

**Requirement**: CloudWatch alarms for high CPU and unhealthy ALB targets.

**Implementation**: CloudWatch alarms are wrapped with count based on var.enable_cloudwatch_alarms variable, defaulting to false.

**Reason**: LocalStack Community edition has limited CloudWatch support. Making alarms conditional allows the infrastructure to deploy successfully while still maintaining the alarm definitions for production use.

### 6. ELBv2 (Application Load Balancer) Conditional

**Requirement**: ALB goes in public subnets with HTTP forwarding to target group.

**Implementation**: ALB, target group, and listener resources are wrapped with count based on var.enable_load_balancer variable, defaulting to false.

**Reason**: ELBv2 API requires LocalStack Pro license. The API returns 501 status with "The API for service 'elbv2' is either not included in your current license plan or has not yet been emulated by LocalStack." Making these resources conditional allows basic infrastructure to deploy in LocalStack Community while maintaining full ALB definitions for production use.

## LocalStack Limitations Summary

The following AWS services have limited or no support in LocalStack Community:

- ELBv2 (Application Load Balancer) - requires Pro license
- ACM certificate validation
- Route53 DNS validation workflows
- CloudWatch metric alarms with full functionality
- ALB HTTPS/TLS termination

## Production Considerations

When deploying to actual AWS:

1. Set enable_load_balancer to true to enable ALB and target group
2. Set enable_cloudwatch_alarms to true for monitoring
3. Add ACM certificate resource with Route53 validation
4. Add HTTPS listener with certificate attachment
5. Add HTTP to HTTPS redirect action
6. Add domain_name and hosted_zone_id variables
