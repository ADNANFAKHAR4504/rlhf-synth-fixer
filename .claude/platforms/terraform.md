# Terraform Platform Validation Guide

## Phase 1: Task Selection
- while creating `metadata.json`, use "tf" instead of "terraform" in the platform field

## Phase 2: Code Generation
- Ensure the generated code is compatible with Terraform's HCL syntax
- Use `tf:fmt` to format the code before proceeding to QA