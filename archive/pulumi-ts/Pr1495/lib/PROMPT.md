I need to build a secure AWS infrastructure for a web application using Pulumi with TypeScript. The deployment should follow best practices for data security, IAM permissions, and network segmentation. All infrastructure will be provisioned in the 'us-west-2' region. Here are the components I need:

1. Create S3 buckets that store application data with server-side encryption enabled using the AES-256 algorithm.
2. Define IAM roles that follow the principle of least privilege and allow EC2 instances to assume these roles without using long-lived access keys on the instances.
3. Set up a VPC that includes both public and private subnets:
   - Public subnets for application servers (e.g., EC2 instances).
   - Private subnets for backend services (e.g., databases).
4. Ensure that all database instances are only accessible from within the private subnets.
5. Configure security groups and route tables to enforce network-level access controls:
   - Allow inbound traffic on HTTP/HTTPS to public subnets only.
   - Restrict database ports (e.g., 3306 for MySQL) to private subnets only.
6. Use consistent naming conventions across all resources in the format: `projectname-resource-type`.
7. All configurations must follow AWS security best practices and ensure proper segregation between application and database layers.
8. **Explicitly associate all AWS resources with a Pulumi provider object to control the target region (`us-west-2`) and ensure portability across environments.**

Please provide the Pulumi TypeScript code implementing this infrastructure. The code should be modular, production-ready, and focused on security and maintainability. Avoid boilerplate and project scaffolding — focus only on the core infrastructure logic.
