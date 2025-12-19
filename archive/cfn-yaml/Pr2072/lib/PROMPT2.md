Above prompt respose is failing at lint and deploy stages

```yaml
E3002 Additional properties are not allowed ('TransitionInDays' was unexpected. Did you mean 'Transitions'?)
lib/TapStack.yml:96:13
E3002 Additional properties are not allowed ('StorageClass' was unexpected)
lib/TapStack.yml:97:13
E3002 Additional properties are not allowed ('TransitionInDays' was unexpected. Did you mean 'Transitions'?)
lib/TapStack.yml:100:13
E3002 Additional properties are not allowed ('StorageClass' was unexpected)
lib/TapStack.yml:101:13
E3002 Additional properties are not allowed ('TransitionInDays' was unexpected. Did you mean 'Transitions'?)
lib/TapStack.yml:127:13
E3002 Additional properties are not allowed ('StorageClass' was unexpected)
lib/TapStack.yml:128:13
E3003 'IsLogging' is a required property
lib/TapStack.yml:188:5
E3030 'AWS::S3::Bucket' is not one of ['AWS::Lambda::Function', 'AWS::S3::Object', 'AWS::DynamoDB::Table', 'AWS::S3Outposts::Object', 'AWS::ManagedBlockchain::Node', 'AWS::S3ObjectLambda::AccessPoint', 'AWS::EC2::Snapshot', 'AWS::S3::AccessPoint', 'AWS::DynamoDB::Stream']
lib/TapStack.yml:202:15


|  VpcFlowLogsBucket   |  Properties validation failed for resource VpcFlowLogsBucket with message:
[#/LifecycleConfiguration/Rules/1: extraneous key [TransitionInDays] is not permitted, #/LifecycleConfiguration/Rules/1: extraneous key [StorageClass] is not permitted]                                                                                                                                                                              |  CREATE_FAILED        |  2025-08-22T18:44:40.753000+00:00 |  AWS::S3::Bucket            |
|  CloudTrailLogsBucket|  Properties validation failed for resource CloudTrailLogsBucket with message:
[#/LifecycleConfiguration/Rules/1: extraneous key [TransitionInDays] is not permitted, #/LifecycleConfiguration/Rules/1: extraneous key [StorageClass] is not permitted, #/LifecycleConfiguration/Rules/2: extraneous key [TransitionInDays] is not permitted, #/LifecycleConfiguration/Rules/2: extraneous key [StorageClass] is not permitted]   |  CREATE_FAILED        |  2025-08-22T18:44:40.753000+00:00 |  AWS::S3::Bucket
```

can you please fix them
