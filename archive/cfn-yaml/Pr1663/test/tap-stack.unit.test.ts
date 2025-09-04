import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template converted from YAML
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-ready secure AWS infrastructure with VPC, subnets across 2 AZs, NAT Gateway, encrypted S3 bucket, and comprehensive monitoring'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for all resources (dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('secureinfra');
    });

    test('should have CostCenter parameter', () => {
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.CostCenter.Type).toBe('String');
      expect(template.Parameters.CostCenter.Default).toBe('infrastructure');
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.PublicSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PublicSubnet2Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet2Cidr).toBeDefined();
    });

    test('should have TrustedCidr parameter', () => {
      expect(template.Parameters.TrustedCidr).toBeDefined();
      expect(template.Parameters.TrustedCidr.Default).toBe('192.168.1.0/24');
    });

    test('should have feature toggle parameters', () => {
      expect(template.Parameters.EnableVPCFlowLogs).toBeDefined();
      expect(template.Parameters.EnableS3AccessLogging).toBeDefined();
      expect(template.Parameters.EnableVPCFlowLogs.AllowedValues).toEqual([
        'true',
        'false',
      ]);
      expect(template.Parameters.EnableS3AccessLogging.AllowedValues).toEqual([
        'true',
        'false',
      ]);
    });
  });

  describe('Conditions', () => {
    test('should have conditions for optional features', () => {
      expect(template.Conditions.CreateVPCFlowLogs).toBeDefined();
      expect(template.Conditions.CreateS3AccessLogging).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have Internet Gateway attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct properties', () => {
      const pubSubnet1 = template.Resources.PublicSubnet1;
      expect(pubSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(pubSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('NAT Gateway', () => {
    test('should have NAT Gateway EIP', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateway should reference public subnet', () => {
      const natGateway = template.Resources.NatGateway1;
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable1.Type).toBe(
        'AWS::EC2::RouteTable'
      );
      expect(template.Resources.PrivateRouteTable2.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have route table associations', () => {
      expect(
        template.Resources.PublicSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PublicSubnet2RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnet2RouteTableAssociation
      ).toBeDefined();
    });
  });

  describe('Security Group', () => {
    test('should have SSH security group', () => {
      expect(template.Resources.SSHSecurityGroup).toBeDefined();
      expect(template.Resources.SSHSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('SSH security group should have correct rules', () => {
      const sg = template.Resources.SSHSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(22);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(22);
      expect(sg.Properties.SecurityGroupIngress[0].CidrIp).toEqual({
        Ref: 'TrustedCidr',
      });
    });

    test('security group should include environment suffix in name', () => {
      const sg = template.Resources.SSHSecurityGroup;
      expect(sg.Properties.GroupName).toEqual({
        'Fn::Sub': '${ProjectName}-SSH-SecurityGroup-${EnvironmentSuffix}',
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should have secure S3 bucket', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const pac = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pac.BlockPublicAcls).toBe(true);
      expect(pac.BlockPublicPolicy).toBe(true);
      expect(pac.IgnorePublicAcls).toBe(true);
      expect(pac.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have access logs bucket', () => {
      expect(template.Resources.S3AccessLogsBucket).toBeDefined();
      expect(template.Resources.S3AccessLogsBucket.Type).toBe(
        'AWS::S3::Bucket'
      );
      expect(template.Resources.S3AccessLogsBucket.Condition).toBe(
        'CreateS3AccessLogging'
      );
    });

    test('should have S3 bucket policy', () => {
      expect(template.Resources.SecureS3BucketPolicy).toBeDefined();
      expect(template.Resources.SecureS3BucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have S3 log group', () => {
      expect(template.Resources.S3LogGroup).toBeDefined();
      expect(template.Resources.S3LogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have VPC Flow Log resources', () => {
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLogRole.Condition).toBe(
        'CreateVPCFlowLogs'
      );
      expect(template.Resources.VPCFlowLogGroup.Condition).toBe(
        'CreateVPCFlowLogs'
      );
      expect(template.Resources.VPCFlowLog.Condition).toBe('CreateVPCFlowLogs');
    });

    test('should have NAT Gateway monitoring alarm', () => {
      expect(template.Resources.NATGatewayBytesOutAlarm).toBeDefined();
      expect(template.Resources.NATGatewayBytesOutAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'VPCCidr',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'SSHSecurityGroupId',
        'SecureS3BucketName',
        'SecureS3BucketArn',
        'NATGatewayId',
        'NATGatewayEIP',
        'S3LogGroupName',
        'EnvironmentSuffix',
        'ProjectName',
        'StackName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('conditional outputs should exist', () => {
      expect(template.Outputs.S3AccessLogsBucketName).toBeDefined();
      expect(template.Outputs.S3AccessLogsBucketName.Condition).toBe(
        'CreateS3AccessLogging'
      );

      expect(template.Outputs.VPCFlowLogGroupName).toBeDefined();
      expect(template.Outputs.VPCFlowLogGroupName.Condition).toBe(
        'CreateVPCFlowLogs'
      );
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId',
      });
    });

    test('subnet outputs should be correct', () => {
      const output = template.Outputs.PublicSubnet1Id;
      expect(output.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PublicSubnet1Id',
      });
    });

    test('security group output should be correct', () => {
      const output = template.Outputs.SSHSecurityGroupId;
      expect(output.Value).toEqual({ Ref: 'SSHSecurityGroup' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SSHSecurityGroupId',
      });
    });

    test('S3 bucket outputs should be correct', () => {
      const bucketNameOutput = template.Outputs.SecureS3BucketName;
      expect(bucketNameOutput.Value).toEqual({ Ref: 'SecureS3Bucket' });
      expect(bucketNameOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SecureS3BucketName',
      });

      const bucketArnOutput = template.Outputs.SecureS3BucketArn;
      expect(bucketArnOutput.Value).toEqual({
        'Fn::GetAtt': ['SecureS3Bucket', 'Arn'],
      });
      expect(bucketArnOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SecureS3BucketArn',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have appropriate number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(11); // Updated to match actual count
    });

    test('should have appropriate number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(25); // Updated for additional resources
    });

    test('should have appropriate number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(17); // Updated to match actual count
    });

    test('should validate CloudFormation template syntax', () => {
      // Validate all resources have proper Type and Properties
      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::[A-Za-z0-9]+::[A-Za-z0-9]+$/);
      });
    });

    test('should have valid parameter constraints', () => {
      // Check EnvironmentSuffix parameter constraints
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(envParam.ConstraintDescription).toBe(
        'Must contain only lowercase letters, numbers, and hyphens'
      );

      // Check ProjectName parameter constraints
      const projectParam = template.Parameters.ProjectName;
      expect(projectParam.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(projectParam.ConstraintDescription).toBe(
        'Must contain only lowercase letters, numbers, and hyphens'
      );
    });

    test('should have metadata for CloudFormation Interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toHaveLength(3);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention with environment suffix', () => {
      // Test VPC name
      const vpc = template.Resources.VPC;
      const vpcTags = vpc.Properties.Tags;
      const nameTag = vpcTags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${ProjectName}-VPC-${EnvironmentSuffix}',
      });
    });

    test('export names should follow stack naming convention', () => {
      // Test VPCId export (uses stack name, not project name)
      const vpcOutput = template.Outputs.VPCId;
      expect(vpcOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId',
      });

      // Test SSH Security Group export
      const sgOutput = template.Outputs.SSHSecurityGroupId;
      expect(sgOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SSHSecurityGroupId',
      });
    });

    test('S3 bucket names should include environment suffix and account ID', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': [
          '${projectname}-secure-bucket-${environment}-${AWS::AccountId}-${region}',
          {
            projectname: { Ref: 'ProjectName' },
            environment: { Ref: 'EnvironmentSuffix' },
            region: { Ref: 'AWS::Region' },
          },
        ],
      });
    });
  });

  describe('Additional Security Features', () => {
    test('should have VPC Flow Logs configured conditionally', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLog.Condition).toBe('CreateVPCFlowLogs');
    });

    test('should have S3 access logs bucket conditionally', () => {
      expect(template.Resources.S3AccessLogsBucket).toBeDefined();
      expect(template.Resources.S3AccessLogsBucket.Type).toBe(
        'AWS::S3::Bucket'
      );
      expect(template.Resources.S3AccessLogsBucket.Condition).toBe(
        'CreateS3AccessLogging'
      );
    });

    test('should have CloudWatch log groups', () => {
      expect(template.Resources.S3LogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
    });

    test('should have proper IAM roles and policies', () => {
      const flowLogRole = template.Resources.VPCFlowLogRole;
      expect(flowLogRole.Type).toBe('AWS::IAM::Role');
      expect(flowLogRole.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(flowLogRole.Properties.Policies).toBeDefined();
    });

    test('should have proper deletion policies for QA compliance', () => {
      // S3 buckets should have deletion policy for QA pipeline cleanup
      const secureS3Bucket = template.Resources.SecureS3Bucket;
      const accessLogsBucket = template.Resources.S3AccessLogsBucket;

      // Check deletion policies are set to Delete for QA compliance
      expect(secureS3Bucket.DeletionPolicy).toBe('Delete');
      expect(secureS3Bucket.UpdateReplacePolicy).toBe('Delete');
      expect(accessLogsBucket.DeletionPolicy).toBe('Delete');
      expect(accessLogsBucket.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('QA Pipeline Compliance', () => {
    test('should support environment suffix in all resource names', () => {
      // Check that key resources include environment suffix
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${ProjectName}-VPC-${EnvironmentSuffix}',
      });
    });

    test('should have all outputs properly exported for stack imports', () => {
      const requiredExports = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'SSHSecurityGroupId',
        'SecureS3BucketName',
        'SecureS3BucketArn',
        'NATGatewayId',
      ];

      requiredExports.forEach(exportName => {
        const output = template.Outputs[exportName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('should validate cfn-outputs compatibility', () => {
      // All outputs should have simple Value references for cfn-outputs
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Value).toBeDefined();
        // Value should be either Ref, GetAtt, or Sub function
        const hasValidValue =
          output.Value.Ref ||
          output.Value['Fn::GetAtt'] ||
          output.Value['Fn::Sub'];
        expect(hasValidValue).toBeTruthy();
      });
    });

    test('should have proper tagging for cost allocation', () => {
      // VPC should have proper tags
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;

      // Check for required tags
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${ProjectName}-VPC-${EnvironmentSuffix}',
      });

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });

      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toEqual({ Ref: 'ProjectName' });

      const costCenterTag = tags.find((tag: any) => tag.Key === 'CostCenter');
      expect(costCenterTag).toBeDefined();
      expect(costCenterTag.Value).toEqual({ Ref: 'CostCenter' });

      const managedByTag = tags.find((tag: any) => tag.Key === 'ManagedBy');
      expect(managedByTag).toBeDefined();
      expect(managedByTag.Value).toBe('CloudFormation');
    });
  });
});
