# CloudFormation Template Prompt for Node.js Web App Deployment


**Task:** Deploy a scalable Node.js web application using AWS CloudFormation and Elastic Beanstalk.


Write a fully functional and production-ready **AWS CloudFormation template (YAML)** to deploy a Node.js web application with the following requirements:


### 1. Networking
- Create a **VPC** with CIDR block `10.0.0.0/16`.
- Include at least 2 **public subnets** in different Availability Zones.
- Include **Internet Gateway**, **Route Tables**, and proper routing for external access.


### 2. Security
- Create **Security Groups** allowing inbound HTTP (port 80) only.
- Use **parameters** for all CIDR ranges (e.g., allowed IPs).


### 3. Compute & Application Layer
- Deploy a Node.js app using **Elastic Beanstalk**.
- Use parameters for:
  - Application Name
  - Environment Name
  - Solution Stack (Node.js)
  - Instance Type
- Enable **auto-scaling** (min: 1, max: 4 instances).


### 4. Storage
- Create an **S3 bucket** for static assets.
- Bucket name must be **parameterized** (no hardcoding).


### 5. Monitoring
- Enable **CloudWatch** application and infrastructure monitoring.
- Include basic **CPU utilization alarms**.


### 6. IAM & Security
- Create **least-privilege IAM roles** and instance profiles.
- Use **managed policies** where appropriate.
- Ensure secure access to **S3** and **CloudWatch**.


### 7. Cross-Account Executability
- **No hardcoded values** (account IDs, ARNs, region names).
- All references must use CloudFormation intrinsic functions (`!Ref`, `!Sub`, `!GetAtt`) or parameters.
- Template must be deployable in **any AWS account or region** without modification.


### 8. Outputs
- Application URL
- Elastic Beanstalk environment name
- S3 bucket name
- Security Group ID


### 9. Additional Requirements
- Follow best practices for **naming** and **tagging** AWS resources.
- Include `Description` fields for parameters, resources, and outputs.
- Template must be **valid and deployable** via both AWS Console and CLI.
- Provide minimal **comments** explaining key sections.


**Deliverable:**
A single CloudFormation YAML template ready for deployment across AWS accounts, supporting ~4,000 daily users with basic scaling, monitoring, and secure access.
