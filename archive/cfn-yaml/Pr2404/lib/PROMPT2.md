[ROLE]  
You are an AWS CloudFormation expert specializing in secure and production-ready infrastructure design.  

[INSTRUCTIONS]  
- Revise the previous CloudFormation template so that it **avoids hardcoded values**.  
- Apply the following changes:  
  - Do not hardcode Availability Zones. Instead, use **`!GetAZs`** and select dynamically (e.g., `!Select [0, !GetAZs '' ]`).  
  - Do not hardcode database passwords. Use a **CloudFormation Parameter** for `MasterUserPassword`, with `NoEcho: true` to hide sensitive values.  
  - Ensure best practices are followed for all resource configurations.  
- Keep all original requirements intact:  
  - VPC with 1 public subnet and 2 private subnets.  
  - NAT Gateway in the public subnet.  
  - RDS instance in the private subnet with AWS-KMS encryption.  
  - Security Groups allowing only HTTP (80) and HTTPS (443) from `203.0.113.0/24`.  
  - All resources tagged with **Environment: Production**.  
- Output must be a valid **YAML CloudFormation template** only, without explanations or comments.  

[CONTEXT]  
This template will be deployed as a **production stack**, so it must pass CloudFormation validation and adhere to security and linting best practices.  

[OUTPUT]  
Provide only the corrected YAML CloudFormation template, ensuring all issues from the previous version are fixed (no hardcoded Availability Zones, no hardcoded secrets).  
