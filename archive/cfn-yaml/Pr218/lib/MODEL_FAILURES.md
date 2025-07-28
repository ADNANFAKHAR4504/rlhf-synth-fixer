## Example of Incomplete/Incorrect Model Response

---

### ❌ Issues Identified

1. **Region Enforcement Missing**
   - Resources are not conditionally bound to `us-east-1`
   - This allows accidental provisioning in unsupported regions

2. **KeyPair Not Created or Secured**
   - Assumes manual creation of EC2 KeyPair
   - No integration with Secrets Manager
   - No automation or traceability of key usage

3. **Security Group Allows 0.0.0.0/0 for HTTP**
   - Violates the requirement to restrict HTTP access to subnet CIDRs
   - Exposes EC2 instances to the public internet unnecessarily

4. **Improper Nesting of Resources**
   - EC2 instance defined inside another resource block (e.g., inside Security Group)
   - Invalid YAML structure that will fail CloudFormation validation

5. **Incorrect References**
   - Uses `!Ref WebSecurityGroup` when the logical name is `WebServerSecurityGroup`
   - Causes deployment failure due to unresolved logical ID

6. **Missing or Inconsistent Tagging**
   - Some resources lack `Environment` tags
   - Breaks tagging standards for cost allocation and resource tracking

7. **Hardcoded Values**
   - CIDRs, KeyPair names, and AMI IDs are hardcoded
   - Reduces portability and violates parameterization best practices

8. **No Outputs**
   - Fails to expose useful outputs like instance IDs, public IPs, or VPC ID
   - Limits post-deployment visibility and automation

---

### 🛑 Example Snippet of Flawed YAML

```yaml
Resources:
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP and SSH
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0  # ❌ Too permissive
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # ❌ Too permissive

    EC2InstanceA:  # ❌ ILLEGAL nesting
      Type: AWS::EC2::Instance
      Properties:
        InstanceType: t2.micro
        ImageId: ami-12345678
        KeyName: prod-keypair
        SubnetId: subnet-abc123
        SecurityGroupIds:
          - !Ref WebSecurityGroup  # ❌ Incorrect logical ID
