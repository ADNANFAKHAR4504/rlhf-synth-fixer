```python
"""
Multi-Tiered Web Application Deployment
Deploys a secure, scalable web application with frontend, backend, data processing, and monitoring
"""

import pulumi
from components.network import NetworkInfrastructure
from components.frontend import FrontendInfrastructure
from components.backend import BackendInfrastructure
from components.data_processing import DataProcessingInfrastructure
from components.monitoring import MonitoringInfrastructure

# Configuration
config = pulumi.Config()
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()
environment = config.get("environment") or "dev"

# Common tags for all resources
common_tags = {
    "Project": project_name,
    "Environment": environment,
    "Stack": stack_name,
    "ManagedBy": "Pulumi"
}

def main():
    """Main deployment function"""
    
    # 1. Deploy Network Infrastructure (VPC, Subnets, Security Groups)
    network = NetworkInfrastructure(
        name=f"{project_name}-network",
        environment=environment,
        tags=common_tags
    )
    
    # 2. Deploy Monitoring Infrastructure
    monitoring = MonitoringInfrastructure(
        name=f"{project_name}-monitoring",
        tags=common_tags
    )
    
    # 3. Deploy Backend Infrastructure (API Gateway, Lambda, DynamoDB)
    backend = BackendInfrastructure(
        name=f"{project_name}-backend",
        vpc_id=network.vpc.id,
        private_subnet_ids=network.private_subnet_ids,
        vpc_endpoint_sg_id=network.vpc_endpoint_security_group.id,
        sns_topic_arn=monitoring.sns_topic.arn,
        tags=common_tags
    )
    
    # 4. Deploy Data Processing Infrastructure (Kinesis, Lambda, S3)
    data_processing = DataProcessingInfrastructure(
        name=f"{project_name}-data",
        vpc_id=network.vpc.id,
        private_subnet_ids=network.private_subnet_ids,
        vpc_endpoint_sg_id=network.vpc_endpoint_security_group.id,
        sns_topic_arn=monitoring.sns_topic.arn,
        tags=common_tags
    )
    
    # 5. Deploy Frontend Infrastructure (CloudFront, S3)
    frontend = FrontendInfrastructure(
        name=f"{project_name}-frontend",
        api_gateway_url=backend.api_gateway.execution_arn,
        tags=common_tags
    )
    
    # Configure monitoring for all components
    monitoring.setup_alarms(
        api_gateway_name=backend.api_gateway.name,
        lambda_function_names=[
            backend.lambda_function.name,
            data_processing.kinesis_processor.name
        ],
        kinesis_stream_name=data_processing.kinesis_stream.name,
        cloudfront_distribution_id=frontend.cloudfront_distribution.id
    )
    
    # Export important values
    pulumi.export("vpc_id", network.vpc.id)
    pulumi.export("cloudfront_domain", frontend.cloudfront_distribution.domain_name)
    pulumi.export("api_gateway_url", backend.api_gateway.execution_arn)
    pulumi.export("kinesis_stream_name", data_processing.kinesis_stream.name)
    pulumi.export("sns_topic_arn", monitoring.sns_topic.arn)

if __name__ == "__main__":
    main()