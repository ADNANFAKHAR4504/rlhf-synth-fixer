```typescript
// lib/tap-stack.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export interface TapStackArgs {
  projectName: string;
  regions: string[];
  network: {
    vpc: {
      cidr: string;
      publicSubnets: string[];
      privateSubnets: string[];
    };
    allowedIngressCidrs: string[];
  };
  security: {
    enforceIamLeastPrivilege: boolean;
    enforceCredentialRotation: boolean;
    useKmsCustomerManagedKeys: boolean;
    restrictApiGatewayToVpceId: string;
    enableConfigAndRemediation: boolean;
    requireAllResourcesTaggedProduction: boolean;
  };
  loggingMonitoring: {
    enableCloudTrail: boolean;
    enableVpcFlowLogs: boolean;
    enableApiGwAccessLogs: boolean;
    enableAlbAccessLogs: boolean;
    cwAlarms: Array<{
      name: string;
      metric: string;
      threshold: number;
      period: number;
      snsEmail: string;
    }>;
  };
  data: {
    s3Buckets: Array<{
      name: string;
      blockPublicAccess: boolean;
      accessLogging: boolean;
    }>;
    rds: {
      create: boolean;
    };
    secretsManager: {
      kms: string;
    };
  };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly kmsKey: aws.kms.Key;
  public readonly s3Buckets: aws.s3.Bucket[];
  public readonly apiGateway: aws.apigateway.RestApi;
  public readonly alb: aws.lb.LoadBalancer;
  public readonly cloudTrail: aws.cloudtrail.Trail;
  public readonly snsTopics: aws.sns.Topic[];
  public readonly vpcFlowLogsGroup: aws.cloudwatch.LogGroup;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:aws:TapStack", name, {}, opts);

    const defaultTags = {
      Environment: "Production",
      Project: args.projectName,
    };

    // KMS Customer Managed Key
    this.kmsKey = new aws.kms.Key(`${name}-kms-key`, {
      description: `KMS key for ${args.projectName}`,
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: pulumi.interpolate`arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root`
            },
            Action: "kms:*",
            Resource: "*"
          },
          {
            Sid: "Allow CloudTrail to encrypt logs",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com"
            },
            Action: [
              "kms:GenerateDataKey*",
              "kms:DescribeKey"
            ],
            Resource: "*"
          },
          {
            Sid: "Allow CloudWatch Logs",
            Effect: "Allow",
            Principal: {
              Service: "logs.amazonaws.com"
            },
            Action: [
              "kms:Encrypt",
              "kms:Decrypt",
              "kms:ReEncrypt*",
              "kms:GenerateDataKey*",
              "kms:DescribeKey"
            ],
            Resource: "*"
          }
        ]
      }),
      tags: defaultTags,
    }, { parent: this });

    const kmsAlias = new aws.kms.Alias(`${name}-kms-alias`, {
      name: `alias/${name}-key`,
      targetKeyId: this.kmsKey.keyId,
    }, { parent: this });

    // VPC
    this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
      cidrBlock: args.network.vpc.cidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...defaultTags,
        Name: `${name}-vpc`,
      },
    }, { parent: this });

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(`${name}-igw`, {
      vpcId: this.vpc.id,
      tags: {
        ...defaultTags,
        Name: `${name}-igw`,
      },
    }, { parent: this });

    // Public Subnets
    this.publicSubnets = args.network.vpc.publicSubnets.map((cidr, index) => {
      return new aws.ec2.Subnet(`${name}-public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: aws.getAvailabilityZones().then(azs => azs.names[index]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...defaultTags,
          Name: `${name}-public-subnet-${index}`,
          Type: "Public",
        },
      }, { parent: this });
    });

    // Private Subnets
    this.privateSubnets = args.network.vpc.privateSubnets.map((cidr, index) => {
      return new aws.ec2.Subnet(`${name}-private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: aws.getAvailabilityZones().then(azs => azs.names[index]),
        tags: {
          ...defaultTags,
          Name: `${name}-private-subnet-${index}`,
          Type: "Private",
        },
      }, { parent: this });
    });

    // NAT Gateway
    const eip = new aws.ec2.Eip(`${name}-nat-eip`, {
      domain: "vpc",
      tags: defaultTags,
    }, { parent: this });

    const natGateway = new aws.ec2.NatGateway(`${name}-nat-gateway`, {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        ...defaultTags,
        Name: `${name}-nat-gateway`,
      },
    }, { parent: this });

    // Route Tables
    const publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt`, {
      vpcId: this.vpc.id,
      routes: [
        {
          cidrBlock: "0.0.0.0/0",
          gatewayId: igw.id,
        },
      ],
      tags: {
        ...defaultTags,
        Name: `${name}-public-rt`,
      },
    }, { parent: this });

    const privateRouteTable = new aws.ec2.RouteTable(`${name}-private-rt`, {
      vpcId: this.vpc.id,
      routes: [
        {
          cidrBlock: "0.0.0.0/0",
          natGatewayId: natGateway.id,
        },
      ],
      tags: {
        ...defaultTags,
        Name: `${name}-private-rt`,
      },
    }, { parent: this });

    // Route Table Associations
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(`${name}-public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    });

    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(`${name}-private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    });

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(`${name}-alb-sg`, {
      vpcId: this.vpc.id,
      description: "Security group for ALB",
      ingress: args.network.allowedIngressCidrs.map(cidr => ({
        fromPort: 443,
        toPort: 443,
        protocol: "tcp",
        cidrBlocks: [cidr],
      })),
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
      }],
      tags: {
        ...defaultTags,
        Name: `${name}-alb-sg`,
      },
    }, { parent: this });

    const appSecurityGroup = new aws.ec2.SecurityGroup(`${name}-app-sg`, {
      vpcId: this.vpc.id,
      description: "Security group for application instances",
      ingress: [{
        fromPort: 80,
        toPort: 80,
        protocol: "tcp",
        securityGroups: [albSecurityGroup.id],
      }],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
      }],
      tags: {
        ...defaultTags,
        Name: `${name}-app-sg`,
      },
    }, { parent: this });

    // S3 Buckets
    this.s3Buckets = args.data.s3Buckets.map((bucketConfig, index) => {
      const bucket = new aws.s3.Bucket(`${name}-${bucketConfig.name}`, {
        bucket: `${bucketConfig.name}-${pulumi.getStack()}`,
        tags: defaultTags,
      }, { parent: this });

      new aws.s3.BucketPublicAccessBlock(`${name}-${bucketConfig.name}-pab`, {
        bucket: bucket.id,
        blockPublicAcls: bucketConfig.blockPublicAccess,
        blockPublicPolicy: bucketConfig.blockPublicAccess,
        ignorePublicAcls: bucketConfig.blockPublicAccess,
        restrictPublicBuckets: bucketConfig.blockPublicAccess,
      }, { parent: this });

      new aws.s3.BucketServerSideEncryptionConfiguration(`${name}-${bucketConfig.name}-encryption`, {
        bucket: bucket.id,
        rules: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: this.kmsKey.arn,
          },
          bucketKeyEnabled: true,
        }],
      }, { parent: this });

      if (bucketConfig.accessLogging) {
        const accessLogsBucket = new aws.s3.Bucket(`${name}-${bucketConfig.name}-access-logs`, {
          bucket: `${bucketConfig.name}-access-logs-${pulumi.getStack()}`,
          tags: defaultTags,
        }, { parent: this });

        new aws.s3.BucketLogging(`${name}-${bucketConfig.name}-logging`, {
          bucket: bucket.id,
          targetBucket: accessLogsBucket.id,
          targetPrefix: "access-logs/",
        }, { parent: this });
      }

      return bucket;
    });

    // VPC Flow Logs
    this.vpcFlowLogsGroup = new aws.cloudwatch.LogGroup(`${name}-vpc-flow-logs`, {
      name: `/aws/vpc/flowlogs/${name}`,
      retentionInDays: 30,
      kmsKeyId: this.kmsKey.arn,
      tags: defaultTags,
    }, { parent: this });

    const flowLogsRole = new aws.iam.Role(`${name}-flow-logs-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "vpc-flow-logs.amazonaws.com"
          }
        }]
      }),
      tags: defaultTags,
    }, { parent: this });

    new aws.iam.RolePolicy(`${name}-flow-logs-policy`, {
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogGroups",
            "logs:DescribeLogStreams"
          ],
          Resource: "*"
        }]
      }),
    }, { parent: this });

    if (args.loggingMonitoring.enableVpcFlowLogs) {
      new aws.ec2.FlowLog(`${name}-vpc-flow-log`, {
        iamRoleArn: flowLogsRole.arn,
        logDestination: this.vpcFlowLogsGroup.arn,
        logDestinationType: "cloud-watch-logs",
        resourceId: this.vpc.id,
        resourceType: "VPC",
        trafficType: "ALL",
        tags: defaultTags,
      }, { parent: this });
    }

    // CloudTrail
    if (args.loggingMonitoring.enableCloudTrail) {
      const cloudTrailBucket = new aws.s3.Bucket(`${name}-cloudtrail`, {
        bucket: `${name}-cloudtrail-${pulumi.getStack()}`,
        tags: defaultTags,
      }, { parent: this });

      new aws.s3.BucketPolicy(`${name}-cloudtrail-policy`, {
        bucket: cloudTrailBucket.id,
        policy: pulumi.all([cloudTrailBucket.arn, aws.getCallerIdentity().then(id => id.accountId)]).apply(([bucketArn, accountId]) => 
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
              Sid: "AWSCloudTrailAclCheck",
              Effect: "Allow",
              Principal: {
                Service: "cloudtrail.amazonaws.com"
              },
              Action: "s3:GetBucketAcl",
              Resource: bucketArn
            }, {
              Sid: "AWSCloudTrailWrite",
              Effect: "Allow",
              Principal: {
                Service: "cloudtrail.amazonaws.com"
              },
              Action: "s3:PutObject",
              Resource: `${bucketArn}/*`,
              Condition: {
                StringEquals: {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            }]
          })
        ),
      }, { parent: this });

      this.cloudTrail = new aws.cloudtrail.Trail(`${name}-cloudtrail`, {
        name: `${name}-cloudtrail`,
        s3BucketName: cloudTrailBucket.id,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableLogFileValidation: true,
        kmsKeyId: this.kmsKey.arn,
        eventSelectors: [{
          readWriteType: "All",
          includeManagementEvents: true,
          dataResources: [{
            type: "AWS::S3::Object",
            values: ["arn:aws:s3:::*/*"],
          }],
        }],
        tags: defaultTags,
      }, { parent: this });
    }

    // SNS Topics for Alarms
    this.snsTopics = args.loggingMonitoring.cwAlarms.map((alarm, index) => {
      const topic = new aws.sns.Topic(`${name}-${alarm.name.toLowerCase()}-topic`, {
        name: `${name}-${alarm.name.toLowerCase()}`,
        kmsMasterKeyId: this.kmsKey.id,
        tags: defaultTags,
      }, { parent: this });

      new aws.sns.TopicSubscription(`${name}-${alarm.name.toLowerCase()}-subscription`, {
        topicArn: topic.arn,
        protocol: "email",
        endpoint: alarm.snsEmail,
      }, { parent: this });

      // CloudWatch Alarm
      new aws.cloudwatch.MetricAlarm(`${name}-${alarm.name.toLowerCase()}-alarm`, {
        name: `${name}-${alarm.name}`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 1,
        metricName: alarm.metric.split(":")[1],
        namespace: alarm.metric.split(":")[0],
        period: alarm.period,
        statistic: "Sum",
        threshold: alarm.threshold,
        alarmDescription: `Alarm for ${alarm.name}`,
        alarmActions: [topic.arn],
        tags: defaultTags,
      }, { parent: this });

      return topic;
    });

    // Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(`${name}-alb`, {
      name: `${name}-alb`,
      loadBalancerType: "application",
      subnets: this.publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      enableDeletionProtection: true,
      accessLogs: args.loggingMonitoring.enableAlbAccessLogs ? {
        bucket: this.s3Buckets[0].id,
        prefix: "alb-access-logs",
        enabled: true,
      } : undefined,
      tags: defaultTags,
    }, { parent: this });

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(`${name}-tg`, {
      name: `${name}-tg`,
      port: 80,
      protocol: "HTTP",
      vpcId: this.vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: "200",
        path: "/health",
        port: "traffic-port",
        protocol: "HTTP",
        timeout: 5,
        unhealthyThreshold: 2,
      },
      tags: defaultTags,
    }, { parent: this });

    // ALB Listener
    new aws.lb.Listener(`${name}-listener`, {
      loadBalancerArn: this.alb.arn,
      port: "443",
      protocol: "HTTPS",
      sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
      certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012", // Replace with actual cert
      defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
      }],
    }, { parent: this });

    // API Gateway
    this.apiGateway = new aws.apigateway.RestApi(`${name}-api`, {
      name: `${name}-api`,
      description: `API Gateway for ${args.projectName}`,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: "*",
          Action: "execute-api:Invoke",
          Resource: "*",
          Condition: {
            StringEquals: {
              "aws:sourceVpce": args.security.restrictApiGatewayToVpceId
            }
          }
        }]
      }),
      tags: defaultTags,
    }, { parent: this });

    // API Gateway CloudWatch Logs
    const apiGwLogGroup = new aws.cloudwatch.LogGroup(`${name}-api-gw-logs`, {
      name: `/aws/apigateway/${name}`,
      retentionInDays: 30,
      kmsKeyId: this.kmsKey.arn,
      tags: defaultTags,
    }, { parent: this });

    // IAM Password Policy for credential rotation
    if (args.security.enforceCredentialRotation) {
      new aws.iam.AccountPasswordPolicy(`${name}-password-policy`, {
        minimumPasswordLength: 14,
        requireLowercaseCharacters: true,
        requireNumbers: true,
        requireSymbols: true,
        requireUppercaseCharacters: true,
        allowUsersToChangePassword: true,
        maxPasswordAge: 90,
        passwordReusePrevention: 24,
      }, { parent: this });
    }

    // AWS Config for compliance monitoring
    if (args.security.enableConfigAndRemediation) {
      const configRole = new aws.iam.Role(`${name}-config-role`, {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "config.amazonaws.com"
            }
          }]
        }),
        managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/ConfigRole"],
        tags: defaultTags,
      }, { parent: this });

      const configBucket = new aws.s3.Bucket(`${name}-config`, {
        bucket: `${name}-config-${pulumi.getStack()}`,
        tags: defaultTags,
      }, { parent: this });

      new aws.config.ConfigurationRecorder(`${name}-config-recorder`, {
        name: `${name}-config-recorder`,
        roleArn: configRole.arn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }, { parent: this });

      new aws.config.DeliveryChannel(`${name}-config-delivery`, {
        name: `${name}-config-delivery`,
        s3BucketName: configBucket.id,
      }, { parent: this });
    }

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
      kmsKeyId: this.kmsKey.id,
      s3BucketNames: this.s3Buckets.map(bucket => bucket.id),
      apiGatewayId: this.apiGateway.id,
      albDnsName: this.alb.dnsName,
      cloudTrailArn: this.cloudTrail?.arn,
      snsTopicArns: this.snsTopics.map(topic => topic.arn),
      vpcFlowLogsGroupName: this.vpcFlowLogsGroup.name,
    });
  }
}
```

```typescript
// test/tap-stack.unit.test.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { TapStack, TapStackArgs } from "../lib/tap-stack";

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {id: string, state: any} => {
    const resourceType = args.type;
    const resourceName = args.name;
    
    // Mock different resource types
    switch (resourceType) {
      case "aws:ec2/vpc:Vpc":
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            cidrBlock: args.inputs.cidrBlock || "10.0.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
      case "aws:ec2/subnet:Subnet":
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            vpcId: "vpc-mock-id",
            cidrBlock: args.inputs.cidrBlock || "10.0.0.0/20",
            availabilityZone: "us-east-1a",
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
      case "aws:kms/key:Key":
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            keyId: `${resourceName}-key-id`,
            arn: `arn:aws:kms:us-east-1:123456789012:key/${resourceName}-key-id`,
            description: args.inputs.description,
            keyUsage: "ENCRYPT_DECRYPT",
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
      case "aws:s3/bucket:Bucket":
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            bucket: args.inputs.bucket || `${resourceName}-bucket`,
            arn: `arn:aws:s3:::${resourceName}-bucket`,
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
      case "aws:ec2/securityGroup:SecurityGroup":
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            vpcId: "vpc-mock-id",
            description: args.inputs.description,
            ingress: args.inputs.ingress || [],
            egress: args.inputs.egress || [],
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
      case "aws:cloudwatch/logGroup:LogGroup":
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            name: args.inputs.name || `/aws/vpc/flowlogs/${resourceName}`,
            arn: `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name}`,
            retentionInDays: args.inputs.retentionInDays || 30,
            kmsKeyId: args.inputs.kmsKeyId,
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
      case "aws:apigateway/restApi:RestApi":
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            name: args.inputs.name,
            description: args.inputs.description,
            policy: args.inputs.policy,
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
      case "aws:lb/loadBalancer:LoadBalancer":
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            name: args.inputs.name,
            arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${args.inputs.name}`,
            dnsName: `${args.inputs.name}-1234567890.us-east-1.elb.amazonaws.com`,
            loadBalancerType: "application",
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
      case "aws:sns/topic:Topic":
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            name: args.inputs.name,
            arn: `arn:aws:sns:us-east-1:123456789012:${args.inputs.name}`,
            kmsMasterKeyId: args.inputs.kmsMasterKeyId,
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
      case "aws:cloudtrail/trail:Trail":
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            name: args.inputs.name,
            arn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/${args.inputs.name}`,
            s3BucketName: args.inputs.s3BucketName,
            kmsKeyId: args.inputs.kmsKeyId,
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
      default:
        return {
          id: `${resourceName}-id`,
          state: {
            id: `${resourceName}-id`,
            ...args.inputs,
            tags: args.inputs.tags || { Environment: "Production" },
          },
        };
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === "aws:index/getCallerIdentity:getCallerIdentity") {
      return {
        accountId: "123456789012",
        arn: "arn:aws:iam::123456789012:user/test-user",
        userId: "AIDACKCEVSQ6C2EXAMPLE",
      };
    }
    if (args.token === "aws:index/getAvailabilityZones:getAvailabilityZones") {
      return {
        names: ["us-east-1a", "us-east-1b", "us-east-1c"],
      };
    }
    return {};
  },
});

describe("TapStack Unit Tests", () => {
  let stack: TapStack;
  const mockArgs: TapStackArgs = {
    projectName: "IaC - AWS Nova Model Breaking",
    regions: ["us-east-1", "us-west-2", "eu-central-1"],
    network: {
      vpc: {
        cidr: "10.0.0.0/16",
        publicSubnets: ["10.0.0.0/20", "10.0.16.0/20"],
        privateSubnets: ["10.0.32.0/20", "10.0.48.0/20"],
      },
      allowedIngressCidrs: ["203.0.113.0/24"],
    },
    security: {
      enforceIamLeastPrivilege: true,
      enforceCredentialRotation: true,
      useKmsCustomerManagedKeys: true,
      restrictApiGatewayToVpceId: "vpce-0123456789abcdef0",
      enableConfigAndRemediation: true,
      requireAllResourcesTaggedProduction: true,
    },
    loggingMonitoring: {
      enableCloudTrail: true,
      enableVpcFlowLogs: true,
      enableApiGwAccessLogs: true,
      enableAlbAccessLogs: true,
      cwAlarms: [
        {
          name: "UnauthorizedAPICalls",
          metric: "AWS/CloudTrail:UnauthorizedApiCalls",
          threshold: 1,
          period: 300,
          snsEmail: "secops@example.com",
        },
      ],
    },
    data: {
      s3Buckets: [
        {
          name: "nova-prod-artifacts",
          blockPublicAccess: true,
          accessLogging: true,
        },
      ],
      rds: {
        create: false,
      },
      secretsManager: {
        kms: "