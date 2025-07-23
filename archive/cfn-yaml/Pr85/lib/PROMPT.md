# PROMPT.md

## Title

Provision a VPC with Public and Private Subnets using AWS CloudFormation

## Problem Statement

Design an AWS CloudFormation template that provisions the following infrastructure:

### VPC and Subnet Configuration

- Create an Amazon Virtual Private Cloud (VPC).
- Create **two subnets** in **different Availability Zones**:
  - **One public subnet**
  - **One private subnet**
- Each subnet should have its own **route table**.
- The public subnet should be associated with an **Internet Gateway (IGW)** for internet access.
- The private subnet should route outbound traffic through a **NAT Gateway** placed in the public subnet.

### Network Gateway Configuration

- Attach an **Internet Gateway** to the VPC to enable internet access for the public subnet.
- Deploy a **NAT Gateway** in the public subnet to enable internet access from the private subnet.

### Security

- Create **security groups** that:
  - Allow **SSH (port 22)** access **only from a specified IP address**.
- Ensure the private subnet **does not expose resources to the public internet directly**.
- The private EC2 instance must only access the internet via the **NAT Gateway**.

### EC2 Instances

- Deploy an **EC2 instance in the public subnet**:
  - Must have a **public IP address**.
- Deploy another **EC2 instance in the private subnet**:
  - Must **not have a public IP address**.
  - Must access the internet **only through the NAT Gateway**.

### Resource Management

- Apply appropriate **tags** to all resources to support identification and management.

## Constraints

- Use only native AWS CloudFormation (**YAML or JSON**).
- Avoid use of nested stacks or third-party modules.
- All resources must be **self-contained within a single CloudFormation template**.
- Minimize hardcoding; use **Parameters** and **Mappings** where appropriate.

## Deliverables

- A single CloudFormation template (`template.yaml` or `template.json`).
