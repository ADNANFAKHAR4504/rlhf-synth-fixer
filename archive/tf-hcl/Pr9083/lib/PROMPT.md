We need a single Terraform file for our AWS environment. Call it main.tf. It should have everything in one place, including variables, locals, data sources, resources, and outputs, with no splitting into extra files or pulling in random modules. I've already got a provider.tf that sets up AWS using var.aws_region, so in main.tf you just declare that variable with a default and don't reconfigure the provider.

Here's what the setup should roughly include:

Networking: One VPC on 10.0.0.0/16, grab at least two AZs dynamically. We want 2 public subnets and 2 private subnets with one of each per AZ. Public ones should auto-assign public IPs, private ones shouldn't. Public subnets connect to an Internet Gateway, private ones route through a NAT Gateway in a public subnet. Make sure we've got the right route tables set up for both.

Security groups: One for the ALB that allows 80 and 443 from anywhere with all egress, and one for EC2 that allows only port 80 from the ALB SG with all egress.

ALB and SSL: ALB goes in public subnets, attach an ACM cert for var.domain_name with DNS validation via Route53 hosted zone ID var. HTTP should redirect to HTTPS, and HTTPS terminates TLS and forwards to the target group.

EC2 and Auto Scaling: Use a launch template for Amazon Linux 2 that installs a basic web server returning instance ID using nginx or httpd. Use t3.micro with detailed monitoring on. Auto Scaling Group should span the private subnets, hook into the ALB target group with desired set to 2, min set to 2, and max set to 4. Add scaling policies to scale out at greater than 60% CPU for 5 minutes and scale in at less than 20% CPU for 10 minutes.

CloudWatch: alarms for high CPU and unhealthy ALB targets.

Tags: put together a local map for tags with Project, Environment, and ManagedBy set to Terraform, and apply everywhere possible. Use consistent naming like project_name-env in resource names.

Outputs: IDs, CIDRs, subnet IDs, ALB DNS name, TG ARN, ASG name, SG IDs, and ACM cert ARN.

Keep all the code readable and grouped logically with variables, data, locals, networking, security, ALB/ACM, compute, scaling, monitoring, and outputs. Add small comments so future-us knows what's going on. The file should pass terraform validate right away with the defaults, even if some bits like cert validation would need real values at apply time.
