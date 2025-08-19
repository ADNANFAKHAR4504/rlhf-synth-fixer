# Terraform Platform Validation Guide

## Phase 1: Task Selection
- while creating `metadata.json`, use "tf" instead of "terraform" in the platform field

## Phase 2: Code Generation
- Ensure the generated code is compatible with Terraform's HCL syntax
- Use `tf:fmt` to format the code before proceeding to QA
- keep S3 as the backend for state management

## Phase 3: QA Training & Validation
- PO_ID is the trainr number, reference multiple places can be fetched from metadata.json, e.g. `trainr879`
- while initiating terraform use these params, don't put then in the config anywhere just init using these params
  e.g. `export TF_INIT_OPTS="-backend-config=bucket=iac-synth-tf-states -backend-config=key=prs/trainr879/terraform.tfstate -backend-config=region=us-east-1 -backend-config=encrypt=true -backend-config=use_lockfile=true"`
    - backend-config=bucket=iac-synth-tf-states
    - backend-config=key=prs/${PO_ID}/terraform.tfstate
    - backend-config=region=us-east-1
    - backend-config=encrypt=true
    - backend-config=use_lockfile=true