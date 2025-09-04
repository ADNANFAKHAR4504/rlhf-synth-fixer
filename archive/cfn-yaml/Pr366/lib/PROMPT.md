## Problem Prompt

You are an infrastructure engineer tasked with setting up a **production-ready AWS environment** using **CloudFormation in YAML**.

### Requirements:

1. **Region:** All resources must be deployed in **`eu-west-1`**.
2. **Naming Convention:** Use `prod-` as a prefix for all resource names, followed by the respective service name.
3. **IAM Roles:** Follow the **least privilege principle** only assign permissions necessary for each resource to function.
4. **Networking:**
- Create a **VPC** with at least **two public** and **two private subnets**.
- Subnets must span **multiple Availability Zones**.
5. **S3 Buckets:** 
- Include **access logging** for all buckets.
6. **RDS:**
- Use an RDS database instance of type `db.t3.micro`.
7. **Application Load Balancer (ALB):**
- Configure it with an **SSL certificate from ACM**.
8. **CloudWatch Monitoring:**
- Set up an alarm to detect **5xx errors** from the application.
9. **Auto Scaling:**
- Enable **automatic scaling** for EC2 instances based on **CPU utilization** metrics.

### Constraints:

- All resources must be created in `eu-west-1`.
- All names must follow the `prod-<service>` format.
- IAM policies must be minimal and tightly scoped.
- Subnets must span multiple AZs for high availability.
- Ensure all services are properly tagged and logically grouped.

### Output:

Produce a **valid CloudFormation YAML template** that implements the full infrastructure setup described above. Ensure it meets all constraints and is suitable for production deployment.

---