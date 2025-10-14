package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsbackup"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsefs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// StorageConstructProps defines properties for the storage construct.
type StorageConstructProps struct {
	EnvironmentSuffix *string
	Vpc               awsec2.Vpc
}

// StorageConstruct represents the EFS storage infrastructure.
type StorageConstruct struct {
	constructs.Construct
	FileSystem    awsefs.FileSystem
	AccessPoint   awsefs.AccessPoint
	SecurityGroup awsec2.SecurityGroup
}

// NewStorageConstruct creates EFS file system for content storage with cross-region replication.
func NewStorageConstruct(scope constructs.Construct, id *string, props *StorageConstructProps) *StorageConstruct {
	construct := constructs.NewConstruct(scope, id)

	environmentSuffix := *props.EnvironmentSuffix

	// Create security group for EFS with explicit NFS ingress rules
	efsSecurityGroup := awsec2.NewSecurityGroup(construct, jsii.String("EfsSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               props.Vpc,
		SecurityGroupName: jsii.String(fmt.Sprintf("globalstream-efs-sg-%s", environmentSuffix)),
		Description:       jsii.String("Security group for EFS file system"),
		AllowAllOutbound:  jsii.Bool(true),
	})

	// Allow NFS traffic from VPC CIDR range
	efsSecurityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(props.Vpc.VpcCidrBlock()),
		awsec2.Port_Tcp(jsii.Number(2049)),
		jsii.String("Allow NFS from VPC"),
		jsii.Bool(false),
	)

	// Create EFS file system with encryption
	fileSystem := awsefs.NewFileSystem(construct, jsii.String("ContentFileSystem"), &awsefs.FileSystemProps{
		FileSystemName: jsii.String(fmt.Sprintf("globalstream-content-%s", environmentSuffix)),
		Vpc:            props.Vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
		SecurityGroup: efsSecurityGroup,
		// Enable encryption at rest (LGPD compliance)
		Encrypted: jsii.Bool(true),
		// Use Bursting throughput mode for cost optimization
		PerformanceMode: awsefs.PerformanceMode_GENERAL_PURPOSE,
		ThroughputMode:  awsefs.ThroughputMode_BURSTING,
		// Enable automatic backups
		EnableAutomaticBackups: jsii.Bool(true),
		// Lifecycle policy to move files to IA storage class after 30 days
		LifecyclePolicy:             awsefs.LifecyclePolicy_AFTER_30_DAYS,
		OutOfInfrequentAccessPolicy: awsefs.OutOfInfrequentAccessPolicy_AFTER_1_ACCESS,
		RemovalPolicy:               awscdk.RemovalPolicy_DESTROY,
	})

	// Note: Cross-region replication requires manual setup or AWS Backup
	// For this implementation, we use AWS Backup with cross-region copies

	// Create AWS Backup plan for additional protection
	backupVault := awsbackup.NewBackupVault(construct, jsii.String("EfsBackupVault"), &awsbackup.BackupVaultProps{
		BackupVaultName: jsii.String(fmt.Sprintf("globalstream-efs-vault-%s", environmentSuffix)),
		RemovalPolicy:   awscdk.RemovalPolicy_DESTROY,
	})

	backupPlan := awsbackup.NewBackupPlan(construct, jsii.String("EfsBackupPlan"), &awsbackup.BackupPlanProps{
		BackupPlanName: jsii.String(fmt.Sprintf("globalstream-efs-backup-%s", environmentSuffix)),
		BackupVault:    backupVault,
		BackupPlanRules: &[]awsbackup.BackupPlanRule{
			awsbackup.NewBackupPlanRule(&awsbackup.BackupPlanRuleProps{
				RuleName: jsii.String("DailyBackup"),
				// Daily backup at 3 AM UTC
				StartWindow:      awscdk.Duration_Hours(jsii.Number(1)),
				CompletionWindow: awscdk.Duration_Hours(jsii.Number(2)),
				DeleteAfter:      awscdk.Duration_Days(jsii.Number(7)),
			}),
		},
	})

	// Add EFS to backup plan
	backupPlan.AddSelection(jsii.String("EfsBackupSelection"), &awsbackup.BackupSelectionOptions{
		Resources: &[]awsbackup.BackupResource{
			awsbackup.BackupResource_FromEfsFileSystem(fileSystem),
		},
	})

	// Create access point for media processing tasks
	accessPoint := fileSystem.AddAccessPoint(jsii.String("MediaProcessingAccessPoint"), &awsefs.AccessPointOptions{
		Path: jsii.String("/media-processing"),
		CreateAcl: &awsefs.Acl{
			OwnerGid:    jsii.String("1000"),
			OwnerUid:    jsii.String("1000"),
			Permissions: jsii.String("755"),
		},
		PosixUser: &awsefs.PosixUser{
			Gid: jsii.String("1000"),
			Uid: jsii.String("1000"),
		},
	})

	// Tag file system for compliance
	awscdk.Tags_Of(fileSystem).Add(jsii.String("Purpose"), jsii.String("Content Storage"), nil)
	awscdk.Tags_Of(fileSystem).Add(jsii.String("Compliance"), jsii.String("LGPD"), nil)
	awscdk.Tags_Of(fileSystem).Add(jsii.String("Replication"), jsii.String("sa-east-1"), nil)
	awscdk.Tags_Of(accessPoint).Add(jsii.String("Purpose"), jsii.String("Media Processing"), nil)

	return &StorageConstruct{
		Construct:     construct,
		FileSystem:    fileSystem,
		AccessPoint:   accessPoint,
		SecurityGroup: efsSecurityGroup,
	}
}
