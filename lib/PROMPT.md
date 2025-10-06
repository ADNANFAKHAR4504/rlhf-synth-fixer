Design a self-contained, production-ready CDKTF configuration in TypeScript for AWS. The goal is to deploy a **secure and scalable cloud environment** suitable for production workloads, resulting in two files: `modules.ts` (containing reusable infrastructure logic) and `taps-stack.ts` (defining the main stack).

**The infrastructure must strictly adhere to the following requirements:**

1.  **AWS Region:** Deploy all resources to the `us-east-1` region.
2.  **Variable Usage:** Utilize a CDKTF `TfVariable` to allow users to specify the **EC2 instance type** for a key compute resource.
3.  **Security - IAM:** Implement **IAM roles** and policies following the **principle of least privilege** for all defined resources (e.g., an EC2 role, a role for a Lambda, or any service-to-service interaction).
4.  **Security - Secrets:** Demonstrate best practices by using a resource from **AWS Secrets Manager** to store and manage a conceptual piece of sensitive data (e.g., a dummy database password). The code should set up the Secret, not just reference an existing one.
5.  **Networking:** Configure a **Virtual Private Cloud (VPC)** with at least **one public subnet** and **one private subnet**. Include the necessary components for internet access (e.g., Internet Gateway, NAT Gateway in the public subnet to allow private subnet outbound access).
6.  **Tagging:** Apply the tag `Environment: Production` to **all** deployable resources within the stack.

**Output instructions:**

  * The response must contain **only** the content of the two required files: `modules.ts` and `taps-stack.ts`.
  * Start the output with a separator clearly labeling the first file's content.

-----

**Example Structure:**

```typescript
// --- modules.ts ---
// Define a reusable construct for the VPC and subnets.
// Define a construct for a secure EC2 instance (using the variable for instance type and the least privilege IAM role).
// Define a construct for the Secrets Manager secret.

// --- taps-stack.ts ---
// Import necessary modules and constructs.
// Define the TapsStack that sets up the AWS provider and calls the constructs from modules.ts.
// Define the variable for the EC2 instance type.
// Ensure all required components (VPC, Subnets, IAM, EC2, Secrets Manager, Tagging) are correctly instantiated.
```

-----

**Goal:** Generate production-ready, clean, and well-structured CDKTF TypeScript code meeting all conditions.