r'''
# `aws_glue_catalog_table_optimizer`

Refer to the Terraform Registry for docs: [`aws_glue_catalog_table_optimizer`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer).
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


class GlueCatalogTableOptimizer(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizer",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer aws_glue_catalog_table_optimizer}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        catalog_id: builtins.str,
        database_name: builtins.str,
        table_name: builtins.str,
        type: builtins.str,
        configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["GlueCatalogTableOptimizerConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer aws_glue_catalog_table_optimizer} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param catalog_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#catalog_id GlueCatalogTableOptimizer#catalog_id}.
        :param database_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#database_name GlueCatalogTableOptimizer#database_name}.
        :param table_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#table_name GlueCatalogTableOptimizer#table_name}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#type GlueCatalogTableOptimizer#type}.
        :param configuration: configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#configuration GlueCatalogTableOptimizer#configuration}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b4483bcf77cde969faad61f94671a547d693929b682fa391c83e788b7fcd7a2)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = GlueCatalogTableOptimizerConfig(
            catalog_id=catalog_id,
            database_name=database_name,
            table_name=table_name,
            type=type,
            configuration=configuration,
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
        '''Generates CDKTF code for importing a GlueCatalogTableOptimizer resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the GlueCatalogTableOptimizer to import.
        :param import_from_id: The id of the existing GlueCatalogTableOptimizer that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the GlueCatalogTableOptimizer to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9c41c31dbc44850fe90723a82f187fd8c89a57be2e4ee1f8069bfeb0421af215)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putConfiguration")
    def put_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["GlueCatalogTableOptimizerConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__062b5aaf3790880ee2a46fa32f1948217e8529ea6bd843b6ad3aa72531802486)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putConfiguration", [value]))

    @jsii.member(jsii_name="resetConfiguration")
    def reset_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConfiguration", []))

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
    @jsii.member(jsii_name="configuration")
    def configuration(self) -> "GlueCatalogTableOptimizerConfigurationList":
        return typing.cast("GlueCatalogTableOptimizerConfigurationList", jsii.get(self, "configuration"))

    @builtins.property
    @jsii.member(jsii_name="catalogIdInput")
    def catalog_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "catalogIdInput"))

    @builtins.property
    @jsii.member(jsii_name="configurationInput")
    def configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfiguration"]]], jsii.get(self, "configurationInput"))

    @builtins.property
    @jsii.member(jsii_name="databaseNameInput")
    def database_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "databaseNameInput"))

    @builtins.property
    @jsii.member(jsii_name="tableNameInput")
    def table_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "tableNameInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="catalogId")
    def catalog_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "catalogId"))

    @catalog_id.setter
    def catalog_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ce1291eb7bb765f39b1eea997f4659a7406c15b3f1fa84a9880c958a403c94c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "catalogId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="databaseName")
    def database_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "databaseName"))

    @database_name.setter
    def database_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e28ea5b7d4447faade6341a1746ce7935abf69a6f9e8414810f930ab5ae76b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "databaseName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tableName")
    def table_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tableName"))

    @table_name.setter
    def table_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d67d92bffeac0e8a0e5e5079c650c6b797729fd8f2f5172b37c38c08c45df99f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tableName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__739478631777854ff30e3f39643d95ff31681f9c858d01d1b3f8168b7de1000b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "catalog_id": "catalogId",
        "database_name": "databaseName",
        "table_name": "tableName",
        "type": "type",
        "configuration": "configuration",
    },
)
class GlueCatalogTableOptimizerConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        catalog_id: builtins.str,
        database_name: builtins.str,
        table_name: builtins.str,
        type: builtins.str,
        configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["GlueCatalogTableOptimizerConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param catalog_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#catalog_id GlueCatalogTableOptimizer#catalog_id}.
        :param database_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#database_name GlueCatalogTableOptimizer#database_name}.
        :param table_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#table_name GlueCatalogTableOptimizer#table_name}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#type GlueCatalogTableOptimizer#type}.
        :param configuration: configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#configuration GlueCatalogTableOptimizer#configuration}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a08636c1619787ddbef42ab2a4d40084106f8b665cbe708d19ceaa7800a0e5b2)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument catalog_id", value=catalog_id, expected_type=type_hints["catalog_id"])
            check_type(argname="argument database_name", value=database_name, expected_type=type_hints["database_name"])
            check_type(argname="argument table_name", value=table_name, expected_type=type_hints["table_name"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument configuration", value=configuration, expected_type=type_hints["configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "catalog_id": catalog_id,
            "database_name": database_name,
            "table_name": table_name,
            "type": type,
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
        if configuration is not None:
            self._values["configuration"] = configuration

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
    def catalog_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#catalog_id GlueCatalogTableOptimizer#catalog_id}.'''
        result = self._values.get("catalog_id")
        assert result is not None, "Required property 'catalog_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def database_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#database_name GlueCatalogTableOptimizer#database_name}.'''
        result = self._values.get("database_name")
        assert result is not None, "Required property 'database_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def table_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#table_name GlueCatalogTableOptimizer#table_name}.'''
        result = self._values.get("table_name")
        assert result is not None, "Required property 'table_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#type GlueCatalogTableOptimizer#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfiguration"]]]:
        '''configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#configuration GlueCatalogTableOptimizer#configuration}
        '''
        result = self._values.get("configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfiguration"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "GlueCatalogTableOptimizerConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "enabled": "enabled",
        "role_arn": "roleArn",
        "orphan_file_deletion_configuration": "orphanFileDeletionConfiguration",
        "retention_configuration": "retentionConfiguration",
    },
)
class GlueCatalogTableOptimizerConfiguration:
    def __init__(
        self,
        *,
        enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        role_arn: builtins.str,
        orphan_file_deletion_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        retention_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["GlueCatalogTableOptimizerConfigurationRetentionConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#enabled GlueCatalogTableOptimizer#enabled}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#role_arn GlueCatalogTableOptimizer#role_arn}.
        :param orphan_file_deletion_configuration: orphan_file_deletion_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#orphan_file_deletion_configuration GlueCatalogTableOptimizer#orphan_file_deletion_configuration}
        :param retention_configuration: retention_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#retention_configuration GlueCatalogTableOptimizer#retention_configuration}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cff093e639c6d90bb8e5711bfd353de29577947813877305f5461100373e83ea)
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument orphan_file_deletion_configuration", value=orphan_file_deletion_configuration, expected_type=type_hints["orphan_file_deletion_configuration"])
            check_type(argname="argument retention_configuration", value=retention_configuration, expected_type=type_hints["retention_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "enabled": enabled,
            "role_arn": role_arn,
        }
        if orphan_file_deletion_configuration is not None:
            self._values["orphan_file_deletion_configuration"] = orphan_file_deletion_configuration
        if retention_configuration is not None:
            self._values["retention_configuration"] = retention_configuration

    @builtins.property
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#enabled GlueCatalogTableOptimizer#enabled}.'''
        result = self._values.get("enabled")
        assert result is not None, "Required property 'enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#role_arn GlueCatalogTableOptimizer#role_arn}.'''
        result = self._values.get("role_arn")
        assert result is not None, "Required property 'role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def orphan_file_deletion_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration"]]]:
        '''orphan_file_deletion_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#orphan_file_deletion_configuration GlueCatalogTableOptimizer#orphan_file_deletion_configuration}
        '''
        result = self._values.get("orphan_file_deletion_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration"]]], result)

    @builtins.property
    def retention_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfigurationRetentionConfiguration"]]]:
        '''retention_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#retention_configuration GlueCatalogTableOptimizer#retention_configuration}
        '''
        result = self._values.get("retention_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfigurationRetentionConfiguration"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "GlueCatalogTableOptimizerConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class GlueCatalogTableOptimizerConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ab7a65f59f3868dac5a13b2aa22519f5021d6fce998ca2a96053ee33e659df01)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "GlueCatalogTableOptimizerConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22ff3c4d053cbfaa84645d11be7b4aaec6544b39a594d6e9b3a548bdf396b308)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("GlueCatalogTableOptimizerConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9ac223998883a463d625581b3f3239779cfedd226674bbaa29cffc345661c46)
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
            type_hints = typing.get_type_hints(_typecheckingstub__61f9d70dd0d71be43037bf02ff762ccbac82f68f16218c1bdab42b2a0c9f73de)
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
            type_hints = typing.get_type_hints(_typecheckingstub__266ed7f143d5533b3f4b8d80493cd30ce5fa1a97bd928588aca9b16c6bde25b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fff36fba33c6d8f915c14d0978e6dbe5223c904eaa5b6e675f31d1e60b5373ae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration",
    jsii_struct_bases=[],
    name_mapping={"iceberg_configuration": "icebergConfiguration"},
)
class GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration:
    def __init__(
        self,
        *,
        iceberg_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param iceberg_configuration: iceberg_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#iceberg_configuration GlueCatalogTableOptimizer#iceberg_configuration}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c797a7ff14ba26682e76cec8344196166512d8a867a4e82660c3d9c7d46150c)
            check_type(argname="argument iceberg_configuration", value=iceberg_configuration, expected_type=type_hints["iceberg_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if iceberg_configuration is not None:
            self._values["iceberg_configuration"] = iceberg_configuration

    @builtins.property
    def iceberg_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration"]]]:
        '''iceberg_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#iceberg_configuration GlueCatalogTableOptimizer#iceberg_configuration}
        '''
        result = self._values.get("iceberg_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "location": "location",
        "orphan_file_retention_period_in_days": "orphanFileRetentionPeriodInDays",
    },
)
class GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration:
    def __init__(
        self,
        *,
        location: typing.Optional[builtins.str] = None,
        orphan_file_retention_period_in_days: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param location: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#location GlueCatalogTableOptimizer#location}.
        :param orphan_file_retention_period_in_days: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#orphan_file_retention_period_in_days GlueCatalogTableOptimizer#orphan_file_retention_period_in_days}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6cf9cc66fb00ad3863e60ff464941554fc5aa3f5b9596f5e541652edd6a07a69)
            check_type(argname="argument location", value=location, expected_type=type_hints["location"])
            check_type(argname="argument orphan_file_retention_period_in_days", value=orphan_file_retention_period_in_days, expected_type=type_hints["orphan_file_retention_period_in_days"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if location is not None:
            self._values["location"] = location
        if orphan_file_retention_period_in_days is not None:
            self._values["orphan_file_retention_period_in_days"] = orphan_file_retention_period_in_days

    @builtins.property
    def location(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#location GlueCatalogTableOptimizer#location}.'''
        result = self._values.get("location")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def orphan_file_retention_period_in_days(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#orphan_file_retention_period_in_days GlueCatalogTableOptimizer#orphan_file_retention_period_in_days}.'''
        result = self._values.get("orphan_file_retention_period_in_days")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__faccddaac86b9b13f3a39c5709e95e960e0c58a376e22d3058e4425efd732eff)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b13717481aa4ce0d1bbe4ed1087272fdc36c0facb54d85ccfa198bb8a29ea507)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bdc08167b45e181c6f34846e5bf4fa78e057eea35a2ebb1ac6f3997f46f8b83f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c6553ebbc61944fa3a3712285ebed5ef669bde5472d0894be9c1c5d7461dddc9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__56418df04f13af50d875954ec0b3c99274e37d362a5d83e42b9464c4ada6d8fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c55d4e99f176bf4b0f529548079be00c81a337286e1cfbec58a1cad6865f348a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8d0751e262cd1f20a7d0b4e516d7cded70a77f851e2560ff95c7ea472c8ff8b5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetLocation")
    def reset_location(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLocation", []))

    @jsii.member(jsii_name="resetOrphanFileRetentionPeriodInDays")
    def reset_orphan_file_retention_period_in_days(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOrphanFileRetentionPeriodInDays", []))

    @builtins.property
    @jsii.member(jsii_name="locationInput")
    def location_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "locationInput"))

    @builtins.property
    @jsii.member(jsii_name="orphanFileRetentionPeriodInDaysInput")
    def orphan_file_retention_period_in_days_input(
        self,
    ) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "orphanFileRetentionPeriodInDaysInput"))

    @builtins.property
    @jsii.member(jsii_name="location")
    def location(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "location"))

    @location.setter
    def location(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__10d9ae85700a8d8df1002d20422c9f22fbc69c406e55adbffa087602f87b5f57)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "location", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="orphanFileRetentionPeriodInDays")
    def orphan_file_retention_period_in_days(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "orphanFileRetentionPeriodInDays"))

    @orphan_file_retention_period_in_days.setter
    def orphan_file_retention_period_in_days(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fae0c72305ac2cd775d0ba775d4560e4f13192a894dd134c0f4d14f911fe39a7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "orphanFileRetentionPeriodInDays", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6107e1b517fbd1b3b984ff336d3a2611f42944da961a5e52beafebae8ff1f1c0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7c48599cc1a975f1a11afada0793d383b4f26507aab3fad3638f6aa66cb1b8c9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__29fcdb0f0fe0704c44499321e1d4cb7262b50604790af341908fc5915a492fa6)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e7981645d9dbff5f5714ff41709e225670eb81710798d204aab2b62acc051d5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7da0192440d4896e7296f13836ec8fe8f64c573fb51a5b865217588351d3c76c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__09da7dd83070583c9d5e22492d84f5458d877c3a00f8b390cf46705314151856)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__117b256f99978b6945cfabbc1c7aa4f995877c08c3dcb8d74d4e211968b967b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__286446038f658dd726ea4858d49ea3d9f554c01c276d6ff962c0114cbca16991)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putIcebergConfiguration")
    def put_iceberg_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5033b8ed71037a46d27e7d70bda5577cbb10f351cbf762caf274473cb405100a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putIcebergConfiguration", [value]))

    @jsii.member(jsii_name="resetIcebergConfiguration")
    def reset_iceberg_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIcebergConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="icebergConfiguration")
    def iceberg_configuration(
        self,
    ) -> GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfigurationList:
        return typing.cast(GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfigurationList, jsii.get(self, "icebergConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="icebergConfigurationInput")
    def iceberg_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration]]], jsii.get(self, "icebergConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__913ac23a6f9d49cd7e0966559b98d4ab244aa56ee8f57289f08a25f6174ae0b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class GlueCatalogTableOptimizerConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__88d607983308b6589dc139da07f19c33f1764a3cc168f1507d81b6c86017d790)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putOrphanFileDeletionConfiguration")
    def put_orphan_file_deletion_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a0259489db37d79f9705bcd24c549a546a1e223f1ba936c1c5869938c9c5e95)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putOrphanFileDeletionConfiguration", [value]))

    @jsii.member(jsii_name="putRetentionConfiguration")
    def put_retention_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["GlueCatalogTableOptimizerConfigurationRetentionConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__54fe6ec272e59c7d64639696072cc16fec8a8b0096924aaf539d2ef889a87680)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRetentionConfiguration", [value]))

    @jsii.member(jsii_name="resetOrphanFileDeletionConfiguration")
    def reset_orphan_file_deletion_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOrphanFileDeletionConfiguration", []))

    @jsii.member(jsii_name="resetRetentionConfiguration")
    def reset_retention_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRetentionConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="orphanFileDeletionConfiguration")
    def orphan_file_deletion_configuration(
        self,
    ) -> GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationList:
        return typing.cast(GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationList, jsii.get(self, "orphanFileDeletionConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="retentionConfiguration")
    def retention_configuration(
        self,
    ) -> "GlueCatalogTableOptimizerConfigurationRetentionConfigurationList":
        return typing.cast("GlueCatalogTableOptimizerConfigurationRetentionConfigurationList", jsii.get(self, "retentionConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="orphanFileDeletionConfigurationInput")
    def orphan_file_deletion_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration]]], jsii.get(self, "orphanFileDeletionConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="retentionConfigurationInput")
    def retention_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfigurationRetentionConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfigurationRetentionConfiguration"]]], jsii.get(self, "retentionConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="enabled")
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enabled"))

    @enabled.setter
    def enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__161fd519e5d2dcc17cc3df5d97cbdcdb8f0c6c07c118cc2c652de3cd269466d7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1e4212aab1316a15abf410f489e2b1841f8294fd920ee3f7a2c78494a11fe38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d93143a15e75b76ee3255f1387cb53e269ffc0692f4409e4115b70ec5d3e6d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfiguration",
    jsii_struct_bases=[],
    name_mapping={"iceberg_configuration": "icebergConfiguration"},
)
class GlueCatalogTableOptimizerConfigurationRetentionConfiguration:
    def __init__(
        self,
        *,
        iceberg_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param iceberg_configuration: iceberg_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#iceberg_configuration GlueCatalogTableOptimizer#iceberg_configuration}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37c31ef673be1576762dd5715b102cc0df68f43870e19c752df833a25ee5d000)
            check_type(argname="argument iceberg_configuration", value=iceberg_configuration, expected_type=type_hints["iceberg_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if iceberg_configuration is not None:
            self._values["iceberg_configuration"] = iceberg_configuration

    @builtins.property
    def iceberg_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration"]]]:
        '''iceberg_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#iceberg_configuration GlueCatalogTableOptimizer#iceberg_configuration}
        '''
        result = self._values.get("iceberg_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "GlueCatalogTableOptimizerConfigurationRetentionConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "clean_expired_files": "cleanExpiredFiles",
        "number_of_snapshots_to_retain": "numberOfSnapshotsToRetain",
        "snapshot_retention_period_in_days": "snapshotRetentionPeriodInDays",
    },
)
class GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration:
    def __init__(
        self,
        *,
        clean_expired_files: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        number_of_snapshots_to_retain: typing.Optional[jsii.Number] = None,
        snapshot_retention_period_in_days: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param clean_expired_files: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#clean_expired_files GlueCatalogTableOptimizer#clean_expired_files}.
        :param number_of_snapshots_to_retain: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#number_of_snapshots_to_retain GlueCatalogTableOptimizer#number_of_snapshots_to_retain}.
        :param snapshot_retention_period_in_days: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#snapshot_retention_period_in_days GlueCatalogTableOptimizer#snapshot_retention_period_in_days}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15fe78083b311bc26f0df64e0a684fc935109b3664d65eabb30b8d3450ab7c6c)
            check_type(argname="argument clean_expired_files", value=clean_expired_files, expected_type=type_hints["clean_expired_files"])
            check_type(argname="argument number_of_snapshots_to_retain", value=number_of_snapshots_to_retain, expected_type=type_hints["number_of_snapshots_to_retain"])
            check_type(argname="argument snapshot_retention_period_in_days", value=snapshot_retention_period_in_days, expected_type=type_hints["snapshot_retention_period_in_days"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if clean_expired_files is not None:
            self._values["clean_expired_files"] = clean_expired_files
        if number_of_snapshots_to_retain is not None:
            self._values["number_of_snapshots_to_retain"] = number_of_snapshots_to_retain
        if snapshot_retention_period_in_days is not None:
            self._values["snapshot_retention_period_in_days"] = snapshot_retention_period_in_days

    @builtins.property
    def clean_expired_files(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#clean_expired_files GlueCatalogTableOptimizer#clean_expired_files}.'''
        result = self._values.get("clean_expired_files")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def number_of_snapshots_to_retain(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#number_of_snapshots_to_retain GlueCatalogTableOptimizer#number_of_snapshots_to_retain}.'''
        result = self._values.get("number_of_snapshots_to_retain")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def snapshot_retention_period_in_days(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#snapshot_retention_period_in_days GlueCatalogTableOptimizer#snapshot_retention_period_in_days}.'''
        result = self._values.get("snapshot_retention_period_in_days")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__60d97d9a20aeb9fce62987c044ee4ee36edd42d6732e44aa4d908a59aff9b1bb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__443d01e1ddf50a8618a9bfdbdc8481c62bbd7d34f9b8a6914c3b2d69ba7013ab)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c972adfd71436d2f9217fb8977541afa4415882c4196a75859ceeabee5d5ed2e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__96b98f9ce96ce46741b26850141bd9a1981246f39f030238e6ee46e8096c6114)
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
            type_hints = typing.get_type_hints(_typecheckingstub__785ee33094850d89223ff5a3d91ad273c6618a606d6cde0dfe753808d027b50a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3bb7f00a458685e413ad4084e499c7d6dc15a58d046cd7779982cb2b24a86954)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6ff7ff9b9430dd504c996b3078144dcc187773a81586ba9a53bb864e5ff4735d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetCleanExpiredFiles")
    def reset_clean_expired_files(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCleanExpiredFiles", []))

    @jsii.member(jsii_name="resetNumberOfSnapshotsToRetain")
    def reset_number_of_snapshots_to_retain(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNumberOfSnapshotsToRetain", []))

    @jsii.member(jsii_name="resetSnapshotRetentionPeriodInDays")
    def reset_snapshot_retention_period_in_days(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSnapshotRetentionPeriodInDays", []))

    @builtins.property
    @jsii.member(jsii_name="cleanExpiredFilesInput")
    def clean_expired_files_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "cleanExpiredFilesInput"))

    @builtins.property
    @jsii.member(jsii_name="numberOfSnapshotsToRetainInput")
    def number_of_snapshots_to_retain_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "numberOfSnapshotsToRetainInput"))

    @builtins.property
    @jsii.member(jsii_name="snapshotRetentionPeriodInDaysInput")
    def snapshot_retention_period_in_days_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "snapshotRetentionPeriodInDaysInput"))

    @builtins.property
    @jsii.member(jsii_name="cleanExpiredFiles")
    def clean_expired_files(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "cleanExpiredFiles"))

    @clean_expired_files.setter
    def clean_expired_files(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f6e13277aa012af51a78e2e423c2653f7e3b64ddb1c875c7d9934de942dc011)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cleanExpiredFiles", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="numberOfSnapshotsToRetain")
    def number_of_snapshots_to_retain(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "numberOfSnapshotsToRetain"))

    @number_of_snapshots_to_retain.setter
    def number_of_snapshots_to_retain(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09132e11ad927f1a4866b92e77575a4abb3eeb62af22732afe58d2385e105170)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "numberOfSnapshotsToRetain", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="snapshotRetentionPeriodInDays")
    def snapshot_retention_period_in_days(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "snapshotRetentionPeriodInDays"))

    @snapshot_retention_period_in_days.setter
    def snapshot_retention_period_in_days(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed70fd41c5995586ef5fe4447e9db0988bdf2442077612485c62521fbd1009e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "snapshotRetentionPeriodInDays", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d35dd1de8760503866eac5efaf1099379349352c7a6dad04a26dd533892bfc8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class GlueCatalogTableOptimizerConfigurationRetentionConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f5fa6982d2707083dcd716cd01aaf5f57c9c38eedd1bf766ef96bdb77dd42794)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "GlueCatalogTableOptimizerConfigurationRetentionConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc45d02fe0c8b37dbb540c4f7ef94b3963f5ae60b6f24fb8caed912087573030)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("GlueCatalogTableOptimizerConfigurationRetentionConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__203dd0a787265bfaa60ccefa45a32da320632637d81e0f31d48e4a619cbbd649)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0b6d3c213ab9e9e4829a3bc16bbf3e0ab5307b8b32dcd80b230a75b7fe76d8f6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c91fa579d6982828473f2062230dcf12471afb4dd44d6b739d6997baeeb6a3ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationRetentionConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationRetentionConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationRetentionConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b0061584016acb69dbc54b74bc58c9cd138739272368fedd6e1679056ada153)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class GlueCatalogTableOptimizerConfigurationRetentionConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b79e34f479ad5529ba5b2e76cb7bdeb2f4a95623220202e13fd65f919ceaa4dc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putIcebergConfiguration")
    def put_iceberg_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0bc91b39c1741a0035f661e489f0c4fe5b5992178d8a5f4a5b5670989dd8bb1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putIcebergConfiguration", [value]))

    @jsii.member(jsii_name="resetIcebergConfiguration")
    def reset_iceberg_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIcebergConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="icebergConfiguration")
    def iceberg_configuration(
        self,
    ) -> GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationList:
        return typing.cast(GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationList, jsii.get(self, "icebergConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="icebergConfigurationInput")
    def iceberg_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration]]], jsii.get(self, "icebergConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationRetentionConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationRetentionConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationRetentionConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a6cee24b2e6889e3abe3fe43157a40c606392a7472efec03abc6c6d393e3403)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "GlueCatalogTableOptimizer",
    "GlueCatalogTableOptimizerConfig",
    "GlueCatalogTableOptimizerConfiguration",
    "GlueCatalogTableOptimizerConfigurationList",
    "GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration",
    "GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration",
    "GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfigurationList",
    "GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfigurationOutputReference",
    "GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationList",
    "GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationOutputReference",
    "GlueCatalogTableOptimizerConfigurationOutputReference",
    "GlueCatalogTableOptimizerConfigurationRetentionConfiguration",
    "GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration",
    "GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationList",
    "GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationOutputReference",
    "GlueCatalogTableOptimizerConfigurationRetentionConfigurationList",
    "GlueCatalogTableOptimizerConfigurationRetentionConfigurationOutputReference",
]

publication.publish()

def _typecheckingstub__0b4483bcf77cde969faad61f94671a547d693929b682fa391c83e788b7fcd7a2(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    catalog_id: builtins.str,
    database_name: builtins.str,
    table_name: builtins.str,
    type: builtins.str,
    configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
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

def _typecheckingstub__9c41c31dbc44850fe90723a82f187fd8c89a57be2e4ee1f8069bfeb0421af215(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__062b5aaf3790880ee2a46fa32f1948217e8529ea6bd843b6ad3aa72531802486(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ce1291eb7bb765f39b1eea997f4659a7406c15b3f1fa84a9880c958a403c94c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e28ea5b7d4447faade6341a1746ce7935abf69a6f9e8414810f930ab5ae76b6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d67d92bffeac0e8a0e5e5079c650c6b797729fd8f2f5172b37c38c08c45df99f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__739478631777854ff30e3f39643d95ff31681f9c858d01d1b3f8168b7de1000b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a08636c1619787ddbef42ab2a4d40084106f8b665cbe708d19ceaa7800a0e5b2(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    catalog_id: builtins.str,
    database_name: builtins.str,
    table_name: builtins.str,
    type: builtins.str,
    configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cff093e639c6d90bb8e5711bfd353de29577947813877305f5461100373e83ea(
    *,
    enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    role_arn: builtins.str,
    orphan_file_deletion_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    retention_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationRetentionConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab7a65f59f3868dac5a13b2aa22519f5021d6fce998ca2a96053ee33e659df01(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22ff3c4d053cbfaa84645d11be7b4aaec6544b39a594d6e9b3a548bdf396b308(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9ac223998883a463d625581b3f3239779cfedd226674bbaa29cffc345661c46(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61f9d70dd0d71be43037bf02ff762ccbac82f68f16218c1bdab42b2a0c9f73de(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__266ed7f143d5533b3f4b8d80493cd30ce5fa1a97bd928588aca9b16c6bde25b6(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fff36fba33c6d8f915c14d0978e6dbe5223c904eaa5b6e675f31d1e60b5373ae(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c797a7ff14ba26682e76cec8344196166512d8a867a4e82660c3d9c7d46150c(
    *,
    iceberg_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6cf9cc66fb00ad3863e60ff464941554fc5aa3f5b9596f5e541652edd6a07a69(
    *,
    location: typing.Optional[builtins.str] = None,
    orphan_file_retention_period_in_days: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__faccddaac86b9b13f3a39c5709e95e960e0c58a376e22d3058e4425efd732eff(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b13717481aa4ce0d1bbe4ed1087272fdc36c0facb54d85ccfa198bb8a29ea507(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdc08167b45e181c6f34846e5bf4fa78e057eea35a2ebb1ac6f3997f46f8b83f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6553ebbc61944fa3a3712285ebed5ef669bde5472d0894be9c1c5d7461dddc9(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56418df04f13af50d875954ec0b3c99274e37d362a5d83e42b9464c4ada6d8fb(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c55d4e99f176bf4b0f529548079be00c81a337286e1cfbec58a1cad6865f348a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d0751e262cd1f20a7d0b4e516d7cded70a77f851e2560ff95c7ea472c8ff8b5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10d9ae85700a8d8df1002d20422c9f22fbc69c406e55adbffa087602f87b5f57(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fae0c72305ac2cd775d0ba775d4560e4f13192a894dd134c0f4d14f911fe39a7(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6107e1b517fbd1b3b984ff336d3a2611f42944da961a5e52beafebae8ff1f1c0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c48599cc1a975f1a11afada0793d383b4f26507aab3fad3638f6aa66cb1b8c9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29fcdb0f0fe0704c44499321e1d4cb7262b50604790af341908fc5915a492fa6(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e7981645d9dbff5f5714ff41709e225670eb81710798d204aab2b62acc051d5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7da0192440d4896e7296f13836ec8fe8f64c573fb51a5b865217588351d3c76c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09da7dd83070583c9d5e22492d84f5458d877c3a00f8b390cf46705314151856(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__117b256f99978b6945cfabbc1c7aa4f995877c08c3dcb8d74d4e211968b967b4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__286446038f658dd726ea4858d49ea3d9f554c01c276d6ff962c0114cbca16991(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5033b8ed71037a46d27e7d70bda5577cbb10f351cbf762caf274473cb405100a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__913ac23a6f9d49cd7e0966559b98d4ab244aa56ee8f57289f08a25f6174ae0b8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88d607983308b6589dc139da07f19c33f1764a3cc168f1507d81b6c86017d790(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a0259489db37d79f9705bcd24c549a546a1e223f1ba936c1c5869938c9c5e95(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54fe6ec272e59c7d64639696072cc16fec8a8b0096924aaf539d2ef889a87680(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationRetentionConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__161fd519e5d2dcc17cc3df5d97cbdcdb8f0c6c07c118cc2c652de3cd269466d7(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1e4212aab1316a15abf410f489e2b1841f8294fd920ee3f7a2c78494a11fe38(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d93143a15e75b76ee3255f1387cb53e269ffc0692f4409e4115b70ec5d3e6d6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37c31ef673be1576762dd5715b102cc0df68f43870e19c752df833a25ee5d000(
    *,
    iceberg_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15fe78083b311bc26f0df64e0a684fc935109b3664d65eabb30b8d3450ab7c6c(
    *,
    clean_expired_files: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    number_of_snapshots_to_retain: typing.Optional[jsii.Number] = None,
    snapshot_retention_period_in_days: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60d97d9a20aeb9fce62987c044ee4ee36edd42d6732e44aa4d908a59aff9b1bb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__443d01e1ddf50a8618a9bfdbdc8481c62bbd7d34f9b8a6914c3b2d69ba7013ab(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c972adfd71436d2f9217fb8977541afa4415882c4196a75859ceeabee5d5ed2e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96b98f9ce96ce46741b26850141bd9a1981246f39f030238e6ee46e8096c6114(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__785ee33094850d89223ff5a3d91ad273c6618a606d6cde0dfe753808d027b50a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3bb7f00a458685e413ad4084e499c7d6dc15a58d046cd7779982cb2b24a86954(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ff7ff9b9430dd504c996b3078144dcc187773a81586ba9a53bb864e5ff4735d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f6e13277aa012af51a78e2e423c2653f7e3b64ddb1c875c7d9934de942dc011(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09132e11ad927f1a4866b92e77575a4abb3eeb62af22732afe58d2385e105170(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed70fd41c5995586ef5fe4447e9db0988bdf2442077612485c62521fbd1009e3(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d35dd1de8760503866eac5efaf1099379349352c7a6dad04a26dd533892bfc8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5fa6982d2707083dcd716cd01aaf5f57c9c38eedd1bf766ef96bdb77dd42794(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc45d02fe0c8b37dbb540c4f7ef94b3963f5ae60b6f24fb8caed912087573030(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__203dd0a787265bfaa60ccefa45a32da320632637d81e0f31d48e4a619cbbd649(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b6d3c213ab9e9e4829a3bc16bbf3e0ab5307b8b32dcd80b230a75b7fe76d8f6(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c91fa579d6982828473f2062230dcf12471afb4dd44d6b739d6997baeeb6a3ac(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b0061584016acb69dbc54b74bc58c9cd138739272368fedd6e1679056ada153(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[GlueCatalogTableOptimizerConfigurationRetentionConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b79e34f479ad5529ba5b2e76cb7bdeb2f4a95623220202e13fd65f919ceaa4dc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0bc91b39c1741a0035f661e489f0c4fe5b5992178d8a5f4a5b5670989dd8bb1(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a6cee24b2e6889e3abe3fe43157a40c606392a7472efec03abc6c6d393e3403(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, GlueCatalogTableOptimizerConfigurationRetentionConfiguration]],
) -> None:
    """Type checking stubs"""
    pass
