from constructs import Construct
from cdktf import TerraformStack

class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)
        # define resources here