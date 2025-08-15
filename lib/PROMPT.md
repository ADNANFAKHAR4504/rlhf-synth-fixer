Hey there! Here's a rewritten prompt that sounds more like a real person wrote it, with less formatting and a casual, direct tone.

---

### We need to build a Secure Financial App Infrastructure

we need to set up a really **secure and available cloud infrastructure** for our financial services app. We have to use **Terraform** to get it all done.

Here’s the rundown of what we need:

- **Everything in Terraform:** All the components should be defined using **Terraform HCL**.
- **Multi-Region:** The whole setup needs to be in multiple AWS regions for high availability. We can't have the system go down.
- **Data Encryption:** All our stored data has to be encrypted using **AWS KMS**. This is super important for a financial company.
- **IAM Roles:** Define **IAM roles and policies** to give services and components only the permissions they need.
- **VPC Layout:** Design a **VPC with both public and private subnets**. This helps with security and makes sure our services can talk to each other safely.
- **Logging and Monitoring:** We need to set up **AWS CloudWatch** to log and monitor everything.

Just give us the Terraform files that define this infrastructure. They should be clean, pass all the validation, and deploy correctly when we run them.

├── outputs.tf
├── provider.tf
└── tap_stack.tf

Above is my directory structure. Generate a response accordingly
