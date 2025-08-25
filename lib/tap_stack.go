package main

import (
	"fmt"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudfront"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lambda"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"os"
)

// Helper function to merge tags
func mergeTags(tags pulumi.StringMap, commonTags pulumi.StringMap) pulumi.StringMap {
	merged := make(pulumi.StringMap)
	for k, v := range commonTags {
		merged[k] = v
	}
	for k, v := range tags {
		merged[k] = v
	}
	return merged
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get environment suffix from environment variable
		environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
		if environmentSuffix == "" {
			environmentSuffix = "dev"
		}

		// Common tags for all resources
		commonTags := pulumi.StringMap{
			"Environment": pulumi.String("production"),
			"Project":     pulumi.String("secure-web-app"),
			"Owner":       pulumi.String("devops-team"),
			"Purpose":     pulumi.String("security-configuration"),
			"ManagedBy":   pulumi.String("pulumi"),
			"Suffix":      pulumi.String(environmentSuffix),
		}

		// Get current region and account ID
		current, err := aws.GetCallerIdentity(ctx, nil, nil)
		if err != nil {
			return err
		}

		region, err := aws.GetRegion(ctx, nil, nil)
		if err != nil {
			return err
		}

		// Create KMS key for encryption with FIPS 140-3 Level 3 compliance
		kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("secure-app-key-%s", environmentSuffix), &kms.KeyArgs{
			Description: pulumi.String("KMS key for secure web application encryption"),
			KeyUsage:    pulumi.String("ENCRYPT_DECRYPT"),
			Policy: pulumi.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "Enable IAM User Permissions",
						"Effect": "Allow",
						"Principal": {
							"AWS": "arn:aws:iam::%s:root"
						},
						"Action": "kms:*",
						"Resource": "*"
					}
				]
			}`, current.AccountId),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Create KMS alias
		_, err = kms.NewAlias(ctx, fmt.Sprintf("secure-app-key-alias-%s", environmentSuffix), &kms.AliasArgs{
			Name:        pulumi.Sprintf("alias/secure-web-app-key-%s", environmentSuffix),
			TargetKeyId: kmsKey.KeyId,
		})
		if err != nil {
			return err
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("secure-vpc-%s", environmentSuffix), &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: mergeTags(pulumi.StringMap{
				"Name": pulumi.Sprintf("secure-web-app-vpc-%s", environmentSuffix),
			}, commonTags),
		})
		if err != nil {
			return err
		}

		// Get availability zones
		azs, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{
			State: pulumi.StringRef("available"),
		}, nil)
		if err != nil {
			return err
		}

		// Create Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("secure-igw-%s", environmentSuffix), &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: mergeTags(pulumi.StringMap{
				"Name": pulumi.Sprintf("secure-web-app-igw-%s", environmentSuffix),
			}, commonTags),
		})
		if err != nil {
			return err
		}

		// Create public subnets
		publicSubnets := make([]*ec2.Subnet, 2)
		for i := 0; i < 2; i++ {
			publicSubnets[i], err = ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-%d-%s", i+1, environmentSuffix), &ec2.SubnetArgs{
				VpcId:               vpc.ID(),
				CidrBlock:           pulumi.Sprintf("10.0.%d.0/24", i+1),
				AvailabilityZone:    pulumi.String(azs.Names[i]),
				MapPublicIpOnLaunch: pulumi.Bool(true),
				Tags: mergeTags(pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-public-subnet-%d-%s", i+1, environmentSuffix),
					"Type": pulumi.String("public"),
				}, commonTags),
			})
			if err != nil {
				return err
			}
		}

		// Create private subnets
		privateSubnets := make([]*ec2.Subnet, 2)
		for i := 0; i < 2; i++ {
			privateSubnets[i], err = ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%d-%s", i+1, environmentSuffix), &ec2.SubnetArgs{
				VpcId:            vpc.ID(),
				CidrBlock:        pulumi.Sprintf("10.0.%d.0/24", i+10),
				AvailabilityZone: pulumi.String(azs.Names[i]),
				Tags: mergeTags(pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-private-subnet-%d-%s", i+1, environmentSuffix),
					"Type": pulumi.String("private"),
				}, commonTags),
			})
			if err != nil {
				return err
			}
		}

		// Create NAT Gateways and Elastic IPs
		natGateways := make([]*ec2.NatGateway, 2)
		for i := 0; i < 2; i++ {
			eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-eip-%d-%s", i+1, environmentSuffix), &ec2.EipArgs{
				Domain: pulumi.String("vpc"),
				Tags: mergeTags(pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-nat-eip-%d-%s", i+1, environmentSuffix),
				}, commonTags),
			})
			if err != nil {
				return err
			}

			natGateways[i], err = ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gateway-%d-%s", i+1, environmentSuffix), &ec2.NatGatewayArgs{
				AllocationId: eip.ID(),
				SubnetId:     publicSubnets[i].ID(),
				Tags: mergeTags(pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-nat-gateway-%d-%s", i+1, environmentSuffix),
				}, commonTags),
			})
			if err != nil {
				return err
			}
		}

		// Create public route table
		publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-route-table-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: mergeTags(pulumi.StringMap{
				"Name": pulumi.Sprintf("secure-web-app-public-rt-%s", environmentSuffix),
			}, commonTags),
		})
		if err != nil {
			return err
		}

		// Create public route to internet
		_, err = ec2.NewRoute(ctx, fmt.Sprintf("public-route-%s", environmentSuffix), &ec2.RouteArgs{
			RouteTableId:         publicRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			GatewayId:            igw.ID(),
		})
		if err != nil {
			return err
		}

		// Associate public subnets with public route table
		for i, subnet := range publicSubnets {
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rt-association-%d-%s", i+1, environmentSuffix), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: publicRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create private route tables and routes
		for i, natGw := range natGateways {
			privateRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-route-table-%d-%s", i+1, environmentSuffix), &ec2.RouteTableArgs{
				VpcId: vpc.ID(),
				Tags: mergeTags(pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-private-rt-%d-%s", i+1, environmentSuffix),
				}, commonTags),
			})
			if err != nil {
				return err
			}

			// Create private route to NAT gateway
			_, err = ec2.NewRoute(ctx, fmt.Sprintf("private-route-%d-%s", i+1, environmentSuffix), &ec2.RouteArgs{
				RouteTableId:         privateRouteTable.ID(),
				DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
				NatGatewayId:         natGw.ID(),
			})
			if err != nil {
				return err
			}

			// Associate private subnet with private route table
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rt-association-%d-%s", i+1, environmentSuffix), &ec2.RouteTableAssociationArgs{
				SubnetId:     privateSubnets[i].ID(),
				RouteTableId: privateRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create security groups
		bastionSG, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("bastion-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.Sprintf("bastion-security-group-%s", environmentSuffix),
			Description: pulumi.String("Security group for bastion host"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(22),
					ToPort:     pulumi.Int(22),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}, // Restrict in production
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: mergeTags(pulumi.StringMap{
				"Name": pulumi.Sprintf("bastion-sg-%s", environmentSuffix),
			}, commonTags),
		})
		if err != nil {
			return err
		}

		webServerSG, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("web-server-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.Sprintf("web-server-security-group-%s", environmentSuffix),
			Description: pulumi.String("Security group for web servers"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(22),
					ToPort:         pulumi.Int(22),
					SecurityGroups: pulumi.StringArray{bastionSG.ID()},
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(80),
					ToPort:     pulumi.Int(80),
					CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: mergeTags(pulumi.StringMap{
				"Name": pulumi.Sprintf("web-server-sg-%s", environmentSuffix),
			}, commonTags),
		})
		if err != nil {
			return err
		}

		lambdaSG, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("lambda-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.Sprintf("lambda-security-group-%s", environmentSuffix),
			Description: pulumi.String("Security group for Lambda functions"),
			VpcId:       vpc.ID(),
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: mergeTags(pulumi.StringMap{
				"Name": pulumi.Sprintf("lambda-sg-%s", environmentSuffix),
			}, commonTags),
		})
		if err != nil {
			return err
		}

		// Create IAM roles
		ec2Role, err := iam.NewRole(ctx, fmt.Sprintf("ec2-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.Sprintf("EC2-SecureWebApp-Role-%s", environmentSuffix),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": {
							"Service": "ec2.amazonaws.com"
						}
					}
				]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// EC2 instance profile
		ec2InstanceProfile, err := iam.NewInstanceProfile(ctx, fmt.Sprintf("ec2-instance-profile-%s", environmentSuffix), &iam.InstanceProfileArgs{
			Name: pulumi.Sprintf("EC2-SecureWebApp-Profile-%s", environmentSuffix),
			Role: ec2Role.Name,
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Lambda execution role
		lambdaRole, err := iam.NewRole(ctx, fmt.Sprintf("lambda-execution-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.Sprintf("Lambda-S3Processing-Role-%s", environmentSuffix),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": {
							"Service": "lambda.amazonaws.com"
						}
					}
				]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Lambda VPC execution policy attachment
		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("lambda-vpc-execution-role-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"),
			Role:      lambdaRole.Name,
		})
		if err != nil {
			return err
		}

		// Create S3 bucket with encryption and versioning
		bucket, err := s3.NewBucketV2(ctx, fmt.Sprintf("secure-app-bucket-%s", environmentSuffix), &s3.BucketV2Args{
			Bucket: pulumi.Sprintf("secure-web-app-%s-%s-%s", environmentSuffix, current.AccountId, region.Name),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Enable versioning
		_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("secure-app-bucket-versioning-%s", environmentSuffix), &s3.BucketVersioningV2Args{
			Bucket: bucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// Configure server-side encryption
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("secure-app-bucket-encryption-%s", environmentSuffix), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: bucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm:   pulumi.String("aws:kms"),
						KmsMasterKeyId: kmsKey.Arn,
					},
					BucketKeyEnabled: pulumi.Bool(true),
				},
			},
		})
		if err != nil {
			return err
		}

		// Block public access
		_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("secure-app-bucket-pab-%s", environmentSuffix), &s3.BucketPublicAccessBlockArgs{
			Bucket:                bucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Lambda function code
		lambdaCode := `
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info('S3 object processing started')
    
    # Process S3 event
    s3_client = boto3.client('s3')
    
    for record in event['Records']:
        bucket_name = record['s3']['bucket']['name']
        object_key = record['s3']['object']['key']
        
        logger.info(f'Processing object: {object_key} from bucket: {bucket_name}')
        
        try:
            # Simple processing - get object metadata
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            logger.info(f'Object size: {response.get("ContentLength", 0)} bytes')
            
        except Exception as e:
            logger.error(f'Error processing object: {str(e)}')
            raise e
    
    return {
        'statusCode': 200,
        'body': json.dumps('Object processing completed successfully')
    }
`

		// Create Lambda function
		lambdaFunction, err := lambda.NewFunction(ctx, fmt.Sprintf("s3-processor-%s", environmentSuffix), &lambda.FunctionArgs{
			Name:    pulumi.Sprintf("s3-object-processor-%s", environmentSuffix),
			Runtime: pulumi.String("python3.9"),
			Handler: pulumi.String("index.lambda_handler"),
			Role:    lambdaRole.Arn,
			Code: pulumi.NewAssetArchive(map[string]interface{}{
				"index.py": pulumi.NewStringAsset(lambdaCode),
			}),
			Timeout:    pulumi.Int(30),
			MemorySize: pulumi.Int(256),
			Environment: &lambda.FunctionEnvironmentArgs{
				Variables: pulumi.StringMap{
					"BUCKET_NAME": bucket.ID(),
					"KMS_KEY_ID":  kmsKey.KeyId,
				},
			},
			VpcConfig: &lambda.FunctionVpcConfigArgs{
				SubnetIds:        pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
				SecurityGroupIds: pulumi.StringArray{lambdaSG.ID()},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Lambda S3 policy
		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("lambda-s3-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Name: pulumi.Sprintf("Lambda-S3-Access-Policy-%s", environmentSuffix),
			Role: lambdaRole.ID(),
			Policy: pulumi.All(bucket.Arn, kmsKey.Arn).ApplyT(func(args []interface{}) (string, error) {
				bucketArn := args[0].(string)
				kmsArn := args[1].(string)
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:GetObjectVersion",
								"s3:PutObject",
								"s3:DeleteObject"
							],
							"Resource": [
								"%s/*"
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:ListBucket"
							],
							"Resource": [
								"%s"
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"kms:Decrypt",
								"kms:GenerateDataKey"
							],
							"Resource": [
								"%s"
							]
						}
					]
				}`, bucketArn, bucketArn, kmsArn), nil
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Get latest Amazon Linux 2 AMI
		ami, err := ec2.LookupAmi(ctx, &ec2.LookupAmiArgs{
			MostRecent: pulumi.BoolRef(true),
			Owners:     []string{"amazon"},
			Filters: []ec2.GetAmiFilter{
				{
					Name:   "name",
					Values: []string{"amzn2-ami-hvm-*-x86_64-gp2"},
				},
			},
		}, nil)
		if err != nil {
			return err
		}

		// Create bastion host
		bastionHost, err := ec2.NewInstance(ctx, fmt.Sprintf("bastion-host-%s", environmentSuffix), &ec2.InstanceArgs{
			InstanceType:        pulumi.String("t3.micro"),
			Ami:                 pulumi.String(ami.Id),
			SubnetId:            publicSubnets[0].ID(),
			VpcSecurityGroupIds: pulumi.StringArray{bastionSG.ID()},
			IamInstanceProfile:  ec2InstanceProfile.Name,
			UserData: pulumi.String(`#!/bin/bash
yum update -y
yum install -y aws-cli
echo "Bastion host setup complete" > /var/log/setup.log
`),
			Tags: mergeTags(pulumi.StringMap{
				"Name": pulumi.Sprintf("secure-web-app-bastion-%s", environmentSuffix),
				"Role": pulumi.String("bastion"),
			}, commonTags),
		})
		if err != nil {
			return err
		}

		// Create web servers in private subnets
		webServers := make([]*ec2.Instance, 2)
		for i := 0; i < 2; i++ {
			webServers[i], err = ec2.NewInstance(ctx, fmt.Sprintf("web-server-%d-%s", i+1, environmentSuffix), &ec2.InstanceArgs{
				InstanceType:        pulumi.String("t3.small"),
				Ami:                 pulumi.String(ami.Id),
				SubnetId:            privateSubnets[i].ID(),
				VpcSecurityGroupIds: pulumi.StringArray{webServerSG.ID()},
				IamInstanceProfile:  ec2InstanceProfile.Name,
				UserData: pulumi.String(`#!/bin/bash
yum update -y
yum install -y httpd aws-cli
systemctl start httpd
systemctl enable httpd
echo "<h1>Secure Web Application Server</h1>" > /var/www/html/index.html
echo "Web server setup complete" > /var/log/setup.log
`),
				Tags: mergeTags(pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-server-%d-%s", i+1, environmentSuffix),
					"Role": pulumi.String("web-server"),
				}, commonTags),
			})
			if err != nil {
				return err
			}
		}

		// Create CloudFront Origin Access Control
		oac, err := cloudfront.NewOriginAccessControl(ctx, fmt.Sprintf("s3-oac-%s", environmentSuffix), &cloudfront.OriginAccessControlArgs{
			Name:                          pulumi.Sprintf("s3-oac-%s", environmentSuffix),
			Description:                   pulumi.String("OAC for S3 bucket access"),
			OriginAccessControlOriginType: pulumi.String("s3"),
			SigningBehavior:               pulumi.String("always"),
			SigningProtocol:               pulumi.String("sigv4"),
		})
		if err != nil {
			return err
		}

		// Create CloudFront distribution
		distribution, err := cloudfront.NewDistribution(ctx, fmt.Sprintf("s3-distribution-%s", environmentSuffix), &cloudfront.DistributionArgs{
			Origins: cloudfront.DistributionOriginArray{
				&cloudfront.DistributionOriginArgs{
					DomainName:            bucket.BucketDomainName,
					OriginId:              pulumi.String("S3-secure-web-app"),
					OriginAccessControlId: oac.ID(),
					S3OriginConfig: &cloudfront.DistributionOriginS3OriginConfigArgs{
						OriginAccessIdentity: pulumi.String(""),
					},
				},
			},
			Enabled:           pulumi.Bool(true),
			IsIpv6Enabled:     pulumi.Bool(true),
			Comment:           pulumi.String("CloudFront distribution for S3 bucket"),
			DefaultRootObject: pulumi.String("index.html"),
			DefaultCacheBehavior: &cloudfront.DistributionDefaultCacheBehaviorArgs{
				AllowedMethods:       pulumi.StringArray{pulumi.String("DELETE"), pulumi.String("GET"), pulumi.String("HEAD"), pulumi.String("OPTIONS"), pulumi.String("PATCH"), pulumi.String("POST"), pulumi.String("PUT")},
				CachedMethods:        pulumi.StringArray{pulumi.String("GET"), pulumi.String("HEAD")},
				TargetOriginId:       pulumi.String("S3-secure-web-app"),
				ViewerProtocolPolicy: pulumi.String("redirect-to-https"),
				MinTtl:               pulumi.Int(0),
				DefaultTtl:           pulumi.Int(3600),
				MaxTtl:               pulumi.Int(86400),
				ForwardedValues: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs{
					QueryString: pulumi.Bool(false),
					Cookies: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs{
						Forward: pulumi.String("none"),
					},
				},
			},
			PriceClass: pulumi.String("PriceClass_100"),
			Restrictions: &cloudfront.DistributionRestrictionsArgs{
				GeoRestriction: &cloudfront.DistributionRestrictionsGeoRestrictionArgs{
					RestrictionType: pulumi.String("none"),
				},
			},
			ViewerCertificate: &cloudfront.DistributionViewerCertificateArgs{
				CloudfrontDefaultCertificate: pulumi.Bool(true),
			},
			Tags: mergeTags(pulumi.StringMap{
				"Name": pulumi.Sprintf("secure-web-app-distribution-%s", environmentSuffix),
			}, commonTags),
		})
		if err != nil {
			return err
		}

		// Update S3 bucket policy to allow CloudFront access
		_, err = s3.NewBucketPolicy(ctx, fmt.Sprintf("cloudfront-bucket-policy-%s", environmentSuffix), &s3.BucketPolicyArgs{
			Bucket: bucket.ID(),
			Policy: pulumi.All(bucket.Arn, distribution.Arn).ApplyT(func(args []interface{}) (string, error) {
				bucketArn := args[0].(string)
				distributionArn := args[1].(string)
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Sid": "AllowCloudFrontServicePrincipal",
							"Effect": "Allow",
							"Principal": {
								"Service": "cloudfront.amazonaws.com"
							},
							"Action": "s3:GetObject",
							"Resource": "%s/*",
							"Condition": {
								"StringEquals": {
									"AWS:SourceArn": "%s"
								}
							}
						}
					]
				}`, bucketArn, distributionArn), nil
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Create CloudWatch alarms
		// High CPU utilization alarm
		_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("high-cpu-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.Sprintf("high-cpu-utilization-%s", environmentSuffix),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("CPUUtilization"),
			Namespace:          pulumi.String("AWS/EC2"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(80),
			AlarmDescription:   pulumi.String("This metric monitors ec2 cpu utilization"),
			Dimensions: pulumi.StringMap{
				"InstanceId": bastionHost.ID(),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Lambda error rate alarm
		_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("lambda-error-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.Sprintf("lambda-high-error-rate-%s", environmentSuffix),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("Errors"),
			Namespace:          pulumi.String("AWS/Lambda"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Sum"),
			Threshold:          pulumi.Float64(5),
			AlarmDescription:   pulumi.String("This metric monitors lambda function errors"),
			Dimensions: pulumi.StringMap{
				"FunctionName": lambdaFunction.Name,
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Outputs
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("bastionHostPublicIp", bastionHost.PublicIp)
		ctx.Export("s3BucketName", bucket.ID())
		ctx.Export("lambdaFunctionName", lambdaFunction.Name)
		ctx.Export("kmsKeyId", kmsKey.KeyId)
		ctx.Export("cloudfrontDomainName", distribution.DomainName)
		ctx.Export("cloudfrontDistributionId", distribution.ID())
		ctx.Export("region", pulumi.String(region.Name))

		return nil
	})
}
