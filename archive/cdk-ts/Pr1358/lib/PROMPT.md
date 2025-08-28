I need a single AWS CDK v2 (TypeScript) file that deploys a complete 3-tier web application stack.  
The stack should be called TapStack, and everything should be in one `.ts` file — no extra modules.

Here’s what the architecture should look like:

### Overall setup
- Deploy in the us-east-1 region.
- Use the classic 3-tier model:
  1. Frontend: Static content in S3 served through CloudFront.
  2. App tier: EC2 instances in an Auto Scaling Group, behind an internet-facing Elastic Load Balancer.
  3. Database tier: Managed RDS instance in private subnets.

### Networking
- A VPC across two Availability Zones with both public and private subnets.
- Public subnets hold the load balancer.
- Private subnets hold EC2 instances and the RDS database.

### Security
- ELB security group: allow inbound HTTP (80) and HTTPS (443) only.
- EC2 security group: allow traffic from the ELB only.
- RDS security group: allow traffic from EC2 only, not publicly accessible.
- Follow least-privilege principles everywhere.

### Application tier
- EC2 Auto Scaling Group in private subnets, instance type `t3.medium`.
- Auto scale in/out based on CPU using CloudWatch alarms.

### Database tier
- Multi-AZ RDS deployment in private subnets.
- Encrypted at rest with KMS.

### Frontend & content delivery
- S3 bucket with versioning for static content.
- CloudFront distribution serving the S3 bucket.

### DNS
- Create a Route 53 hosted zone.
- Add A/AAAA records pointing to the load balancer.

### Monitoring
- CloudWatch alarms for CPU to trigger scaling.

### Tagging
- Tag every resource with `Owner` and `Purpose`.

### Important constraints
- Everything must be in one `.ts` file.
- Use AWS CDK v2 imports.
- Make sure resources are created in the right order (add dependencies if needed).
- Both `cdk.App` and the `TapStack` stack definition should be in the same file so I can run:
  ```bash
  cdk bootstrap
  cdk deploy
