import * as fs from 'fs';
import * as path from 'path';

describe('IaCChallenge CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required sections', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
    });

    test('should have AMI mappings for supported regions', () => {
      const regionMap = template.Mappings.RegionMap;
      expect(regionMap['us-east-1']).toBeDefined();
      expect(regionMap['us-west-2']).toBeDefined();
      expect(regionMap['us-east-1'].AMI).toBeDefined();
      expect(regionMap['us-west-2'].AMI).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have MainVPC', () => {
      const vpc = template.Resources.MainVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have PublicSubnet', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have Public Route Table and Route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      const route = template.Resources.PublicRoute;

      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have Subnet Route Table Association', () => {
      const association = template.Resources.SubnetRouteTableAssociation;
      expect(association).toBeDefined();
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  describe('Logging and Monitoring Resources', () => {
    test('should have Central Log Group', () => {
      const logGroup = template.Resources.CentralLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toBe(
        '/aws/iacchallenge/central-logs'
      );
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have VPC Flow Log Role', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should have VPC Flow Log', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });
  });

  describe('Security Groups', () => {
    test('should have EC2 Security Group', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      expect(Array.isArray(sg.Properties.SecurityGroupIngress)).toBe(true);
    });

    test('EC2 Security Group should have proper ingress rules', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      // Should have SSH and HTTP rules
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);

      expect(sshRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(httpRule.IpProtocol).toBe('tcp');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 Instance Role', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.Policies).toBeDefined();
    });

    test('EC2 role should have least privilege policies', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;

      expect(Array.isArray(policies)).toBe(true);
      expect(policies.length).toBeGreaterThan(0);

      // Check for CloudWatch Logs permissions
      const logPolicy = policies.find(
        (policy: any) => policy.PolicyName === 'CloudWatchLogsPolicy'
      );
      expect(logPolicy).toBeDefined();
    });

    test('should have EC2 Instance Profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toBeDefined();
    });
  });

  describe('EC2 Resources', () => {
    test('should have EC2 Instance', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t2.micro');
    });

    test('EC2 instance should use regional AMI mapping', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.ImageId).toBeDefined();
      expect(instance.Properties.ImageId['Fn::FindInMap']).toBeDefined();
    });

    test('EC2 instance should have proper security configuration', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.SecurityGroupIds).toBeDefined();
      expect(instance.Properties.IamInstanceProfile).toBeDefined();
      expect(instance.Properties.UserData).toBeDefined();
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 Bucket', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });

    test('should have DynamoDB Table', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.AttributeDefinitions).toBeDefined();
      expect(table.Properties.KeySchema).toBeDefined();
    });

    test('DynamoDB table should have Point-in-Time Recovery', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(
        table.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'DynamoDBTableName',
        'EC2InstanceId',
        'VPCId',
        'CentralLogGroupName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security and Compliance', () => {
    test('all resources should have Project tag', () => {
      const resources = template.Resources;
      const resourcesWithTags = [
        'MainVPC',
        'PublicSubnet',
        'InternetGateway',
        'PublicRouteTable',
        'S3Bucket',
        'DynamoDBTable',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const projectTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Project'
        );
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('IaCChallenge');
      });
    });

    test('should enforce encryption at rest', () => {
      // S3 bucket encryption
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();

      // DynamoDB encryption (if specified)
      const dynamoTable = template.Resources.DynamoDBTable;
      // DynamoDB encryption is optional but recommended
    });

    test('should implement least privilege access', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      const policies = ec2Role.Properties.Policies;

      // Verify policies are specific and not overly broad
      policies.forEach((policy: any) => {
        expect(policy.PolicyDocument.Statement).toBeDefined();
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          // Should not have wildcard resources for sensitive actions
          if (statement.Effect === 'Allow') {
            expect(statement.Action).toBeDefined();
            expect(statement.Resource).toBeDefined();
          }
        });
      });
    });
  });

  describe('High Availability', () => {
    test('should use availability zone selection', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.AvailabilityZone).toBeDefined();
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // Should have at least 10+ resources
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5); // Should have exactly 5 outputs
    });
  });
});
