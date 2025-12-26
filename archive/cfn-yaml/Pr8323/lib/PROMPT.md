# PROMPT 

I need help designing a **single CloudFormation YAML template** named `TapStack.yml` that builds a **brand-new, production-ready AWS environment** in **us-east-1**.

This is a fresh deployment. Nothing should reference existing AWS resources. Every VPC, subnet, role, key, bucket, table, database, and security group must be created inside this one stack.

The goal is to translate what would normally be built using Python and Boto3 into **clean, readable CloudFormation YAML**, with security, cost control, and operational visibility in mind.

---

## General expectations

* YAML only
* One stack
* No JSON blocks
* No Python code
* No references to existing infrastructure
* Reasonable defaults that keep costs low but realistic

This should feel like something a senior cloud engineer would actually deploy.

---

## Environment naming and parameters

Add an `EnvironmentSuffix` parameter that lets me deploy the same stack multiple times without conflicts.
Examples include dev, staging, or prod.

Do not restrict values using a fixed list.
Instead, validate it using a safe naming pattern that allows lowercase letters, numbers, and hyphens.

Every named resource must include this suffix so deployments stay isolated.

Add other practical parameters where they make sense, such as:

* Project name
* VPC CIDR
* Subnet CIDRs
* Instance sizes
* Database sizing
* SSH allowed CIDR
* Capacity baselines for DynamoDB

---

## Networking and access

Create a new VPC with:

* Two public subnets in different availability zones
* Two private subnets in different availability zones
* Internet gateway and routing for public traffic
* Outbound access for private subnets where required

Include a small bastion EC2 instance in a public subnet:

* Cost-friendly instance type
* SSH access limited to a configurable CIDR
* Minimal IAM permissions

If flow logs are enabled, send them to encrypted logs storage for auditing.

---

## Storage and events

Create an S3 bucket dedicated to this stack:

* Versioning enabled
* Encrypted using a customer-managed KMS key
* Lifecycle rules that reduce storage cost over time
* Access logging enabled to an encrypted logging bucket

Configure the bucket so object uploads trigger a Lambda function.

---

## Lambda and API access

Create a Lambda function that:

* Uses a dedicated execution role
* Can read from the S3 bucket
* Can write logs
* Can interact only with the services it truly needs

Encrypt environment variables using KMS.

Expose a simple API endpoint through API Gateway that invokes this function.
Enable access logging and execution logging with encryption and retention.

---

## DynamoDB

Create one or more DynamoDB tables that:

* Use customer-managed encryption
* Include the environment suffix in the name
* Support automatic scaling for read and write capacity
* Use reasonable minimum and maximum limits to avoid over-provisioning

Ensure only the required services can access the tables.

---

## Relational database

Provision a managed database instance that:

* Runs in private subnets only
* Uses Multi-AZ for availability
* Encrypts storage with KMS
* Uses instance sizing that balances reliability and cost

Store credentials securely using a managed secrets service.
Grant access only to the workloads that need it.

---

## Application compute

Launch an EC2 instance for application workloads:

* Parameterized instance type
* Minimal IAM role permissions
* Access limited by security groups
* HTTP access controlled by CIDR
* SSH access restricted to the bastion or a trusted range

Apply consistent tags for cost tracking and ownership.

---

## Notifications

Create an SNS topic for alerts and notifications:

* Encrypted using KMS
* Publish access limited to approved services
* Optional email subscription support through parameters

---

## Encryption strategy

Define customer-managed KMS keys for:

* S3
* DynamoDB
* Database storage
* Logs
* Notifications

Key policies should:

* Allow account administration
* Grant usage only to the roles created in this stack
* Avoid broad permissions

---

## Monitoring and auditability

Enable monitoring for:

* Compute health
* Database health
* Lambda errors
* DynamoDB throttling

Create encrypted log groups with sensible retention.
Enable CloudTrail and store logs in encrypted storage.
Where reasonable, surface security-related events through alarms.

---

## Cost awareness

Defaults should reflect:

* Small but production-realistic instance sizes
* Auto-scaling instead of fixed capacity
* Lifecycle rules to control storage growth

Everything should be tagged consistently for cost allocation.

---

## Region control and resilience

Assume deployment in us-east-1.
Design subnets, databases, and networking with availability zones in mind.
Use conditions if needed to enforce or adapt behavior based on region.

---

## Final output

Deliver a single file named `TapStack.yml` that:

* Is valid CloudFormation YAML
* Can be deployed as a new stack
* Creates all required infrastructure from scratch
* Follows security and cost best practices
* Exposes useful outputs like IDs, ARNs, and endpoints

This should be something I can confidently deploy and evolve, not just a theoretical example.
