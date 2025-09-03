We need to set up a secure and scalable environment in AWS using CDK for Terraform (TypeScript). 
The design should follow best practices for networking and security.

## What to implement

Well organize the code into two files:

### modules.ts
This file should define the core resources:
- A VPC in `us-east-1` with **two public subnets** and **two private subnets**, spread across at least two AZs.
- An Internet Gateway for internet access to the public subnets.
- Route tables and associations for both public and private subnets.
- A NAT Gateway so that private subnet instances can reach the internet when needed.
- EC2 instances deployed in both the public and private subnets (they should be able to talk to each other over the VPC network).
- Security groups that enforce least privilege for inbound/outbound.
- Network ACLs to control subnet-level traffic.

Keep inline comments in the code that explain security reasoning (for example, why certain ports are open or blocked).

### tap-stack.ts
This file should pull everything together:
- Import the modules defined in `modules.ts`.
- Use variables for subnet CIDR ranges, instance types, and key configuration details (dont hardcode values).
- Define outputs for important information like:
- VPC ID
- Subnet IDs (public and private)
- EC2 instance public IPs
- NAT Gateway ID

## Key requirements

- Region: `us-east-1`. 
- VPC must include two public and two private subnets in different AZs. 
- EC2 instances should be deployed in both public and private subnets. 
- Security groups and network ACLs must enforce best practices. 
- Naming convention: use `MyApp-<ResourceType>-<ResourceID>` for all resources. 

## Deliverables

- `modules.ts` with resource definitions and security-focused comments. 
- `tap-stack.ts` that composes everything, uses variables, and defines outputs. 
- Code must pass `terraform validate` and `terraform plan` successfully.

## Notes

Keep modules clean and reusable. 
Use comments not just to describe *what* is deployed but also *why* its needed. 
The end result should mirror the CloudFormation design but expressed in CDKTF TypeScript.