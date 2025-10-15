### **Prompt for TapStack.yml Generation**

> Generate a **complete AWS CloudFormation YAML template** named **TapStack.yml** that sets up a brand-new, secure, production-grade web infrastructure in **us-east-1**.
>
> The template must include **all variable declarations (Parameters and Mappings)**, **explicit resource logic**, **Outputs**, and **consistent tagging**. It should create every required component fresh — nothing should reference pre-existing resources.
>
> #### The stack must implement the following:
>
> 1. **Networking**
>
>    * Create a new **VPC (10.0.0.0/16)** with **2 public** and **2 private subnets** across **two AZs** in *us-east-1*.
>    * Attach an **Internet Gateway** and a **NAT Gateway** in one public subnet.
>    * Route public subnets via IGW and private subnets via NAT.
> 2. **Security**
>
>    * Create a **Security Group** for EC2 that allows **SSH only from a single, user-provided IP** (parameterized as `AllowedSSHLocation`).
>    * Restrict EC2 instance launch permissions via **IAM policy** so they can launch **only in public subnets**.
>    * Ensure **KMS encryption** for all **EBS volumes**.
>    * Define **AWS Config** to continuously monitor resource compliance and trigger CloudWatch alarms for configuration drifts.
> 3. **Compute**
>
    * Launch **two EC2 instances** (parameterized `InstanceType`, allowed values only **T2 and T3 families**) in **different AZs (private subnets)**.
    * Attach an **IAM Role and Instance Profile** that grants **SSM agent access**.
    * Apply encryption to all EBS volumes using a dedicated **KMS key**.
 4. **Load Balancing**

    * Create an **Application Load Balancer (ALB)** in the public subnets.
    * Target the two EC2 instances (private subnets) via a target group.
    * Listener should handle **HTTP (port 80)** traffic only.
    * *(Exclude SSL/ACM certificate configuration entirely.)*
 5. **Storage and Data**

    * Create an **S3 bucket** for application storage with:

      * **Server-Side Encryption (SSE-S3 or KMS)**
      * **Public access blocked**
      * **S3 bucket policy** enforcing encryption
    * Create an **RDS instance** in private subnets (parameterize DB engine, username, password) and ensure **`PubliclyAccessible: false`**.
 6. **Application Integration**

    * Deploy an **SQS queue** for logging message handling.
    * Add a **Lambda function** triggered by **S3 ObjectCreated events** for auditing/logging (use inline Python code).
    * Integrate CloudWatch **CPU and memory utilization alarms** for all EC2 instances.
 7. **Content Delivery & Protection**

    * Create a **CloudFront Distribution** serving the S3 bucket as origin.
    * Attach an **AWS WAF WebACL** with sample rules (e.g., block IP set, rate limiting, SQLi/XSS rules).
 8. **Tagging**

    * Every resource must include tags:
      `Environment`, `Owner`, and `Project`.

 #### Technical requirements:

 * Use intrinsic functions (`!Ref`, `!Sub`, `!GetAtt`) properly.
 * Include all **Parameters**, **Conditions**, **Resources**, and **Outputs**.
 * Follow AWS best practices for **security, isolation, and IAM least privilege**.
 * Ensure it passes `cfn-lint` and AWS CloudFormation validation.
 * No placeholders like “TODO” — fill all required values with parameter references or logical defaults.
 * No SSL/ACM or HTTPS listener configuration (HTTP only).
 * Output the entire YAML code in a single fenced block with no explanations or commentary.

