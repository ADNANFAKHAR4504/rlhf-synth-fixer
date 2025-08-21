Here is a **comprehensive and high-level prompt** for your use case, suitable for training an AI model, validating a CloudFormation authoring tool, or briefing a DevOps engineer:

---

## Prompt Title:

**Generate AWS CloudFormation YAML Template for S3 and EC2 in `us-east-1` with Public Access Blocked**

---

## Prompt Description:

Act as an expert AWS Solutions Architect. Your task is to generate a production-ready **CloudFormation YAML template** that provisions a secure and minimal AWS environment strictly within the **`us-east-1` region**. The environment must include a **secure S3 bucket** and a **cost-effective EC2 instance**, both aligned with AWS best practices and CloudFormation standards.

---

## Environment and Template Requirements:

Develop a YAML CloudFormation template named **`aws-environment.yml`**. It must include the following:

### S3 Bucket Configuration

* Create a **single S3 bucket**.
* The bucket must **block all forms of public access** using the following properties:

* `BlockPublicAcls: true`
* `IgnorePublicAcls: true`
* `BlockPublicPolicy: true`
* `RestrictPublicBuckets: true`
* Use a logical resource name like `SecureS3Bucket`.

### EC2 Instance Configuration

* Provision a single **EC2 instance** of type `t2.micro`.
* Use an official **Amazon Linux 2 AMI** for the **`us-east-1`** region.
* Set instance type to `t2.micro` to ensure **Free Tier** eligibility.
* Include **basic configuration** such as key name (parameterized), security group allowing SSH, and subnet placement (use default VPC for simplicity unless instructed otherwise).
* Add a logical resource name like `MyEC2Instance`.

---

## Security and Best Practices:

* Ensure **IAM roles and instance profiles** are set up only if required (otherwise skip).
* No resource should be exposed to the public except SSH on port 22 for the EC2 instance (restricted by IP).
* Include `Tags` for each resource to identify `Environment` and `Project`.

---

## Expected Output:

Return a fully structured and valid **CloudFormation YAML** template that:

* Can be directly deployed using the AWS CLI or Management Console.
* Is scoped to a **single region** (`us-east-1`).
* Includes only the resources described (S3 + EC2).
* Passes AWS CloudFormation validation.

---

## Optional Enhancements (if needed):

* Parameterize environment name (e.g., `dev`, `prod`).
* Parameterize S3 bucket name and EC2 KeyPair name.

---

This prompt ensures clarity, compliance with AWS best practices, and precision in guiding the generation of infrastructure code. Let me know if youd also like a ready-made YAML response for this.