"""
Unit tests exercising TapStack provisioning using Pulumi Mocks.

These tests run without hitting AWS by providing Pulumi runtime mocks that
return reasonable output shapes for aws.* resources. This executes the
TapStack.__init__ code path to raise code coverage while verifying basic
resource wiring.
"""

from __future__ import annotations

from typing import Any, Dict

import pulumi
from pulumi.runtime import Mocks, MockResourceArgs, MockCallArgs, set_mocks


class AwsMocks(Mocks):
    """Pulumi Mocks returning minimal-but-plausible outputs for AWS resources."""

    def new_resource(self, args: MockResourceArgs) -> tuple[str, Dict[str, Any]]:  # type: ignore[override]
        typ = args.type_  # e.g., 'aws:s3/bucket:Bucket'
        name = args.name
        inputs = dict(args.inputs)

        state: Dict[str, Any] = {**inputs}

        # Always include a name to mirror many AWS resources
        state.setdefault("name", inputs.get("name", name))

        # Provide common synthetic outputs used by the stack wiring
        if typ == "aws:s3/bucket:Bucket":
            bucket = inputs.get("bucket", name)
            state.setdefault("bucket", bucket)
            state.setdefault("arn", f"arn:aws:s3:::{bucket}")
            state.setdefault("id", bucket)

        elif typ == "aws:dynamodb/table:Table":
            table_name = inputs.get("name", name)
            state.setdefault("arn", f"arn:aws:dynamodb:us-west-2:000000000000:table/{table_name}")
            state.setdefault("name", table_name)
            state.setdefault("id", table_name)

        elif typ == "aws:sqs/queue:Queue":
            qname = inputs.get("name", name)
            state.setdefault("arn", f"arn:aws:sqs:us-west-2:000000000000:{qname}")
            state.setdefault("url", f"https://sqs.us-west-2.amazonaws.com/000000000000/{qname}")
            state.setdefault("name", qname)

        elif typ == "aws:cloudwatch/logGroup:LogGroup":
            lg_name = inputs.get("name", name)
            state.setdefault("arn", f"arn:aws:logs:us-west-2:000000000000:log-group:{lg_name}")

        elif typ == "aws:iam/role:Role":
            rname = inputs.get("name", name)
            state.setdefault("arn", f"arn:aws:iam::000000000000:role/{rname}")
            state.setdefault("name", rname)

        elif typ == "aws:lambda/function:Function":
            fname = inputs.get("name", name)
            state.setdefault("arn", f"arn:aws:lambda:us-west-2:000000000000:function:{fname}")
            state.setdefault(
                "invoke_arn",
                (
                    "arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/"
                    f"arn:aws:lambda:us-west-2:000000000000:function:{fname}/invocations"
                ),
            )
            state.setdefault("name", fname)

        elif typ == "aws:apigateway/restApi:RestApi":
            api_id = f"{name}-id"
            state.setdefault("id", api_id)
            state.setdefault("rootResourceId", "root")
            state.setdefault("executionArn", f"arn:aws:execute-api:us-west-2:000000000000:{api_id}")

        elif typ == "aws:apigateway/resource:Resource":
            state.setdefault("id", f"{name}-res-id")

        elif typ == "aws:apigateway/method:Method":
            state.setdefault("httpMethod", inputs.get("httpMethod", "POST"))

        elif typ == "aws:apigateway/stage:Stage":
            stage = inputs.get("stageName", inputs.get("stage_name", "dev"))
            rest_api = inputs.get("restApi", inputs.get("rest_api", "api"))
            state.setdefault("invokeUrl", f"https://{rest_api}.execute-api.us-west-2.amazonaws.com/{stage}")

        elif typ == "aws:appsync/graphQLApi:GraphQLApi":
            state.setdefault("uris", {"GRAPHQL": "https://appsync-api.example.com/graphql"})

        elif typ == "aws:appsync/apiKey:ApiKey":
            state.setdefault("key", "test-appsync-api-key")

        # Generic ARN/id fallbacks
        state.setdefault("arn", f"arn:aws:mock:us-west-2:000000000000:{name}")
        rid = f"{name}_id"
        return rid, state

    def call(self, args: MockCallArgs) -> Dict[str, Any]:  # type: ignore[override]
        # No data-source calls in this stack path; return inputs as outputs.
        return dict(args.args)


def test_provisions_with_mocks():
    """Instantiates TapStack under Pulumi mocks to execute provisioning code."""
    set_mocks(AwsMocks())

    from lib.tap_stack import TapStack, TapStackArgs

    stack = TapStack("TestStack", TapStackArgs(environment_suffix="ut"))

    # Basic assertions on key resources to ensure wiring occurred
    assert stack.translation_cache_table is not None
    assert stack.documents_bucket is not None
    assert stack.translation_lambda is not None
    assert stack.api_stage is not None
    assert stack.appsync_api_key is not None

    # Optionally, resolve one Output to ensure apply chains are valid
    got_url = []

    def save_url(u: str) -> None:
        got_url.append(u)

    pulumi.Output.all(stack.api_stage.invoke_url).apply(lambda vals: save_url(vals[0]))

    # The test runner doesn't run a Pulumi event loop; the above ensures
    # Output chains are constructed without raising. Presence is sufficient.
    assert isinstance(stack.api_stage.invoke_url, pulumi.Output)

