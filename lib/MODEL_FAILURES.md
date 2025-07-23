    raise RuntimeError(resp.error) from JavaScriptError(resp.stack)
RuntimeError: Lambda Functions in a public subnet can NOT access the internet. If you are aware of this limitation and would still like to place the function in a public subnet, set `allowPublicSubnet` to true
pipenv run python3 tap.py: Subprocess exited with error 1


  File "/home/rajendra/turing/iac-test-automations/lib/tap_stack.py", line 22
    core
    ^^^^
SyntaxError: invalid syntax
pipenv run python3 tap.py: Subprocess exited with error 1




Failed resources:
DemoStackpr94ServerlessStack92A571D9 | 6:01:44 PM | CREATE_FAILED        | AWS::Lambda::Function                 | DemoStackpr94/ServerlessStack/ItemFunction (ItemFunctionA294B384) Resource handler returned message: "The provided execution role does not have permissions to call CreateNetworkInterface on EC2 (Service: Lambda, Status Code: 400, Request ID: 20ca0521-8a01-4d93-885b-412e20c6ca65) (SDK Attempt Count: 1)" (RequestToken: e0dc8073-f177-9115-5521-229f9f730f00, HandlerErrorCode: InvalidRequest)
❌  DemoStackpr94ServerlessStack92A571D9 failed: _ToolkitError: The stack named DemoStackpr94ServerlessStack92A571D9 failed creation, it may need to be manually deleted from the AWS console: ROLLBACK_COMPLETE: Resource handler returned message: "The provided execution role does not have permissions to call CreateNetworkInterface on EC2 (Service: Lambda, Status Code: 400, Request ID: 20ca0521-8a01-4d93-885b-412e20c6ca65) (SDK Attempt Count: 1)" (RequestToken: e0dc8073-f177-9115-5521-229f9f730f00, HandlerErrorCode: InvalidRequest)