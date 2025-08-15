# MODEL_FAILURES.md

## 1. Missing Environment Module for Centralized Config Management
**Fault:**  
MODEL_RESPONSE.md defines environment-specific variables directly in `environments/staging/variables.tf` and hardcodes them in `main.tf` rather than using a dedicated `env_module` to centrally manage settings like `vpc_cidr`, `availability_zones`, instance sizing, and scaling parameters.

**Impact:**  
Breaks reusability and makes adding new environments harder because configuration logic is scattered instead of being encapsulated in one module.

**Evidence:**  
IDEAL_RESPONSE.md includes `modules/env_module` with outputs for `environment`, `instance_type`, `as_group_min/max`, etc., which the root module consumes.

---

## 2. Security Module Missing Required IAM Policy Attachment
**Fault:**  
MODEL_RESPONSE.md's `modules/security/main.tf` includes a custom `aws_iam_policy` for secrets access **but omits the simplified, standard policy attachment structure** used in IDEAL_RESPONSE.md for AmazonSSMManagedInstanceCore.

**Impact:**  
Without proper dependency flow and consistent structure, the security model deviates from the intended, streamlined implementation and may cause maintainability issues.

**Evidence:**  
IDEAL_RESPONSE.md:
```hcl
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
```

## Fault Summary (Quick Reference)

| #  | Fault Description                                                                                     | Impact                                                                                       |
|----|-------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| 1  | Missing `env_module` for centralized environment config management                                    | Reduces reusability and makes adding new environments harder                                |
| 2  | Security module deviates from standard AmazonSSMManagedInstanceCore attachment approach               | Inconsistent security model, potential maintainability issues                              |
| 3  | EC2 module uses Amazon Linux 2 and complex user data instead of standardized Ubuntu Jammy setup        | Adds unnecessary complexity and diverges from intended lightweight provisioning approach   |

---

## 1. Missing Environment Module for Centralized Config Management
**Fault:**  
MODEL_RESPONSE.md defines environment-specific variables directly in `environments/staging/variables.tf` and hardcodes them in `main.tf` rather than using a dedicated `env_module` to centrally manage settings like `vpc_cidr`, `availability_zones`, instance sizing, and scaling parameters.

**Impact:**  
Breaks reusability and makes adding new environments harder because configuration logic is scattered instead of being encapsulated in one module.

**Evidence:**  
IDEAL_RESPONSE.md includes `modules/env_module` with outputs for `environment`, `instance_type`, `as_group_min/max`, etc., which the root module consumes.

---

## 2. Security Module Missing Required IAM Policy Attachment
**Fault:**  
MODEL_RESPONSE.md's `modules/security/main.tf` includes a custom `aws_iam_policy` for secrets access **but omits the simplified, standard policy attachment structure** used in IDEAL_RESPONSE.md for AmazonSSMManagedInstanceCore.

**Impact:**  
Without proper dependency flow and consistent structure, the security model deviates from the intended, streamlined implementation and may cause maintainability issues.

**Evidence:**  
IDEAL_RESPONSE.md:
```hcl
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
