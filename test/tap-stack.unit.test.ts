import * as fs from 'fs';
import * as path from 'path';


// Use the correct relative path
const templatePath = path.join(__dirname, '../lib/TapStack.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));


describe('CloudFormation Template', () => {
  test('should have a VPC', () => {
    expect(template.Resources.VPC).toBeDefined();
    expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
  });


  test('should have a KeyPair with correct properties', () => {
    const keyPair = template.Resources.MyKeyPair;
    expect(keyPair).toBeDefined();
    expect(keyPair.Type).toBe('AWS::EC2::KeyPair');


    // Check Fn::Sub exists and has the correct value
    expect(keyPair.Properties.KeyName).toHaveProperty('Fn::Sub', '${AWS::StackName}-keypair');
  });


  test('should have public subnet configured', () => {
    const subnet = template.Resources.PublicSubnet;
    expect(subnet).toBeDefined();
    expect(subnet.Type).toBe('AWS::EC2::Subnet');
    expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
  });


  test('should have Internet Gateway attached to VPC', () => {
    const igw = template.Resources.InternetGateway;
    const attach = template.Resources.AttachGateway;


    expect(igw).toBeDefined();
    expect(attach.Properties.VpcId.Ref).toBe('VPC');
    expect(attach.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
  });


  test('should have Security Group for EC2 with ingress and egress rules', () => {
    const sg = template.Resources.EC2SecurityGroup;
    expect(sg).toBeDefined();
    expect(sg.Properties.GroupDescription).toBe('Security group for EC2 instances');
    expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
    expect(sg.Properties.SecurityGroupEgress[0].IpProtocol).toBe(-1);
  });


  test('should have LaunchTemplate and EC2 Instances', () => {
    const lt = template.Resources.EC2LaunchTemplate;
    expect(lt).toBeDefined();


    for (let i = 1; i <= 10; i++) {
      const instance = template.Resources[`EC2Instance${i}`];
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.LaunchTemplate.LaunchTemplateId.Ref).toBe('EC2LaunchTemplate');
    }
  });


  test('should have CloudWatch Alarms', () => {
    for (let i = 1; i <= 10; i++) {
      const alarm = template.Resources[`CPUAlarm${i}`];
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    }
  });


  test('should have S3 Logs Bucket', () => {
    const bucket = template.Resources.LogsBucket;
    expect(bucket).toBeDefined();
    expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
  });
});
