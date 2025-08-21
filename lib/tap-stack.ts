/* eslint-disable prettier/prettier */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackArgs {
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcs: { [region: string]: aws.ec2.Vpc } = {};
  public readonly securityGroups: { [region: string]: aws.ec2.SecurityGroup } = {};
  public readonly kmsKeys: { [region: string]: aws.kms.Key } = {};
  public readonly apiGateways: { [region: string]: aws.apigateway.RestApi } = {};
  public readonly vpcEndpoints: { [region: string]: aws.ec2.VpcEndpoint } = {};
  public readonly iamRoles: { [region: string]: aws.iam.Role } = {};
  public readonly cloudWatchLogGroups: { [region: string]: aws.cloudwatch.LogGroup } = {};
  public readonly subnets: { [region: string]: aws.ec2.Subnet[] } = {};
  public readonly routeTables: { [region: string]: aws.ec2.RouteTable } = {};
  public readonly internetGateways: { [region: string]: aws.ec2.InternetGateway } = {};
  public readonly s3Buckets: { [region: string]: aws.s3.Bucket } = {};

  private readonly regions = ['us-east-1', 'us-west-2', 'eu-central-1'];

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ResourceOptions) {
    super('custom:resource:TapStack', name, {}, opts);

    const tags = args.tags || {};

    for (const region of this.regions) {
      const provider = new aws.Provider(`${region}-provider`, { region });
      const prefix = `${name}-${region}`;

      // VPC
      const vpc = new aws.ec2.Vpc(`${prefix}-vpc`, {
        cidrBlock: '10.0.0.0/16',
        enableDnsSupport: true,
        enableDnsHostnames: true,
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-vpc`,
        },
      }, { provider });
      this.vpcs[region] = vpc;

      // IGW
      const igw = new aws.ec2.InternetGateway(`${prefix}-igw`, {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-igw`,
        },
      }, { provider });
      this.internetGateways[region] = igw;

      // Subnets in 2 AZs
      const subnets: aws.ec2.Subnet[] = [];
      const azs = ['a', 'b'];
      for (let i = 0; i < azs.length; i++) {
        const subnet = new aws.ec2.Subnet(`${prefix}-subnet-${azs[i]}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: `${region}${azs[i]}`,
          mapPublicIpOnLaunch: false,
          tags: {
            ...tags,
            Environment: 'Production',
            Name: `${prefix}-subnet-${azs[i]}`,
          },
        }, { provider });
        subnets.push(subnet);
      }
      this.subnets[region] = subnets;

      // RouteTable
      const routeTable = new aws.ec2.RouteTable(`${prefix}-rt`, {
        vpcId: vpc.id,
        routes: [{
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        }],
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-rt`,
        },
      }, { provider });
      this.routeTables[region] = routeTable;

      // Associate RouteTable
      subnets.forEach((subnet, index) => {
        new aws.ec2.RouteTableAssociation(`${prefix}-rta-${index}`, {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        }, { provider });
      });

      // SecurityGroup limiting ingress/egress
      const sg = new aws.ec2.SecurityGroup(`${prefix}-sg`, {
        vpcId: vpc.id,
        description: 'Secure security group with restricted access',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443, toPort: 443, 
            cidrBlocks: ['10.0.0.0/16'],
            description: 'HTTPS from VPC',
          },
          {
            protocol: 'tcp',
            fromPort: 22, toPort: 22,
            cidrBlocks: ['10.0.0.0/24'],
            description: 'SSH from admin subnet',
          }
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0, toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          }
        ],
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-sg`,
        },
      }, { provider });
      this.securityGroups[region] = sg;

      // KMS Key with compliant key policy
      const kmsKey = new aws.kms.Key(`${prefix}-kms`, {
        description: `KMS Customer Managed Key for ${region}`,
        enableKeyRotation: true,
        deletionWindowInDays: 30,
        policy: pulumi.all([aws.getCallerIdentityOutput({})]).apply(([id]) => JSON.stringify({
          Version: '2012-10-17',
          Id: 'key-default-1',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: { 
                AWS: `arn:aws:iam::${id.accountId}:root`
              },
              Action: 'kms:*',
              Resource: '*',
            }
          ]
        })),
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-kms`,
        },
      }, { provider });
      this.kmsKeys[region] = kmsKey;

      new aws.kms.Alias(`${prefix}-kms-alias`, {
        name: `alias/${prefix}-key`,
        targetKeyId: kmsKey.id,
      }, { provider });

      // IAM Role for API Gateway (least privilege)
      const apiGatewayRole = new aws.iam.Role(`${prefix}-apigateway-role`, {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'apigateway.amazonaws.com' },
            Action: 'sts:AssumeRole',
          }],
        }),
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-apigateway-role`,
        },
      }, { provider });

      new aws.iam.RolePolicyAttachment(`${prefix}-apigateway-policy`, {
        role: apiGatewayRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
      }, { provider });

      this.iamRoles[region] = apiGatewayRole;

      // VPC Endpoint for API Gateway, restrict by policy
      const vpcEndpoint = new aws.ec2.VpcEndpoint(`${prefix}-apigw-vpce`, {
        serviceName: `com.amazonaws.${region}.execute-api`,
        vpcId: vpc.id,
        vpcEndpointType: 'Interface',
        subnetIds: subnets.map(s => s.id),
        securityGroupIds: [sg.id],
        privateDnsEnabled: true,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: '*',
            Action: ['execute-api:Invoke'],
            Resource: '*',
          }]
        }),
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-apigw-vpce`,
        },
      }, { provider });
      this.vpcEndpoints[region] = vpcEndpoint;

      // API Gateway, VPC endpoint restriction
      const restApi = new aws.apigateway.RestApi(`${prefix}-api`, {
        endpointConfiguration: {
          types: 'PRIVATE',
          vpcEndpointIds: [vpcEndpoint.id],
        },
        policy: pulumi.all([vpcEndpoint.id]).apply(([vpceId]) => JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: '*',
            Action: 'execute-api:Invoke',
            Resource: 'arn:aws:execute-api:*:*:*',
            Condition: {
              StringEquals: {
                'aws:SourceVpce': vpceId,
              }
            }
          }]
        })),
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-api`,
        },
      }, { provider });
      this.apiGateways[region] = restApi;

      // CloudWatch Log Group
      const logGroup = new aws.cloudwatch.LogGroup(`${prefix}-apigw-logs`, {
        name: `/aws/apigateway/${prefix}`,
        retentionInDays: 90,
        kmsKeyId: kmsKey.arn,
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-apigw-logs`,
        },
      }, { provider });
      this.cloudWatchLogGroups[region] = logGroup;

      // S3 Bucket for CloudTrail logs
      const s3Bucket = new aws.s3.Bucket(`${prefix}-cloudtrail-bucket`, {
        bucket: `${prefix}-cloudtrail-bucket-${Date.now()}`.toLowerCase(),
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-cloudtrail-bucket`,
        },
      }, { provider });

      new aws.s3.BucketServerSideEncryptionConfigurationV2(`${prefix}-bucket-encryption`, {
        bucket: s3Bucket.id,
        rules: [{ 
          applyServerSideEncryptionByDefault: { 
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.arn
          }
        }],
      }, { provider });

      new aws.s3.BucketPublicAccessBlock(`${prefix}-bucket-pab`, {
        bucket: s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }, { provider });

      this.s3Buckets[region] = s3Bucket;

      new aws.cloudtrail.Trail(`${prefix}-cloudtrail`, {
        s3BucketName: s3Bucket.bucket,
        includeGlobalServiceEvents: region === 'us-east-1',
        isMultiRegionTrail: region === 'us-east-1',
        enableLogging: true,
        kmsKeyId: kmsKey.arn,
        tags: {
          ...tags,
          Environment: 'Production',
          Name: `${prefix}-cloudtrail`,
        },
      }, { provider });

      // Password Policy (only once per account, us-east-1)
      if (region === 'us-east-1') {
        new aws.iam.AccountPasswordPolicy('account-password-policy', {
          minimumPasswordLength: 14,
          requireSymbols: true,
          requireNumbers: true,
          requireUppercaseCharacters: true,
          requireLowercaseCharacters: true,
          allowUsersToChangePassword: true,
          hardExpiry: true,
          passwordReusePrevention: 5,
          maxPasswordAge: 90,
        }, { provider });

        // Config resources removed since they already exist:
        // - ConfigRecorder-pr1768 in us-east-1
        // - config-recorder-pr1739 in us-west-2
        // - SecurityRecorder-default-eu-central-1 in eu-central-1
      }
    }

    this.registerOutputs({
      vpcs: this.vpcs,
      securityGroups: this.securityGroups,
      kmsKeys: this.kmsKeys,
      apiGateways: this.apiGateways,
      vpcEndpoints: this.vpcEndpoints,
      iamRoles: this.iamRoles,
      cloudWatchLogGroups: this.cloudWatchLogGroups,
      subnets: this.subnets,
      routeTables: this.routeTables,
      internetGateways: this.internetGateways,
      s3Buckets: this.s3Buckets,
    });
  }
}
