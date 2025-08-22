You are an expert AWS infrastructure engineer and Terraform CDK (CDKTF) specialist. Your task is to design and implement a **security-hardened, dual-region AWS infrastructure** using **TypeScript with CDKTF** that meets advanced security, monitoring, and compliance requirements.

### **Here's the plan:**

We're targeting a dual-region deployment in **`us-east-1`** and **`us-west-2`**. The setup in each region should be a mirror of the other, but managed independently.

The core of this task is security and best practices:

- **IAM Lockdown:** All IAM roles and policies need to follow the principle of least privilege. I want to see precise permissions for every function - no `"*"` wildcards allowed.
- **Encryption Everywhere:** All data at rest must be encrypted. We'll use our own **customer-managed KMS keys** for this. The key policies themselves need to be restrictive, only allowing specific, authorized IAM roles to perform crypto operations.
- **Logging:** Let's get everything logged to CloudWatch. Any service we spin up must be configured to send its logs there for monitoring.
- **Good Housekeeping:** Make sure we're applying our standard tags (`Environment`, `Owner`, `Project`) to every single resource. The design should also be modular, so we can easily reuse these components for other environments down the road.

---

### **What the final deliverable should look like:**

I'm looking for a **single, clean CDKTF TypeScript file** that implements this entire setup. The code needs to be idempotent and run through `cdktf synth` and `plan` without any issues. When I review the plan, I should be able to clearly verify that the IAM policies are specific, the KMS encryption is correctly configured, and all the logging is in place.

---

### **Just a few ground rules:**

- Please stick to **CDKTF with TypeScript** for this.
- Let's not hardcode any secrets. We can parameterize them as needed.
- A major rule: **no public internet exposure** for any service by default. Everything should be private unless explicitly required and secured.
