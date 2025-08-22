above response is failing with

```yaml
W1020 'Fn::Sub' isn't needed because there are no variables
lib/TapStack.yml:314:11
ConfigRole        |  Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist or is not attachable. (Service: Iam, Status Code: 404, Request ID: 6bde6909-c764-4280-91cc-55c0fdbfe5df) (SDK Attempt Count: 1)

|  GuardDutyDetector |  Resource handler returned message: "The request is rejected because a detector already exists for the current account. (Service: GuardDuty, Status Code: 400, Request ID: 0e60067f-4684-49bb-9d39-eb4a7d253332) (SDK Attempt Count: 1)" (RequestToken: f8f2e0af-8d8c-3031-ef16-4458f22192d3, HandlerErrorCode: AlreadyExists)
```

please fix this
