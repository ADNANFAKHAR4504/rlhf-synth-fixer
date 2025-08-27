Make sure to write all code to Main.java

-- aws:s3:BucketPolicy cloudtrail-bucket-policy deleted original (0.33s) [diff: ~bucket,policy]
 -  aws:s3:Bucket bucket-cloudtrail-logs-1756201297800 deleting (0s) 
 -- aws:s3:Bucket bucket-cloudtrail-logs deleting original (0s) 
 -- aws:s3:Bucket cloudtrail-bucket deleting original (0s) [diff: ~bucket]
 -- aws:s3:Bucket bucket-cloudtrail-logs deleting original (0s) 
 -- aws:s3:Bucket bucket-cloudtrail-logs deleting original (0s) 
 -- aws:s3:Bucket bucket-cloudtrail-logs deleting original (0s) 
    aws:s3:Bucket bucket-cloudtrail-logs-1756201297800
  error:   sdk-v2/provider2.go:472: sdk.helper_schema: error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-1756201297818): BucketNotEmpty: The bucket you tried to delete is not empty
 -  aws:s3:Bucket bucket-cloudtrail-logs-1756201297800 deleting (0s) error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs-1756201297800: 1 error occurred:
 -  aws:s3:Bucket bucket-cloudtrail-logs-1756201297800 **deleting failed** error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs-1756201297800: 1 error occurred:
 -- aws:s3:Bucket bucket-cloudtrail-logs deleting original (0s) error:   sdk-v2/provider2.go:472: sdk.helper_schema: error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-1756200513396): BucketNotEmpty: The bucket you tried to delete is not empty
 -- aws:s3:Bucket bucket-cloudtrail-logs deleting original (0s) error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
 -- aws:s3:Bucket bucket-cloudtrail-logs **deleting failed** error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
@ updating....
    aws:s3:Bucket bucket-cloudtrail-logs
  error:   sdk-v2/provider2.go:472: sdk.helper_schema: error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-44301): BucketNotEmpty: The bucket you tried to delete is not empty
 -- aws:s3:Bucket bucket-cloudtrail-logs **deleting failed** error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
 -- aws:s3:Bucket bucket-cloudtrail-logs **deleting failed** error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
 -- aws:s3:Bucket bucket-cloudtrail-logs **deleting failed** error:   sdk-v2/provider2.go:472: sdk.helper_schema: error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-13469): BucketNotEmpty: The bucket you tried to delete is not empty
 -- aws:s3:Bucket bucket-cloudtrail-logs **deleting failed** error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
 -- aws:s3:Bucket bucket-cloudtrail-logs **deleting failed** error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
 -- aws:s3:Bucket bucket-cloudtrail-logs **deleting failed** error:   sdk-v2/provider2.go:472: sdk.helper_schema: error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-13469): BucketNotEmpty: The bucket you tried to delete is not empty
 -- aws:s3:Bucket bucket-cloudtrail-logs **deleting failed** error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
 -- aws:s3:Bucket bucket-cloudtrail-logs **deleting failed** error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
@ updating....
 -- aws:s3:Bucket cloudtrail-bucket deleted original (2s) [diff: ~bucket]
@ updating....
    pulumi:pulumi:Stack TapStack-TapStackpr2184 running error: update failed
    pulumi:pulumi:Stack TapStack-TapStackpr2184 **failed** 1 error
    aws:s3:Bucket bucket-cloudtrail-logs
 **failed** 1 error
    aws:s3:Bucket bucket-cloudtrail-logs-1756201297800
 **failed** 1 error
Diagnostics:
  aws:s3:Bucket (bucket-cloudtrail-logs
):
    error:   sdk-v2/provider2.go:472: sdk.helper_schema: error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-44301): BucketNotEmpty: The bucket you tried to delete is not empty
    	status code: 409, request id: 7E2HG1BWTWK36MBC, host id: mkQuRhK8xY/dHvqqnoailEPeQalgzYzwSOri5SGiss50aTTwBANTNvCJ+yTPwMpmPKVPHv7Ujdk=: provider=aws@6.52.0

  aws:s3:Bucket (bucket-cloudtrail-logs-1756201297800
):
    error:   sdk-v2/provider2.go:472: sdk.helper_schema: error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-1756201297818): BucketNotEmpty: The bucket you tried to delete is not empty
    	status code: 409, request id: 7E2PP01TXC3VRPQ3, host id: qL//u38mmO69lOb67L7JndGW6mqt0jseR/PvMG6qBdmeHVIYozMoYqWL5AHa0rbCSlDoYg4FylFH43MKW5YuQMg3a3/lzDN2iC9+Z4qoE+g=: provider=aws@6.52.0

  pulumi:pulumi:Stack (TapStack-TapStackpr2184):
    error: update failed

  aws:s3:Bucket (bucket-cloudtrail-logs-1756201297800):
    error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs-1756201297800: 1 error occurred:
    	* error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-1756201297818): BucketNotEmpty: The bucket you tried to delete is not empty
    	status code: 409, request id: 7E2PP01TXC3VRPQ3, host id: qL//u38mmO69lOb67L7JndGW6mqt0jseR/PvMG6qBdmeHVIYozMoYqWL5AHa0rbCSlDoYg4FylFH43MKW5YuQMg3a3/lzDN2iC9+Z4qoE+g=

  aws:s3:Bucket (bucket-cloudtrail-logs):
    error:   sdk-v2/provider2.go:472: sdk.helper_schema: error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-1756200513396): BucketNotEmpty: The bucket you tried to delete is not empty
    	status code: 409, request id: 7E2SDG3Z2GAE5X91, host id: Me1CwRi5Z++hA1iF+GN2uDJehVojpPOB6eHVl9pl9Pf4ZMTpFS4iw7VCQGQ6q9S8qWi7NkEhzFI=: provider=aws@6.52.0
    error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
    	* error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-1756200513396): BucketNotEmpty: The bucket you tried to delete is not empty
    	status code: 409, request id: 7E2SDG3Z2GAE5X91, host id: Me1CwRi5Z++hA1iF+GN2uDJehVojpPOB6eHVl9pl9Pf4ZMTpFS4iw7VCQGQ6q9S8qWi7NkEhzFI=
    error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
    	* error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-44301): BucketNotEmpty: The bucket you tried to delete is not empty
    	status code: 409, request id: 7E2HG1BWTWK36MBC, host id: mkQuRhK8xY/dHvqqnoailEPeQalgzYzwSOri5SGiss50aTTwBANTNvCJ+yTPwMpmPKVPHv7Ujdk=
    error:   sdk-v2/provider2.go:472: sdk.helper_schema: error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-13469): BucketNotEmpty: The bucket you tried to delete is not empty
    	status code: 409, request id: 25ZK4JF69T5S1JGK, host id: vs3IjIX4VuGaxYi8l8h34xrl3tLlhULzgUBeRt+6BoXOGJVHLEpYJipj9NAG0epGOacB9skeMtw=: provider=aws@6.52.0
    error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
    	* error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-13469): BucketNotEmpty: The bucket you tried to delete is not empty
    	status code: 409, request id: 25ZK4JF69T5S1JGK, host id: vs3IjIX4VuGaxYi8l8h34xrl3tLlhULzgUBeRt+6BoXOGJVHLEpYJipj9NAG0epGOacB9skeMtw=
    error:   sdk-v2/provider2.go:472: sdk.helper_schema: error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-13469): BucketNotEmpty: The bucket you tried to delete is not empty
    	status code: 409, request id: 25ZNKDERCD2G9VAV, host id: qlVJi4ncQUzzr0YglqEDNgDA/QmgSyNWwvlp5ak1miFLDce1eo1y8VzLhEjIJdVgt1j+7h6hBU0=: provider=aws@6.52.0
    error: deleting urn:pulumi:TapStackpr2184::TapStack::aws:s3/bucket:Bucket::bucket-cloudtrail-logs: 1 error occurred:
    	* error deleting S3 Bucket (yourcompany-production-cloudtrail-logs-13469): BucketNotEmpty: The bucket you tried to delete is not empty
    	status code: 409, request id: 25ZNKDERCD2G9VAV, host id: qlVJi4ncQUzzr0YglqEDNgDA/QmgSyNWwvlp5ak1miFLDce1eo1y8VzLhEjIJdVgt1j+7h6hBU0=

Outputs:
    cloudTrailArn         : "arn:aws:cloudtrail:us-east-1:***:trail/YourCompany-production-cloudtrail-main"
  ~ cloudTrailBucketName  : "yourcompany-production-cloudtrail-logs-1756203717936" => "yourcompany-production-cloudtrail-logs-1756204337043"
    cloudTrailKmsKeyId    : "95f48135-b5b9-4ad7-b170-0fb1a5498f06"
    cloudTrailName        : "YourCompany-production-cloudtrail-main"
    configServiceRoleArn  : "arn:aws:iam::***:role/role-config-service-b8d5ebe"
    elasticIpIdA          : "eipalloc-0947a20536c448da2"
    elasticIpIdB          : "eipalloc-0f2cbdb7006f3acdc"
    internetGatewayId     : "igw-03b428d87021c7287"
    lambdaExecutionRoleArn: "arn:aws:iam::***:role/role-lambda-execution-72376b5"
    lambdaKmsKeyId        : "03fef727-ac7d-4664-9311-d354518483c9"
    lambdaSecurityGroupId : "sg-06b6a338c6f5f1944"
    natGatewayIdA         : "nat-01a6706ca53e2d736"
    natGatewayIdB         : "nat-02120151874f0661f"
    privateRouteTableIdA  : "rtb-0a24fdc7b333bb308"
    privateRouteTableIdB  : "rtb-05df1b372b8730c0c"
    privateSubnetIdA      : "subnet-060f53bd3f86cab4e"
    privateSubnetIdB      : "subnet-014ed79e195b0734e"
    publicRouteTableId    : "rtb-0e5871774d9ee28ec"
    publicSubnetIdA       : "subnet-058d3be0aa83e9077"
    publicSubnetIdB       : "subnet-07bdce26880dd6382"
    rdsKmsKeyId           : "bb3788f4-22ae-4040-b42d-4bdf8099f46a"
    rdsSecurityGroupId    : "sg-03388ae3052f03bf1"
    s3KmsKeyId            : "89e47314-b743-4af0-999d-9e7a56cb910f"
    vpcCidrBlock          : "10.0.0.0/16"
    vpcId                 : "vpc-05860e163266cb8c5"

Resources:
    ~ 1 updated
    +-2 replaced
    3 changes. 37 unchanged

Duration: 18s

Still stuck at s3 bucket issue can you fix this please?