[0;32m🚀 Starting Pulumi Deploy to LocalStack...[0m
[0;32m✅ LocalStack is running[0m
[1;33m📁 Working directory: /Users/chandangupta/Desktop/localstack-task/iac-test-automations[0m
[0;32m✅ Pulumi project found: Pulumi.yaml[0m
[0;32m✅ Go module found: go.mod[0m
[1;33m📦 Installing Go dependencies...[0m
[0;32m✅ Go dependencies installed[0m
[1;33m🔨 Building Go project...[0m
[0;32m✅ Go project builds successfully[0m
[1;33m⚠️  pulumilocal not found, using pulumi with LocalStack configuration...[0m
[0;34m🔧 Using Pulumi: pulumi[0m
[0;36m🔧 Deploying Pulumi stack:[0m
[0;34m  • Stack Name: TapStackprdev[0m
[0;34m  • Environment: dev[0m
[0;34m  • Region: us-east-1[0m
[1;33m📦 Setting up Pulumi backend...[0m
Logged in to Mac.lan as chandangupta (file://~)
[0;32m✅ Pulumi backend configured[0m
[1;33m📦 Initializing Pulumi stack...[0m
[1;33m📦 Creating new stack: TapStackprdev[0m
Created stack 'TapStackprdev'
[0;32m✅ Stack selected: TapStackprdev[0m
[1;33m🔧 Configuring AWS region...[0m
[0;32m✅ AWS region configured: us-east-1[0m
[1;33m📋 Running Pulumi preview...[0m
[1;33mPreviewing update (TapStackprdev):[0m
[0;32m+ pulumi:pulumi:Stack: (create)[0m
[0;34m    [urn=urn:pulumi:TapStackprdev::TapStack::pulumi:pulumi:Stack::TapStack-TapStackprdev][0m
[0;32m    + pulumi:providers:aws: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider][0m
[0;34m        accessKey                : [secret][0m
[0;34m        endpoints                : (json) [[0m
[0;34m            [0]: {[0m
[0;34m                ec2: "http://localhost:4566"[0m
[0;34m                iam: "http://localhost:4566"[0m
[0;34m                s3 : "http://localhost:4566"[0m
[0;34m                sts: "http://localhost:4566"[0m
[0;34m            }[0m
[0;34m        ][0m
[0;34m[0m
[0;34m        region                   : "us-east-1"[0m
[0;34m        s3UsePathStyle           : "true"[0m
[0;34m        secretKey                : [secret][0m
[0;34m        skipCredentialsValidation: "true"[0m
[0;34m        skipMetadataApiCheck     : "true"[0m
[0;34m        skipRegionValidation     : "true"[0m
[0;34m        skipRequestingAccountId  : "true"[0m
[0;34m        version                  : "6.83.2"[0m
[0;32m    + aws:iam/role:Role: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:iam/role:Role::ec2-s3-role][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        assumeRolePolicy   : (json) {[0m
[0;34m            Statement: [[0m
[0;34m                [0]: {[0m
[0;34m                    Action   : "sts:AssumeRole"[0m
[0;34m                    Effect   : "Allow"[0m
[0;34m                    Principal: {[0m
[0;34m                        Service: "ec2.amazonaws.com"[0m
[0;34m                    }[0m
[0;34m                    Sid      : ""[0m
[0;34m                }[0m
[0;34m            ][0m
[0;34m            Version  : "2012-10-17"[0m
[0;34m        }[0m
[0;34m[0m
[0;34m        forceDetachPolicies: false[0m
[0;34m        maxSessionDuration : 3600[0m
[0;34m        name               : "ec2-s3-role-21d728e"[0m
[0;34m        path               : "/"[0m
[0;34m        tags               : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        tagsAll            : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;32m    + aws:ec2/vpc:Vpc: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:ec2/vpc:Vpc::main-vpc][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        cidrBlock         : "10.0.0.0/16"[0m
[0;34m        enableDnsHostnames: true[0m
[0;34m        enableDnsSupport  : true[0m
[0;34m        tags              : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        tagsAll           : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;32m    + aws:s3/bucketV2:BucketV2: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:s3/bucketV2:BucketV2::main-bucket][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        bucket      : "prod-infrastructure-bucket-tapstackprdev"[0m
[0;34m        forceDestroy: false[0m
[0;34m        tags        : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        tagsAll     : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;32m    + aws:ec2/routeTable:RouteTable: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:ec2/routeTable:RouteTable::main-route-table][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        tags      : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        tagsAll   : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        vpcId     : [unknown][0m
[0;32m    + aws:ec2/subnet:Subnet: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:ec2/subnet:Subnet::subnet-b][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        assignIpv6AddressOnCreation            : false[0m
[0;34m        availabilityZone                       : "us-east-1b"[0m
[0;34m        cidrBlock                              : "10.0.2.0/24"[0m
[0;34m        enableDns64                            : false[0m
[0;34m        enableResourceNameDnsARecordOnLaunch   : false[0m
[0;34m        enableResourceNameDnsAaaaRecordOnLaunch: false[0m
[0;34m        ipv6Native                             : false[0m
[0;34m        mapPublicIpOnLaunch                    : true[0m
[0;34m        tags                                   : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        tagsAll                                : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        vpcId                                  : [unknown][0m
[0;32m    + aws:ec2/subnet:Subnet: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:ec2/subnet:Subnet::subnet-a][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        assignIpv6AddressOnCreation            : false[0m
[0;34m        availabilityZone                       : "us-east-1a"[0m
[0;34m        cidrBlock                              : "10.0.1.0/24"[0m
[0;34m        enableDns64                            : false[0m
[0;34m        enableResourceNameDnsARecordOnLaunch   : false[0m
[0;34m        enableResourceNameDnsAaaaRecordOnLaunch: false[0m
[0;34m        ipv6Native                             : false[0m
[0;34m        mapPublicIpOnLaunch                    : true[0m
[0;34m        tags                                   : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        tagsAll                                : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        vpcId                                  : [unknown][0m
[0;32m    + aws:ec2/internetGateway:InternetGateway: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:ec2/internetGateway:InternetGateway::main-igw][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        tags      : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        tagsAll   : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        vpcId     : [unknown][0m
[0;32m    + aws:ec2/securityGroup:SecurityGroup: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:ec2/securityGroup:SecurityGroup::web-security-group][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        description        : "Security group for EC2 instance with SSH access"[0m
[0;34m        egress             : [[0m
[0;34m            [0]: {[0m
[0;34m                cidrBlocks: [[0m
[0;34m                    [0]: "0.0.0.0/0"[0m
[0;34m                ][0m
[0;34m                fromPort  : 0[0m
[0;34m                protocol  : "-1"[0m
[0;34m                self      : false[0m
[0;34m                toPort    : 0[0m
[0;34m            }[0m
[0;34m        ][0m
[0;34m        ingress            : [[0m
[0;34m            [0]: {[0m
[0;34m                cidrBlocks: [[0m
[0;34m                    [0]: "203.0.113.0/24"[0m
[0;34m                ][0m
[0;34m                fromPort  : 22[0m
[0;34m                protocol  : "tcp"[0m
[0;34m                self      : false[0m
[0;34m                toPort    : 22[0m
[0;34m            }[0m
[0;34m        ][0m
[0;34m        name               : "web-security-group-2e2e633"[0m
[0;34m        revokeRulesOnDelete: false[0m
[0;34m        tags               : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        tagsAll            : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        vpcId              : [unknown][0m
[0;32m    + aws:iam/instanceProfile:InstanceProfile: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:iam/instanceProfile:InstanceProfile::ec2-instance-profile][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        name      : "ec2-instance-profile-c3770de"[0m
[0;34m        path      : "/"[0m
[0;34m        role      : "ec2-s3-role-21d728e"[0m
[0;34m        tags      : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        tagsAll   : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;32m    + aws:ec2/routeTableAssociation:RouteTableAssociation: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:ec2/routeTableAssociation:RouteTableAssociation::subnet-b-route-association][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        routeTableId: [unknown][0m
[0;34m        subnetId    : [unknown][0m
[0;32m    + aws:ec2/route:Route: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:ec2/route:Route::internet-route][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        destinationCidrBlock: "0.0.0.0/0"[0m
[0;34m        gatewayId           : [unknown][0m
[0;34m        routeTableId        : [unknown][0m
[0;32m    + aws:ec2/routeTableAssociation:RouteTableAssociation: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:ec2/routeTableAssociation:RouteTableAssociation::subnet-a-route-association][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        routeTableId: [unknown][0m
[0;34m        subnetId    : [unknown][0m
[0;32m    + aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2::bucket-encryption][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        bucket    : [unknown][0m
[0;34m        rules     : [[0m
[0;34m            [0]: {[0m
[0;34m                applyServerSideEncryptionByDefault: {[0m
[0;34m                    sseAlgorithm: "AES256"[0m
[0;34m                }[0m
[0;34m            }[0m
[0;34m        ][0m
[0;32m    + aws:s3/bucketVersioningV2:BucketVersioningV2: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:s3/bucketVersioningV2:BucketVersioningV2::bucket-versioning][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        bucket                 : [unknown][0m
[0;34m        versioningConfiguration: {[0m
[0;34m            status    : "Enabled"[0m
[0;34m        }[0m
[0;32m    + aws:iam/policy:Policy: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:iam/policy:Policy::s3-read-policy][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        name      : "s3-read-policy-cc08b66"[0m
[0;34m        path      : "/"[0m
[0;34m        policy    : [unknown][0m
[0;34m        tags      : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;34m        tagsAll   : {[0m
[0;34m            Environment: "Production"[0m
[0;34m        }[0m
[0;32m    + aws:iam/rolePolicyAttachment:RolePolicyAttachment: (create)[0m
[0;34m        [urn=urn:pulumi:TapStackprdev::TapStack::aws:iam/rolePolicyAttachment:RolePolicyAttachment::s3-policy-attachment][0m
[0;34m        [provider=urn:pulumi:TapStackprdev::TapStack::pulumi:providers:aws::localstack-provider::04da6b54-80e4-46f7-96ec-b56ff0331ba9][0m
[0;34m        policyArn : [unknown][0m
[0;34m        role      : "ec2-s3-role-21d728e"[0m
[0;34m    --outputs:--[0m
[0;34m    bucketName      : [unknown][0m
[0;34m    iamRoleArn      : [unknown][0m
[0;34m    instanceId      : "skipped-for-localstack"[0m
[0;34m    instancePublicIp: "N/A"[0m
[0;34m    securityGroupId : [unknown][0m
[0;34m    subnetAId       : [unknown][0m
[0;34m    subnetBId       : [unknown][0m
[0;34m    vpcId           : [unknown][0m
[0;34mResources:[0m
[0;32m    + 18 to create[0m
[0;32m✅ Preview completed successfully[0m
[1;33m📦 Deploying Pulumi stack...[0m
[1;33m🔄 Updating (TapStackprdev):[0m
[0;34m[0m
[0;34m@ updating.......[0m
[0;36m   +  pulumi:pulumi:Stack TapStack-TapStackprdev creating (0s) [0m
[0;36m   +  pulumi:providers:aws localstack-provider creating (0s) [0m
[0;32m✅  +  pulumi:providers:aws localstack-provider created (0.01s) [0m
[0;36m   +  aws:iam:Role ec2-s3-role creating (0s) [0m
[0;36m   +  aws:s3:BucketV2 main-bucket creating (0s) [0m
[0;36m   +  aws:ec2:Vpc main-vpc creating (0s) [0m
[0;32m✅  +  aws:iam:Role ec2-s3-role created (0.07s) [0m
[0;36m   +  aws:iam:InstanceProfile ec2-instance-profile creating (0s) [0m
[0;32m✅  +  aws:s3:BucketV2 main-bucket created (0.09s) [0m
[0;36m   +  aws:s3:BucketVersioningV2 bucket-versioning creating (0s) [0m
[0;36m   +  aws:iam:Policy s3-read-policy creating (0s) [0m
[0;36m   +  aws:s3:BucketServerSideEncryptionConfigurationV2 bucket-encryption creating (0s) [0m
[0;32m✅  +  aws:s3:BucketServerSideEncryptionConfigurationV2 bucket-encryption created (0.01s) [0m
[0;32m✅  +  aws:iam:Policy s3-read-policy created (0.01s) [0m
[0;36m   +  aws:iam:RolePolicyAttachment s3-policy-attachment creating (0s) [0m
[0;32m✅  +  aws:iam:RolePolicyAttachment s3-policy-attachment created (0.01s) [0m
[0;34m@ updating.....[0m
[0;32m✅  +  aws:s3:BucketVersioningV2 bucket-versioning created (1s) [0m
[0;34m@ updating.......[0m
[0;32m✅  +  aws:iam:InstanceProfile ec2-instance-profile created (5s) [0m
[0;34m@ updating.......[0m
[0;32m✅  +  aws:ec2:Vpc main-vpc created (10s) [0m
[0;36m   +  aws:ec2:SecurityGroup web-security-group creating (0s) [0m
[0;36m   +  aws:ec2:Subnet subnet-a creating (0s) [0m
[0;36m   +  aws:ec2:Subnet subnet-b creating (0s) [0m
[0;36m   +  aws:ec2:InternetGateway main-igw creating (0s) [0m
[0;36m   +  aws:ec2:RouteTable main-route-table creating (0s) [0m
[0;32m✅  +  aws:ec2:InternetGateway main-igw created (0.04s) [0m
[0;34m@ updating....[0m
[0;32m✅  +  aws:ec2:RouteTable main-route-table created (0.14s) [0m
[0;36m   +  aws:ec2:Route internet-route creating (0s) [0m
[0;32m✅  +  aws:ec2:Route internet-route created (0.13s) [0m
[0;32m✅  +  aws:ec2:SecurityGroup web-security-group created (0.28s) [0m
[0;34m@ updating............[0m
[0;32m✅  +  aws:ec2:Subnet subnet-a created (10s) [0m
[0;32m✅  +  aws:ec2:Subnet subnet-b created (10s) [0m
[0;36m   +  aws:ec2:RouteTableAssociation subnet-a-route-association creating (0s) [0m
[0;36m   +  aws:ec2:RouteTableAssociation subnet-b-route-association creating (0s) [0m
[0;34m@ updating....[0m
[0;32m✅  +  aws:ec2:RouteTableAssociation subnet-a-route-association created (0.03s) [0m
[0;32m✅  +  aws:ec2:RouteTableAssociation subnet-b-route-association created (0.03s) [0m
[0;32m✅  +  pulumi:pulumi:Stack TapStack-TapStackprdev created (21s) [0m
[0;36m📋 Outputs:[0m
[0;36m      bucketName      : "prod-infrastructure-bucket-tapstackprdev"[0m
[0;36m      iamRoleArn      : "arn:aws:iam::000000000000:role/ec2-s3-role-2e42e4c"[0m
[0;36m      instanceId      : "skipped-for-localstack"[0m
[0;36m      instancePublicIp: "N/A"[0m
[0;36m      securityGroupId : "sg-e28fafd60da1f75be"[0m
[0;36m      subnetAId       : "subnet-7c4f78666bd0d8529"[0m
[0;36m      subnetBId       : "subnet-73a6fb1dd7bf06f2f"[0m
[0;36m      vpcId           : "vpc-b6a51d96df8da59ba"[0m
[0;34m[0m
[0;36m  Resources:[0m
[0;32m✅     + 18 created[0m
[0;34m[0m
[0;36m  Duration: 25s[0m
[0;34m[0m
[0;32m✅ Pulumi deployment completed[0m
[0;32m⏱️  Total deployment time: 38s[0m
[1;33m📊 Generating stack outputs...[0m
[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json[0m
[0;34m📋 Stack Outputs:[0m
  • bucketName: prod-infrastructure-bucket-tapstackprdev
  • iamRoleArn: arn:aws:iam::000000000000:role/ec2-s3-role-2e42e4c
  • instanceId: skipped-for-localstack
  • instancePublicIp: N/A
  • securityGroupId: sg-e28fafd60da1f75be
  • subnetAId: subnet-7c4f78666bd0d8529
  • subnetBId: subnet-73a6fb1dd7bf06f2f
  • vpcId: vpc-b6a51d96df8da59ba
[0;36m🎯 Deployment Summary:[0m
[0;34m  • Stack: TapStackprdev[0m
[0;34m  • Resources: ~18 deployed[0m
[0;34m  • Duration: 38s[0m
[0;34m  • LocalStack: http://localhost:4566[0m
[0;32m🎉 Pulumi deployment to LocalStack completed successfully![0m
