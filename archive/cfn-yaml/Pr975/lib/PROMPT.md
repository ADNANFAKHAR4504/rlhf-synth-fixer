
You are an **AWS Architect** and expert CloudFormation template author. Produce a single-file **AWS CloudFormation template in YAML** that fully implements the requirements described below and is ready to validate with `aws cloudformation validate-template` and deploy in **us-west-2**.

**Important correctness note:** S3 buckets are a global service and cannot be placed "inside a VPC". Implement the user's intent by creating an **S3 VPC Endpoint** and a strict **S3 bucket policy** that allows access only via that endpoint and only by the specific IAM principals created in the template.

**High-level requirements (must satisfy all):**

1. Create a **VPC** spanning multiple Availability Zones (use Fn::GetAZs to pick AZs) with both **public and private subnets** across at least 2 AZs for high availability. Include appropriate Internet Gateway, NAT Gateways (or NAT Instances) so private subnets can reach the internet for updates (NAT in each AZ or a multi-AZ pattern).
2. Create an **S3 bucket** configured with:

* **Server-side encryption using AWS KMS** (create a KMS CMK in the template with a secure key policy).
* **Versioning enabled**.
* A **bucket policy** that denies any access except:

* Access from the template-created **S3 VPC Endpoint** (restrict by `aws:SourceVpc` or `aws:SourceVpce` as appropriate), and
* Access by the template-created IAM roles (least-privilege role(s) described below).
* Block public access (BlockPublicAcls, etc).
3. Create an **S3 VPC Endpoint** (Gateway endpoint) in the VPC and attach route table entries so only VPC traffic can talk to S3 via the endpoint.
4. Create an **AWS KMS key** for S3 encryption with a key policy that allows CloudFormation principal and the created IAM roles to use the key for encrypt/decrypt and key administrative actions. Enable automatic key rotation.
5. Define **IAM roles** following least privilege:

* A **Lambda execution role** with the minimal managed & inline policies required for Lambda to run inside a VPC (ENI creation, logs to CloudWatch) and to access the S3 bucket (only the specific S3 actions required) and the KMS key (Decrypt/Encrypt/GenerateDataKey for that bucket). Avoid broad `*` actions.
* A **CloudTrail S3 delivery role** if needed to deliver logs to the trail bucket (or allow CloudTrail to deliver logs).
* Any other small roles/policies necessary each must follow least privilege.
6. Create a **Security Group** to allow **only HTTPS (TCP/443)** ingress from the Internet on public-facing resources. Private resources (Lambda in private subnets) should have SGs that allow necessary outbound HTTPS only and allow inbound from authorized SGs only.
7. Deploy a **Lambda function** that runs inside the VPC (attach to private subnets and SG) and can securely access the S3 bucket and other private resources. The template should:

* Reference an inline Lambda code sample or use a zipped object in the created S3 bucket (if in-template code is used, use a simple inline Node/Python that writes/reads the S3 bucket to demonstrate permissions).
* Attach the least-privilege Lambda role described above.
* Configure environment variables for bucket name and KMS key ARN and enable CloudWatch Logs for the function.
8. **Enable CloudTrail** to log all API activity:

* Create a CloudTrail trail (multi-region) that logs management and data events as appropriate.
* Configure the trail to deliver logs to a separate S3 bucket created in the template (encrypted with KMS).
* Ensure the CloudTrail S3 bucket policy and IAM permissions are correct and secure.
9. Ensure **Network ACLs** and Security Groups follow allow-first minimal rules and deny everything else (explicitly configure NACLs that allow required flows and deny others).
10. Ensure the template includes a sensible **Outputs** section (VPC ID, Subnet IDs, Lambda ARN, S3 bucket name, KMS key ARN, CloudTrail ARN).

**Constraints & best practices (must follow):**

* Single CloudFormation template (no nested stacks).
* YAML format only.
* Use intrinsic functions (Ref, Fn::GetAtt, Fn::Join, Fn::Sub, Fn::GetAZs, etc.) where needed.
* Parameterize widely useful values (VPC CIDR, number of AZs (min 2), Lambda runtime, function name prefix, environment tag) and provide reasonable `Default` values.
* Use `DeletionPolicy: Retain` for S3 buckets and KMS keys used for logs to avoid accidental data loss.
* Add metadata/tags for `Owner`, `Environment`, `Project`.
* Add meaningful **resource names** where helpful (logical IDs and `Fn::Sub`-based physical names).
* Keep IAM policies least privilege: avoid `Action: "*"`, scope ARNs precisely, and limit `Resource` lists to the created resources.
* Do not require external pre-existing resources (except the AWS account itself).
* Avoid custom resources unless absolutely necessary.

**Validation & deliverables (what I expect back):**

1. A single CloudFormation **YAML** template that meets all the requirements above.
2. A short **(max \~10 lines)** preface describing any important choices or deviations (for example: explanation that S3 is restricted via VPC endpoint instead of inside-VPC).
3. Confirm the template is valid for `us-west-2` and state which AZ-count the template uses by default.
4. Inline comments in the YAML to explain non-obvious blocks (KMS key policy, S3 bucket policy, IAM least-privilege statements).
5. A short **snippet of the minimum IAM policy** used by the Lambda role for S3 & KMS (so I can review the least-privilege rules quickly).

**Tone & quality:** generate production-quality, well-commented, secure-by-default CloudFormation suitable for an AWS security-conscious org. The template should be ready to paste into `TapStack.yml` and run `aws cloudformation validate-template --template-body file://TapStack.yml` without template syntax errors.

**If anything in the requirements is technically impossible or ambiguous**, clearly call it out at the top (briefly), propose a secure correction, then implement the corrected design.
