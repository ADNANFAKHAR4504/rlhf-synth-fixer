# Model Failures

This file documents issues and errors encountered in the generated Terraform code for `secure_infrastructure_setup.tf`.

---

## 1. Missing Required Argument

- The resource `aws_fms_policy` was missing the required argument `exclude_resource_tags`.

## 2. Unsupported Argument

- The resource `aws_fms_policy` included the unsupported argument `security_service_type`.

## 3. Incorrect Attribute Reference

- Some S3 bucket references used `.bucket` instead of the correct `.id` attribute.

## 4. Comments Syntax

- The file used `//` for comments, which is not valid in Terraform HCL (should use `#`).

## 5. Sensitive Output Usage

- The output for `rds_endpoint` was marked as `sensitive`, but the endpoint itself is not sensitive.

---
