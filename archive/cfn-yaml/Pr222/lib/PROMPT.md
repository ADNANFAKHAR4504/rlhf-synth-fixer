Here's a prompt designed to align with Claude Sonnet's best practices for building complex AWS infrastructure using CloudFormation, focusing on resource connections and high availability.

-----

```
You are an expert AWS Solutions Architect specializing in highly available, scalable, and secure web application deployments using AWS CloudFormation. Your task is to generate a complete CloudFormation YAML template for a multi-service web application, meticulously connecting all resources as per the requirements.

**Context:**
The web application needs to be deployed in the `us-west-2` region. It comprises an Application Load Balancer (ALB), an Auto Scaling group for the application servers, an RDS database, and static asset storage on S3. High availability, robust security, and proper logging are paramount.

**High-Level Requirements:**
1.  **Core Application Components:**
    * **Application Load Balancer (ALB):**
        * Must have an HTTPS listener configured on port 443.
        * Utilize a valid SSL/TLS certificate from AWS Certificate Manager (ACM). The ARN of this certificate will be provided as a CloudFormation parameter.
        * Enable access logging, storing logs in a newly created S3 bucket.
    * **Auto Scaling Group (ASG):**
        * Deploy application instances across at least two Availability Zones within `us-west-2`.
        * Launch Configuration or Launch Template for EC2 instances should include basic setup (e.g., a simple web server installation script in UserData for demonstration purposes) and necessary security group associations.
        * Connect the ASG to the ALB via a Target Group.
    * **RDS Database (MySQL or PostgreSQL - specify your choice and justify):**
        * Multi-AZ deployment for high availability.
        * Use a CloudFormation `NoEcho` parameter for the database master user password to ensure it's passed securely at deployment.
        * Appropriate security group to allow connections only from the ASG instances.
2.  **Static Asset Storage:**
    * Create a dedicated S3 bucket for static web application assets.
    * Configure public read access for this bucket (or recommend a CloudFront distribution if you deem it a better practice and explain why).
3.  **DNS Configuration:**
    * Configure a custom domain name in Route 53, creating an `A` record alias that points to the ALB.
    * The Hosted Zone ID and the custom domain name will be provided as CloudFormation parameters.
4.  **Security and Best Practices:**
    * **IAM Roles:** Define specific IAM roles for the EC2 instances in the ASG with permissions limited to what's only necessary for the web application (e.g., S3 read access for static assets, no broader permissions).
    * **Security Groups:** Meticulously configure security groups to allow only necessary ingress/egress traffic between components (e.g., ALB to ASG, ASG to RDS, public access to ALB).
    * **Tagging:** Ensure *all* created AWS resources are tagged with `Environment: Production`.
5.  **Region:** All services must be deployed in the `us-west-2` region.

**Expected Output:**
Generate a complete and deployable AWS CloudFormation YAML template within `<yaml_code>` tags.

The template should include:
* `AWSTemplateFormatVersion`
* `Description`
* `Parameters` (including the secure password parameter, ACM certificate ARN, Hosted Zone ID, and custom domain name)
* `Resources` (defining all components like VPC, Subnets, Internet Gateway, Route Tables, Security Groups, ALB, Target Group, Launch Template/Configuration, Auto Scaling Group, RDS, S3 Buckets, Route 53 Record Set, IAM Roles, IAM Policies).
* `Outputs` (e.g., ALB DNS Name, S3 Static Assets Bucket URL, Route 53 CNAME)

**Constraints & Best Practices to Adhere To:**
* **Modularity and Readability:** Structure the YAML with clear sections and comments to enhance readability and maintainability.
* **Least Privilege:** Strict adherence to IAM least privilege principles for all roles and policies.
* **Security:** Prioritize secure configurations (HTTPS, encrypted RDS, tightly controlled security groups).
* **High Availability:** Ensure Multi-AZ deployments for RDS and Auto Scaling Group spanning multiple AZs.
* **Idempotency:** The template should be idempotent, meaning it can be run multiple times without unintended side effects.
* **Dynamic Referencing:** Use CloudFormation intrinsic functions (`!Ref`, `!GetAtt`, `!Sub`, `!ImportValue`, etc.) for inter-resource dependencies and dynamic value resolution.
* **No Hardcoding:** Avoid hardcoding values directly in the template where parameters or intrinsic functions can be used.
* **Resource Naming:** Use clear and consistent naming conventions for resources.

**Thinking Process (for Claude Sonnet):**
Before generating the CloudFormation YAML, please outline your detailed thought process. This should include:
1.  **Architectural Breakdown:** Decompose the web application into its fundamental AWS components and their logical grouping (e.g., Networking, Compute, Database, Storage, DNS, Security).
2.  **Component Interdependencies:** Explain how each component will connect and depend on others.
3.  **High Availability Strategy:** Detail how Multi-AZ for RDS and ASG across AZs will be implemented.
4.  **Security Implementation:** Describe the approach for IAM roles, security groups, HTTPS, and secure password handling.
5.  **Parameterization:** Identify all necessary CloudFormation parameters and explain their purpose.
6.  **Resource Mapping to CloudFormation Constructs:** List the specific CloudFormation resource types you will use for each part of the architecture.
7.  **YAML Structure:** Describe how the template will be structured to maximize readability and maintainability.

**User Input (Example - to be filled in by the user later):**
`<user_input>`
<acm_certificate_arn>arn:aws:acm:us-west-2:123456789012:certificate/abcdefgh-1234-5678-9012-abcdefghijkl</acm_certificate_arn>
<route53_hosted_zone_id>Z1ABC2DE3FGHIJ</route53_hosted_zone_id>
<custom_domain_name>mywebapp.example.com</custom_domain_name>
</user_input>`
```