import * as fs from 'fs';
import * as path from 'path';

const templatePath = path.join(__dirname, '../templates/development_stack_template.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

describe('CloudFormation Template Integration Tests', () => {

  test('EC2 instance should be associated with a subnet and security group via parameters', () => {
    const ec2Props = template.Resources['DevInstance'].Properties;
    const networkInterface = ec2Props.NetworkInterfaces[0];

    expect(networkInterface.SubnetId).toEqual({ Ref: 'SubnetId' });
    expect(networkInterface.GroupSet[0]).toEqual({ Ref: 'SecurityGroupId' });
  });

  test('EC2 instance should use IAM instance profile from created role', () => {
    const profileRef = template.Resources['DevInstance'].Properties.IamInstanceProfile;
    expect(profileRef).toEqual({ Ref: 'S3ReadOnlyInstanceProfile' });

    const instanceProfile = template.Resources['S3ReadOnlyInstanceProfile'];
    const roleRef = instanceProfile.Properties.Roles[0];
    expect(roleRef).toEqual({ Ref: 'S3ReadOnlyInstanceRole' });
  });

  test('CloudWatch alarm should reference EC2 instance for CPU monitoring', () => {
    const alarm = template.Resources['CPUAlarmHigh'].Properties;
    const dimension = alarm.Dimensions.find((d: any) => d.Name === "InstanceId");
    expect(dimension.Value).toEqual({ Ref: 'DevInstance' });
  });

  test('S3 bucket policy should correctly reference public S3 bucket ARN', () => {
    const policyDoc = template.Resources['S3BucketPolicy'].Properties.PolicyDocument;
    const statement = policyDoc.Statement[0];
    expect(statement.Resource).toEqual({ "Fn::Sub": "${PublicS3Bucket.Arn}/*" });
  });

  test('Outputs must expose both EC2 Public IP and S3 bucket name', () => {
    const outputs = template.Outputs;
    expect(outputs.S3BucketName.Value).toEqual({ Ref: 'PublicS3Bucket' });
    expect(outputs.EC2PublicIP.Value).toEqual({ Ref: 'EC2EIP' });
  });

});
