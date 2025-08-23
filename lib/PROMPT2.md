Error: creating S3 Bucket (my-company-logs-dev) encryption: operation error S3: PutBucketEncryption, https response error StatusCode: 501, RequestID: ABC123, HostID: xyz, api error NotImplemented: A header you provided implies functionality that is not implemented

│   with aws_s3_bucket_encryption.storage-logging-encryption,
│   on cdk.tf.json line 234, in resource.aws_s3_bucket_encryption.storage-logging-encryption:
│  234:       }
│ 
│ Error: The aws_s3_bucket_encryption resource is deprecated and has been replaced by aws_s3_bucket_server_side_encryption_configuration

getting the error , please fix it and give me a single source file
