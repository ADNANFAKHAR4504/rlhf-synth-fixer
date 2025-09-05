## Highly Available Web Application Deployment

You are tasked with deploying a **highly available web application on AWS** using **Pulumi with TypeScript**. The code must be modular, production-grade, and adhere to all best practices and requirements outlined below.

### Requirements

1. **Code Structure**

   - Provide all code in a **single TypeScript file**.
   - Define a class (e.g., `WebAppDeploymentStack`) that is **instantiable**.
   - The class constructor should accept:
     - `region`: AWS region for deployment (should default to `us-east-1`).
     - `environment`: String value to be appended to all resource names.
     - `tags`: Key-value object to be applied as tags to all resources.
   - Use a Pulumi `aws.Provider` object parameterized with the specified region, and ensure **all resources are created using this provider**.

2. **Compute & Scaling**

   - Deploy the application on **EC2 instances of type `t3.micro`**.
   - EC2 instances must be managed within an **Auto Scaling Group** configured to **scale between 1 and 3 instances**.

3. **Networking**

   - Create a **VPC** with both **public and private subnets**.
   - Application servers (EC2) must be assigned to the **public subnet**.
   - Deploy a **PostgreSQL RDS database** in the **private subnet** with **Multi-AZ support**.

4. **Load Balancing**

   - Use an **Application Load Balancer (ALB)** to distribute HTTP/HTTPS traffic across the EC2 instances.

5. **Secrets & IAM**

   - Store application secrets in **AWS Secrets Manager**.
   - Ensure EC2 instances access secrets **securely via IAM roles** with the principle of **least privilege**.

6. **Monitoring & Logging**

   - **Forward all system and application logs** to **Amazon CloudWatch Logs**.

7. **Security Groups**

   - Configure security groups to **allow HTTP/HTTPS access** to EC2 instances.
   - Restrict database access so only application servers can access the RDS database.

8. **Backups**

   - **Schedule daily backups** of the RDS instance using **AWS Backup**.

9. **IAM**

   - All IAM roles and policies must be strictly **least privilege**.

10. **Tagging**

    - Apply the provided `environment` and `tags` to all resources for cost management and identification.

11. **Output**
    - Output a **single, production-ready TypeScript file** containing all Pulumi code.
    - The code should focus on core infrastructure logic, not boilerplate or explanations.
    - **Do not include comments or extra explanations—output the code only.**
