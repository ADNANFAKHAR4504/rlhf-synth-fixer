You are an expert AWS CDK (TypeScript) engineer. Generate a production‑ready CDK TypeScript application (CDK v2) that uses CloudFormation (via CDK) to deploy a multi‑environment, multi‑region AWS infrastructure exactly as described below. Do NOT change, remove, or reinterpret any of the provided data — keep everything intact. Where resource names require uniqueness or a suffix, append a String suffix to the resource name. Follow the naming convention [environment]-[region]-[service][Suffix] for all resources that need a suffix.

Problem summary
- Create an AWS multi‑environment infrastructure using the CloudFormation API with TypeScript (CDK). The infrastructure must meet the following requirements exactly as stated.

Requirements (implement exactly)
1. Deploy separate VPCs in each specified AWS region, ensuring CIDR blocks do not overlap.  
2. Deploy AWS Lambda functions that are triggered by S3 events, operational in all environments.  
3. Set up PostgreSQL RDS instances equipped with encrypted storage in each region.  
4. Configure Security Groups to admit inbound traffic only on port 443, specifically for load balancers.  
5. Implement DNS management and failover capabilities using Route 53.  
6. Establish AWS IAM Roles to facilitate cross-account access between environments.  
7. Employ Terraform input variables (simulated here via custom parameters) to control EC2 instance counts per region.  
8. Configure environment-specific CloudWatch Alarms to monitor EC2 CPU utilization.  
9. Ensure all S3 buckets are versioned and accessible only through HTTPS.  
10. Define a CloudFront distribution to manage request routing smoothly across AWS regions.  
11. Use AWS Secrets Manager for database credential management.  
12. Implement cross‑environment SNS topics to handle application error notifications.  
13. Monitor compliance with AWS Config rules for tagging and encryption standards.  
14. Set Elastic Load Balancer auto‑scaling policies based on real‑time traffic demands.  
15. Utilize AWS Auto Scaling Groups to ensure a minimum of two instances are running consistently per environment.

Constraint items
- Each AWS region must have a dedicated VPC with non-overlapping CIDR blocks.  
- An AWS Lambda function must be created that is invoked by AWS S3 events in all environments.  
- All environments must have an RDS instance configured for PostgreSQL, using encrypted storage.  
- Security Groups must be configured to allow inbound traffic only on port 443 for the load balancers.  
- Route 53 must be used to manage DNS across environments with domain failover capabilities.  
- Each environment should utilize AWS IAM Roles for cross-account access between environments.  
- Terraform input variables must be utilized to control the number of EC2 instances per region, defaulting to 3.  
- Environment-specific CloudWatch Alarms need to be configured for EC2 instance CPU utilization.  
- Buckets in AWS S3 must have versioning enabled and be accessible only via HTTPS.  
- Define a common Amazon CloudFront distribution for routing requests to the closest AWS region.  
- Use AWS Secrets Manager to store and retrieve database credentials programmatically.  
- Implement an SNS topic for application error notifications across environments.  
- Utilize AWS Config rules to monitor compliance with tagging and encryption standards.  
- Each Elastic Load Balancer must be configured to automatically scale based on demand.  
- AWS Auto Scaling Groups must be used to maintain a minimum of two running instances per environment.

Environment & operational notes 
- The CDK code must be written in TypeScript and be compatible with CDK v2.  
- Make region(s) and environment(s) configurable (parameters/context) so the same code can deploy to multiple environments (e.g., dev, staging, prod). Do not hardcode region choices — allow providing a list of target regions.  
- Simulate Terraform input variables via CDK custom parameters or context values for EC2 instance counts per region; default value is 3. The same parameter name(s) should be easy to change at deploy time.  
- When the resource name needs to be globally unique or environment‑specific, append a String suffix; follow the naming convention [environment]-[region]-[service][Suffix]. Document where to change the suffix.  
- Use least‑privilege IAM roles and policies for all components (Lambda, EC2, RDS management, CloudFormation/Stack roles). Avoid embedding secrets in code — reference Secrets Manager or Parameter Store.  
- Ensure all S3 buckets are versioned and enforce HTTPS‑only access (block public access).  
- Ensure RDS instances use encrypted storage and Secrets Manager for credentials.  
- Ensure CloudWatch alarms are environment‑specific and set to monitor EC2 CPU utilization; include alarm actions (SNS).  
- Implement Route 53 failover and weighted records for cross‑region traffic control as part of the CloudFront / ALB origin and DNS design.  
- Create cross‑environment SNS topics (or a central SNS with cross‑region subscriptions) for error notifications.  
- Include AWS Config rule resources (or enable Config recorder & rules) to monitor tagging and encryption standards.  
- ALBs must be configured with target groups, health checks, and auto‑scaling policies based on real‑time traffic metrics; ASGs must ensure min 2 instances.  
- Wire S3 → Lambda event notifications for the Lambdas required in each environment.

Deliverables 
- A complete CDK TypeScript application (single repo layout or a small multi‑stack app) that can be deployed with cdk synth / cdk deploy.  
- Clear README with instructions to: install dependencies, configure AWS credentials, set environment/context values (including how to set the simulated Terraform variables for EC2 counts), synth and deploy per environment and region.  
- Code structure: modular constructs or stacks for core areas (networking/VPCs, compute/ASGs/ALBs, serverless S3+Lambda, databases/RDS, DNS/Route53+CloudFront, monitoring/CloudWatch+AWS Config, IAM cross‑account roles, SNS).  
- CDK parameters/context that simulate Terraform input variables (EC2 counts per region, default = 3).  
- All resource names that require uniqueness must include a clearly‑documented String suffix; default suffix value set in one clear location (context/params).  
- Unit/integration test examples (jest or similar) that validate CDK constructs synthesize correctly and basic assertions (e.g., S3 buckets have versioning, Lambdas have S3 event sources, RDS are encrypted, security groups allow only 443 for ALBs). Include at least one end‑to‑end test description or script that validates deployed resources (smoke tests) — e.g., API endpoint check, Lambda invocation, DB connectivity check (read-only), and CloudWatch alarm presence.  
- CloudFormation stack outputs for key endpoints and ARNs: CloudFront domain, Route53 record names, SNS topic ARNs, Secrets Manager ARNs, RDS endpoints, Auto Scaling Group names, Lambda ARNs.  
- Inline comments explaining where to change environment names, target regions, EC2 counts, and suffix values.  
- Avoid hardcoding credentials or secrets — show where to put them in Secrets Manager/Parameter Store and reference them in code.  
- Follow secure defaults (least privilege, no public S3 access, encryption at rest for DB/EBS where relevant).  
- Ensure the app produces deployable CloudFormation templates and can be validated by automated AWS solution tests.

 expectations
- Code must be modular and readable; use reusable constructs; prefer typed interfaces for configuration.  
- Prefer CloudFormation native constructs available in CDK (avoid third‑party hacks unless necessary and documented).  
- Provide notes describing any AWS service limitations or caveats relevant to the design (e.g., KMS and region constraints, CloudFront regional origin behavior, cross‑account role considerations).  
- Include a short “post‑deployment validation” checklist (console and CLI checks) that verifies key aspects such as S3 versioning, RDS encryption, Lambda triggers, CloudFront distribution status, Route53 failover behavior, and CloudWatch alarms.

Testing & verification
- Include unit tests for the CDK constructs (jest or similar) that assert required properties (e.g., S3 versioning on, bucket policy requires HTTPS, Lambda event source mapping exists).  
- Provide an example integration/smoke test script (Node.js/Python) that can be run after deployment to validate: Lambda invocation via S3 upload, DB connection read test (using Secrets Manager value), and HTTP request to CloudFront / ALB to confirm 200/healthy response.  
- Include instructions to re‑run tests per environment.

Final notes 
- Do NOT change or reinterpret any of the requirement text, constraint items, or environment descriptions above — they must be implemented exactly.  
- Ensure String suffix is appended to resource names where needed and document how to change the suffix.  
- Produce only CDK TypeScript code (CloudFormation via CDK). Do not produce Terraform, Pulumi, or other IaC outputs.  
- Keep secrets out of source code; use Secrets Manager or Parameter Store as required.

