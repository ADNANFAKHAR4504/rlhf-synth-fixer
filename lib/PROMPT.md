**Prompt:**

You are an AWS Solutions Architect with deep expertise in CloudFormation YAML best practices. Please design a CloudFormation template named **`TapStack.yml`** that provisions a **highly secure, production-ready AWS environment** in the `us-west-2` region. The solution must follow AWS security best practices, be fully compliant, and include the following components:

1. **Networking**

   * Create a VPC with both public and private subnets.
   * Deploy appropriate route tables and gateways to allow internet access only where required.

2. **Compute & Access Control**

   * Launch an **EC2 instance** in the public subnet.
   * Restrict SSH access to this instance so it is only allowed from a specific, designated IP address.
   * Attach an **IAM role with `ReadOnlyAccess`** permissions to the EC2 instance.
   * Configure an **Auto Scaling group** with a minimum of **two instances** to ensure redundancy.

3. **Storage**

   * Create an **S3 bucket** with versioning enabled.
   * Restrict bucket access using a **bucket policy** that only permits access from within the VPC.

4. **Database**

   * Deploy an **RDS instance** into the private subnet.
   * Ensure **storage encryption** is enabled for the database.

5. **Serverless**

   * Implement a **Lambda function** that is automatically triggered whenever a new object is uploaded to the S3 bucket.

6. **Monitoring & Alerts**

   * Configure **CloudWatch alarms** to monitor EC2 CPU utilization.
   * If CPU usage exceeds **80%**, send a notification via **SNS**.

7. **Tagging & Outputs**

   * Apply the tag `Environment:Production` to all resources.
   * Define stack **outputs** for the following:

     * EC2 Public IP
     * RDS Endpoint
     * S3 Bucket Name

**Constraints:**

* Use **YAML format** for the CloudFormation template.
* Ensure the template passes deployment without errors.
* Adhere to AWS best practices for naming conventions, security, and compliance.
