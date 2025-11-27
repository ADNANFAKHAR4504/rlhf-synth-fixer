r'''
# `aws_cloudformation_stack_instances`

Refer to the Terraform Registry for docs: [`aws_cloudformation_stack_instances`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances).
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


class CloudformationStackInstances(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstances",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances aws_cloudformation_stack_instances}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        stack_set_name: builtins.str,
        accounts: typing.Optional[typing.Sequence[builtins.str]] = None,
        call_as: typing.Optional[builtins.str] = None,
        deployment_targets: typing.Optional[typing.Union["CloudformationStackInstancesDeploymentTargets", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        operation_preferences: typing.Optional[typing.Union["CloudformationStackInstancesOperationPreferences", typing.Dict[builtins.str, typing.Any]]] = None,
        parameter_overrides: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        regions: typing.Optional[typing.Sequence[builtins.str]] = None,
        retain_stacks: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        timeouts: typing.Optional[typing.Union["CloudformationStackInstancesTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances aws_cloudformation_stack_instances} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param stack_set_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#stack_set_name CloudformationStackInstances#stack_set_name}.
        :param accounts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts CloudformationStackInstances#accounts}.
        :param call_as: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#call_as CloudformationStackInstances#call_as}.
        :param deployment_targets: deployment_targets block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#deployment_targets CloudformationStackInstances#deployment_targets}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#id CloudformationStackInstances#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param operation_preferences: operation_preferences block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#operation_preferences CloudformationStackInstances#operation_preferences}
        :param parameter_overrides: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#parameter_overrides CloudformationStackInstances#parameter_overrides}.
        :param regions: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#regions CloudformationStackInstances#regions}.
        :param retain_stacks: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#retain_stacks CloudformationStackInstances#retain_stacks}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#timeouts CloudformationStackInstances#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__592167ba48dad79084a826eb01ff1dd51152dffb083d75584940c3bccd731c5f)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = CloudformationStackInstancesConfig(
            stack_set_name=stack_set_name,
            accounts=accounts,
            call_as=call_as,
            deployment_targets=deployment_targets,
            id=id,
            operation_preferences=operation_preferences,
            parameter_overrides=parameter_overrides,
            regions=regions,
            retain_stacks=retain_stacks,
            timeouts=timeouts,
            connection=connection,
            count=count,
            depends_on=depends_on,
            for_each=for_each,
            lifecycle=lifecycle,
            provider=provider,
            provisioners=provisioners,
        )

        jsii.create(self.__class__, self, [scope, id_, config])

    @jsii.member(jsii_name="generateConfigForImport")
    @builtins.classmethod
    def generate_config_for_import(
        cls,
        scope: _constructs_77d1e7e8.Construct,
        import_to_id: builtins.str,
        import_from_id: builtins.str,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    ) -> _cdktf_9a9027ec.ImportableResource:
        '''Generates CDKTF code for importing a CloudformationStackInstances resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the CloudformationStackInstances to import.
        :param import_from_id: The id of the existing CloudformationStackInstances that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the CloudformationStackInstances to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__34b85b275b1d2ad25d91fe852ade7758961b74d1b4b0aa2b5d7e0c1e29b1a3fa)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putDeploymentTargets")
    def put_deployment_targets(
        self,
        *,
        account_filter_type: typing.Optional[builtins.str] = None,
        accounts: typing.Optional[typing.Sequence[builtins.str]] = None,
        accounts_url: typing.Optional[builtins.str] = None,
        organizational_unit_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param account_filter_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#account_filter_type CloudformationStackInstances#account_filter_type}.
        :param accounts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts CloudformationStackInstances#accounts}.
        :param accounts_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts_url CloudformationStackInstances#accounts_url}.
        :param organizational_unit_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#organizational_unit_ids CloudformationStackInstances#organizational_unit_ids}.
        '''
        value = CloudformationStackInstancesDeploymentTargets(
            account_filter_type=account_filter_type,
            accounts=accounts,
            accounts_url=accounts_url,
            organizational_unit_ids=organizational_unit_ids,
        )

        return typing.cast(None, jsii.invoke(self, "putDeploymentTargets", [value]))

    @jsii.member(jsii_name="putOperationPreferences")
    def put_operation_preferences(
        self,
        *,
        concurrency_mode: typing.Optional[builtins.str] = None,
        failure_tolerance_count: typing.Optional[jsii.Number] = None,
        failure_tolerance_percentage: typing.Optional[jsii.Number] = None,
        max_concurrent_count: typing.Optional[jsii.Number] = None,
        max_concurrent_percentage: typing.Optional[jsii.Number] = None,
        region_concurrency_type: typing.Optional[builtins.str] = None,
        region_order: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param concurrency_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#concurrency_mode CloudformationStackInstances#concurrency_mode}.
        :param failure_tolerance_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#failure_tolerance_count CloudformationStackInstances#failure_tolerance_count}.
        :param failure_tolerance_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#failure_tolerance_percentage CloudformationStackInstances#failure_tolerance_percentage}.
        :param max_concurrent_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#max_concurrent_count CloudformationStackInstances#max_concurrent_count}.
        :param max_concurrent_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#max_concurrent_percentage CloudformationStackInstances#max_concurrent_percentage}.
        :param region_concurrency_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#region_concurrency_type CloudformationStackInstances#region_concurrency_type}.
        :param region_order: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#region_order CloudformationStackInstances#region_order}.
        '''
        value = CloudformationStackInstancesOperationPreferences(
            concurrency_mode=concurrency_mode,
            failure_tolerance_count=failure_tolerance_count,
            failure_tolerance_percentage=failure_tolerance_percentage,
            max_concurrent_count=max_concurrent_count,
            max_concurrent_percentage=max_concurrent_percentage,
            region_concurrency_type=region_concurrency_type,
            region_order=region_order,
        )

        return typing.cast(None, jsii.invoke(self, "putOperationPreferences", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#create CloudformationStackInstances#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#delete CloudformationStackInstances#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#update CloudformationStackInstances#update}.
        '''
        value = CloudformationStackInstancesTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetAccounts")
    def reset_accounts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccounts", []))

    @jsii.member(jsii_name="resetCallAs")
    def reset_call_as(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCallAs", []))

    @jsii.member(jsii_name="resetDeploymentTargets")
    def reset_deployment_targets(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeploymentTargets", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetOperationPreferences")
    def reset_operation_preferences(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOperationPreferences", []))

    @jsii.member(jsii_name="resetParameterOverrides")
    def reset_parameter_overrides(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParameterOverrides", []))

    @jsii.member(jsii_name="resetRegions")
    def reset_regions(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegions", []))

    @jsii.member(jsii_name="resetRetainStacks")
    def reset_retain_stacks(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRetainStacks", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

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
    @jsii.member(jsii_name="deploymentTargets")
    def deployment_targets(
        self,
    ) -> "CloudformationStackInstancesDeploymentTargetsOutputReference":
        return typing.cast("CloudformationStackInstancesDeploymentTargetsOutputReference", jsii.get(self, "deploymentTargets"))

    @builtins.property
    @jsii.member(jsii_name="operationPreferences")
    def operation_preferences(
        self,
    ) -> "CloudformationStackInstancesOperationPreferencesOutputReference":
        return typing.cast("CloudformationStackInstancesOperationPreferencesOutputReference", jsii.get(self, "operationPreferences"))

    @builtins.property
    @jsii.member(jsii_name="stackInstanceSummaries")
    def stack_instance_summaries(
        self,
    ) -> "CloudformationStackInstancesStackInstanceSummariesList":
        return typing.cast("CloudformationStackInstancesStackInstanceSummariesList", jsii.get(self, "stackInstanceSummaries"))

    @builtins.property
    @jsii.member(jsii_name="stackSetId")
    def stack_set_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "stackSetId"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "CloudformationStackInstancesTimeoutsOutputReference":
        return typing.cast("CloudformationStackInstancesTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="accountsInput")
    def accounts_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "accountsInput"))

    @builtins.property
    @jsii.member(jsii_name="callAsInput")
    def call_as_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "callAsInput"))

    @builtins.property
    @jsii.member(jsii_name="deploymentTargetsInput")
    def deployment_targets_input(
        self,
    ) -> typing.Optional["CloudformationStackInstancesDeploymentTargets"]:
        return typing.cast(typing.Optional["CloudformationStackInstancesDeploymentTargets"], jsii.get(self, "deploymentTargetsInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="operationPreferencesInput")
    def operation_preferences_input(
        self,
    ) -> typing.Optional["CloudformationStackInstancesOperationPreferences"]:
        return typing.cast(typing.Optional["CloudformationStackInstancesOperationPreferences"], jsii.get(self, "operationPreferencesInput"))

    @builtins.property
    @jsii.member(jsii_name="parameterOverridesInput")
    def parameter_overrides_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "parameterOverridesInput"))

    @builtins.property
    @jsii.member(jsii_name="regionsInput")
    def regions_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "regionsInput"))

    @builtins.property
    @jsii.member(jsii_name="retainStacksInput")
    def retain_stacks_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "retainStacksInput"))

    @builtins.property
    @jsii.member(jsii_name="stackSetNameInput")
    def stack_set_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stackSetNameInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "CloudformationStackInstancesTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "CloudformationStackInstancesTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="accounts")
    def accounts(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "accounts"))

    @accounts.setter
    def accounts(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a4ef8cfa8a3d03c0ddb234f5bf767915589baf7b7ea37febb0a70cc89ab59b7e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accounts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="callAs")
    def call_as(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "callAs"))

    @call_as.setter
    def call_as(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3298cd2d595bf44ecd6a1a3f864b5323c62d6ace7d11628231a9e9f3bf00cbbf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "callAs", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5502268cb2b9fb599ee07d39c555ba84c544822a0591040d20408514304f5862)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="parameterOverrides")
    def parameter_overrides(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "parameterOverrides"))

    @parameter_overrides.setter
    def parameter_overrides(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4f7cf840dc1caee8f24484cb0fc48f122a3e7c7adbb824947c440e200197878)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "parameterOverrides", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="regions")
    def regions(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "regions"))

    @regions.setter
    def regions(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__98c24820360f9f3a42847cc3504064a492e99ec6ad0a17d95e8a020680337582)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "regions", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="retainStacks")
    def retain_stacks(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "retainStacks"))

    @retain_stacks.setter
    def retain_stacks(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9c948bac341d4aa3ed905927e35807e285274ff7fb70eab2c1e80942e34fb727)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "retainStacks", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="stackSetName")
    def stack_set_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "stackSetName"))

    @stack_set_name.setter
    def stack_set_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4c5f05281073735268451b19c9a241ecfd9c6637b6f16a507c64977ccda8ec2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "stackSetName", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstancesConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "stack_set_name": "stackSetName",
        "accounts": "accounts",
        "call_as": "callAs",
        "deployment_targets": "deploymentTargets",
        "id": "id",
        "operation_preferences": "operationPreferences",
        "parameter_overrides": "parameterOverrides",
        "regions": "regions",
        "retain_stacks": "retainStacks",
        "timeouts": "timeouts",
    },
)
class CloudformationStackInstancesConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        stack_set_name: builtins.str,
        accounts: typing.Optional[typing.Sequence[builtins.str]] = None,
        call_as: typing.Optional[builtins.str] = None,
        deployment_targets: typing.Optional[typing.Union["CloudformationStackInstancesDeploymentTargets", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        operation_preferences: typing.Optional[typing.Union["CloudformationStackInstancesOperationPreferences", typing.Dict[builtins.str, typing.Any]]] = None,
        parameter_overrides: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        regions: typing.Optional[typing.Sequence[builtins.str]] = None,
        retain_stacks: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        timeouts: typing.Optional[typing.Union["CloudformationStackInstancesTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param stack_set_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#stack_set_name CloudformationStackInstances#stack_set_name}.
        :param accounts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts CloudformationStackInstances#accounts}.
        :param call_as: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#call_as CloudformationStackInstances#call_as}.
        :param deployment_targets: deployment_targets block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#deployment_targets CloudformationStackInstances#deployment_targets}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#id CloudformationStackInstances#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param operation_preferences: operation_preferences block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#operation_preferences CloudformationStackInstances#operation_preferences}
        :param parameter_overrides: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#parameter_overrides CloudformationStackInstances#parameter_overrides}.
        :param regions: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#regions CloudformationStackInstances#regions}.
        :param retain_stacks: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#retain_stacks CloudformationStackInstances#retain_stacks}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#timeouts CloudformationStackInstances#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(deployment_targets, dict):
            deployment_targets = CloudformationStackInstancesDeploymentTargets(**deployment_targets)
        if isinstance(operation_preferences, dict):
            operation_preferences = CloudformationStackInstancesOperationPreferences(**operation_preferences)
        if isinstance(timeouts, dict):
            timeouts = CloudformationStackInstancesTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99960488ba7bccaf455d97b11495454eb3d799b8fad840546d555075148e15b0)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument stack_set_name", value=stack_set_name, expected_type=type_hints["stack_set_name"])
            check_type(argname="argument accounts", value=accounts, expected_type=type_hints["accounts"])
            check_type(argname="argument call_as", value=call_as, expected_type=type_hints["call_as"])
            check_type(argname="argument deployment_targets", value=deployment_targets, expected_type=type_hints["deployment_targets"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument operation_preferences", value=operation_preferences, expected_type=type_hints["operation_preferences"])
            check_type(argname="argument parameter_overrides", value=parameter_overrides, expected_type=type_hints["parameter_overrides"])
            check_type(argname="argument regions", value=regions, expected_type=type_hints["regions"])
            check_type(argname="argument retain_stacks", value=retain_stacks, expected_type=type_hints["retain_stacks"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "stack_set_name": stack_set_name,
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
        if accounts is not None:
            self._values["accounts"] = accounts
        if call_as is not None:
            self._values["call_as"] = call_as
        if deployment_targets is not None:
            self._values["deployment_targets"] = deployment_targets
        if id is not None:
            self._values["id"] = id
        if operation_preferences is not None:
            self._values["operation_preferences"] = operation_preferences
        if parameter_overrides is not None:
            self._values["parameter_overrides"] = parameter_overrides
        if regions is not None:
            self._values["regions"] = regions
        if retain_stacks is not None:
            self._values["retain_stacks"] = retain_stacks
        if timeouts is not None:
            self._values["timeouts"] = timeouts

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
    def stack_set_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#stack_set_name CloudformationStackInstances#stack_set_name}.'''
        result = self._values.get("stack_set_name")
        assert result is not None, "Required property 'stack_set_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def accounts(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts CloudformationStackInstances#accounts}.'''
        result = self._values.get("accounts")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def call_as(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#call_as CloudformationStackInstances#call_as}.'''
        result = self._values.get("call_as")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def deployment_targets(
        self,
    ) -> typing.Optional["CloudformationStackInstancesDeploymentTargets"]:
        '''deployment_targets block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#deployment_targets CloudformationStackInstances#deployment_targets}
        '''
        result = self._values.get("deployment_targets")
        return typing.cast(typing.Optional["CloudformationStackInstancesDeploymentTargets"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#id CloudformationStackInstances#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def operation_preferences(
        self,
    ) -> typing.Optional["CloudformationStackInstancesOperationPreferences"]:
        '''operation_preferences block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#operation_preferences CloudformationStackInstances#operation_preferences}
        '''
        result = self._values.get("operation_preferences")
        return typing.cast(typing.Optional["CloudformationStackInstancesOperationPreferences"], result)

    @builtins.property
    def parameter_overrides(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#parameter_overrides CloudformationStackInstances#parameter_overrides}.'''
        result = self._values.get("parameter_overrides")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def regions(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#regions CloudformationStackInstances#regions}.'''
        result = self._values.get("regions")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def retain_stacks(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#retain_stacks CloudformationStackInstances#retain_stacks}.'''
        result = self._values.get("retain_stacks")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["CloudformationStackInstancesTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#timeouts CloudformationStackInstances#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["CloudformationStackInstancesTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudformationStackInstancesConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstancesDeploymentTargets",
    jsii_struct_bases=[],
    name_mapping={
        "account_filter_type": "accountFilterType",
        "accounts": "accounts",
        "accounts_url": "accountsUrl",
        "organizational_unit_ids": "organizationalUnitIds",
    },
)
class CloudformationStackInstancesDeploymentTargets:
    def __init__(
        self,
        *,
        account_filter_type: typing.Optional[builtins.str] = None,
        accounts: typing.Optional[typing.Sequence[builtins.str]] = None,
        accounts_url: typing.Optional[builtins.str] = None,
        organizational_unit_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param account_filter_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#account_filter_type CloudformationStackInstances#account_filter_type}.
        :param accounts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts CloudformationStackInstances#accounts}.
        :param accounts_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts_url CloudformationStackInstances#accounts_url}.
        :param organizational_unit_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#organizational_unit_ids CloudformationStackInstances#organizational_unit_ids}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__82c95941fb574b5e3779a3fe57a87a669e820abd3b02fbd42e9de0897770675b)
            check_type(argname="argument account_filter_type", value=account_filter_type, expected_type=type_hints["account_filter_type"])
            check_type(argname="argument accounts", value=accounts, expected_type=type_hints["accounts"])
            check_type(argname="argument accounts_url", value=accounts_url, expected_type=type_hints["accounts_url"])
            check_type(argname="argument organizational_unit_ids", value=organizational_unit_ids, expected_type=type_hints["organizational_unit_ids"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if account_filter_type is not None:
            self._values["account_filter_type"] = account_filter_type
        if accounts is not None:
            self._values["accounts"] = accounts
        if accounts_url is not None:
            self._values["accounts_url"] = accounts_url
        if organizational_unit_ids is not None:
            self._values["organizational_unit_ids"] = organizational_unit_ids

    @builtins.property
    def account_filter_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#account_filter_type CloudformationStackInstances#account_filter_type}.'''
        result = self._values.get("account_filter_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def accounts(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts CloudformationStackInstances#accounts}.'''
        result = self._values.get("accounts")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def accounts_url(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts_url CloudformationStackInstances#accounts_url}.'''
        result = self._values.get("accounts_url")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def organizational_unit_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#organizational_unit_ids CloudformationStackInstances#organizational_unit_ids}.'''
        result = self._values.get("organizational_unit_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudformationStackInstancesDeploymentTargets(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CloudformationStackInstancesDeploymentTargetsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstancesDeploymentTargetsOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6acb6a032a37e52f8604e515d52dbf73df97b414b540f1eb131389b6aea15ef)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAccountFilterType")
    def reset_account_filter_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccountFilterType", []))

    @jsii.member(jsii_name="resetAccounts")
    def reset_accounts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccounts", []))

    @jsii.member(jsii_name="resetAccountsUrl")
    def reset_accounts_url(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccountsUrl", []))

    @jsii.member(jsii_name="resetOrganizationalUnitIds")
    def reset_organizational_unit_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOrganizationalUnitIds", []))

    @builtins.property
    @jsii.member(jsii_name="accountFilterTypeInput")
    def account_filter_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "accountFilterTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="accountsInput")
    def accounts_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "accountsInput"))

    @builtins.property
    @jsii.member(jsii_name="accountsUrlInput")
    def accounts_url_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "accountsUrlInput"))

    @builtins.property
    @jsii.member(jsii_name="organizationalUnitIdsInput")
    def organizational_unit_ids_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "organizationalUnitIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="accountFilterType")
    def account_filter_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accountFilterType"))

    @account_filter_type.setter
    def account_filter_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__add4ca6c1db7ce6227e768efaf1430bef280d66a8fec4c2210253015f4a847f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accountFilterType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="accounts")
    def accounts(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "accounts"))

    @accounts.setter
    def accounts(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b57d26b18aab55425cf62b0ab7278ef1a225be403cacdef7dce3c03e11afd93)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accounts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="accountsUrl")
    def accounts_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accountsUrl"))

    @accounts_url.setter
    def accounts_url(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__900a1a22408443b169e1b90e09ce81c558116821b9700083b76d56a7d6488c17)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accountsUrl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="organizationalUnitIds")
    def organizational_unit_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "organizationalUnitIds"))

    @organizational_unit_ids.setter
    def organizational_unit_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c46da0d6806f5b4b7529dc0cfb04660f7fadd5742091b9d9a609b7e36ae8b842)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "organizationalUnitIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CloudformationStackInstancesDeploymentTargets]:
        return typing.cast(typing.Optional[CloudformationStackInstancesDeploymentTargets], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CloudformationStackInstancesDeploymentTargets],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6385b95bfb706400b9d9e824bf3a934470b936cc469141b783c1ff7e5cf81847)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstancesOperationPreferences",
    jsii_struct_bases=[],
    name_mapping={
        "concurrency_mode": "concurrencyMode",
        "failure_tolerance_count": "failureToleranceCount",
        "failure_tolerance_percentage": "failureTolerancePercentage",
        "max_concurrent_count": "maxConcurrentCount",
        "max_concurrent_percentage": "maxConcurrentPercentage",
        "region_concurrency_type": "regionConcurrencyType",
        "region_order": "regionOrder",
    },
)
class CloudformationStackInstancesOperationPreferences:
    def __init__(
        self,
        *,
        concurrency_mode: typing.Optional[builtins.str] = None,
        failure_tolerance_count: typing.Optional[jsii.Number] = None,
        failure_tolerance_percentage: typing.Optional[jsii.Number] = None,
        max_concurrent_count: typing.Optional[jsii.Number] = None,
        max_concurrent_percentage: typing.Optional[jsii.Number] = None,
        region_concurrency_type: typing.Optional[builtins.str] = None,
        region_order: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param concurrency_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#concurrency_mode CloudformationStackInstances#concurrency_mode}.
        :param failure_tolerance_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#failure_tolerance_count CloudformationStackInstances#failure_tolerance_count}.
        :param failure_tolerance_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#failure_tolerance_percentage CloudformationStackInstances#failure_tolerance_percentage}.
        :param max_concurrent_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#max_concurrent_count CloudformationStackInstances#max_concurrent_count}.
        :param max_concurrent_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#max_concurrent_percentage CloudformationStackInstances#max_concurrent_percentage}.
        :param region_concurrency_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#region_concurrency_type CloudformationStackInstances#region_concurrency_type}.
        :param region_order: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#region_order CloudformationStackInstances#region_order}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8cdea554577a53f328cf08e43911f617ee3e0f6c6b1db3951b36e9af59839a3f)
            check_type(argname="argument concurrency_mode", value=concurrency_mode, expected_type=type_hints["concurrency_mode"])
            check_type(argname="argument failure_tolerance_count", value=failure_tolerance_count, expected_type=type_hints["failure_tolerance_count"])
            check_type(argname="argument failure_tolerance_percentage", value=failure_tolerance_percentage, expected_type=type_hints["failure_tolerance_percentage"])
            check_type(argname="argument max_concurrent_count", value=max_concurrent_count, expected_type=type_hints["max_concurrent_count"])
            check_type(argname="argument max_concurrent_percentage", value=max_concurrent_percentage, expected_type=type_hints["max_concurrent_percentage"])
            check_type(argname="argument region_concurrency_type", value=region_concurrency_type, expected_type=type_hints["region_concurrency_type"])
            check_type(argname="argument region_order", value=region_order, expected_type=type_hints["region_order"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if concurrency_mode is not None:
            self._values["concurrency_mode"] = concurrency_mode
        if failure_tolerance_count is not None:
            self._values["failure_tolerance_count"] = failure_tolerance_count
        if failure_tolerance_percentage is not None:
            self._values["failure_tolerance_percentage"] = failure_tolerance_percentage
        if max_concurrent_count is not None:
            self._values["max_concurrent_count"] = max_concurrent_count
        if max_concurrent_percentage is not None:
            self._values["max_concurrent_percentage"] = max_concurrent_percentage
        if region_concurrency_type is not None:
            self._values["region_concurrency_type"] = region_concurrency_type
        if region_order is not None:
            self._values["region_order"] = region_order

    @builtins.property
    def concurrency_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#concurrency_mode CloudformationStackInstances#concurrency_mode}.'''
        result = self._values.get("concurrency_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def failure_tolerance_count(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#failure_tolerance_count CloudformationStackInstances#failure_tolerance_count}.'''
        result = self._values.get("failure_tolerance_count")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def failure_tolerance_percentage(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#failure_tolerance_percentage CloudformationStackInstances#failure_tolerance_percentage}.'''
        result = self._values.get("failure_tolerance_percentage")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def max_concurrent_count(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#max_concurrent_count CloudformationStackInstances#max_concurrent_count}.'''
        result = self._values.get("max_concurrent_count")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def max_concurrent_percentage(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#max_concurrent_percentage CloudformationStackInstances#max_concurrent_percentage}.'''
        result = self._values.get("max_concurrent_percentage")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def region_concurrency_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#region_concurrency_type CloudformationStackInstances#region_concurrency_type}.'''
        result = self._values.get("region_concurrency_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def region_order(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#region_order CloudformationStackInstances#region_order}.'''
        result = self._values.get("region_order")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudformationStackInstancesOperationPreferences(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CloudformationStackInstancesOperationPreferencesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstancesOperationPreferencesOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e937ad04ba0f66c48a9d614fedb1b2f53e0312555d99a4f971cee3df8ea9dc78)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetConcurrencyMode")
    def reset_concurrency_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConcurrencyMode", []))

    @jsii.member(jsii_name="resetFailureToleranceCount")
    def reset_failure_tolerance_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFailureToleranceCount", []))

    @jsii.member(jsii_name="resetFailureTolerancePercentage")
    def reset_failure_tolerance_percentage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFailureTolerancePercentage", []))

    @jsii.member(jsii_name="resetMaxConcurrentCount")
    def reset_max_concurrent_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxConcurrentCount", []))

    @jsii.member(jsii_name="resetMaxConcurrentPercentage")
    def reset_max_concurrent_percentage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxConcurrentPercentage", []))

    @jsii.member(jsii_name="resetRegionConcurrencyType")
    def reset_region_concurrency_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegionConcurrencyType", []))

    @jsii.member(jsii_name="resetRegionOrder")
    def reset_region_order(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegionOrder", []))

    @builtins.property
    @jsii.member(jsii_name="concurrencyModeInput")
    def concurrency_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "concurrencyModeInput"))

    @builtins.property
    @jsii.member(jsii_name="failureToleranceCountInput")
    def failure_tolerance_count_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "failureToleranceCountInput"))

    @builtins.property
    @jsii.member(jsii_name="failureTolerancePercentageInput")
    def failure_tolerance_percentage_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "failureTolerancePercentageInput"))

    @builtins.property
    @jsii.member(jsii_name="maxConcurrentCountInput")
    def max_concurrent_count_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxConcurrentCountInput"))

    @builtins.property
    @jsii.member(jsii_name="maxConcurrentPercentageInput")
    def max_concurrent_percentage_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxConcurrentPercentageInput"))

    @builtins.property
    @jsii.member(jsii_name="regionConcurrencyTypeInput")
    def region_concurrency_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regionConcurrencyTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="regionOrderInput")
    def region_order_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "regionOrderInput"))

    @builtins.property
    @jsii.member(jsii_name="concurrencyMode")
    def concurrency_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "concurrencyMode"))

    @concurrency_mode.setter
    def concurrency_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5f1ff5fa1e7d8cd99235f4b3e50dfb03cd6adb97c238732adf009cffd06626e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "concurrencyMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="failureToleranceCount")
    def failure_tolerance_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "failureToleranceCount"))

    @failure_tolerance_count.setter
    def failure_tolerance_count(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a2325e2115ac7e1b6c775c25cf5490a1e9efcdd6732104630cedbc6605c8849d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "failureToleranceCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="failureTolerancePercentage")
    def failure_tolerance_percentage(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "failureTolerancePercentage"))

    @failure_tolerance_percentage.setter
    def failure_tolerance_percentage(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b2ff1e2e12329d404f96216e0060ce34b096675cad34891cc18826649b4e094)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "failureTolerancePercentage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxConcurrentCount")
    def max_concurrent_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxConcurrentCount"))

    @max_concurrent_count.setter
    def max_concurrent_count(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd7f8366dff244fcf2a3fa34c17f2f9389f84be0e09696e47d01c2ce25111143)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxConcurrentCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxConcurrentPercentage")
    def max_concurrent_percentage(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxConcurrentPercentage"))

    @max_concurrent_percentage.setter
    def max_concurrent_percentage(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e4ef922232d0ff51851e6341f420c1e1b32b5320eaa77c7ee95ae01a1e19cc98)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxConcurrentPercentage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="regionConcurrencyType")
    def region_concurrency_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "regionConcurrencyType"))

    @region_concurrency_type.setter
    def region_concurrency_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56eeca66070d11e06b0c6e04e530f457ad7e3e7afb07f5a699e7c1eaf6326009)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "regionConcurrencyType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="regionOrder")
    def region_order(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "regionOrder"))

    @region_order.setter
    def region_order(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61f5c7d771f3ae36064cf8ad32f54a8980d0ad57fd5037db99b5498e5c434b3a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "regionOrder", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CloudformationStackInstancesOperationPreferences]:
        return typing.cast(typing.Optional[CloudformationStackInstancesOperationPreferences], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CloudformationStackInstancesOperationPreferences],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b2bc7cd4a2eb8baf02f246cd0e965a42e4ca716ac2d78dad47c7fa98176fc7c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstancesStackInstanceSummaries",
    jsii_struct_bases=[],
    name_mapping={},
)
class CloudformationStackInstancesStackInstanceSummaries:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudformationStackInstancesStackInstanceSummaries(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CloudformationStackInstancesStackInstanceSummariesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstancesStackInstanceSummariesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__92f34e5e29b71a78c70e071fdb42b25d624ab6ed0395ade4b42c9fb2d294ab46)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CloudformationStackInstancesStackInstanceSummariesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__246793a5db9035b6cb24204bb8b08cda54b45ab9ca704a7afed7a8d61e644e45)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CloudformationStackInstancesStackInstanceSummariesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46a6087ddfa63dcc0ca280c512b29ecfb3b050a8840930ff6c9d5a9417e46b9e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3e77656c05ecaa2d0cb03a46e27e8d352e1ac51cc089c0e8ca2ce12b7fa735aa)
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
            type_hints = typing.get_type_hints(_typecheckingstub__16f15a7661e7e2c9c62aa751ed2f67b349cf722539af676f9cde561ac2ac5b5a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class CloudformationStackInstancesStackInstanceSummariesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstancesStackInstanceSummariesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7350d4f43301672c25fbca2023c4943c768fe2675b1df4834907e3173f01f98f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="accountId")
    def account_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accountId"))

    @builtins.property
    @jsii.member(jsii_name="detailedStatus")
    def detailed_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "detailedStatus"))

    @builtins.property
    @jsii.member(jsii_name="driftStatus")
    def drift_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "driftStatus"))

    @builtins.property
    @jsii.member(jsii_name="organizationalUnitId")
    def organizational_unit_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "organizationalUnitId"))

    @builtins.property
    @jsii.member(jsii_name="region")
    def region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "region"))

    @builtins.property
    @jsii.member(jsii_name="stackId")
    def stack_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "stackId"))

    @builtins.property
    @jsii.member(jsii_name="stackSetId")
    def stack_set_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "stackSetId"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @builtins.property
    @jsii.member(jsii_name="statusReason")
    def status_reason(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "statusReason"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CloudformationStackInstancesStackInstanceSummaries]:
        return typing.cast(typing.Optional[CloudformationStackInstancesStackInstanceSummaries], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CloudformationStackInstancesStackInstanceSummaries],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9d7f7344b07ea5c836d2f1e81a6c8dfa50d4ebb40ab9dabf4f8ab10388fa713)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstancesTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class CloudformationStackInstancesTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#create CloudformationStackInstances#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#delete CloudformationStackInstances#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#update CloudformationStackInstances#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__640eb05813fdce1e574b74efd1f8d22eb50e6728cd2daa8ae5d1813f30e38bf5)
            check_type(argname="argument create", value=create, expected_type=type_hints["create"])
            check_type(argname="argument delete", value=delete, expected_type=type_hints["delete"])
            check_type(argname="argument update", value=update, expected_type=type_hints["update"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if create is not None:
            self._values["create"] = create
        if delete is not None:
            self._values["delete"] = delete
        if update is not None:
            self._values["update"] = update

    @builtins.property
    def create(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#create CloudformationStackInstances#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#delete CloudformationStackInstances#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#update CloudformationStackInstances#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudformationStackInstancesTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CloudformationStackInstancesTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudformationStackInstances.CloudformationStackInstancesTimeoutsOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e079db55fed31df5c590048a930fdd2ea9bfea266785f6aa515f7ab682ace73)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCreate")
    def reset_create(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCreate", []))

    @jsii.member(jsii_name="resetDelete")
    def reset_delete(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDelete", []))

    @jsii.member(jsii_name="resetUpdate")
    def reset_update(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUpdate", []))

    @builtins.property
    @jsii.member(jsii_name="createInput")
    def create_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "createInput"))

    @builtins.property
    @jsii.member(jsii_name="deleteInput")
    def delete_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deleteInput"))

    @builtins.property
    @jsii.member(jsii_name="updateInput")
    def update_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "updateInput"))

    @builtins.property
    @jsii.member(jsii_name="create")
    def create(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "create"))

    @create.setter
    def create(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__82c79b8045ea30cdf2bbdd1634db3934474c581ce34ba666f76f2306dbe12154)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2b9539baab49d307f97b793fd5e194bd1b7084a5cebbf740938a15790e773b3a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01a0c3857d1fb6e38455492b2eae851ba81cdf449524286747f10f75fa1e68d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CloudformationStackInstancesTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CloudformationStackInstancesTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CloudformationStackInstancesTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc50e1f2c6159f404013d03b374018cc0a8caacae6f640b52475f692fb634b50)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "CloudformationStackInstances",
    "CloudformationStackInstancesConfig",
    "CloudformationStackInstancesDeploymentTargets",
    "CloudformationStackInstancesDeploymentTargetsOutputReference",
    "CloudformationStackInstancesOperationPreferences",
    "CloudformationStackInstancesOperationPreferencesOutputReference",
    "CloudformationStackInstancesStackInstanceSummaries",
    "CloudformationStackInstancesStackInstanceSummariesList",
    "CloudformationStackInstancesStackInstanceSummariesOutputReference",
    "CloudformationStackInstancesTimeouts",
    "CloudformationStackInstancesTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__592167ba48dad79084a826eb01ff1dd51152dffb083d75584940c3bccd731c5f(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    stack_set_name: builtins.str,
    accounts: typing.Optional[typing.Sequence[builtins.str]] = None,
    call_as: typing.Optional[builtins.str] = None,
    deployment_targets: typing.Optional[typing.Union[CloudformationStackInstancesDeploymentTargets, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    operation_preferences: typing.Optional[typing.Union[CloudformationStackInstancesOperationPreferences, typing.Dict[builtins.str, typing.Any]]] = None,
    parameter_overrides: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    regions: typing.Optional[typing.Sequence[builtins.str]] = None,
    retain_stacks: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    timeouts: typing.Optional[typing.Union[CloudformationStackInstancesTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__34b85b275b1d2ad25d91fe852ade7758961b74d1b4b0aa2b5d7e0c1e29b1a3fa(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4ef8cfa8a3d03c0ddb234f5bf767915589baf7b7ea37febb0a70cc89ab59b7e(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3298cd2d595bf44ecd6a1a3f864b5323c62d6ace7d11628231a9e9f3bf00cbbf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5502268cb2b9fb599ee07d39c555ba84c544822a0591040d20408514304f5862(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4f7cf840dc1caee8f24484cb0fc48f122a3e7c7adbb824947c440e200197878(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98c24820360f9f3a42847cc3504064a492e99ec6ad0a17d95e8a020680337582(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c948bac341d4aa3ed905927e35807e285274ff7fb70eab2c1e80942e34fb727(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4c5f05281073735268451b19c9a241ecfd9c6637b6f16a507c64977ccda8ec2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99960488ba7bccaf455d97b11495454eb3d799b8fad840546d555075148e15b0(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    stack_set_name: builtins.str,
    accounts: typing.Optional[typing.Sequence[builtins.str]] = None,
    call_as: typing.Optional[builtins.str] = None,
    deployment_targets: typing.Optional[typing.Union[CloudformationStackInstancesDeploymentTargets, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    operation_preferences: typing.Optional[typing.Union[CloudformationStackInstancesOperationPreferences, typing.Dict[builtins.str, typing.Any]]] = None,
    parameter_overrides: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    regions: typing.Optional[typing.Sequence[builtins.str]] = None,
    retain_stacks: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    timeouts: typing.Optional[typing.Union[CloudformationStackInstancesTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82c95941fb574b5e3779a3fe57a87a669e820abd3b02fbd42e9de0897770675b(
    *,
    account_filter_type: typing.Optional[builtins.str] = None,
    accounts: typing.Optional[typing.Sequence[builtins.str]] = None,
    accounts_url: typing.Optional[builtins.str] = None,
    organizational_unit_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6acb6a032a37e52f8604e515d52dbf73df97b414b540f1eb131389b6aea15ef(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__add4ca6c1db7ce6227e768efaf1430bef280d66a8fec4c2210253015f4a847f1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b57d26b18aab55425cf62b0ab7278ef1a225be403cacdef7dce3c03e11afd93(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__900a1a22408443b169e1b90e09ce81c558116821b9700083b76d56a7d6488c17(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c46da0d6806f5b4b7529dc0cfb04660f7fadd5742091b9d9a609b7e36ae8b842(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6385b95bfb706400b9d9e824bf3a934470b936cc469141b783c1ff7e5cf81847(
    value: typing.Optional[CloudformationStackInstancesDeploymentTargets],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8cdea554577a53f328cf08e43911f617ee3e0f6c6b1db3951b36e9af59839a3f(
    *,
    concurrency_mode: typing.Optional[builtins.str] = None,
    failure_tolerance_count: typing.Optional[jsii.Number] = None,
    failure_tolerance_percentage: typing.Optional[jsii.Number] = None,
    max_concurrent_count: typing.Optional[jsii.Number] = None,
    max_concurrent_percentage: typing.Optional[jsii.Number] = None,
    region_concurrency_type: typing.Optional[builtins.str] = None,
    region_order: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e937ad04ba0f66c48a9d614fedb1b2f53e0312555d99a4f971cee3df8ea9dc78(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f1ff5fa1e7d8cd99235f4b3e50dfb03cd6adb97c238732adf009cffd06626e8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2325e2115ac7e1b6c775c25cf5490a1e9efcdd6732104630cedbc6605c8849d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b2ff1e2e12329d404f96216e0060ce34b096675cad34891cc18826649b4e094(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd7f8366dff244fcf2a3fa34c17f2f9389f84be0e09696e47d01c2ce25111143(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4ef922232d0ff51851e6341f420c1e1b32b5320eaa77c7ee95ae01a1e19cc98(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56eeca66070d11e06b0c6e04e530f457ad7e3e7afb07f5a699e7c1eaf6326009(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61f5c7d771f3ae36064cf8ad32f54a8980d0ad57fd5037db99b5498e5c434b3a(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b2bc7cd4a2eb8baf02f246cd0e965a42e4ca716ac2d78dad47c7fa98176fc7c(
    value: typing.Optional[CloudformationStackInstancesOperationPreferences],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92f34e5e29b71a78c70e071fdb42b25d624ab6ed0395ade4b42c9fb2d294ab46(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__246793a5db9035b6cb24204bb8b08cda54b45ab9ca704a7afed7a8d61e644e45(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46a6087ddfa63dcc0ca280c512b29ecfb3b050a8840930ff6c9d5a9417e46b9e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e77656c05ecaa2d0cb03a46e27e8d352e1ac51cc089c0e8ca2ce12b7fa735aa(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__16f15a7661e7e2c9c62aa751ed2f67b349cf722539af676f9cde561ac2ac5b5a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7350d4f43301672c25fbca2023c4943c768fe2675b1df4834907e3173f01f98f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9d7f7344b07ea5c836d2f1e81a6c8dfa50d4ebb40ab9dabf4f8ab10388fa713(
    value: typing.Optional[CloudformationStackInstancesStackInstanceSummaries],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__640eb05813fdce1e574b74efd1f8d22eb50e6728cd2daa8ae5d1813f30e38bf5(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e079db55fed31df5c590048a930fdd2ea9bfea266785f6aa515f7ab682ace73(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82c79b8045ea30cdf2bbdd1634db3934474c581ce34ba666f76f2306dbe12154(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b9539baab49d307f97b793fd5e194bd1b7084a5cebbf740938a15790e773b3a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01a0c3857d1fb6e38455492b2eae851ba81cdf449524286747f10f75fa1e68d3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc50e1f2c6159f404013d03b374018cc0a8caacae6f640b52475f692fb634b50(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CloudformationStackInstancesTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
