### ## Critical Security Vulnerabilities  보안

#### **Failure #1: Publicly Exposed Application Servers**
* **Severity:** Critical 🚨
* **Description:** The `aws_autoscaling_group` resources in both the primary and secondary regions are configured to launch EC2 instances directly into the **public subnets**. This places the application servers directly on the internet, exposing them to scans, attacks, and potential compromise.
* **Impact:** High risk of unauthorized access and server compromise. The Application Load Balancer (ALB) is meant to be the sole public entry point, but this configuration bypasses that protection entirely.
* **Recommendation:**
    1.  Modify the `aws_autoscaling_group` resources to use the IDs of the **private subnets** (`aws_subnet.primary_private` and a new set of secondary private subnets).
    2.  Implement a NAT Gateway in the public subnet of each region and add a route (`0.0.0.0/0`) from the private route table to the NAT Gateway. This allows instances in the private subnets to securely access the internet for patches and updates without being publicly accessible.

#### **Failure #2: Overly Permissive IAM Policy for Lambda**
* **Severity:** High ⚠️
* **Description:** The `aws_iam_policy` for the cost-saving Lambda function uses `"Resource": "*"` for EC2 and RDS actions. This violates the principle of least privilege.
* **Impact:** If the Lambda function's code were compromised, an attacker could stop **any EC2 or RDS instance in the entire AWS account**, including critical production resources that don't match the intended "testing" tags.
* **Recommendation:** Refine the IAM policy to restrict actions to resources that contain a specific tag. For example, use a `Condition` block to only allow `ec2:StopInstances` on instances where `ec2:ResourceTag/Environment` is 'Testing'.

#### **Failure #3: Insecure Secret Management**
* **Severity:** High ⚠️
* **Description:** The RDS database password is provided via a Terraform input variable (`var.db_password`). This means the plaintext password exists in CLI history, CI/CD logs, and potentially in `.tfvars` files, which is a major security risk.
* **Impact:** High risk of database credential exposure, leading to a potential data breach.
* **Recommendation:** Store the database password in **AWS Secrets Manager**. The Terraform configuration should create a secret and the application instances should be granted IAM permissions to retrieve it at runtime.

---

### ## Architectural & Resiliency Flaws 🏗️

#### **Failure #4: Incomplete Disaster Recovery Strategy for Database**
* **Severity:** Critical 🚨
* **Description:** The architecture is described as "multi-region high availability," but the PostgreSQL RDS instance exists **only in the primary region (`us-east-1`)**. While it is Multi-AZ, that only protects against an Availability Zone failure, not a full regional outage.
* **Impact:** In the event of a `us-east-1` region failure, the entire application will be down with **no database available for the secondary region to use**. This is a single point of failure for the entire data tier.
* **Recommendation:** Implement a cross-region read replica. Create an `aws_db_instance` read replica in the secondary region (`us-west-2`). In a disaster recovery scenario, this replica can be manually or automatically promoted to a standalone, writable master instance.

#### **Failure #5: Missing Private Subnet and Routing in Secondary Region**
* **Severity:** High ⚠️
* **Description:** The configuration for the secondary region (`us-west-2`) only defines **public subnets**. It completely lacks the `aws_subnet.secondary_private`, `aws_nat_gateway`, and private `aws_route_table` resources.
* **Impact:** This makes it impossible to deploy resources securely in the secondary region. The architecture is inconsistent and incomplete.
* **Recommendation:** Replicate the networking stack from the primary region into the secondary region, ensuring it has both public and private subnets, a NAT Gateway, and corresponding route tables.

---

### ## Connectivity & Functional Bugs 🐛

#### **Failure #6: Non-Functional VPC Peering**
* **Severity:** High ⚠️
* **Description:** While the `aws_vpc_peering_connection` is successfully created and accepted, the configuration is **missing the `aws_route` resources** in both the primary and secondary VPCs' route tables.
* **Impact:** The two VPCs have no route to each other. Any attempt by an EC2 instance in `us-east-1` to communicate with a resource in `us-west-2` over their private IPs (or vice-versa) will fail. The VPC peering is effectively useless as is.
* **Recommendation:** Add `aws_route` resources to the private route tables in each region. The primary VPC's route table needs a route for the secondary VPC's CIDR (`10.2.0.0/16`) pointing to the peering connection ID, and vice-versa.

#### **Failure #7: Cost-Saving Lambda Logic Will Never Execute**
* **Severity:** Medium 😑
* **Description:** The Lambda function is hardcoded to search for EC2 instances with the tag `Environment` set to `Testing`. However, the `locals.common_tags` block hardcodes the `Environment` tag as `Production` for **all resources deployed by this configuration**.
* **Impact:** The Lambda function will run every night, incur a small cost, and do absolutely nothing. It will never find any resources to stop.
* **Recommendation:** Parameterize the `Environment` tag in the `locals` block (e.g., `Environment = var.environment`). This would allow you to deploy a separate "testing" stack where the Lambda would function as intended.

---

### ## Operational Deficiencies ⚙️

#### **Failure #8: Missing Remote State Backend**
* **Severity:** Critical 🚨
* **Description:** The configuration is missing a `terraform` block that defines a remote backend (like S3 with DynamoDB for locking).
* **Impact:** The Terraform state file (`terraform.tfstate`) will be stored locally. This is unacceptable for any team project or CI/CD pipeline, as it leads to state file conflicts, divergence, and a high risk of accidental infrastructure destruction. It makes collaboration impossible.
* **Recommendation:** Add a `backend "s3" {}` block to the `terraform` configuration. Create a dedicated S3 bucket for state storage and a DynamoDB table for state locking as part of your AWS account bootstrapping process.
