r'''
# `aws_fsx_lustre_file_system`

Refer to the Terraform Registry for docs: [`aws_fsx_lustre_file_system`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system).
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


class FsxLustreFileSystem(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystem",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system aws_fsx_lustre_file_system}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        subnet_ids: typing.Sequence[builtins.str],
        auto_import_policy: typing.Optional[builtins.str] = None,
        automatic_backup_retention_days: typing.Optional[jsii.Number] = None,
        backup_id: typing.Optional[builtins.str] = None,
        copy_tags_to_backups: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        daily_automatic_backup_start_time: typing.Optional[builtins.str] = None,
        data_compression_type: typing.Optional[builtins.str] = None,
        data_read_cache_configuration: typing.Optional[typing.Union["FsxLustreFileSystemDataReadCacheConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        deployment_type: typing.Optional[builtins.str] = None,
        drive_cache_type: typing.Optional[builtins.str] = None,
        efa_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        export_path: typing.Optional[builtins.str] = None,
        file_system_type_version: typing.Optional[builtins.str] = None,
        final_backup_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        id: typing.Optional[builtins.str] = None,
        imported_file_chunk_size: typing.Optional[jsii.Number] = None,
        import_path: typing.Optional[builtins.str] = None,
        kms_key_id: typing.Optional[builtins.str] = None,
        log_configuration: typing.Optional[typing.Union["FsxLustreFileSystemLogConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        metadata_configuration: typing.Optional[typing.Union["FsxLustreFileSystemMetadataConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        per_unit_storage_throughput: typing.Optional[jsii.Number] = None,
        root_squash_configuration: typing.Optional[typing.Union["FsxLustreFileSystemRootSquashConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        security_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        skip_final_backup: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        storage_capacity: typing.Optional[jsii.Number] = None,
        storage_type: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        throughput_capacity: typing.Optional[jsii.Number] = None,
        timeouts: typing.Optional[typing.Union["FsxLustreFileSystemTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        weekly_maintenance_start_time: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system aws_fsx_lustre_file_system} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#subnet_ids FsxLustreFileSystem#subnet_ids}.
        :param auto_import_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#auto_import_policy FsxLustreFileSystem#auto_import_policy}.
        :param automatic_backup_retention_days: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#automatic_backup_retention_days FsxLustreFileSystem#automatic_backup_retention_days}.
        :param backup_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#backup_id FsxLustreFileSystem#backup_id}.
        :param copy_tags_to_backups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#copy_tags_to_backups FsxLustreFileSystem#copy_tags_to_backups}.
        :param daily_automatic_backup_start_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#daily_automatic_backup_start_time FsxLustreFileSystem#daily_automatic_backup_start_time}.
        :param data_compression_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_compression_type FsxLustreFileSystem#data_compression_type}.
        :param data_read_cache_configuration: data_read_cache_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_read_cache_configuration FsxLustreFileSystem#data_read_cache_configuration}
        :param deployment_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#deployment_type FsxLustreFileSystem#deployment_type}.
        :param drive_cache_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#drive_cache_type FsxLustreFileSystem#drive_cache_type}.
        :param efa_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#efa_enabled FsxLustreFileSystem#efa_enabled}.
        :param export_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#export_path FsxLustreFileSystem#export_path}.
        :param file_system_type_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#file_system_type_version FsxLustreFileSystem#file_system_type_version}.
        :param final_backup_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#final_backup_tags FsxLustreFileSystem#final_backup_tags}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#id FsxLustreFileSystem#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param imported_file_chunk_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#imported_file_chunk_size FsxLustreFileSystem#imported_file_chunk_size}.
        :param import_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#import_path FsxLustreFileSystem#import_path}.
        :param kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#kms_key_id FsxLustreFileSystem#kms_key_id}.
        :param log_configuration: log_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#log_configuration FsxLustreFileSystem#log_configuration}
        :param metadata_configuration: metadata_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#metadata_configuration FsxLustreFileSystem#metadata_configuration}
        :param per_unit_storage_throughput: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#per_unit_storage_throughput FsxLustreFileSystem#per_unit_storage_throughput}.
        :param root_squash_configuration: root_squash_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash_configuration FsxLustreFileSystem#root_squash_configuration}
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#security_group_ids FsxLustreFileSystem#security_group_ids}.
        :param skip_final_backup: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#skip_final_backup FsxLustreFileSystem#skip_final_backup}.
        :param storage_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_capacity FsxLustreFileSystem#storage_capacity}.
        :param storage_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_type FsxLustreFileSystem#storage_type}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags FsxLustreFileSystem#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags_all FsxLustreFileSystem#tags_all}.
        :param throughput_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#throughput_capacity FsxLustreFileSystem#throughput_capacity}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#timeouts FsxLustreFileSystem#timeouts}
        :param weekly_maintenance_start_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#weekly_maintenance_start_time FsxLustreFileSystem#weekly_maintenance_start_time}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f810c5c77b89a3b802a4770ca2ec4571e39913a3c5ad04a1e8a937383efe3d18)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = FsxLustreFileSystemConfig(
            subnet_ids=subnet_ids,
            auto_import_policy=auto_import_policy,
            automatic_backup_retention_days=automatic_backup_retention_days,
            backup_id=backup_id,
            copy_tags_to_backups=copy_tags_to_backups,
            daily_automatic_backup_start_time=daily_automatic_backup_start_time,
            data_compression_type=data_compression_type,
            data_read_cache_configuration=data_read_cache_configuration,
            deployment_type=deployment_type,
            drive_cache_type=drive_cache_type,
            efa_enabled=efa_enabled,
            export_path=export_path,
            file_system_type_version=file_system_type_version,
            final_backup_tags=final_backup_tags,
            id=id,
            imported_file_chunk_size=imported_file_chunk_size,
            import_path=import_path,
            kms_key_id=kms_key_id,
            log_configuration=log_configuration,
            metadata_configuration=metadata_configuration,
            per_unit_storage_throughput=per_unit_storage_throughput,
            root_squash_configuration=root_squash_configuration,
            security_group_ids=security_group_ids,
            skip_final_backup=skip_final_backup,
            storage_capacity=storage_capacity,
            storage_type=storage_type,
            tags=tags,
            tags_all=tags_all,
            throughput_capacity=throughput_capacity,
            timeouts=timeouts,
            weekly_maintenance_start_time=weekly_maintenance_start_time,
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
        '''Generates CDKTF code for importing a FsxLustreFileSystem resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the FsxLustreFileSystem to import.
        :param import_from_id: The id of the existing FsxLustreFileSystem that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the FsxLustreFileSystem to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ce995187313efd82e42ced39777dc0a52450d21ccaae8bccb61bf5c34511d26)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putDataReadCacheConfiguration")
    def put_data_read_cache_configuration(
        self,
        *,
        sizing_mode: builtins.str,
        size: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param sizing_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#sizing_mode FsxLustreFileSystem#sizing_mode}.
        :param size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#size FsxLustreFileSystem#size}.
        '''
        value = FsxLustreFileSystemDataReadCacheConfiguration(
            sizing_mode=sizing_mode, size=size
        )

        return typing.cast(None, jsii.invoke(self, "putDataReadCacheConfiguration", [value]))

    @jsii.member(jsii_name="putLogConfiguration")
    def put_log_configuration(
        self,
        *,
        destination: typing.Optional[builtins.str] = None,
        level: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param destination: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#destination FsxLustreFileSystem#destination}.
        :param level: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#level FsxLustreFileSystem#level}.
        '''
        value = FsxLustreFileSystemLogConfiguration(
            destination=destination, level=level
        )

        return typing.cast(None, jsii.invoke(self, "putLogConfiguration", [value]))

    @jsii.member(jsii_name="putMetadataConfiguration")
    def put_metadata_configuration(
        self,
        *,
        iops: typing.Optional[jsii.Number] = None,
        mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param iops: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#iops FsxLustreFileSystem#iops}.
        :param mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#mode FsxLustreFileSystem#mode}.
        '''
        value = FsxLustreFileSystemMetadataConfiguration(iops=iops, mode=mode)

        return typing.cast(None, jsii.invoke(self, "putMetadataConfiguration", [value]))

    @jsii.member(jsii_name="putRootSquashConfiguration")
    def put_root_squash_configuration(
        self,
        *,
        no_squash_nids: typing.Optional[typing.Sequence[builtins.str]] = None,
        root_squash: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param no_squash_nids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#no_squash_nids FsxLustreFileSystem#no_squash_nids}.
        :param root_squash: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash FsxLustreFileSystem#root_squash}.
        '''
        value = FsxLustreFileSystemRootSquashConfiguration(
            no_squash_nids=no_squash_nids, root_squash=root_squash
        )

        return typing.cast(None, jsii.invoke(self, "putRootSquashConfiguration", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#create FsxLustreFileSystem#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#delete FsxLustreFileSystem#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#update FsxLustreFileSystem#update}.
        '''
        value = FsxLustreFileSystemTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetAutoImportPolicy")
    def reset_auto_import_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAutoImportPolicy", []))

    @jsii.member(jsii_name="resetAutomaticBackupRetentionDays")
    def reset_automatic_backup_retention_days(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAutomaticBackupRetentionDays", []))

    @jsii.member(jsii_name="resetBackupId")
    def reset_backup_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBackupId", []))

    @jsii.member(jsii_name="resetCopyTagsToBackups")
    def reset_copy_tags_to_backups(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCopyTagsToBackups", []))

    @jsii.member(jsii_name="resetDailyAutomaticBackupStartTime")
    def reset_daily_automatic_backup_start_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDailyAutomaticBackupStartTime", []))

    @jsii.member(jsii_name="resetDataCompressionType")
    def reset_data_compression_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataCompressionType", []))

    @jsii.member(jsii_name="resetDataReadCacheConfiguration")
    def reset_data_read_cache_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataReadCacheConfiguration", []))

    @jsii.member(jsii_name="resetDeploymentType")
    def reset_deployment_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeploymentType", []))

    @jsii.member(jsii_name="resetDriveCacheType")
    def reset_drive_cache_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDriveCacheType", []))

    @jsii.member(jsii_name="resetEfaEnabled")
    def reset_efa_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEfaEnabled", []))

    @jsii.member(jsii_name="resetExportPath")
    def reset_export_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExportPath", []))

    @jsii.member(jsii_name="resetFileSystemTypeVersion")
    def reset_file_system_type_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFileSystemTypeVersion", []))

    @jsii.member(jsii_name="resetFinalBackupTags")
    def reset_final_backup_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFinalBackupTags", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetImportedFileChunkSize")
    def reset_imported_file_chunk_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImportedFileChunkSize", []))

    @jsii.member(jsii_name="resetImportPath")
    def reset_import_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImportPath", []))

    @jsii.member(jsii_name="resetKmsKeyId")
    def reset_kms_key_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKmsKeyId", []))

    @jsii.member(jsii_name="resetLogConfiguration")
    def reset_log_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLogConfiguration", []))

    @jsii.member(jsii_name="resetMetadataConfiguration")
    def reset_metadata_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMetadataConfiguration", []))

    @jsii.member(jsii_name="resetPerUnitStorageThroughput")
    def reset_per_unit_storage_throughput(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPerUnitStorageThroughput", []))

    @jsii.member(jsii_name="resetRootSquashConfiguration")
    def reset_root_squash_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRootSquashConfiguration", []))

    @jsii.member(jsii_name="resetSecurityGroupIds")
    def reset_security_group_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityGroupIds", []))

    @jsii.member(jsii_name="resetSkipFinalBackup")
    def reset_skip_final_backup(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSkipFinalBackup", []))

    @jsii.member(jsii_name="resetStorageCapacity")
    def reset_storage_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStorageCapacity", []))

    @jsii.member(jsii_name="resetStorageType")
    def reset_storage_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStorageType", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetThroughputCapacity")
    def reset_throughput_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetThroughputCapacity", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

    @jsii.member(jsii_name="resetWeeklyMaintenanceStartTime")
    def reset_weekly_maintenance_start_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWeeklyMaintenanceStartTime", []))

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
    @jsii.member(jsii_name="dataReadCacheConfiguration")
    def data_read_cache_configuration(
        self,
    ) -> "FsxLustreFileSystemDataReadCacheConfigurationOutputReference":
        return typing.cast("FsxLustreFileSystemDataReadCacheConfigurationOutputReference", jsii.get(self, "dataReadCacheConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="dnsName")
    def dns_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dnsName"))

    @builtins.property
    @jsii.member(jsii_name="logConfiguration")
    def log_configuration(self) -> "FsxLustreFileSystemLogConfigurationOutputReference":
        return typing.cast("FsxLustreFileSystemLogConfigurationOutputReference", jsii.get(self, "logConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="metadataConfiguration")
    def metadata_configuration(
        self,
    ) -> "FsxLustreFileSystemMetadataConfigurationOutputReference":
        return typing.cast("FsxLustreFileSystemMetadataConfigurationOutputReference", jsii.get(self, "metadataConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="mountName")
    def mount_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mountName"))

    @builtins.property
    @jsii.member(jsii_name="networkInterfaceIds")
    def network_interface_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "networkInterfaceIds"))

    @builtins.property
    @jsii.member(jsii_name="ownerId")
    def owner_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ownerId"))

    @builtins.property
    @jsii.member(jsii_name="rootSquashConfiguration")
    def root_squash_configuration(
        self,
    ) -> "FsxLustreFileSystemRootSquashConfigurationOutputReference":
        return typing.cast("FsxLustreFileSystemRootSquashConfigurationOutputReference", jsii.get(self, "rootSquashConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "FsxLustreFileSystemTimeoutsOutputReference":
        return typing.cast("FsxLustreFileSystemTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="vpcId")
    def vpc_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vpcId"))

    @builtins.property
    @jsii.member(jsii_name="autoImportPolicyInput")
    def auto_import_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "autoImportPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="automaticBackupRetentionDaysInput")
    def automatic_backup_retention_days_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "automaticBackupRetentionDaysInput"))

    @builtins.property
    @jsii.member(jsii_name="backupIdInput")
    def backup_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "backupIdInput"))

    @builtins.property
    @jsii.member(jsii_name="copyTagsToBackupsInput")
    def copy_tags_to_backups_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "copyTagsToBackupsInput"))

    @builtins.property
    @jsii.member(jsii_name="dailyAutomaticBackupStartTimeInput")
    def daily_automatic_backup_start_time_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dailyAutomaticBackupStartTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="dataCompressionTypeInput")
    def data_compression_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataCompressionTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="dataReadCacheConfigurationInput")
    def data_read_cache_configuration_input(
        self,
    ) -> typing.Optional["FsxLustreFileSystemDataReadCacheConfiguration"]:
        return typing.cast(typing.Optional["FsxLustreFileSystemDataReadCacheConfiguration"], jsii.get(self, "dataReadCacheConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="deploymentTypeInput")
    def deployment_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deploymentTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="driveCacheTypeInput")
    def drive_cache_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "driveCacheTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="efaEnabledInput")
    def efa_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "efaEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="exportPathInput")
    def export_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exportPathInput"))

    @builtins.property
    @jsii.member(jsii_name="fileSystemTypeVersionInput")
    def file_system_type_version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "fileSystemTypeVersionInput"))

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
    @jsii.member(jsii_name="importedFileChunkSizeInput")
    def imported_file_chunk_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "importedFileChunkSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="importPathInput")
    def import_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "importPathInput"))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyIdInput")
    def kms_key_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "kmsKeyIdInput"))

    @builtins.property
    @jsii.member(jsii_name="logConfigurationInput")
    def log_configuration_input(
        self,
    ) -> typing.Optional["FsxLustreFileSystemLogConfiguration"]:
        return typing.cast(typing.Optional["FsxLustreFileSystemLogConfiguration"], jsii.get(self, "logConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="metadataConfigurationInput")
    def metadata_configuration_input(
        self,
    ) -> typing.Optional["FsxLustreFileSystemMetadataConfiguration"]:
        return typing.cast(typing.Optional["FsxLustreFileSystemMetadataConfiguration"], jsii.get(self, "metadataConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="perUnitStorageThroughputInput")
    def per_unit_storage_throughput_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "perUnitStorageThroughputInput"))

    @builtins.property
    @jsii.member(jsii_name="rootSquashConfigurationInput")
    def root_squash_configuration_input(
        self,
    ) -> typing.Optional["FsxLustreFileSystemRootSquashConfiguration"]:
        return typing.cast(typing.Optional["FsxLustreFileSystemRootSquashConfiguration"], jsii.get(self, "rootSquashConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroupIdsInput")
    def security_group_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="skipFinalBackupInput")
    def skip_final_backup_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "skipFinalBackupInput"))

    @builtins.property
    @jsii.member(jsii_name="storageCapacityInput")
    def storage_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "storageCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="storageTypeInput")
    def storage_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "storageTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetIdsInput")
    def subnet_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetIdsInput"))

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
    @jsii.member(jsii_name="throughputCapacityInput")
    def throughput_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "throughputCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "FsxLustreFileSystemTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "FsxLustreFileSystemTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="weeklyMaintenanceStartTimeInput")
    def weekly_maintenance_start_time_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "weeklyMaintenanceStartTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="autoImportPolicy")
    def auto_import_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "autoImportPolicy"))

    @auto_import_policy.setter
    def auto_import_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed7890f6ed6b6bd0bd818d775a63c9c1692bee3acd9cace32da61aaa2a0792a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "autoImportPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="automaticBackupRetentionDays")
    def automatic_backup_retention_days(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "automaticBackupRetentionDays"))

    @automatic_backup_retention_days.setter
    def automatic_backup_retention_days(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4bfff8c44463d5949287c9a9ce849b3bbdd8868fb1768c911beb64dec8b204c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "automaticBackupRetentionDays", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="backupId")
    def backup_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "backupId"))

    @backup_id.setter
    def backup_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__635b861184414f5a55b04bcefb005c9951c3a2498bb9e077f99ee3582cc35711)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "backupId", value) # pyright: ignore[reportArgumentType]

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
            type_hints = typing.get_type_hints(_typecheckingstub__17957cd9df8ec9eea6ff1fb0d20a3400f00b618a99c63285bfec765be7734e11)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "copyTagsToBackups", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dailyAutomaticBackupStartTime")
    def daily_automatic_backup_start_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dailyAutomaticBackupStartTime"))

    @daily_automatic_backup_start_time.setter
    def daily_automatic_backup_start_time(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb72c6a1f165cd6760641b4f7182a8023fcd93c364dfbd1b0dffb2d05ae0a444)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dailyAutomaticBackupStartTime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dataCompressionType")
    def data_compression_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataCompressionType"))

    @data_compression_type.setter
    def data_compression_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__60d3b6fb9786d53b6b3d3be82b29f539ec2b8085cef56959dcb43eee87d10f87)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataCompressionType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deploymentType")
    def deployment_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deploymentType"))

    @deployment_type.setter
    def deployment_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d949235e833854ee1748ac711bc827a8a146db676764f361624ddb7d1533afa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deploymentType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="driveCacheType")
    def drive_cache_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "driveCacheType"))

    @drive_cache_type.setter
    def drive_cache_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76e54fb00877faa1c099aea26dacc185efc7edaaff6968db14702a44e7f5d8c7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "driveCacheType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="efaEnabled")
    def efa_enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "efaEnabled"))

    @efa_enabled.setter
    def efa_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2e3625723298f2afcb9e06e2a6e936bf9a83ea0fea0ee849d261bc2d7e62b79)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "efaEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="exportPath")
    def export_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exportPath"))

    @export_path.setter
    def export_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__77c5718d3c52f1c5b950fc688d0759f936545ef9ac289ab0ae903e8e0934dfce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exportPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fileSystemTypeVersion")
    def file_system_type_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fileSystemTypeVersion"))

    @file_system_type_version.setter
    def file_system_type_version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1335f394b2c45b6fd1b0daa6dfc7eca053dbd357dbd857f64295f1f5c86f697)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fileSystemTypeVersion", value) # pyright: ignore[reportArgumentType]

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
            type_hints = typing.get_type_hints(_typecheckingstub__11a9a4f3a572268f3ecb036fe9615448fc3ee10f85c1cc8e99b7a12ed44c7700)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "finalBackupTags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2b206333fe5f61a9c19fca36f52aa10a04dde0c4af87eb42b27f7203f33e5631)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="importedFileChunkSize")
    def imported_file_chunk_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "importedFileChunkSize"))

    @imported_file_chunk_size.setter
    def imported_file_chunk_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44698222de399255ec5bf07b80b8ecbeffb99399c2d57015cfc37a5e1aa6768a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "importedFileChunkSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="importPath")
    def import_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "importPath"))

    @import_path.setter
    def import_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0eac17250cf31b5dfaa8ece2b361cee45313a09085b2a7d49b5ba237591121cd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "importPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="kmsKeyId")
    def kms_key_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "kmsKeyId"))

    @kms_key_id.setter
    def kms_key_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__773f453d7a5c9b5f1a7b5fcb69f2c2748f0a04eec4197912a48a7125bbe5638f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "kmsKeyId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="perUnitStorageThroughput")
    def per_unit_storage_throughput(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "perUnitStorageThroughput"))

    @per_unit_storage_throughput.setter
    def per_unit_storage_throughput(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__945e08cd8cd956f46642cfe8f90933605bbb67f57d58561b90bd664ef0af6e76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "perUnitStorageThroughput", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityGroupIds")
    def security_group_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroupIds"))

    @security_group_ids.setter
    def security_group_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3ba6ef7f12398819a490f8372ebe001e22d7ae84f8c41e25f43c5161b8b90e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroupIds", value) # pyright: ignore[reportArgumentType]

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
            type_hints = typing.get_type_hints(_typecheckingstub__61bb2b3fdf0dea0beef455521bb43b8dbdbc18bbe742c0bd9c8224f5e54c7dbf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "skipFinalBackup", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="storageCapacity")
    def storage_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "storageCapacity"))

    @storage_capacity.setter
    def storage_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9a1cb2b38c89f52f7d1aeb1a0b27a40065c4383b1ca951a1d9a91e3f1789393)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "storageCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="storageType")
    def storage_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "storageType"))

    @storage_type.setter
    def storage_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__594f3d15da7c1d8344472fc6fbf769636c168bc13a9514260d31b3f1024ade5c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "storageType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnetIds")
    def subnet_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnetIds"))

    @subnet_ids.setter
    def subnet_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__26c1d68086bb1672a4e9495f78fb7aea7257b0651e50e73a9de2108f9db4aa83)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnetIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f84c4be7a62967282ce5cf72db2061e83b30a2dc8745d2ecaa2e48a3a9f56e21)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e37cba100a5dd2e1b66ba3be26bc3192269c781aaeb7cad1288eec99f6451171)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="throughputCapacity")
    def throughput_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "throughputCapacity"))

    @throughput_capacity.setter
    def throughput_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3250e45e9c2c6b91fdbd337cd6b65041979378ee246278c678bffb177c6be0aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "throughputCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="weeklyMaintenanceStartTime")
    def weekly_maintenance_start_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "weeklyMaintenanceStartTime"))

    @weekly_maintenance_start_time.setter
    def weekly_maintenance_start_time(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af2d30a6362150b39580932f29dd25fa24c3af2149c1e66bc86bc5c0cf83b635)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "weeklyMaintenanceStartTime", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "subnet_ids": "subnetIds",
        "auto_import_policy": "autoImportPolicy",
        "automatic_backup_retention_days": "automaticBackupRetentionDays",
        "backup_id": "backupId",
        "copy_tags_to_backups": "copyTagsToBackups",
        "daily_automatic_backup_start_time": "dailyAutomaticBackupStartTime",
        "data_compression_type": "dataCompressionType",
        "data_read_cache_configuration": "dataReadCacheConfiguration",
        "deployment_type": "deploymentType",
        "drive_cache_type": "driveCacheType",
        "efa_enabled": "efaEnabled",
        "export_path": "exportPath",
        "file_system_type_version": "fileSystemTypeVersion",
        "final_backup_tags": "finalBackupTags",
        "id": "id",
        "imported_file_chunk_size": "importedFileChunkSize",
        "import_path": "importPath",
        "kms_key_id": "kmsKeyId",
        "log_configuration": "logConfiguration",
        "metadata_configuration": "metadataConfiguration",
        "per_unit_storage_throughput": "perUnitStorageThroughput",
        "root_squash_configuration": "rootSquashConfiguration",
        "security_group_ids": "securityGroupIds",
        "skip_final_backup": "skipFinalBackup",
        "storage_capacity": "storageCapacity",
        "storage_type": "storageType",
        "tags": "tags",
        "tags_all": "tagsAll",
        "throughput_capacity": "throughputCapacity",
        "timeouts": "timeouts",
        "weekly_maintenance_start_time": "weeklyMaintenanceStartTime",
    },
)
class FsxLustreFileSystemConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        subnet_ids: typing.Sequence[builtins.str],
        auto_import_policy: typing.Optional[builtins.str] = None,
        automatic_backup_retention_days: typing.Optional[jsii.Number] = None,
        backup_id: typing.Optional[builtins.str] = None,
        copy_tags_to_backups: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        daily_automatic_backup_start_time: typing.Optional[builtins.str] = None,
        data_compression_type: typing.Optional[builtins.str] = None,
        data_read_cache_configuration: typing.Optional[typing.Union["FsxLustreFileSystemDataReadCacheConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        deployment_type: typing.Optional[builtins.str] = None,
        drive_cache_type: typing.Optional[builtins.str] = None,
        efa_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        export_path: typing.Optional[builtins.str] = None,
        file_system_type_version: typing.Optional[builtins.str] = None,
        final_backup_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        id: typing.Optional[builtins.str] = None,
        imported_file_chunk_size: typing.Optional[jsii.Number] = None,
        import_path: typing.Optional[builtins.str] = None,
        kms_key_id: typing.Optional[builtins.str] = None,
        log_configuration: typing.Optional[typing.Union["FsxLustreFileSystemLogConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        metadata_configuration: typing.Optional[typing.Union["FsxLustreFileSystemMetadataConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        per_unit_storage_throughput: typing.Optional[jsii.Number] = None,
        root_squash_configuration: typing.Optional[typing.Union["FsxLustreFileSystemRootSquashConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        security_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        skip_final_backup: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        storage_capacity: typing.Optional[jsii.Number] = None,
        storage_type: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        throughput_capacity: typing.Optional[jsii.Number] = None,
        timeouts: typing.Optional[typing.Union["FsxLustreFileSystemTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        weekly_maintenance_start_time: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#subnet_ids FsxLustreFileSystem#subnet_ids}.
        :param auto_import_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#auto_import_policy FsxLustreFileSystem#auto_import_policy}.
        :param automatic_backup_retention_days: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#automatic_backup_retention_days FsxLustreFileSystem#automatic_backup_retention_days}.
        :param backup_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#backup_id FsxLustreFileSystem#backup_id}.
        :param copy_tags_to_backups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#copy_tags_to_backups FsxLustreFileSystem#copy_tags_to_backups}.
        :param daily_automatic_backup_start_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#daily_automatic_backup_start_time FsxLustreFileSystem#daily_automatic_backup_start_time}.
        :param data_compression_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_compression_type FsxLustreFileSystem#data_compression_type}.
        :param data_read_cache_configuration: data_read_cache_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_read_cache_configuration FsxLustreFileSystem#data_read_cache_configuration}
        :param deployment_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#deployment_type FsxLustreFileSystem#deployment_type}.
        :param drive_cache_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#drive_cache_type FsxLustreFileSystem#drive_cache_type}.
        :param efa_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#efa_enabled FsxLustreFileSystem#efa_enabled}.
        :param export_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#export_path FsxLustreFileSystem#export_path}.
        :param file_system_type_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#file_system_type_version FsxLustreFileSystem#file_system_type_version}.
        :param final_backup_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#final_backup_tags FsxLustreFileSystem#final_backup_tags}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#id FsxLustreFileSystem#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param imported_file_chunk_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#imported_file_chunk_size FsxLustreFileSystem#imported_file_chunk_size}.
        :param import_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#import_path FsxLustreFileSystem#import_path}.
        :param kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#kms_key_id FsxLustreFileSystem#kms_key_id}.
        :param log_configuration: log_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#log_configuration FsxLustreFileSystem#log_configuration}
        :param metadata_configuration: metadata_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#metadata_configuration FsxLustreFileSystem#metadata_configuration}
        :param per_unit_storage_throughput: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#per_unit_storage_throughput FsxLustreFileSystem#per_unit_storage_throughput}.
        :param root_squash_configuration: root_squash_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash_configuration FsxLustreFileSystem#root_squash_configuration}
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#security_group_ids FsxLustreFileSystem#security_group_ids}.
        :param skip_final_backup: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#skip_final_backup FsxLustreFileSystem#skip_final_backup}.
        :param storage_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_capacity FsxLustreFileSystem#storage_capacity}.
        :param storage_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_type FsxLustreFileSystem#storage_type}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags FsxLustreFileSystem#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags_all FsxLustreFileSystem#tags_all}.
        :param throughput_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#throughput_capacity FsxLustreFileSystem#throughput_capacity}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#timeouts FsxLustreFileSystem#timeouts}
        :param weekly_maintenance_start_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#weekly_maintenance_start_time FsxLustreFileSystem#weekly_maintenance_start_time}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(data_read_cache_configuration, dict):
            data_read_cache_configuration = FsxLustreFileSystemDataReadCacheConfiguration(**data_read_cache_configuration)
        if isinstance(log_configuration, dict):
            log_configuration = FsxLustreFileSystemLogConfiguration(**log_configuration)
        if isinstance(metadata_configuration, dict):
            metadata_configuration = FsxLustreFileSystemMetadataConfiguration(**metadata_configuration)
        if isinstance(root_squash_configuration, dict):
            root_squash_configuration = FsxLustreFileSystemRootSquashConfiguration(**root_squash_configuration)
        if isinstance(timeouts, dict):
            timeouts = FsxLustreFileSystemTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__29d6fc9571afdc42d36c3d8b713be44e697f0344214fdb0fcbc7b77abfd4c4cc)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument subnet_ids", value=subnet_ids, expected_type=type_hints["subnet_ids"])
            check_type(argname="argument auto_import_policy", value=auto_import_policy, expected_type=type_hints["auto_import_policy"])
            check_type(argname="argument automatic_backup_retention_days", value=automatic_backup_retention_days, expected_type=type_hints["automatic_backup_retention_days"])
            check_type(argname="argument backup_id", value=backup_id, expected_type=type_hints["backup_id"])
            check_type(argname="argument copy_tags_to_backups", value=copy_tags_to_backups, expected_type=type_hints["copy_tags_to_backups"])
            check_type(argname="argument daily_automatic_backup_start_time", value=daily_automatic_backup_start_time, expected_type=type_hints["daily_automatic_backup_start_time"])
            check_type(argname="argument data_compression_type", value=data_compression_type, expected_type=type_hints["data_compression_type"])
            check_type(argname="argument data_read_cache_configuration", value=data_read_cache_configuration, expected_type=type_hints["data_read_cache_configuration"])
            check_type(argname="argument deployment_type", value=deployment_type, expected_type=type_hints["deployment_type"])
            check_type(argname="argument drive_cache_type", value=drive_cache_type, expected_type=type_hints["drive_cache_type"])
            check_type(argname="argument efa_enabled", value=efa_enabled, expected_type=type_hints["efa_enabled"])
            check_type(argname="argument export_path", value=export_path, expected_type=type_hints["export_path"])
            check_type(argname="argument file_system_type_version", value=file_system_type_version, expected_type=type_hints["file_system_type_version"])
            check_type(argname="argument final_backup_tags", value=final_backup_tags, expected_type=type_hints["final_backup_tags"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument imported_file_chunk_size", value=imported_file_chunk_size, expected_type=type_hints["imported_file_chunk_size"])
            check_type(argname="argument import_path", value=import_path, expected_type=type_hints["import_path"])
            check_type(argname="argument kms_key_id", value=kms_key_id, expected_type=type_hints["kms_key_id"])
            check_type(argname="argument log_configuration", value=log_configuration, expected_type=type_hints["log_configuration"])
            check_type(argname="argument metadata_configuration", value=metadata_configuration, expected_type=type_hints["metadata_configuration"])
            check_type(argname="argument per_unit_storage_throughput", value=per_unit_storage_throughput, expected_type=type_hints["per_unit_storage_throughput"])
            check_type(argname="argument root_squash_configuration", value=root_squash_configuration, expected_type=type_hints["root_squash_configuration"])
            check_type(argname="argument security_group_ids", value=security_group_ids, expected_type=type_hints["security_group_ids"])
            check_type(argname="argument skip_final_backup", value=skip_final_backup, expected_type=type_hints["skip_final_backup"])
            check_type(argname="argument storage_capacity", value=storage_capacity, expected_type=type_hints["storage_capacity"])
            check_type(argname="argument storage_type", value=storage_type, expected_type=type_hints["storage_type"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument throughput_capacity", value=throughput_capacity, expected_type=type_hints["throughput_capacity"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
            check_type(argname="argument weekly_maintenance_start_time", value=weekly_maintenance_start_time, expected_type=type_hints["weekly_maintenance_start_time"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "subnet_ids": subnet_ids,
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
        if auto_import_policy is not None:
            self._values["auto_import_policy"] = auto_import_policy
        if automatic_backup_retention_days is not None:
            self._values["automatic_backup_retention_days"] = automatic_backup_retention_days
        if backup_id is not None:
            self._values["backup_id"] = backup_id
        if copy_tags_to_backups is not None:
            self._values["copy_tags_to_backups"] = copy_tags_to_backups
        if daily_automatic_backup_start_time is not None:
            self._values["daily_automatic_backup_start_time"] = daily_automatic_backup_start_time
        if data_compression_type is not None:
            self._values["data_compression_type"] = data_compression_type
        if data_read_cache_configuration is not None:
            self._values["data_read_cache_configuration"] = data_read_cache_configuration
        if deployment_type is not None:
            self._values["deployment_type"] = deployment_type
        if drive_cache_type is not None:
            self._values["drive_cache_type"] = drive_cache_type
        if efa_enabled is not None:
            self._values["efa_enabled"] = efa_enabled
        if export_path is not None:
            self._values["export_path"] = export_path
        if file_system_type_version is not None:
            self._values["file_system_type_version"] = file_system_type_version
        if final_backup_tags is not None:
            self._values["final_backup_tags"] = final_backup_tags
        if id is not None:
            self._values["id"] = id
        if imported_file_chunk_size is not None:
            self._values["imported_file_chunk_size"] = imported_file_chunk_size
        if import_path is not None:
            self._values["import_path"] = import_path
        if kms_key_id is not None:
            self._values["kms_key_id"] = kms_key_id
        if log_configuration is not None:
            self._values["log_configuration"] = log_configuration
        if metadata_configuration is not None:
            self._values["metadata_configuration"] = metadata_configuration
        if per_unit_storage_throughput is not None:
            self._values["per_unit_storage_throughput"] = per_unit_storage_throughput
        if root_squash_configuration is not None:
            self._values["root_squash_configuration"] = root_squash_configuration
        if security_group_ids is not None:
            self._values["security_group_ids"] = security_group_ids
        if skip_final_backup is not None:
            self._values["skip_final_backup"] = skip_final_backup
        if storage_capacity is not None:
            self._values["storage_capacity"] = storage_capacity
        if storage_type is not None:
            self._values["storage_type"] = storage_type
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if throughput_capacity is not None:
            self._values["throughput_capacity"] = throughput_capacity
        if timeouts is not None:
            self._values["timeouts"] = timeouts
        if weekly_maintenance_start_time is not None:
            self._values["weekly_maintenance_start_time"] = weekly_maintenance_start_time

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
    def subnet_ids(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#subnet_ids FsxLustreFileSystem#subnet_ids}.'''
        result = self._values.get("subnet_ids")
        assert result is not None, "Required property 'subnet_ids' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def auto_import_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#auto_import_policy FsxLustreFileSystem#auto_import_policy}.'''
        result = self._values.get("auto_import_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def automatic_backup_retention_days(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#automatic_backup_retention_days FsxLustreFileSystem#automatic_backup_retention_days}.'''
        result = self._values.get("automatic_backup_retention_days")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def backup_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#backup_id FsxLustreFileSystem#backup_id}.'''
        result = self._values.get("backup_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def copy_tags_to_backups(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#copy_tags_to_backups FsxLustreFileSystem#copy_tags_to_backups}.'''
        result = self._values.get("copy_tags_to_backups")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def daily_automatic_backup_start_time(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#daily_automatic_backup_start_time FsxLustreFileSystem#daily_automatic_backup_start_time}.'''
        result = self._values.get("daily_automatic_backup_start_time")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def data_compression_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_compression_type FsxLustreFileSystem#data_compression_type}.'''
        result = self._values.get("data_compression_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def data_read_cache_configuration(
        self,
    ) -> typing.Optional["FsxLustreFileSystemDataReadCacheConfiguration"]:
        '''data_read_cache_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_read_cache_configuration FsxLustreFileSystem#data_read_cache_configuration}
        '''
        result = self._values.get("data_read_cache_configuration")
        return typing.cast(typing.Optional["FsxLustreFileSystemDataReadCacheConfiguration"], result)

    @builtins.property
    def deployment_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#deployment_type FsxLustreFileSystem#deployment_type}.'''
        result = self._values.get("deployment_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def drive_cache_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#drive_cache_type FsxLustreFileSystem#drive_cache_type}.'''
        result = self._values.get("drive_cache_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def efa_enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#efa_enabled FsxLustreFileSystem#efa_enabled}.'''
        result = self._values.get("efa_enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def export_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#export_path FsxLustreFileSystem#export_path}.'''
        result = self._values.get("export_path")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def file_system_type_version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#file_system_type_version FsxLustreFileSystem#file_system_type_version}.'''
        result = self._values.get("file_system_type_version")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def final_backup_tags(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#final_backup_tags FsxLustreFileSystem#final_backup_tags}.'''
        result = self._values.get("final_backup_tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#id FsxLustreFileSystem#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def imported_file_chunk_size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#imported_file_chunk_size FsxLustreFileSystem#imported_file_chunk_size}.'''
        result = self._values.get("imported_file_chunk_size")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def import_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#import_path FsxLustreFileSystem#import_path}.'''
        result = self._values.get("import_path")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def kms_key_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#kms_key_id FsxLustreFileSystem#kms_key_id}.'''
        result = self._values.get("kms_key_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def log_configuration(
        self,
    ) -> typing.Optional["FsxLustreFileSystemLogConfiguration"]:
        '''log_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#log_configuration FsxLustreFileSystem#log_configuration}
        '''
        result = self._values.get("log_configuration")
        return typing.cast(typing.Optional["FsxLustreFileSystemLogConfiguration"], result)

    @builtins.property
    def metadata_configuration(
        self,
    ) -> typing.Optional["FsxLustreFileSystemMetadataConfiguration"]:
        '''metadata_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#metadata_configuration FsxLustreFileSystem#metadata_configuration}
        '''
        result = self._values.get("metadata_configuration")
        return typing.cast(typing.Optional["FsxLustreFileSystemMetadataConfiguration"], result)

    @builtins.property
    def per_unit_storage_throughput(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#per_unit_storage_throughput FsxLustreFileSystem#per_unit_storage_throughput}.'''
        result = self._values.get("per_unit_storage_throughput")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def root_squash_configuration(
        self,
    ) -> typing.Optional["FsxLustreFileSystemRootSquashConfiguration"]:
        '''root_squash_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash_configuration FsxLustreFileSystem#root_squash_configuration}
        '''
        result = self._values.get("root_squash_configuration")
        return typing.cast(typing.Optional["FsxLustreFileSystemRootSquashConfiguration"], result)

    @builtins.property
    def security_group_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#security_group_ids FsxLustreFileSystem#security_group_ids}.'''
        result = self._values.get("security_group_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def skip_final_backup(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#skip_final_backup FsxLustreFileSystem#skip_final_backup}.'''
        result = self._values.get("skip_final_backup")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def storage_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_capacity FsxLustreFileSystem#storage_capacity}.'''
        result = self._values.get("storage_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def storage_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_type FsxLustreFileSystem#storage_type}.'''
        result = self._values.get("storage_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags FsxLustreFileSystem#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags_all FsxLustreFileSystem#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def throughput_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#throughput_capacity FsxLustreFileSystem#throughput_capacity}.'''
        result = self._values.get("throughput_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["FsxLustreFileSystemTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#timeouts FsxLustreFileSystem#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["FsxLustreFileSystemTimeouts"], result)

    @builtins.property
    def weekly_maintenance_start_time(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#weekly_maintenance_start_time FsxLustreFileSystem#weekly_maintenance_start_time}.'''
        result = self._values.get("weekly_maintenance_start_time")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxLustreFileSystemConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemDataReadCacheConfiguration",
    jsii_struct_bases=[],
    name_mapping={"sizing_mode": "sizingMode", "size": "size"},
)
class FsxLustreFileSystemDataReadCacheConfiguration:
    def __init__(
        self,
        *,
        sizing_mode: builtins.str,
        size: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param sizing_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#sizing_mode FsxLustreFileSystem#sizing_mode}.
        :param size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#size FsxLustreFileSystem#size}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d8337be8cebd0e21227d946cc61a8fc4924f3e53d45eeee8facfc93b957ca35)
            check_type(argname="argument sizing_mode", value=sizing_mode, expected_type=type_hints["sizing_mode"])
            check_type(argname="argument size", value=size, expected_type=type_hints["size"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "sizing_mode": sizing_mode,
        }
        if size is not None:
            self._values["size"] = size

    @builtins.property
    def sizing_mode(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#sizing_mode FsxLustreFileSystem#sizing_mode}.'''
        result = self._values.get("sizing_mode")
        assert result is not None, "Required property 'sizing_mode' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#size FsxLustreFileSystem#size}.'''
        result = self._values.get("size")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxLustreFileSystemDataReadCacheConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxLustreFileSystemDataReadCacheConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemDataReadCacheConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__324ae7381de009e01005ea560f98c6d44cebeef8c17d33518c0e6ba4d8baed5c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSize")
    def reset_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSize", []))

    @builtins.property
    @jsii.member(jsii_name="sizeInput")
    def size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "sizeInput"))

    @builtins.property
    @jsii.member(jsii_name="sizingModeInput")
    def sizing_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sizingModeInput"))

    @builtins.property
    @jsii.member(jsii_name="size")
    def size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "size"))

    @size.setter
    def size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9f9478280a1a028386fe868a97fc6704a9ab47a432d42c1c8b7788eb3053579)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "size", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sizingMode")
    def sizing_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sizingMode"))

    @sizing_mode.setter
    def sizing_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a6cbfa0fab238c428e7a8ddcafc0c5f6ea6b13d1a1722bf260310202429f36d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sizingMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FsxLustreFileSystemDataReadCacheConfiguration]:
        return typing.cast(typing.Optional[FsxLustreFileSystemDataReadCacheConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxLustreFileSystemDataReadCacheConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21346c794d82bd82fe3df5e29bd6bf804a9f7a3cd626755cadba300f63f72295)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemLogConfiguration",
    jsii_struct_bases=[],
    name_mapping={"destination": "destination", "level": "level"},
)
class FsxLustreFileSystemLogConfiguration:
    def __init__(
        self,
        *,
        destination: typing.Optional[builtins.str] = None,
        level: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param destination: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#destination FsxLustreFileSystem#destination}.
        :param level: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#level FsxLustreFileSystem#level}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0dd9c830d965d021f5d55d481e329940efae366bdea71eaa5946af44d3855e69)
            check_type(argname="argument destination", value=destination, expected_type=type_hints["destination"])
            check_type(argname="argument level", value=level, expected_type=type_hints["level"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if destination is not None:
            self._values["destination"] = destination
        if level is not None:
            self._values["level"] = level

    @builtins.property
    def destination(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#destination FsxLustreFileSystem#destination}.'''
        result = self._values.get("destination")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def level(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#level FsxLustreFileSystem#level}.'''
        result = self._values.get("level")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxLustreFileSystemLogConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxLustreFileSystemLogConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemLogConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2677b9ce9e0394464a76caaf35ea7adeeaeb298bbe4265934fc968fdf18f488e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDestination")
    def reset_destination(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDestination", []))

    @jsii.member(jsii_name="resetLevel")
    def reset_level(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLevel", []))

    @builtins.property
    @jsii.member(jsii_name="destinationInput")
    def destination_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "destinationInput"))

    @builtins.property
    @jsii.member(jsii_name="levelInput")
    def level_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "levelInput"))

    @builtins.property
    @jsii.member(jsii_name="destination")
    def destination(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "destination"))

    @destination.setter
    def destination(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86ad62922ff668e66a24129e6e4ec8ada62b627d0fb7c96340be13214d0eb76d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "destination", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="level")
    def level(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "level"))

    @level.setter
    def level(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a8f42c4e8ff712b3c7072b55406adbd9cc8687007c3f15a9dda483425e098e1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "level", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[FsxLustreFileSystemLogConfiguration]:
        return typing.cast(typing.Optional[FsxLustreFileSystemLogConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxLustreFileSystemLogConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fbcbdcf67144d64fc3b9665b7a06120ad655e3d92687a711e030b21a0023fe0e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemMetadataConfiguration",
    jsii_struct_bases=[],
    name_mapping={"iops": "iops", "mode": "mode"},
)
class FsxLustreFileSystemMetadataConfiguration:
    def __init__(
        self,
        *,
        iops: typing.Optional[jsii.Number] = None,
        mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param iops: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#iops FsxLustreFileSystem#iops}.
        :param mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#mode FsxLustreFileSystem#mode}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6feaab03935687a7f5eee5eefea8604c97ec2eda2e468f5dd45788b2d97c0fa5)
            check_type(argname="argument iops", value=iops, expected_type=type_hints["iops"])
            check_type(argname="argument mode", value=mode, expected_type=type_hints["mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if iops is not None:
            self._values["iops"] = iops
        if mode is not None:
            self._values["mode"] = mode

    @builtins.property
    def iops(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#iops FsxLustreFileSystem#iops}.'''
        result = self._values.get("iops")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#mode FsxLustreFileSystem#mode}.'''
        result = self._values.get("mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxLustreFileSystemMetadataConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxLustreFileSystemMetadataConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemMetadataConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__363290510603db178728a53ce1b39f007ea67e2b8488398a702c9d8cf71c6cd2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetIops")
    def reset_iops(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIops", []))

    @jsii.member(jsii_name="resetMode")
    def reset_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMode", []))

    @builtins.property
    @jsii.member(jsii_name="iopsInput")
    def iops_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "iopsInput"))

    @builtins.property
    @jsii.member(jsii_name="modeInput")
    def mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modeInput"))

    @builtins.property
    @jsii.member(jsii_name="iops")
    def iops(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "iops"))

    @iops.setter
    def iops(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62fb4c60d965cadba63d9fde355a91289ed06a13f87a2495d0b54a5fa3802833)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "iops", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="mode")
    def mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mode"))

    @mode.setter
    def mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe74c324c909b991245b607ba9ad855e5a0ba128d50ce51bc7104d063fc7bf23)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FsxLustreFileSystemMetadataConfiguration]:
        return typing.cast(typing.Optional[FsxLustreFileSystemMetadataConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxLustreFileSystemMetadataConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b14405cb11c87a87a90ebbfd33181cf24432bde5a76a104e65012f4377a6f38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemRootSquashConfiguration",
    jsii_struct_bases=[],
    name_mapping={"no_squash_nids": "noSquashNids", "root_squash": "rootSquash"},
)
class FsxLustreFileSystemRootSquashConfiguration:
    def __init__(
        self,
        *,
        no_squash_nids: typing.Optional[typing.Sequence[builtins.str]] = None,
        root_squash: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param no_squash_nids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#no_squash_nids FsxLustreFileSystem#no_squash_nids}.
        :param root_squash: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash FsxLustreFileSystem#root_squash}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac4a00735edb4acf5f746a45b269f1a04a8227d205b66173a33accd02569c5f7)
            check_type(argname="argument no_squash_nids", value=no_squash_nids, expected_type=type_hints["no_squash_nids"])
            check_type(argname="argument root_squash", value=root_squash, expected_type=type_hints["root_squash"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if no_squash_nids is not None:
            self._values["no_squash_nids"] = no_squash_nids
        if root_squash is not None:
            self._values["root_squash"] = root_squash

    @builtins.property
    def no_squash_nids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#no_squash_nids FsxLustreFileSystem#no_squash_nids}.'''
        result = self._values.get("no_squash_nids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def root_squash(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash FsxLustreFileSystem#root_squash}.'''
        result = self._values.get("root_squash")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxLustreFileSystemRootSquashConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxLustreFileSystemRootSquashConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemRootSquashConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__75a2a8901e8cffa9bba21f6e6f1d8a51422a49280e5a9f7a0d274e8534032bc2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetNoSquashNids")
    def reset_no_squash_nids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNoSquashNids", []))

    @jsii.member(jsii_name="resetRootSquash")
    def reset_root_squash(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRootSquash", []))

    @builtins.property
    @jsii.member(jsii_name="noSquashNidsInput")
    def no_squash_nids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "noSquashNidsInput"))

    @builtins.property
    @jsii.member(jsii_name="rootSquashInput")
    def root_squash_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rootSquashInput"))

    @builtins.property
    @jsii.member(jsii_name="noSquashNids")
    def no_squash_nids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "noSquashNids"))

    @no_squash_nids.setter
    def no_squash_nids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb9ca0cdb85f7dde9457831483cfb5c459a52da8ed37817d5af9a29adb603de2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "noSquashNids", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="rootSquash")
    def root_squash(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rootSquash"))

    @root_squash.setter
    def root_squash(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__798e2eda308d4c178d3b8284a3f7bf672c30698d182abf42165825d04a86518d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rootSquash", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FsxLustreFileSystemRootSquashConfiguration]:
        return typing.cast(typing.Optional[FsxLustreFileSystemRootSquashConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FsxLustreFileSystemRootSquashConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3b072af4f95cada4a4215b64509ed32ddbd4685450dccb0a75d454164eedb66)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class FsxLustreFileSystemTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#create FsxLustreFileSystem#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#delete FsxLustreFileSystem#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#update FsxLustreFileSystem#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__45aa3d53a5776eefdb086ede0b74ad088ea267f1ac9cff1d9513eb88a6833f01)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#create FsxLustreFileSystem#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#delete FsxLustreFileSystem#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#update FsxLustreFileSystem#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FsxLustreFileSystemTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FsxLustreFileSystemTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.fsxLustreFileSystem.FsxLustreFileSystemTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fff89d170d18440c22c897d3267761285b8c7d04d67fbd5360ea1519cf301b04)
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
            type_hints = typing.get_type_hints(_typecheckingstub__782b087cefb60a08e75bc5472fb0fa71ee294206b979e0fffec8f4b3706f9d4d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59551ea196f5b3cec77a6c5cb937ce8f391af6458e99256aa49075b82defd53f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e318e96a84e21a80e5e0d6f03d4fc0e38430b269df689dfda50aa584e56d043d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FsxLustreFileSystemTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FsxLustreFileSystemTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FsxLustreFileSystemTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6f7b1882a904963b1c52e5921567f49c16592552210e31fe4c3aebbfd146371)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "FsxLustreFileSystem",
    "FsxLustreFileSystemConfig",
    "FsxLustreFileSystemDataReadCacheConfiguration",
    "FsxLustreFileSystemDataReadCacheConfigurationOutputReference",
    "FsxLustreFileSystemLogConfiguration",
    "FsxLustreFileSystemLogConfigurationOutputReference",
    "FsxLustreFileSystemMetadataConfiguration",
    "FsxLustreFileSystemMetadataConfigurationOutputReference",
    "FsxLustreFileSystemRootSquashConfiguration",
    "FsxLustreFileSystemRootSquashConfigurationOutputReference",
    "FsxLustreFileSystemTimeouts",
    "FsxLustreFileSystemTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__f810c5c77b89a3b802a4770ca2ec4571e39913a3c5ad04a1e8a937383efe3d18(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    subnet_ids: typing.Sequence[builtins.str],
    auto_import_policy: typing.Optional[builtins.str] = None,
    automatic_backup_retention_days: typing.Optional[jsii.Number] = None,
    backup_id: typing.Optional[builtins.str] = None,
    copy_tags_to_backups: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    daily_automatic_backup_start_time: typing.Optional[builtins.str] = None,
    data_compression_type: typing.Optional[builtins.str] = None,
    data_read_cache_configuration: typing.Optional[typing.Union[FsxLustreFileSystemDataReadCacheConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    deployment_type: typing.Optional[builtins.str] = None,
    drive_cache_type: typing.Optional[builtins.str] = None,
    efa_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    export_path: typing.Optional[builtins.str] = None,
    file_system_type_version: typing.Optional[builtins.str] = None,
    final_backup_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    id: typing.Optional[builtins.str] = None,
    imported_file_chunk_size: typing.Optional[jsii.Number] = None,
    import_path: typing.Optional[builtins.str] = None,
    kms_key_id: typing.Optional[builtins.str] = None,
    log_configuration: typing.Optional[typing.Union[FsxLustreFileSystemLogConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    metadata_configuration: typing.Optional[typing.Union[FsxLustreFileSystemMetadataConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    per_unit_storage_throughput: typing.Optional[jsii.Number] = None,
    root_squash_configuration: typing.Optional[typing.Union[FsxLustreFileSystemRootSquashConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    security_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    skip_final_backup: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    storage_capacity: typing.Optional[jsii.Number] = None,
    storage_type: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    throughput_capacity: typing.Optional[jsii.Number] = None,
    timeouts: typing.Optional[typing.Union[FsxLustreFileSystemTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    weekly_maintenance_start_time: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__2ce995187313efd82e42ced39777dc0a52450d21ccaae8bccb61bf5c34511d26(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed7890f6ed6b6bd0bd818d775a63c9c1692bee3acd9cace32da61aaa2a0792a6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4bfff8c44463d5949287c9a9ce849b3bbdd8868fb1768c911beb64dec8b204c1(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__635b861184414f5a55b04bcefb005c9951c3a2498bb9e077f99ee3582cc35711(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17957cd9df8ec9eea6ff1fb0d20a3400f00b618a99c63285bfec765be7734e11(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb72c6a1f165cd6760641b4f7182a8023fcd93c364dfbd1b0dffb2d05ae0a444(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60d3b6fb9786d53b6b3d3be82b29f539ec2b8085cef56959dcb43eee87d10f87(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d949235e833854ee1748ac711bc827a8a146db676764f361624ddb7d1533afa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76e54fb00877faa1c099aea26dacc185efc7edaaff6968db14702a44e7f5d8c7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2e3625723298f2afcb9e06e2a6e936bf9a83ea0fea0ee849d261bc2d7e62b79(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77c5718d3c52f1c5b950fc688d0759f936545ef9ac289ab0ae903e8e0934dfce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1335f394b2c45b6fd1b0daa6dfc7eca053dbd357dbd857f64295f1f5c86f697(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11a9a4f3a572268f3ecb036fe9615448fc3ee10f85c1cc8e99b7a12ed44c7700(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b206333fe5f61a9c19fca36f52aa10a04dde0c4af87eb42b27f7203f33e5631(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44698222de399255ec5bf07b80b8ecbeffb99399c2d57015cfc37a5e1aa6768a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0eac17250cf31b5dfaa8ece2b361cee45313a09085b2a7d49b5ba237591121cd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__773f453d7a5c9b5f1a7b5fcb69f2c2748f0a04eec4197912a48a7125bbe5638f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__945e08cd8cd956f46642cfe8f90933605bbb67f57d58561b90bd664ef0af6e76(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3ba6ef7f12398819a490f8372ebe001e22d7ae84f8c41e25f43c5161b8b90e8(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61bb2b3fdf0dea0beef455521bb43b8dbdbc18bbe742c0bd9c8224f5e54c7dbf(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9a1cb2b38c89f52f7d1aeb1a0b27a40065c4383b1ca951a1d9a91e3f1789393(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__594f3d15da7c1d8344472fc6fbf769636c168bc13a9514260d31b3f1024ade5c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__26c1d68086bb1672a4e9495f78fb7aea7257b0651e50e73a9de2108f9db4aa83(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f84c4be7a62967282ce5cf72db2061e83b30a2dc8745d2ecaa2e48a3a9f56e21(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e37cba100a5dd2e1b66ba3be26bc3192269c781aaeb7cad1288eec99f6451171(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3250e45e9c2c6b91fdbd337cd6b65041979378ee246278c678bffb177c6be0aa(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af2d30a6362150b39580932f29dd25fa24c3af2149c1e66bc86bc5c0cf83b635(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29d6fc9571afdc42d36c3d8b713be44e697f0344214fdb0fcbc7b77abfd4c4cc(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    subnet_ids: typing.Sequence[builtins.str],
    auto_import_policy: typing.Optional[builtins.str] = None,
    automatic_backup_retention_days: typing.Optional[jsii.Number] = None,
    backup_id: typing.Optional[builtins.str] = None,
    copy_tags_to_backups: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    daily_automatic_backup_start_time: typing.Optional[builtins.str] = None,
    data_compression_type: typing.Optional[builtins.str] = None,
    data_read_cache_configuration: typing.Optional[typing.Union[FsxLustreFileSystemDataReadCacheConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    deployment_type: typing.Optional[builtins.str] = None,
    drive_cache_type: typing.Optional[builtins.str] = None,
    efa_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    export_path: typing.Optional[builtins.str] = None,
    file_system_type_version: typing.Optional[builtins.str] = None,
    final_backup_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    id: typing.Optional[builtins.str] = None,
    imported_file_chunk_size: typing.Optional[jsii.Number] = None,
    import_path: typing.Optional[builtins.str] = None,
    kms_key_id: typing.Optional[builtins.str] = None,
    log_configuration: typing.Optional[typing.Union[FsxLustreFileSystemLogConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    metadata_configuration: typing.Optional[typing.Union[FsxLustreFileSystemMetadataConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    per_unit_storage_throughput: typing.Optional[jsii.Number] = None,
    root_squash_configuration: typing.Optional[typing.Union[FsxLustreFileSystemRootSquashConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    security_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    skip_final_backup: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    storage_capacity: typing.Optional[jsii.Number] = None,
    storage_type: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    throughput_capacity: typing.Optional[jsii.Number] = None,
    timeouts: typing.Optional[typing.Union[FsxLustreFileSystemTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    weekly_maintenance_start_time: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d8337be8cebd0e21227d946cc61a8fc4924f3e53d45eeee8facfc93b957ca35(
    *,
    sizing_mode: builtins.str,
    size: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__324ae7381de009e01005ea560f98c6d44cebeef8c17d33518c0e6ba4d8baed5c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9f9478280a1a028386fe868a97fc6704a9ab47a432d42c1c8b7788eb3053579(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a6cbfa0fab238c428e7a8ddcafc0c5f6ea6b13d1a1722bf260310202429f36d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21346c794d82bd82fe3df5e29bd6bf804a9f7a3cd626755cadba300f63f72295(
    value: typing.Optional[FsxLustreFileSystemDataReadCacheConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0dd9c830d965d021f5d55d481e329940efae366bdea71eaa5946af44d3855e69(
    *,
    destination: typing.Optional[builtins.str] = None,
    level: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2677b9ce9e0394464a76caaf35ea7adeeaeb298bbe4265934fc968fdf18f488e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86ad62922ff668e66a24129e6e4ec8ada62b627d0fb7c96340be13214d0eb76d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a8f42c4e8ff712b3c7072b55406adbd9cc8687007c3f15a9dda483425e098e1c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fbcbdcf67144d64fc3b9665b7a06120ad655e3d92687a711e030b21a0023fe0e(
    value: typing.Optional[FsxLustreFileSystemLogConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6feaab03935687a7f5eee5eefea8604c97ec2eda2e468f5dd45788b2d97c0fa5(
    *,
    iops: typing.Optional[jsii.Number] = None,
    mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__363290510603db178728a53ce1b39f007ea67e2b8488398a702c9d8cf71c6cd2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62fb4c60d965cadba63d9fde355a91289ed06a13f87a2495d0b54a5fa3802833(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe74c324c909b991245b607ba9ad855e5a0ba128d50ce51bc7104d063fc7bf23(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b14405cb11c87a87a90ebbfd33181cf24432bde5a76a104e65012f4377a6f38(
    value: typing.Optional[FsxLustreFileSystemMetadataConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac4a00735edb4acf5f746a45b269f1a04a8227d205b66173a33accd02569c5f7(
    *,
    no_squash_nids: typing.Optional[typing.Sequence[builtins.str]] = None,
    root_squash: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75a2a8901e8cffa9bba21f6e6f1d8a51422a49280e5a9f7a0d274e8534032bc2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb9ca0cdb85f7dde9457831483cfb5c459a52da8ed37817d5af9a29adb603de2(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__798e2eda308d4c178d3b8284a3f7bf672c30698d182abf42165825d04a86518d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3b072af4f95cada4a4215b64509ed32ddbd4685450dccb0a75d454164eedb66(
    value: typing.Optional[FsxLustreFileSystemRootSquashConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45aa3d53a5776eefdb086ede0b74ad088ea267f1ac9cff1d9513eb88a6833f01(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fff89d170d18440c22c897d3267761285b8c7d04d67fbd5360ea1519cf301b04(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__782b087cefb60a08e75bc5472fb0fa71ee294206b979e0fffec8f4b3706f9d4d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59551ea196f5b3cec77a6c5cb937ce8f391af6458e99256aa49075b82defd53f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e318e96a84e21a80e5e0d6f03d4fc0e38430b269df689dfda50aa584e56d043d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6f7b1882a904963b1c52e5921567f49c16592552210e31fe4c3aebbfd146371(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FsxLustreFileSystemTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
