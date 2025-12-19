from aws_cdk import (
    Stack,
    aws_ssm as ssm,
    aws_rds as rds,
    aws_apigateway as apigw,
    Tags,
    CfnOutput
)
from constructs import Construct

class ParameterStoreStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 db_cluster: rds.DatabaseCluster,
                 api: apigw.RestApi,
                 environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Database endpoint parameter
        db_endpoint_param = ssm.StringParameter(
            self, f"DBEndpointParam-{environment_suffix}",
            parameter_name=f"/payment/db-endpoint",
            string_value=db_cluster.cluster_endpoint.hostname,
            description=f"Database endpoint for payment processing",
            tier=ssm.ParameterTier.STANDARD
        )

        # API URL parameter
        api_url_param = ssm.StringParameter(
            self, f"APIUrlParam-{environment_suffix}",
            parameter_name=f"/payment/api-url",
            string_value=api.url,
            description=f"API Gateway URL for payment processing",
            tier=ssm.ParameterTier.STANDARD
        )

        # Feature flags parameter
        feature_flags_param = ssm.StringParameter(
            self, f"FeatureFlagsParam-{environment_suffix}",
            parameter_name=f"/payment/feature-flags",
            string_value='{"enabled": true, "maintenance_mode": false}',
            description=f"Feature flags for payment processing",
            tier=ssm.ParameterTier.STANDARD
        )

        # Application status parameter
        app_status_param = ssm.StringParameter(
            self, f"AppStatusParam-{environment_suffix}",
            parameter_name=f"/payment/app-status",
            string_value="active",
            description=f"Application status for payment processing",
            tier=ssm.ParameterTier.STANDARD
        )

        # Outputs
        CfnOutput(
            self, "DBEndpointParamName",
            value=db_endpoint_param.parameter_name,
            export_name=f"db-endpoint-param-{environment_suffix}"
        )

        CfnOutput(
            self, "APIUrlParamName",
            value=api_url_param.parameter_name,
            export_name=f"api-url-param-{environment_suffix}"
        )
