````
This is the prompt for an AI to generate a CloudFormation YAML template based on your provided requirements. The prompt is structured to be clear, direct, and includes all necessary constraints and context, following Anthropic's prompt engineering best practices.

### Prompt for CloudFormation YAML Generation

```markdown
You are an expert in AWS and Infrastructure as Code (IaC). Your task is to generate a complete and valid AWS CloudFormation template in YAML format. The template should set up a secure and scalable environment for a production-grade web application.

**Instructions:**

1.  **Strictly adhere to the following constraints:**
    * All resources must be deployed within the **`us-west-2`** region.
    * Use **AWS IAM roles** to manage permissions for any resources that require access to S3 buckets. Do not use inline policies or user-level credentials.
    * Ensure that all data stored in **RDS instances is encrypted at rest**.
    * Implement a **VPC with public and private subnets**. The private subnets must have internet access via **NAT gateways**.
    * Add **detailed and clear comments** within the YAML code to explain the purpose of each resource and the reason for key configuration decisions.

2.  **Translate the following infrastructure requirements into the CloudFormation template:**
    * **VPC and Subnets:** Create a new VPC with both public and private subnets. The private subnets should be configured to route outbound internet traffic through a NAT Gateway.
    * **Web Servers:** Any web servers deployed in the public subnets must only be accessible via a load balancer. This implies that security groups should be configured to restrict direct public access to the web server instances.
    * **RDS:** Create an RDS database instance. The database must have encryption at rest enabled.
    * **S3 Access:** Create an IAM role with a policy that grants least-privilege access to an S3 bucket. This role should be attached to any resources (e.g., an EC2 instance or a Lambda function) that need to interact with S3.
    * **Best Practices:** The template should reflect best security practices for a production environment.

3.  **Ensure the generated YAML code is complete and syntactically correct.** It should be ready to be validated by AWS CloudFormation and should be deployable. The template should be a single, cohesive document.

4.  **Do not modify or omit any of the constraints or requirements provided.** The output must strictly follow all of the above points.

5.  **Provide the complete YAML code block only, without any introductory or concluding text outside of the code block itself.**

**Expected Output:**

A single, well-commented YAML CloudFormation template that provisions the requested AWS resources in the `us-west-2` region, following all the specified security and architectural constraints. The template must pass AWS validation and be deployable to confirm successful resource creation.
````
