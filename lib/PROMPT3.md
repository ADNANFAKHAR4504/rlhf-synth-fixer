your previous fix for the initial error worked but deployment failed again with the following errors:

aws:ec2:Subnet secondary-networkpublic-subnet-primary creating (1s) error: sdk-v2/provider2.go:572: sdk.helper_schema: creating EC2 Subnet: operation error EC2: 
CreateSubnet, https response error StatusCode: 400, RequestID: df2cc86e-5dd3-46ca-88c3-2c3833852c44, api error InvalidParameterValue: Value (us-east-1a) for parameter availabilityZone is invalid. 
Subnets can currently only be created in the following availability zones: us-west-2a, us-west-2b, us-west-2c, us-west-2d.: provider=aws@7.5.0