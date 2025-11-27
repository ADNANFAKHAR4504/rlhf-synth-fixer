r'''
# `aws_fis_experiment_template`

Refer to the Terraform Registry for docs: [`aws_fis_experiment_template`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template).
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


class FisExperimentTemplate(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplate",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template aws_fis_experiment_template}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        action: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateAction", typing.Dict[builtins.str, typing.Any]]]],
        description: builtins.str,
        role_arn: builtins.str,
        stop_condition: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateStopCondition", typing.Dict[builtins.str, typing.Any]]]],
        experiment_options: typing.Optional[typing.Union["FisExperimentTemplateExperimentOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        experiment_report_configuration: typing.Optional[typing.Union["FisExperimentTemplateExperimentReportConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        log_configuration: typing.Optional[typing.Union["FisExperimentTemplateLogConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateTarget", typing.Dict[builtins.str, typing.Any]]]]] = None,
        timeouts: typing.Optional[typing.Union["FisExperimentTemplateTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template aws_fis_experiment_template} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#action FisExperimentTemplate#action}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#description FisExperimentTemplate#description}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#role_arn FisExperimentTemplate#role_arn}.
        :param stop_condition: stop_condition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#stop_condition FisExperimentTemplate#stop_condition}
        :param experiment_options: experiment_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#experiment_options FisExperimentTemplate#experiment_options}
        :param experiment_report_configuration: experiment_report_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#experiment_report_configuration FisExperimentTemplate#experiment_report_configuration}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#id FisExperimentTemplate#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param log_configuration: log_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_configuration FisExperimentTemplate#log_configuration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#tags FisExperimentTemplate#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#tags_all FisExperimentTemplate#tags_all}.
        :param target: target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#target FisExperimentTemplate#target}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#timeouts FisExperimentTemplate#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__39286511a203deaafd715746af9e14e097aa4ffd03b74a716c9ab0cb755c5f6b)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = FisExperimentTemplateConfig(
            action=action,
            description=description,
            role_arn=role_arn,
            stop_condition=stop_condition,
            experiment_options=experiment_options,
            experiment_report_configuration=experiment_report_configuration,
            id=id,
            log_configuration=log_configuration,
            tags=tags,
            tags_all=tags_all,
            target=target,
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
        '''Generates CDKTF code for importing a FisExperimentTemplate resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the FisExperimentTemplate to import.
        :param import_from_id: The id of the existing FisExperimentTemplate that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the FisExperimentTemplate to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81fb365180db4c85ead72f60a406da8c792a399b4acad07e9d847041932e26b3)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAction")
    def put_action(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateAction", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53e415555d95b5ac8f8d1ec8d428294cf666f965d823f28555289d0109edc9e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAction", [value]))

    @jsii.member(jsii_name="putExperimentOptions")
    def put_experiment_options(
        self,
        *,
        account_targeting: typing.Optional[builtins.str] = None,
        empty_target_resolution_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param account_targeting: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#account_targeting FisExperimentTemplate#account_targeting}.
        :param empty_target_resolution_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#empty_target_resolution_mode FisExperimentTemplate#empty_target_resolution_mode}.
        '''
        value = FisExperimentTemplateExperimentOptions(
            account_targeting=account_targeting,
            empty_target_resolution_mode=empty_target_resolution_mode,
        )

        return typing.cast(None, jsii.invoke(self, "putExperimentOptions", [value]))

    @jsii.member(jsii_name="putExperimentReportConfiguration")
    def put_experiment_report_configuration(
        self,
        *,
        data_sources: typing.Optional[typing.Union["FisExperimentTemplateExperimentReportConfigurationDataSources", typing.Dict[builtins.str, typing.Any]]] = None,
        outputs: typing.Optional[typing.Union["FisExperimentTemplateExperimentReportConfigurationOutputs", typing.Dict[builtins.str, typing.Any]]] = None,
        post_experiment_duration: typing.Optional[builtins.str] = None,
        pre_experiment_duration: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param data_sources: data_sources block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#data_sources FisExperimentTemplate#data_sources}
        :param outputs: outputs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#outputs FisExperimentTemplate#outputs}
        :param post_experiment_duration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#post_experiment_duration FisExperimentTemplate#post_experiment_duration}.
        :param pre_experiment_duration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#pre_experiment_duration FisExperimentTemplate#pre_experiment_duration}.
        '''
        value = FisExperimentTemplateExperimentReportConfiguration(
            data_sources=data_sources,
            outputs=outputs,
            post_experiment_duration=post_experiment_duration,
            pre_experiment_duration=pre_experiment_duration,
        )

        return typing.cast(None, jsii.invoke(self, "putExperimentReportConfiguration", [value]))

    @jsii.member(jsii_name="putLogConfiguration")
    def put_log_configuration(
        self,
        *,
        log_schema_version: jsii.Number,
        cloudwatch_logs_configuration: typing.Optional[typing.Union["FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        s3_configuration: typing.Optional[typing.Union["FisExperimentTemplateLogConfigurationS3Configuration", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param log_schema_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_schema_version FisExperimentTemplate#log_schema_version}.
        :param cloudwatch_logs_configuration: cloudwatch_logs_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_logs_configuration FisExperimentTemplate#cloudwatch_logs_configuration}
        :param s3_configuration: s3_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#s3_configuration FisExperimentTemplate#s3_configuration}
        '''
        value = FisExperimentTemplateLogConfiguration(
            log_schema_version=log_schema_version,
            cloudwatch_logs_configuration=cloudwatch_logs_configuration,
            s3_configuration=s3_configuration,
        )

        return typing.cast(None, jsii.invoke(self, "putLogConfiguration", [value]))

    @jsii.member(jsii_name="putStopCondition")
    def put_stop_condition(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateStopCondition", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3444f26bf462cb441dfb5e174b595ec1e5e41a60f3c9b8d79879d030c69cdc76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putStopCondition", [value]))

    @jsii.member(jsii_name="putTarget")
    def put_target(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateTarget", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09f3e3f1f38ed451f8ca49a2626af5aae7f1998b48343eaf2e53fa596e0bc495)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTarget", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#create FisExperimentTemplate#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#delete FisExperimentTemplate#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#update FisExperimentTemplate#update}.
        '''
        value = FisExperimentTemplateTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetExperimentOptions")
    def reset_experiment_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExperimentOptions", []))

    @jsii.member(jsii_name="resetExperimentReportConfiguration")
    def reset_experiment_report_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExperimentReportConfiguration", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetLogConfiguration")
    def reset_log_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLogConfiguration", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTarget")
    def reset_target(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTarget", []))

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
    @jsii.member(jsii_name="action")
    def action(self) -> "FisExperimentTemplateActionList":
        return typing.cast("FisExperimentTemplateActionList", jsii.get(self, "action"))

    @builtins.property
    @jsii.member(jsii_name="experimentOptions")
    def experiment_options(
        self,
    ) -> "FisExperimentTemplateExperimentOptionsOutputReference":
        return typing.cast("FisExperimentTemplateExperimentOptionsOutputReference", jsii.get(self, "experimentOptions"))

    @builtins.property
    @jsii.member(jsii_name="experimentReportConfiguration")
    def experiment_report_configuration(
        self,
    ) -> "FisExperimentTemplateExperimentReportConfigurationOutputReference":
        return typing.cast("FisExperimentTemplateExperimentReportConfigurationOutputReference", jsii.get(self, "experimentReportConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="logConfiguration")
    def log_configuration(
        self,
    ) -> "FisExperimentTemplateLogConfigurationOutputReference":
        return typing.cast("FisExperimentTemplateLogConfigurationOutputReference", jsii.get(self, "logConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="stopCondition")
    def stop_condition(self) -> "FisExperimentTemplateStopConditionList":
        return typing.cast("FisExperimentTemplateStopConditionList", jsii.get(self, "stopCondition"))

    @builtins.property
    @jsii.member(jsii_name="target")
    def target(self) -> "FisExperimentTemplateTargetList":
        return typing.cast("FisExperimentTemplateTargetList", jsii.get(self, "target"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "FisExperimentTemplateTimeoutsOutputReference":
        return typing.cast("FisExperimentTemplateTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateAction"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateAction"]]], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="experimentOptionsInput")
    def experiment_options_input(
        self,
    ) -> typing.Optional["FisExperimentTemplateExperimentOptions"]:
        return typing.cast(typing.Optional["FisExperimentTemplateExperimentOptions"], jsii.get(self, "experimentOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="experimentReportConfigurationInput")
    def experiment_report_configuration_input(
        self,
    ) -> typing.Optional["FisExperimentTemplateExperimentReportConfiguration"]:
        return typing.cast(typing.Optional["FisExperimentTemplateExperimentReportConfiguration"], jsii.get(self, "experimentReportConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="logConfigurationInput")
    def log_configuration_input(
        self,
    ) -> typing.Optional["FisExperimentTemplateLogConfiguration"]:
        return typing.cast(typing.Optional["FisExperimentTemplateLogConfiguration"], jsii.get(self, "logConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="stopConditionInput")
    def stop_condition_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateStopCondition"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateStopCondition"]]], jsii.get(self, "stopConditionInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsAllInput")
    def tags_all_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsAllInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="targetInput")
    def target_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateTarget"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateTarget"]]], jsii.get(self, "targetInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "FisExperimentTemplateTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "FisExperimentTemplateTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4def8d561dc295a06e79207eb74824a959f84a3965604e9c27fa53af61ea78b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6dbb14d1fdae6c5d393cdcbf2df287a5766891661246adc19df585485fbd7ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a14181fd67724f88a43bd8f9a9ded18601c328ff54a7ce6da4b69b38fb5e63ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7ee0e6266b2339c25d19255f8cf534fb76b138485055da8c525c16ec7efea54a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c3f523affcd34435e869e0025e3482b898f82bb07c2954f1bcf9b509282dd10)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateAction",
    jsii_struct_bases=[],
    name_mapping={
        "action_id": "actionId",
        "name": "name",
        "description": "description",
        "parameter": "parameter",
        "start_after": "startAfter",
        "target": "target",
    },
)
class FisExperimentTemplateAction:
    def __init__(
        self,
        *,
        action_id: builtins.str,
        name: builtins.str,
        description: typing.Optional[builtins.str] = None,
        parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateActionParameter", typing.Dict[builtins.str, typing.Any]]]]] = None,
        start_after: typing.Optional[typing.Sequence[builtins.str]] = None,
        target: typing.Optional[typing.Union["FisExperimentTemplateActionTarget", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param action_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#action_id FisExperimentTemplate#action_id}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#name FisExperimentTemplate#name}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#description FisExperimentTemplate#description}.
        :param parameter: parameter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#parameter FisExperimentTemplate#parameter}
        :param start_after: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#start_after FisExperimentTemplate#start_after}.
        :param target: target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#target FisExperimentTemplate#target}
        '''
        if isinstance(target, dict):
            target = FisExperimentTemplateActionTarget(**target)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2724f0fe0f23690b705dc47a9ceb4af641d922ff3c5a0ca4f44ec8f56c4a463)
            check_type(argname="argument action_id", value=action_id, expected_type=type_hints["action_id"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument parameter", value=parameter, expected_type=type_hints["parameter"])
            check_type(argname="argument start_after", value=start_after, expected_type=type_hints["start_after"])
            check_type(argname="argument target", value=target, expected_type=type_hints["target"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action_id": action_id,
            "name": name,
        }
        if description is not None:
            self._values["description"] = description
        if parameter is not None:
            self._values["parameter"] = parameter
        if start_after is not None:
            self._values["start_after"] = start_after
        if target is not None:
            self._values["target"] = target

    @builtins.property
    def action_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#action_id FisExperimentTemplate#action_id}.'''
        result = self._values.get("action_id")
        assert result is not None, "Required property 'action_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#name FisExperimentTemplate#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#description FisExperimentTemplate#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def parameter(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateActionParameter"]]]:
        '''parameter block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#parameter FisExperimentTemplate#parameter}
        '''
        result = self._values.get("parameter")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateActionParameter"]]], result)

    @builtins.property
    def start_after(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#start_after FisExperimentTemplate#start_after}.'''
        result = self._values.get("start_after")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def target(self) -> typing.Optional["FisExperimentTemplateActionTarget"]:
        '''target block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#target FisExperimentTemplate#target}
        '''
        result = self._values.get("target")
        return typing.cast(typing.Optional["FisExperimentTemplateActionTarget"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateActionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateActionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b8afbc12b66e3da78f037dfc7791a3311b1b62d446ef4ca5f375abe10f0c2af0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "FisExperimentTemplateActionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01c4f3c0dfb06b97e1bdef3dec5cb3380287e02fd1ab3082b438fb50a737e921)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FisExperimentTemplateActionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ccfe7cc365361e52509dafa17f99256449c003a1fd876c28e5e424bd6c9d6b8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5b592e2e8bcf192b6ff55883ebcafc3fbb8a4f2e86bc30efab209abbcfc3347e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__16736f1821c736a74cc8a073c9b877f4e36f38a090a54f62178d856d503a75d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateAction]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateAction]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateAction]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e7e64ce9498671e111933d4bea78a025ffd4c3fbf2541982d229f74a879efe19)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1b2338f9a5b111ac9ba5c201ebf082cf5959c4b4d805c60ae34436f485337bc3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putParameter")
    def put_parameter(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateActionParameter", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e84ed80de613cc3a0a15facb1b15d064e97ee20d32d6fae093cb017406ff1f63)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putParameter", [value]))

    @jsii.member(jsii_name="putTarget")
    def put_target(self, *, key: builtins.str, value: builtins.str) -> None:
        '''
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#key FisExperimentTemplate#key}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.
        '''
        value_ = FisExperimentTemplateActionTarget(key=key, value=value)

        return typing.cast(None, jsii.invoke(self, "putTarget", [value_]))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetParameter")
    def reset_parameter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParameter", []))

    @jsii.member(jsii_name="resetStartAfter")
    def reset_start_after(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartAfter", []))

    @jsii.member(jsii_name="resetTarget")
    def reset_target(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTarget", []))

    @builtins.property
    @jsii.member(jsii_name="parameter")
    def parameter(self) -> "FisExperimentTemplateActionParameterList":
        return typing.cast("FisExperimentTemplateActionParameterList", jsii.get(self, "parameter"))

    @builtins.property
    @jsii.member(jsii_name="target")
    def target(self) -> "FisExperimentTemplateActionTargetOutputReference":
        return typing.cast("FisExperimentTemplateActionTargetOutputReference", jsii.get(self, "target"))

    @builtins.property
    @jsii.member(jsii_name="actionIdInput")
    def action_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "actionIdInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="parameterInput")
    def parameter_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateActionParameter"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateActionParameter"]]], jsii.get(self, "parameterInput"))

    @builtins.property
    @jsii.member(jsii_name="startAfterInput")
    def start_after_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "startAfterInput"))

    @builtins.property
    @jsii.member(jsii_name="targetInput")
    def target_input(self) -> typing.Optional["FisExperimentTemplateActionTarget"]:
        return typing.cast(typing.Optional["FisExperimentTemplateActionTarget"], jsii.get(self, "targetInput"))

    @builtins.property
    @jsii.member(jsii_name="actionId")
    def action_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "actionId"))

    @action_id.setter
    def action_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99f04028310973ff79a6dd9062cbb25e094dc2c6732fd67463e96d61fb30fbd5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "actionId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f60d5c35f86298fd8ab7d4dba288170278c5d485eb05afd1acceb36273f06a23)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c69b756452b7e50feab4e5f98a404ac70ac1fa37325c8965c56cd6d7a987ecda)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startAfter")
    def start_after(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "startAfter"))

    @start_after.setter
    def start_after(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5baf2f3793f213cb583e60d0c1382255794a8501f75e4742a7b6999ba1e2494f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startAfter", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateAction]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateAction]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateAction]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f281ceba921aa06d1ad9bc6ef598b19878d7587bb08dd21bbeebc12c11c5d49a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateActionParameter",
    jsii_struct_bases=[],
    name_mapping={"key": "key", "value": "value"},
)
class FisExperimentTemplateActionParameter:
    def __init__(self, *, key: builtins.str, value: builtins.str) -> None:
        '''
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#key FisExperimentTemplate#key}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79b0a178942f859fe27728c313f9c16e92d68a0312a0b2298e008e2f0e055287)
            check_type(argname="argument key", value=key, expected_type=type_hints["key"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "key": key,
            "value": value,
        }

    @builtins.property
    def key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#key FisExperimentTemplate#key}.'''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateActionParameter(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateActionParameterList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateActionParameterList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7a9ae9b8d8c42475b232a3dc98d958fcf75e969ede91aedc230f19fe1ce752ae)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "FisExperimentTemplateActionParameterOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c352ddcf6c9d02f828085eed89331e0df91bd2adbe6e9524c394c74dad851c2)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FisExperimentTemplateActionParameterOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37eec8e2a63eb053338744b7c050b9b0cd376b15d9837f3d7501016975724237)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a7f6f5515ba0ed051ea019d7ce9aa26753b90fc80395e85e57dc1749b339a83c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a1b03afe31e14f7ff283234e98a7d8b9566fb39e0700aa8d4934f2a37c762ccb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateActionParameter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateActionParameter]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateActionParameter]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4962ae9fec768f6384c91a924a989bdd4d6f7b294a75fbc7228e6bf0b050b8d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateActionParameterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateActionParameterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3a9c10e8e604abc66138ef5f59c91009f5ccce99f79f44cdd89d767571956ea0)
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
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__228e7156c703b7f15bd3932c44fe7a776ccd0c5d09f42d9e6ebd8f4712c813b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6241af804f51ce5b667f6fd4554d5c634aba39abb9e92c9d3f9b8f44d9275414)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateActionParameter]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateActionParameter]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateActionParameter]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abe4527e58db2e9304614ab28359520089599d8d426b7cf2ba3255c9849b8003)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateActionTarget",
    jsii_struct_bases=[],
    name_mapping={"key": "key", "value": "value"},
)
class FisExperimentTemplateActionTarget:
    def __init__(self, *, key: builtins.str, value: builtins.str) -> None:
        '''
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#key FisExperimentTemplate#key}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22e9f05d6a45d4802c4d316666fc70b8986e2d7aefa42c313e208e480241c30e)
            check_type(argname="argument key", value=key, expected_type=type_hints["key"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "key": key,
            "value": value,
        }

    @builtins.property
    def key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#key FisExperimentTemplate#key}.'''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateActionTarget(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateActionTargetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateActionTargetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e32594d26c6c98de69e1ba6bc6f6bacdf20df9270344d313d80c8ae1be8a8a1a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="keyInput")
    def key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "keyInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d53985e8c2d667194474c91b06c4656e4effc7ab44fe47c938214e3bca3dec66)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76802e1030e26290dc2c1ef6304d73653031da6aaeab7b2f85f1f16b8a137754)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[FisExperimentTemplateActionTarget]:
        return typing.cast(typing.Optional[FisExperimentTemplateActionTarget], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FisExperimentTemplateActionTarget],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af7463ea9480a36cd63ac0175a57b0d8344c298ee734b552c494b0a44f25018d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "action": "action",
        "description": "description",
        "role_arn": "roleArn",
        "stop_condition": "stopCondition",
        "experiment_options": "experimentOptions",
        "experiment_report_configuration": "experimentReportConfiguration",
        "id": "id",
        "log_configuration": "logConfiguration",
        "tags": "tags",
        "tags_all": "tagsAll",
        "target": "target",
        "timeouts": "timeouts",
    },
)
class FisExperimentTemplateConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        action: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateAction, typing.Dict[builtins.str, typing.Any]]]],
        description: builtins.str,
        role_arn: builtins.str,
        stop_condition: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateStopCondition", typing.Dict[builtins.str, typing.Any]]]],
        experiment_options: typing.Optional[typing.Union["FisExperimentTemplateExperimentOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        experiment_report_configuration: typing.Optional[typing.Union["FisExperimentTemplateExperimentReportConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        log_configuration: typing.Optional[typing.Union["FisExperimentTemplateLogConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateTarget", typing.Dict[builtins.str, typing.Any]]]]] = None,
        timeouts: typing.Optional[typing.Union["FisExperimentTemplateTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#action FisExperimentTemplate#action}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#description FisExperimentTemplate#description}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#role_arn FisExperimentTemplate#role_arn}.
        :param stop_condition: stop_condition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#stop_condition FisExperimentTemplate#stop_condition}
        :param experiment_options: experiment_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#experiment_options FisExperimentTemplate#experiment_options}
        :param experiment_report_configuration: experiment_report_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#experiment_report_configuration FisExperimentTemplate#experiment_report_configuration}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#id FisExperimentTemplate#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param log_configuration: log_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_configuration FisExperimentTemplate#log_configuration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#tags FisExperimentTemplate#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#tags_all FisExperimentTemplate#tags_all}.
        :param target: target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#target FisExperimentTemplate#target}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#timeouts FisExperimentTemplate#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(experiment_options, dict):
            experiment_options = FisExperimentTemplateExperimentOptions(**experiment_options)
        if isinstance(experiment_report_configuration, dict):
            experiment_report_configuration = FisExperimentTemplateExperimentReportConfiguration(**experiment_report_configuration)
        if isinstance(log_configuration, dict):
            log_configuration = FisExperimentTemplateLogConfiguration(**log_configuration)
        if isinstance(timeouts, dict):
            timeouts = FisExperimentTemplateTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e442c13751419fc3454391c956365d83e317894c802a46573471bfcbe4f1b45d)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument stop_condition", value=stop_condition, expected_type=type_hints["stop_condition"])
            check_type(argname="argument experiment_options", value=experiment_options, expected_type=type_hints["experiment_options"])
            check_type(argname="argument experiment_report_configuration", value=experiment_report_configuration, expected_type=type_hints["experiment_report_configuration"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument log_configuration", value=log_configuration, expected_type=type_hints["log_configuration"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument target", value=target, expected_type=type_hints["target"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action": action,
            "description": description,
            "role_arn": role_arn,
            "stop_condition": stop_condition,
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
        if experiment_options is not None:
            self._values["experiment_options"] = experiment_options
        if experiment_report_configuration is not None:
            self._values["experiment_report_configuration"] = experiment_report_configuration
        if id is not None:
            self._values["id"] = id
        if log_configuration is not None:
            self._values["log_configuration"] = log_configuration
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if target is not None:
            self._values["target"] = target
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
    def action(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateAction]]:
        '''action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#action FisExperimentTemplate#action}
        '''
        result = self._values.get("action")
        assert result is not None, "Required property 'action' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateAction]], result)

    @builtins.property
    def description(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#description FisExperimentTemplate#description}.'''
        result = self._values.get("description")
        assert result is not None, "Required property 'description' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#role_arn FisExperimentTemplate#role_arn}.'''
        result = self._values.get("role_arn")
        assert result is not None, "Required property 'role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def stop_condition(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateStopCondition"]]:
        '''stop_condition block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#stop_condition FisExperimentTemplate#stop_condition}
        '''
        result = self._values.get("stop_condition")
        assert result is not None, "Required property 'stop_condition' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateStopCondition"]], result)

    @builtins.property
    def experiment_options(
        self,
    ) -> typing.Optional["FisExperimentTemplateExperimentOptions"]:
        '''experiment_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#experiment_options FisExperimentTemplate#experiment_options}
        '''
        result = self._values.get("experiment_options")
        return typing.cast(typing.Optional["FisExperimentTemplateExperimentOptions"], result)

    @builtins.property
    def experiment_report_configuration(
        self,
    ) -> typing.Optional["FisExperimentTemplateExperimentReportConfiguration"]:
        '''experiment_report_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#experiment_report_configuration FisExperimentTemplate#experiment_report_configuration}
        '''
        result = self._values.get("experiment_report_configuration")
        return typing.cast(typing.Optional["FisExperimentTemplateExperimentReportConfiguration"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#id FisExperimentTemplate#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def log_configuration(
        self,
    ) -> typing.Optional["FisExperimentTemplateLogConfiguration"]:
        '''log_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_configuration FisExperimentTemplate#log_configuration}
        '''
        result = self._values.get("log_configuration")
        return typing.cast(typing.Optional["FisExperimentTemplateLogConfiguration"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#tags FisExperimentTemplate#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#tags_all FisExperimentTemplate#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def target(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateTarget"]]]:
        '''target block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#target FisExperimentTemplate#target}
        '''
        result = self._values.get("target")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateTarget"]]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["FisExperimentTemplateTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#timeouts FisExperimentTemplate#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["FisExperimentTemplateTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentOptions",
    jsii_struct_bases=[],
    name_mapping={
        "account_targeting": "accountTargeting",
        "empty_target_resolution_mode": "emptyTargetResolutionMode",
    },
)
class FisExperimentTemplateExperimentOptions:
    def __init__(
        self,
        *,
        account_targeting: typing.Optional[builtins.str] = None,
        empty_target_resolution_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param account_targeting: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#account_targeting FisExperimentTemplate#account_targeting}.
        :param empty_target_resolution_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#empty_target_resolution_mode FisExperimentTemplate#empty_target_resolution_mode}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fdae390107442d9ed46d0b9331acd79362846df7a78f7dc7602f5d86e569e664)
            check_type(argname="argument account_targeting", value=account_targeting, expected_type=type_hints["account_targeting"])
            check_type(argname="argument empty_target_resolution_mode", value=empty_target_resolution_mode, expected_type=type_hints["empty_target_resolution_mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if account_targeting is not None:
            self._values["account_targeting"] = account_targeting
        if empty_target_resolution_mode is not None:
            self._values["empty_target_resolution_mode"] = empty_target_resolution_mode

    @builtins.property
    def account_targeting(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#account_targeting FisExperimentTemplate#account_targeting}.'''
        result = self._values.get("account_targeting")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def empty_target_resolution_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#empty_target_resolution_mode FisExperimentTemplate#empty_target_resolution_mode}.'''
        result = self._values.get("empty_target_resolution_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateExperimentOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateExperimentOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a44cb00f5b46a3dd60ba56a338c66f247bcfe87c21a024f443af95bac6146b1b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAccountTargeting")
    def reset_account_targeting(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccountTargeting", []))

    @jsii.member(jsii_name="resetEmptyTargetResolutionMode")
    def reset_empty_target_resolution_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmptyTargetResolutionMode", []))

    @builtins.property
    @jsii.member(jsii_name="accountTargetingInput")
    def account_targeting_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "accountTargetingInput"))

    @builtins.property
    @jsii.member(jsii_name="emptyTargetResolutionModeInput")
    def empty_target_resolution_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "emptyTargetResolutionModeInput"))

    @builtins.property
    @jsii.member(jsii_name="accountTargeting")
    def account_targeting(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accountTargeting"))

    @account_targeting.setter
    def account_targeting(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f3021222455684d21251d012ae6fad47ace82cbd2d928499c995386f8bfc98e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accountTargeting", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="emptyTargetResolutionMode")
    def empty_target_resolution_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "emptyTargetResolutionMode"))

    @empty_target_resolution_mode.setter
    def empty_target_resolution_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efe2937d44191f36b8ed3938f98c1698d6c6bf4bfae9a3d1561615367da13ce5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "emptyTargetResolutionMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[FisExperimentTemplateExperimentOptions]:
        return typing.cast(typing.Optional[FisExperimentTemplateExperimentOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FisExperimentTemplateExperimentOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e22fd88abb42888e8c538a9895b1bbe5a344f853120924abbbf11d0a85106ed1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "data_sources": "dataSources",
        "outputs": "outputs",
        "post_experiment_duration": "postExperimentDuration",
        "pre_experiment_duration": "preExperimentDuration",
    },
)
class FisExperimentTemplateExperimentReportConfiguration:
    def __init__(
        self,
        *,
        data_sources: typing.Optional[typing.Union["FisExperimentTemplateExperimentReportConfigurationDataSources", typing.Dict[builtins.str, typing.Any]]] = None,
        outputs: typing.Optional[typing.Union["FisExperimentTemplateExperimentReportConfigurationOutputs", typing.Dict[builtins.str, typing.Any]]] = None,
        post_experiment_duration: typing.Optional[builtins.str] = None,
        pre_experiment_duration: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param data_sources: data_sources block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#data_sources FisExperimentTemplate#data_sources}
        :param outputs: outputs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#outputs FisExperimentTemplate#outputs}
        :param post_experiment_duration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#post_experiment_duration FisExperimentTemplate#post_experiment_duration}.
        :param pre_experiment_duration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#pre_experiment_duration FisExperimentTemplate#pre_experiment_duration}.
        '''
        if isinstance(data_sources, dict):
            data_sources = FisExperimentTemplateExperimentReportConfigurationDataSources(**data_sources)
        if isinstance(outputs, dict):
            outputs = FisExperimentTemplateExperimentReportConfigurationOutputs(**outputs)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__826e81b17e3fc35f75493a371ba3d11d271e3c4794b2eff3f48a8478c1102739)
            check_type(argname="argument data_sources", value=data_sources, expected_type=type_hints["data_sources"])
            check_type(argname="argument outputs", value=outputs, expected_type=type_hints["outputs"])
            check_type(argname="argument post_experiment_duration", value=post_experiment_duration, expected_type=type_hints["post_experiment_duration"])
            check_type(argname="argument pre_experiment_duration", value=pre_experiment_duration, expected_type=type_hints["pre_experiment_duration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if data_sources is not None:
            self._values["data_sources"] = data_sources
        if outputs is not None:
            self._values["outputs"] = outputs
        if post_experiment_duration is not None:
            self._values["post_experiment_duration"] = post_experiment_duration
        if pre_experiment_duration is not None:
            self._values["pre_experiment_duration"] = pre_experiment_duration

    @builtins.property
    def data_sources(
        self,
    ) -> typing.Optional["FisExperimentTemplateExperimentReportConfigurationDataSources"]:
        '''data_sources block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#data_sources FisExperimentTemplate#data_sources}
        '''
        result = self._values.get("data_sources")
        return typing.cast(typing.Optional["FisExperimentTemplateExperimentReportConfigurationDataSources"], result)

    @builtins.property
    def outputs(
        self,
    ) -> typing.Optional["FisExperimentTemplateExperimentReportConfigurationOutputs"]:
        '''outputs block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#outputs FisExperimentTemplate#outputs}
        '''
        result = self._values.get("outputs")
        return typing.cast(typing.Optional["FisExperimentTemplateExperimentReportConfigurationOutputs"], result)

    @builtins.property
    def post_experiment_duration(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#post_experiment_duration FisExperimentTemplate#post_experiment_duration}.'''
        result = self._values.get("post_experiment_duration")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def pre_experiment_duration(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#pre_experiment_duration FisExperimentTemplate#pre_experiment_duration}.'''
        result = self._values.get("pre_experiment_duration")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateExperimentReportConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationDataSources",
    jsii_struct_bases=[],
    name_mapping={"cloudwatch_dashboard": "cloudwatchDashboard"},
)
class FisExperimentTemplateExperimentReportConfigurationDataSources:
    def __init__(
        self,
        *,
        cloudwatch_dashboard: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param cloudwatch_dashboard: cloudwatch_dashboard block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_dashboard FisExperimentTemplate#cloudwatch_dashboard}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a371e02aea80b504f3fb1af51e2f84988cc1b1f2f79d5c3fdc6f7f06b9e802e)
            check_type(argname="argument cloudwatch_dashboard", value=cloudwatch_dashboard, expected_type=type_hints["cloudwatch_dashboard"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if cloudwatch_dashboard is not None:
            self._values["cloudwatch_dashboard"] = cloudwatch_dashboard

    @builtins.property
    def cloudwatch_dashboard(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard"]]]:
        '''cloudwatch_dashboard block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_dashboard FisExperimentTemplate#cloudwatch_dashboard}
        '''
        result = self._values.get("cloudwatch_dashboard")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateExperimentReportConfigurationDataSources(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard",
    jsii_struct_bases=[],
    name_mapping={"dashboard_arn": "dashboardArn"},
)
class FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard:
    def __init__(self, *, dashboard_arn: typing.Optional[builtins.str] = None) -> None:
        '''
        :param dashboard_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#dashboard_arn FisExperimentTemplate#dashboard_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd19d0c878ee46ed2663cbba7b4edb4031199eeaf18afbd0d33a06203abe4f16)
            check_type(argname="argument dashboard_arn", value=dashboard_arn, expected_type=type_hints["dashboard_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if dashboard_arn is not None:
            self._values["dashboard_arn"] = dashboard_arn

    @builtins.property
    def dashboard_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#dashboard_arn FisExperimentTemplate#dashboard_arn}.'''
        result = self._values.get("dashboard_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboardList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboardList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5b3fba339edfa5c5d3fbc2beceb9b220bc08284d8ea3a492812c784abe1777c2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboardOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__425cafcf25ac8735d35f6f41debd60096f5234cc28fa458b26edbfe37ea25aa5)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboardOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8aac651bbd5ecadf08c1f84b921a22c8e0e0b056cb5122fd68a6cc1b72c42e0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__249f71371713668912424b4f5081cab8190fc91487c089c1caeccee49a347319)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1b93682b144e753468171dd50b1ebc1674d0873dc7e738c4d945abb28410b7cd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc2223c20c3b82f2e120df90f2af363f970351230bc054ec80bf51347c0efb52)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboardOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboardOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e25edff23c2703751197f20566491b6d29a7857e226c817ced9f2aa40a8e8a1a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetDashboardArn")
    def reset_dashboard_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDashboardArn", []))

    @builtins.property
    @jsii.member(jsii_name="dashboardArnInput")
    def dashboard_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dashboardArnInput"))

    @builtins.property
    @jsii.member(jsii_name="dashboardArn")
    def dashboard_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dashboardArn"))

    @dashboard_arn.setter
    def dashboard_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__91e52f4ee6b0ea0772056b054a031a73654996adba17d61efaf661b908debc09)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dashboardArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e099ca839b8660c15578d58276dc03aec6ada1e111012adc00438abc276e47f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateExperimentReportConfigurationDataSourcesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationDataSourcesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b9d45c788255e2660c473cde48436238c980349865d420d62e4ade557661d466)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCloudwatchDashboard")
    def put_cloudwatch_dashboard(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9c9fd0597621d26a2f94a2e6a1b58961618ae5fb948cd627295e8979a1854a74)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCloudwatchDashboard", [value]))

    @jsii.member(jsii_name="resetCloudwatchDashboard")
    def reset_cloudwatch_dashboard(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCloudwatchDashboard", []))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchDashboard")
    def cloudwatch_dashboard(
        self,
    ) -> FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboardList:
        return typing.cast(FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboardList, jsii.get(self, "cloudwatchDashboard"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchDashboardInput")
    def cloudwatch_dashboard_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard]]], jsii.get(self, "cloudwatchDashboardInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FisExperimentTemplateExperimentReportConfigurationDataSources]:
        return typing.cast(typing.Optional[FisExperimentTemplateExperimentReportConfigurationDataSources], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FisExperimentTemplateExperimentReportConfigurationDataSources],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8502a22e174e3a9ec325aff9b39405bccf787c9f0c05e2164689204a822faa76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateExperimentReportConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__57fbe21cfbbe15f53515df46ebd08252b6dbe4c4651f39cbdd5fea8dff403773)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDataSources")
    def put_data_sources(
        self,
        *,
        cloudwatch_dashboard: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param cloudwatch_dashboard: cloudwatch_dashboard block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_dashboard FisExperimentTemplate#cloudwatch_dashboard}
        '''
        value = FisExperimentTemplateExperimentReportConfigurationDataSources(
            cloudwatch_dashboard=cloudwatch_dashboard
        )

        return typing.cast(None, jsii.invoke(self, "putDataSources", [value]))

    @jsii.member(jsii_name="putOutputs")
    def put_outputs(
        self,
        *,
        s3_configuration: typing.Optional[typing.Union["FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param s3_configuration: s3_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#s3_configuration FisExperimentTemplate#s3_configuration}
        '''
        value = FisExperimentTemplateExperimentReportConfigurationOutputs(
            s3_configuration=s3_configuration
        )

        return typing.cast(None, jsii.invoke(self, "putOutputs", [value]))

    @jsii.member(jsii_name="resetDataSources")
    def reset_data_sources(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataSources", []))

    @jsii.member(jsii_name="resetOutputs")
    def reset_outputs(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOutputs", []))

    @jsii.member(jsii_name="resetPostExperimentDuration")
    def reset_post_experiment_duration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPostExperimentDuration", []))

    @jsii.member(jsii_name="resetPreExperimentDuration")
    def reset_pre_experiment_duration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPreExperimentDuration", []))

    @builtins.property
    @jsii.member(jsii_name="dataSources")
    def data_sources(
        self,
    ) -> FisExperimentTemplateExperimentReportConfigurationDataSourcesOutputReference:
        return typing.cast(FisExperimentTemplateExperimentReportConfigurationDataSourcesOutputReference, jsii.get(self, "dataSources"))

    @builtins.property
    @jsii.member(jsii_name="outputs")
    def outputs(
        self,
    ) -> "FisExperimentTemplateExperimentReportConfigurationOutputsOutputReference":
        return typing.cast("FisExperimentTemplateExperimentReportConfigurationOutputsOutputReference", jsii.get(self, "outputs"))

    @builtins.property
    @jsii.member(jsii_name="dataSourcesInput")
    def data_sources_input(
        self,
    ) -> typing.Optional[FisExperimentTemplateExperimentReportConfigurationDataSources]:
        return typing.cast(typing.Optional[FisExperimentTemplateExperimentReportConfigurationDataSources], jsii.get(self, "dataSourcesInput"))

    @builtins.property
    @jsii.member(jsii_name="outputsInput")
    def outputs_input(
        self,
    ) -> typing.Optional["FisExperimentTemplateExperimentReportConfigurationOutputs"]:
        return typing.cast(typing.Optional["FisExperimentTemplateExperimentReportConfigurationOutputs"], jsii.get(self, "outputsInput"))

    @builtins.property
    @jsii.member(jsii_name="postExperimentDurationInput")
    def post_experiment_duration_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "postExperimentDurationInput"))

    @builtins.property
    @jsii.member(jsii_name="preExperimentDurationInput")
    def pre_experiment_duration_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "preExperimentDurationInput"))

    @builtins.property
    @jsii.member(jsii_name="postExperimentDuration")
    def post_experiment_duration(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "postExperimentDuration"))

    @post_experiment_duration.setter
    def post_experiment_duration(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__368426a44c4708b4adcf37be7811e4b375731e152783758ad4b15d39b6258c0c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "postExperimentDuration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="preExperimentDuration")
    def pre_experiment_duration(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "preExperimentDuration"))

    @pre_experiment_duration.setter
    def pre_experiment_duration(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d0c4e25c55772dc3b0544ca33af88317db4e73ce1fd3628d54c6c9cfb580ac7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "preExperimentDuration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FisExperimentTemplateExperimentReportConfiguration]:
        return typing.cast(typing.Optional[FisExperimentTemplateExperimentReportConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FisExperimentTemplateExperimentReportConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d94b3f8688a317b3a4c30e90e8530071f5228082bfcffe9ff37125aa2926fd1b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationOutputs",
    jsii_struct_bases=[],
    name_mapping={"s3_configuration": "s3Configuration"},
)
class FisExperimentTemplateExperimentReportConfigurationOutputs:
    def __init__(
        self,
        *,
        s3_configuration: typing.Optional[typing.Union["FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param s3_configuration: s3_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#s3_configuration FisExperimentTemplate#s3_configuration}
        '''
        if isinstance(s3_configuration, dict):
            s3_configuration = FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration(**s3_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7022700e11c1a1679707d580252c90c3a6573de941880e21b61dffc6d21a9c29)
            check_type(argname="argument s3_configuration", value=s3_configuration, expected_type=type_hints["s3_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if s3_configuration is not None:
            self._values["s3_configuration"] = s3_configuration

    @builtins.property
    def s3_configuration(
        self,
    ) -> typing.Optional["FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration"]:
        '''s3_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#s3_configuration FisExperimentTemplate#s3_configuration}
        '''
        result = self._values.get("s3_configuration")
        return typing.cast(typing.Optional["FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateExperimentReportConfigurationOutputs(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateExperimentReportConfigurationOutputsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationOutputsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dc958badf7ba71aeeaa0e997c8806bd22481f6beb5727203767b1f0af03b487a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putS3Configuration")
    def put_s3_configuration(
        self,
        *,
        bucket_name: builtins.str,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#bucket_name FisExperimentTemplate#bucket_name}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#prefix FisExperimentTemplate#prefix}.
        '''
        value = FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration(
            bucket_name=bucket_name, prefix=prefix
        )

        return typing.cast(None, jsii.invoke(self, "putS3Configuration", [value]))

    @jsii.member(jsii_name="resetS3Configuration")
    def reset_s3_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3Configuration", []))

    @builtins.property
    @jsii.member(jsii_name="s3Configuration")
    def s3_configuration(
        self,
    ) -> "FisExperimentTemplateExperimentReportConfigurationOutputsS3ConfigurationOutputReference":
        return typing.cast("FisExperimentTemplateExperimentReportConfigurationOutputsS3ConfigurationOutputReference", jsii.get(self, "s3Configuration"))

    @builtins.property
    @jsii.member(jsii_name="s3ConfigurationInput")
    def s3_configuration_input(
        self,
    ) -> typing.Optional["FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration"]:
        return typing.cast(typing.Optional["FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration"], jsii.get(self, "s3ConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FisExperimentTemplateExperimentReportConfigurationOutputs]:
        return typing.cast(typing.Optional[FisExperimentTemplateExperimentReportConfigurationOutputs], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FisExperimentTemplateExperimentReportConfigurationOutputs],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b94d845b471d3a8f19e90d97db2688672a7394b1483dc0ee0222f0808145a57d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration",
    jsii_struct_bases=[],
    name_mapping={"bucket_name": "bucketName", "prefix": "prefix"},
)
class FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration:
    def __init__(
        self,
        *,
        bucket_name: builtins.str,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#bucket_name FisExperimentTemplate#bucket_name}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#prefix FisExperimentTemplate#prefix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__158215cda111ae3e5faee04c391f8f48e975ab0e5f36b2249094fe86e941c545)
            check_type(argname="argument bucket_name", value=bucket_name, expected_type=type_hints["bucket_name"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "bucket_name": bucket_name,
        }
        if prefix is not None:
            self._values["prefix"] = prefix

    @builtins.property
    def bucket_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#bucket_name FisExperimentTemplate#bucket_name}.'''
        result = self._values.get("bucket_name")
        assert result is not None, "Required property 'bucket_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#prefix FisExperimentTemplate#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateExperimentReportConfigurationOutputsS3ConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationOutputsS3ConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__517fbccc079da454f4c7b7081d83c6511e6c33d1a3b42c6b6038628a43aa4f27)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="bucketNameInput")
    def bucket_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketNameInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="bucketName")
    def bucket_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucketName"))

    @bucket_name.setter
    def bucket_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c0831d2e4ea7271dd4aa7d0a4ea88b954660bece8f7134ad89f96467df69fc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucketName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d10ab41dfe708199e825230fc01481ffa1feedee4ad6a18ec64c423057fe71f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration]:
        return typing.cast(typing.Optional[FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2885e095f45cf8af59e3ebffd292845504795e3290e87f272f4eade0942d87e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateLogConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "log_schema_version": "logSchemaVersion",
        "cloudwatch_logs_configuration": "cloudwatchLogsConfiguration",
        "s3_configuration": "s3Configuration",
    },
)
class FisExperimentTemplateLogConfiguration:
    def __init__(
        self,
        *,
        log_schema_version: jsii.Number,
        cloudwatch_logs_configuration: typing.Optional[typing.Union["FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        s3_configuration: typing.Optional[typing.Union["FisExperimentTemplateLogConfigurationS3Configuration", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param log_schema_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_schema_version FisExperimentTemplate#log_schema_version}.
        :param cloudwatch_logs_configuration: cloudwatch_logs_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_logs_configuration FisExperimentTemplate#cloudwatch_logs_configuration}
        :param s3_configuration: s3_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#s3_configuration FisExperimentTemplate#s3_configuration}
        '''
        if isinstance(cloudwatch_logs_configuration, dict):
            cloudwatch_logs_configuration = FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration(**cloudwatch_logs_configuration)
        if isinstance(s3_configuration, dict):
            s3_configuration = FisExperimentTemplateLogConfigurationS3Configuration(**s3_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d329093e772fba2b54699047c5cc9b56334e5c2faa5894d7ac9b771072b1784)
            check_type(argname="argument log_schema_version", value=log_schema_version, expected_type=type_hints["log_schema_version"])
            check_type(argname="argument cloudwatch_logs_configuration", value=cloudwatch_logs_configuration, expected_type=type_hints["cloudwatch_logs_configuration"])
            check_type(argname="argument s3_configuration", value=s3_configuration, expected_type=type_hints["s3_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "log_schema_version": log_schema_version,
        }
        if cloudwatch_logs_configuration is not None:
            self._values["cloudwatch_logs_configuration"] = cloudwatch_logs_configuration
        if s3_configuration is not None:
            self._values["s3_configuration"] = s3_configuration

    @builtins.property
    def log_schema_version(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_schema_version FisExperimentTemplate#log_schema_version}.'''
        result = self._values.get("log_schema_version")
        assert result is not None, "Required property 'log_schema_version' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def cloudwatch_logs_configuration(
        self,
    ) -> typing.Optional["FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration"]:
        '''cloudwatch_logs_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_logs_configuration FisExperimentTemplate#cloudwatch_logs_configuration}
        '''
        result = self._values.get("cloudwatch_logs_configuration")
        return typing.cast(typing.Optional["FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration"], result)

    @builtins.property
    def s3_configuration(
        self,
    ) -> typing.Optional["FisExperimentTemplateLogConfigurationS3Configuration"]:
        '''s3_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#s3_configuration FisExperimentTemplate#s3_configuration}
        '''
        result = self._values.get("s3_configuration")
        return typing.cast(typing.Optional["FisExperimentTemplateLogConfigurationS3Configuration"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateLogConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration",
    jsii_struct_bases=[],
    name_mapping={"log_group_arn": "logGroupArn"},
)
class FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration:
    def __init__(self, *, log_group_arn: builtins.str) -> None:
        '''
        :param log_group_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_group_arn FisExperimentTemplate#log_group_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e7a7e1960e56de5c036aa6cd11ff706e19e781695ff3621eeb42de5cf05bd0bb)
            check_type(argname="argument log_group_arn", value=log_group_arn, expected_type=type_hints["log_group_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "log_group_arn": log_group_arn,
        }

    @builtins.property
    def log_group_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_group_arn FisExperimentTemplate#log_group_arn}.'''
        result = self._values.get("log_group_arn")
        assert result is not None, "Required property 'log_group_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateLogConfigurationCloudwatchLogsConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateLogConfigurationCloudwatchLogsConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__488e2b841559c316aaed78fdbdb760e17a33f1394039754ee5b9d79f0c219964)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="logGroupArnInput")
    def log_group_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "logGroupArnInput"))

    @builtins.property
    @jsii.member(jsii_name="logGroupArn")
    def log_group_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "logGroupArn"))

    @log_group_arn.setter
    def log_group_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e173e2cd32f4309c58daa8fe19303bbbe23dffa3467af412aa24f45b3a87b692)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "logGroupArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration]:
        return typing.cast(typing.Optional[FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d24aee35a28faeb3ecdef5eac16146268318e336d9c57b03caed826503717f01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateLogConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateLogConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8dda11719c8c1a297522b0d56a65e132aece95aca9e398902ba3111799666054)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCloudwatchLogsConfiguration")
    def put_cloudwatch_logs_configuration(self, *, log_group_arn: builtins.str) -> None:
        '''
        :param log_group_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_group_arn FisExperimentTemplate#log_group_arn}.
        '''
        value = FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration(
            log_group_arn=log_group_arn
        )

        return typing.cast(None, jsii.invoke(self, "putCloudwatchLogsConfiguration", [value]))

    @jsii.member(jsii_name="putS3Configuration")
    def put_s3_configuration(
        self,
        *,
        bucket_name: builtins.str,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#bucket_name FisExperimentTemplate#bucket_name}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#prefix FisExperimentTemplate#prefix}.
        '''
        value = FisExperimentTemplateLogConfigurationS3Configuration(
            bucket_name=bucket_name, prefix=prefix
        )

        return typing.cast(None, jsii.invoke(self, "putS3Configuration", [value]))

    @jsii.member(jsii_name="resetCloudwatchLogsConfiguration")
    def reset_cloudwatch_logs_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCloudwatchLogsConfiguration", []))

    @jsii.member(jsii_name="resetS3Configuration")
    def reset_s3_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3Configuration", []))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchLogsConfiguration")
    def cloudwatch_logs_configuration(
        self,
    ) -> FisExperimentTemplateLogConfigurationCloudwatchLogsConfigurationOutputReference:
        return typing.cast(FisExperimentTemplateLogConfigurationCloudwatchLogsConfigurationOutputReference, jsii.get(self, "cloudwatchLogsConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="s3Configuration")
    def s3_configuration(
        self,
    ) -> "FisExperimentTemplateLogConfigurationS3ConfigurationOutputReference":
        return typing.cast("FisExperimentTemplateLogConfigurationS3ConfigurationOutputReference", jsii.get(self, "s3Configuration"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchLogsConfigurationInput")
    def cloudwatch_logs_configuration_input(
        self,
    ) -> typing.Optional[FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration]:
        return typing.cast(typing.Optional[FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration], jsii.get(self, "cloudwatchLogsConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="logSchemaVersionInput")
    def log_schema_version_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "logSchemaVersionInput"))

    @builtins.property
    @jsii.member(jsii_name="s3ConfigurationInput")
    def s3_configuration_input(
        self,
    ) -> typing.Optional["FisExperimentTemplateLogConfigurationS3Configuration"]:
        return typing.cast(typing.Optional["FisExperimentTemplateLogConfigurationS3Configuration"], jsii.get(self, "s3ConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="logSchemaVersion")
    def log_schema_version(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "logSchemaVersion"))

    @log_schema_version.setter
    def log_schema_version(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37681146b6fbba07560096bd862050651d49360e175cc5caf819fe3ce97c9d4e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "logSchemaVersion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[FisExperimentTemplateLogConfiguration]:
        return typing.cast(typing.Optional[FisExperimentTemplateLogConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FisExperimentTemplateLogConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3a62d3cfb3d8d64d61700fc78efd3f092d7c10a3e737f9e28f7f5fb775f176f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateLogConfigurationS3Configuration",
    jsii_struct_bases=[],
    name_mapping={"bucket_name": "bucketName", "prefix": "prefix"},
)
class FisExperimentTemplateLogConfigurationS3Configuration:
    def __init__(
        self,
        *,
        bucket_name: builtins.str,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#bucket_name FisExperimentTemplate#bucket_name}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#prefix FisExperimentTemplate#prefix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8041742edbbf9012f39a9546c54e112d79c15b57febbb03179c532d169f48606)
            check_type(argname="argument bucket_name", value=bucket_name, expected_type=type_hints["bucket_name"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "bucket_name": bucket_name,
        }
        if prefix is not None:
            self._values["prefix"] = prefix

    @builtins.property
    def bucket_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#bucket_name FisExperimentTemplate#bucket_name}.'''
        result = self._values.get("bucket_name")
        assert result is not None, "Required property 'bucket_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#prefix FisExperimentTemplate#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateLogConfigurationS3Configuration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateLogConfigurationS3ConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateLogConfigurationS3ConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e9ae865c9b59c6d25b9869a0d7ae5360a96edbab81396667c9c2fdd4a06ca094)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="bucketNameInput")
    def bucket_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketNameInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="bucketName")
    def bucket_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucketName"))

    @bucket_name.setter
    def bucket_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ac021ac3f800aff94fcce4752fab7903c5e6eebb8541b7e8ddf37db28d1f661)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucketName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba88ec50530c3bbd35468c2a6e8c91a93a559d5c9fc8dad424cfabd2ffd47c6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FisExperimentTemplateLogConfigurationS3Configuration]:
        return typing.cast(typing.Optional[FisExperimentTemplateLogConfigurationS3Configuration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FisExperimentTemplateLogConfigurationS3Configuration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8522ab0da0911735f3c606ad0289b837d78bf03aac64cbbf798d02b2af0cc06)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateStopCondition",
    jsii_struct_bases=[],
    name_mapping={"source": "source", "value": "value"},
)
class FisExperimentTemplateStopCondition:
    def __init__(
        self,
        *,
        source: builtins.str,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#source FisExperimentTemplate#source}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db80c2dd6ac37c37e3323054a187c62dc172a71cb1db98fad1d340b4e849e64a)
            check_type(argname="argument source", value=source, expected_type=type_hints["source"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "source": source,
        }
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def source(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#source FisExperimentTemplate#source}.'''
        result = self._values.get("source")
        assert result is not None, "Required property 'source' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateStopCondition(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateStopConditionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateStopConditionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__db8e3e08d88269c624868aee7a7f23a1d8ff5562d5de1c7b867e761e6fab33a4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "FisExperimentTemplateStopConditionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fef280b87f51926188e176116d1ff1e8f30ed394e6caeb71a209164d839dcf74)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FisExperimentTemplateStopConditionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1d64be54ab102b573fd8f3e1a4f127541c7ee43a03352267fa42f18b7eea907)
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
            type_hints = typing.get_type_hints(_typecheckingstub__34a826ca0a33a4482ebeadcd6ecf3a7bff99fba03090f14526b1d2fa520e233a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__058c92868b0afb8378617ddec4c2453a614d87c16bde139abb1b71fdaa056d90)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateStopCondition]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateStopCondition]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateStopCondition]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__769606d971f7a6aa1687d84171b2f8128212bb71459bf613165637416d72fee6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateStopConditionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateStopConditionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5e51acea734c85a6a311718f17d897719db4c2a5764c2ad531e3fb603395d79c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="sourceInput")
    def source_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="source")
    def source(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "source"))

    @source.setter
    def source(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__764c01a1b09f903b4d58c32a6b3dcdb8f9a284da774ef3f1bc5b1cb981084f3e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "source", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59b2f37f2a9262a714a99f60c67b80d9997ce16d1495bacbd47c0f05c496a94e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateStopCondition]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateStopCondition]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateStopCondition]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9555c5e0e3436e458fbd257b2d1a731b48141fdfc8782e1567b62690089a1ef2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTarget",
    jsii_struct_bases=[],
    name_mapping={
        "name": "name",
        "resource_type": "resourceType",
        "selection_mode": "selectionMode",
        "filter": "filter",
        "parameters": "parameters",
        "resource_arns": "resourceArns",
        "resource_tag": "resourceTag",
    },
)
class FisExperimentTemplateTarget:
    def __init__(
        self,
        *,
        name: builtins.str,
        resource_type: builtins.str,
        selection_mode: builtins.str,
        filter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateTargetFilter", typing.Dict[builtins.str, typing.Any]]]]] = None,
        parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        resource_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
        resource_tag: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateTargetResourceTag", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#name FisExperimentTemplate#name}.
        :param resource_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_type FisExperimentTemplate#resource_type}.
        :param selection_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#selection_mode FisExperimentTemplate#selection_mode}.
        :param filter: filter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#filter FisExperimentTemplate#filter}
        :param parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#parameters FisExperimentTemplate#parameters}.
        :param resource_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_arns FisExperimentTemplate#resource_arns}.
        :param resource_tag: resource_tag block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_tag FisExperimentTemplate#resource_tag}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__217632fe34daea08122ce82bb3df6f9197112af43a157ea3d4277ae76eefb3b8)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument resource_type", value=resource_type, expected_type=type_hints["resource_type"])
            check_type(argname="argument selection_mode", value=selection_mode, expected_type=type_hints["selection_mode"])
            check_type(argname="argument filter", value=filter, expected_type=type_hints["filter"])
            check_type(argname="argument parameters", value=parameters, expected_type=type_hints["parameters"])
            check_type(argname="argument resource_arns", value=resource_arns, expected_type=type_hints["resource_arns"])
            check_type(argname="argument resource_tag", value=resource_tag, expected_type=type_hints["resource_tag"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "resource_type": resource_type,
            "selection_mode": selection_mode,
        }
        if filter is not None:
            self._values["filter"] = filter
        if parameters is not None:
            self._values["parameters"] = parameters
        if resource_arns is not None:
            self._values["resource_arns"] = resource_arns
        if resource_tag is not None:
            self._values["resource_tag"] = resource_tag

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#name FisExperimentTemplate#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def resource_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_type FisExperimentTemplate#resource_type}.'''
        result = self._values.get("resource_type")
        assert result is not None, "Required property 'resource_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def selection_mode(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#selection_mode FisExperimentTemplate#selection_mode}.'''
        result = self._values.get("selection_mode")
        assert result is not None, "Required property 'selection_mode' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def filter(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateTargetFilter"]]]:
        '''filter block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#filter FisExperimentTemplate#filter}
        '''
        result = self._values.get("filter")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateTargetFilter"]]], result)

    @builtins.property
    def parameters(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#parameters FisExperimentTemplate#parameters}.'''
        result = self._values.get("parameters")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def resource_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_arns FisExperimentTemplate#resource_arns}.'''
        result = self._values.get("resource_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def resource_tag(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateTargetResourceTag"]]]:
        '''resource_tag block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_tag FisExperimentTemplate#resource_tag}
        '''
        result = self._values.get("resource_tag")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateTargetResourceTag"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateTarget(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTargetFilter",
    jsii_struct_bases=[],
    name_mapping={"path": "path", "values": "values"},
)
class FisExperimentTemplateTargetFilter:
    def __init__(
        self,
        *,
        path: builtins.str,
        values: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#path FisExperimentTemplate#path}.
        :param values: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#values FisExperimentTemplate#values}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7eb401bc83bfd913a8383b29fee2a3b868aad67a5362759370ced6976c68057f)
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
            check_type(argname="argument values", value=values, expected_type=type_hints["values"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "path": path,
            "values": values,
        }

    @builtins.property
    def path(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#path FisExperimentTemplate#path}.'''
        result = self._values.get("path")
        assert result is not None, "Required property 'path' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def values(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#values FisExperimentTemplate#values}.'''
        result = self._values.get("values")
        assert result is not None, "Required property 'values' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateTargetFilter(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateTargetFilterList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTargetFilterList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__33c2997de4ee40b5da3acfa842bfc1f4240227a782706e9aae84cb269dc254bd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "FisExperimentTemplateTargetFilterOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d400a6e67c0fc6113d9e5cb44d4c6bf7503bf4da7a2ba0ccd6fc2b2acf9808d3)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FisExperimentTemplateTargetFilterOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1c0b5355a1dd1752279415da7c839271fff95a19f6400d9ed68789fcf53f92b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cbc37d8e5de86a074ecc912204c5c5a1cb6f0ef476e719e792503a556579298a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9e0da306aaff15a9f5b77c3d2dd784789f2b64e8ea5fe76c9bea0c1654d6b375)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTargetFilter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTargetFilter]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTargetFilter]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f0239986006c2441f2ad14a6c047bb4eb81fa078633c04294d73ab928efe6c83)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateTargetFilterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTargetFilterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4ed3e63c8664735defe0ccc1700d680f8ce495b11bc4010559231b8e57ca12e7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="valuesInput")
    def values_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "valuesInput"))

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "path"))

    @path.setter
    def path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37923de4a6a3d31a8705906bbb113ebd5575312aef2640e32fdf261237b22520)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "path", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="values")
    def values(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "values"))

    @values.setter
    def values(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f712ad760b98bd58d2c45ce53bab68cc37696746e9aa8a40e655a9f2368afc5c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "values", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTargetFilter]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTargetFilter]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTargetFilter]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56b75e08613df2a66734c3230315765140a72aafa4cb8e3d5f0e66d74d4e18ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateTargetList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTargetList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e20d88bb2280e74326f2ac6a516eb13bd7df83336c3aa89456bb96a484a30a7b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "FisExperimentTemplateTargetOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2472f86567820601eb2a9edc455455c9616a5ffeda31c1102bb9e5a18fcd343c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FisExperimentTemplateTargetOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e826c67a47be2746e7239763702329b0bb80901e380a63c9934345d47b708d7e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__591993a4fc43aae01bc4a93f85e3a4328424e9a99471a7cdddbabcbf61076f46)
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
            type_hints = typing.get_type_hints(_typecheckingstub__32c9c1fb05f71b413a74c27a8d6c933638fbd23829c3e6486e72ed001d806fde)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTarget]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTarget]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTarget]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1ddb14f5fb7b90f7ffd4eebc6651e667e1c803dc3582c4e44093a0562180a7b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateTargetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTargetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bf7df83ba5b958548ce58e7ad279f5f5113a2ae1a190f76cdf411940adf344e6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putFilter")
    def put_filter(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateTargetFilter, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0aa25a76ecba345e7d12a0cd183abfd85ff0676ee114979ef03cc987ef5d4fca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFilter", [value]))

    @jsii.member(jsii_name="putResourceTag")
    def put_resource_tag(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FisExperimentTemplateTargetResourceTag", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb110440e2e32e9945e64aa9e4d5b2cbe43d4b97042485715f5e246742a57a80)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceTag", [value]))

    @jsii.member(jsii_name="resetFilter")
    def reset_filter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilter", []))

    @jsii.member(jsii_name="resetParameters")
    def reset_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParameters", []))

    @jsii.member(jsii_name="resetResourceArns")
    def reset_resource_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceArns", []))

    @jsii.member(jsii_name="resetResourceTag")
    def reset_resource_tag(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceTag", []))

    @builtins.property
    @jsii.member(jsii_name="filter")
    def filter(self) -> FisExperimentTemplateTargetFilterList:
        return typing.cast(FisExperimentTemplateTargetFilterList, jsii.get(self, "filter"))

    @builtins.property
    @jsii.member(jsii_name="resourceTag")
    def resource_tag(self) -> "FisExperimentTemplateTargetResourceTagList":
        return typing.cast("FisExperimentTemplateTargetResourceTagList", jsii.get(self, "resourceTag"))

    @builtins.property
    @jsii.member(jsii_name="filterInput")
    def filter_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTargetFilter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTargetFilter]]], jsii.get(self, "filterInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="parametersInput")
    def parameters_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "parametersInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceArnsInput")
    def resource_arns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "resourceArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTagInput")
    def resource_tag_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateTargetResourceTag"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FisExperimentTemplateTargetResourceTag"]]], jsii.get(self, "resourceTagInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTypeInput")
    def resource_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resourceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="selectionModeInput")
    def selection_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "selectionModeInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__589c62d1b6ccf72f61f06eeb2b1d3d0e45404228c1c95a62996cdc927040b9a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="parameters")
    def parameters(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "parameters"))

    @parameters.setter
    def parameters(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0335fb77d01bf05f3f4030819e8673e00d640b59dd762adf6b40e2be2b977640)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "parameters", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourceArns")
    def resource_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "resourceArns"))

    @resource_arns.setter
    def resource_arns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb23de99b8618242ccd4fe317a76e5c8d84537fa090dd48aafeb2bf16282677c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourceType")
    def resource_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceType"))

    @resource_type.setter
    def resource_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__940f7866a438f5aca862c8d9b752f8fa7fee5adb5d086166a8286cb547dc2423)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="selectionMode")
    def selection_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "selectionMode"))

    @selection_mode.setter
    def selection_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62eb6c2b948f4045bb6fb6169bb238d7d9c69f70ff8377393c9b891fa31ec01d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "selectionMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTarget]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTarget]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTarget]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8621b52bb244424974f5e82bcb43ca1cd12d990a64c5188105b8bb34432af3b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTargetResourceTag",
    jsii_struct_bases=[],
    name_mapping={"key": "key", "value": "value"},
)
class FisExperimentTemplateTargetResourceTag:
    def __init__(self, *, key: builtins.str, value: builtins.str) -> None:
        '''
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#key FisExperimentTemplate#key}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__31136932b9edc3abba9b56dbdcf1e13e256b46dd0a8466675f1c9ac3e5d80d53)
            check_type(argname="argument key", value=key, expected_type=type_hints["key"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "key": key,
            "value": value,
        }

    @builtins.property
    def key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#key FisExperimentTemplate#key}.'''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateTargetResourceTag(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateTargetResourceTagList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTargetResourceTagList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__06153db3506dc16828bd11d1ea7d58716aead436bfccbe73100f1fabb98af3d6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "FisExperimentTemplateTargetResourceTagOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b40db29490698e8409b4ec8b15ebcb7b722f61da9ea983b93cbf68bd71bc5857)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FisExperimentTemplateTargetResourceTagOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fec99672ee2bc7b43d302ed8cde5eb9b6d086a95aa8a5911ef9f5d5d61194237)
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
            type_hints = typing.get_type_hints(_typecheckingstub__49e1f5b882e77ae03f76be9f9448122f0422818dc08e20c1c8176e4057c4bdce)
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
            type_hints = typing.get_type_hints(_typecheckingstub__25213c612eebe6890a7b4129aef769cfe2b563cf0b7affa8968d42664b2e348a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTargetResourceTag]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTargetResourceTag]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTargetResourceTag]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__98ff019ed59878e76f274087a71cfb19b1b5ec94e2d236cb355ee1b27908392d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FisExperimentTemplateTargetResourceTagOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTargetResourceTagOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e29b38fcb2e208d37ca95c88b9b74c5abe133112544a26511e4c72fddc93ac57)
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
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01c99450b715bf62a0b885b41d8b17ae6040bd2110048ebb99a9d47d57e8bc81)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40d630a4071cd116a19ab6113ad193f4a23b404335a85fe9c93464486817a9f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTargetResourceTag]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTargetResourceTag]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTargetResourceTag]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c253aac3a6483c2947a4dcc3e42ac2ebfa827bf0ef761ed1106d81cd56caf1d8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class FisExperimentTemplateTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#create FisExperimentTemplate#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#delete FisExperimentTemplate#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#update FisExperimentTemplate#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__677f5b79359416bb786b3eae23fc622e35900895540c09ec2f47197d3d4549e1)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#create FisExperimentTemplate#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#delete FisExperimentTemplate#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#update FisExperimentTemplate#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FisExperimentTemplateTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FisExperimentTemplateTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fisExperimentTemplate.FisExperimentTemplateTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cff73f09f3b6921d3d62e6334ce6e63b853b8e82b98dc8cfbab7407de88709f6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f39bebc773c701977f0e382662bdbd410a3659de43db72baa091c7973f583d8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02e5727fe16178b1613cbca3f5426185bb018abba73fae60718334de180fb768)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7d2ee5becf95917965ba46a0e29bfd56096e61871f9698425b42ea0c0eb7f98)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90948ec2af5f9117bf8a7d4462dd75cf56f262bc74a5c87f484f351df7b6f875)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "FisExperimentTemplate",
    "FisExperimentTemplateAction",
    "FisExperimentTemplateActionList",
    "FisExperimentTemplateActionOutputReference",
    "FisExperimentTemplateActionParameter",
    "FisExperimentTemplateActionParameterList",
    "FisExperimentTemplateActionParameterOutputReference",
    "FisExperimentTemplateActionTarget",
    "FisExperimentTemplateActionTargetOutputReference",
    "FisExperimentTemplateConfig",
    "FisExperimentTemplateExperimentOptions",
    "FisExperimentTemplateExperimentOptionsOutputReference",
    "FisExperimentTemplateExperimentReportConfiguration",
    "FisExperimentTemplateExperimentReportConfigurationDataSources",
    "FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard",
    "FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboardList",
    "FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboardOutputReference",
    "FisExperimentTemplateExperimentReportConfigurationDataSourcesOutputReference",
    "FisExperimentTemplateExperimentReportConfigurationOutputReference",
    "FisExperimentTemplateExperimentReportConfigurationOutputs",
    "FisExperimentTemplateExperimentReportConfigurationOutputsOutputReference",
    "FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration",
    "FisExperimentTemplateExperimentReportConfigurationOutputsS3ConfigurationOutputReference",
    "FisExperimentTemplateLogConfiguration",
    "FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration",
    "FisExperimentTemplateLogConfigurationCloudwatchLogsConfigurationOutputReference",
    "FisExperimentTemplateLogConfigurationOutputReference",
    "FisExperimentTemplateLogConfigurationS3Configuration",
    "FisExperimentTemplateLogConfigurationS3ConfigurationOutputReference",
    "FisExperimentTemplateStopCondition",
    "FisExperimentTemplateStopConditionList",
    "FisExperimentTemplateStopConditionOutputReference",
    "FisExperimentTemplateTarget",
    "FisExperimentTemplateTargetFilter",
    "FisExperimentTemplateTargetFilterList",
    "FisExperimentTemplateTargetFilterOutputReference",
    "FisExperimentTemplateTargetList",
    "FisExperimentTemplateTargetOutputReference",
    "FisExperimentTemplateTargetResourceTag",
    "FisExperimentTemplateTargetResourceTagList",
    "FisExperimentTemplateTargetResourceTagOutputReference",
    "FisExperimentTemplateTimeouts",
    "FisExperimentTemplateTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__39286511a203deaafd715746af9e14e097aa4ffd03b74a716c9ab0cb755c5f6b(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    action: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateAction, typing.Dict[builtins.str, typing.Any]]]],
    description: builtins.str,
    role_arn: builtins.str,
    stop_condition: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateStopCondition, typing.Dict[builtins.str, typing.Any]]]],
    experiment_options: typing.Optional[typing.Union[FisExperimentTemplateExperimentOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    experiment_report_configuration: typing.Optional[typing.Union[FisExperimentTemplateExperimentReportConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    log_configuration: typing.Optional[typing.Union[FisExperimentTemplateLogConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateTarget, typing.Dict[builtins.str, typing.Any]]]]] = None,
    timeouts: typing.Optional[typing.Union[FisExperimentTemplateTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__81fb365180db4c85ead72f60a406da8c792a399b4acad07e9d847041932e26b3(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53e415555d95b5ac8f8d1ec8d428294cf666f965d823f28555289d0109edc9e4(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateAction, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3444f26bf462cb441dfb5e174b595ec1e5e41a60f3c9b8d79879d030c69cdc76(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateStopCondition, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09f3e3f1f38ed451f8ca49a2626af5aae7f1998b48343eaf2e53fa596e0bc495(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateTarget, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4def8d561dc295a06e79207eb74824a959f84a3965604e9c27fa53af61ea78b5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6dbb14d1fdae6c5d393cdcbf2df287a5766891661246adc19df585485fbd7ad(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a14181fd67724f88a43bd8f9a9ded18601c328ff54a7ce6da4b69b38fb5e63ff(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ee0e6266b2339c25d19255f8cf534fb76b138485055da8c525c16ec7efea54a(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c3f523affcd34435e869e0025e3482b898f82bb07c2954f1bcf9b509282dd10(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2724f0fe0f23690b705dc47a9ceb4af641d922ff3c5a0ca4f44ec8f56c4a463(
    *,
    action_id: builtins.str,
    name: builtins.str,
    description: typing.Optional[builtins.str] = None,
    parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateActionParameter, typing.Dict[builtins.str, typing.Any]]]]] = None,
    start_after: typing.Optional[typing.Sequence[builtins.str]] = None,
    target: typing.Optional[typing.Union[FisExperimentTemplateActionTarget, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8afbc12b66e3da78f037dfc7791a3311b1b62d446ef4ca5f375abe10f0c2af0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01c4f3c0dfb06b97e1bdef3dec5cb3380287e02fd1ab3082b438fb50a737e921(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ccfe7cc365361e52509dafa17f99256449c003a1fd876c28e5e424bd6c9d6b8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b592e2e8bcf192b6ff55883ebcafc3fbb8a4f2e86bc30efab209abbcfc3347e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__16736f1821c736a74cc8a073c9b877f4e36f38a090a54f62178d856d503a75d0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7e64ce9498671e111933d4bea78a025ffd4c3fbf2541982d229f74a879efe19(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateAction]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b2338f9a5b111ac9ba5c201ebf082cf5959c4b4d805c60ae34436f485337bc3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e84ed80de613cc3a0a15facb1b15d064e97ee20d32d6fae093cb017406ff1f63(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateActionParameter, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99f04028310973ff79a6dd9062cbb25e094dc2c6732fd67463e96d61fb30fbd5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f60d5c35f86298fd8ab7d4dba288170278c5d485eb05afd1acceb36273f06a23(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c69b756452b7e50feab4e5f98a404ac70ac1fa37325c8965c56cd6d7a987ecda(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5baf2f3793f213cb583e60d0c1382255794a8501f75e4742a7b6999ba1e2494f(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f281ceba921aa06d1ad9bc6ef598b19878d7587bb08dd21bbeebc12c11c5d49a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateAction]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79b0a178942f859fe27728c313f9c16e92d68a0312a0b2298e008e2f0e055287(
    *,
    key: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a9ae9b8d8c42475b232a3dc98d958fcf75e969ede91aedc230f19fe1ce752ae(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c352ddcf6c9d02f828085eed89331e0df91bd2adbe6e9524c394c74dad851c2(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37eec8e2a63eb053338744b7c050b9b0cd376b15d9837f3d7501016975724237(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7f6f5515ba0ed051ea019d7ce9aa26753b90fc80395e85e57dc1749b339a83c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1b03afe31e14f7ff283234e98a7d8b9566fb39e0700aa8d4934f2a37c762ccb(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4962ae9fec768f6384c91a924a989bdd4d6f7b294a75fbc7228e6bf0b050b8d3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateActionParameter]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a9c10e8e604abc66138ef5f59c91009f5ccce99f79f44cdd89d767571956ea0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__228e7156c703b7f15bd3932c44fe7a776ccd0c5d09f42d9e6ebd8f4712c813b3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6241af804f51ce5b667f6fd4554d5c634aba39abb9e92c9d3f9b8f44d9275414(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abe4527e58db2e9304614ab28359520089599d8d426b7cf2ba3255c9849b8003(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateActionParameter]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22e9f05d6a45d4802c4d316666fc70b8986e2d7aefa42c313e208e480241c30e(
    *,
    key: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e32594d26c6c98de69e1ba6bc6f6bacdf20df9270344d313d80c8ae1be8a8a1a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d53985e8c2d667194474c91b06c4656e4effc7ab44fe47c938214e3bca3dec66(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76802e1030e26290dc2c1ef6304d73653031da6aaeab7b2f85f1f16b8a137754(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af7463ea9480a36cd63ac0175a57b0d8344c298ee734b552c494b0a44f25018d(
    value: typing.Optional[FisExperimentTemplateActionTarget],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e442c13751419fc3454391c956365d83e317894c802a46573471bfcbe4f1b45d(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    action: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateAction, typing.Dict[builtins.str, typing.Any]]]],
    description: builtins.str,
    role_arn: builtins.str,
    stop_condition: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateStopCondition, typing.Dict[builtins.str, typing.Any]]]],
    experiment_options: typing.Optional[typing.Union[FisExperimentTemplateExperimentOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    experiment_report_configuration: typing.Optional[typing.Union[FisExperimentTemplateExperimentReportConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    log_configuration: typing.Optional[typing.Union[FisExperimentTemplateLogConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateTarget, typing.Dict[builtins.str, typing.Any]]]]] = None,
    timeouts: typing.Optional[typing.Union[FisExperimentTemplateTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdae390107442d9ed46d0b9331acd79362846df7a78f7dc7602f5d86e569e664(
    *,
    account_targeting: typing.Optional[builtins.str] = None,
    empty_target_resolution_mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a44cb00f5b46a3dd60ba56a338c66f247bcfe87c21a024f443af95bac6146b1b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f3021222455684d21251d012ae6fad47ace82cbd2d928499c995386f8bfc98e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efe2937d44191f36b8ed3938f98c1698d6c6bf4bfae9a3d1561615367da13ce5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e22fd88abb42888e8c538a9895b1bbe5a344f853120924abbbf11d0a85106ed1(
    value: typing.Optional[FisExperimentTemplateExperimentOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__826e81b17e3fc35f75493a371ba3d11d271e3c4794b2eff3f48a8478c1102739(
    *,
    data_sources: typing.Optional[typing.Union[FisExperimentTemplateExperimentReportConfigurationDataSources, typing.Dict[builtins.str, typing.Any]]] = None,
    outputs: typing.Optional[typing.Union[FisExperimentTemplateExperimentReportConfigurationOutputs, typing.Dict[builtins.str, typing.Any]]] = None,
    post_experiment_duration: typing.Optional[builtins.str] = None,
    pre_experiment_duration: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a371e02aea80b504f3fb1af51e2f84988cc1b1f2f79d5c3fdc6f7f06b9e802e(
    *,
    cloudwatch_dashboard: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd19d0c878ee46ed2663cbba7b4edb4031199eeaf18afbd0d33a06203abe4f16(
    *,
    dashboard_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b3fba339edfa5c5d3fbc2beceb9b220bc08284d8ea3a492812c784abe1777c2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__425cafcf25ac8735d35f6f41debd60096f5234cc28fa458b26edbfe37ea25aa5(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8aac651bbd5ecadf08c1f84b921a22c8e0e0b056cb5122fd68a6cc1b72c42e0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__249f71371713668912424b4f5081cab8190fc91487c089c1caeccee49a347319(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b93682b144e753468171dd50b1ebc1674d0873dc7e738c4d945abb28410b7cd(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc2223c20c3b82f2e120df90f2af363f970351230bc054ec80bf51347c0efb52(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e25edff23c2703751197f20566491b6d29a7857e226c817ced9f2aa40a8e8a1a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91e52f4ee6b0ea0772056b054a031a73654996adba17d61efaf661b908debc09(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e099ca839b8660c15578d58276dc03aec6ada1e111012adc00438abc276e47f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9d45c788255e2660c473cde48436238c980349865d420d62e4ade557661d466(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c9fd0597621d26a2f94a2e6a1b58961618ae5fb948cd627295e8979a1854a74(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8502a22e174e3a9ec325aff9b39405bccf787c9f0c05e2164689204a822faa76(
    value: typing.Optional[FisExperimentTemplateExperimentReportConfigurationDataSources],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57fbe21cfbbe15f53515df46ebd08252b6dbe4c4651f39cbdd5fea8dff403773(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__368426a44c4708b4adcf37be7811e4b375731e152783758ad4b15d39b6258c0c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d0c4e25c55772dc3b0544ca33af88317db4e73ce1fd3628d54c6c9cfb580ac7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d94b3f8688a317b3a4c30e90e8530071f5228082bfcffe9ff37125aa2926fd1b(
    value: typing.Optional[FisExperimentTemplateExperimentReportConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7022700e11c1a1679707d580252c90c3a6573de941880e21b61dffc6d21a9c29(
    *,
    s3_configuration: typing.Optional[typing.Union[FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc958badf7ba71aeeaa0e997c8806bd22481f6beb5727203767b1f0af03b487a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b94d845b471d3a8f19e90d97db2688672a7394b1483dc0ee0222f0808145a57d(
    value: typing.Optional[FisExperimentTemplateExperimentReportConfigurationOutputs],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__158215cda111ae3e5faee04c391f8f48e975ab0e5f36b2249094fe86e941c545(
    *,
    bucket_name: builtins.str,
    prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__517fbccc079da454f4c7b7081d83c6511e6c33d1a3b42c6b6038628a43aa4f27(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c0831d2e4ea7271dd4aa7d0a4ea88b954660bece8f7134ad89f96467df69fc9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d10ab41dfe708199e825230fc01481ffa1feedee4ad6a18ec64c423057fe71f9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2885e095f45cf8af59e3ebffd292845504795e3290e87f272f4eade0942d87e(
    value: typing.Optional[FisExperimentTemplateExperimentReportConfigurationOutputsS3Configuration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d329093e772fba2b54699047c5cc9b56334e5c2faa5894d7ac9b771072b1784(
    *,
    log_schema_version: jsii.Number,
    cloudwatch_logs_configuration: typing.Optional[typing.Union[FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    s3_configuration: typing.Optional[typing.Union[FisExperimentTemplateLogConfigurationS3Configuration, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7a7e1960e56de5c036aa6cd11ff706e19e781695ff3621eeb42de5cf05bd0bb(
    *,
    log_group_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__488e2b841559c316aaed78fdbdb760e17a33f1394039754ee5b9d79f0c219964(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e173e2cd32f4309c58daa8fe19303bbbe23dffa3467af412aa24f45b3a87b692(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d24aee35a28faeb3ecdef5eac16146268318e336d9c57b03caed826503717f01(
    value: typing.Optional[FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8dda11719c8c1a297522b0d56a65e132aece95aca9e398902ba3111799666054(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37681146b6fbba07560096bd862050651d49360e175cc5caf819fe3ce97c9d4e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3a62d3cfb3d8d64d61700fc78efd3f092d7c10a3e737f9e28f7f5fb775f176f(
    value: typing.Optional[FisExperimentTemplateLogConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8041742edbbf9012f39a9546c54e112d79c15b57febbb03179c532d169f48606(
    *,
    bucket_name: builtins.str,
    prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9ae865c9b59c6d25b9869a0d7ae5360a96edbab81396667c9c2fdd4a06ca094(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ac021ac3f800aff94fcce4752fab7903c5e6eebb8541b7e8ddf37db28d1f661(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba88ec50530c3bbd35468c2a6e8c91a93a559d5c9fc8dad424cfabd2ffd47c6b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8522ab0da0911735f3c606ad0289b837d78bf03aac64cbbf798d02b2af0cc06(
    value: typing.Optional[FisExperimentTemplateLogConfigurationS3Configuration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db80c2dd6ac37c37e3323054a187c62dc172a71cb1db98fad1d340b4e849e64a(
    *,
    source: builtins.str,
    value: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db8e3e08d88269c624868aee7a7f23a1d8ff5562d5de1c7b867e761e6fab33a4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fef280b87f51926188e176116d1ff1e8f30ed394e6caeb71a209164d839dcf74(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1d64be54ab102b573fd8f3e1a4f127541c7ee43a03352267fa42f18b7eea907(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__34a826ca0a33a4482ebeadcd6ecf3a7bff99fba03090f14526b1d2fa520e233a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__058c92868b0afb8378617ddec4c2453a614d87c16bde139abb1b71fdaa056d90(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__769606d971f7a6aa1687d84171b2f8128212bb71459bf613165637416d72fee6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateStopCondition]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e51acea734c85a6a311718f17d897719db4c2a5764c2ad531e3fb603395d79c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__764c01a1b09f903b4d58c32a6b3dcdb8f9a284da774ef3f1bc5b1cb981084f3e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59b2f37f2a9262a714a99f60c67b80d9997ce16d1495bacbd47c0f05c496a94e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9555c5e0e3436e458fbd257b2d1a731b48141fdfc8782e1567b62690089a1ef2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateStopCondition]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__217632fe34daea08122ce82bb3df6f9197112af43a157ea3d4277ae76eefb3b8(
    *,
    name: builtins.str,
    resource_type: builtins.str,
    selection_mode: builtins.str,
    filter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateTargetFilter, typing.Dict[builtins.str, typing.Any]]]]] = None,
    parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    resource_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    resource_tag: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateTargetResourceTag, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7eb401bc83bfd913a8383b29fee2a3b868aad67a5362759370ced6976c68057f(
    *,
    path: builtins.str,
    values: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33c2997de4ee40b5da3acfa842bfc1f4240227a782706e9aae84cb269dc254bd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d400a6e67c0fc6113d9e5cb44d4c6bf7503bf4da7a2ba0ccd6fc2b2acf9808d3(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1c0b5355a1dd1752279415da7c839271fff95a19f6400d9ed68789fcf53f92b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbc37d8e5de86a074ecc912204c5c5a1cb6f0ef476e719e792503a556579298a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e0da306aaff15a9f5b77c3d2dd784789f2b64e8ea5fe76c9bea0c1654d6b375(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0239986006c2441f2ad14a6c047bb4eb81fa078633c04294d73ab928efe6c83(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTargetFilter]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ed3e63c8664735defe0ccc1700d680f8ce495b11bc4010559231b8e57ca12e7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37923de4a6a3d31a8705906bbb113ebd5575312aef2640e32fdf261237b22520(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f712ad760b98bd58d2c45ce53bab68cc37696746e9aa8a40e655a9f2368afc5c(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56b75e08613df2a66734c3230315765140a72aafa4cb8e3d5f0e66d74d4e18ac(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTargetFilter]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e20d88bb2280e74326f2ac6a516eb13bd7df83336c3aa89456bb96a484a30a7b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2472f86567820601eb2a9edc455455c9616a5ffeda31c1102bb9e5a18fcd343c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e826c67a47be2746e7239763702329b0bb80901e380a63c9934345d47b708d7e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__591993a4fc43aae01bc4a93f85e3a4328424e9a99471a7cdddbabcbf61076f46(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32c9c1fb05f71b413a74c27a8d6c933638fbd23829c3e6486e72ed001d806fde(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1ddb14f5fb7b90f7ffd4eebc6651e667e1c803dc3582c4e44093a0562180a7b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTarget]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf7df83ba5b958548ce58e7ad279f5f5113a2ae1a190f76cdf411940adf344e6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0aa25a76ecba345e7d12a0cd183abfd85ff0676ee114979ef03cc987ef5d4fca(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateTargetFilter, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb110440e2e32e9945e64aa9e4d5b2cbe43d4b97042485715f5e246742a57a80(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FisExperimentTemplateTargetResourceTag, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__589c62d1b6ccf72f61f06eeb2b1d3d0e45404228c1c95a62996cdc927040b9a4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0335fb77d01bf05f3f4030819e8673e00d640b59dd762adf6b40e2be2b977640(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb23de99b8618242ccd4fe317a76e5c8d84537fa090dd48aafeb2bf16282677c(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__940f7866a438f5aca862c8d9b752f8fa7fee5adb5d086166a8286cb547dc2423(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62eb6c2b948f4045bb6fb6169bb238d7d9c69f70ff8377393c9b891fa31ec01d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8621b52bb244424974f5e82bcb43ca1cd12d990a64c5188105b8bb34432af3b6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTarget]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31136932b9edc3abba9b56dbdcf1e13e256b46dd0a8466675f1c9ac3e5d80d53(
    *,
    key: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06153db3506dc16828bd11d1ea7d58716aead436bfccbe73100f1fabb98af3d6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b40db29490698e8409b4ec8b15ebcb7b722f61da9ea983b93cbf68bd71bc5857(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fec99672ee2bc7b43d302ed8cde5eb9b6d086a95aa8a5911ef9f5d5d61194237(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49e1f5b882e77ae03f76be9f9448122f0422818dc08e20c1c8176e4057c4bdce(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25213c612eebe6890a7b4129aef769cfe2b563cf0b7affa8968d42664b2e348a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98ff019ed59878e76f274087a71cfb19b1b5ec94e2d236cb355ee1b27908392d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FisExperimentTemplateTargetResourceTag]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e29b38fcb2e208d37ca95c88b9b74c5abe133112544a26511e4c72fddc93ac57(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01c99450b715bf62a0b885b41d8b17ae6040bd2110048ebb99a9d47d57e8bc81(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40d630a4071cd116a19ab6113ad193f4a23b404335a85fe9c93464486817a9f9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c253aac3a6483c2947a4dcc3e42ac2ebfa827bf0ef761ed1106d81cd56caf1d8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTargetResourceTag]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__677f5b79359416bb786b3eae23fc622e35900895540c09ec2f47197d3d4549e1(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cff73f09f3b6921d3d62e6334ce6e63b853b8e82b98dc8cfbab7407de88709f6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f39bebc773c701977f0e382662bdbd410a3659de43db72baa091c7973f583d8c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02e5727fe16178b1613cbca3f5426185bb018abba73fae60718334de180fb768(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7d2ee5becf95917965ba46a0e29bfd56096e61871f9698425b42ea0c0eb7f98(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90948ec2af5f9117bf8a7d4462dd75cf56f262bc74a5c87f484f351df7b6f875(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FisExperimentTemplateTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
