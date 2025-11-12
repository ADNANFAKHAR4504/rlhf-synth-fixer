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
                 environment_suffix: str, dr_role: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Database endpoint parameter
        db_endpoint_param = ssm.StringParameter(
            self, f"DBEndpointParam-{environment_suffix}",
            parameter_name=f"/payment/{dr_role}/db-endpoint",
            string_value=db_cluster.cluster_endpoint.hostname,
            description=f"Database endpoint for {dr_role} region",
            tier=ssm.ParameterTier.STANDARD
        )

        Tags.of(db_endpoint_param).add("DR-Role", dr_role)

        # API URL parameter
        api_url_param = ssm.StringParameter(
            self, f"APIUrlParam-{environment_suffix}",
            parameter_name=f"/payment/{dr_role}/api-url",
            string_value=api.url,
            description=f"API Gateway URL for {dr_role} region",
            tier=ssm.ParameterTier.STANDARD
        )

        Tags.of(api_url_param).add("DR-Role", dr_role)

        # Feature flags parameter
        feature_flags_param = ssm.StringParameter(
            self, f"FeatureFlagsParam-{environment_suffix}",
            parameter_name=f"/payment/{dr_role}/feature-flags",
            string_value='{"enabled": true, "maintenance_mode": false}',
            description=f"Feature flags for {dr_role} region",
            tier=ssm.ParameterTier.STANDARD
        )

        Tags.of(feature_flags_param).add("DR-Role", dr_role)

        # Failover status parameter (secure string)
        failover_status_param = ssm.StringParameter(
            self, f"FailoverStatusParam-{environment_suffix}",
            parameter_name=f"/payment/{dr_role}/failover-status",
            string_value="active" if dr_role == "primary" else "standby",
            description=f"Failover status for {dr_role} region",
            tier=ssm.ParameterTier.STANDARD
        )

        Tags.of(failover_status_param).add("DR-Role", dr_role)

        # Outputs
        CfnOutput(
            self, "DBEndpointParamName",
            value=db_endpoint_param.parameter_name,
            export_name=f"{dr_role}-db-endpoint-param-{environment_suffix}"
        )

        CfnOutput(
            self, "APIUrlParamName",
            value=api_url_param.parameter_name,
            export_name=f"{dr_role}-api-url-param-{environment_suffix}"
        )
