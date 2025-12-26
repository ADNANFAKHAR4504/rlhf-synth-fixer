**Act as an AWS Solution Architect.**

Your task is to **design and implement a secure, reusable AWS infrastructure** for a simple web application using **AWS CloudFormation in YAML format**, following best practices for static website hosting and content distribution.

---

###  **Constraints**:

* Use **AWS CloudFormation** to define the infrastructure as code.
* The web application must be hosted on **Amazon S3** using **static website hosting**.
* Content must be distributed via **Amazon CloudFront**.
* **IAM policies must restrict direct access to the S3 bucket** so that only **CloudFront** can read the content.
* Ensure that all resources are deployed in the **us-east-1** region.
* Resource names and key settings must be **parameterized** for reusability across environments.

---

###  **Environment**:

You are setting up a web application hosting environment that includes:

1. An **S3 Bucket** configured for static website hosting.
2. A **CloudFront Distribution** with the S3 bucket as the origin.
3. A **bucket policy** or **origin access control (OAC)** or **origin access identity (OAI)** setup to **block public access** and allow only CloudFront to fetch content.
4. Use of **CloudFormation Parameters** for:

   * Environment suffix (e.g., dev, prod)
   * Application name
   * Domain alias (optional)

---

###  **Expected Output**:

Submit a well-structured CloudFormation template in **YAML format** named:
`static_web_app_infra.yaml`

It must:

* Pass CloudFormation validation.
* Deploy successfully in `us-east-1`.
* Use proper logical resource names and exports.
* Include outputs such as:

  * S3 bucket name
  * Website endpoint
  * CloudFront distribution domain name

---