I got some errors in the pipeline. I'm providing the error message. Please provide the necessary solution and fixes to the error message so that the pipeline can run successfully.

# Here is the Terraform Deployment error that needs fixing:

I'm getting deployment errors with the current Terraform configuration. The error is blocking the entire deployment, and I need help resolving it.

Error message:
╷
│ Warning: Invalid Attribute Combination
│
│ with aws_s3_bucket_lifecycle_configuration.app_assets_lifecycle,
│ on tap_stack.tf line 177, in resource "aws_s3_bucket_lifecycle_configuration" "app_assets_lifecycle":
│ 177: resource "aws_s3_bucket_lifecycle_configuration" "app_assets_lifecycle" {
│
│ No attribute specified when one (and only one) of
│ [rule[0].filter,rule[0].prefix] is required
│
│ This will be an error in a future version of the provider
╵
╷
│ Error: Missing required argument
│
│ on tap_stack.tf line 216, in resource "aws_dynamodb_table" "app_data":
│ 216: global_secondary_index {
│
│ The argument "projection_type" is required, but no definition was found.
╵
╷
│ Error: Invalid resource type
│
│ on tap_stack.tf line 610, in resource "aws_lambda_event_invoke_config" "api_handler_invoke_config":
│ 610: resource "aws_lambda_event_invoke_config" "api_handler_invoke_config" {
│
│ The provider hashicorp/aws does not support resource type
│ "aws_lambda_event_invoke_config".
╵
╷
│ Error: Invalid resource type
│
│ on tap_stack.tf line 622, in resource "aws_lambda_event_invoke_config" "data_processor_invoke_config":
│ 622: resource "aws_lambda_event_invoke_config" "data_processor_invoke_config" {
│
│ The provider hashicorp/aws does not support resource type
│ "aws_lambda_event_invoke_config".
╵
Error: Terraform exited with code 1.
Terraform plan failed, but continuing...
Terraform plan file not found, but continuing...
Terraform bootstrap completed
Bootstrap completed successfully
=== Deploy Phase ===
Terraform HCL project detected, running Terraform deploy...
Using state key: prs/pr2647/terraform.tfstate
Terraform plan file not found, creating new plan and deploying...
╷
│ Warning: Invalid Attribute Combination
│
│ with aws_s3_bucket_lifecycle_configuration.app_assets_lifecycle,
│ on main.tf line 177, in resource "aws_s3_bucket_lifecycle_configuration" "app_assets_lifecycle":
│ 177: resource "aws_s3_bucket_lifecycle_configuration" "app_assets_lifecycle" {
│
│ No attribute specified when one (and only one) of
│ [rule[0].filter,rule[0].prefix] is required
│
│ This will be an error in a future version of the provider
╵
╷
│ Error: Missing required argument
│
│ on main.tf line 216, in resource "aws_dynamodb_table" "app_data":
│ 216: global_secondary_index {
│
│ The argument "projection_type" is required, but no definition was found.
╵
╷
│ Error: Invalid resource type
│
│ on main.tf line 610, in resource "aws_lambda_event_invoke_config" "api_handler_invoke_config":
│ 610: resource "aws_lambda_event_invoke_config" "api_handler_invoke_config" {
│
│ The provider hashicorp/aws does not support resource type
│ "aws_lambda_event_invoke_config".
╵
╷
│ Error: Invalid resource type
│
│ on main.tf line 622, in resource "aws_lambda_event_invoke_config" "data_processor_invoke_config":
│ 622: resource "aws_lambda_event_invoke_config" "data_processor_invoke_config" {
│
│ The provider hashicorp/aws does not support resource type
│ "aws_lambda_event_invoke_config".
╵
Error: Terraform exited with code 1.
Plan creation failed, attempting direct apply...
╷
│ Error: Failed to load "tfplan" as a plan file
│
│ Error: stat tfplan: no such file or directory
╵
Error: Terraform exited with code 1.
Direct apply with plan failed, trying without plan...
╷
│ Warning: Invalid Attribute Combination
│
│ with aws_s3_bucket_lifecycle_configuration.app_assets_lifecycle,
│ on main.tf line 177, in resource "aws_s3_bucket_lifecycle_configuration" "app_assets_lifecycle":
│ 177: resource "aws_s3_bucket_lifecycle_configuration" "app_assets_lifecycle" {
│
│ No attribute specified when one (and only one) of
│ [rule[0].filter,rule[0].prefix] is required
│
│ This will be an error in a future version of the provider
╵
╷
│ Error: Missing required argument
│
│ on main.tf line 216, in resource "aws_dynamodb_table" "app_data":
│ 216: global_secondary_index {
│
│ The argument "projection_type" is required, but no definition was found.
╵
╷
│ Error: Invalid resource type
│
│ on main.tf line 610, in resource "aws_lambda_event_invoke_config" "api_handler_invoke_config":
│ 610: resource "aws_lambda_event_invoke_config" "api_handler_invoke_config" {
│
│ The provider hashicorp/aws does not support resource type
│ "aws_lambda_event_invoke_config".
╵
╷
│ Error: Invalid resource type
│
│ on main.tf line 622, in resource "aws_lambda_event_invoke_config" "data_processor_invoke_config":
│ 622: resource "aws_lambda_event_invoke_config" "data_processor_invoke_config" {
│
│ The provider hashicorp/aws does not support resource type
│ "aws_lambda_event_invoke_config".
╵
Error: Terraform exited with code 1.
All deployment attempts failed. Check for state lock issues.
