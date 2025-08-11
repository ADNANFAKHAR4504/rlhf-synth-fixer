# IDEAL_RESPONSE.md

## Secure Cloud Infrastructure Design — YAML (CloudFormation)

### 1. VPC and Networking

- **VPC (`SecureVPC`)**  
  CIDR: `10.0.0.0/16`  
  DNS support & hostnames enabled.
- **Public Subnet (`PublicSubnet`)** in AZ1 with public IP mapping enabled.
- **Internet Gateway (`InternetGateway`)** attached to VPC.
- **Security Groups**
  - **SSHSecurityGroup**: Inbound SSH restricted to `BastionSshCidr` parameter.
  - Egress: Allow all outbound traffic.

### 2. EC2 Instance Configuration

- **EC2 Instance (`SecureEC2Instance`)**
  - Type: `t2.micro` (parameterized)
  - AMI: Amazon Linux 2 (SSM Parameter store lookup)
  - Root volume encrypted with **InfrastructureKMSKey**.
  - Attached IAM Role: **EC2Role** with minimal privileges (S3 & CloudWatch).

### 3. S3 Buckets (All Encrypted & Restricted)

- **WebsiteContentBucket** — Stores static content.
- **ApplicationLogsBucket** — Receives application logs.
- **BackupDataBucket** — Stores backups.  
  **Common Security Features:**
  - KMS encryption using **InfrastructureKMSKey**.
  - Public access blocked.
  - Access logging enabled (logs stored in central logging bucket).
  - Explicit bucket policies enforcing least privilege.

### 4. Encryption

- **InfrastructureKMSKey** — Customer-managed CMK for S3 + EBS encryption.
  - Enables `kms:Encrypt`, `kms:Decrypt`, `kms:GenerateDataKey*` for root account and CloudFormation service.
  - Key rotation enabled.

### 5. IAM

- **EC2Role** — Minimal privilege for EC2 instance.
- **InstanceProfile** — Attaches EC2Role to SecureEC2Instance.

### 6. Parameters

- **EnvironmentSuffix** — Used in naming resources to ensure uniqueness.
- **BastionSshCidr** — Restricts SSH access.
- **InstanceType** — Default `t2.micro`, overrideable.

### 7. Outputs

- **VPCId**
- **PublicSubnetId**
- **EC2InstanceId**
- **S3BucketNames**

---

### Security & Compliance

✅ Encryption at rest for all data storage (EBS + S3).  
✅ IAM least privilege for EC2.  
✅ S3 strict access control + logging.  
✅ No default open ingress except restricted SSH.  
✅ Environment-aware naming.
