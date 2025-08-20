# Terraform Infrastructure Deployment

Design and deploy a secure, scalable AWS cloud environment using **Terraform**.

## Requirements

1. **Region**: All resources must be deployed in `us-west-2`.  
2. **Tagging**: Every resource must include the tag `Environment=Production`.  
3. **Networking**:
   - Create a VPC with at least one **public** and one **private** subnet.  
   - Attach an **Internet Gateway** for the public subnet.  
   - Create **NAT Gateways** to allow outbound internet access from the private subnet.  
4. **Security**:
   - Configure security groups to allow:
     - HTTP (80) and HTTPS (443) traffic to application servers.  
     - SSH (22) access only from trusted IP ranges.  
5. **Deployment**:
   - Ensure the Terraform plan runs without errors.  
   - `terraform apply` must successfully provision all resources with the specified configuration.  

## Expected Output
- A Terraform `main.tf` configuration file that define and provision the described infrastructure.  
- Verified deployment in the `us-west-2` region with correct tagging (`Environment=Production`).  
