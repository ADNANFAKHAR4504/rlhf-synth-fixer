We need a single Terraform file for our AWS environment. Call it main.tf. It should have everything in one place — variables, locals, data sources, resources, and outputs — no splitting into extra files or pulling in random modules. I’ve already got a provider.tf that sets up AWS using var.aws_region, so in main.tf you just declare that variable with a default, don’t reconfigure the provider.

Here’s what the setup should roughly include:

Networking: One VPC on 10.0.0.0/16, grab at least two AZs dynamically. We want 2 public subnets and 2 private subnets (one of each per AZ). Public ones should auto-assign public IPs, private ones shouldn’t. Public subnets connect to an Internet Gateway, private ones route through a NAT Gateway in a public subnet. Make sure we’ve got the right route tables set up for both.

Security groups: One for the ALB (allow 80 and 443 from anywhere, all egress) and one for EC2 (allow only port 80 from the ALB SG, all egress).

ALB & SSL: ALB goes in public subnets, attach an ACM cert for var.domain_name (DNS validation via Route53 hosted zone ID var). HTTP should redirect to HTTPS, and HTTPS terminates TLS and forwards to the target group.

EC2 & Auto Scaling: Use a launch template for Amazon Linux 2 that installs a basic web server returning instance ID (nginx/httpd is fine). t3.micro, detailed monitoring on. Auto Scaling Group should span the private subnets, hook into the ALB target group, desired=2, min=2, max=4. Add scaling policies (scale out at >60% CPU for 5m, scale in at <20% CPU for 10m).

CloudWatch: alarms for high CPU and unhealthy ALB targets.

Tags: put together a local map for tags (Project, Environment, ManagedBy=Terraform) and apply everywhere possible. Use consistent naming like ${var.project_name}-${var.env} in resource names.

Outputs: IDs, CIDRs, subnet IDs, ALB DNS name, TG ARN, ASG name, SG IDs, ACM cert ARN.

Keep all the code readable and grouped logically: variables, data, locals, networking, security, ALB/ACM, compute, scaling, monitoring, outputs. Add small comments so future-us knows what’s going on. The file should pass terraform validate right away with the defaults, even if some bits (like cert validation) would need real values at apply time.