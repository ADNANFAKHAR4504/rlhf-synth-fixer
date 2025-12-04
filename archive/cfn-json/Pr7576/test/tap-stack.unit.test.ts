import fs from 'fs';
import path from 'path';

function loadTemplate() {
  const templatePath = path.join(__dirname, '../lib/TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(templateContent);
}

describe('TapStack CloudFormation Template (lib/TapStack.json) - Focused Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    template = loadTemplate();
  });

  test('has description with PCI', () => {
    expect(template.Description).toBeDefined();
    expect(template.Description).toContain('PCI');
  });

  test('EnvironmentSuffix parameter defaults to dev', () => {
    expect(template.Parameters).toBeDefined();
    expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
  });

  test('VPC exists with correct cidr and DNS settings', () => {
    expect(template.Resources.VPC).toBeDefined();
    expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
  });

  test('DataBucket is encrypted with KMS and versioned', () => {
    expect(template.Resources.DataBucket).toBeDefined();
    const bucket = template.Resources.DataBucket;
    expect(bucket.Type).toBe('AWS::S3::Bucket');
    expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    const sse = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
    expect(sse.SSEAlgorithm).toBe('aws:kms');
  });

  test('DataValidationFunction runtime and VPC config are correct', () => {
    const fn = template.Resources.DataValidationFunction;
    expect(fn).toBeDefined();
    expect(fn.Type).toBe('AWS::Lambda::Function');
    expect(fn.Properties.Runtime).toBe('nodejs22.x');
    expect(fn.Properties.VpcConfig.SubnetIds.length).toBe(3);
  });

  test('VPCFlowLog exists and references the log group', () => {
    const flow = template.Resources.VPCFlowLog;
    expect(flow).toBeDefined();
    expect(flow.Type).toBe('AWS::EC2::FlowLog');
    expect(flow.Properties.LogGroupName).toEqual({ Ref: 'VPCFlowLogsLogGroup' });
  });

  test('Outputs include VPCId and DataBucketName references', () => {
    expect(template.Outputs.VPCId).toBeDefined();
    expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    expect(template.Outputs.DataBucketName).toBeDefined();
    expect(template.Outputs.DataBucketName.Value).toEqual({ Ref: 'DataBucket' });
  });

  test('Private subnets exist and have correct CIDRs and MapPublicIpOnLaunch false', () => {
    const sub1 = template.Resources.PrivateSubnet1;
    const sub2 = template.Resources.PrivateSubnet2;
    const sub3 = template.Resources.PrivateSubnet3;
    expect(sub1).toBeDefined();
    expect(sub1.Type).toBe('AWS::EC2::Subnet');
    expect(sub1.Properties.CidrBlock).toBe('10.0.1.0/24');
    expect(sub1.Properties.MapPublicIpOnLaunch).toBe(false);

    expect(sub2).toBeDefined();
    expect(sub2.Properties.CidrBlock).toBe('10.0.2.0/24');
    expect(sub2.Properties.MapPublicIpOnLaunch).toBe(false);

    expect(sub3).toBeDefined();
    expect(sub3.Properties.CidrBlock).toBe('10.0.3.0/24');
    expect(sub3.Properties.MapPublicIpOnLaunch).toBe(false);
  });

  test('Private subnets have availability zone selection and PCI tags', () => {
    const sub1 = template.Resources.PrivateSubnet1;
    const azSelect = sub1.Properties.AvailabilityZone;
    expect(azSelect['Fn::Select'][0]).toBe('0');
    expect(sub1.Properties.Tags.some((t: any) => t.Key === 'DataClassification' && t.Value === 'PCI')).toBe(true);
  });

  test('Private route table exists with PCI tags', () => {
    const rt = template.Resources.PrivateRouteTable;
    expect(rt).toBeDefined();
    expect(rt.Type).toBe('AWS::EC2::RouteTable');
    expect(rt.Properties.Tags.some((t: any) => t.Key === 'Name')).toBe(true);
  });

  test('Subnet route table associations reference correct resources', () => {
    const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
    const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;
    const assoc3 = template.Resources.PrivateSubnet3RouteTableAssociation;
    expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
    expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    expect(assoc3.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet3' });
    expect(assoc3.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
  });

  test('S3 VPC Endpoint is gateway type and allows expected actions', () => {
    const s3ep = template.Resources.S3VPCEndpoint;
    expect(s3ep).toBeDefined();
    expect(s3ep.Type).toBe('AWS::EC2::VPCEndpoint');
    expect(s3ep.Properties.VpcEndpointType).toBe('Gateway');
    expect(s3ep.Properties.ServiceName['Fn::Sub']).toContain('s3');
    const actions = s3ep.Properties.PolicyDocument.Statement[0].Action;
    expect(actions).toContain('s3:GetObject');
    expect(actions).toContain('s3:PutObject');
    expect(actions).toContain('s3:ListBucket');
    expect(s3ep.Properties.RouteTableIds).toEqual([{ Ref: 'PrivateRouteTable' }]);
  });

  test('KMS VPC Endpoint is interface type and uses 3 subnets', () => {
    const kmsEp = template.Resources.KMSVPCEndpoint;
    expect(kmsEp).toBeDefined();
    expect(kmsEp.Type).toBe('AWS::EC2::VPCEndpoint');
    expect(kmsEp.Properties.VpcEndpointType).toBe('Interface');
    expect(kmsEp.Properties.PrivateDnsEnabled).toBe(true);
    expect(kmsEp.Properties.SubnetIds.length).toBe(3);
    expect(kmsEp.Properties.SecurityGroupIds[0]).toEqual({ Ref: 'KMSEndpointSecurityGroup' });
  });

  test('KMS endpoint security group configured with tags and egress rules empty', () => {
    const sg = template.Resources.KMSEndpointSecurityGroup;
    expect(sg).toBeDefined();
    expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    expect(sg.Properties.SecurityGroupEgress.length).toBe(0);
    expect(sg.Properties.Tags.some((t: any) => t.Key === 'DataClassification' && t.Value === 'PCI')).toBe(true);
  });

  test('KMS endpoint ingress and Lambda SG egress to KMS SG are present and port 443', () => {
    const ingress = template.Resources.KMSEndpointSecurityGroupIngress;
    const egress = template.Resources.LambdaSecurityGroupEgress;
    expect(ingress.Properties.FromPort).toBe(443);
    expect(ingress.Properties.ToPort).toBe(443);
    expect(ingress.Properties.IpProtocol).toBe('tcp');
    expect(ingress.Properties.SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });

    expect(egress.Properties.FromPort).toBe(443);
    expect(egress.Properties.ToPort).toBe(443);
    expect(egress.Properties.Description).toContain('Allow HTTPS to KMS endpoint');
    expect(egress.Properties.DestinationSecurityGroupId).toEqual({ Ref: 'KMSEndpointSecurityGroup' });
  });

  test('KMS Key has Retain policy and alias exists and references key', () => {
    const key = template.Resources.KMSKey;
    expect(key).toBeDefined();
    expect(key.DeletionPolicy).toBe('Retain');
    expect(key.UpdateReplacePolicy).toBe('Retain');
    expect(template.Resources.KMSKeyAlias.Properties.TargetKeyId.Ref).toBe('KMSKey');
  });

  test('DataBucket has Retain DeletionPolicy and encrypted with KMS & BucketKeyEnabled', () => {
    const bucket = template.Resources.DataBucket;
    expect(bucket.DeletionPolicy).toBe('Retain');
    expect(bucket.UpdateReplacePolicy).toBe('Retain');
    const sse = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
    expect(sse.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    expect(sse.BucketKeyEnabled).toBe(true);
  });

  test('DataBucket has lifecycle rule to delete old versions', () => {
    const rules = template.Resources.DataBucket.Properties.LifecycleConfiguration.Rules;
    expect(rules.some((r: any) => r.Id === 'DeleteOldVersions' && r.NoncurrentVersionExpirationInDays === 90)).toBe(true);
  });

  test('DataBucket policy denies unencrypted uploads and insecure transport', () => {
    const policy = template.Resources.DataBucketPolicy.Properties.PolicyDocument.Statement;
    const denyUpload = policy.find((p: any) => p.Sid === 'DenyUnencryptedObjectUploads');
    expect(denyUpload.Effect).toBe('Deny');
    expect(denyUpload.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
    const denyInsecure = policy.find((p: any) => p.Sid === 'DenyInsecureTransport');
    expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');
  });

  test('VPC Flow Logs LogGroup retention and KMS encryption', () => {
    const lg = template.Resources.VPCFlowLogsLogGroup;
    expect(lg).toBeDefined();
    expect(lg.Properties.RetentionInDays).toBe(90);
    expect(lg.Properties.KmsKeyId['Fn::GetAtt'][0]).toBe('KMSKey');
  });

  test('VPC Flow Logs role contains expected log permissions', () => {
    const role = template.Resources.VPCFlowLogsRole;
    const stmts = role.Properties.Policies[0].PolicyDocument.Statement;
    expect(stmts.some((s: any) => s.Action.includes('logs:CreateLogGroup'))).toBe(true);
    expect(stmts[0].Resource['Fn::GetAtt'][0]).toBe('VPCFlowLogsLogGroup');
  });

  test('Lambda execution role includes AWSLambdaVPCAccessExecutionRole managed policy and correct S3/KMS statements', () => {
    const role = template.Resources.LambdaExecutionRole;
    expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3Access');
    expect(s3Policy.PolicyDocument.Statement.some((s: any) => s.Action.includes('s3:GetObject'))).toBe(true);
    const kmsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'KMSAccess');
    expect(kmsPolicy.PolicyDocument.Statement.some((s: any) => s.Action.includes('kms:GenerateDataKey'))).toBe(true);
  });

  test('Lambda environment variables reference DataBucket and KMSKey', () => {
    const envVars = template.Resources.DataValidationFunction.Properties.Environment.Variables;
    expect(envVars.DATA_BUCKET).toEqual({ Ref: 'DataBucket' });
    expect(envVars.KMS_KEY_ID).toEqual({ Ref: 'KMSKey' });
  });

  test('DataValidationFunction code contains validation logging string', () => {
    const code = template.Resources.DataValidationFunction.Properties.Code.ZipFile;
    expect(code).toContain('Validating payment card data...');
  });

  test('SecurityAlertTopic has KMS master key configured and meaningful DisplayName', () => {
    const topic = template.Resources.SecurityAlertTopic;
    expect(topic.Properties.DisplayName).toBe('PCI Security Alerts');
    expect(topic.Properties.KmsMasterKeyId.Ref).toBe('KMSKey');
  });

  test('ConfigBucket is encrypted, public access blocked, and has expected policy statements', () => {
    const cb = template.Resources.ConfigBucket;
    expect(cb.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    expect(cb.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    const policyDoc = template.Resources.ConfigBucketPolicy.Properties.PolicyDocument.Statement;
    expect(policyDoc.some((s: any) => s.Sid === 'AWSConfigBucketPermissionsCheck')).toBe(true);
    expect(policyDoc.some((s: any) => s.Sid === 'AWSConfigBucketDelivery')).toBe(true);
  });

  test('Config SSM parameter names exist for DataBucket and KMSKey', () => {
    const param = template.Resources.ConfigParameter;
    expect(param.Properties.Name['Fn::Sub']).toContain('/pci/config/${EnvironmentSuffix}/data-bucket');
    const kmsParam = template.Resources.KMSKeyParameter;
    expect(kmsParam.Properties.Name['Fn::Sub']).toContain('/pci/config/${EnvironmentSuffix}/kms-key-id');
  });

  test('Outputs include KMSKeyArn and DataValidationFunctionArn', () => {
    expect(template.Outputs.KMSKeyArn).toBeDefined();
    expect(template.Outputs.DataValidationFunctionArn).toBeDefined();
    expect(template.Outputs.KMSKeyArn.Value['Fn::GetAtt'][0]).toBe('KMSKey');
  });
});
