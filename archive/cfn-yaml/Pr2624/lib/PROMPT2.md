Your given TapStack.yml code is failing on deployment.

Error:

The resource GuardDutyDetector is in a CREATE_FAILED state
This AWS::GuardDuty::Detector resource is in a CREATE_FAILED state.

Resource handler returned message: "The request is rejected because a detector already exists for the current account. 
(Service: GuardDuty, Status Code: 400, Request ID: 4e3663eb-194d-43ee-acff-a22752d0891c) 
(SDK Attempt Count: 1)" (RequestToken: e7a11fa5-fd72-b433-c0b9-6b655a24ceb0, HandlerErrorCode: AlreadyExists)


What I need:

Update the CloudFormation template to handle GuardDuty gracefully so it doesn’t fail if a detector already exists.

Ensure idempotency: the stack should succeed on repeated deploys.

Provide a full corrected TapStack.yml with a safe pattern for enabling GuardDuty (e.g., use Condition, Parameter, or make GuardDuty optional).

Maintain all other security features (KMS, VPCs, CloudTrail, Config, etc.) intact.

Add inline comments to explain the GuardDuty fix.