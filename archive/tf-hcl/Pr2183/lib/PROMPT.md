We need Terraform HCL that sets up AWS infrastructure for a web app. The focus should be on performance, security, and keeping costs down.  

What we want:  
- Networking: create a VPC with both public/private subnets, NAT gateway(s), and routing. Put an ALB in front of the compute.  
- Compute: auto scaling group of EC2 instances behind the ALB.  
- Database: Amazon RDS with multi-AZ failover so it’s resilient.  
- Environments: should work for both staging and production. Make it flexible so parameters can change per env. Use modules so resources are organized.  
- IAM & Security: roles should use least privilege permissions.  
- Tagging: add Department, Project, and Environment tags everywhere.  
- Ops expectations: deployable in us-east-1 and us-west-2. Must meet security/ops checks. Verify by checking tags, IAM scoping, and that infra runs as expected.  

Constraints:  
- Use locals + lookup() for per-environment values.  
- Stick to least privilege IAM.  
- Apply tags consistently.  

Output:  
- Terraform code with structure (main.tf, variables.tf, locals.tf, etc.).  
- Examples for staging + prod.  
- Add comments showing how lookup(local.map, environment) works.