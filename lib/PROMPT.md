```markdown
# IaC - AWS Nova Model Breaking

You are an expert cloud infrastructure engineer specializing in AWS, Pulumi, and Python.

## Context
We are working on **Project: IaC - AWS Nova Model Breaking**.  
The goal is to **design a secure, region-agnostic AWS VPC** using Pulumi in Python. The environment should comply with strict security and compliance requirements.

---

## Problem Details
**Problem ID:** Security_Configuration_as_Code_Pulumi_Python_b9v7ltkf54m6  
**Difficulty:** Expert

### Specifications
1. **VPC Setup**  
   - Create a VPC with at least **two public subnets** and **two private subnets**.
2. **Security Configuration**  
   - Public subnets should only allow **HTTP (80)** and **HTTPS (443)** traffic using **Network ACLs**.  
   - Private subnets should route only **outbound internet traffic** through a **NAT Gateway**.
3. **Compliance & Monitoring**  
   - Enable **VPC Flow Logs** to capture all traffic for compliance and audit.
4. **Tagging Strategy**  
   - Tag all resources with **Owner** and **Environment** for cost allocation and management.
5. **Region-Agnostic Deployment**  
   - The Pulumi code must work in **any AWS region** without manual adjustments.

---

## Expected Output
- A **Pulumi Python program** that provisions the VPC according to the specifications.
- A **test suite** verifying compliance with the security and configuration constraints.
- Code should follow **best practices** for security, modularity, and reusability.

---

## Constraints
- Implement secure VPC design with required subnets and ACLs.
- Ensure outbound internet access for private subnets only via NAT Gateway.
- Capture all traffic in VPC Flow Logs.
- Tag all resources appropriately.
- Deployment must be **region-agnostic**.

---

## Deliverables
- Pulumi Python code for secure, region-agnostic VPC.
- Test suite ensuring compliance with specifications.
- Clear documentation and comments.
```
