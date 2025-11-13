Design a production-ready Terraform configuration in HCL that deploys a scalable web application environment on AWS. The implementation must be contained entirely within a single file named **tap-stack.tf**. A default **provider.tf** file is already provided for AWS configuration, so do not create or modify any provider blocks.

---

### **Problem**

Create a Terraform configuration to deploy **ML training infrastructure for distributed GPU workloads**.

---

### **Requirements**

1. **Networking**

   * Define a **VPC** with **3 private subnets** across different Availability Zones.
   * Include necessary **route tables**, **NAT gateways (if required)**, and **security groups** to allow internal training communication.
   * Restrict public access — instances must remain in private subnets.
   * Create **VPC endpoints** for **S3** and **DynamoDB** to keep all traffic inside AWS and avoid data transfer costs.

2. **Compute (EC2 Fleet for Distributed GPU Training)**

   * Create an **EC2 Fleet** that uses **p3.2xlarge Spot instances only**.
   * Target capacity: **6 instances**.
   * Implement **automatic Spot instance replacement** to maintain fleet capacity during interruptions.
   * Define a **Launch Template** using the latest **AWS Deep Learning AMI (Ubuntu)** or allow custom AMI via variable.
   * Attach an **IAM Instance Profile** allowing access to S3, DynamoDB, CloudWatch, and SSM.
   * Enable **user_data** to:

     * Install NVIDIA drivers and CloudWatch agent.
     * Push GPU utilization metrics to CloudWatch.

3. **Storage**

   * Create two **S3 buckets**:

     * `ml-training-data-<env>` for training datasets.
     * `ml-model-artifacts-<env>` for model checkpoints and outputs.
   * Enforce **block public access**, **versioning**, and **server-side encryption**.
   * Add **lifecycle rules** to transition objects to **Glacier** after **30 days**.

4. **Experiment Tracking**

   * Create a **DynamoDB table** for experiment metadata tracking.

     * Billing mode: **PAY_PER_REQUEST**.
     * **Point-in-time recovery (PITR)** enabled.
     * Partition key: `experiment_id`.
     * Sort key: `run_id`.

5. **IAM Roles and Policies**

   * Create a **role and instance profile** for EC2 with least-privilege access to:

     * The S3 buckets (GetObject, PutObject, ListBucket).
     * The DynamoDB experiment table.
     * CloudWatch Logs and Metrics (CreateLogGroup, PutMetricData, PutLogEvents).
     * Systems Manager (GetParameter, SendCommand).

6. **Monitoring**

   * Create **CloudWatch Log Groups** for training logs.
   * Configure **CloudWatch metrics** for **GPU utilization** (e.g., via agent or script calling `PutMetricData`).
   * Optionally add **alarms** for low GPU usage or missing metrics.

7. **Parameter Store**

   * Create **SSM Parameter Store** entries for model hyperparameters:

     * `/ml/hparams/learning_rate`
     * `/ml/hparams/batch_size`
     * `/ml/hparams/epochs`
   * Use **SecureString** type with optional KMS encryption.

8. **Outputs**

   * Output:

     * S3 bucket names (training + artifacts)
     * DynamoDB table name
     * EC2 Fleet ID
     * IAM role name

---

### **Constraints**

* Use **only `p3.2xlarge` Spot instances** for GPU compute.
* EC2 Fleet must maintain **automatic Spot replacement**.
* Training data must reside **exclusively in S3**.
* DynamoDB must be used for **experiment tracking** (PITR and on-demand billing required).
* Include **VPC endpoints for S3 and DynamoDB**.
* Add **CloudWatch metrics** for GPU utilization.
* Store all **hyperparameters in SSM Parameter Store**.
* Apply **least-privilege IAM** principles.
* Do **not modify provider blocks** (already handled in provider.tf).

---

### **Deliverable**

Generate **one complete, production-ready Terraform file named `tap-stack.tf`** that includes:

* VPC + private subnets + endpoints
* EC2 Fleet (Spot p3.2xlarge) + Launch Template + IAM profile
* S3 buckets with lifecycle rules
* DynamoDB table for experiments
* IAM roles/policies
* CloudWatch logs + GPU metrics setup
* SSM Parameter Store entries
* Required outputs

All variables, dependencies, and tags should be well-structured and consistent.
All resources should follow AWS best practices and support distributed ML training workloads efficiently and securely.