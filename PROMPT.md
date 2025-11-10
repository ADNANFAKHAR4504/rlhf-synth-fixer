# Task: AWS Region Migration (Task ID: 101000888)

## Background

A company must migrate an AWS application from region us-west-1 to us-west-2 using Terraform HCL while preserving logical identity, resource IDs, and network configuration.

## Problem Statement

Create Terraform HCL configuration to migrate an AWS application from us-west-1 to us-west-2. The configuration must:

1. Create main.tf with providers, resources, and modules
2. Define variables.tf for parameterization
3. Create backend.tf for state management with placeholders
4. Generate state-migration.md with exact Terraform CLI commands for workspace creation, selection, import, and verification
5. Produce id-mapping.csv sample with headers: resource, address, old_id, new_id, notes
6. Create runbook.md with cutover plan, rollback procedures, and validation checks

Expected output: Complete Terraform configuration with state migration plan, ID mapping strategy, and operational runbook for zero-data-loss region migration.

## Constraints

1. Preserve logical identity: keep the same names/tags/topology
2. Resource IDs are region-scoped; provide an old→new ID mapping plan using terraform import (do NOT recreate)
3. Migrate Terraform state to the new region/workspace without data loss
4. Preserve all SG rules and network configuration semantics
5. Minimize downtime; propose DNS cutover steps and TTL strategy

## Environment

AWS environment requiring migration from us-west-1 to us-west-2 using Terraform HCL. Requires Terraform CLI configured with appropriate AWS credentials. Must handle provider configuration, resource modules, and state management for region migration.

## Required Deliverables

1. main.tf - Complete Terraform configuration with providers, resources, and modules
2. variables.tf - All required variables with descriptions and default values
3. backend.tf - State management configuration with placeholders for S3 backend
4. state-migration.md - Detailed step-by-step migration guide with exact Terraform CLI commands
5. id-mapping.csv - Sample mapping file showing resource ID translation strategy
6. runbook.md - Operational runbook with cutover plan, rollback procedures, and validation checks

## Platform Information

- Platform: Terraform
- Language: HCL
- Complexity: hard
- Subtask: AWS Region Migration
- Subject Labels: Terraform, AWS, Region Migration, State Management
