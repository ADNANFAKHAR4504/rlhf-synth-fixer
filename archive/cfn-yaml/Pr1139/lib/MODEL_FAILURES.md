# Model Response Failures Compared to Ideal Response

## 1. Missing Parameters
- **WebAppServerKeyName** (for EC2 KeyPair):
  ```yaml
  WebAppServerKeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: "Name of an existing EC2 KeyPair to enable SSH access to the instance."
  ```
- **DBMasterUsername** and **MyIpAddress** (for RDS and SSH):
  ```yaml
  DBMasterUsername:
    Type: String
    Description: "Username for the RDS master user."
  MyIpAddress:
    Type: String
    Description: "Your IP in CIDR notation for SSH access."
  ```
- **WebAppAssetsBucketName** (for S3 bucket naming compliance):
  ```yaml
  WebAppAssetsBucketName:
    Type: String
    Description: "Globally unique, all-lowercase S3 bucket name for static assets."
  ```

## 2. S3 Bucket Naming and Compliance
- **No explicit BucketName parameter or enforcement of lowercase/uniqueness.**
  - Model:
    ```yaml
    WebAppAssetsBucket:
      Type: AWS::S3::Bucket
      Properties:
        # ...
    ```
  - Ideal:
    ```yaml
    WebAppAssets:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: !Ref WebAppAssetsBucketName
        # ...
    ```

## 3. Security Groups Missing
- **No Security Groups for EC2 or RDS.**
  - Model: _No security group resources defined._
  - Ideal:
    ```yaml
    WebAppServerSecurityGroup:
      Type: AWS::EC2::SecurityGroup
      # ...
    WebAppDatabaseSecurityGroup:
      Type: AWS::EC2::SecurityGroup
      # ...
    ```

## 4. EC2 Instance Properties Incomplete
- **No KeyName, SecurityGroupIds, or SSH/HTTP ingress rules.**
  - Model:
    ```yaml
    WebAppServerInstance:
      Type: AWS::EC2::Instance
      Properties:
        InstanceType: t2.micro
        ImageId: ...
        # Missing KeyName, SecurityGroupIds
    ```
  - Ideal:
    ```yaml
    WebAppServer:
      Type: AWS::EC2::Instance
      Properties:
        KeyName: !Ref WebAppServerKeyName
        SecurityGroupIds:
          - !GetAtt WebAppServerSecurityGroup.GroupId
        # ...
    ```

## 5. RDS Properties and Security
- **No DBName, EngineVersion, DeletionProtection, or password from Secrets Manager.**
  - Model:
    ```yaml
    WebAppDatabase:
      Type: AWS::RDS::DBInstance
      Properties:
        MasterUsername: admin
        MasterUserPassword: SecurePassword123!
        # ...
    ```
  - Ideal:
    ```yaml
    WebAppDatabase:
      Type: AWS::RDS::DBInstance
      Properties:
        DBName: !Sub '${ProjectName}${EnvironmentName}DB'
        EngineVersion: '8.0.37'
        DeletionProtection: true
        MasterUserPassword: '{{resolve:secretsmanager:MyProdDbCredentials:SecretString:password}}'
        # ...
    ```

## 6. Outputs Missing
- **No Outputs section for resource IDs, endpoints, or bucket names.**
  - Model: _No outputs._
  - Ideal:
    ```yaml
    Outputs:
      WebAppServerId:
        Value: !Ref WebAppServer
      WebAppAssetsBucketName:
        Value: !Ref WebAppAssets
      WebAppDatabaseEndpoint:
        Value: !GetAtt WebAppDatabase.Endpoint.Address
      # ...
    ```

## 7. Tagging Consistency
- **Missing Name tag for EC2 instance.**
  - Model: Only Environment, Owner, Project tags.
  - Ideal:
    ```yaml
    - Key: Name
      Value: !Sub '${ProjectName}-WebAppServer-${EnvironmentName}'
    ```

## 8. Other Minor Misses
- **No Versioning, PublicAccessBlock, or explicit encryption for S3.**
- **No Multi-AZ enforcement for RDS (though MultiAZ: true is present, other HA settings missing).**

---

These are the main misses and failures in the model response compared to the ideal response.
