# Ideal Response Characteristics

## Perfect Implementation
✅ **Single-File Structure**: All resources in one `main.tf` with logical grouping.

✅ **Complete Networking**: Proper VPC with:
- Correct AZ handling
- Valid CIDR math
- NAT Gateway in public subnet
- Route table associations

✅ **Security Groups**:
- ALB with HTTP/HTTPS ingress
- EC2 with ALB-referencing ingress
- Explicit egress rules

✅ **Load Balancing**:
- HTTP→HTTPS redirect
- Proper ACM integration
- Valid target group config

✅ **Auto Scaling**:
- Launch template with:
  - Latest Amazon Linux 2 AMI
  - User data for web server
  - Detailed monitoring
- ASG across private subnets
- Target tracking policies

## Best Practices
✨ **Lifecycle Management**: `create_before_destroy` where appropriate.

✨ **Tag Strategy**: Consistent merged tags with Terraform identifier.

✨ **Validation Ready**: Works with `terraform validate` using placeholders.

✨ **Complete Outputs**: All requested outputs with clear descriptions.

## Enhanced Elements
🚀 **AMI Lookup**: Proper data source for latest Amazon Linux 2 AMI.

🚀 **Scaling Policies**: Target tracking with:
- 60% CPU for scale-out
- 20% CPU for scale-in
- Proper cooldowns

🚀 **CloudWatch**:
- High CPU alarm
- Unhealthy host alarm
- Proper metric dimensions

🚀 **User Data**:
- Idempotent package installation
- Service management
- Instance metadata display