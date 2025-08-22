## ✅ Summary

This CloudFormation template provisions a basic network setup in AWS. It includes a VPC, a public subnet, an Internet Gateway, route configuration for public access, and a security group allowing inbound HTTP and SSH traffic with scoped access.

---

## 📋 Key Components and Explanation

### 1. **VPC (`MyVPC`)**
- **CIDR Block:** `10.0.0.0/16`
- **DNS Support:** Enabled
- **Tags:** `Environment=Production`

This VPC acts as the foundational network boundary for the infrastructure.

---

### 2. **Subnet (`PublicSubnet`)**
- **CIDR Block:** `10.0.1.0/24`
- **Mapped Public IP on Launch:** Yes
- **Availability Zone:** Dynamically selected using `!Select` and `!GetAZs`
- **Tags:** `Environment=Production`

A single public subnet is created to host internet-accessible resources.

---

### 3. **Internet Gateway (`InternetGateway`)**
- Created and **attached** to the VPC via `VPCGatewayAttachment`
- **Tags:** `Environment=Production`

Provides public internet access for instances inside the VPC.

---

### 4. **Route Table (`PublicRouteTable`) and Route (`PublicRoute`)**
- **Route:** All traffic (`0.0.0.0/0`) is directed to the Internet Gateway
- **Association:** Connected to the public subnet using `SubnetRouteTableAssociation`
- **Tags:** `Environment=Production`

This setup ensures that instances in the public subnet can reach the internet.

---

### 5. **Security Group (`WebSecurityGroup`)**
- **Ingress Rules:**
  - Port `80` (HTTP): Open to all (`0.0.0.0/0`)
  - Port `22` (SSH): Restricted to `203.0.113.0/24`
- **Description:** Enables basic web and admin access
- **Tags:** `Environment=Production`

Ensures secure but controlled access to EC2 instances.

---

## 🔄 Outputs

- **`VPCId`**: ID of the created VPC (`Ref: MyVPC`)
- **`PublicSubnetId`**: ID of the public subnet (`Ref: PublicSubnet`)
- **`WebSecurityGroupId`**: ID of the security group (`Ref: WebSecurityGroup`)

These outputs enable downstream stacks or deployments to reference core networking resources.

---

## 📌 Best Practices Met

- ✅ Dynamic AZ selection (no hardcoded AZ)
- ✅ All resources properly tagged with `Environment=Production`
- ✅ Clear and scoped security rules
- ✅ Separation of route tables and subnet associations
- ✅ Outputs for critical network identifiers

---

## 🚫 Potential Improvements

- Consider defining parameters for IP ranges and environment name for reusability.
- Add `Metadata` and `Description` to individual resources for better documentation.
- Add `Outputs.Export` fields if the stack is to be referenced by other stacks.

## Template

### TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template to create a VPC with a public subnet, Internet Gateway, and necessary routing and security group rules.

Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Environment
          Value: Production

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [ 0, !GetAZs '' ]

      Tags:
        - Key: Environment
          Value: Production

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: Production

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyVPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC
      Tags:
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable HTTP and SSH access
      VpcId: !Ref MyVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 203.0.113.0/24
      Tags:
        - Key: Environment
          Value: Production

Outputs:
  VPCId:
    Description: The ID of the VPC
    Value: !Ref MyVPC

  PublicSubnetId:
    Description: The ID of the public subnet
    Value: !Ref PublicSubnet

  WebSecurityGroupId:
    Description: The ID of the web security group
    Value: !Ref WebSecurityGroup
```

---


