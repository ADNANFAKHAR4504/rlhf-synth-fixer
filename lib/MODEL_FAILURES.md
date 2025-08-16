# Issues Identified and Recommendations

This document lists the issues found and the optimizations recommended for the CloudFormation `TapStack.yml` file based on the current implementation.

## **1. Hardcoded Availability Zones**
- **Issue**: The Availability Zones (`us-east-1a`, `us-east-1b`) for the subnets are hardcoded, which reduces template portability and reusability across regions.
- **Recommendation**: Use `!GetAZs` with `!Select` to dynamically obtain Availability Zones.

**Recommended Fix:**
```yaml
Resources:
  ProdEnvPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      # other properties...

  ProdEnvPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      # other properties...
```

## **2. Redundant Route Tables**
- **Issue** : Two identical private route tables are present, which is unnecessary and increases resource count.

- **Recommendation** : Use a single route table and associate it with both private subnets.

**Recommended Fix** :

```yaml
# Route Table
ProdEnvPrivateRouteTable:
  Type: AWS::EC2::RouteTable
  Properties:
    VpcId: !Ref ProdEnvVPC
    Tags:
      - Key: Name
        Value: ProdEnvPrivateRouteTable

# Route Table Associations
ProdEnvPrivateSubnetRouteTableAssociation1:
  Type: AWS::EC2::SubnetRouteTableAssociation
  Properties:
    SubnetId: !Ref ProdEnvPrivateSubnet1
    RouteTableId: !Ref ProdEnvPrivateRouteTable

ProdEnvPrivateSubnetRouteTableAssociation2:
  Type: AWS::EC2::SubnetRouteTableAssociation
  Properties:
    SubnetId: !Ref ProdEnvPrivateSubnet2
    RouteTableId: !Ref ProdEnvPrivateRouteTable
```

## **3. Missing DeletionPolicy for S3 Bucket**
- **Issue** : The S3 bucket ProdEnvDataBucket does not have a DeletionPolicy, meaning the bucket and its data will be deleted along with the stack.

- **Recommendation** : Add DeletionPolicy: Retain (and optionally UpdateReplacePolicy: Retain) to preserve bucket data.

**Recommended Fix**:

```yaml
ProdEnvDataBucket:
  Type: AWS::S3::Bucket
  DeletionPolicy: Retain
  UpdateReplacePolicy: Retain
  Properties:
    # bucket properties here...
```

## **4. Unnecessary Use of Fn::Sub in UserData**
- **Issue** : Lint warnings such as W1020 'Fn::Sub' isn't needed because there are no variables at lines like lib/TapStack.yml:220:9 and lib/TapStack.yml:244:9. Unnecessary use of Fn::Sub in UserData.

- **Recommendation** : Remove the Fn::Sub wrapper around static UserData content.

**Recommended Fix** :

```yaml
UserData:
  Fn::Base64: |
    #!/bin/bash
    echo "Launching instance in Production"
```

## **5. CAPABILITY_IAM Compatibility Issue**
- **Issue** : `InsufficientCapabilitiesException: Requires capabilities : [CAPABILITY_NAMED_IAM]`
- **Recommended Fix** : Removed `RoleName` and `GroupName` properties to use auto-generated names compatible with `CAPABILITY_IAM`

## **6. Replace Manual KeyPair Parameter with Auto-Created Key**
- **Issue** : The template currently requires a ProdEnvKeyPairName parameter, forcing the user to manually supply a key pair name at deployment time. This breaks full automation and causes errors like ProdEnvKeyPairName must have values.
- **Recommended** : Remove the manual KeyPair parameter and instead create a KeyPair in the template using AWS::EC2::KeyPair. Reference this dynamically created key in EC2 instances using KeyName: !Ref ProdEnvKeyPair.

**Recommended Fix** :

```yaml
# Delete this parameter block entirely:
# ProdEnvKeyPairName:
#   Type: AWS::EC2::KeyPair::KeyName
#   Description: EC2 Key Pair for SSH access to instances

# Add this CloudFormation resource:
ProdEnvKeyPair:
  Type: AWS::EC2::KeyPair
  Properties:
    KeyName: ProdEnv-KeyPair

# Then reference it inside each EC2 instance:
KeyName: !Ref ProdEnvKeyPair
```