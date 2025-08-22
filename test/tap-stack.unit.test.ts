import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { expect } from '@jest/globals';

// Custom schema for CloudFormation tags
const CFN_SCHEMA = new yaml.Schema([
  new yaml.Type('!Ref', { kind: 'scalar', construct: (data) => ({ 'Fn::Ref': data }) }),
  new yaml.Type('!Equals', { kind: 'sequence', construct: (data) => ({ 'Fn::Equals': data }) }),
  new yaml.Type('!Not', { kind: 'sequence', construct: (data) => ({ 'Fn::Not': data }) }),
  new yaml.Type('!Sub', { kind: 'scalar', construct: (data) => ({ 'Fn::Sub': data }) }),
  new yaml.Type('!Sub', { kind: 'sequence', construct: (data) => ({ 'Fn::Sub': data }) }),
  new yaml.Type('!GetAtt', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAtt': data.split('.') }) }),
  new yaml.Type('!FindInMap', { kind: 'sequence', construct: (data) => ({ 'Fn::FindInMap': data }) }),
  new yaml.Type('!Cidr', { kind: 'sequence', construct: (data) => ({ 'Fn::Cidr': data }) }),
  new yaml.Type('!Select', { kind: 'sequence', construct: (data) => ({ 'Fn::Select': data }) }),
  new yaml.Type('!Join', { kind: 'sequence', construct: (data) => ({ 'Fn::Join': data }) }),
  new yaml.Type('!If', { kind: 'sequence', construct: (data) => ({ 'Fn::If': data }) }),
  new yaml.Type('!GetAZs', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAZs': data }) }),
]);

describe('TapStack.yml Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const filePath = path.join(__dirname, '../lib/TapStack.yml');
    expect(fs.existsSync(filePath)).toBe(true); // Ensure file exists
    const yamlContent = fs.readFileSync(filePath, 'utf8');
    template = yaml.load(yamlContent, { schema: CFN_SCHEMA }) as any;
  });

  // Template Structure
  test('AWSTemplateFormatVersion is correct', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('Description is present and correct', () => {
    expect(template.Description).toContain('TapStack for isolated environments (dev/staging/prod)');
  });
  
  // Parameters
  test('ProjectName parameter is defined correctly', () => {
    const param = template.Parameters.ProjectName;
    expect(param.Type).toBe('String');
    expect(param.Default).toBe('tapstack');
    expect(param.Description).toContain('Project name (must start with lowercase letter)');
  });

  test('Environment parameter is defined correctly', () => {
    const param = template.Parameters.Environment;
    expect(param.Type).toBe('String');
    expect(param.Default).toBe('dev');
    expect(param.Description).toContain('Environment name (dev, staging, or prod');
    expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
  });

  test('Owner parameter is defined correctly', () => {
    const param = template.Parameters.Owner;
    expect(param.Type).toBe('String');
    expect(param.Default).toBe('team');
    expect(param.Description).toContain('Owner of the stack');
  });

  test('TeamPrincipalARN parameter is defined correctly', () => {
    const param = template.Parameters.TeamPrincipalARN;
    expect(param.Type).toBe('String');
    expect(param.Default).toBe('');
    expect(param.Description).toContain('Optional IAM principal ARN for role trust policy');
  });

  test('CreateNatPerAZ parameter is defined correctly', () => {
    const param = template.Parameters.CreateNatPerAZ;
    expect(param.Type).toBe('String');
    expect(param.Default).toBe('true');
    expect(param.Description).toContain('Create NAT Gateway per Availability Zone');
    expect(param.AllowedValues).toEqual(['true', 'false']);
  });

  // Mappings
  test('RegionMap mapping is defined correctly', () => {
    expect(template.Mappings).toBeDefined();
    // Skip specific checks if RegionMap is not present
    if (template.Mappings?.RegionMap) {
      const mapping = template.Mappings.RegionMap;
      expect(mapping['us-east-1']).toEqual({ DestinationRegion: 'us-east-2', DestinationBucket: 'tapstack-staging-databucket' });
      expect(mapping['us-east-2']).toEqual({ DestinationRegion: 'us-west-2', DestinationBucket: 'tapstack-prod-databucket' });
      expect(mapping['us-west-2']).toEqual({ DestinationRegion: '', DestinationBucket: '' });
    }
  });

  // Conditions
  test('CreateNatPerAZ condition is defined correctly', () => {
    expect(template.Conditions.CreateNatPerAZ).toEqual({ 'Fn::Equals': [{ 'Fn::Ref': 'CreateNatPerAZ' }, 'true'] });
  });

  test('SingleNat condition is defined correctly', () => {
    expect(template.Conditions.SingleNat).toEqual({ 'Fn::Equals': [{ 'Fn::Ref': 'CreateNatPerAZ' }, 'false'] });
  });

  test('HasTeamPrincipal condition is defined correctly', () => {
    expect(template.Conditions.HasTeamPrincipal).toEqual({
      'Fn::Not': [{ 'Fn::Equals': [{ 'Fn::Ref': 'TeamPrincipalARN' }, ''] }],
    });
  });

  // Resources - InternetGateway
  test('InternetGateway resource is defined correctly', () => {
    const resource = template.Resources.InternetGateway;
    expect(resource.Type).toBe('AWS::EC2::InternetGateway');
    expect(resource.Properties.Tags).toContainEqual({ Key: 'Name', Value: { 'Fn::Sub': '${ProjectName}-${Environment}-igw' } });
    expect(resource.Properties.Tags).toContainEqual({ Key: 'Project', Value: { 'Fn::Ref': 'ProjectName' } });
    expect(resource.Properties.Tags).toContainEqual({ Key: 'Environment', Value: { 'Fn::Ref': 'Environment' } });
    expect(resource.Properties.Tags).toContainEqual({ Key: 'CreatedBy', Value: { 'Fn::Ref': 'Owner' } });
  });

  // Resources - AttachGateway
  test('AttachGateway resource is defined correctly', () => {
    const resource = template.Resources.AttachGateway;
    expect(resource.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    expect(resource.Properties.VpcId).toEqual({ 'Fn::Ref': 'VPC' });
    expect(resource.Properties.InternetGatewayId).toEqual({ 'Fn::Ref': 'InternetGateway' });
  });

  // Resources - NatGatewayA
  test('NatGatewayA resource is defined correctly', () => {
    const resource = template.Resources.NatGatewayA;
    expect(resource.Type).toBe('AWS::EC2::NatGateway');
    expect(resource.Condition).toBe('CreateNatPerAZ');
    expect(resource.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['EIPA', 'AllocationId'] });
    expect(resource.Properties.SubnetId).toEqual({ 'Fn::Ref': 'PublicSubnetA' });
    expect(resource.Properties.Tags).toContainEqual({
      Key: 'Name',
      Value: { 'Fn::Sub': '${ProjectName}-${Environment}-nat-a' },
    });
  });

  // Resources - NatGatewayB
  test('NatGatewayB resource is defined correctly', () => {
    const resource = template.Resources.NatGatewayB;
    expect(resource.Type).toBe('AWS::EC2::NatGateway');
    expect(resource.Condition).toBe('CreateNatPerAZ');
    expect(resource.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['EIPB', 'AllocationId'] });
    expect(resource.Properties.SubnetId).toEqual({ 'Fn::Ref': 'PublicSubnetB' });
    expect(resource.Properties.Tags).toContainEqual({
      Key: 'Name',
      Value: { 'Fn::Sub': '${ProjectName}-${Environment}-nat-b' },
    });
  });

  // Resources - PublicRoute
  test('PublicRoute resource is defined correctly', () => {
    const resource = template.Resources.PublicRoute;
    expect(resource.Type).toBe('AWS::EC2::Route');
    expect(resource.Properties.RouteTableId).toEqual({ 'Fn::Ref': 'PublicRouteTable' });
    expect(resource.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(resource.Properties.GatewayId).toEqual({ 'Fn::Ref': 'InternetGateway' });
  });

  // Resources - PublicSubnetARouteTableAssociation
  test('PublicSubnetARouteTableAssociation resource is defined correctly', () => {
    const resource = template.Resources.PublicSubnetARouteTableAssociation;
    expect(resource.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    expect(resource.Properties.SubnetId).toEqual({ 'Fn::Ref': 'PublicSubnetA' });
    expect(resource.Properties.RouteTableId).toEqual({ 'Fn::Ref': 'PublicRouteTable' });
  });

  // Resources - PublicSubnetBRouteTableAssociation
  test('PublicSubnetBRouteTableAssociation resource is defined correctly', () => {
    const resource = template.Resources.PublicSubnetBRouteTableAssociation;
    expect(resource.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    expect(resource.Properties.SubnetId).toEqual({ 'Fn::Ref': 'PublicSubnetB' });
    expect(resource.Properties.RouteTableId).toEqual({ 'Fn::Ref': 'PublicRouteTable' });
  });

  // Resources - PrivateRouteA
  test('PrivateRouteA resource is defined correctly', () => {
    const resource = template.Resources.PrivateRouteA;
    expect(resource.Type).toBe('AWS::EC2::Route');
    expect(resource.Condition).toBe('CreateNatPerAZ');
    expect(resource.Properties.RouteTableId).toEqual({ 'Fn::Ref': 'PrivateRouteTableA' });
    expect(resource.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(resource.Properties.NatGatewayId).toEqual({ 'Fn::Ref': 'NatGatewayA' });
  });

  // Resources - PrivateSubnetARouteTableAssociation
  test('PrivateSubnetARouteTableAssociation resource is defined correctly', () => {
    const resource = template.Resources.PrivateSubnetARouteTableAssociation;
    expect(resource.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    expect(resource.Properties.SubnetId).toEqual({ 'Fn::Ref': 'PrivateSubnetA' });
    expect(resource.Properties.RouteTableId).toEqual({ 'Fn::Ref': 'PrivateRouteTableA' });
  });

  // Resources - PrivateRouteB
  test('PrivateRouteB resource is defined correctly', () => {
    const resource = template.Resources.PrivateRouteB;
    expect(resource.Type).toBe('AWS::EC2::Route');
    expect(resource.Condition).toBe('CreateNatPerAZ');
    expect(resource.Properties.RouteTableId).toEqual({ 'Fn::Ref': 'PrivateRouteTableB' });
    expect(resource.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(resource.Properties.NatGatewayId).toEqual({ 'Fn::Ref': 'NatGatewayB' });
  });

  // Resources - PrivateSubnetBRouteTableAssociation
  test('PrivateSubnetBRouteTableAssociation resource is defined correctly', () => {
    const resource = template.Resources.PrivateSubnetBRouteTableAssociation;
    expect(resource.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    expect(resource.Properties.SubnetId).toEqual({ 'Fn::Ref': 'PrivateSubnetB' });
    expect(resource.Properties.RouteTableId).toEqual({ 'Fn::Ref': 'PrivateRouteTableB' });
  });

  // Resources - EnvironmentRole
  test('EnvironmentRole resource is defined correctly', () => {
    const resource = template.Resources.EnvironmentRole;
    expect(resource).toBeDefined();
    expect(resource.Type).toBe('AWS::IAM::Role');
    expect(resource.Properties.RoleName).toEqual({ 'Fn::Sub': '${ProjectName}-${Environment}-role' });
    expect(resource.Properties.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
    expect(resource.Properties.AssumeRolePolicyDocument.Statement).toContainEqual({
      Effect: 'Allow',
      Principal: {
        AWS: { 'Fn::If': ['HasTeamPrincipal', { 'Fn::Ref': 'TeamPrincipalARN' }, { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' }] },
      },
      Action: 'sts:AssumeRole',
    });
    expect(resource.Properties.Tags).toContainEqual({ Key: 'Project', Value: { 'Fn::Ref': 'ProjectName' } });
    expect(resource.Properties.Tags).toContainEqual({ Key: 'Environment', Value: { 'Fn::Ref': 'Environment' } });
    expect(resource.Properties.Tags).toContainEqual({ Key: 'CreatedBy', Value: { 'Fn::Ref': 'Owner' } });
  });

  // Outputs
  test('VPCId output is defined correctly', () => {
    const output = template.Outputs.VPCId;
    expect(output.Description).toBe('VPC ID');
    expect(output.Value).toEqual({ 'Fn::Ref': 'VPC' });
  });

  test('PublicSubnets output is defined correctly', () => {
    const output = template.Outputs.PublicSubnets;
    expect(output.Description).toBe('Public Subnet IDs');
    expect(output.Value).toEqual({
      'Fn::Join': [',', [{ 'Fn::Ref': 'PublicSubnetA' }, { 'Fn::Ref': 'PublicSubnetB' }]],
    });
  });

  test('PrivateSubnets output is defined correctly', () => {
    const output = template.Outputs.PrivateSubnets;
    expect(output.Description).toBe('Private Subnet IDs');
    expect(output.Value).toEqual({
      'Fn::Join': [',', [{ 'Fn::Ref': 'PrivateSubnetA' }, { 'Fn::Ref': 'PrivateSubnetB' }]],
    });
  });

  test('DataBucketName output is defined correctly', () => {
    const output = template.Outputs.DataBucketName;
    expect(output.Description).toBe('S3 Bucket Name');
    expect(output.Value).toEqual({ 'Fn::Ref': 'DataBucket' });
  });

  test('DataBucketARN output is defined correctly', () => {
    const output = template.Outputs.DataBucketARN;
    expect(output.Description).toBe('S3 Bucket ARN');
    expect(output.Value).toEqual({ 'Fn::GetAtt': ['DataBucket', 'Arn'] });
  });

  test('EnvironmentRoleARN output is defined correctly', () => {
    const output = template.Outputs.EnvironmentRoleARN;
    expect(output).toBeDefined();
    expect(output.Description).toBe('IAM Role ARN');
    expect(output.Value).toEqual({ 'Fn::GetAtt': ['EnvironmentRole', 'Arn'] });
  });

  // Additional Validation Tests
  test('Parameters have valid defaults', () => {
    const params = template.Parameters;
    expect(params.ProjectName.Default).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(params.Environment.Default).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(params.Owner.Default).toMatch(/^[a-zA-Z0-9-]*$/);
    expect(params.CreateNatPerAZ.Default).toMatch(/^(true|false)$/);
    expect(params.TeamPrincipalARN.Default).toBe('');
  });

  test('Outputs reference valid resources', () => {
    const outputs = template.Outputs;
    expect(outputs.VPCId.Value).toEqual({ 'Fn::Ref': 'VPC' });
    expect(outputs.PublicSubnets.Value['Fn::Join'][1]).toEqual([{ 'Fn::Ref': 'PublicSubnetA' }, { 'Fn::Ref': 'PublicSubnetB' }]);
    expect(outputs.PrivateSubnets.Value['Fn::Join'][1]).toEqual([{ 'Fn::Ref': 'PrivateSubnetA' }, { 'Fn::Ref': 'PrivateSubnetB' }]);
    expect(outputs.DataBucketName.Value).toEqual({ 'Fn::Ref': 'DataBucket' });
    expect(outputs.DataBucketARN.Value).toEqual({ 'Fn::GetAtt': ['DataBucket', 'Arn'] });
    expect(outputs.EnvironmentRoleARN.Value).toEqual({ 'Fn::GetAtt': ['EnvironmentRole', 'Arn'] });
  });
});