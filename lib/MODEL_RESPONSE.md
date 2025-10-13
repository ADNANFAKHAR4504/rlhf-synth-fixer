# Model_response.md

## Title
TapStack.yml — Production-Ready VPC + NAT + Private EC2 + ASG (us-west-2)

## Summary
This response delivers a single CloudFormation template (**TapStack.yml**) that builds a new network stack in **us-west-2** with:
- VPC 10.0.0.0/16, DNS hostnames/support enabled
- 2 public + 2 private subnets across distinct AZs
- IGW attached to VPC; public route tables route 0.0.0.0/0 → IGW
- NAT Gateway + Elastic IP in a public subnet; private route tables route 0.0.0.0/0 → NATGW (no direct IGW route)
- Two **t2.micro** EC2 instances in private subnets
- Security Group allowing SSH only from **203.0.113.0/24**
- IAM Role + Instance Profile granting least-privilege S3 read/write to an app bucket (encrypted, public access blocked)
- Auto Scaling Group using a **Launch Template** (modern, LC deprecated), min=2 / desired=2 / max=4, spread across both private subnets
- CloudWatch Alarms on ASG CPU: scale-out ≥70%, scale-in ≤30%
- Clear **Outputs**: VPC ID, subnet IDs, NATGW ID, ASG name, bucket name
- **Region guard** / guidance to ensure deployment in **us-west-2**

## Files Produced
- `TapStack.yml` — full CloudFormation template (parameters, logic, outputs).  
  *Note:* The template uses a Launch Template (not Launch Configuration) per current AWS guidance.

## How Region Is Enforced
CloudFormation deploys to the region you choose in CLI/Console. The template includes a lightweight check (Region guard) and documentation instructing you to run with `--region us-west-2`. This prevents accidental deployments in other regions.

## Validation Command
```bash
aws cloudformation validate-template --template-body file://TapStack.yml
