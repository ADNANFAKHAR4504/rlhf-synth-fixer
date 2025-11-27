r'''
# `aws_fsx_ontap_volume`

Refer to the Terraform Registry for docs: [`aws_fsx_ontap_volume`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume).
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


class FsxOntapVolume(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxOntapVolume.FsxOntapVolume",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume aws_fsx_ontap_volume}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        name: builtins.str,
        storage_virtual_machine_id: builtins.str,
        aggregate_configuration: typing.Optional[typing.Union["FsxOntapVolumeAggregateConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        bypass_snaplock_enterprise_retention: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        copy_tags_to_backups: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        final_backup_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        id: typing.Optional[builtins.str] = None,
        junction_path: typing.Optional[builtins.str] = None,
        ontap_volume_type: typing.Optional[builtins.str] = None,
        security_style: typing.Optional[builtins.str] = None,
        size_in_bytes: typing.Optional[builtins.str] = None,
        size_in_megabytes: typing.Optional[jsii.Number] = None,
        skip_final_backup: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        snaplock_configuration: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        snapshot_policy: typing.Optional[builtins.str] = None,
        storage_efficiency_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tiering_policy: typing.Optional[typing.Union["FsxOntapVolumeTieringPolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        timeouts: typing.Optional[typing.Union["FsxOntapVolumeTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        volume_style: typing.Optional[builtins.str] = None,
        volume_type: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume aws_fsx_ontap_volume} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}.
        :param storage_virtual_machine_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_virtual_machine_id FsxOntapVolume#storage_virtual_machine_id}.
        :param aggregate_configuration: aggregate_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregate_configuration FsxOntapVolume#aggregate_configuration}
        :param bypass_snaplock_enterprise_retention: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#bypass_snaplock_enterprise_retention FsxOntapVolume#bypass_snaplock_enterprise_retention}.
        :param copy_tags_to_backups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#copy_tags_to_backups FsxOntapVolume#copy_tags_to_backups}.
        :param final_backup_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#final_backup_tags FsxOntapVolume#final_backup_tags}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#id FsxOntapVolume#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param junction_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#junction_path FsxOntapVolume#junction_path}.
        :param ontap_volume_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#ontap_volume_type FsxOntapVolume#ontap_volume_type}.
        :param security_style: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#security_style FsxOntapVolume#security_style}.
        :param size_in_bytes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_bytes FsxOntapVolume#size_in_bytes}.
        :param size_in_megabytes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_megabytes FsxOntapVolume#size_in_megabytes}.
        :param skip_final_backup: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#skip_final_backup FsxOntapVolume#skip_final_backup}.
        :param snaplock_configuration: snaplock_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_configuration FsxOntapVolume#snaplock_configuration}
        :param snapshot_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snapshot_policy FsxOntapVolume#snapshot_policy}.
        :param storage_efficiency_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_efficiency_enabled FsxOntapVolume#storage_efficiency_enabled}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags FsxOntapVolume#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags_all FsxOntapVolume#tags_all}.
        :param tiering_policy: tiering_policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tiering_policy FsxOntapVolume#tiering_policy}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#timeouts FsxOntapVolume#timeouts}
        :param volume_style: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_style FsxOntapVolume#volume_style}.
        :param volume_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_type FsxOntapVolume#volume_type}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8bc9e1a39f4bcc1e0c208a7371d6fcfcf805f2e6328bb6caa53df197fd72d4ef)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = FsxOntapVolumeConfig(
            name=name,
            storage_virtual_machine_id=storage_virtual_machine_id,
            aggregate_configuration=aggregate_configuration,
            bypass_snaplock_enterprise_retention=bypass_snaplock_enterprise_retention,
            copy_tags_to_backups=copy_tags_to_backups,
            final_backup_tags=final_backup_tags,
            id=id,
            junction_path=junction_path,
            ontap_volume_type=ontap_volume_type,
            security_style=security_style,
            size_in_bytes=size_in_bytes,
            size_in_megabytes=size_in_megabytes,
            skip_final_backup=skip_final_backup,
            snaplock_configuration=snaplock_configuration,
            snapshot_policy=snapshot_policy,
            storage_efficiency_enabled=storage_efficiency_enabled,
            tags=tags,
            tags_all=tags_all,
            tiering_policy=tiering_policy,
            timeouts=timeouts,
            volume_style=volume_style,
            volume_type=volume_type,
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
        '''Generates CDKTF code for importing a FsxOntapVolume resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the FsxOntapVolume to import.
        :param import_from_id: The id of the existing FsxOntapVolume that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the FsxOntapVolume to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8476e0cc9865b0d35b571756849109f26a888b9382bb80f41609671ed1b6f18f)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAggregateConfiguration")
    def put_aggregate_configuration(
        self,
        *,
        aggregates: typing.Optional[typing.Sequence[builtins.str]] = None,
        constituents_per_aggregate: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param aggregates: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregates FsxOntapVolume#aggregates}.
        :param constituents_per_aggregate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#constituents_per_aggregate FsxOntapVolume#constituents_per_aggregate}.
        '''
        value = FsxOntapVolumeAggregateConfiguration(
            aggregates=aggregates,
            constituents_per_aggregate=constituents_per_aggregate,
        )

        return typing.cast(None, jsii.invoke(self, "putAggregateConfiguration", [value]))

    @jsii.member(jsii_name="putSnaplockConfiguration")
    def put_snaplock_configuration(
        self,
        *,
        snaplock_type: builtins.str,
        audit_log_volume: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        autocommit_period: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfigurationAutocommitPeriod", typing.Dict[builtins.str, typing.Any]]] = None,
        privileged_delete: typing.Optional[builtins.str] = None,
        retention_period: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfigurationRetentionPeriod", typing.Dict[builtins.str, typing.Any]]] = None,
        volume_append_mode_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param snaplock_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_type FsxOntapVolume#snaplock_type}.
        :param audit_log_volume: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#audit_log_volume FsxOntapVolume#audit_log_volume}.
        :param autocommit_period: autocommit_period block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#autocommit_period FsxOntapVolume#autocommit_period}
        :param privileged_delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#privileged_delete FsxOntapVolume#privileged_delete}.
        :param retention_period: retention_period block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#retention_period FsxOntapVolume#retention_period}
        :param volume_append_mode_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_append_mode_enabled FsxOntapVolume#volume_append_mode_enabled}.
        '''
        value = FsxOntapVolumeSnaplockConfiguration(
            snaplock_type=snaplock_type,
            audit_log_volume=audit_log_volume,
            autocommit_period=autocommit_period,
            privileged_delete=privileged_delete,
            retention_period=retention_period,
            volume_append_mode_enabled=volume_append_mode_enabled,
        )

        return typing.cast(None, jsii.invoke(self, "putSnaplockConfiguration", [value]))

    @jsii.member(jsii_name="putTieringPolicy")
    def put_tiering_policy(
        self,
        *,
        cooling_period: typing.Optional[jsii.Number] = None,
        name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param cooling_period: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#cooling_period FsxOntapVolume#cooling_period}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}.
        '''
        value = FsxOntapVolumeTieringPolicy(cooling_period=cooling_period, name=name)

        return typing.cast(None, jsii.invoke(self, "putTieringPolicy", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#create FsxOntapVolume#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#delete FsxOntapVolume#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#update FsxOntapVolume#update}.
        '''
        value = FsxOntapVolumeTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetAggregateConfiguration")
    def reset_aggregate_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAggregateConfiguration", []))

    @jsii.member(jsii_name="resetBypassSnaplockEnterpriseRetention")
    def reset_bypass_snaplock_enterprise_retention(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBypassSnaplockEnterpriseRetention", []))

    @jsii.member(jsii_name="resetCopyTagsToBackups")
    def reset_copy_tags_to_backups(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCopyTagsToBackups", []))

    @jsii.member(jsii_name="resetFinalBackupTags")
    def reset_final_backup_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFinalBackupTags", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetJunctionPath")
    def reset_junction_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetJunctionPath", []))

    @jsii.member(jsii_name="resetOntapVolumeType")
    def reset_ontap_volume_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOntapVolumeType", []))

    @jsii.member(jsii_name="resetSecurityStyle")
    def reset_security_style(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityStyle", []))

    @jsii.member(jsii_name="resetSizeInBytes")
    def reset_size_in_bytes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSizeInBytes", []))

    @jsii.member(jsii_name="resetSizeInMegabytes")
    def reset_size_in_megabytes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSizeInMegabytes", []))

    @jsii.member(jsii_name="resetSkipFinalBackup")
    def reset_skip_final_backup(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSkipFinalBackup", []))

    @jsii.member(jsii_name="resetSnaplockConfiguration")
    def reset_snaplock_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSnaplockConfiguration", []))

    @jsii.member(jsii_name="resetSnapshotPolicy")
    def reset_snapshot_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSnapshotPolicy", []))

    @jsii.member(jsii_name="resetStorageEfficiencyEnabled")
    def reset_storage_efficiency_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStorageEfficiencyEnabled", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTieringPolicy")
    def reset_tiering_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTieringPolicy", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

    @jsii.member(jsii_name="resetVolumeStyle")
    def reset_volume_style(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVolumeStyle", []))

    @jsii.member(jsii_name="resetVolumeType")
    def reset_volume_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVolumeType", []))

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
    @jsii.member(jsii_name="aggregateConfiguration")
    def aggregate_configuration(
        self,
    ) -> "FsxOntapVolumeAggregateConfigurationOutputReference":
        return typing.cast("FsxOntapVolumeAggregateConfigurationOutputReference", jsii.get(self, "aggregateConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="fileSystemId")
    def file_system_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fileSystemId"))

    @builtins.property
    @jsii.member(jsii_name="flexcacheEndpointType")
    def flexcache_endpoint_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "flexcacheEndpointType"))

    @builtins.property
    @jsii.member(jsii_name="snaplockConfiguration")
    def snaplock_configuration(
        self,
    ) -> "FsxOntapVolumeSnaplockConfigurationOutputReference":
        return typing.cast("FsxOntapVolumeSnaplockConfigurationOutputReference", jsii.get(self, "snaplockConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="tieringPolicy")
    def tiering_policy(self) -> "FsxOntapVolumeTieringPolicyOutputReference":
        return typing.cast("FsxOntapVolumeTieringPolicyOutputReference", jsii.get(self, "tieringPolicy"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "FsxOntapVolumeTimeoutsOutputReference":
        return typing.cast("FsxOntapVolumeTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="uuid")
    def uuid(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "uuid"))

    @builtins.property
    @jsii.member(jsii_name="aggregateConfigurationInput")
    def aggregate_configuration_input(
        self,
    ) -> typing.Optional["FsxOntapVolumeAggregateConfiguration"]:
        return typing.cast(typing.Optional["FsxOntapVolumeAggregateConfiguration"], jsii.get(self, "aggregateConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="bypassSnaplockEnterpriseRetentionInput")
    def bypass_snaplock_enterprise_retention_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "bypassSnaplockEnterpriseRetentionInput"))

    @builtins.property
    @jsii.member(jsii_name="copyTagsToBackupsInput")
    def copy_tags_to_backups_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "copyTagsToBackupsInput"))

    @builtins.property
    @jsii.member(jsii_name="finalBackupTagsInput")
    def final_backup_tags_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "finalBackupTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="junctionPathInput")
    def junction_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "junctionPathInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="ontapVolumeTypeInput")
    def ontap_volume_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ontapVolumeTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="securityStyleInput")
    def security_style_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "securityStyleInput"))

    @builtins.property
    @jsii.member(jsii_name="sizeInBytesInput")
    def size_in_bytes_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sizeInBytesInput"))

    @builtins.property
    @jsii.member(jsii_name="sizeInMegabytesInput")
    def size_in_megabytes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "sizeInMegabytesInput"))

    @builtins.property
    @jsii.member(jsii_name="skipFinalBackupInput")
    def skip_final_backup_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "skipFinalBackupInput"))

    @builtins.property
    @jsii.member(jsii_name="snaplockConfigurationInput")
    def snaplock_configuration_input(
        self,
    ) -> typing.Optional["FsxOntapVolumeSnaplockConfiguration"]:
        return typing.cast(typing.Optional["FsxOntapVolumeSnaplockConfiguration"], jsii.get(self, "snaplockConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="snapshotPolicyInput")
    def snapshot_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "snapshotPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="storageEfficiencyEnabledInput")
    def storage_efficiency_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "storageEfficiencyEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="storageVirtualMachineIdInput")
    def storage_virtual_machine_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "storageVirtualMachineIdInput"))

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
    @jsii.member(jsii_name="tieringPolicyInput")
    def tiering_policy_input(self) -> typing.Optional["FsxOntapVolumeTieringPolicy"]:
        return typing.cast(typing.Optional["FsxOntapVolumeTieringPolicy"], jsii.get(self, "tieringPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "FsxOntapVolumeTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "FsxOntapVolumeTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="volumeStyleInput")
    def volume_style_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "volumeStyleInput"))

    @builtins.property
    @jsii.member(jsii_name="volumeTypeInput")
    def volume_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "volumeTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="bypassSnaplockEnterpriseRetention")
    def bypass_snaplock_enterprise_retention(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "bypassSnaplockEnterpriseRetention"))

    @bypass_snaplock_enterprise_retention.setter
    def bypass_snaplock_enterprise_retention(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81a83ffafb9ffce4ad52ccb1a0b288b8cbb3e6bbf277ceeaa82fe3cf073d228d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bypassSnaplockEnterpriseRetention", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="copyTagsToBackups")
    def copy_tags_to_backups(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "copyTagsToBackups"))

    @copy_tags_to_backups.setter
    def copy_tags_to_backups(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__caaa448cfb0cd65cb45a78ab15c16e1ca8188157bd0f56be8a0d2f79ddaf62c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "copyTagsToBackups", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="finalBackupTags")
    def final_backup_tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "finalBackupTags"))

    @final_backup_tags.setter
    def final_backup_tags(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb0e375f83e2cd997945270d65caf1f28a4403e5d8ae15a2b811ca30dac2ca21)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "finalBackupTags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__241b617cc81a7cede4fcd938a177ec53c85e7f502fe9f02ea196a03f9201642f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="junctionPath")
    def junction_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "junctionPath"))

    @junction_path.setter
    def junction_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8fddbb99fdc6994b19ee78cc563ea77d7645d03ead70b14db7d416abbbc4e8ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "junctionPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a4605d399bd07a9efb206619fbdb172e188d812e94bc9b7188cfc2ca6394f1f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ontapVolumeType")
    def ontap_volume_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ontapVolumeType"))

    @ontap_volume_type.setter
    def ontap_volume_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24dd2e4f67480d5b27699351aecff5a6541332917145c949a2bd3a900ef095e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ontapVolumeType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityStyle")
    def security_style(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "securityStyle"))

    @security_style.setter
    def security_style(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0481e9037455c2933e1485286cdae12cebb2b99ef0311174d342c144974bba87)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityStyle", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sizeInBytes")
    def size_in_bytes(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sizeInBytes"))

    @size_in_bytes.setter
    def size_in_bytes(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__905247ac8e89f5509f3d65a808565e21f365faf09346aae084ac6bb7091f74ae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sizeInBytes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sizeInMegabytes")
    def size_in_megabytes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "sizeInMegabytes"))

    @size_in_megabytes.setter
    def size_in_megabytes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d009b943511cd90356dc4daac68e1b878fc34f7f0f39bcfbd570e5a074244b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sizeInMegabytes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="skipFinalBackup")
    def skip_final_backup(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "skipFinalBackup"))

    @skip_final_backup.setter
    def skip_final_backup(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__448030875b4d369ed4d8e85897c6080d28d0cacbcd107373b0bfae45351c1053)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "skipFinalBackup", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="snapshotPolicy")
    def snapshot_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "snapshotPolicy"))

    @snapshot_policy.setter
    def snapshot_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d90ca5aa906a58f69cc14aab513100f66a9aa4b3d37e870d0016eea7d7b3caa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "snapshotPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="storageEfficiencyEnabled")
    def storage_efficiency_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "storageEfficiencyEnabled"))

    @storage_efficiency_enabled.setter
    def storage_efficiency_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f8070d970dc2e2e74f255b7be88dcc553b48dbc3cf52f46338706ff11db125c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "storageEfficiencyEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="storageVirtualMachineId")
    def storage_virtual_machine_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "storageVirtualMachineId"))

    @storage_virtual_machine_id.setter
    def storage_virtual_machine_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__441ec1bdd41bbdc9de8497ee33aa4f6440286b49a45f2c1154961b2a07ba3f27)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "storageVirtualMachineId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d33ee0380fe93716f24b6104c88889f2c9958008517d294c59d7f538477bd2a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__98307e8f951381aebc858783ff6f0029e72f6c1cecdbb00f5bd212b895bee345)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="volumeStyle")
    def volume_style(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "volumeStyle"))

    @volume_style.setter
    def volume_style(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__03ab6b69a6c03a7d884fd02b48f92f51887b4e9ec9326b350925005121b7322a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "volumeStyle", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="volumeType")
    def volume_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "volumeType"))

    @volume_type.setter
    def volume_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e939db08cfe8b39f36742b08c8d9b098b3e0a3c87de66ca15a9edc370ee167eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "volumeType", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeAggregateConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "aggregates": "aggregates",
        "constituents_per_aggregate": "constituentsPerAggregate",
    },
)
class FsxOntapVolumeAggregateConfiguration:
    def __init__(
        self,
        *,
        aggregates: typing.Optional[typing.Sequence[builtins.str]] = None,
        constituents_per_aggregate: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param aggregates: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregates FsxOntapVolume#aggregates}.
        :param constituents_per_aggregate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#constituents_per_aggregate FsxOntapVolume#constituents_per_aggregate}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__095716c3cf068e4e86a126faefddb00d054a81d270a118d0a9ccc1c2d3b8f727)
            check_type(argname="argument aggregates", value=aggregates, expected_type=type_hints["aggregates"])
            check_type(argname="argument constituents_per_aggregate", value=constituents_per_aggregate, expected_type=type_hints["constituents_per_aggregate"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if aggregates is not None:
            self._values["aggregates"] = aggregates
        if constituents_per_aggregate is not None:
            self._values["constituents_per_aggregate"] = constituents_per_aggregate

    @builtins.property
    def aggregates(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregates FsxOntapVolume#aggregates}.'''
        result = self._values.get("aggregates")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def constituents_per_aggregate(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#constituents_per_aggregate FsxOntapVolume#constituents_per_aggregate}.'''
        result = self._values.get("constituents_per_aggregate")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxOntapVolumeAggregateConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxOntapVolumeAggregateConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeAggregateConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7ddc094678a82d9a1fe727a6735947084bd4c1d946e95b03bdebbe04a6eba853)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAggregates")
    def reset_aggregates(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAggregates", []))

    @jsii.member(jsii_name="resetConstituentsPerAggregate")
    def reset_constituents_per_aggregate(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConstituentsPerAggregate", []))

    @builtins.property
    @jsii.member(jsii_name="totalConstituents")
    def total_constituents(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "totalConstituents"))

    @builtins.property
    @jsii.member(jsii_name="aggregatesInput")
    def aggregates_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "aggregatesInput"))

    @builtins.property
    @jsii.member(jsii_name="constituentsPerAggregateInput")
    def constituents_per_aggregate_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "constituentsPerAggregateInput"))

    @builtins.property
    @jsii.member(jsii_name="aggregates")
    def aggregates(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "aggregates"))

    @aggregates.setter
    def aggregates(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2693ccb9be519c2fa3f44318b22ba01fc1d0f460780223797c692d1d8f3a4b6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "aggregates", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="constituentsPerAggregate")
    def constituents_per_aggregate(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "constituentsPerAggregate"))

    @constituents_per_aggregate.setter
    def constituents_per_aggregate(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__955e64b0e3ba76517e043d43fe9a81428485ae9935bcd542982763fcce40e5bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "constituentsPerAggregate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[FsxOntapVolumeAggregateConfiguration]:
        return typing.cast(typing.Optional[FsxOntapVolumeAggregateConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxOntapVolumeAggregateConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e351b7a993268e9db03da2f779d3bc24d1dff5282ccdc5869a6138be1c006f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "name": "name",
        "storage_virtual_machine_id": "storageVirtualMachineId",
        "aggregate_configuration": "aggregateConfiguration",
        "bypass_snaplock_enterprise_retention": "bypassSnaplockEnterpriseRetention",
        "copy_tags_to_backups": "copyTagsToBackups",
        "final_backup_tags": "finalBackupTags",
        "id": "id",
        "junction_path": "junctionPath",
        "ontap_volume_type": "ontapVolumeType",
        "security_style": "securityStyle",
        "size_in_bytes": "sizeInBytes",
        "size_in_megabytes": "sizeInMegabytes",
        "skip_final_backup": "skipFinalBackup",
        "snaplock_configuration": "snaplockConfiguration",
        "snapshot_policy": "snapshotPolicy",
        "storage_efficiency_enabled": "storageEfficiencyEnabled",
        "tags": "tags",
        "tags_all": "tagsAll",
        "tiering_policy": "tieringPolicy",
        "timeouts": "timeouts",
        "volume_style": "volumeStyle",
        "volume_type": "volumeType",
    },
)
class FsxOntapVolumeConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        name: builtins.str,
        storage_virtual_machine_id: builtins.str,
        aggregate_configuration: typing.Optional[typing.Union[FsxOntapVolumeAggregateConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
        bypass_snaplock_enterprise_retention: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        copy_tags_to_backups: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        final_backup_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        id: typing.Optional[builtins.str] = None,
        junction_path: typing.Optional[builtins.str] = None,
        ontap_volume_type: typing.Optional[builtins.str] = None,
        security_style: typing.Optional[builtins.str] = None,
        size_in_bytes: typing.Optional[builtins.str] = None,
        size_in_megabytes: typing.Optional[jsii.Number] = None,
        skip_final_backup: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        snaplock_configuration: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        snapshot_policy: typing.Optional[builtins.str] = None,
        storage_efficiency_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tiering_policy: typing.Optional[typing.Union["FsxOntapVolumeTieringPolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        timeouts: typing.Optional[typing.Union["FsxOntapVolumeTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        volume_style: typing.Optional[builtins.str] = None,
        volume_type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}.
        :param storage_virtual_machine_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_virtual_machine_id FsxOntapVolume#storage_virtual_machine_id}.
        :param aggregate_configuration: aggregate_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregate_configuration FsxOntapVolume#aggregate_configuration}
        :param bypass_snaplock_enterprise_retention: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#bypass_snaplock_enterprise_retention FsxOntapVolume#bypass_snaplock_enterprise_retention}.
        :param copy_tags_to_backups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#copy_tags_to_backups FsxOntapVolume#copy_tags_to_backups}.
        :param final_backup_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#final_backup_tags FsxOntapVolume#final_backup_tags}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#id FsxOntapVolume#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param junction_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#junction_path FsxOntapVolume#junction_path}.
        :param ontap_volume_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#ontap_volume_type FsxOntapVolume#ontap_volume_type}.
        :param security_style: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#security_style FsxOntapVolume#security_style}.
        :param size_in_bytes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_bytes FsxOntapVolume#size_in_bytes}.
        :param size_in_megabytes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_megabytes FsxOntapVolume#size_in_megabytes}.
        :param skip_final_backup: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#skip_final_backup FsxOntapVolume#skip_final_backup}.
        :param snaplock_configuration: snaplock_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_configuration FsxOntapVolume#snaplock_configuration}
        :param snapshot_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snapshot_policy FsxOntapVolume#snapshot_policy}.
        :param storage_efficiency_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_efficiency_enabled FsxOntapVolume#storage_efficiency_enabled}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags FsxOntapVolume#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags_all FsxOntapVolume#tags_all}.
        :param tiering_policy: tiering_policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tiering_policy FsxOntapVolume#tiering_policy}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#timeouts FsxOntapVolume#timeouts}
        :param volume_style: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_style FsxOntapVolume#volume_style}.
        :param volume_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_type FsxOntapVolume#volume_type}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(aggregate_configuration, dict):
            aggregate_configuration = FsxOntapVolumeAggregateConfiguration(**aggregate_configuration)
        if isinstance(snaplock_configuration, dict):
            snaplock_configuration = FsxOntapVolumeSnaplockConfiguration(**snaplock_configuration)
        if isinstance(tiering_policy, dict):
            tiering_policy = FsxOntapVolumeTieringPolicy(**tiering_policy)
        if isinstance(timeouts, dict):
            timeouts = FsxOntapVolumeTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__82dd488f38417c7df4f94af991afebeecf316454e648f17828470b6720257a49)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument storage_virtual_machine_id", value=storage_virtual_machine_id, expected_type=type_hints["storage_virtual_machine_id"])
            check_type(argname="argument aggregate_configuration", value=aggregate_configuration, expected_type=type_hints["aggregate_configuration"])
            check_type(argname="argument bypass_snaplock_enterprise_retention", value=bypass_snaplock_enterprise_retention, expected_type=type_hints["bypass_snaplock_enterprise_retention"])
            check_type(argname="argument copy_tags_to_backups", value=copy_tags_to_backups, expected_type=type_hints["copy_tags_to_backups"])
            check_type(argname="argument final_backup_tags", value=final_backup_tags, expected_type=type_hints["final_backup_tags"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument junction_path", value=junction_path, expected_type=type_hints["junction_path"])
            check_type(argname="argument ontap_volume_type", value=ontap_volume_type, expected_type=type_hints["ontap_volume_type"])
            check_type(argname="argument security_style", value=security_style, expected_type=type_hints["security_style"])
            check_type(argname="argument size_in_bytes", value=size_in_bytes, expected_type=type_hints["size_in_bytes"])
            check_type(argname="argument size_in_megabytes", value=size_in_megabytes, expected_type=type_hints["size_in_megabytes"])
            check_type(argname="argument skip_final_backup", value=skip_final_backup, expected_type=type_hints["skip_final_backup"])
            check_type(argname="argument snaplock_configuration", value=snaplock_configuration, expected_type=type_hints["snaplock_configuration"])
            check_type(argname="argument snapshot_policy", value=snapshot_policy, expected_type=type_hints["snapshot_policy"])
            check_type(argname="argument storage_efficiency_enabled", value=storage_efficiency_enabled, expected_type=type_hints["storage_efficiency_enabled"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument tiering_policy", value=tiering_policy, expected_type=type_hints["tiering_policy"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
            check_type(argname="argument volume_style", value=volume_style, expected_type=type_hints["volume_style"])
            check_type(argname="argument volume_type", value=volume_type, expected_type=type_hints["volume_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "storage_virtual_machine_id": storage_virtual_machine_id,
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
        if aggregate_configuration is not None:
            self._values["aggregate_configuration"] = aggregate_configuration
        if bypass_snaplock_enterprise_retention is not None:
            self._values["bypass_snaplock_enterprise_retention"] = bypass_snaplock_enterprise_retention
        if copy_tags_to_backups is not None:
            self._values["copy_tags_to_backups"] = copy_tags_to_backups
        if final_backup_tags is not None:
            self._values["final_backup_tags"] = final_backup_tags
        if id is not None:
            self._values["id"] = id
        if junction_path is not None:
            self._values["junction_path"] = junction_path
        if ontap_volume_type is not None:
            self._values["ontap_volume_type"] = ontap_volume_type
        if security_style is not None:
            self._values["security_style"] = security_style
        if size_in_bytes is not None:
            self._values["size_in_bytes"] = size_in_bytes
        if size_in_megabytes is not None:
            self._values["size_in_megabytes"] = size_in_megabytes
        if skip_final_backup is not None:
            self._values["skip_final_backup"] = skip_final_backup
        if snaplock_configuration is not None:
            self._values["snaplock_configuration"] = snaplock_configuration
        if snapshot_policy is not None:
            self._values["snapshot_policy"] = snapshot_policy
        if storage_efficiency_enabled is not None:
            self._values["storage_efficiency_enabled"] = storage_efficiency_enabled
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if tiering_policy is not None:
            self._values["tiering_policy"] = tiering_policy
        if timeouts is not None:
            self._values["timeouts"] = timeouts
        if volume_style is not None:
            self._values["volume_style"] = volume_style
        if volume_type is not None:
            self._values["volume_type"] = volume_type

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
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def storage_virtual_machine_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_virtual_machine_id FsxOntapVolume#storage_virtual_machine_id}.'''
        result = self._values.get("storage_virtual_machine_id")
        assert result is not None, "Required property 'storage_virtual_machine_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def aggregate_configuration(
        self,
    ) -> typing.Optional[FsxOntapVolumeAggregateConfiguration]:
        '''aggregate_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregate_configuration FsxOntapVolume#aggregate_configuration}
        '''
        result = self._values.get("aggregate_configuration")
        return typing.cast(typing.Optional[FsxOntapVolumeAggregateConfiguration], result)

    @builtins.property
    def bypass_snaplock_enterprise_retention(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#bypass_snaplock_enterprise_retention FsxOntapVolume#bypass_snaplock_enterprise_retention}.'''
        result = self._values.get("bypass_snaplock_enterprise_retention")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def copy_tags_to_backups(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#copy_tags_to_backups FsxOntapVolume#copy_tags_to_backups}.'''
        result = self._values.get("copy_tags_to_backups")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def final_backup_tags(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#final_backup_tags FsxOntapVolume#final_backup_tags}.'''
        result = self._values.get("final_backup_tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#id FsxOntapVolume#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def junction_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#junction_path FsxOntapVolume#junction_path}.'''
        result = self._values.get("junction_path")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ontap_volume_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#ontap_volume_type FsxOntapVolume#ontap_volume_type}.'''
        result = self._values.get("ontap_volume_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def security_style(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#security_style FsxOntapVolume#security_style}.'''
        result = self._values.get("security_style")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def size_in_bytes(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_bytes FsxOntapVolume#size_in_bytes}.'''
        result = self._values.get("size_in_bytes")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def size_in_megabytes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_megabytes FsxOntapVolume#size_in_megabytes}.'''
        result = self._values.get("size_in_megabytes")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def skip_final_backup(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#skip_final_backup FsxOntapVolume#skip_final_backup}.'''
        result = self._values.get("skip_final_backup")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def snaplock_configuration(
        self,
    ) -> typing.Optional["FsxOntapVolumeSnaplockConfiguration"]:
        '''snaplock_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_configuration FsxOntapVolume#snaplock_configuration}
        '''
        result = self._values.get("snaplock_configuration")
        return typing.cast(typing.Optional["FsxOntapVolumeSnaplockConfiguration"], result)

    @builtins.property
    def snapshot_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snapshot_policy FsxOntapVolume#snapshot_policy}.'''
        result = self._values.get("snapshot_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def storage_efficiency_enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_efficiency_enabled FsxOntapVolume#storage_efficiency_enabled}.'''
        result = self._values.get("storage_efficiency_enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags FsxOntapVolume#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags_all FsxOntapVolume#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tiering_policy(self) -> typing.Optional["FsxOntapVolumeTieringPolicy"]:
        '''tiering_policy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tiering_policy FsxOntapVolume#tiering_policy}
        '''
        result = self._values.get("tiering_policy")
        return typing.cast(typing.Optional["FsxOntapVolumeTieringPolicy"], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["FsxOntapVolumeTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#timeouts FsxOntapVolume#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["FsxOntapVolumeTimeouts"], result)

    @builtins.property
    def volume_style(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_style FsxOntapVolume#volume_style}.'''
        result = self._values.get("volume_style")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def volume_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_type FsxOntapVolume#volume_type}.'''
        result = self._values.get("volume_type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxOntapVolumeConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "snaplock_type": "snaplockType",
        "audit_log_volume": "auditLogVolume",
        "autocommit_period": "autocommitPeriod",
        "privileged_delete": "privilegedDelete",
        "retention_period": "retentionPeriod",
        "volume_append_mode_enabled": "volumeAppendModeEnabled",
    },
)
class FsxOntapVolumeSnaplockConfiguration:
    def __init__(
        self,
        *,
        snaplock_type: builtins.str,
        audit_log_volume: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        autocommit_period: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfigurationAutocommitPeriod", typing.Dict[builtins.str, typing.Any]]] = None,
        privileged_delete: typing.Optional[builtins.str] = None,
        retention_period: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfigurationRetentionPeriod", typing.Dict[builtins.str, typing.Any]]] = None,
        volume_append_mode_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param snaplock_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_type FsxOntapVolume#snaplock_type}.
        :param audit_log_volume: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#audit_log_volume FsxOntapVolume#audit_log_volume}.
        :param autocommit_period: autocommit_period block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#autocommit_period FsxOntapVolume#autocommit_period}
        :param privileged_delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#privileged_delete FsxOntapVolume#privileged_delete}.
        :param retention_period: retention_period block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#retention_period FsxOntapVolume#retention_period}
        :param volume_append_mode_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_append_mode_enabled FsxOntapVolume#volume_append_mode_enabled}.
        '''
        if isinstance(autocommit_period, dict):
            autocommit_period = FsxOntapVolumeSnaplockConfigurationAutocommitPeriod(**autocommit_period)
        if isinstance(retention_period, dict):
            retention_period = FsxOntapVolumeSnaplockConfigurationRetentionPeriod(**retention_period)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c9a6ad625abc6d3fdcff61d8665ff9009ce66ec444b18912ef7f7d7528e3b46)
            check_type(argname="argument snaplock_type", value=snaplock_type, expected_type=type_hints["snaplock_type"])
            check_type(argname="argument audit_log_volume", value=audit_log_volume, expected_type=type_hints["audit_log_volume"])
            check_type(argname="argument autocommit_period", value=autocommit_period, expected_type=type_hints["autocommit_period"])
            check_type(argname="argument privileged_delete", value=privileged_delete, expected_type=type_hints["privileged_delete"])
            check_type(argname="argument retention_period", value=retention_period, expected_type=type_hints["retention_period"])
            check_type(argname="argument volume_append_mode_enabled", value=volume_append_mode_enabled, expected_type=type_hints["volume_append_mode_enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "snaplock_type": snaplock_type,
        }
        if audit_log_volume is not None:
            self._values["audit_log_volume"] = audit_log_volume
        if autocommit_period is not None:
            self._values["autocommit_period"] = autocommit_period
        if privileged_delete is not None:
            self._values["privileged_delete"] = privileged_delete
        if retention_period is not None:
            self._values["retention_period"] = retention_period
        if volume_append_mode_enabled is not None:
            self._values["volume_append_mode_enabled"] = volume_append_mode_enabled

    @builtins.property
    def snaplock_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_type FsxOntapVolume#snaplock_type}.'''
        result = self._values.get("snaplock_type")
        assert result is not None, "Required property 'snaplock_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def audit_log_volume(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#audit_log_volume FsxOntapVolume#audit_log_volume}.'''
        result = self._values.get("audit_log_volume")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def autocommit_period(
        self,
    ) -> typing.Optional["FsxOntapVolumeSnaplockConfigurationAutocommitPeriod"]:
        '''autocommit_period block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#autocommit_period FsxOntapVolume#autocommit_period}
        '''
        result = self._values.get("autocommit_period")
        return typing.cast(typing.Optional["FsxOntapVolumeSnaplockConfigurationAutocommitPeriod"], result)

    @builtins.property
    def privileged_delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#privileged_delete FsxOntapVolume#privileged_delete}.'''
        result = self._values.get("privileged_delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def retention_period(
        self,
    ) -> typing.Optional["FsxOntapVolumeSnaplockConfigurationRetentionPeriod"]:
        '''retention_period block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#retention_period FsxOntapVolume#retention_period}
        '''
        result = self._values.get("retention_period")
        return typing.cast(typing.Optional["FsxOntapVolumeSnaplockConfigurationRetentionPeriod"], result)

    @builtins.property
    def volume_append_mode_enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_append_mode_enabled FsxOntapVolume#volume_append_mode_enabled}.'''
        result = self._values.get("volume_append_mode_enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxOntapVolumeSnaplockConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriod",
    jsii_struct_bases=[],
    name_mapping={"type": "type", "value": "value"},
)
class FsxOntapVolumeSnaplockConfigurationAutocommitPeriod:
    def __init__(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83d732bcc45678df96d2ef1983b86e1ef18fa4bd1517ef3d832851671084f9de)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if type is not None:
            self._values["type"] = type
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxOntapVolumeSnaplockConfigurationAutocommitPeriod(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxOntapVolumeSnaplockConfigurationAutocommitPeriodOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriodOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__08e75c113d281f3b3fdcd69c830f7c177f155d44f12532bedccc0fda4f707731)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e0ec0d5813e72d2c839dd01cadadf06ff285ecd9bf50c5af8e152f37ba007ec8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d537218a084dda8796f3ee39acd3ff36423eca096007b4d52194590b1eab80e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FsxOntapVolumeSnaplockConfigurationAutocommitPeriod]:
        return typing.cast(typing.Optional[FsxOntapVolumeSnaplockConfigurationAutocommitPeriod], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxOntapVolumeSnaplockConfigurationAutocommitPeriod],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e78db8366c6f2c0336dfca5af1f72961b09d74030db92d4f98374c0b1240278)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FsxOntapVolumeSnaplockConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6e196c382c788245edcd578702477270553f367e04eacc54ce7546569c620dc2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAutocommitPeriod")
    def put_autocommit_period(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.
        '''
        value_ = FsxOntapVolumeSnaplockConfigurationAutocommitPeriod(
            type=type, value=value
        )

        return typing.cast(None, jsii.invoke(self, "putAutocommitPeriod", [value_]))

    @jsii.member(jsii_name="putRetentionPeriod")
    def put_retention_period(
        self,
        *,
        default_retention: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention", typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_retention: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention", typing.Dict[builtins.str, typing.Any]]] = None,
        minimum_retention: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param default_retention: default_retention block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#default_retention FsxOntapVolume#default_retention}
        :param maximum_retention: maximum_retention block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#maximum_retention FsxOntapVolume#maximum_retention}
        :param minimum_retention: minimum_retention block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#minimum_retention FsxOntapVolume#minimum_retention}
        '''
        value = FsxOntapVolumeSnaplockConfigurationRetentionPeriod(
            default_retention=default_retention,
            maximum_retention=maximum_retention,
            minimum_retention=minimum_retention,
        )

        return typing.cast(None, jsii.invoke(self, "putRetentionPeriod", [value]))

    @jsii.member(jsii_name="resetAuditLogVolume")
    def reset_audit_log_volume(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAuditLogVolume", []))

    @jsii.member(jsii_name="resetAutocommitPeriod")
    def reset_autocommit_period(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAutocommitPeriod", []))

    @jsii.member(jsii_name="resetPrivilegedDelete")
    def reset_privileged_delete(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrivilegedDelete", []))

    @jsii.member(jsii_name="resetRetentionPeriod")
    def reset_retention_period(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRetentionPeriod", []))

    @jsii.member(jsii_name="resetVolumeAppendModeEnabled")
    def reset_volume_append_mode_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVolumeAppendModeEnabled", []))

    @builtins.property
    @jsii.member(jsii_name="autocommitPeriod")
    def autocommit_period(
        self,
    ) -> FsxOntapVolumeSnaplockConfigurationAutocommitPeriodOutputReference:
        return typing.cast(FsxOntapVolumeSnaplockConfigurationAutocommitPeriodOutputReference, jsii.get(self, "autocommitPeriod"))

    @builtins.property
    @jsii.member(jsii_name="retentionPeriod")
    def retention_period(
        self,
    ) -> "FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference":
        return typing.cast("FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference", jsii.get(self, "retentionPeriod"))

    @builtins.property
    @jsii.member(jsii_name="auditLogVolumeInput")
    def audit_log_volume_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "auditLogVolumeInput"))

    @builtins.property
    @jsii.member(jsii_name="autocommitPeriodInput")
    def autocommit_period_input(
        self,
    ) -> typing.Optional[FsxOntapVolumeSnaplockConfigurationAutocommitPeriod]:
        return typing.cast(typing.Optional[FsxOntapVolumeSnaplockConfigurationAutocommitPeriod], jsii.get(self, "autocommitPeriodInput"))

    @builtins.property
    @jsii.member(jsii_name="privilegedDeleteInput")
    def privileged_delete_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "privilegedDeleteInput"))

    @builtins.property
    @jsii.member(jsii_name="retentionPeriodInput")
    def retention_period_input(
        self,
    ) -> typing.Optional["FsxOntapVolumeSnaplockConfigurationRetentionPeriod"]:
        return typing.cast(typing.Optional["FsxOntapVolumeSnaplockConfigurationRetentionPeriod"], jsii.get(self, "retentionPeriodInput"))

    @builtins.property
    @jsii.member(jsii_name="snaplockTypeInput")
    def snaplock_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "snaplockTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="volumeAppendModeEnabledInput")
    def volume_append_mode_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "volumeAppendModeEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="auditLogVolume")
    def audit_log_volume(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "auditLogVolume"))

    @audit_log_volume.setter
    def audit_log_volume(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__320e4b1dcce0e9d669d43281bb1e8f514da387f8385e8063fd4c56743fd3dc6c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "auditLogVolume", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="privilegedDelete")
    def privileged_delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "privilegedDelete"))

    @privileged_delete.setter
    def privileged_delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7eaab8f558282fd674698463f7ce014a864a197c788cc8922437aeb9c3b76333)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "privilegedDelete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="snaplockType")
    def snaplock_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "snaplockType"))

    @snaplock_type.setter
    def snaplock_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43a8815395bd87b392cdcafae0bd55cf9e751606042ea3e48dbed9c17a7c46b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "snaplockType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="volumeAppendModeEnabled")
    def volume_append_mode_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "volumeAppendModeEnabled"))

    @volume_append_mode_enabled.setter
    def volume_append_mode_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc5ec7761d3ffa6faebb6bd14f3f5c952396c918e17ea79380ea2501db050ed5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "volumeAppendModeEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[FsxOntapVolumeSnaplockConfiguration]:
        return typing.cast(typing.Optional[FsxOntapVolumeSnaplockConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxOntapVolumeSnaplockConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4deb5450b5e00cace14cadedde0074ab56bb608588a935a0ee9cab4bb8661c75)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod",
    jsii_struct_bases=[],
    name_mapping={
        "default_retention": "defaultRetention",
        "maximum_retention": "maximumRetention",
        "minimum_retention": "minimumRetention",
    },
)
class FsxOntapVolumeSnaplockConfigurationRetentionPeriod:
    def __init__(
        self,
        *,
        default_retention: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention", typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_retention: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention", typing.Dict[builtins.str, typing.Any]]] = None,
        minimum_retention: typing.Optional[typing.Union["FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param default_retention: default_retention block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#default_retention FsxOntapVolume#default_retention}
        :param maximum_retention: maximum_retention block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#maximum_retention FsxOntapVolume#maximum_retention}
        :param minimum_retention: minimum_retention block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#minimum_retention FsxOntapVolume#minimum_retention}
        '''
        if isinstance(default_retention, dict):
            default_retention = FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention(**default_retention)
        if isinstance(maximum_retention, dict):
            maximum_retention = FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention(**maximum_retention)
        if isinstance(minimum_retention, dict):
            minimum_retention = FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention(**minimum_retention)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0115019c90759e713476000fd1c9630536dc0645d0724b7870d1c2a2dc999bb1)
            check_type(argname="argument default_retention", value=default_retention, expected_type=type_hints["default_retention"])
            check_type(argname="argument maximum_retention", value=maximum_retention, expected_type=type_hints["maximum_retention"])
            check_type(argname="argument minimum_retention", value=minimum_retention, expected_type=type_hints["minimum_retention"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if default_retention is not None:
            self._values["default_retention"] = default_retention
        if maximum_retention is not None:
            self._values["maximum_retention"] = maximum_retention
        if minimum_retention is not None:
            self._values["minimum_retention"] = minimum_retention

    @builtins.property
    def default_retention(
        self,
    ) -> typing.Optional["FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention"]:
        '''default_retention block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#default_retention FsxOntapVolume#default_retention}
        '''
        result = self._values.get("default_retention")
        return typing.cast(typing.Optional["FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention"], result)

    @builtins.property
    def maximum_retention(
        self,
    ) -> typing.Optional["FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention"]:
        '''maximum_retention block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#maximum_retention FsxOntapVolume#maximum_retention}
        '''
        result = self._values.get("maximum_retention")
        return typing.cast(typing.Optional["FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention"], result)

    @builtins.property
    def minimum_retention(
        self,
    ) -> typing.Optional["FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention"]:
        '''minimum_retention block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#minimum_retention FsxOntapVolume#minimum_retention}
        '''
        result = self._values.get("minimum_retention")
        return typing.cast(typing.Optional["FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxOntapVolumeSnaplockConfigurationRetentionPeriod(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention",
    jsii_struct_bases=[],
    name_mapping={"type": "type", "value": "value"},
)
class FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention:
    def __init__(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ebb0c4a5ffd4fa92d292273e0af4b0f279a0427519f3e29ea541da5064d8960a)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if type is not None:
            self._values["type"] = type
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetentionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetentionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7bdcf411f7cdd4f43348a74d663e54dda4f4fe97ec10e1f8a0413621e3367500)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c1ba52da90160a03612378c2fe95e0ca8fed02f9db9e3f491b597c14d94c4ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30007effa5dbd81208586fe41fcfa78415549b2b195dc0f2b49a7ae5401268d7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention]:
        return typing.cast(typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e34be275bb50f4b049a130a0351eb9b14dbc1766692cee08cae57222ea241110)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention",
    jsii_struct_bases=[],
    name_mapping={"type": "type", "value": "value"},
)
class FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention:
    def __init__(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f4c73f9afd0cfebe00231d4e6aff6b9db03644c3edb428e55d1e972215de9b1)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if type is not None:
            self._values["type"] = type
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetentionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetentionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__afc7e96c607dc6c118766d28b0265f8e82d8fe53c54a024158bb8a4d8cf44878)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b96a9670b63919981d8d09185e029fcdaa54796b03f854b7a8142bcbbec4b4e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b5addf340e6a2ed794c9e207142f92225d82ccfc565901520e6a73e9c187fbac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention]:
        return typing.cast(typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf17aea73fea0fb1bf7aba9f17d021e90b3af3e54ad09ce8d010f2210eddc0bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention",
    jsii_struct_bases=[],
    name_mapping={"type": "type", "value": "value"},
)
class FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention:
    def __init__(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f00552fe8b55ed9202f2776f5f057b844352c8f15324d8a32bd42f4322387aa)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if type is not None:
            self._values["type"] = type
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetentionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetentionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a0719e6c8805c5c0e47e953ca06cd7d08d91d9f211d1b39b162819da5483a45a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6bf30243a967a0ee5e5650361f44acf16b76cf93117d9ec07bf09570f7250a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8cc796b30abc9b0b078718d447ff705c53af610fb1ef64c2b5f17d7fb43d9513)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention]:
        return typing.cast(typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__afe7b39f8811b103c6a113bb401c422f47aa9d17b93971c61417ca0261bfa0f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__50496a2ba03d5c3fb8254f37851512b0bffb012731686a5087654039038bda95)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDefaultRetention")
    def put_default_retention(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.
        '''
        value_ = FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention(
            type=type, value=value
        )

        return typing.cast(None, jsii.invoke(self, "putDefaultRetention", [value_]))

    @jsii.member(jsii_name="putMaximumRetention")
    def put_maximum_retention(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.
        '''
        value_ = FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention(
            type=type, value=value
        )

        return typing.cast(None, jsii.invoke(self, "putMaximumRetention", [value_]))

    @jsii.member(jsii_name="putMinimumRetention")
    def put_minimum_retention(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.
        '''
        value_ = FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention(
            type=type, value=value
        )

        return typing.cast(None, jsii.invoke(self, "putMinimumRetention", [value_]))

    @jsii.member(jsii_name="resetDefaultRetention")
    def reset_default_retention(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultRetention", []))

    @jsii.member(jsii_name="resetMaximumRetention")
    def reset_maximum_retention(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumRetention", []))

    @jsii.member(jsii_name="resetMinimumRetention")
    def reset_minimum_retention(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinimumRetention", []))

    @builtins.property
    @jsii.member(jsii_name="defaultRetention")
    def default_retention(
        self,
    ) -> FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetentionOutputReference:
        return typing.cast(FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetentionOutputReference, jsii.get(self, "defaultRetention"))

    @builtins.property
    @jsii.member(jsii_name="maximumRetention")
    def maximum_retention(
        self,
    ) -> FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetentionOutputReference:
        return typing.cast(FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetentionOutputReference, jsii.get(self, "maximumRetention"))

    @builtins.property
    @jsii.member(jsii_name="minimumRetention")
    def minimum_retention(
        self,
    ) -> FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetentionOutputReference:
        return typing.cast(FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetentionOutputReference, jsii.get(self, "minimumRetention"))

    @builtins.property
    @jsii.member(jsii_name="defaultRetentionInput")
    def default_retention_input(
        self,
    ) -> typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention]:
        return typing.cast(typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention], jsii.get(self, "defaultRetentionInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumRetentionInput")
    def maximum_retention_input(
        self,
    ) -> typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention]:
        return typing.cast(typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention], jsii.get(self, "maximumRetentionInput"))

    @builtins.property
    @jsii.member(jsii_name="minimumRetentionInput")
    def minimum_retention_input(
        self,
    ) -> typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention]:
        return typing.cast(typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention], jsii.get(self, "minimumRetentionInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriod]:
        return typing.cast(typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriod], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriod],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6fb66a220b287c685409f99454adcdc5e7f7fd95829197987994c8b9d2d71d5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeTieringPolicy",
    jsii_struct_bases=[],
    name_mapping={"cooling_period": "coolingPeriod", "name": "name"},
)
class FsxOntapVolumeTieringPolicy:
    def __init__(
        self,
        *,
        cooling_period: typing.Optional[jsii.Number] = None,
        name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param cooling_period: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#cooling_period FsxOntapVolume#cooling_period}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc715271d7a91388e6d126afd3cd5bd54009a46e1c84db0c1601867993daaffa)
            check_type(argname="argument cooling_period", value=cooling_period, expected_type=type_hints["cooling_period"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if cooling_period is not None:
            self._values["cooling_period"] = cooling_period
        if name is not None:
            self._values["name"] = name

    @builtins.property
    def cooling_period(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#cooling_period FsxOntapVolume#cooling_period}.'''
        result = self._values.get("cooling_period")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxOntapVolumeTieringPolicy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxOntapVolumeTieringPolicyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeTieringPolicyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4573f78cee0d639c7176dd39421cb839cd2389be3a3452fbf19ec62610748e5b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCoolingPeriod")
    def reset_cooling_period(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCoolingPeriod", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @builtins.property
    @jsii.member(jsii_name="coolingPeriodInput")
    def cooling_period_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "coolingPeriodInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="coolingPeriod")
    def cooling_period(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "coolingPeriod"))

    @cooling_period.setter
    def cooling_period(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21875b517b4a7d8ac00afbb843a73469211788b10078494a2843ae8329878407)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "coolingPeriod", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8a49f3f01e8414a76e712f73a14189686dfebe60e80024b4ce78a299bb7b04e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[FsxOntapVolumeTieringPolicy]:
        return typing.cast(typing.Optional[FsxOntapVolumeTieringPolicy], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxOntapVolumeTieringPolicy],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9541d6e93bb0d6a9169617eb5cfa88c7f20f248b2df3615ba37ae2e16a204ab1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class FsxOntapVolumeTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#create FsxOntapVolume#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#delete FsxOntapVolume#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#update FsxOntapVolume#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1dc2824bbb3cf639d0b17f2af1e0fc0a86aa7c3676e13866335c62f3c2caade)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#create FsxOntapVolume#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#delete FsxOntapVolume#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#update FsxOntapVolume#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxOntapVolumeTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxOntapVolumeTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxOntapVolume.FsxOntapVolumeTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d7db11fd04bebfb3b97fc09ad2268de5432b4db9d2d6d0a65cf142a07f5b15cd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__89eaf1c686d1f1d7e67342f51d377135c51b62822b65bf22dae8c8f67b9e2a3b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3774d5fde9c9d4223bd1b720c1f0f4b609d0a58f8901d9ce4c5d23a1b2b5abd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21214ea51dded6a6d1c8ec697d19bf46e60693e65db4ad63cf777db2dd63f8bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FsxOntapVolumeTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FsxOntapVolumeTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FsxOntapVolumeTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a72595afefce65d5ebcb6128894785b8ecb524e0fdb0b48793b56555fb47d604)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "FsxOntapVolume",
    "FsxOntapVolumeAggregateConfiguration",
    "FsxOntapVolumeAggregateConfigurationOutputReference",
    "FsxOntapVolumeConfig",
    "FsxOntapVolumeSnaplockConfiguration",
    "FsxOntapVolumeSnaplockConfigurationAutocommitPeriod",
    "FsxOntapVolumeSnaplockConfigurationAutocommitPeriodOutputReference",
    "FsxOntapVolumeSnaplockConfigurationOutputReference",
    "FsxOntapVolumeSnaplockConfigurationRetentionPeriod",
    "FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention",
    "FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetentionOutputReference",
    "FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention",
    "FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetentionOutputReference",
    "FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention",
    "FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetentionOutputReference",
    "FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference",
    "FsxOntapVolumeTieringPolicy",
    "FsxOntapVolumeTieringPolicyOutputReference",
    "FsxOntapVolumeTimeouts",
    "FsxOntapVolumeTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__8bc9e1a39f4bcc1e0c208a7371d6fcfcf805f2e6328bb6caa53df197fd72d4ef(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    name: builtins.str,
    storage_virtual_machine_id: builtins.str,
    aggregate_configuration: typing.Optional[typing.Union[FsxOntapVolumeAggregateConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    bypass_snaplock_enterprise_retention: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    copy_tags_to_backups: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    final_backup_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    id: typing.Optional[builtins.str] = None,
    junction_path: typing.Optional[builtins.str] = None,
    ontap_volume_type: typing.Optional[builtins.str] = None,
    security_style: typing.Optional[builtins.str] = None,
    size_in_bytes: typing.Optional[builtins.str] = None,
    size_in_megabytes: typing.Optional[jsii.Number] = None,
    skip_final_backup: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    snaplock_configuration: typing.Optional[typing.Union[FsxOntapVolumeSnaplockConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    snapshot_policy: typing.Optional[builtins.str] = None,
    storage_efficiency_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tiering_policy: typing.Optional[typing.Union[FsxOntapVolumeTieringPolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    timeouts: typing.Optional[typing.Union[FsxOntapVolumeTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    volume_style: typing.Optional[builtins.str] = None,
    volume_type: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__8476e0cc9865b0d35b571756849109f26a888b9382bb80f41609671ed1b6f18f(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81a83ffafb9ffce4ad52ccb1a0b288b8cbb3e6bbf277ceeaa82fe3cf073d228d(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__caaa448cfb0cd65cb45a78ab15c16e1ca8188157bd0f56be8a0d2f79ddaf62c4(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb0e375f83e2cd997945270d65caf1f28a4403e5d8ae15a2b811ca30dac2ca21(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__241b617cc81a7cede4fcd938a177ec53c85e7f502fe9f02ea196a03f9201642f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8fddbb99fdc6994b19ee78cc563ea77d7645d03ead70b14db7d416abbbc4e8ce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a4605d399bd07a9efb206619fbdb172e188d812e94bc9b7188cfc2ca6394f1f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24dd2e4f67480d5b27699351aecff5a6541332917145c949a2bd3a900ef095e6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0481e9037455c2933e1485286cdae12cebb2b99ef0311174d342c144974bba87(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__905247ac8e89f5509f3d65a808565e21f365faf09346aae084ac6bb7091f74ae(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d009b943511cd90356dc4daac68e1b878fc34f7f0f39bcfbd570e5a074244b5(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__448030875b4d369ed4d8e85897c6080d28d0cacbcd107373b0bfae45351c1053(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d90ca5aa906a58f69cc14aab513100f66a9aa4b3d37e870d0016eea7d7b3caa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f8070d970dc2e2e74f255b7be88dcc553b48dbc3cf52f46338706ff11db125c(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__441ec1bdd41bbdc9de8497ee33aa4f6440286b49a45f2c1154961b2a07ba3f27(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d33ee0380fe93716f24b6104c88889f2c9958008517d294c59d7f538477bd2a8(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98307e8f951381aebc858783ff6f0029e72f6c1cecdbb00f5bd212b895bee345(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__03ab6b69a6c03a7d884fd02b48f92f51887b4e9ec9326b350925005121b7322a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e939db08cfe8b39f36742b08c8d9b098b3e0a3c87de66ca15a9edc370ee167eb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__095716c3cf068e4e86a126faefddb00d054a81d270a118d0a9ccc1c2d3b8f727(
    *,
    aggregates: typing.Optional[typing.Sequence[builtins.str]] = None,
    constituents_per_aggregate: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ddc094678a82d9a1fe727a6735947084bd4c1d946e95b03bdebbe04a6eba853(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2693ccb9be519c2fa3f44318b22ba01fc1d0f460780223797c692d1d8f3a4b6b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__955e64b0e3ba76517e043d43fe9a81428485ae9935bcd542982763fcce40e5bf(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e351b7a993268e9db03da2f779d3bc24d1dff5282ccdc5869a6138be1c006f7(
    value: typing.Optional[FsxOntapVolumeAggregateConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82dd488f38417c7df4f94af991afebeecf316454e648f17828470b6720257a49(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    name: builtins.str,
    storage_virtual_machine_id: builtins.str,
    aggregate_configuration: typing.Optional[typing.Union[FsxOntapVolumeAggregateConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    bypass_snaplock_enterprise_retention: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    copy_tags_to_backups: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    final_backup_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    id: typing.Optional[builtins.str] = None,
    junction_path: typing.Optional[builtins.str] = None,
    ontap_volume_type: typing.Optional[builtins.str] = None,
    security_style: typing.Optional[builtins.str] = None,
    size_in_bytes: typing.Optional[builtins.str] = None,
    size_in_megabytes: typing.Optional[jsii.Number] = None,
    skip_final_backup: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    snaplock_configuration: typing.Optional[typing.Union[FsxOntapVolumeSnaplockConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    snapshot_policy: typing.Optional[builtins.str] = None,
    storage_efficiency_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tiering_policy: typing.Optional[typing.Union[FsxOntapVolumeTieringPolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    timeouts: typing.Optional[typing.Union[FsxOntapVolumeTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    volume_style: typing.Optional[builtins.str] = None,
    volume_type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c9a6ad625abc6d3fdcff61d8665ff9009ce66ec444b18912ef7f7d7528e3b46(
    *,
    snaplock_type: builtins.str,
    audit_log_volume: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    autocommit_period: typing.Optional[typing.Union[FsxOntapVolumeSnaplockConfigurationAutocommitPeriod, typing.Dict[builtins.str, typing.Any]]] = None,
    privileged_delete: typing.Optional[builtins.str] = None,
    retention_period: typing.Optional[typing.Union[FsxOntapVolumeSnaplockConfigurationRetentionPeriod, typing.Dict[builtins.str, typing.Any]]] = None,
    volume_append_mode_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83d732bcc45678df96d2ef1983b86e1ef18fa4bd1517ef3d832851671084f9de(
    *,
    type: typing.Optional[builtins.str] = None,
    value: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08e75c113d281f3b3fdcd69c830f7c177f155d44f12532bedccc0fda4f707731(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0ec0d5813e72d2c839dd01cadadf06ff285ecd9bf50c5af8e152f37ba007ec8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d537218a084dda8796f3ee39acd3ff36423eca096007b4d52194590b1eab80e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e78db8366c6f2c0336dfca5af1f72961b09d74030db92d4f98374c0b1240278(
    value: typing.Optional[FsxOntapVolumeSnaplockConfigurationAutocommitPeriod],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e196c382c788245edcd578702477270553f367e04eacc54ce7546569c620dc2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__320e4b1dcce0e9d669d43281bb1e8f514da387f8385e8063fd4c56743fd3dc6c(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7eaab8f558282fd674698463f7ce014a864a197c788cc8922437aeb9c3b76333(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43a8815395bd87b392cdcafae0bd55cf9e751606042ea3e48dbed9c17a7c46b6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc5ec7761d3ffa6faebb6bd14f3f5c952396c918e17ea79380ea2501db050ed5(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4deb5450b5e00cace14cadedde0074ab56bb608588a935a0ee9cab4bb8661c75(
    value: typing.Optional[FsxOntapVolumeSnaplockConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0115019c90759e713476000fd1c9630536dc0645d0724b7870d1c2a2dc999bb1(
    *,
    default_retention: typing.Optional[typing.Union[FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention, typing.Dict[builtins.str, typing.Any]]] = None,
    maximum_retention: typing.Optional[typing.Union[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention, typing.Dict[builtins.str, typing.Any]]] = None,
    minimum_retention: typing.Optional[typing.Union[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebb0c4a5ffd4fa92d292273e0af4b0f279a0427519f3e29ea541da5064d8960a(
    *,
    type: typing.Optional[builtins.str] = None,
    value: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7bdcf411f7cdd4f43348a74d663e54dda4f4fe97ec10e1f8a0413621e3367500(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c1ba52da90160a03612378c2fe95e0ca8fed02f9db9e3f491b597c14d94c4ad(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30007effa5dbd81208586fe41fcfa78415549b2b195dc0f2b49a7ae5401268d7(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e34be275bb50f4b049a130a0351eb9b14dbc1766692cee08cae57222ea241110(
    value: typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f4c73f9afd0cfebe00231d4e6aff6b9db03644c3edb428e55d1e972215de9b1(
    *,
    type: typing.Optional[builtins.str] = None,
    value: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afc7e96c607dc6c118766d28b0265f8e82d8fe53c54a024158bb8a4d8cf44878(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b96a9670b63919981d8d09185e029fcdaa54796b03f854b7a8142bcbbec4b4e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5addf340e6a2ed794c9e207142f92225d82ccfc565901520e6a73e9c187fbac(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf17aea73fea0fb1bf7aba9f17d021e90b3af3e54ad09ce8d010f2210eddc0bf(
    value: typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f00552fe8b55ed9202f2776f5f057b844352c8f15324d8a32bd42f4322387aa(
    *,
    type: typing.Optional[builtins.str] = None,
    value: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0719e6c8805c5c0e47e953ca06cd7d08d91d9f211d1b39b162819da5483a45a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6bf30243a967a0ee5e5650361f44acf16b76cf93117d9ec07bf09570f7250a8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8cc796b30abc9b0b078718d447ff705c53af610fb1ef64c2b5f17d7fb43d9513(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afe7b39f8811b103c6a113bb401c422f47aa9d17b93971c61417ca0261bfa0f1(
    value: typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__50496a2ba03d5c3fb8254f37851512b0bffb012731686a5087654039038bda95(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6fb66a220b287c685409f99454adcdc5e7f7fd95829197987994c8b9d2d71d5(
    value: typing.Optional[FsxOntapVolumeSnaplockConfigurationRetentionPeriod],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc715271d7a91388e6d126afd3cd5bd54009a46e1c84db0c1601867993daaffa(
    *,
    cooling_period: typing.Optional[jsii.Number] = None,
    name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4573f78cee0d639c7176dd39421cb839cd2389be3a3452fbf19ec62610748e5b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21875b517b4a7d8ac00afbb843a73469211788b10078494a2843ae8329878407(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8a49f3f01e8414a76e712f73a14189686dfebe60e80024b4ce78a299bb7b04e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9541d6e93bb0d6a9169617eb5cfa88c7f20f248b2df3615ba37ae2e16a204ab1(
    value: typing.Optional[FsxOntapVolumeTieringPolicy],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1dc2824bbb3cf639d0b17f2af1e0fc0a86aa7c3676e13866335c62f3c2caade(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7db11fd04bebfb3b97fc09ad2268de5432b4db9d2d6d0a65cf142a07f5b15cd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__89eaf1c686d1f1d7e67342f51d377135c51b62822b65bf22dae8c8f67b9e2a3b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3774d5fde9c9d4223bd1b720c1f0f4b609d0a58f8901d9ce4c5d23a1b2b5abd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21214ea51dded6a6d1c8ec697d19bf46e60693e65db4ad63cf777db2dd63f8bc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a72595afefce65d5ebcb6128894785b8ecb524e0fdb0b48793b56555fb47d604(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FsxOntapVolumeTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
