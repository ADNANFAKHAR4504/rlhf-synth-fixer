Here's the continuation of `tap-stack.go` from line 500 onwards:

```go
	// CloudTrail bucket policy - deny unencrypted uploads and insecure transport
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("cloudtrail-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: cloudtrailBucket.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "AWSCloudTrailAclCheck",
					"Effect": "Allow",
					"Principal": {"Service": "cloudtrail.amazonaws.com"},
					"Action": "s3:GetBucketAcl",
					"Resource": "arn:aws:s3:::tap-cloudtrail-logs-%s-*"
				},
				{
					"Sid": "AWSCloudTrailWrite",
					"Effect": "Allow",
					"Principal": {"Service": "cloudtrail.amazonaws.com"},
					"Action": "s3:PutObject",
					"Resource": "arn:aws:s3:::tap-cloudtrail-logs-%s-*/*",
					"Condition": {
						"StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}
					}
				},
				{
					"Sid": "DenyInsecureConnections",
					"Effect": "Deny",
					"Principal": "*",
					"Action": "s3:*",
					"Resource": [
						"arn:aws:s3:::tap-cloudtrail-logs-%s-*",
						"arn:aws:s3:::tap-cloudtrail-logs-%s-*/*"
					],
					"Condition": {
						"Bool": {"aws:SecureTransport": "false"}
					}
				},
				{
					"Sid": "DenyUnencryptedObjectUploads",
					"Effect": "Deny",
					"Principal": "*",
					"Action": "s3:PutObject",
					"Resource": "arn:aws:s3:::tap-cloudtrail-logs-%s-*/*",
					"Condition": {
						"StringNotEquals": {"s3:x-amz-server-side-encryption": "aws:kms"}
					}
				}
			]
		}`, *config.Environment, *config.Environment, *config.Environment, *config.Environment, *config.Environment)),
	})

	// Application Data S3 Bucket
	appDataBucket := s3bucket.NewS3Bucket(stack, jsii.String("app-data-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("tap-app-data-%s-%s", *config.Environment, generateRandomSuffix())),
		// force_destroy set to true only for dev/test environments - NEVER in production
		ForceDestroy: jsii.Bool(*config.Environment == "dev" || *config.Environment == "test"),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("tap-app-data-bucket-%s", *config.Environment)),
			"Purpose": jsii.String("application-data"),
		},
	})

	// Block public access on app data bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("app-data-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                jsii.String(*appDataBucket.Id()),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Encrypt app data bucket with customer-managed KMS key
	s3bucketencryption.NewS3BucketServerSideEncryptionConfiguration(stack, jsii.String("app-data-bucket-encryption"), &s3bucketencryption.S3BucketServerSideEncryptionConfigurationConfig{
		Bucket: appDataBucket.Id(),
		Rule: &[]*s3bucketencryption.S3BucketServerSideEncryptionConfigurationRule{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketencryption.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					SseAlgorithm:   jsii.String("aws:kms"),
					KmsMasterKeyId: s3KmsKey.Arn(),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// App data bucket policy - deny unencrypted uploads and insecure transport
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("app-data-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: appDataBucket.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "DenyInsecureConnections",
					"Effect": "Deny",
					"Principal": "*",
					"Action": "s3:*",
					"Resource": [
						"arn:aws:s3:::tap-app-data-%s-*",
						"arn:aws:s3:::tap-app-data-%s-*/*"
					],
					"Condition": {
						"Bool": {"aws:SecureTransport": "false"}
					}
				},
				{
					"Sid": "DenyUnencryptedObjectUploads",
					"Effect": "Deny",
					"Principal": "*",
					"Action": "s3:PutObject",
					"Resource": "arn:aws:s3:::tap-app-data-%s-*/*",
					"Condition": {
						"StringNotEquals": {"s3:x-amz-server-side-encryption": "aws:kms"}
					}
				}
			]
		}`, *config.Environment, *config.Environment, *config.Environment)),
	})

	// CloudWatch Log Group for CloudTrail
	cloudtrailLogGroup := cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String("cloudtrail-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:             jsii.String(fmt.Sprintf("/aws/cloudtrail/tap-%s", *config.Environment)),
		RetentionInDays:  jsii.Number(90), // 90 days retention for compliance
		KmsKeyId:         logsKmsKey.Arn(),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("tap-cloudtrail-logs-%s", *config.Environment)),
			"Purpose": jsii.String("cloudtrail-logs"),
		},
	})

	// IAM Role for CloudTrail
	cloudtrailRole := iamrole.NewIamRole(stack, jsii.String("cloudtrail-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("tap-cloudtrail-role-%s", *config.Environment)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {"Service": "cloudtrail.amazonaws.com"},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		InlinePolicy: &[]*iamrole.IamRoleInlinePolicy{
			{
				Name: jsii.String("CloudTrailLogsPolicy"),
				Policy: jsii.String(fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"logs:CreateLogStream",
								"logs:PutLogEvents"
							],
							"Resource": "arn:aws:logs:%s:%s:log-group:/aws/cloudtrail/tap-%s:*"
						}
					]
				}`, *config.Region, getAccountId(), *config.Environment)),
			},
		},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-cloudtrail-role-%s", *config.Environment)),
		},
	})

	// CloudTrail
	trail := cloudtrail.NewCloudtrail(stack, jsii.String("cloudtrail"), &cloudtrail.CloudtrailConfig{
		Name:                         jsii.String(fmt.Sprintf("tap-cloudtrail-%s", *config.Environment)),
		S3BucketName:                cloudtrailBucket.Id(),
		S3KeyPrefix:                 jsii.String("cloudtrail-logs"),
		IncludeGlobalServiceEvents:  jsii.Bool(true),
		IsMultiRegionTrail:          jsii.Bool(true),
		EnableLogging:               jsii.Bool(true),
		EnableLogFileValidation:     jsii.Bool(true),
		CloudWatchLogsGroupArn:      jsii.String(fmt.Sprintf("%s:*", *cloudtrailLogGroup.Arn())),
		CloudWatchLogsRoleArn:       cloudtrailRole.Arn(),
		KmsKeyId:                    s3KmsKey.Arn(),
		
		EventSelector: &[]*cloudtrail.CloudtrailEventSelector{
			{
				ReadWriteType:                 jsii.String("All"),
				IncludeManagementEvents:       jsii.Bool(true),
				ExcludeManagementEventSources: &[]*string{
					jsii.String("kms.amazonaws.com"),
					jsii.String("rdsdata.amazonaws.com"),
				},
				DataResource: &[]*cloudtrail.CloudtrailEventSelectorDataResource{
					{
						Type:   jsii.String("AWS::S3::Object"),
						Values: &[]*string{jsii.String("arn:aws:s3:::*/*")},
					},
					{
						Type:   jsii.String("AWS::S3::Bucket"),
						Values: &[]*string{jsii.String("arn:aws:s3:::*")},
					},
				},
			},
		},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-cloudtrail-%s", *config.Environment)),
		},
	})

	// DB Subnet Group for RDS
	dbSubnetGroup := dbsubnetgroup.NewDbSubnetGroup(stack, jsii.String("db-subnet-group"), &dbsubnetgroup.DbSubnetGroupConfig{
		Name:       jsii.String(fmt.Sprintf("tap-db-subnet-group-%s", *config.Environment)),
		SubnetIds:  &[]*string{privateSubnet1.Id(), privateSubnet2.Id()},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-db-subnet-group-%s", *config.Environment)),
		},
	})

	// Example Secrets Manager secret for RDS password
	// In production, generate this password securely and don't store in code
	dbSecret := secretsmanagersecret.NewSecretsManagerSecret(stack, jsii.String("db-secret"), &secretsmanagersecret.SecretsManagerSecretConfig{
		Name:        jsii.String(fmt.Sprintf("tap/rds/master-password-%s", *config.Environment)),
		Description: jsii.String("Master password for RDS PostgreSQL instance"),
		GenerateSecretString: &secretsmanagersecret.SecretsManagerSecretGenerateSecretString{
			Length:         jsii.Number(32),
			ExcludeCharacters: jsii.String("\"@/\\"),
		},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-db-secret-%s", *config.Environment)),
		},
	})

	// RDS PostgreSQL Instance
	rdsInstance := dbinstance.NewDbInstance(stack, jsii.String("rds-instance"), &dbinstance.DbInstanceConfig{
		Identifier:     jsii.String(fmt.Sprintf("tap-postgres-%s", *config.Environment)),
		Engine:         jsii.String("postgres"),
		EngineVersion:  jsii.String("15.4"),
		InstanceClass:  jsii.String("db.t3.micro"), // Use appropriate size for your workload
		AllocatedStorage: jsii.Number(20),
		MaxAllocatedStorage: jsii.Number(100),
		StorageType:    jsii.String("gp3"),
		StorageEncrypted: jsii.Bool(true),
		KmsKeyId:       rdsKmsKey.Arn(),
		
		DbName:   jsii.String("tapdb"),
		Username: jsii.String("tapuser"),
		ManagePasswordSecretId: dbSecret.Id(),
		
		VpcSecurityGroupIds: &[]*string{dbSg.Id()},
		DbSubnetGroupName:   dbSubnetGroup.Name(),
		
		BackupRetentionPeriod: jsii.Number(7), // 7 days backup retention
		BackupWindow:         jsii.String("03:00-04:00"), // UTC backup window
		MaintenanceWindow:    jsii.String("sun:04:00-sun:05:00"), // UTC maintenance window
		
		MultiAz:               jsii.Bool(true), // Multi-AZ for high availability
		PubliclyAccessible:    jsii.Bool(false), // Never publicly accessible
		
		DeletionProtection:   jsii.Bool(*config.Environment == "prod"), // Enable deletion protection for prod
		SkipFinalSnapshot:    jsii.Bool(*config.Environment != "prod"), // Skip final snapshot for non-prod
		FinalSnapshotIdentifier: jsii.String(fmt.Sprintf("tap-postgres-%s-final-snapshot", *config.Environment)),
		
		EnabledCloudwatchLogsExports: &[]*string{
			jsii.String("postgresql"),
		},
		
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-postgres-%s", *config.Environment)),
		},
	})

	// IAM Role for EC2 instances (example application role)
	ec2Role := iamrole.NewIamRole(stack, jsii.String("ec2-app-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("tap-ec2-app-role-%s", *config.Environment)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {"Service": "ec2.amazonaws.com"},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		InlinePolicy: &[]*iamrole.IamRoleInlinePolicy{
			{
				Name: jsii.String("S3AppDataAccess"),
				Policy: jsii.String(fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:PutObject",
								"s3:DeleteObject"
							],
							"Resource": "arn:aws:s3:::tap-app-data-%s-*/*"
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:ListBucket"
							],
							"Resource": "arn:aws:s3:::tap-app-data-%s-*"
						}
					]
				}`, *config.Environment, *config.Environment)),
			},
			{
				Name: jsii.String("SecretsManagerAccess"),
				Policy: jsii.String(fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"secretsmanager:GetSecretValue"
							],
							"Resource": "arn:aws:secretsmanager:%s:%s:secret:tap/rds/master-password-%s-*"
						}
					]
				}`, *config.Region, getAccountId(), *config.Environment)),
			},
		},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-ec2-app-role-%s", *config.Environment)),
		},
	})

	// Attach AWS managed policy for CloudWatch agent (least privilege approach)
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("ec2-cloudwatch-policy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"),
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       mainVpc.Id(),
		Description: jsii.String("ID of the main VPC"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("public_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_ToList(&[]*string{publicSubnet1.Id(), publicSubnet2.Id()}),
		Description: jsii.String("IDs of the public subnets"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("private_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_ToList(&[]*string{privateSubnet1.Id(), privateSubnet2.Id()}),
		Description: jsii.String("IDs of the private subnets"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("nat_gateway_id"), &cdktf.TerraformOutputConfig{
		Value:       natGw1.Id(),
		Description: jsii.String("ID of the NAT Gateway"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("security_group_ids"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_ToMap(&map[string]interface{}{
			"bastion": bastionSg.Id(),
			"alb":     albSg.Id(),
			"app":     appSg.Id(),
			"db":      dbSg.Id(),
		}),
		Description: jsii.String("Security Group IDs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("kms_key_arns"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_ToMap(&map[string]interface{}{
			"s3":   s3KmsKey.Arn(),
			"logs": logsKmsKey.Arn(),
			"rds":  rdsKmsKey.Arn(),
		}),
		Description: jsii.String("KMS Key ARNs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("kms_key_ids"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_ToMap(&map[string]interface{}{
			"s3":   s3KmsKey.KeyId(),
			"logs": logsKmsKey.KeyId(),
			"rds":  rdsKmsKey.KeyId(),
		}),
		Description: jsii.String("KMS Key IDs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_arn"), &cdktf.TerraformOutputConfig{
		Value:       trail.Arn(),
		Description: jsii.String("CloudTrail ARN"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_endpoint"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.Endpoint(),
		Description: jsii.String("RDS instance endpoint"),
		Sensitive:   jsii.Bool(true),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_arn"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.Arn(),
		Description: jsii.String("RDS instance ARN"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_bucket_names"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_ToMap(&map[string]interface{}{
			"cloudtrail": cloudtrailBucket.Id(),
			"app_data":   appDataBucket.Id(),
		}),
		Description: jsii.String("S3 Bucket Names"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_bucket_arns"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_ToMap(&map[string]interface{}{
			"cloudtrail": cloudtrailBucket.Arn(),
			"app_data":   appDataBucket.Arn(),
		}),
		Description: jsii.String("S3 Bucket ARNs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("iam_role_arns"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_ToMap(&map[string]interface{}{
			"cloudtrail": cloudtrailRole.Arn(),
			"ec2_app":    ec2Role.Arn(),
		}),
		Description: jsii.String("IAM Role ARNs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("db_secret_arn"), &cdktf.TerraformOutputConfig{
		Value:       dbSecret.Arn(),
		Description: jsii.String("Database secret ARN"),
		Sensitive:   jsii.Bool(true),
	})

	return stack
}

// Helper function to get AWS account ID - in production, you might want to use a data source
func getAccountId() string {
	// This is a placeholder - in real implementation, you would use:
	// dataawscalleridentity.NewDataAwsCallerIdentity() to get the account ID
	return "123456789012" // Replace with actual account ID or use data source
}

// Helper function to generate random suffix for unique resource names
func generateRandomSuffix() string {
	// In production, you might want to use a more sophisticated approach
	// or pass this as a parameter to ensure consistency across resources
	return "abc123" // Replace with actual random generation or consistent suffix
}
```

This completes the `tap-stack.go` file with all the required security-focused AWS infrastructure components:

## Key Security Features Implemented:

1. **Encryption at Rest**: All data stores (S3, RDS, CloudWatch Logs) use customer-managed KMS keys
2. **Encryption in Transit**: S3 bucket policies deny non-TLS connections
3. **Network Security**: Proper VPC setup with public/private subnets, NAT gateways, and restrictive security groups
4. **Access Control**: IAM roles follow least privilege principle with specific permissions
5. **Logging & Monitoring**: Comprehensive CloudTrail setup with both S3 and CloudWatch Logs delivery
6. **Database Security**: RDS in private subnets, encrypted, with Multi-AZ deployment
7. **Secrets Management**: Database passwords stored in AWS Secrets Manager
8. **Resource Isolation**: Security groups restrict access between tiers appropriately

## Production Considerations:

- Replace placeholder account ID and random suffix with actual implementations
- Review and adjust backup retention periods, instance sizes, and other parameters for your specific requirements
- Consider implementing additional monitoring and alerting
- For high availability, consider deploying NAT gateways in multiple AZs
- Implement proper CI/CD pipeline with security scanning before deployment