## Multi-Service AWS Environment Migration

Help in building a fully functional, secure AWS cloud environment using Pulumi with TypeScript. Make sure that the solution must comply with all listed requirements and AWS best practices for security, scalability, and efficiency.

### Requirements

1. **Code Structure**

   - Provide all code in a **single TypeScript file**.
   - Define a class (e.g., `EnvironmentMigrationStack`) that is **instantiable**.
   - The class constructor must accept:
     - `region`: AWS region for deployment (must be `us-east-1`).
     - `environment`: String suffix to be appended to all resource names.
     - `tags`: Key-value map to be applied as tags to all resources.
   - Use a Pulumi `aws.Provider` object parameterized with the provided region, and ensure **all resources are created using this provider**.

2. **Networking**

   - Create a **VPC** with **at least two subnets** in different Availability Zones.
   - Deploy **NAT Gateway** for outbound traffic from private subnets.

3. **Storage**

   - Create **S3 buckets** with **versioning enabled**.

4. **IAM**

   - Define **IAM roles** using the path `/service/` and enforce **least privilege** for all permissions.

5. **Compute & Monitoring**

   - Launch **EC2 instances** using the **latest Amazon Linux 2 AMI**, with **CloudWatch alarms** monitoring CPU usage.

6. **Database & Serverless**

   - Deploy **RDS** instances with **Multi-AZ** enabled for high availability.
   - Create **encrypted DynamoDB tables** (encryption at rest).
   - Deploy **Lambda functions** within the VPC, ensuring all sensitive data is present in secrets manager.

7. **Networking & Delivery**

   - Deploy a **CloudFront distribution** with **logging enabled**.
   - Enable **cross-zone load balancing** on any **Application Load Balancers (ALB)**.

8. **Security & Compliance**

   - Use **AWS KMS** for encrypting all sensitive data in transit and at rest.
   - Ensure that **all resources are deployed in the provided region only** (must be `us-east-1` for compliance).

9. **Tagging**

   - Apply the `environment` value and `tags` to all resources for easy management and identification.

10. **Template Output**
    - Output a **single, validated, production-ready TypeScript file** containing all Pulumi code.
    - Focus on core logic; avoid boilerplate and explanations.
    - **Do not include comments or extra explanations—output the code only.**
