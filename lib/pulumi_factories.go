package main

import (
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudfront"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
)

// These variables exist to make error branches testable.
// In production they point to real Pulumi constructors/invokes; unit tests can
// temporarily override them to force specific calls to return errors.

var (
	newAWSProvider         = aws.NewProvider
	getAvailabilityZones   = aws.GetAvailabilityZones
	newVpc                 = ec2.NewVpc
	newSubnet              = ec2.NewSubnet
	newInternetGateway     = ec2.NewInternetGateway
	newRouteTable          = ec2.NewRouteTable
	newRouteTableAssoc     = ec2.NewRouteTableAssociation
	newSecurityGroup       = ec2.NewSecurityGroup
	newKMSKey              = kms.NewKey
	newKMSAlias            = kms.NewAlias
	newS3Bucket            = s3.NewBucket
	newS3BucketEncryption  = s3.NewBucketServerSideEncryptionConfigurationV2
	newS3BucketVersioning  = s3.NewBucketVersioningV2
	newS3BucketPAB         = s3.NewBucketPublicAccessBlock
	newS3BucketLogging     = s3.NewBucketLoggingV2
	newS3BucketPolicy      = s3.NewBucketPolicy
	newCloudFrontDist      = cloudfront.NewDistribution
	newIAMRole             = iam.NewRole
	newIAMRolePolicy       = iam.NewRolePolicy
	newIAMInstanceProfile  = iam.NewInstanceProfile
	newRDSSubnetGroup      = rds.NewSubnetGroup
	newRDSInstance         = rds.NewInstance
	newCloudWatchLogGroup  = cloudwatch.NewLogGroup
	newCloudWatchDashboard = cloudwatch.NewDashboard
	newCloudTrailTrail     = cloudtrail.NewTrail
)
