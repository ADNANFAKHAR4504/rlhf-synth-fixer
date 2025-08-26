package stack

import "github.com/pulumi/pulumi/sdk/v3/go/pulumi"

type RegionalInfra struct {
	VpcId            pulumi.StringOutput
	PublicSubnetIds  pulumi.StringArrayOutput
	PrivateSubnetIds pulumi.StringArrayOutput
	AlbDnsName       pulumi.StringOutput
	DataBucketName   pulumi.StringOutput
	LogBucketName    pulumi.StringOutput
	RdsEndpoint      pulumi.StringOutput
}
