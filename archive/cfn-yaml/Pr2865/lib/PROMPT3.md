## Prompt 3
The above Model response failed due to the destination bucket issue as below. pLease make the nessary modifications in the stack to fix it.

    {
        "StackId": "arn:aws:cloudformation:us-east-1:718240086340:stack/TapStackpr2865/fac55ab0-8c9c-11f0-bf18-0affc5e4aacb",
        "EventId": "SourceBucket-CREATE_FAILED-2025-09-08T10:17:40.629Z",
        "StackName": "TapStackpr2865",
        "LogicalResourceId": "SourceBucket",
        "PhysicalResourceId": "disaster-recovery-replication-source-staging-718240086340",
        "ResourceType": "AWS::S3::Bucket",
        "Timestamp": "2025-09-08T10:17:40.629000+00:00",
        "ResourceStatus": "CREATE_FAILED",
        "ResourceStatusReason": "Resource handler returned message: \"Destination bucket must have versioning enabled. (Service: S3, Status Code: 400, Request ID: 5MEPD1BK1N44S9FK, Extended Request ID: zcS413CT9L3sZI9Zk9VoLKu+x7tLikFoKAIv0CZEPzjHBQJzOt9TU+/TuwIDe2D9n53yTJejn646sRpODmv0n+T4K0UbiWo4RH/lC74Jcdk=) (SDK Attempt Count: 1)\" (RequestToken: c63c1ae7-4fb7-aafe-5d0a-f99b3e362173, HandlerErrorCode: InvalidRequest)",
        "ResourceProperties": "{\"PublicAccessBlockConfiguration\":{\"RestrictPublicBuckets\":\"true\",\"BlockPublicPolicy\":\"true\",\"BlockPublicAcls\":\"true\",\"IgnorePublicAcls\":\"true\"},\"BucketName\":\"disaster-recovery-replication-source-staging-718240086340\",\"BucketEncryption\":{\"ServerSideEncryptionConfiguration\":[{\"BucketKeyEnabled\":\"true\",\"ServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"aws:kms\",\"KMSMasterKeyID\":\"alias/aws/s3\"}}]},\"LifecycleConfiguration\":{\"Rules\":[{\"Status\":\"Enabled\",\"NoncurrentVersionExpirationInDays\":\"365\",\"NoncurrentVersionTransitions\":[{\"StorageClass\":\"STANDARD_IA\",\"TransitionInDays\":\"30\"}],\"Id\":\"NonCurrentVersionTransition\"}]},\"VersioningConfiguration\":{\"Status\":\"Enabled\"},\"ReplicationConfiguration\":{\"Role\":\"arn:aws:iam::718240086340:role/disaster-recovery-replication-replication-role-staging\",\"Rules\":[{\"Status\":\"Enabled\",\"Destination\":{\"Metrics\":{\"Status\":\"Enabled\",\"EventThreshold\":{\"Minutes\":\"15\"}},\"Bucket\":\"arn:aws:s3:::my-dr-destination-bucket\",\"StorageClass\":\"STANDARD\",\"ReplicationTime\":{\"Status\":\"Enabled\",\"Time\":{\"Minutes\":\"15\"}}},\"Filter\":{\"Prefix\":\"\"},\"Priority\":\"1\",\"Id\":\"DisasterRecoveryReplication\",\"DeleteMarkerReplication\":{\"Status\":\"Enabled\"}}]},\"Tags\":[{\"Value\":\"staging\",\"Key\":\"Environment\"},{\"Value\":\"IT-Infrastructure\",\"Key\":\"CostCenter\"},{\"Value\":\"disaster-recovery-replication\",\"Key\":\"Project\"},{\"Value\":\"Source bucket for cross-region replication\",\"Key\":\"Purpose\"}]}"
    }