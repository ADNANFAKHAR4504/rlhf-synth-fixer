# Build Compilation Issues with CDKTF TypeScript

I'm having trouble with the TypeScript compilation in my CDKTF project. After implementing the security infrastructure modules, I'm getting compilation errors related to the AWS provider imports.

## Context
- Working on a security-first AWS infrastructure setup using CDK for Terraform
- Using TypeScript with @cdktf/provider-aws
- Following the camelCase naming convention for CDKTF resources

## The Problem
The build is failing with compilation errors. It seems like I might have the wrong import syntax or naming convention for the AWS provider resources.

## What I've Tried
- Double-checked the import statements
- Verified the package versions
- Looked at the CDKTF documentation

## What I Need
Help fixing the TypeScript compilation errors so I can proceed with the infrastructure deployment. The errors seem to be related to how I'm importing and using the AWS provider resources.

## Expected Outcome
A working TypeScript compilation that passes `terraform validate` and `terraform plan` as specified in the original requirements.