Here's the prompt, rephrased to sound more like human-written requirements in Markdown format:

---

## Setting Up a Secure AWS Foundation with Terraform: What We Need

---

### Our Main Goal

to design and build a really **solid and secure foundational infrastructure on AWS** using **Terraform**. We need to make sure this setup follows all the best security practices, covering everything from strong network separation to thorough logging, safe ways to handle secrets, and strict access rules.

---

### Key Pieces of the Architecture

Your Terraform configuration should set up and configure these AWS services, all within the `us-west-2` region:

- **Virtual Private Cloud (VPC)**: Think of this as our own isolated network space, complete with both public and private sections.
- **Network Access Control Lists (NACLs)**: These are like stateless firewalls that control traffic at the subnet level.
- **Security Groups (SGs)**: These are stateful firewalls that control traffic specifically for our instances.
- **AWS Identity and Access Management (IAM)**: We'll use this to set up roles and policies, making sure everyone (or everything) only has the minimum permissions they actually need.
- **AWS Secrets Manager**: This service is super important for securely storing and retrieving sensitive stuff like passwords or API keys.
- **Logging & Monitoring**:
  - **VPC Flow Logs**: To keep an eye on all our network traffic.
  - A **CloudTrail trail**: For auditing all the activity happening in our AWS account.
  - An **S3 bucket**: This one will be specifically set up to collect server access logs.

---

### Details & What's Required

- **Everything as Code (IaC)**: The entire infrastructure has to be defined using **Terraform HCL**. No manual tweaks\!
- **Region**: All resources **must** be set up in the **`us-west-2`** region.
- **Network Security Rules**:
  - Our VPC absolutely **must** have at least one **public subnet** and one **private subnet**.
  - **Security Groups need to deny all incoming traffic by default**. We'll only open specific `ingress` rules for necessary traffic, like allowing SSH from a known IP.
  - **NACLs are essential** to restrict both incoming and outgoing traffic at the subnet level, giving us that crucial second layer of defense.
- **Handling Secrets**: We're **strictly prohibiting** any hard-coded secrets, passwords, or API keys directly in the Terraform files. All sensitive data **must be stored in and referenced from AWS Secrets Manager**. You should include a simple placeholder secret in your configuration to show how this pattern works.
- **Comprehensive Logging**:
  - **VPC Flow Logs** must be turned on to capture all IP traffic details for the VPC, and those logs should go to a dedicated log group or S3 bucket.
  - A brand new **CloudTrail** needs to be created to log all management events.
  - Any **S3 buckets** we create **must have server access logging enabled**, with those logs being directed to a separate, secure S3 bucket.
- **Tag Everything**: **Every single resource** you create (VPC, subnets, SGs, IAM roles, etc.) **must have these tags**:
  - `Name`
  - `Environment` (e.g., `development`, `production`)
  - `Owner` (e.g., `DevOpsTeam`)

---

### What We're Looking For in Your Output

Please provide a set of **well-organized and clearly commented Terraform configuration files (`.tf`)**. The configuration should be ready for deployment and should successfully pass both `terraform plan` and `terraform apply` without any errors.

```terraform
# main.tf
# (This is where you'll define major resources like the VPC, subnets, etc.)

# variables.tf
# (Define all your variables here, like the region, tags, etc.)

# outputs.tf
# (Specify any important resource IDs or endpoints that should be outputted after deployment)

# security.tf
# (This file is for NACLs, Security Groups, and IAM roles/policies)

# logging.tf
# (Dedicated to CloudTrail, Flow Logs, and S3 logging configurations)
```
