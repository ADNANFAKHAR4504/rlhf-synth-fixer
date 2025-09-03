package stack

import (
	"encoding/json"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createS3Replication(ctx *pulumi.Context, usEast1Provider, euWest1Provider pulumi.ProviderResource, primaryBucket, secondaryBucket pulumi.StringOutput, projectName, environment string, tags pulumi.StringMap, accountId string) error {
	replicationRole, err := iam.NewRole(ctx, "s3-replication-role", &iam.RoleArgs{AssumeRolePolicy: pulumi.String(`{ "Version": "2012-10-17", "Statement": [{ "Action": "sts:AssumeRole", "Effect": "Allow", "Principal": { "Service": "s3.amazonaws.com" } }] }`), Tags: tags}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}
	_, err = iam.NewRolePolicy(ctx, "s3-replication-policy", &iam.RolePolicyArgs{Role: replicationRole.ID(), Policy: pulumi.All(primaryBucket, secondaryBucket).ApplyT(func(args []interface{}) (string, error) {
		primaryBucketName := args[0].(string)
		secondaryBucketName := args[1].(string)
		policy := map[string]interface{}{
			"Version": "2012-10-17",
			"Statement": []map[string]interface{}{
				{"Effect": "Allow", "Action": []string{"s3:GetObjectVersionForReplication", "s3:GetObjectVersionAcl"}, "Resource": "arn:aws:s3:::" + primaryBucketName + "/*"},
				{"Effect": "Allow", "Action": []string{"s3:ListBucket"}, "Resource": "arn:aws:s3:::" + primaryBucketName},
				{"Effect": "Allow", "Action": []string{"s3:ReplicateObject", "s3:ReplicateDelete"}, "Resource": "arn:aws:s3:::" + secondaryBucketName + "/*"},
			},
		}
		b, _ := json.Marshal(policy)
		return string(b), nil
	}).(pulumi.StringOutput)}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = s3.NewBucketVersioningV2(ctx, "primary-bucket-versioning", &s3.BucketVersioningV2Args{Bucket: primaryBucket, VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{Status: pulumi.String("Enabled")}}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}
	_, err = s3.NewBucketVersioningV2(ctx, "secondary-bucket-versioning", &s3.BucketVersioningV2Args{Bucket: secondaryBucket, VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{Status: pulumi.String("Enabled")}}, pulumi.Provider(euWest1Provider))
	if err != nil {
		return err
	}

	_, err = s3.NewBucketReplicationConfig(ctx, "s3-replication", &s3.BucketReplicationConfigArgs{Role: replicationRole.Arn, Bucket: primaryBucket, Rules: s3.BucketReplicationConfigRuleArray{&s3.BucketReplicationConfigRuleArgs{Id: pulumi.String("ReplicateEverything"), Status: pulumi.String("Enabled"), Destination: &s3.BucketReplicationConfigRuleDestinationArgs{Bucket: pulumi.All(secondaryBucket).ApplyT(func(args []interface{}) string { return "arn:aws:s3:::" + args[0].(string) }).(pulumi.StringOutput), StorageClass: pulumi.String("STANDARD")}}}}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}
	return nil
}
