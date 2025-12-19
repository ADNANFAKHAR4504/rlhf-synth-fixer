Overview

The original TapStack.yml CloudFormation template failed deployment because AWS GuardDuty Detector already existed in the target AWS account. By default, AWS::GuardDuty::Detector is a singleton resource—only one detector can exist per account per region. Attempting to create another results in a CREATE_FAILED error.

This document explains the resolution strategy and provides guidance on making the template idempotent, reusable, and safe across multiple environments.

Root Cause

Error:

Resource handler returned message: 
"The request is rejected because a detector already exists for the current account."


GuardDuty Detectors are unique per account/region. The template attempted to create a new one, causing conflict.

Solution Strategy
1. Add Optional Parameter

Introduce a parameter EnableGuardDuty (Boolean). Users can decide whether to create a new detector via stack parameters.

Parameters:
  EnableGuardDuty:
    Type: String
    AllowedValues: [true, false]
    Default: false
    Description: Set to true to create a GuardDuty detector. Must be false if one already exists.

2. Use a Condition

Wrap the AWS::GuardDuty::Detector resource inside a Condition that checks the parameter.

Conditions:
  CreateGuardDuty: !Equals [!Ref EnableGuardDuty, true]

3. GuardDuty Resource with Condition
GuardDutyDetector:
  Type: AWS::GuardDuty::Detector
  Condition: CreateGuardDuty
  Properties:
    Enable: true

4. Documentation for Users

If GuardDuty already exists:

Deploy stack with EnableGuardDuty=false.

The template will skip creation, avoiding errors.

GuardDuty continues functioning without duplication.

Security Integrity

Even with GuardDuty made optional, the template still:

Uses KMS encryption for all sensitive resources.

Enforces least-privilege IAM policies.

Configures CloudTrail, Config, Secrets Manager, Shield, and WAF.

Maintains compliance-ready tagging.