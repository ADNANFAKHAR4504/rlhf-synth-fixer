## Let's Get This Secure AWS Thing Built with Terraform!

### So, What's the Mission?

Hey, we're on a mission to get a really **secure AWS infrastructure** set up using Terraform. We're talking expert-level stuff here, making sure everything is coded up properly to be super secure, follow all the rules, and just work efficiently.

### The Key Stuff We Need

Your Terraform configuration needs to handle these things:

- **Region**: Everything, and I mean _everything_, needs to live in **`us-east-2`**.
- **S3 Buckets**: Any S3 buckets we make **must use AES-256 encryption**. Keep that data locked down!
- **Network Setup**: We need a **custom VPC** (let's use a `10.0.0.0/16` CIDR block for it). And only traffic from a specific IP, **`203.0.113.0/24`**, should be able to get to our instances.
- **IAM Rules**: Instead of those "inline policies," let's stick to **IAM roles** whenever possible. It's cleaner.
- **Encryption Everywhere**: Data needs to be encrypted both when it's moving (`in transit`) and when it's just sitting there (`at rest`). This goes for **S3 and RDS**.
- **Logging**: Make sure **CloudTrail is enabled** for auditing. We need to know who did what, and those logs need to be stored securely.
- **Code Organization**: Your Terraform code should be nicely **modular**. Think separate pieces for networking and for our compute stuff (like EC2s).
- **Tagging**: We need to tag **all our AWS resources** for tracking costs and management. Use these tags: 'Environment', 'Owner', and 'Department'.
- **No Hardcoded Secrets**: Absolutely **no hardcoded IAM access keys** in your Terraform code. Seriously!
- **Terraform Version**: You should be using **Terraform version 0.14 or later**.
- **Private EC2s**: Make sure our EC2 instances aren't just sitting out there exposed to the internet.

### What We're Looking For

Give us a complete Terraform HCL file (or files). It should be neat, **well-commented**, and definitely **not have any hardcoded secrets**. The big test: it needs to pass `terraform plan` and `terraform apply` without any warnings or failures, showing it meets all these security rules.

Good luck!
