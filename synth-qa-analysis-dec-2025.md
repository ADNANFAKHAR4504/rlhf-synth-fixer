# Synth Team QA Analysis

I ran a quality check on the 30 most recent synth team jobs in the archive folder to see if the infrastructure code and tests actually match what's documented in IDEAL_RESPONSE.md. The results are concerning.

## What I checked

I looked at 30 recent tasks from December 2024 across different platforms:
- Terraform: 2 tasks
- Pulumi Python: 10 tasks
- Pulumi TypeScript: 1 task
- CloudFormation YAML: 10 tasks
- CloudFormation JSON: 3 tasks
- CDK TypeScript: 1 task

For each task, I checked if the actual tapstack file (main.tf, TapStack.yml, tap_stack.py, etc) matches exactly what's in IDEAL_RESPONSE.md. Character by character. I also checked unit and integration tests.

## Results summary

Out of 30 tasks:
- 6 tasks have infrastructure code matching IDEAL_RESPONSE.md perfectly (20%)
- 24 tasks have code that doesn't match the documentation (80%)

For tests, it's even worse. Every single TypeScript-based task is missing test files from IDEAL_RESPONSE.md. All 17 of them.

## Tasks that got it right

Only 6 tasks have perfect alignment:

Pr8389 (terraform) - all .tf files match exactly
Pr8360 (pulumi-py) - tap_stack.py matches
Pr8228 (pulumi-py) - both __main__.py and tap_stack.py match
Pr8392 (cfn-yaml) - TapStack.yml matches
Pr8391 (cfn-yaml) - TapStack.yml matches
Pr8314 (cfn-yaml) - TapStack.yml matches

These are the only ones where the synth team actually kept the documentation in sync with the code.

## Breakdown by framework

Terraform (2 tasks, 50% success)
- Pr8389: perfect match across all files
- Pr7995: 5 files don't match (data.tf, validation.tf, outputs.tf, variables.tf, provider.tf)

The Pr7995 failure is bad because multiple files are out of sync. Looks like someone made changes but never updated the docs.

Pulumi Python (10 tasks, 20% success)
Perfect matches: Pr8360, Pr8228

Failed tasks: Pr8385, Pr8246, Pr8229, Pr8227, Pr8224, Pr8223, Pr8218, Pr8125, Pr6169

Most of these just have tap_stack.py not matching. Pr8385 also has __main__.py wrong. 80% failure rate is really bad.

CloudFormation YAML (10 tasks, 30% success)
Perfect matches: Pr8392, Pr8391, Pr8314

Failed tasks: Pr8388, Pr8382, Pr8313, Pr8309, Pr8288, Pr8240, Pr8189, Pr8150, Pr8079

Same issue everywhere - TapStack.yml doesn't match the docs. 7 out of 10 tasks have this problem.

CloudFormation JSON (3 tasks, 0% success)
All failed: Pr8390, Pr8325, Pr8316

Every single CloudFormation JSON task has TapStack.json not matching IDEAL_RESPONSE.md. Complete failure for this framework.

CDK TypeScript (1 task, 0% success)
Failed: Pr8276 - tap-stack.ts doesn't match

Pulumi TypeScript (1 task, 0% success)
Failed: Pr8109 - index.ts doesn't match

## The test file problem

This is where it gets really messy. I found test files in all the TypeScript-based projects but none of them are in IDEAL_RESPONSE.md.

Unit tests missing from IDEAL_RESPONSE.md:

Terraform tasks:
- Pr8389: terraform-config.unit.test.ts, infrastructure.unit.test.ts not documented
- Pr7995: terraform.unit.test.ts not documented

Pulumi TypeScript:
- Pr8109: migration-infrastructure.unit.test.ts, tap-stack.unit.test.ts not documented

CloudFormation YAML:
All 10 tasks (Pr8392, Pr8391, Pr8388, Pr8382, Pr8314, Pr8313, Pr8309, Pr8288, Pr8240, Pr8189, Pr8079) missing tap-stack.unit.test.ts
Pr8150 also missing cicd-pipeline.unit.test.ts and cicd-pipeline-config.unit.test.ts

CloudFormation JSON:
- Pr8390, Pr8316: missing tap-stack.unit.test.ts
- Pr8325: missing vpc-stack.unit.test.ts

CDK TypeScript:
- Pr8276: missing tap-stack.unit.test.ts

Integration tests missing from IDEAL_RESPONSE.md:

Same pattern. Every TypeScript-based task has integration test files but they're not in IDEAL_RESPONSE.md.

Terraform: Pr8389 missing infrastructure.int.test.ts, Pr7995 missing terraform.int.test.ts
Pulumi TS: Pr8109 missing both migration-infrastructure.int.test.ts and tap-stack.int.test.ts
All CloudFormation YAML tasks missing tap-stack.int.test.ts (plus Pr8150 missing cicd-pipeline.int.test.ts)
All CloudFormation JSON tasks missing integration tests
CDK task missing tap-stack.int.test.ts

For Pulumi Python, there are tests in the tests folder but they're not in IDEAL_RESPONSE.md either. Seems like this is intentional for Python but I'm not sure about TypeScript.

## What's happening in the workflow

The CI/CD pipeline runs prompt quality checks (looking for emojis, LLM content, service connectivity stuff) but there's no validation that IDEAL_RESPONSE.md actually matches the code files. So these tasks pass all the quality gates even though the documentation is wrong.

Current checks:
1. Metadata validation
2. Prompt quality review
3. Build and synth
4. Unit and integration tests
5. Deployment
6. Claude code review

What's missing:
- No automated check comparing IDEAL_RESPONSE.md to actual files
- No policy on whether test code should be documented
- Nothing stops code-documentation drift before archiving

## Main problems

Problem 1: Documentation not synced (80% failure rate)
The code gets changed during development, testing, fixing CI/CD issues, etc. But IDEAL_RESPONSE.md doesn't get updated. No validation catches this before the task gets archived.

Problem 2: Test files completely missing from docs (100% of TypeScript tasks)
Every TypeScript-based task has test files that aren't documented. Either this is intentional and nobody told anyone, or it's a massive oversight.

Problem 3: Some frameworks are way worse than others
- CloudFormation JSON: 100% failure
- CDK TypeScript: 100% failure (only 1 task though)
- Pulumi TypeScript: 100% failure (only 1 task though)
- Pulumi Python: 80% failure
- CloudFormation YAML: 70% failure

Problem 4: No automated validation
The pipeline checks a lot of things but not whether IDEAL_RESPONSE.md is accurate. Tasks can pass with completely wrong documentation.

## Why this matters

If IDEAL_RESPONSE.md is supposed to be training data, then 80% of it is corrupted. The documented ideal response doesn't match what actually got built and tested.

Anyone using IDEAL_RESPONSE.md as a reference will get wrong information 80% of the time. They'll copy outdated code, get confused about the right way to do things, and stop trusting the docs.

For audits and compliance, the documentation doesn't match reality. You can't trace what actually happened or verify things properly.

## Why this is happening

Based on what I'm seeing, the likely causes are:

The code changes but docs don't
Infrastructure code gets modified during initial dev, CI/CD fixes, test debugging, deployment troubleshooting. IDEAL_RESPONSE.md gets created early and never updated after that.

No validation step
There's no check that compares code files to IDEAL_RESPONSE.md before archiving. The drift just goes unnoticed.

Nobody knows if tests should be documented
Are tests supposed to be in IDEAL_RESPONSE.md or not? Without a clear answer, nobody can maintain consistency.

CloudFormation JSON has special issues
100% failure rate suggests JSON templates might be harder to maintain in markdown code blocks, or there's formatting problems, or the team just isn't familiar with it.

## What needs to happen

Right now:

1. Figure out the test documentation policy
Decide if unit and integration tests should be in IDEAL_RESPONSE.md. Document it clearly. Make sure everyone knows.

2. Add automated validation
Put a CI/CD step that extracts code from IDEAL_RESPONSE.md and compares it to actual files character by character. Fail the build if there are differences. Run this before archiving.

3. Fix the CloudFormation JSON situation
Find out why every single CloudFormation JSON task fails. Train people or build better tools.

4. Fix the 24 broken tasks
Update IDEAL_RESPONSE.md for all these tasks:
- Terraform: Pr7995
- Pulumi Python: Pr8385, Pr8246, Pr8229, Pr8227, Pr8224, Pr8223, Pr8218, Pr8125, Pr6169
- Pulumi TypeScript: Pr8109
- CloudFormation YAML: Pr8388, Pr8382, Pr8313, Pr8309, Pr8288, Pr8240, Pr8189, Pr8150, Pr8079
- CloudFormation JSON: Pr8390, Pr8325, Pr8316
- CDK TypeScript: Pr8276

Use the actual working code as the source of truth.

Later:

Build tools that auto-generate IDEAL_RESPONSE.md from actual files or vice versa. Stop relying on manual syncing.

Add IDEAL_RESPONSE.md accuracy to code review checklists. Make reviewers verify code-doc alignment.

Create framework-specific guides with examples of correct IDEAL_RESPONSE.md formatting.

Track documentation accuracy over time. Set improvement goals.

Run training on documentation best practices. Use the 6 successful tasks as examples.

## Bottom line

The infrastructure code works fine. Tests pass. Deployments succeed. But the documentation is wrong in 80% of cases. This is a process problem, not a coding problem.

The test documentation issue is especially concerning. If tests should be in IDEAL_RESPONSE.md, we have a 100% failure rate. If they shouldn't be there, then we need to document that somewhere.

We need to:
1. Clarify what belongs in IDEAL_RESPONSE.md
2. Add automated checks to prevent drift
3. Fix the 24 broken tasks
4. Figure out what's wrong with CloudFormation JSON

The 6 good tasks (Pr8389, Pr8360, Pr8228, Pr8392, Pr8391, Pr8314) prove this is doable. Use them as references.

## Task lists

Perfect infrastructure code match (6 tasks):
Pr8389, Pr8360, Pr8228, Pr8392, Pr8391, Pr8314

Infrastructure code doesn't match docs (24 tasks):
Pr8109, Pr8385, Pr8246, Pr8229, Pr8227, Pr8224, Pr8223, Pr8218, Pr8388, Pr8382, Pr8313, Pr8309, Pr8288, Pr8240, Pr8189, Pr8390, Pr8325, Pr8316, Pr8276, Pr8125, Pr6169, Pr8150, Pr8079, Pr7995

All TypeScript tasks missing test files in docs (17 tasks):
Pr8389, Pr8109, Pr8392, Pr8391, Pr8388, Pr8382, Pr8314, Pr8313, Pr8309, Pr8288, Pr8240, Pr8189, Pr8390, Pr8325, Pr8316, Pr8276, Pr8150, Pr8079, Pr7995
