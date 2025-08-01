# MODEL\_FAILURES.md

## Overview

This document outlines **potential failure scenarios and misconfigurations** related to the CloudFormation-based AWS VPC infrastructure automation. It highlights both design-time and runtime risks, and provides diagnostic clues and mitigation strategies. The goal is to ensure infrastructure reliability, security, and maintainability.

Failures are categorized into deployment-level, runtime-level, and configuration-level problems.

---

## ❌ Common Failure Scenarios

### MF001 – Hardcoded Availability Zones

* **Condition**: AZ values like `ap-south-1a` are hardcoded.
* **Failure**: Stack may fail in other AWS accounts where `ap-south-1a` is mapped to a different physical AZ.
* **Impact**: Deployment failure.
* **Mitigation**: Use `!Select` and `!GetAZs` to assign AZs dynamically.

---

### MF002 – Missing Internet Gateway Association

* **Condition**: IGW created but not associated with the route table of public subnets.
* **Failure**: EC2 instances in public subnets cannot reach the internet.
* **Impact**: Broken public access.
* **Mitigation**: Validate that route tables have `0.0.0.0/0` → IGW.

---

### MF003 – NAT Gateway Deployed Without Elastic IP

* **Condition**: NAT Gateway is provisioned but no Elastic IP assigned.
* **Failure**: NAT Gateway cannot route traffic to the internet.
* **Impact**: Private subnet instances cannot connect externally.
* **Mitigation**: Attach an Elastic IP at creation.

---

### MF004 – Private Subnet Route Table Missing NAT Route

* **Condition**: Private subnet route table lacks `0.0.0.0/0` route to NAT.
* **Failure**: EC2s in private subnet cannot reach internet.
* **Impact**: No updates/packages from internet.
* **Mitigation**: Ensure private route table points to NAT Gateway.

---

### MF005 – Overlapping Subnet CIDRs

* **Condition**: CIDR blocks like `10.0.1.0/24` and `10.0.1.0/24` used in multiple subnets.
* **Failure**: CloudFormation deployment fails or subnet creation fails silently.
* **Impact**: Routing conflicts or undeployed resources.
* **Mitigation**: Validate CIDR uniqueness manually or via linter.

---

### MF006 – Security Group Allows SSH From `0.0.0.0/0`

* **Condition**: Ingress rule on port 22 uses unrestricted CIDR.
* **Failure**: Security vulnerability due to brute-force exposure.
* **Impact**: Potential intrusion or scanning attacks.
* **Mitigation**: Restrict SSH to approved CIDRs only.

---

### MF007 – NAT Gateway Created in Non-Public Subnet

* **Condition**: NAT Gateway provisioned in a subnet without IGW access.
* **Failure**: NAT cannot function without outbound route.
* **Impact**: Private subnets lose internet access.
* **Mitigation**: Ensure NAT Gateway is deployed only in subnets routed to IGW.

---

### MF008 – Template DeletionPolicy Not Set for Critical Resources

* **Condition**: No `DeletionPolicy: Retain` on NAT Gateway or VPC.
* **Failure**: Stack deletion may wipe out critical infra.
* **Impact**: Accidental data or configuration loss.
* **Mitigation**: Use `DeletionPolicy: Retain` for long-lived/shared resources.

---

### MF009 – Route Table Not Explicitly Associated to Subnet

* **Condition**: Subnet created without `AWS::EC2::SubnetRouteTableAssociation`.
* **Failure**: Subnet uses default route table (unexpected behavior).
* **Impact**: Confusing or incorrect routing.
* **Mitigation**: Always associate subnets with the correct route tables explicitly.

---

### MF010 – Outputs Refer to Nonexistent Logical IDs

* **Condition**: `!Ref` or `!GetAtt` used on undeclared resource in `Outputs`.
* **Failure**: Stack fails at the output resolution stage.
* **Impact**: Entire stack marked as `ROLLBACK_COMPLETE`.
* **Mitigation**: Ensure all outputs reference valid resources.

---

## 💼 Recommendations

* Run `cfn-lint` before deployment to catch structural/template errors.
* Use `aws cloudformation validate-template` before pushing changes.
* Monitor `Events` tab during stack creation for granular error visibility.
* Avoid hardcoding AZs, account-specific values, or IPs unless parameterized.

---

## 🔗 Related

* [`MODEL_RESPONSE.md`](./MODEL_RESPONSE.md)
* [AWS CloudFormation Troubleshooting Guide](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/troubleshooting.html)
* [AWS Well-Architected Framework – Operational Excellence](https://docs.aws.amazon.com/wellarchitected/latest/framework/operational-excellence.html)
