package test

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/cloudtrail"
	"github.com/aws/aws-sdk-go/service/cloudwatch"
	"github.com/aws/aws-sdk-go/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go/service/ec2"
	"github.com/aws/aws-sdk-go/service/kms"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type TerraformOutputs struct {
	VPCId                    map[string]interface{} `json:"vpc_id"`
	PrivateSubnetIds         map[string]interface{} `json:"private_subnet_ids"`
	SecurityGroupId          map[string]interface{} `json:"security_group_id"`
	KMSKeyId                 map[string]interface{} `json:"kms_key_id"`
	KMSKeyArn                map[string]interface{} `json:"kms_key_arn"`
	SensitiveDataBucketName  map[string]interface{} `json:"sensitive_data_bucket_name"`
	SensitiveDataBucketArn   map[string]interface{} `json:"sensitive_data_bucket_arn"`
	CloudTrailName           map[string]interface{} `json:"cloudtrail_name"`
	CloudTrailArn            map[string]interface{} `json:"cloudtrail_arn"`
	FlowLogsLogGroup         map[string]interface{} `json:"flow_logs_log_group"`
	ApplicationLogGroup      map[string]interface{} `json:"application_log_group"`
	GuardDutyDetectorId      map[string]interface{} `json:"guardduty_detector_id"`
}

func loadOutputs(t *testing.T) TerraformOutputs {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	require.NoError(t, err, "Should be able to read outputs file")

	var outputs TerraformOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Outputs should be valid JSON")

	return outputs
}

func getOutputValue(output map[string]interface{}) string {
	if val, ok := output["value"]; ok {
		return val.(string)
	}
	return ""
}

func getOutputArray(output map[string]interface{}) []interface{} {
	if val, ok := output["value"]; ok {
		return val.([]interface{})
	}
	return nil
}

func TestZeroTrustStackIntegration(t *testing.T) {
	outputs := loadOutputs(t)

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	require.NoError(t, err, "Should create AWS session")

	t.Run("VPCConfiguration", func(t *testing.T) {
		ec2Svc := ec2.New(sess)
		vpcId := getOutputValue(outputs.VPCId)
		require.NotEmpty(t, vpcId, "VPC ID should not be empty")

		// Verify VPC exists
		result, err := ec2Svc.DescribeVpcs(&ec2.DescribeVpcsInput{
			VpcIds: []*string{aws.String(vpcId)},
		})
		require.NoError(t, err, "Should retrieve VPC")
		assert.Len(t, result.Vpcs, 1, "Should find exactly one VPC")

		vpc := result.Vpcs[0]
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC CIDR should be 10.0.0.0/16")

		// Check VPC tags
		nameTag := ""
		for _, tag := range vpc.Tags {
			if *tag.Key == "Name" {
				nameTag = *tag.Value
				break
			}
		}
		assert.Contains(t, nameTag, "synth101912423", "VPC name should contain environment suffix")
	})

	t.Run("PrivateSubnets", func(t *testing.T) {
		ec2Svc := ec2.New(sess)
		subnetIds := getOutputArray(outputs.PrivateSubnetIds)
		require.Len(t, subnetIds, 2, "Should have 2 private subnets")

		for i, subnetIdInterface := range subnetIds {
			subnetId := subnetIdInterface.(string)
			result, err := ec2Svc.DescribeSubnets(&ec2.DescribeSubnetsInput{
				SubnetIds: []*string{aws.String(subnetId)},
			})
			require.NoError(t, err, "Should retrieve subnet %d", i)
			assert.Len(t, result.Subnets, 1, "Should find exactly one subnet")

			subnet := result.Subnets[0]
			assert.False(t, *subnet.MapPublicIpOnLaunch, "Subnet should not assign public IPs")

			// Check subnet tags
			typeTag := ""
			for _, tag := range subnet.Tags {
				if *tag.Key == "Type" {
					typeTag = *tag.Value
					break
				}
			}
			assert.Equal(t, "Private", typeTag, "Subnet should be tagged as Private")
		}
	})

	t.Run("SecurityGroup", func(t *testing.T) {
		ec2Svc := ec2.New(sess)
		sgId := getOutputValue(outputs.SecurityGroupId)
		require.NotEmpty(t, sgId, "Security group ID should not be empty")

		result, err := ec2Svc.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
			GroupIds: []*string{aws.String(sgId)},
		})
		require.NoError(t, err, "Should retrieve security group")
		assert.Len(t, result.SecurityGroups, 1, "Should find exactly one security group")

		sg := result.SecurityGroups[0]

		// Check ingress rules (should allow HTTPS from VPC)
		assert.Len(t, sg.IpPermissions, 1, "Should have exactly one ingress rule")
		ingressRule := sg.IpPermissions[0]
		assert.Equal(t, int64(443), *ingressRule.FromPort, "Ingress should allow port 443")
		assert.Equal(t, int64(443), *ingressRule.ToPort, "Ingress should allow port 443")
		assert.Equal(t, "tcp", *ingressRule.IpProtocol, "Ingress should use TCP")

		// Check egress rules (should allow HTTPS outbound)
		assert.Len(t, sg.IpPermissionsEgress, 1, "Should have exactly one egress rule")
		egressRule := sg.IpPermissionsEgress[0]
		assert.Equal(t, int64(443), *egressRule.FromPort, "Egress should allow port 443")
		assert.Equal(t, int64(443), *egressRule.ToPort, "Egress should allow port 443")
	})

	t.Run("KMSEncryption", func(t *testing.T) {
		kmsSvc := kms.New(sess)
		keyId := getOutputValue(outputs.KMSKeyId)
		require.NotEmpty(t, keyId, "KMS key ID should not be empty")

		// Verify KMS key exists and is enabled
		result, err := kmsSvc.DescribeKey(&kms.DescribeKeyInput{
			KeyId: aws.String(keyId),
		})
		require.NoError(t, err, "Should retrieve KMS key")

		key := result.KeyMetadata
		assert.Equal(t, "Enabled", *key.KeyState, "KMS key should be enabled")
		assert.Equal(t, true, *key.Enabled, "KMS key should be enabled")
		assert.Equal(t, "ENCRYPT_DECRYPT", *key.KeyUsage, "KMS key should be for encryption/decryption")

		// Check key rotation
		rotationResult, err := kmsSvc.GetKeyRotationStatus(&kms.GetKeyRotationStatusInput{
			KeyId: aws.String(keyId),
		})
		require.NoError(t, err, "Should get key rotation status")
		assert.Equal(t, true, *rotationResult.KeyRotationEnabled, "Key rotation should be enabled")
	})

	t.Run("S3BucketEncryption", func(t *testing.T) {
		s3Svc := s3.New(sess)
		bucketName := getOutputValue(outputs.SensitiveDataBucketName)
		require.NotEmpty(t, bucketName, "Bucket name should not be empty")

		// Check bucket versioning
		versioningResult, err := s3Svc.GetBucketVersioning(&s3.GetBucketVersioningInput{
			Bucket: aws.String(bucketName),
		})
		require.NoError(t, err, "Should get bucket versioning")
		assert.Equal(t, "Enabled", *versioningResult.Status, "Bucket versioning should be enabled")

		// Check encryption
		encryptionResult, err := s3Svc.GetBucketEncryption(&s3.GetBucketEncryptionInput{
			Bucket: aws.String(bucketName),
		})
		require.NoError(t, err, "Should get bucket encryption")
		assert.Len(t, encryptionResult.ServerSideEncryptionConfiguration.Rules, 1, "Should have encryption rule")

		rule := encryptionResult.ServerSideEncryptionConfiguration.Rules[0]
		assert.Equal(t, "aws:kms", *rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm, "Should use KMS encryption")
		assert.NotNil(t, rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID, "Should have KMS key ID")

		// Check public access block
		publicAccessResult, err := s3Svc.GetPublicAccessBlock(&s3.GetPublicAccessBlockInput{
			Bucket: aws.String(bucketName),
		})
		require.NoError(t, err, "Should get public access block")

		config := publicAccessResult.PublicAccessBlockConfiguration
		assert.Equal(t, true, *config.BlockPublicAcls, "Should block public ACLs")
		assert.Equal(t, true, *config.BlockPublicPolicy, "Should block public policies")
		assert.Equal(t, true, *config.IgnorePublicAcls, "Should ignore public ACLs")
		assert.Equal(t, true, *config.RestrictPublicBuckets, "Should restrict public buckets")
	})

	t.Run("CloudTrailConfiguration", func(t *testing.T) {
		cloudtrailSvc := cloudtrail.New(sess)
		trailName := getOutputValue(outputs.CloudTrailName)
		require.NotEmpty(t, trailName, "CloudTrail name should not be empty")

		result, err := cloudtrailSvc.GetTrailStatus(&cloudtrail.GetTrailStatusInput{
			Name: aws.String(trailName),
		})
		require.NoError(t, err, "Should get CloudTrail status")
		assert.Equal(t, true, *result.IsLogging, "CloudTrail should be logging")

		// Get trail details
		trailResult, err := cloudtrailSvc.DescribeTrails(&cloudtrail.DescribeTrailsInput{
			TrailNameList: []*string{aws.String(trailName)},
		})
		require.NoError(t, err, "Should describe trail")
		assert.Len(t, trailResult.TrailList, 1, "Should find exactly one trail")

		trail := trailResult.TrailList[0]
		assert.Equal(t, true, *trail.LogFileValidationEnabled, "Log file validation should be enabled")
		assert.Equal(t, true, *trail.IsMultiRegionTrail, "Should be multi-region trail")
		assert.NotNil(t, trail.KmsKeyId, "Should have KMS key for encryption")
	})

	t.Run("CloudWatchLogGroups", func(t *testing.T) {
		cwlSvc := cloudwatchlogs.New(sess)
		flowLogsGroup := getOutputValue(outputs.FlowLogsLogGroup)
		appLogGroup := getOutputValue(outputs.ApplicationLogGroup)

		// Check flow logs group
		flowLogsResult, err := cwlSvc.DescribeLogGroups(&cloudwatchlogs.DescribeLogGroupsInput{
			LogGroupNamePrefix: aws.String(flowLogsGroup),
		})
		require.NoError(t, err, "Should describe flow logs group")
		require.Len(t, flowLogsResult.LogGroups, 1, "Should find flow logs group")
		assert.Equal(t, int64(30), *flowLogsResult.LogGroups[0].RetentionInDays, "Flow logs retention should be 30 days")
		assert.NotNil(t, flowLogsResult.LogGroups[0].KmsKeyId, "Flow logs should be encrypted")

		// Check application log group
		appLogResult, err := cwlSvc.DescribeLogGroups(&cloudwatchlogs.DescribeLogGroupsInput{
			LogGroupNamePrefix: aws.String(appLogGroup),
		})
		require.NoError(t, err, "Should describe application log group")
		require.Len(t, appLogResult.LogGroups, 1, "Should find application log group")
		assert.Equal(t, int64(30), *appLogResult.LogGroups[0].RetentionInDays, "Application logs retention should be 30 days")
		assert.NotNil(t, appLogResult.LogGroups[0].KmsKeyId, "Application logs should be encrypted")
	})

	t.Run("CloudWatchAlarms", func(t *testing.T) {
		cwSvc := cloudwatch.New(sess)

		// Check for security alarms
		result, err := cwSvc.DescribeAlarms(&cloudwatch.DescribeAlarmsInput{
			AlarmNamePrefix: aws.String("zero-trust-"),
		})
		require.NoError(t, err, "Should describe alarms")
		assert.GreaterOrEqual(t, len(result.MetricAlarms), 3, "Should have at least 3 security alarms")

		alarmNames := make([]string, len(result.MetricAlarms))
		for i, alarm := range result.MetricAlarms {
			alarmNames[i] = *alarm.AlarmName
		}

		// Check for specific alarms
		assert.Contains(t, alarmNames, "zero-trust-unauthorized-api-calls-synth101912423", "Should have unauthorized API calls alarm")
		assert.Contains(t, alarmNames, "zero-trust-root-usage-synth101912423", "Should have root usage alarm")
		assert.Contains(t, alarmNames, "zero-trust-kms-deletion-synth101912423", "Should have KMS deletion alarm")
	})

	t.Run("VPCEndpoints", func(t *testing.T) {
		ec2Svc := ec2.New(sess)
		vpcId := getOutputValue(outputs.VPCId)

		result, err := ec2Svc.DescribeVpcEndpoints(&ec2.DescribeVpcEndpointsInput{
			Filters: []*ec2.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []*string{aws.String(vpcId)},
				},
			},
		})
		require.NoError(t, err, "Should describe VPC endpoints")
		assert.GreaterOrEqual(t, len(result.VpcEndpoints), 2, "Should have at least 2 VPC endpoints")

		// Check for S3 and KMS endpoints
		hasS3 := false
		hasKMS := false
		for _, endpoint := range result.VpcEndpoints {
			if *endpoint.ServiceName == "com.amazonaws.us-east-1.s3" {
				hasS3 = true
				assert.Equal(t, "Gateway", *endpoint.VpcEndpointType, "S3 endpoint should be Gateway type")
			}
			if *endpoint.ServiceName == "com.amazonaws.us-east-1.kms" {
				hasKMS = true
				assert.Equal(t, "Interface", *endpoint.VpcEndpointType, "KMS endpoint should be Interface type")
			}
		}
		assert.True(t, hasS3, "Should have S3 VPC endpoint")
		assert.True(t, hasKMS, "Should have KMS VPC endpoint")
	})

	t.Run("VPCFlowLogs", func(t *testing.T) {
		ec2Svc := ec2.New(sess)
		vpcId := getOutputValue(outputs.VPCId)

		result, err := ec2Svc.DescribeFlowLogs(&ec2.DescribeFlowLogsInput{
			Filter: []*ec2.Filter{
				{
					Name:   aws.String("resource-id"),
					Values: []*string{aws.String(vpcId)},
				},
			},
		})
		require.NoError(t, err, "Should describe flow logs")
		assert.Len(t, result.FlowLogs, 1, "Should have exactly one flow log")

		flowLog := result.FlowLogs[0]
		assert.Equal(t, "ALL", *flowLog.TrafficType, "Should capture all traffic")
		assert.Equal(t, "cloud-watch-logs", *flowLog.LogDestinationType, "Should log to CloudWatch")
	})
}
