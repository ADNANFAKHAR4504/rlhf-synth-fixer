# MODEL_FAILURES.md

This document lists possible failure scenarios or misconfigurations that may occur when deploying the associated CloudFormation template, along with recommendations for resolution.

---

## 1. Invalid Availability Zone Index

**Cause:**  
Using `!Select [1, !GetAZs '']` in a region with only one AZ available for the account.

**Resolution:**  
Ensure the region (`us-east-1`) supports at least two Availability Zones for your AWS account. Use dynamic selection with `!GetAZs ''` and wrap with a `Condition` or validate AZ count externally.

---

## 2. Insufficient NAT Gateway Configuration

**Cause:**  
NAT Gateway placed in a public subnet without proper route table association or Elastic IP allocation.

**Resolution:**  
Ensure:
- NAT Gateway is deployed in a subnet with `MapPublicIpOnLaunch: true`
- NAT Gateway has a valid Elastic IP (`AWS::EC2::EIP`)
- Private subnets route to NAT Gateway via `AWS::EC2::Route`

---

## 3. Missing IAM Role Policies

**Cause:**  
IAM roles for EC2 or RDS are missing required policies or trust relationships.

**Resolution:**  
Verify:
- EC2 Role has trust for `ec2.amazonaws.com` and a least-privilege policy (e.g., `ec2:Describe*`)
- RDS Role has trust for `rds.amazonaws.com` and necessary permissions (e.g., `rds:Describe*`)

---

## 4. Security Group Misconfiguration

**Cause:**  
Security group allows ports other than 443 or lacks rules entirely.

**Resolution:**  
Ensure the security group:
- Has **only** inbound rule for TCP port 443
- Allows all outbound traffic (`IpProtocol: -1`)
- Does not include any other inbound port ranges

---

## 5. VPC Routing Failures

**Cause:**  
Public subnets not associated with a route table that points to Internet Gateway, or private subnets not routed to NAT Gateway.

**Resolution:**  
- Associate public subnets with a route table that has a route to `!Ref InternetGateway`
- Associate private subnets with a route table that has a route to `!Ref NatGateway`

---

## 6. Missing Output References

**Cause:**  
Outputs referenced in integration tests or downstream stacks are not declared in `Outputs` block.

**Resolution:**  
Ensure required outputs include:
- `VPCId`
- All Subnet IDs
- IAM Role ARNs
- Security Group IDs

---

## 7. Deployment Region Misalignment

**Cause:**  
Deploying the stack in a region other than `us-east-1` may yield AZ or resource mismatches.

**Resolution:**  
Restrict or validate deployment in `us-east-1`. Document regional assumptions in the template's metadata or Parameters.

---

## 8. Overlapping CIDR Blocks

**Cause:**  
Accidental duplication or overlap in subnet CIDR ranges.

**Resolution:**  
Verify that all subnet CIDRs (e.g., `10.0.1.0/24`, `10.0.2.0/24`, etc.) do not overlap and are valid subsets of `10.0.0.0/16`.

---

## 9. IAM Policy Linting Errors

**Cause:**  
Improper JSON syntax, missing `Effect`, or invalid `Action` in IAM policy blocks.

**Resolution:**  
Validate all IAM policy blocks using [IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-policy-validator.html) or tools like `cfn-lint`.

---

## 10. Template Validation Failures

**Cause:**  
YAML formatting issues, incorrect indentation, or missing required properties.

**Resolution:**  
Run `aws cloudformation validate-template --template-body file://template.yaml` and `cfn-lint` before deployment.
