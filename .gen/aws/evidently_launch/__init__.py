r'''
# `aws_evidently_launch`

Refer to the Terraform Registry for docs: [`aws_evidently_launch`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch).
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


class EvidentlyLaunch(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunch",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch aws_evidently_launch}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        groups: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchGroups", typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        project: builtins.str,
        description: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        metric_monitors: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchMetricMonitors", typing.Dict[builtins.str, typing.Any]]]]] = None,
        randomization_salt: typing.Optional[builtins.str] = None,
        scheduled_splits_config: typing.Optional[typing.Union["EvidentlyLaunchScheduledSplitsConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["EvidentlyLaunchTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch aws_evidently_launch} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param groups: groups block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#groups EvidentlyLaunch#groups}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}.
        :param project: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#project EvidentlyLaunch#project}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#description EvidentlyLaunch#description}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#id EvidentlyLaunch#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param metric_monitors: metric_monitors block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#metric_monitors EvidentlyLaunch#metric_monitors}
        :param randomization_salt: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#randomization_salt EvidentlyLaunch#randomization_salt}.
        :param scheduled_splits_config: scheduled_splits_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#scheduled_splits_config EvidentlyLaunch#scheduled_splits_config}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#tags EvidentlyLaunch#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#tags_all EvidentlyLaunch#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#timeouts EvidentlyLaunch#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67a80bcd78196faef3ef252a78b53c59be50a548c1e3ac8a9faefb154625a42d)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = EvidentlyLaunchConfig(
            groups=groups,
            name=name,
            project=project,
            description=description,
            id=id,
            metric_monitors=metric_monitors,
            randomization_salt=randomization_salt,
            scheduled_splits_config=scheduled_splits_config,
            tags=tags,
            tags_all=tags_all,
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
        '''Generates CDKTF code for importing a EvidentlyLaunch resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the EvidentlyLaunch to import.
        :param import_from_id: The id of the existing EvidentlyLaunch that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the EvidentlyLaunch to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee81d161b85aa5884b14f9389b281e77e2afa655f917aad3ba668be4bff231e8)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putGroups")
    def put_groups(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchGroups", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6ee930717591bb1669fc1dffe183eb0241459ef46e15604cbb83bec1f615902)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putGroups", [value]))

    @jsii.member(jsii_name="putMetricMonitors")
    def put_metric_monitors(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchMetricMonitors", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__227e31a12d66b1927e950d53a2363eaae867c56850ef41addd8774ae28762e77)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMetricMonitors", [value]))

    @jsii.member(jsii_name="putScheduledSplitsConfig")
    def put_scheduled_splits_config(
        self,
        *,
        steps: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchScheduledSplitsConfigSteps", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param steps: steps block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#steps EvidentlyLaunch#steps}
        '''
        value = EvidentlyLaunchScheduledSplitsConfig(steps=steps)

        return typing.cast(None, jsii.invoke(self, "putScheduledSplitsConfig", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#create EvidentlyLaunch#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#delete EvidentlyLaunch#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#update EvidentlyLaunch#update}.
        '''
        value = EvidentlyLaunchTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetMetricMonitors")
    def reset_metric_monitors(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMetricMonitors", []))

    @jsii.member(jsii_name="resetRandomizationSalt")
    def reset_randomization_salt(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRandomizationSalt", []))

    @jsii.member(jsii_name="resetScheduledSplitsConfig")
    def reset_scheduled_splits_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetScheduledSplitsConfig", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

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
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="createdTime")
    def created_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "createdTime"))

    @builtins.property
    @jsii.member(jsii_name="execution")
    def execution(self) -> "EvidentlyLaunchExecutionList":
        return typing.cast("EvidentlyLaunchExecutionList", jsii.get(self, "execution"))

    @builtins.property
    @jsii.member(jsii_name="groups")
    def groups(self) -> "EvidentlyLaunchGroupsList":
        return typing.cast("EvidentlyLaunchGroupsList", jsii.get(self, "groups"))

    @builtins.property
    @jsii.member(jsii_name="lastUpdatedTime")
    def last_updated_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastUpdatedTime"))

    @builtins.property
    @jsii.member(jsii_name="metricMonitors")
    def metric_monitors(self) -> "EvidentlyLaunchMetricMonitorsList":
        return typing.cast("EvidentlyLaunchMetricMonitorsList", jsii.get(self, "metricMonitors"))

    @builtins.property
    @jsii.member(jsii_name="scheduledSplitsConfig")
    def scheduled_splits_config(
        self,
    ) -> "EvidentlyLaunchScheduledSplitsConfigOutputReference":
        return typing.cast("EvidentlyLaunchScheduledSplitsConfigOutputReference", jsii.get(self, "scheduledSplitsConfig"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @builtins.property
    @jsii.member(jsii_name="statusReason")
    def status_reason(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "statusReason"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "EvidentlyLaunchTimeoutsOutputReference":
        return typing.cast("EvidentlyLaunchTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="groupsInput")
    def groups_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchGroups"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchGroups"]]], jsii.get(self, "groupsInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="metricMonitorsInput")
    def metric_monitors_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchMetricMonitors"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchMetricMonitors"]]], jsii.get(self, "metricMonitorsInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="projectInput")
    def project_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "projectInput"))

    @builtins.property
    @jsii.member(jsii_name="randomizationSaltInput")
    def randomization_salt_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "randomizationSaltInput"))

    @builtins.property
    @jsii.member(jsii_name="scheduledSplitsConfigInput")
    def scheduled_splits_config_input(
        self,
    ) -> typing.Optional["EvidentlyLaunchScheduledSplitsConfig"]:
        return typing.cast(typing.Optional["EvidentlyLaunchScheduledSplitsConfig"], jsii.get(self, "scheduledSplitsConfigInput"))

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
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "EvidentlyLaunchTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "EvidentlyLaunchTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6fe64c95287b1ca417e14889f8d81d5fe02bf58621c45123bf6cbe2ead005eb2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__842c5137b9841da60397b2169e473f8ca7475c731bbc3b5fff201afe3185580d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f51097a5908f283cd82feb409fece67fd2c0971364ec5dbc675923a289e8462f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="project")
    def project(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "project"))

    @project.setter
    def project(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5dd932c9603ac3208905b02480e4160fc91b35c3f02078268a8d82e0a09b46ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "project", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="randomizationSalt")
    def randomization_salt(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "randomizationSalt"))

    @randomization_salt.setter
    def randomization_salt(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb24bd91c40c6f2f2ef07bcb0f1748ea0928848465353b87c64734bf507494c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "randomizationSalt", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__faec061fc1b309ed2217a332548051115d50584bb6636581a48c554fd0519a3c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3097889382abf119bafc6ba294a2cea441d2f0abe6eaa23a1f3e8ad61742a36b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "groups": "groups",
        "name": "name",
        "project": "project",
        "description": "description",
        "id": "id",
        "metric_monitors": "metricMonitors",
        "randomization_salt": "randomizationSalt",
        "scheduled_splits_config": "scheduledSplitsConfig",
        "tags": "tags",
        "tags_all": "tagsAll",
        "timeouts": "timeouts",
    },
)
class EvidentlyLaunchConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        groups: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchGroups", typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        project: builtins.str,
        description: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        metric_monitors: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchMetricMonitors", typing.Dict[builtins.str, typing.Any]]]]] = None,
        randomization_salt: typing.Optional[builtins.str] = None,
        scheduled_splits_config: typing.Optional[typing.Union["EvidentlyLaunchScheduledSplitsConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["EvidentlyLaunchTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param groups: groups block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#groups EvidentlyLaunch#groups}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}.
        :param project: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#project EvidentlyLaunch#project}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#description EvidentlyLaunch#description}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#id EvidentlyLaunch#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param metric_monitors: metric_monitors block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#metric_monitors EvidentlyLaunch#metric_monitors}
        :param randomization_salt: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#randomization_salt EvidentlyLaunch#randomization_salt}.
        :param scheduled_splits_config: scheduled_splits_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#scheduled_splits_config EvidentlyLaunch#scheduled_splits_config}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#tags EvidentlyLaunch#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#tags_all EvidentlyLaunch#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#timeouts EvidentlyLaunch#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(scheduled_splits_config, dict):
            scheduled_splits_config = EvidentlyLaunchScheduledSplitsConfig(**scheduled_splits_config)
        if isinstance(timeouts, dict):
            timeouts = EvidentlyLaunchTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd8ec2ee3e1864fdc0871a8f769130080e4b7e04f92917d2d55d38b1f315c439)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument groups", value=groups, expected_type=type_hints["groups"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument project", value=project, expected_type=type_hints["project"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument metric_monitors", value=metric_monitors, expected_type=type_hints["metric_monitors"])
            check_type(argname="argument randomization_salt", value=randomization_salt, expected_type=type_hints["randomization_salt"])
            check_type(argname="argument scheduled_splits_config", value=scheduled_splits_config, expected_type=type_hints["scheduled_splits_config"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "groups": groups,
            "name": name,
            "project": project,
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
        if description is not None:
            self._values["description"] = description
        if id is not None:
            self._values["id"] = id
        if metric_monitors is not None:
            self._values["metric_monitors"] = metric_monitors
        if randomization_salt is not None:
            self._values["randomization_salt"] = randomization_salt
        if scheduled_splits_config is not None:
            self._values["scheduled_splits_config"] = scheduled_splits_config
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
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
    def groups(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchGroups"]]:
        '''groups block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#groups EvidentlyLaunch#groups}
        '''
        result = self._values.get("groups")
        assert result is not None, "Required property 'groups' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchGroups"]], result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def project(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#project EvidentlyLaunch#project}.'''
        result = self._values.get("project")
        assert result is not None, "Required property 'project' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#description EvidentlyLaunch#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#id EvidentlyLaunch#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def metric_monitors(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchMetricMonitors"]]]:
        '''metric_monitors block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#metric_monitors EvidentlyLaunch#metric_monitors}
        '''
        result = self._values.get("metric_monitors")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchMetricMonitors"]]], result)

    @builtins.property
    def randomization_salt(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#randomization_salt EvidentlyLaunch#randomization_salt}.'''
        result = self._values.get("randomization_salt")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def scheduled_splits_config(
        self,
    ) -> typing.Optional["EvidentlyLaunchScheduledSplitsConfig"]:
        '''scheduled_splits_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#scheduled_splits_config EvidentlyLaunch#scheduled_splits_config}
        '''
        result = self._values.get("scheduled_splits_config")
        return typing.cast(typing.Optional["EvidentlyLaunchScheduledSplitsConfig"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#tags EvidentlyLaunch#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#tags_all EvidentlyLaunch#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["EvidentlyLaunchTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#timeouts EvidentlyLaunch#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["EvidentlyLaunchTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EvidentlyLaunchConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchExecution",
    jsii_struct_bases=[],
    name_mapping={},
)
class EvidentlyLaunchExecution:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EvidentlyLaunchExecution(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EvidentlyLaunchExecutionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchExecutionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__84fb851905ed70bebf182fd749c7d9c2fbd96c6598b0c8d7b87a8a9d639c4cda)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "EvidentlyLaunchExecutionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__688ba5730608cc78bd9c09696861136c343a64149a628b89533aeb173a90c4e8)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("EvidentlyLaunchExecutionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c3bffc0e31d3bd7c03c2c427f2fbbebf8ac923e350b6bd4f439a931f1d4329f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__46713097cfa36fdee5d1d7910c4842e3ffd1db54308727fec4def957d9180a9f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ca7679fbe10cd8e276513039a715502b87146a82e2be9dafa79166361f3267c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class EvidentlyLaunchExecutionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchExecutionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3789dfbe8fab4a8a227fd000328e975593877325febcbc80a5ba10acdbd52231)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="endedTime")
    def ended_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endedTime"))

    @builtins.property
    @jsii.member(jsii_name="startedTime")
    def started_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startedTime"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EvidentlyLaunchExecution]:
        return typing.cast(typing.Optional[EvidentlyLaunchExecution], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[EvidentlyLaunchExecution]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__286504fa5498db447ba166405fc68488d724b16a4a3a4acec221cd627c6d695b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchGroups",
    jsii_struct_bases=[],
    name_mapping={
        "feature": "feature",
        "name": "name",
        "variation": "variation",
        "description": "description",
    },
)
class EvidentlyLaunchGroups:
    def __init__(
        self,
        *,
        feature: builtins.str,
        name: builtins.str,
        variation: builtins.str,
        description: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param feature: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#feature EvidentlyLaunch#feature}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}.
        :param variation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#variation EvidentlyLaunch#variation}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#description EvidentlyLaunch#description}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f000e68b51581c530ca1a1621916a2024a3312718ce5c83a294fb05e994c1d27)
            check_type(argname="argument feature", value=feature, expected_type=type_hints["feature"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument variation", value=variation, expected_type=type_hints["variation"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "feature": feature,
            "name": name,
            "variation": variation,
        }
        if description is not None:
            self._values["description"] = description

    @builtins.property
    def feature(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#feature EvidentlyLaunch#feature}.'''
        result = self._values.get("feature")
        assert result is not None, "Required property 'feature' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def variation(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#variation EvidentlyLaunch#variation}.'''
        result = self._values.get("variation")
        assert result is not None, "Required property 'variation' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#description EvidentlyLaunch#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EvidentlyLaunchGroups(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EvidentlyLaunchGroupsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchGroupsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5576544084dffc63ef2abb9dbcfe2ab8d5eaac8da471f356a18a2e04abfc8162)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "EvidentlyLaunchGroupsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9e77225008a2bb05b47d595bc98992fa3d8c0547c11239dfc6ca75d026ecd9bb)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("EvidentlyLaunchGroupsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__72ddc1a29ff8c2c379ef203e80e4e36278ae6b60d611c93bb4fbb5c10b5ca1f2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1dc2a8bf876586184f74f540d96c5ae65edaf484e3f6fd0a1a44c0b6bc220901)
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
            type_hints = typing.get_type_hints(_typecheckingstub__975734df96e81fc49b9dc27afc47f0bb9bfc7eeebdb96c995aefc83a0fc1a571)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchGroups]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchGroups]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchGroups]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cfc1fcf9b4a5193dfb80236fba88a082694fced8ab5a2616f012d6ce51ff7968)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class EvidentlyLaunchGroupsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchGroupsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__afaa3725dfd405a415e3b10f1521b01b06a6ae54bda84a33cac71972079ac46c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="featureInput")
    def feature_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "featureInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="variationInput")
    def variation_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "variationInput"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a780f3a34ec7aad7c01c2d074cda106e0478b38c175f8a2e739abcdf529babd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="feature")
    def feature(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "feature"))

    @feature.setter
    def feature(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5030d5fc38ab8dd214c695deb304594e5d00cc3e4568da08723ead2eac8a444)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "feature", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8bb0bd243f838faec2fbc1fbf6ef5793d8b8638761e98b2fed551847e2963b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="variation")
    def variation(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "variation"))

    @variation.setter
    def variation(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a99c1095531ec4b51d61b9d366d6d6521b1fd22d1bba3c2451fc5ce628e22b65)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "variation", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchGroups]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchGroups]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchGroups]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a270ac31b8f84338ffac55b16258e0bf001ce45ce893ccfc87397605e29f541a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchMetricMonitors",
    jsii_struct_bases=[],
    name_mapping={"metric_definition": "metricDefinition"},
)
class EvidentlyLaunchMetricMonitors:
    def __init__(
        self,
        *,
        metric_definition: typing.Union["EvidentlyLaunchMetricMonitorsMetricDefinition", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param metric_definition: metric_definition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#metric_definition EvidentlyLaunch#metric_definition}
        '''
        if isinstance(metric_definition, dict):
            metric_definition = EvidentlyLaunchMetricMonitorsMetricDefinition(**metric_definition)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__94d874acacf825827b94b4354a376618c1e3206e7d14ca0d19df4e0268af6a29)
            check_type(argname="argument metric_definition", value=metric_definition, expected_type=type_hints["metric_definition"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "metric_definition": metric_definition,
        }

    @builtins.property
    def metric_definition(self) -> "EvidentlyLaunchMetricMonitorsMetricDefinition":
        '''metric_definition block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#metric_definition EvidentlyLaunch#metric_definition}
        '''
        result = self._values.get("metric_definition")
        assert result is not None, "Required property 'metric_definition' is missing"
        return typing.cast("EvidentlyLaunchMetricMonitorsMetricDefinition", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EvidentlyLaunchMetricMonitors(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EvidentlyLaunchMetricMonitorsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchMetricMonitorsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b0c2f01750d965c3a27ae568ee8c5c82914e981e75e5382b45a625f71f20b6e4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "EvidentlyLaunchMetricMonitorsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd6d4623bd18abf1319203fbfe043d0c71eb2ebd911bf8469545c15a58ea3051)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("EvidentlyLaunchMetricMonitorsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__147df3c063e37bb627a59c7a0c4fa502de20c7cd8ff7f8eaf9b8b41750ad5437)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1610b7d38b629467657b5338e75fdc42d414bd2ce41aa4df4864484d919f5fca)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8c2ddbe9276851cf631dd6bc86bb509a01e06a18e7a37d681da0dc21ac1e3197)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchMetricMonitors]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchMetricMonitors]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchMetricMonitors]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8de9a17524f3595258a5f1c36006b5f8553aa371a7fa9c6a7722f6e7f16bfd44)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchMetricMonitorsMetricDefinition",
    jsii_struct_bases=[],
    name_mapping={
        "entity_id_key": "entityIdKey",
        "name": "name",
        "value_key": "valueKey",
        "event_pattern": "eventPattern",
        "unit_label": "unitLabel",
    },
)
class EvidentlyLaunchMetricMonitorsMetricDefinition:
    def __init__(
        self,
        *,
        entity_id_key: builtins.str,
        name: builtins.str,
        value_key: builtins.str,
        event_pattern: typing.Optional[builtins.str] = None,
        unit_label: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param entity_id_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#entity_id_key EvidentlyLaunch#entity_id_key}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}.
        :param value_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#value_key EvidentlyLaunch#value_key}.
        :param event_pattern: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#event_pattern EvidentlyLaunch#event_pattern}.
        :param unit_label: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#unit_label EvidentlyLaunch#unit_label}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ea1fbd3cbf26475c19b731e2cb8815c210a4e8de12fe20fcd4c7802fdd32118)
            check_type(argname="argument entity_id_key", value=entity_id_key, expected_type=type_hints["entity_id_key"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value_key", value=value_key, expected_type=type_hints["value_key"])
            check_type(argname="argument event_pattern", value=event_pattern, expected_type=type_hints["event_pattern"])
            check_type(argname="argument unit_label", value=unit_label, expected_type=type_hints["unit_label"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "entity_id_key": entity_id_key,
            "name": name,
            "value_key": value_key,
        }
        if event_pattern is not None:
            self._values["event_pattern"] = event_pattern
        if unit_label is not None:
            self._values["unit_label"] = unit_label

    @builtins.property
    def entity_id_key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#entity_id_key EvidentlyLaunch#entity_id_key}.'''
        result = self._values.get("entity_id_key")
        assert result is not None, "Required property 'entity_id_key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value_key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#value_key EvidentlyLaunch#value_key}.'''
        result = self._values.get("value_key")
        assert result is not None, "Required property 'value_key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def event_pattern(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#event_pattern EvidentlyLaunch#event_pattern}.'''
        result = self._values.get("event_pattern")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def unit_label(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#unit_label EvidentlyLaunch#unit_label}.'''
        result = self._values.get("unit_label")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EvidentlyLaunchMetricMonitorsMetricDefinition(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EvidentlyLaunchMetricMonitorsMetricDefinitionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchMetricMonitorsMetricDefinitionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__54d6e2c143939799e6a4b2bc805bb39964554ce1fafb1416c247a7224eab01d4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEventPattern")
    def reset_event_pattern(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEventPattern", []))

    @jsii.member(jsii_name="resetUnitLabel")
    def reset_unit_label(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUnitLabel", []))

    @builtins.property
    @jsii.member(jsii_name="entityIdKeyInput")
    def entity_id_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "entityIdKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="eventPatternInput")
    def event_pattern_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "eventPatternInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="unitLabelInput")
    def unit_label_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "unitLabelInput"))

    @builtins.property
    @jsii.member(jsii_name="valueKeyInput")
    def value_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="entityIdKey")
    def entity_id_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "entityIdKey"))

    @entity_id_key.setter
    def entity_id_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe1c3a83faa1ad4c84e90b89700d744e0ba2c605d3180fc5fe6b9dcc1a9ab534)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "entityIdKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="eventPattern")
    def event_pattern(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "eventPattern"))

    @event_pattern.setter
    def event_pattern(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41410aef0d3e171704993f68f3f380038823d1a41558f2735bae98fbe75eaf08)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "eventPattern", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b35e42f50de0d0030a7784966357e17af343d60ebe68f44f8b5cd215825d275e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="unitLabel")
    def unit_label(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "unitLabel"))

    @unit_label.setter
    def unit_label(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__10eaada03662799f8faf68fa725236898b8ea083a9b30c0cca80c4532e77df12)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "unitLabel", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="valueKey")
    def value_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "valueKey"))

    @value_key.setter
    def value_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67e616c09cb120c97239ce1455c2db6741eb0f4e219109a972dba3652c039562)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "valueKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[EvidentlyLaunchMetricMonitorsMetricDefinition]:
        return typing.cast(typing.Optional[EvidentlyLaunchMetricMonitorsMetricDefinition], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EvidentlyLaunchMetricMonitorsMetricDefinition],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__835dece5370e735d47f1ccd05ebec6ad5f5e60d169d881977ddcd6ebc39c6a00)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class EvidentlyLaunchMetricMonitorsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchMetricMonitorsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__639a13e9418350d856cbf32b9c479d40cf13583b03363c5226cc2746b814a453)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMetricDefinition")
    def put_metric_definition(
        self,
        *,
        entity_id_key: builtins.str,
        name: builtins.str,
        value_key: builtins.str,
        event_pattern: typing.Optional[builtins.str] = None,
        unit_label: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param entity_id_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#entity_id_key EvidentlyLaunch#entity_id_key}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}.
        :param value_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#value_key EvidentlyLaunch#value_key}.
        :param event_pattern: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#event_pattern EvidentlyLaunch#event_pattern}.
        :param unit_label: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#unit_label EvidentlyLaunch#unit_label}.
        '''
        value = EvidentlyLaunchMetricMonitorsMetricDefinition(
            entity_id_key=entity_id_key,
            name=name,
            value_key=value_key,
            event_pattern=event_pattern,
            unit_label=unit_label,
        )

        return typing.cast(None, jsii.invoke(self, "putMetricDefinition", [value]))

    @builtins.property
    @jsii.member(jsii_name="metricDefinition")
    def metric_definition(
        self,
    ) -> EvidentlyLaunchMetricMonitorsMetricDefinitionOutputReference:
        return typing.cast(EvidentlyLaunchMetricMonitorsMetricDefinitionOutputReference, jsii.get(self, "metricDefinition"))

    @builtins.property
    @jsii.member(jsii_name="metricDefinitionInput")
    def metric_definition_input(
        self,
    ) -> typing.Optional[EvidentlyLaunchMetricMonitorsMetricDefinition]:
        return typing.cast(typing.Optional[EvidentlyLaunchMetricMonitorsMetricDefinition], jsii.get(self, "metricDefinitionInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchMetricMonitors]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchMetricMonitors]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchMetricMonitors]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c20e6ea148a69f3cfc8825a91615e913c49169df3e4a58aac7396996c8c18b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfig",
    jsii_struct_bases=[],
    name_mapping={"steps": "steps"},
)
class EvidentlyLaunchScheduledSplitsConfig:
    def __init__(
        self,
        *,
        steps: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchScheduledSplitsConfigSteps", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param steps: steps block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#steps EvidentlyLaunch#steps}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f0b8d443191b51ac6eac5c4c7155df223b4d1c5ef4f20b310519091cd71fc30)
            check_type(argname="argument steps", value=steps, expected_type=type_hints["steps"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "steps": steps,
        }

    @builtins.property
    def steps(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchScheduledSplitsConfigSteps"]]:
        '''steps block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#steps EvidentlyLaunch#steps}
        '''
        result = self._values.get("steps")
        assert result is not None, "Required property 'steps' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchScheduledSplitsConfigSteps"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EvidentlyLaunchScheduledSplitsConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EvidentlyLaunchScheduledSplitsConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bdfa162acb2c37482e21460d01cf3efc049bc4d6b66fd98a1cd3cfa6ca7c2955)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putSteps")
    def put_steps(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchScheduledSplitsConfigSteps", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__954080b7bc284f98ec9cb4b0d35c85f0e9e5c6088b311211a351e728c16e6e8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSteps", [value]))

    @builtins.property
    @jsii.member(jsii_name="steps")
    def steps(self) -> "EvidentlyLaunchScheduledSplitsConfigStepsList":
        return typing.cast("EvidentlyLaunchScheduledSplitsConfigStepsList", jsii.get(self, "steps"))

    @builtins.property
    @jsii.member(jsii_name="stepsInput")
    def steps_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchScheduledSplitsConfigSteps"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchScheduledSplitsConfigSteps"]]], jsii.get(self, "stepsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EvidentlyLaunchScheduledSplitsConfig]:
        return typing.cast(typing.Optional[EvidentlyLaunchScheduledSplitsConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EvidentlyLaunchScheduledSplitsConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b77fd9356209935e2f2ea6952e21e0e8349246c2caeaba362f1f698351419674)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigSteps",
    jsii_struct_bases=[],
    name_mapping={
        "group_weights": "groupWeights",
        "start_time": "startTime",
        "segment_overrides": "segmentOverrides",
    },
)
class EvidentlyLaunchScheduledSplitsConfigSteps:
    def __init__(
        self,
        *,
        group_weights: typing.Mapping[builtins.str, jsii.Number],
        start_time: builtins.str,
        segment_overrides: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param group_weights: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#group_weights EvidentlyLaunch#group_weights}.
        :param start_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#start_time EvidentlyLaunch#start_time}.
        :param segment_overrides: segment_overrides block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#segment_overrides EvidentlyLaunch#segment_overrides}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4869618e21b58c515278ad7527e4fa21a779224d378f9c9c2b5c06519bf55cd)
            check_type(argname="argument group_weights", value=group_weights, expected_type=type_hints["group_weights"])
            check_type(argname="argument start_time", value=start_time, expected_type=type_hints["start_time"])
            check_type(argname="argument segment_overrides", value=segment_overrides, expected_type=type_hints["segment_overrides"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "group_weights": group_weights,
            "start_time": start_time,
        }
        if segment_overrides is not None:
            self._values["segment_overrides"] = segment_overrides

    @builtins.property
    def group_weights(self) -> typing.Mapping[builtins.str, jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#group_weights EvidentlyLaunch#group_weights}.'''
        result = self._values.get("group_weights")
        assert result is not None, "Required property 'group_weights' is missing"
        return typing.cast(typing.Mapping[builtins.str, jsii.Number], result)

    @builtins.property
    def start_time(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#start_time EvidentlyLaunch#start_time}.'''
        result = self._values.get("start_time")
        assert result is not None, "Required property 'start_time' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def segment_overrides(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides"]]]:
        '''segment_overrides block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#segment_overrides EvidentlyLaunch#segment_overrides}
        '''
        result = self._values.get("segment_overrides")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EvidentlyLaunchScheduledSplitsConfigSteps(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EvidentlyLaunchScheduledSplitsConfigStepsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigStepsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ee9d39fa833b62d57d1128981001056a6638eced91f5a9325bec5152afe314de)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "EvidentlyLaunchScheduledSplitsConfigStepsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a36d57a8155990900d0f38f97ba936202d607ade16839ac4ecfc64499358b36)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("EvidentlyLaunchScheduledSplitsConfigStepsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db4b790d5b2d3a6c2c2cd16c76440753569efaf15c020cbbfb426b21a1a1eb20)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5b619e835febce3e22b42b47078cd7a0a8007c385a2c7b5a47f3e6a485f7676c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3b86cf79951a5bbf432cb5b463b17c509ea67d14d18a8cac6edca86850cdb0aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchScheduledSplitsConfigSteps]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchScheduledSplitsConfigSteps]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchScheduledSplitsConfigSteps]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__763de522198029f3a92e4572138861715680283dfcdf944e075001f145286993)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class EvidentlyLaunchScheduledSplitsConfigStepsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigStepsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6e3008cc93dac9a9e64c1fadd10e3fdde39054922d2d3952473903defd55eebf)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putSegmentOverrides")
    def put_segment_overrides(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85171195396ee206b5184efb9601831fc3bbde4718015ac2c5b6a328aa2f9396)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSegmentOverrides", [value]))

    @jsii.member(jsii_name="resetSegmentOverrides")
    def reset_segment_overrides(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSegmentOverrides", []))

    @builtins.property
    @jsii.member(jsii_name="segmentOverrides")
    def segment_overrides(
        self,
    ) -> "EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesList":
        return typing.cast("EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesList", jsii.get(self, "segmentOverrides"))

    @builtins.property
    @jsii.member(jsii_name="groupWeightsInput")
    def group_weights_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, jsii.Number]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, jsii.Number]], jsii.get(self, "groupWeightsInput"))

    @builtins.property
    @jsii.member(jsii_name="segmentOverridesInput")
    def segment_overrides_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides"]]], jsii.get(self, "segmentOverridesInput"))

    @builtins.property
    @jsii.member(jsii_name="startTimeInput")
    def start_time_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="groupWeights")
    def group_weights(self) -> typing.Mapping[builtins.str, jsii.Number]:
        return typing.cast(typing.Mapping[builtins.str, jsii.Number], jsii.get(self, "groupWeights"))

    @group_weights.setter
    def group_weights(self, value: typing.Mapping[builtins.str, jsii.Number]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06383f89ecf94633ce2d14b4c84e8dafbc8e2efeb1f946a1870872abfca245f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "groupWeights", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startTime")
    def start_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startTime"))

    @start_time.setter
    def start_time(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0302f03ef7ce1240f8c5b36b4993692f42c63560c56a8d28f0e5a1f32f46024b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startTime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchScheduledSplitsConfigSteps]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchScheduledSplitsConfigSteps]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchScheduledSplitsConfigSteps]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__208a81a1b8540bd82411fbcc255c627636f19a48e2348d218495b7d6b4cbc0bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides",
    jsii_struct_bases=[],
    name_mapping={
        "evaluation_order": "evaluationOrder",
        "segment": "segment",
        "weights": "weights",
    },
)
class EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides:
    def __init__(
        self,
        *,
        evaluation_order: jsii.Number,
        segment: builtins.str,
        weights: typing.Mapping[builtins.str, jsii.Number],
    ) -> None:
        '''
        :param evaluation_order: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#evaluation_order EvidentlyLaunch#evaluation_order}.
        :param segment: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#segment EvidentlyLaunch#segment}.
        :param weights: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#weights EvidentlyLaunch#weights}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c1780e6f442bd1911eecd9900a3b0a329491b7d1a73e5b5c22cb3514c1778eb)
            check_type(argname="argument evaluation_order", value=evaluation_order, expected_type=type_hints["evaluation_order"])
            check_type(argname="argument segment", value=segment, expected_type=type_hints["segment"])
            check_type(argname="argument weights", value=weights, expected_type=type_hints["weights"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "evaluation_order": evaluation_order,
            "segment": segment,
            "weights": weights,
        }

    @builtins.property
    def evaluation_order(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#evaluation_order EvidentlyLaunch#evaluation_order}.'''
        result = self._values.get("evaluation_order")
        assert result is not None, "Required property 'evaluation_order' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def segment(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#segment EvidentlyLaunch#segment}.'''
        result = self._values.get("segment")
        assert result is not None, "Required property 'segment' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def weights(self) -> typing.Mapping[builtins.str, jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#weights EvidentlyLaunch#weights}.'''
        result = self._values.get("weights")
        assert result is not None, "Required property 'weights' is missing"
        return typing.cast(typing.Mapping[builtins.str, jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f608e1845a662dece63892faa5820e3a0feb9e14ac397bceed950dd5f40f1eed)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5aba95049d1fba34f92d48c921106f83c588015f1139c2f1c999309a936c24ab)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84116073888d2b408a6ae044a1a6a752bc831a0af8a27e1f5382a13239280871)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4c78aec9ed39e3d911aa56ff842455f2ec679d76771f26aa4766d23aa66af6a2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__62a067db3c275fe6f3dbecc2e89cf178007477106d2d0f3fc25af7e9255c5374)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7af46e2280a6dddbfbec1028e5eb6fac4dd5098ac223ca58a47e8a3f9b8dcb7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d46dac2fa345ce1706b5eb734aa2303e7a0aa8d3903b392d1552f85e55dc94a5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="evaluationOrderInput")
    def evaluation_order_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "evaluationOrderInput"))

    @builtins.property
    @jsii.member(jsii_name="segmentInput")
    def segment_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "segmentInput"))

    @builtins.property
    @jsii.member(jsii_name="weightsInput")
    def weights_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, jsii.Number]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, jsii.Number]], jsii.get(self, "weightsInput"))

    @builtins.property
    @jsii.member(jsii_name="evaluationOrder")
    def evaluation_order(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "evaluationOrder"))

    @evaluation_order.setter
    def evaluation_order(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9410ab59b3bea886bfdb364f9fc98a31421bc4c6198d43d11392d4c98536262)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "evaluationOrder", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="segment")
    def segment(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "segment"))

    @segment.setter
    def segment(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db76a2ca0a151bb691ba9573f4dc63f652db90fc57f8a0835cff8a433cc27ae4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "segment", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="weights")
    def weights(self) -> typing.Mapping[builtins.str, jsii.Number]:
        return typing.cast(typing.Mapping[builtins.str, jsii.Number], jsii.get(self, "weights"))

    @weights.setter
    def weights(self, value: typing.Mapping[builtins.str, jsii.Number]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af4ec5a1dc9b50ec06d2bb9d85b04c36ec8db1c7e8e8a003aeb6098a7fe65324)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "weights", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b8cabe955d858b27998827e34ec2327856615f5750b13d2fa98cc004b72ce0c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class EvidentlyLaunchTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#create EvidentlyLaunch#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#delete EvidentlyLaunch#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#update EvidentlyLaunch#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2aef9b367a5155d2d9224743d4be0475254fd3b99431b25e73213b9381eafba3)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#create EvidentlyLaunch#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#delete EvidentlyLaunch#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#update EvidentlyLaunch#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EvidentlyLaunchTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EvidentlyLaunchTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.evidentlyLaunch.EvidentlyLaunchTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a2c7e42cb6613551be71d33410335916e96c444175209f4c7794cc6b444c77bb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__044b5cfdf4303dda336de055e5a089d839953562f5ec54300c0169cef369cbfd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5538a02bcbd626376c3e2543fa11d6c5d53b605331a593b0ba10963ab659b249)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7c5bc4fa0d062839fd727b16433c6e92e9b77a585e111c37f01010df8992a94b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3eb5b9ca7750a103a96efe6453f0f5da66f02be6ace578c4fa79e0db68f3e583)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "EvidentlyLaunch",
    "EvidentlyLaunchConfig",
    "EvidentlyLaunchExecution",
    "EvidentlyLaunchExecutionList",
    "EvidentlyLaunchExecutionOutputReference",
    "EvidentlyLaunchGroups",
    "EvidentlyLaunchGroupsList",
    "EvidentlyLaunchGroupsOutputReference",
    "EvidentlyLaunchMetricMonitors",
    "EvidentlyLaunchMetricMonitorsList",
    "EvidentlyLaunchMetricMonitorsMetricDefinition",
    "EvidentlyLaunchMetricMonitorsMetricDefinitionOutputReference",
    "EvidentlyLaunchMetricMonitorsOutputReference",
    "EvidentlyLaunchScheduledSplitsConfig",
    "EvidentlyLaunchScheduledSplitsConfigOutputReference",
    "EvidentlyLaunchScheduledSplitsConfigSteps",
    "EvidentlyLaunchScheduledSplitsConfigStepsList",
    "EvidentlyLaunchScheduledSplitsConfigStepsOutputReference",
    "EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides",
    "EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesList",
    "EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesOutputReference",
    "EvidentlyLaunchTimeouts",
    "EvidentlyLaunchTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__67a80bcd78196faef3ef252a78b53c59be50a548c1e3ac8a9faefb154625a42d(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    groups: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[EvidentlyLaunchGroups, typing.Dict[builtins.str, typing.Any]]]],
    name: builtins.str,
    project: builtins.str,
    description: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    metric_monitors: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[EvidentlyLaunchMetricMonitors, typing.Dict[builtins.str, typing.Any]]]]] = None,
    randomization_salt: typing.Optional[builtins.str] = None,
    scheduled_splits_config: typing.Optional[typing.Union[EvidentlyLaunchScheduledSplitsConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[EvidentlyLaunchTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__ee81d161b85aa5884b14f9389b281e77e2afa655f917aad3ba668be4bff231e8(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6ee930717591bb1669fc1dffe183eb0241459ef46e15604cbb83bec1f615902(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[EvidentlyLaunchGroups, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__227e31a12d66b1927e950d53a2363eaae867c56850ef41addd8774ae28762e77(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[EvidentlyLaunchMetricMonitors, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fe64c95287b1ca417e14889f8d81d5fe02bf58621c45123bf6cbe2ead005eb2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__842c5137b9841da60397b2169e473f8ca7475c731bbc3b5fff201afe3185580d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f51097a5908f283cd82feb409fece67fd2c0971364ec5dbc675923a289e8462f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5dd932c9603ac3208905b02480e4160fc91b35c3f02078268a8d82e0a09b46ac(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb24bd91c40c6f2f2ef07bcb0f1748ea0928848465353b87c64734bf507494c4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__faec061fc1b309ed2217a332548051115d50584bb6636581a48c554fd0519a3c(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3097889382abf119bafc6ba294a2cea441d2f0abe6eaa23a1f3e8ad61742a36b(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd8ec2ee3e1864fdc0871a8f769130080e4b7e04f92917d2d55d38b1f315c439(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    groups: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[EvidentlyLaunchGroups, typing.Dict[builtins.str, typing.Any]]]],
    name: builtins.str,
    project: builtins.str,
    description: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    metric_monitors: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[EvidentlyLaunchMetricMonitors, typing.Dict[builtins.str, typing.Any]]]]] = None,
    randomization_salt: typing.Optional[builtins.str] = None,
    scheduled_splits_config: typing.Optional[typing.Union[EvidentlyLaunchScheduledSplitsConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[EvidentlyLaunchTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84fb851905ed70bebf182fd749c7d9c2fbd96c6598b0c8d7b87a8a9d639c4cda(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__688ba5730608cc78bd9c09696861136c343a64149a628b89533aeb173a90c4e8(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c3bffc0e31d3bd7c03c2c427f2fbbebf8ac923e350b6bd4f439a931f1d4329f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46713097cfa36fdee5d1d7910c4842e3ffd1db54308727fec4def957d9180a9f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca7679fbe10cd8e276513039a715502b87146a82e2be9dafa79166361f3267c2(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3789dfbe8fab4a8a227fd000328e975593877325febcbc80a5ba10acdbd52231(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__286504fa5498db447ba166405fc68488d724b16a4a3a4acec221cd627c6d695b(
    value: typing.Optional[EvidentlyLaunchExecution],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f000e68b51581c530ca1a1621916a2024a3312718ce5c83a294fb05e994c1d27(
    *,
    feature: builtins.str,
    name: builtins.str,
    variation: builtins.str,
    description: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5576544084dffc63ef2abb9dbcfe2ab8d5eaac8da471f356a18a2e04abfc8162(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e77225008a2bb05b47d595bc98992fa3d8c0547c11239dfc6ca75d026ecd9bb(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72ddc1a29ff8c2c379ef203e80e4e36278ae6b60d611c93bb4fbb5c10b5ca1f2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1dc2a8bf876586184f74f540d96c5ae65edaf484e3f6fd0a1a44c0b6bc220901(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__975734df96e81fc49b9dc27afc47f0bb9bfc7eeebdb96c995aefc83a0fc1a571(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cfc1fcf9b4a5193dfb80236fba88a082694fced8ab5a2616f012d6ce51ff7968(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchGroups]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afaa3725dfd405a415e3b10f1521b01b06a6ae54bda84a33cac71972079ac46c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a780f3a34ec7aad7c01c2d074cda106e0478b38c175f8a2e739abcdf529babd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5030d5fc38ab8dd214c695deb304594e5d00cc3e4568da08723ead2eac8a444(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8bb0bd243f838faec2fbc1fbf6ef5793d8b8638761e98b2fed551847e2963b8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a99c1095531ec4b51d61b9d366d6d6521b1fd22d1bba3c2451fc5ce628e22b65(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a270ac31b8f84338ffac55b16258e0bf001ce45ce893ccfc87397605e29f541a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchGroups]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94d874acacf825827b94b4354a376618c1e3206e7d14ca0d19df4e0268af6a29(
    *,
    metric_definition: typing.Union[EvidentlyLaunchMetricMonitorsMetricDefinition, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0c2f01750d965c3a27ae568ee8c5c82914e981e75e5382b45a625f71f20b6e4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd6d4623bd18abf1319203fbfe043d0c71eb2ebd911bf8469545c15a58ea3051(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__147df3c063e37bb627a59c7a0c4fa502de20c7cd8ff7f8eaf9b8b41750ad5437(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1610b7d38b629467657b5338e75fdc42d414bd2ce41aa4df4864484d919f5fca(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c2ddbe9276851cf631dd6bc86bb509a01e06a18e7a37d681da0dc21ac1e3197(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8de9a17524f3595258a5f1c36006b5f8553aa371a7fa9c6a7722f6e7f16bfd44(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchMetricMonitors]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ea1fbd3cbf26475c19b731e2cb8815c210a4e8de12fe20fcd4c7802fdd32118(
    *,
    entity_id_key: builtins.str,
    name: builtins.str,
    value_key: builtins.str,
    event_pattern: typing.Optional[builtins.str] = None,
    unit_label: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54d6e2c143939799e6a4b2bc805bb39964554ce1fafb1416c247a7224eab01d4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe1c3a83faa1ad4c84e90b89700d744e0ba2c605d3180fc5fe6b9dcc1a9ab534(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41410aef0d3e171704993f68f3f380038823d1a41558f2735bae98fbe75eaf08(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b35e42f50de0d0030a7784966357e17af343d60ebe68f44f8b5cd215825d275e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10eaada03662799f8faf68fa725236898b8ea083a9b30c0cca80c4532e77df12(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67e616c09cb120c97239ce1455c2db6741eb0f4e219109a972dba3652c039562(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__835dece5370e735d47f1ccd05ebec6ad5f5e60d169d881977ddcd6ebc39c6a00(
    value: typing.Optional[EvidentlyLaunchMetricMonitorsMetricDefinition],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__639a13e9418350d856cbf32b9c479d40cf13583b03363c5226cc2746b814a453(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c20e6ea148a69f3cfc8825a91615e913c49169df3e4a58aac7396996c8c18b4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchMetricMonitors]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f0b8d443191b51ac6eac5c4c7155df223b4d1c5ef4f20b310519091cd71fc30(
    *,
    steps: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[EvidentlyLaunchScheduledSplitsConfigSteps, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdfa162acb2c37482e21460d01cf3efc049bc4d6b66fd98a1cd3cfa6ca7c2955(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__954080b7bc284f98ec9cb4b0d35c85f0e9e5c6088b311211a351e728c16e6e8c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[EvidentlyLaunchScheduledSplitsConfigSteps, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b77fd9356209935e2f2ea6952e21e0e8349246c2caeaba362f1f698351419674(
    value: typing.Optional[EvidentlyLaunchScheduledSplitsConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4869618e21b58c515278ad7527e4fa21a779224d378f9c9c2b5c06519bf55cd(
    *,
    group_weights: typing.Mapping[builtins.str, jsii.Number],
    start_time: builtins.str,
    segment_overrides: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee9d39fa833b62d57d1128981001056a6638eced91f5a9325bec5152afe314de(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a36d57a8155990900d0f38f97ba936202d607ade16839ac4ecfc64499358b36(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db4b790d5b2d3a6c2c2cd16c76440753569efaf15c020cbbfb426b21a1a1eb20(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b619e835febce3e22b42b47078cd7a0a8007c385a2c7b5a47f3e6a485f7676c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b86cf79951a5bbf432cb5b463b17c509ea67d14d18a8cac6edca86850cdb0aa(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__763de522198029f3a92e4572138861715680283dfcdf944e075001f145286993(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchScheduledSplitsConfigSteps]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e3008cc93dac9a9e64c1fadd10e3fdde39054922d2d3952473903defd55eebf(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85171195396ee206b5184efb9601831fc3bbde4718015ac2c5b6a328aa2f9396(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06383f89ecf94633ce2d14b4c84e8dafbc8e2efeb1f946a1870872abfca245f4(
    value: typing.Mapping[builtins.str, jsii.Number],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0302f03ef7ce1240f8c5b36b4993692f42c63560c56a8d28f0e5a1f32f46024b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__208a81a1b8540bd82411fbcc255c627636f19a48e2348d218495b7d6b4cbc0bc(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchScheduledSplitsConfigSteps]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c1780e6f442bd1911eecd9900a3b0a329491b7d1a73e5b5c22cb3514c1778eb(
    *,
    evaluation_order: jsii.Number,
    segment: builtins.str,
    weights: typing.Mapping[builtins.str, jsii.Number],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f608e1845a662dece63892faa5820e3a0feb9e14ac397bceed950dd5f40f1eed(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5aba95049d1fba34f92d48c921106f83c588015f1139c2f1c999309a936c24ab(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84116073888d2b408a6ae044a1a6a752bc831a0af8a27e1f5382a13239280871(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c78aec9ed39e3d911aa56ff842455f2ec679d76771f26aa4766d23aa66af6a2(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62a067db3c275fe6f3dbecc2e89cf178007477106d2d0f3fc25af7e9255c5374(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7af46e2280a6dddbfbec1028e5eb6fac4dd5098ac223ca58a47e8a3f9b8dcb7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d46dac2fa345ce1706b5eb734aa2303e7a0aa8d3903b392d1552f85e55dc94a5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9410ab59b3bea886bfdb364f9fc98a31421bc4c6198d43d11392d4c98536262(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db76a2ca0a151bb691ba9573f4dc63f652db90fc57f8a0835cff8a433cc27ae4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af4ec5a1dc9b50ec06d2bb9d85b04c36ec8db1c7e8e8a003aeb6098a7fe65324(
    value: typing.Mapping[builtins.str, jsii.Number],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b8cabe955d858b27998827e34ec2327856615f5750b13d2fa98cc004b72ce0c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2aef9b367a5155d2d9224743d4be0475254fd3b99431b25e73213b9381eafba3(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2c7e42cb6613551be71d33410335916e96c444175209f4c7794cc6b444c77bb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__044b5cfdf4303dda336de055e5a089d839953562f5ec54300c0169cef369cbfd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5538a02bcbd626376c3e2543fa11d6c5d53b605331a593b0ba10963ab659b249(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c5bc4fa0d062839fd727b16433c6e92e9b77a585e111c37f01010df8992a94b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3eb5b9ca7750a103a96efe6453f0f5da66f02be6ace578c4fa79e0db68f3e583(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EvidentlyLaunchTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
