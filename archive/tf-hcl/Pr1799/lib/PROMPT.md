Design and provision a secure AWS infrastructure using Terraform HCL in the `us-west-2` region. The goal is to establish a well-architected environment that emphasizes security, modularity, and best practices. Follow these key requirements:

1. **Terraform HCL**: All resources must be defined in Terraform HCL with clean, modular code.  
2. **Networking**: Create a VPC with both public and private subnets, ensuring proper network isolation. Configure a NAT Gateway in the public subnet to allow controlled internet access for private subnet resources.  
3. **Storage**: Provision S3 buckets that are private by default and encrypted at rest using AWS KMS keys for maximum data protection.  
4. **Identity & Access**: Implement IAM roles and policies that strictly adhere to the principle of least privilege, granting only the exact permissions required.  
5. **Security**: Configure security groups carefully—allowing only necessary traffic. SSH (port 22) access must be restricted to a specific, trusted IP range.  
6. **Modularity**: Use Terraform modules to logically organize and separate components of the infrastructure, improving maintainability and clarity.  

**Expected Output:** Deliver a complete set of Terraform HCL files that define the above infrastructure. The configuration should be production-ready, logically modularized, pass `terraform validate`, and reflect AWS security best practices. The code must be executable without modification, deploying all resources securely into `us-west-2`.
