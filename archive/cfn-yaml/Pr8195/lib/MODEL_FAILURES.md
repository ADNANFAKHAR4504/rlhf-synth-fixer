# Model Failures and Issues Found

## Issue 1: CloudFormation Lint Warning W3687 - Invalid Port Specification with IpProtocol -1

**Severity**: High (Blocks CI/CD Pipeline)

**Description**: When using `IpProtocol: -1` (which means all protocols), the `FromPort` and `ToPort` fields are ignored by AWS and should not be specified. Including these fields causes cfn-lint to emit warning W3687, which results in a non-zero exit code that fails the CI/CD pipeline.

**Impact**: The lint stage fails with exit code 4, causing the entire CI/CD pipeline to fail. This prevents code from being merged or deployed.

**Location**: 
- `NodeSecurityGroupIngress` resource in `lib/TapStack.yml` (line 267-269 in MODEL_RESPONSE)
- `NodeSecurityGroupIngress` resource in `lib/TapStack.json` (line 524-526 in MODEL_RESPONSE)

**Original Code (MODEL_RESPONSE)**:
```yaml
NodeSecurityGroupIngress:
  Type: AWS::EC2::SecurityGroupIngress
  Properties:
    Description: Allow nodes to communicate with each other
    GroupId: !Ref NodeSecurityGroup
    SourceSecurityGroupId: !Ref NodeSecurityGroup
    IpProtocol: -1
    FromPort: -1
    ToPort: -1
```

**Fix Applied (IDEAL_RESPONSE)**:
```yaml
NodeSecurityGroupIngress:
  Type: AWS::EC2::SecurityGroupIngress
  Properties:
    Description: Allow nodes to communicate with each other
    GroupId: !Ref NodeSecurityGroup
    SourceSecurityGroupId: !Ref NodeSecurityGroup
    IpProtocol: -1
```

**Root Cause**: The `FromPort` and `ToPort` fields are only valid for TCP and UDP protocols. When `IpProtocol: -1` is used (all protocols), these fields are meaningless and should be omitted.

**Fix Required**: Remove `FromPort: -1` and `ToPort: -1` when `IpProtocol: -1` is specified.

---

## Issue 2: CloudFormation Lint Warning W3005 - Redundant Dependency Declaration

**Severity**: High (Blocks CI/CD Pipeline)

**Description**: The `EKSNodeGroup` resource explicitly declares `DependsOn: EKSCluster`, but this dependency is already implicitly enforced by the `ClusterName: !Ref EKSCluster` property reference. CloudFormation automatically creates dependencies when using intrinsic functions like `!Ref`, making the explicit `DependsOn` redundant.

**Impact**: The lint stage fails with warning W3005, causing a non-zero exit code that fails the CI/CD pipeline. This prevents code from being merged or deployed.

**Location**: 
- `EKSNodeGroup` resource in `lib/TapStack.yml` (line 416 in MODEL_RESPONSE)
- `EKSNodeGroup` resource in `lib/TapStack.json` (line 770 in MODEL_RESPONSE)

**Original Code (MODEL_RESPONSE)**:
```yaml
EKSNodeGroup:
  Type: AWS::EKS::Nodegroup
  DependsOn: EKSCluster
  Properties:
    NodegroupName: !Sub 'eks-nodegroup-${environmentSuffix}'
    ClusterName: !Ref EKSCluster
    ...
```

**Fix Applied (IDEAL_RESPONSE)**:
```yaml
EKSNodeGroup:
  Type: AWS::EKS::Nodegroup
  Properties:
    NodegroupName: !Sub 'eks-nodegroup-${environmentSuffix}'
    ClusterName: !Ref EKSCluster
    ...
```

**Root Cause**: CloudFormation best practices recommend using implicit dependencies through resource references rather than explicit `DependsOn` declarations when possible. The `!Ref EKSCluster` in the `ClusterName` property already ensures the cluster is created before the node group, making the explicit `DependsOn` redundant.

**Fix Required**: Remove the `DependsOn: EKSCluster` declaration from the `EKSNodeGroup` resource. The dependency is automatically handled by the `ClusterName: !Ref EKSCluster` property reference.

---

## Summary

Both issues are CloudFormation lint warnings that cause the CI/CD pipeline to fail:
1. **W3687**: Invalid port specification with `IpProtocol: -1` - Fixed by removing `FromPort` and `ToPort` fields
2. **W3005**: Redundant dependency declaration - Fixed by removing explicit `DependsOn` and relying on implicit dependency through `!Ref`

These fixes ensure the template passes all lint checks and can be successfully deployed through CI/CD pipelines without manual intervention.
