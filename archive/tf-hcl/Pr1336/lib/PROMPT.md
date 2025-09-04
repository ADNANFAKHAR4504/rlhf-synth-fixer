# Terraform Multi-Environment Infrastructure (us-west-2)

## Objective
Create consistent infrastructure for multiple environments in **AWS** using **Terraform (HCL)** in the `us-west-2` region.

You must configure **production**, **staging**, and **development** environments, each isolated in its own **VPC**.

---

## Requirements

1. **VPC Isolation**  
   - Each environment must be implemented in a separate VPC.

2. **Tagging Strategy**  
   - Apply consistent tags to all resources:  
     - `Environment`  
     - `Owner`  
     - `Purpose`  

3. **Network ACLs**  
   - Define rules to **prevent cross-environment traffic**.

4. **Instance Types**  
   - Development: `t2.micro`  
   - Staging: `t3.medium`  
   - Production: `m5.large`

5. **Input Variables**  
   - Control environment details such as **CIDR block sizes**.

6. **IAM Roles & Policies**  
   - Ensure **consistent IAM roles and policies** across environments for secure access.

7. **Single State File**  
   - Maintain **one Terraform state file** for all three environments.

8. **Exclusions**  
   - No CloudWatch monitoring/logging resources.  
   - No encryption at rest or in transit.

9. **Terraform Features**  
   - Use of `for_each` is allowed and encouraged.

---

## Implementation Notes

- The entire Terraform logic must reside in **`tap_stack.tf`**, including:
  - Variable declarations
  - Default values
  - Logic for resource creation
  - Outputs  

- **`provider.tf`** already exists and defines provider configuration.  
  - The `aws_region` variable must be declared in `tap_stack.tf` and passed to `provider.tf`.

- This should be a **brand-new stack**:  
  - No pointers to pre-existing modules.  
  - All modules/resources must be created within this configuration.

- Follow **Terraform best practices** for structure and maintainability.

---

