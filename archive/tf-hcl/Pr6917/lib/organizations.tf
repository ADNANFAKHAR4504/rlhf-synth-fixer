# AWS Organizations - COMMENTED OUT
# This file has been disabled because the AWS account is already a member of an organization
#
# # AWS Organizations
# resource "aws_organizations_organization" "main" {
#   feature_set = "ALL"
#
#   enabled_policy_types = [
#     "SERVICE_CONTROL_POLICY",
#     "TAG_POLICY"
#   ]
#
#   aws_service_access_principals = [
#     "cloudtrail.amazonaws.com",
#     "config.amazonaws.com",
#     "guardduty.amazonaws.com",
#     "securityhub.amazonaws.com"
#   ]
#
#   lifecycle {
#     prevent_destroy = false
#   }
# }
#
# # Security Organizational Unit
# resource "aws_organizations_organizational_unit" "security" {
#   name      = "${var.security_ou_name}-${var.environment_suffix}"
#   parent_id = aws_organizations_organization.main.roots[0].id
# }
#
# # Production Organizational Unit
# resource "aws_organizations_organizational_unit" "production" {
#   name      = "${var.production_ou_name}-${var.environment_suffix}"
#   parent_id = aws_organizations_organization.main.roots[0].id
# }
#
# # Development Organizational Unit
# resource "aws_organizations_organizational_unit" "development" {
#   name      = "${var.development_ou_name}-${var.environment_suffix}"
#   parent_id = aws_organizations_organization.main.roots[0].id
# }
