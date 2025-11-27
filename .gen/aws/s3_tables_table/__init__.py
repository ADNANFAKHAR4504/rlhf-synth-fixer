r'''
# `aws_s3tables_table`

Refer to the Terraform Registry for docs: [`aws_s3tables_table`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table).
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


class S3TablesTable(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.s3TablesTable.S3TablesTable",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table aws_s3tables_table}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        format: builtins.str,
        name: builtins.str,
        namespace: builtins.str,
        table_bucket_arn: builtins.str,
        encryption_configuration: typing.Optional[typing.Union["S3TablesTableEncryptionConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        maintenance_configuration: typing.Optional[typing.Union["S3TablesTableMaintenanceConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table aws_s3tables_table} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param format: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#format S3TablesTable#format}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#name S3TablesTable#name}.
        :param namespace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#namespace S3TablesTable#namespace}.
        :param table_bucket_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#table_bucket_arn S3TablesTable#table_bucket_arn}.
        :param encryption_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#encryption_configuration S3TablesTable#encryption_configuration}.
        :param maintenance_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#maintenance_configuration S3TablesTable#maintenance_configuration}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ed8443973ce309a3196764fbeb2d619cb662ea877d898cb4f8db4c122f91902)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = S3TablesTableConfig(
            format=format,
            name=name,
            namespace=namespace,
            table_bucket_arn=table_bucket_arn,
            encryption_configuration=encryption_configuration,
            maintenance_configuration=maintenance_configuration,
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
        '''Generates CDKTF code for importing a S3TablesTable resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the S3TablesTable to import.
        :param import_from_id: The id of the existing S3TablesTable that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the S3TablesTable to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__829c8ea46d9f36f245b165c29e309f12a2c339a0542245e24ff725890dc1eb95)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putEncryptionConfiguration")
    def put_encryption_configuration(
        self,
        *,
        kms_key_arn: typing.Optional[builtins.str] = None,
        sse_algorithm: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param kms_key_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#kms_key_arn S3TablesTable#kms_key_arn}.
        :param sse_algorithm: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#sse_algorithm S3TablesTable#sse_algorithm}.
        '''
        value = S3TablesTableEncryptionConfiguration(
            kms_key_arn=kms_key_arn, sse_algorithm=sse_algorithm
        )

        return typing.cast(None, jsii.invoke(self, "putEncryptionConfiguration", [value]))

    @jsii.member(jsii_name="putMaintenanceConfiguration")
    def put_maintenance_configuration(
        self,
        *,
        iceberg_compaction: typing.Optional[typing.Union["S3TablesTableMaintenanceConfigurationIcebergCompaction", typing.Dict[builtins.str, typing.Any]]] = None,
        iceberg_snapshot_management: typing.Optional[typing.Union["S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param iceberg_compaction: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#iceberg_compaction S3TablesTable#iceberg_compaction}.
        :param iceberg_snapshot_management: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#iceberg_snapshot_management S3TablesTable#iceberg_snapshot_management}.
        '''
        value = S3TablesTableMaintenanceConfiguration(
            iceberg_compaction=iceberg_compaction,
            iceberg_snapshot_management=iceberg_snapshot_management,
        )

        return typing.cast(None, jsii.invoke(self, "putMaintenanceConfiguration", [value]))

    @jsii.member(jsii_name="resetEncryptionConfiguration")
    def reset_encryption_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEncryptionConfiguration", []))

    @jsii.member(jsii_name="resetMaintenanceConfiguration")
    def reset_maintenance_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaintenanceConfiguration", []))

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
    @jsii.member(jsii_name="createdAt")
    def created_at(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "createdAt"))

    @builtins.property
    @jsii.member(jsii_name="createdBy")
    def created_by(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "createdBy"))

    @builtins.property
    @jsii.member(jsii_name="encryptionConfiguration")
    def encryption_configuration(
        self,
    ) -> "S3TablesTableEncryptionConfigurationOutputReference":
        return typing.cast("S3TablesTableEncryptionConfigurationOutputReference", jsii.get(self, "encryptionConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="maintenanceConfiguration")
    def maintenance_configuration(
        self,
    ) -> "S3TablesTableMaintenanceConfigurationOutputReference":
        return typing.cast("S3TablesTableMaintenanceConfigurationOutputReference", jsii.get(self, "maintenanceConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="metadataLocation")
    def metadata_location(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "metadataLocation"))

    @builtins.property
    @jsii.member(jsii_name="modifiedAt")
    def modified_at(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "modifiedAt"))

    @builtins.property
    @jsii.member(jsii_name="modifiedBy")
    def modified_by(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "modifiedBy"))

    @builtins.property
    @jsii.member(jsii_name="ownerAccountId")
    def owner_account_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ownerAccountId"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @builtins.property
    @jsii.member(jsii_name="versionToken")
    def version_token(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "versionToken"))

    @builtins.property
    @jsii.member(jsii_name="warehouseLocation")
    def warehouse_location(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "warehouseLocation"))

    @builtins.property
    @jsii.member(jsii_name="encryptionConfigurationInput")
    def encryption_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "S3TablesTableEncryptionConfiguration"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "S3TablesTableEncryptionConfiguration"]], jsii.get(self, "encryptionConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="formatInput")
    def format_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "formatInput"))

    @builtins.property
    @jsii.member(jsii_name="maintenanceConfigurationInput")
    def maintenance_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "S3TablesTableMaintenanceConfiguration"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "S3TablesTableMaintenanceConfiguration"]], jsii.get(self, "maintenanceConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="namespaceInput")
    def namespace_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namespaceInput"))

    @builtins.property
    @jsii.member(jsii_name="tableBucketArnInput")
    def table_bucket_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "tableBucketArnInput"))

    @builtins.property
    @jsii.member(jsii_name="format")
    def format(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "format"))

    @format.setter
    def format(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf4c843a45ff0af613165033d1664c85736c5452c593299daf97d51b6ac4aa6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "format", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b4c061492b3528b550ed2f3a3af4c3f0c72d41e81c9e9029d76b2a11d92dce41)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namespace")
    def namespace(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namespace"))

    @namespace.setter
    def namespace(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9ab587c7a95741eefa89b94916b4005766775e60b16d0fdba7b3501481d14ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namespace", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tableBucketArn")
    def table_bucket_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tableBucketArn"))

    @table_bucket_arn.setter
    def table_bucket_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f13c4f7c4bb3cbf2b1e4d076dbe7c7fb2aa41350b0e90fc2249a6d7bd71f313)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tableBucketArn", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.s3TablesTable.S3TablesTableConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "format": "format",
        "name": "name",
        "namespace": "namespace",
        "table_bucket_arn": "tableBucketArn",
        "encryption_configuration": "encryptionConfiguration",
        "maintenance_configuration": "maintenanceConfiguration",
    },
)
class S3TablesTableConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        format: builtins.str,
        name: builtins.str,
        namespace: builtins.str,
        table_bucket_arn: builtins.str,
        encryption_configuration: typing.Optional[typing.Union["S3TablesTableEncryptionConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        maintenance_configuration: typing.Optional[typing.Union["S3TablesTableMaintenanceConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param format: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#format S3TablesTable#format}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#name S3TablesTable#name}.
        :param namespace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#namespace S3TablesTable#namespace}.
        :param table_bucket_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#table_bucket_arn S3TablesTable#table_bucket_arn}.
        :param encryption_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#encryption_configuration S3TablesTable#encryption_configuration}.
        :param maintenance_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#maintenance_configuration S3TablesTable#maintenance_configuration}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(encryption_configuration, dict):
            encryption_configuration = S3TablesTableEncryptionConfiguration(**encryption_configuration)
        if isinstance(maintenance_configuration, dict):
            maintenance_configuration = S3TablesTableMaintenanceConfiguration(**maintenance_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b308bf8b5b733dc96a4c1456e68d520391979d27c8671ccc1afa6092f14b459d)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument format", value=format, expected_type=type_hints["format"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument namespace", value=namespace, expected_type=type_hints["namespace"])
            check_type(argname="argument table_bucket_arn", value=table_bucket_arn, expected_type=type_hints["table_bucket_arn"])
            check_type(argname="argument encryption_configuration", value=encryption_configuration, expected_type=type_hints["encryption_configuration"])
            check_type(argname="argument maintenance_configuration", value=maintenance_configuration, expected_type=type_hints["maintenance_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "format": format,
            "name": name,
            "namespace": namespace,
            "table_bucket_arn": table_bucket_arn,
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
        if encryption_configuration is not None:
            self._values["encryption_configuration"] = encryption_configuration
        if maintenance_configuration is not None:
            self._values["maintenance_configuration"] = maintenance_configuration

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
    def format(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#format S3TablesTable#format}.'''
        result = self._values.get("format")
        assert result is not None, "Required property 'format' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#name S3TablesTable#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def namespace(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#namespace S3TablesTable#namespace}.'''
        result = self._values.get("namespace")
        assert result is not None, "Required property 'namespace' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def table_bucket_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#table_bucket_arn S3TablesTable#table_bucket_arn}.'''
        result = self._values.get("table_bucket_arn")
        assert result is not None, "Required property 'table_bucket_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def encryption_configuration(
        self,
    ) -> typing.Optional["S3TablesTableEncryptionConfiguration"]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#encryption_configuration S3TablesTable#encryption_configuration}.'''
        result = self._values.get("encryption_configuration")
        return typing.cast(typing.Optional["S3TablesTableEncryptionConfiguration"], result)

    @builtins.property
    def maintenance_configuration(
        self,
    ) -> typing.Optional["S3TablesTableMaintenanceConfiguration"]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#maintenance_configuration S3TablesTable#maintenance_configuration}.'''
        result = self._values.get("maintenance_configuration")
        return typing.cast(typing.Optional["S3TablesTableMaintenanceConfiguration"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "S3TablesTableConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.s3TablesTable.S3TablesTableEncryptionConfiguration",
    jsii_struct_bases=[],
    name_mapping={"kms_key_arn": "kmsKeyArn", "sse_algorithm": "sseAlgorithm"},
)
class S3TablesTableEncryptionConfiguration:
    def __init__(
        self,
        *,
        kms_key_arn: typing.Optional[builtins.str] = None,
        sse_algorithm: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param kms_key_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#kms_key_arn S3TablesTable#kms_key_arn}.
        :param sse_algorithm: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#sse_algorithm S3TablesTable#sse_algorithm}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01022728d43e934b9d77d05a20ad2522e54a26b2fd5a02c5153d88901389f09b)
            check_type(argname="argument kms_key_arn", value=kms_key_arn, expected_type=type_hints["kms_key_arn"])
            check_type(argname="argument sse_algorithm", value=sse_algorithm, expected_type=type_hints["sse_algorithm"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if kms_key_arn is not None:
            self._values["kms_key_arn"] = kms_key_arn
        if sse_algorithm is not None:
            self._values["sse_algorithm"] = sse_algorithm

    @builtins.property
    def kms_key_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#kms_key_arn S3TablesTable#kms_key_arn}.'''
        result = self._values.get("kms_key_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sse_algorithm(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#sse_algorithm S3TablesTable#sse_algorithm}.'''
        result = self._values.get("sse_algorithm")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "S3TablesTableEncryptionConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class S3TablesTableEncryptionConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.s3TablesTable.S3TablesTableEncryptionConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7e42792530184394a226298c9fe520f8b643683f5027f9d786c785ac1006325e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetKmsKeyArn")
    def reset_kms_key_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKmsKeyArn", []))

    @jsii.member(jsii_name="resetSseAlgorithm")
    def reset_sse_algorithm(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSseAlgorithm", []))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyArnInput")
    def kms_key_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "kmsKeyArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sseAlgorithmInput")
    def sse_algorithm_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sseAlgorithmInput"))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyArn")
    def kms_key_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "kmsKeyArn"))

    @kms_key_arn.setter
    def kms_key_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b4a16756333d368c0820097ec83a521317c6c725cbed602a5d4e36e55c615369)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "kmsKeyArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sseAlgorithm")
    def sse_algorithm(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sseAlgorithm"))

    @sse_algorithm.setter
    def sse_algorithm(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8402276dfe6fac1a5e6cf081c2e7b021dd99a4e51d6c8eabc77cae3c19e96ac9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sseAlgorithm", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableEncryptionConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableEncryptionConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableEncryptionConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f464545aca7b522f2166168bb376b5b093c23eee403a7e679c20c554742f71cf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.s3TablesTable.S3TablesTableMaintenanceConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "iceberg_compaction": "icebergCompaction",
        "iceberg_snapshot_management": "icebergSnapshotManagement",
    },
)
class S3TablesTableMaintenanceConfiguration:
    def __init__(
        self,
        *,
        iceberg_compaction: typing.Optional[typing.Union["S3TablesTableMaintenanceConfigurationIcebergCompaction", typing.Dict[builtins.str, typing.Any]]] = None,
        iceberg_snapshot_management: typing.Optional[typing.Union["S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param iceberg_compaction: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#iceberg_compaction S3TablesTable#iceberg_compaction}.
        :param iceberg_snapshot_management: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#iceberg_snapshot_management S3TablesTable#iceberg_snapshot_management}.
        '''
        if isinstance(iceberg_compaction, dict):
            iceberg_compaction = S3TablesTableMaintenanceConfigurationIcebergCompaction(**iceberg_compaction)
        if isinstance(iceberg_snapshot_management, dict):
            iceberg_snapshot_management = S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement(**iceberg_snapshot_management)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5db3904dc8d8514d3e7c812f7c4d7fa35d070b8344f2c76081fafbaff94549c)
            check_type(argname="argument iceberg_compaction", value=iceberg_compaction, expected_type=type_hints["iceberg_compaction"])
            check_type(argname="argument iceberg_snapshot_management", value=iceberg_snapshot_management, expected_type=type_hints["iceberg_snapshot_management"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if iceberg_compaction is not None:
            self._values["iceberg_compaction"] = iceberg_compaction
        if iceberg_snapshot_management is not None:
            self._values["iceberg_snapshot_management"] = iceberg_snapshot_management

    @builtins.property
    def iceberg_compaction(
        self,
    ) -> typing.Optional["S3TablesTableMaintenanceConfigurationIcebergCompaction"]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#iceberg_compaction S3TablesTable#iceberg_compaction}.'''
        result = self._values.get("iceberg_compaction")
        return typing.cast(typing.Optional["S3TablesTableMaintenanceConfigurationIcebergCompaction"], result)

    @builtins.property
    def iceberg_snapshot_management(
        self,
    ) -> typing.Optional["S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement"]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#iceberg_snapshot_management S3TablesTable#iceberg_snapshot_management}.'''
        result = self._values.get("iceberg_snapshot_management")
        return typing.cast(typing.Optional["S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "S3TablesTableMaintenanceConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergCompaction",
    jsii_struct_bases=[],
    name_mapping={"settings": "settings", "status": "status"},
)
class S3TablesTableMaintenanceConfigurationIcebergCompaction:
    def __init__(
        self,
        *,
        settings: typing.Optional[typing.Union["S3TablesTableMaintenanceConfigurationIcebergCompactionSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param settings: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#settings S3TablesTable#settings}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#status S3TablesTable#status}.
        '''
        if isinstance(settings, dict):
            settings = S3TablesTableMaintenanceConfigurationIcebergCompactionSettings(**settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5af3610b38fd27b73cbd5f7f7b6ed105aa8c38e295bba22f715162774bba6a8d)
            check_type(argname="argument settings", value=settings, expected_type=type_hints["settings"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if settings is not None:
            self._values["settings"] = settings
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def settings(
        self,
    ) -> typing.Optional["S3TablesTableMaintenanceConfigurationIcebergCompactionSettings"]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#settings S3TablesTable#settings}.'''
        result = self._values.get("settings")
        return typing.cast(typing.Optional["S3TablesTableMaintenanceConfigurationIcebergCompactionSettings"], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#status S3TablesTable#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "S3TablesTableMaintenanceConfigurationIcebergCompaction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class S3TablesTableMaintenanceConfigurationIcebergCompactionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergCompactionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7544ac20aa788a7f849a8007590a534ce503f981b9ad3114c781d1d52f38da43)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putSettings")
    def put_settings(
        self,
        *,
        target_file_size_mb: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param target_file_size_mb: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#target_file_size_mb S3TablesTable#target_file_size_mb}.
        '''
        value = S3TablesTableMaintenanceConfigurationIcebergCompactionSettings(
            target_file_size_mb=target_file_size_mb
        )

        return typing.cast(None, jsii.invoke(self, "putSettings", [value]))

    @jsii.member(jsii_name="resetSettings")
    def reset_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSettings", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="settings")
    def settings(
        self,
    ) -> "S3TablesTableMaintenanceConfigurationIcebergCompactionSettingsOutputReference":
        return typing.cast("S3TablesTableMaintenanceConfigurationIcebergCompactionSettingsOutputReference", jsii.get(self, "settings"))

    @builtins.property
    @jsii.member(jsii_name="settingsInput")
    def settings_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "S3TablesTableMaintenanceConfigurationIcebergCompactionSettings"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "S3TablesTableMaintenanceConfigurationIcebergCompactionSettings"]], jsii.get(self, "settingsInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__678b30674698b9c79da23f80716723558c2ca4cab91c0301d0b946b0b779df9d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergCompaction]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergCompaction]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergCompaction]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5abdf753e4da8ab78e7c02ddffb856c5af418277e97ae6a3439eb2d839ccf66d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergCompactionSettings",
    jsii_struct_bases=[],
    name_mapping={"target_file_size_mb": "targetFileSizeMb"},
)
class S3TablesTableMaintenanceConfigurationIcebergCompactionSettings:
    def __init__(
        self,
        *,
        target_file_size_mb: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param target_file_size_mb: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#target_file_size_mb S3TablesTable#target_file_size_mb}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e471e2f799a9fff08735b54db62689449022a7400e1cbbf4cdee9770505ee5c)
            check_type(argname="argument target_file_size_mb", value=target_file_size_mb, expected_type=type_hints["target_file_size_mb"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if target_file_size_mb is not None:
            self._values["target_file_size_mb"] = target_file_size_mb

    @builtins.property
    def target_file_size_mb(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#target_file_size_mb S3TablesTable#target_file_size_mb}.'''
        result = self._values.get("target_file_size_mb")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "S3TablesTableMaintenanceConfigurationIcebergCompactionSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class S3TablesTableMaintenanceConfigurationIcebergCompactionSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergCompactionSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b44cfb9b75bc769fec0ab2172067aa647b255a9042b674fd7cdc793d981dcb20)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetTargetFileSizeMb")
    def reset_target_file_size_mb(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetFileSizeMb", []))

    @builtins.property
    @jsii.member(jsii_name="targetFileSizeMbInput")
    def target_file_size_mb_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "targetFileSizeMbInput"))

    @builtins.property
    @jsii.member(jsii_name="targetFileSizeMb")
    def target_file_size_mb(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "targetFileSizeMb"))

    @target_file_size_mb.setter
    def target_file_size_mb(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa2fdd995eb38cfa84f8c86a4a705362a1d099a63510b385dc338d3708e2bf80)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetFileSizeMb", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergCompactionSettings]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergCompactionSettings]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergCompactionSettings]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6bad74bc1a3c469fb89d0afc84759b44f8543e3ca7ee0aa508d89c6bb874ebfb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement",
    jsii_struct_bases=[],
    name_mapping={"settings": "settings", "status": "status"},
)
class S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement:
    def __init__(
        self,
        *,
        settings: typing.Optional[typing.Union["S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param settings: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#settings S3TablesTable#settings}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#status S3TablesTable#status}.
        '''
        if isinstance(settings, dict):
            settings = S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings(**settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2969670d456425cc14c5bc5b88e99744abed5eff6e3eeee0159015f3fdee01bf)
            check_type(argname="argument settings", value=settings, expected_type=type_hints["settings"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if settings is not None:
            self._values["settings"] = settings
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def settings(
        self,
    ) -> typing.Optional["S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings"]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#settings S3TablesTable#settings}.'''
        result = self._values.get("settings")
        return typing.cast(typing.Optional["S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings"], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#status S3TablesTable#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8784dab3a97f6968d0eb53d85919ccb631ec65a59eb3e347b907c5dd9546932e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putSettings")
    def put_settings(
        self,
        *,
        max_snapshot_age_hours: typing.Optional[jsii.Number] = None,
        min_snapshots_to_keep: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max_snapshot_age_hours: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#max_snapshot_age_hours S3TablesTable#max_snapshot_age_hours}.
        :param min_snapshots_to_keep: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#min_snapshots_to_keep S3TablesTable#min_snapshots_to_keep}.
        '''
        value = S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings(
            max_snapshot_age_hours=max_snapshot_age_hours,
            min_snapshots_to_keep=min_snapshots_to_keep,
        )

        return typing.cast(None, jsii.invoke(self, "putSettings", [value]))

    @jsii.member(jsii_name="resetSettings")
    def reset_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSettings", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="settings")
    def settings(
        self,
    ) -> "S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettingsOutputReference":
        return typing.cast("S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettingsOutputReference", jsii.get(self, "settings"))

    @builtins.property
    @jsii.member(jsii_name="settingsInput")
    def settings_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings"]], jsii.get(self, "settingsInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__309bb691fdf627b20f1fe25700f163f5171b7b176242c1fb16fd1460a4be6f20)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ddf10fb18605e639f62cc45207f30b0b206657e57eea2a24aa2d41ffc02e2d8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings",
    jsii_struct_bases=[],
    name_mapping={
        "max_snapshot_age_hours": "maxSnapshotAgeHours",
        "min_snapshots_to_keep": "minSnapshotsToKeep",
    },
)
class S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings:
    def __init__(
        self,
        *,
        max_snapshot_age_hours: typing.Optional[jsii.Number] = None,
        min_snapshots_to_keep: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max_snapshot_age_hours: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#max_snapshot_age_hours S3TablesTable#max_snapshot_age_hours}.
        :param min_snapshots_to_keep: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#min_snapshots_to_keep S3TablesTable#min_snapshots_to_keep}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27f66e934a1d56f5ac3386014f08cd0e12bdb5165b9a3242a450382b2859a827)
            check_type(argname="argument max_snapshot_age_hours", value=max_snapshot_age_hours, expected_type=type_hints["max_snapshot_age_hours"])
            check_type(argname="argument min_snapshots_to_keep", value=min_snapshots_to_keep, expected_type=type_hints["min_snapshots_to_keep"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max_snapshot_age_hours is not None:
            self._values["max_snapshot_age_hours"] = max_snapshot_age_hours
        if min_snapshots_to_keep is not None:
            self._values["min_snapshots_to_keep"] = min_snapshots_to_keep

    @builtins.property
    def max_snapshot_age_hours(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#max_snapshot_age_hours S3TablesTable#max_snapshot_age_hours}.'''
        result = self._values.get("max_snapshot_age_hours")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min_snapshots_to_keep(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#min_snapshots_to_keep S3TablesTable#min_snapshots_to_keep}.'''
        result = self._values.get("min_snapshots_to_keep")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ccb5d4714fe1fb549e3c255bd5d8c248c331ddf97c8f7f1aab0d52ba9f85308a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMaxSnapshotAgeHours")
    def reset_max_snapshot_age_hours(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxSnapshotAgeHours", []))

    @jsii.member(jsii_name="resetMinSnapshotsToKeep")
    def reset_min_snapshots_to_keep(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinSnapshotsToKeep", []))

    @builtins.property
    @jsii.member(jsii_name="maxSnapshotAgeHoursInput")
    def max_snapshot_age_hours_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxSnapshotAgeHoursInput"))

    @builtins.property
    @jsii.member(jsii_name="minSnapshotsToKeepInput")
    def min_snapshots_to_keep_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minSnapshotsToKeepInput"))

    @builtins.property
    @jsii.member(jsii_name="maxSnapshotAgeHours")
    def max_snapshot_age_hours(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxSnapshotAgeHours"))

    @max_snapshot_age_hours.setter
    def max_snapshot_age_hours(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f35038f2afd336755a142f0d5a3b92c04d81853e809fc6a1bf603bd962e46e96)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxSnapshotAgeHours", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minSnapshotsToKeep")
    def min_snapshots_to_keep(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minSnapshotsToKeep"))

    @min_snapshots_to_keep.setter
    def min_snapshots_to_keep(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09526191d1083744903fda7de31e66ef04c5c63c124ad3fd8f4e9b53f6d4924c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minSnapshotsToKeep", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__70e6ef47d5431a3605c922f79e98cee00022213669a7cf28edd5d96249039674)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class S3TablesTableMaintenanceConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.s3TablesTable.S3TablesTableMaintenanceConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e621eca5701448cd58b3d72f85a1bda5dc13bdaa58de015d738aafdb0286a786)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putIcebergCompaction")
    def put_iceberg_compaction(
        self,
        *,
        settings: typing.Optional[typing.Union[S3TablesTableMaintenanceConfigurationIcebergCompactionSettings, typing.Dict[builtins.str, typing.Any]]] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param settings: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#settings S3TablesTable#settings}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#status S3TablesTable#status}.
        '''
        value = S3TablesTableMaintenanceConfigurationIcebergCompaction(
            settings=settings, status=status
        )

        return typing.cast(None, jsii.invoke(self, "putIcebergCompaction", [value]))

    @jsii.member(jsii_name="putIcebergSnapshotManagement")
    def put_iceberg_snapshot_management(
        self,
        *,
        settings: typing.Optional[typing.Union[S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings, typing.Dict[builtins.str, typing.Any]]] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param settings: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#settings S3TablesTable#settings}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#status S3TablesTable#status}.
        '''
        value = S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement(
            settings=settings, status=status
        )

        return typing.cast(None, jsii.invoke(self, "putIcebergSnapshotManagement", [value]))

    @jsii.member(jsii_name="resetIcebergCompaction")
    def reset_iceberg_compaction(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIcebergCompaction", []))

    @jsii.member(jsii_name="resetIcebergSnapshotManagement")
    def reset_iceberg_snapshot_management(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIcebergSnapshotManagement", []))

    @builtins.property
    @jsii.member(jsii_name="icebergCompaction")
    def iceberg_compaction(
        self,
    ) -> S3TablesTableMaintenanceConfigurationIcebergCompactionOutputReference:
        return typing.cast(S3TablesTableMaintenanceConfigurationIcebergCompactionOutputReference, jsii.get(self, "icebergCompaction"))

    @builtins.property
    @jsii.member(jsii_name="icebergSnapshotManagement")
    def iceberg_snapshot_management(
        self,
    ) -> S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementOutputReference:
        return typing.cast(S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementOutputReference, jsii.get(self, "icebergSnapshotManagement"))

    @builtins.property
    @jsii.member(jsii_name="icebergCompactionInput")
    def iceberg_compaction_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergCompaction]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergCompaction]], jsii.get(self, "icebergCompactionInput"))

    @builtins.property
    @jsii.member(jsii_name="icebergSnapshotManagementInput")
    def iceberg_snapshot_management_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement]], jsii.get(self, "icebergSnapshotManagementInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a0aab7ebf5fb6bc7cb4be150827b92eee299071d079bf973b707453b92c1f29)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "S3TablesTable",
    "S3TablesTableConfig",
    "S3TablesTableEncryptionConfiguration",
    "S3TablesTableEncryptionConfigurationOutputReference",
    "S3TablesTableMaintenanceConfiguration",
    "S3TablesTableMaintenanceConfigurationIcebergCompaction",
    "S3TablesTableMaintenanceConfigurationIcebergCompactionOutputReference",
    "S3TablesTableMaintenanceConfigurationIcebergCompactionSettings",
    "S3TablesTableMaintenanceConfigurationIcebergCompactionSettingsOutputReference",
    "S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement",
    "S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementOutputReference",
    "S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings",
    "S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettingsOutputReference",
    "S3TablesTableMaintenanceConfigurationOutputReference",
]

publication.publish()

def _typecheckingstub__3ed8443973ce309a3196764fbeb2d619cb662ea877d898cb4f8db4c122f91902(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    format: builtins.str,
    name: builtins.str,
    namespace: builtins.str,
    table_bucket_arn: builtins.str,
    encryption_configuration: typing.Optional[typing.Union[S3TablesTableEncryptionConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    maintenance_configuration: typing.Optional[typing.Union[S3TablesTableMaintenanceConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__829c8ea46d9f36f245b165c29e309f12a2c339a0542245e24ff725890dc1eb95(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf4c843a45ff0af613165033d1664c85736c5452c593299daf97d51b6ac4aa6b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4c061492b3528b550ed2f3a3af4c3f0c72d41e81c9e9029d76b2a11d92dce41(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9ab587c7a95741eefa89b94916b4005766775e60b16d0fdba7b3501481d14ac(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f13c4f7c4bb3cbf2b1e4d076dbe7c7fb2aa41350b0e90fc2249a6d7bd71f313(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b308bf8b5b733dc96a4c1456e68d520391979d27c8671ccc1afa6092f14b459d(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    format: builtins.str,
    name: builtins.str,
    namespace: builtins.str,
    table_bucket_arn: builtins.str,
    encryption_configuration: typing.Optional[typing.Union[S3TablesTableEncryptionConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    maintenance_configuration: typing.Optional[typing.Union[S3TablesTableMaintenanceConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01022728d43e934b9d77d05a20ad2522e54a26b2fd5a02c5153d88901389f09b(
    *,
    kms_key_arn: typing.Optional[builtins.str] = None,
    sse_algorithm: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e42792530184394a226298c9fe520f8b643683f5027f9d786c785ac1006325e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4a16756333d368c0820097ec83a521317c6c725cbed602a5d4e36e55c615369(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8402276dfe6fac1a5e6cf081c2e7b021dd99a4e51d6c8eabc77cae3c19e96ac9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f464545aca7b522f2166168bb376b5b093c23eee403a7e679c20c554742f71cf(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableEncryptionConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5db3904dc8d8514d3e7c812f7c4d7fa35d070b8344f2c76081fafbaff94549c(
    *,
    iceberg_compaction: typing.Optional[typing.Union[S3TablesTableMaintenanceConfigurationIcebergCompaction, typing.Dict[builtins.str, typing.Any]]] = None,
    iceberg_snapshot_management: typing.Optional[typing.Union[S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5af3610b38fd27b73cbd5f7f7b6ed105aa8c38e295bba22f715162774bba6a8d(
    *,
    settings: typing.Optional[typing.Union[S3TablesTableMaintenanceConfigurationIcebergCompactionSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7544ac20aa788a7f849a8007590a534ce503f981b9ad3114c781d1d52f38da43(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__678b30674698b9c79da23f80716723558c2ca4cab91c0301d0b946b0b779df9d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5abdf753e4da8ab78e7c02ddffb856c5af418277e97ae6a3439eb2d839ccf66d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergCompaction]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e471e2f799a9fff08735b54db62689449022a7400e1cbbf4cdee9770505ee5c(
    *,
    target_file_size_mb: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b44cfb9b75bc769fec0ab2172067aa647b255a9042b674fd7cdc793d981dcb20(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa2fdd995eb38cfa84f8c86a4a705362a1d099a63510b385dc338d3708e2bf80(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bad74bc1a3c469fb89d0afc84759b44f8543e3ca7ee0aa508d89c6bb874ebfb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergCompactionSettings]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2969670d456425cc14c5bc5b88e99744abed5eff6e3eeee0159015f3fdee01bf(
    *,
    settings: typing.Optional[typing.Union[S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8784dab3a97f6968d0eb53d85919ccb631ec65a59eb3e347b907c5dd9546932e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__309bb691fdf627b20f1fe25700f163f5171b7b176242c1fb16fd1460a4be6f20(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ddf10fb18605e639f62cc45207f30b0b206657e57eea2a24aa2d41ffc02e2d8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27f66e934a1d56f5ac3386014f08cd0e12bdb5165b9a3242a450382b2859a827(
    *,
    max_snapshot_age_hours: typing.Optional[jsii.Number] = None,
    min_snapshots_to_keep: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ccb5d4714fe1fb549e3c255bd5d8c248c331ddf97c8f7f1aab0d52ba9f85308a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f35038f2afd336755a142f0d5a3b92c04d81853e809fc6a1bf603bd962e46e96(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09526191d1083744903fda7de31e66ef04c5c63c124ad3fd8f4e9b53f6d4924c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70e6ef47d5431a3605c922f79e98cee00022213669a7cf28edd5d96249039674(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e621eca5701448cd58b3d72f85a1bda5dc13bdaa58de015d738aafdb0286a786(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a0aab7ebf5fb6bc7cb4be150827b92eee299071d079bf973b707453b92c1f29(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, S3TablesTableMaintenanceConfiguration]],
) -> None:
    """Type checking stubs"""
    pass
