```
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "AWS CloudFormation template to provision a basic development environment in us-east-1.",
  "Parameters": {
    "S3BucketName": {
      "Type": "String",
      "Description": "Name of the S3 bucket to store project files."
    },
    "DBInstanceIdentifier": {
      "Type": "String",
      "Description": "Identifier for the RDS DB instance."
    },
    "DBName": {
      "Type": "String",
      "Description": "The database name for the PostgreSQL instance.",
      "Default": "devdb"
    },
    "DBUser": {
      "Type": "String",
      "NoEcho": "true",
      "Description": "Username for the PostgreSQL database."
    },
    "DBPassword": {
      "Type": "String",
      "NoEcho": "true",
      "Description": "Password for the PostgreSQL database."
    },
    "EC2InstanceIdentifier": {
      "Type": "String",
      "Description": "Identifier for the EC2 instance."
    }
  },
  "Resources": {
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Ref": "S3BucketName"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        }
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Ref": "DBInstanceIdentifier"
        },
        "DBInstanceClass": "db.t2.micro",
        "Engine": "postgres",
        "MasterUsername": {
          "Ref": "DBUser"
        },
        "MasterUserPassword": {
          "Ref": "DBPassword"
        },
        "DBName": {
          "Ref": "DBName"
        },
        "MultiAZ": "true",
        "AllocatedStorage": "20",
        "StorageType": "gp2"
      }
    },
    "EC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": "t2.micro",
        "ImageId": "ami-0abcdef1234567890",
        "KeyName": "your-key-pair-name",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Ref": "EC2InstanceIdentifier"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "S3BucketNameOutput": {
      "Value": {
        "Ref": "S3Bucket"
      },
      "Description": "Name of the S3 bucket"
    },
    "RDSEndpoint": {
      "Value": {
        "Fn::GetAtt": [
          "RDSInstance",
          "Endpoint.Address"
        ]
      },
      "Description": "Endpoint address of the RDS instance"
    },
    "EC2InstanceId": {
      "Value": {
        "Ref": "EC2Instance"
      },
      "Description": "The instance ID of the EC2 instance"
    }
  }
}

```