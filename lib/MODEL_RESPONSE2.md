```go
Parameter(ctx, fmt.Sprintf("project-param-%s", region), &ssm.ParameterArgs{
		Name:  pulumi.Sprintf("/%s/%s/project", projectName, environment),
		Type:  pulumi.String("String"),
		Value: pulumi.String(projectName),
		Tags:  tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	_, err = ssm.NewParameter(ctx, fmt.Sprintf("env-param-%s", region), &ssm.ParameterArgs{
		Name:  pulumi.Sprintf("/%s/%s/environment", projectName, environment),
		Type:  pulumi.String("String"),
		Value: pulumi.String(environment),
		Tags:  tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create Lambda function for log shipping
	lambdaRole, err := iam.NewRole(ctx, fmt.Sprintf("lambda-role-%s", region), &iam.RoleArgs{
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
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	logGroup, err := logs.NewLogGroup(ctx, fmt.Sprintf("lambda-logs-%s", region), &logs.LogGroupArgs{
		Name:            pulumi.Sprintf("/aws/lambda/%s-%s-log-shipper", projectName, environment),
		RetentionInDays: pulumi.Int(14),
		Tags:            tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("lambda-policy-%s", region), &iam.RolePolicyArgs{
		Role: lambdaRole.ID(),
		Policy: pulumi.All(logGroup.Arn).ApplyT(func(args []interface{}) (string, error) {
			logGroupArn := args[0].(string)
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Allow",
						"Action": []string{
							"logs:CreateLogStream",
							"logs:PutLogEvents",
						},
						"Resource": logGroupArn + ":*",
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:GetObject",
						},
						"Resource": "arn:aws:s3:::" + fmt.Sprintf("%s-%s-log-*", projectName, environment) + "/*",
					},
				},
			}
			policyJSON, _ := json.Marshal(policy)
			return string(policyJSON), nil
		}).(pulumi.StringOutput),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	_, err = lambda.NewFunction(ctx, fmt.Sprintf("log-shipper-%s", region), &lambda.FunctionArgs{
		Runtime: pulumi.String("python3.9"),
		Code:    pulumi.NewFileArchive("lambda.zip"),
		Handler: pulumi.String("index.handler"),
		Role:    lambdaRole.Arn,
		Environment: &lambda.FunctionEnvironmentArgs{
			Variables: pulumi.StringMap{
				"LOG_GROUP": logGroup.Name,
			},
		},
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	return &RegionalInfra{
		VpcId:            vpc.ID(),
		PublicSubnetIds:  pulumi.StringArray(publicSubnetIds).ToStringArrayOutput(),
		PrivateSubnetIds: pulumi.StringArray(privateSubnetIds).ToStringArrayOutput(),
		AlbDnsName:       alb.DnsName,
		DataBucketName:   dataBucket.ID(),
		LogBucketName:    logBucket.ID(),
		RdsEndpoint:      rdsInstance.Endpoint,
	}, nil
}

func createS3Replication(ctx *pulumi.Context, usEast1Provider, euWest1Provider pulumi.ProviderResource, primaryBucket, secondaryBucket pulumi.StringOutput, projectName, environment string, tags pulumi.StringMap, accountId string) error {
	// Create replication role
	replicationRole, err := iam.NewRole(ctx, "s3-replication-role", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "s3.amazonaws.com"
					}
				}
			]
		}`),
		Tags: tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = iam.NewRolePolicy(ctx, "s3-replication-policy", &iam.RolePolicyArgs{
		Role: replicationRole.ID(),
		Policy: pulumi.All(primaryBucket, secondaryBucket).ApplyT(func(args []interface{}) (string, error) {
			primaryBucketName := args[0].(string)
			secondaryBucketName := args[1].(string)
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:GetObjectVersionForReplication",
							"s3:GetObjectVersionAcl",
						},
						"Resource": "arn:aws:s3:::" + primaryBucketName + "/*",
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:ListBucket",
						},
						"Resource": "arn:aws:s3:::" + primaryBucketName,
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:ReplicateObject",
							"s3:ReplicateDelete",
						},
						"Resource": "arn:aws:s3:::" + secondaryBucketName + "/*",
					},
				},
			}
			policyJSON, _ := json.Marshal(policy)
			return string(policyJSON), nil
		}).(pulumi.StringOutput),
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Enable versioning on both buckets
	_, err = s3.NewBucketVersioningV2(ctx, "primary-bucket-versioning", &s3.BucketVersioningV2Args{
		Bucket: primaryBucket,
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = s3.NewBucketVersioningV2(ctx, "secondary-bucket-versioning", &s3.BucketVersioningV2Args{
		Bucket: secondaryBucket,
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	}, pulumi.Provider(euWest1Provider))
	if err != nil {
		return err
	}

	// Create replication configuration
	_, err = s3.NewBucketReplicationConfig(ctx, "s3-replication", &s3.BucketReplicationConfigArgs{
		Role:   replicationRole.Arn,
		Bucket: primaryBucket,
		Rules: s3.BucketReplicationConfigRuleArray{
			&s3.BucketReplicationConfigRuleArgs{
				Id:     pulumi.String("ReplicateEverything"),
				Status: pulumi.String("Enabled"),
				Destination: &s3.BucketReplicationConfigRuleDestinationArgs{
					Bucket:       pulumi.All(secondaryBucket).ApplyT(func(args []interface{}) string {
						return "arn:aws:s3:::" + args[0].(string)
					}).(pulumi.StringOutput),
					StorageClass: pulumi.String("STANDARD"),
				},
			},
		},
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	return nil
}

func createCloudFront(ctx *pulumi.Context, usEast1Provider pulumi.ProviderResource, primaryBucket pulumi.StringOutput, projectName, environment string, tags pulumi.StringMap) (pulumi.StringOutput, error) {
	// Create ACM certificate for CloudFront (must be in us-east-1)
	cert, err := acm.NewCertificate(ctx, "cloudfront-cert", &acm.CertificateArgs{
		DomainName:       pulumi.Sprintf("%s.example.com", projectName),
		ValidationMethod: pulumi.String("DNS"),
		Tags:             tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return pulumi.StringOutput{}, err
	}

	// Create CloudFront OAC
	oac, err := cloudfront.NewOriginAccessControl(ctx, "s3-oac", &cloudfront.OriginAccessControlArgs{
		Name:                          pulumi.Sprintf("%s-%s-oac", projectName, environment),
		Description:                   pulumi.String("OAC for S3 bucket"),
		OriginAccessControlOriginType: pulumi.String("s3"),
		SigningBehavior:               pulumi.String("always"),
		SigningProtocol:               pulumi.String("sigv4"),
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return pulumi.StringOutput{}, err
	}

	// Create CloudFront distribution
	distribution, err := cloudfront.NewDistribution(ctx, "cloudfront", &cloudfront.DistributionArgs{
		Origins: cloudfront.DistributionOriginArray{
			&cloudfront.DistributionOriginArgs{
				DomainName:            pulumi.All(primaryBucket).ApplyT(func(args []interface{}) string {
					return args[0].(string) + ".s3.amazonaws.com"
				}).(pulumi.StringOutput),
				OriginId:              pulumi.String("S3-primary"),
				OriginAccessControlId: oac.ID(),
			},
		},
		Enabled:           pulumi.Bool(true),
		DefaultRootObject: pulumi.String("index.html"),
		DefaultCacheBehavior: &cloudfront.DistributionDefaultCacheBehaviorArgs{
			TargetOriginId:       pulumi.String("S3-primary"),
			ViewerProtocolPolicy: pulumi.String("redirect-to-https"),
			AllowedMethods:       pulumi.StringArray{pulumi.String("DELETE"), pulumi.String("GET"), pulumi.String("HEAD"), pulumi.String("OPTIONS"), pulumi.String("PATCH"), pulumi.String("POST"), pulumi.String("PUT")},
			CachedMethods:        pulumi.StringArray{pulumi.String("GET"), pulumi.String("HEAD")},
			Compress:             pulumi.Bool(true),
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
			AcmCertificateArn:      cert.Arn,
			SslSupportMethod:       pulumi.String("sni-only"),
			MinimumProtocolVersion: pulumi.String("TLSv1.2_2021"),
		},
		Tags: tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return pulumi.StringOutput{}, err
	}

	return distribution.DomainName, nil
}

func createMonitoring(ctx *pulumi.Context, usEast1Provider, euWest1Provider pulumi.ProviderResource, projectName, environment, notificationEmail string, tags pulumi.StringMap, accountId string) error {
	// Create SNS topic
	snsTopic, err := sns.NewTopic(ctx, "alerts", &sns.TopicArgs{
		Name: pulumi.Sprintf("%s-%s-alerts", projectName, environment),
		Tags: tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = sns.NewTopicSubscription(ctx, "email-alert", &sns.TopicSubscriptionArgs{
		TopicArn: snsTopic.Arn,
		Protocol: pulumi.String("email"),
		Endpoint: pulumi.String(notificationEmail),
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create CloudTrail S3 bucket
	cloudtrailBucket, err := s3.NewBucketV2(ctx, "cloudtrail-bucket", &s3.BucketV2Args{
		Tags: tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "cloudtrail-bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: cloudtrailBucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					SseAlgorithm: pulumi.String("aws:kms"),
				},
			},
		},
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = s3.NewBucketPolicy(ctx, "cloudtrail-bucket-policy", &s3.BucketPolicyArgs{
		Bucket: cloudtrailBucket.ID(),
		Policy: pulumi.All(cloudtrailBucket.Arn).ApplyT(func(args []interface{}) (string, error) {
			bucketArn := args[0].(string)
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "cloudtrail.amazonaws.com",
						},
						"Action":   "s3:PutObject",
						"Resource": bucketArn + "/*",
						"Condition": map[string]interface{}{
							"StringEquals": map[string]interface{}{
								"s3:x-amz-acl": "bucket-owner-full-control",
							},
						},
					},
					{
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "cloudtrail.amazonaws.com",
						},
						"Action":   "s3:GetBucketAcl",
						"Resource": bucketArn,
					},
				},
			}
			policyJSON, _ := json.Marshal(policy)
			return string(policyJSON), nil
		}).(pulumi.StringOutput),
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create CloudWatch Log Group for CloudTrail
	cloudtrailLogGroup, err := logs.NewLogGroup(ctx, "cloudtrail-logs", &logs.LogGroupArgs{
		Name:            pulumi.Sprintf("/aws/cloudtrail/%s-%s", projectName, environment),
		RetentionInDays: pulumi.Int(90),
		Tags:            tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create CloudTrail role
	cloudtrailRole, err := iam.NewRole(ctx, "cloudtrail-role", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					}
				}
			]
		}`),
		Tags: tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = iam.NewRolePolicy(ctx, "cloudtrail-policy", &iam.RolePolicyArgs{
		Role: cloudtrailRole.ID(),
		Policy: pulumi.All(cloudtrailLogGroup.Arn).ApplyT(func(args []interface{}) (string, error) {
			logGroupArn := args[0].(string)
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Allow",
						"Action": []string{
							"logs:CreateLogStream",
							"logs:PutLogEvents",
						},
						"Resource": logGroupArn + ":*",
					},
				},
			}
			policyJSON, _ := json.Marshal(policy)
			return string(policyJSON), nil
		}).(pulumi.StringOutput),
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create CloudTrail
	_, err = cloudtrail.NewTrail(ctx, "cloudtrail", &cloudtrail.TrailArgs{
		Name:                       pulumi.Sprintf("%s-%s-trail", projectName, environment),
		S3BucketName:               cloudtrailBucket.ID(),
		IncludeGlobalServiceEvents: pulumi.Bool(true),
		IsMultiRegionTrail:         pulumi.Bool(true),
		EnableLogFileValidation:    pulumi.Bool(true),
		CloudWatchLogsGroupArn:     pulumi.All(cloudtrailLogGroup.Arn).ApplyT(func(args []interface{}) string {
			return args[0].(string) + ":*"
		}).(pulumi.StringOutput),
		CloudWatchLogsRoleArn: cloudtrailRole.Arn,
		Tags:                  tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create metric filter and alarm
	_, err = logs.NewMetricFilter(ctx, "unauthorized-api-calls", &logs.MetricFilterArgs{
		Name:           pulumi.String("UnauthorizedAPICalls"),
		LogGroupName:   cloudtrailLogGroup.Name,
		FilterPattern:  pulumi.String(`{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }`),
		MetricTransformation: &logs.MetricFilterMetricTransformationArgs{
			Name:      pulumi.String("UnauthorizedAPICalls"),
			Namespace: pulumi.String("CloudTrailMetrics"),
			Value:     pulumi.String("1"),
		},
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = cloudwatch.NewMetricAlarm(ctx, "unauthorized-api-alarm", &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.Sprintf("%s-%s-unauthorized-api-calls", projectName, environment),
		ComparisonOperator: pulumi.String("GreaterThanOrEqualToThreshold"),
		EvaluationPeriods:  pulumi.String("1"),
		MetricName:         pulumi.String("UnauthorizedAPICalls"),
		Namespace:          pulumi.String("CloudTrailMetrics"),
		Period:             pulumi.String("300"),
		Statistic:          pulumi.String("Sum"),
		Threshold:          pulumi.String("1"),
		AlarmDescription:   pulumi.String("Monitors unauthorized API calls"),
		AlarmActions:       pulumi.StringArray{snsTopic.Arn},
		Tags:               tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	return nil
}
```
