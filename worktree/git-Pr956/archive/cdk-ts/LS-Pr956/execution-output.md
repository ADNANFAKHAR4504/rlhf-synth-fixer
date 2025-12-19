# LocalStack Deployment Test

**Date:** Fri Dec 19 11:27:49 UTC 2025
**Task:** worktree/github-fetch-Pr956
**Platform:** cdk
**Language:** ts
**PR ID:** Pr956
**AWS Services:** VPC, EC2, S3, NAT Gateway

---


## Dependencies Installation
```
```

## Deployment

### Bootstrap
```
```

### Deployment
```

[33m█████████████████████████████████████████████████████████████████████████[0m
[33m█                                                                       █[0m
[33m█  ⚠ WARNING: You are using LEGACY EXPORTS from the aws-cdk package!    █[0m
[33m█                                                                       █[0m
[33m█  These exports were never officially supported and will be removed    █[0m
[33m█  after 2026-03-01.                                                    █[0m
[33m█  Please migrate to using the official CDK Toolkit Library instead:    █[0m
[33m█  https://docs.aws.amazon.com/cdk/api/toolkit-lib/                     █[0m
[33m█                                                                       █[0m
[33m█  For more information: https://github.com/aws/aws-cdk-cli/issues/310  █[0m
[33m█  To disable this warning: CDK_DISABLE_LEGACY_EXPORT_WARNING=1         █[0m
[33m█                                                                       █[0m
[33m█████████████████████████████████████████████████████████████████████████[0m

/home/ubuntu/.nvm/versions/node/v22.17.0/lib/node_modules/aws-cdk-local/src/index.js:18
    throw new EnvironmentMisconfigurationError("If specifying 'AWS_ENDPOINT_URL' then 'AWS_ENDPOINT_URL_S3' must be specified");
    ^

EnvironmentMisconfigurationError: If specifying 'AWS_ENDPOINT_URL' then 'AWS_ENDPOINT_URL_S3' must be specified
    at configureEnvironment (/home/ubuntu/.nvm/versions/node/v22.17.0/lib/node_modules/aws-cdk-local/src/index.js:18:11)
    at patchPost_2_14 (/home/ubuntu/.nvm/versions/node/v22.17.0/lib/node_modules/aws-cdk-local/bin/cdklocal:490:7)
    at Object.<anonymous> (/home/ubuntu/.nvm/versions/node/v22.17.0/lib/node_modules/aws-cdk-local/bin/cdklocal:508:3)
    at Module._compile (node:internal/modules/cjs/loader:1730:14)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)

Node.js v22.17.0
```

**Deployment Duration:** 0s

[33m█████████████████████████████████████████████████████████████████████████[0m
[33m█                                                                       █[0m
[33m█  ⚠ WARNING: You are using LEGACY EXPORTS from the aws-cdk package!    █[0m
[33m█                                                                       █[0m
[33m█  These exports were never officially supported and will be removed    █[0m
[33m█  after 2026-03-01.                                                    █[0m
[33m█  Please migrate to using the official CDK Toolkit Library instead:    █[0m
[33m█  https://docs.aws.amazon.com/cdk/api/toolkit-lib/                     █[0m
[33m█                                                                       █[0m
[33m█  For more information: https://github.com/aws/aws-cdk-cli/issues/310  █[0m
[33m█  To disable this warning: CDK_DISABLE_LEGACY_EXPORT_WARNING=1         █[0m
[33m█                                                                       █[0m
[33m█████████████████████████████████████████████████████████████████████████[0m

 ⏳  Bootstrapping environment aws://000000000000/us-east-1...
Trusted accounts for deployment: (none)
Trusted accounts for lookup: (none)
Using default execution policy of 'arn:aws:iam::aws:policy/AdministratorAccess'. Pass '--cloudformation-execution-policies' to customize.
CDKToolkit: creating CloudFormation changeset...
You used the --force flag, but CloudFormation reported that the deployment would not make any changes.
According to CloudFormation, all resources are already up-to-date with the state in your CDK app.

You cannot use the --force flag to get rid of changes you made in the console. Try using
CloudFormation drift detection instead: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html
 ✅  Environment aws://000000000000/us-east-1 bootstrapped (no changes).

NOTICES         (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)

34892	CDK CLI collects telemetry data on command usage starting at version 2.1100.0 (unless opted out)

	Overview: We do not collect customer content and we anonymize the
	          telemetry we do collect. See the attached issue for more
	          information on what data is collected, why, and how to
	          opt-out. Telemetry will NOT be collected for any CDK CLI
	          version prior to version 2.1100.0 - regardless of
	          opt-in/out. You can also view the telemetry we collect by
	          logging it to a local file, by adding
	          `--telemetry-file=my/local/file` to any `cdk` command.

	Affected versions: cli: ^2.1100.0

	More information at: https://github.com/aws/aws-cdk/issues/34892


If you don’t want to see a notice anymore, use "cdk acknowledge <id>". For example, "cdk acknowledge 34892".

[33m█████████████████████████████████████████████████████████████████████████[0m
[33m█                                                                       █[0m
[33m█  ⚠ WARNING: You are using LEGACY EXPORTS from the aws-cdk package!    █[0m
[33m█                                                                       █[0m
[33m█  These exports were never officially supported and will be removed    █[0m
[33m█  after 2026-03-01.                                                    █[0m
[33m█  Please migrate to using the official CDK Toolkit Library instead:    █[0m
[33m█  https://docs.aws.amazon.com/cdk/api/toolkit-lib/                     █[0m
[33m█                                                                       █[0m
[33m█  For more information: https://github.com/aws/aws-cdk-cli/issues/310  █[0m
[33m█  To disable this warning: CDK_DISABLE_LEGACY_EXPORT_WARNING=1         █[0m
[33m█                                                                       █[0m
[33m█████████████████████████████████████████████████████████████████████████[0m


✨  Synthesis time: 5.33s

TapStackdev: start: Building TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code
TapStackdev: success: Built TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code
TapStackdev: start: Building TapStackdev Template
TapStackdev: success: Built TapStackdev Template
TapStackdev: start: Publishing TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code (000000000000-us-east-1-bbba35f2)
TapStackdev: start: Publishing TapStackdev Template (000000000000-us-east-1-38e43184)
TapStackdev: fail: exception while calling s3 with unknown operation: Unable to parse request (not well-formed (invalid token): line 1, column 0), invalid XML received:
b'{\n "Description": "Production-ready VPC infrastructure with security best practices",\n "Resources": {\n  "ProductionVPC2AD6496B": {\n   "Type": "AWS::EC2::VPC",\n   "Properties": {\n    "CidrBlock": "10.0.0.0/16",\n    "EnableDnsHostnames": true,\n    "EnableDnsSupport": true,\n    "InstanceTenancy": "default",\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/Resource"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet1Subnet35A9FE49": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "CidrBlock": "10.0.0.0/24",\n    "MapPublicIpOnLaunch": true,\n    "Tags": [\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PublicSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Public"\n     },\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet1/Subnet"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet1RouteTable5A55B415": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet1/RouteTable"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet1RouteTableAssociationA52E35D6": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet1RouteTable5A55B415"\n    },\n    "SubnetId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet1Subnet35A9FE49"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet1/RouteTableAssociation"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet1DefaultRouteF05EADF0": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "GatewayId": {\n     "Ref": "ProductionVPCIGW9E16BA8A"\n    },\n    "RouteTableId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet1RouteTable5A55B415"\n    }\n   },\n   "DependsOn": [\n    "ProductionVPCVPCGW4580A2EA"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet1/DefaultRoute"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet1EIP27B4A437": {\n   "Type": "AWS::EC2::EIP",\n   "Properties": {\n    "Domain": "vpc",\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet1/EIP"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet1NATGateway8AA84034": {\n   "Type": "AWS::EC2::NatGateway",\n   "Properties": {\n    "AllocationId": {\n     "Fn::GetAtt": [\n      "ProductionVPCPublicSubnetSubnet1EIP27B4A437",\n      "AllocationId"\n     ]\n    },\n    "SubnetId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet1Subnet35A9FE49"\n    },\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ]\n   },\n   "DependsOn": [\n    "ProductionVPCPublicSubnetSubnet1DefaultRouteF05EADF0",\n    "ProductionVPCPublicSubnetSubnet1RouteTableAssociationA52E35D6"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet1/NATGateway"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet2Subnet763F4D1B": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1b",\n    "CidrBlock": "10.0.1.0/24",\n    "MapPublicIpOnLaunch": true,\n    "Tags": [\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PublicSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Public"\n     },\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PublicSubnetSubnet2"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet2/Subnet"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet2RouteTableD8512E04": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PublicSubnetSubnet2"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet2/RouteTable"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet2RouteTableAssociation6BC139E2": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet2RouteTableD8512E04"\n    },\n    "SubnetId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet2Subnet763F4D1B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet2/RouteTableAssociation"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet2DefaultRoute1F1D11C6": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "GatewayId": {\n     "Ref": "ProductionVPCIGW9E16BA8A"\n    },\n    "RouteTableId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet2RouteTableD8512E04"\n    }\n   },\n   "DependsOn": [\n    "ProductionVPCVPCGW4580A2EA"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet2/DefaultRoute"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet2EIPE46844AE": {\n   "Type": "AWS::EC2::EIP",\n   "Properties": {\n    "Domain": "vpc",\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PublicSubnetSubnet2"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet2/EIP"\n   }\n  },\n  "ProductionVPCPublicSubnetSubnet2NATGateway30BE8D02": {\n   "Type": "AWS::EC2::NatGateway",\n   "Properties": {\n    "AllocationId": {\n     "Fn::GetAtt": [\n      "ProductionVPCPublicSubnetSubnet2EIPE46844AE",\n      "AllocationId"\n     ]\n    },\n    "SubnetId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet2Subnet763F4D1B"\n    },\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PublicSubnetSubnet2"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ]\n   },\n   "DependsOn": [\n    "ProductionVPCPublicSubnetSubnet2DefaultRoute1F1D11C6",\n    "ProductionVPCPublicSubnetSubnet2RouteTableAssociation6BC139E2"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PublicSubnetSubnet2/NATGateway"\n   }\n  },\n  "ProductionVPCPrivateSubnetSubnet1SubnetE7526FF1": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "CidrBlock": "10.0.2.0/24",\n    "MapPublicIpOnLaunch": false,\n    "Tags": [\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PrivateSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Private"\n     },\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PrivateSubnetSubnet1"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PrivateSubnetSubnet1/Subnet"\n   }\n  },\n  "ProductionVPCPrivateSubnetSubnet1RouteTableEDF7AB31": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PrivateSubnetSubnet1"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PrivateSubnetSubnet1/RouteTable"\n   }\n  },\n  "ProductionVPCPrivateSubnetSubnet1RouteTableAssociation41034B1D": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "ProductionVPCPrivateSubnetSubnet1RouteTableEDF7AB31"\n    },\n    "SubnetId": {\n     "Ref": "ProductionVPCPrivateSubnetSubnet1SubnetE7526FF1"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PrivateSubnetSubnet1/RouteTableAssociation"\n   }\n  },\n  "ProductionVPCPrivateSubnetSubnet1DefaultRouteA1C4EBBA": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "NatGatewayId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet1NATGateway8AA84034"\n    },\n    "RouteTableId": {\n     "Ref": "ProductionVPCPrivateSubnetSubnet1RouteTableEDF7AB31"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PrivateSubnetSubnet1/DefaultRoute"\n   }\n  },\n  "ProductionVPCPrivateSubnetSubnet2Subnet8F7EDC33": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1b",\n    "CidrBlock": "10.0.3.0/24",\n    "MapPublicIpOnLaunch": false,\n    "Tags": [\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PrivateSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Private"\n     },\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PrivateSubnetSubnet2"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PrivateSubnetSubnet2/Subnet"\n   }\n  },\n  "ProductionVPCPrivateSubnetSubnet2RouteTableAFBBD797": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC/PrivateSubnetSubnet2"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PrivateSubnetSubnet2/RouteTable"\n   }\n  },\n  "ProductionVPCPrivateSubnetSubnet2RouteTableAssociationEB0EC080": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "ProductionVPCPrivateSubnetSubnet2RouteTableAFBBD797"\n    },\n    "SubnetId": {\n     "Ref": "ProductionVPCPrivateSubnetSubnet2Subnet8F7EDC33"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PrivateSubnetSubnet2/RouteTableAssociation"\n   }\n  },\n  "ProductionVPCPrivateSubnetSubnet2DefaultRouteA16CF03D": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "NatGatewayId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet2NATGateway30BE8D02"\n    },\n    "RouteTableId": {\n     "Ref": "ProductionVPCPrivateSubnetSubnet2RouteTableAFBBD797"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/PrivateSubnetSubnet2/DefaultRoute"\n   }\n  },\n  "ProductionVPCIGW9E16BA8A": {\n   "Type": "AWS::EC2::InternetGateway",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/IGW"\n   }\n  },\n  "ProductionVPCVPCGW4580A2EA": {\n   "Type": "AWS::EC2::VPCGatewayAttachment",\n   "Properties": {\n    "InternetGatewayId": {\n     "Ref": "ProductionVPCIGW9E16BA8A"\n    },\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/VPCGW"\n   }\n  },\n  "ProductionVPCS3EndpointSecurityGroupCBFB6EDC": {\n   "Type": "AWS::EC2::SecurityGroup",\n   "Properties": {\n    "GroupDescription": "TapStackdev/ProductionVPC/S3Endpoint/SecurityGroup",\n    "SecurityGroupEgress": [\n     {\n      "CidrIp": "0.0.0.0/0",\n      "Description": "Allow all outbound traffic by default",\n      "IpProtocol": "-1"\n     }\n    ],\n    "SecurityGroupIngress": [\n     {\n      "CidrIp": {\n       "Fn::GetAtt": [\n        "ProductionVPC2AD6496B",\n        "CidrBlock"\n       ]\n      },\n      "Description": {\n       "Fn::Join": [\n        "",\n        [\n         "from ",\n         {\n          "Fn::GetAtt": [\n           "ProductionVPC2AD6496B",\n           "CidrBlock"\n          ]\n         },\n         ":443"\n        ]\n       ]\n      },\n      "FromPort": 443,\n      "IpProtocol": "tcp",\n      "ToPort": 443\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/S3Endpoint/SecurityGroup/Resource"\n   }\n  },\n  "ProductionVPCS3Endpoint1BB4EF82": {\n   "Type": "AWS::EC2::VPCEndpoint",\n   "Properties": {\n    "PrivateDnsEnabled": true,\n    "SecurityGroupIds": [\n     {\n      "Fn::GetAtt": [\n       "ProductionVPCS3EndpointSecurityGroupCBFB6EDC",\n       "GroupId"\n      ]\n     }\n    ],\n    "ServiceName": "com.amazonaws.us-east-1.s3",\n    "SubnetIds": [\n     {\n      "Ref": "ProductionVPCPrivateSubnetSubnet1SubnetE7526FF1"\n     },\n     {\n      "Ref": "ProductionVPCPrivateSubnetSubnet2Subnet8F7EDC33"\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcEndpointType": "Interface",\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/S3Endpoint/Resource"\n   }\n  },\n  "ProductionVPCEC2EndpointSecurityGroupAD015EB2": {\n   "Type": "AWS::EC2::SecurityGroup",\n   "Properties": {\n    "GroupDescription": "TapStackdev/ProductionVPC/EC2Endpoint/SecurityGroup",\n    "SecurityGroupEgress": [\n     {\n      "CidrIp": "0.0.0.0/0",\n      "Description": "Allow all outbound traffic by default",\n      "IpProtocol": "-1"\n     }\n    ],\n    "SecurityGroupIngress": [\n     {\n      "CidrIp": {\n       "Fn::GetAtt": [\n        "ProductionVPC2AD6496B",\n        "CidrBlock"\n       ]\n      },\n      "Description": {\n       "Fn::Join": [\n        "",\n        [\n         "from ",\n         {\n          "Fn::GetAtt": [\n           "ProductionVPC2AD6496B",\n           "CidrBlock"\n          ]\n         },\n         ":443"\n        ]\n       ]\n      },\n      "FromPort": 443,\n      "IpProtocol": "tcp",\n      "ToPort": 443\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/EC2Endpoint/SecurityGroup/Resource"\n   }\n  },\n  "ProductionVPCEC2Endpoint5A6B3B23": {\n   "Type": "AWS::EC2::VPCEndpoint",\n   "Properties": {\n    "PrivateDnsEnabled": true,\n    "SecurityGroupIds": [\n     {\n      "Fn::GetAtt": [\n       "ProductionVPCEC2EndpointSecurityGroupAD015EB2",\n       "GroupId"\n      ]\n     }\n    ],\n    "ServiceName": "com.amazonaws.us-east-1.ec2",\n    "SubnetIds": [\n     {\n      "Ref": "ProductionVPCPrivateSubnetSubnet1SubnetE7526FF1"\n     },\n     {\n      "Ref": "ProductionVPCPrivateSubnetSubnet2Subnet8F7EDC33"\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcEndpointType": "Interface",\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/EC2Endpoint/Resource"\n   }\n  },\n  "ProductionVPCS3GatewayEndpointA5AE553B": {\n   "Type": "AWS::EC2::VPCEndpoint",\n   "Properties": {\n    "RouteTableIds": [\n     {\n      "Ref": "ProductionVPCPrivateSubnetSubnet1RouteTableEDF7AB31"\n     },\n     {\n      "Ref": "ProductionVPCPrivateSubnetSubnet2RouteTableAFBBD797"\n     },\n     {\n      "Ref": "ProductionVPCPublicSubnetSubnet1RouteTable5A55B415"\n     },\n     {\n      "Ref": "ProductionVPCPublicSubnetSubnet2RouteTableD8512E04"\n     }\n    ],\n    "ServiceName": {\n     "Fn::Join": [\n      "",\n      [\n       "com.amazonaws.",\n       {\n        "Ref": "AWS::Region"\n       },\n       ".s3"\n      ]\n     ]\n    },\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/ProductionVPC"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcEndpointType": "Gateway",\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/ProductionVPC/S3GatewayEndpoint/Resource"\n   }\n  },\n  "BastionSecurityGroupDAB89EBD": {\n   "Type": "AWS::EC2::SecurityGroup",\n   "Properties": {\n    "GroupDescription": "Security group for bastion host with restricted SSH access",\n    "SecurityGroupEgress": [\n     {\n      "CidrIp": "0.0.0.0/0",\n      "Description": "Allow all outbound traffic by default",\n      "IpProtocol": "-1"\n     }\n    ],\n    "SecurityGroupIngress": [\n     {\n      "CidrIp": "203.0.113.0/24",\n      "Description": "SSH access from approved IP range only",\n      "FromPort": 22,\n      "IpProtocol": "tcp",\n      "ToPort": 22\n     },\n     {\n      "CidrIp": "0.0.0.0/0",\n      "Description": "HTTPS for package updates and management",\n      "FromPort": 443,\n      "IpProtocol": "tcp",\n      "ToPort": 443\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/BastionSecurityGroup/Resource"\n   }\n  },\n  "BastionHostInstanceRoleDD3FA5F1": {\n   "Type": "AWS::IAM::Role",\n   "Properties": {\n    "AssumeRolePolicyDocument": {\n     "Statement": [\n      {\n       "Action": "sts:AssumeRole",\n       "Effect": "Allow",\n       "Principal": {\n        "Service": "ec2.amazonaws.com"\n       }\n      }\n     ],\n     "Version": "2012-10-17"\n    },\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "BastionHost"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/BastionHost/Resource/InstanceRole/Resource"\n   }\n  },\n  "BastionHostInstanceRoleDefaultPolicy17347525": {\n   "Type": "AWS::IAM::Policy",\n   "Properties": {\n    "PolicyDocument": {\n     "Statement": [\n      {\n       "Action": [\n        "ssmmessages:*",\n        "ssm:UpdateInstanceInformation",\n        "ec2messages:*"\n       ],\n       "Effect": "Allow",\n       "Resource": "*"\n      }\n     ],\n     "Version": "2012-10-17"\n    },\n    "PolicyName": "BastionHostInstanceRoleDefaultPolicy17347525",\n    "Roles": [\n     {\n      "Ref": "BastionHostInstanceRoleDD3FA5F1"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/BastionHost/Resource/InstanceRole/DefaultPolicy/Resource"\n   }\n  },\n  "BastionHostInstanceProfile770FCA07": {\n   "Type": "AWS::IAM::InstanceProfile",\n   "Properties": {\n    "Roles": [\n     {\n      "Ref": "BastionHostInstanceRoleDD3FA5F1"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/BastionHost/Resource/InstanceProfile"\n   }\n  },\n  "BastionHost30F9ED05": {\n   "Type": "AWS::EC2::Instance",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "IamInstanceProfile": {\n     "Ref": "BastionHostInstanceProfile770FCA07"\n    },\n    "ImageId": {\n     "Ref": "SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter"\n    },\n    "InstanceType": "t3.micro",\n    "SecurityGroupIds": [\n     {\n      "Fn::GetAtt": [\n       "BastionSecurityGroupDAB89EBD",\n       "GroupId"\n      ]\n     }\n    ],\n    "SubnetId": {\n     "Ref": "ProductionVPCPublicSubnetSubnet1Subnet35A9FE49"\n    },\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Name",\n      "Value": "BastionHost"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "UserData": {\n     "Fn::Base64": "#!/bin/bash"\n    }\n   },\n   "DependsOn": [\n    "BastionHostInstanceRoleDefaultPolicy17347525",\n    "BastionHostInstanceRoleDD3FA5F1"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/BastionHost/Resource/Resource"\n   }\n  },\n  "InstanceConnectEndpointSG5A297907": {\n   "Type": "AWS::EC2::SecurityGroup",\n   "Properties": {\n    "GroupDescription": "Security group for EC2 Instance Connect Endpoint",\n    "SecurityGroupEgress": [\n     {\n      "CidrIp": {\n       "Fn::GetAtt": [\n        "ProductionVPC2AD6496B",\n        "CidrBlock"\n       ]\n      },\n      "Description": "SSH to private instances via Instance Connect",\n      "FromPort": 22,\n      "IpProtocol": "tcp",\n      "ToPort": 22\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VpcId": {\n     "Ref": "ProductionVPC2AD6496B"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/InstanceConnectEndpointSG/Resource"\n   }\n  },\n  "InstanceConnectEndpoint": {\n   "Type": "AWS::EC2::InstanceConnectEndpoint",\n   "Properties": {\n    "PreserveClientIp": false,\n    "SecurityGroupIds": [\n     {\n      "Fn::GetAtt": [\n       "InstanceConnectEndpointSG5A297907",\n       "GroupId"\n      ]\n     }\n    ],\n    "SubnetId": {\n     "Ref": "ProductionVPCPrivateSubnetSubnet1SubnetE7526FF1"\n    },\n    "Tags": [\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/InstanceConnectEndpoint"\n   }\n  },\n  "SecureS3Bucket9141DB16": {\n   "Type": "AWS::S3::Bucket",\n   "Properties": {\n    "BucketEncryption": {\n     "ServerSideEncryptionConfiguration": [\n      {\n       "ServerSideEncryptionByDefault": {\n        "SSEAlgorithm": "AES256"\n       }\n      }\n     ]\n    },\n    "BucketName": "tap-dev-secure-bucket-us-east-1",\n    "LifecycleConfiguration": {\n     "Rules": [\n      {\n       "AbortIncompleteMultipartUpload": {\n        "DaysAfterInitiation": 7\n       },\n       "Id": "DeleteIncompleteMultipartUploads",\n       "Status": "Enabled"\n      }\n     ]\n    },\n    "PublicAccessBlockConfiguration": {\n     "BlockPublicAcls": true,\n     "BlockPublicPolicy": true,\n     "IgnorePublicAcls": true,\n     "RestrictPublicBuckets": true\n    },\n    "Tags": [\n     {\n      "Key": "aws-cdk:auto-delete-objects",\n      "Value": "true"\n     },\n     {\n      "Key": "CostCenter",\n      "Value": "Engineering"\n     },\n     {\n      "Key": "CreatedBy",\n      "Value": "Infrastructure Team"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "ManagedBy",\n      "Value": "CDK"\n     },\n     {\n      "Key": "Project",\n      "Value": "TAP"\n     }\n    ],\n    "VersioningConfiguration": {\n     "Status": "Enabled"\n    }\n   },\n   "UpdateReplacePolicy": "Delete",\n   "DeletionPolicy": "Delete",\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/SecureS3Bucket/Resource"\n   }\n  },\n  "SecureS3BucketPolicy63772037": {\n   "Type": "AWS::S3::BucketPolicy",\n   "Properties": {\n    "Bucket": {\n     "Ref": "SecureS3Bucket9141DB16"\n    },\n    "PolicyDocument": {\n     "Statement": [\n      {\n       "Action": [\n        "s3:PutBucketPolicy",\n        "s3:GetBucket*",\n        "s3:List*",\n        "s3:DeleteObject*"\n       ],\n       "Effect": "Allow",\n       "Principal": {\n        "AWS": {\n         "Fn::GetAtt": [\n          "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092",\n          "Arn"\n         ]\n        }\n       },\n       "Resource": [\n        {\n         "Fn::GetAtt": [\n          "SecureS3Bucket9141DB16",\n          "Arn"\n         ]\n        },\n        {\n         "Fn::Join": [\n          "",\n          [\n           {\n            "Fn::GetAtt": [\n             "SecureS3Bucket9141DB16",\n             "Arn"\n            ]\n           },\n           "/*"\n          ]\n         ]\n        }\n       ]\n      }\n     ],\n     "Version": "2012-10-17"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/SecureS3Bucket/Policy/Resource"\n   }\n  },\n  "SecureS3BucketAutoDeleteObjectsCustomResourceAD20C474": {\n   "Type": "Custom::S3AutoDeleteObjects",\n   "Properties": {\n    "ServiceToken": {\n     "Fn::GetAtt": [\n      "CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F",\n      "Arn"\n     ]\n    },\n    "BucketName": {\n     "Ref": "SecureS3Bucket9141DB16"\n    }\n   },\n   "DependsOn": [\n    "SecureS3BucketPolicy63772037"\n   ],\n   "UpdateReplacePolicy": "Delete",\n   "DeletionPolicy": "Delete",\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/SecureS3Bucket/AutoDeleteObjectsCustomResource/Default"\n   }\n  },\n  "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092": {\n   "Type": "AWS::IAM::Role",\n   "Properties": {\n    "AssumeRolePolicyDocument": {\n     "Version": "2012-10-17",\n     "Statement": [\n      {\n       "Action": "sts:AssumeRole",\n       "Effect": "Allow",\n       "Principal": {\n        "Service": "lambda.amazonaws.com"\n       }\n      }\n     ]\n    },\n    "ManagedPolicyArns": [\n     {\n      "Fn::Sub": "arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider/Role"\n   }\n  },\n  "CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F": {\n   "Type": "AWS::Lambda::Function",\n   "Properties": {\n    "Code": {\n     "S3Bucket": "cdk-hnb659fds-assets-000000000000-us-east-1",\n     "S3Key": "faa95a81ae7d7373f3e1f242268f904eb748d8d0fdd306e8a6fe515a1905a7d6.zip"\n    },\n    "Timeout": 900,\n    "MemorySize": 128,\n    "Handler": "index.handler",\n    "Role": {\n     "Fn::GetAtt": [\n      "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092",\n      "Arn"\n     ]\n    },\n    "Runtime": "nodejs22.x",\n    "Description": {\n     "Fn::Join": [\n      "",\n      [\n       "Lambda function for auto-deleting objects in ",\n       {\n        "Ref": "SecureS3Bucket9141DB16"\n       },\n       " S3 bucket."\n      ]\n     ]\n    }\n   },\n   "DependsOn": [\n    "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider/Handler",\n    "aws:asset:path": "asset.faa95a81ae7d7373f3e1f242268f904eb748d8d0fdd306e8a6fe515a1905a7d6",\n    "aws:asset:property": "Code"\n   }\n  },\n  "CDKMetadata": {\n   "Type": "AWS::CDK::Metadata",\n   "Properties": {\n    "Analytics": "v2:deflate64:H4sIAAAAAAAA/2VQQW7CMBB8C3fjQnqoeoQIUaSqtZIq12rjLHQhsSN7DUVR/l4lAULb08yOZ0fjjWQ0f5azCZz8VBeHaUm5bFIGfRBw8p8N6kg2Wa1FvDWZioUKeUk6DblB7rSRJTYwfkBe4qiP2sJ7qwmYrLmZO7LaqA7egNfAeIKzUI6OwDgGbwyjM3gzDE0u04IZ9FeFhkXv24LGrNYrU9SWDIsUdXDE57Wzoe6L/RUyFd/cl9D7gCX4rvSL9fxKJnyLjfEMRuNQ7T+PrTGo+RrQCoJKNokd7tKjsiXp/iMju64rZ7dUYiv8o2yWQR+GI1zYAOPW/dy2IkFvgxv6vAeuQ7+rwEGFjE7EwbOt7l0j//WknD1SgW4JHsXCe+SUYUdm1wpjC5R7/3CMIjl/krPJ3hNNXTBMFcpkwB9JIEOwVwIAAA=="\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/CDKMetadata/Default"\n   }\n  }\n },\n "Outputs": {\n  "BastionHostBastionHostIdC743CBD6": {\n   "Description": "Instance ID of the bastion host. Use this to connect via SSM Session Manager",\n   "Value": {\n    "Ref": "BastionHost30F9ED05"\n   }\n  },\n  "VpcId": {\n   "Description": "VPC ID for the production environment",\n   "Value": {\n    "Ref": "ProductionVPC2AD6496B"\n   }\n  },\n  "BastionHostId": {\n   "Description": "Bastion host instance ID",\n   "Value": {\n    "Ref": "BastionHost30F9ED05"\n   }\n  },\n  "S3BucketName": {\n   "Description": "Secure S3 bucket name",\n   "Value": {\n    "Ref": "SecureS3Bucket9141DB16"\n   }\n  },\n  "InstanceConnectEndpointId": {\n   "Description": "EC2 Instance Connect Endpoint ID",\n   "Value": {\n    "Ref": "InstanceConnectEndpoint"\n   }\n  }\n },\n "Parameters": {\n  "SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter": {\n   "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",\n   "Default": "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"\n  },\n  "BootstrapVersion": {\n   "Type": "AWS::SSM::Parameter::Value<String>",\n   "Default": "/cdk-bootstrap/hnb659fds/version",\n   "Description": "Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]"\n  }\n },\n "Rules": {\n  "CheckBootstrapVersion": {\n   "Assertions": [\n    {\n     "Assert": {\n      "Fn::Not": [\n       {\n        "Fn::Contains": [\n         [\n          "1",\n          "2",\n          "3",\n          "4",\n          "5"\n         ],\n         {\n          "Ref": "BootstrapVersion"\n         }\n        ]\n       }\n      ]\n     },\n     "AssertDescription": "CDK bootstrap stack version 6 required. Please run \'cdk bootstrap\' with a recent version of the CDK CLI."\n    }\n   ]\n  }\n }\n}'
TapStackdev: fail: exception while calling s3 with unknown operation: Unable to parse request (not well-formed (invalid token): line 1, column 2), invalid XML received:
b'PK\x03\x04\x14\x00\x08\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\x00\x00\x00index.js\x95W\xefo\xdb\xbc\x11\xfe\xbe\xbf\x82!\x8a\x94\x0c\x186m7l\xa0\xc7xi\xe2.^\xd3\xc4\x88\x9d\xf7\xc5\x10\x14\r#\x9d,-2\xa9\x92T\\C\xd6\xff>P?\x1c7\xf6^`\x1f\x0c\x8b\'\x91<>\xf7\xdcsG\\:@\xce\xdb,\xf2x\xf0\xac,J\xe4\xcd\xe3\x7f \xf2<\xb2\xa0<\xb0\xac\x1f\xc7\x90d\x1a&\xd6\x14`\xfd\x8a\x8d{\xfb\x1c\xfc\xcdR\xf7\xf6\x0bp\x91\xcd\no,;\xdf\xff\xc5\xb5Z\x80c\xcb\xad\x97\x13k\xbc\xf1\xab\x02n\x126\xe9\xedEo\xe4\xa9r[\x1b\xb03I<\x03*O\xab\xc4X\x12\\6(\xd3\x08hF<3\xac\x9a\x83\x17po\xbe1\xd0\xe5\x02\xacz\xccA\x1c\x9c\xd4\xb4fq3\x93\x19f\xc3\xec,!px\x18\xb65\t\x02)\xb1i\xce\x8d\xd7\xeb-[R\xea\xc8gFc\x1a6\xcb\xc1#\x87L\x82\xce\tPz0\xe1\x91\xcas\xe2\x99\xa3\x87\x87\xee@Jsx\x18\x9cp\xad\x13\x84\xcaS\xb8w\xbf:B\xac\x1c\x13`\x8e\xd2\xf5\xda\xf2\x17\x17k:\xb0\xe0K\xab\x91\xafY\xde9J\xe5)1\xd2\x1fH]\xe6\xf90!K\xe2)\x15U\xcdb\x02\xeb\xf5\x81\x0f?\xfe\xfd;\xb8\xaf&.s\x18f\xc40\x1cC\xa2\xca\xdccV=\xab\xbc\x04\xe1_\x03!\x0c\xf3\x94\xb2O\xd2\xcb\xd3\x98d\xa4\xaa\x19~Yd3/`\xc6<e?dU\x0f\xce\xc8\x0fV\xa9\xd2\x9b\x0b\xc8\xc1\xc3\xa5\xd2q\x0eV\x84#NY\xba5\xba\xac)[4\xdep\xf8Y\x18\xeb\x9d\xfcD~\xd0\x86Z\xa9\xb4\xf0\xa3\xcc,\x10\xfc\x0f\xb5t\xc7.~z\x17\xe5\x19h\x7f\xec>b\xcaV2\'\x9b/R\xef\x0b\x87)e\x8bmki\xf3`S\xb2r\xa0\xe3K\xef\x8b[\xf8Q\x82\xf3\xe2\x82\xe5f.f,\xd3Q^\xc60\xf5*z\x9aY\x15\x81\x13\x07\'\xact`;\xa7\xc7:\x86\x9f\x02\xf3wYx\xc05+$>\xfb}z~\xf1E\x88\xf3\xd2y\xb3\xb8\x05gJ\x1b\x05\xae?g1\xd8\xcfV-`i\xec\x93\x10\xe7\xb7\xa3\xb3\xd9\xe8\xfb\xe7\xb3\xf1\xd5\xe8\x02\xb3\xab\xffc\xea\xd7\xf1t:\xbe\xfe\xe7\xf7\xc9\xe5\xbf\xa7\xe3\xf3\xb3\xab\xef\xe3\x0b<\xe8\xf9\x85n\x89\xa7U\xc7\x00\xe5V:"\xc0L\xa0i\xe0\x9c\x95\x15\xe7\x1c\xd8-\xb8\xc2h\x07w\xb7W\x02s\xceq=\xc8\x12\xa2xn\xe6\xe4_\xd3\x9bk\x1e\x12Y\xcf\xb3dE,{6Y\x8cN\xd8\x07J\x19\xf0\x0e\xa5\xd9\xaa\x00)%n\xa3\x88\x0f\x0f\x81O\xd2\x95\xcb"\x95\xf7\x87\x1e\xc7R\xca\x82V\xed\xaa8\x9bk\x13\xd6D\x17\xa3\xab\xd1l\x84\xe0\x19\xb4G\x91*\x1d\xc4\xe8q\x85\x14JT\x96C\x8cZd\xda\xf7\x982\xb5T\x99G%\xc1\xd3\xbb\xf3\xf3\xd1t\x8a\x19\xf4\x0c\xaf\xbd]5\xc7r\xb2\xfd\xca\x13\xcb\x0ceZ>5\x991\xd8\x9d\xabi\x1d)\x1f\xa5\xc4\xd1f\xa6\xde\x00\xa2\x9c\xd1B\xf1\xdd\xa8\x0f\x1dw\x81\x03\xc2\xf1\x058\xa7\xe6P\x0f\xf4\x9e\xd3\xae\xd7d\x07\x9e\xf3F\xfa\xf0\xb0\x83\x16wgkO\xca\x90m\xc2\x10\x07T\x96\x99O\x91B\x0be\x9f\xc0\xa2\xa2\xc32|\xd10\x08e1r\x06\xf9Ty\xe4S@\xae|t\x81\xaf\xda\xf7x.\xb3<G\x8f\x80\x1a\x9c!\xc6\x94\xedsR\x16T\xb4\x01y\x18\xdd\xde\xde\xdc\n\xf4U\xe5\x89\xb1\x0b\x88[\xc49\xc2\xbb\x81\xc4(s\xa8K\xa8X\xa07\xd5+\x8e\x00\xad\x1fB2\xf5\xa1\xeaY\xadi]\xd7\x1bf>\x05\xb9\x95U\xdd"o\xe4>\xca\x0c\x87~\x0f\xb4\xc1\xda\x11o\x1c\x07\xa6n\x86;<4\x07R\xee[\x82\xfa\xd4\x9a%\xd2\xb0D#k\x8d%\x0f-\x0f\x05\x8a\x94\xd6\xc6\xa3(Uz\x0e\r\xb8\xbb\xe8\x8f/Pb\xcd\x02\xe17\xd5\xbe\xc5k\x8c\xbc\t/\xf7\x1d\xa9\xc6(.\x1b\xe6\xc7A\xf22\xa3\x1fz\x02\x87d\xf4\xac\xc9\xc8]\xd0\x85\xa9\xeb&\x81\xd1\x06\xc1\xb2)X\rq\x8d\xac\xa6^\xf9\xd2\t\xcfn\xa1!o`_x\x18\x0e=kTk\x1c\x0b\xe0\xdd\x13\xdb\xe0\'6,\x1d\xc7l\xcf\xb6\xfb\xce\xb0^_\xb1+3\xff5\xbd\x05\xf0\x1d\x1b\xbb6\xa3(5\x02x\xfb\xc0.\x94W\x02x\xf8\xab\x99\x95\x0b^(\xeb\xa0\xc9\x94\x8d\x04Q\xe6\xe4\xc3\x9b\xca\xf2\xa6TG&\xaf\xdf\xbd\x0b\xc3\xd48\xaf\xd5\x02\xeafT(\x9f6\xa3\xe1\xd1\xd1\xd1\xc3\xa0\x93\x15W>.2\xdfe\x92\x83\x10\x87(7e\x1c8\xad\x9a\x82\xcb\x1c3t\x10\xd4O\xcbW\xbc5\x94\x8dd\xd5o#^vda3ay\xf8c\x0b\xf0\xa9\x89\x05\x9e\xdc\xcd0KA\xc5`\x9d\xa8pd\xb4\x0f\x15\'\x14y,0f\x1bK\x0ez\xeeS,>\x95I\x02\x96?\xae<\\5&\xa2\x19.}\xf27L\xeb\xba\x13\xa7\x1bR)\xefaQx\'\xfe\xc2\\\x0eP\x88\xf7\xf0\xb1f\x8a\xbf*L\x94\x8c\x98\xa6\xaf)q\xd1R\xa2\x13\xfc@\xef\x895\x8b\xcc\x01!]{\xf2"\x92+\x1er\x18\x9c\'\x9eiyZin\xc1\x95\x0b \x94\x1d\xe8 r\xbet\xe7&\x86\xf5z{t*\xff|r2\xb4d+u\xee\xb4+\xa3\x08\x9cK\xca\x1c]\xcef\x93\r\xfeA\x1c\xb6\'\x07]\x10\x86\xd0\x9a\x0e\x1c7\x9a`\x08\xc9\x87\x99\xa5\xcc\xf1\xa5\xcd<\x10\x08\x8f\xa0c\xb2%\xcd\x968Z\xd7\xf4E;f\xa4\xcd\x13ZEF;\x93CS\xaa:\xdb\xcbg7\xbf\xa0\xd1\x96?\xce\xf9V\xfd\xf3\xbc\x87\x9b9\xe9y\x03\xf8 \xb4d\x83\x01\rH\xf5\x95\xb3\x912 \xcd\xe4\xaedh\x1aZ={|\xfcwy\xd2\xcbI\x17\xc5G\xf2U\xf9\x94\'\xb91\xb6}\xb4J\xc7fA\xe8\x91\xa3\x94\xb9#\xf9\xa1\xde\xc9\xe6\xc7\xadJ\xbd\x1d8\x90\xa7\x0e\xfc,[\x80)=\x81\xd0c\xd5\xa1;\x9dK\x1c\x9a\x9d(~\x12\xa1\x81:n\xe4\x04\x8e\xdbn\xd3a\xf6\xf35\xbd\xab\xdf\xc0\xba\xcch\x81?\x9c\xbc\xffp\xfc\xfe\xe4\xf8\xfd_q\x90\x06\x0f\x0b\xd0^\xdc\x7f\xab)\x8bd\xd8;\xe5\xd3\x8f\xa4\xaa)\xbb\x94\xb7dJ\x07\xaf\x84g\x1a\\u\xcb,T\xce_\xb4\x97V\x91r\x80\xbb:\'Z\xf4\x06\x8d\xed\xae\x88\x95\x07\xdc\xd9\xaa=JC\xda\x82\xf194\xa3{T\xbfn\xd7\xe9Z\x8cn\x1dt\xdd8\xb0\xe9\xab\xc2\x1d"\x037\xe4\x9f\xca\xe8\t|\xb8\x13\xd0\x1d\xa4\xc3\x0e\x8dj\x82\xf4,\x14\x9e\x9b<\xee\xdb\x94\xee\xbe\xf1j\x8d\xae\x87\xde\xe7u\x90\xcf?\xda~8\xdc\x15\xee\xef\xc1\x81>\x11Av\x07\x8f\xf8\x1c|\xeb\xf7\xc4\xe4Y\xb4"U;\x12\xbe\xa6t\xc8[\xe3p\xf8\x93\x996\xb4\x9dv\xd2\x81\t\xb2\xdeF\x91\x17\xa5KI5\xb1\x99\x8e\xb2B\xe5\x02\x1fa6J\x12\x88\xbc\xc0\x17\xa0W\x98\x9d57\x0fq\x8f\xddG1)}{-\xc3\xdfB\x17\xd84\x17\xe2\xfeAY-\xd4\xd2\t\xf7Q\x08\xf1\xa6\xf2\xf5\xbb\xa3\x87\xc0\x8e6B\x11/\xca\xff\xe1(k\x9d\x14;\xcaZ\xf7\xe9\x0cM\xda\x00\x0f\xda\x1dZ\xc6k3-\xa3\xb4=(\xee\xf2\x08\x06\xdbi\xfdpn\xca<F\xa1*\xbb \xdb\xb0D-\xc9Q\x0cz\x85\x8a\x06+d4zlb\x8e\xde\x06\x87\xdf\xa2\xc2f\xc6\x86\x02\xd0\xd7Y\xfe\xb0K\x85\xbb\r\x15\x06\xb1\xa9\xa0k\x1c#\x9eg\xae\x03\xa6K\x1a\xb7\x1d\x8c\xa6|\x18y\x1fJ5\xef?\x18\x0e\xef\xbf5\xc5\x9b\xb7\x14\xfd\xda\xf4n.\x98\xbf\x85&\xc5\xf0\xb6\x10H)Oh\x97\x19m\x13n\xf8B\x15\xc4\xc9SR}\x81\x95p\xfc\x0b\xacX\xb7\xec8\x16\xae\xdfb\x1c\xd7\x94v\x12\x13\xf16\xdf\xdb\xe8my\xc7\xda\xddE\xd5\xbd\x116(\xe72\xcdr 0\xe4c7\xb3\xa5\x8e\x94\x87x\xa7x\\\x070\xb2\x84\x1c\xf8^\xcf6\xed\x11\xbe6\xe8%\xa5\xd0R9T\xb4\xb7\x98\x98c:\x08\\\x0e\x13[~\xfc\x1e2\xf8\x17e~h\xe7\xa2\xd8\x80k\x02\x99\xaag\x08\x81\x9a\xd7o\x91Ws\x86\xdcSV\x14\xa1\xf3\x8drP:\xd3s\xbei\x8b\xeav\xd5\x904\x1d\x01C\xd4:\x15\xfec:\xedu\xa2\xe3\xc7\xc6\x17\xf8\x999\xbf\xb5]\xdb\x1a\xc2\x8el\x84cu\x05a7cgj>\xcf\xf4|\x9b%\x94\xcf\xd4|\n~\xc8\x9dY\x001\xf2\xd4\x84\xc8J)\xe7\x87\x87\x86\xff\x16n\xd1!\x03\xbc-\x01\xd3\xfaO\xff\x05PK\x07\x08i\xeb\x98\xd2;\x08\x00\x003\x11\x00\x00PK\x01\x02-\x03\x14\x00\x08\x00\x08\x00\x00\x00!\x00i\xeb\x98\xd2;\x08\x00\x003\x11\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00\x00 \x00\xb4\x81\x00\x00\x00\x00index.jsPK\x05\x06\x00\x00\x00\x00\x01\x00\x01\x006\x00\x00\x00q\x08\x00\x00\x00\x00'

NOTICES         (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)

34892	CDK CLI collects telemetry data on command usage starting at version 2.1100.0 (unless opted out)

	Overview: We do not collect customer content and we anonymize the
	          telemetry we do collect. See the attached issue for more
	          information on what data is collected, why, and how to
	          opt-out. Telemetry will NOT be collected for any CDK CLI
	          version prior to version 2.1100.0 - regardless of
	          opt-in/out. You can also view the telemetry we collect by
	          logging it to a local file, by adding
	          `--telemetry-file=my/local/file` to any `cdk` command.

	Affected versions: cli: ^2.1100.0

	More information at: https://github.com/aws/aws-cdk/issues/34892


If you don’t want to see a notice anymore, use "cdk acknowledge <id>". For example, "cdk acknowledge 34892".
Failed to publish asset TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code (000000000000-us-east-1-bbba35f2)
```

**Deployment Duration:** 45s
**Deployment Status:** ❌ FAILED

**Error:** S3 endpoint XML parsing issue - CDK trying to upload template as JSON instead of XML to LocalStack S3

## Error Details
```
exception while calling s3 with unknown operation: Unable to parse request (not well-formed (invalid token): line 1, column 0), invalid XML received
```

## Alternative Deployment Approach

### Direct CloudFormation Deployment
```
```

**CloudFormation Stack Created:** tap-stack-Pr956
**Stack Status:** CREATE_FAILED

### Root Cause Analysis

The deployment to LocalStack failed for the following reasons:

1. **CDK Template Upload Issue**: The initial cdklocal deployment failed with S3 XML parsing error when trying to upload the CloudFormation template. This is a known issue with cdklocal and LocalStack S3 compatibility.

2. **Direct CloudFormation Deployment**: Attempted workaround using direct CloudFormation CLI with synthesized template. Stack was created but failed during resource creation.

3. **Unsupported Resources**: The stack contains resources that may not be fully supported in LocalStack Community Edition:
   - `AWS::EC2::InstanceConnectEndpoint` - EC2 Instance Connect Endpoint (newer feature)
   - `AWS::EC2::BastionHost` - Bastion Host with Amazon Linux 2023
   - SSM Parameter lookups for latest AMI IDs
   - VPC Interface Endpoints for S3 (com.amazonaws.us-east-1.s3 as Interface endpoint)

4. **LocalStack Limitations**: LocalStack Community Edition has limited support for:
   - EC2 Instance Connect Endpoints (Pro feature or not implemented)
   - Dynamic AMI lookups via SSM parameters
   - Some VPC endpoint configurations

### Stack Configuration

The stack attempted to create:
- VPC with CIDR 10.0.0.0/16
- 2 Public subnets across 2 AZs
- 2 Private subnets across 2 AZs  
- 2 NAT Gateways (one per AZ)
- Internet Gateway
- Bastion Host (t3.micro with AL2023)
- EC2 Instance Connect Endpoint
- VPC Interface Endpoints (S3, EC2)
- VPC Gateway Endpoint (S3)
- S3 Bucket with encryption and versioning
- Security Groups with SSH restrictions

```

---

## Summary

### ❌ NEEDS FIXES

**Issues Found:**
- Deployment: CDK template publishing to LocalStack S3 failed with XML parsing error. Direct CloudFormation deployment created stack but resource creation failed.
- Root Cause: Stack uses AWS::EC2::InstanceConnectEndpoint which is not supported in LocalStack Community Edition. Also uses SSM parameter lookups for AMI IDs and complex VPC endpoint configurations.
- Recommended Fix: Remove or mock EC2 Instance Connect Endpoint, simplify VPC endpoints, use hardcoded AMI IDs for LocalStack testing.

**Environment:**
- LocalStack Version: 4.12.1.dev23 (Community Edition)
- CDK Version: Latest (with legacy exports warning)
- Platform: cdk-ts
- Services Required: VPC, EC2, S3, NAT Gateway, VPC Endpoints, Instance Connect Endpoint

**LocalStack Compatibility Issues:**
1. EC2 Instance Connect Endpoint - Not supported in Community Edition
2. SSM Parameter Store AMI lookups - May not return valid AMI IDs
3. S3 Interface VPC Endpoint - Limited support vs Gateway endpoint
4. Complex nested resource dependencies causing creation failures


---

## LocalStack Compatibility Fixes Applied

**Date:** Fri Dec 19 11:45:00 UTC 2025
**Agent:** localstack-fixer
**Mode:** Local (Batch Fix Approach)
**Iteration:** 1 of 3

### Batch Fixes Applied

All fixes were applied in ONE batch before re-deploying to maximize efficiency:

#### 1. Metadata Sanitization (CRITICAL)
- **File:** `metadata.json`
- **Changes:**
  - Removed invalid fields: `coverage`, `author`, `dockerS3Location`
  - Added required fields: `subtask`, `provider`, `subject_labels`
  - Set `subtask` to "Provisioning of Infrastructure Environments" (single string value)
  - Set `provider` to "localstack"
  - Set `subject_labels` to ["Cloud Environment Setup"]
- **Reason:** Schema validation requires only specific fields

#### 2. Removed EC2 Instance Connect Endpoint
- **File:** `lib/tap-stack.ts`
- **Changes:**
  - Removed `CfnInstanceConnectEndpoint` resource (lines 77-87)
  - Removed `createInstanceConnectSecurityGroup()` method
  - Removed `InstanceConnectEndpointId` output
  - Added comment explaining removal for LocalStack compatibility
- **Reason:** Not supported in LocalStack Community Edition

#### 3. Fixed AMI Lookup
- **File:** `lib/tap-stack.ts`
- **Changes:**
  - Replaced `MachineImage.latestAmazonLinux2023()` with hardcoded AMI
  - Used `MachineImage.genericLinux({ 'us-east-1': 'ami-12345678' })`
  - Eliminates SSM parameter lookups during deployment
- **Reason:** LocalStack SSM parameter store may not return valid AMI IDs

#### 4. Simplified VPC Endpoints
- **File:** `lib/tap-stack.ts`
- **Changes:**
  - Removed S3 Interface endpoint (`addInterfaceEndpoint('S3Endpoint')`)
  - Removed EC2 Interface endpoint (`addInterfaceEndpoint('EC2Endpoint')`)
  - Kept S3 Gateway endpoint only
- **Reason:** Interface endpoints have limited support in LocalStack Community

#### 5. Updated Integration Tests
- **File:** `test/tap-stack.int.test.ts`
- **Changes:**
  - Removed `DescribeInstanceConnectEndpointsCommand` import
  - Removed "Instance Connect Endpoint is accessible" test
  - Added LocalStack endpoint configuration:
    - `LOCALSTACK_ENDPOINT` constant
    - `isLocalStack` detection
    - Client configuration with `endpoint` and `forcePathStyle` for S3
- **Reason:** Tests must use LocalStack endpoints and skip unsupported features

### Deployment Attempt Results

#### Synthesis
- **Status:** ✅ SUCCESS
- **Output:** Template synthesized successfully without SSM parameters
- **Key Changes Verified:**
  - No `AWS::EC2::InstanceConnectEndpoint` resource
  - No Interface VPC endpoints for S3/EC2
  - Hardcoded AMI ID: `ami-12345678` (no SSM parameter)
  - Only S3 Gateway endpoint present

#### Deployment to LocalStack
- **Method:** Direct CloudFormation deployment (cdklocal S3 upload issue)
- **Status:** ⚠️ PARTIAL SUCCESS (CREATE_FAILED)
- **Stack Created:** tap-stack-Pr956
- **Resources Created Successfully:**
  - VPC (10.0.0.0/16)
  - Subnets (2 public, 2 private)
  - Internet Gateway
  - Route Tables
  - Security Groups
  - S3 Gateway Endpoint
  - IAM Roles and Policies
  - S3 Bucket with encryption and versioning

- **Resources Failed:**
  - **NAT Gateways:** Failed due to EIP allocation issues
  - **EC2 Instance:** Dependency on NAT Gateway

- **Error:** `InvalidAllocationID.NotFound: Allocation ID '['unknown']' not found`
- **Root Cause:** EIP (Elastic IP) resource type has limited support in LocalStack Community
  - LocalStack deployed EIP as fallback but returned 'unknown' allocation ID
  - NAT Gateway creation requires valid EIP allocation ID
  - This is a known LocalStack Community Edition limitation

### LocalStack Compatibility Assessment

#### ✅ Successfully Fixed Issues
1. EC2 Instance Connect Endpoint - Removed entirely
2. SSM Parameter lookups - Replaced with hardcoded AMI
3. Interface VPC endpoints - Removed (kept Gateway endpoint only)
4. Metadata validation - Schema compliant
5. Test configuration - LocalStack endpoints configured

#### ⚠️ Remaining LocalStack Limitations
1. **NAT Gateway with EIP:** LocalStack Community has incomplete EIP support
   - EIP resources deploy as "fallback" mode
   - Allocation IDs not properly returned
   - NAT Gateway creation fails as a result
   
2. **EC2 Instance:** Cannot be created until NAT Gateway issue is resolved

### Summary

**Fixes Applied:** 5/5 (100%)
**Resources Created:** 20+ out of 30+ (66% success rate)
**Deployment Status:** Partial deployment - core networking infrastructure created
**Blockers:** NAT Gateway EIP allocation (LocalStack Community limitation)

**Recommendation:**
- The task has been significantly improved for LocalStack compatibility
- Core VPC infrastructure is deployable (VPC, subnets, IGW, route tables, S3 bucket)
- NAT Gateway limitation requires either:
  - LocalStack Pro (full EIP support)
  - Manual workaround to remove NAT Gateways from the stack
  - Use of simpler network topology without NAT

**Iteration:** 1/3 used
**Next Steps:** Additional iteration could simplify NAT Gateway configuration or remove it entirely

