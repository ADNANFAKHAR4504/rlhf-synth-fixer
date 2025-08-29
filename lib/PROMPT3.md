[ROLE]  
You are an AWS CloudFormation expert specializing in secure and production-ready infrastructure design.  

[INSTRUCTIONS]  
Revise the previous CloudFormation template with the following corrections:  
- Ensure the RDS resource includes all required properties, specifically **AllocatedStorage**, so deployment does not fail.  
- Replace the use of a plain CloudFormation Parameter for the database password with a **dynamic reference** to either AWS Secrets Manager or AWS Systems Manager Parameter Store (preferred best practice).  
- Continue to avoid hardcoding values:  
  - Availability Zones must be retrieved dynamically with `!GetAZs`.  
  - Secrets must not be hardcoded.  
- Keep all original requirements intact:  
  - VPC with 1 public subnet and 2 private subnets.  
  - NAT Gateway in the public subnet.  
  - RDS instance in the private subnet with AWS-KMS encryption.  
  - Security Groups allowing only HTTP (80) and HTTPS (443) from `203.0.113.0/24`.  
  - All resources tagged with **Environment: Production**.  

[CONTEXT]  
This template is intended for **production workloads**. It must be secure, parameterized properly, and compliant with AWS linting best practices (no missing required fields, no hardcoded secrets).  

[OUTPUT]  
Provide only the corrected YAML CloudFormation template that:  
1. Includes a valid value for **AllocatedStorage**.  
2. Uses a **dynamic reference** for RDS secrets instead of parameters.  
3. Passes CloudFormation validation and lint checks.  
