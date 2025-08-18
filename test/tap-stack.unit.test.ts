import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// This function recursively finds all resources of a given type
const findResources = (obj: any, type: string): { [key: string]: any } => {
  const results: { [key: string]: any } = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const resource = obj[key];
      if (resource && resource.Type === type) {
        results[key] = resource;
      }
    }
  }
  return results;
};

describe('NovaModel Secure Infrastructure Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Custom schema to correctly parse CloudFormation intrinsic functions
    const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: (data: any) => ({ Ref: data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: (data: any) => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'sequence',
        construct: (data: any) => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: (data: any) => ({ 'Fn::GetAtt': data.split('.') }),
      }),
      new yaml.Type('!FindInMap', {
        kind: 'sequence',
        construct: (data: any) => ({ 'Fn::FindInMap': data }),
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: (data: any) => ({ 'Fn::Select': data }),
      }),
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: (data: any) => ({ 'Fn::GetAZs': data }),
      }),
    ]);

    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  // ---------------------------------------------------------------- //
  //                             General Requirements                 //
  // ---------------------------------------------------------------- //
  describe('General Requirements: Parameters and Tagging', () => {
    test('should have a valid format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain('NovaModel Secure Infrastructure');
    });

    test('should define the EnvironmentSuffix parameter correctly', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('all taggable resources should have standard tags', () => {
      const resources = template.Resources;
      for (const key in resources) {
        const resource = resources[key];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          expect(
            tags.some(
              (tag: any) =>
                tag.Key === 'Project' && tag.Value === 'NovaModelBreaking'
            )
          ).toBe(true);
          expect(
            tags.some(
              (tag: any) =>
                tag.Key === 'Environment' &&
                typeof tag.Value.Ref !== 'undefined'
            )
          ).toBe(true);
          expect(
            tags.some(
              (tag: any) => tag.Key === 'Owner' && tag.Value === 'DevSecOpsTeam'
            )
          ).toBe(true);
        }
      }
    });
  });

  // ---------------------------------------------------------------- //
  //                       IAM and Dependencies                       //
  // ---------------------------------------------------------------- //
  describe('IAM and Resource Dependencies', () => {
    test('LambdaExecutionRole should have least-privilege DynamoDB permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const statement = policy.PolicyDocument.Statement[0];

      expect(policy.PolicyName).toBe('DynamoDB-Write-Policy');
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toEqual('dynamodb:PutItem');
      expect(statement.Resource).toEqual({
        'Fn::GetAtt': ['DynamoDBTable', 'Arn'],
      });
    });

    // NEW: Test for CloudTrailCWLRole IAM Policy
    test('CloudTrailCWLRole should have correct permissions for CloudWatch Logs', () => {
      const role = template.Resources.CloudTrailCWLRole;
      const policy = role.Properties.Policies[0];
      const statement = policy.PolicyDocument.Statement[0];

      expect(policy.PolicyName).toBe('CloudTrail-CWL-Policy');
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toEqual([
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ]);
      expect(statement.Resource).toEqual({
        'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn'],
      });
    });

    test('AutoScalingGroup should depend on KMS Key and NAT Gateways', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.DependsOn).toBeDefined();
      expect(asg.DependsOn).toContain('EBSKMSKey');
      expect(asg.DependsOn).toContain('NatGateway1');
      expect(asg.DependsOn).toContain('NatGateway2');
    });

    // NEW: Test for PublicRoute dependency
    test('PublicRoute should depend on VPCGatewayAttachment', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.DependsOn).toBeDefined();
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });
  });

  // ---------------------------------------------------------------- //
  //                         VPC and Networking                       //
  // ---------------------------------------------------------------- //
  describe('VPC and Networking', () => {
    test('should create a VPC with correct CIDR', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR'],
      });
    });

    test('should create two public and two private subnets across different AZs', () => {
      const subnets = Object.values(
        findResources(template.Resources, 'AWS::EC2::Subnet')
      );
      const publicSubnets = subnets.filter(
        (s: any) => s.Properties.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnets.filter(
        (s: any) => s.Properties.MapPublicIpOnLaunch !== true
      );

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);

      expect(publicSubnets[0].Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(publicSubnets[1].Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
    });

    test('should create two NAT Gateways for high availability', () => {
      const natGateways = findResources(
        template.Resources,
        'AWS::EC2::NatGateway'
      );
      expect(Object.keys(natGateways).length).toBe(2);
    });

    test('Public Route Table should point to the Internet Gateway', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    // NEW: Test for VPC Flow Logs
    test('should create a VPC Flow Log targeting a CloudWatch Log Group', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.LogGroupName).toEqual({
        Ref: 'VPCFlowLogsLogGroup',
      });
      expect(flowLog.Properties.DeliverLogsPermissionArn).toEqual({
        'Fn::GetAtt': ['VPCFlowLogsRole', 'Arn'],
      });
    });
  });

  // ---------------------------------------------------------------- //
  //                         Network Security                         //
  // ---------------------------------------------------------------- //
  describe('Network Security (Security Groups)', () => {
    test('ALB Security Group should allow public HTTP/HTTPS traffic', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      const ingress = albSg.Properties.SecurityGroupIngress;
      expect(ingress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: '0.0.0.0/0',
        Description: 'Allow HTTP from internet',
      });
      expect(ingress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        CidrIp: '0.0.0.0/0',
        Description: 'Allow HTTPS from internet',
      });
    });

    test('EC2 Security Group should only allow traffic from the ALB', () => {
      const ec2Sg = template.Resources.EC2SecurityGroup;
      const ingress = ec2Sg.Properties.SecurityGroupIngress;
      expect(ingress[0].SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
      expect(ingress[1].SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
    });

    test('RDS Security Group should only allow traffic from EC2 and Lambda SGs on port 3306', () => {
      const rdsSg = template.Resources.RDSSecurityGroup;
      const ingress = rdsSg.Properties.SecurityGroupIngress;
      expect(ingress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        SourceSecurityGroupId: { Ref: 'EC2SecurityGroup' },
        Description: 'Allow MySQL from EC2 instances',
      });
      expect(ingress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        SourceSecurityGroupId: { Ref: 'LambdaSecurityGroup' },
        Description: 'Allow MySQL from Lambda functions',
      });
    });
  });

  // ---------------------------------------------------------------- //
  //                   Data Storage and Encryption                    //
  // ---------------------------------------------------------------- //
  describe('Data Storage and Encryption', () => {
    test('S3 buckets should have server-side encryption and versioning enabled', () => {
      const buckets = findResources(template.Resources, 'AWS::S3::Bucket');
      for (const key in buckets) {
        const bucket = buckets[key];
        expect(
          bucket.Properties.BucketEncryption
            .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
            .SSEAlgorithm
        ).toBe('AES256');
        expect(bucket.Properties.VersioningConfiguration.Status).toBe(
          'Enabled'
        );
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
        ).toBe(true);
      }
    });

    test('RDS instance should be Multi-AZ and encrypted', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS instance should have Snapshot policies for deletion protection', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('EBS volumes should be encrypted with a customer-managed KMS key', () => {
      const kmsKey = template.Resources.EBSKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');

      const launchTemplate = template.Resources.EC2LaunchTemplate;
      const ebsConfig =
        launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
      expect(ebsConfig.Encrypted).toBe(true);
      expect(ebsConfig.KmsKeyId).toEqual({ Ref: 'EBSKMSKey' });
    });

    test('DynamoDB table should have Point-in-Time Recovery enabled', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      expect(
        dynamoTable.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------- //
  //                       Compute and API Gateway                    //
  // ---------------------------------------------------------------- //
  describe('Compute and API', () => {
    test('Lambda function should be configured with VPC access', () => {
      const lambda = template.Resources.LambdaFunction;
      const vpcConfig = lambda.Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SecurityGroupIds).toEqual([
        { Ref: 'LambdaSecurityGroup' },
      ]);
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('API Gateway method should require an API key', () => {
      const apiMethod = template.Resources.ApiGatewayMethod;
      expect(apiMethod.Properties.ApiKeyRequired).toBe(true);
    });
  });

  // ---------------------------------------------------------------- //
  //                       Logging and Monitoring                     //
  // ---------------------------------------------------------------- //
  describe('Logging and Monitoring', () => {
    test('CloudTrail should log all management and data events for key resources', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.S3BucketName).toEqual({
        Ref: 'S3CloudTrailBucket',
      });

      const eventSelectors = trail.Properties.EventSelectors[0];
      expect(eventSelectors.IncludeManagementEvents).toBe(true);
      expect(eventSelectors.ReadWriteType).toBe('All');
      expect(eventSelectors.DataResources.length).toBe(3);
    });

    test('should create dedicated CloudWatch Log Groups with retention policies', () => {
      const logGroups = findResources(
        template.Resources,
        'AWS::Logs::LogGroup'
      );
      expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(5);
      expect(logGroups.CloudTrailLogGroup.Properties.RetentionInDays).toBe(90);
      expect(logGroups.CloudFormationLogGroup.Properties.RetentionInDays).toBe(
        30
      );

      expect(logGroups.VPCFlowLogsLogGroup.Properties.RetentionInDays).toBe(14);
    });
  });

  // ---------------------------------------------------------------- //
  //                             Outputs                              //
  // ---------------------------------------------------------------- //
  describe('Outputs', () => {
    test('should define all required outputs with export names', () => {
      const outputs = template.Outputs;
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ApiGatewayUrl).toBeDefined();
      expect(outputs.ApiKeyId).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();

      for (const key in outputs) {
        expect(outputs[key].Export).toBeDefined();
        expect(outputs[key].Export.Name).toBeDefined();
      }
    });

    test('ApiKeyId output should reference the correct resource', () => {
      const apiKeyOutput = template.Outputs.ApiKeyId;
      expect(apiKeyOutput.Value).toEqual({ Ref: 'ApiGatewayApiKey' });
    });
  });
});
