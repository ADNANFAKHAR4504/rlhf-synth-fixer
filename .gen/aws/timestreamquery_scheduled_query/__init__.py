r'''
# `aws_timestreamquery_scheduled_query`

Refer to the Terraform Registry for docs: [`aws_timestreamquery_scheduled_query`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query).
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


class TimestreamqueryScheduledQuery(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQuery",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query aws_timestreamquery_scheduled_query}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        execution_role_arn: builtins.str,
        name: builtins.str,
        query_string: builtins.str,
        error_report_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryErrorReportConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        kms_key_id: typing.Optional[builtins.str] = None,
        last_run_summary: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummary", typing.Dict[builtins.str, typing.Any]]]]] = None,
        notification_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryNotificationConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        recently_failed_runs: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRuns", typing.Dict[builtins.str, typing.Any]]]]] = None,
        schedule_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryScheduleConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        target_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryTargetConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        timeouts: typing.Optional[typing.Union["TimestreamqueryScheduledQueryTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query aws_timestreamquery_scheduled_query} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param execution_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_role_arn TimestreamqueryScheduledQuery#execution_role_arn}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}.
        :param query_string: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_string TimestreamqueryScheduledQuery#query_string}.
        :param error_report_configuration: error_report_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_configuration TimestreamqueryScheduledQuery#error_report_configuration}
        :param kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#kms_key_id TimestreamqueryScheduledQuery#kms_key_id}.
        :param last_run_summary: last_run_summary block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#last_run_summary TimestreamqueryScheduledQuery#last_run_summary}
        :param notification_configuration: notification_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#notification_configuration TimestreamqueryScheduledQuery#notification_configuration}
        :param recently_failed_runs: recently_failed_runs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#recently_failed_runs TimestreamqueryScheduledQuery#recently_failed_runs}
        :param schedule_configuration: schedule_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#schedule_configuration TimestreamqueryScheduledQuery#schedule_configuration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#tags TimestreamqueryScheduledQuery#tags}.
        :param target_configuration: target_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_configuration TimestreamqueryScheduledQuery#target_configuration}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#timeouts TimestreamqueryScheduledQuery#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4910ef76c0ef79d2761ced8e25ef2f205bc2ad652e1906e6c26f5fa19a31f75)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = TimestreamqueryScheduledQueryConfig(
            execution_role_arn=execution_role_arn,
            name=name,
            query_string=query_string,
            error_report_configuration=error_report_configuration,
            kms_key_id=kms_key_id,
            last_run_summary=last_run_summary,
            notification_configuration=notification_configuration,
            recently_failed_runs=recently_failed_runs,
            schedule_configuration=schedule_configuration,
            tags=tags,
            target_configuration=target_configuration,
            timeouts=timeouts,
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
        '''Generates CDKTF code for importing a TimestreamqueryScheduledQuery resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the TimestreamqueryScheduledQuery to import.
        :param import_from_id: The id of the existing TimestreamqueryScheduledQuery that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the TimestreamqueryScheduledQuery to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2556091caa32fd6647f3eab7ad44ebda679452fedc8b8f222fcaf0df7009b5d7)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putErrorReportConfiguration")
    def put_error_report_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryErrorReportConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75c16bf17e8d78d4c0fdea9b15dd166a58c404f3d59aab6b35bb5deb10ca3517)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putErrorReportConfiguration", [value]))

    @jsii.member(jsii_name="putLastRunSummary")
    def put_last_run_summary(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummary", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c921d4f6675a24187419d495653d41c7203ef69e437e783d36445e5bac8036de)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLastRunSummary", [value]))

    @jsii.member(jsii_name="putNotificationConfiguration")
    def put_notification_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryNotificationConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4c967f0bac3e39f967e8806cb4cb3e04daf7baaff635c1b2fd9980ec966016e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putNotificationConfiguration", [value]))

    @jsii.member(jsii_name="putRecentlyFailedRuns")
    def put_recently_failed_runs(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRuns", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a8544668750e757ae55b8ff82fb63d92d87327e5b02f30d72f0c22a88e3fa345)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRecentlyFailedRuns", [value]))

    @jsii.member(jsii_name="putScheduleConfiguration")
    def put_schedule_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryScheduleConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7064cf00bcfdacef55e0c3905a7bf35c65d15ac08a1453eb1be102c2e3857fc8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putScheduleConfiguration", [value]))

    @jsii.member(jsii_name="putTargetConfiguration")
    def put_target_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryTargetConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__785a199d49a1ec7ff762a772d2f38ff69fea6a25019f71d53b82320f099aad14)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTargetConfiguration", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#create TimestreamqueryScheduledQuery#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#delete TimestreamqueryScheduledQuery#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#update TimestreamqueryScheduledQuery#update}
        '''
        value = TimestreamqueryScheduledQueryTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetErrorReportConfiguration")
    def reset_error_report_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetErrorReportConfiguration", []))

    @jsii.member(jsii_name="resetKmsKeyId")
    def reset_kms_key_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKmsKeyId", []))

    @jsii.member(jsii_name="resetLastRunSummary")
    def reset_last_run_summary(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLastRunSummary", []))

    @jsii.member(jsii_name="resetNotificationConfiguration")
    def reset_notification_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNotificationConfiguration", []))

    @jsii.member(jsii_name="resetRecentlyFailedRuns")
    def reset_recently_failed_runs(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRecentlyFailedRuns", []))

    @jsii.member(jsii_name="resetScheduleConfiguration")
    def reset_schedule_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetScheduleConfiguration", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTargetConfiguration")
    def reset_target_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetConfiguration", []))

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
    @jsii.member(jsii_name="creationTime")
    def creation_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "creationTime"))

    @builtins.property
    @jsii.member(jsii_name="errorReportConfiguration")
    def error_report_configuration(
        self,
    ) -> "TimestreamqueryScheduledQueryErrorReportConfigurationList":
        return typing.cast("TimestreamqueryScheduledQueryErrorReportConfigurationList", jsii.get(self, "errorReportConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="lastRunSummary")
    def last_run_summary(self) -> "TimestreamqueryScheduledQueryLastRunSummaryList":
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryList", jsii.get(self, "lastRunSummary"))

    @builtins.property
    @jsii.member(jsii_name="nextInvocationTime")
    def next_invocation_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "nextInvocationTime"))

    @builtins.property
    @jsii.member(jsii_name="notificationConfiguration")
    def notification_configuration(
        self,
    ) -> "TimestreamqueryScheduledQueryNotificationConfigurationList":
        return typing.cast("TimestreamqueryScheduledQueryNotificationConfigurationList", jsii.get(self, "notificationConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="previousInvocationTime")
    def previous_invocation_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "previousInvocationTime"))

    @builtins.property
    @jsii.member(jsii_name="recentlyFailedRuns")
    def recently_failed_runs(
        self,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsList":
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsList", jsii.get(self, "recentlyFailedRuns"))

    @builtins.property
    @jsii.member(jsii_name="scheduleConfiguration")
    def schedule_configuration(
        self,
    ) -> "TimestreamqueryScheduledQueryScheduleConfigurationList":
        return typing.cast("TimestreamqueryScheduledQueryScheduleConfigurationList", jsii.get(self, "scheduleConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="state")
    def state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "state"))

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> _cdktf_9a9027ec.StringMap:
        return typing.cast(_cdktf_9a9027ec.StringMap, jsii.get(self, "tagsAll"))

    @builtins.property
    @jsii.member(jsii_name="targetConfiguration")
    def target_configuration(
        self,
    ) -> "TimestreamqueryScheduledQueryTargetConfigurationList":
        return typing.cast("TimestreamqueryScheduledQueryTargetConfigurationList", jsii.get(self, "targetConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "TimestreamqueryScheduledQueryTimeoutsOutputReference":
        return typing.cast("TimestreamqueryScheduledQueryTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="errorReportConfigurationInput")
    def error_report_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryErrorReportConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryErrorReportConfiguration"]]], jsii.get(self, "errorReportConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="executionRoleArnInput")
    def execution_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "executionRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyIdInput")
    def kms_key_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "kmsKeyIdInput"))

    @builtins.property
    @jsii.member(jsii_name="lastRunSummaryInput")
    def last_run_summary_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummary"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummary"]]], jsii.get(self, "lastRunSummaryInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="notificationConfigurationInput")
    def notification_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryNotificationConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryNotificationConfiguration"]]], jsii.get(self, "notificationConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="queryStringInput")
    def query_string_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "queryStringInput"))

    @builtins.property
    @jsii.member(jsii_name="recentlyFailedRunsInput")
    def recently_failed_runs_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRuns"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRuns"]]], jsii.get(self, "recentlyFailedRunsInput"))

    @builtins.property
    @jsii.member(jsii_name="scheduleConfigurationInput")
    def schedule_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryScheduleConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryScheduleConfiguration"]]], jsii.get(self, "scheduleConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="targetConfigurationInput")
    def target_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfiguration"]]], jsii.get(self, "targetConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "TimestreamqueryScheduledQueryTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "TimestreamqueryScheduledQueryTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="executionRoleArn")
    def execution_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "executionRoleArn"))

    @execution_role_arn.setter
    def execution_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b98e9cf167d0dca869b1685f7e4de2d0b43e78f58098c6f3e89b7e30de01572)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "executionRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="kmsKeyId")
    def kms_key_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "kmsKeyId"))

    @kms_key_id.setter
    def kms_key_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d49537029e85c1b12df7f7d199bde773f81cc3b120b6dec2c70df8f5d1fb2f0e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "kmsKeyId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6fcd27625a7f897dce3c4d642c2f6d9b35ff4e4db3b359752b760bffe43740eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="queryString")
    def query_string(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "queryString"))

    @query_string.setter
    def query_string(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf8a3fe7537190397a79d96ecd3d88e6013b9687d156ee5f9d30493c4f9d694e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "queryString", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5cab8552bee25624ae1fafdf952f3a7c9d059be96e2c87523302e8b0e7ebf6d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "execution_role_arn": "executionRoleArn",
        "name": "name",
        "query_string": "queryString",
        "error_report_configuration": "errorReportConfiguration",
        "kms_key_id": "kmsKeyId",
        "last_run_summary": "lastRunSummary",
        "notification_configuration": "notificationConfiguration",
        "recently_failed_runs": "recentlyFailedRuns",
        "schedule_configuration": "scheduleConfiguration",
        "tags": "tags",
        "target_configuration": "targetConfiguration",
        "timeouts": "timeouts",
    },
)
class TimestreamqueryScheduledQueryConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        execution_role_arn: builtins.str,
        name: builtins.str,
        query_string: builtins.str,
        error_report_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryErrorReportConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        kms_key_id: typing.Optional[builtins.str] = None,
        last_run_summary: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummary", typing.Dict[builtins.str, typing.Any]]]]] = None,
        notification_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryNotificationConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        recently_failed_runs: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRuns", typing.Dict[builtins.str, typing.Any]]]]] = None,
        schedule_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryScheduleConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        target_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryTargetConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        timeouts: typing.Optional[typing.Union["TimestreamqueryScheduledQueryTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param execution_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_role_arn TimestreamqueryScheduledQuery#execution_role_arn}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}.
        :param query_string: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_string TimestreamqueryScheduledQuery#query_string}.
        :param error_report_configuration: error_report_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_configuration TimestreamqueryScheduledQuery#error_report_configuration}
        :param kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#kms_key_id TimestreamqueryScheduledQuery#kms_key_id}.
        :param last_run_summary: last_run_summary block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#last_run_summary TimestreamqueryScheduledQuery#last_run_summary}
        :param notification_configuration: notification_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#notification_configuration TimestreamqueryScheduledQuery#notification_configuration}
        :param recently_failed_runs: recently_failed_runs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#recently_failed_runs TimestreamqueryScheduledQuery#recently_failed_runs}
        :param schedule_configuration: schedule_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#schedule_configuration TimestreamqueryScheduledQuery#schedule_configuration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#tags TimestreamqueryScheduledQuery#tags}.
        :param target_configuration: target_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_configuration TimestreamqueryScheduledQuery#target_configuration}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#timeouts TimestreamqueryScheduledQuery#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(timeouts, dict):
            timeouts = TimestreamqueryScheduledQueryTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1112ee8ce5dfd77508984ccb8b5d9063fd39ebe902c68b8192119de47f265059)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument execution_role_arn", value=execution_role_arn, expected_type=type_hints["execution_role_arn"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument query_string", value=query_string, expected_type=type_hints["query_string"])
            check_type(argname="argument error_report_configuration", value=error_report_configuration, expected_type=type_hints["error_report_configuration"])
            check_type(argname="argument kms_key_id", value=kms_key_id, expected_type=type_hints["kms_key_id"])
            check_type(argname="argument last_run_summary", value=last_run_summary, expected_type=type_hints["last_run_summary"])
            check_type(argname="argument notification_configuration", value=notification_configuration, expected_type=type_hints["notification_configuration"])
            check_type(argname="argument recently_failed_runs", value=recently_failed_runs, expected_type=type_hints["recently_failed_runs"])
            check_type(argname="argument schedule_configuration", value=schedule_configuration, expected_type=type_hints["schedule_configuration"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument target_configuration", value=target_configuration, expected_type=type_hints["target_configuration"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "execution_role_arn": execution_role_arn,
            "name": name,
            "query_string": query_string,
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
        if error_report_configuration is not None:
            self._values["error_report_configuration"] = error_report_configuration
        if kms_key_id is not None:
            self._values["kms_key_id"] = kms_key_id
        if last_run_summary is not None:
            self._values["last_run_summary"] = last_run_summary
        if notification_configuration is not None:
            self._values["notification_configuration"] = notification_configuration
        if recently_failed_runs is not None:
            self._values["recently_failed_runs"] = recently_failed_runs
        if schedule_configuration is not None:
            self._values["schedule_configuration"] = schedule_configuration
        if tags is not None:
            self._values["tags"] = tags
        if target_configuration is not None:
            self._values["target_configuration"] = target_configuration
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
    def execution_role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_role_arn TimestreamqueryScheduledQuery#execution_role_arn}.'''
        result = self._values.get("execution_role_arn")
        assert result is not None, "Required property 'execution_role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def query_string(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_string TimestreamqueryScheduledQuery#query_string}.'''
        result = self._values.get("query_string")
        assert result is not None, "Required property 'query_string' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def error_report_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryErrorReportConfiguration"]]]:
        '''error_report_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_configuration TimestreamqueryScheduledQuery#error_report_configuration}
        '''
        result = self._values.get("error_report_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryErrorReportConfiguration"]]], result)

    @builtins.property
    def kms_key_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#kms_key_id TimestreamqueryScheduledQuery#kms_key_id}.'''
        result = self._values.get("kms_key_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def last_run_summary(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummary"]]]:
        '''last_run_summary block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#last_run_summary TimestreamqueryScheduledQuery#last_run_summary}
        '''
        result = self._values.get("last_run_summary")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummary"]]], result)

    @builtins.property
    def notification_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryNotificationConfiguration"]]]:
        '''notification_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#notification_configuration TimestreamqueryScheduledQuery#notification_configuration}
        '''
        result = self._values.get("notification_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryNotificationConfiguration"]]], result)

    @builtins.property
    def recently_failed_runs(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRuns"]]]:
        '''recently_failed_runs block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#recently_failed_runs TimestreamqueryScheduledQuery#recently_failed_runs}
        '''
        result = self._values.get("recently_failed_runs")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRuns"]]], result)

    @builtins.property
    def schedule_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryScheduleConfiguration"]]]:
        '''schedule_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#schedule_configuration TimestreamqueryScheduledQuery#schedule_configuration}
        '''
        result = self._values.get("schedule_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryScheduleConfiguration"]]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#tags TimestreamqueryScheduledQuery#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def target_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfiguration"]]]:
        '''target_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_configuration TimestreamqueryScheduledQuery#target_configuration}
        '''
        result = self._values.get("target_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfiguration"]]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["TimestreamqueryScheduledQueryTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#timeouts TimestreamqueryScheduledQuery#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["TimestreamqueryScheduledQueryTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryErrorReportConfiguration",
    jsii_struct_bases=[],
    name_mapping={"s3_configuration": "s3Configuration"},
)
class TimestreamqueryScheduledQueryErrorReportConfiguration:
    def __init__(
        self,
        *,
        s3_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param s3_configuration: s3_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#s3_configuration TimestreamqueryScheduledQuery#s3_configuration}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e4af76b9e672e0be564beba4401adbcf758b1ea7b8d345bb0ff59274e43a03ce)
            check_type(argname="argument s3_configuration", value=s3_configuration, expected_type=type_hints["s3_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if s3_configuration is not None:
            self._values["s3_configuration"] = s3_configuration

    @builtins.property
    def s3_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration"]]]:
        '''s3_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#s3_configuration TimestreamqueryScheduledQuery#s3_configuration}
        '''
        result = self._values.get("s3_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryErrorReportConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryErrorReportConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryErrorReportConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b10b30fabf2adcbf4c394a3fc0835138e38e2bcaee213769bd7a4d542787debe)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryErrorReportConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79fc10e9eb9f64b0f0dc43216b1afeb680647279e5dd3c5802b9cbf418beb4df)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryErrorReportConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0139fba699db5c7964aa34b6845800f157a98305e5fd4bd83c0237773b112bb5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__172b698d0efcdd64b1090be80726ba2bccda202f0a3da5dd6b31e0bd95ad21e6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__10e9f72be45e47a34f571f1a07f3ddb23a303d3c4ee113548a1aa01f68d00fc7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryErrorReportConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryErrorReportConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryErrorReportConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56e3c70d5a6a2ab0f80c4bcf62c3cb911409ebd4bbb8d894e410a5a1f45aca9d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryErrorReportConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryErrorReportConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e669a43baad90d78c4eff50692e64ce0df4ab005019504fc0f5eadc2b63efa58)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putS3Configuration")
    def put_s3_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d4740997acc9350cc14866f6e5b0330ec0ef32f63062dea141a5d3c85676730)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putS3Configuration", [value]))

    @jsii.member(jsii_name="resetS3Configuration")
    def reset_s3_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3Configuration", []))

    @builtins.property
    @jsii.member(jsii_name="s3Configuration")
    def s3_configuration(
        self,
    ) -> "TimestreamqueryScheduledQueryErrorReportConfigurationS3ConfigurationList":
        return typing.cast("TimestreamqueryScheduledQueryErrorReportConfigurationS3ConfigurationList", jsii.get(self, "s3Configuration"))

    @builtins.property
    @jsii.member(jsii_name="s3ConfigurationInput")
    def s3_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration"]]], jsii.get(self, "s3ConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryErrorReportConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryErrorReportConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryErrorReportConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7363c5d43f2fa01d6859b48e60073faa7b6cd32df3db97d41f31668bab2ce5c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration",
    jsii_struct_bases=[],
    name_mapping={
        "bucket_name": "bucketName",
        "encryption_option": "encryptionOption",
        "object_key_prefix": "objectKeyPrefix",
    },
)
class TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration:
    def __init__(
        self,
        *,
        bucket_name: builtins.str,
        encryption_option: typing.Optional[builtins.str] = None,
        object_key_prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#bucket_name TimestreamqueryScheduledQuery#bucket_name}.
        :param encryption_option: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#encryption_option TimestreamqueryScheduledQuery#encryption_option}.
        :param object_key_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#object_key_prefix TimestreamqueryScheduledQuery#object_key_prefix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f292c41506fcdb472b23d525a27c76b6c21b22eaedbf0d22ea5b010b9a4e5930)
            check_type(argname="argument bucket_name", value=bucket_name, expected_type=type_hints["bucket_name"])
            check_type(argname="argument encryption_option", value=encryption_option, expected_type=type_hints["encryption_option"])
            check_type(argname="argument object_key_prefix", value=object_key_prefix, expected_type=type_hints["object_key_prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "bucket_name": bucket_name,
        }
        if encryption_option is not None:
            self._values["encryption_option"] = encryption_option
        if object_key_prefix is not None:
            self._values["object_key_prefix"] = object_key_prefix

    @builtins.property
    def bucket_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#bucket_name TimestreamqueryScheduledQuery#bucket_name}.'''
        result = self._values.get("bucket_name")
        assert result is not None, "Required property 'bucket_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def encryption_option(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#encryption_option TimestreamqueryScheduledQuery#encryption_option}.'''
        result = self._values.get("encryption_option")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def object_key_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#object_key_prefix TimestreamqueryScheduledQuery#object_key_prefix}.'''
        result = self._values.get("object_key_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryErrorReportConfigurationS3ConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryErrorReportConfigurationS3ConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bda43c9128d4af1e702d52b27a98b545bbb61845984dad1cdd9473cd5f456f14)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryErrorReportConfigurationS3ConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__434f324c19a43fbb7d6113ee7d3918bda115231e95202d69b269625e3dbe82c7)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryErrorReportConfigurationS3ConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__074f5187f0b87efda86af6e629bb137c2b44cb8139a36818302ab58b56c2dff6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d2a304ffd70f16e4f46ae6a48422245c6e56f7ca3f66a460e68bae24b6d2e485)
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
            type_hints = typing.get_type_hints(_typecheckingstub__59ea7e2cb56c9f26b5aea0fd1d3bba2f4f67027412ca8b2b0a8599cff66f6986)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed447b1bc9f3cd14e80a6dde2f247bdea1ed8f0b0d43e57398e5ea808f93b67a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryErrorReportConfigurationS3ConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryErrorReportConfigurationS3ConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aa5c45358d2b8f70724f81316d165a2443bf94dc913486a40fcb32ebca25cecd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetEncryptionOption")
    def reset_encryption_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEncryptionOption", []))

    @jsii.member(jsii_name="resetObjectKeyPrefix")
    def reset_object_key_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetObjectKeyPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="bucketNameInput")
    def bucket_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketNameInput"))

    @builtins.property
    @jsii.member(jsii_name="encryptionOptionInput")
    def encryption_option_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "encryptionOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="objectKeyPrefixInput")
    def object_key_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "objectKeyPrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="bucketName")
    def bucket_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucketName"))

    @bucket_name.setter
    def bucket_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8804be88afb32e470fa5e32338c31fb933752edbb84a0656ee1fb944f99fa75f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucketName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="encryptionOption")
    def encryption_option(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "encryptionOption"))

    @encryption_option.setter
    def encryption_option(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce558e4159fec6c0d9a2c01797d7cc3b8e444a3ceb235f4480dad70e75c4a9c0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "encryptionOption", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="objectKeyPrefix")
    def object_key_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "objectKeyPrefix"))

    @object_key_prefix.setter
    def object_key_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4ed9ef9298236038c36b1fff88f55774a31a7c4e4e5ab66bb6870fa32567c20)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "objectKeyPrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2d668f4878c37364126f6496e0698b97ecb660cc07b0abc56a498e5d52ddd78)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummary",
    jsii_struct_bases=[],
    name_mapping={
        "error_report_location": "errorReportLocation",
        "execution_stats": "executionStats",
        "query_insights_response": "queryInsightsResponse",
    },
)
class TimestreamqueryScheduledQueryLastRunSummary:
    def __init__(
        self,
        *,
        error_report_location: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation", typing.Dict[builtins.str, typing.Any]]]]] = None,
        execution_stats: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryExecutionStats", typing.Dict[builtins.str, typing.Any]]]]] = None,
        query_insights_response: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param error_report_location: error_report_location block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_location TimestreamqueryScheduledQuery#error_report_location}
        :param execution_stats: execution_stats block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_stats TimestreamqueryScheduledQuery#execution_stats}
        :param query_insights_response: query_insights_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_insights_response TimestreamqueryScheduledQuery#query_insights_response}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4889aed33e3cc29d04ca890e7071ca5a6b2fdac96228dfadff48007056dd5562)
            check_type(argname="argument error_report_location", value=error_report_location, expected_type=type_hints["error_report_location"])
            check_type(argname="argument execution_stats", value=execution_stats, expected_type=type_hints["execution_stats"])
            check_type(argname="argument query_insights_response", value=query_insights_response, expected_type=type_hints["query_insights_response"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if error_report_location is not None:
            self._values["error_report_location"] = error_report_location
        if execution_stats is not None:
            self._values["execution_stats"] = execution_stats
        if query_insights_response is not None:
            self._values["query_insights_response"] = query_insights_response

    @builtins.property
    def error_report_location(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation"]]]:
        '''error_report_location block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_location TimestreamqueryScheduledQuery#error_report_location}
        '''
        result = self._values.get("error_report_location")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation"]]], result)

    @builtins.property
    def execution_stats(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryExecutionStats"]]]:
        '''execution_stats block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_stats TimestreamqueryScheduledQuery#execution_stats}
        '''
        result = self._values.get("execution_stats")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryExecutionStats"]]], result)

    @builtins.property
    def query_insights_response(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse"]]]:
        '''query_insights_response block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_insights_response TimestreamqueryScheduledQuery#query_insights_response}
        '''
        result = self._values.get("query_insights_response")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryLastRunSummary(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation",
    jsii_struct_bases=[],
    name_mapping={"s3_report_location": "s3ReportLocation"},
)
class TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation:
    def __init__(
        self,
        *,
        s3_report_location: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param s3_report_location: s3_report_location block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#s3_report_location TimestreamqueryScheduledQuery#s3_report_location}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a81950de78f0817ba22d63df76b458238ed22dbd51c82eda6910085ffbb8823a)
            check_type(argname="argument s3_report_location", value=s3_report_location, expected_type=type_hints["s3_report_location"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if s3_report_location is not None:
            self._values["s3_report_location"] = s3_report_location

    @builtins.property
    def s3_report_location(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation"]]]:
        '''s3_report_location block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#s3_report_location TimestreamqueryScheduledQuery#s3_report_location}
        '''
        result = self._values.get("s3_report_location")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bc6da892bf8bc7f83223163326a282484157583a45d9179223e667797cc701c1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32759d6196e1b04c1e305a1d163d8cd69081154b8340fb3697d937b1e0a0011a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca48af9a4086dc9ff6d5ceb0b9b79d587b1d9d043e304cd6aa4ceffa17f0d4e0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3348865de036e91ed5caf0343366791163b7dcf96bcc8ddc616d4d28bcb8fce5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d42fe76fbc2aae4167f80bf48c0001a5b524f828bfb88e92089601c080bfc209)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a505a595c7cf4d9b96b8f8a5b63586855609eee8303f2893e60dc14bc3171bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__71e73ed26107dfb90b079b183b1f95962960cc008f5005fe54845aa6601f8c43)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putS3ReportLocation")
    def put_s3_report_location(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3971ab64b495648f5cef3bffa9a9048231a849b27cb1419a152c989674f04f8a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putS3ReportLocation", [value]))

    @jsii.member(jsii_name="resetS3ReportLocation")
    def reset_s3_report_location(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3ReportLocation", []))

    @builtins.property
    @jsii.member(jsii_name="s3ReportLocation")
    def s3_report_location(
        self,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocationList":
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocationList", jsii.get(self, "s3ReportLocation"))

    @builtins.property
    @jsii.member(jsii_name="s3ReportLocationInput")
    def s3_report_location_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation"]]], jsii.get(self, "s3ReportLocationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dcc54f41645564bbda6613b1b5373aac2f838e4e75911dfc8f1facc2c75763db)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation",
    jsii_struct_bases=[],
    name_mapping={},
)
class TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__93b80f1ac4818cec01660961365bf8917f040f360339de45c8abfe453342a1c0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a4a289fa02a2f947d07082258200f890c0344889978905b382b1d2e625af8a26)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a13a31b90443f7cf62551c272809c320f3fbb7fead385ce183b4ae93f185399)
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
            type_hints = typing.get_type_hints(_typecheckingstub__85976859a3c6fa824572dab9c72263c471361c0e05dbf012c25ae68cc6c77364)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5a41c3c67e6355e99eeaf1bd89a6602bf4702a204a00d0c63ade8e6fab0de49f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e22ae069e6f724bf21bdb8a2d105e661d8600334b176644f625acbf01515021b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6507eb345a802a757dffe26426f75cd25afb7135640272d9d3081582dba52b6e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="bucketName")
    def bucket_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucketName"))

    @builtins.property
    @jsii.member(jsii_name="objectKey")
    def object_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "objectKey"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eae19cec07d5a4590fc0a3fd62a81099d872e8ffb92e36f27fbe3eaae20400dc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryExecutionStats",
    jsii_struct_bases=[],
    name_mapping={},
)
class TimestreamqueryScheduledQueryLastRunSummaryExecutionStats:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryLastRunSummaryExecutionStats(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b071a320747c8ff1fec4892f70ee23600d0f74d905ce1a9ebf5e877e1b5abd3c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f112765bf615afc7b5f0bcfbf5b08968ff20e7ad3c99983a38de5c028059b953)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e19c875a4cb6d68cd256821319d292184f0067d575ef7c42a13a5f8748815f25)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7b26327c840f5280dd2ea23f6c1c1a4d8cdcd6a40778109f36af5b8bd11ce3fb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__168b52a13d89cd3fd5d9213c2a4ab428bde883f46d6b49666ddfd25117d1cfc8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryExecutionStats]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryExecutionStats]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryExecutionStats]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21d298fc1498943d996f70b92a0bdac3b76254e360db478bf0106a690aecd0e2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f14c333e1164a67b3aca86f18782fb73559efcffb6eab1bc037868a1ff8ebef8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="bytesMetered")
    def bytes_metered(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "bytesMetered"))

    @builtins.property
    @jsii.member(jsii_name="cumulativeBytesScanned")
    def cumulative_bytes_scanned(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "cumulativeBytesScanned"))

    @builtins.property
    @jsii.member(jsii_name="dataWrites")
    def data_writes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "dataWrites"))

    @builtins.property
    @jsii.member(jsii_name="executionTimeInMillis")
    def execution_time_in_millis(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "executionTimeInMillis"))

    @builtins.property
    @jsii.member(jsii_name="queryResultRows")
    def query_result_rows(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "queryResultRows"))

    @builtins.property
    @jsii.member(jsii_name="recordsIngested")
    def records_ingested(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "recordsIngested"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryExecutionStats]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryExecutionStats]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryExecutionStats]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56df90f8fd90c6103f5e77ef337a869e90569fc044a2853c0f4dc8110abe06ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryLastRunSummaryList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0d21c0368998ae8e11c8db8cd8c7197f6ef1832b90ccac0e6adbe492701080c8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8f021a1a88e0ca210d92db65bf53c9a6391632cd7a8a4858e12642e656192f3)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d68bb57105c5aa7a0d499a0614018631319f1f10f8c220d6ccd724335c0e5e3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bf2aba7a0e1920f07d4202ae3f6094cbaf82b7458119d60c89d47445bfbf98c6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f06ba75a65e59bafe709231c506fe746db0e3be1777b87e9098f7fd11120ac06)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummary]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummary]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummary]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab7cfa46dca88ae8ea326a19b946fff248eb82d5c75a0a0685098cebd89e0f27)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryLastRunSummaryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8fa7717cc675774e2d5f093f6a9d68fada47ddbd09571c68856d87742eb0e670)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putErrorReportLocation")
    def put_error_report_location(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__161717c7ef702a3e6aa492057662939abcfd777a64a6485c29022340b7b446ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putErrorReportLocation", [value]))

    @jsii.member(jsii_name="putExecutionStats")
    def put_execution_stats(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryExecutionStats, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c43ab61736cd3f48dd9a07992c7dcf466c3dce8345e329c7eb60b8335d6b255)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putExecutionStats", [value]))

    @jsii.member(jsii_name="putQueryInsightsResponse")
    def put_query_insights_response(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b6af863936dfc6c5d0e377ace560451124aded9967404eb4b8a40336cf4824d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putQueryInsightsResponse", [value]))

    @jsii.member(jsii_name="resetErrorReportLocation")
    def reset_error_report_location(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetErrorReportLocation", []))

    @jsii.member(jsii_name="resetExecutionStats")
    def reset_execution_stats(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExecutionStats", []))

    @jsii.member(jsii_name="resetQueryInsightsResponse")
    def reset_query_insights_response(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQueryInsightsResponse", []))

    @builtins.property
    @jsii.member(jsii_name="errorReportLocation")
    def error_report_location(
        self,
    ) -> TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationList:
        return typing.cast(TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationList, jsii.get(self, "errorReportLocation"))

    @builtins.property
    @jsii.member(jsii_name="executionStats")
    def execution_stats(
        self,
    ) -> TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsList:
        return typing.cast(TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsList, jsii.get(self, "executionStats"))

    @builtins.property
    @jsii.member(jsii_name="failureReason")
    def failure_reason(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "failureReason"))

    @builtins.property
    @jsii.member(jsii_name="invocationTime")
    def invocation_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "invocationTime"))

    @builtins.property
    @jsii.member(jsii_name="queryInsightsResponse")
    def query_insights_response(
        self,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseList":
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseList", jsii.get(self, "queryInsightsResponse"))

    @builtins.property
    @jsii.member(jsii_name="runStatus")
    def run_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "runStatus"))

    @builtins.property
    @jsii.member(jsii_name="triggerTime")
    def trigger_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "triggerTime"))

    @builtins.property
    @jsii.member(jsii_name="errorReportLocationInput")
    def error_report_location_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation]]], jsii.get(self, "errorReportLocationInput"))

    @builtins.property
    @jsii.member(jsii_name="executionStatsInput")
    def execution_stats_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryExecutionStats]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryExecutionStats]]], jsii.get(self, "executionStatsInput"))

    @builtins.property
    @jsii.member(jsii_name="queryInsightsResponseInput")
    def query_insights_response_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse"]]], jsii.get(self, "queryInsightsResponseInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummary]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummary]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummary]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__afe1e242753014d026720646038155b45d0bab3533e0dadb6b1217d23f788a76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse",
    jsii_struct_bases=[],
    name_mapping={
        "query_spatial_coverage": "querySpatialCoverage",
        "query_temporal_range": "queryTemporalRange",
    },
)
class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse:
    def __init__(
        self,
        *,
        query_spatial_coverage: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage", typing.Dict[builtins.str, typing.Any]]]]] = None,
        query_temporal_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param query_spatial_coverage: query_spatial_coverage block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_spatial_coverage TimestreamqueryScheduledQuery#query_spatial_coverage}
        :param query_temporal_range: query_temporal_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_temporal_range TimestreamqueryScheduledQuery#query_temporal_range}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67da679ba47ddabe4b8779be8f0db77091136d45fe29c7c8635ad2596129a573)
            check_type(argname="argument query_spatial_coverage", value=query_spatial_coverage, expected_type=type_hints["query_spatial_coverage"])
            check_type(argname="argument query_temporal_range", value=query_temporal_range, expected_type=type_hints["query_temporal_range"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if query_spatial_coverage is not None:
            self._values["query_spatial_coverage"] = query_spatial_coverage
        if query_temporal_range is not None:
            self._values["query_temporal_range"] = query_temporal_range

    @builtins.property
    def query_spatial_coverage(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage"]]]:
        '''query_spatial_coverage block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_spatial_coverage TimestreamqueryScheduledQuery#query_spatial_coverage}
        '''
        result = self._values.get("query_spatial_coverage")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage"]]], result)

    @builtins.property
    def query_temporal_range(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange"]]]:
        '''query_temporal_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_temporal_range TimestreamqueryScheduledQuery#query_temporal_range}
        '''
        result = self._values.get("query_temporal_range")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c1ce5f32b48daf7fa39f3501546112176213c26336d850f28387e865559813ea)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4bf5b419b94c9b63a0813506ee82092c4da3fb05f1b9ddcc41b6aeec00fcdb5e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7cea4d658dc19726124c15a7c69363eed535b74e1a04d80c3db16f43f36c7bfc)
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
            type_hints = typing.get_type_hints(_typecheckingstub__47e9f45512866d9fbc13c19a752482f31e73476eec9aeadf841f4355f5652df0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__09676f09af4430d17eea287d69204d549128e079f79646056013109314aa400b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61ce88067f934919786dac868db38cf99dd86a0b726afd621e83f2e8f225f5b9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__79e9f8a4bdd4e73f627bfd86a4d1bbb362766aba3334689e6fc6842d36cfc662)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putQuerySpatialCoverage")
    def put_query_spatial_coverage(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__688f0131f0a98f244c12f871f9d4b676739b878e380cc81b00942966dc92c00a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putQuerySpatialCoverage", [value]))

    @jsii.member(jsii_name="putQueryTemporalRange")
    def put_query_temporal_range(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e56563cb435ca4a0887a15febd79152647c96d4434244e25af795840d44af6ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putQueryTemporalRange", [value]))

    @jsii.member(jsii_name="resetQuerySpatialCoverage")
    def reset_query_spatial_coverage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQuerySpatialCoverage", []))

    @jsii.member(jsii_name="resetQueryTemporalRange")
    def reset_query_temporal_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQueryTemporalRange", []))

    @builtins.property
    @jsii.member(jsii_name="outputBytes")
    def output_bytes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "outputBytes"))

    @builtins.property
    @jsii.member(jsii_name="outputRows")
    def output_rows(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "outputRows"))

    @builtins.property
    @jsii.member(jsii_name="querySpatialCoverage")
    def query_spatial_coverage(
        self,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageList":
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageList", jsii.get(self, "querySpatialCoverage"))

    @builtins.property
    @jsii.member(jsii_name="queryTableCount")
    def query_table_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "queryTableCount"))

    @builtins.property
    @jsii.member(jsii_name="queryTemporalRange")
    def query_temporal_range(
        self,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeList":
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeList", jsii.get(self, "queryTemporalRange"))

    @builtins.property
    @jsii.member(jsii_name="querySpatialCoverageInput")
    def query_spatial_coverage_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage"]]], jsii.get(self, "querySpatialCoverageInput"))

    @builtins.property
    @jsii.member(jsii_name="queryTemporalRangeInput")
    def query_temporal_range_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange"]]], jsii.get(self, "queryTemporalRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__769d0c0d77d5547de09431be3e186b949a061cf9b094e9afc21c37783073e24f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage",
    jsii_struct_bases=[],
    name_mapping={"max": "max"},
)
class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage:
    def __init__(
        self,
        *,
        max: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param max: max block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7560152d3b16cd9155a04af62d28f0eb05f2cc7a29083b5ed20a1333e0b6c255)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max

    @builtins.property
    def max(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax"]]]:
        '''max block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
        '''
        result = self._values.get("max")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__65c1d1aea36de71fa9594beb7802907f9f1756d42cc73d29e915f737e22393d7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a8884b85037b7116e58015a52f6dc85e2ea08366ff0164938af6349a5ef6447)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__019d0ea727887c527afa25b9b8509d97b1de1247cd5d41fbff3d4ebe8fb54887)
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
            type_hints = typing.get_type_hints(_typecheckingstub__59c415e54a81ebbf79e633d5684f74388b2aa1f6fd3f729182d8d9cac8ec9d1a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__697bff8413b4d41c525d696bd8ce12b58f5fd15810cf5fae77162c368ad295ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2e44cca5764edc17c4925fe7f55f1f3648fcfb15f6fe2b115796dca7adebdeb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax",
    jsii_struct_bases=[],
    name_mapping={},
)
class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMaxList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMaxList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3208a9790efcfa85e69c1b7640fa990f9c76b49d4073c0982493d3647717bb94)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMaxOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e362adfd47c3e2b5155f389b8f2a808b145374331007cde708e0515edf616d2)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMaxOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac4fda8346b3b038187ba25ef73cde3d7a920b351f31f50d565c1996f6e0893c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__46827af235422173c8a5e886439814eeea6f0e7b48a6e1149bef92b87ae1b33c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d0b3a9a573775ed17e7f4dd65e01969d46c1ad4ba64f099f3b817f03e55926d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27b8a50939d1bfe08644f714c88281d065f7eaef8891b435db45e3a4c899d89a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMaxOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMaxOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__65c4ef8ccced28dd7e63b110c8dd4971ccd8b93a3b945f9b09a99648d79de1ef)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="partitionKey")
    def partition_key(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "partitionKey"))

    @builtins.property
    @jsii.member(jsii_name="tableArn")
    def table_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tableArn"))

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a155e62fb2d81911f3b7086af7cf05cb2cebdca0e3ff7b9838f8e03316532a76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__31488cf4692358e15e3fa36b73f915376718b26892dcdfe23ea0330ad1f644e7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMax")
    def put_max(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__920d626c3e7b492c7569e8aa5f84c8d6284bf61b990c33b86813055405fdc040)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMax", [value]))

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(
        self,
    ) -> TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMaxList:
        return typing.cast(TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMaxList, jsii.get(self, "max"))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax]]], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eeaccf15698bea46baf8a74e0c7b5f4c307930b5864f21edf27bb81b0cd8c269)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange",
    jsii_struct_bases=[],
    name_mapping={"max": "max"},
)
class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange:
    def __init__(
        self,
        *,
        max: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param max: max block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__35ea3e5e8865ce02ce3ce8f9e4c74a72adb4618d582b5b8dd58bf774bd0c05f8)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max

    @builtins.property
    def max(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax"]]]:
        '''max block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
        '''
        result = self._values.get("max")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3eefa0c28f422b066842f897cfebcd4eda266a383425e61b6b25aef71a04ffe7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__564c0344708b94c91db7e0d2fb045c8fe6b048cd9a10e8e767483b0e99c28941)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0d19bb2836041d52a070ecc46b3129b9df4ab96fb645dac343c2107b0e61564)
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
            type_hints = typing.get_type_hints(_typecheckingstub__223019afc08efbc0b0fff414b726addfa899fbbadce13fffdc7fca2a922d46fd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6df22112dffff69bbbc8a4c9b7a2449bd4f156ecb901e1e544613ac338ba1509)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea7cd15ecf1bb3df750dedc3338495d6c41e88e86fdc92a3d48af031ddf50680)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax",
    jsii_struct_bases=[],
    name_mapping={},
)
class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMaxList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMaxList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b410e9a50397771ca0eeeb02ada8aa76b155ce68f1381d7e22864e0341c451a7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMaxOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f27f2bf4a05de9abb18639ddb485ef9a34568c3149e95ddcc1c589e87a2f67ed)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMaxOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3772d53a989d15bb6acb4aece4509584adf12e7d1d75aaff07011b029860b895)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0e7d0aafbeade0a422275ed076c0d678b27478ac9fe9ba595a894a3d8f27d7e0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__828caffb94bbe46fd014395a854ef6adceee42a8e5205c293f7a3e6fa9360076)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6436ba997022d88ed26bb21fd8e3ca3cfbb4c9cd3effab9dda1d0e91bcb6f741)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMaxOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMaxOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ccf63f50e62598aa217eba6b0b0780374c0643b6eb3f2f48a569905d8d6458b5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="tableArn")
    def table_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tableArn"))

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__60b68830497f64b18c65b5b8ca1e133d56fe2421df467d7937c95b4e4d0753ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__12b8bf7b96782cabf77a9786355931f353c7528ae4c44d44b9ed8790bbc93b43)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMax")
    def put_max(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90e9314b0b48bb04e0f653a441eb589e0799890f2de5432a587b7e1784a9af2f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMax", [value]))

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(
        self,
    ) -> TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMaxList:
        return typing.cast(TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMaxList, jsii.get(self, "max"))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax]]], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4fcfe76d3fc3e14856904a3308260724050be9e6b217de2ce50aeffe83bd23c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryNotificationConfiguration",
    jsii_struct_bases=[],
    name_mapping={"sns_configuration": "snsConfiguration"},
)
class TimestreamqueryScheduledQueryNotificationConfiguration:
    def __init__(
        self,
        *,
        sns_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param sns_configuration: sns_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#sns_configuration TimestreamqueryScheduledQuery#sns_configuration}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62bf9c532723b93368eb367368e2eabe6f292b29fb5297d2b968006cd69abcf2)
            check_type(argname="argument sns_configuration", value=sns_configuration, expected_type=type_hints["sns_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if sns_configuration is not None:
            self._values["sns_configuration"] = sns_configuration

    @builtins.property
    def sns_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration"]]]:
        '''sns_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#sns_configuration TimestreamqueryScheduledQuery#sns_configuration}
        '''
        result = self._values.get("sns_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryNotificationConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryNotificationConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryNotificationConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__186d179dd8316c6e2fc01221e311ad1938d031e517335586344acf41c31ee8f7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryNotificationConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12bf21ad87e3dd680056984f76a78995b1600d8dc19e2f7cb4352ec4e2782404)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryNotificationConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3011d2e8549b27b0e1f4d2345485b9a1ae806a911aceb5800f1eca57223f838)
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
            type_hints = typing.get_type_hints(_typecheckingstub__49b6fa5faa22f6eba00663adc323617eb2a4d41db3cda2c0cb3cbf9921faa878)
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
            type_hints = typing.get_type_hints(_typecheckingstub__68e33b55d45862031311f8dd490a72c813961ee231dbfd75dbb50150edba73f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryNotificationConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryNotificationConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryNotificationConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23874ad52ba0ab06431f9b3cfbb30f608bf64274fbdcb76b82109c6821cf9f01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryNotificationConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryNotificationConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__efcdfecb4171fcbdf332569d062654aaa57bf60c140177f6d39a011f3a3f3d8c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putSnsConfiguration")
    def put_sns_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__234847a3547e9624dd71535da29e7eec54de63704133cf6258830454444ac8e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSnsConfiguration", [value]))

    @jsii.member(jsii_name="resetSnsConfiguration")
    def reset_sns_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSnsConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="snsConfiguration")
    def sns_configuration(
        self,
    ) -> "TimestreamqueryScheduledQueryNotificationConfigurationSnsConfigurationList":
        return typing.cast("TimestreamqueryScheduledQueryNotificationConfigurationSnsConfigurationList", jsii.get(self, "snsConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="snsConfigurationInput")
    def sns_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration"]]], jsii.get(self, "snsConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryNotificationConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryNotificationConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryNotificationConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c953c5c79788085c57368e6d5ea9aecbe7fefe6e4b0e8f4f5e60935a9d5ae04)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration",
    jsii_struct_bases=[],
    name_mapping={"topic_arn": "topicArn"},
)
class TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration:
    def __init__(self, *, topic_arn: builtins.str) -> None:
        '''
        :param topic_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#topic_arn TimestreamqueryScheduledQuery#topic_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e45f13d03a6b750c09e00961edd92feaaeb1e8b9fd4355a57b20a86b69f455d)
            check_type(argname="argument topic_arn", value=topic_arn, expected_type=type_hints["topic_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "topic_arn": topic_arn,
        }

    @builtins.property
    def topic_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#topic_arn TimestreamqueryScheduledQuery#topic_arn}.'''
        result = self._values.get("topic_arn")
        assert result is not None, "Required property 'topic_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryNotificationConfigurationSnsConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryNotificationConfigurationSnsConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8480f662ccda47a2e52407dcf6f6671744ec49b0c6df1f4ec3c4b755b0cb17eb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryNotificationConfigurationSnsConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a87141a7ae0974cb42b82250f311c72b613ce2fce90101c9c909bfa47d917833)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryNotificationConfigurationSnsConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__504ed64b1ccf6bc82a6e8c43d5deb5d8b9b1e8242fbe976db3da01be72ef5bfb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6e635aca8ad4bccb7fe9221f0599e676f024a380db743052be3b0ca5f517a257)
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
            type_hints = typing.get_type_hints(_typecheckingstub__26c76cf112378ed7fc41deb72a98cae6b4c97834d68482e52ed1a34893cd5f0d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f127de0469b1dfad7c57380d1f91b6db65766503feaa0ca5f89388d3a13ff011)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryNotificationConfigurationSnsConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryNotificationConfigurationSnsConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__65ef0a779639327c2b6625110305ec4c59256848852f3b11291e7b3fd85e4ccf)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="topicArnInput")
    def topic_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "topicArnInput"))

    @builtins.property
    @jsii.member(jsii_name="topicArn")
    def topic_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "topicArn"))

    @topic_arn.setter
    def topic_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d6a682aeedaceadf58b797979f82ce81325fefe6b85cbb7ba569fabafb0a511)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "topicArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dcf62e177c5e1b687060280b583c1b8725aab8dd9a32cc1bc06945b79a411eca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRuns",
    jsii_struct_bases=[],
    name_mapping={
        "error_report_location": "errorReportLocation",
        "execution_stats": "executionStats",
        "query_insights_response": "queryInsightsResponse",
    },
)
class TimestreamqueryScheduledQueryRecentlyFailedRuns:
    def __init__(
        self,
        *,
        error_report_location: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation", typing.Dict[builtins.str, typing.Any]]]]] = None,
        execution_stats: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats", typing.Dict[builtins.str, typing.Any]]]]] = None,
        query_insights_response: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param error_report_location: error_report_location block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_location TimestreamqueryScheduledQuery#error_report_location}
        :param execution_stats: execution_stats block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_stats TimestreamqueryScheduledQuery#execution_stats}
        :param query_insights_response: query_insights_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_insights_response TimestreamqueryScheduledQuery#query_insights_response}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5218e23aa846477bc527a85779277eb3ff64dd192b5079acbe73a52c96cec2a)
            check_type(argname="argument error_report_location", value=error_report_location, expected_type=type_hints["error_report_location"])
            check_type(argname="argument execution_stats", value=execution_stats, expected_type=type_hints["execution_stats"])
            check_type(argname="argument query_insights_response", value=query_insights_response, expected_type=type_hints["query_insights_response"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if error_report_location is not None:
            self._values["error_report_location"] = error_report_location
        if execution_stats is not None:
            self._values["execution_stats"] = execution_stats
        if query_insights_response is not None:
            self._values["query_insights_response"] = query_insights_response

    @builtins.property
    def error_report_location(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation"]]]:
        '''error_report_location block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_location TimestreamqueryScheduledQuery#error_report_location}
        '''
        result = self._values.get("error_report_location")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation"]]], result)

    @builtins.property
    def execution_stats(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats"]]]:
        '''execution_stats block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_stats TimestreamqueryScheduledQuery#execution_stats}
        '''
        result = self._values.get("execution_stats")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats"]]], result)

    @builtins.property
    def query_insights_response(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse"]]]:
        '''query_insights_response block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_insights_response TimestreamqueryScheduledQuery#query_insights_response}
        '''
        result = self._values.get("query_insights_response")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryRecentlyFailedRuns(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation",
    jsii_struct_bases=[],
    name_mapping={"s3_report_location": "s3ReportLocation"},
)
class TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation:
    def __init__(
        self,
        *,
        s3_report_location: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param s3_report_location: s3_report_location block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#s3_report_location TimestreamqueryScheduledQuery#s3_report_location}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8014b11a5bfceff3731d55f4464e4ea58d349bfdf9d9d5060aad7963efa00ce4)
            check_type(argname="argument s3_report_location", value=s3_report_location, expected_type=type_hints["s3_report_location"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if s3_report_location is not None:
            self._values["s3_report_location"] = s3_report_location

    @builtins.property
    def s3_report_location(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation"]]]:
        '''s3_report_location block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#s3_report_location TimestreamqueryScheduledQuery#s3_report_location}
        '''
        result = self._values.get("s3_report_location")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__df2b70707d8f9ffb2f98767784aaa20da325eb8bcd841626295d6c1d929cbc1d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae9a97bd007690a0d8824153898dd93e712fc923cc82ed1451d5cc1f96b282fc)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a11a022765f00f4437fa6da723130067761d985b2ad3aec79ac39df61ca7285)
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
            type_hints = typing.get_type_hints(_typecheckingstub__dd9e43bdd49115806657f8896b18e4d81c7d17fa74f26fbc2f85ab1685fa76f2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f9170b2a695da2066652c18bb50f11850d8fa0f29ab3865c50ddce4f4494e042)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a745e2c58e3211454bd20d2d6ab6c3810517f02be94e6aa71ee64b0e75e4e03c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bed1d94b99cd8900e11b70a1dd62841c581e1b0119abcb8be35abfb7dbc039c2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putS3ReportLocation")
    def put_s3_report_location(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__45aaa173b3d7e4bb13b954a95a69067138006c183cf69d39dd6a32ee5f2611a1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putS3ReportLocation", [value]))

    @jsii.member(jsii_name="resetS3ReportLocation")
    def reset_s3_report_location(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3ReportLocation", []))

    @builtins.property
    @jsii.member(jsii_name="s3ReportLocation")
    def s3_report_location(
        self,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocationList":
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocationList", jsii.get(self, "s3ReportLocation"))

    @builtins.property
    @jsii.member(jsii_name="s3ReportLocationInput")
    def s3_report_location_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation"]]], jsii.get(self, "s3ReportLocationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e2130f0636084f84e325d1a573f28e400e09fcd31075775d423f52005a80db9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation",
    jsii_struct_bases=[],
    name_mapping={},
)
class TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6f09a3bbb0f71c6b570dff4bd587a6f6641c0898abce1ff68dbfecd18b011bc6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__035051666379e5dc8640a60a5bef62c173fb95a99c3f8620225a073d94dd7eb6)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f68b821d6e168c84588d1ee5f3643a9f74d55576f957afb3da3531feded3622e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8011bf956817581c6f4c5a551791b7235a16efec3dcad79d1e98e92755b3ab3a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__fad97f7c903ff4905986bd2d71320a5ed7f07eb71634a3787ac4900de82bca3e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d87a654a925e9ab8ebc464d02943ed89a5a63d58626c8f808bf3eb197354ff5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__508dbf27c4eb619aed60ebb524f2d2a5eefea2bfc4f247dd359c1142e7205371)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="bucketName")
    def bucket_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucketName"))

    @builtins.property
    @jsii.member(jsii_name="objectKey")
    def object_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "objectKey"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cafc4828feb08ba2eb368388832e5b96b938213465a2cd60bd31a749974fd59e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats",
    jsii_struct_bases=[],
    name_mapping={},
)
class TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStatsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStatsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__11f404b84d7739bc6ab16764b42da8c8d09390235ec1b07d2508b5a8378b0b2b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStatsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__006b11990842aa54d334ea763cb4c9da23341ecf2f8b0936fe650d6be6429af2)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStatsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b7a956b62c4a52edf53f40861092445a58f3b527c78befbf9a17bc3fe3c6e4b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f04ddc45aea5d489f020da95de1c8eb040dc6229c02183fb21de9c8f7777d6f2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__58677697aa2365fd4dfa864a2e237e8d6b45ac632542f23a6789e4ca6cfee51a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__63da30ff36bbf20f386b5ad518b553e53e8b8bce9d13d13322e73377782416eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStatsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStatsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__491c3aa1b9c76a5a971d71e49b2e5f88008e2f79a713f103ec91f1e43c5126ab)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="bytesMetered")
    def bytes_metered(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "bytesMetered"))

    @builtins.property
    @jsii.member(jsii_name="cumulativeBytesScanned")
    def cumulative_bytes_scanned(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "cumulativeBytesScanned"))

    @builtins.property
    @jsii.member(jsii_name="dataWrites")
    def data_writes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "dataWrites"))

    @builtins.property
    @jsii.member(jsii_name="executionTimeInMillis")
    def execution_time_in_millis(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "executionTimeInMillis"))

    @builtins.property
    @jsii.member(jsii_name="queryResultRows")
    def query_result_rows(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "queryResultRows"))

    @builtins.property
    @jsii.member(jsii_name="recordsIngested")
    def records_ingested(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "recordsIngested"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__25877c7bbf2677b9719ee7e1fe7f0f1118627c88ea7e02eee2cdc6115fdb3120)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryRecentlyFailedRunsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e1d7afb6b22a292c65a2d32a3e02049407201c68089d1b2ee728cf257bf444b0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0667a70197bcb4a179c5faf0482effc1788424ff697ee19e87789b21bc89cab2)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d8e3baf6b4d36cbe67aa248b684b404455defd01d99e86b43e73ed9d651a9a4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bb42c4d581cc53ea54e3056f588a3e19a138a2a2ab86f22c0295cdb6163e84fe)
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
            type_hints = typing.get_type_hints(_typecheckingstub__641cca3a5232e609d5e441d80e632ddd645aba7d60b4eb7815f5bf3e21694c97)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRuns]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRuns]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRuns]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30ea3a17716fa0b8aa4851b192c910b32380f565450195f3f5939a92bdb47fd5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryRecentlyFailedRunsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a35c747470e179eb7a75d0c59be12ec8be192ce785e82f6ee1d8bcea20c381e3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putErrorReportLocation")
    def put_error_report_location(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83a7b3745e3fe2b5e7f9217d8b2a654e37b6b09720894ecf716a58d915b2f28c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putErrorReportLocation", [value]))

    @jsii.member(jsii_name="putExecutionStats")
    def put_execution_stats(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc5dc30ce7af2a2fde84dc0b962bdbe5fb720e5f38719200a73afffd03db3e12)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putExecutionStats", [value]))

    @jsii.member(jsii_name="putQueryInsightsResponse")
    def put_query_insights_response(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d86b79935cc2105cb1533256c92e4f7622990f56fe9eb9a80330cdd1b297d7ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putQueryInsightsResponse", [value]))

    @jsii.member(jsii_name="resetErrorReportLocation")
    def reset_error_report_location(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetErrorReportLocation", []))

    @jsii.member(jsii_name="resetExecutionStats")
    def reset_execution_stats(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExecutionStats", []))

    @jsii.member(jsii_name="resetQueryInsightsResponse")
    def reset_query_insights_response(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQueryInsightsResponse", []))

    @builtins.property
    @jsii.member(jsii_name="errorReportLocation")
    def error_report_location(
        self,
    ) -> TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationList:
        return typing.cast(TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationList, jsii.get(self, "errorReportLocation"))

    @builtins.property
    @jsii.member(jsii_name="executionStats")
    def execution_stats(
        self,
    ) -> TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStatsList:
        return typing.cast(TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStatsList, jsii.get(self, "executionStats"))

    @builtins.property
    @jsii.member(jsii_name="failureReason")
    def failure_reason(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "failureReason"))

    @builtins.property
    @jsii.member(jsii_name="invocationTime")
    def invocation_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "invocationTime"))

    @builtins.property
    @jsii.member(jsii_name="queryInsightsResponse")
    def query_insights_response(
        self,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseList":
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseList", jsii.get(self, "queryInsightsResponse"))

    @builtins.property
    @jsii.member(jsii_name="runStatus")
    def run_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "runStatus"))

    @builtins.property
    @jsii.member(jsii_name="triggerTime")
    def trigger_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "triggerTime"))

    @builtins.property
    @jsii.member(jsii_name="errorReportLocationInput")
    def error_report_location_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation]]], jsii.get(self, "errorReportLocationInput"))

    @builtins.property
    @jsii.member(jsii_name="executionStatsInput")
    def execution_stats_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats]]], jsii.get(self, "executionStatsInput"))

    @builtins.property
    @jsii.member(jsii_name="queryInsightsResponseInput")
    def query_insights_response_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse"]]], jsii.get(self, "queryInsightsResponseInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRuns]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRuns]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRuns]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a651bebda4a6a36cb2f0ee920b768ce0a3f91dd862140d130fc623f22a20361c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse",
    jsii_struct_bases=[],
    name_mapping={
        "query_spatial_coverage": "querySpatialCoverage",
        "query_temporal_range": "queryTemporalRange",
    },
)
class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse:
    def __init__(
        self,
        *,
        query_spatial_coverage: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage", typing.Dict[builtins.str, typing.Any]]]]] = None,
        query_temporal_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param query_spatial_coverage: query_spatial_coverage block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_spatial_coverage TimestreamqueryScheduledQuery#query_spatial_coverage}
        :param query_temporal_range: query_temporal_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_temporal_range TimestreamqueryScheduledQuery#query_temporal_range}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e84e8faad171c788e2e44488ef94fefd1ff641d01cf0983164f4e799468bb8f)
            check_type(argname="argument query_spatial_coverage", value=query_spatial_coverage, expected_type=type_hints["query_spatial_coverage"])
            check_type(argname="argument query_temporal_range", value=query_temporal_range, expected_type=type_hints["query_temporal_range"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if query_spatial_coverage is not None:
            self._values["query_spatial_coverage"] = query_spatial_coverage
        if query_temporal_range is not None:
            self._values["query_temporal_range"] = query_temporal_range

    @builtins.property
    def query_spatial_coverage(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage"]]]:
        '''query_spatial_coverage block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_spatial_coverage TimestreamqueryScheduledQuery#query_spatial_coverage}
        '''
        result = self._values.get("query_spatial_coverage")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage"]]], result)

    @builtins.property
    def query_temporal_range(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange"]]]:
        '''query_temporal_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_temporal_range TimestreamqueryScheduledQuery#query_temporal_range}
        '''
        result = self._values.get("query_temporal_range")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__56647a24e188fea2f67de2057e0151d17def8cfebb093b098883869748de0aa6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e39135d25054a5b47930de8b6f0a8d786c6c528865fcd6961b706ed4e53d186)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ffeb46bd17ecde233688e354bd340c82218c29f958199a30d3a5dd94562a7a92)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ab0460a7bf03e16012ba1208b6b2ee36c3c9549a0120463a2e318607fbe5d4e4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5b7704951f84a8c3bf3834cd89f1ca36b2c14f37dc828bce013930141dbe8358)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e91abbc2408e50d47890fc40d38a7c0b5edf5cb26b549e06138a972c148099b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a7f3f282f8a1bb9273467a7098d7abeb2fe1ebe6ac45dd2ddfe9b82fef753f0e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putQuerySpatialCoverage")
    def put_query_spatial_coverage(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7f01e7e9c6af8e68e6709f5c01c128c441caaa636ed9725ecbb934fff1bc2ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putQuerySpatialCoverage", [value]))

    @jsii.member(jsii_name="putQueryTemporalRange")
    def put_query_temporal_range(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14bb355b40d991216ef9c612a6575a277225f33de524051e2197f1adf1822ef7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putQueryTemporalRange", [value]))

    @jsii.member(jsii_name="resetQuerySpatialCoverage")
    def reset_query_spatial_coverage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQuerySpatialCoverage", []))

    @jsii.member(jsii_name="resetQueryTemporalRange")
    def reset_query_temporal_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQueryTemporalRange", []))

    @builtins.property
    @jsii.member(jsii_name="outputBytes")
    def output_bytes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "outputBytes"))

    @builtins.property
    @jsii.member(jsii_name="outputRows")
    def output_rows(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "outputRows"))

    @builtins.property
    @jsii.member(jsii_name="querySpatialCoverage")
    def query_spatial_coverage(
        self,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageList":
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageList", jsii.get(self, "querySpatialCoverage"))

    @builtins.property
    @jsii.member(jsii_name="queryTableCount")
    def query_table_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "queryTableCount"))

    @builtins.property
    @jsii.member(jsii_name="queryTemporalRange")
    def query_temporal_range(
        self,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeList":
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeList", jsii.get(self, "queryTemporalRange"))

    @builtins.property
    @jsii.member(jsii_name="querySpatialCoverageInput")
    def query_spatial_coverage_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage"]]], jsii.get(self, "querySpatialCoverageInput"))

    @builtins.property
    @jsii.member(jsii_name="queryTemporalRangeInput")
    def query_temporal_range_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange"]]], jsii.get(self, "queryTemporalRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b14d37b97094442876a6320939bf6c1a741397e7216b96f318ea31952bdec37e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage",
    jsii_struct_bases=[],
    name_mapping={"max": "max"},
)
class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage:
    def __init__(
        self,
        *,
        max: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param max: max block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46ecdbec8d11e4bff3b9df51b19f6a9cf4da3a113beeafc8a108933c11df042a)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max

    @builtins.property
    def max(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax"]]]:
        '''max block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
        '''
        result = self._values.get("max")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d1fe1b75d57b579409f7bf123db8999b5219cadee6cb1032969ba6f30f1b1db4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a2060308e115436af75eff0f34ab9ae0a48620f3467491e8faee4173e5f932c8)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1031a3177f45f5cd50c983cde9166b42873f6253e6be3d38d5940fc6d43019d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c1f70b683e2b90186418d26486fb5bb228a8cc84bf00872b921c7bf682e87d4e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2f50c0dce79745ae7d6e608e342051846aa3a9fc64a8e5767b9d4bbf2ed3bf3f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a8669bb0906cf6a29817210b1d2d9316344dca324e8d744e6482af89d0e23945)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax",
    jsii_struct_bases=[],
    name_mapping={},
)
class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMaxList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMaxList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0e06751ced86f096dd3286d9434b0aeb8525298bd49a9324de61d17958d3ec49)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMaxOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6478c9bcc594f087cb741845e1cd626781004173c9395377f27a91a10cf7003)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMaxOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e13cc1d13372ef341cdebb61eb46fa5a51aee6a35d2dbce4f9b57e23ab3f18f6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__99475701d2bd9222acd67617ed0281ec57147baf4b20ead94579ce6b64a5b2eb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c9d3fd8ecef7ee34210c2385859d848723a3d5e7f66c9898e0bf030118022119)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e0e1f55e6042ca6e82287a847b6471897a234f741e20e7690660f4ec7e076d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMaxOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMaxOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__017010873efa84ce26e3166d00cf88572acd47c9de94324cf0596140f0b1cdf7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="partitionKey")
    def partition_key(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "partitionKey"))

    @builtins.property
    @jsii.member(jsii_name="tableArn")
    def table_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tableArn"))

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8ef9c2024966e31d21163824ce77122f136bfc597f8d2393e9ffd7b16480a15)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7da3df8a8702906e84cdd5f94848f04885cd3a4e1f75a43ad53b818252641c50)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMax")
    def put_max(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5f54de903ede151a407bab2299dcbae1b1df38a5c0a5eea0316fe4d11dce04ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMax", [value]))

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(
        self,
    ) -> TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMaxList:
        return typing.cast(TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMaxList, jsii.get(self, "max"))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax]]], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15c7a8bada12cfa953934c3e32193d1a73b80e2937df584461fc43bd271226d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange",
    jsii_struct_bases=[],
    name_mapping={"max": "max"},
)
class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange:
    def __init__(
        self,
        *,
        max: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param max: max block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7554251d0035f497c51339be735e8f20d4be42aebe09e1cf550b957a01efc1af)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max

    @builtins.property
    def max(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax"]]]:
        '''max block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
        '''
        result = self._values.get("max")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__791f1556da9273e26c044e24f1690aa2d0c2892ca09b13808255f88c0cd07fb8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eed5fd807166834d1838487bd117e738fa70cc0000729c1be569a6814be33e8a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a69832547fa5f8f24039e28bb61949787ca1a9463243d3c426c317107dd1fd71)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c4e25c95816793bf18adf57fc6c08a2358af3e0250f0386323b9474d0c059e67)
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
            type_hints = typing.get_type_hints(_typecheckingstub__19a0acdabd47ef39c351a65547ea6743b753d3bea3a286143397fe9c050d035c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b283cf11157fac99ade698bfbd92c7ae2d30afd463dba17cb1886ff8e0b8cf95)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax",
    jsii_struct_bases=[],
    name_mapping={},
)
class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMaxList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMaxList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__687ae30e06c253f580f60c2922f0dd4a12a43ec1fc9cc68e29f71b96abb813ac)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMaxOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ec5b51f2fd3ee337ca32f8958685b54129e9881ffe9b77dbda004bb526f001f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMaxOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e5cac1ae6295fa45c1860b03841331243acf9d5f8c54a7374fa6a6a0e2a4463)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f5a6f765c06d2597e65c70c8adb6f7854eedd39b08ef8ed4b842042f34b2ac63)
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
            type_hints = typing.get_type_hints(_typecheckingstub__82f727ec5bf2bdee02f452c0580424f29a2644e46143fcbb6369129dddd03384)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01b8c41d3b6d6dc409d514d196bac67597f4be1814e4d94790a01a76088c615d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMaxOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMaxOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c1325ef4026546a0a6ca23bacb3ac9f3de0a1955626d3a506689093fa4b7c553)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="tableArn")
    def table_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tableArn"))

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__542624e2347b4e1c2e8c3bfb55f981c46a6d3e224de274df7348b60630e9520f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d0627201f2068d7019ebd7cfb014873d86518581efb674659935bfd994ce2041)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMax")
    def put_max(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0fe4007b0ae51f5500ba62c4034e9d631dc17dae9a482694c36b42db35e8b12)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMax", [value]))

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(
        self,
    ) -> TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMaxList:
        return typing.cast(TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMaxList, jsii.get(self, "max"))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax]]], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__109a3ce17f1536b70a80fd33a9ded3c1ff2da60528a7704e04253e04a344a72c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryScheduleConfiguration",
    jsii_struct_bases=[],
    name_mapping={"schedule_expression": "scheduleExpression"},
)
class TimestreamqueryScheduledQueryScheduleConfiguration:
    def __init__(self, *, schedule_expression: builtins.str) -> None:
        '''
        :param schedule_expression: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#schedule_expression TimestreamqueryScheduledQuery#schedule_expression}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__94656a7311a2890f14112baf6ee093379688b036f1efd0232931bcc84e6ab4ba)
            check_type(argname="argument schedule_expression", value=schedule_expression, expected_type=type_hints["schedule_expression"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "schedule_expression": schedule_expression,
        }

    @builtins.property
    def schedule_expression(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#schedule_expression TimestreamqueryScheduledQuery#schedule_expression}.'''
        result = self._values.get("schedule_expression")
        assert result is not None, "Required property 'schedule_expression' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryScheduleConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryScheduleConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryScheduleConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__551943a8454e0405138918823e2165aa40588c22ca0e59cb1ad28b4382c5caf6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryScheduleConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea133d054384eb257871c09b11d7bbea3f6660ccc009d28fdb4ed551051b8467)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryScheduleConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e5c823f1f608794cfa540c16730b847c3006b7b5e6be3ab1a41f3586c3794c9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e7c8845cf730b6277d1fc0d406dbf1fa6e7dea5f45686e5a83d05c000fd2556e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5555f3468926154dcab79df15393ab5bd77154fb18d9f1c6ccff4ba9f1f2c75c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryScheduleConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryScheduleConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryScheduleConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fbe2c8a5fc79a3745fbe701fbfe0d0b4cc15a062aacd47c790371ab5523c6cc8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryScheduleConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryScheduleConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__78e3998023337b31ac6761f73b2f38dce7c77ff3f2425801d6ff795f34f66ac3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

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
            type_hints = typing.get_type_hints(_typecheckingstub__1a616c4c48ea47ef3efd4175bb9670fac05501cdccb10956523118e27027e687)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "scheduleExpression", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryScheduleConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryScheduleConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryScheduleConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__92edb6d96b3be28a0c22fa2aea29968453168fce6be8c1759b63b29cab2ee0ca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfiguration",
    jsii_struct_bases=[],
    name_mapping={"timestream_configuration": "timestreamConfiguration"},
)
class TimestreamqueryScheduledQueryTargetConfiguration:
    def __init__(
        self,
        *,
        timestream_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param timestream_configuration: timestream_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#timestream_configuration TimestreamqueryScheduledQuery#timestream_configuration}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd03af80afffca2ee7cc45a607d082566256c7833313c808e33ac43b74b67f91)
            check_type(argname="argument timestream_configuration", value=timestream_configuration, expected_type=type_hints["timestream_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if timestream_configuration is not None:
            self._values["timestream_configuration"] = timestream_configuration

    @builtins.property
    def timestream_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration"]]]:
        '''timestream_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#timestream_configuration TimestreamqueryScheduledQuery#timestream_configuration}
        '''
        result = self._values.get("timestream_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryTargetConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryTargetConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f8a81ae250df0590abf5d792ad399e36c3aa9a490887cdd51f176a8b20ab61e1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryTargetConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d239b043f61d301f9581c8409dfde4555bdd55ccc432bfb07fb27082018f99ef)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryTargetConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c795cf844896284e3e80f8a289c96396b45a7f45d75a3698f350361483ba88b1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__200f1edfb4b21d3a51092ee4187a2eacccfeb78c8544dafd41a162a0eed8a285)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1646595fe4d60da83ea746594dd357211f019f21fc020b140c2f1c1f1a9b2e65)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aedb57befc366421d3ff80997ac18d1f4bf2c8ac242ae07b01df53d52a08767a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryTargetConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b4059d4d9e439f5dbe5e10eb50715a199fc189de6b1e715b5acb6696a395055b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putTimestreamConfiguration")
    def put_timestream_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2755e6225297ab75c4be9712f7d155a20fe86acca11007194e5707077948fac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTimestreamConfiguration", [value]))

    @jsii.member(jsii_name="resetTimestreamConfiguration")
    def reset_timestream_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimestreamConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="timestreamConfiguration")
    def timestream_configuration(
        self,
    ) -> "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationList":
        return typing.cast("TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationList", jsii.get(self, "timestreamConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="timestreamConfigurationInput")
    def timestream_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration"]]], jsii.get(self, "timestreamConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d120a569206538392e4c412e1b64c7678590e2282591206c935381a65a0e6e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "database_name": "databaseName",
        "table_name": "tableName",
        "time_column": "timeColumn",
        "dimension_mapping": "dimensionMapping",
        "measure_name_column": "measureNameColumn",
        "mixed_measure_mapping": "mixedMeasureMapping",
        "multi_measure_mappings": "multiMeasureMappings",
    },
)
class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration:
    def __init__(
        self,
        *,
        database_name: builtins.str,
        table_name: builtins.str,
        time_column: builtins.str,
        dimension_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping", typing.Dict[builtins.str, typing.Any]]]]] = None,
        measure_name_column: typing.Optional[builtins.str] = None,
        mixed_measure_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping", typing.Dict[builtins.str, typing.Any]]]]] = None,
        multi_measure_mappings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param database_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#database_name TimestreamqueryScheduledQuery#database_name}.
        :param table_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#table_name TimestreamqueryScheduledQuery#table_name}.
        :param time_column: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#time_column TimestreamqueryScheduledQuery#time_column}.
        :param dimension_mapping: dimension_mapping block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#dimension_mapping TimestreamqueryScheduledQuery#dimension_mapping}
        :param measure_name_column: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_name_column TimestreamqueryScheduledQuery#measure_name_column}.
        :param mixed_measure_mapping: mixed_measure_mapping block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#mixed_measure_mapping TimestreamqueryScheduledQuery#mixed_measure_mapping}
        :param multi_measure_mappings: multi_measure_mappings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_mappings TimestreamqueryScheduledQuery#multi_measure_mappings}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0d6f96f72a8fb286dc5ed79402dc4257bedfe300ec6ef1811936fb035a78101)
            check_type(argname="argument database_name", value=database_name, expected_type=type_hints["database_name"])
            check_type(argname="argument table_name", value=table_name, expected_type=type_hints["table_name"])
            check_type(argname="argument time_column", value=time_column, expected_type=type_hints["time_column"])
            check_type(argname="argument dimension_mapping", value=dimension_mapping, expected_type=type_hints["dimension_mapping"])
            check_type(argname="argument measure_name_column", value=measure_name_column, expected_type=type_hints["measure_name_column"])
            check_type(argname="argument mixed_measure_mapping", value=mixed_measure_mapping, expected_type=type_hints["mixed_measure_mapping"])
            check_type(argname="argument multi_measure_mappings", value=multi_measure_mappings, expected_type=type_hints["multi_measure_mappings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "database_name": database_name,
            "table_name": table_name,
            "time_column": time_column,
        }
        if dimension_mapping is not None:
            self._values["dimension_mapping"] = dimension_mapping
        if measure_name_column is not None:
            self._values["measure_name_column"] = measure_name_column
        if mixed_measure_mapping is not None:
            self._values["mixed_measure_mapping"] = mixed_measure_mapping
        if multi_measure_mappings is not None:
            self._values["multi_measure_mappings"] = multi_measure_mappings

    @builtins.property
    def database_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#database_name TimestreamqueryScheduledQuery#database_name}.'''
        result = self._values.get("database_name")
        assert result is not None, "Required property 'database_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def table_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#table_name TimestreamqueryScheduledQuery#table_name}.'''
        result = self._values.get("table_name")
        assert result is not None, "Required property 'table_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def time_column(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#time_column TimestreamqueryScheduledQuery#time_column}.'''
        result = self._values.get("time_column")
        assert result is not None, "Required property 'time_column' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def dimension_mapping(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping"]]]:
        '''dimension_mapping block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#dimension_mapping TimestreamqueryScheduledQuery#dimension_mapping}
        '''
        result = self._values.get("dimension_mapping")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping"]]], result)

    @builtins.property
    def measure_name_column(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_name_column TimestreamqueryScheduledQuery#measure_name_column}.'''
        result = self._values.get("measure_name_column")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def mixed_measure_mapping(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping"]]]:
        '''mixed_measure_mapping block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#mixed_measure_mapping TimestreamqueryScheduledQuery#mixed_measure_mapping}
        '''
        result = self._values.get("mixed_measure_mapping")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping"]]], result)

    @builtins.property
    def multi_measure_mappings(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings"]]]:
        '''multi_measure_mappings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_mappings TimestreamqueryScheduledQuery#multi_measure_mappings}
        '''
        result = self._values.get("multi_measure_mappings")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping",
    jsii_struct_bases=[],
    name_mapping={"dimension_value_type": "dimensionValueType", "name": "name"},
)
class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping:
    def __init__(
        self,
        *,
        dimension_value_type: builtins.str,
        name: builtins.str,
    ) -> None:
        '''
        :param dimension_value_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#dimension_value_type TimestreamqueryScheduledQuery#dimension_value_type}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__20177980219772f2b2a183abad73e103559f6c133c320e6944ff3ae2b3b29fe7)
            check_type(argname="argument dimension_value_type", value=dimension_value_type, expected_type=type_hints["dimension_value_type"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "dimension_value_type": dimension_value_type,
            "name": name,
        }

    @builtins.property
    def dimension_value_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#dimension_value_type TimestreamqueryScheduledQuery#dimension_value_type}.'''
        result = self._values.get("dimension_value_type")
        assert result is not None, "Required property 'dimension_value_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1e2193806b603e2ee3437877b228cb3d3cc308c604bf6c83b2b073d116be9f25)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f114bfe372af455f5765074e7a8a676d2f343bc98626986c3a7ec36222c5896c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__250549a02ec213f32bc3f10dfacc4ecb1e03e90c2cfd75200fa653f89a3aec8e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2c69901fa46d6b9aaf75847d334871698121f70c6760ffd47a8a89bd119737d8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__750b6d1f009253dbc6c4459bb13a1a225f2982a00812af4e865a1dba21209d48)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f6bb6e6a7f99d134cc2a336aef8865f83b33f8743869e3bc16ac5f9385e263d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fa66b1159c3576c26adcff946e4ea10402a9f571dcdc15e1842acd5d9a771555)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="dimensionValueTypeInput")
    def dimension_value_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dimensionValueTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="dimensionValueType")
    def dimension_value_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dimensionValueType"))

    @dimension_value_type.setter
    def dimension_value_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7dc272a2b917b10d93260cff52fd40f557c81bd0a8f3ece6de652a5d565b6053)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dimensionValueType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f52edac65a7221d588f9021899b3e33a012cd9072ee7eea8c8bc8e90a8bd6ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__953f1a2454e316f6b40dd070f004acc34f642d6f6a24d4b57551367cbb8b7cda)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6dec53b4e333f582dbc861dd75f1ac6434806c41e1cabf13659289ab0f4a42c1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a5d9860d3a965d73eac247272df24f47a651dbc90094da55718fb293b37b94d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__678dbee5813b489f24cd4459f44796a97767dc31621f64216fd941d399d9f4e4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__29230f2deeb650f230a6995dceafad85719e68b5c4d758700025d6a00395f93b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c1e6664ee935fa81b274441eb15fdb3cdfdad90709fa0143dc54f269415cd3d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f26c7628966879bc0cdefafe45aa12b6c749711403ee364a4eb2e83928eaaff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping",
    jsii_struct_bases=[],
    name_mapping={
        "measure_value_type": "measureValueType",
        "measure_name": "measureName",
        "multi_measure_attribute_mapping": "multiMeasureAttributeMapping",
        "source_column": "sourceColumn",
        "target_measure_name": "targetMeasureName",
    },
)
class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping:
    def __init__(
        self,
        *,
        measure_value_type: builtins.str,
        measure_name: typing.Optional[builtins.str] = None,
        multi_measure_attribute_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping", typing.Dict[builtins.str, typing.Any]]]]] = None,
        source_column: typing.Optional[builtins.str] = None,
        target_measure_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param measure_value_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_value_type TimestreamqueryScheduledQuery#measure_value_type}.
        :param measure_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_name TimestreamqueryScheduledQuery#measure_name}.
        :param multi_measure_attribute_mapping: multi_measure_attribute_mapping block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_attribute_mapping TimestreamqueryScheduledQuery#multi_measure_attribute_mapping}
        :param source_column: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#source_column TimestreamqueryScheduledQuery#source_column}.
        :param target_measure_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_measure_name TimestreamqueryScheduledQuery#target_measure_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5ad1c487a24f0bfcdcba836a2f9027a004435d229f09a2ac2c77e6759297e07)
            check_type(argname="argument measure_value_type", value=measure_value_type, expected_type=type_hints["measure_value_type"])
            check_type(argname="argument measure_name", value=measure_name, expected_type=type_hints["measure_name"])
            check_type(argname="argument multi_measure_attribute_mapping", value=multi_measure_attribute_mapping, expected_type=type_hints["multi_measure_attribute_mapping"])
            check_type(argname="argument source_column", value=source_column, expected_type=type_hints["source_column"])
            check_type(argname="argument target_measure_name", value=target_measure_name, expected_type=type_hints["target_measure_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "measure_value_type": measure_value_type,
        }
        if measure_name is not None:
            self._values["measure_name"] = measure_name
        if multi_measure_attribute_mapping is not None:
            self._values["multi_measure_attribute_mapping"] = multi_measure_attribute_mapping
        if source_column is not None:
            self._values["source_column"] = source_column
        if target_measure_name is not None:
            self._values["target_measure_name"] = target_measure_name

    @builtins.property
    def measure_value_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_value_type TimestreamqueryScheduledQuery#measure_value_type}.'''
        result = self._values.get("measure_value_type")
        assert result is not None, "Required property 'measure_value_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def measure_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_name TimestreamqueryScheduledQuery#measure_name}.'''
        result = self._values.get("measure_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def multi_measure_attribute_mapping(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping"]]]:
        '''multi_measure_attribute_mapping block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_attribute_mapping TimestreamqueryScheduledQuery#multi_measure_attribute_mapping}
        '''
        result = self._values.get("multi_measure_attribute_mapping")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping"]]], result)

    @builtins.property
    def source_column(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#source_column TimestreamqueryScheduledQuery#source_column}.'''
        result = self._values.get("source_column")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def target_measure_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_measure_name TimestreamqueryScheduledQuery#target_measure_name}.'''
        result = self._values.get("target_measure_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0875099e80e28b6c7a923541ad8c6704843ac942f5dd3cd40f0cc389dbca4436)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5411926c6c1bd51786981a42b3b102bdf69ca5363b811230b8d7c3a1f514cf0b)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4003584bf3c2250121d23b06aee04bf88787fa269b2ccb93beb68d40f9d7a63)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5a204089b90d61a5ac56821741d226a0fd312fa347d31d6b250eabb65dac94af)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5575364cb616e6bb083adf14688213395dd8ff308414db56c1ed51c09a694b4a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6eefd7ffef21f8d385d67917873a2c06685f3ae7177880b840ab6f98fd196730)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping",
    jsii_struct_bases=[],
    name_mapping={
        "measure_value_type": "measureValueType",
        "source_column": "sourceColumn",
        "target_multi_measure_attribute_name": "targetMultiMeasureAttributeName",
    },
)
class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping:
    def __init__(
        self,
        *,
        measure_value_type: builtins.str,
        source_column: builtins.str,
        target_multi_measure_attribute_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param measure_value_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_value_type TimestreamqueryScheduledQuery#measure_value_type}.
        :param source_column: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#source_column TimestreamqueryScheduledQuery#source_column}.
        :param target_multi_measure_attribute_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_multi_measure_attribute_name TimestreamqueryScheduledQuery#target_multi_measure_attribute_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da866461a8477fd87b03e2368dc936d0d1a826f7917c164f60e711c0689677af)
            check_type(argname="argument measure_value_type", value=measure_value_type, expected_type=type_hints["measure_value_type"])
            check_type(argname="argument source_column", value=source_column, expected_type=type_hints["source_column"])
            check_type(argname="argument target_multi_measure_attribute_name", value=target_multi_measure_attribute_name, expected_type=type_hints["target_multi_measure_attribute_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "measure_value_type": measure_value_type,
            "source_column": source_column,
        }
        if target_multi_measure_attribute_name is not None:
            self._values["target_multi_measure_attribute_name"] = target_multi_measure_attribute_name

    @builtins.property
    def measure_value_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_value_type TimestreamqueryScheduledQuery#measure_value_type}.'''
        result = self._values.get("measure_value_type")
        assert result is not None, "Required property 'measure_value_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def source_column(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#source_column TimestreamqueryScheduledQuery#source_column}.'''
        result = self._values.get("source_column")
        assert result is not None, "Required property 'source_column' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def target_multi_measure_attribute_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_multi_measure_attribute_name TimestreamqueryScheduledQuery#target_multi_measure_attribute_name}.'''
        result = self._values.get("target_multi_measure_attribute_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c2a61307e08f3938933b8b5e827dcf7deeb5509c3c94f24099f4025a86d921f4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__756e51df150cd43c2839a476c700d041efeca5904e43fd2da11966a4b28cca3a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7442be1793bfe507f29d9e99b080380c8227bde2eb3267a645dbbd89a928358d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__808113cf7ac99317d4b68aa273f2782b377cd75a689d5e31ebfedfd8bafe098b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e8e5096c8e633f212047c4a07f7d63e94da0290ec4daa929fbe8a7e8a65b9a71)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c1fd539c01bed57f76a86be499a6086395ccecfb4ce9b91f5454913487b590ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__af26eb99d429ccb26f5f88789bf5ae5a0ac7eb758afffd8e5e07ddf3ade492b7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetTargetMultiMeasureAttributeName")
    def reset_target_multi_measure_attribute_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetMultiMeasureAttributeName", []))

    @builtins.property
    @jsii.member(jsii_name="measureValueTypeInput")
    def measure_value_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "measureValueTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceColumnInput")
    def source_column_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceColumnInput"))

    @builtins.property
    @jsii.member(jsii_name="targetMultiMeasureAttributeNameInput")
    def target_multi_measure_attribute_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetMultiMeasureAttributeNameInput"))

    @builtins.property
    @jsii.member(jsii_name="measureValueType")
    def measure_value_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "measureValueType"))

    @measure_value_type.setter
    def measure_value_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61b72b3720096714dee69bd66e0decec586188c72790179aa5bff3f30dcebbca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "measureValueType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sourceColumn")
    def source_column(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceColumn"))

    @source_column.setter
    def source_column(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__031fe6a3ab936ca3d5f651d369c56b236fc94b7656fc80c6af7976c5ef6c4ff5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceColumn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="targetMultiMeasureAttributeName")
    def target_multi_measure_attribute_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetMultiMeasureAttributeName"))

    @target_multi_measure_attribute_name.setter
    def target_multi_measure_attribute_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cbe9df8054121fec78a36ab3b80cd92b1f8636964ab3cd9df37fc4049e01b86a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetMultiMeasureAttributeName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__778fea612504c5597e815cf806e3a0df8630fb54d9ce60d59d1a84a3d1ceb988)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__86db93324005b598c3c9d8be37903ccecab67be9ca4d2df74b73f166412d9686)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMultiMeasureAttributeMapping")
    def put_multi_measure_attribute_mapping(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73f81b1a2de3dd568488d9e983896f47cb4f82dd0faa54303633e7f08a9cb0ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMultiMeasureAttributeMapping", [value]))

    @jsii.member(jsii_name="resetMeasureName")
    def reset_measure_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMeasureName", []))

    @jsii.member(jsii_name="resetMultiMeasureAttributeMapping")
    def reset_multi_measure_attribute_mapping(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMultiMeasureAttributeMapping", []))

    @jsii.member(jsii_name="resetSourceColumn")
    def reset_source_column(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceColumn", []))

    @jsii.member(jsii_name="resetTargetMeasureName")
    def reset_target_measure_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetMeasureName", []))

    @builtins.property
    @jsii.member(jsii_name="multiMeasureAttributeMapping")
    def multi_measure_attribute_mapping(
        self,
    ) -> TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingList:
        return typing.cast(TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingList, jsii.get(self, "multiMeasureAttributeMapping"))

    @builtins.property
    @jsii.member(jsii_name="measureNameInput")
    def measure_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "measureNameInput"))

    @builtins.property
    @jsii.member(jsii_name="measureValueTypeInput")
    def measure_value_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "measureValueTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="multiMeasureAttributeMappingInput")
    def multi_measure_attribute_mapping_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping]]], jsii.get(self, "multiMeasureAttributeMappingInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceColumnInput")
    def source_column_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceColumnInput"))

    @builtins.property
    @jsii.member(jsii_name="targetMeasureNameInput")
    def target_measure_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetMeasureNameInput"))

    @builtins.property
    @jsii.member(jsii_name="measureName")
    def measure_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "measureName"))

    @measure_name.setter
    def measure_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__decac5ce2d70acd771d169e4a98a6d2470ccb4fdaf0c8c52d29cfbd349b49b38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "measureName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="measureValueType")
    def measure_value_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "measureValueType"))

    @measure_value_type.setter
    def measure_value_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__03428feda5736d932f696716b9b5ec1b4a5833cc891efaeb43b6a73aaab8f7a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "measureValueType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sourceColumn")
    def source_column(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceColumn"))

    @source_column.setter
    def source_column(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e0fbc0c02c084e73f91625052c0a3d4d307a602c7cd1e78688434f191fb29f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceColumn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="targetMeasureName")
    def target_measure_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetMeasureName"))

    @target_measure_name.setter
    def target_measure_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18022b8c9e47dedb134156f2d353d3a46d8588a8001ded8b67e5ad7be879acab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetMeasureName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c11ef2cbc43595a065522589845a8aece3a6edf44cc184bf7994af303ae18ab1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings",
    jsii_struct_bases=[],
    name_mapping={
        "multi_measure_attribute_mapping": "multiMeasureAttributeMapping",
        "target_multi_measure_name": "targetMultiMeasureName",
    },
)
class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings:
    def __init__(
        self,
        *,
        multi_measure_attribute_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping", typing.Dict[builtins.str, typing.Any]]]]] = None,
        target_multi_measure_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param multi_measure_attribute_mapping: multi_measure_attribute_mapping block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_attribute_mapping TimestreamqueryScheduledQuery#multi_measure_attribute_mapping}
        :param target_multi_measure_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_multi_measure_name TimestreamqueryScheduledQuery#target_multi_measure_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e6b997608a4fd326eb84fb4c48cf79993e72d30810c0dfd8a38e065a7b70ec1)
            check_type(argname="argument multi_measure_attribute_mapping", value=multi_measure_attribute_mapping, expected_type=type_hints["multi_measure_attribute_mapping"])
            check_type(argname="argument target_multi_measure_name", value=target_multi_measure_name, expected_type=type_hints["target_multi_measure_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if multi_measure_attribute_mapping is not None:
            self._values["multi_measure_attribute_mapping"] = multi_measure_attribute_mapping
        if target_multi_measure_name is not None:
            self._values["target_multi_measure_name"] = target_multi_measure_name

    @builtins.property
    def multi_measure_attribute_mapping(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping"]]]:
        '''multi_measure_attribute_mapping block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_attribute_mapping TimestreamqueryScheduledQuery#multi_measure_attribute_mapping}
        '''
        result = self._values.get("multi_measure_attribute_mapping")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping"]]], result)

    @builtins.property
    def target_multi_measure_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_multi_measure_name TimestreamqueryScheduledQuery#target_multi_measure_name}.'''
        result = self._values.get("target_multi_measure_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__06b54e1a64dea276de4a9f65391dd4d5e362367e1c766e71e5eba5f589e13cc2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed8ae4cb8cd8d01e852c1fc69cdc02be670ac88f156ab1df71a0f8583954134f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__796909cb8f8b96c36371e2b8416df0823a54c6ed89f78aaa65bab2ee0aa0b9b4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3dac1b4699508a31458de4b9e9c82ba34f190b70220d8f3bd5443bc6d7f826a9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__02f91fa537c23c4083506c2c6829c7ae3d975c4a1f53d54ac2dc3016261a9f11)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5cd8eb5789674929b37610613ce99db80c9a909ae49a12175bc0d8ae871087e5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping",
    jsii_struct_bases=[],
    name_mapping={
        "measure_value_type": "measureValueType",
        "source_column": "sourceColumn",
        "target_multi_measure_attribute_name": "targetMultiMeasureAttributeName",
    },
)
class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping:
    def __init__(
        self,
        *,
        measure_value_type: builtins.str,
        source_column: builtins.str,
        target_multi_measure_attribute_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param measure_value_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_value_type TimestreamqueryScheduledQuery#measure_value_type}.
        :param source_column: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#source_column TimestreamqueryScheduledQuery#source_column}.
        :param target_multi_measure_attribute_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_multi_measure_attribute_name TimestreamqueryScheduledQuery#target_multi_measure_attribute_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f0f9c89dee6dd0b9dcdb5b9d33b8fb48d0e2e1a24e42f28de5465dcbd9bdced5)
            check_type(argname="argument measure_value_type", value=measure_value_type, expected_type=type_hints["measure_value_type"])
            check_type(argname="argument source_column", value=source_column, expected_type=type_hints["source_column"])
            check_type(argname="argument target_multi_measure_attribute_name", value=target_multi_measure_attribute_name, expected_type=type_hints["target_multi_measure_attribute_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "measure_value_type": measure_value_type,
            "source_column": source_column,
        }
        if target_multi_measure_attribute_name is not None:
            self._values["target_multi_measure_attribute_name"] = target_multi_measure_attribute_name

    @builtins.property
    def measure_value_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_value_type TimestreamqueryScheduledQuery#measure_value_type}.'''
        result = self._values.get("measure_value_type")
        assert result is not None, "Required property 'measure_value_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def source_column(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#source_column TimestreamqueryScheduledQuery#source_column}.'''
        result = self._values.get("source_column")
        assert result is not None, "Required property 'source_column' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def target_multi_measure_attribute_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_multi_measure_attribute_name TimestreamqueryScheduledQuery#target_multi_measure_attribute_name}.'''
        result = self._values.get("target_multi_measure_attribute_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__645deefd76bdb6bd0d856fa8e5101e37e696d62b51ae56eadcd9a53ca9425929)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9350d4ceaa9dc437c42297d383bb4b7c2f13b2e0872376a0eb10425ca54640b7)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6bd1121b23a8bf86eb919783a178ebfcec1fce1b17717d494cf1c208feecc638)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5264d6ddeac1248c1e2e0ae00c5e48df1f1c9ea2fc9a784c1c8e4d44be4acc09)
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
            type_hints = typing.get_type_hints(_typecheckingstub__09342e95a80d5e45f6ea4bcd3bebe80c4229c4434168cdb20fd1ae22b7ce4238)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a96b48831e3b47fb8edea394b4f3939217b25c13f7d786bb07759320d2e3c3b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__76bc183909e8f3c525367eeb07b72521dc62c38079f9cb35dc3aae1e945dfa54)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetTargetMultiMeasureAttributeName")
    def reset_target_multi_measure_attribute_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetMultiMeasureAttributeName", []))

    @builtins.property
    @jsii.member(jsii_name="measureValueTypeInput")
    def measure_value_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "measureValueTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceColumnInput")
    def source_column_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceColumnInput"))

    @builtins.property
    @jsii.member(jsii_name="targetMultiMeasureAttributeNameInput")
    def target_multi_measure_attribute_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetMultiMeasureAttributeNameInput"))

    @builtins.property
    @jsii.member(jsii_name="measureValueType")
    def measure_value_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "measureValueType"))

    @measure_value_type.setter
    def measure_value_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__77fe783c5632befe6005e6c18a0b8bb09216daef742c53522805367f81d58216)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "measureValueType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sourceColumn")
    def source_column(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceColumn"))

    @source_column.setter
    def source_column(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f623feb41fb38950a5570b94eef714629571d05dff56498b66749f96df75d54e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceColumn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="targetMultiMeasureAttributeName")
    def target_multi_measure_attribute_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetMultiMeasureAttributeName"))

    @target_multi_measure_attribute_name.setter
    def target_multi_measure_attribute_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0147b6c64937556bb34a3e9a86b0df597bd39d6699692173169f852b0e5ca8b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetMultiMeasureAttributeName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c88448154347d4b971f766ee0094f38bb0ecc8ef9216dfe6336b4352118ef922)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__998e423b2464d1cb99a1777c780fbe349e424116ba4e49e4e664a107fbffdf48)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMultiMeasureAttributeMapping")
    def put_multi_measure_attribute_mapping(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a567f4c80823d2eb59609c1460879d050bf669b8e964a27401065c6af2ec07e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMultiMeasureAttributeMapping", [value]))

    @jsii.member(jsii_name="resetMultiMeasureAttributeMapping")
    def reset_multi_measure_attribute_mapping(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMultiMeasureAttributeMapping", []))

    @jsii.member(jsii_name="resetTargetMultiMeasureName")
    def reset_target_multi_measure_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetMultiMeasureName", []))

    @builtins.property
    @jsii.member(jsii_name="multiMeasureAttributeMapping")
    def multi_measure_attribute_mapping(
        self,
    ) -> TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingList:
        return typing.cast(TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingList, jsii.get(self, "multiMeasureAttributeMapping"))

    @builtins.property
    @jsii.member(jsii_name="multiMeasureAttributeMappingInput")
    def multi_measure_attribute_mapping_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping]]], jsii.get(self, "multiMeasureAttributeMappingInput"))

    @builtins.property
    @jsii.member(jsii_name="targetMultiMeasureNameInput")
    def target_multi_measure_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetMultiMeasureNameInput"))

    @builtins.property
    @jsii.member(jsii_name="targetMultiMeasureName")
    def target_multi_measure_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetMultiMeasureName"))

    @target_multi_measure_name.setter
    def target_multi_measure_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d79760eec1ab4d0166142dc829ff08c5438c625c96c1237dcb1e37676827790)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetMultiMeasureName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4af0dfdd4f1ece4d149c23af396827a6d3050199e9e2fd3cfe792933449d549e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__59c93a4d80264c5b1005c1049f900cbe023c038afcfb7748da32568f9f031afb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putDimensionMapping")
    def put_dimension_mapping(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2cd107ab43493a0adcbc57397c1c1e8c9be0882923f795b3bbf49a61b5953ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDimensionMapping", [value]))

    @jsii.member(jsii_name="putMixedMeasureMapping")
    def put_mixed_measure_mapping(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee64bb751cc8f760964ac6ec7f3b31fd3081e6edd664ef8b23d4176bdd769a47)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMixedMeasureMapping", [value]))

    @jsii.member(jsii_name="putMultiMeasureMappings")
    def put_multi_measure_mappings(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__624090c42012d1a6587751817c6a7797e54c5141050f3cd91a272346efd28a08)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMultiMeasureMappings", [value]))

    @jsii.member(jsii_name="resetDimensionMapping")
    def reset_dimension_mapping(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDimensionMapping", []))

    @jsii.member(jsii_name="resetMeasureNameColumn")
    def reset_measure_name_column(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMeasureNameColumn", []))

    @jsii.member(jsii_name="resetMixedMeasureMapping")
    def reset_mixed_measure_mapping(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMixedMeasureMapping", []))

    @jsii.member(jsii_name="resetMultiMeasureMappings")
    def reset_multi_measure_mappings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMultiMeasureMappings", []))

    @builtins.property
    @jsii.member(jsii_name="dimensionMapping")
    def dimension_mapping(
        self,
    ) -> TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingList:
        return typing.cast(TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingList, jsii.get(self, "dimensionMapping"))

    @builtins.property
    @jsii.member(jsii_name="mixedMeasureMapping")
    def mixed_measure_mapping(
        self,
    ) -> TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingList:
        return typing.cast(TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingList, jsii.get(self, "mixedMeasureMapping"))

    @builtins.property
    @jsii.member(jsii_name="multiMeasureMappings")
    def multi_measure_mappings(
        self,
    ) -> TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsList:
        return typing.cast(TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsList, jsii.get(self, "multiMeasureMappings"))

    @builtins.property
    @jsii.member(jsii_name="databaseNameInput")
    def database_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "databaseNameInput"))

    @builtins.property
    @jsii.member(jsii_name="dimensionMappingInput")
    def dimension_mapping_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping]]], jsii.get(self, "dimensionMappingInput"))

    @builtins.property
    @jsii.member(jsii_name="measureNameColumnInput")
    def measure_name_column_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "measureNameColumnInput"))

    @builtins.property
    @jsii.member(jsii_name="mixedMeasureMappingInput")
    def mixed_measure_mapping_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping]]], jsii.get(self, "mixedMeasureMappingInput"))

    @builtins.property
    @jsii.member(jsii_name="multiMeasureMappingsInput")
    def multi_measure_mappings_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings]]], jsii.get(self, "multiMeasureMappingsInput"))

    @builtins.property
    @jsii.member(jsii_name="tableNameInput")
    def table_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "tableNameInput"))

    @builtins.property
    @jsii.member(jsii_name="timeColumnInput")
    def time_column_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "timeColumnInput"))

    @builtins.property
    @jsii.member(jsii_name="databaseName")
    def database_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "databaseName"))

    @database_name.setter
    def database_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d16ec7c751566c97403f2da8b77b8f6be8fb3b87b2acd8e0821f747945f9207)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "databaseName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="measureNameColumn")
    def measure_name_column(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "measureNameColumn"))

    @measure_name_column.setter
    def measure_name_column(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d11851672064c414ee9ec787f8873d612384279dd3e6893786fa4606bc44a6a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "measureNameColumn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tableName")
    def table_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tableName"))

    @table_name.setter
    def table_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9af1cac823b5d06e660698f208f20149c22d2f8a67b60679418455ef08ffe338)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tableName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="timeColumn")
    def time_column(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "timeColumn"))

    @time_column.setter
    def time_column(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e34e35cb006eeaab4d1bc553e8928f070eabef994bb44c257289888782cd46d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "timeColumn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75f51b75019ec5fe1aa260f90a829755d032f641d7ee7b9517fb29eb382daa85)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class TimestreamqueryScheduledQueryTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#create TimestreamqueryScheduledQuery#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#delete TimestreamqueryScheduledQuery#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#update TimestreamqueryScheduledQuery#update}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__373b4ff395cd1d59e893fbd3438fdea4f5506d5d654938428e0d6c6bd9234bb4)
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
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#create TimestreamqueryScheduledQuery#create}
        '''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#delete TimestreamqueryScheduledQuery#delete}
        '''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#update TimestreamqueryScheduledQuery#update}
        '''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TimestreamqueryScheduledQueryTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TimestreamqueryScheduledQueryTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e73e6c82bcc6923caefb472930e3818dfe52a82fb8cbaf49073cba81f3f1c2b9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__015ad8d3872a91185f6fcf469430b2d85777fcc3568362e2be8627d9ab0a7e04)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd9ceb99a5b6ac7c3d50d6a86a462d07898d6fc4b4b96d6eb0522f0a854dbbb6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ee5224c3e5e0a407f2353d4f25f3b2c1a9a6325669ea8039b2252f071defe17)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5a8ae89ad6d839fcbd3bea14b78cd1b7ddcc86199b6cff09495ab876d4a6a26)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "TimestreamqueryScheduledQuery",
    "TimestreamqueryScheduledQueryConfig",
    "TimestreamqueryScheduledQueryErrorReportConfiguration",
    "TimestreamqueryScheduledQueryErrorReportConfigurationList",
    "TimestreamqueryScheduledQueryErrorReportConfigurationOutputReference",
    "TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration",
    "TimestreamqueryScheduledQueryErrorReportConfigurationS3ConfigurationList",
    "TimestreamqueryScheduledQueryErrorReportConfigurationS3ConfigurationOutputReference",
    "TimestreamqueryScheduledQueryLastRunSummary",
    "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation",
    "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationList",
    "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationOutputReference",
    "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation",
    "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocationList",
    "TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocationOutputReference",
    "TimestreamqueryScheduledQueryLastRunSummaryExecutionStats",
    "TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsList",
    "TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsOutputReference",
    "TimestreamqueryScheduledQueryLastRunSummaryList",
    "TimestreamqueryScheduledQueryLastRunSummaryOutputReference",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseList",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseOutputReference",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageList",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMaxList",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMaxOutputReference",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageOutputReference",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeList",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMaxList",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMaxOutputReference",
    "TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeOutputReference",
    "TimestreamqueryScheduledQueryNotificationConfiguration",
    "TimestreamqueryScheduledQueryNotificationConfigurationList",
    "TimestreamqueryScheduledQueryNotificationConfigurationOutputReference",
    "TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration",
    "TimestreamqueryScheduledQueryNotificationConfigurationSnsConfigurationList",
    "TimestreamqueryScheduledQueryNotificationConfigurationSnsConfigurationOutputReference",
    "TimestreamqueryScheduledQueryRecentlyFailedRuns",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationList",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationOutputReference",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocationList",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocationOutputReference",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStatsList",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStatsOutputReference",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsList",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsOutputReference",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseList",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseOutputReference",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageList",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMaxList",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMaxOutputReference",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageOutputReference",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeList",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMaxList",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMaxOutputReference",
    "TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeOutputReference",
    "TimestreamqueryScheduledQueryScheduleConfiguration",
    "TimestreamqueryScheduledQueryScheduleConfigurationList",
    "TimestreamqueryScheduledQueryScheduleConfigurationOutputReference",
    "TimestreamqueryScheduledQueryTargetConfiguration",
    "TimestreamqueryScheduledQueryTargetConfigurationList",
    "TimestreamqueryScheduledQueryTargetConfigurationOutputReference",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingList",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingOutputReference",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationList",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingList",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingList",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingOutputReference",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingOutputReference",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsList",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingList",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingOutputReference",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsOutputReference",
    "TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationOutputReference",
    "TimestreamqueryScheduledQueryTimeouts",
    "TimestreamqueryScheduledQueryTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__d4910ef76c0ef79d2761ced8e25ef2f205bc2ad652e1906e6c26f5fa19a31f75(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    execution_role_arn: builtins.str,
    name: builtins.str,
    query_string: builtins.str,
    error_report_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryErrorReportConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    kms_key_id: typing.Optional[builtins.str] = None,
    last_run_summary: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummary, typing.Dict[builtins.str, typing.Any]]]]] = None,
    notification_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryNotificationConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    recently_failed_runs: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRuns, typing.Dict[builtins.str, typing.Any]]]]] = None,
    schedule_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryScheduleConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    target_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    timeouts: typing.Optional[typing.Union[TimestreamqueryScheduledQueryTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__2556091caa32fd6647f3eab7ad44ebda679452fedc8b8f222fcaf0df7009b5d7(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75c16bf17e8d78d4c0fdea9b15dd166a58c404f3d59aab6b35bb5deb10ca3517(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryErrorReportConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c921d4f6675a24187419d495653d41c7203ef69e437e783d36445e5bac8036de(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummary, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4c967f0bac3e39f967e8806cb4cb3e04daf7baaff635c1b2fd9980ec966016e(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryNotificationConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a8544668750e757ae55b8ff82fb63d92d87327e5b02f30d72f0c22a88e3fa345(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRuns, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7064cf00bcfdacef55e0c3905a7bf35c65d15ac08a1453eb1be102c2e3857fc8(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryScheduleConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__785a199d49a1ec7ff762a772d2f38ff69fea6a25019f71d53b82320f099aad14(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b98e9cf167d0dca869b1685f7e4de2d0b43e78f58098c6f3e89b7e30de01572(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d49537029e85c1b12df7f7d199bde773f81cc3b120b6dec2c70df8f5d1fb2f0e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fcd27625a7f897dce3c4d642c2f6d9b35ff4e4db3b359752b760bffe43740eb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf8a3fe7537190397a79d96ecd3d88e6013b9687d156ee5f9d30493c4f9d694e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5cab8552bee25624ae1fafdf952f3a7c9d059be96e2c87523302e8b0e7ebf6d6(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1112ee8ce5dfd77508984ccb8b5d9063fd39ebe902c68b8192119de47f265059(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    execution_role_arn: builtins.str,
    name: builtins.str,
    query_string: builtins.str,
    error_report_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryErrorReportConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    kms_key_id: typing.Optional[builtins.str] = None,
    last_run_summary: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummary, typing.Dict[builtins.str, typing.Any]]]]] = None,
    notification_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryNotificationConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    recently_failed_runs: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRuns, typing.Dict[builtins.str, typing.Any]]]]] = None,
    schedule_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryScheduleConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    target_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    timeouts: typing.Optional[typing.Union[TimestreamqueryScheduledQueryTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4af76b9e672e0be564beba4401adbcf758b1ea7b8d345bb0ff59274e43a03ce(
    *,
    s3_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b10b30fabf2adcbf4c394a3fc0835138e38e2bcaee213769bd7a4d542787debe(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79fc10e9eb9f64b0f0dc43216b1afeb680647279e5dd3c5802b9cbf418beb4df(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0139fba699db5c7964aa34b6845800f157a98305e5fd4bd83c0237773b112bb5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__172b698d0efcdd64b1090be80726ba2bccda202f0a3da5dd6b31e0bd95ad21e6(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10e9f72be45e47a34f571f1a07f3ddb23a303d3c4ee113548a1aa01f68d00fc7(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56e3c70d5a6a2ab0f80c4bcf62c3cb911409ebd4bbb8d894e410a5a1f45aca9d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryErrorReportConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e669a43baad90d78c4eff50692e64ce0df4ab005019504fc0f5eadc2b63efa58(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d4740997acc9350cc14866f6e5b0330ec0ef32f63062dea141a5d3c85676730(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7363c5d43f2fa01d6859b48e60073faa7b6cd32df3db97d41f31668bab2ce5c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryErrorReportConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f292c41506fcdb472b23d525a27c76b6c21b22eaedbf0d22ea5b010b9a4e5930(
    *,
    bucket_name: builtins.str,
    encryption_option: typing.Optional[builtins.str] = None,
    object_key_prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bda43c9128d4af1e702d52b27a98b545bbb61845984dad1cdd9473cd5f456f14(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__434f324c19a43fbb7d6113ee7d3918bda115231e95202d69b269625e3dbe82c7(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__074f5187f0b87efda86af6e629bb137c2b44cb8139a36818302ab58b56c2dff6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2a304ffd70f16e4f46ae6a48422245c6e56f7ca3f66a460e68bae24b6d2e485(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59ea7e2cb56c9f26b5aea0fd1d3bba2f4f67027412ca8b2b0a8599cff66f6986(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed447b1bc9f3cd14e80a6dde2f247bdea1ed8f0b0d43e57398e5ea808f93b67a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa5c45358d2b8f70724f81316d165a2443bf94dc913486a40fcb32ebca25cecd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8804be88afb32e470fa5e32338c31fb933752edbb84a0656ee1fb944f99fa75f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce558e4159fec6c0d9a2c01797d7cc3b8e444a3ceb235f4480dad70e75c4a9c0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4ed9ef9298236038c36b1fff88f55774a31a7c4e4e5ab66bb6870fa32567c20(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2d668f4878c37364126f6496e0698b97ecb660cc07b0abc56a498e5d52ddd78(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryErrorReportConfigurationS3Configuration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4889aed33e3cc29d04ca890e7071ca5a6b2fdac96228dfadff48007056dd5562(
    *,
    error_report_location: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation, typing.Dict[builtins.str, typing.Any]]]]] = None,
    execution_stats: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryExecutionStats, typing.Dict[builtins.str, typing.Any]]]]] = None,
    query_insights_response: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a81950de78f0817ba22d63df76b458238ed22dbd51c82eda6910085ffbb8823a(
    *,
    s3_report_location: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc6da892bf8bc7f83223163326a282484157583a45d9179223e667797cc701c1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32759d6196e1b04c1e305a1d163d8cd69081154b8340fb3697d937b1e0a0011a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca48af9a4086dc9ff6d5ceb0b9b79d587b1d9d043e304cd6aa4ceffa17f0d4e0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3348865de036e91ed5caf0343366791163b7dcf96bcc8ddc616d4d28bcb8fce5(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d42fe76fbc2aae4167f80bf48c0001a5b524f828bfb88e92089601c080bfc209(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a505a595c7cf4d9b96b8f8a5b63586855609eee8303f2893e60dc14bc3171bf(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71e73ed26107dfb90b079b183b1f95962960cc008f5005fe54845aa6601f8c43(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3971ab64b495648f5cef3bffa9a9048231a849b27cb1419a152c989674f04f8a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dcc54f41645564bbda6613b1b5373aac2f838e4e75911dfc8f1facc2c75763db(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93b80f1ac4818cec01660961365bf8917f040f360339de45c8abfe453342a1c0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4a289fa02a2f947d07082258200f890c0344889978905b382b1d2e625af8a26(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a13a31b90443f7cf62551c272809c320f3fbb7fead385ce183b4ae93f185399(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85976859a3c6fa824572dab9c72263c471361c0e05dbf012c25ae68cc6c77364(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a41c3c67e6355e99eeaf1bd89a6602bf4702a204a00d0c63ade8e6fab0de49f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e22ae069e6f724bf21bdb8a2d105e661d8600334b176644f625acbf01515021b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6507eb345a802a757dffe26426f75cd25afb7135640272d9d3081582dba52b6e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eae19cec07d5a4590fc0a3fd62a81099d872e8ffb92e36f27fbe3eaae20400dc(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b071a320747c8ff1fec4892f70ee23600d0f74d905ce1a9ebf5e877e1b5abd3c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f112765bf615afc7b5f0bcfbf5b08968ff20e7ad3c99983a38de5c028059b953(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e19c875a4cb6d68cd256821319d292184f0067d575ef7c42a13a5f8748815f25(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b26327c840f5280dd2ea23f6c1c1a4d8cdcd6a40778109f36af5b8bd11ce3fb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__168b52a13d89cd3fd5d9213c2a4ab428bde883f46d6b49666ddfd25117d1cfc8(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21d298fc1498943d996f70b92a0bdac3b76254e360db478bf0106a690aecd0e2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryExecutionStats]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f14c333e1164a67b3aca86f18782fb73559efcffb6eab1bc037868a1ff8ebef8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56df90f8fd90c6103f5e77ef337a869e90569fc044a2853c0f4dc8110abe06ed(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryExecutionStats]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d21c0368998ae8e11c8db8cd8c7197f6ef1832b90ccac0e6adbe492701080c8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8f021a1a88e0ca210d92db65bf53c9a6391632cd7a8a4858e12642e656192f3(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d68bb57105c5aa7a0d499a0614018631319f1f10f8c220d6ccd724335c0e5e3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf2aba7a0e1920f07d4202ae3f6094cbaf82b7458119d60c89d47445bfbf98c6(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f06ba75a65e59bafe709231c506fe746db0e3be1777b87e9098f7fd11120ac06(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab7cfa46dca88ae8ea326a19b946fff248eb82d5c75a0a0685098cebd89e0f27(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummary]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8fa7717cc675774e2d5f093f6a9d68fada47ddbd09571c68856d87742eb0e670(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__161717c7ef702a3e6aa492057662939abcfd777a64a6485c29022340b7b446ba(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c43ab61736cd3f48dd9a07992c7dcf466c3dce8345e329c7eb60b8335d6b255(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryExecutionStats, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b6af863936dfc6c5d0e377ace560451124aded9967404eb4b8a40336cf4824d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afe1e242753014d026720646038155b45d0bab3533e0dadb6b1217d23f788a76(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummary]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67da679ba47ddabe4b8779be8f0db77091136d45fe29c7c8635ad2596129a573(
    *,
    query_spatial_coverage: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage, typing.Dict[builtins.str, typing.Any]]]]] = None,
    query_temporal_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1ce5f32b48daf7fa39f3501546112176213c26336d850f28387e865559813ea(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4bf5b419b94c9b63a0813506ee82092c4da3fb05f1b9ddcc41b6aeec00fcdb5e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cea4d658dc19726124c15a7c69363eed535b74e1a04d80c3db16f43f36c7bfc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47e9f45512866d9fbc13c19a752482f31e73476eec9aeadf841f4355f5652df0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09676f09af4430d17eea287d69204d549128e079f79646056013109314aa400b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61ce88067f934919786dac868db38cf99dd86a0b726afd621e83f2e8f225f5b9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79e9f8a4bdd4e73f627bfd86a4d1bbb362766aba3334689e6fc6842d36cfc662(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__688f0131f0a98f244c12f871f9d4b676739b878e380cc81b00942966dc92c00a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e56563cb435ca4a0887a15febd79152647c96d4434244e25af795840d44af6ec(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__769d0c0d77d5547de09431be3e186b949a061cf9b094e9afc21c37783073e24f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7560152d3b16cd9155a04af62d28f0eb05f2cc7a29083b5ed20a1333e0b6c255(
    *,
    max: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65c1d1aea36de71fa9594beb7802907f9f1756d42cc73d29e915f737e22393d7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a8884b85037b7116e58015a52f6dc85e2ea08366ff0164938af6349a5ef6447(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__019d0ea727887c527afa25b9b8509d97b1de1247cd5d41fbff3d4ebe8fb54887(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59c415e54a81ebbf79e633d5684f74388b2aa1f6fd3f729182d8d9cac8ec9d1a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__697bff8413b4d41c525d696bd8ce12b58f5fd15810cf5fae77162c368ad295ab(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2e44cca5764edc17c4925fe7f55f1f3648fcfb15f6fe2b115796dca7adebdeb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3208a9790efcfa85e69c1b7640fa990f9c76b49d4073c0982493d3647717bb94(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e362adfd47c3e2b5155f389b8f2a808b145374331007cde708e0515edf616d2(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac4fda8346b3b038187ba25ef73cde3d7a920b351f31f50d565c1996f6e0893c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46827af235422173c8a5e886439814eeea6f0e7b48a6e1149bef92b87ae1b33c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0b3a9a573775ed17e7f4dd65e01969d46c1ad4ba64f099f3b817f03e55926d2(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27b8a50939d1bfe08644f714c88281d065f7eaef8891b435db45e3a4c899d89a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65c4ef8ccced28dd7e63b110c8dd4971ccd8b93a3b945f9b09a99648d79de1ef(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a155e62fb2d81911f3b7086af7cf05cb2cebdca0e3ff7b9838f8e03316532a76(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31488cf4692358e15e3fa36b73f915376718b26892dcdfe23ea0330ad1f644e7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__920d626c3e7b492c7569e8aa5f84c8d6284bf61b990c33b86813055405fdc040(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverageMax, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eeaccf15698bea46baf8a74e0c7b5f4c307930b5864f21edf27bb81b0cd8c269(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35ea3e5e8865ce02ce3ce8f9e4c74a72adb4618d582b5b8dd58bf774bd0c05f8(
    *,
    max: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3eefa0c28f422b066842f897cfebcd4eda266a383425e61b6b25aef71a04ffe7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__564c0344708b94c91db7e0d2fb045c8fe6b048cd9a10e8e767483b0e99c28941(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0d19bb2836041d52a070ecc46b3129b9df4ab96fb645dac343c2107b0e61564(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__223019afc08efbc0b0fff414b726addfa899fbbadce13fffdc7fca2a922d46fd(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6df22112dffff69bbbc8a4c9b7a2449bd4f156ecb901e1e544613ac338ba1509(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea7cd15ecf1bb3df750dedc3338495d6c41e88e86fdc92a3d48af031ddf50680(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b410e9a50397771ca0eeeb02ada8aa76b155ce68f1381d7e22864e0341c451a7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f27f2bf4a05de9abb18639ddb485ef9a34568c3149e95ddcc1c589e87a2f67ed(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3772d53a989d15bb6acb4aece4509584adf12e7d1d75aaff07011b029860b895(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e7d0aafbeade0a422275ed076c0d678b27478ac9fe9ba595a894a3d8f27d7e0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__828caffb94bbe46fd014395a854ef6adceee42a8e5205c293f7a3e6fa9360076(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6436ba997022d88ed26bb21fd8e3ca3cfbb4c9cd3effab9dda1d0e91bcb6f741(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ccf63f50e62598aa217eba6b0b0780374c0643b6eb3f2f48a569905d8d6458b5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60b68830497f64b18c65b5b8ca1e133d56fe2421df467d7937c95b4e4d0753ab(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12b8bf7b96782cabf77a9786355931f353c7528ae4c44d44b9ed8790bbc93b43(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90e9314b0b48bb04e0f653a441eb589e0799890f2de5432a587b7e1784a9af2f(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRangeMax, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4fcfe76d3fc3e14856904a3308260724050be9e6b217de2ce50aeffe83bd23c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62bf9c532723b93368eb367368e2eabe6f292b29fb5297d2b968006cd69abcf2(
    *,
    sns_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__186d179dd8316c6e2fc01221e311ad1938d031e517335586344acf41c31ee8f7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12bf21ad87e3dd680056984f76a78995b1600d8dc19e2f7cb4352ec4e2782404(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3011d2e8549b27b0e1f4d2345485b9a1ae806a911aceb5800f1eca57223f838(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49b6fa5faa22f6eba00663adc323617eb2a4d41db3cda2c0cb3cbf9921faa878(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68e33b55d45862031311f8dd490a72c813961ee231dbfd75dbb50150edba73f9(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23874ad52ba0ab06431f9b3cfbb30f608bf64274fbdcb76b82109c6821cf9f01(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryNotificationConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efcdfecb4171fcbdf332569d062654aaa57bf60c140177f6d39a011f3a3f3d8c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__234847a3547e9624dd71535da29e7eec54de63704133cf6258830454444ac8e8(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c953c5c79788085c57368e6d5ea9aecbe7fefe6e4b0e8f4f5e60935a9d5ae04(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryNotificationConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e45f13d03a6b750c09e00961edd92feaaeb1e8b9fd4355a57b20a86b69f455d(
    *,
    topic_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8480f662ccda47a2e52407dcf6f6671744ec49b0c6df1f4ec3c4b755b0cb17eb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a87141a7ae0974cb42b82250f311c72b613ce2fce90101c9c909bfa47d917833(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__504ed64b1ccf6bc82a6e8c43d5deb5d8b9b1e8242fbe976db3da01be72ef5bfb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e635aca8ad4bccb7fe9221f0599e676f024a380db743052be3b0ca5f517a257(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__26c76cf112378ed7fc41deb72a98cae6b4c97834d68482e52ed1a34893cd5f0d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f127de0469b1dfad7c57380d1f91b6db65766503feaa0ca5f89388d3a13ff011(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65ef0a779639327c2b6625110305ec4c59256848852f3b11291e7b3fd85e4ccf(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d6a682aeedaceadf58b797979f82ce81325fefe6b85cbb7ba569fabafb0a511(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dcf62e177c5e1b687060280b583c1b8725aab8dd9a32cc1bc06945b79a411eca(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5218e23aa846477bc527a85779277eb3ff64dd192b5079acbe73a52c96cec2a(
    *,
    error_report_location: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation, typing.Dict[builtins.str, typing.Any]]]]] = None,
    execution_stats: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats, typing.Dict[builtins.str, typing.Any]]]]] = None,
    query_insights_response: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8014b11a5bfceff3731d55f4464e4ea58d349bfdf9d9d5060aad7963efa00ce4(
    *,
    s3_report_location: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df2b70707d8f9ffb2f98767784aaa20da325eb8bcd841626295d6c1d929cbc1d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae9a97bd007690a0d8824153898dd93e712fc923cc82ed1451d5cc1f96b282fc(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a11a022765f00f4437fa6da723130067761d985b2ad3aec79ac39df61ca7285(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd9e43bdd49115806657f8896b18e4d81c7d17fa74f26fbc2f85ab1685fa76f2(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9170b2a695da2066652c18bb50f11850d8fa0f29ab3865c50ddce4f4494e042(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a745e2c58e3211454bd20d2d6ab6c3810517f02be94e6aa71ee64b0e75e4e03c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bed1d94b99cd8900e11b70a1dd62841c581e1b0119abcb8be35abfb7dbc039c2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45aaa173b3d7e4bb13b954a95a69067138006c183cf69d39dd6a32ee5f2611a1(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e2130f0636084f84e325d1a573f28e400e09fcd31075775d423f52005a80db9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f09a3bbb0f71c6b570dff4bd587a6f6641c0898abce1ff68dbfecd18b011bc6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__035051666379e5dc8640a60a5bef62c173fb95a99c3f8620225a073d94dd7eb6(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f68b821d6e168c84588d1ee5f3643a9f74d55576f957afb3da3531feded3622e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8011bf956817581c6f4c5a551791b7235a16efec3dcad79d1e98e92755b3ab3a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fad97f7c903ff4905986bd2d71320a5ed7f07eb71634a3787ac4900de82bca3e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d87a654a925e9ab8ebc464d02943ed89a5a63d58626c8f808bf3eb197354ff5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__508dbf27c4eb619aed60ebb524f2d2a5eefea2bfc4f247dd359c1142e7205371(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cafc4828feb08ba2eb368388832e5b96b938213465a2cd60bd31a749974fd59e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocationS3ReportLocation]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11f404b84d7739bc6ab16764b42da8c8d09390235ec1b07d2508b5a8378b0b2b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__006b11990842aa54d334ea763cb4c9da23341ecf2f8b0936fe650d6be6429af2(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b7a956b62c4a52edf53f40861092445a58f3b527c78befbf9a17bc3fe3c6e4b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f04ddc45aea5d489f020da95de1c8eb040dc6229c02183fb21de9c8f7777d6f2(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58677697aa2365fd4dfa864a2e237e8d6b45ac632542f23a6789e4ca6cfee51a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63da30ff36bbf20f386b5ad518b553e53e8b8bce9d13d13322e73377782416eb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__491c3aa1b9c76a5a971d71e49b2e5f88008e2f79a713f103ec91f1e43c5126ab(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25877c7bbf2677b9719ee7e1fe7f0f1118627c88ea7e02eee2cdc6115fdb3120(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1d7afb6b22a292c65a2d32a3e02049407201c68089d1b2ee728cf257bf444b0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0667a70197bcb4a179c5faf0482effc1788424ff697ee19e87789b21bc89cab2(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d8e3baf6b4d36cbe67aa248b684b404455defd01d99e86b43e73ed9d651a9a4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb42c4d581cc53ea54e3056f588a3e19a138a2a2ab86f22c0295cdb6163e84fe(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__641cca3a5232e609d5e441d80e632ddd645aba7d60b4eb7815f5bf3e21694c97(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30ea3a17716fa0b8aa4851b192c910b32380f565450195f3f5939a92bdb47fd5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRuns]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a35c747470e179eb7a75d0c59be12ec8be192ce785e82f6ee1d8bcea20c381e3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83a7b3745e3fe2b5e7f9217d8b2a654e37b6b09720894ecf716a58d915b2f28c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc5dc30ce7af2a2fde84dc0b962bdbe5fb720e5f38719200a73afffd03db3e12(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d86b79935cc2105cb1533256c92e4f7622990f56fe9eb9a80330cdd1b297d7ed(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a651bebda4a6a36cb2f0ee920b768ce0a3f91dd862140d130fc623f22a20361c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRuns]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e84e8faad171c788e2e44488ef94fefd1ff641d01cf0983164f4e799468bb8f(
    *,
    query_spatial_coverage: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage, typing.Dict[builtins.str, typing.Any]]]]] = None,
    query_temporal_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56647a24e188fea2f67de2057e0151d17def8cfebb093b098883869748de0aa6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e39135d25054a5b47930de8b6f0a8d786c6c528865fcd6961b706ed4e53d186(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ffeb46bd17ecde233688e354bd340c82218c29f958199a30d3a5dd94562a7a92(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab0460a7bf03e16012ba1208b6b2ee36c3c9549a0120463a2e318607fbe5d4e4(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b7704951f84a8c3bf3834cd89f1ca36b2c14f37dc828bce013930141dbe8358(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e91abbc2408e50d47890fc40d38a7c0b5edf5cb26b549e06138a972c148099b3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7f3f282f8a1bb9273467a7098d7abeb2fe1ebe6ac45dd2ddfe9b82fef753f0e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7f01e7e9c6af8e68e6709f5c01c128c441caaa636ed9725ecbb934fff1bc2ab(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14bb355b40d991216ef9c612a6575a277225f33de524051e2197f1adf1822ef7(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b14d37b97094442876a6320939bf6c1a741397e7216b96f318ea31952bdec37e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46ecdbec8d11e4bff3b9df51b19f6a9cf4da3a113beeafc8a108933c11df042a(
    *,
    max: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1fe1b75d57b579409f7bf123db8999b5219cadee6cb1032969ba6f30f1b1db4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2060308e115436af75eff0f34ab9ae0a48620f3467491e8faee4173e5f932c8(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1031a3177f45f5cd50c983cde9166b42873f6253e6be3d38d5940fc6d43019d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1f70b683e2b90186418d26486fb5bb228a8cc84bf00872b921c7bf682e87d4e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f50c0dce79745ae7d6e608e342051846aa3a9fc64a8e5767b9d4bbf2ed3bf3f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a8669bb0906cf6a29817210b1d2d9316344dca324e8d744e6482af89d0e23945(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e06751ced86f096dd3286d9434b0aeb8525298bd49a9324de61d17958d3ec49(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6478c9bcc594f087cb741845e1cd626781004173c9395377f27a91a10cf7003(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e13cc1d13372ef341cdebb61eb46fa5a51aee6a35d2dbce4f9b57e23ab3f18f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99475701d2bd9222acd67617ed0281ec57147baf4b20ead94579ce6b64a5b2eb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c9d3fd8ecef7ee34210c2385859d848723a3d5e7f66c9898e0bf030118022119(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e0e1f55e6042ca6e82287a847b6471897a234f741e20e7690660f4ec7e076d2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__017010873efa84ce26e3166d00cf88572acd47c9de94324cf0596140f0b1cdf7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8ef9c2024966e31d21163824ce77122f136bfc597f8d2393e9ffd7b16480a15(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7da3df8a8702906e84cdd5f94848f04885cd3a4e1f75a43ad53b818252641c50(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f54de903ede151a407bab2299dcbae1b1df38a5c0a5eea0316fe4d11dce04ad(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15c7a8bada12cfa953934c3e32193d1a73b80e2937df584461fc43bd271226d0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7554251d0035f497c51339be735e8f20d4be42aebe09e1cf550b957a01efc1af(
    *,
    max: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__791f1556da9273e26c044e24f1690aa2d0c2892ca09b13808255f88c0cd07fb8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eed5fd807166834d1838487bd117e738fa70cc0000729c1be569a6814be33e8a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a69832547fa5f8f24039e28bb61949787ca1a9463243d3c426c317107dd1fd71(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4e25c95816793bf18adf57fc6c08a2358af3e0250f0386323b9474d0c059e67(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19a0acdabd47ef39c351a65547ea6743b753d3bea3a286143397fe9c050d035c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b283cf11157fac99ade698bfbd92c7ae2d30afd463dba17cb1886ff8e0b8cf95(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__687ae30e06c253f580f60c2922f0dd4a12a43ec1fc9cc68e29f71b96abb813ac(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ec5b51f2fd3ee337ca32f8958685b54129e9881ffe9b77dbda004bb526f001f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e5cac1ae6295fa45c1860b03841331243acf9d5f8c54a7374fa6a6a0e2a4463(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5a6f765c06d2597e65c70c8adb6f7854eedd39b08ef8ed4b842042f34b2ac63(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82f727ec5bf2bdee02f452c0580424f29a2644e46143fcbb6369129dddd03384(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01b8c41d3b6d6dc409d514d196bac67597f4be1814e4d94790a01a76088c615d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1325ef4026546a0a6ca23bacb3ac9f3de0a1955626d3a506689093fa4b7c553(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__542624e2347b4e1c2e8c3bfb55f981c46a6d3e224de274df7348b60630e9520f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0627201f2068d7019ebd7cfb014873d86518581efb674659935bfd994ce2041(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0fe4007b0ae51f5500ba62c4034e9d631dc17dae9a482694c36b42db35e8b12(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRangeMax, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__109a3ce17f1536b70a80fd33a9ded3c1ff2da60528a7704e04253e04a344a72c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQueryTemporalRange]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94656a7311a2890f14112baf6ee093379688b036f1efd0232931bcc84e6ab4ba(
    *,
    schedule_expression: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__551943a8454e0405138918823e2165aa40588c22ca0e59cb1ad28b4382c5caf6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea133d054384eb257871c09b11d7bbea3f6660ccc009d28fdb4ed551051b8467(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e5c823f1f608794cfa540c16730b847c3006b7b5e6be3ab1a41f3586c3794c9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7c8845cf730b6277d1fc0d406dbf1fa6e7dea5f45686e5a83d05c000fd2556e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5555f3468926154dcab79df15393ab5bd77154fb18d9f1c6ccff4ba9f1f2c75c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fbe2c8a5fc79a3745fbe701fbfe0d0b4cc15a062aacd47c790371ab5523c6cc8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryScheduleConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78e3998023337b31ac6761f73b2f38dce7c77ff3f2425801d6ff795f34f66ac3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a616c4c48ea47ef3efd4175bb9670fac05501cdccb10956523118e27027e687(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92edb6d96b3be28a0c22fa2aea29968453168fce6be8c1759b63b29cab2ee0ca(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryScheduleConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd03af80afffca2ee7cc45a607d082566256c7833313c808e33ac43b74b67f91(
    *,
    timestream_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8a81ae250df0590abf5d792ad399e36c3aa9a490887cdd51f176a8b20ab61e1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d239b043f61d301f9581c8409dfde4555bdd55ccc432bfb07fb27082018f99ef(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c795cf844896284e3e80f8a289c96396b45a7f45d75a3698f350361483ba88b1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__200f1edfb4b21d3a51092ee4187a2eacccfeb78c8544dafd41a162a0eed8a285(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1646595fe4d60da83ea746594dd357211f019f21fc020b140c2f1c1f1a9b2e65(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aedb57befc366421d3ff80997ac18d1f4bf2c8ac242ae07b01df53d52a08767a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4059d4d9e439f5dbe5e10eb50715a199fc189de6b1e715b5acb6696a395055b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2755e6225297ab75c4be9712f7d155a20fe86acca11007194e5707077948fac(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d120a569206538392e4c412e1b64c7678590e2282591206c935381a65a0e6e3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0d6f96f72a8fb286dc5ed79402dc4257bedfe300ec6ef1811936fb035a78101(
    *,
    database_name: builtins.str,
    table_name: builtins.str,
    time_column: builtins.str,
    dimension_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping, typing.Dict[builtins.str, typing.Any]]]]] = None,
    measure_name_column: typing.Optional[builtins.str] = None,
    mixed_measure_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping, typing.Dict[builtins.str, typing.Any]]]]] = None,
    multi_measure_mappings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__20177980219772f2b2a183abad73e103559f6c133c320e6944ff3ae2b3b29fe7(
    *,
    dimension_value_type: builtins.str,
    name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e2193806b603e2ee3437877b228cb3d3cc308c604bf6c83b2b073d116be9f25(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f114bfe372af455f5765074e7a8a676d2f343bc98626986c3a7ec36222c5896c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__250549a02ec213f32bc3f10dfacc4ecb1e03e90c2cfd75200fa653f89a3aec8e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c69901fa46d6b9aaf75847d334871698121f70c6760ffd47a8a89bd119737d8(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__750b6d1f009253dbc6c4459bb13a1a225f2982a00812af4e865a1dba21209d48(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f6bb6e6a7f99d134cc2a336aef8865f83b33f8743869e3bc16ac5f9385e263d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa66b1159c3576c26adcff946e4ea10402a9f571dcdc15e1842acd5d9a771555(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7dc272a2b917b10d93260cff52fd40f557c81bd0a8f3ece6de652a5d565b6053(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f52edac65a7221d588f9021899b3e33a012cd9072ee7eea8c8bc8e90a8bd6ed(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__953f1a2454e316f6b40dd070f004acc34f642d6f6a24d4b57551367cbb8b7cda(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6dec53b4e333f582dbc861dd75f1ac6434806c41e1cabf13659289ab0f4a42c1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a5d9860d3a965d73eac247272df24f47a651dbc90094da55718fb293b37b94d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__678dbee5813b489f24cd4459f44796a97767dc31621f64216fd941d399d9f4e4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29230f2deeb650f230a6995dceafad85719e68b5c4d758700025d6a00395f93b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1e6664ee935fa81b274441eb15fdb3cdfdad90709fa0143dc54f269415cd3d0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f26c7628966879bc0cdefafe45aa12b6c749711403ee364a4eb2e83928eaaff(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5ad1c487a24f0bfcdcba836a2f9027a004435d229f09a2ac2c77e6759297e07(
    *,
    measure_value_type: builtins.str,
    measure_name: typing.Optional[builtins.str] = None,
    multi_measure_attribute_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping, typing.Dict[builtins.str, typing.Any]]]]] = None,
    source_column: typing.Optional[builtins.str] = None,
    target_measure_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0875099e80e28b6c7a923541ad8c6704843ac942f5dd3cd40f0cc389dbca4436(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5411926c6c1bd51786981a42b3b102bdf69ca5363b811230b8d7c3a1f514cf0b(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4003584bf3c2250121d23b06aee04bf88787fa269b2ccb93beb68d40f9d7a63(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a204089b90d61a5ac56821741d226a0fd312fa347d31d6b250eabb65dac94af(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5575364cb616e6bb083adf14688213395dd8ff308414db56c1ed51c09a694b4a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6eefd7ffef21f8d385d67917873a2c06685f3ae7177880b840ab6f98fd196730(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da866461a8477fd87b03e2368dc936d0d1a826f7917c164f60e711c0689677af(
    *,
    measure_value_type: builtins.str,
    source_column: builtins.str,
    target_multi_measure_attribute_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2a61307e08f3938933b8b5e827dcf7deeb5509c3c94f24099f4025a86d921f4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__756e51df150cd43c2839a476c700d041efeca5904e43fd2da11966a4b28cca3a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7442be1793bfe507f29d9e99b080380c8227bde2eb3267a645dbbd89a928358d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__808113cf7ac99317d4b68aa273f2782b377cd75a689d5e31ebfedfd8bafe098b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8e5096c8e633f212047c4a07f7d63e94da0290ec4daa929fbe8a7e8a65b9a71(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1fd539c01bed57f76a86be499a6086395ccecfb4ce9b91f5454913487b590ec(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af26eb99d429ccb26f5f88789bf5ae5a0ac7eb758afffd8e5e07ddf3ade492b7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61b72b3720096714dee69bd66e0decec586188c72790179aa5bff3f30dcebbca(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__031fe6a3ab936ca3d5f651d369c56b236fc94b7656fc80c6af7976c5ef6c4ff5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbe9df8054121fec78a36ab3b80cd92b1f8636964ab3cd9df37fc4049e01b86a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__778fea612504c5597e815cf806e3a0df8630fb54d9ce60d59d1a84a3d1ceb988(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86db93324005b598c3c9d8be37903ccecab67be9ca4d2df74b73f166412d9686(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73f81b1a2de3dd568488d9e983896f47cb4f82dd0faa54303633e7f08a9cb0ed(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__decac5ce2d70acd771d169e4a98a6d2470ccb4fdaf0c8c52d29cfbd349b49b38(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__03428feda5736d932f696716b9b5ec1b4a5833cc891efaeb43b6a73aaab8f7a4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e0fbc0c02c084e73f91625052c0a3d4d307a602c7cd1e78688434f191fb29f7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18022b8c9e47dedb134156f2d353d3a46d8588a8001ded8b67e5ad7be879acab(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c11ef2cbc43595a065522589845a8aece3a6edf44cc184bf7994af303ae18ab1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e6b997608a4fd326eb84fb4c48cf79993e72d30810c0dfd8a38e065a7b70ec1(
    *,
    multi_measure_attribute_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping, typing.Dict[builtins.str, typing.Any]]]]] = None,
    target_multi_measure_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06b54e1a64dea276de4a9f65391dd4d5e362367e1c766e71e5eba5f589e13cc2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed8ae4cb8cd8d01e852c1fc69cdc02be670ac88f156ab1df71a0f8583954134f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__796909cb8f8b96c36371e2b8416df0823a54c6ed89f78aaa65bab2ee0aa0b9b4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3dac1b4699508a31458de4b9e9c82ba34f190b70220d8f3bd5443bc6d7f826a9(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02f91fa537c23c4083506c2c6829c7ae3d975c4a1f53d54ac2dc3016261a9f11(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5cd8eb5789674929b37610613ce99db80c9a909ae49a12175bc0d8ae871087e5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0f9c89dee6dd0b9dcdb5b9d33b8fb48d0e2e1a24e42f28de5465dcbd9bdced5(
    *,
    measure_value_type: builtins.str,
    source_column: builtins.str,
    target_multi_measure_attribute_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__645deefd76bdb6bd0d856fa8e5101e37e696d62b51ae56eadcd9a53ca9425929(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9350d4ceaa9dc437c42297d383bb4b7c2f13b2e0872376a0eb10425ca54640b7(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bd1121b23a8bf86eb919783a178ebfcec1fce1b17717d494cf1c208feecc638(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5264d6ddeac1248c1e2e0ae00c5e48df1f1c9ea2fc9a784c1c8e4d44be4acc09(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09342e95a80d5e45f6ea4bcd3bebe80c4229c4434168cdb20fd1ae22b7ce4238(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a96b48831e3b47fb8edea394b4f3939217b25c13f7d786bb07759320d2e3c3b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76bc183909e8f3c525367eeb07b72521dc62c38079f9cb35dc3aae1e945dfa54(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77fe783c5632befe6005e6c18a0b8bb09216daef742c53522805367f81d58216(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f623feb41fb38950a5570b94eef714629571d05dff56498b66749f96df75d54e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0147b6c64937556bb34a3e9a86b0df597bd39d6699692173169f852b0e5ca8b2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c88448154347d4b971f766ee0094f38bb0ecc8ef9216dfe6336b4352118ef922(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__998e423b2464d1cb99a1777c780fbe349e424116ba4e49e4e664a107fbffdf48(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a567f4c80823d2eb59609c1460879d050bf669b8e964a27401065c6af2ec07e(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d79760eec1ab4d0166142dc829ff08c5438c625c96c1237dcb1e37676827790(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4af0dfdd4f1ece4d149c23af396827a6d3050199e9e2fd3cfe792933449d549e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59c93a4d80264c5b1005c1049f900cbe023c038afcfb7748da32568f9f031afb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2cd107ab43493a0adcbc57397c1c1e8c9be0882923f795b3bbf49a61b5953ba(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee64bb751cc8f760964ac6ec7f3b31fd3081e6edd664ef8b23d4176bdd769a47(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__624090c42012d1a6587751817c6a7797e54c5141050f3cd91a272346efd28a08(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d16ec7c751566c97403f2da8b77b8f6be8fb3b87b2acd8e0821f747945f9207(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d11851672064c414ee9ec787f8873d612384279dd3e6893786fa4606bc44a6a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9af1cac823b5d06e660698f208f20149c22d2f8a67b60679418455ef08ffe338(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e34e35cb006eeaab4d1bc553e8928f070eabef994bb44c257289888782cd46d1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75f51b75019ec5fe1aa260f90a829755d032f641d7ee7b9517fb29eb382daa85(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__373b4ff395cd1d59e893fbd3438fdea4f5506d5d654938428e0d6c6bd9234bb4(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e73e6c82bcc6923caefb472930e3818dfe52a82fb8cbaf49073cba81f3f1c2b9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__015ad8d3872a91185f6fcf469430b2d85777fcc3568362e2be8627d9ab0a7e04(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd9ceb99a5b6ac7c3d50d6a86a462d07898d6fc4b4b96d6eb0522f0a854dbbb6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ee5224c3e5e0a407f2353d4f25f3b2c1a9a6325669ea8039b2252f071defe17(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5a8ae89ad6d839fcbd3bea14b78cd1b7ddcc86199b6cff09495ab876d4a6a26(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, TimestreamqueryScheduledQueryTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
