Generate a **single Terraform file named `main.tf`** that contains **everything** (variables with defaults, locals, data sources, resources, and outputs) for the following AWS environment. Do **not** split into multiple files and **do not** use external modules. I already have a separate `provider.tf` that configures the AWS provider using `var.aws_region`, so just declare that variable in `main.tf` and do **not** re-declare the provider here.

## Hard requirements

1. **Region & variables**

* Declare `variable "aws_region"` with default `"us-east-1"` and description. This variable is consumed by my existing `provider.tf`, so just declare it here; do not configure the provider in `main.tf`.
* Include any additional variables *in this same file* with sensible defaults so `terraform validate` passes without user input (e.g., `project_name`, `env`, `domain_name`, `hosted_zone_id`). Use placeholder defaults where real values are needed (e.g., `"app.example.com"` and `"ZAAAAAAAAAAAAA"`).

2. **VPC & networking**

* Create a new VPC with CIDR **10.0.0.0/16**.
* Discover at least **2 availability zones** dynamically with `data "aws_availability_zones"` and use the first two.
* Create **one public** and **one private** subnet (one per AZ; total 2 public + 2 private).
* Public subnets: `map_public_ip_on_launch = true`.
* Private subnets: no public IPs.
* Create and attach an **Internet Gateway**.
* Create **one NAT Gateway** in a public subnet with an Elastic IP, and route private subnets’ default routes through it.
* Create route tables:

  * Public route table: default route to IGW and associations to all public subnets.
  * Private route table: default route to NAT Gateway and associations to all private subnets.

3. **Security groups**

* **ALB SG**: allow inbound **80 and 443** from `0.0.0.0/0`; allow all egress.
* **EC2 SG**: allow inbound **80** only from the ALB SG; allow all egress.

4. **Load balancer + SSL**

* Create an **Application Load Balancer** (ALB) in public subnets.
* Create an **ACM certificate** in **us-east-1** for `var.domain_name`. Include **DNS validation** records (via `aws_route53_record`) in `var.hosted_zone_id`. Use placeholders by default so `terraform validate` succeeds even if apply would later require real values.
* ALB listeners:

  * 80 → redirect to HTTPS (301).
  * 443 → terminate TLS with the ACM cert and forward to target group.

5. **EC2 + autoscaling**

* Create a **Launch Template** for Amazon Linux 2 (latest) with user data that:

  * Installs a simple web server (e.g., nginx or httpd) returning a page with instance ID to confirm traffic.
  * Enables and starts the service.
* Use **t3.micro** (default) with **detailed monitoring enabled**.
* Create an **Auto Scaling Group** across **both private subnets**, attached to the ALB **target group**.
* Desired capacity **2**, min **2**, max **4**.
* Add **target tracking** OR **step scaling** policies:

  * Scale out when average CPU > 60% for 5 minutes.
  * Scale in when average CPU < 20% for 10 minutes.

6. **CloudWatch monitoring**

* Enable detailed monitoring on instances via the Launch Template.
* Create CloudWatch **alarms**:

  * High CPU (>= 70% for 2 eval periods) on the ASG (using the ASG group metric).
  * Unhealthy host count on the ALB target group (> 0 for 2 periods).
* (Optional) Output alarm ARNs.

7. **Tags & best practices**

* Apply a common `local.tags` map (e.g., `Project`, `Environment`, `ManagedBy = Terraform`) to all taggable resources.
* Use meaningful names that include `${var.project_name}-${var.env}` prefixes.
* Use `lifecycle { create_before_destroy = true }` where appropriate (e.g., Launch Template versions not required, but safe on ALB target group if you rotate).
* Keep everything self-contained; no references to any pre-existing resources except Route53 hosted zone via variable.

8. **Outputs**
   Provide outputs for:

* VPC ID and CIDR
* Public subnet IDs (list)
* Private subnet IDs (list)
* ALB DNS name
* Target group ARN
* ASG name
* Security group IDs (ALB and EC2)
* ACM certificate ARN

## File constraints

* Everything must be in this single `main.tf`; **no** other files.
* Use only **Terraform AWS provider resources** (no external modules).
* The configuration must pass `terraform init` and `terraform validate` (assuming a valid AWS account and placeholder domain/zone values).
* Include concise comments explaining each major block.

## Style

* Clear variable blocks with descriptions and sane defaults.
* Use `locals` for computed names and common tags.
* Prefer `for_each` or `count` for creating subnets across AZs.
* Keep the code readable and logically grouped (variables → data → locals → networking → security → ALB/ACM → compute/ASG → scaling policies/alarms → outputs).

Return only the HCL content for `main.tf` with no extra prose.