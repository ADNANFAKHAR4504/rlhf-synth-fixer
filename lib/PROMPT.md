**Objective**  
As an AWS expert you are tasked with designing an AWS cloud infrastructure using AWS CDK in TypeScript, targeting deployment in the us-west-2 region. The infrastructure must satisfy the following requirements and constraints regarding high availability, scalability, and network isolation.

---

**Constraints**

- The deployment must include a VPC with at least two subnets located in different availability zones.
- The setup should include an auto-scaling group with a minimum of two EC2 instances distributed across multiple availability zones.

---

**Problem Statement**

Design and implement an AWS CDK Stack in TypeScript to provision the following resources:

1. **VPC**:  
   - Must have at least two subnets, each in a distinct availability zone.
   - Should use AWS best practices for high availability and isolation.
   - Naming convention for resources: `projectX-<component>` (e.g., `projectX-vpc`, `projectX-subnet1`, etc.).
   - The environment should use the default VPC and security settings unless overridden for explicit requirements.

2. **Auto Scaling Group**:  
   - Must maintain a minimum of two EC2 instances at all times.
   - Instances should be distributed across multiple availability zones for redundancy.
   - Should accommodate variable loads via scaling policies.

3. **Internet Gateway**:  
   - Attach to the VPC to enable public access.
   - Ensure subnets are correctly routed for public network access as required.

4. **Security Groups**:  
   - Create security groups that permit HTTP (port 80) and HTTPS (port 443) traffic to EC2 instances.
   - Follow AWS security best practices for group configuration.

5. **Region and Environment**:  
   - All resources should be deployed in `us-west-2`.
   - Use the naming convention `projectX-<component>` for all resources.
   - Ensure the stack is deployable as a single TypeScript file and adheres to the specified constraints and best practices.

---

**Expected Output**

- Provide a single, complete TypeScript file for the AWS CDK stack.
- The file must successfully deploy the described environment when run.
- The solution must strictly follow the constraints above and demonstrate expert-level AWS CDK architecture and implementation.

---

**Additional Notes**

- The solution should be scalable, highly available, and secure.
- Allow the use of default VPC settings unless stricter network isolation is needed.
- All code should be well-commented for clarity.