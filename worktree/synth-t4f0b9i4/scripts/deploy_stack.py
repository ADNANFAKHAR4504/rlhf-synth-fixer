#!/usr/bin/env python3
"""
CloudFormation stack deployment script.
Deploys the EKS infrastructure stack with required VPC and subnets.
"""
import boto3
import json
import sys
import time
import os
from pathlib import Path


def get_environment_suffix():
    """Get environment suffix from env variable or default to synth{TaskId}."""
    return os.environ.get('ENVIRONMENT_SUFFIX', 'syntht4f0b9i4')


def create_vpc_if_needed(cf_client, ec2_client, environment_suffix):
    """Create VPC with 3 private subnets across 3 AZs if not exists."""
    stack_name = f"eks-vpc-{environment_suffix}"

    # Check if VPC stack already exists
    try:
        response = cf_client.describe_stacks(StackName=stack_name)
        if response['Stacks']:
            print(f"✅ VPC stack '{stack_name}' already exists")
            # Get outputs
            outputs = {o['OutputKey']: o['OutputValue'] for o in response['Stacks'][0].get('Outputs', [])}
            return outputs.get('VpcId'), outputs.get('PrivateSubnetIds', '').split(',')
    except cf_client.exceptions.ClientError:
        pass

    # Create VPC template
    vpc_template = {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Description": "VPC with 3 private subnets for EKS cluster",
        "Resources": {
            "VPC": {
                "Type": "AWS::EC2::VPC",
                "Properties": {
                    "CidrBlock": "10.0.0.0/16",
                    "EnableDnsHostnames": True,
                    "EnableDnsSupport": True,
                    "Tags": [
                        {"Key": "Name", "Value": {"Fn::Sub": f"eks-vpc-${{AWS::StackName}}"}},
                        {"Key": "Environment", "Value": "Production"},
                        {"Key": "ManagedBy", "Value": "CloudFormation"}
                    ]
                }
            },
            "PrivateSubnet1": {
                "Type": "AWS::EC2::Subnet",
                "Properties": {
                    "VpcId": {"Ref": "VPC"},
                    "CidrBlock": "10.0.1.0/24",
                    "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
                    "Tags": [
                        {"Key": "Name", "Value": f"eks-private-subnet-1-{environment_suffix}"},
                        {"Key": "kubernetes.io/role/internal-elb", "Value": "1"}
                    ]
                }
            },
            "PrivateSubnet2": {
                "Type": "AWS::EC2::Subnet",
                "Properties": {
                    "VpcId": {"Ref": "VPC"},
                    "CidrBlock": "10.0.2.0/24",
                    "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
                    "Tags": [
                        {"Key": "Name", "Value": f"eks-private-subnet-2-{environment_suffix}"},
                        {"Key": "kubernetes.io/role/internal-elb", "Value": "1"}
                    ]
                }
            },
            "PrivateSubnet3": {
                "Type": "AWS::EC2::Subnet",
                "Properties": {
                    "VpcId": {"Ref": "VPC"},
                    "CidrBlock": "10.0.3.0/24",
                    "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
                    "Tags": [
                        {"Key": "Name", "Value": f"eks-private-subnet-3-{environment_suffix}"},
                        {"Key": "kubernetes.io/role/internal-elb", "Value": "1"}
                    ]
                }
            },
            "InternetGateway": {
                "Type": "AWS::EC2::InternetGateway",
                "Properties": {
                    "Tags": [{"Key": "Name", "Value": f"eks-igw-{environment_suffix}"}]
                }
            },
            "AttachGateway": {
                "Type": "AWS::EC2::VPCGatewayAttachment",
                "Properties": {
                    "VpcId": {"Ref": "VPC"},
                    "InternetGatewayId": {"Ref": "InternetGateway"}
                }
            },
            "NatGatewayEIP": {
                "Type": "AWS::EC2::EIP",
                "DependsOn": "AttachGateway",
                "Properties": {
                    "Domain": "vpc"
                }
            },
            "PublicSubnet1": {
                "Type": "AWS::EC2::Subnet",
                "Properties": {
                    "VpcId": {"Ref": "VPC"},
                    "CidrBlock": "10.0.10.0/24",
                    "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
                    "MapPublicIpOnLaunch": True,
                    "Tags": [{"Key": "Name", "Value": f"eks-public-subnet-1-{environment_suffix}"}]
                }
            },
            "NatGateway": {
                "Type": "AWS::EC2::NatGateway",
                "Properties": {
                    "AllocationId": {"Fn::GetAtt": ["NatGatewayEIP", "AllocationId"]},
                    "SubnetId": {"Ref": "PublicSubnet1"},
                    "Tags": [{"Key": "Name", "Value": f"eks-nat-{environment_suffix}"}]
                }
            },
            "PublicRouteTable": {
                "Type": "AWS::EC2::RouteTable",
                "Properties": {
                    "VpcId": {"Ref": "VPC"},
                    "Tags": [{"Key": "Name", "Value": f"eks-public-rt-{environment_suffix}"}]
                }
            },
            "PublicRoute": {
                "Type": "AWS::EC2::Route",
                "DependsOn": "AttachGateway",
                "Properties": {
                    "RouteTableId": {"Ref": "PublicRouteTable"},
                    "DestinationCidrBlock": "0.0.0.0/0",
                    "GatewayId": {"Ref": "InternetGateway"}
                }
            },
            "PublicSubnetRouteTableAssociation": {
                "Type": "AWS::EC2::SubnetRouteTableAssociation",
                "Properties": {
                    "SubnetId": {"Ref": "PublicSubnet1"},
                    "RouteTableId": {"Ref": "PublicRouteTable"}
                }
            },
            "PrivateRouteTable": {
                "Type": "AWS::EC2::RouteTable",
                "Properties": {
                    "VpcId": {"Ref": "VPC"},
                    "Tags": [{"Key": "Name", "Value": f"eks-private-rt-{environment_suffix}"}]
                }
            },
            "PrivateRoute": {
                "Type": "AWS::EC2::Route",
                "Properties": {
                    "RouteTableId": {"Ref": "PrivateRouteTable"},
                    "DestinationCidrBlock": "0.0.0.0/0",
                    "NatGatewayId": {"Ref": "NatGateway"}
                }
            },
            "PrivateSubnet1RouteTableAssociation": {
                "Type": "AWS::EC2::SubnetRouteTableAssociation",
                "Properties": {
                    "SubnetId": {"Ref": "PrivateSubnet1"},
                    "RouteTableId": {"Ref": "PrivateRouteTable"}
                }
            },
            "PrivateSubnet2RouteTableAssociation": {
                "Type": "AWS::EC2::SubnetRouteTableAssociation",
                "Properties": {
                    "SubnetId": {"Ref": "PrivateSubnet2"},
                    "RouteTableId": {"Ref": "PrivateRouteTable"}
                }
            },
            "PrivateSubnet3RouteTableAssociation": {
                "Type": "AWS::EC2::SubnetRouteTableAssociation",
                "Properties": {
                    "SubnetId": {"Ref": "PrivateSubnet3"},
                    "RouteTableId": {"Ref": "PrivateRouteTable"}
                }
            }
        },
        "Outputs": {
            "VpcId": {
                "Description": "VPC ID",
                "Value": {"Ref": "VPC"},
                "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-VpcId"}}
            },
            "PrivateSubnetIds": {
                "Description": "Private subnet IDs",
                "Value": {"Fn::Join": [",", [
                    {"Ref": "PrivateSubnet1"},
                    {"Ref": "PrivateSubnet2"},
                    {"Ref": "PrivateSubnet3"}
                ]]},
                "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnetIds"}}
            }
        }
    }

    print(f"Creating VPC stack '{stack_name}'...")
    try:
        cf_client.create_stack(
            StackName=stack_name,
            TemplateBody=json.dumps(vpc_template),
            Tags=[
                {'Key': 'Environment', 'Value': 'Production'},
                {'Key': 'ManagedBy', 'Value': 'CloudFormation'},
                {'Key': 'Purpose', 'Value': 'EKS-Infrastructure'}
            ]
        )

        # Wait for stack creation
        waiter = cf_client.get_waiter('stack_create_complete')
        print("Waiting for VPC stack creation (this may take 3-5 minutes)...")
        waiter.wait(
            StackName=stack_name,
            WaiterConfig={'Delay': 15, 'MaxAttempts': 40}
        )

        # Get outputs
        response = cf_client.describe_stacks(StackName=stack_name)
        outputs = {o['OutputKey']: o['OutputValue'] for o in response['Stacks'][0]['Outputs']}

        print(f"✅ VPC stack created successfully")
        print(f"   VPC ID: {outputs['VpcId']}")
        print(f"   Subnet IDs: {outputs['PrivateSubnetIds']}")

        return outputs['VpcId'], outputs['PrivateSubnetIds'].split(',')

    except Exception as e:
        print(f"ERROR creating VPC stack: {e}")
        sys.exit(1)


def deploy_eks_stack(cf_client, vpc_id, subnet_ids, environment_suffix):
    """Deploy the EKS cluster stack."""
    template_path = Path(__file__).parent.parent / "lib" / "TapStack.json"
    stack_name = f"eks-microservices-{environment_suffix}"

    if not template_path.exists():
        print(f"ERROR: Template not found at {template_path}")
        sys.exit(1)

    with open(template_path, 'r') as f:
        template_body = f.read()

    print(f"\nDeploying EKS stack '{stack_name}'...")
    print(f"  VPC ID: {vpc_id}")
    print(f"  Subnet IDs: {', '.join(subnet_ids)}")
    print(f"  Environment Suffix: {environment_suffix}")

    try:
        # Check if stack exists
        try:
            cf_client.describe_stacks(StackName=stack_name)
            print(f"Stack '{stack_name}' already exists, updating...")
            cf_client.update_stack(
                StackName=stack_name,
                TemplateBody=template_body,
                Parameters=[
                    {'ParameterKey': 'EnvironmentSuffix', 'ParameterValue': environment_suffix},
                    {'ParameterKey': 'VpcId', 'ParameterValue': vpc_id},
                    {'ParameterKey': 'PrivateSubnetIds', 'ParameterValue': ','.join(subnet_ids)},
                    {'ParameterKey': 'EksVersion', 'ParameterValue': '1.28'},
                    {'ParameterKey': 'NodeInstanceType', 'ParameterValue': 't3.medium'},
                    {'ParameterKey': 'NodeGroupMinSize', 'ParameterValue': '3'},
                    {'ParameterKey': 'NodeGroupMaxSize', 'ParameterValue': '6'},
                    {'ParameterKey': 'NodeGroupDesiredSize', 'ParameterValue': '3'}
                ],
                Capabilities=['CAPABILITY_NAMED_IAM'],
                Tags=[
                    {'Key': 'Environment', 'Value': 'Production'},
                    {'Key': 'ManagedBy', 'Value': 'CloudFormation'}
                ]
            )
            waiter = cf_client.get_waiter('stack_update_complete')
            operation = "update"
        except cf_client.exceptions.ClientError as e:
            if 'does not exist' in str(e):
                print(f"Creating new stack '{stack_name}'...")
                cf_client.create_stack(
                    StackName=stack_name,
                    TemplateBody=template_body,
                    Parameters=[
                        {'ParameterKey': 'EnvironmentSuffix', 'ParameterValue': environment_suffix},
                        {'ParameterKey': 'VpcId', 'ParameterValue': vpc_id},
                        {'ParameterKey': 'PrivateSubnetIds', 'ParameterValue': ','.join(subnet_ids)},
                        {'ParameterKey': 'EksVersion', 'ParameterValue': '1.28'},
                        {'ParameterKey': 'NodeInstanceType', 'ParameterValue': 't3.medium'},
                        {'ParameterKey': 'NodeGroupMinSize', 'ParameterValue': '3'},
                        {'ParameterKey': 'NodeGroupMaxSize', 'ParameterValue': '6'},
                        {'ParameterKey': 'NodeGroupDesiredSize', 'ParameterValue': '3'}
                    ],
                    Capabilities=['CAPABILITY_NAMED_IAM'],
                    Tags=[
                        {'Key': 'Environment', 'Value': 'Production'},
                        {'Key': 'ManagedBy', 'Value': 'CloudFormation'}
                    ]
                )
                waiter = cf_client.get_waiter('stack_create_complete')
                operation = "create"
            elif 'No updates are to be performed' in str(e):
                print("✅ No updates needed, stack is already up to date")
                return stack_name
            else:
                raise

        print(f"Waiting for EKS stack {operation} (this may take 15-20 minutes for EKS cluster creation)...")
        waiter.wait(
            StackName=stack_name,
            WaiterConfig={'Delay': 30, 'MaxAttempts': 60}
        )

        print(f"✅ EKS stack {operation}d successfully")
        return stack_name

    except Exception as e:
        print(f"ERROR deploying EKS stack: {e}")
        # Try to get stack events for debugging
        try:
            events = cf_client.describe_stack_events(StackName=stack_name)
            print("\nRecent stack events:")
            for event in events['StackEvents'][:5]:
                if 'FAILED' in event.get('ResourceStatus', ''):
                    print(f"  {event['ResourceType']}: {event.get('ResourceStatusReason', 'Unknown error')}")
        except:
            pass
        sys.exit(1)


def save_outputs(cf_client, stack_name):
    """Save stack outputs to cfn-outputs/flat-outputs.json."""
    try:
        response = cf_client.describe_stacks(StackName=stack_name)
        stack = response['Stacks'][0]

        # Create flat outputs dictionary
        flat_outputs = {}
        for output in stack.get('Outputs', []):
            flat_outputs[output['OutputKey']] = output['OutputValue']

        # Save to file
        output_dir = Path(__file__).parent.parent / "cfn-outputs"
        output_dir.mkdir(exist_ok=True)
        output_file = output_dir / "flat-outputs.json"

        with open(output_file, 'w') as f:
            json.dump(flat_outputs, f, indent=2)

        print(f"\n✅ Stack outputs saved to {output_file}")
        print("\nOutputs:")
        for key, value in flat_outputs.items():
            print(f"  {key}: {value}")

        return True

    except Exception as e:
        print(f"ERROR saving outputs: {e}")
        return False


def main():
    """Main deployment function."""
    region = os.environ.get('AWS_REGION', 'us-east-1')
    environment_suffix = get_environment_suffix()

    print(f"EKS Stack Deployment")
    print(f"Region: {region}")
    print(f"Environment Suffix: {environment_suffix}")
    print("=" * 60)

    # Initialize AWS clients
    cf_client = boto3.client('cloudformation', region_name=region)
    ec2_client = boto3.client('ec2', region_name=region)

    # Step 1: Create VPC and subnets
    vpc_id, subnet_ids = create_vpc_if_needed(cf_client, ec2_client, environment_suffix)

    # Step 2: Deploy EKS stack
    stack_name = deploy_eks_stack(cf_client, vpc_id, subnet_ids, environment_suffix)

    # Step 3: Save outputs
    save_outputs(cf_client, stack_name)

    print("\n" + "=" * 60)
    print("✅ Deployment completed successfully!")
    print(f"Stack Name: {stack_name}")
    print(f"Region: {region}")


if __name__ == "__main__":  # pragma: no cover
    main()
