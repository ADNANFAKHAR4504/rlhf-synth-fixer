You are an experienced AWS Infrastructure Engineer with deep knowledge of Infrastructure as Code (IaC) using CDKTF and TypeScript.  

I need you to create production-ready CDKTF TypeScript code that sets up a secure and modular AWS infrastructure for a project called **Tap**. The solution should follow AWS best practices for security, modular design, and least-privilege IAM policies.  

### What I need
1. **Region & Naming**
   - Everything should be deployed in `us-west-1`.
   - Every resource must be tagged like this:  
     `{ key: "Name", value: "Tap-ResourceName" }`.

2. **Networking**
   - Build a VPC with CIDR block `10.0.0.0/16`.
   - Add both **public and private subnets** across at least two Availability Zones.  
   - Private subnets must **not** have an Internet Gateway.  
   - Set up a **NAT Gateway** so private subnets can reach the internet only for outbound traffic.  
   - Turn on **VPC Flow Logs** to log all subnet communications.

3. **Compute & IAM**
   - Launch an **EC2 instance** in one of the public subnets.  
   - Give it an **IAM Role with least privilege** that only allows access to a specific S3 bucket (no others).  
   - Make sure all data is encrypted, both **in transit** and **at rest**.

4. **Security**
   - Define **Security Groups** that only allow the traffic the application actually needs.  
   - No wide-open rules like `0.0.0.0/0`, unless it’s absolutely required for functionality.

5. **Code Organization**
   - The code must be split into exactly two files:  
     - `lib/modules.ts` → reusable infrastructure components.  
     - `lib/tap-stack.ts` → the main stack that pulls everything together.  
   - Use constructs and templates so the setup is clean, consistent, and reusable.  
   - Keep the code easy to read, well-structured, and production-ready.

### What to deliver
A working CDKTF TypeScript project with just the two files mentioned above, fully implementing everything in this list and ready for deployment.  
