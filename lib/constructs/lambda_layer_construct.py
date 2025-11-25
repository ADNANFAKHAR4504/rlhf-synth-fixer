from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_layer_version import LambdaLayerVersion


class SharedLambdaLayer(Construct):
    """
    Lambda layer construct for shared dependencies across multiple Lambda functions.
    Reduces deployment package sizes and promotes code reuse.
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        layer_name: str,
        environment_suffix: str,
        code_path: str,
        compatible_runtimes: list,
        description: str = "Shared dependencies layer"
    ):
        super().__init__(scope, id)

        self.layer_name = f"{layer_name}-{environment_suffix}"

        self.layer = LambdaLayerVersion(
            self,
            f"{id}-layer",
            layer_name=self.layer_name,
            filename=code_path,
            source_code_hash="${filebase64sha256(\"" + code_path + "\")}",
            compatible_runtimes=compatible_runtimes,
            compatible_architectures=["arm64"],  # Support Graviton2
            description=description
        )

    @property
    def layer_arn(self) -> str:
        return self.layer.arn
