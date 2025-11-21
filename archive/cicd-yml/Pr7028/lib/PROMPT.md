# HIPAA-Compliant GCP Data Platform CI/CD Pipeline

## Objective
Design and implement a **HIPAA-compliant CI/CD pipeline** on **Google Cloud Build** for a healthcare analytics platform. The system processes PHI/PII and must enforce strict security controls, encryption, audit logging, VPC Service Controls, and compliance reporting.

## System Components
- **Cloud Dataproc** for batch PySpark analytics  
- **BigQuery** for data warehousing + column-level encryption  
- **Vertex AI Workbench + Model Registry + Endpoints** for ML  
- **GKE** for HIPAA-secure API services  
- **GCS** HIPAA buckets (CMEK encrypted, no public access)

## Requirements

### 1. CI/CD Pipeline: `cloudbuild.yaml`
Build a production-grade HIPAA-enforced Cloud Build pipeline with:

####  Environment Validation
- Validate **VPC Service Controls perimeter**
- Validate **Cloud KMS CMEK keys**
- Confirm **audit logging enabled**
- Validate **org policies**, **no public IP**, **restricted services**

####  Python Quality & Security
- Pylint for PySpark + API code  
- Mypy type checking  
- Bandit security scanning  
- Safety vulnerability scan for Python dependencies  

####  Terraform validation
- `fmt`, `validate`, `tflint`
- HIPAA-specific Checkov policies

####  Build & Sign Artifacts
- Build PySpark wheels  
- Build API containers using **HIPAA-hardened base images**  
- Sign containers with **Cosign + Cloud KMS**  

####  Testing
- Unit testing with **coverage >85%**  
- Great Expectations data quality tests on BigQuery  
- Integration tests:  
  - Deploy Dataproc test cluster (VPC-SC, CMEK)  
  - Run PySpark sample jobs  
  - Validate BigQuery ML models  
- PHI Detection using **Presidio**  
- Container scanning using **Trivy**  
- SAST scanning using **Semgrep healthcare rules**  
- Infrastructure compliance scan using **Prowler HIPAA**  

####  Security & Compliance
- Validate encryption (CMEK, TLS 1.3, KMS rotation)  
- Validate IAM least privilege  
- Validate VPC-SC egress restrictions  
- Validate audit logs in SIEM project  

####  Deployments
- Terraform Apply with environment logic:  
  - **dev**: auto-deploy  
  - **staging**: tag push  
  - **production**: requires manual approval  
- GKE deployment using restricted Pod Security Standards  
- Dataproc HIPAA-compliant cluster deployment  
- PySpark job submission  
- BigQuery authorized views, RLS, PII masking  
- Vertex AI ML model deployment (no public IPs, VPC peering)

####  Monitoring & Reporting
- Configure Cloud Monitoring for HIPAA metrics  
- Generate HIPAA compliance report and write to:  
  `gs://${_COMPLIANCE_BUCKET}/reports/${BUILD_ID}`  
- Validate backup + restore (BigQuery, GCS, Dataproc snapshots)  
- DAST penetration testing via ZAP  
- Notify security team through Pub/Sub

### 2. Mandatory External Scripts (no inline scripts >5 lines)
Place in `scripts/`:
- deploy-gke-hipaa.sh  
- deploy-dataproc-hipaa.sh  
- run-pyspark-job.sh  
- validate-encryption.sh  
- validate-access-controls.sh  
- validate-audit-logs.sh  
- test-backup-restore.sh  
- run-phi-detection.sh  
- generate-compliance-report.sh  
- configure-monitoring.sh  

### 3. Environment Substitutions
```
_ARTIFACT_REGISTRY
_ENVIRONMENT
_GKE_CLUSTER
_DATAPROC_REGION
_BIGQUERY_DATASET
_KMS_KEYRING
_VPC_SC_PERIMETER
_COMPLIANCE_BUCKET
_SECURITY_PROJECT_ID
_SIEM_PROJECT_ID
```

### 4. Pipeline Policies
- Container vulnerabilities **block** deployment  
- PHI detection **blocks** build  
- No public IPs allowed  
- All data must use **CMEK**  
- Logging must go to **SIEM project**  
- Manual approval required for **production**  
- Pod security standards = **restricted**  
- Network policies required for pod isolation  

---

### Deliverables
1. `cloudbuild.yaml` (full pipeline)  
2. `scripts/` folder  
3. `model_failure.md`  
4. `prompt.md` (this file)

This prompt must be used to generate the full HIPAA CI/CD pipeline.
