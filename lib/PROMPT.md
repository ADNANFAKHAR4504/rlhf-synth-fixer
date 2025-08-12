You are an expert in AWS cloud infrastructure design and Pulumi with Python.  
Your task is to create a robust, high-availability AWS setup in the **us-west-2** (Oregon) region that meets the following requirements:  

1. **VPC Configuration**  
   - Provision **two separate VPCs** with **non-overlapping CIDR blocks**.  
   - Each VPC must contain **two public** and **two private subnets** across multiple availability zones for redundancy.

2. **Load Balancing**  
   - Deploy an **Application Load Balancer (ALB)** to handle incoming **HTTP/HTTPS** traffic.  
   - Configure it to evenly distribute requests to EC2 instances in the **public subnets**.

3. **Compute & Scaling**  
   - Implement **Auto Scaling Groups** in each VPC.  
   - Maintain a **minimum of two EC2 instances per VPC**, scaling dynamically based on demand.

4. **Security**  
   - Use **security groups** to allow only:  
     - **HTTP/HTTPS** traffic for public subnets.  
     - **SSH access** to EC2 instances in private subnets.  
   - Apply **least privilege principles** for all configurations.

5. **Tagging & Maintainability**  
   - Tag all AWS resources for **easy identification** and **cost management**.  
   - Ensure the solution is **easily extensible** for future growth, such as adding more VPCs or integrating new AWS services.

---

**Expected Output:**  
A **Pulumi Python script** that provisions the described infrastructure in AWS.  
The deployment should be verifiable through **Pulumi preview** and **Pulumi update** commands, with all resources functioning under the specified rules and constraints.

**Key Goals:**  
- High availability and scalability.  
- Security best practices.  
- Regional deployment targeting **us-west-2**.
