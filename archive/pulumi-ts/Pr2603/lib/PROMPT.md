## Highly Available Web Application Deployment with Pulumi TypeScript

Help me in creating a secure, production-grade AWS infrastructure using **Pulumi with TypeScript**. Always adhere to security best practices and ensure compliance across the entire AWS stack.

### Requirements

1. **Code Structure**

   - All code must be provided in a **single TypeScript file**.
   - Define a class (e.g., `WebAppInfrastructure`) that is **instantiable**.
   - The class constructor should accept:
     - `region`: AWS region where resources are deployed.
     - `environment`: String value to be appended to all resource names.
     - `tags`: Key-value object to be applied as tags to all resources.
   - Use a Pulumi `aws.Provider` that is parameterized by the provided region, and all resources must be created using this provider.

2. **Networking**

   - Create a **VPC** with at least **2 public** and **2 private subnets**, distributed across different availability zones.
   - Attach an **Internet Gateway** to the VPC.
   - Deploy a **NAT Gateway** in each public subnet for outbound internet from private subnets.

3. **Compute & Scaling**

   - Deploy an **Auto Scaling Group** with:
     - Minimum size: **1**
     - Desired capacity: **2**
     - Instances running the **latest Amazon Linux 2 AMI**

4. **Load Balancing & Security**

   - Create an **Application Load Balancer (ALB)** with:
     - Listeners on ports **80 (HTTP)**
     - Security group allowing inbound traffic from anywhere on ports 80 and 443

5. **Storage & Content Delivery**

   - Create an **S3 bucket** for static content:
     - **Versioning enabled**
     - Not directly publicly accessible
     - Policy to allow access only from the **CloudFront distribution**
   - Create a **CloudFront distribution** to serve the S3 content globally.

6. **Template Output**
   - Output a **single, production-ready TypeScript file** implementing all the requirements above.
   - Focus on core logic and Pulumi best practices.
   - **No explanations or comments**—output the TypeScript code only.
