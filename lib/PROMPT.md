# **AI Prompt: Secure and Scalable AWS Environment with CDK and TypeScript**

This prompt is designed to instruct an AI model in generating a comprehensive AWS CDK TypeScript program for a secure and scalable cloud environment.

### **Prompt Details**

- **Problem ID:** cloud-environment-setup_Terraform_HCL_C28M8F5LX9AV
- **Environment:** Create an expert-level CDK Typescript configuration for AWS that sets up a secure and scalable cloud environment suitable for hosting a large-scale web application.
- **Constraints Items:**
  - Use AWS as the cloud provider.
  - Define all resources in a single CDK Typescript module.
  - Ensure resources are region-independent to facilitate multi-region deployment.
  - Implement VPC with public and private subnets, accommodating at least 256 IP addresses per subnet.
  - Deploy an Application Load Balancer (ALB) spanning all AZs in the specified region.
  - Implement an Auto Scaling Group (ASG) with a minimum of two EC2 instances.
  - Use RDS for database management with Multi-AZ deployments enabled.
  - Enable CloudWatch for logging and monitoring purposes.
  - Encrypt all in-transit and at-rest data using AWS KMS.
  - Implement IAM roles for EC2 instances to interact with S3 and RDS without hardcoding credentials.
  - Deploy an S3 bucket with versioning and access logging enabled.
  - Enforce security group rules that only allow web traffic on ports 80 and 443\.
  - Ensure all data resources are defined using the data block for corresponding CDK Typescript workflows.
- **Proposed Statement:** The target infrastructure environment should enable robust, scalable applications on AWS suitable for production-grade web applications. It must support logging, monitoring, security best practices, and should not be hard-tied to a specific region, making the setup adaptable to different AWS regions as needed.

### **Requirements (Steps for the AI)**

1. **CDK Project Structure:** Create a new AWS CDK project using TypeScript. The infrastructure must be defined in a single, well-structured CDK Stack.
2. **VPC and Networking:**
   - Provision a new Virtual Private Cloud (VPC) with both public and private subnets.
   - Ensure each subnet is configured to have a CIDR block large enough to accommodate at least 256 IP addresses.
   - Do not hardcode the region; the solution must be deployable to any region.
3. **Security:**
   - Create a Security Group that enforces firewall rules to allow inbound traffic only on ports 80 (HTTP) and 443 (HTTPS).
   - Provision an AWS Key Management Service (KMS) Key to be used for data encryption.
   - Define an IAM role for the EC2 instances with policies that grant the minimum necessary permissions to interact with S3 and RDS.
4. **Application Layer:**
   - Deploy an Application Load Balancer (ALB) that spans at least two Availability Zones (AZs) and is configured to use the public subnets.
   - Create an Auto Scaling Group (ASG) for EC2 instances, placing it in the private subnets.
   - Configure the ASG with a minimum of two instances.
   - Attach the ASG to the ALB's target group.
5. **Data and Logging:**
   - Provision a Multi-AZ Amazon RDS instance in the private subnets.
   - Create an S3 bucket with versioning and server access logging enabled.
   - Configure CloudWatch to capture logs and metrics for the deployed resources.
6. **Configuration:**
   - Ensure all resources are defined using CDK's Cfn classes or high-level constructs.
   - Do not create an SSL certificate.

### **Testing Requirements**

- **Unit Tests:** Implement unit tests for the CDK program to verify the correct configuration of resources. This includes:
  - Testing the VPC and subnet configurations to ensure they meet the IP address count requirement.
  - Verifying that the Security Group rules only permit traffic on ports 80 and 443\.
  - Confirming that the ASG has the correct minimum instance count.
  - Checking that the IAM role policies adhere to the principle of least privilege.
  - Validating that the S3 bucket is configured with versioning and access logging.
- **Integration Tests:** Write integration tests to deploy the stack and validate that the deployed infrastructure meets all security and availability requirements in a live AWS environment.
- **Code Coverage:** The combined unit and integration tests must achieve **100% code coverage** for the CDK program.

### **Expected Output**

The final output should be a complete, well-commented TypeScript script using the CDK library that defines the infrastructure as code to meet all the above requirements. The code must be self-contained and runnable, including the necessary testing framework, and demonstrate a robust, scalable, and secure application architecture. The solution must be idempotent.
