# MODEL\_RESPONSE.md

## Overview

This document describes the **expected behaviors and model responses** of the AWS CloudFormation-based infrastructure automation defined in this project. The purpose is to ensure clarity on how the infrastructure behaves across different configurations, input conditions, and runtime scenarios.

The environment is designed to create a **secure, highly-available, and internet-connected VPC** with proper subnet segmentation, access control via Security Groups, and compliance with AWS best practices.

This documentation serves DevOps, QA, and Security stakeholders for validation, auditing, and troubleshooting purposes.

---

## ️ High-Level Design Assumptions

| Element            | Value                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Region             | `ap-south-1`                                                                       |
| VPC CIDR           | `10.0.0.0/16`                                                                     |
| Subnet CIDRs       | 2 Public (`10.0.1.0/24`, `10.0.2.0/24`), 2 Private (`10.0.3.0/24`, `10.0.4.0/24`) |
| Availability Zones | Selected dynamically using `Fn::GetAZs`                                           |
| Access Control     | SSH limited by Security Group CIDR                                                |
| Internet Access    | Public Subnets via IGW, Private via NAT                                           |
| Template Outputs   | VPC ID, Subnet IDs, NAT ID, IGW ID, Security Group ID                             |

---

##  Model Behavior Scenarios

### MR001 – Dynamic Availability Zone Assignment

* **Trigger**: Template uses `!Select` and `!GetAZs ''` to assign subnets to AZs.
* **Behavior**: Subnets are distributed across at least two availability zones selected at runtime.
* **Why**: Ensures HA and avoids AZ lock-in; AZ names vary between accounts.
* **Expected Output**: Subnets created in AZs like `ap-south-1a` and `ap-south-1b`, but not hardcoded.
* **Verification**: Confirm AZs via `aws ec2 describe-subnets`.

### MR002 – Public Subnets Provide Public IPs to EC2 Instances

* **Trigger**: `MapPublicIpOnLaunch: true` set on public subnets.
* **Behavior**: EC2 instances launched in public subnets receive public IPv4 addresses automatically.
* **Why**: Enables internet access through Internet Gateway.
* **Expected Output**: Instances visible with public IPs in EC2 Console.
* **Verification**: Launch test EC2 instance and ping public IP from external machine.

### MR003 – Private Subnets Route Outbound Traffic via NAT Gateway

* **Trigger**: Route table in private subnet points to NAT Gateway in a public subnet.
* **Behavior**: Instances in private subnets can access the internet **outbound only**.
* **Why**: Aligns with best practices by restricting inbound traffic to internal subnets.
* **Expected Output**: Outbound traffic works (e.g., apt/yum installs), no public IP assigned.
* **Verification**: Launch EC2 in private subnet and verify outbound internet via `curl`.

### MR004 – Internet Gateway Routes Only Apply to Public Subnets

* **Trigger**: Public route table configured with `0.0.0.0/0` → Internet Gateway.
* **Behavior**: Only public subnets can receive incoming traffic from internet.
* **Why**: Prevents accidental exposure of private resources.
* **Expected Output**: Only resources in public subnets accessible via public IP.
* **Verification**: Attempt to connect to EC2 in private subnet externally — should fail.

### MR005 – NAT Gateway Deployed in Single AZ

* **Trigger**: NAT Gateway created in one public subnet, Elastic IP attached.
* **Behavior**: Routes private subnet traffic through a single point of egress.
* **Why**: Simplifies cost and routing; acceptable tradeoff for basic HA.
* **Expected Output**: NAT Gateway ID output and route table association.
* **Verification**: Run traceroute or `curl` from private subnet EC2.

### MR006 – Security Group Restricts SSH Access to Specific CIDRs

* **Trigger**: SG ingress rule limits port 22 to a defined CIDR (e.g., `203.0.113.0/24`)
* **Behavior**: SSH is allowed only from that IP range; all others blocked.
* **Why**: Enforces least privilege and minimizes attack surface.
* **Expected Output**: `AWS::EC2::SecurityGroup` with restricted ingress.
* **Verification**: Attempt SSH from allowed and disallowed IPs.

### MR007 – Template is Region-Agnostic (Scoped to ap-south-1)

* **Trigger**: Use of dynamic AZs; no hardcoded `ap-south-1a`, etc.
* **Behavior**: Template can be re-used in ap-south-1 without change.
* **Why**: Prevents regional AZ mismatches; aligns with CloudFormation best practices.
* **Expected Output**: Successful deployments across different AWS accounts using ap-south-1.
* **Verification**: Deploy from a second AWS account and validate AZs.

### MR008 – Outputs Support Stack Validation and Integration

* **Trigger**: Outputs defined for critical resources (e.g., Subnet IDs, VPC ID)
* **Behavior**: CloudFormation exposes outputs for downstream use (cross-stack refs, CI/CD).
* **Why**: Improves observability and reuse in modular infrastructure.
* **Expected Output**:

  * `VPCID`
  * `PublicSubnet1`, `PublicSubnet2`
  * `PrivateSubnet1`, `PrivateSubnet2`
  * `NatGatewayID`, `InternetGatewayID`
  * `SSHSecurityGroupID`
* **Verification**: Check CloudFormation stack output section post-deploy.

### MR009 – Subnet-to-AZ Distribution Follows 1:1 Mapping

* **Trigger**: Use of `!Select [0, !GetAZs]`, `!Select [1, !GetAZs]`
* **Behavior**: One public and one private subnet are placed in each AZ
* **Why**: Ensures HA without cross-AZ latency
* **Expected Output**:

  * PublicSubnet1 + PrivateSubnet1 in AZ-1
  * PublicSubnet2 + PrivateSubnet2 in AZ-2
* **Verification**: Match AZs via EC2 Console or AWS CLI.

### MR010 – Subnets Use Non-Overlapping CIDR Blocks

* **Trigger**: Hardcoded CIDRs (10.0.1.0/24 → 10.0.4.0/24)
* **Behavior**: Subnets are distinct and properly isolated.
* **Why**: Prevents internal routing issues, supports clear segmentation.
* **Expected Output**: No overlapping subnet ranges.
* **Verification**: Run `aws ec2 describe-subnets` and validate CIDRs.

---

##  Validation Checklist

| Component           | Validation Method                     | Notes                        |
| ------------------- | ------------------------------------- | ---------------------------- |
| VPC Creation        | Stack status: `CREATE_COMPLETE`       | Check via console/CLI        |
| AZ Distribution     | `aws ec2 describe-subnets`            | Should span 2 AZs            |
| NAT Gateway Routing | Launch EC2 in private subnet → `curl` | Should reach internet        |
| SSH Restriction     | Attempt from unlisted IP              | Should be blocked            |
| Public IP Mapping   | Launch in public subnet               | Should auto-assign public IP |
| Outputs             | CloudFormation → Outputs tab          | Cross-stack usable           |

---

##  Notes

* Any deviation from expected behaviors above should be documented in `MODEL_FAILURES.md`
* These responses assume default deployment of the template without parameter overrides unless noted
* Model behavior may vary slightly across regions if `!GetAZs` returns different AZ identifiers

---

##  Related

* [`MODEL_FAILURES.md`](./MODEL_FAILURES.md)
* [AWS CloudFormation Resource Types](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html)
* [AWS VPC Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Subnets.html)
