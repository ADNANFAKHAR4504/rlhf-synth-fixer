import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

const templatePath = path.join(__dirname, '../lib/TapStack.json');
const templateContent = fs.readFileSync(templatePath, 'utf8');
const template = Template.fromString(templateContent);

describe('CloudFormation Template Validation', () => {
  test('should create a VPC with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsSupport: true,
      EnableDnsHostnames: true,
    });
  });



  test('should attach Internet Gateway to VPC', () => {
    template.hasResource('AWS::EC2::VPCGatewayAttachment', {
      Properties: {
        VpcId: { Ref: 'ProjectVPC' },
        InternetGatewayId: { Ref: 'ProjectInternetGateway' },
      },
    });
  });

  test('should create an S3 bucket with encryption and public access block', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
            BucketKeyEnabled: true,
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('should create lifecycle rule for incomplete uploads', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'DeleteIncompleteMultipartUploads',
            Status: 'Enabled',
            AbortIncompleteMultipartUpload: {
              DaysAfterInitiation: 7,
            },
          },
        ],
      },
    });
  });

  test('should create IAM role with EC2 trust policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: ['ec2.amazonaws.com'],
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });
  });

  

  test('should create instance profile referencing IAM role', () => {
    template.hasResourceProperties('AWS::IAM::InstanceProfile', {
      Roles: [{ Ref: 'S3ReadOnlyRole' }],
    });
  });

  test('should export VPC ID and CIDR block', () => {
  template.hasOutput('VPCId', {
    Export: {
      Name: {
        'Fn::Sub': '${ProjectName}-${Environment}-VPC-ID',
      },
    },
  });

  template.hasOutput('VPCCidrBlock', {
    Export: {
      Name: {
        'Fn::Sub': '${ProjectName}-${Environment}-VPC-CIDR',
      },
    },
  });
});

test('should export S3 bucket name and ARN', () => {
  template.hasOutput('S3BucketName', {
    Export: {
      Name: {
        'Fn::Sub': '${ProjectName}-${Environment}-S3-Bucket-Name',
      },
    },
  });

  template.hasOutput('S3BucketArn', {
    Export: {
      Name: {
        'Fn::Sub': '${ProjectName}-${Environment}-S3-Bucket-ARN',
      },
    },
  });
});

test('should export IAM role and instance profile ARNs', () => {
  template.hasOutput('IAMRoleArn', {
    Export: {
      Name: {
        'Fn::Sub': '${ProjectName}-${Environment}-IAM-Role-ARN',
      },
    },
  });

  template.hasOutput('InstanceProfileArn', {
    Export: {
      Name: {
        'Fn::Sub': '${ProjectName}-${Environment}-Instance-Profile-ARN',
      },
    },
  });
});

});
