r'''
# `data_aws_iam_principal_policy_simulation`

Refer to the Terraform Registry for docs: [`data_aws_iam_principal_policy_simulation`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation).
'''
from pkgutil import extend_path
__path__ = extend_path(__path__, __name__)

import abc
import builtins
import datetime
import enum
import typing

import jsii
import publication
import typing_extensions

import typeguard
from importlib.metadata import version as _metadata_package_version
TYPEGUARD_MAJOR_VERSION = int(_metadata_package_version('typeguard').split('.')[0])

def check_type(argname: str, value: object, expected_type: typing.Any) -> typing.Any:
    if TYPEGUARD_MAJOR_VERSION <= 2:
        return typeguard.check_type(argname=argname, value=value, expected_type=expected_type) # type:ignore
    else:
        if isinstance(value, jsii._reference_map.InterfaceDynamicProxy): # pyright: ignore [reportAttributeAccessIssue]
           pass
        else:
            if TYPEGUARD_MAJOR_VERSION == 3:
                typeguard.config.collection_check_strategy = typeguard.CollectionCheckStrategy.ALL_ITEMS # type:ignore
                typeguard.check_type(value=value, expected_type=expected_type) # type:ignore
            else:
                typeguard.check_type(value=value, expected_type=expected_type, collection_check_strategy=typeguard.CollectionCheckStrategy.ALL_ITEMS) # type:ignore

from .._jsii import *

import cdktf as _cdktf_9a9027ec
import constructs as _constructs_77d1e7e8


class DataAwsIamPrincipalPolicySimulation(
    _cdktf_9a9027ec.TerraformDataSource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulation",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation aws_iam_principal_policy_simulation}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        action_names: typing.Sequence[builtins.str],
        policy_source_arn: builtins.str,
        additional_policies_json: typing.Optional[typing.Sequence[builtins.str]] = None,
        caller_arn: typing.Optional[builtins.str] = None,
        context: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DataAwsIamPrincipalPolicySimulationContext", typing.Dict[builtins.str, typing.Any]]]]] = None,
        permissions_boundary_policies_json: typing.Optional[typing.Sequence[builtins.str]] = None,
        resource_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
        resource_handling_option: typing.Optional[builtins.str] = None,
        resource_owner_account_id: typing.Optional[builtins.str] = None,
        resource_policy_json: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation aws_iam_principal_policy_simulation} Data Source.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param action_names: One or more names of actions, like "iam:CreateUser", that should be included in the simulation. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#action_names DataAwsIamPrincipalPolicySimulation#action_names}
        :param policy_source_arn: ARN of the principal (e.g. user, role) whose existing configured access policies will be used as the basis for the simulation. If you specify a role ARN here, you can also set caller_arn to simulate a particular user acting with the given role. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#policy_source_arn DataAwsIamPrincipalPolicySimulation#policy_source_arn}
        :param additional_policies_json: Additional principal-based policies to use in the simulation. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#additional_policies_json DataAwsIamPrincipalPolicySimulation#additional_policies_json}
        :param caller_arn: ARN of a user to use as the caller of the simulated requests. If not specified, defaults to the principal specified in policy_source_arn, if it is a user ARN. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#caller_arn DataAwsIamPrincipalPolicySimulation#caller_arn}
        :param context: context block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#context DataAwsIamPrincipalPolicySimulation#context}
        :param permissions_boundary_policies_json: Additional permission boundary policies to use in the simulation. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#permissions_boundary_policies_json DataAwsIamPrincipalPolicySimulation#permissions_boundary_policies_json}
        :param resource_arns: ARNs of specific resources to use as the targets of the specified actions during simulation. If not specified, the simulator assumes "*" which represents general access across all resources. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_arns DataAwsIamPrincipalPolicySimulation#resource_arns}
        :param resource_handling_option: Specifies the type of simulation to run. Some API operations need a particular resource handling option in order to produce a correct reesult. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_handling_option DataAwsIamPrincipalPolicySimulation#resource_handling_option}
        :param resource_owner_account_id: An AWS account ID to use as the simulated owner for any resource whose ARN does not include a specific owner account ID. Defaults to the account given as part of caller_arn. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_owner_account_id DataAwsIamPrincipalPolicySimulation#resource_owner_account_id}
        :param resource_policy_json: A resource policy to associate with all of the target resources for simulation purposes. The policy simulator does not automatically retrieve resource-level policies, so if a resource policy is crucial to your test then you must specify here the same policy document associated with your target resource(s). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_policy_json DataAwsIamPrincipalPolicySimulation#resource_policy_json}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9642a0ab84d65edd5cd638209b898f40e6f9464370c413bec900419503e0cec6)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = DataAwsIamPrincipalPolicySimulationConfig(
            action_names=action_names,
            policy_source_arn=policy_source_arn,
            additional_policies_json=additional_policies_json,
            caller_arn=caller_arn,
            context=context,
            permissions_boundary_policies_json=permissions_boundary_policies_json,
            resource_arns=resource_arns,
            resource_handling_option=resource_handling_option,
            resource_owner_account_id=resource_owner_account_id,
            resource_policy_json=resource_policy_json,
            connection=connection,
            count=count,
            depends_on=depends_on,
            for_each=for_each,
            lifecycle=lifecycle,
            provider=provider,
            provisioners=provisioners,
        )

        jsii.create(self.__class__, self, [scope, id, config])

    @jsii.member(jsii_name="generateConfigForImport")
    @builtins.classmethod
    def generate_config_for_import(
        cls,
        scope: _constructs_77d1e7e8.Construct,
        import_to_id: builtins.str,
        import_from_id: builtins.str,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    ) -> _cdktf_9a9027ec.ImportableResource:
        '''Generates CDKTF code for importing a DataAwsIamPrincipalPolicySimulation resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the DataAwsIamPrincipalPolicySimulation to import.
        :param import_from_id: The id of the existing DataAwsIamPrincipalPolicySimulation that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the DataAwsIamPrincipalPolicySimulation to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d1ce4ea075b29b3ed232cc45f9089d973ae2bb132b6472564a27a913376dcdf)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putContext")
    def put_context(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DataAwsIamPrincipalPolicySimulationContext", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3a33f76361c16742d70f1ce2a4597c41df71d16c4fa6500707c6771bea8b62c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putContext", [value]))

    @jsii.member(jsii_name="resetAdditionalPoliciesJson")
    def reset_additional_policies_json(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAdditionalPoliciesJson", []))

    @jsii.member(jsii_name="resetCallerArn")
    def reset_caller_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCallerArn", []))

    @jsii.member(jsii_name="resetContext")
    def reset_context(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContext", []))

    @jsii.member(jsii_name="resetPermissionsBoundaryPoliciesJson")
    def reset_permissions_boundary_policies_json(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPermissionsBoundaryPoliciesJson", []))

    @jsii.member(jsii_name="resetResourceArns")
    def reset_resource_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceArns", []))

    @jsii.member(jsii_name="resetResourceHandlingOption")
    def reset_resource_handling_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceHandlingOption", []))

    @jsii.member(jsii_name="resetResourceOwnerAccountId")
    def reset_resource_owner_account_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceOwnerAccountId", []))

    @jsii.member(jsii_name="resetResourcePolicyJson")
    def reset_resource_policy_json(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourcePolicyJson", []))

    @jsii.member(jsii_name="synthesizeAttributes")
    def _synthesize_attributes(self) -> typing.Mapping[builtins.str, typing.Any]:
        return typing.cast(typing.Mapping[builtins.str, typing.Any], jsii.invoke(self, "synthesizeAttributes", []))

    @jsii.member(jsii_name="synthesizeHclAttributes")
    def _synthesize_hcl_attributes(self) -> typing.Mapping[builtins.str, typing.Any]:
        return typing.cast(typing.Mapping[builtins.str, typing.Any], jsii.invoke(self, "synthesizeHclAttributes", []))

    @jsii.python.classproperty
    @jsii.member(jsii_name="tfResourceType")
    def TF_RESOURCE_TYPE(cls) -> builtins.str:
        return typing.cast(builtins.str, jsii.sget(cls, "tfResourceType"))

    @builtins.property
    @jsii.member(jsii_name="allAllowed")
    def all_allowed(self) -> _cdktf_9a9027ec.IResolvable:
        return typing.cast(_cdktf_9a9027ec.IResolvable, jsii.get(self, "allAllowed"))

    @builtins.property
    @jsii.member(jsii_name="context")
    def context(self) -> "DataAwsIamPrincipalPolicySimulationContextList":
        return typing.cast("DataAwsIamPrincipalPolicySimulationContextList", jsii.get(self, "context"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="results")
    def results(self) -> "DataAwsIamPrincipalPolicySimulationResultsList":
        return typing.cast("DataAwsIamPrincipalPolicySimulationResultsList", jsii.get(self, "results"))

    @builtins.property
    @jsii.member(jsii_name="actionNamesInput")
    def action_names_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "actionNamesInput"))

    @builtins.property
    @jsii.member(jsii_name="additionalPoliciesJsonInput")
    def additional_policies_json_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "additionalPoliciesJsonInput"))

    @builtins.property
    @jsii.member(jsii_name="callerArnInput")
    def caller_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "callerArnInput"))

    @builtins.property
    @jsii.member(jsii_name="contextInput")
    def context_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DataAwsIamPrincipalPolicySimulationContext"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DataAwsIamPrincipalPolicySimulationContext"]]], jsii.get(self, "contextInput"))

    @builtins.property
    @jsii.member(jsii_name="permissionsBoundaryPoliciesJsonInput")
    def permissions_boundary_policies_json_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "permissionsBoundaryPoliciesJsonInput"))

    @builtins.property
    @jsii.member(jsii_name="policySourceArnInput")
    def policy_source_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "policySourceArnInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceArnsInput")
    def resource_arns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "resourceArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceHandlingOptionInput")
    def resource_handling_option_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resourceHandlingOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceOwnerAccountIdInput")
    def resource_owner_account_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resourceOwnerAccountIdInput"))

    @builtins.property
    @jsii.member(jsii_name="resourcePolicyJsonInput")
    def resource_policy_json_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resourcePolicyJsonInput"))

    @builtins.property
    @jsii.member(jsii_name="actionNames")
    def action_names(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "actionNames"))

    @action_names.setter
    def action_names(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37ba7f8c89362fa039bf5629b41bd26bfdb2d93d319504c4a664a70edcc70655)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "actionNames", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="additionalPoliciesJson")
    def additional_policies_json(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "additionalPoliciesJson"))

    @additional_policies_json.setter
    def additional_policies_json(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__928d3f253d10e67aaf5f663e9f56d58987126777a9073a32542e7b85e42cbc3d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "additionalPoliciesJson", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="callerArn")
    def caller_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "callerArn"))

    @caller_arn.setter
    def caller_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d23da4b6e279881457541a427de67e509b5ca170316985b6bf849edfec9973b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "callerArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="permissionsBoundaryPoliciesJson")
    def permissions_boundary_policies_json(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "permissionsBoundaryPoliciesJson"))

    @permissions_boundary_policies_json.setter
    def permissions_boundary_policies_json(
        self,
        value: typing.List[builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aab95998bd018b46ba85cab3d9c058527a20d1f351fa588f72b4a521047f4bd5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "permissionsBoundaryPoliciesJson", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="policySourceArn")
    def policy_source_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "policySourceArn"))

    @policy_source_arn.setter
    def policy_source_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__48a52212a2e560b253c90e4162da3cf5519930578b90b2cbb3808c4cdd2869e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "policySourceArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourceArns")
    def resource_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "resourceArns"))

    @resource_arns.setter
    def resource_arns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9cf96932911529f47abe9c85a8ee3cdd8900c2976f3dd19759d76e8ae79ca41)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourceHandlingOption")
    def resource_handling_option(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceHandlingOption"))

    @resource_handling_option.setter
    def resource_handling_option(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f2fbcd5122131a12d4d0b54e92f46e5e14a2fc1e2de7f466fc9de0131f738a3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceHandlingOption", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourceOwnerAccountId")
    def resource_owner_account_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceOwnerAccountId"))

    @resource_owner_account_id.setter
    def resource_owner_account_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__39934e181cf056a3bece4641fd68b2b17ca3295a17fc798af52715ca39166d59)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceOwnerAccountId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourcePolicyJson")
    def resource_policy_json(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourcePolicyJson"))

    @resource_policy_json.setter
    def resource_policy_json(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a8dd2c5c8a08063e97dc6161edfd28c8fe40b33926918a368ea28897e5dc8ae5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourcePolicyJson", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "action_names": "actionNames",
        "policy_source_arn": "policySourceArn",
        "additional_policies_json": "additionalPoliciesJson",
        "caller_arn": "callerArn",
        "context": "context",
        "permissions_boundary_policies_json": "permissionsBoundaryPoliciesJson",
        "resource_arns": "resourceArns",
        "resource_handling_option": "resourceHandlingOption",
        "resource_owner_account_id": "resourceOwnerAccountId",
        "resource_policy_json": "resourcePolicyJson",
    },
)
class DataAwsIamPrincipalPolicySimulationConfig(_cdktf_9a9027ec.TerraformMetaArguments):
    def __init__(
        self,
        *,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
        action_names: typing.Sequence[builtins.str],
        policy_source_arn: builtins.str,
        additional_policies_json: typing.Optional[typing.Sequence[builtins.str]] = None,
        caller_arn: typing.Optional[builtins.str] = None,
        context: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DataAwsIamPrincipalPolicySimulationContext", typing.Dict[builtins.str, typing.Any]]]]] = None,
        permissions_boundary_policies_json: typing.Optional[typing.Sequence[builtins.str]] = None,
        resource_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
        resource_handling_option: typing.Optional[builtins.str] = None,
        resource_owner_account_id: typing.Optional[builtins.str] = None,
        resource_policy_json: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param action_names: One or more names of actions, like "iam:CreateUser", that should be included in the simulation. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#action_names DataAwsIamPrincipalPolicySimulation#action_names}
        :param policy_source_arn: ARN of the principal (e.g. user, role) whose existing configured access policies will be used as the basis for the simulation. If you specify a role ARN here, you can also set caller_arn to simulate a particular user acting with the given role. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#policy_source_arn DataAwsIamPrincipalPolicySimulation#policy_source_arn}
        :param additional_policies_json: Additional principal-based policies to use in the simulation. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#additional_policies_json DataAwsIamPrincipalPolicySimulation#additional_policies_json}
        :param caller_arn: ARN of a user to use as the caller of the simulated requests. If not specified, defaults to the principal specified in policy_source_arn, if it is a user ARN. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#caller_arn DataAwsIamPrincipalPolicySimulation#caller_arn}
        :param context: context block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#context DataAwsIamPrincipalPolicySimulation#context}
        :param permissions_boundary_policies_json: Additional permission boundary policies to use in the simulation. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#permissions_boundary_policies_json DataAwsIamPrincipalPolicySimulation#permissions_boundary_policies_json}
        :param resource_arns: ARNs of specific resources to use as the targets of the specified actions during simulation. If not specified, the simulator assumes "*" which represents general access across all resources. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_arns DataAwsIamPrincipalPolicySimulation#resource_arns}
        :param resource_handling_option: Specifies the type of simulation to run. Some API operations need a particular resource handling option in order to produce a correct reesult. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_handling_option DataAwsIamPrincipalPolicySimulation#resource_handling_option}
        :param resource_owner_account_id: An AWS account ID to use as the simulated owner for any resource whose ARN does not include a specific owner account ID. Defaults to the account given as part of caller_arn. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_owner_account_id DataAwsIamPrincipalPolicySimulation#resource_owner_account_id}
        :param resource_policy_json: A resource policy to associate with all of the target resources for simulation purposes. The policy simulator does not automatically retrieve resource-level policies, so if a resource policy is crucial to your test then you must specify here the same policy document associated with your target resource(s). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_policy_json DataAwsIamPrincipalPolicySimulation#resource_policy_json}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__176bc752fade48367880a76913cbe191d4cb3546aebad31e67c2f6da2e726914)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument action_names", value=action_names, expected_type=type_hints["action_names"])
            check_type(argname="argument policy_source_arn", value=policy_source_arn, expected_type=type_hints["policy_source_arn"])
            check_type(argname="argument additional_policies_json", value=additional_policies_json, expected_type=type_hints["additional_policies_json"])
            check_type(argname="argument caller_arn", value=caller_arn, expected_type=type_hints["caller_arn"])
            check_type(argname="argument context", value=context, expected_type=type_hints["context"])
            check_type(argname="argument permissions_boundary_policies_json", value=permissions_boundary_policies_json, expected_type=type_hints["permissions_boundary_policies_json"])
            check_type(argname="argument resource_arns", value=resource_arns, expected_type=type_hints["resource_arns"])
            check_type(argname="argument resource_handling_option", value=resource_handling_option, expected_type=type_hints["resource_handling_option"])
            check_type(argname="argument resource_owner_account_id", value=resource_owner_account_id, expected_type=type_hints["resource_owner_account_id"])
            check_type(argname="argument resource_policy_json", value=resource_policy_json, expected_type=type_hints["resource_policy_json"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action_names": action_names,
            "policy_source_arn": policy_source_arn,
        }
        if connection is not None:
            self._values["connection"] = connection
        if count is not None:
            self._values["count"] = count
        if depends_on is not None:
            self._values["depends_on"] = depends_on
        if for_each is not None:
            self._values["for_each"] = for_each
        if lifecycle is not None:
            self._values["lifecycle"] = lifecycle
        if provider is not None:
            self._values["provider"] = provider
        if provisioners is not None:
            self._values["provisioners"] = provisioners
        if additional_policies_json is not None:
            self._values["additional_policies_json"] = additional_policies_json
        if caller_arn is not None:
            self._values["caller_arn"] = caller_arn
        if context is not None:
            self._values["context"] = context
        if permissions_boundary_policies_json is not None:
            self._values["permissions_boundary_policies_json"] = permissions_boundary_policies_json
        if resource_arns is not None:
            self._values["resource_arns"] = resource_arns
        if resource_handling_option is not None:
            self._values["resource_handling_option"] = resource_handling_option
        if resource_owner_account_id is not None:
            self._values["resource_owner_account_id"] = resource_owner_account_id
        if resource_policy_json is not None:
            self._values["resource_policy_json"] = resource_policy_json

    @builtins.property
    def connection(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, _cdktf_9a9027ec.WinrmProvisionerConnection]]:
        '''
        :stability: experimental
        '''
        result = self._values.get("connection")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, _cdktf_9a9027ec.WinrmProvisionerConnection]], result)

    @builtins.property
    def count(
        self,
    ) -> typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]]:
        '''
        :stability: experimental
        '''
        result = self._values.get("count")
        return typing.cast(typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]], result)

    @builtins.property
    def depends_on(
        self,
    ) -> typing.Optional[typing.List[_cdktf_9a9027ec.ITerraformDependable]]:
        '''
        :stability: experimental
        '''
        result = self._values.get("depends_on")
        return typing.cast(typing.Optional[typing.List[_cdktf_9a9027ec.ITerraformDependable]], result)

    @builtins.property
    def for_each(self) -> typing.Optional[_cdktf_9a9027ec.ITerraformIterator]:
        '''
        :stability: experimental
        '''
        result = self._values.get("for_each")
        return typing.cast(typing.Optional[_cdktf_9a9027ec.ITerraformIterator], result)

    @builtins.property
    def lifecycle(self) -> typing.Optional[_cdktf_9a9027ec.TerraformResourceLifecycle]:
        '''
        :stability: experimental
        '''
        result = self._values.get("lifecycle")
        return typing.cast(typing.Optional[_cdktf_9a9027ec.TerraformResourceLifecycle], result)

    @builtins.property
    def provider(self) -> typing.Optional[_cdktf_9a9027ec.TerraformProvider]:
        '''
        :stability: experimental
        '''
        result = self._values.get("provider")
        return typing.cast(typing.Optional[_cdktf_9a9027ec.TerraformProvider], result)

    @builtins.property
    def provisioners(
        self,
    ) -> typing.Optional[typing.List[typing.Union[_cdktf_9a9027ec.FileProvisioner, _cdktf_9a9027ec.LocalExecProvisioner, _cdktf_9a9027ec.RemoteExecProvisioner]]]:
        '''
        :stability: experimental
        '''
        result = self._values.get("provisioners")
        return typing.cast(typing.Optional[typing.List[typing.Union[_cdktf_9a9027ec.FileProvisioner, _cdktf_9a9027ec.LocalExecProvisioner, _cdktf_9a9027ec.RemoteExecProvisioner]]], result)

    @builtins.property
    def action_names(self) -> typing.List[builtins.str]:
        '''One or more names of actions, like "iam:CreateUser", that should be included in the simulation.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#action_names DataAwsIamPrincipalPolicySimulation#action_names}
        '''
        result = self._values.get("action_names")
        assert result is not None, "Required property 'action_names' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def policy_source_arn(self) -> builtins.str:
        '''ARN of the principal (e.g. user, role) whose existing configured access policies will be used as the basis for the simulation. If you specify a role ARN here, you can also set caller_arn to simulate a particular user acting with the given role.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#policy_source_arn DataAwsIamPrincipalPolicySimulation#policy_source_arn}
        '''
        result = self._values.get("policy_source_arn")
        assert result is not None, "Required property 'policy_source_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def additional_policies_json(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Additional principal-based policies to use in the simulation.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#additional_policies_json DataAwsIamPrincipalPolicySimulation#additional_policies_json}
        '''
        result = self._values.get("additional_policies_json")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def caller_arn(self) -> typing.Optional[builtins.str]:
        '''ARN of a user to use as the caller of the simulated requests.

        If not specified, defaults to the principal specified in policy_source_arn, if it is a user ARN.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#caller_arn DataAwsIamPrincipalPolicySimulation#caller_arn}
        '''
        result = self._values.get("caller_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def context(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DataAwsIamPrincipalPolicySimulationContext"]]]:
        '''context block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#context DataAwsIamPrincipalPolicySimulation#context}
        '''
        result = self._values.get("context")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DataAwsIamPrincipalPolicySimulationContext"]]], result)

    @builtins.property
    def permissions_boundary_policies_json(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        '''Additional permission boundary policies to use in the simulation.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#permissions_boundary_policies_json DataAwsIamPrincipalPolicySimulation#permissions_boundary_policies_json}
        '''
        result = self._values.get("permissions_boundary_policies_json")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def resource_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''ARNs of specific resources to use as the targets of the specified actions during simulation.

        If not specified, the simulator assumes "*" which represents general access across all resources.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_arns DataAwsIamPrincipalPolicySimulation#resource_arns}
        '''
        result = self._values.get("resource_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def resource_handling_option(self) -> typing.Optional[builtins.str]:
        '''Specifies the type of simulation to run.

        Some API operations need a particular resource handling option in order to produce a correct reesult.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_handling_option DataAwsIamPrincipalPolicySimulation#resource_handling_option}
        '''
        result = self._values.get("resource_handling_option")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def resource_owner_account_id(self) -> typing.Optional[builtins.str]:
        '''An AWS account ID to use as the simulated owner for any resource whose ARN does not include a specific owner account ID.

        Defaults to the account given as part of caller_arn.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_owner_account_id DataAwsIamPrincipalPolicySimulation#resource_owner_account_id}
        '''
        result = self._values.get("resource_owner_account_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def resource_policy_json(self) -> typing.Optional[builtins.str]:
        '''A resource policy to associate with all of the target resources for simulation purposes.

        The policy simulator does not automatically retrieve resource-level policies, so if a resource policy is crucial to your test then you must specify here the same policy document associated with your target resource(s).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_policy_json DataAwsIamPrincipalPolicySimulation#resource_policy_json}
        '''
        result = self._values.get("resource_policy_json")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DataAwsIamPrincipalPolicySimulationConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationContext",
    jsii_struct_bases=[],
    name_mapping={"key": "key", "type": "type", "values": "values"},
)
class DataAwsIamPrincipalPolicySimulationContext:
    def __init__(
        self,
        *,
        key: builtins.str,
        type: builtins.str,
        values: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param key: The key name of the context entry, such as "aws:CurrentTime". Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#key DataAwsIamPrincipalPolicySimulation#key}
        :param type: The type that the simulator should use to interpret the strings given in argument "values". Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#type DataAwsIamPrincipalPolicySimulation#type}
        :param values: One or more values to assign to the context key, given as a string in a syntax appropriate for the selected value type. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#values DataAwsIamPrincipalPolicySimulation#values}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a9bb924c77e0d0848748c9f505f62bdba0bf88f7ea5aa28a0648df464818d2a)
            check_type(argname="argument key", value=key, expected_type=type_hints["key"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument values", value=values, expected_type=type_hints["values"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "key": key,
            "type": type,
            "values": values,
        }

    @builtins.property
    def key(self) -> builtins.str:
        '''The key name of the context entry, such as "aws:CurrentTime".

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#key DataAwsIamPrincipalPolicySimulation#key}
        '''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''The type that the simulator should use to interpret the strings given in argument "values".

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#type DataAwsIamPrincipalPolicySimulation#type}
        '''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def values(self) -> typing.List[builtins.str]:
        '''One or more values to assign to the context key, given as a string in a syntax appropriate for the selected value type.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#values DataAwsIamPrincipalPolicySimulation#values}
        '''
        result = self._values.get("values")
        assert result is not None, "Required property 'values' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DataAwsIamPrincipalPolicySimulationContext(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DataAwsIamPrincipalPolicySimulationContextList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationContextList",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        wraps_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param wraps_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84071f264d1906c9e58bebe99523b5ae8a9459563e5e74a5dbf0a8b9a0e7d9db)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "DataAwsIamPrincipalPolicySimulationContextOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78859aeada0d26d61d20dd773c8c4f393e47d816d2b2544bda93b2a2412c1624)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("DataAwsIamPrincipalPolicySimulationContextOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__68c4854ec02370d751832930172fcf7341c31abdcf918eb31896423c8bf896fe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformAttribute", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="terraformResource")
    def _terraform_resource(self) -> _cdktf_9a9027ec.IInterpolatingParent:
        '''The parent resource.'''
        return typing.cast(_cdktf_9a9027ec.IInterpolatingParent, jsii.get(self, "terraformResource"))

    @_terraform_resource.setter
    def _terraform_resource(self, value: _cdktf_9a9027ec.IInterpolatingParent) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__253681683a21db58a464696521119a49a96d5ad023380b1cfcf556f69eb70eb7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformResource", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="wrapsSet")
    def _wraps_set(self) -> builtins.bool:
        '''whether the list is wrapping a set (will add tolist() to be able to access an item via an index).'''
        return typing.cast(builtins.bool, jsii.get(self, "wrapsSet"))

    @_wraps_set.setter
    def _wraps_set(self, value: builtins.bool) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c53d9cf4521b62977047b880e8e3c2fda7abae2f14caa62d8fbd5f8ce72d4bcc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DataAwsIamPrincipalPolicySimulationContext]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DataAwsIamPrincipalPolicySimulationContext]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DataAwsIamPrincipalPolicySimulationContext]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14388e8e83233a59b4f168ed5c391f535a4599f717024acf63f22c4da52698ca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class DataAwsIamPrincipalPolicySimulationContextOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationContextOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        complex_object_index: jsii.Number,
        complex_object_is_from_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param complex_object_index: the index of this item in the list.
        :param complex_object_is_from_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ebc0412ceb0b9676f1209060334780073253bd6a43e7a95566864a4cc4c37cfe)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="keyInput")
    def key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "keyInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="valuesInput")
    def values_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "valuesInput"))

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b8cfa2017dbaa68a8a60f0600d834527d914ab64ce1c8f3f46eb434099ed331)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe2380a46383326eedfed345a4bb5ba5425035f61306a5594ed44fbdb81e59bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="values")
    def values(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "values"))

    @values.setter
    def values(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a680bf082ace048bfed8a3e402c6a029036e534669f41f62fa3b61e3ca7b80a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "values", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DataAwsIamPrincipalPolicySimulationContext]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DataAwsIamPrincipalPolicySimulationContext]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DataAwsIamPrincipalPolicySimulationContext]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b5010d31b37700e337cb3e4896d1cb0b84f78f43d72d4d1697b2723b70578a2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationResults",
    jsii_struct_bases=[],
    name_mapping={},
)
class DataAwsIamPrincipalPolicySimulationResults:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DataAwsIamPrincipalPolicySimulationResults(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DataAwsIamPrincipalPolicySimulationResultsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationResultsList",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        wraps_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param wraps_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4be55ba5f80689aa72760a86fd46996da0a7eab146e866de5616af4244a27c01)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "DataAwsIamPrincipalPolicySimulationResultsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5dfc3c6f2a87e75b2cefcc8f878a67845f58928ac51f4fe5e78a57abdbb693be)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("DataAwsIamPrincipalPolicySimulationResultsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__015900c735fcfcfbf9f90d41260f1cedc5d7e6cdcd5704713d727f8d7786bf7d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformAttribute", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="terraformResource")
    def _terraform_resource(self) -> _cdktf_9a9027ec.IInterpolatingParent:
        '''The parent resource.'''
        return typing.cast(_cdktf_9a9027ec.IInterpolatingParent, jsii.get(self, "terraformResource"))

    @_terraform_resource.setter
    def _terraform_resource(self, value: _cdktf_9a9027ec.IInterpolatingParent) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15e9f030edbe736483af650be1f3bb988c90ea7e3f6f138d7ddd6f21101a7966)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformResource", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="wrapsSet")
    def _wraps_set(self) -> builtins.bool:
        '''whether the list is wrapping a set (will add tolist() to be able to access an item via an index).'''
        return typing.cast(builtins.bool, jsii.get(self, "wrapsSet"))

    @_wraps_set.setter
    def _wraps_set(self, value: builtins.bool) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__94c4310577fbe8e5766ae797a1ee75c966a24627e2a5ea81576eacf415b5e92a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationResultsMatchedStatements",
    jsii_struct_bases=[],
    name_mapping={},
)
class DataAwsIamPrincipalPolicySimulationResultsMatchedStatements:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DataAwsIamPrincipalPolicySimulationResultsMatchedStatements(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsList",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        wraps_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param wraps_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__45eddd0745d13714d5f5dd807f92056e49cb180bed76c9b3910f9a45911f1a64)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4a8a3ade4d7f8747da4abf5322432758772a451a232bd851d6287599b2e8ced)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa69535eb7e34d60b2fc2b96a6ae64f07451f19f9cd5b44a1fbb42007cfa17bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformAttribute", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="terraformResource")
    def _terraform_resource(self) -> _cdktf_9a9027ec.IInterpolatingParent:
        '''The parent resource.'''
        return typing.cast(_cdktf_9a9027ec.IInterpolatingParent, jsii.get(self, "terraformResource"))

    @_terraform_resource.setter
    def _terraform_resource(self, value: _cdktf_9a9027ec.IInterpolatingParent) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6bb2ba95175c3fe6e216e550767380a33de3826687450db7d807ab6992bfd4fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformResource", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="wrapsSet")
    def _wraps_set(self) -> builtins.bool:
        '''whether the list is wrapping a set (will add tolist() to be able to access an item via an index).'''
        return typing.cast(builtins.bool, jsii.get(self, "wrapsSet"))

    @_wraps_set.setter
    def _wraps_set(self, value: builtins.bool) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b3949a0c32b65fc2d86a614d9dde6e2f62f7e57e014b3b752f0b6535e281eec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        complex_object_index: jsii.Number,
        complex_object_is_from_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param complex_object_index: the index of this item in the list.
        :param complex_object_is_from_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab6dcda7f458a90a8c3024fd1063cf62915c0037557ad003bb9cb1b55e4951f1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="sourcePolicyId")
    def source_policy_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourcePolicyId"))

    @builtins.property
    @jsii.member(jsii_name="sourcePolicyType")
    def source_policy_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourcePolicyType"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[DataAwsIamPrincipalPolicySimulationResultsMatchedStatements]:
        return typing.cast(typing.Optional[DataAwsIamPrincipalPolicySimulationResultsMatchedStatements], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[DataAwsIamPrincipalPolicySimulationResultsMatchedStatements],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7851070e3dbb6299d4e99decf00827ef90e338529b96ac123b052789a09e9195)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class DataAwsIamPrincipalPolicySimulationResultsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationResultsOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        complex_object_index: jsii.Number,
        complex_object_is_from_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param complex_object_index: the index of this item in the list.
        :param complex_object_is_from_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f86e7f26990daca5080b88b026bacbb26d4355f106a0ef11f417cca307d6d464)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="actionName")
    def action_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "actionName"))

    @builtins.property
    @jsii.member(jsii_name="allowed")
    def allowed(self) -> _cdktf_9a9027ec.IResolvable:
        return typing.cast(_cdktf_9a9027ec.IResolvable, jsii.get(self, "allowed"))

    @builtins.property
    @jsii.member(jsii_name="decision")
    def decision(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "decision"))

    @builtins.property
    @jsii.member(jsii_name="decisionDetails")
    def decision_details(self) -> _cdktf_9a9027ec.StringMap:
        return typing.cast(_cdktf_9a9027ec.StringMap, jsii.get(self, "decisionDetails"))

    @builtins.property
    @jsii.member(jsii_name="matchedStatements")
    def matched_statements(
        self,
    ) -> DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsList:
        return typing.cast(DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsList, jsii.get(self, "matchedStatements"))

    @builtins.property
    @jsii.member(jsii_name="missingContextKeys")
    def missing_context_keys(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "missingContextKeys"))

    @builtins.property
    @jsii.member(jsii_name="resourceArn")
    def resource_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceArn"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[DataAwsIamPrincipalPolicySimulationResults]:
        return typing.cast(typing.Optional[DataAwsIamPrincipalPolicySimulationResults], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[DataAwsIamPrincipalPolicySimulationResults],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18ed6cf74d5245b21ddfbded36239e3981643d4cdb02cec55230316bf1d6939e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "DataAwsIamPrincipalPolicySimulation",
    "DataAwsIamPrincipalPolicySimulationConfig",
    "DataAwsIamPrincipalPolicySimulationContext",
    "DataAwsIamPrincipalPolicySimulationContextList",
    "DataAwsIamPrincipalPolicySimulationContextOutputReference",
    "DataAwsIamPrincipalPolicySimulationResults",
    "DataAwsIamPrincipalPolicySimulationResultsList",
    "DataAwsIamPrincipalPolicySimulationResultsMatchedStatements",
    "DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsList",
    "DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsOutputReference",
    "DataAwsIamPrincipalPolicySimulationResultsOutputReference",
]

publication.publish()

def _typecheckingstub__9642a0ab84d65edd5cd638209b898f40e6f9464370c413bec900419503e0cec6(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    action_names: typing.Sequence[builtins.str],
    policy_source_arn: builtins.str,
    additional_policies_json: typing.Optional[typing.Sequence[builtins.str]] = None,
    caller_arn: typing.Optional[builtins.str] = None,
    context: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DataAwsIamPrincipalPolicySimulationContext, typing.Dict[builtins.str, typing.Any]]]]] = None,
    permissions_boundary_policies_json: typing.Optional[typing.Sequence[builtins.str]] = None,
    resource_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    resource_handling_option: typing.Optional[builtins.str] = None,
    resource_owner_account_id: typing.Optional[builtins.str] = None,
    resource_policy_json: typing.Optional[builtins.str] = None,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d1ce4ea075b29b3ed232cc45f9089d973ae2bb132b6472564a27a913376dcdf(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3a33f76361c16742d70f1ce2a4597c41df71d16c4fa6500707c6771bea8b62c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DataAwsIamPrincipalPolicySimulationContext, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37ba7f8c89362fa039bf5629b41bd26bfdb2d93d319504c4a664a70edcc70655(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__928d3f253d10e67aaf5f663e9f56d58987126777a9073a32542e7b85e42cbc3d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d23da4b6e279881457541a427de67e509b5ca170316985b6bf849edfec9973b4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aab95998bd018b46ba85cab3d9c058527a20d1f351fa588f72b4a521047f4bd5(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__48a52212a2e560b253c90e4162da3cf5519930578b90b2cbb3808c4cdd2869e9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9cf96932911529f47abe9c85a8ee3cdd8900c2976f3dd19759d76e8ae79ca41(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f2fbcd5122131a12d4d0b54e92f46e5e14a2fc1e2de7f466fc9de0131f738a3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__39934e181cf056a3bece4641fd68b2b17ca3295a17fc798af52715ca39166d59(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a8dd2c5c8a08063e97dc6161edfd28c8fe40b33926918a368ea28897e5dc8ae5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__176bc752fade48367880a76913cbe191d4cb3546aebad31e67c2f6da2e726914(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    action_names: typing.Sequence[builtins.str],
    policy_source_arn: builtins.str,
    additional_policies_json: typing.Optional[typing.Sequence[builtins.str]] = None,
    caller_arn: typing.Optional[builtins.str] = None,
    context: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DataAwsIamPrincipalPolicySimulationContext, typing.Dict[builtins.str, typing.Any]]]]] = None,
    permissions_boundary_policies_json: typing.Optional[typing.Sequence[builtins.str]] = None,
    resource_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    resource_handling_option: typing.Optional[builtins.str] = None,
    resource_owner_account_id: typing.Optional[builtins.str] = None,
    resource_policy_json: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a9bb924c77e0d0848748c9f505f62bdba0bf88f7ea5aa28a0648df464818d2a(
    *,
    key: builtins.str,
    type: builtins.str,
    values: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84071f264d1906c9e58bebe99523b5ae8a9459563e5e74a5dbf0a8b9a0e7d9db(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78859aeada0d26d61d20dd773c8c4f393e47d816d2b2544bda93b2a2412c1624(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68c4854ec02370d751832930172fcf7341c31abdcf918eb31896423c8bf896fe(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__253681683a21db58a464696521119a49a96d5ad023380b1cfcf556f69eb70eb7(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c53d9cf4521b62977047b880e8e3c2fda7abae2f14caa62d8fbd5f8ce72d4bcc(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14388e8e83233a59b4f168ed5c391f535a4599f717024acf63f22c4da52698ca(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DataAwsIamPrincipalPolicySimulationContext]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebc0412ceb0b9676f1209060334780073253bd6a43e7a95566864a4cc4c37cfe(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b8cfa2017dbaa68a8a60f0600d834527d914ab64ce1c8f3f46eb434099ed331(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe2380a46383326eedfed345a4bb5ba5425035f61306a5594ed44fbdb81e59bc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a680bf082ace048bfed8a3e402c6a029036e534669f41f62fa3b61e3ca7b80a9(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5010d31b37700e337cb3e4896d1cb0b84f78f43d72d4d1697b2723b70578a2e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DataAwsIamPrincipalPolicySimulationContext]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4be55ba5f80689aa72760a86fd46996da0a7eab146e866de5616af4244a27c01(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5dfc3c6f2a87e75b2cefcc8f878a67845f58928ac51f4fe5e78a57abdbb693be(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__015900c735fcfcfbf9f90d41260f1cedc5d7e6cdcd5704713d727f8d7786bf7d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15e9f030edbe736483af650be1f3bb988c90ea7e3f6f138d7ddd6f21101a7966(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94c4310577fbe8e5766ae797a1ee75c966a24627e2a5ea81576eacf415b5e92a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45eddd0745d13714d5f5dd807f92056e49cb180bed76c9b3910f9a45911f1a64(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4a8a3ade4d7f8747da4abf5322432758772a451a232bd851d6287599b2e8ced(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa69535eb7e34d60b2fc2b96a6ae64f07451f19f9cd5b44a1fbb42007cfa17bd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bb2ba95175c3fe6e216e550767380a33de3826687450db7d807ab6992bfd4fd(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b3949a0c32b65fc2d86a614d9dde6e2f62f7e57e014b3b752f0b6535e281eec(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab6dcda7f458a90a8c3024fd1063cf62915c0037557ad003bb9cb1b55e4951f1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7851070e3dbb6299d4e99decf00827ef90e338529b96ac123b052789a09e9195(
    value: typing.Optional[DataAwsIamPrincipalPolicySimulationResultsMatchedStatements],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f86e7f26990daca5080b88b026bacbb26d4355f106a0ef11f417cca307d6d464(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18ed6cf74d5245b21ddfbded36239e3981643d4cdb02cec55230316bf1d6939e(
    value: typing.Optional[DataAwsIamPrincipalPolicySimulationResults],
) -> None:
    """Type checking stubs"""
    pass
