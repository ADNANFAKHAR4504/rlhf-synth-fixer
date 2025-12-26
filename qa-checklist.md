# AGI Data Quality - QA Checklist
## Infrastructure as Code (IaC) Training Data for Amazon Nova Models

**Project**: Amazon Code RLHF
**Prepared by**: Joshua Okorie (IAC QA Manager)
**Date**: 2025-12-18
**Version**: 1.0

---

## Table of Contents
1. [Introduction](#introduction)
2. [QA Process Description](#qa-process-description)
3. [Rubrics](#rubrics)
4. [Data Quality Scorecard](#data-quality-scorecard)

---

## Introduction

This document outlines the comprehensive quality assurance process for creating, validating, and delivering Infrastructure as Code (IaC) training data for Amazon Nova models. The data is designed to improve model performance in generating and understanding AWS infrastructure code across multiple platforms (CloudFormation, CDK, Terraform, Pulumi, CDKTF) and programming languages (TypeScript, JavaScript, Python, Java, Go).

### Project Overview
- **Project Name**: IaC Training Data for Amazon Nova Models
- **Task Types**: Infrastructure as Code generation, analysis, optimization, and CI/CD pipeline configuration
- **Target Capability**: Expert-level AWS infrastructure code generation with service connectivity understanding
- **Delivery Format**: Structured tasks with prompts, model responses, ideal responses, test coverage, and deployment verification

---

## QA Process Description

### 1. Batch / Dataset / Task Information

#### 1.1 Project and Task Classification
- **Project Name**: Amazon Nova IaC Training Dataset
- **Task Types**:
  - Provisioning of Infrastructure Environments (Cloud Environment Setup, Environment Migration, Web Application Deployment)
  - Serverless Infrastructure (Functions as Code)
  - CI/CD Pipeline Configuration
  - Security Configuration as Code
  - IaC Diagnosis/Edits and Optimization
  - Infrastructure Analysis/Monitoring
  - Multi-Environment Consistency
  - Failure Recovery and High Availability

#### 1.2 Task Structure (Unit of Data)
Each task consists of:
- **metadata.json**: Contains platform (cdk/cfn/tf/pulumi/cdktf), language (ts/js/py/java/go/hcl/yaml/json), complexity (medium/hard/expert), turn_type (single/multi), po_id (task ID), team, subtask, subject_labels, aws_services, provider (aws/localstack)
- **lib/PROMPT.md**: User's natural language request describing the infrastructure requirement
- **lib/MODEL_RESPONSE.md**: The model's generated response including code and explanation
- **lib/IDEAL_RESPONSE.md**: Expert-crafted ideal solution with best practices
- **lib/MODEL_FAILURES.md**: Documentation of model shortcomings and areas for improvement
- **IaC Code**: Platform-specific infrastructure code (CDK stacks, CloudFormation templates, Terraform configs, Pulumi programs)
- **Test Suite**: Unit tests (test/ directory) and integration tests (tests/ directory)
- **Scripts**: Deployment, testing, validation, and cleanup scripts

#### 1.3 Targeted Capability
The data trains models to:
- Generate expert-grade AWS infrastructure code with proper service connectivity
- Understand how AWS services integrate and communicate (not just exist independently)
- Apply security best practices (IAM least privilege, encryption, network segmentation)
- Create multi-service architectures with proper event-driven patterns
- Write deployable, testable infrastructure code across multiple IaC platforms
- Optimize and analyze existing infrastructure configurations

---

### 2. Task Lifecycle

#### 2.1 Task and Instruction Design (Calibration Phase)

**Task Designers/Experts:**
- **Qualifications**: Senior DevOps engineers, cloud architects, and infrastructure specialists with 5+ years of AWS experience
- **Profile Characteristics**:
  - Hands-on experience with multiple IaC platforms
  - Deep understanding of AWS service integrations
  - Security and compliance expertise (IAM, encryption, network security)
  - Production deployment experience

**Task Creation Process:**
1. Trainers execute: `npm run start rlhf-task`
2. Interactive CLI prompts for:
   - Provider selection (AWS or LocalStack)
   - Subtask category (11 predefined categories)
   - Platform (CDK, CDKTF, CloudFormation, Terraform, Pulumi, Analysis, CI/CD)
   - Language (TypeScript, JavaScript, Python, Java, Go, HCL, YAML)
   - Complexity level (Medium, Hard, Expert)
   - Turn type (Single turn or Multi-turn)
   - Task ID (PO ID for tracking)
   - Team assignment (1-6, synth, synth-1, synth-2, stf)
   - AWS services to be provisioned (comma-separated list)
3. System generates:
   - metadata.json with all configuration
   - Template files for selected platform/language
   - Test directory structure
   - Scripts for build, deploy, test, cleanup

**Task Instructions:**
- Trainers receive platform-specific templates with example structure
- Guidelines emphasize:
  - **Service connectivity**: Prompts must describe HOW services connect, not just list them
  - **Real-world scenarios**: Infrastructure solving actual business problems
  - **Human-written language**: No emojis, en/em dashes, brackets, formal abbreviations (e.g., i.e., etc.)
  - **Multi-service architecture**: AWS services with clear integration patterns
  - **Security considerations**: When applicable, include IAM, encryption, network security

**Pilot Sample Review:**
- Initial tasks undergo prompt quality validation (automated script checks)
- Expert reviewers assess connectivity patterns, service interactions, and realism
- Corrective actions applied to instruction templates and examples

**Edge Cases and Resolution:**
- LocalStack vs AWS deployment differences (endpoint URLs, authentication)
- Multi-environment Terraform tfvars file handling
- Platform-specific synthesis requirements (CDK/CDKTF require synth step, native pulumi, TF/CFN do not)
- Language-specific test frameworks (Jest for TS/JS, pytest for Python, JUnit for Java, go test for Go)

**Resources:**
- Task creation script: `cli/create-task.ts`
- Template directory: `templates/` (platform-language specific)
- Subtask definitions:  `cli/create-task.ts`
- Subject label mappings: in `cli/create-task.ts`

---

#### 2.2 Data Creation (Training Phase)

**Trainers/Annotators:**
- **Qualifications**: Mid to senior-level cloud engineers with IaC experience
- **Profile Characteristics**:
  - Practical AWS deployment experience
  - Familiarity with at least 2 IaC platforms
  - Understanding of testing methodologies (unit and integration)
  - Ability to write clear, concise documentation

**Creation Resources:**
- **Development Environment**: Local machine with AWS CLI, Node.js 22.17.0, Go 1.23.12, platform-specific tools
- **LLM Assistance**: Trainers may use LLMs for code generation BUT:
  - All prompts must be manually written by humans (no LLM-generated prompts)
  - Generated code must be reviewed, tested, and deployed successfully
  - Human trainers responsible for quality and correctness
- **Documentation**: Platform READMEs, AWS service documentation, best practice guides

**Average Creation Time (ACT):**
- **Medium complexity**: 2-4 hours per task
- **Hard complexity**: 4-8 hours per task
- **Expert complexity**: 8-16 hours per task
- ACT includes: prompt writing, code generation, test creation, deployment verification, documentation

**Automated Checks Before Submission:**
1. **Metadata Validation**: JSON schema validation against `config/schemas/metadata.schema.json`
2. **File Structure Check**: `scripts/check-project-files.sh` validates required files exist
3. **Platform/Language Detection**: `scripts/detect-metadata.sh` validates consistency
4. **Commit Message Format**: Conventional commits enforced via commitlint
5. **Jest Configuration**: For TS/JS projects, validates test/ folder (not tests/)

**Trainer Guidelines:**
- Create prompts that describe service connectivity patterns
- Write comprehensive unit tests verifying configuration (not just resource existence)
- Write integration tests verifying end-to-end service communication
- Document model failures honestly and specifically
- Provide ideal responses with explanations and best practices

---

#### 2.3 Task Quality Review

**Reviewers:**
- **Qualifications**: Senior cloud architects, principal engineers with 7+ years AWS experience
- **Profile Characteristics**:
  - Expert-level knowledge of AWS services and integration patterns
  - Deep understanding of IaC best practices across multiple platforms
  - Security and compliance expertise
  - Experience in code review and mentoring

**Quality Dimensions Evaluated:**

1. **Prompt Quality** (Claude-powered automated review + human validation)
2. **Code Quality** (Unit tests, linting, build success)
3. **Connectivity Validation** (Unit test connectivity review)
4. **Deployment Success** (Real AWS or LocalStack deployment)
5. **Integration Testing** (End-to-end service interaction validation)
6. **Documentation Quality** (IDEAL_RESPONSE.md, MODEL_FAILURES.md completeness)
7. **Security Compliance** (When applicable: IAM least privilege, encryption, network security)

**Review Process:**

**Stage 1: Automated Prompt Quality Review** (`.claude/prompts/claude-prompt-quality-review.md`)
- Script: `scripts/claude-validate-prompt-quality.sh`
- Validates:
  - Service connectivity patterns
  - Multi-service architecture 
  - No LLM-generated markers (emojis, en/em dashes, brackets, formal abbreviations)
  - Security validation (conditional: only if prompt mentions IAM, security groups, encryption, etc.)
- Claude Code Action posts review comment on PR
- Exit code 0 = PASS, 1 = FAIL (blocks pipeline)

**Stage 2: Commit Message Validation**
- Enforces conventional commit format
- Uses commitlint with `@commitlint/config-conventional`
- Ensures commit messages follow standard format for traceability

**Stage 3: Jest Config Validation** (TS/JS only)
- Validates jest.config.js uses 'test/' folder (singular)
- Prevents confusion with 'tests/' folder used by other languages

**Stage 4: Build and Synthesis**
- Build script: `scripts/build.sh` (compiles TypeScript, packages Java/Go, installs dependencies)
- Synthesis script: `scripts/synth.sh` (for CDK/CDKTF only, generates CloudFormation/Terraform)
- Stack naming validation: `scripts/validate-stack-naming.sh`
- Artifacts uploaded for subsequent stages

**Stage 5: Linting**
- Script: `scripts/lint.sh`
- Platform/language-specific linters
- Code style and best practice enforcement

**Stage 6: Unit Tests**
- Script: `scripts/unit-tests.sh`
- Tests run in QA environment
- Coverage reports generated
- Claude Unit Test Connectivity Review validates tests check connectivity (not just existence)


**Stage 7: Deployment**
- Script: `scripts/deploy.sh` (AWS) or `scripts/localstack-ci-deploy.sh` (LocalStack)
- Bootstrap stage (AWS only): Creates necessary infrastructure
- LocalStack: Starts container, deploys to local endpoint
- Deployment outputs captured for integration tests
- Stack/resource naming conventions validated

**Stage 8: Integration Tests (Live)**
- Script: `scripts/integration-tests.sh` (AWS) or `scripts/localstack-ci-test.sh` (LocalStack)
- Tests run against deployed infrastructure
- Validates end-to-end service connectivity
- Uses real AWS SDK calls (minimal mocking)

**Stage 9: Final Claude Code Review** (`.claude/prompts/claude-review-system-prompt.md`)
- Comprehensive review using Claude Code Action
- Reviews all artifacts: code, tests, documentation, metadata
- Calculates training_quality score (0-10)
- Updates metadata.json with training_quality score
- Posts detailed PR comment ending with `SCORE:X` format
- Validates all documentation files exist (PROMPT.md, MODEL_RESPONSE.md, IDEAL_RESPONSE.md, MODEL_FAILURES.md)

**Stage 10: Cleanup**
- Script: `scripts/destroy.sh` (AWS) or `scripts/localstack-cleanup.sh` (LocalStack)
- Removes all deployed resources
- Cleans up state files and temporary artifacts

**Review Passes:** 1 comprehensive pass with multiple automated validation gates
- Trainers can iterate on feedback by pushing new commits
- Each commit triggers full CI/CD pipeline re-run
- Pre-commit hooks may apply automatic fixes (e.g., formatting)

**Percentage of Data Reviewed:** 100% of all submitted tasks undergo full automated pipeline
- **Automated reviews**: 100% (prompt quality, unit test connectivity, integration test connectivity, final code review)
- **Human expert spot-checks**: 10-20% sample for quality calibration

**Multiple Reviewers:**
- Automated: Claude Code Action with specialized prompts for each review stage
- Human: Team leads perform spot-checks on 10-20% of approved tasks

**Disagreement Resolution:**
- Automated failures are deterministic (script-based)
- Human reviewers can override with justification in PR comments
- Quality Lead has final approval authority
- Edge cases documented in project wiki for future reference

**Average Review+Rework Time (ART):**
- **First submission**: 2-4 hours (automated pipeline runtime + trainer fixes)
- **Subsequent iterations**: 1-2 hours per iteration
- **Typical rework cycles**: 1-3 iterations to reach production quality
- **AHT (ACT + ART)**: 5-12 hours for medium/hard, 10-24 hours for expert tasks

**Review Guidelines:**
- Focus on service connectivity (not just resource existence)
- Validate security best practices when applicable
- Ensure tests verify behavior (not just presence)
- Check documentation completeness and clarity
- Verify deployment succeeds and cleanup completes

---

#### 2.4 Batch Quality Review Before Delivery

**Automated Checks:**

1. **Metadata Schema Validation**
   - Action: `@cardinalby/schema-validator-action`
   - Schema: `config/schemas/metadata.schema.json`
   - Validates all required fields present and correctly typed

2. **File Structure Validation**
   - Script: `scripts/check-project-files.sh`
   - Ensures all required files exist in correct locations
   - Validates no unexpected files in root directory

3. **Platform/Language Consistency**
   - Script: `scripts/detect-metadata.sh`
   - Validates code matches declared platform and language
   - Checks for platform-specific files

4. **Test Folder Consistency**
   - TS/JS: Must use 'test/' folder with Jest
   - Python: Must use 'tests/' folder with pytest
   - Go: Must use 'tests/' folder with go test
   - Java: Must use 'tests/' folder with JUnit/Gradle

5. **Stack Naming Conventions**
   - Script: `scripts/validate-stack-naming.sh`
   - Ensures consistent naming across CDK stacks, CloudFormation stacks, Terraform resources

6. **Documentation Completeness**
   - Validates presence of: PROMPT.md, MODEL_RESPONSE.md, IDEAL_RESPONSE.md, MODEL_FAILURES.md
   - Checks for empty or placeholder content

7. **Build Success**
   - All tasks must build successfully before deployment
   - TypeScript compilation, Python dependency installation, Java/Go builds

8. **Deployment Success**
   - All tasks must deploy successfully to AWS or LocalStack
   - Deployment outputs captured and validated

9. **Test Success**
   - All unit tests must pass (100% pass rate required)
   - All integration tests must pass (100% pass rate required)

10. **Cleanup Success**
    - All resources must be cleanly destroyed after testing
    - No orphaned resources or state files

**Human Audit Before Submission:**
- Quality Lead reviews random 10% sample of approved tasks
- Validates training_quality scores are appropriate
- Spot-checks for consistency across team submissions
- Reviews MODEL_FAILURES.md for honest, specific feedback

**Acceptance Criteria (Task Level):**
- All automated pipeline stages pass (green checkmarks)
- training_quality score >= 7 (7-10 is acceptable, 0-6 requires rework)
- All documentation files complete and non-empty
- Deployment and cleanup successful
- No hardcoded secrets or credentials

**Rejection Criteria (Task Level):**
- Any automated pipeline stage fails
- training_quality score < 7
- Hardcoded secrets detected
- Missing or incomplete documentation files
- Deployment or cleanup failures
- Test failures (unit or integration)

**Batch Acceptance Criteria:**
- 100% of tasks pass all automated checks
- Average training_quality score >= 8.0 across batch
- No security violations (hardcoded secrets, overly permissive IAM)
- Documentation completeness >= 95%
- Connectivity patterns present in >= 95% of prompts

**Versioning Mechanism:**
- Git-based versioning with PR numbers
- Each PR represents one task
- Branch naming: `feature/localstack-cicd` (example from current branch)
- Tags: Batch releases tagged as `batch-YYYY-MM-DD-vX`
- State management: Terraform state in S3 with PR number as key, Pulumi state in S3 backend

**Batch Quality Scripts:**
- Automated: CI/CD pipeline (.github/workflows/ci-cd.yml) runs all checks
- Manual: Quality Lead uses custom analysis scripts for batch-level metrics

---

### 3. Metrics and Traceability

#### 3.1 Key Metrics Tracked

**Task Creation Metrics:**
- Average tasks created per day per trainer (target: 1-2 for medium/hard, 0.5-1 for expert)
- Distribution across platforms (CDK/CFN/TF/Pulumi/CDKTF)
- Distribution across languages (TS/JS/Py/Java/Go/HCL/YAML)
- Distribution across complexity levels (Medium/Hard/Expert)
- Distribution across subtasks (11 categories)

**Task Review Metrics:**
- Average tasks reviewed per day (automated: unlimited, human spot-check: 5-10)
- Average pipeline runtime per task: 20-40 minutes
- Task rejection/rework rate (target: <30%)
- Average iterations to approval (target: 1-2)

**Common Rejection Reasons and Frequency:**
1. **Prompt Quality Failures** (~25% of rejections):
   - Insufficient connectivity patterns
   - LLM-generated markers present (emojis, dashes, brackets)
   - Single-service prompts (not multi-service)
   - Security issues in security-focused prompts

2. **Test Quality Failures** (~30% of rejections):
   - Unit tests only check resource existence (not properties/configuration)
   - Integration tests don't verify end-to-end connectivity
   - Missing test coverage for services in prompt
   - Tests use excessive mocking instead of real AWS SDK calls

3. **Deployment Failures** (~20% of rejections):
   - Infrastructure code errors (syntax, logic)
   - Missing dependencies or permissions
   - State management issues (Terraform lock conflicts)
   - LocalStack compatibility issues

4. **Documentation Failures** (~15% of rejections):
   - Missing or incomplete MODEL_FAILURES.md
   - IDEAL_RESPONSE.md lacks explanations or best practices
   - PROMPT.md contains LLM markers or insufficient detail

5. **Security Failures** (~10% of rejections):
   - Hardcoded secrets or credentials
   - Overly permissive IAM policies (Action: *, Resource: *)
   - Security groups allowing 0.0.0.0/0 without justification

**Interannotator/Interreviewer Agreement:**
- Automated reviews are deterministic (100% consistency)
- Human spot-checks: 85-90% agreement on training_quality scores (within ±1 point)
- Regular calibration sessions held to align scoring

#### 3.2 Audit and Traceability

**Task Audit Process:**
- Every task tracked in GitHub as a Pull Request
- PR number linked to metadata.json (po_id field)
- Git history provides complete audit trail:
  - Commit author (trainer)
  - Commit timestamps
  - Code changes (diffs)
  - Review comments (Claude Code Action + human reviewers)
  - Pipeline execution logs (GitHub Actions)

**Traceability Information in metadata.json:**
- `po_id`: Task ID (unique identifier)
- `team`: Team number (1-6, synth, synth-1, synth-2, stf)
- `startedAt`: ISO 8601 timestamp of task creation
- `training_quality`: Final quality score (0-10) from Claude review
- `provider`: AWS or LocalStack deployment target

**Logging and Timestamping:**
- GitHub Actions provides timestamped logs for every pipeline stage
- CI/CD pipeline execution time: ~20-40 minutes per task
- Logs retained for 90 days in GitHub Actions
- Critical logs archived to S3 for long-term retention

**Versioning and Release Management:**
- Each task is a Git branch merged to main via PR
- PRs squash-merged to maintain clean history
- Release branches created for batch deliveries
- Tags applied to mark delivery milestones

**Independent Review Capability:**
- Any reviewer can check out task branch by task numbeer
- Full reproduction: `git checkout IAC/1234` (example)
- Review all files, run pipeline locally if needed
- Access to all historical comments and decisions

**Standard Tooling:**
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Code Review**: Claude Code Action (AI-powered) + Human reviewers
- **Testing**: Jest (TS/JS), pytest (Py), JUnit (Java), go test (Go)
- **Deployment**: AWS CLI, CDK CLI, Terraform, Pulumi, CloudFormation
- **LocalStack**: Docker-based AWS emulation for local testing
- **State Management**: S3 backends for Terraform and Pulumi

---

## Rubrics

### Overview
This section defines the detailed grading criteria for assessing IaC training data quality. Rubrics are categorized into four high-level dimensions: **Accuracy**, **Consistency**, **Diversity**, and **Usefulness**.

---

### Dimension 1: Accuracy

**Definition:** Does the data match truth or reality? Can it be independently reproduced or verified?

#### Rubric 1.1: Prompt Service Connectivity
- **Name**: Prompt Service Connectivity
- **Description**: Validates that the PROMPT.md describes HOW AWS services connect and integrate, using connectivity keywords like "triggers", "connects to", "invokes", "sends data to", etc. The prompt must describe multi-service interaction patterns, not just list services.
- **Scope**: Task-level
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: Prompt contains >= 2 connectivity patterns from predefined list (see claude-validate-prompt-quality.sh )
  - **Fail**: Prompt contains < 2 connectivity patterns
- **Examples**:
  - **Pass (Score: Pass)**: "Deploy an S3 bucket that triggers a Lambda function when files are uploaded. The Lambda should process the data and write results to DynamoDB."
  - **Fail (Score: Fail)**: "Deploy S3 and Lambda" (no connectors described)
- **Auto-Gradable**: Yes (script: `scripts/claude-validate-prompt-quality.sh`)

#### Rubric 1.2: Multi-Service Architecture Complexity
- **Name**: Multi-Service Architecture
- **Description**: Validates that the prompt involves AWS services working together to solve a real-world scenario. Expert-grade prompts should describe multi-service architectures, not single-service deployments.
- **Scope**: Task-level
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: Prompt mentions AWS services from predefined list (see claude-validate-prompt-quality.sh )
- **Examples**:
  - **Pass (Score: Pass)**: Prompt mentions S3, Lambda, and DynamoDB
  - **Fail (Score: Fail)**: Prompt only mentions Lambda
- **Auto-Gradable**: Yes (script: `scripts/claude-validate-prompt-quality.sh`)

#### Rubric 1.3: Code Compilation and Deployment Success
- **Name**: Code Builds and Deploys Successfully
- **Description**: Validates that the generated infrastructure code compiles/builds successfully and deploys without errors to AWS or LocalStack. This is the ultimate test of code accuracy.
- **Scope**: Task-level
- **Importance**: Essential (auto-fail if deployment fails)
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: Build succeeds AND deployment succeeds
  - **Fail**: Build fails OR deployment fails
- **Examples**:
  - **Pass (Score: Pass)**: CDK stack synthesizes, CloudFormation stack deploys successfully, all resources created
  - **Fail (Score: Fail)**: TypeScript compilation error, Terraform apply fails with resource conflict
- **Auto-Gradable**: Yes (CI/CD pipeline stages: build, synth, deploy)


#### Rubric 1.4: Integration Test End-to-End Validation
- **Name**: Integration Tests Verify Live Service Connectivity
- **Description**: Validates that integration tests verify end-to-end data flow between deployed services using real AWS SDK calls. Tests must demonstrate actual service interactions, not mocked behavior.
- **Scope**: Task-level
- **Importance**: Important (contributes to training_quality score)
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: Tests trigger data flow through service chain, verify output using real AWS SDK calls
  - **Fail**: Tests only check resource existence, use excessive mocking, or don't verify end-to-end flow
- **Examples**:
  - **Pass (Score: Pass)**: Test uploads file to S3, waits for Lambda execution, queries DynamoDB to verify processed data
  - **Fail (Score: Fail)**: Test lists S3 buckets and checks count > 0
- **Auto-Gradable**: Yes (script: `scripts/claude-validate-integration-test-connectivity.sh`, Claude Code Action review)

#### Rubric 1.5: Security Configuration Appropriateness (Conditional)
- **Name**: Security Best Practices (when applicable)
- **Description**: When prompt is security-focused (mentions IAM, security groups, encryption, KMS, etc.), validates that configurations follow least privilege principle and avoid overly permissive patterns like Action: *, Resource: *, or 0.0.0.0/0 ingress without justification.
- **Scope**: Task-level
- **Importance**: Essential (auto-fail if security-focused prompt has insecure configurations)
- **Scoring Scale**: Binary (Pass/Fail/Not Applicable)
- **Score Definitions**:
  - **Pass**: Security configurations follow least privilege, specific actions/resources, justified network rules
  - **Fail**: Overly permissive IAM policies, wildcard permissions, unrestricted security groups
  - **Not Applicable**: Prompt not security-focused (auto-pass)
- **Examples**:
  - **Pass (Score: Pass)**: IAM policy grants dynamodb:PutItem only to specific table ARN
  - **Fail (Score: Fail)**: IAM policy uses Action: "*", Resource: "*"
- **Auto-Gradable**: Yes (script: `scripts/claude-validate-prompt-quality.sh` lines 183-272)

---

### Dimension 2: Consistency

**Definition:** Is the data free from systematic drift or bias? Are the same standards applied across tasks, annotators, and time?

#### Rubric 2.1: Metadata Schema Compliance
- **Name**: Metadata Schema Validation
- **Description**: Validates that metadata.json strictly conforms to the defined JSON schema with all required fields present, correctly typed, and within allowed value ranges.
- **Scope**: Task-level
- **Importance**: Essential (auto-fail if schema validation fails)
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: metadata.json validates successfully against schema
  - **Fail**: Schema validation errors (missing fields, wrong types, invalid values)
- **Examples**:
  - **Pass (Score: Pass)**: All fields present, platform="cdk", language="ts", complexity="hard"
  - **Fail (Score: Fail)**: Missing "provider" field, or complexity="invalid"
- **Auto-Gradable**: Yes (GitHub Action: `@cardinalby/schema-validator-action`)

#### Rubric 2.2: Platform and Language Code Consistency
- **Name**: Code Matches Declared Platform/Language
- **Description**: Validates that the actual infrastructure code matches the platform and language declared in metadata.json. For example, if metadata says platform="cdk" and language="ts", the lib/ folder must contain TypeScript CDK code, not Terraform HCL.
- **Scope**: Task-level
- **Importance**: Essential (auto-fail if mismatch detected)
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: Code files match declared platform and language
  - **Fail**: Code files don't match metadata (e.g., .tf files when platform="cdk")
- **Examples**:
  - **Pass (Score: Pass)**: metadata.json declares cdk/ts, lib/ contains .ts files with CDK imports
  - **Fail (Score: Fail)**: metadata.json declares tf/hcl, lib/ contains Python Pulumi code
- **Auto-Gradable**: Yes (script: `scripts/detect-metadata.sh`)

#### Rubric 2.3: Test Framework and Folder Consistency
- **Name**: Test Framework Matches Language
- **Description**: Validates that test framework and folder structure match the declared language. TS/JS uses Jest with 'test/' folder, Python uses pytest with 'tests/' folder, Java uses JUnit with 'tests/' folder, Go uses go test with 'tests/' folder.
- **Scope**: Task-level
- **Importance**: Important (auto-fail for TS/JS if jest.config.js incorrect)
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: Test framework and folder match language conventions
  - **Fail**: Wrong test folder (e.g., TS/JS using 'tests/' instead of 'test/')
- **Examples**:
  - **Pass (Score: Pass)**: TS project with jest.config.js specifying roots: ['<rootDir>/test']
  - **Fail (Score: Fail)**: TS project with jest.config.js specifying roots: ['<rootDir>/tests']
- **Auto-Gradable**: Yes (CI/CD pipeline stage: validate-jest-config)

#### Rubric 2.4: Commit Message Format Consistency
- **Name**: Conventional Commit Format
- **Description**: Validates that all commit messages follow conventional commit format (feat:, fix:, docs:, etc.) for consistent history and traceability.
- **Scope**: Task-level
- **Importance**: Important (auto-fail if commit message invalid)
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: Commit message follows conventional format
  - **Fail**: Commit message doesn't follow format
- **Examples**:
  - **Pass (Score: Pass)**: "feat(cdk): add S3 bucket with Lambda trigger"
  - **Fail (Score: Fail)**: "updated code"
- **Auto-Gradable**: Yes (CI/CD pipeline stage: validate-commit-message, tool: commitlint)

#### Rubric 2.5: Documentation Structure Consistency
- **Name**: Required Documentation Files Present
- **Description**: Validates that all four required documentation files exist and are non-empty: PROMPT.md, MODEL_RESPONSE.md, IDEAL_RESPONSE.md, MODEL_FAILURES.md.
- **Scope**: Task-level
- **Importance**: Essential (auto-fail if any file missing)
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: All 4 files exist in lib/ and contain substantive content
  - **Fail**: Any file missing or empty
- **Examples**:
  - **Pass (Score: Pass)**: All files present with detailed content
  - **Fail (Score: Fail)**: MODEL_FAILURES.md missing or contains only "TODO"
- **Auto-Gradable**: Yes (CI/CD pipeline stage: claude-code-action, step: Check for required documentation files)

---

### Dimension 3: Diversity

**Definition:** Does the data cover a representative set of concepts or topics and avoid skew?

#### Rubric 3.1: Platform Distribution
- **Name**: IaC Platform Coverage
- **Description**: Measures the distribution of tasks across IaC platforms (CDK, CDKTF, CloudFormation, Terraform, Pulumi) to ensure diverse training data.
- **Scope**: Batch-level
- **Importance**: Important (target distribution: 30% CDK, 20% CFN, 25% TF, 15% Pulumi, 10% CDKTF)
- **Scoring Scale**: Percentage distribution (0-100% per platform)
- **Score Definitions**:
  - **Excellent**: Distribution within 5% of target for all platforms
  - **Good**: Distribution within 10% of target
  - **Needs Improvement**: Significant skew (>15% deviation from target)
- **Examples**:
  - **Excellent**: CDK 28%, CFN 22%, TF 23%, Pulumi 17%, CDKTF 10%
  - **Needs Improvement**: CDK 60%, CFN 5%, TF 30%, Pulumi 3%, CDKTF 2%
- **Auto-Gradable**: Yes (aggregate metadata.json platform field across batch)

#### Rubric 3.2: Language Distribution
- **Name**: Programming Language Coverage
- **Description**: Measures the distribution of tasks across programming languages (TypeScript, JavaScript, Python, Java, Go, HCL, YAML, JSON) to ensure diverse training data.
- **Scope**: Batch-level
- **Importance**: Important (target distribution varies by platform, e.g., CDK heavily TS/Py)
- **Scoring Scale**: Percentage distribution (0-100% per language)
- **Score Definitions**:
  - **Excellent**: All languages represented, balanced within platform constraints
  - **Good**: Minor skew toward common languages (TS, Py)
  - **Needs Improvement**: Single language dominates (>60%)
- **Examples**:
  - **Excellent**: CDK tasks split 50% TS, 30% Py, 10% Java, 10% Go
  - **Needs Improvement**: CDK tasks 90% TS, 10% other
- **Auto-Gradable**: Yes (aggregate metadata.json language field across batch)

#### Rubric 3.3: Complexity Level Distribution
- **Name**: Task Complexity Balance
- **Description**: Measures the distribution of tasks across complexity levels (Medium, Hard, Expert) to ensure training data covers a range of difficulty.
- **Scope**: Batch-level
- **Importance**: Important (target distribution: 30% Medium, 50% Hard, 20% Expert)
- **Scoring Scale**: Percentage distribution (0-100% per level)
- **Score Definitions**:
  - **Excellent**: Distribution within 10% of target
  - **Good**: Distribution within 20% of target
  - **Needs Improvement**: Significant skew (>25% deviation)
- **Examples**:
  - **Excellent**: Medium 32%, Hard 48%, Expert 20%
  - **Needs Improvement**: Medium 10%, Hard 85%, Expert 5%
- **Auto-Gradable**: Yes (aggregate metadata.json complexity field across batch)

#### Rubric 3.4: Subtask Category Coverage
- **Name**: Use Case Diversity
- **Description**: Measures the distribution of tasks across 11 subtask categories (Cloud Environment Setup, Environment Migration, Multi-Environment Consistency, Web Application Deployment, Serverless Infrastructure, CI/CD Pipeline, Failure Recovery Automation, Security Configuration as Code, IaC Diagnosis/Edits, IaC Optimization, Infrastructure Analysis/Monitoring) to ensure diverse use case coverage.
- **Scope**: Batch-level
- **Importance**: Important (target: all 11 categories represented with at least 5% each)
- **Scoring Scale**: Percentage distribution (0-100% per category)
- **Score Definitions**:
  - **Excellent**: All 11 categories present, no single category >25%
  - **Good**: 9-10 categories present, balanced distribution
  - **Needs Improvement**: <8 categories present or single category >40%
- **Examples**:
  - **Excellent**: Each category 5-15%, all categories represented
  - **Needs Improvement**: 80% Web Application Deployment, other categories minimal
- **Auto-Gradable**: Yes (aggregate metadata.json subject_labels field across batch)

#### Rubric 3.5: AWS Service Coverage
- **Name**: AWS Service Diversity
- **Description**: Measures the range of AWS services included across the batch (S3, Lambda, DynamoDB, EC2, RDS, API Gateway, CloudWatch, SNS, SQS, Step Functions, ECS, Fargate, VPC, ALB, NLB, CloudFront, Route53, Secrets Manager, IAM, KMS, EventBridge, Kinesis, ElastiCache, EFS, EBS, CloudFormation, Systems Manager, etc.).
- **Scope**: Batch-level
- **Importance**: Important (target: 20+ distinct services, no single service in >40% of tasks)
- **Scoring Scale**: Count of distinct services + distribution
- **Score Definitions**:
  - **Excellent**: 25+ distinct services, balanced usage
  - **Good**: 20-24 distinct services, some common services dominant
- **Examples**:
  - **Excellent**: 30 services used, S3 in 50% of tasks, Lambda in 40%, others 5-30%
  - **Needs Improvement**: Only 10 services used, S3 and Lambda in 90% of tasks
- **Auto-Gradable**: Yes (aggregate metadata.json aws_services field across batch)

---

### Dimension 4: Usefulness

**Definition:** Does the data provide a reliable signal for a model to learn and reason effectively? Is the dataset easily usable by researchers without extra cleanup?

#### Rubric 4.1: Training Quality Score
- **Name**: Overall Training Quality
- **Description**: Holistic assessment of task quality by expert reviewer (Claude Code Action + human spot-check), considering all factors: prompt quality, code quality, test coverage, documentation completeness, security, and deployability. This is the primary signal for model training value.
- **Scope**: Task-level
- **Importance**: Essential (tasks with score <7 rejected)
- **Scoring Scale**: 0-10 (integer or half-point increments)
- **Score Definitions**:
  - **10**: Perfect - Exceptional quality across all dimensions, production-ready code, comprehensive tests, excellent documentation
  - **9**: Excellent - Minor improvements possible but task is exemplary
  - **8**: Very Good - High quality, suitable for training with minimal concerns
  - **7**: Good - Acceptable quality, meets all requirements
  - **6**: Fair - Some issues present, requires rework
  - **5**: Marginal - Multiple issues, significant rework needed
  - **0-4**: Poor - Major issues, reject and restart
- **Examples**:
  - **Score 10**: Multi-service CDK stack with perfect connectivity patterns, 100% test coverage verifying all interactions, detailed documentation explaining design decisions, security best practices applied, deploys and cleans up perfectly
  - **Score 7**: Functional Terraform config with good connectivity, adequate tests, complete documentation, deploys successfully with minor style issues
  - **Score 5**: Code deploys but tests only check existence, documentation incomplete, prompt lacks connectivity keywords
- **Auto-Gradable**: Partially (Claude Code Action calculates initial score, human reviewers validate)

#### Rubric 4.2: Prompt Human-Written Quality
- **Name**: Prompt Authenticity (No LLM Markers)
- **Description**: Validates that PROMPT.md was written by a human, not generated by an LLM. Checks for LLM indicators: emojis, en/em dashes, excessive brackets, formal abbreviations (e.g., i.e., etc.), perfect punctuation patterns.
- **Scope**: Task-level
- **Importance**: Essential (auto-fail if LLM markers detected)
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: No LLM indicators detected, natural human writing style
  - **Fail**: LLM indicators present (emojis, dashes, brackets, formal abbreviations)
- **Examples**:
  - **Pass (Score: Pass)**: "I need an S3 bucket that triggers a Lambda when files are uploaded. Lambda should process them and store results in DynamoDB."
  - **Fail (Score: Fail)**: "Deploy an S3 bucket – which triggers a Lambda function – to process uploaded files (e.g., JSON, CSV) and store the results [metadata] in DynamoDB."
- **Auto-Gradable**: Yes (script: `scripts/claude-validate-prompt-quality.sh` lines 276-400)

#### Rubric 4.3: Model Failure Documentation Honesty
- **Name**: Honest Model Failure Assessment
- **Description**: Validates that MODEL_FAILURES.md provides specific, actionable feedback on where the model fell short. Must not be empty or generic ("model did great"). Should identify specific gaps, errors, or areas for improvement.
- **Scope**: Task-level
- **Importance**: Important (contributes to usefulness of training data)
- **Scoring Scale**: 1-5
- **Score Definitions**:
  - **5**: Detailed, specific failures documented with examples and expected vs actual behavior
  - **4**: Specific failures documented but less detail
  - **3**: Generic failures mentioned ("tests incomplete", "missing error handling")
  - **2**: Minimal content, lacks specificity
  - **1**: Empty or placeholder ("TODO", "N/A", "Model was perfect")
- **Examples**:
  - **Score 5**: "Model generated Lambda function but failed to include IAM role with dynamodb:PutItem permission. This caused runtime errors when Lambda tried to write to DynamoDB. Expected: Role with inline policy granting table access. Actual: No IAM role attached to Lambda."
  - **Score 2**: "Tests need work."
- **Auto-Gradable**: Partially (length and keyword checks possible, semantic quality requires human review)

#### Rubric 4.4: Deployment and Cleanup Success Rate
- **Name**: Operational Readiness
- **Description**: Measures the percentage of tasks that successfully deploy to AWS/LocalStack and cleanly destroy all resources afterward. This indicates the code is actually functional and usable, not just syntactically correct.
- **Scope**: Batch-level
- **Importance**: Essential (target: 100% success rate)
- **Scoring Scale**: Percentage (0-100%)
- **Score Definitions**:
  - **100%**: All tasks deploy and cleanup successfully
  - **95-99%**: Minor issues with <5% of tasks
  - **90-94%**: Concerning issues, investigation needed
  - **<90%**: Unacceptable, major quality problems
- **Examples**:
  - **100%**: 500 tasks, all deploy and cleanup successfully
  - **92%**: 500 tasks, 40 have deployment or cleanup failures
- **Auto-Gradable**: Yes (aggregate CI/CD pipeline results)

#### Rubric 4.5: Schema Conformance
- **Name**: Metadata Structure Validity
- **Description**: Validates that metadata.json conforms to expected schema, enabling automated processing by researchers. All required fields present, correctly typed, no extra fields.
- **Scope**: Task-level
- **Importance**: Essential (auto-fail if non-conformant)
- **Scoring Scale**: Binary (Pass/Fail)
- **Score Definitions**:
  - **Pass**: Valid JSON, passes schema validation, all required fields present
  - **Fail**: Invalid JSON, schema validation errors, missing/extra fields
- **Examples**:
  - **Pass (Score: Pass)**: Valid JSON with all 13 required fields
  - **Fail (Score: Fail)**: Invalid JSON syntax, missing "provider" field
- **Auto-Gradable**: Yes (GitHub Action: schema-validator-action)

---

## Data Quality Scorecard

### Batch Information
- **Batch ID**: [To be filled per delivery]
- **Delivery Date**: [To be filled per delivery]
- **Total Tasks**: [To be filled per delivery]
- **Accepted Tasks**: [To be filled per delivery]
- **Rejected Tasks**: [To be filled per delivery]
- **Overall Acceptance Rate**: [To be calculated: Accepted / Total]
- **Average Training Quality Score**: [To be calculated: mean of training_quality field]

---

### High-Level Dimension Scores



**Top Accuracy Successes**:
- [Example: "98% of tasks demonstrated proper S3-to-Lambda event triggering in integration tests"]
- [Example: "All CDK stacks synthesized and deployed successfully on first attempt"]

**Top Accuracy Failures (Fixed in QA)**:
- [Example: "Initial submissions had 15% rate of unit tests only checking resource existence; corrected to verify properties"]
- [Example: "5% of security-focused prompts initially used Action: *; reworked to specific permissions"]

---

#### Consistency Score: [X/10]
**Aggregation Logic**: Average of binary rubrics (Pass=10, Fail=0) for rubrics 2.1-2.5, equally weighted
- Metadata Schema Compliance (Essential)
- Platform and Language Code Consistency (Essential)
- Test Framework and Folder Consistency (Important)
- Commit Message Format Consistency (Important)
- Documentation Structure Consistency (Essential)

**Top Consistency Successes**:
- [Example: "100% of tasks passed metadata schema validation on initial submission"]
- [Example: "All TS/JS tasks correctly used 'test/' folder with Jest"]

**Top Consistency Failures (Fixed in QA)**:
- [Example: "8% of initial submissions had metadata platform/language mismatch with actual code; corrected"]
- [Example: "12% of commit messages didn't follow conventional format; trainers educated and corrected"]

---

#### Diversity Score: [X/10]
**Aggregation Logic**: Calculated from distribution metrics
- Platform Distribution (target: CDK 30%, CFN 20%, TF 25%, Pulumi 15%, CDKTF 10%)
- Language Distribution (varies by platform)
- Complexity Distribution (target: Medium 30%, Hard 50%, Expert 20%)
- Subtask Category Coverage (target: all 11 categories )
- AWS Service Coverage (target: 20+ services, no single service >40%)



**Top Diversity Successes**:
- [Example: "28 distinct AWS services used across batch, excellent coverage"]
- [Example: "All 11 subtask categories represented with 5-18% distribution each"]

**Top Diversity Issues (and Mitigations)**:
- [Example: "Initial batch skewed 60% CDK; directed trainers to prioritize Terraform and Pulumi tasks"]
- [Example: "Lambda appeared in 65% of tasks; encouraged use of Step Functions, ECS, and other compute services"]

---

**Calculation Example**:
- Training Quality Score: 8.2/10 (average across batch)
- Prompt Human-Written: 9.8/10 (98% pass rate)
- Model Failure Documentation: 7.5/10 (average score)
- Deployment Success: 9.9/10 (99% success rate)
- Schema Conformance: 10/10 (100% pass rate)
Weighted: (8.2*3 + 9.8*2 + 7.5*1.5 + 9.9*2 + 10*1.5) / 10 = 8.76/10


**Top Usefulness Successes**:
- [Example: "Average training_quality score of 8.2, exceeding target of 8.0"]
- [Example: "99.5% deployment and cleanup success rate, demonstrating high operational readiness"]

**Top Usefulness Failures (Fixed in QA)**:
- [Example: "18% of initial MODEL_FAILURES.md files were too generic; trainers coached on providing specific, actionable feedback"]
- [Example: "7% of prompts contained LLM markers (emojis, dashes); trainers educated on human writing style"]

---


**Trend Analysis**:
- [Example: "Training quality score improving steadily, +0.3 per batch over last 3 batches"]
- [Example: "First-pass approval rate increased 12% after implementing Claude prompt quality review"]
- [Example: "Rework rate decreased 8% after trainer calibration session on unit test connectivity"]

---

### Production Readiness Assessment

**Batch Status**: [APPROVED / REQUIRES REWORK / REJECTED]

**Justification**:
[Detailed explanation of why batch meets or doesn't meet production standards]

**Delivery Recommendation**:
- **Approved for Delivery**: [YES / NO]
- **Confidence Level**: [HIGH / MEDIUM / LOW]
- **Known Limitations**: [List any known issues or edge cases]
- **Recommended Use Cases**: [Specific training scenarios where this batch excels]

**Signatures**:
- **Quality Lead**: [Name, Date]
- **Technical Lead**: [Name, Date]
- **Project Manager**: [Name, Date]

---

## Appendix A: Tool and Script Reference

### Key Scripts for QA Process
| Script | Purpose | Location |
|--------|---------|----------|
| create-task.ts | Interactive task creation CLI | cli/create-task.ts |
| check-project-files.sh | Validates file structure | scripts/check-project-files.sh |
| detect-metadata.sh | Validates metadata and detects platform/language | scripts/detect-metadata.sh |
| claude-validate-prompt-quality.sh | Automated prompt quality checks | scripts/claude-validate-prompt-quality.sh |
| claude-validate-unit-test-connectivity.sh | Validates unit tests check connectivity | scripts/claude-validate-unit-test-connectivity.sh |
| claude-validate-integration-test-connectivity.sh | Validates integration tests verify end-to-end flow | scripts/claude-validate-integration-test-connectivity.sh |
| build.sh | Builds infrastructure code | scripts/build.sh |
| synth.sh | Synthesizes CDK/CDKTF to CloudFormation/Terraform | scripts/synth.sh |
| lint.sh | Runs linters on code | scripts/lint.sh |
| unit-tests.sh | Runs unit tests | scripts/unit-tests.sh |
| deploy.sh | Deploys to AWS | scripts/deploy.sh |
| localstack-ci-deploy.sh | Deploys to LocalStack | scripts/localstack-ci-deploy.sh |
| integration-tests.sh | Runs integration tests (AWS) | scripts/integration-tests.sh |
| localstack-ci-test.sh | Runs integration tests (LocalStack) | scripts/localstack-ci-test.sh |
| destroy.sh | Cleans up AWS resources | scripts/destroy.sh |
| localstack-cleanup.sh | Cleans up LocalStack resources | scripts/localstack-cleanup.sh |

### CI/CD Pipeline Configuration
- **Pipeline Definition**: .github/workflows/ci-cd.yml
- **Total Stages**: 12 (detect-metadata, prompt quality review, commit validation, jest validation, build, synth, lint, unit tests, deploy, integration tests, final Claude review, cleanup)
- **Average Runtime**: 20-40 minutes per task
- **Concurrency**: Multiple PRs can run in parallel with isolated environments (using PR number as suffix)

### Claude Code Action Prompts
| Prompt | Purpose | Location |
|--------|---------|----------|
| claude-prompt-quality-review.md | Validates prompt connectivity and human-written quality | .claude/prompts/claude-prompt-quality-review.md |
| claude-unit-test-review.md | Validates unit tests check service configuration | .claude/prompts/claude-unit-test-review.md |
| claude-integration-test-review.md | Validates integration tests verify end-to-end flow | .claude/prompts/claude-integration-test-review.md |
| claude-review-system-prompt.md | Comprehensive final review with scoring | .claude/prompts/claude-review-system-prompt.md |

---

## Appendix B: Example Task Metadata

```json
{
  "platform": "cdk",
  "language": "java",
  "complexity": "hard",
  "turn_type": "single",
  "po_id": "133455",
  "team": "1",
  "startedAt": "2025-12-10T21:58:28.800Z",
  "subtask": "Provisioning of Infrastructure Environments",
  "provider": "localstack",
  "subject_labels": ["Cloud Environment Setup"],
  "aws_services": ["s3", "Lambda"],
  "training_quality": 8
}
```

---

## Appendix C: Glossary

- **ACT (Average Creation Time)**: Time spent by trainer creating task from scratch to submission
- **ART (Average Review+Rework Time)**: Time spent in review and rework cycles
- **AHT (Average Handling Time)**: Total time = ACT + ART
- **CDK**: AWS Cloud Development Kit (IaC framework using programming languages)
- **CDKTF**: CDK for Terraform (generates Terraform configs from programming languages)
- **CFN**: AWS CloudFormation (native AWS IaC, YAML/JSON templates)
- **IaC**: Infrastructure as Code
- **LocalStack**: Local AWS cloud stack emulator for testing
- **PO ID**: Product Owner ID (task identifier)
- **Rubric**: Grading criteria for a specific quality dimension
- **Subject Label**: High-level category (11 predefined categories)
- **Subtask**: Granular categorization mapped to subject labels
- **TF**: Terraform (HashiCorp IaC tool, HCL language)
- **Training Quality Score**: 0-10 score assigned by Claude review indicating overall task quality

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-18 | QA Manager | Initial document creation |

---

**END OF DOCUMENT**
