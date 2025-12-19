You are an AWS Infrastructure-as-Code expert specialized in CloudFormation and YAML.  
Your goal is to build a secure, compliant, and connected AWS environment following the provided metadata and requirements.

# TASK CONTEXT
Platform: CloudFormation  
Language: YAML  
Target File to Modify: lib/tap_stack.TapStack.yml  
Output: Only the full updated YAML code — no explanations, no prose.

# OBJECTIVE
Generate a CloudFormation stack that implements a secure production environment in the region `us-west-2`, following all constraints listed below.

# REQUIRED COMPONENTS
1. AWS Config – to enforce configuration compliance.
2. IAM Roles & Policies – least privilege principle.
3. VPC – with both Public and Private subnets.
4. EC2 instance – deployed in the Private subnet.
5. Application Load Balancer – deployed in the Public subnet.
6. Internet Gateway – attached to the VPC for external access.
7. S3 – all buckets must use AES-256 server-side encryption.
8. CloudWatch Logs – capture logs from EC2 and ALB.
9. Detailed Monitoring – enabled for all resources.
10. Region – enforce `us-west-2`.
11. Resource Tagging – tag all resources with `Environment: Production`.

# DESIGN FOCUS
- Prioritize security best practices, compliance, and connectivity between resources.
- Ensure logical dependencies (e.g., EC2 depends on private subnet, ALB depends on public subnet, etc.).
- Use least privilege IAM policies for EC2, Config, and CloudWatch logging.
- Output must be a **complete, functional CloudFormation YAML template**, suitable for deployment.

# OUTPUT RULES
- Modify and output ONLY: `lib/tap_stack.TapStack.yml`
- Do not include explanations, comments, or text outside YAML.
- Ensure the file is self-contained and valid CloudFormation.

# INPUT EXAMPLE (from metadata)
batchId: 1389  
problem: Deploy secure AWS environment  
platform: CloudFormation  
language: YAML  
environment: us-west-2  
subject_labels: Security Configuration as Code

# OUTPUT FORMAT
Return only the YAML code for:
lib/tap_stack.TapStack.yml