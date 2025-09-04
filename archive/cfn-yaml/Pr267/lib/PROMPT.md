Here is a **comprehensive, production-grade user prompt** tailored for your use case:

---

### Prompt Title:

**Generate CloudFormation YAML for S3-triggered Lambda with Versioning, Public Read, and 'corp-' Naming Convention**

---

### Prompt Description:

Act as an expert AWS Solutions Architect. You are tasked with generating a secure and well-structured **AWS CloudFormation YAML template** that provisions an **S3 bucket and a Lambda function**. The deployment must follow **AWS best practices**, **least privilege IAM**, and conform to a strict **'corp-' naming convention**.

---

### Requirements & Constraints:

Create a single CloudFormation YAML file (`corp-s3-lambda-stack.yaml`) with the following:

#### 1. **S3 Bucket (`corp-artifact-bucket`)**

* Must have **versioning enabled**.
* Must include a **Bucket Policy** that allows **public read access to objects** only (i.e., `s3:GetObject` on `arn:aws:s3:::corp-artifact-bucket/*`).
* Must include appropriate **tags** and a **descriptive name**.

#### 2. **Lambda Function (`corp-s3-trigger-function`)**

* Runtime: `python3.12` or `nodejs18.x` (you may parameterize this)
* Triggered by **S3 `ObjectCreated:*` event** from the above bucket.
* Must include a **basic inline function code** (use a short inline zip or minimal inline code via `ZipFile:`).
* Must be assigned a proper **IAM Role** allowing `GetObject` on S3 and **CloudWatch Logs** permissions.
* Naming must follow the **'corp-'** prefix for Lambda, role, and log group.

#### 3. **IAM Role for Lambda**

* Allow Lambda to assume the role (`AWS::IAM::Role`)
* Permissions must follow **least privilege**, including:

* `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`
* `s3:GetObject` for the `corp-artifact-bucket`

#### 4. **Deployment Region & Metadata**

* All resources should explicitly deploy to a single region (e.g., `us-east-1`).
* Use `Tags:` on all major resources (e.g., `Environment`, `Project`, `Owner`)
* Ensure logical IDs are descriptive (e.g., `CorpS3Bucket`, `CorpLambdaFunction`, `CorpLambdaRole`)

---

### Expected Output:

Return a **single CloudFormation YAML template**, fully deployable via `aws cloudformation deploy` CLI command, which:

* Creates a versioned S3 bucket with public read access on objects.
* Creates a Lambda function triggered by S3 events.
* Includes a secure IAM role with least privilege.
* Uses consistent 'corp-' naming convention.
* Passes standard linter tools like `cfn-lint` and validates successfully with `aws cloudformation validate-template`.

---