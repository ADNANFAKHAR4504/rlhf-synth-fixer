# Zero-Trust Security Infrastructure - Pulumi Go Implementation

This implementation creates a comprehensive zero-trust security infrastructure with VPC isolation, encryption at rest and in transit, IAM least privilege policies, and compliance monitoring.

## File: lib/tap_stack.go

```go
package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigateway"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/config"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lambda"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type TapStackArgs struct {
	EnvironmentSuffix string
}

type TapStack struct {
	pulumi.ResourceState
	VpcID             pulumi.StringOutput
	SubnetIDs         pulumi.StringArrayOutput
	S3BucketName      pulumi.StringOutput
	KmsKeyArn         pulumi.StringOutput
	ApiGatewayUrl     pulumi.StringOutput
	LambdaFunctionArn pulumi.StringOutput
}

func NewTapStack(ctx *pulumi.Context, name string, args *TapStackArgs, opts ...pulumi.ResourceOption) (*TapStack, error) {
	if args == nil {
		args = &TapStackArgs{
			EnvironmentSuffix: "dev",
		}
	}

	component := &TapStack{}
	err := ctx.RegisterComponentResource("custom:security:TapStack", name, component, opts...)
	if err != nil {
		return nil, err
	}

	// Common tags for all resources
	commonTags := pulumi.StringMap{
		"CostCenter":         pulumi.String("SecurityOps"),
		"Environment":        pulumi.String(args.EnvironmentSuffix),
		"DataClassification": pulumi.String("Confidential"),
	}

	// 1. Create KMS key with rotation
	kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("security-kms-%s", args.EnvironmentSuffix), &kms.KeyArgs{
		Description:          pulumi.String("KMS key for zero-trust security infrastructure"),
		EnableKeyRotation:    pulumi.Bool(true),
		DeletionWindowInDays: pulumi.Int(10),
		Tags:                 commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	kmsAlias, err := kms.NewAlias(ctx, fmt.Sprintf("security-kms-alias-%s", args.EnvironmentSuffix), &kms.AliasArgs{
		Name:         pulumi.String(fmt.Sprintf("alias/security-%s", args.EnvironmentSuffix)),
		TargetKeyId:  kmsKey.KeyId,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// 2. Create VPC with private subnets (no internet gateway)
	vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("security-vpc-%s", args.EnvironmentSuffix), &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":               pulumi.String(fmt.Sprintf("security-vpc-%s", args.EnvironmentSuffix)),
			"CostCenter":         pulumi.String("SecurityOps"),
			"Environment":        pulumi.String(args.EnvironmentSuffix),
			"DataClassification": pulumi.String("Confidential"),
		},
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// Get availability zones
	availabilityZones := []string{"us-east-1a", "us-east-1b", "us-east-1c"}
	var subnetIDs []pulumi.StringInput

	// Create 3 private subnets across different AZs
	for i, az := range availabilityZones {
		subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%d-%s", i+1, args.EnvironmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i)),
			AvailabilityZone: pulumi.String(az),
			Tags: pulumi.StringMap{
				"Name":               pulumi.String(fmt.Sprintf("private-subnet-%d-%s", i+1, args.EnvironmentSuffix)),
				"CostCenter":         pulumi.String("SecurityOps"),
				"Environment":        pulumi.String(args.EnvironmentSuffix),
				"DataClassification": pulumi.String("Confidential"),
			},
		}, pulumi.Parent(component))
		if err != nil {
			return nil, err
		}
		subnetIDs = append(subnetIDs, subnet.ID())
	}

	// 3. Security group for VPC endpoints (no 0.0.0.0/0)
	endpointSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("endpoint-sg-%s", args.EnvironmentSuffix), &ec2.SecurityGroupArgs{
		VpcId:       vpc.ID(),
		Description: pulumi.String("Security group for VPC endpoints"),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
			},
		},
		Egress: ec2.SecurityGroupEgressArray{
			&ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
			},
		},
		Tags: commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// 4. VPC Endpoints for S3 and DynamoDB
	s3Endpoint, err := ec2.NewVpcEndpoint(ctx, fmt.Sprintf("s3-endpoint-%s", args.EnvironmentSuffix), &ec2.VpcEndpointArgs{
		VpcId:       vpc.ID(),
		ServiceName: pulumi.String("com.amazonaws.us-east-1.s3"),
		RouteTableIds: pulumi.StringArray{},
		Tags:          commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	dynamoEndpoint, err := ec2.NewVpcEndpoint(ctx, fmt.Sprintf("dynamodb-endpoint-%s", args.EnvironmentSuffix), &ec2.VpcEndpointArgs{
		VpcId:       vpc.ID(),
		ServiceName: pulumi.String("com.amazonaws.us-east-1.dynamodb"),
		RouteTableIds: pulumi.StringArray{},
		Tags:          commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// 5. Network ACL with explicit deny for all except 443 and 3306
	networkAcl, err := ec2.NewNetworkAcl(ctx, fmt.Sprintf("security-nacl-%s", args.EnvironmentSuffix), &ec2.NetworkAclArgs{
		VpcId:     vpc.ID(),
		Tags:      commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// Allow HTTPS (443)
	_, err = ec2.NewNetworkAclRule(ctx, fmt.Sprintf("allow-https-ingress-%s", args.EnvironmentSuffix), &ec2.NetworkAclRuleArgs{
		NetworkAclId: networkAcl.ID(),
		RuleNumber:   pulumi.Int(100),
		Protocol:     pulumi.String("tcp"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("10.0.0.0/16"),
		FromPort:     pulumi.Int(443),
		ToPort:       pulumi.Int(443),
		Egress:       pulumi.Bool(false),
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// Allow MySQL (3306)
	_, err = ec2.NewNetworkAclRule(ctx, fmt.Sprintf("allow-mysql-ingress-%s", args.EnvironmentSuffix), &ec2.NetworkAclRuleArgs{
		NetworkAclId: networkAcl.ID(),
		RuleNumber:   pulumi.Int(110),
		Protocol:     pulumi.String("tcp"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("10.0.0.0/16"),
		FromPort:     pulumi.Int(3306),
		ToPort:       pulumi.Int(3306),
		Egress:       pulumi.Bool(false),
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// Deny all other traffic
	_, err = ec2.NewNetworkAclRule(ctx, fmt.Sprintf("deny-all-ingress-%s", args.EnvironmentSuffix), &ec2.NetworkAclRuleArgs{
		NetworkAclId: networkAcl.ID(),
		RuleNumber:   pulumi.Int(200),
		Protocol:     pulumi.String("-1"),
		RuleAction:   pulumi.String("deny"),
		CidrBlock:    pulumi.String("0.0.0.0/0"),
		Egress:       pulumi.Bool(false),
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// 6. S3 bucket with versioning, encryption, and deny unencrypted policy
	bucket, err := s3.NewBucket(ctx, fmt.Sprintf("security-bucket-%s", args.EnvironmentSuffix), &s3.BucketArgs{
		Tags: commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("bucket-versioning-%s", args.EnvironmentSuffix), &s3.BucketVersioningV2Args{
		Bucket: bucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("bucket-encryption-%s", args.EnvironmentSuffix), &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: bucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					SseAlgorithm: pulumi.String("AES256"),
				},
			},
		},
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// Bucket policy to deny unencrypted uploads
	_, err = s3.NewBucketPolicy(ctx, fmt.Sprintf("bucket-policy-%s", args.EnvironmentSuffix), &s3.BucketPolicyArgs{
		Bucket: bucket.ID(),
		Policy: pulumi.All(bucket.Arn).ApplyT(func(args []interface{}) string {
			bucketArn := args[0].(string)
			return fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "DenyUnencryptedObjectUploads",
						"Effect": "Deny",
						"Principal": "*",
						"Action": "s3:PutObject",
						"Resource": "%s/*",
						"Condition": {
							"StringNotEquals": {
								"s3:x-amz-server-side-encryption": "AES256"
							}
						}
					}
				]
			}`, bucketArn)
		}).(pulumi.StringOutput),
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// 7. CloudWatch Log Group with KMS encryption and 90-day retention
	logGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("security-logs-%s", args.EnvironmentSuffix), &cloudwatch.LogGroupArgs{
		RetentionInDays: pulumi.Int(90),
		KmsKeyId:        kmsKey.Arn,
		Tags:            commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// 8. IAM role for Lambda with explicit deny and least privilege
	lambdaRole, err := iam.NewRole(ctx, fmt.Sprintf("lambda-role-%s", args.EnvironmentSuffix), &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "lambda.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		Tags: commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// Attach minimal policies
	_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("lambda-basic-execution-%s", args.EnvironmentSuffix), &iam.RolePolicyAttachmentArgs{
		Role:      lambdaRole.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// Explicit deny policy
	_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("lambda-explicit-deny-%s", args.EnvironmentSuffix), &iam.RolePolicyArgs{
		Role: lambdaRole.ID(),
		Policy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Deny",
					"Action": [
						"iam:*",
						"organizations:*",
						"account:*"
					],
					"Resource": "*"
				}
			]
		}`),
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// 9. Lambda function with KMS encryption for environment variables
	lambdaFunction, err := lambda.NewFunction(ctx, fmt.Sprintf("security-lambda-%s", args.EnvironmentSuffix), &lambda.FunctionArgs{
		Runtime: pulumi.String("python3.11"),
		Handler: pulumi.String("index.handler"),
		Role:    lambdaRole.Arn,
		Code:    pulumi.NewFileArchive("./lambda"),
		Environment: &lambda.FunctionEnvironmentArgs{
			Variables: pulumi.StringMap{
				"ENVIRONMENT": pulumi.String(args.EnvironmentSuffix),
			},
		},
		KmsKeyArn: kmsKey.Arn,
		Tags:      commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// 10. API Gateway with AWS_IAM authorization
	restApi, err := apigateway.NewRestApi(ctx, fmt.Sprintf("security-api-%s", args.EnvironmentSuffix), &apigateway.RestApiArgs{
		Description: pulumi.String("Zero-trust API Gateway"),
		Tags:        commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	resource, err := apigateway.NewResource(ctx, fmt.Sprintf("api-resource-%s", args.EnvironmentSuffix), &apigateway.ResourceArgs{
		RestApi:  restApi.ID(),
		ParentId: restApi.RootResourceId,
		PathPart: pulumi.String("secure"),
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	method, err := apigateway.NewMethod(ctx, fmt.Sprintf("api-method-%s", args.EnvironmentSuffix), &apigateway.MethodArgs{
		RestApi:       restApi.ID(),
		ResourceId:    resource.ID(),
		HttpMethod:    pulumi.String("GET"),
		Authorization: pulumi.String("AWS_IAM"),
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	_, err = apigateway.NewIntegration(ctx, fmt.Sprintf("api-integration-%s", args.EnvironmentSuffix), &apigateway.IntegrationArgs{
		RestApi:               restApi.ID(),
		ResourceId:            resource.ID(),
		HttpMethod:            method.HttpMethod,
		IntegrationHttpMethod: pulumi.String("POST"),
		Type:                  pulumi.String("AWS_PROXY"),
		Uri:                   lambdaFunction.InvokeArn,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	deployment, err := apigateway.NewDeployment(ctx, fmt.Sprintf("api-deployment-%s", args.EnvironmentSuffix), &apigateway.DeploymentArgs{
		RestApi:     restApi.ID(),
		Description: pulumi.String("Production deployment"),
	}, pulumi.Parent(component), pulumi.DependsOn([]pulumi.Resource{method}))
	if err != nil {
		return nil, err
	}

	stage, err := apigateway.NewStage(ctx, fmt.Sprintf("api-stage-%s", args.EnvironmentSuffix), &apigateway.StageArgs{
		RestApi:      restApi.ID(),
		Deployment:   deployment.ID(),
		StageName:    pulumi.String("prod"),
		Tags:         commonTags,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// 11. AWS Config rules for compliance monitoring
	configRecorder, err := config.NewRecorder(ctx, fmt.Sprintf("config-recorder-%s", args.EnvironmentSuffix), &config.RecorderArgs{
		RoleArn: lambdaRole.Arn,
		RecordingGroup: &config.RecorderRecordingGroupArgs{
			AllSupported: pulumi.Bool(true),
		},
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	_, err = config.NewRule(ctx, fmt.Sprintf("s3-encryption-rule-%s", args.EnvironmentSuffix), &config.RuleArgs{
		Source: &config.RuleSourceArgs{
			Owner:            pulumi.String("AWS"),
			SourceIdentifier: pulumi.String("S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"),
		},
	}, pulumi.Parent(component), pulumi.DependsOn([]pulumi.Resource{configRecorder}))
	if err != nil {
		return nil, err
	}

	// Set outputs
	component.VpcID = vpc.ID().ToStringOutput()
	component.SubnetIDs = pulumi.StringArray(subnetIDs).ToStringArrayOutput()
	component.S3BucketName = bucket.ID().ToStringOutput()
	component.KmsKeyArn = kmsKey.Arn.ToStringOutput()
	component.ApiGatewayUrl = pulumi.Sprintf("https://%s.execute-api.us-east-1.amazonaws.com/prod/secure", restApi.ID())
	component.LambdaFunctionArn = lambdaFunction.Arn.ToStringOutput()

	ctx.Export("vpcId", component.VpcID)
	ctx.Export("subnetIds", component.SubnetIDs)
	ctx.Export("s3BucketName", component.S3BucketName)
	ctx.Export("kmsKeyArn", component.KmsKeyArn)
	ctx.Export("apiGatewayUrl", component.ApiGatewayUrl)
	ctx.Export("lambdaFunctionArn", component.LambdaFunctionArn)

	return component, ctx.RegisterResourceOutputs(component, pulumi.Map{
		"vpcId":             component.VpcID,
		"subnetIds":         component.SubnetIDs,
		"s3BucketName":      component.S3BucketName,
		"kmsKeyArn":         component.KmsKeyArn,
		"apiGatewayUrl":     component.ApiGatewayUrl,
		"lambdaFunctionArn": component.LambdaFunctionArn,
	})
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		_, err := NewTapStack(ctx, "security-stack", &TapStackArgs{
			EnvironmentSuffix: "dev",
		})
		return err
	})
}
```

## File: tests/unit/tap_stack_test.go

```go
package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// Intentional Error #1: Missing mock implementation
type mocks int

// Intentional Error #2: NewResource returns incorrect types
func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outputs := resource.PropertyMap{
		"id": resource.NewStringProperty(args.Name + "_id"),
	}

	// Intentional Error #3: Missing VPC-specific outputs
	if args.TypeToken == "aws:ec2/vpc:Vpc" {
		outputs["id"] = resource.NewStringProperty("vpc-12345")
	}

	return args.Name + "_id", outputs, nil
}

// Intentional Error #4: Call mock not implemented
func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	return resource.PropertyMap{}, nil
}

// Intentional Error #5: Test expects string but gets pulumi.StringOutput
func TestVPCCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		// Intentional Error #6: Wrong import path
		stack := NewTapStack(ctx, "test-stack", &TapStackArgs{
			EnvironmentSuffix: "test",
		})

		// Intentional Error #7: Type mismatch - expects string, gets Output
		var vpcID string
		vpcID = stack.VpcID // This should cause compilation error

		// Intentional Error #8: Cannot use assert on unrealized Output
		assert.NotEmpty(t, vpcID)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// Intentional Error #9: Missing test for KMS key rotation
func TestKMSKeyCreation(t *testing.T) {
	// Intentional Error #10: Empty test body
}

// Intentional Error #11: S3 bucket test missing encryption validation
func TestS3BucketCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		stack := NewTapStack(ctx, "test-stack", &TapStackArgs{
			EnvironmentSuffix: "test",
		})

		// Intentional Error #12: Incorrect assertion type
		bucketName := stack.S3BucketName
		assert.Equal(t, "security-bucket-test", bucketName) // Type mismatch

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// Intentional Error #13: Security group test doesn't validate no 0.0.0.0/0 rules
func TestSecurityGroupRestrictions(t *testing.T) {
	// Empty - should validate ingress rules
}

// Intentional Error #14: API Gateway test doesn't verify AWS_IAM authorization
func TestAPIGatewayAuthorization(t *testing.T) {
	// Empty - should check authorization type
}

// Intentional Error #15: Lambda test doesn't verify KMS encryption
func TestLambdaKMSEncryption(t *testing.T) {
	// Empty - should validate environment variable encryption
}

// Intentional Error #16: Missing test for CloudWatch log retention
func TestCloudWatchLogRetention(t *testing.T) {
	// Empty - should verify 90-day retention
}

// Intentional Error #17: Missing test for Network ACL rules
func TestNetworkACLRules(t *testing.T) {
	// Empty - should verify ports 443 and 3306 only
}

// Intentional Error #18: Missing test for all resources have required tags
func TestResourceTags(t *testing.T) {
	// Empty - should verify CostCenter, Environment, DataClassification tags
}
```

## File: lambda/index.py

```python
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Security Lambda executed successfully'
    }
```