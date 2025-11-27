r'''
# `aws_datasync_task`

Refer to the Terraform Registry for docs: [`aws_datasync_task`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task).
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


class DatasyncTask(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.datasyncTask.DatasyncTask",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task aws_datasync_task}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        destination_location_arn: builtins.str,
        source_location_arn: builtins.str,
        cloudwatch_log_group_arn: typing.Optional[builtins.str] = None,
        excludes: typing.Optional[typing.Union["DatasyncTaskExcludes", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        includes: typing.Optional[typing.Union["DatasyncTaskIncludes", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        options: typing.Optional[typing.Union["DatasyncTaskOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        schedule: typing.Optional[typing.Union["DatasyncTaskSchedule", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        task_mode: typing.Optional[builtins.str] = None,
        task_report_config: typing.Optional[typing.Union["DatasyncTaskTaskReportConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        timeouts: typing.Optional[typing.Union["DatasyncTaskTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task aws_datasync_task} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param destination_location_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#destination_location_arn DatasyncTask#destination_location_arn}.
        :param source_location_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#source_location_arn DatasyncTask#source_location_arn}.
        :param cloudwatch_log_group_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#cloudwatch_log_group_arn DatasyncTask#cloudwatch_log_group_arn}.
        :param excludes: excludes block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#excludes DatasyncTask#excludes}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#id DatasyncTask#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param includes: includes block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#includes DatasyncTask#includes}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#name DatasyncTask#name}.
        :param options: options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#options DatasyncTask#options}
        :param schedule: schedule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#schedule DatasyncTask#schedule}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags DatasyncTask#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags_all DatasyncTask#tags_all}.
        :param task_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_mode DatasyncTask#task_mode}.
        :param task_report_config: task_report_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_report_config DatasyncTask#task_report_config}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#timeouts DatasyncTask#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5b8b79116cca1937f0f72b31916a5e81edc09cf021dd38135718533a95f1cb5)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = DatasyncTaskConfig(
            destination_location_arn=destination_location_arn,
            source_location_arn=source_location_arn,
            cloudwatch_log_group_arn=cloudwatch_log_group_arn,
            excludes=excludes,
            id=id,
            includes=includes,
            name=name,
            options=options,
            schedule=schedule,
            tags=tags,
            tags_all=tags_all,
            task_mode=task_mode,
            task_report_config=task_report_config,
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
        '''Generates CDKTF code for importing a DatasyncTask resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the DatasyncTask to import.
        :param import_from_id: The id of the existing DatasyncTask that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the DatasyncTask to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3fbd4c09c4a61fe7e633b8c7974442643525728927909c0d4863bc7b00d540c1)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putExcludes")
    def put_excludes(
        self,
        *,
        filter_type: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param filter_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#filter_type DatasyncTask#filter_type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#value DatasyncTask#value}.
        '''
        value_ = DatasyncTaskExcludes(filter_type=filter_type, value=value)

        return typing.cast(None, jsii.invoke(self, "putExcludes", [value_]))

    @jsii.member(jsii_name="putIncludes")
    def put_includes(
        self,
        *,
        filter_type: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param filter_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#filter_type DatasyncTask#filter_type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#value DatasyncTask#value}.
        '''
        value_ = DatasyncTaskIncludes(filter_type=filter_type, value=value)

        return typing.cast(None, jsii.invoke(self, "putIncludes", [value_]))

    @jsii.member(jsii_name="putOptions")
    def put_options(
        self,
        *,
        atime: typing.Optional[builtins.str] = None,
        bytes_per_second: typing.Optional[jsii.Number] = None,
        gid: typing.Optional[builtins.str] = None,
        log_level: typing.Optional[builtins.str] = None,
        mtime: typing.Optional[builtins.str] = None,
        object_tags: typing.Optional[builtins.str] = None,
        overwrite_mode: typing.Optional[builtins.str] = None,
        posix_permissions: typing.Optional[builtins.str] = None,
        preserve_deleted_files: typing.Optional[builtins.str] = None,
        preserve_devices: typing.Optional[builtins.str] = None,
        security_descriptor_copy_flags: typing.Optional[builtins.str] = None,
        task_queueing: typing.Optional[builtins.str] = None,
        transfer_mode: typing.Optional[builtins.str] = None,
        uid: typing.Optional[builtins.str] = None,
        verify_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param atime: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#atime DatasyncTask#atime}.
        :param bytes_per_second: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#bytes_per_second DatasyncTask#bytes_per_second}.
        :param gid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#gid DatasyncTask#gid}.
        :param log_level: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#log_level DatasyncTask#log_level}.
        :param mtime: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#mtime DatasyncTask#mtime}.
        :param object_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#object_tags DatasyncTask#object_tags}.
        :param overwrite_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#overwrite_mode DatasyncTask#overwrite_mode}.
        :param posix_permissions: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#posix_permissions DatasyncTask#posix_permissions}.
        :param preserve_deleted_files: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#preserve_deleted_files DatasyncTask#preserve_deleted_files}.
        :param preserve_devices: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#preserve_devices DatasyncTask#preserve_devices}.
        :param security_descriptor_copy_flags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#security_descriptor_copy_flags DatasyncTask#security_descriptor_copy_flags}.
        :param task_queueing: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_queueing DatasyncTask#task_queueing}.
        :param transfer_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#transfer_mode DatasyncTask#transfer_mode}.
        :param uid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#uid DatasyncTask#uid}.
        :param verify_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#verify_mode DatasyncTask#verify_mode}.
        '''
        value = DatasyncTaskOptions(
            atime=atime,
            bytes_per_second=bytes_per_second,
            gid=gid,
            log_level=log_level,
            mtime=mtime,
            object_tags=object_tags,
            overwrite_mode=overwrite_mode,
            posix_permissions=posix_permissions,
            preserve_deleted_files=preserve_deleted_files,
            preserve_devices=preserve_devices,
            security_descriptor_copy_flags=security_descriptor_copy_flags,
            task_queueing=task_queueing,
            transfer_mode=transfer_mode,
            uid=uid,
            verify_mode=verify_mode,
        )

        return typing.cast(None, jsii.invoke(self, "putOptions", [value]))

    @jsii.member(jsii_name="putSchedule")
    def put_schedule(self, *, schedule_expression: builtins.str) -> None:
        '''
        :param schedule_expression: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#schedule_expression DatasyncTask#schedule_expression}.
        '''
        value = DatasyncTaskSchedule(schedule_expression=schedule_expression)

        return typing.cast(None, jsii.invoke(self, "putSchedule", [value]))

    @jsii.member(jsii_name="putTaskReportConfig")
    def put_task_report_config(
        self,
        *,
        s3_destination: typing.Union["DatasyncTaskTaskReportConfigS3Destination", typing.Dict[builtins.str, typing.Any]],
        output_type: typing.Optional[builtins.str] = None,
        report_level: typing.Optional[builtins.str] = None,
        report_overrides: typing.Optional[typing.Union["DatasyncTaskTaskReportConfigReportOverrides", typing.Dict[builtins.str, typing.Any]]] = None,
        s3_object_versioning: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_destination: s3_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_destination DatasyncTask#s3_destination}
        :param output_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#output_type DatasyncTask#output_type}.
        :param report_level: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#report_level DatasyncTask#report_level}.
        :param report_overrides: report_overrides block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#report_overrides DatasyncTask#report_overrides}
        :param s3_object_versioning: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_object_versioning DatasyncTask#s3_object_versioning}.
        '''
        value = DatasyncTaskTaskReportConfig(
            s3_destination=s3_destination,
            output_type=output_type,
            report_level=report_level,
            report_overrides=report_overrides,
            s3_object_versioning=s3_object_versioning,
        )

        return typing.cast(None, jsii.invoke(self, "putTaskReportConfig", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(self, *, create: typing.Optional[builtins.str] = None) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#create DatasyncTask#create}.
        '''
        value = DatasyncTaskTimeouts(create=create)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetCloudwatchLogGroupArn")
    def reset_cloudwatch_log_group_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCloudwatchLogGroupArn", []))

    @jsii.member(jsii_name="resetExcludes")
    def reset_excludes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExcludes", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetIncludes")
    def reset_includes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIncludes", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetOptions")
    def reset_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOptions", []))

    @jsii.member(jsii_name="resetSchedule")
    def reset_schedule(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSchedule", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTaskMode")
    def reset_task_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTaskMode", []))

    @jsii.member(jsii_name="resetTaskReportConfig")
    def reset_task_report_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTaskReportConfig", []))

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
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> "DatasyncTaskExcludesOutputReference":
        return typing.cast("DatasyncTaskExcludesOutputReference", jsii.get(self, "excludes"))

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> "DatasyncTaskIncludesOutputReference":
        return typing.cast("DatasyncTaskIncludesOutputReference", jsii.get(self, "includes"))

    @builtins.property
    @jsii.member(jsii_name="options")
    def options(self) -> "DatasyncTaskOptionsOutputReference":
        return typing.cast("DatasyncTaskOptionsOutputReference", jsii.get(self, "options"))

    @builtins.property
    @jsii.member(jsii_name="schedule")
    def schedule(self) -> "DatasyncTaskScheduleOutputReference":
        return typing.cast("DatasyncTaskScheduleOutputReference", jsii.get(self, "schedule"))

    @builtins.property
    @jsii.member(jsii_name="taskReportConfig")
    def task_report_config(self) -> "DatasyncTaskTaskReportConfigOutputReference":
        return typing.cast("DatasyncTaskTaskReportConfigOutputReference", jsii.get(self, "taskReportConfig"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "DatasyncTaskTimeoutsOutputReference":
        return typing.cast("DatasyncTaskTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchLogGroupArnInput")
    def cloudwatch_log_group_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cloudwatchLogGroupArnInput"))

    @builtins.property
    @jsii.member(jsii_name="destinationLocationArnInput")
    def destination_location_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "destinationLocationArnInput"))

    @builtins.property
    @jsii.member(jsii_name="excludesInput")
    def excludes_input(self) -> typing.Optional["DatasyncTaskExcludes"]:
        return typing.cast(typing.Optional["DatasyncTaskExcludes"], jsii.get(self, "excludesInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="includesInput")
    def includes_input(self) -> typing.Optional["DatasyncTaskIncludes"]:
        return typing.cast(typing.Optional["DatasyncTaskIncludes"], jsii.get(self, "includesInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="optionsInput")
    def options_input(self) -> typing.Optional["DatasyncTaskOptions"]:
        return typing.cast(typing.Optional["DatasyncTaskOptions"], jsii.get(self, "optionsInput"))

    @builtins.property
    @jsii.member(jsii_name="scheduleInput")
    def schedule_input(self) -> typing.Optional["DatasyncTaskSchedule"]:
        return typing.cast(typing.Optional["DatasyncTaskSchedule"], jsii.get(self, "scheduleInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceLocationArnInput")
    def source_location_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceLocationArnInput"))

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
    @jsii.member(jsii_name="taskModeInput")
    def task_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "taskModeInput"))

    @builtins.property
    @jsii.member(jsii_name="taskReportConfigInput")
    def task_report_config_input(
        self,
    ) -> typing.Optional["DatasyncTaskTaskReportConfig"]:
        return typing.cast(typing.Optional["DatasyncTaskTaskReportConfig"], jsii.get(self, "taskReportConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "DatasyncTaskTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "DatasyncTaskTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchLogGroupArn")
    def cloudwatch_log_group_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "cloudwatchLogGroupArn"))

    @cloudwatch_log_group_arn.setter
    def cloudwatch_log_group_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2800008244101c710d15d609e43b8e1e408ef1164d4e5486419c89ee60fcf480)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cloudwatchLogGroupArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="destinationLocationArn")
    def destination_location_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "destinationLocationArn"))

    @destination_location_arn.setter
    def destination_location_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__057f581d65544921542414865f83c49f7be94e8b772389b7b4eaa04c8fb8caa4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "destinationLocationArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e04d2eed46035b04d621613c120c09f3a32e8466a662bec558d6b108c03cc047)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bbec083e9ed4ef4afc2cf7911b5418cf94569560d547eff128663d7d1ede89c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sourceLocationArn")
    def source_location_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceLocationArn"))

    @source_location_arn.setter
    def source_location_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c2edd19325fb2176a967acbad6604e7fa58baf8e1a0ec825e6f2255723c898c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceLocationArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b34432299f4b71d6ef7605eaeed4ceb6392eb8ef17511a2cd2bbd250b981a627)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d48567d7709160c315732f558341134cc4745490aa3d913402b426381c83deaa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="taskMode")
    def task_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "taskMode"))

    @task_mode.setter
    def task_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fadde604f190c66fb5fc2b122f339a1fadd0aabfd5c3dba659a65089e356a63a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "taskMode", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.datasyncTask.DatasyncTaskConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "destination_location_arn": "destinationLocationArn",
        "source_location_arn": "sourceLocationArn",
        "cloudwatch_log_group_arn": "cloudwatchLogGroupArn",
        "excludes": "excludes",
        "id": "id",
        "includes": "includes",
        "name": "name",
        "options": "options",
        "schedule": "schedule",
        "tags": "tags",
        "tags_all": "tagsAll",
        "task_mode": "taskMode",
        "task_report_config": "taskReportConfig",
        "timeouts": "timeouts",
    },
)
class DatasyncTaskConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        destination_location_arn: builtins.str,
        source_location_arn: builtins.str,
        cloudwatch_log_group_arn: typing.Optional[builtins.str] = None,
        excludes: typing.Optional[typing.Union["DatasyncTaskExcludes", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        includes: typing.Optional[typing.Union["DatasyncTaskIncludes", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        options: typing.Optional[typing.Union["DatasyncTaskOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        schedule: typing.Optional[typing.Union["DatasyncTaskSchedule", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        task_mode: typing.Optional[builtins.str] = None,
        task_report_config: typing.Optional[typing.Union["DatasyncTaskTaskReportConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        timeouts: typing.Optional[typing.Union["DatasyncTaskTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param destination_location_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#destination_location_arn DatasyncTask#destination_location_arn}.
        :param source_location_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#source_location_arn DatasyncTask#source_location_arn}.
        :param cloudwatch_log_group_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#cloudwatch_log_group_arn DatasyncTask#cloudwatch_log_group_arn}.
        :param excludes: excludes block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#excludes DatasyncTask#excludes}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#id DatasyncTask#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param includes: includes block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#includes DatasyncTask#includes}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#name DatasyncTask#name}.
        :param options: options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#options DatasyncTask#options}
        :param schedule: schedule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#schedule DatasyncTask#schedule}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags DatasyncTask#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags_all DatasyncTask#tags_all}.
        :param task_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_mode DatasyncTask#task_mode}.
        :param task_report_config: task_report_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_report_config DatasyncTask#task_report_config}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#timeouts DatasyncTask#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(excludes, dict):
            excludes = DatasyncTaskExcludes(**excludes)
        if isinstance(includes, dict):
            includes = DatasyncTaskIncludes(**includes)
        if isinstance(options, dict):
            options = DatasyncTaskOptions(**options)
        if isinstance(schedule, dict):
            schedule = DatasyncTaskSchedule(**schedule)
        if isinstance(task_report_config, dict):
            task_report_config = DatasyncTaskTaskReportConfig(**task_report_config)
        if isinstance(timeouts, dict):
            timeouts = DatasyncTaskTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a0518ddbb46d6dfdab5629b1b9c382ad512b0d2122961a5fab8b042a5b2905ca)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument destination_location_arn", value=destination_location_arn, expected_type=type_hints["destination_location_arn"])
            check_type(argname="argument source_location_arn", value=source_location_arn, expected_type=type_hints["source_location_arn"])
            check_type(argname="argument cloudwatch_log_group_arn", value=cloudwatch_log_group_arn, expected_type=type_hints["cloudwatch_log_group_arn"])
            check_type(argname="argument excludes", value=excludes, expected_type=type_hints["excludes"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument includes", value=includes, expected_type=type_hints["includes"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument options", value=options, expected_type=type_hints["options"])
            check_type(argname="argument schedule", value=schedule, expected_type=type_hints["schedule"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument task_mode", value=task_mode, expected_type=type_hints["task_mode"])
            check_type(argname="argument task_report_config", value=task_report_config, expected_type=type_hints["task_report_config"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "destination_location_arn": destination_location_arn,
            "source_location_arn": source_location_arn,
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
        if cloudwatch_log_group_arn is not None:
            self._values["cloudwatch_log_group_arn"] = cloudwatch_log_group_arn
        if excludes is not None:
            self._values["excludes"] = excludes
        if id is not None:
            self._values["id"] = id
        if includes is not None:
            self._values["includes"] = includes
        if name is not None:
            self._values["name"] = name
        if options is not None:
            self._values["options"] = options
        if schedule is not None:
            self._values["schedule"] = schedule
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if task_mode is not None:
            self._values["task_mode"] = task_mode
        if task_report_config is not None:
            self._values["task_report_config"] = task_report_config
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
    def destination_location_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#destination_location_arn DatasyncTask#destination_location_arn}.'''
        result = self._values.get("destination_location_arn")
        assert result is not None, "Required property 'destination_location_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def source_location_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#source_location_arn DatasyncTask#source_location_arn}.'''
        result = self._values.get("source_location_arn")
        assert result is not None, "Required property 'source_location_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def cloudwatch_log_group_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#cloudwatch_log_group_arn DatasyncTask#cloudwatch_log_group_arn}.'''
        result = self._values.get("cloudwatch_log_group_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def excludes(self) -> typing.Optional["DatasyncTaskExcludes"]:
        '''excludes block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#excludes DatasyncTask#excludes}
        '''
        result = self._values.get("excludes")
        return typing.cast(typing.Optional["DatasyncTaskExcludes"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#id DatasyncTask#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def includes(self) -> typing.Optional["DatasyncTaskIncludes"]:
        '''includes block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#includes DatasyncTask#includes}
        '''
        result = self._values.get("includes")
        return typing.cast(typing.Optional["DatasyncTaskIncludes"], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#name DatasyncTask#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def options(self) -> typing.Optional["DatasyncTaskOptions"]:
        '''options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#options DatasyncTask#options}
        '''
        result = self._values.get("options")
        return typing.cast(typing.Optional["DatasyncTaskOptions"], result)

    @builtins.property
    def schedule(self) -> typing.Optional["DatasyncTaskSchedule"]:
        '''schedule block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#schedule DatasyncTask#schedule}
        '''
        result = self._values.get("schedule")
        return typing.cast(typing.Optional["DatasyncTaskSchedule"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags DatasyncTask#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags_all DatasyncTask#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def task_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_mode DatasyncTask#task_mode}.'''
        result = self._values.get("task_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def task_report_config(self) -> typing.Optional["DatasyncTaskTaskReportConfig"]:
        '''task_report_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_report_config DatasyncTask#task_report_config}
        '''
        result = self._values.get("task_report_config")
        return typing.cast(typing.Optional["DatasyncTaskTaskReportConfig"], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["DatasyncTaskTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#timeouts DatasyncTask#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["DatasyncTaskTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DatasyncTaskConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.datasyncTask.DatasyncTaskExcludes",
    jsii_struct_bases=[],
    name_mapping={"filter_type": "filterType", "value": "value"},
)
class DatasyncTaskExcludes:
    def __init__(
        self,
        *,
        filter_type: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param filter_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#filter_type DatasyncTask#filter_type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#value DatasyncTask#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b721d94112a215459c04e2ba7ae65f2989b6f32a8fcce454d7e6d1a41434df92)
            check_type(argname="argument filter_type", value=filter_type, expected_type=type_hints["filter_type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if filter_type is not None:
            self._values["filter_type"] = filter_type
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def filter_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#filter_type DatasyncTask#filter_type}.'''
        result = self._values.get("filter_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#value DatasyncTask#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DatasyncTaskExcludes(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DatasyncTaskExcludesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.datasyncTask.DatasyncTaskExcludesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__068084be6c898c85db64addbf7de8ab7d90b466326f704b1cef1ad4e6a8542a4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetFilterType")
    def reset_filter_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilterType", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="filterTypeInput")
    def filter_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "filterTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="filterType")
    def filter_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "filterType"))

    @filter_type.setter
    def filter_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2cdd66e205798de86a335c14de891a42fc182820ad162eb8269f39dd2f3aea78)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "filterType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9e8220d162126e0f5f084f31ae4d27b82337f463a1078b436956b0cb7d7ca0ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[DatasyncTaskExcludes]:
        return typing.cast(typing.Optional[DatasyncTaskExcludes], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[DatasyncTaskExcludes]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c968723ed1ff7b005c12d90a45b6953ae49fc1c0ee9326516a5467796d313ed0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.datasyncTask.DatasyncTaskIncludes",
    jsii_struct_bases=[],
    name_mapping={"filter_type": "filterType", "value": "value"},
)
class DatasyncTaskIncludes:
    def __init__(
        self,
        *,
        filter_type: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param filter_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#filter_type DatasyncTask#filter_type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#value DatasyncTask#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d5bf9eefff70df53c3f3e592b9adefff5966144a0e99469f2359724e2e7db91)
            check_type(argname="argument filter_type", value=filter_type, expected_type=type_hints["filter_type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if filter_type is not None:
            self._values["filter_type"] = filter_type
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def filter_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#filter_type DatasyncTask#filter_type}.'''
        result = self._values.get("filter_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#value DatasyncTask#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DatasyncTaskIncludes(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DatasyncTaskIncludesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.datasyncTask.DatasyncTaskIncludesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__65f2ca6ef4d2355876e139705940cb3b589ab40c26dfc53ccae621837907619d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetFilterType")
    def reset_filter_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilterType", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="filterTypeInput")
    def filter_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "filterTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="filterType")
    def filter_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "filterType"))

    @filter_type.setter
    def filter_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__784da5ca87d051859e0f53bd4573cf0321841790fb68b3388fe93db2af576814)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "filterType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb9c6cbe4cde6da6e34e0501c7f7736e5f324e2312836f111fa7d61ba4922e33)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[DatasyncTaskIncludes]:
        return typing.cast(typing.Optional[DatasyncTaskIncludes], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[DatasyncTaskIncludes]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb4e143c77cd135377f505a34c997aa2fec4fdba47299e85fdbcaac7e15e356f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.datasyncTask.DatasyncTaskOptions",
    jsii_struct_bases=[],
    name_mapping={
        "atime": "atime",
        "bytes_per_second": "bytesPerSecond",
        "gid": "gid",
        "log_level": "logLevel",
        "mtime": "mtime",
        "object_tags": "objectTags",
        "overwrite_mode": "overwriteMode",
        "posix_permissions": "posixPermissions",
        "preserve_deleted_files": "preserveDeletedFiles",
        "preserve_devices": "preserveDevices",
        "security_descriptor_copy_flags": "securityDescriptorCopyFlags",
        "task_queueing": "taskQueueing",
        "transfer_mode": "transferMode",
        "uid": "uid",
        "verify_mode": "verifyMode",
    },
)
class DatasyncTaskOptions:
    def __init__(
        self,
        *,
        atime: typing.Optional[builtins.str] = None,
        bytes_per_second: typing.Optional[jsii.Number] = None,
        gid: typing.Optional[builtins.str] = None,
        log_level: typing.Optional[builtins.str] = None,
        mtime: typing.Optional[builtins.str] = None,
        object_tags: typing.Optional[builtins.str] = None,
        overwrite_mode: typing.Optional[builtins.str] = None,
        posix_permissions: typing.Optional[builtins.str] = None,
        preserve_deleted_files: typing.Optional[builtins.str] = None,
        preserve_devices: typing.Optional[builtins.str] = None,
        security_descriptor_copy_flags: typing.Optional[builtins.str] = None,
        task_queueing: typing.Optional[builtins.str] = None,
        transfer_mode: typing.Optional[builtins.str] = None,
        uid: typing.Optional[builtins.str] = None,
        verify_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param atime: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#atime DatasyncTask#atime}.
        :param bytes_per_second: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#bytes_per_second DatasyncTask#bytes_per_second}.
        :param gid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#gid DatasyncTask#gid}.
        :param log_level: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#log_level DatasyncTask#log_level}.
        :param mtime: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#mtime DatasyncTask#mtime}.
        :param object_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#object_tags DatasyncTask#object_tags}.
        :param overwrite_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#overwrite_mode DatasyncTask#overwrite_mode}.
        :param posix_permissions: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#posix_permissions DatasyncTask#posix_permissions}.
        :param preserve_deleted_files: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#preserve_deleted_files DatasyncTask#preserve_deleted_files}.
        :param preserve_devices: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#preserve_devices DatasyncTask#preserve_devices}.
        :param security_descriptor_copy_flags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#security_descriptor_copy_flags DatasyncTask#security_descriptor_copy_flags}.
        :param task_queueing: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_queueing DatasyncTask#task_queueing}.
        :param transfer_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#transfer_mode DatasyncTask#transfer_mode}.
        :param uid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#uid DatasyncTask#uid}.
        :param verify_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#verify_mode DatasyncTask#verify_mode}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aec068cbf3c4d3f62bcc9b6ede3dfb2094aeac4759b6a6355f4eef1b3401eb72)
            check_type(argname="argument atime", value=atime, expected_type=type_hints["atime"])
            check_type(argname="argument bytes_per_second", value=bytes_per_second, expected_type=type_hints["bytes_per_second"])
            check_type(argname="argument gid", value=gid, expected_type=type_hints["gid"])
            check_type(argname="argument log_level", value=log_level, expected_type=type_hints["log_level"])
            check_type(argname="argument mtime", value=mtime, expected_type=type_hints["mtime"])
            check_type(argname="argument object_tags", value=object_tags, expected_type=type_hints["object_tags"])
            check_type(argname="argument overwrite_mode", value=overwrite_mode, expected_type=type_hints["overwrite_mode"])
            check_type(argname="argument posix_permissions", value=posix_permissions, expected_type=type_hints["posix_permissions"])
            check_type(argname="argument preserve_deleted_files", value=preserve_deleted_files, expected_type=type_hints["preserve_deleted_files"])
            check_type(argname="argument preserve_devices", value=preserve_devices, expected_type=type_hints["preserve_devices"])
            check_type(argname="argument security_descriptor_copy_flags", value=security_descriptor_copy_flags, expected_type=type_hints["security_descriptor_copy_flags"])
            check_type(argname="argument task_queueing", value=task_queueing, expected_type=type_hints["task_queueing"])
            check_type(argname="argument transfer_mode", value=transfer_mode, expected_type=type_hints["transfer_mode"])
            check_type(argname="argument uid", value=uid, expected_type=type_hints["uid"])
            check_type(argname="argument verify_mode", value=verify_mode, expected_type=type_hints["verify_mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if atime is not None:
            self._values["atime"] = atime
        if bytes_per_second is not None:
            self._values["bytes_per_second"] = bytes_per_second
        if gid is not None:
            self._values["gid"] = gid
        if log_level is not None:
            self._values["log_level"] = log_level
        if mtime is not None:
            self._values["mtime"] = mtime
        if object_tags is not None:
            self._values["object_tags"] = object_tags
        if overwrite_mode is not None:
            self._values["overwrite_mode"] = overwrite_mode
        if posix_permissions is not None:
            self._values["posix_permissions"] = posix_permissions
        if preserve_deleted_files is not None:
            self._values["preserve_deleted_files"] = preserve_deleted_files
        if preserve_devices is not None:
            self._values["preserve_devices"] = preserve_devices
        if security_descriptor_copy_flags is not None:
            self._values["security_descriptor_copy_flags"] = security_descriptor_copy_flags
        if task_queueing is not None:
            self._values["task_queueing"] = task_queueing
        if transfer_mode is not None:
            self._values["transfer_mode"] = transfer_mode
        if uid is not None:
            self._values["uid"] = uid
        if verify_mode is not None:
            self._values["verify_mode"] = verify_mode

    @builtins.property
    def atime(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#atime DatasyncTask#atime}.'''
        result = self._values.get("atime")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def bytes_per_second(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#bytes_per_second DatasyncTask#bytes_per_second}.'''
        result = self._values.get("bytes_per_second")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def gid(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#gid DatasyncTask#gid}.'''
        result = self._values.get("gid")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def log_level(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#log_level DatasyncTask#log_level}.'''
        result = self._values.get("log_level")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def mtime(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#mtime DatasyncTask#mtime}.'''
        result = self._values.get("mtime")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def object_tags(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#object_tags DatasyncTask#object_tags}.'''
        result = self._values.get("object_tags")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def overwrite_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#overwrite_mode DatasyncTask#overwrite_mode}.'''
        result = self._values.get("overwrite_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def posix_permissions(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#posix_permissions DatasyncTask#posix_permissions}.'''
        result = self._values.get("posix_permissions")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def preserve_deleted_files(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#preserve_deleted_files DatasyncTask#preserve_deleted_files}.'''
        result = self._values.get("preserve_deleted_files")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def preserve_devices(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#preserve_devices DatasyncTask#preserve_devices}.'''
        result = self._values.get("preserve_devices")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def security_descriptor_copy_flags(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#security_descriptor_copy_flags DatasyncTask#security_descriptor_copy_flags}.'''
        result = self._values.get("security_descriptor_copy_flags")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def task_queueing(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_queueing DatasyncTask#task_queueing}.'''
        result = self._values.get("task_queueing")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def transfer_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#transfer_mode DatasyncTask#transfer_mode}.'''
        result = self._values.get("transfer_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def uid(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#uid DatasyncTask#uid}.'''
        result = self._values.get("uid")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def verify_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#verify_mode DatasyncTask#verify_mode}.'''
        result = self._values.get("verify_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DatasyncTaskOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DatasyncTaskOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.datasyncTask.DatasyncTaskOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3d3f0e35b5fdbc015750db6f90df5377269c510dacbb72e57eddc685d46f7996)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAtime")
    def reset_atime(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAtime", []))

    @jsii.member(jsii_name="resetBytesPerSecond")
    def reset_bytes_per_second(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBytesPerSecond", []))

    @jsii.member(jsii_name="resetGid")
    def reset_gid(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGid", []))

    @jsii.member(jsii_name="resetLogLevel")
    def reset_log_level(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLogLevel", []))

    @jsii.member(jsii_name="resetMtime")
    def reset_mtime(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMtime", []))

    @jsii.member(jsii_name="resetObjectTags")
    def reset_object_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetObjectTags", []))

    @jsii.member(jsii_name="resetOverwriteMode")
    def reset_overwrite_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOverwriteMode", []))

    @jsii.member(jsii_name="resetPosixPermissions")
    def reset_posix_permissions(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPosixPermissions", []))

    @jsii.member(jsii_name="resetPreserveDeletedFiles")
    def reset_preserve_deleted_files(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPreserveDeletedFiles", []))

    @jsii.member(jsii_name="resetPreserveDevices")
    def reset_preserve_devices(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPreserveDevices", []))

    @jsii.member(jsii_name="resetSecurityDescriptorCopyFlags")
    def reset_security_descriptor_copy_flags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityDescriptorCopyFlags", []))

    @jsii.member(jsii_name="resetTaskQueueing")
    def reset_task_queueing(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTaskQueueing", []))

    @jsii.member(jsii_name="resetTransferMode")
    def reset_transfer_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTransferMode", []))

    @jsii.member(jsii_name="resetUid")
    def reset_uid(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUid", []))

    @jsii.member(jsii_name="resetVerifyMode")
    def reset_verify_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVerifyMode", []))

    @builtins.property
    @jsii.member(jsii_name="atimeInput")
    def atime_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "atimeInput"))

    @builtins.property
    @jsii.member(jsii_name="bytesPerSecondInput")
    def bytes_per_second_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "bytesPerSecondInput"))

    @builtins.property
    @jsii.member(jsii_name="gidInput")
    def gid_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "gidInput"))

    @builtins.property
    @jsii.member(jsii_name="logLevelInput")
    def log_level_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "logLevelInput"))

    @builtins.property
    @jsii.member(jsii_name="mtimeInput")
    def mtime_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "mtimeInput"))

    @builtins.property
    @jsii.member(jsii_name="objectTagsInput")
    def object_tags_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "objectTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="overwriteModeInput")
    def overwrite_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "overwriteModeInput"))

    @builtins.property
    @jsii.member(jsii_name="posixPermissionsInput")
    def posix_permissions_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "posixPermissionsInput"))

    @builtins.property
    @jsii.member(jsii_name="preserveDeletedFilesInput")
    def preserve_deleted_files_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "preserveDeletedFilesInput"))

    @builtins.property
    @jsii.member(jsii_name="preserveDevicesInput")
    def preserve_devices_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "preserveDevicesInput"))

    @builtins.property
    @jsii.member(jsii_name="securityDescriptorCopyFlagsInput")
    def security_descriptor_copy_flags_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "securityDescriptorCopyFlagsInput"))

    @builtins.property
    @jsii.member(jsii_name="taskQueueingInput")
    def task_queueing_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "taskQueueingInput"))

    @builtins.property
    @jsii.member(jsii_name="transferModeInput")
    def transfer_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "transferModeInput"))

    @builtins.property
    @jsii.member(jsii_name="uidInput")
    def uid_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "uidInput"))

    @builtins.property
    @jsii.member(jsii_name="verifyModeInput")
    def verify_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "verifyModeInput"))

    @builtins.property
    @jsii.member(jsii_name="atime")
    def atime(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "atime"))

    @atime.setter
    def atime(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6925e24041df107eb1c6a7f679712595a0989ed9b0c7b3db16bbe053db112d06)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "atime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="bytesPerSecond")
    def bytes_per_second(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "bytesPerSecond"))

    @bytes_per_second.setter
    def bytes_per_second(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e24a495e1db2ea11132e73e0878524a64f2b42a29236a953f2af3eb6ef13e7a1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bytesPerSecond", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="gid")
    def gid(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "gid"))

    @gid.setter
    def gid(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ce2af3df9afef5059553159cd564231c19c48ee0a1333214877823511d89073)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "gid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="logLevel")
    def log_level(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "logLevel"))

    @log_level.setter
    def log_level(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78f2fb9cb7d121276c51c5ebfc10de01a0504548b8a3dbe1b53aeaefef94bd73)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "logLevel", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="mtime")
    def mtime(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mtime"))

    @mtime.setter
    def mtime(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6a8fc7da21289ece64f867401ada30f9a14e7555ae838a25657c19d118f4af8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mtime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="objectTags")
    def object_tags(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "objectTags"))

    @object_tags.setter
    def object_tags(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4dfb64160f36a24ab5652ea5bb88d03820ecffd4b4701c33b176ae7376f091aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "objectTags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="overwriteMode")
    def overwrite_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "overwriteMode"))

    @overwrite_mode.setter
    def overwrite_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a638a46b9b6839747fb233f48129745cb22f51ec0a8f339da92c33d61043399b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "overwriteMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="posixPermissions")
    def posix_permissions(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "posixPermissions"))

    @posix_permissions.setter
    def posix_permissions(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1967277aea51c81a3d759a3502f0543534325c54f5ee47301b110a9d062b81f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "posixPermissions", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="preserveDeletedFiles")
    def preserve_deleted_files(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "preserveDeletedFiles"))

    @preserve_deleted_files.setter
    def preserve_deleted_files(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f606bdffe92f2956c7a0077a9b62fca649d5ca1208a63f9d7931fdd4bae3017)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "preserveDeletedFiles", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="preserveDevices")
    def preserve_devices(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "preserveDevices"))

    @preserve_devices.setter
    def preserve_devices(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2939e1ed3b8954bfc260ea679e3910635647facfee0cce0c05ff9083d99e87fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "preserveDevices", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityDescriptorCopyFlags")
    def security_descriptor_copy_flags(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "securityDescriptorCopyFlags"))

    @security_descriptor_copy_flags.setter
    def security_descriptor_copy_flags(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9939afb9ed28c78aa82fdc338a47997f9e452259b712c9da84d4ea93d33983f6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityDescriptorCopyFlags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="taskQueueing")
    def task_queueing(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "taskQueueing"))

    @task_queueing.setter
    def task_queueing(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43de78beafa51f4f331b0c22257ee8c99890b62d6c0e13316b79f2034165989b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "taskQueueing", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="transferMode")
    def transfer_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "transferMode"))

    @transfer_mode.setter
    def transfer_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6a14ffe28a38fdabf0a9bd5886b95b9b4c221f5c2609aa60a145bc3bc5562714)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "transferMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="uid")
    def uid(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "uid"))

    @uid.setter
    def uid(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64ffe1eee97fa83178e356e6ec06add921e032094a3e35c0b54273c4e9454a71)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "uid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="verifyMode")
    def verify_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "verifyMode"))

    @verify_mode.setter
    def verify_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__164504d19ad285d1314df5cc2087dac23c0df7dc4806048109ec52551283b2dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "verifyMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[DatasyncTaskOptions]:
        return typing.cast(typing.Optional[DatasyncTaskOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[DatasyncTaskOptions]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ca4f2ee4f61f606a8475b461d21a75cb305f871692df5a3f7c871f0a424acaf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.datasyncTask.DatasyncTaskSchedule",
    jsii_struct_bases=[],
    name_mapping={"schedule_expression": "scheduleExpression"},
)
class DatasyncTaskSchedule:
    def __init__(self, *, schedule_expression: builtins.str) -> None:
        '''
        :param schedule_expression: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#schedule_expression DatasyncTask#schedule_expression}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59cd183e16e1c796bc7821211bc9d84d4d56d10f3560f370f73b351425cc1aa3)
            check_type(argname="argument schedule_expression", value=schedule_expression, expected_type=type_hints["schedule_expression"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "schedule_expression": schedule_expression,
        }

    @builtins.property
    def schedule_expression(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#schedule_expression DatasyncTask#schedule_expression}.'''
        result = self._values.get("schedule_expression")
        assert result is not None, "Required property 'schedule_expression' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DatasyncTaskSchedule(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DatasyncTaskScheduleOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.datasyncTask.DatasyncTaskScheduleOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6306400538f77d37415839ad80950aa871e23e10367fd5ae623fea9a342c4b44)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="scheduleExpressionInput")
    def schedule_expression_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "scheduleExpressionInput"))

    @builtins.property
    @jsii.member(jsii_name="scheduleExpression")
    def schedule_expression(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "scheduleExpression"))

    @schedule_expression.setter
    def schedule_expression(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56e3fd73d6faa62e35f624f18d0cf4f27a52377d086c1990d84c46b395073a4f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "scheduleExpression", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[DatasyncTaskSchedule]:
        return typing.cast(typing.Optional[DatasyncTaskSchedule], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[DatasyncTaskSchedule]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b384002cbc2faa27c4a77091f9373c520813bfc669ff7adc07c7cf1707bc7d0a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.datasyncTask.DatasyncTaskTaskReportConfig",
    jsii_struct_bases=[],
    name_mapping={
        "s3_destination": "s3Destination",
        "output_type": "outputType",
        "report_level": "reportLevel",
        "report_overrides": "reportOverrides",
        "s3_object_versioning": "s3ObjectVersioning",
    },
)
class DatasyncTaskTaskReportConfig:
    def __init__(
        self,
        *,
        s3_destination: typing.Union["DatasyncTaskTaskReportConfigS3Destination", typing.Dict[builtins.str, typing.Any]],
        output_type: typing.Optional[builtins.str] = None,
        report_level: typing.Optional[builtins.str] = None,
        report_overrides: typing.Optional[typing.Union["DatasyncTaskTaskReportConfigReportOverrides", typing.Dict[builtins.str, typing.Any]]] = None,
        s3_object_versioning: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_destination: s3_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_destination DatasyncTask#s3_destination}
        :param output_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#output_type DatasyncTask#output_type}.
        :param report_level: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#report_level DatasyncTask#report_level}.
        :param report_overrides: report_overrides block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#report_overrides DatasyncTask#report_overrides}
        :param s3_object_versioning: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_object_versioning DatasyncTask#s3_object_versioning}.
        '''
        if isinstance(s3_destination, dict):
            s3_destination = DatasyncTaskTaskReportConfigS3Destination(**s3_destination)
        if isinstance(report_overrides, dict):
            report_overrides = DatasyncTaskTaskReportConfigReportOverrides(**report_overrides)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2e53732e5fda5bab12e66b12ac78377fe6cd33bd5afb9115635ae840279f9b7)
            check_type(argname="argument s3_destination", value=s3_destination, expected_type=type_hints["s3_destination"])
            check_type(argname="argument output_type", value=output_type, expected_type=type_hints["output_type"])
            check_type(argname="argument report_level", value=report_level, expected_type=type_hints["report_level"])
            check_type(argname="argument report_overrides", value=report_overrides, expected_type=type_hints["report_overrides"])
            check_type(argname="argument s3_object_versioning", value=s3_object_versioning, expected_type=type_hints["s3_object_versioning"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "s3_destination": s3_destination,
        }
        if output_type is not None:
            self._values["output_type"] = output_type
        if report_level is not None:
            self._values["report_level"] = report_level
        if report_overrides is not None:
            self._values["report_overrides"] = report_overrides
        if s3_object_versioning is not None:
            self._values["s3_object_versioning"] = s3_object_versioning

    @builtins.property
    def s3_destination(self) -> "DatasyncTaskTaskReportConfigS3Destination":
        '''s3_destination block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_destination DatasyncTask#s3_destination}
        '''
        result = self._values.get("s3_destination")
        assert result is not None, "Required property 's3_destination' is missing"
        return typing.cast("DatasyncTaskTaskReportConfigS3Destination", result)

    @builtins.property
    def output_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#output_type DatasyncTask#output_type}.'''
        result = self._values.get("output_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def report_level(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#report_level DatasyncTask#report_level}.'''
        result = self._values.get("report_level")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def report_overrides(
        self,
    ) -> typing.Optional["DatasyncTaskTaskReportConfigReportOverrides"]:
        '''report_overrides block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#report_overrides DatasyncTask#report_overrides}
        '''
        result = self._values.get("report_overrides")
        return typing.cast(typing.Optional["DatasyncTaskTaskReportConfigReportOverrides"], result)

    @builtins.property
    def s3_object_versioning(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_object_versioning DatasyncTask#s3_object_versioning}.'''
        result = self._values.get("s3_object_versioning")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DatasyncTaskTaskReportConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DatasyncTaskTaskReportConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.datasyncTask.DatasyncTaskTaskReportConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__993f90dcecf68c8c659bd0f9663aa3ca75764ba9a11f366b55e92ae727200845)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putReportOverrides")
    def put_report_overrides(
        self,
        *,
        deleted_override: typing.Optional[builtins.str] = None,
        skipped_override: typing.Optional[builtins.str] = None,
        transferred_override: typing.Optional[builtins.str] = None,
        verified_override: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param deleted_override: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#deleted_override DatasyncTask#deleted_override}.
        :param skipped_override: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#skipped_override DatasyncTask#skipped_override}.
        :param transferred_override: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#transferred_override DatasyncTask#transferred_override}.
        :param verified_override: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#verified_override DatasyncTask#verified_override}.
        '''
        value = DatasyncTaskTaskReportConfigReportOverrides(
            deleted_override=deleted_override,
            skipped_override=skipped_override,
            transferred_override=transferred_override,
            verified_override=verified_override,
        )

        return typing.cast(None, jsii.invoke(self, "putReportOverrides", [value]))

    @jsii.member(jsii_name="putS3Destination")
    def put_s3_destination(
        self,
        *,
        bucket_access_role_arn: builtins.str,
        s3_bucket_arn: builtins.str,
        subdirectory: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_access_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#bucket_access_role_arn DatasyncTask#bucket_access_role_arn}.
        :param s3_bucket_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_bucket_arn DatasyncTask#s3_bucket_arn}.
        :param subdirectory: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#subdirectory DatasyncTask#subdirectory}.
        '''
        value = DatasyncTaskTaskReportConfigS3Destination(
            bucket_access_role_arn=bucket_access_role_arn,
            s3_bucket_arn=s3_bucket_arn,
            subdirectory=subdirectory,
        )

        return typing.cast(None, jsii.invoke(self, "putS3Destination", [value]))

    @jsii.member(jsii_name="resetOutputType")
    def reset_output_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOutputType", []))

    @jsii.member(jsii_name="resetReportLevel")
    def reset_report_level(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReportLevel", []))

    @jsii.member(jsii_name="resetReportOverrides")
    def reset_report_overrides(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReportOverrides", []))

    @jsii.member(jsii_name="resetS3ObjectVersioning")
    def reset_s3_object_versioning(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3ObjectVersioning", []))

    @builtins.property
    @jsii.member(jsii_name="reportOverrides")
    def report_overrides(
        self,
    ) -> "DatasyncTaskTaskReportConfigReportOverridesOutputReference":
        return typing.cast("DatasyncTaskTaskReportConfigReportOverridesOutputReference", jsii.get(self, "reportOverrides"))

    @builtins.property
    @jsii.member(jsii_name="s3Destination")
    def s3_destination(
        self,
    ) -> "DatasyncTaskTaskReportConfigS3DestinationOutputReference":
        return typing.cast("DatasyncTaskTaskReportConfigS3DestinationOutputReference", jsii.get(self, "s3Destination"))

    @builtins.property
    @jsii.member(jsii_name="outputTypeInput")
    def output_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "outputTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="reportLevelInput")
    def report_level_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "reportLevelInput"))

    @builtins.property
    @jsii.member(jsii_name="reportOverridesInput")
    def report_overrides_input(
        self,
    ) -> typing.Optional["DatasyncTaskTaskReportConfigReportOverrides"]:
        return typing.cast(typing.Optional["DatasyncTaskTaskReportConfigReportOverrides"], jsii.get(self, "reportOverridesInput"))

    @builtins.property
    @jsii.member(jsii_name="s3DestinationInput")
    def s3_destination_input(
        self,
    ) -> typing.Optional["DatasyncTaskTaskReportConfigS3Destination"]:
        return typing.cast(typing.Optional["DatasyncTaskTaskReportConfigS3Destination"], jsii.get(self, "s3DestinationInput"))

    @builtins.property
    @jsii.member(jsii_name="s3ObjectVersioningInput")
    def s3_object_versioning_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3ObjectVersioningInput"))

    @builtins.property
    @jsii.member(jsii_name="outputType")
    def output_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "outputType"))

    @output_type.setter
    def output_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5272d6e86ec5a8c3be6725189c23ab3ddbf2bb5ada09939a44b2bc846f200c8e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "outputType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="reportLevel")
    def report_level(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "reportLevel"))

    @report_level.setter
    def report_level(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52a64302128f97088f4646ed091c255867608e0934a1cb58461851b38ab31e45)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "reportLevel", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3ObjectVersioning")
    def s3_object_versioning(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3ObjectVersioning"))

    @s3_object_versioning.setter
    def s3_object_versioning(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dfac2c086f711e3038fa884844b63dd56f447c029f479b0ad4afcdbf58e35f37)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3ObjectVersioning", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[DatasyncTaskTaskReportConfig]:
        return typing.cast(typing.Optional[DatasyncTaskTaskReportConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[DatasyncTaskTaskReportConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3afb4a68e6301d9a40ac2ce8e83f8360e4225dd72776c32d2c0c1c3c749d00bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.datasyncTask.DatasyncTaskTaskReportConfigReportOverrides",
    jsii_struct_bases=[],
    name_mapping={
        "deleted_override": "deletedOverride",
        "skipped_override": "skippedOverride",
        "transferred_override": "transferredOverride",
        "verified_override": "verifiedOverride",
    },
)
class DatasyncTaskTaskReportConfigReportOverrides:
    def __init__(
        self,
        *,
        deleted_override: typing.Optional[builtins.str] = None,
        skipped_override: typing.Optional[builtins.str] = None,
        transferred_override: typing.Optional[builtins.str] = None,
        verified_override: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param deleted_override: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#deleted_override DatasyncTask#deleted_override}.
        :param skipped_override: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#skipped_override DatasyncTask#skipped_override}.
        :param transferred_override: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#transferred_override DatasyncTask#transferred_override}.
        :param verified_override: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#verified_override DatasyncTask#verified_override}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a6a64b1756743d13981822beceb97a0df133fef7d88f3a85240152d635d7e96)
            check_type(argname="argument deleted_override", value=deleted_override, expected_type=type_hints["deleted_override"])
            check_type(argname="argument skipped_override", value=skipped_override, expected_type=type_hints["skipped_override"])
            check_type(argname="argument transferred_override", value=transferred_override, expected_type=type_hints["transferred_override"])
            check_type(argname="argument verified_override", value=verified_override, expected_type=type_hints["verified_override"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if deleted_override is not None:
            self._values["deleted_override"] = deleted_override
        if skipped_override is not None:
            self._values["skipped_override"] = skipped_override
        if transferred_override is not None:
            self._values["transferred_override"] = transferred_override
        if verified_override is not None:
            self._values["verified_override"] = verified_override

    @builtins.property
    def deleted_override(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#deleted_override DatasyncTask#deleted_override}.'''
        result = self._values.get("deleted_override")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def skipped_override(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#skipped_override DatasyncTask#skipped_override}.'''
        result = self._values.get("skipped_override")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def transferred_override(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#transferred_override DatasyncTask#transferred_override}.'''
        result = self._values.get("transferred_override")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def verified_override(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#verified_override DatasyncTask#verified_override}.'''
        result = self._values.get("verified_override")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DatasyncTaskTaskReportConfigReportOverrides(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DatasyncTaskTaskReportConfigReportOverridesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.datasyncTask.DatasyncTaskTaskReportConfigReportOverridesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5fb67a3bf1eda90c4f6f8af727c8e3c70c235f45c0c5700c0db6ea29d735c13a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDeletedOverride")
    def reset_deleted_override(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeletedOverride", []))

    @jsii.member(jsii_name="resetSkippedOverride")
    def reset_skipped_override(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSkippedOverride", []))

    @jsii.member(jsii_name="resetTransferredOverride")
    def reset_transferred_override(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTransferredOverride", []))

    @jsii.member(jsii_name="resetVerifiedOverride")
    def reset_verified_override(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVerifiedOverride", []))

    @builtins.property
    @jsii.member(jsii_name="deletedOverrideInput")
    def deleted_override_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deletedOverrideInput"))

    @builtins.property
    @jsii.member(jsii_name="skippedOverrideInput")
    def skipped_override_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "skippedOverrideInput"))

    @builtins.property
    @jsii.member(jsii_name="transferredOverrideInput")
    def transferred_override_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "transferredOverrideInput"))

    @builtins.property
    @jsii.member(jsii_name="verifiedOverrideInput")
    def verified_override_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "verifiedOverrideInput"))

    @builtins.property
    @jsii.member(jsii_name="deletedOverride")
    def deleted_override(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deletedOverride"))

    @deleted_override.setter
    def deleted_override(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2113b972dc82074be6142fb8935350eaeb8b85e0773ac05ee8588f65b1b586af)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deletedOverride", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="skippedOverride")
    def skipped_override(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "skippedOverride"))

    @skipped_override.setter
    def skipped_override(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6378f1a63c06a046496a91ea1182a3ac32e79f6526f9c8e170555e9fc8f4d6a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "skippedOverride", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="transferredOverride")
    def transferred_override(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "transferredOverride"))

    @transferred_override.setter
    def transferred_override(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cba6a36a86d9e8a90a088a053725170cb1399d1d8e87986500b1acf9f90500ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "transferredOverride", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="verifiedOverride")
    def verified_override(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "verifiedOverride"))

    @verified_override.setter
    def verified_override(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__74c9e37b10ff54b2d55406048fceb84d695ec206574c3a2b05963341ac62bec5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "verifiedOverride", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[DatasyncTaskTaskReportConfigReportOverrides]:
        return typing.cast(typing.Optional[DatasyncTaskTaskReportConfigReportOverrides], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[DatasyncTaskTaskReportConfigReportOverrides],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__168e71f944982d99d1ea4033e68c2a8149e22ee4815be2f63bc08ef0605e975b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.datasyncTask.DatasyncTaskTaskReportConfigS3Destination",
    jsii_struct_bases=[],
    name_mapping={
        "bucket_access_role_arn": "bucketAccessRoleArn",
        "s3_bucket_arn": "s3BucketArn",
        "subdirectory": "subdirectory",
    },
)
class DatasyncTaskTaskReportConfigS3Destination:
    def __init__(
        self,
        *,
        bucket_access_role_arn: builtins.str,
        s3_bucket_arn: builtins.str,
        subdirectory: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_access_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#bucket_access_role_arn DatasyncTask#bucket_access_role_arn}.
        :param s3_bucket_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_bucket_arn DatasyncTask#s3_bucket_arn}.
        :param subdirectory: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#subdirectory DatasyncTask#subdirectory}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e174b4cdf105649ac93e68e1c2e444fbe70259d25c99781abd85c902795286c)
            check_type(argname="argument bucket_access_role_arn", value=bucket_access_role_arn, expected_type=type_hints["bucket_access_role_arn"])
            check_type(argname="argument s3_bucket_arn", value=s3_bucket_arn, expected_type=type_hints["s3_bucket_arn"])
            check_type(argname="argument subdirectory", value=subdirectory, expected_type=type_hints["subdirectory"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "bucket_access_role_arn": bucket_access_role_arn,
            "s3_bucket_arn": s3_bucket_arn,
        }
        if subdirectory is not None:
            self._values["subdirectory"] = subdirectory

    @builtins.property
    def bucket_access_role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#bucket_access_role_arn DatasyncTask#bucket_access_role_arn}.'''
        result = self._values.get("bucket_access_role_arn")
        assert result is not None, "Required property 'bucket_access_role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_bucket_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_bucket_arn DatasyncTask#s3_bucket_arn}.'''
        result = self._values.get("s3_bucket_arn")
        assert result is not None, "Required property 's3_bucket_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def subdirectory(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#subdirectory DatasyncTask#subdirectory}.'''
        result = self._values.get("subdirectory")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DatasyncTaskTaskReportConfigS3Destination(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DatasyncTaskTaskReportConfigS3DestinationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.datasyncTask.DatasyncTaskTaskReportConfigS3DestinationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0a4a1c85af3bf0c6278e41a3cb021778f4c28d01c4e7f31015d05566f84da858)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSubdirectory")
    def reset_subdirectory(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSubdirectory", []))

    @builtins.property
    @jsii.member(jsii_name="bucketAccessRoleArnInput")
    def bucket_access_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketAccessRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="s3BucketArnInput")
    def s3_bucket_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3BucketArnInput"))

    @builtins.property
    @jsii.member(jsii_name="subdirectoryInput")
    def subdirectory_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "subdirectoryInput"))

    @builtins.property
    @jsii.member(jsii_name="bucketAccessRoleArn")
    def bucket_access_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucketAccessRoleArn"))

    @bucket_access_role_arn.setter
    def bucket_access_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b60454d0df71e8cf970d0fae0ba139caa4898b836d458ab8843b579dd16c24b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucketAccessRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3BucketArn")
    def s3_bucket_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3BucketArn"))

    @s3_bucket_arn.setter
    def s3_bucket_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f126e5b462e495ef1775477c34fcad8fbba638ca6d33618bd289c68bf67a2e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3BucketArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subdirectory")
    def subdirectory(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "subdirectory"))

    @subdirectory.setter
    def subdirectory(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bfca7b40d9cb884aee7a00f06a520bc67af4e30df903e420d69bf25fb8f94b50)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subdirectory", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[DatasyncTaskTaskReportConfigS3Destination]:
        return typing.cast(typing.Optional[DatasyncTaskTaskReportConfigS3Destination], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[DatasyncTaskTaskReportConfigS3Destination],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8dfe71611751a84e65245ba959337698540be11696e0829757fb9d332caa4421)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.datasyncTask.DatasyncTaskTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create"},
)
class DatasyncTaskTimeouts:
    def __init__(self, *, create: typing.Optional[builtins.str] = None) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#create DatasyncTask#create}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41eebbcd1aacebf7c4fa0b1bea9d8fd34eead725cc7a55d1cf6e6c55de1db676)
            check_type(argname="argument create", value=create, expected_type=type_hints["create"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if create is not None:
            self._values["create"] = create

    @builtins.property
    def create(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#create DatasyncTask#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DatasyncTaskTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DatasyncTaskTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.datasyncTask.DatasyncTaskTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a5e798a5ca40b638009690a1874ee2d42088b56ae5edbb28d1f68fab147b1c08)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCreate")
    def reset_create(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCreate", []))

    @builtins.property
    @jsii.member(jsii_name="createInput")
    def create_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "createInput"))

    @builtins.property
    @jsii.member(jsii_name="create")
    def create(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "create"))

    @create.setter
    def create(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9e4f4496b65de23e58ea25e064092b49d506d3f9ee64975d69638b505eb5f18d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DatasyncTaskTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DatasyncTaskTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DatasyncTaskTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15ae2c862a2d9549abe2e08b4f4d6aa243fa18464e23a04562dd722f47b71bcf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "DatasyncTask",
    "DatasyncTaskConfig",
    "DatasyncTaskExcludes",
    "DatasyncTaskExcludesOutputReference",
    "DatasyncTaskIncludes",
    "DatasyncTaskIncludesOutputReference",
    "DatasyncTaskOptions",
    "DatasyncTaskOptionsOutputReference",
    "DatasyncTaskSchedule",
    "DatasyncTaskScheduleOutputReference",
    "DatasyncTaskTaskReportConfig",
    "DatasyncTaskTaskReportConfigOutputReference",
    "DatasyncTaskTaskReportConfigReportOverrides",
    "DatasyncTaskTaskReportConfigReportOverridesOutputReference",
    "DatasyncTaskTaskReportConfigS3Destination",
    "DatasyncTaskTaskReportConfigS3DestinationOutputReference",
    "DatasyncTaskTimeouts",
    "DatasyncTaskTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__f5b8b79116cca1937f0f72b31916a5e81edc09cf021dd38135718533a95f1cb5(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    destination_location_arn: builtins.str,
    source_location_arn: builtins.str,
    cloudwatch_log_group_arn: typing.Optional[builtins.str] = None,
    excludes: typing.Optional[typing.Union[DatasyncTaskExcludes, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    includes: typing.Optional[typing.Union[DatasyncTaskIncludes, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    options: typing.Optional[typing.Union[DatasyncTaskOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    schedule: typing.Optional[typing.Union[DatasyncTaskSchedule, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    task_mode: typing.Optional[builtins.str] = None,
    task_report_config: typing.Optional[typing.Union[DatasyncTaskTaskReportConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    timeouts: typing.Optional[typing.Union[DatasyncTaskTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__3fbd4c09c4a61fe7e633b8c7974442643525728927909c0d4863bc7b00d540c1(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2800008244101c710d15d609e43b8e1e408ef1164d4e5486419c89ee60fcf480(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__057f581d65544921542414865f83c49f7be94e8b772389b7b4eaa04c8fb8caa4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e04d2eed46035b04d621613c120c09f3a32e8466a662bec558d6b108c03cc047(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bbec083e9ed4ef4afc2cf7911b5418cf94569560d547eff128663d7d1ede89c1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c2edd19325fb2176a967acbad6604e7fa58baf8e1a0ec825e6f2255723c898c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b34432299f4b71d6ef7605eaeed4ceb6392eb8ef17511a2cd2bbd250b981a627(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d48567d7709160c315732f558341134cc4745490aa3d913402b426381c83deaa(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fadde604f190c66fb5fc2b122f339a1fadd0aabfd5c3dba659a65089e356a63a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0518ddbb46d6dfdab5629b1b9c382ad512b0d2122961a5fab8b042a5b2905ca(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    destination_location_arn: builtins.str,
    source_location_arn: builtins.str,
    cloudwatch_log_group_arn: typing.Optional[builtins.str] = None,
    excludes: typing.Optional[typing.Union[DatasyncTaskExcludes, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    includes: typing.Optional[typing.Union[DatasyncTaskIncludes, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    options: typing.Optional[typing.Union[DatasyncTaskOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    schedule: typing.Optional[typing.Union[DatasyncTaskSchedule, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    task_mode: typing.Optional[builtins.str] = None,
    task_report_config: typing.Optional[typing.Union[DatasyncTaskTaskReportConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    timeouts: typing.Optional[typing.Union[DatasyncTaskTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b721d94112a215459c04e2ba7ae65f2989b6f32a8fcce454d7e6d1a41434df92(
    *,
    filter_type: typing.Optional[builtins.str] = None,
    value: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__068084be6c898c85db64addbf7de8ab7d90b466326f704b1cef1ad4e6a8542a4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2cdd66e205798de86a335c14de891a42fc182820ad162eb8269f39dd2f3aea78(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e8220d162126e0f5f084f31ae4d27b82337f463a1078b436956b0cb7d7ca0ef(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c968723ed1ff7b005c12d90a45b6953ae49fc1c0ee9326516a5467796d313ed0(
    value: typing.Optional[DatasyncTaskExcludes],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d5bf9eefff70df53c3f3e592b9adefff5966144a0e99469f2359724e2e7db91(
    *,
    filter_type: typing.Optional[builtins.str] = None,
    value: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65f2ca6ef4d2355876e139705940cb3b589ab40c26dfc53ccae621837907619d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__784da5ca87d051859e0f53bd4573cf0321841790fb68b3388fe93db2af576814(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb9c6cbe4cde6da6e34e0501c7f7736e5f324e2312836f111fa7d61ba4922e33(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb4e143c77cd135377f505a34c997aa2fec4fdba47299e85fdbcaac7e15e356f(
    value: typing.Optional[DatasyncTaskIncludes],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aec068cbf3c4d3f62bcc9b6ede3dfb2094aeac4759b6a6355f4eef1b3401eb72(
    *,
    atime: typing.Optional[builtins.str] = None,
    bytes_per_second: typing.Optional[jsii.Number] = None,
    gid: typing.Optional[builtins.str] = None,
    log_level: typing.Optional[builtins.str] = None,
    mtime: typing.Optional[builtins.str] = None,
    object_tags: typing.Optional[builtins.str] = None,
    overwrite_mode: typing.Optional[builtins.str] = None,
    posix_permissions: typing.Optional[builtins.str] = None,
    preserve_deleted_files: typing.Optional[builtins.str] = None,
    preserve_devices: typing.Optional[builtins.str] = None,
    security_descriptor_copy_flags: typing.Optional[builtins.str] = None,
    task_queueing: typing.Optional[builtins.str] = None,
    transfer_mode: typing.Optional[builtins.str] = None,
    uid: typing.Optional[builtins.str] = None,
    verify_mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d3f0e35b5fdbc015750db6f90df5377269c510dacbb72e57eddc685d46f7996(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6925e24041df107eb1c6a7f679712595a0989ed9b0c7b3db16bbe053db112d06(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e24a495e1db2ea11132e73e0878524a64f2b42a29236a953f2af3eb6ef13e7a1(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ce2af3df9afef5059553159cd564231c19c48ee0a1333214877823511d89073(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78f2fb9cb7d121276c51c5ebfc10de01a0504548b8a3dbe1b53aeaefef94bd73(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6a8fc7da21289ece64f867401ada30f9a14e7555ae838a25657c19d118f4af8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4dfb64160f36a24ab5652ea5bb88d03820ecffd4b4701c33b176ae7376f091aa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a638a46b9b6839747fb233f48129745cb22f51ec0a8f339da92c33d61043399b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1967277aea51c81a3d759a3502f0543534325c54f5ee47301b110a9d062b81f3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f606bdffe92f2956c7a0077a9b62fca649d5ca1208a63f9d7931fdd4bae3017(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2939e1ed3b8954bfc260ea679e3910635647facfee0cce0c05ff9083d99e87fb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9939afb9ed28c78aa82fdc338a47997f9e452259b712c9da84d4ea93d33983f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43de78beafa51f4f331b0c22257ee8c99890b62d6c0e13316b79f2034165989b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a14ffe28a38fdabf0a9bd5886b95b9b4c221f5c2609aa60a145bc3bc5562714(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64ffe1eee97fa83178e356e6ec06add921e032094a3e35c0b54273c4e9454a71(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__164504d19ad285d1314df5cc2087dac23c0df7dc4806048109ec52551283b2dd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ca4f2ee4f61f606a8475b461d21a75cb305f871692df5a3f7c871f0a424acaf(
    value: typing.Optional[DatasyncTaskOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59cd183e16e1c796bc7821211bc9d84d4d56d10f3560f370f73b351425cc1aa3(
    *,
    schedule_expression: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6306400538f77d37415839ad80950aa871e23e10367fd5ae623fea9a342c4b44(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56e3fd73d6faa62e35f624f18d0cf4f27a52377d086c1990d84c46b395073a4f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b384002cbc2faa27c4a77091f9373c520813bfc669ff7adc07c7cf1707bc7d0a(
    value: typing.Optional[DatasyncTaskSchedule],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2e53732e5fda5bab12e66b12ac78377fe6cd33bd5afb9115635ae840279f9b7(
    *,
    s3_destination: typing.Union[DatasyncTaskTaskReportConfigS3Destination, typing.Dict[builtins.str, typing.Any]],
    output_type: typing.Optional[builtins.str] = None,
    report_level: typing.Optional[builtins.str] = None,
    report_overrides: typing.Optional[typing.Union[DatasyncTaskTaskReportConfigReportOverrides, typing.Dict[builtins.str, typing.Any]]] = None,
    s3_object_versioning: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__993f90dcecf68c8c659bd0f9663aa3ca75764ba9a11f366b55e92ae727200845(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5272d6e86ec5a8c3be6725189c23ab3ddbf2bb5ada09939a44b2bc846f200c8e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52a64302128f97088f4646ed091c255867608e0934a1cb58461851b38ab31e45(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dfac2c086f711e3038fa884844b63dd56f447c029f479b0ad4afcdbf58e35f37(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3afb4a68e6301d9a40ac2ce8e83f8360e4225dd72776c32d2c0c1c3c749d00bc(
    value: typing.Optional[DatasyncTaskTaskReportConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a6a64b1756743d13981822beceb97a0df133fef7d88f3a85240152d635d7e96(
    *,
    deleted_override: typing.Optional[builtins.str] = None,
    skipped_override: typing.Optional[builtins.str] = None,
    transferred_override: typing.Optional[builtins.str] = None,
    verified_override: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5fb67a3bf1eda90c4f6f8af727c8e3c70c235f45c0c5700c0db6ea29d735c13a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2113b972dc82074be6142fb8935350eaeb8b85e0773ac05ee8588f65b1b586af(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6378f1a63c06a046496a91ea1182a3ac32e79f6526f9c8e170555e9fc8f4d6a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cba6a36a86d9e8a90a088a053725170cb1399d1d8e87986500b1acf9f90500ce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74c9e37b10ff54b2d55406048fceb84d695ec206574c3a2b05963341ac62bec5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__168e71f944982d99d1ea4033e68c2a8149e22ee4815be2f63bc08ef0605e975b(
    value: typing.Optional[DatasyncTaskTaskReportConfigReportOverrides],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e174b4cdf105649ac93e68e1c2e444fbe70259d25c99781abd85c902795286c(
    *,
    bucket_access_role_arn: builtins.str,
    s3_bucket_arn: builtins.str,
    subdirectory: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a4a1c85af3bf0c6278e41a3cb021778f4c28d01c4e7f31015d05566f84da858(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b60454d0df71e8cf970d0fae0ba139caa4898b836d458ab8843b579dd16c24b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f126e5b462e495ef1775477c34fcad8fbba638ca6d33618bd289c68bf67a2e4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bfca7b40d9cb884aee7a00f06a520bc67af4e30df903e420d69bf25fb8f94b50(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8dfe71611751a84e65245ba959337698540be11696e0829757fb9d332caa4421(
    value: typing.Optional[DatasyncTaskTaskReportConfigS3Destination],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41eebbcd1aacebf7c4fa0b1bea9d8fd34eead725cc7a55d1cf6e6c55de1db676(
    *,
    create: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5e798a5ca40b638009690a1874ee2d42088b56ae5edbb28d1f68fab147b1c08(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e4f4496b65de23e58ea25e064092b49d506d3f9ee64975d69638b505eb5f18d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15ae2c862a2d9549abe2e08b4f4d6aa243fa18464e23a04562dd722f47b71bcf(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DatasyncTaskTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
