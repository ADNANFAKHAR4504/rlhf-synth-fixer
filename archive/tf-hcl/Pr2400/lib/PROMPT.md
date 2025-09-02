Design and implement a Terraform configuration file to set up a scalable cloud environment in AWS that satisfies the following conditions:

## Requirements:

1. Deploys all resources to the **us-east-1** region.  
2. Utilizes a **variable** to specify the EC2 instance type.  
3. Implements **IAM roles** following the principle of least privilege.  
4. Stores all sensitive information within **AWS Secrets Manager**.  
5. Configures a **Virtual Private Cloud (VPC)** with at least one public and one private subnet.  
6. Applies the tag **`Environment: Production`** to all resources.  

---

## Expected output
Modularized terraform code for the reusable, with all the resources

---

## Constraints Items
- The infrastructure must be deployed to the **AWS us-east-1** region.  
- Use at least one **variable** to set the instance type for EC2.  
- Implement **IAM roles** with least privilege for all resources.  
- Ensure all sensitive data is stored in **AWS Secrets Manager**.  
- Set up a **VPC** with at least one public and one private subnet.  
- Resources must be tagged with **`Environment: Production`**.  

---

## Proposed statement
You are tasked with setting up a robust and scalable , reusabled and modularized terraform code for the cloud environment on AWS.  

The environment should support a secure, high-availability architecture suitable for production workloads.
