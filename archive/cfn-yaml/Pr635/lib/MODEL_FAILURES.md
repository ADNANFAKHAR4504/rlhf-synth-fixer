# MODEL_FAILURES.md

---

## ✅ Comparison Summary

| Aspect                        | Ideal Response (✅)                                                                                              | Model Response (❌)                                                                                             | Comments                                                                                                    |
|-------------------------------|----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **Parameter Handling**        | `KeyPairName` is `Type: String` with `Default: ""`, uses condition (`HasKeyPair`) and `Fn::If` syntax.          | `KeyPairName` is `Type: AWS::EC2::KeyPair::KeyName`, no default value, always required.                        | Model template will break CI/CD or automation unless `KeyPairName` is supplied, not optional/safe.         |
| **Conditions Section**        | Includes a `Conditions:` block (`HasKeyPair`) for optional SSH (EC2 KeyName logic).                            | Does not use any Conditions or conditional resource logic.                                                      | Lacks control over required/optional resources—impairs template flexibility.                               |
| **Resource & Output Naming**  | All resource and export names reference `${AWS::StackName}`; outputs use consistent export naming patterns.     | Resource and export names use `${Environment}-...`; outputs and names are inconsistent (`S3BucketName` etc.).  | Model's names are not stack-unique, risk conflict, and do not follow enterprise/pipeline best practices.   |
| **Tagging/Compliance**        | Every resource is tagged with `Environment`. Most resources have `Name` and `Environment` tags.                 | Many tags missing, some have only `Name`; inconsistent or incomplete resource-level tagging.                   | Fails organizational/compliance tagging standards; breaks "all resources must be tagged" constraint.       |
| **Security Groups**           | Carefully crafted SG rules; web group allows ALB on 80, SSH only from VPC CIDR block, no world-access SSH.     | EC2 SG allows SSH from 0.0.0.0/0; uses group names with possible conflicts.                                    | Model's SG exposes unnecessary risk (open SSH), hardcodes names causing naming collisions.                 |
| **Subnets & Routing**         | Separate route tables, two NAT gateways (1 per AZ/private subnet), all associations made explicit.              | Single private route table, only one NAT gateway route, missing redundancy/HA for NAT and route tables.        | Model does not meet HA/fault tolerance best practices for NAT/route table per private subnet.              |
| **Resource Placement**        | EC2 ASG instances placed in public subnets (should be private for web tier best practice, but matches template).| ASG also attaches to public subnets (same as ideal)                                                            | Matches, but both maybe non-ideal compared to actual best practice (should go private with NAT+LB).        |
| **S3 Resource & Policy**      | S3 bucket does NOT set public read by default; has server-side encryption and tight access policy.              | S3 bucket sets `PublicReadPolicy: true`, attempts website hosting, but policy and prop are not standard.       | Model risks accidental open data; ideal is stricter and complies with "secure static assets" requirement.  |
| **IAM Role for EC2**          | No fixed role names (avoids collisions), no excessive policy attachment, just what is needed.                   | Role/resource names are parameterized with `${Environment}`, not unique per stack; potential for conflicts.    | Model risks naming conflict and proliferation in shared accounts.                                           |
| **RDS Password Handling**     | Uses Secrets Manager for RDS password with unique resource, secure references.                                  | Also uses Secrets Manager, but the references and integration style are not as clear/robust.                   | Model does not clearly wire up secret referencing in a best practice way.                                  |
| **Monitoring & Logging**      | Uses CloudWatch alarms, log groups, tagging for monitoring and notifications on CPU usage.                      | Provides similar alarms and log groups, albeit without as much tag detail or grouping structure.               | Model is mostly correct here, but less organized for audit and management.                                 |
| **CloudFormation Best Practice** | Uses `DeletionPolicy`, `UpdateReplacePolicy`, tagging everywhere, and avoids world-readable dangerous settings. | Missing resource-level deletion/update policies, tags, and some world-readable settings remain (e.g., S3).     | Model not as production-ready; increased operational risk.                                                  |
| **Template Portability**      | Environment and stack-agnostic (can be reused safely), parameterized, supports CI automations.                  | Relies on `${Environment}`, but not strictly stack-agnostic; outputs do not cover all key IDs.                 | Model may function, but is less safe for template reuse/multiple automated environments.                   |

---

## 🔥 Model Failure Diagnosis Prompt

**To improve the model response, use the following targeted corrections and checklist:**

---

1. **Parameter Safety and Conditions**
   - Change `KeyPairName` to type `String` with `Default: ""`.
   - Add a `Conditions:` section:
     ```
     Conditions:
       HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
     ```
   - Use conditional logic for EC2 `KeyName`:
     ```
     KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
     ```
   - This ensures pipeline automation will not break if SSH is opt-out or no key supplied.

2. **Resource Naming Best Practices**
   - All logical/exported names should use `${AWS::StackName}-ResourceName` pattern, not only `${Environment}-...`.
   - Remove all hardcoded `GroupName`, `InstanceProfileName`, etc.; use `!Sub '${AWS::StackName}-Name'` and CloudFormation naming strategies to avoid collisions across stacks and environments.

3. **Tagging Compliance**
   - Ensure every resource, not just main compute/network, is tagged with both `Name` and `Environment` tags, and any additional tags required by compliance or pipeline systems.

4. **Security Groups**
   - Do NOT open SSH (port 22) to all (`0.0.0.0/0`). Restrict to internal CIDR or remove entirely unless specifically required.
   - For web/ALB tiers, allow only ports 80/443 as required, reflecting least privilege and organizational standards.

5. **High Availability for NAT, Routing, and Subnets**
   - Each private subnet in different AZs must have its own NAT gateway and route table; do not share NAT for both private subnets in an HA "production" setup.
   - Route tables and associations should be explicit and ensure true fault tolerance.

6. **Outputs**
   - Use clear, stack-aware key exports for every critical resource needed in downstream stacks or automation (`VPCId`, `LoadBalancerDNS`, `RDSEndpoint`, `S3BucketName`).
   - Output keys and export names must follow `${AWS::StackName}-ResourceID`.

7. **S3 Security**
   - Remove world-readable or public-read policies on S3 unless specifically needed. Follow "secure static asset" policy — default to private with server-side encryption enabled.
   - Only allow public read via a properly-scoped bucket policy if static hosting is required by the use case and clearly documented.

8. **IAM Role and Secret Handling**
   - IAM roles and instance profiles should be dynamically named and not set statically relative to environment.
   - Use AWS Secrets Manager for RDS credentials, link in DB resource via correct reference, not just in name.

9. **Testing and CI Compliance**
   - Validate the template using `cfn-lint`, and run pipeline checks including `npm run build` and all unit/integration tests.
   - Ensure template passes automated deployment with only the bare minimal required parameters.

10. **Documentation and Comments**
    - Maintain clear description headers, logical grouping, and update comments as needed for each major section.

---

Applying these corrections will make the template robust, production-ready, CI/CD-safe, and aligned with both AWS and organizational best practices.
