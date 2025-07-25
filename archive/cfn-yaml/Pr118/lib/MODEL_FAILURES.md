# Nova Model CloudFormation Template - Failure Analysis

This document provides a structured analysis of the shortcomings and issues found in the Nova model's CloudFormation template for deploying a highly available web application in AWS.

---

## ❌ Issues and Failures

### 1. **Security Group Misconfiguration**
- **Problem**: The same Security Group (`WebServerSecurityGroup`) is used for both the ALB and the EC2 instances.
- **Risk**: This opens up the EC2 instances directly to the internet via ports 80 and 443.
- **Fix**: Use separate security groups:
  - One for the ALB to allow internet traffic on 80/443.
  - One for EC2 to allow traffic **only from the ALB** Security Group.

---

### 2. **Hardcoded & Insecure DB Credentials**
- **Problem**: The PostgreSQL `MasterUsername` and `MasterUserPassword` are hardcoded in the template.
- **Risk**: Storing credentials in plaintext is a security vulnerability.
- **Fix**: Use AWS Secrets Manager or SSM Parameter Store to manage sensitive credentials.

---

### 3. **No NAT Gateway for Private Subnets**
- **Problem**: EC2 instances in private subnets will not have outbound internet access.
- **Impact**: They cannot download updates, packages, or connect to external services.
- **Fix**: Add a NAT Gateway in a public subnet and a route table for the private subnets.

---

### 4. **Invalid Placeholder AMI ID**
- **Problem**: The AMI ID used in the `LaunchTemplate` is a placeholder (`ami-0abcdef1234567890`).
- **Impact**: The template cannot be deployed unless the user replaces the AMI ID.
- **Fix**: Use a valid and region-specific public AMI ID or use Mappings/SSM for dynamic lookup.

---

### 5. **Missing HTTPS Listener**
- **Problem**: The ALB only listens on HTTP (port 80).
- **Impact**: No encrypted traffic support.
- **Fix**: Add an HTTPS listener with an ACM-managed certificate.

---

### 6. **Overly Permissive Ingress Rules**
- **Problem**: The EC2 security group allows unrestricted access from `0.0.0.0/0`.
- **Risk**: Makes instances vulnerable to external attacks.
- **Fix**: Restrict traffic using ALB security group as the source.

---

## ✅ Positive Aspects

Despite the shortcomings, the Nova model template has strengths:
- Well-structured and readable
- Correct multi-AZ subnet setup
- Modular parameters for EC2 KeyPair and DB instance class
- Multi-AZ RDS configuration for high availability

---

## 🔧 Recommendations

| Area             | Action Item |
|------------------|-------------|
| Security Groups  | Split and restrict ingress rules |
| NAT Gateway      | Add for private subnet egress |
| AMI ID           | Replace placeholder with valid value |
| Secrets Handling | Move DB credentials to Secrets Manager |
| HTTPS Support    | Add HTTPS listener and ACM certificate |

---

## 📊 Summary

| Checkpoint                       | Status  |
|----------------------------------|---------|
| Secure EC2 access                | ❌ Failed |
| Use of NAT Gateway               | ❌ Missing |
| Encrypted traffic (HTTPS)       | ❌ Missing |
| Parameterization                 | ✅ Good |
| Multi-AZ setup                   | ✅ Good |
| Deployable as-is                 | ❌ Needs AMI update |

Overall, the Nova model provides a solid starting point but requires updates for production readiness.