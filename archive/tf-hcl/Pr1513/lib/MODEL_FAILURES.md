***Flaw 1***
 Error: Unreadable module directory
│
│ Unable to evaluate directory symlink: lstat modules/compliance: no such file or directory
╵
╷
│ Error: Unreadable module directory
│
│ The directory  could not be read for module "compliance" at tap_stack.tf:183.
╵
╷
│ Error: Unreadable module directory
│
│ Unable to evaluate directory symlink: lstat modules/monitoring: no such file or directory
╵
╷
│ Error: Unreadable module directory
│
│ The directory  could not be read for module "monitoring" at tap_stack.tf:169.
╵
╷
│ Error: Unclosed configuration block
│
│   on modules/storage/main.tf line 70, in resource "aws_s3_bucket_server_side_encryption_configuration" "sensitive_data":
│   70: resource "aws_s3_bucket_server_side_encryption_configuration" "sensitive_data" {
│
│ There is no closing brace for this block before the end of the file. This may be caused by incorrect brace nesting elsewhere in
│ this file.

***Flaw 2***
│ Error: Module not installed
│
│   on tap_stack.tf line 169:
│  169: module "monitoring" {
│
│ This module's local cache directory  could not be read. Run "terraform init" to install all
│ modules required by this configuration.
╵
╷
│ Error: Module not installed
│
│   on tap_stack.tf line 183:
│  183: module "compliance" {

***Flaw 3***
Warning: Deprecated attribute
│
│   on modules/compliance/main.tf line 89, in resource "aws_securityhub_standards_subscription" "pci_dss":
│   89:   standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/pci-dss/v/3.2.1"
│
│ The attribute "name" is deprecated. Refer to the provider documentation for details.
│
│ (and 2 more similar warnings elsewhere)
╵
╷
│ Error: Unsupported argument
│
│   on modules/compliance/main.tf line 8, in resource "aws_config_configuration_recorder" "main":
│    8:     include_global_resources = true
│
│ An argument named "include_global_resources" is not expected here.
╵
╷
│ Error: Invalid function argument
│
│   on modules/iam/main.tf line 4, in resource "aws_iam_saml_provider" "main":
│    4:   saml_metadata_document = file("${path.module}/saml-metadata.xml")
│     ├────────────────
│     │ while calling file(path)
│     │ path.module is "modules/iam"
│
│ Invalid value for "path" parameter: no file exists at "modules/iam/saml-metadata.xml"; this function works only with files that
│ are distributed as part of the configuration source code, so if this file will be created by a resource in this configuration
│ you must instead obtain this result from an attribute of that resource.

***Flaw 4***
│ Warning: Deprecated attribute
│
│   on modules/compliance/main.tf line 88, in resource "aws_securityhub_standards_subscription" "pci_dss":
│   88:   standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/pci-dss/v/3.2.1"
│
│ The attribute "name" is deprecated. Refer to the provider documentation for details.
│
│ (and 2 more similar warnings elsewhere)
╵
╷
│ Error: Unsupported attribute
│
│   on modules/compliance/outputs.tf line 8, in output "config_recorder_arn":
│    8:   value       = aws_config_configuration_recorder.main.arn
│
│ This object has no argument, nested block, or exported attribute named "arn".
╵
╷
│ Error: Reference to undeclared resource
│
│   on modules/iam/outputs.tf line 3, in output "saml_provider_arn":
│    3:   value       = aws_iam_saml_provider.main.arn
│
│ A managed resource "aws_iam_saml_provider" "main" has not been declared in module.iam.
╵
╷
│ Error: Reference to undeclared resource
│
│   on modules/iam/outputs.tf line 13, in output "readonly_role_arn":
│   13:   value       = aws_iam_role.readonly_role.arn
│
│ A managed resource "aws_iam_role" "readonly_role" has not been declared in module.iam.
╵
╷
│ Error: Reference to undeclared resource
│
│   on modules/iam/outputs.tf line 18, in output "saml_role_arn":
│   18:   value       = aws_iam_role.saml_role.arn
│
│ A managed resource "aws_iam_role" "saml_role" has not been declared in module.iam.

***Flaw 5***

│ Error: "kms_key_id" (549ce866-6b98-4398-b122-78d34db6c90e) is an invalid ARN: arn: invalid prefix
│
│   with module.monitoring.aws_cloudtrail.main,
│   on modules/monitoring/main.tf line 21, in resource "aws_cloudtrail" "main":
│   21:   kms_key_id = var.kms_key_id

***Flaw 6***
peration error CloudTrail: PutEventSelectors, https response error StatusCode: 400, RequestID: 14ac5698-c375-43b3-b392-0e53b0b423f5, InvalidEventSelectorsException: Value secure-infra-cloudtrail-prod-4b367e08/ for DataResources.Values is invalid.
│
│   with module.monitoring.aws_cloudtrail.main,
│   on modules/monitoring/main.tf line 2, in resource "aws_cloudtrail" "main":
│    2: resource "aws_cloudtrail" "main" {

***Flaw 7***
╷
│ Error: attaching IAM Policy (arn:aws:iam::aws:policy/service-role/ConfigRole) to IAM Role (secure-infra-config-role-prod): operation error IAM: AttachRolePolicy, https response error StatusCode: 404, RequestID: 84ba12af-13f0-4e07-a655-15aec400e22a, NoSuchEntity: Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist or is not attachable.
│
│   with module.compliance.aws_iam_role_policy_attachment.config_policy,
│   on modules/compliance/main.tf line 52, in resource "aws_iam_role_policy_attachment" "config_policy":
│   52: resource "aws_iam_role_policy_attachment" "config_policy" {

***Flaw 8***
│ Error: attaching IAM Policy (arn:aws:iam::aws:policy/service-role/AWSConfigRole) to IAM Role (secure-infra-config-role-prod): operation error IAM: AttachRolePolicy, https response error StatusCode: 404, RequestID: 0c221402-340a-4178-bb2c-e5a8e3c5c811, NoSuchEntity: Policy arn:aws:iam::aws:policy/service-role/AWSConfigRole does not exist or is not attachable.
│
│   with module.compliance.aws_iam_role_policy_attachment.config_policy,
│   on modules/compliance/main.tf line 52, in resource "aws_iam_role_policy_attachment" "config_policy":
│   52: resource "aws_iam_role_policy_attachment" "config_policy" {
