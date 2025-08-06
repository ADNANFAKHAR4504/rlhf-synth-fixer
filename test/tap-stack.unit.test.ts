import fs from 'fs';
import path from 'path';

describe('Secure Web Environment CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing - you may need to adjust the path
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); 
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    // Assuming you have yaml parser or convert to JSON
    template = JSON.parse(templateContent); // You'll need to convert YAML to JSON first
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBe(
        'Compliant CloudFormation template for a secure web environment with a new VPC and best practices applied'
      );
    });
  });

  describe('Parameters', () => {
    test('should define BatchName parameter with default', () => {
      const param = template.Parameters.BatchName;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('Batch name for tagging');
      expect(param.Default).toBe('1056');
    });

    test('should define ProjectId parameter with default', () => {
      const param = template.Parameters.ProjectId;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('Project ID for tagging');
      expect(param.Default).toBe('166');
    });

    test('should define ProjectName parameter with default', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('Project name for tagging');
      expect(param.Default).toBe('IaC - AWS Nova Model Breaking');
    });

    test('should define ProblemID parameter with default', () => {
      const param = template.Parameters.ProblemID;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('Problem ID for tagging');
      expect(param.Default).toBe('Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f');
    });

    test('should define AllowedIPAddress parameter correctly', () => {
      const param = template.Parameters.AllowedIPAddress;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('IP address allowed for SSH access');
      expect(param.AllowedPattern).toBe('^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/32$');
      expect(param.ConstraintDescription).toBe('Must be a valid CIDR IP address');
      expect(param.Default).toBe('203.0.113.10/32');
    });

    test('should define LatestAmiId parameter correctly', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(param.Description).toBe('Latest Amazon Linux 2 AMI from SSM Parameter Store');
    });
  });

  describe('Resources', () => {
    test('should define all expected resources', () => {
      const expectedResources = [
        'KMSKey',
        'KMSKeyAlias',
        'VPC',
        'InternetGateway',
        'VPCGatewayAttachment',
        'PublicSubnet',
        'PublicRouteTable',
        'PublicRoute',
        'SubnetRouteTableAssociation',
        'InstanceSecurityGroup',
        'SecureParameterLambdaRole',
        'SecureParameterLambda',
        'ConfigParameter',
        'EC2Role',
        'EC2InstanceProfile',
        'ElasticIP',
        'EC2Instance',
        'EIPAssociation'
      ];
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('KMSKey should have correct configuration', () => {
      const key = template.Resources.KMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toBe('KMS key for encrypting SSM parameters');
      expect(key.Properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(key.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebKMSKey' });
    });

    test('VPC should have correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebVPC' });
    });

    test('PublicSubnet should have correct configuration', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebSubnet' });
    });

    test('InstanceSecurityGroup should restrict SSH to AllowedIPAddress', () => {
      const sg = template.Resources.InstanceSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(sg.Properties.GroupDescription).toBe('Security group for EC2 instance with restricted SSH access');
      expect(sg.Properties.SecurityGroupIngress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        CidrIp: { Ref: 'AllowedIPAddress' }
      });
      expect(sg.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebSG' });
    });

    test('SecureParameterLambdaRole should have correct IAM policies', () => {
      const role = template.Resources.SecureParameterLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(role.Properties.Policies[0].PolicyName).toBe('SSMParameterPolicy');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toContain('ssm:PutParameter');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toContain('ssm:DeleteParameter');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[1].Action).toContain('kms:Encrypt');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[1].Action).toContain('kms:Decrypt');
    });

    test('SecureParameterLambda should have correct configuration', () => {
      const lambda = template.Resources.SecureParameterLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['SecureParameterLambdaRole', 'Arn'] });
      expect(lambda.Properties.Code.ZipFile).toContain('import boto3');
      expect(lambda.Properties.Code.ZipFile).toContain('cfnresponse');
    });

    test('ConfigParameter should be a custom resource', () => {
      const param = template.Resources.ConfigParameter;
      expect(param.Type).toBe('AWS::CloudFormation::CustomResource');
      expect(param.Properties.ServiceToken).toEqual({ 'Fn::GetAtt': ['SecureParameterLambda', 'Arn'] });
      expect(param.Properties.Name).toBe('/secure-web/config');
      expect(param.Properties.Value).toBe('example-config-value');
      expect(param.Properties.KeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('EC2Role should have correct IAM policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(role.Properties.Policies[0].PolicyName).toBe('SSMParameterAccess');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toContain('ssm:GetParameter');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[1].Action).toContain('kms:Decrypt');
    });

    test('EC2InstanceProfile should reference EC2Role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });

    test('ElasticIP should be set for VPC', () => {
      const eip = template.Resources.ElasticIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('EC2Instance should have correct configuration', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t3.micro');
      expect(instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(instance.Properties.SecurityGroupIds).toEqual([{ Ref: 'InstanceSecurityGroup' }]);
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      expect(instance.Properties.UserData['Fn::Base64']['Fn::Sub']).toContain('yum update -y');
      expect(instance.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebInstance' });
    });

    test('EIPAssociation should link EIP to EC2Instance', () => {
      const assoc = template.Resources.EIPAssociation;
      expect(assoc.Type).toBe('AWS::EC2::EIPAssociation');
      expect(assoc.Properties.InstanceId).toEqual({ Ref: 'EC2Instance' });
      expect(assoc.Properties.EIP).toEqual({ Ref: 'ElasticIP' });
    });

    test('all resources should have proper tagging', () => {
      const taggedResources = [
        'KMSKey', 'VPC', 'InternetGateway', 'PublicSubnet', 'PublicRouteTable',
        'InstanceSecurityGroup', 'SecureParameterLambdaRole', 'SecureParameterLambda',
        'EC2Role', 'ElasticIP', 'EC2Instance'
      ];
      
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags).toContainEqual({ Key: 'batchName', Value: { Ref: 'BatchName' } });
        expect(resource.Properties.Tags).toContainEqual({ Key: 'projectId', Value: { Ref: 'ProjectId' } });
        expect(resource.Properties.Tags).toContainEqual({ Key: 'projectName', Value: { Ref: 'ProjectName' } });
        expect(resource.Properties.Tags).toContainEqual({ Key: 'ProblemID', Value: { Ref: 'ProblemID' } });
      });
    });
  });

  describe('Outputs', () => {
    test('should define all expected outputs', () => {
      const expectedOutputs = ['InstancePublicIP', 'VPCId', 'InstanceId', 'ParameterName'];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('InstancePublicIP should reference ElasticIP', () => {
      expect(template.Outputs.InstancePublicIP.Value).toEqual({ Ref: 'ElasticIP' });
      expect(template.Outputs.InstancePublicIP.Description).toBe('Public IP address of the EC2 instance');
    });

    test('VPCId should reference VPC', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.VPCId.Description).toBe('ID of the VPC used');
    });

    test('InstanceId should reference EC2Instance', () => {
      expect(template.Outputs.InstanceId.Value).toEqual({ Ref: 'EC2Instance' });
      expect(template.Outputs.InstanceId.Description).toBe('ID of the EC2 instance');
    });

    test('ParameterName should have correct value', () => {
      expect(template.Outputs.ParameterName.Value).toBe('/secure-web/config');
      expect(template.Outputs.ParameterName.Description).toBe('Name of the secure parameter created');
    });
  });

  describe('Template Validation', () => {
    test('should have proper dependency relationships', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');
      
      const vpcGatewayAttachment = template.Resources.VPCGatewayAttachment;
      expect(vpcGatewayAttachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(vpcGatewayAttachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have correct resource references', () => {
      // Test key resource references
      expect(template.Resources.PublicSubnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PublicRouteTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.InstanceSecurityGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.SubnetRouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(template.Resources.SubnetRouteTableAssociation.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should use consistent naming convention', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceName => {
        // Check that resource names follow PascalCase
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });
  });
});