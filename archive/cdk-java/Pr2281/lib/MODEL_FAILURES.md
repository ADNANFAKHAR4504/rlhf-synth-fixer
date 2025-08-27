# How Did the Model Do? — Review of the CDK Java AWS VPC Prompt

## What You Asked For

**Summary of My request:**
- Create an AWS VPC in `us-west-1`, with a `10.0.0.0/16` CIDR block.
- Add two public subnets in different availability zones.
- Put an EC2 instance in one public subnet, with SSH access restricted to `203.0.113.0/32`.
- Attach an Internet Gateway.
- Set up public subnet route tables.
- Use new AWS features if possible (like CloudFront VPC Origins, EC2 Fleet).
- Use the latest EC2 instance types for performance/cost savings.
- Include security groups, route tables, and resource tags.
- **Important:** The code should be ready for production, follow good security and management practices, and each file should be in its own code block for easy copying.

---

## What the Model Did Right

- **Build and Project Setup:**  
  Used Gradle, Java 17, and a clear project structure with wrapper scripts. Included relevant Gradle/CDK commands and modern dependency management.

- **VPC and Subnets:**  
  Created a VPC with the correct CIDR. Deployed two public subnets in different AZs.

- **Internet Gateway:**  
  Set up implicitly by using public subnets (CDK does this under the hood).

- **Route Tables:**  
  Public subnets automatically get routes to the Internet Gateway (default CDK behavior).

-  **EC2 Instance:**  
  Deployed it in a public subnet, used the latest Amazon Linux 2023 AMI, and chose a modern instance type (`t3.micro`). Enabled monitoring and SSM/CloudWatch roles.

-  **Security Groups:**  
  Proper SSH security group only allows access from `203.0.113.0/32`.  
  Separate web security group for HTTP/HTTPS traffic.

- **Tags:**  
  Added tags to VPC, EC2, security groups, and all resources.

-  **IAM & Best Practices:**  
  Created a proper IAM role and instance profile for the EC2 instance. User data installs CloudWatch Agent and Docker, and does basic hardening.

-  **Outputs:**  
  Outputs for VPC ID, EC2 instance ID/public IP, subnet IDs, and launch template.

-  **Region:**  
  Stack is correctly set to `us-west-1`.

---

## Where the Model Missed or Could Improve

### **Big Issues**

1. **All Code in One Block**  
   The model put everything (multiple files) into a single big code block, instead of one block per file. This makes it hard to copy files directly, as you requested.

2. **CloudFront VPC Origin Not Actually Used**  
   CloudFront is only mentioned in comments; there’s no CloudFront resource or integration in the stack.

3. **Route Tables Not Explicit**  
   The stack relies on CDK’s default behavior for public subnet routing. For production, it’s better to show explicit `RouteTable` and `Route` resource creation for clarity and future extension.

4. **Instance Type Choice**  
   Uses `t3.micro` — this is modern but not the absolute latest (like `t4g.micro` or other new generation types). The model didn’t explain or optimize for performance/cost as much as requested.

5. **Hardcoded Key Name**  
   `"my-key-pair"` is hardcoded for the EC2 key. No instructions or parameters for setting your own key.

6. **No SSH Example**  
   No output or instruction for how to SSH into the instance.

7. **Documentation**  
   No separate README or in-file doc comments explaining which bits are “production best practices” or how to tweak for your needs.

---

###  **Smaller Issues**

- **No Parameterization for Key Pair or AMI:**  
  Would be better to let the user set these with parameters or context.

- **No Real Cost Optimization:**  
  No analysis or suggestion for best-value instance types.

- **CloudFront Not Even Stubbed:**  
  Could have included a commented-out placeholder for future CloudFront integration.

- **No Extra Route Table Logic:**  
  Only the default public route, nothing about custom routes or NAT for further scaling.

---

## Final Thoughts

- **Functionality:** Mostly correct and usable!
- **Prompt adherence:** Missed your “one code block per file” and CloudFront points.
- **Production readiness:** Good, but could improve with more explicit resource setup and documentation.

---