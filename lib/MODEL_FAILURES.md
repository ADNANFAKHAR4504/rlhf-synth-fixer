### Fault 1: **No Multi-AZ Configuration for RDS**

- **MODEL_RESPONSE.md** provisions networking, EC2, ASGs, IAM, and ALB, but **does not include any RDS database at all**.
- **IDEAL_RESPONSE.md** explicitly defines an **RDS instance with Multi-AZ enabled**, proper storage encryption, and backups.
- This means the model missed a critical requirement for **stateful database resources and high availability**.

---

### Fault 2: **Security Misconfiguration – Overly Permissive Security Group**

- In **MODEL_RESPONSE.md**, the application security group allows inbound access from `0.0.0.0/0` for both **HTTP (80)** and **HTTPS (443)**.
- The **IDEAL_RESPONSE.md** tightens security with **restricted CIDRs, least-privilege IAM policies, and stricter SG rules**, preventing unnecessary public exposure.
- This is a **major security flaw**, leaving environments unnecessarily open.

---

### Fault 3: **No Encryption or KMS Keys Defined**

- **MODEL_RESPONSE.md** provisions CloudWatch logs, ALBs, ASGs, etc., but **does not enforce encryption at rest** (no KMS key for logs, EBS volumes, or S3 buckets).
- **IDEAL_RESPONSE.md** defines KMS encryption for sensitive resources (RDS storage, S3, logs).
- Missing encryption is a **compliance and data protection gap**.

---

**Summary of 3 Key Faults**

1. No RDS or Multi-AZ configuration (stateful data layer missing).
2. Security group is too open (0.0.0.0/0 ingress allowed).
3. No encryption/KMS usage for logs, storage, or databases.
