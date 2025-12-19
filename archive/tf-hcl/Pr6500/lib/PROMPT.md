Hey team,

We’re gearing up to ship the new customer-facing stack for the e-commerce launch, and we need a crisp Terraform plan to
make it happen. The app is a containerized Node.js API plus a React frontend, and product is adamant about zero downtime
while traffic ramps up.

Here’s what we’re building:

- Region locked to `us-east-1` with exactly three availability zones.
- Fresh VPC with three public subnets for the ALB and three private subnets for the ECS tasks, each AZ paired. Internet
  gateway for ingress, NAT gateways for egress.
- ECS Fargate cluster and service running two tasks minimum (scale up to ten) behind an Application Load Balancer. ALB
  health checks every 30 seconds and stick with the five-minute unhealthy threshold.
- Application Auto Scaling policy that reacts at 70% average CPU.
- Private ECR repository with vulnerability scanning switched on for the images.
- CloudWatch Log Group with seven-day retention wired to the task definition.
- IAM roles with least-privilege policies for the task execution role and the application task role.
- Systems Manager Parameter Store entries for non-secret configuration.
- ACM certificate hook for the ALB listeners, but make the certificate resource optional and disabled by default (assume
  validation is already done when we do enable it).
- Route 53 record set that points to the ALB once it’s live.

Let’s keep the Terraform tidy and modular:

- `lib/networking.tf` – VPC, subnets, route tables, internet/NAT gateways.
- `lib/compute.tf` – ECS cluster, task definition, service, target group, listeners, scaling policies.
- `lib/iam.tf` – execution role, task role, and any inline/managed policies.
- `lib/monitoring.tf` – CloudWatch log group and any alarms worth wiring up.
- `lib/locals.tf` – tagging strategy, AZ maps, shared locals that keep the files readable.
- `lib/variables.tf` – inputs for domain names, container image tags, scaling thresholds, certificate toggle, etc.
- `lib/outputs.tf` – ALB DNS name, ECR repository URL, and anything CI/CD needs.

A couple of reminders:

- Provider setup already lives in `lib/provider.tf`; don’t touch it.
- Stick to Terraform 1.5+ syntax and AWS provider 5.x resources.
- Make sure dependencies are explicit so `terraform apply` comes up clean the first time.
