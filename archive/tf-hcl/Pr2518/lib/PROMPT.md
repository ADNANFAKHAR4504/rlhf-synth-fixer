You are an expert Terraform practitioner. Produce a single, self-contained Terraform configuration that I can copy into main.tf and run immediately.

Context

Create a basic AWS network in us-east-1 with internet access for public subnets.

Hard Requirements (must all be satisfied)

Region: us-east-1 only.

Create a new VPC with CIDR 10.0.0.0/16.

Create two public subnets in different Availability Zones in us-east-1.

Create and attach an Internet Gateway to the VPC.

Create route tables that route 0.0.0.0/0 via the Internet Gateway and associate them to the public subnets.

Public IPs must auto-assign for instances launched in these public subnets (map_public_ip_on_launch = true).

Output must be valid HCL that passes terraform init && terraform validate with no extra edits.

Implementation Guidance

Use terraform and provider "aws" blocks with stable versions (e.g., AWS provider ~> 5.0, Terraform >= 1.5).

Set the provider region explicitly to "us-east-1". Do not use variables for region or CIDR; hard-code as required.

Discover two AZs dynamically via data "aws_availability_zones" and place each public subnet in a different AZ.

Use clear, deterministic names and tags (e.g., Name tags on all resources).

Public subnets: choose sensible CIDRs within 10.0.0.0/16 (e.g., 10.0.1.0/24 and 10.0.2.0/24).

Create one route table for “public” and associate both public subnets to it.

Avoid deprecated fields; make the config idempotent.

No placeholders, no variables, no modules, no remote state. Single file only.

Deliverable

Return only one fenced HCL code block containing a complete main.tf.

Do not include explanations, comments outside the code block, or extra prose.

Within the file, concise comments are OK but keep them minimal.

Acceptance Checklist (self-verify before finalizing)

 provider region = "us-east-1"

 aws_vpc CIDR = 10.0.0.0/16

 Two public subnets in different AZs, each with map_public_ip_on_launch = true

 aws_internet_gateway attached to the VPC

 Public route table with default route to IGW, associated with both public subnets

HCL validates with terraform init && terraform validate

Return the code now.
output should be in tap_stack.tf and provider.tf.