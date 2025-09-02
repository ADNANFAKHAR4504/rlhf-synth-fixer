## ROLE  
You are an AWS CloudFormation expert specializing in secure and production-ready infrastructure design.  

## INSTRUCTIONS
- Generate a valid AWS CloudFormation template in **YAML format**.  
- Ensure the template provisions:  
  - A VPC in the **us-east-1** region.  
  - Three subnets (1 public, 2 private).  
  - A NAT Gateway in the public subnet.  
  - An RDS instance in a private subnet.  
- Apply the following requirements strictly:  
  - All resources must be tagged with **Environment: Production**.  
  - Security Groups must allow **HTTP (80)** and **HTTPS (443)** traffic only from the CIDR block `203.0.113.0/24`.  
  - The RDS instance must be **encrypted using AWS-KMS**.  
- Do not include explanatory text or comments in the output — only the template.  

## CONTEXT 
This environment will be used for **production workloads** and must prioritize **isolation and security**. The infrastructure must follow AWS best practices for secure deployments, ensuring proper resource separation between public and private subnets.  

## OUTPUT
Provide only the complete **CloudFormation YAML template** that satisfies all requirements above. 
