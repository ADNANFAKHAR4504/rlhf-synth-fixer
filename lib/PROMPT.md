## Secure AWS Infrastructure as Code with Pulumi TypeScript

Help me write a secure, production-grade AWS infrastructure using **Pulumi with TypeScript**. Always adhere to security best practices and ensure compliance across the entire AWS stack.

### Requirements

1. **Code Structure**

   - Provide all code in a **single TypeScript file**.
   - The code should define a **class** (e.g., `SecureInfrastructure`) that can be **instantiated**.
   - The class **constructor** must accept three parameters:
     - `region`: AWS region for resource deployment.
     - `environment`: A string value to be appended to all resource names.
     - `tags`: A key-value object to be applied as tags to all resources.

2. **Pulumi Provider**

   - Use a Pulumi `aws.Provider` object to set and control the region **explicitly**.
   - All resources should be created **using this provider**.

3. **Resource Naming & Tagging**

   - All resource names must include the `environment` value for clear identification.
   - All resources must include the provided `tags` object.

4. **Security and Compliance Constraints**

   - All S3 buckets must have **versioning** and **encryption at rest** enabled.
   - All EC2 instances must be of type **t3.micro**.
   - Implement **IAM policies** ensuring users have **minimum privileges required**.
   - Configure **VPC Flow Logs** for monitoring all VPC traffic.
   - All RDS databases must be deployed in **Multi-AZ mode** for high availability.
   - Use **IAM roles** for AWS resource access instead of direct user permissions.
   - Implement **automatic backup** for all RDS instances using snapshots.
   - Ensure **CloudFront** distributions have **logging enabled**.
   - All secrets must be securely stored using **AWS Secrets Manager**.

5. **Environment and Compliance**

   - The solution should be suitable for multiple AWS regions in `ap-south-1` and `us-west-2`, with best practices for modularity and naming.

6. **Template Output and Validation**
   - Provide a **single TypeScript file** with the full Pulumi code only.
   - The code should be **production-ready**, modular, and adhere strictly to all requirements above.
