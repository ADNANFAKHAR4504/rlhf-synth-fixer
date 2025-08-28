I'll help you create a comprehensive, production-ready `tap_stack.go` file that meets all your requirements. This will be enterprise-grade infrastructure with proper security, monitoring, and high availability.

```go
package main

import (
	"encoding/json"
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/autoscaling"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elbv2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kinesisanalyticsv2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lambda"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/wafv2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Common tags for all resources
		commonTags := pulumi.StringMap{
			"Name":        pulumi.String("TapStack"),
			"Environment": pulumi.String("Prod"),
			"Project":     pulumi.String("TapStack"),
			"ManagedBy":   pulumi.String("Pulumi"),
		}

		// TODO: Configure these values for your specific deployment
		trustedCIDRs := []string{
			"10.0.0.0/8",    // Internal networks
			"172.16.0.0/12", // Internal networks
			// "YOUR_OFFICE_IP/32", // Add your office IP
		}

		// TODO: Replace with your ACM certificate ARN
		// certificateArn := "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"

		// TODO: Replace with your domain name
		// domainName := "yourdomain.com"

		// Get current AWS account and region info
		current, err := aws.GetCallerIdentity(ctx, nil, nil)
		if err != nil {
			return err
		}
		region, err := aws.GetRegion(ctx, nil, nil)
		if err != nil {
			return err
		}

		// =============================================================================
		// KMS KEYS - Create encryption keys first
		// =============================================================================

		// KMS Key for data encryption (S3, RDS, Secrets Manager)
		dataKMSKey, err := kms.NewKey(ctx, "tap-data-kms-key", &kms.KeyArgs{
			Description:           pulumi.String("TapStack Data Encryption Key"),
			DeletionWindowInDays:  pulumi.Int(30),
			EnableKeyRotation:     pulumi.Bool(true),
			MultiRegion:          pulumi.Bool(false),
			Tags:                 commonTags,
		})
		if err != nil {
			return err
		}

		// KMS Key alias for data
		_, err = kms.NewAlias(ctx, "tap-data-kms-alias", &kms.AliasArgs{
			Name:         pulumi.String("alias/tapstack-data"),
			TargetKeyId:  dataKMSKey.KeyId,
		})
		if err != nil {
			return err
		}

		// KMS Key for logs encryption (CloudWatch, WAF)
		logsKMSKey, err := kms.NewKey(ctx, "tap-logs-kms-key", &kms.KeyArgs{
			Description:           pulumi.String("TapStack Logs Encryption Key"),
			DeletionWindowInDays:  pulumi.Int(30),
			EnableKeyRotation:     pulumi.Bool(true),
			MultiRegion:          pulumi.Bool(false),
			Tags:                 commonTags,
		})
		if err != nil {
			return err
		}

		// KMS Key alias for logs
		_, err = kms.NewAlias(ctx, "tap-logs-kms-alias", &kms.AliasArgs{
			Name:         pulumi.String("alias/tapstack-logs"),
			TargetKeyId:  logsKMSKey.KeyId,
		})
		if err != nil {
			return err
		}

		// =============================================================================
		// NETWORKING - VPC, Subnets, Gateways, Route Tables
		// =============================================================================

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, "tap-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.20.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String("tap-vpc"),
				"Environment": commonTags["Environment"],
				"Project":     commonTags["Project"],
			},
		})
		if err != nil {
			return err
		}

		// Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, "tap-igw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String("tap-igw"),
				"Environment": commonTags["Environment"],
				"Project":     commonTags["Project"],
			},
		})
		if err != nil {
			return err
		}

		// Availability Zones
		azs := []string{"us-east-1a", "us-east-1b", "us-east-1c"}

		// Public Subnets
		var publicSubnets []*ec2.Subnet
		var publicSubnetIds pulumi.StringArray
		for i, az := range azs {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("tap-public-subnet-%d", i+1), &ec2.SubnetArgs{
				VpcId:                       vpc.ID(),
				CidrBlock:                   pulumi.String(fmt.Sprintf("10.20.%d.0/24", i+1)),
				AvailabilityZone:            pulumi.String(az),
				MapPublicIpOnLaunch:         pulumi.Bool(true),
				AssignIpv6AddressOnCreation: pulumi.Bool(false),
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("tap-public-subnet-%d", i+1)),
					"Type":        pulumi.String("Public"),
					"Environment": commonTags["Environment"],
					"Project":     commonTags["Project"],
				},
			})
			if err != nil {
				return err
			}
			publicSubnets = append(publicSubnets, subnet)
			publicSubnetIds = append(publicSubnetIds, subnet.ID())
		}

		// Private Subnets
		var privateSubnets []*ec2.Subnet
		var privateSubnetIds pulumi.StringArray
		for i, az := range azs {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("tap-private-subnet-%d", i+1), &ec2.SubnetArgs{
				VpcId:                       vpc.ID(),
				CidrBlock:                   pulumi.String(fmt.Sprintf("10.20.%d.0/24", i+10)),
				AvailabilityZone:            pulumi.String(az),
				MapPublicIpOnLaunch:         pulumi.Bool(false),
				AssignIpv6AddressOnCreation: pulumi.Bool(false),
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("tap-private-subnet-%d", i+1)),
					"Type":        pulumi.String("Private"),
					"Environment": commonTags["Environment"],
					"Project":     commonTags["Project"],
				},
			})
			if err != nil {
				return err
			}
			privateSubnets = append(privateSubnets, subnet)
			privateSubnetIds = append(privateSubnetIds, subnet.ID())
		}

		// Elastic IPs for NAT Gateways
		var natEIPs []*ec2.Eip
		for i := range azs {
			eip, err := ec2.NewEip(ctx, fmt.Sprintf("tap-nat-eip-%d", i+1), &ec2.EipArgs{
				Domain: pulumi.String("vpc"),
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("tap-nat-eip-%d", i+1)),
					"Environment": commonTags["Environment"],
					"Project":     commonTags["Project"],
				},
			}, pulumi.DependsOn([]pulumi.Resource{igw}))
			if err != nil {
				return err
			}
			natEIPs = append(natEIPs, eip)
		}

		// NAT Gateways (one per AZ for high availability)
		var natGateways []*ec2.NatGateway
		for i := range azs {
			nat, err := ec2.NewNatGateway(ctx, fmt.Sprintf("tap-nat-gateway-%d", i+1), &ec2.NatGatewayArgs{
				AllocationId: natEIPs[i].ID(),
				SubnetId:     publicSubnets[i].ID(),
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("tap-nat-gateway-%d", i+1)),
					"Environment": commonTags["Environment"],
					"Project":     commonTags["Project"],
				},
			}, pulumi.DependsOn([]pulumi.Resource{igw}))
			if err != nil {
				return err
			}
			natGateways = append(natGateways, nat)
		}

		// Public Route Table
		publicRouteTable, err := ec2.NewRouteTable(ctx, "tap-public-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: igw.ID(),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String("tap-public-rt"),
				"Environment": commonTags["Environment"],
				"Project":     commonTags["Project"],
			},
		})
		if err != nil {
			return err
		}

		// Associate public subnets with public route table
		for i, subnet := range publicSubnets {
			_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("tap-public-rta-%d", i+1), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: publicRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Private Route Tables (one per AZ)
		for i, natGateway := range natGateways {
			privateRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("tap-private-rt-%d", i+1), &ec2.RouteTableArgs{
				VpcId: vpc.ID(),
				Routes: ec2.RouteTableRouteArray{
					&ec2.RouteTableRouteArgs{
						CidrBlock:    pulumi.String("0.0.0.0/0"),
						NatGatewayId: natGateway.ID(),
					},
				},
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("tap-private-rt-%d", i+1)),
					"Environment": commonTags["Environment"],
					"Project":     commonTags["Project"],
				},
			})
			if err != nil {
				return err
			}

			// Associate private subnet with its route table
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("tap-private-rta-%d", i+1), &ec2.RouteTableAssociationArgs{
				SubnetId:     privateSubnets[i].ID(),
				RouteTableId: privateRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// =============================================================================
		// VPC ENDPOINTS - Keep traffic internal
		// =============================================================================

		// S3 VPC Endpoint (Gateway)
		_, err = ec2.NewVpcEndpoint(ctx, "tap-s3-endpoint", &ec2.VpcEndpointArgs{
			VpcId:           vpc.ID(),
			ServiceName:     pulumi.String(fmt.Sprintf("com.amazonaws.%s.s3", region.Name)),
			VpcEndpointType: pulumi.String("Gateway"),
			RouteTableIds: pulumi.StringArray{
				publicRouteTable.ID(),
				// Add private route table IDs here if needed
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Interface VPC Endpoints
		interfaceEndpoints := map[string]string{
			"secrets-manager": fmt.Sprintf("com.amazonaws.%s.secretsmanager", region.Name),
			"logs":           fmt.Sprintf("com.amazonaws.%s.logs", region.Name),
			"ssm":            fmt.Sprintf("com.amazonaws.%s.ssm", region.Name),
			"kms":            fmt.Sprintf("com.amazonaws.%s.kms", region.Name),
		}

		// Security Group for VPC Endpoints
		vpcEndpointSG, err := ec2.NewSecurityGroup(ctx, "tap-vpc-endpoint-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("tap-vpc-endpoint-sg"),
			Description: pulumi.String("Security group for VPC endpoints"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					CidrBlocks: pulumi.StringArray{pulumi.String("10.20.0.0/16")},
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
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Create interface VPC endpoints
		for name, serviceName := range interfaceEndpoints {
			_, err := ec2.NewVpcEndpoint(ctx, fmt.Sprintf("tap-%s-endpoint", name), &ec2.VpcEndpointArgs{
				VpcId:             vpc.ID(),
				ServiceName:       pulumi.String(serviceName),
				VpcEndpointType:   pulumi.String("Interface"),
				SubnetIds:         privateSubnetIds,
				SecurityGroupIds:  pulumi.StringArray{vpcEndpointSG.ID()},
				PrivateDnsEnabled: pulumi.Bool(true),
				Tags:              commonTags,
			})
			if err != nil {
				return err
			}
		}

		// =============================================================================
		// S3 BUCKET - Secure storage for logs and artifacts
		// =============================================================================

		// S3 Bucket for logs and artifacts
		s3Bucket, err := s3.NewBucketV2(ctx, "tap-logs-bucket", &s3.BucketV2Args{
			Bucket: pulumi.String(fmt.Sprintf("tap-logs-bucket-%s", current.AccountId)),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Block all public access
		_, err = s3.NewBucketPublicAccessBlock(ctx, "tap-logs-bucket-pab", &s3.BucketPublicAccessBlockArgs{
			Bucket:                s3Bucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Enable versioning
		_, err = s3.NewBucketVersioningV2(ctx, "tap-logs-bucket-versioning", &s3.BucketVersioningV2Args{
			Bucket: s3Bucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// Server-side encryption
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "tap-logs-bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: s3Bucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						KmsMasterKeyId: dataKMSKey.Arn,
						SseAlgorithm:   pulumi.String("aws:kms"),
					},
					BucketKeyEnabled: pulumi.Bool(true),
				},
			},
		})
		if err != nil {
			return err
		}

		// Bucket policy to deny non-TLS uploads
		bucketPolicyDoc := s3Bucket.ID().ApplyT(func(bucketName string) (string, error) {
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Sid":    "DenyNonTLSUploads",
						"Effect": "Deny",
						"Principal": "*",
						"Action":   "s3:*",
						"Resource": []string{
							fmt.Sprintf("arn:aws:s3:::%s", bucketName),
							fmt.Sprintf("arn:aws:s3:::%s/*", bucketName),
						},
						"Condition": map[string]interface{}{
							"Bool": map[string]interface{}{
								"aws:SecureTransport": "false",
							},
						},
					},
				},
			}
			policyJSON, err := json.Marshal(policy)
			if err != nil {
				return "", err
			}
			return string(policyJSON), nil
		}).(pulumi.StringOutput)

		_, err = s3.NewBucketPolicy(ctx, "tap-logs-bucket-policy", &s3.BucketPolicyArgs{
			Bucket: s3Bucket.ID(),
			Policy: bucketPolicyDoc,
		})
		if err != nil {
			return err
		}

		// =============================================================================
		// SECURITY GROUPS
		// =============================================================================

		// ALB Security Group
		albSG, err := ec2.NewSecurityGroup(ctx, "tap-alb-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("tap-alb-sg"),
			Description: pulumi.String("Security group for Application Load Balancer"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(80),
					ToPort:     pulumi.Int(80),
					CidrBlocks: pulumi.ToStringArray(trustedCIDRs),
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					CidrBlocks: pulumi.ToStringArray(trustedCIDRs),
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(80),
					ToPort:     pulumi.Int(80),
					CidrBlocks: pulumi.StringArray{pulumi.String("10.20.0.0/16")},
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// App Instance Security Group
		appSG, err := ec2.NewSecurityGroup(ctx, "tap-app-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("tap-app-sg"),
			Description: pulumi.String("Security group for application instances"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:                pulumi.String("tcp"),
					FromPort:                pulumi.Int(80),
					ToPort:                  pulumi.Int(80),
					SourceSecurityGroupId:   albSG.ID(),
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				// HTTPS to VPC endpoints
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					CidrBlocks: pulumi.StringArray{pulumi.String("10.20.0.0/16")},
				},
				// HTTP for package updates (through NAT)
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(80),
					ToPort:     pulumi.Int(80),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
				// HTTPS for package updates (through NAT)
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Database Security Group
		dbSG, err := ec2.NewSecurityGroup(ctx, "tap-db-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("tap-db-sg"),
			Description: pulumi.String("Security group for RDS database"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:              pulumi.String("tcp"),
					FromPort:              pulumi.Int(5432),
					ToPort:                pulumi.Int(5432),
					SourceSecurityGroupId: appSG.ID(),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Add database egress rule to app security group
		_, err = ec2.NewSecurityGroupRule(ctx, "tap-app-sg-db-egress", &ec2.SecurityGroupRuleArgs{
			Type:                     pulumi.String("egress"),
			FromPort:                 pulumi.Int(5432),
			ToPort:                   pulumi.Int(5432),
			Protocol:                 pulumi.String("tcp"),
			SecurityGroupId:          appSG.ID(),
			SourceSecurityGroupId:    dbSG.ID(),
		})
		if err != nil {
			return err
		}

		// =============================================================================
		// IAM ROLES AND POLICIES
		// =============================================================================

		// EC2 Instance Role
		ec2Role, err := iam.NewRole(ctx, "tap-ec2-role", &iam.RoleArgs{
			Name: pulumi.String("tap-ec2-role"),
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

		// EC2 Instance Policy for Secrets Manager and CloudWatch
		ec2Policy, err := iam.NewPolicy(ctx, "tap-ec2-policy", &iam.PolicyArgs{
			Name: pulumi.String("tap-ec2-policy"),
			Policy: pulumi.All(dataKMSKey.Arn, logsKMSKey.Arn).ApplyT(func(args []interface{}) (string, error) {
				dataKeyArn := args[0].(string)
				logsKeyArn := args[1].(string)
				policy := map[string]interface{}{
					"Version": "2012-10-17",
					"Statement": []map[string]interface{}{
						{
							"Effect": "Allow",
							"Action": []string{
								"secretsmanager:GetSecretValue",
								"secretsmanager:DescribeSecret",
							},
							"Resource": fmt.Sprintf("arn:aws:secretsmanager:%s:%s:secret:tap-db-credentials-*", region.Name, current.AccountId),
						},
						{
							"Effect": "Allow",
							"Action": []string{
								"logs:CreateLogGroup",
								"logs:CreateLogStream",
								"logs:PutLogEvents",
								"logs:DescribeLogStreams",
								"logs:DescribeLogGroups",
							},
							"Resource": fmt.Sprintf("arn:aws:logs:%s:%s:*", region.Name, current.AccountId),
						},
						{
							"Effect": "Allow",
							"Action": []string{
								"kms:Decrypt",
								"kms:DescribeKey",
							},
							"Resource": []string{dataKeyArn, logsKeyArn},
						},
						{
							"Effect": "Allow",
							"Action": []string{
								"ssm:GetParameter",
								"ssm:GetParameters",
								"ssm:GetParametersByPath",
							},
							"Resource": fmt.Sprintf("arn:aws:ssm:%s:%s:parameter/tap/*", region.Name, current.AccountId),
						},
					},
				}
				policyJSON, err := json.Marshal(policy)
				if err != nil {
					return "", err
				}
				return string(policyJSON), nil
			}).(pulumi.StringOutput),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Attach policy to role
		_, err = iam.NewRolePolicyAttachment(ctx, "tap-ec2-policy-attachment", &iam.RolePolicyAttachmentArgs{
			Role:      ec2Role.Name,
			PolicyArn: ec2Policy.Arn,
		})
		if err != nil {
			return err
		}

		// Attach AWS managed policy for SSM
		_, err = iam.NewRolePolicyAttachment(ctx, "tap-ec2-ssm-policy-attachment", &iam.RolePolicyAttachmentArgs{
			Role:      ec2Role.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"),
		})
		if err != nil {
			return err
		}

		// Instance Profile
		instanceProfile, err := iam.NewInstanceProfile(ctx, "tap-instance-profile", &iam.InstanceProfileArgs{
			Name: pulumi.String("tap-instance-profile"),
			Role: ec2Role.Name,
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// =============================================================================
		// RDS DATABASE
		// =============================================================================

		// Database Subnet Group
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "tap-db-subnet-group", &rds.SubnetGroupArgs{
			Name:       pulumi.String("tap-db-subnet-group"),
			SubnetIds:  privateSubnetIds,
			Tags:       commonTags,
		})
		if err != nil {
			return err
		}

		// Database credentials in Secrets Manager
		dbSecret, err := secretsmanager.NewSecret(ctx, "tap-db-credentials", &secretsmanager.SecretArgs{
			Name:                   pulumi.String("tap-db-credentials"),
			Description:            pulumi.String("Database credentials for TapStack"),
			KmsKeyId:               dataKMSKey.KeyId,
			RecoveryWindowInDays:   pulumi.Int(30),
			Tags:                   commonTags,
		})
		if err != nil {
			return err
		}

		// Database secret version
		_, err = secretsmanager.NewSecretVersion(ctx, "tap-db-credentials-version", &secretsmanager.SecretVersionArgs{
			SecretId: dbSecret.ID(),
			SecretString: pulumi.String(`{
				"username": "tapstack_admin",
				"password": "ChangeMe123!SecurePassword"
			}`),
		})
		if err != nil {
			return err
		}

		// TODO: Enable automatic rotation for production
		// _, err = secretsmanager.NewSecretRotation(ctx, "tap-db-credentials-rotation", &secretsmanager.SecretRotationArgs{
		//     SecretId:           dbSecret.ID(),
		//     RotationLambdaArn:  rotationLambda.Arn,
		//     RotationRules: &secretsmanager.SecretRotationRotationRulesArgs{
		//         AutomaticallyAfterDays: pulumi.Int(30),
		//     },
		// })

		// RDS Parameter Group
		dbParameterGroup, err := rds.NewParameterGroup(ctx, "tap-db-parameter-group", &rds.ParameterGroupArgs{
			Name:   pulumi.String("tap-postgres-params"),
			Family: pulumi.String("postgres15"),
			Parameters: rds.ParameterGroupParameterArray{
				&rds.ParameterGroupParameter