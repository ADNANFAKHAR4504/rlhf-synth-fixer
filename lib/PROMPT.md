You are an **expert AWS Solutions Architect** and **AWS CDK v2 (TypeScript) developer**.  
Generate a **single TypeScript file** containing the complete CDK stack for deploying a **secure, production-ready 3-tier web application** in AWS.

### Architecture Context
The application follows the 3-tier model:
1. **Presentation Tier** – Static content served via S3 + CloudFront.
2. **Application Tier** – EC2 instances in an Auto Scaling Group, behind an internet-facing Elastic Load Balancer.
3. **Data Tier** – Managed RDS instance in private subnets.

### Requirements
1. **VPC & Networking**
   - Create a VPC spanning **two Availability Zones** in **us-east-1**.
   - Include **public** and **private** subnets in each AZ.
   - Public subnets host the Elastic Load Balancer.
   - Private subnets host EC2 instances and the RDS database.

2. **Security**
   - Security group for the ELB: allow inbound HTTP (80) & HTTPS (443) only.
   - Security group for EC2: allow traffic from ELB only.
   - Security group for RDS: allow traffic from EC2 only.
   - RDS must not be publicly accessible.

3. **Application Tier**
   - EC2 Auto Scaling Group in private subnets.
   - Instance type: `t3.medium`.
   - Scaling based on CPU utilization using CloudWatch alarms.

4. **Database Tier**
   - Managed RDS instance in private subnets.
   - Encryption at rest enabled using AWS KMS.
   - Multi-AZ deployment for high availability.

5. **Frontend & Content Delivery**
   - S3 bucket for static content with versioning enabled.
   - CloudFront distribution serving content from S3.

6. **DNS**
   - Create a Route 53 hosted zone.
   - Add A/AAAA records pointing the domain to the ELB.

7. **Monitoring**
   - CloudWatch alarms for EC2 CPU utilization (triggering scale in/out).

8. **Tagging**
   - Tag all resources with:
     - `Owner`
     - `Purpose`

### Constraints
- **All code must be in a single `.ts` file** (no extra modules).
- Use **AWS CDK v2** imports.
- Ensure correct resource creation order using CDK dependency constructs.
- All servers (EC2 & RDS) must be in **private subnets**.
- **Stack name must be `TapStack`**.

### Output
- Return only the **TypeScript code** for the file `tap-stack.ts`.
- The CDK stack class must be named `TapStack`.
- Include both `cdk.App` and `cdk.Stack` in the same file so it is deployable with:
  ```bash
  cdk bootstrap
  cdk deploy