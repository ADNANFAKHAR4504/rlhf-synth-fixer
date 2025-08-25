package main

import (
	"archive/zip"
	"bytes"
	"encoding/base64"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/apigatewayrestapi"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/apigatewayresource"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/apigatewaymethod"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/apigatewayintegration"
	//"github.com/cdktf/cdktf-provider-aws-go/aws/v18/apigatewaydeployment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/dynamodbtable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/lambdafunction"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/lambdapermission"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/s3bucketobject"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/s3bucketpolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/s3bucketversioning"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/ssmparameter"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/subnet"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

type LambdaResources struct {
	Functions        map[string]lambdafunction.LambdaFunction
	APIGateway       apigatewayrestapi.ApiGatewayRestApi
	DynamoDBTable    dynamodbtable.DynamodbTable
	S3Bucket         s3bucket.S3Bucket
	LogGroups        map[string]cloudwatchloggroup.CloudwatchLogGroup
	SSMParameters    map[string]ssmparameter.SsmParameter
}

func NewLambdaResources(stack *TapStack) *LambdaResources {
	resources := &LambdaResources{
		Functions:     make(map[string]lambdafunction.LambdaFunction),
		LogGroups:     make(map[string]cloudwatchloggroup.CloudwatchLogGroup),
		SSMParameters: make(map[string]ssmparameter.SsmParameter),
	}

	// Create S3 bucket for deployment packages
	resources.createS3Bucket(stack)
	
	// Create DynamoDB table
	resources.createDynamoDBTable(stack)
	
	// Create SSM parameters
	resources.createSSMParameters(stack)
	
	// Create Lambda functions
	resources.createLambdaFunctions(stack)
	
	// Create API Gateway
	resources.createAPIGateway(stack)

	return resources
}

func (l *LambdaResources) createS3Bucket(stack *TapStack) {
	// S3 bucket for Lambda deployment packages
	l.S3Bucket = s3bucket.NewS3Bucket(stack.Stack, str("lambda-deployment-bucket"), &s3bucket.S3BucketConfig{
		Bucket: str(stack.Config.AppName + "-lambda-deploy"),
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-lambda-deployment-bucket"),
		},
	})

	// Enable versioning
	s3bucketversioning.NewS3BucketVersioningA(stack.Stack, str("lambda-bucket-versioning"), &s3bucketversioning.S3BucketVersioningAConfig{
		Bucket: l.S3Bucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: str("Enabled"),
		},
	})

	// Enable encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfigurationA(stack.Stack, str("lambda-bucket-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: l.S3Bucket.Id(),
		Rule: &[]*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleA{{
			ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
				SseAlgorithm: str("AES256"),
			},
		}},
	})

	// HTTPS-only bucket policy
	policyDoc := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "DenyInsecureConnections",
				"Effect": "Deny",
				"Principal": "*",
				"Action": "s3:*",
				"Resource": [
					"` + *l.S3Bucket.Arn() + `",
					"` + *l.S3Bucket.Arn() + `/*"
				],
				"Condition": {
					"Bool": {
						"aws:SecureTransport": "false"
					}
				}
			}
		]
	}`

	s3bucketpolicy.NewS3BucketPolicy(stack.Stack, str("lambda-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: l.S3Bucket.Id(),
		Policy: str(policyDoc),
	})
}

func (l *LambdaResources) createDynamoDBTable(stack *TapStack) {
	l.DynamoDBTable = dynamodbtable.NewDynamodbTable(stack.Stack, str("sessions-table"), &dynamodbtable.DynamodbTableConfig{
		Name:         str(stack.Config.AppName + "-sessions"),
		BillingMode:  str("PAY_PER_REQUEST"),
		HashKey:      str("session_id"),
		Attribute: &[]*dynamodbtable.DynamodbTableAttribute{{
			Name: str("session_id"),
			Type: str("S"),
		}},
		ServerSideEncryption: &dynamodbtable.DynamodbTableServerSideEncryption{
			Enabled: bool(true),
		},
		PointInTimeRecovery: &dynamodbtable.DynamodbTablePointInTimeRecovery{
			Enabled: bool(true),
		},
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-sessions-table"),
		},
	})
}

func (l *LambdaResources) createSSMParameters(stack *TapStack) {
	l.SSMParameters["api-key"] = ssmparameter.NewSsmParameter(stack.Stack, str("api-key-param"), &ssmparameter.SsmParameterConfig{
		Name:        str("/" + stack.Config.AppName + "/api-key"),
		Type:        str("SecureString"),
		Value:       str("your-api-key-here"),
		Description: str("API key for external services"),
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-api-key-param"),
		},
	})
}

func (l *LambdaResources) createLambdaFunctions(stack *TapStack) {
	// Create Lambda function code
	lambdaCode := `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	console.log('Event:', JSON.stringify(event));
	
	const response = {
		statusCode: 200,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
		},
		body: JSON.stringify({
			message: 'Hello from Lambda!',
			requestId: event.requestContext?.requestId || 'unknown'
		})
	};
	
	return response;
};`

	// Create ZIP file in memory
	var buf bytes.Buffer
	zipWriter := zip.NewWriter(&buf)
	
	file, err := zipWriter.Create("index.js")
	if err != nil {
		panic(err)
	}
	
	_, err = file.Write([]byte(lambdaCode))
	if err != nil {
		panic(err)
	}
	
	err = zipWriter.Close()
	if err != nil {
		panic(err)
	}

	// Upload Lambda code to S3
	// Use base64 encoding for binary content
	lambdaZip := s3bucketobject.NewS3BucketObject(stack.Stack, str("lambda-code"), &s3bucketobject.S3BucketObjectConfig{
		Bucket:      l.S3Bucket.Id(),
		Key:         str("lambda-functions/api-handler.zip"),
		ContentBase64: str(base64.StdEncoding.EncodeToString(buf.Bytes())),
		ContentType: str("application/zip"),
	})

	functionNames := []string{"get-handler", "post-handler", "put-handler", "delete-handler"}

	for _, funcName := range functionNames {
		// Create CloudWatch Log Group
		l.LogGroups[funcName] = cloudwatchloggroup.NewCloudwatchLogGroup(stack.Stack, str(funcName+"-logs"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
			Name:            str("/aws/lambda/" + stack.Config.AppName + "-" + funcName),
			RetentionInDays: num(30),
			Tags: &map[string]*string{
				"Name": str(stack.Config.AppName + "-" + funcName + "-logs"),
			},
		})

		// Create Lambda function
		l.Functions[funcName] = lambdafunction.NewLambdaFunction(stack.Stack, str(funcName), &lambdafunction.LambdaFunctionConfig{
			FunctionName: str(stack.Config.AppName + "-" + funcName),
			Runtime:      str("nodejs18.x"),
			Handler:      str("index.handler"),
			Role:         stack.Security.LambdaExecutionRole.Arn(),
			S3Bucket:     l.S3Bucket.Id(),
			S3Key:        lambdaZip.Key(),
			Timeout:      num(30),
			Environment: &lambdafunction.LambdaFunctionEnvironment{
				Variables: &map[string]*string{
					"LOG_LEVEL":      str("INFO"),
					"DYNAMODB_TABLE": l.DynamoDBTable.Name(),
					"REGION":         str(stack.Config.Region),
				},
			},
			VpcConfig: &lambdafunction.LambdaFunctionVpcConfig{
				SubnetIds:        convertSubnetIds(stack.Networking.PrivateSubnets),
				SecurityGroupIds: &[]*string{stack.Security.SecurityGroups["lambda"].Id()},
			},
			TracingConfig: &lambdafunction.LambdaFunctionTracingConfig{
				Mode: str("Active"),
			},
			DependsOn: &[]cdktf.ITerraformDependable{l.LogGroups[funcName]},
			Tags: &map[string]*string{
				"Name": str(stack.Config.AppName + "-" + funcName),
			},
		})
	}
}

func (l *LambdaResources) createAPIGateway(stack *TapStack) {
	// Create API Gateway
	l.APIGateway = apigatewayrestapi.NewApiGatewayRestApi(stack.Stack, str("api-gateway"), &apigatewayrestapi.ApiGatewayRestApiConfig{
		Name:        str(stack.Config.AppName + "-api"),
		Description: str("API Gateway for " + stack.Config.AppName),
		EndpointConfiguration: &apigatewayrestapi.ApiGatewayRestApiEndpointConfiguration{
			Types: &[]*string{str("REGIONAL")},
		},
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-api-gateway"),
		},
	})

	// Create API resource
	apiResource := apigatewayresource.NewApiGatewayResource(stack.Stack, str("api-resource"), &apigatewayresource.ApiGatewayResourceConfig{
		RestApiId: l.APIGateway.Id(),
		ParentId:  l.APIGateway.RootResourceId(),
		PathPart:  str("tasks"),
	})

	// HTTP methods and their corresponding Lambda functions
	methods := map[string]string{
		"GET":    "get-handler",
		"POST":   "post-handler",
		"PUT":    "put-handler",
		"DELETE": "delete-handler",
	}

	for method, funcName := range methods {
		// Create method
		apiMethod := apigatewaymethod.NewApiGatewayMethod(stack.Stack, str("method-"+method), &apigatewaymethod.ApiGatewayMethodConfig{
			RestApiId:     l.APIGateway.Id(),
			ResourceId:    apiResource.Id(),
			HttpMethod:    str(method),
			Authorization: str("NONE"),
		})

		// Create integration
		apigatewayintegration.NewApiGatewayIntegration(stack.Stack, str("integration-"+method), &apigatewayintegration.ApiGatewayIntegrationConfig{
			RestApiId:             l.APIGateway.Id(),
			ResourceId:            apiResource.Id(),
			HttpMethod:            apiMethod.HttpMethod(),
			IntegrationHttpMethod: str("POST"),
			Type:                  str("AWS_PROXY"),
			Uri:                   l.Functions[funcName].InvokeArn(),
		})

		// Grant API Gateway permission to invoke Lambda
		lambdapermission.NewLambdaPermission(stack.Stack, str("api-lambda-permission-"+method), &lambdapermission.LambdaPermissionConfig{
			StatementId:  str("AllowExecutionFromAPIGateway-" + method),
			Action:       str("lambda:InvokeFunction"),
			FunctionName: l.Functions[funcName].FunctionName(),
			Principal:    str("apigateway.amazonaws.com"),
			SourceArn:    l.APIGateway.ExecutionArn(),
		})
	}

	// Deploy API Gateway - commented out as it needs to be deployed after methods
	// The deployment will be done manually after methods and integrations are created
	/*
	apigatewaydeployment.NewApiGatewayDeployment(stack.Stack, str("api-deployment"), &apigatewaydeployment.ApiGatewayDeploymentConfig{
		RestApiId:   l.APIGateway.Id(),
		StageName:   str("prod"),
		Description: str("Production deployment"),
	})
	*/
}

func convertSubnetIds(subnets []subnet.Subnet) *[]*string {
	var ids []*string
	for _, subnet := range subnets {
		ids = append(ids, subnet.Id())
	}
	return &ids
}