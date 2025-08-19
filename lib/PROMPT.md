## Building Our Secure AWS Production Environment with Terraform HCL

---

### What We Need to Achieve

our main goal here is to set up a **robust and secure production environment on AWS** using **Terraform HCL**. We're aiming for a setup that perfectly aligns with security best practices, all defined right in our code.

---

### Key Services We'll Be Using

Your Terraform configuration needs to provision and connect the following AWS services, all within the **`us-west-2` region**:

* **Virtual Private Cloud (VPC)**: This will be our isolated network, configured with a `10.0.0.0/16` CIDR block.
* **EC2 Instances & Auto Scaling**: We need an Auto Scaling group that keeps at least **three `t3.micro` EC2 instances** running. This group should be placed behind an **Elastic Load Balancer (ELB)** for traffic distribution.
* **S3 Buckets**: Any S3 storage we provision must enforce **AES-256 encryption** for all data.
* **IAM Roles**: We'll define all necessary IAM roles and their associated policies directly within our Terraform templates. No manual policy attachments.
* **RDS Database**: A highly available **Multi-AZ RDS instance** is required for our database needs.
* **CloudWatch Monitoring**: We'll enable detailed monitoring for all our EC2 instances. Crucially, any user data scripts running on these instances must **log their actions to CloudWatch**.
* **Network ACLs (NACLs)**: These will be used to strictly control network traffic, allowing only **TCP ports 443 (HTTPS) and 22 (SSH)**.
* **DynamoDB Tables**: Any DynamoDB tables created must have **auto-scaling enabled** for both ReadCapacityUnits and WriteCapacityUnits.

---

### Important Things to Remember (Our Constraints)

Please make sure your solution sticks to these critical points:

* **Region**: Absolutely all AWS resources must be in the **`us-west-2` region**.
* **VPC CIDR**: The VPC's network block has to be `10.0.0.0/16`.
* **Instance Type**: Only `t3.micro` instances are permitted for EC2.
* **IAM Policies**: All IAM policy attachments should be managed by Terraform, not manually.
* **CloudWatch**: Detailed CloudWatch monitoring needs to be active for EC2s, and user data scripts must log to CloudWatch.
* **S3 Encryption**: S3 buckets *must* enforce AES-256 encryption.
* **EC2 Count**: The Auto Scaling group needs a minimum of 3 EC2 instances.
* **Network Access**: NACLs must allow *only* traffic on ports 443 and 22.
* **AWS Account**: This entire setup is for a single, dedicated AWS production account.
* **RDS High Availability**: Our RDS instance must be configured for Multi-AZ deployment.
* **DynamoDB Scaling**: DynamoDB tables need to have auto-scaling for both read and write capacities.
* **Load Balancer**: An ELB must be in place in front of the Auto Scaling group.

---

### What We're Looking For

Your deliverable should be a **complete Terraform configuration in HCL**. It should be well-structured, easy to understand, and commented where necessary. When we run `terraform plan`, it needs to validate without any errors.