## 1. Correct and Secure State Management
- **Ideal Response:** Configures a remote S3 backend for Terraform state and enables **state locking** to prevent corruption during concurrent deployments.  
- **Model Response:** Uses a local `terraform.tfstate` file, which is unsafe for team projects.

## 2. Superior RDS Password Management
- **Ideal Response:** Uses AWS-managed secret for the RDS master password (`manageMasterUserPassword: true`) and outputs the secret's ARN.  
- **Model Response:** Uses an incorrect property (`manageUserPassword`) and creates an unused secret, making it insecure.

## 3. Proper RDS Enhanced Monitoring Configuration
- **Ideal Response:** Creates a dedicated IAM role, attaches `AmazonRDSEnhancedMonitoringRole`, and assigns it to the DB instance.  
- **Model Response:** Omits the IAM role, causing monitoring failure.

## 4. Dynamic and Deterministic S3 Bucket Naming
- **Ideal Response:** Uses a clear and deterministic naming convention for S3 buckets.  
- **Model Response:** Appends a random ID to bucket names, leading to recreation and potential **data loss** on each deployment.

## 5. Flexible and Environment-Aware Stack Configuration
- **Ideal Response:** Accepts external properties (`TapStackProps`) for reusable deployments across `dev`, `staging`, and `prod`.  
- **Model Response:** Hardcodes values, making the stack rigid and non-reusable.

## 6. Accurate IAM Policy and Resource References
- **Ideal Response:** Uses correct IAM policy references with accurate ARN patterns.  
- **Model Response:** Incorrect IAM patterns due to faulty resource naming (e.g., random bucket names).

## 7. Comprehensive and Useful Terraform Outputs
- **Ideal Response:** Provides ~10 useful outputs (VPC ID, subnet IDs, load balancer DNS, etc.).  
- **Model Response:** Provides only ~5 outputs, missing critical details.

## 8. Better Code Organization and Readability
- **Ideal Response:** Uses clean modules, clear interfaces, logical dependency flow, and up-to-date constructs.  
- **Model Response:** Uses deprecated constructs and poor organization.
