You are an expert AWS DevOps Engineer specializing in creating robust, secure, and automated infrastructure using AWS CloudFormation.

Your task is to generate a comprehensive, production-ready AWS CloudFormation template in **YAML format**. This template will deploy a highly available and secure Node.js web application stack.

Ensure the template meets the following detailed requirements:

1.  **VPC and Networking:**
    * Provision a new VPC.
    * Create **public and private subnets** across **two Availability Zones**.
    * Configure an Internet Gateway for the public subnets and NAT Gateways (one per AZ) for the private subnets.

2.  **Application Hosting (Elastic Beanstalk):**
    * Deploy an AWS Elastic Beanstalk environment configured for a **Node.js** application.
    * Enable **automatic scaling** by configuring an Auto Scaling Group with parameters for minimum and maximum instances.
    * Implement a **health check** configuration to monitor application health and automatically replace unhealthy instances.

3.  **Database (RDS):**
    * Provision an Amazon RDS for **PostgreSQL** database instance.
    * The RDS instance must be configured for **Multi-AZ deployment** to ensure high availability.
    * Enable **encryption at rest** for the database instance.
    * The database must be deployed into the private subnets and be accessible only from the Elastic Beanstalk instances.

4.  **Security and DNS:**
    * Configure a **custom domain** using Amazon Route 53, creating an 'A' record (Alias) that points to the Elastic Beanstalk environment.
    * Secure all application traffic by configuring the Application Load Balancer to terminate **HTTPS**, redirecting all HTTP traffic to HTTPS.
    * Create a custom **IAM role** and instance profile for the Elastic Beanstalk application. This role must follow the principle of least privilege, granting only the necessary permissions to write to CloudWatch Logs and read from a specific S3 bucket.

5.  **Monitoring and Logging:**
    * Configure the Elastic Beanstalk environment to stream all application and system logs to **Amazon CloudWatch Logs**.

### Output Requirements:

* The output must be a single, valid CloudFormation **YAML** template.
* Do not hardcode sensitive information. Use a `Parameters` section for user-configurable inputs like `DomainName`, `CertificateArn` (for a pre-existing ACM certificate), `DBUsername`, and `DBPassword`.
* Use `NoEcho: true` for the `DBPassword` parameter.
* Include an `Outputs` section that displays critical resource information after deployment, such as the `ApplicationURL` and the `RDSEndpoint`.
* The entire deployment must be **fully automated** and require no manual intervention. Adhere strictly to AWS best practices for security and high availability.
