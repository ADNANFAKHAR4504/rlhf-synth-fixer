# **AI Prompt: Multi-Region Web Application Deployment with CDK and Typescript**

This prompt is designed to instruct an AI model in generating a CDK Typescript program for a highly available web application deployed across multiple AWS regions.

### **Prompt Details**

- **Problem ID:** Web_Application_Deployment_CDK_Typescript_04o8y7hfeks8
- **Environment:** You are tasked with deploying a highly available web application using CDK with Typescript. The infrastructure must be scalable, secure, and span multiple AWS regions.
- **Constraints Items:**
  - Deploy the application to AWS using CDK and Typescript.
  - Ensure high availability across two AWS regions: us-east-1 and us-west-2.
  - Configure an AWS Load Balancer to distribute traffic.
  - Implement an auto-scaling group with a minimum of two instances and a maximum of five.
  - Secure the application with a Security Group allowing traffic only on ports 80 and 443\.
- **Proposed Statement:** Deploy the web application using CDK with Typescript to AWS, spanning across two regions: us-east-1 and us-west-2. Use naming conventions that reflect the application's staging environment.

### **Requirements (Steps for the AI)**

1. **CDK Project Structure:** Create a new CDK project with a structure that supports multi-region deployments. The program must handle separate resource declarations for us-east-1 and us-west-2.
2. **Resource Naming:** All resources must follow a consistent naming convention that includes the staging environment (e.g., dev or prod).
3. **Networking & Security:**
   - Create a new VPC for the application in each region (us-east-1 and us-west-2).
   - Define public subnets within each VPC to host the Load Balancer.
   - Create a Security Group in each region that allows inbound traffic on ports 80 (HTTP) and 443 (HTTPS).
4. **Application Layer:**
   - In each region, create a launch template for the web application instances, specifying the AMI, instance type, and the Security Group.
   - Implement an Auto Scaling group in each region, configured to use the launch template. The group should have a minimum of 2 instances and a maximum of 5\.
5. **Load Balancing:**
   - Provision an Application Load Balancer (ALB) in each region, placing it in the public subnets.
   - Attach the Auto Scaling group from each region to the respective ALB's target group.

### **Testing Requirements**

- **Unit Tests:** Implement unit tests for the CDK program to verify the correct configuration of resources. This includes:
  - Testing the Security Group rules to ensure only ports 80 and 443 are open.
  - Verifying that the Auto Scaling groups have the correct min/max instance counts.
  - Confirming that resources are correctly associated with their respective regions and VPCs.
- **Integration Tests:** Write integration tests to deploy the stack and validate that the deployed infrastructure meets all requirements.
- **Code Coverage:** The combined unit and integration tests must achieve **100% code coverage** for the CDK program.

### **Expected Output**

The final output should be a complete, well-commented Typescript script using the CDK library that defines the infrastructure as code to meet all the above requirements. The code must be self-contained and runnable, including the necessary testing framework, and demonstrate a highly available, scalable, and secure multi-region deployment.
