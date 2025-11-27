r'''
# `aws_quicksight_data_set`

Refer to the Terraform Registry for docs: [`aws_quicksight_data_set`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set).
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


class QuicksightDataSet(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSet",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set aws_quicksight_data_set}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        data_set_id: builtins.str,
        import_mode: builtins.str,
        name: builtins.str,
        aws_account_id: typing.Optional[builtins.str] = None,
        column_groups: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetColumnGroups", typing.Dict[builtins.str, typing.Any]]]]] = None,
        column_level_permission_rules: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetColumnLevelPermissionRules", typing.Dict[builtins.str, typing.Any]]]]] = None,
        data_set_usage_configuration: typing.Optional[typing.Union["QuicksightDataSetDataSetUsageConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        field_folders: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetFieldFolders", typing.Dict[builtins.str, typing.Any]]]]] = None,
        id: typing.Optional[builtins.str] = None,
        logical_table_map: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetLogicalTableMap", typing.Dict[builtins.str, typing.Any]]]]] = None,
        permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPermissions", typing.Dict[builtins.str, typing.Any]]]]] = None,
        physical_table_map: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPhysicalTableMap", typing.Dict[builtins.str, typing.Any]]]]] = None,
        refresh_properties: typing.Optional[typing.Union["QuicksightDataSetRefreshProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        row_level_permission_data_set: typing.Optional[typing.Union["QuicksightDataSetRowLevelPermissionDataSet", typing.Dict[builtins.str, typing.Any]]] = None,
        row_level_permission_tag_configuration: typing.Optional[typing.Union["QuicksightDataSetRowLevelPermissionTagConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set aws_quicksight_data_set} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param data_set_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_id QuicksightDataSet#data_set_id}.
        :param import_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#import_mode QuicksightDataSet#import_mode}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        :param aws_account_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#aws_account_id QuicksightDataSet#aws_account_id}.
        :param column_groups: column_groups block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_groups QuicksightDataSet#column_groups}
        :param column_level_permission_rules: column_level_permission_rules block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_level_permission_rules QuicksightDataSet#column_level_permission_rules}
        :param data_set_usage_configuration: data_set_usage_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_usage_configuration QuicksightDataSet#data_set_usage_configuration}
        :param field_folders: field_folders block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders QuicksightDataSet#field_folders}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#id QuicksightDataSet#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param logical_table_map: logical_table_map block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map QuicksightDataSet#logical_table_map}
        :param permissions: permissions block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permissions QuicksightDataSet#permissions}
        :param physical_table_map: physical_table_map block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map QuicksightDataSet#physical_table_map}
        :param refresh_properties: refresh_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_properties QuicksightDataSet#refresh_properties}
        :param row_level_permission_data_set: row_level_permission_data_set block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_data_set QuicksightDataSet#row_level_permission_data_set}
        :param row_level_permission_tag_configuration: row_level_permission_tag_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_tag_configuration QuicksightDataSet#row_level_permission_tag_configuration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags_all QuicksightDataSet#tags_all}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__80cfae33304e1e5cf43b234196d83b822ff98e1f651108aad06ff39a56150eac)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = QuicksightDataSetConfig(
            data_set_id=data_set_id,
            import_mode=import_mode,
            name=name,
            aws_account_id=aws_account_id,
            column_groups=column_groups,
            column_level_permission_rules=column_level_permission_rules,
            data_set_usage_configuration=data_set_usage_configuration,
            field_folders=field_folders,
            id=id,
            logical_table_map=logical_table_map,
            permissions=permissions,
            physical_table_map=physical_table_map,
            refresh_properties=refresh_properties,
            row_level_permission_data_set=row_level_permission_data_set,
            row_level_permission_tag_configuration=row_level_permission_tag_configuration,
            tags=tags,
            tags_all=tags_all,
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
        '''Generates CDKTF code for importing a QuicksightDataSet resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the QuicksightDataSet to import.
        :param import_from_id: The id of the existing QuicksightDataSet that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the QuicksightDataSet to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb5f985fe1c04cd98dfb1569f6942b55decb5207721072bdb6302d66e4fb7736)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putColumnGroups")
    def put_column_groups(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetColumnGroups", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b9e549f23148d11d13946717c910bd62a21801064b78e02d390438221ff1142)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putColumnGroups", [value]))

    @jsii.member(jsii_name="putColumnLevelPermissionRules")
    def put_column_level_permission_rules(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetColumnLevelPermissionRules", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b250922fa581f3cdd0f73fc6379d856433fade879d7176753a07cd4697840719)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putColumnLevelPermissionRules", [value]))

    @jsii.member(jsii_name="putDataSetUsageConfiguration")
    def put_data_set_usage_configuration(
        self,
        *,
        disable_use_as_direct_query_source: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        disable_use_as_imported_source: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param disable_use_as_direct_query_source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_direct_query_source QuicksightDataSet#disable_use_as_direct_query_source}.
        :param disable_use_as_imported_source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_imported_source QuicksightDataSet#disable_use_as_imported_source}.
        '''
        value = QuicksightDataSetDataSetUsageConfiguration(
            disable_use_as_direct_query_source=disable_use_as_direct_query_source,
            disable_use_as_imported_source=disable_use_as_imported_source,
        )

        return typing.cast(None, jsii.invoke(self, "putDataSetUsageConfiguration", [value]))

    @jsii.member(jsii_name="putFieldFolders")
    def put_field_folders(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetFieldFolders", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__28bc24f15b54aadd97ab4f449c6a18fd0dcfef41f48268b300d7690a7c858bde)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFieldFolders", [value]))

    @jsii.member(jsii_name="putLogicalTableMap")
    def put_logical_table_map(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetLogicalTableMap", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__745dde2cfd2e7e817269b8c8ed62ce6382ace75c62d1c160ad664500778785f6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLogicalTableMap", [value]))

    @jsii.member(jsii_name="putPermissions")
    def put_permissions(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPermissions", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4de07cb77c1c0b51cd222189a4d2c79bde08770fd29ee3d15bb9796b9fa88019)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPermissions", [value]))

    @jsii.member(jsii_name="putPhysicalTableMap")
    def put_physical_table_map(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPhysicalTableMap", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ef6e0f05b79cb45e3ec09f701afabf00ad20d75770efa08e8996d8faa13eb38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPhysicalTableMap", [value]))

    @jsii.member(jsii_name="putRefreshProperties")
    def put_refresh_properties(
        self,
        *,
        refresh_configuration: typing.Union["QuicksightDataSetRefreshPropertiesRefreshConfiguration", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param refresh_configuration: refresh_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_configuration QuicksightDataSet#refresh_configuration}
        '''
        value = QuicksightDataSetRefreshProperties(
            refresh_configuration=refresh_configuration
        )

        return typing.cast(None, jsii.invoke(self, "putRefreshProperties", [value]))

    @jsii.member(jsii_name="putRowLevelPermissionDataSet")
    def put_row_level_permission_data_set(
        self,
        *,
        arn: builtins.str,
        permission_policy: builtins.str,
        format_version: typing.Optional[builtins.str] = None,
        namespace: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#arn QuicksightDataSet#arn}.
        :param permission_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permission_policy QuicksightDataSet#permission_policy}.
        :param format_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format_version QuicksightDataSet#format_version}.
        :param namespace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#namespace QuicksightDataSet#namespace}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#status QuicksightDataSet#status}.
        '''
        value = QuicksightDataSetRowLevelPermissionDataSet(
            arn=arn,
            permission_policy=permission_policy,
            format_version=format_version,
            namespace=namespace,
            status=status,
        )

        return typing.cast(None, jsii.invoke(self, "putRowLevelPermissionDataSet", [value]))

    @jsii.member(jsii_name="putRowLevelPermissionTagConfiguration")
    def put_row_level_permission_tag_configuration(
        self,
        *,
        tag_rules: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetRowLevelPermissionTagConfigurationTagRules", typing.Dict[builtins.str, typing.Any]]]],
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param tag_rules: tag_rules block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_rules QuicksightDataSet#tag_rules}
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#status QuicksightDataSet#status}.
        '''
        value = QuicksightDataSetRowLevelPermissionTagConfiguration(
            tag_rules=tag_rules, status=status
        )

        return typing.cast(None, jsii.invoke(self, "putRowLevelPermissionTagConfiguration", [value]))

    @jsii.member(jsii_name="resetAwsAccountId")
    def reset_aws_account_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAwsAccountId", []))

    @jsii.member(jsii_name="resetColumnGroups")
    def reset_column_groups(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetColumnGroups", []))

    @jsii.member(jsii_name="resetColumnLevelPermissionRules")
    def reset_column_level_permission_rules(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetColumnLevelPermissionRules", []))

    @jsii.member(jsii_name="resetDataSetUsageConfiguration")
    def reset_data_set_usage_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataSetUsageConfiguration", []))

    @jsii.member(jsii_name="resetFieldFolders")
    def reset_field_folders(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFieldFolders", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetLogicalTableMap")
    def reset_logical_table_map(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLogicalTableMap", []))

    @jsii.member(jsii_name="resetPermissions")
    def reset_permissions(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPermissions", []))

    @jsii.member(jsii_name="resetPhysicalTableMap")
    def reset_physical_table_map(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPhysicalTableMap", []))

    @jsii.member(jsii_name="resetRefreshProperties")
    def reset_refresh_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRefreshProperties", []))

    @jsii.member(jsii_name="resetRowLevelPermissionDataSet")
    def reset_row_level_permission_data_set(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRowLevelPermissionDataSet", []))

    @jsii.member(jsii_name="resetRowLevelPermissionTagConfiguration")
    def reset_row_level_permission_tag_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRowLevelPermissionTagConfiguration", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

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
    @jsii.member(jsii_name="columnGroups")
    def column_groups(self) -> "QuicksightDataSetColumnGroupsList":
        return typing.cast("QuicksightDataSetColumnGroupsList", jsii.get(self, "columnGroups"))

    @builtins.property
    @jsii.member(jsii_name="columnLevelPermissionRules")
    def column_level_permission_rules(
        self,
    ) -> "QuicksightDataSetColumnLevelPermissionRulesList":
        return typing.cast("QuicksightDataSetColumnLevelPermissionRulesList", jsii.get(self, "columnLevelPermissionRules"))

    @builtins.property
    @jsii.member(jsii_name="dataSetUsageConfiguration")
    def data_set_usage_configuration(
        self,
    ) -> "QuicksightDataSetDataSetUsageConfigurationOutputReference":
        return typing.cast("QuicksightDataSetDataSetUsageConfigurationOutputReference", jsii.get(self, "dataSetUsageConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="fieldFolders")
    def field_folders(self) -> "QuicksightDataSetFieldFoldersList":
        return typing.cast("QuicksightDataSetFieldFoldersList", jsii.get(self, "fieldFolders"))

    @builtins.property
    @jsii.member(jsii_name="logicalTableMap")
    def logical_table_map(self) -> "QuicksightDataSetLogicalTableMapList":
        return typing.cast("QuicksightDataSetLogicalTableMapList", jsii.get(self, "logicalTableMap"))

    @builtins.property
    @jsii.member(jsii_name="outputColumns")
    def output_columns(self) -> "QuicksightDataSetOutputColumnsList":
        return typing.cast("QuicksightDataSetOutputColumnsList", jsii.get(self, "outputColumns"))

    @builtins.property
    @jsii.member(jsii_name="permissions")
    def permissions(self) -> "QuicksightDataSetPermissionsList":
        return typing.cast("QuicksightDataSetPermissionsList", jsii.get(self, "permissions"))

    @builtins.property
    @jsii.member(jsii_name="physicalTableMap")
    def physical_table_map(self) -> "QuicksightDataSetPhysicalTableMapList":
        return typing.cast("QuicksightDataSetPhysicalTableMapList", jsii.get(self, "physicalTableMap"))

    @builtins.property
    @jsii.member(jsii_name="refreshProperties")
    def refresh_properties(self) -> "QuicksightDataSetRefreshPropertiesOutputReference":
        return typing.cast("QuicksightDataSetRefreshPropertiesOutputReference", jsii.get(self, "refreshProperties"))

    @builtins.property
    @jsii.member(jsii_name="rowLevelPermissionDataSet")
    def row_level_permission_data_set(
        self,
    ) -> "QuicksightDataSetRowLevelPermissionDataSetOutputReference":
        return typing.cast("QuicksightDataSetRowLevelPermissionDataSetOutputReference", jsii.get(self, "rowLevelPermissionDataSet"))

    @builtins.property
    @jsii.member(jsii_name="rowLevelPermissionTagConfiguration")
    def row_level_permission_tag_configuration(
        self,
    ) -> "QuicksightDataSetRowLevelPermissionTagConfigurationOutputReference":
        return typing.cast("QuicksightDataSetRowLevelPermissionTagConfigurationOutputReference", jsii.get(self, "rowLevelPermissionTagConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="awsAccountIdInput")
    def aws_account_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "awsAccountIdInput"))

    @builtins.property
    @jsii.member(jsii_name="columnGroupsInput")
    def column_groups_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetColumnGroups"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetColumnGroups"]]], jsii.get(self, "columnGroupsInput"))

    @builtins.property
    @jsii.member(jsii_name="columnLevelPermissionRulesInput")
    def column_level_permission_rules_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetColumnLevelPermissionRules"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetColumnLevelPermissionRules"]]], jsii.get(self, "columnLevelPermissionRulesInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSetIdInput")
    def data_set_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataSetIdInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSetUsageConfigurationInput")
    def data_set_usage_configuration_input(
        self,
    ) -> typing.Optional["QuicksightDataSetDataSetUsageConfiguration"]:
        return typing.cast(typing.Optional["QuicksightDataSetDataSetUsageConfiguration"], jsii.get(self, "dataSetUsageConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="fieldFoldersInput")
    def field_folders_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetFieldFolders"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetFieldFolders"]]], jsii.get(self, "fieldFoldersInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="importModeInput")
    def import_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "importModeInput"))

    @builtins.property
    @jsii.member(jsii_name="logicalTableMapInput")
    def logical_table_map_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMap"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMap"]]], jsii.get(self, "logicalTableMapInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="permissionsInput")
    def permissions_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPermissions"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPermissions"]]], jsii.get(self, "permissionsInput"))

    @builtins.property
    @jsii.member(jsii_name="physicalTableMapInput")
    def physical_table_map_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPhysicalTableMap"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPhysicalTableMap"]]], jsii.get(self, "physicalTableMapInput"))

    @builtins.property
    @jsii.member(jsii_name="refreshPropertiesInput")
    def refresh_properties_input(
        self,
    ) -> typing.Optional["QuicksightDataSetRefreshProperties"]:
        return typing.cast(typing.Optional["QuicksightDataSetRefreshProperties"], jsii.get(self, "refreshPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="rowLevelPermissionDataSetInput")
    def row_level_permission_data_set_input(
        self,
    ) -> typing.Optional["QuicksightDataSetRowLevelPermissionDataSet"]:
        return typing.cast(typing.Optional["QuicksightDataSetRowLevelPermissionDataSet"], jsii.get(self, "rowLevelPermissionDataSetInput"))

    @builtins.property
    @jsii.member(jsii_name="rowLevelPermissionTagConfigurationInput")
    def row_level_permission_tag_configuration_input(
        self,
    ) -> typing.Optional["QuicksightDataSetRowLevelPermissionTagConfiguration"]:
        return typing.cast(typing.Optional["QuicksightDataSetRowLevelPermissionTagConfiguration"], jsii.get(self, "rowLevelPermissionTagConfigurationInput"))

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
    @jsii.member(jsii_name="awsAccountId")
    def aws_account_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "awsAccountId"))

    @aws_account_id.setter
    def aws_account_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f84285f48dc5842e09dbc9328f4e2400ab012c97723b3e29aae6c4927f7091f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "awsAccountId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dataSetId")
    def data_set_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataSetId"))

    @data_set_id.setter
    def data_set_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a512ae84667ac13e4d2d5abbaed24d0da2e869a4f3520f9d4f2869e11cbb5be3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataSetId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__091b60442f92694cd9854fbcae128a8f3c7435f9b2f9f8c2a97014c7f541b371)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="importMode")
    def import_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "importMode"))

    @import_mode.setter
    def import_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7666c47692c08eb2c95d6cf5158cdbd83f0879382f5490bec5a2897459928b27)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "importMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e899c8af7e84747e97eede0488dcdbc75498bbcfc6d52040282d52dcacdcf266)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1dcb99a9b5702fd62128df533ab5eab220b030229a614e3a95179db25b7ae2a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a29d796ae1dca89e2cd79910d7660d064e6ec3e36fef2546f00da997903e11ae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetColumnGroups",
    jsii_struct_bases=[],
    name_mapping={"geo_spatial_column_group": "geoSpatialColumnGroup"},
)
class QuicksightDataSetColumnGroups:
    def __init__(
        self,
        *,
        geo_spatial_column_group: typing.Optional[typing.Union["QuicksightDataSetColumnGroupsGeoSpatialColumnGroup", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param geo_spatial_column_group: geo_spatial_column_group block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#geo_spatial_column_group QuicksightDataSet#geo_spatial_column_group}
        '''
        if isinstance(geo_spatial_column_group, dict):
            geo_spatial_column_group = QuicksightDataSetColumnGroupsGeoSpatialColumnGroup(**geo_spatial_column_group)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__302fb9e8260ba96840268c9a68924a4f48bd5acc19cb3ff20a16974ac174ef06)
            check_type(argname="argument geo_spatial_column_group", value=geo_spatial_column_group, expected_type=type_hints["geo_spatial_column_group"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if geo_spatial_column_group is not None:
            self._values["geo_spatial_column_group"] = geo_spatial_column_group

    @builtins.property
    def geo_spatial_column_group(
        self,
    ) -> typing.Optional["QuicksightDataSetColumnGroupsGeoSpatialColumnGroup"]:
        '''geo_spatial_column_group block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#geo_spatial_column_group QuicksightDataSet#geo_spatial_column_group}
        '''
        result = self._values.get("geo_spatial_column_group")
        return typing.cast(typing.Optional["QuicksightDataSetColumnGroupsGeoSpatialColumnGroup"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetColumnGroups(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetColumnGroupsGeoSpatialColumnGroup",
    jsii_struct_bases=[],
    name_mapping={"columns": "columns", "country_code": "countryCode", "name": "name"},
)
class QuicksightDataSetColumnGroupsGeoSpatialColumnGroup:
    def __init__(
        self,
        *,
        columns: typing.Sequence[builtins.str],
        country_code: builtins.str,
        name: builtins.str,
    ) -> None:
        '''
        :param columns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}.
        :param country_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#country_code QuicksightDataSet#country_code}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eaf140083fd2e30d62f6c18f9c646b7e1a2311b2c16dc383749ee1b86a483eb2)
            check_type(argname="argument columns", value=columns, expected_type=type_hints["columns"])
            check_type(argname="argument country_code", value=country_code, expected_type=type_hints["country_code"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "columns": columns,
            "country_code": country_code,
            "name": name,
        }

    @builtins.property
    def columns(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}.'''
        result = self._values.get("columns")
        assert result is not None, "Required property 'columns' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def country_code(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#country_code QuicksightDataSet#country_code}.'''
        result = self._values.get("country_code")
        assert result is not None, "Required property 'country_code' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetColumnGroupsGeoSpatialColumnGroup(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetColumnGroupsGeoSpatialColumnGroupOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetColumnGroupsGeoSpatialColumnGroupOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__54949bf557b0a70333aa14b9c1a95f2727a5a738d954b1250d60257396e937aa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="columnsInput")
    def columns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "columnsInput"))

    @builtins.property
    @jsii.member(jsii_name="countryCodeInput")
    def country_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="columns")
    def columns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "columns"))

    @columns.setter
    def columns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1612046c7b3ad21fb403c58467b287d194b87442aa63cd4da1353cc17b6c96c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="countryCode")
    def country_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "countryCode"))

    @country_code.setter
    def country_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf7aa6f75051f1ca70dfdc0d595b1247a686ca88da1f9e4af931b8245bf00824)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "countryCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb62bf5aeecdb3e3e89e4a133965c0bda97b62accabf1a4564be7368d1bd1752)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetColumnGroupsGeoSpatialColumnGroup]:
        return typing.cast(typing.Optional[QuicksightDataSetColumnGroupsGeoSpatialColumnGroup], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetColumnGroupsGeoSpatialColumnGroup],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40d837f2338017810892fe52195762996ed20e6a15f60dbf29811d8bab6df052)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetColumnGroupsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetColumnGroupsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__79a90950098d328ed2a219d22bb5ae81816d54ee202bea0d880e840ba0a70c48)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "QuicksightDataSetColumnGroupsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6105848b948487ae793cdf35d47446d598cc588b85249b068582de844b4564e1)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetColumnGroupsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d10d677c97f27fc250b4a0e3062fd14ec9519673d82a95011e13962d3ec0b553)
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
            type_hints = typing.get_type_hints(_typecheckingstub__139e0b1508a4fe77e69d541729937b17598b9a717b6ef71b7fbda3851fe27299)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8979c78f9cb9fb0e2be3a14f7ed9de248f178abc40756ef3ab20ab14c6b7d6ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnGroups]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnGroups]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnGroups]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ac9e5d4bb8223e2ca09101cbd23b67e788003c37a428d1e5441583a4ad7b230)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetColumnGroupsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetColumnGroupsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__01f82b858074e794bef817dcddca1a82cc955b3ffa5a9a39e03ee11749f7be95)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putGeoSpatialColumnGroup")
    def put_geo_spatial_column_group(
        self,
        *,
        columns: typing.Sequence[builtins.str],
        country_code: builtins.str,
        name: builtins.str,
    ) -> None:
        '''
        :param columns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}.
        :param country_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#country_code QuicksightDataSet#country_code}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        '''
        value = QuicksightDataSetColumnGroupsGeoSpatialColumnGroup(
            columns=columns, country_code=country_code, name=name
        )

        return typing.cast(None, jsii.invoke(self, "putGeoSpatialColumnGroup", [value]))

    @jsii.member(jsii_name="resetGeoSpatialColumnGroup")
    def reset_geo_spatial_column_group(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGeoSpatialColumnGroup", []))

    @builtins.property
    @jsii.member(jsii_name="geoSpatialColumnGroup")
    def geo_spatial_column_group(
        self,
    ) -> QuicksightDataSetColumnGroupsGeoSpatialColumnGroupOutputReference:
        return typing.cast(QuicksightDataSetColumnGroupsGeoSpatialColumnGroupOutputReference, jsii.get(self, "geoSpatialColumnGroup"))

    @builtins.property
    @jsii.member(jsii_name="geoSpatialColumnGroupInput")
    def geo_spatial_column_group_input(
        self,
    ) -> typing.Optional[QuicksightDataSetColumnGroupsGeoSpatialColumnGroup]:
        return typing.cast(typing.Optional[QuicksightDataSetColumnGroupsGeoSpatialColumnGroup], jsii.get(self, "geoSpatialColumnGroupInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetColumnGroups]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetColumnGroups]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetColumnGroups]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__98d284317e8bad09caa8cf9d2f178ec2168f6e74b49d08e94524ea79a95e0ab4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetColumnLevelPermissionRules",
    jsii_struct_bases=[],
    name_mapping={"column_names": "columnNames", "principals": "principals"},
)
class QuicksightDataSetColumnLevelPermissionRules:
    def __init__(
        self,
        *,
        column_names: typing.Optional[typing.Sequence[builtins.str]] = None,
        principals: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param column_names: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_names QuicksightDataSet#column_names}.
        :param principals: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#principals QuicksightDataSet#principals}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8811ca1d3d167cade260ff75f0e003893cf1699744ec5ce55ac5a2967ff6e793)
            check_type(argname="argument column_names", value=column_names, expected_type=type_hints["column_names"])
            check_type(argname="argument principals", value=principals, expected_type=type_hints["principals"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if column_names is not None:
            self._values["column_names"] = column_names
        if principals is not None:
            self._values["principals"] = principals

    @builtins.property
    def column_names(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_names QuicksightDataSet#column_names}.'''
        result = self._values.get("column_names")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def principals(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#principals QuicksightDataSet#principals}.'''
        result = self._values.get("principals")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetColumnLevelPermissionRules(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetColumnLevelPermissionRulesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetColumnLevelPermissionRulesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__756eed217fa0431e83412a04d60c17aec54724b816c65391e27085c5d5df6738)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetColumnLevelPermissionRulesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49cc121dfbd6bc2b0284f110a1ed0e5a969694c20544ff1cd04162a88e35295e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetColumnLevelPermissionRulesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__72db5816a793268cca9a27b53fe38d85d04bd8463e0a4c9f71e9fc26bdc3f8fe)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c7f8171c7b027a0df8c3ad8aeeb13b27b453250fbda9d4a6abdc6f16dc4b9ff3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__95bbb5c46db873edd85cdb926fe2a6eb5b1a1e69865697a1f82bc4ac12a8c2a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnLevelPermissionRules]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnLevelPermissionRules]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnLevelPermissionRules]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9dba493aa4a296a95146b90ab3e122278964aa01d6d16417cb4929c7282a713)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetColumnLevelPermissionRulesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetColumnLevelPermissionRulesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9d03c423cac7ced6d8ba8290a0db0597430c5209e936121031ad723152fb8b43)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetColumnNames")
    def reset_column_names(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetColumnNames", []))

    @jsii.member(jsii_name="resetPrincipals")
    def reset_principals(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrincipals", []))

    @builtins.property
    @jsii.member(jsii_name="columnNamesInput")
    def column_names_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "columnNamesInput"))

    @builtins.property
    @jsii.member(jsii_name="principalsInput")
    def principals_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "principalsInput"))

    @builtins.property
    @jsii.member(jsii_name="columnNames")
    def column_names(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "columnNames"))

    @column_names.setter
    def column_names(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ac3a04dc081cf6e8b9ad8e5d970a762ca11bfcc4c730fcf53ae0b1ecd84db43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columnNames", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="principals")
    def principals(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "principals"))

    @principals.setter
    def principals(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9dbb7d702bcdbaec108d83ed5ecbd9f95c9238333611a9ea55dec0382294794)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "principals", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetColumnLevelPermissionRules]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetColumnLevelPermissionRules]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetColumnLevelPermissionRules]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__facccd3f031a815c1936f841271a744b61c837b39cd6f97ba7443e99698d3322)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "data_set_id": "dataSetId",
        "import_mode": "importMode",
        "name": "name",
        "aws_account_id": "awsAccountId",
        "column_groups": "columnGroups",
        "column_level_permission_rules": "columnLevelPermissionRules",
        "data_set_usage_configuration": "dataSetUsageConfiguration",
        "field_folders": "fieldFolders",
        "id": "id",
        "logical_table_map": "logicalTableMap",
        "permissions": "permissions",
        "physical_table_map": "physicalTableMap",
        "refresh_properties": "refreshProperties",
        "row_level_permission_data_set": "rowLevelPermissionDataSet",
        "row_level_permission_tag_configuration": "rowLevelPermissionTagConfiguration",
        "tags": "tags",
        "tags_all": "tagsAll",
    },
)
class QuicksightDataSetConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        data_set_id: builtins.str,
        import_mode: builtins.str,
        name: builtins.str,
        aws_account_id: typing.Optional[builtins.str] = None,
        column_groups: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetColumnGroups, typing.Dict[builtins.str, typing.Any]]]]] = None,
        column_level_permission_rules: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetColumnLevelPermissionRules, typing.Dict[builtins.str, typing.Any]]]]] = None,
        data_set_usage_configuration: typing.Optional[typing.Union["QuicksightDataSetDataSetUsageConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        field_folders: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetFieldFolders", typing.Dict[builtins.str, typing.Any]]]]] = None,
        id: typing.Optional[builtins.str] = None,
        logical_table_map: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetLogicalTableMap", typing.Dict[builtins.str, typing.Any]]]]] = None,
        permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPermissions", typing.Dict[builtins.str, typing.Any]]]]] = None,
        physical_table_map: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPhysicalTableMap", typing.Dict[builtins.str, typing.Any]]]]] = None,
        refresh_properties: typing.Optional[typing.Union["QuicksightDataSetRefreshProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        row_level_permission_data_set: typing.Optional[typing.Union["QuicksightDataSetRowLevelPermissionDataSet", typing.Dict[builtins.str, typing.Any]]] = None,
        row_level_permission_tag_configuration: typing.Optional[typing.Union["QuicksightDataSetRowLevelPermissionTagConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param data_set_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_id QuicksightDataSet#data_set_id}.
        :param import_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#import_mode QuicksightDataSet#import_mode}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        :param aws_account_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#aws_account_id QuicksightDataSet#aws_account_id}.
        :param column_groups: column_groups block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_groups QuicksightDataSet#column_groups}
        :param column_level_permission_rules: column_level_permission_rules block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_level_permission_rules QuicksightDataSet#column_level_permission_rules}
        :param data_set_usage_configuration: data_set_usage_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_usage_configuration QuicksightDataSet#data_set_usage_configuration}
        :param field_folders: field_folders block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders QuicksightDataSet#field_folders}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#id QuicksightDataSet#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param logical_table_map: logical_table_map block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map QuicksightDataSet#logical_table_map}
        :param permissions: permissions block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permissions QuicksightDataSet#permissions}
        :param physical_table_map: physical_table_map block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map QuicksightDataSet#physical_table_map}
        :param refresh_properties: refresh_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_properties QuicksightDataSet#refresh_properties}
        :param row_level_permission_data_set: row_level_permission_data_set block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_data_set QuicksightDataSet#row_level_permission_data_set}
        :param row_level_permission_tag_configuration: row_level_permission_tag_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_tag_configuration QuicksightDataSet#row_level_permission_tag_configuration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags_all QuicksightDataSet#tags_all}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(data_set_usage_configuration, dict):
            data_set_usage_configuration = QuicksightDataSetDataSetUsageConfiguration(**data_set_usage_configuration)
        if isinstance(refresh_properties, dict):
            refresh_properties = QuicksightDataSetRefreshProperties(**refresh_properties)
        if isinstance(row_level_permission_data_set, dict):
            row_level_permission_data_set = QuicksightDataSetRowLevelPermissionDataSet(**row_level_permission_data_set)
        if isinstance(row_level_permission_tag_configuration, dict):
            row_level_permission_tag_configuration = QuicksightDataSetRowLevelPermissionTagConfiguration(**row_level_permission_tag_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6bc0de995964d1ab26786f06ee892587aa1556cfa83a3e50064fee8903abc64)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument data_set_id", value=data_set_id, expected_type=type_hints["data_set_id"])
            check_type(argname="argument import_mode", value=import_mode, expected_type=type_hints["import_mode"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument aws_account_id", value=aws_account_id, expected_type=type_hints["aws_account_id"])
            check_type(argname="argument column_groups", value=column_groups, expected_type=type_hints["column_groups"])
            check_type(argname="argument column_level_permission_rules", value=column_level_permission_rules, expected_type=type_hints["column_level_permission_rules"])
            check_type(argname="argument data_set_usage_configuration", value=data_set_usage_configuration, expected_type=type_hints["data_set_usage_configuration"])
            check_type(argname="argument field_folders", value=field_folders, expected_type=type_hints["field_folders"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument logical_table_map", value=logical_table_map, expected_type=type_hints["logical_table_map"])
            check_type(argname="argument permissions", value=permissions, expected_type=type_hints["permissions"])
            check_type(argname="argument physical_table_map", value=physical_table_map, expected_type=type_hints["physical_table_map"])
            check_type(argname="argument refresh_properties", value=refresh_properties, expected_type=type_hints["refresh_properties"])
            check_type(argname="argument row_level_permission_data_set", value=row_level_permission_data_set, expected_type=type_hints["row_level_permission_data_set"])
            check_type(argname="argument row_level_permission_tag_configuration", value=row_level_permission_tag_configuration, expected_type=type_hints["row_level_permission_tag_configuration"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "data_set_id": data_set_id,
            "import_mode": import_mode,
            "name": name,
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
        if aws_account_id is not None:
            self._values["aws_account_id"] = aws_account_id
        if column_groups is not None:
            self._values["column_groups"] = column_groups
        if column_level_permission_rules is not None:
            self._values["column_level_permission_rules"] = column_level_permission_rules
        if data_set_usage_configuration is not None:
            self._values["data_set_usage_configuration"] = data_set_usage_configuration
        if field_folders is not None:
            self._values["field_folders"] = field_folders
        if id is not None:
            self._values["id"] = id
        if logical_table_map is not None:
            self._values["logical_table_map"] = logical_table_map
        if permissions is not None:
            self._values["permissions"] = permissions
        if physical_table_map is not None:
            self._values["physical_table_map"] = physical_table_map
        if refresh_properties is not None:
            self._values["refresh_properties"] = refresh_properties
        if row_level_permission_data_set is not None:
            self._values["row_level_permission_data_set"] = row_level_permission_data_set
        if row_level_permission_tag_configuration is not None:
            self._values["row_level_permission_tag_configuration"] = row_level_permission_tag_configuration
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all

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
    def data_set_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_id QuicksightDataSet#data_set_id}.'''
        result = self._values.get("data_set_id")
        assert result is not None, "Required property 'data_set_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def import_mode(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#import_mode QuicksightDataSet#import_mode}.'''
        result = self._values.get("import_mode")
        assert result is not None, "Required property 'import_mode' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def aws_account_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#aws_account_id QuicksightDataSet#aws_account_id}.'''
        result = self._values.get("aws_account_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def column_groups(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnGroups]]]:
        '''column_groups block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_groups QuicksightDataSet#column_groups}
        '''
        result = self._values.get("column_groups")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnGroups]]], result)

    @builtins.property
    def column_level_permission_rules(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnLevelPermissionRules]]]:
        '''column_level_permission_rules block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_level_permission_rules QuicksightDataSet#column_level_permission_rules}
        '''
        result = self._values.get("column_level_permission_rules")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnLevelPermissionRules]]], result)

    @builtins.property
    def data_set_usage_configuration(
        self,
    ) -> typing.Optional["QuicksightDataSetDataSetUsageConfiguration"]:
        '''data_set_usage_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_usage_configuration QuicksightDataSet#data_set_usage_configuration}
        '''
        result = self._values.get("data_set_usage_configuration")
        return typing.cast(typing.Optional["QuicksightDataSetDataSetUsageConfiguration"], result)

    @builtins.property
    def field_folders(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetFieldFolders"]]]:
        '''field_folders block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders QuicksightDataSet#field_folders}
        '''
        result = self._values.get("field_folders")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetFieldFolders"]]], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#id QuicksightDataSet#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def logical_table_map(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMap"]]]:
        '''logical_table_map block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map QuicksightDataSet#logical_table_map}
        '''
        result = self._values.get("logical_table_map")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMap"]]], result)

    @builtins.property
    def permissions(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPermissions"]]]:
        '''permissions block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permissions QuicksightDataSet#permissions}
        '''
        result = self._values.get("permissions")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPermissions"]]], result)

    @builtins.property
    def physical_table_map(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPhysicalTableMap"]]]:
        '''physical_table_map block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map QuicksightDataSet#physical_table_map}
        '''
        result = self._values.get("physical_table_map")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPhysicalTableMap"]]], result)

    @builtins.property
    def refresh_properties(
        self,
    ) -> typing.Optional["QuicksightDataSetRefreshProperties"]:
        '''refresh_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_properties QuicksightDataSet#refresh_properties}
        '''
        result = self._values.get("refresh_properties")
        return typing.cast(typing.Optional["QuicksightDataSetRefreshProperties"], result)

    @builtins.property
    def row_level_permission_data_set(
        self,
    ) -> typing.Optional["QuicksightDataSetRowLevelPermissionDataSet"]:
        '''row_level_permission_data_set block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_data_set QuicksightDataSet#row_level_permission_data_set}
        '''
        result = self._values.get("row_level_permission_data_set")
        return typing.cast(typing.Optional["QuicksightDataSetRowLevelPermissionDataSet"], result)

    @builtins.property
    def row_level_permission_tag_configuration(
        self,
    ) -> typing.Optional["QuicksightDataSetRowLevelPermissionTagConfiguration"]:
        '''row_level_permission_tag_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_tag_configuration QuicksightDataSet#row_level_permission_tag_configuration}
        '''
        result = self._values.get("row_level_permission_tag_configuration")
        return typing.cast(typing.Optional["QuicksightDataSetRowLevelPermissionTagConfiguration"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags_all QuicksightDataSet#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetDataSetUsageConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "disable_use_as_direct_query_source": "disableUseAsDirectQuerySource",
        "disable_use_as_imported_source": "disableUseAsImportedSource",
    },
)
class QuicksightDataSetDataSetUsageConfiguration:
    def __init__(
        self,
        *,
        disable_use_as_direct_query_source: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        disable_use_as_imported_source: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param disable_use_as_direct_query_source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_direct_query_source QuicksightDataSet#disable_use_as_direct_query_source}.
        :param disable_use_as_imported_source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_imported_source QuicksightDataSet#disable_use_as_imported_source}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__538714496229f19a5c9ca2b5adc53e7e06b7e31a48c86fc9ff1cce4e7c144e26)
            check_type(argname="argument disable_use_as_direct_query_source", value=disable_use_as_direct_query_source, expected_type=type_hints["disable_use_as_direct_query_source"])
            check_type(argname="argument disable_use_as_imported_source", value=disable_use_as_imported_source, expected_type=type_hints["disable_use_as_imported_source"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if disable_use_as_direct_query_source is not None:
            self._values["disable_use_as_direct_query_source"] = disable_use_as_direct_query_source
        if disable_use_as_imported_source is not None:
            self._values["disable_use_as_imported_source"] = disable_use_as_imported_source

    @builtins.property
    def disable_use_as_direct_query_source(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_direct_query_source QuicksightDataSet#disable_use_as_direct_query_source}.'''
        result = self._values.get("disable_use_as_direct_query_source")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def disable_use_as_imported_source(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_imported_source QuicksightDataSet#disable_use_as_imported_source}.'''
        result = self._values.get("disable_use_as_imported_source")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetDataSetUsageConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetDataSetUsageConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetDataSetUsageConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ed21313ed99061479ea7d4aeb79e201eeb49d5479099a3175eccb8ad49929b47)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDisableUseAsDirectQuerySource")
    def reset_disable_use_as_direct_query_source(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDisableUseAsDirectQuerySource", []))

    @jsii.member(jsii_name="resetDisableUseAsImportedSource")
    def reset_disable_use_as_imported_source(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDisableUseAsImportedSource", []))

    @builtins.property
    @jsii.member(jsii_name="disableUseAsDirectQuerySourceInput")
    def disable_use_as_direct_query_source_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "disableUseAsDirectQuerySourceInput"))

    @builtins.property
    @jsii.member(jsii_name="disableUseAsImportedSourceInput")
    def disable_use_as_imported_source_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "disableUseAsImportedSourceInput"))

    @builtins.property
    @jsii.member(jsii_name="disableUseAsDirectQuerySource")
    def disable_use_as_direct_query_source(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "disableUseAsDirectQuerySource"))

    @disable_use_as_direct_query_source.setter
    def disable_use_as_direct_query_source(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aae70a0b8d2a08e2cdf013a1cbf64cc466e8484a096d3ed527ef25b07960163d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "disableUseAsDirectQuerySource", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="disableUseAsImportedSource")
    def disable_use_as_imported_source(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "disableUseAsImportedSource"))

    @disable_use_as_imported_source.setter
    def disable_use_as_imported_source(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f1869a3618afc4e7c5fe4b8be9ef75d45ca9d84ca235dd2cab08c81a45de572)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "disableUseAsImportedSource", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetDataSetUsageConfiguration]:
        return typing.cast(typing.Optional[QuicksightDataSetDataSetUsageConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetDataSetUsageConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c475488840dc187276a5d08bf8fb58c45d0547a9aff9d0b3715fc1601ee581bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetFieldFolders",
    jsii_struct_bases=[],
    name_mapping={
        "field_folders_id": "fieldFoldersId",
        "columns": "columns",
        "description": "description",
    },
)
class QuicksightDataSetFieldFolders:
    def __init__(
        self,
        *,
        field_folders_id: builtins.str,
        columns: typing.Optional[typing.Sequence[builtins.str]] = None,
        description: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param field_folders_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders_id QuicksightDataSet#field_folders_id}.
        :param columns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#description QuicksightDataSet#description}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9c1a2b5518841749d9c28e2a863204bf57ec6b67c9dc5e2690ea3807ccbeb496)
            check_type(argname="argument field_folders_id", value=field_folders_id, expected_type=type_hints["field_folders_id"])
            check_type(argname="argument columns", value=columns, expected_type=type_hints["columns"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "field_folders_id": field_folders_id,
        }
        if columns is not None:
            self._values["columns"] = columns
        if description is not None:
            self._values["description"] = description

    @builtins.property
    def field_folders_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders_id QuicksightDataSet#field_folders_id}.'''
        result = self._values.get("field_folders_id")
        assert result is not None, "Required property 'field_folders_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def columns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}.'''
        result = self._values.get("columns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#description QuicksightDataSet#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetFieldFolders(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetFieldFoldersList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetFieldFoldersList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7ed819d4c8a7adb3d070f72d9bc5c92697fbacc206a570571c33822cfc0a5383)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "QuicksightDataSetFieldFoldersOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09786314fd26cae0c5f18981ce68a2e117fe0503944e1e056735ce89056aa68a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetFieldFoldersOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cae032ce67be10ee0fc21ac4b66a503463135e21f62233d8f63822e24f3c5b56)
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
            type_hints = typing.get_type_hints(_typecheckingstub__06998a04d33873412b0a0b9ef9da6d083283ee7020c81a70ddc0164065b75319)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d07e453f136fc05c24c80fefea37d6bd664ad63c669b425791efe70aec5e6f76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetFieldFolders]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetFieldFolders]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetFieldFolders]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b00242f43150cf367addde4bf9715ec4280e73ed53c4d68698a0c9efe361456e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetFieldFoldersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetFieldFoldersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0817a6ad458bb491555abae70b0507b22d84706f4f748c4ddf71956c9cb6f8c0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetColumns")
    def reset_columns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetColumns", []))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @builtins.property
    @jsii.member(jsii_name="columnsInput")
    def columns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "columnsInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="fieldFoldersIdInput")
    def field_folders_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "fieldFoldersIdInput"))

    @builtins.property
    @jsii.member(jsii_name="columns")
    def columns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "columns"))

    @columns.setter
    def columns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bdf4a82474bfba45d7f806ef6e00246f873161f8c7d70f7932848568215093db)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__732f360760f7efa162a7bf51e9e0539c824668724c499f73877465469c0edd88)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fieldFoldersId")
    def field_folders_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fieldFoldersId"))

    @field_folders_id.setter
    def field_folders_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9beea5dd80dbc6c8c10772a04c0bb69ff6c753fae9bfc0225d4619512b4bf214)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fieldFoldersId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetFieldFolders]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetFieldFolders]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetFieldFolders]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b19a3ec132569fc27385620fb743c10bf75880209c3018ae3d05be8daee6b7b7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMap",
    jsii_struct_bases=[],
    name_mapping={
        "alias": "alias",
        "logical_table_map_id": "logicalTableMapId",
        "source": "source",
        "data_transforms": "dataTransforms",
    },
)
class QuicksightDataSetLogicalTableMap:
    def __init__(
        self,
        *,
        alias: builtins.str,
        logical_table_map_id: builtins.str,
        source: typing.Union["QuicksightDataSetLogicalTableMapSource", typing.Dict[builtins.str, typing.Any]],
        data_transforms: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetLogicalTableMapDataTransforms", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#alias QuicksightDataSet#alias}.
        :param logical_table_map_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map_id QuicksightDataSet#logical_table_map_id}.
        :param source: source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#source QuicksightDataSet#source}
        :param data_transforms: data_transforms block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_transforms QuicksightDataSet#data_transforms}
        '''
        if isinstance(source, dict):
            source = QuicksightDataSetLogicalTableMapSource(**source)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__870bf540afc8ec1c2757d8852afb564d6aa45983c14ce9a4966d8ccb95a77db6)
            check_type(argname="argument alias", value=alias, expected_type=type_hints["alias"])
            check_type(argname="argument logical_table_map_id", value=logical_table_map_id, expected_type=type_hints["logical_table_map_id"])
            check_type(argname="argument source", value=source, expected_type=type_hints["source"])
            check_type(argname="argument data_transforms", value=data_transforms, expected_type=type_hints["data_transforms"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "alias": alias,
            "logical_table_map_id": logical_table_map_id,
            "source": source,
        }
        if data_transforms is not None:
            self._values["data_transforms"] = data_transforms

    @builtins.property
    def alias(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#alias QuicksightDataSet#alias}.'''
        result = self._values.get("alias")
        assert result is not None, "Required property 'alias' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def logical_table_map_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map_id QuicksightDataSet#logical_table_map_id}.'''
        result = self._values.get("logical_table_map_id")
        assert result is not None, "Required property 'logical_table_map_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def source(self) -> "QuicksightDataSetLogicalTableMapSource":
        '''source block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#source QuicksightDataSet#source}
        '''
        result = self._values.get("source")
        assert result is not None, "Required property 'source' is missing"
        return typing.cast("QuicksightDataSetLogicalTableMapSource", result)

    @builtins.property
    def data_transforms(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMapDataTransforms"]]]:
        '''data_transforms block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_transforms QuicksightDataSet#data_transforms}
        '''
        result = self._values.get("data_transforms")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMapDataTransforms"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMap(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransforms",
    jsii_struct_bases=[],
    name_mapping={
        "cast_column_type_operation": "castColumnTypeOperation",
        "create_columns_operation": "createColumnsOperation",
        "filter_operation": "filterOperation",
        "project_operation": "projectOperation",
        "rename_column_operation": "renameColumnOperation",
        "tag_column_operation": "tagColumnOperation",
        "untag_column_operation": "untagColumnOperation",
    },
)
class QuicksightDataSetLogicalTableMapDataTransforms:
    def __init__(
        self,
        *,
        cast_column_type_operation: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation", typing.Dict[builtins.str, typing.Any]]] = None,
        create_columns_operation: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation", typing.Dict[builtins.str, typing.Any]]] = None,
        filter_operation: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsFilterOperation", typing.Dict[builtins.str, typing.Any]]] = None,
        project_operation: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsProjectOperation", typing.Dict[builtins.str, typing.Any]]] = None,
        rename_column_operation: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation", typing.Dict[builtins.str, typing.Any]]] = None,
        tag_column_operation: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation", typing.Dict[builtins.str, typing.Any]]] = None,
        untag_column_operation: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param cast_column_type_operation: cast_column_type_operation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#cast_column_type_operation QuicksightDataSet#cast_column_type_operation}
        :param create_columns_operation: create_columns_operation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#create_columns_operation QuicksightDataSet#create_columns_operation}
        :param filter_operation: filter_operation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#filter_operation QuicksightDataSet#filter_operation}
        :param project_operation: project_operation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#project_operation QuicksightDataSet#project_operation}
        :param rename_column_operation: rename_column_operation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#rename_column_operation QuicksightDataSet#rename_column_operation}
        :param tag_column_operation: tag_column_operation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_column_operation QuicksightDataSet#tag_column_operation}
        :param untag_column_operation: untag_column_operation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#untag_column_operation QuicksightDataSet#untag_column_operation}
        '''
        if isinstance(cast_column_type_operation, dict):
            cast_column_type_operation = QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation(**cast_column_type_operation)
        if isinstance(create_columns_operation, dict):
            create_columns_operation = QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation(**create_columns_operation)
        if isinstance(filter_operation, dict):
            filter_operation = QuicksightDataSetLogicalTableMapDataTransformsFilterOperation(**filter_operation)
        if isinstance(project_operation, dict):
            project_operation = QuicksightDataSetLogicalTableMapDataTransformsProjectOperation(**project_operation)
        if isinstance(rename_column_operation, dict):
            rename_column_operation = QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation(**rename_column_operation)
        if isinstance(tag_column_operation, dict):
            tag_column_operation = QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation(**tag_column_operation)
        if isinstance(untag_column_operation, dict):
            untag_column_operation = QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation(**untag_column_operation)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14cf89440213dcfd926d53c7120d4b416f07d9d244380f3ba07070805f6c5a4a)
            check_type(argname="argument cast_column_type_operation", value=cast_column_type_operation, expected_type=type_hints["cast_column_type_operation"])
            check_type(argname="argument create_columns_operation", value=create_columns_operation, expected_type=type_hints["create_columns_operation"])
            check_type(argname="argument filter_operation", value=filter_operation, expected_type=type_hints["filter_operation"])
            check_type(argname="argument project_operation", value=project_operation, expected_type=type_hints["project_operation"])
            check_type(argname="argument rename_column_operation", value=rename_column_operation, expected_type=type_hints["rename_column_operation"])
            check_type(argname="argument tag_column_operation", value=tag_column_operation, expected_type=type_hints["tag_column_operation"])
            check_type(argname="argument untag_column_operation", value=untag_column_operation, expected_type=type_hints["untag_column_operation"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if cast_column_type_operation is not None:
            self._values["cast_column_type_operation"] = cast_column_type_operation
        if create_columns_operation is not None:
            self._values["create_columns_operation"] = create_columns_operation
        if filter_operation is not None:
            self._values["filter_operation"] = filter_operation
        if project_operation is not None:
            self._values["project_operation"] = project_operation
        if rename_column_operation is not None:
            self._values["rename_column_operation"] = rename_column_operation
        if tag_column_operation is not None:
            self._values["tag_column_operation"] = tag_column_operation
        if untag_column_operation is not None:
            self._values["untag_column_operation"] = untag_column_operation

    @builtins.property
    def cast_column_type_operation(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation"]:
        '''cast_column_type_operation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#cast_column_type_operation QuicksightDataSet#cast_column_type_operation}
        '''
        result = self._values.get("cast_column_type_operation")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation"], result)

    @builtins.property
    def create_columns_operation(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation"]:
        '''create_columns_operation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#create_columns_operation QuicksightDataSet#create_columns_operation}
        '''
        result = self._values.get("create_columns_operation")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation"], result)

    @builtins.property
    def filter_operation(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsFilterOperation"]:
        '''filter_operation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#filter_operation QuicksightDataSet#filter_operation}
        '''
        result = self._values.get("filter_operation")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsFilterOperation"], result)

    @builtins.property
    def project_operation(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsProjectOperation"]:
        '''project_operation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#project_operation QuicksightDataSet#project_operation}
        '''
        result = self._values.get("project_operation")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsProjectOperation"], result)

    @builtins.property
    def rename_column_operation(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation"]:
        '''rename_column_operation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#rename_column_operation QuicksightDataSet#rename_column_operation}
        '''
        result = self._values.get("rename_column_operation")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation"], result)

    @builtins.property
    def tag_column_operation(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation"]:
        '''tag_column_operation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_column_operation QuicksightDataSet#tag_column_operation}
        '''
        result = self._values.get("tag_column_operation")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation"], result)

    @builtins.property
    def untag_column_operation(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation"]:
        '''untag_column_operation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#untag_column_operation QuicksightDataSet#untag_column_operation}
        '''
        result = self._values.get("untag_column_operation")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransforms(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation",
    jsii_struct_bases=[],
    name_mapping={
        "column_name": "columnName",
        "new_column_type": "newColumnType",
        "format": "format",
    },
)
class QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation:
    def __init__(
        self,
        *,
        column_name: builtins.str,
        new_column_type: builtins.str,
        format: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param new_column_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#new_column_type QuicksightDataSet#new_column_type}.
        :param format: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format QuicksightDataSet#format}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e94347c8ae9b96eda21562a33cd47c3f40c390312ac8bc752debe726482d354)
            check_type(argname="argument column_name", value=column_name, expected_type=type_hints["column_name"])
            check_type(argname="argument new_column_type", value=new_column_type, expected_type=type_hints["new_column_type"])
            check_type(argname="argument format", value=format, expected_type=type_hints["format"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "column_name": column_name,
            "new_column_type": new_column_type,
        }
        if format is not None:
            self._values["format"] = format

    @builtins.property
    def column_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.'''
        result = self._values.get("column_name")
        assert result is not None, "Required property 'column_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def new_column_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#new_column_type QuicksightDataSet#new_column_type}.'''
        result = self._values.get("new_column_type")
        assert result is not None, "Required property 'new_column_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def format(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format QuicksightDataSet#format}.'''
        result = self._values.get("format")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a6213c2fcd994a5571ab2c2c149f0ae6efc4cbdfa6aeb82a3b8756c625c43a17)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetFormat")
    def reset_format(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFormat", []))

    @builtins.property
    @jsii.member(jsii_name="columnNameInput")
    def column_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "columnNameInput"))

    @builtins.property
    @jsii.member(jsii_name="formatInput")
    def format_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "formatInput"))

    @builtins.property
    @jsii.member(jsii_name="newColumnTypeInput")
    def new_column_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "newColumnTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="columnName")
    def column_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "columnName"))

    @column_name.setter
    def column_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf56e797304491feac0fd814efb693b3eda64666d7c67c2bffb1d20e9c9c0edb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columnName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="format")
    def format(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "format"))

    @format.setter
    def format(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__968a1b625bb67a2e19e6897be01547fe893f53420df0d18571d57feab9ea15b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "format", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="newColumnType")
    def new_column_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "newColumnType"))

    @new_column_type.setter
    def new_column_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3abc260c35523b32def067f91791db4e8d6335bae6937ca617667aa9a1c773e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "newColumnType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5901e0a33a5d3f865c1fa3f01e2b667bbb9dc64cf11d064eb363156991b7f56e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation",
    jsii_struct_bases=[],
    name_mapping={"columns": "columns"},
)
class QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation:
    def __init__(
        self,
        *,
        columns: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param columns: columns block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dcea88f03696f2c60ee2c5598dc37e1189acc556f0bf94c701e3b24ab3d45ab9)
            check_type(argname="argument columns", value=columns, expected_type=type_hints["columns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "columns": columns,
        }

    @builtins.property
    def columns(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns"]]:
        '''columns block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
        '''
        result = self._values.get("columns")
        assert result is not None, "Required property 'columns' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns",
    jsii_struct_bases=[],
    name_mapping={
        "column_id": "columnId",
        "column_name": "columnName",
        "expression": "expression",
    },
)
class QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns:
    def __init__(
        self,
        *,
        column_id: builtins.str,
        column_name: builtins.str,
        expression: builtins.str,
    ) -> None:
        '''
        :param column_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_id QuicksightDataSet#column_id}.
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param expression: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#expression QuicksightDataSet#expression}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cccfeb4a872c31638683efd74ebdcf14795d05b850dcd13b28d5ebfa29575cbc)
            check_type(argname="argument column_id", value=column_id, expected_type=type_hints["column_id"])
            check_type(argname="argument column_name", value=column_name, expected_type=type_hints["column_name"])
            check_type(argname="argument expression", value=expression, expected_type=type_hints["expression"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "column_id": column_id,
            "column_name": column_name,
            "expression": expression,
        }

    @builtins.property
    def column_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_id QuicksightDataSet#column_id}.'''
        result = self._values.get("column_id")
        assert result is not None, "Required property 'column_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def column_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.'''
        result = self._values.get("column_name")
        assert result is not None, "Required property 'column_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def expression(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#expression QuicksightDataSet#expression}.'''
        result = self._values.get("expression")
        assert result is not None, "Required property 'expression' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumnsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumnsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2151992f9c30063a306d86c9b23d7023d04665d75776f2fd2565c76dd70ff9db)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumnsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ead8f4f8f559b0b9fcc350c416eee0a104251f64ac1625ce95f726d5bd523800)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumnsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22ea7b9e402d84b97f73a7aeb94abed047a11bd90a3ba66f6b75010f5d450d2d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__247740c2b6f7970b7b292e5bf93e7d44d159e0375c79d74debeb406136755da7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__af1366886775af8e0526c366acaaee961aa1936a2917a400b5d5fcf45ac75598)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2de1b5cc2d0d42407c778d49f35a3167742328f66f92f230ad445ad4f1dc4562)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumnsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumnsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2d9041c588fb43c8948c4dbc5d1c0f8e4579c46af75b25a8e0fd0e78997d27ef)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="columnIdInput")
    def column_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "columnIdInput"))

    @builtins.property
    @jsii.member(jsii_name="columnNameInput")
    def column_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "columnNameInput"))

    @builtins.property
    @jsii.member(jsii_name="expressionInput")
    def expression_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "expressionInput"))

    @builtins.property
    @jsii.member(jsii_name="columnId")
    def column_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "columnId"))

    @column_id.setter
    def column_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0d9b00adc9926ee71135fff04ab23bdb8c5be77bd091c36258359c6ab9de690)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columnId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="columnName")
    def column_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "columnName"))

    @column_name.setter
    def column_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bfd8ab46422a4b708f2b921ddce8f1ee6567fe53aca9e6d198577e8c5e807186)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columnName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="expression")
    def expression(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "expression"))

    @expression.setter
    def expression(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__841a9bde33dd0dc82cfd19e8a6b3744a714e42b266fca9ff6d329150ada37b11)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "expression", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d0819af2b19cea5966f227b4713afc932a8b5dae6874d829ff4713af5365396)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b600453f3ff9e3126af0972dd29f5e46059049a203d94eea57c8c401414d916d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putColumns")
    def put_columns(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__849082c7ab7a799a30b32c8d5f0859aef9aaa8984196464ccd56bfd23c23a121)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putColumns", [value]))

    @builtins.property
    @jsii.member(jsii_name="columns")
    def columns(
        self,
    ) -> QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumnsList:
        return typing.cast(QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumnsList, jsii.get(self, "columns"))

    @builtins.property
    @jsii.member(jsii_name="columnsInput")
    def columns_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns]]], jsii.get(self, "columnsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c9ea9cd9f18a4cd31bb794c95f788c7eed0a2f1a493df3a8ac620b68bc0a789b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation",
    jsii_struct_bases=[],
    name_mapping={"condition_expression": "conditionExpression"},
)
class QuicksightDataSetLogicalTableMapDataTransformsFilterOperation:
    def __init__(self, *, condition_expression: builtins.str) -> None:
        '''
        :param condition_expression: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#condition_expression QuicksightDataSet#condition_expression}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b7ca5c36d723164d8f0fdd5fbae0298499f381656e174769a25964b3cad7014)
            check_type(argname="argument condition_expression", value=condition_expression, expected_type=type_hints["condition_expression"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "condition_expression": condition_expression,
        }

    @builtins.property
    def condition_expression(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#condition_expression QuicksightDataSet#condition_expression}.'''
        result = self._values.get("condition_expression")
        assert result is not None, "Required property 'condition_expression' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransformsFilterOperation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetLogicalTableMapDataTransformsFilterOperationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsFilterOperationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8a91604b50b38da2e1f91fa268a96a643df56a42002e0e19532121699091ea08)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="conditionExpressionInput")
    def condition_expression_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "conditionExpressionInput"))

    @builtins.property
    @jsii.member(jsii_name="conditionExpression")
    def condition_expression(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "conditionExpression"))

    @condition_expression.setter
    def condition_expression(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d9b41b322d5f7c7e65f2fa36f6e35d1ecffc69198c7a3d2f3ff967d22d8ea54)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "conditionExpression", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsFilterOperation]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsFilterOperation], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsFilterOperation],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d105fe7a6d77a8d398d717be2bceb9c60205341875985cebf56d1ed7463cfe7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetLogicalTableMapDataTransformsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b9c05b014695351909a66cea27f4735da2c6714cac25afbd979f684e3fa1d246)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetLogicalTableMapDataTransformsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6390126b73e01b8568da9ab587e5f11fa3e745590d7dd060b8d26d6dbc52ef8a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetLogicalTableMapDataTransformsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23e532ea37083af697268d366b82bc8db48188b7c2b3219d5ccb07b1ac3ef61d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ec58a20b0308a1b478ad4d7e23d8173d806a90d9c087048d30a040f0ba747f62)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3e67b1054b797265f582d06c139ef8b35ee4d63d82898846962f69382cdf90a7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransforms]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransforms]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransforms]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__65d218a44727a67eff94c159720f33efa044579b168f331ac1b42faee1f86f13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetLogicalTableMapDataTransformsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cc4c164caa5eae59521557a5b51aad12fc533f52fbec38c8b06bfeffef89f5bf)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putCastColumnTypeOperation")
    def put_cast_column_type_operation(
        self,
        *,
        column_name: builtins.str,
        new_column_type: builtins.str,
        format: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param new_column_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#new_column_type QuicksightDataSet#new_column_type}.
        :param format: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format QuicksightDataSet#format}.
        '''
        value = QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation(
            column_name=column_name, new_column_type=new_column_type, format=format
        )

        return typing.cast(None, jsii.invoke(self, "putCastColumnTypeOperation", [value]))

    @jsii.member(jsii_name="putCreateColumnsOperation")
    def put_create_columns_operation(
        self,
        *,
        columns: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param columns: columns block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
        '''
        value = QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation(
            columns=columns
        )

        return typing.cast(None, jsii.invoke(self, "putCreateColumnsOperation", [value]))

    @jsii.member(jsii_name="putFilterOperation")
    def put_filter_operation(self, *, condition_expression: builtins.str) -> None:
        '''
        :param condition_expression: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#condition_expression QuicksightDataSet#condition_expression}.
        '''
        value = QuicksightDataSetLogicalTableMapDataTransformsFilterOperation(
            condition_expression=condition_expression
        )

        return typing.cast(None, jsii.invoke(self, "putFilterOperation", [value]))

    @jsii.member(jsii_name="putProjectOperation")
    def put_project_operation(
        self,
        *,
        projected_columns: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param projected_columns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#projected_columns QuicksightDataSet#projected_columns}.
        '''
        value = QuicksightDataSetLogicalTableMapDataTransformsProjectOperation(
            projected_columns=projected_columns
        )

        return typing.cast(None, jsii.invoke(self, "putProjectOperation", [value]))

    @jsii.member(jsii_name="putRenameColumnOperation")
    def put_rename_column_operation(
        self,
        *,
        column_name: builtins.str,
        new_column_name: builtins.str,
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param new_column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#new_column_name QuicksightDataSet#new_column_name}.
        '''
        value = QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation(
            column_name=column_name, new_column_name=new_column_name
        )

        return typing.cast(None, jsii.invoke(self, "putRenameColumnOperation", [value]))

    @jsii.member(jsii_name="putTagColumnOperation")
    def put_tag_column_operation(
        self,
        *,
        column_name: builtins.str,
        tags: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param tags: tags block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}
        '''
        value = QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation(
            column_name=column_name, tags=tags
        )

        return typing.cast(None, jsii.invoke(self, "putTagColumnOperation", [value]))

    @jsii.member(jsii_name="putUntagColumnOperation")
    def put_untag_column_operation(
        self,
        *,
        column_name: builtins.str,
        tag_names: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param tag_names: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_names QuicksightDataSet#tag_names}.
        '''
        value = QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation(
            column_name=column_name, tag_names=tag_names
        )

        return typing.cast(None, jsii.invoke(self, "putUntagColumnOperation", [value]))

    @jsii.member(jsii_name="resetCastColumnTypeOperation")
    def reset_cast_column_type_operation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCastColumnTypeOperation", []))

    @jsii.member(jsii_name="resetCreateColumnsOperation")
    def reset_create_columns_operation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCreateColumnsOperation", []))

    @jsii.member(jsii_name="resetFilterOperation")
    def reset_filter_operation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilterOperation", []))

    @jsii.member(jsii_name="resetProjectOperation")
    def reset_project_operation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProjectOperation", []))

    @jsii.member(jsii_name="resetRenameColumnOperation")
    def reset_rename_column_operation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRenameColumnOperation", []))

    @jsii.member(jsii_name="resetTagColumnOperation")
    def reset_tag_column_operation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagColumnOperation", []))

    @jsii.member(jsii_name="resetUntagColumnOperation")
    def reset_untag_column_operation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUntagColumnOperation", []))

    @builtins.property
    @jsii.member(jsii_name="castColumnTypeOperation")
    def cast_column_type_operation(
        self,
    ) -> QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperationOutputReference:
        return typing.cast(QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperationOutputReference, jsii.get(self, "castColumnTypeOperation"))

    @builtins.property
    @jsii.member(jsii_name="createColumnsOperation")
    def create_columns_operation(
        self,
    ) -> QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationOutputReference:
        return typing.cast(QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationOutputReference, jsii.get(self, "createColumnsOperation"))

    @builtins.property
    @jsii.member(jsii_name="filterOperation")
    def filter_operation(
        self,
    ) -> QuicksightDataSetLogicalTableMapDataTransformsFilterOperationOutputReference:
        return typing.cast(QuicksightDataSetLogicalTableMapDataTransformsFilterOperationOutputReference, jsii.get(self, "filterOperation"))

    @builtins.property
    @jsii.member(jsii_name="projectOperation")
    def project_operation(
        self,
    ) -> "QuicksightDataSetLogicalTableMapDataTransformsProjectOperationOutputReference":
        return typing.cast("QuicksightDataSetLogicalTableMapDataTransformsProjectOperationOutputReference", jsii.get(self, "projectOperation"))

    @builtins.property
    @jsii.member(jsii_name="renameColumnOperation")
    def rename_column_operation(
        self,
    ) -> "QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference":
        return typing.cast("QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference", jsii.get(self, "renameColumnOperation"))

    @builtins.property
    @jsii.member(jsii_name="tagColumnOperation")
    def tag_column_operation(
        self,
    ) -> "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationOutputReference":
        return typing.cast("QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationOutputReference", jsii.get(self, "tagColumnOperation"))

    @builtins.property
    @jsii.member(jsii_name="untagColumnOperation")
    def untag_column_operation(
        self,
    ) -> "QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperationOutputReference":
        return typing.cast("QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperationOutputReference", jsii.get(self, "untagColumnOperation"))

    @builtins.property
    @jsii.member(jsii_name="castColumnTypeOperationInput")
    def cast_column_type_operation_input(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation], jsii.get(self, "castColumnTypeOperationInput"))

    @builtins.property
    @jsii.member(jsii_name="createColumnsOperationInput")
    def create_columns_operation_input(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation], jsii.get(self, "createColumnsOperationInput"))

    @builtins.property
    @jsii.member(jsii_name="filterOperationInput")
    def filter_operation_input(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsFilterOperation]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsFilterOperation], jsii.get(self, "filterOperationInput"))

    @builtins.property
    @jsii.member(jsii_name="projectOperationInput")
    def project_operation_input(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsProjectOperation"]:
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsProjectOperation"], jsii.get(self, "projectOperationInput"))

    @builtins.property
    @jsii.member(jsii_name="renameColumnOperationInput")
    def rename_column_operation_input(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation"]:
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation"], jsii.get(self, "renameColumnOperationInput"))

    @builtins.property
    @jsii.member(jsii_name="tagColumnOperationInput")
    def tag_column_operation_input(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation"]:
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation"], jsii.get(self, "tagColumnOperationInput"))

    @builtins.property
    @jsii.member(jsii_name="untagColumnOperationInput")
    def untag_column_operation_input(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation"]:
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation"], jsii.get(self, "untagColumnOperationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransforms]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransforms]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransforms]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ce39c827e6e54dbe61304828e4ee231230bba8e2fe97f4dbfc9184ef147a221)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation",
    jsii_struct_bases=[],
    name_mapping={"projected_columns": "projectedColumns"},
)
class QuicksightDataSetLogicalTableMapDataTransformsProjectOperation:
    def __init__(self, *, projected_columns: typing.Sequence[builtins.str]) -> None:
        '''
        :param projected_columns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#projected_columns QuicksightDataSet#projected_columns}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6c392af5d1286bf59901d6e33dc575dbbc2ddc0f88204bba2ca415dbba292db)
            check_type(argname="argument projected_columns", value=projected_columns, expected_type=type_hints["projected_columns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "projected_columns": projected_columns,
        }

    @builtins.property
    def projected_columns(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#projected_columns QuicksightDataSet#projected_columns}.'''
        result = self._values.get("projected_columns")
        assert result is not None, "Required property 'projected_columns' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransformsProjectOperation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetLogicalTableMapDataTransformsProjectOperationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsProjectOperationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9c403a1e9b37c0344a5090ad935a788ef9f43d9cc17f05ba69e05b90ed9b20e9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="projectedColumnsInput")
    def projected_columns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "projectedColumnsInput"))

    @builtins.property
    @jsii.member(jsii_name="projectedColumns")
    def projected_columns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "projectedColumns"))

    @projected_columns.setter
    def projected_columns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7fc167cf525279b0a7719a857ba64ac58483961f0d0a9284a9a62cfe69e82616)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "projectedColumns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsProjectOperation]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsProjectOperation], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsProjectOperation],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c07c1f2f55455fd636ca5e6d0fd7f10114b6db0c55b93e3e2a9dfdb6a3f2198)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation",
    jsii_struct_bases=[],
    name_mapping={"column_name": "columnName", "new_column_name": "newColumnName"},
)
class QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation:
    def __init__(
        self,
        *,
        column_name: builtins.str,
        new_column_name: builtins.str,
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param new_column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#new_column_name QuicksightDataSet#new_column_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c18f9922207d938209eb908a34d264db48b8cd6869da41f86b0aa65f0eaeb289)
            check_type(argname="argument column_name", value=column_name, expected_type=type_hints["column_name"])
            check_type(argname="argument new_column_name", value=new_column_name, expected_type=type_hints["new_column_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "column_name": column_name,
            "new_column_name": new_column_name,
        }

    @builtins.property
    def column_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.'''
        result = self._values.get("column_name")
        assert result is not None, "Required property 'column_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def new_column_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#new_column_name QuicksightDataSet#new_column_name}.'''
        result = self._values.get("new_column_name")
        assert result is not None, "Required property 'new_column_name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__457c014219b3f951cf5b92d2991ca2fb235e8da412fb91fbe06013d891f16568)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="columnNameInput")
    def column_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "columnNameInput"))

    @builtins.property
    @jsii.member(jsii_name="newColumnNameInput")
    def new_column_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "newColumnNameInput"))

    @builtins.property
    @jsii.member(jsii_name="columnName")
    def column_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "columnName"))

    @column_name.setter
    def column_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__247bf2a062885f8ca14f979f594834b45a0499442e06b8c8a72452a8afc0ac96)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columnName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="newColumnName")
    def new_column_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "newColumnName"))

    @new_column_name.setter
    def new_column_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7bc5bd96c6e3b34c83709775d3ffc2d1a2b17993420828fdb38f3cf219106d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "newColumnName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a3bf7d002de866cbd6a88b424265970e07cae8744907c6d04e77446a2bfc72e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation",
    jsii_struct_bases=[],
    name_mapping={"column_name": "columnName", "tags": "tags"},
)
class QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation:
    def __init__(
        self,
        *,
        column_name: builtins.str,
        tags: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param tags: tags block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5c3752c287cc738e5d1b22b54c67e04117926a6529a5966d922e3e55f40685d)
            check_type(argname="argument column_name", value=column_name, expected_type=type_hints["column_name"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "column_name": column_name,
            "tags": tags,
        }

    @builtins.property
    def column_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.'''
        result = self._values.get("column_name")
        assert result is not None, "Required property 'column_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def tags(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags"]]:
        '''tags block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}
        '''
        result = self._values.get("tags")
        assert result is not None, "Required property 'tags' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__30e99deffed1d306bcf6d80c6d1518e803ddfc3373eb47040daa006c0b1d0b39)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putTags")
    def put_tags(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e7a8465c1af2b1040242d115916c134b416c6581410cf816e708c6dcd573a03)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTags", [value]))

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(
        self,
    ) -> "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsList":
        return typing.cast("QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsList", jsii.get(self, "tags"))

    @builtins.property
    @jsii.member(jsii_name="columnNameInput")
    def column_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "columnNameInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags"]]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="columnName")
    def column_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "columnName"))

    @column_name.setter
    def column_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__022cd1af9c26c735a35453890757ec786166e219d098c9bec9e81ffde6385c3d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columnName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5fb9cba95670afa9099d97e9003e13d1768974c7703cdfc73f3b7eeb44be1a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags",
    jsii_struct_bases=[],
    name_mapping={
        "column_description": "columnDescription",
        "column_geographic_role": "columnGeographicRole",
    },
)
class QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags:
    def __init__(
        self,
        *,
        column_description: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription", typing.Dict[builtins.str, typing.Any]]] = None,
        column_geographic_role: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param column_description: column_description block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_description QuicksightDataSet#column_description}
        :param column_geographic_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_geographic_role QuicksightDataSet#column_geographic_role}.
        '''
        if isinstance(column_description, dict):
            column_description = QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription(**column_description)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7c337be212236d78205bff88f91612099b4eb6fdce0eaf15156d8a49f1296dfc)
            check_type(argname="argument column_description", value=column_description, expected_type=type_hints["column_description"])
            check_type(argname="argument column_geographic_role", value=column_geographic_role, expected_type=type_hints["column_geographic_role"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if column_description is not None:
            self._values["column_description"] = column_description
        if column_geographic_role is not None:
            self._values["column_geographic_role"] = column_geographic_role

    @builtins.property
    def column_description(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription"]:
        '''column_description block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_description QuicksightDataSet#column_description}
        '''
        result = self._values.get("column_description")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription"], result)

    @builtins.property
    def column_geographic_role(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_geographic_role QuicksightDataSet#column_geographic_role}.'''
        result = self._values.get("column_geographic_role")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription",
    jsii_struct_bases=[],
    name_mapping={"text": "text"},
)
class QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription:
    def __init__(self, *, text: typing.Optional[builtins.str] = None) -> None:
        '''
        :param text: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#text QuicksightDataSet#text}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d3c354c45688d0c45cabb4ae64581c5c70895d2c9b976906fb2227ef301baa8)
            check_type(argname="argument text", value=text, expected_type=type_hints["text"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if text is not None:
            self._values["text"] = text

    @builtins.property
    def text(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#text QuicksightDataSet#text}.'''
        result = self._values.get("text")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescriptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescriptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__77539380c2e25d23b9a2cecb801f17212e10858179dbdf26caa7b8b8fcf38cde)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetText")
    def reset_text(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetText", []))

    @builtins.property
    @jsii.member(jsii_name="textInput")
    def text_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "textInput"))

    @builtins.property
    @jsii.member(jsii_name="text")
    def text(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "text"))

    @text.setter
    def text(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1698fe6fc5d0da6666d0e9192328e430c79e2ebc34527b7707c3f12cb19badf7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "text", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bec92bdc7478f5648613f3feb9994f9578e76e3ee52b343f9f72db80307196a7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__32c1495d169abcec6a4e30360337570696178876a0f889b6321f8f68cd66bc9d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cabf1b5b843864a621afd078df62793c4d8f26c200ea42929f646b74629ea378)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c642d514065b300f16f15bc5c5b403ff5917be591f9e9b9134652a0b7af9f2bd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d110afef4bb65fb0c8129370a47bfd229319a3fa1c4301dd2b99f725c9cbbbd3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3e58a8d10dc6167070d241e81a3894b6e4425bd5324bc30df989755b5ae2ab2f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f255406b47cdd4d9ddbe5fbd6b5d35cd58b0a46e1b5ef59428223b5a4e9f94c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5bf5849b84e9f4df63ba231d4791431f4d8826d782431a68d0fd12c898f48a20)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putColumnDescription")
    def put_column_description(
        self,
        *,
        text: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param text: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#text QuicksightDataSet#text}.
        '''
        value = QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription(
            text=text
        )

        return typing.cast(None, jsii.invoke(self, "putColumnDescription", [value]))

    @jsii.member(jsii_name="resetColumnDescription")
    def reset_column_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetColumnDescription", []))

    @jsii.member(jsii_name="resetColumnGeographicRole")
    def reset_column_geographic_role(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetColumnGeographicRole", []))

    @builtins.property
    @jsii.member(jsii_name="columnDescription")
    def column_description(
        self,
    ) -> QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescriptionOutputReference:
        return typing.cast(QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescriptionOutputReference, jsii.get(self, "columnDescription"))

    @builtins.property
    @jsii.member(jsii_name="columnDescriptionInput")
    def column_description_input(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription], jsii.get(self, "columnDescriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="columnGeographicRoleInput")
    def column_geographic_role_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "columnGeographicRoleInput"))

    @builtins.property
    @jsii.member(jsii_name="columnGeographicRole")
    def column_geographic_role(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "columnGeographicRole"))

    @column_geographic_role.setter
    def column_geographic_role(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efa2b9b50137e8b19eba5ecf0b6af254f862ba3eba25e67ce24153dccda5a1a1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columnGeographicRole", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__086d1a892aef1084247c29f10ad0f623c467adf7abab565ad5af280cb2f4fc79)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation",
    jsii_struct_bases=[],
    name_mapping={"column_name": "columnName", "tag_names": "tagNames"},
)
class QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation:
    def __init__(
        self,
        *,
        column_name: builtins.str,
        tag_names: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param tag_names: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_names QuicksightDataSet#tag_names}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc8bbbab56303b1d8e7764141872f80143c8eac8c6a47637f30ff1119dfec119)
            check_type(argname="argument column_name", value=column_name, expected_type=type_hints["column_name"])
            check_type(argname="argument tag_names", value=tag_names, expected_type=type_hints["tag_names"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "column_name": column_name,
            "tag_names": tag_names,
        }

    @builtins.property
    def column_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.'''
        result = self._values.get("column_name")
        assert result is not None, "Required property 'column_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def tag_names(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_names QuicksightDataSet#tag_names}.'''
        result = self._values.get("tag_names")
        assert result is not None, "Required property 'tag_names' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bd77dac5092f82e4547ceca4d9aca071746c7eba785754ddee3c8c2d809dd6a0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="columnNameInput")
    def column_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "columnNameInput"))

    @builtins.property
    @jsii.member(jsii_name="tagNamesInput")
    def tag_names_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "tagNamesInput"))

    @builtins.property
    @jsii.member(jsii_name="columnName")
    def column_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "columnName"))

    @column_name.setter
    def column_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f13d5cf727df5ffebeb48900d163320d5091aa36f21d4e3c69be2024ddfdf855)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columnName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagNames")
    def tag_names(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "tagNames"))

    @tag_names.setter
    def tag_names(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1f0c42895ebdc1cd768ff07996ba1c79be23a143da1df8f3303afafd5672497)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagNames", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8bb2f956c6ee570af1a611b356d7d3975575331b446ad9c8421ee0a7072ef2f2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetLogicalTableMapList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__372e61b2b90e7fbea7a39686cca7285c05433ddb1de35573c7fb17af5efeda0a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetLogicalTableMapOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d18f61eba2caea1b9d7d7506cbb7b4e8f77647956fac516b687dde064c275842)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetLogicalTableMapOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7a7eed32968fec3d95ea32daa24b0fec93cf9ebac9581bd49c428491f075cfec)
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
            type_hints = typing.get_type_hints(_typecheckingstub__595e8c5e6343930cb92c8c970c3d90cf0dc45697488a55d0b99238a6d4819cfd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e12a5671eba85c75be4d492a079c42591a52ef8e2726489bf39d1042cb3fd88a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMap]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMap]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMap]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0cde2d4b90ac9ce590efeb700a078cc6ce4826b676a08dbf184390052cb6c3ee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetLogicalTableMapOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9aba6aad76592a2e41f3ecb18d6a89bce019e9b7c54fc9b557623f0906e190f8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putDataTransforms")
    def put_data_transforms(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMapDataTransforms, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd503b2e7deabc8d5d9834754fac8c003425e80df61087e44968881f8dacb4d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDataTransforms", [value]))

    @jsii.member(jsii_name="putSource")
    def put_source(
        self,
        *,
        data_set_arn: typing.Optional[builtins.str] = None,
        join_instruction: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapSourceJoinInstruction", typing.Dict[builtins.str, typing.Any]]] = None,
        physical_table_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param data_set_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_arn QuicksightDataSet#data_set_arn}.
        :param join_instruction: join_instruction block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#join_instruction QuicksightDataSet#join_instruction}
        :param physical_table_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_id QuicksightDataSet#physical_table_id}.
        '''
        value = QuicksightDataSetLogicalTableMapSource(
            data_set_arn=data_set_arn,
            join_instruction=join_instruction,
            physical_table_id=physical_table_id,
        )

        return typing.cast(None, jsii.invoke(self, "putSource", [value]))

    @jsii.member(jsii_name="resetDataTransforms")
    def reset_data_transforms(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataTransforms", []))

    @builtins.property
    @jsii.member(jsii_name="dataTransforms")
    def data_transforms(self) -> QuicksightDataSetLogicalTableMapDataTransformsList:
        return typing.cast(QuicksightDataSetLogicalTableMapDataTransformsList, jsii.get(self, "dataTransforms"))

    @builtins.property
    @jsii.member(jsii_name="source")
    def source(self) -> "QuicksightDataSetLogicalTableMapSourceOutputReference":
        return typing.cast("QuicksightDataSetLogicalTableMapSourceOutputReference", jsii.get(self, "source"))

    @builtins.property
    @jsii.member(jsii_name="aliasInput")
    def alias_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "aliasInput"))

    @builtins.property
    @jsii.member(jsii_name="dataTransformsInput")
    def data_transforms_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransforms]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransforms]]], jsii.get(self, "dataTransformsInput"))

    @builtins.property
    @jsii.member(jsii_name="logicalTableMapIdInput")
    def logical_table_map_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "logicalTableMapIdInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceInput")
    def source_input(self) -> typing.Optional["QuicksightDataSetLogicalTableMapSource"]:
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapSource"], jsii.get(self, "sourceInput"))

    @builtins.property
    @jsii.member(jsii_name="alias")
    def alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "alias"))

    @alias.setter
    def alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dcdd2b3e913f91fd91d7672c8ac5891967d9e2a9326d512ebc3ffbabb16270d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "alias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="logicalTableMapId")
    def logical_table_map_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "logicalTableMapId"))

    @logical_table_map_id.setter
    def logical_table_map_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0b91c0f8d1e61645607d0c12f37bca283f19140691d21bd4bc2d32d30da72fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "logicalTableMapId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMap]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMap]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMap]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac78f9909bf59ee5db97b9ca16aa0041852240c5ef14c110d4e776f18ac8f104)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSource",
    jsii_struct_bases=[],
    name_mapping={
        "data_set_arn": "dataSetArn",
        "join_instruction": "joinInstruction",
        "physical_table_id": "physicalTableId",
    },
)
class QuicksightDataSetLogicalTableMapSource:
    def __init__(
        self,
        *,
        data_set_arn: typing.Optional[builtins.str] = None,
        join_instruction: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapSourceJoinInstruction", typing.Dict[builtins.str, typing.Any]]] = None,
        physical_table_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param data_set_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_arn QuicksightDataSet#data_set_arn}.
        :param join_instruction: join_instruction block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#join_instruction QuicksightDataSet#join_instruction}
        :param physical_table_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_id QuicksightDataSet#physical_table_id}.
        '''
        if isinstance(join_instruction, dict):
            join_instruction = QuicksightDataSetLogicalTableMapSourceJoinInstruction(**join_instruction)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d2e5b46aa5dd4e0c77d3a0ec6f63dbea3e2044f48e61773ac39ea59dd995195)
            check_type(argname="argument data_set_arn", value=data_set_arn, expected_type=type_hints["data_set_arn"])
            check_type(argname="argument join_instruction", value=join_instruction, expected_type=type_hints["join_instruction"])
            check_type(argname="argument physical_table_id", value=physical_table_id, expected_type=type_hints["physical_table_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if data_set_arn is not None:
            self._values["data_set_arn"] = data_set_arn
        if join_instruction is not None:
            self._values["join_instruction"] = join_instruction
        if physical_table_id is not None:
            self._values["physical_table_id"] = physical_table_id

    @builtins.property
    def data_set_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_arn QuicksightDataSet#data_set_arn}.'''
        result = self._values.get("data_set_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def join_instruction(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapSourceJoinInstruction"]:
        '''join_instruction block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#join_instruction QuicksightDataSet#join_instruction}
        '''
        result = self._values.get("join_instruction")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapSourceJoinInstruction"], result)

    @builtins.property
    def physical_table_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_id QuicksightDataSet#physical_table_id}.'''
        result = self._values.get("physical_table_id")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapSource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstruction",
    jsii_struct_bases=[],
    name_mapping={
        "left_operand": "leftOperand",
        "on_clause": "onClause",
        "right_operand": "rightOperand",
        "type": "type",
        "left_join_key_properties": "leftJoinKeyProperties",
        "right_join_key_properties": "rightJoinKeyProperties",
    },
)
class QuicksightDataSetLogicalTableMapSourceJoinInstruction:
    def __init__(
        self,
        *,
        left_operand: builtins.str,
        on_clause: builtins.str,
        right_operand: builtins.str,
        type: builtins.str,
        left_join_key_properties: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        right_join_key_properties: typing.Optional[typing.Union["QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param left_operand: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#left_operand QuicksightDataSet#left_operand}.
        :param on_clause: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#on_clause QuicksightDataSet#on_clause}.
        :param right_operand: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#right_operand QuicksightDataSet#right_operand}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.
        :param left_join_key_properties: left_join_key_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#left_join_key_properties QuicksightDataSet#left_join_key_properties}
        :param right_join_key_properties: right_join_key_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#right_join_key_properties QuicksightDataSet#right_join_key_properties}
        '''
        if isinstance(left_join_key_properties, dict):
            left_join_key_properties = QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties(**left_join_key_properties)
        if isinstance(right_join_key_properties, dict):
            right_join_key_properties = QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties(**right_join_key_properties)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__29a4f3b0e59a30bf4fe8956ad5e9eb1d83967f33ef615ddfda6d929e972a1410)
            check_type(argname="argument left_operand", value=left_operand, expected_type=type_hints["left_operand"])
            check_type(argname="argument on_clause", value=on_clause, expected_type=type_hints["on_clause"])
            check_type(argname="argument right_operand", value=right_operand, expected_type=type_hints["right_operand"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument left_join_key_properties", value=left_join_key_properties, expected_type=type_hints["left_join_key_properties"])
            check_type(argname="argument right_join_key_properties", value=right_join_key_properties, expected_type=type_hints["right_join_key_properties"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "left_operand": left_operand,
            "on_clause": on_clause,
            "right_operand": right_operand,
            "type": type,
        }
        if left_join_key_properties is not None:
            self._values["left_join_key_properties"] = left_join_key_properties
        if right_join_key_properties is not None:
            self._values["right_join_key_properties"] = right_join_key_properties

    @builtins.property
    def left_operand(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#left_operand QuicksightDataSet#left_operand}.'''
        result = self._values.get("left_operand")
        assert result is not None, "Required property 'left_operand' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def on_clause(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#on_clause QuicksightDataSet#on_clause}.'''
        result = self._values.get("on_clause")
        assert result is not None, "Required property 'on_clause' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def right_operand(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#right_operand QuicksightDataSet#right_operand}.'''
        result = self._values.get("right_operand")
        assert result is not None, "Required property 'right_operand' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def left_join_key_properties(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties"]:
        '''left_join_key_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#left_join_key_properties QuicksightDataSet#left_join_key_properties}
        '''
        result = self._values.get("left_join_key_properties")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties"], result)

    @builtins.property
    def right_join_key_properties(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties"]:
        '''right_join_key_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#right_join_key_properties QuicksightDataSet#right_join_key_properties}
        '''
        result = self._values.get("right_join_key_properties")
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapSourceJoinInstruction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties",
    jsii_struct_bases=[],
    name_mapping={"unique_key": "uniqueKey"},
)
class QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties:
    def __init__(
        self,
        *,
        unique_key: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param unique_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#unique_key QuicksightDataSet#unique_key}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a74b4dc324bb6c1a88a247e42e3d76b7685e73c1e41bb1e734a5b86b4b6f8d4)
            check_type(argname="argument unique_key", value=unique_key, expected_type=type_hints["unique_key"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if unique_key is not None:
            self._values["unique_key"] = unique_key

    @builtins.property
    def unique_key(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#unique_key QuicksightDataSet#unique_key}.'''
        result = self._values.get("unique_key")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__702c46ac903721e4295c552163264f1284b73af24af205675813357d712d48d7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetUniqueKey")
    def reset_unique_key(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUniqueKey", []))

    @builtins.property
    @jsii.member(jsii_name="uniqueKeyInput")
    def unique_key_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "uniqueKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="uniqueKey")
    def unique_key(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "uniqueKey"))

    @unique_key.setter
    def unique_key(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af179d18208269a0741d52a483288be2640d27aaf820fa0f4afe19a17655740a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "uniqueKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d47e53bf277cfbcea54911748e9be5dd8b98d0a2eaa2659adcb0d10c047ec5e1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d8ddf31ed2f771073c1d4d080df47f5c5714f73c93a9f868467527f3215b815f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putLeftJoinKeyProperties")
    def put_left_join_key_properties(
        self,
        *,
        unique_key: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param unique_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#unique_key QuicksightDataSet#unique_key}.
        '''
        value = QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties(
            unique_key=unique_key
        )

        return typing.cast(None, jsii.invoke(self, "putLeftJoinKeyProperties", [value]))

    @jsii.member(jsii_name="putRightJoinKeyProperties")
    def put_right_join_key_properties(
        self,
        *,
        unique_key: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param unique_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#unique_key QuicksightDataSet#unique_key}.
        '''
        value = QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties(
            unique_key=unique_key
        )

        return typing.cast(None, jsii.invoke(self, "putRightJoinKeyProperties", [value]))

    @jsii.member(jsii_name="resetLeftJoinKeyProperties")
    def reset_left_join_key_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLeftJoinKeyProperties", []))

    @jsii.member(jsii_name="resetRightJoinKeyProperties")
    def reset_right_join_key_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRightJoinKeyProperties", []))

    @builtins.property
    @jsii.member(jsii_name="leftJoinKeyProperties")
    def left_join_key_properties(
        self,
    ) -> QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyPropertiesOutputReference:
        return typing.cast(QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyPropertiesOutputReference, jsii.get(self, "leftJoinKeyProperties"))

    @builtins.property
    @jsii.member(jsii_name="rightJoinKeyProperties")
    def right_join_key_properties(
        self,
    ) -> "QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyPropertiesOutputReference":
        return typing.cast("QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyPropertiesOutputReference", jsii.get(self, "rightJoinKeyProperties"))

    @builtins.property
    @jsii.member(jsii_name="leftJoinKeyPropertiesInput")
    def left_join_key_properties_input(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties], jsii.get(self, "leftJoinKeyPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="leftOperandInput")
    def left_operand_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "leftOperandInput"))

    @builtins.property
    @jsii.member(jsii_name="onClauseInput")
    def on_clause_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onClauseInput"))

    @builtins.property
    @jsii.member(jsii_name="rightJoinKeyPropertiesInput")
    def right_join_key_properties_input(
        self,
    ) -> typing.Optional["QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties"]:
        return typing.cast(typing.Optional["QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties"], jsii.get(self, "rightJoinKeyPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="rightOperandInput")
    def right_operand_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rightOperandInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="leftOperand")
    def left_operand(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "leftOperand"))

    @left_operand.setter
    def left_operand(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7fee8a851cdef702601656b5c5a8bd4de1ef7adc349de1fc77ad783a5039e5d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "leftOperand", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onClause")
    def on_clause(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onClause"))

    @on_clause.setter
    def on_clause(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0f4d898a408d44ba71cbdc31b6240d15754aa3abcc8131aaf70de4965c6013d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onClause", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="rightOperand")
    def right_operand(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rightOperand"))

    @right_operand.setter
    def right_operand(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__36cd6c4bfb0f0f81f5d82dcad1c8773a392aee0784c078fcbdd9150081c2ee5c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rightOperand", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd1efe54f0674e5c6bd033a1f01eddde87cb757cf6c9e666ec44e59b19066789)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstruction]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstruction], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstruction],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2206446555c42560b299cb4b5d85134feb73eecbf8562ec7529a83bd701e18ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties",
    jsii_struct_bases=[],
    name_mapping={"unique_key": "uniqueKey"},
)
class QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties:
    def __init__(
        self,
        *,
        unique_key: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param unique_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#unique_key QuicksightDataSet#unique_key}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a1af194d09bb348db0fe5851a6ef14c1bf68db13bcbee66278588db80685731)
            check_type(argname="argument unique_key", value=unique_key, expected_type=type_hints["unique_key"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if unique_key is not None:
            self._values["unique_key"] = unique_key

    @builtins.property
    def unique_key(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#unique_key QuicksightDataSet#unique_key}.'''
        result = self._values.get("unique_key")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3a3c349d5ab70e164725ca957625a2c8232f985d39358444c9714152558a0683)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetUniqueKey")
    def reset_unique_key(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUniqueKey", []))

    @builtins.property
    @jsii.member(jsii_name="uniqueKeyInput")
    def unique_key_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "uniqueKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="uniqueKey")
    def unique_key(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "uniqueKey"))

    @unique_key.setter
    def unique_key(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9477722bb39bb5617507ce507c5113d9306e4517cbaef9669d2507ef4846ac6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "uniqueKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3700f99247ddb3fe16d85997367e01366f13cb3114c62b72932abce42038e7c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetLogicalTableMapSourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__86b3e48419562ec1e938fa72c91ab5266e75ef0f60e2e918bc548bcf68f5ed78)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putJoinInstruction")
    def put_join_instruction(
        self,
        *,
        left_operand: builtins.str,
        on_clause: builtins.str,
        right_operand: builtins.str,
        type: builtins.str,
        left_join_key_properties: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties, typing.Dict[builtins.str, typing.Any]]] = None,
        right_join_key_properties: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param left_operand: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#left_operand QuicksightDataSet#left_operand}.
        :param on_clause: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#on_clause QuicksightDataSet#on_clause}.
        :param right_operand: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#right_operand QuicksightDataSet#right_operand}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.
        :param left_join_key_properties: left_join_key_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#left_join_key_properties QuicksightDataSet#left_join_key_properties}
        :param right_join_key_properties: right_join_key_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#right_join_key_properties QuicksightDataSet#right_join_key_properties}
        '''
        value = QuicksightDataSetLogicalTableMapSourceJoinInstruction(
            left_operand=left_operand,
            on_clause=on_clause,
            right_operand=right_operand,
            type=type,
            left_join_key_properties=left_join_key_properties,
            right_join_key_properties=right_join_key_properties,
        )

        return typing.cast(None, jsii.invoke(self, "putJoinInstruction", [value]))

    @jsii.member(jsii_name="resetDataSetArn")
    def reset_data_set_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataSetArn", []))

    @jsii.member(jsii_name="resetJoinInstruction")
    def reset_join_instruction(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetJoinInstruction", []))

    @jsii.member(jsii_name="resetPhysicalTableId")
    def reset_physical_table_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPhysicalTableId", []))

    @builtins.property
    @jsii.member(jsii_name="joinInstruction")
    def join_instruction(
        self,
    ) -> QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference:
        return typing.cast(QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference, jsii.get(self, "joinInstruction"))

    @builtins.property
    @jsii.member(jsii_name="dataSetArnInput")
    def data_set_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataSetArnInput"))

    @builtins.property
    @jsii.member(jsii_name="joinInstructionInput")
    def join_instruction_input(
        self,
    ) -> typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstruction]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstruction], jsii.get(self, "joinInstructionInput"))

    @builtins.property
    @jsii.member(jsii_name="physicalTableIdInput")
    def physical_table_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "physicalTableIdInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSetArn")
    def data_set_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataSetArn"))

    @data_set_arn.setter
    def data_set_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__129cd1572069930a28700e0ecaec9be565f8e75146b5be8aec3f41e98bf2605c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataSetArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="physicalTableId")
    def physical_table_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "physicalTableId"))

    @physical_table_id.setter
    def physical_table_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d13fc77d3e4896676dc7e3514fa69e3d72a1723896c609aff0ebec7afd6ef600)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "physicalTableId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[QuicksightDataSetLogicalTableMapSource]:
        return typing.cast(typing.Optional[QuicksightDataSetLogicalTableMapSource], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetLogicalTableMapSource],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b5adad4663ace1517e1709ce3575156bde8b276d47a598d950b7ea4a6aab08d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetOutputColumns",
    jsii_struct_bases=[],
    name_mapping={},
)
class QuicksightDataSetOutputColumns:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetOutputColumns(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetOutputColumnsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetOutputColumnsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2cfef623eef496a2841128f71e0db0ba630f36291166df49b7433f9d58c8c42c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetOutputColumnsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e80710ac42df7f641e6367b93311cd1ef672582dfb9ea2295ad9797ae3d53128)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetOutputColumnsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8f8d50e5d38c87cdadfc9d12ea9e83fd33829d1d29ef9c64785051587cc8d8a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e2ee21a01db197011711f3382aa8c6e0807d83928ba8d5506d2fafa03fa3a534)
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
            type_hints = typing.get_type_hints(_typecheckingstub__fc8ac28001d27f7a8196c3359f47c8a1aa6266f15e8aa21428ca505a94821421)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetOutputColumnsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetOutputColumnsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6dda407b7bc9570978124e11bea722133de18bf0087d6bc3c102867d5c7edd58)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[QuicksightDataSetOutputColumns]:
        return typing.cast(typing.Optional[QuicksightDataSetOutputColumns], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetOutputColumns],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__93a3ad013fb48cd2f0cc30e2dcef4b0f8d62f1db8e1c6c4f49a485baa9f9aebd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPermissions",
    jsii_struct_bases=[],
    name_mapping={"actions": "actions", "principal": "principal"},
)
class QuicksightDataSetPermissions:
    def __init__(
        self,
        *,
        actions: typing.Sequence[builtins.str],
        principal: builtins.str,
    ) -> None:
        '''
        :param actions: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#actions QuicksightDataSet#actions}.
        :param principal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#principal QuicksightDataSet#principal}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__17c9866eea365ed8b6825443a84a39aed7518d69e0a64985c41a5e5ec7289ecd)
            check_type(argname="argument actions", value=actions, expected_type=type_hints["actions"])
            check_type(argname="argument principal", value=principal, expected_type=type_hints["principal"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "actions": actions,
            "principal": principal,
        }

    @builtins.property
    def actions(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#actions QuicksightDataSet#actions}.'''
        result = self._values.get("actions")
        assert result is not None, "Required property 'actions' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def principal(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#principal QuicksightDataSet#principal}.'''
        result = self._values.get("principal")
        assert result is not None, "Required property 'principal' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetPermissions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetPermissionsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPermissionsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__61fad2da77bdf169744ffdc9bbd5fc9ab12e90ddab01dc18943221f59fceca86)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "QuicksightDataSetPermissionsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d8dff501a7a2845f7ea33ad823812b26408869a6c0bbc8d2de1d1d85557ba2e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetPermissionsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8a1cb07d79ce74151aa53bbb1126a66d8ddcce4a4981440dca44d90fdef07cd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5057319baa19343fe79d1ed8c7101ff15f2e09c674ec6e6eba0014d4997db628)
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
            type_hints = typing.get_type_hints(_typecheckingstub__66364980b8c2170196c5935991ed0a61e955cb7cc47a37d948fa96cac943ce05)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPermissions]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPermissions]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPermissions]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__faa90896603a8c7495284764e92c1136a09c1ca4c3ff7d83fdee43de3b827af5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetPermissionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPermissionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2223f497611b100166f9a1e9bca679fcb78e764fff4d3b0ca36f85b79ff6a68d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="actionsInput")
    def actions_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "actionsInput"))

    @builtins.property
    @jsii.member(jsii_name="principalInput")
    def principal_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "principalInput"))

    @builtins.property
    @jsii.member(jsii_name="actions")
    def actions(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "actions"))

    @actions.setter
    def actions(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ffe822a1090621cb8314874261c6df14a4a88afe623d63697bafb2b25aa7bce1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "actions", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="principal")
    def principal(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "principal"))

    @principal.setter
    def principal(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2279e54d195756a429c60167ad2b4ba9dbbbdc89b6c64fa57662994d1d90a73f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "principal", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPermissions]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPermissions]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPermissions]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62935bc63735be07952623c5c2a0ecf94cc2dcfbdb5f2469757de03eaf856e1d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMap",
    jsii_struct_bases=[],
    name_mapping={
        "physical_table_map_id": "physicalTableMapId",
        "custom_sql": "customSql",
        "relational_table": "relationalTable",
        "s3_source": "s3Source",
    },
)
class QuicksightDataSetPhysicalTableMap:
    def __init__(
        self,
        *,
        physical_table_map_id: builtins.str,
        custom_sql: typing.Optional[typing.Union["QuicksightDataSetPhysicalTableMapCustomSql", typing.Dict[builtins.str, typing.Any]]] = None,
        relational_table: typing.Optional[typing.Union["QuicksightDataSetPhysicalTableMapRelationalTable", typing.Dict[builtins.str, typing.Any]]] = None,
        s3_source: typing.Optional[typing.Union["QuicksightDataSetPhysicalTableMapS3Source", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param physical_table_map_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map_id QuicksightDataSet#physical_table_map_id}.
        :param custom_sql: custom_sql block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#custom_sql QuicksightDataSet#custom_sql}
        :param relational_table: relational_table block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#relational_table QuicksightDataSet#relational_table}
        :param s3_source: s3_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#s3_source QuicksightDataSet#s3_source}
        '''
        if isinstance(custom_sql, dict):
            custom_sql = QuicksightDataSetPhysicalTableMapCustomSql(**custom_sql)
        if isinstance(relational_table, dict):
            relational_table = QuicksightDataSetPhysicalTableMapRelationalTable(**relational_table)
        if isinstance(s3_source, dict):
            s3_source = QuicksightDataSetPhysicalTableMapS3Source(**s3_source)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3a6bcdf2af51a2d689dacb27201b8134451b479c157cdf9746a273067097824)
            check_type(argname="argument physical_table_map_id", value=physical_table_map_id, expected_type=type_hints["physical_table_map_id"])
            check_type(argname="argument custom_sql", value=custom_sql, expected_type=type_hints["custom_sql"])
            check_type(argname="argument relational_table", value=relational_table, expected_type=type_hints["relational_table"])
            check_type(argname="argument s3_source", value=s3_source, expected_type=type_hints["s3_source"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "physical_table_map_id": physical_table_map_id,
        }
        if custom_sql is not None:
            self._values["custom_sql"] = custom_sql
        if relational_table is not None:
            self._values["relational_table"] = relational_table
        if s3_source is not None:
            self._values["s3_source"] = s3_source

    @builtins.property
    def physical_table_map_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map_id QuicksightDataSet#physical_table_map_id}.'''
        result = self._values.get("physical_table_map_id")
        assert result is not None, "Required property 'physical_table_map_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def custom_sql(
        self,
    ) -> typing.Optional["QuicksightDataSetPhysicalTableMapCustomSql"]:
        '''custom_sql block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#custom_sql QuicksightDataSet#custom_sql}
        '''
        result = self._values.get("custom_sql")
        return typing.cast(typing.Optional["QuicksightDataSetPhysicalTableMapCustomSql"], result)

    @builtins.property
    def relational_table(
        self,
    ) -> typing.Optional["QuicksightDataSetPhysicalTableMapRelationalTable"]:
        '''relational_table block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#relational_table QuicksightDataSet#relational_table}
        '''
        result = self._values.get("relational_table")
        return typing.cast(typing.Optional["QuicksightDataSetPhysicalTableMapRelationalTable"], result)

    @builtins.property
    def s3_source(self) -> typing.Optional["QuicksightDataSetPhysicalTableMapS3Source"]:
        '''s3_source block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#s3_source QuicksightDataSet#s3_source}
        '''
        result = self._values.get("s3_source")
        return typing.cast(typing.Optional["QuicksightDataSetPhysicalTableMapS3Source"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetPhysicalTableMap(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapCustomSql",
    jsii_struct_bases=[],
    name_mapping={
        "data_source_arn": "dataSourceArn",
        "name": "name",
        "sql_query": "sqlQuery",
        "columns": "columns",
    },
)
class QuicksightDataSetPhysicalTableMapCustomSql:
    def __init__(
        self,
        *,
        data_source_arn: builtins.str,
        name: builtins.str,
        sql_query: builtins.str,
        columns: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPhysicalTableMapCustomSqlColumns", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param data_source_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        :param sql_query: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#sql_query QuicksightDataSet#sql_query}.
        :param columns: columns block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__293f52988c039672ba9dfa043c9fba6b8c1964469c7d14afdd0a3f0ed648642b)
            check_type(argname="argument data_source_arn", value=data_source_arn, expected_type=type_hints["data_source_arn"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument sql_query", value=sql_query, expected_type=type_hints["sql_query"])
            check_type(argname="argument columns", value=columns, expected_type=type_hints["columns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "data_source_arn": data_source_arn,
            "name": name,
            "sql_query": sql_query,
        }
        if columns is not None:
            self._values["columns"] = columns

    @builtins.property
    def data_source_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.'''
        result = self._values.get("data_source_arn")
        assert result is not None, "Required property 'data_source_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def sql_query(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#sql_query QuicksightDataSet#sql_query}.'''
        result = self._values.get("sql_query")
        assert result is not None, "Required property 'sql_query' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def columns(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPhysicalTableMapCustomSqlColumns"]]]:
        '''columns block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
        '''
        result = self._values.get("columns")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPhysicalTableMapCustomSqlColumns"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetPhysicalTableMapCustomSql(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapCustomSqlColumns",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "type": "type"},
)
class QuicksightDataSetPhysicalTableMapCustomSqlColumns:
    def __init__(self, *, name: builtins.str, type: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b63e46a281f2b1d035178e0ecf54eadd86c0b66f7580abac121ffbdde0b1faa0)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "type": type,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetPhysicalTableMapCustomSqlColumns(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetPhysicalTableMapCustomSqlColumnsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapCustomSqlColumnsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1199f199245cb0c775e409990361f778cd542a5ea01d8bd26f378b8af261a399)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetPhysicalTableMapCustomSqlColumnsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c1530449721a371dd45cf9d745cd0eebda7d9bf7dd9edef2d90e3532031215b5)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetPhysicalTableMapCustomSqlColumnsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33e813194e1a2472ed9f4410efe282d8d42ac8c9dbd702d593726fb751434eb9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ee6a6e9ca0ec7c8c40cc22f10d6cd7539078f2f341af8577f2dcb05347668fed)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6e25a6155230b890b9a51fb8b9e5a96b6d963dfc8076854c69a28b590033da6c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapCustomSqlColumns]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapCustomSqlColumns]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapCustomSqlColumns]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dedca3ceb736d99d36100a455d822e18e0fee8d42a8e10b52815cd4163c09b3a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetPhysicalTableMapCustomSqlColumnsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapCustomSqlColumnsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dca998e635e801e652aa0fb296ad47e6f2b0b2efa66f503e507721ef94db5982)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e1b7bfbd6576ed6da627df8829191b83c7017706d76438ab89336b09a07faeb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a006b2332661a46cd99a26b4ebd63fa31f4253fe61271850c196450dddebd61)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapCustomSqlColumns]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapCustomSqlColumns]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapCustomSqlColumns]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7fae9a36e1e31bc5d2b992bf35a673f3ae665fc071989da47ce17a471a12704b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetPhysicalTableMapCustomSqlOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapCustomSqlOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__28c4b5b4e8b2b2738d86ae4bda23a8c292d40d8bc93e2d122c317cf6717ccb61)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putColumns")
    def put_columns(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMapCustomSqlColumns, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0621d8c4788f23e99368353d83e81e921d9c5d24ef77807a2e6f5c73d0a1f7a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putColumns", [value]))

    @jsii.member(jsii_name="resetColumns")
    def reset_columns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetColumns", []))

    @builtins.property
    @jsii.member(jsii_name="columns")
    def columns(self) -> QuicksightDataSetPhysicalTableMapCustomSqlColumnsList:
        return typing.cast(QuicksightDataSetPhysicalTableMapCustomSqlColumnsList, jsii.get(self, "columns"))

    @builtins.property
    @jsii.member(jsii_name="columnsInput")
    def columns_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapCustomSqlColumns]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapCustomSqlColumns]]], jsii.get(self, "columnsInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSourceArnInput")
    def data_source_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataSourceArnInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="sqlQueryInput")
    def sql_query_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sqlQueryInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSourceArn")
    def data_source_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataSourceArn"))

    @data_source_arn.setter
    def data_source_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9772fa7a2c6c5c68127e6231ca90c9082012aecd3077aec7deae9c0e3dc96ee3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataSourceArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7652324d9a598af1591f92ea0670c70b65a0763a67bfedea72172ba7ddff8f1d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sqlQuery")
    def sql_query(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sqlQuery"))

    @sql_query.setter
    def sql_query(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f59c6c97f0438800c77b1c67683de126e552171f7cba2fe3c6279d1140815fa8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sqlQuery", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetPhysicalTableMapCustomSql]:
        return typing.cast(typing.Optional[QuicksightDataSetPhysicalTableMapCustomSql], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetPhysicalTableMapCustomSql],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__418be3b58001012ee3ccd6bdb0a6f0c63d7609523491e67b4cf9c7391719f78e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetPhysicalTableMapList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3e382fecac384dabfdabe7aa388c5df99731b289c656c5a0aa74a875c96e20f2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetPhysicalTableMapOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e4dff8365471f1f0ba858090fa3b6991504f8fd706a92d38733095959295d9e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetPhysicalTableMapOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d167a62f9a472ece4a5bafe7005d99278512d49eff4b6c10e4e90d13c8ddd578)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a9ad2dd5c5895e193b31c4980a3d3dcd823084af8eb9bf39facf8d2e9973103)
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
            type_hints = typing.get_type_hints(_typecheckingstub__96d09417371a326c6e77a06ae5d9f33a4df1d32db4a0ffaa3566fce3844b2fd3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMap]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMap]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMap]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05cb1319b06fae6a41d18b31931f2ba64f37d42e1824a68ecb635ab2d2fa84c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetPhysicalTableMapOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__957b19a6d152a41674a6f0c0b35df5f94f9e7d8ae51a381b23fe499a48698c83)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putCustomSql")
    def put_custom_sql(
        self,
        *,
        data_source_arn: builtins.str,
        name: builtins.str,
        sql_query: builtins.str,
        columns: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMapCustomSqlColumns, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param data_source_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        :param sql_query: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#sql_query QuicksightDataSet#sql_query}.
        :param columns: columns block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
        '''
        value = QuicksightDataSetPhysicalTableMapCustomSql(
            data_source_arn=data_source_arn,
            name=name,
            sql_query=sql_query,
            columns=columns,
        )

        return typing.cast(None, jsii.invoke(self, "putCustomSql", [value]))

    @jsii.member(jsii_name="putRelationalTable")
    def put_relational_table(
        self,
        *,
        data_source_arn: builtins.str,
        input_columns: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPhysicalTableMapRelationalTableInputColumns", typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        catalog: typing.Optional[builtins.str] = None,
        schema: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param data_source_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.
        :param input_columns: input_columns block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        :param catalog: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#catalog QuicksightDataSet#catalog}.
        :param schema: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#schema QuicksightDataSet#schema}.
        '''
        value = QuicksightDataSetPhysicalTableMapRelationalTable(
            data_source_arn=data_source_arn,
            input_columns=input_columns,
            name=name,
            catalog=catalog,
            schema=schema,
        )

        return typing.cast(None, jsii.invoke(self, "putRelationalTable", [value]))

    @jsii.member(jsii_name="putS3Source")
    def put_s3_source(
        self,
        *,
        data_source_arn: builtins.str,
        input_columns: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPhysicalTableMapS3SourceInputColumns", typing.Dict[builtins.str, typing.Any]]]],
        upload_settings: typing.Union["QuicksightDataSetPhysicalTableMapS3SourceUploadSettings", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param data_source_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.
        :param input_columns: input_columns block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
        :param upload_settings: upload_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#upload_settings QuicksightDataSet#upload_settings}
        '''
        value = QuicksightDataSetPhysicalTableMapS3Source(
            data_source_arn=data_source_arn,
            input_columns=input_columns,
            upload_settings=upload_settings,
        )

        return typing.cast(None, jsii.invoke(self, "putS3Source", [value]))

    @jsii.member(jsii_name="resetCustomSql")
    def reset_custom_sql(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomSql", []))

    @jsii.member(jsii_name="resetRelationalTable")
    def reset_relational_table(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRelationalTable", []))

    @jsii.member(jsii_name="resetS3Source")
    def reset_s3_source(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3Source", []))

    @builtins.property
    @jsii.member(jsii_name="customSql")
    def custom_sql(self) -> QuicksightDataSetPhysicalTableMapCustomSqlOutputReference:
        return typing.cast(QuicksightDataSetPhysicalTableMapCustomSqlOutputReference, jsii.get(self, "customSql"))

    @builtins.property
    @jsii.member(jsii_name="relationalTable")
    def relational_table(
        self,
    ) -> "QuicksightDataSetPhysicalTableMapRelationalTableOutputReference":
        return typing.cast("QuicksightDataSetPhysicalTableMapRelationalTableOutputReference", jsii.get(self, "relationalTable"))

    @builtins.property
    @jsii.member(jsii_name="s3Source")
    def s3_source(self) -> "QuicksightDataSetPhysicalTableMapS3SourceOutputReference":
        return typing.cast("QuicksightDataSetPhysicalTableMapS3SourceOutputReference", jsii.get(self, "s3Source"))

    @builtins.property
    @jsii.member(jsii_name="customSqlInput")
    def custom_sql_input(
        self,
    ) -> typing.Optional[QuicksightDataSetPhysicalTableMapCustomSql]:
        return typing.cast(typing.Optional[QuicksightDataSetPhysicalTableMapCustomSql], jsii.get(self, "customSqlInput"))

    @builtins.property
    @jsii.member(jsii_name="physicalTableMapIdInput")
    def physical_table_map_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "physicalTableMapIdInput"))

    @builtins.property
    @jsii.member(jsii_name="relationalTableInput")
    def relational_table_input(
        self,
    ) -> typing.Optional["QuicksightDataSetPhysicalTableMapRelationalTable"]:
        return typing.cast(typing.Optional["QuicksightDataSetPhysicalTableMapRelationalTable"], jsii.get(self, "relationalTableInput"))

    @builtins.property
    @jsii.member(jsii_name="s3SourceInput")
    def s3_source_input(
        self,
    ) -> typing.Optional["QuicksightDataSetPhysicalTableMapS3Source"]:
        return typing.cast(typing.Optional["QuicksightDataSetPhysicalTableMapS3Source"], jsii.get(self, "s3SourceInput"))

    @builtins.property
    @jsii.member(jsii_name="physicalTableMapId")
    def physical_table_map_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "physicalTableMapId"))

    @physical_table_map_id.setter
    def physical_table_map_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09e51139254fbe66818b3b9d8b45bd379d2fd7fd1fef43c454d249ecd9f392a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "physicalTableMapId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMap]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMap]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMap]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0628c57dae2c81022c83c6b070c789b6e8992cf83e426c787ea6d56f9198115)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapRelationalTable",
    jsii_struct_bases=[],
    name_mapping={
        "data_source_arn": "dataSourceArn",
        "input_columns": "inputColumns",
        "name": "name",
        "catalog": "catalog",
        "schema": "schema",
    },
)
class QuicksightDataSetPhysicalTableMapRelationalTable:
    def __init__(
        self,
        *,
        data_source_arn: builtins.str,
        input_columns: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPhysicalTableMapRelationalTableInputColumns", typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        catalog: typing.Optional[builtins.str] = None,
        schema: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param data_source_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.
        :param input_columns: input_columns block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        :param catalog: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#catalog QuicksightDataSet#catalog}.
        :param schema: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#schema QuicksightDataSet#schema}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__254c05044730c4083553d55229d0e314fff67c125b9fc32905a42788da1e6fd9)
            check_type(argname="argument data_source_arn", value=data_source_arn, expected_type=type_hints["data_source_arn"])
            check_type(argname="argument input_columns", value=input_columns, expected_type=type_hints["input_columns"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument catalog", value=catalog, expected_type=type_hints["catalog"])
            check_type(argname="argument schema", value=schema, expected_type=type_hints["schema"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "data_source_arn": data_source_arn,
            "input_columns": input_columns,
            "name": name,
        }
        if catalog is not None:
            self._values["catalog"] = catalog
        if schema is not None:
            self._values["schema"] = schema

    @builtins.property
    def data_source_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.'''
        result = self._values.get("data_source_arn")
        assert result is not None, "Required property 'data_source_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def input_columns(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPhysicalTableMapRelationalTableInputColumns"]]:
        '''input_columns block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
        '''
        result = self._values.get("input_columns")
        assert result is not None, "Required property 'input_columns' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPhysicalTableMapRelationalTableInputColumns"]], result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def catalog(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#catalog QuicksightDataSet#catalog}.'''
        result = self._values.get("catalog")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def schema(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#schema QuicksightDataSet#schema}.'''
        result = self._values.get("schema")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetPhysicalTableMapRelationalTable(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapRelationalTableInputColumns",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "type": "type"},
)
class QuicksightDataSetPhysicalTableMapRelationalTableInputColumns:
    def __init__(self, *, name: builtins.str, type: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f417a5a75a3ca0c371f7cc3ac8f400d9ce79bcdca8136a92b705cbd128ea2f2a)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "type": type,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetPhysicalTableMapRelationalTableInputColumns(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9035172278d9a9d49d111e4e0ece358d057f3f76863348a5bf653a3eebaebf08)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f57d85e4e93b1c0d08777526434124b860e8ad0cc2896da0b147d503c5af1942)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2d711c91c8683de880729f2c42f206aaee7732726f7fb707f712fa4d7df44ff)
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
            type_hints = typing.get_type_hints(_typecheckingstub__671b3a18319c3c5abbb773d9c91ccb5f47963a6a300dcd5df5547ae6623cfaba)
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
            type_hints = typing.get_type_hints(_typecheckingstub__29ea8d3815d15ec50b58b0e20ce702fca5468074b59176d87dc0f8725db89b65)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapRelationalTableInputColumns]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapRelationalTableInputColumns]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapRelationalTableInputColumns]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8790de853b89792c7ed11a4434c7f5d7f39308a54b3826e720f0620a3b0d456)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__87694b5d812005ab134cc99796b7c663b61352fa632390690508ab9e2e8ff213)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3f6aa1580af92938c9fd1f3f35a7546f243b3bda2509c79c95b73e05b10f8cd5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42720c75ff75f1d9c5e57a956c1241e922379219f97a865d6a6015092625ebe4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapRelationalTableInputColumns]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapRelationalTableInputColumns]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapRelationalTableInputColumns]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b42d91918cd3b0ce245c61fb086eb325d70b997950acc4d579f03514a004d4b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetPhysicalTableMapRelationalTableOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapRelationalTableOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e5f70f99e3f03a35e8ab613be11893f44a9edd0755dc3f95ac30b3deb35fff8f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInputColumns")
    def put_input_columns(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMapRelationalTableInputColumns, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__47749229cc259a9da360c6a5a32766245098569a1eaa776e397dbb1151321f8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInputColumns", [value]))

    @jsii.member(jsii_name="resetCatalog")
    def reset_catalog(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCatalog", []))

    @jsii.member(jsii_name="resetSchema")
    def reset_schema(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSchema", []))

    @builtins.property
    @jsii.member(jsii_name="inputColumns")
    def input_columns(
        self,
    ) -> QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsList:
        return typing.cast(QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsList, jsii.get(self, "inputColumns"))

    @builtins.property
    @jsii.member(jsii_name="catalogInput")
    def catalog_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "catalogInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSourceArnInput")
    def data_source_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataSourceArnInput"))

    @builtins.property
    @jsii.member(jsii_name="inputColumnsInput")
    def input_columns_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapRelationalTableInputColumns]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapRelationalTableInputColumns]]], jsii.get(self, "inputColumnsInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="schemaInput")
    def schema_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "schemaInput"))

    @builtins.property
    @jsii.member(jsii_name="catalog")
    def catalog(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "catalog"))

    @catalog.setter
    def catalog(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1cd3b39475a4f19c7fc41d6a7f8e4c37f7eaeabe88b8134471b52ac8dab0b88c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "catalog", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dataSourceArn")
    def data_source_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataSourceArn"))

    @data_source_arn.setter
    def data_source_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff4838e7bd16195419f4ce057de995c2f477ddde9e8fb48c9fe3e57beb3db83a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataSourceArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb90a36daf6d428b81f15f95ca7a8a548530af5a75a8bb426bd1a4756c43bbe0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="schema")
    def schema(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "schema"))

    @schema.setter
    def schema(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3f8454bdcd71f0ea6c2520e4c91a774b4057c66b4cfb4b33ccee95f9fff850b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "schema", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetPhysicalTableMapRelationalTable]:
        return typing.cast(typing.Optional[QuicksightDataSetPhysicalTableMapRelationalTable], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetPhysicalTableMapRelationalTable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e9b75737db48a87594b90ac31d2565fdd4234f0f32393e3720bbcdc59ae14f9f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3Source",
    jsii_struct_bases=[],
    name_mapping={
        "data_source_arn": "dataSourceArn",
        "input_columns": "inputColumns",
        "upload_settings": "uploadSettings",
    },
)
class QuicksightDataSetPhysicalTableMapS3Source:
    def __init__(
        self,
        *,
        data_source_arn: builtins.str,
        input_columns: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetPhysicalTableMapS3SourceInputColumns", typing.Dict[builtins.str, typing.Any]]]],
        upload_settings: typing.Union["QuicksightDataSetPhysicalTableMapS3SourceUploadSettings", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param data_source_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.
        :param input_columns: input_columns block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
        :param upload_settings: upload_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#upload_settings QuicksightDataSet#upload_settings}
        '''
        if isinstance(upload_settings, dict):
            upload_settings = QuicksightDataSetPhysicalTableMapS3SourceUploadSettings(**upload_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__613e28c4e2482ca81271e3cf30ea2ff5a3c3f24095f763f2f94627a3b36419af)
            check_type(argname="argument data_source_arn", value=data_source_arn, expected_type=type_hints["data_source_arn"])
            check_type(argname="argument input_columns", value=input_columns, expected_type=type_hints["input_columns"])
            check_type(argname="argument upload_settings", value=upload_settings, expected_type=type_hints["upload_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "data_source_arn": data_source_arn,
            "input_columns": input_columns,
            "upload_settings": upload_settings,
        }

    @builtins.property
    def data_source_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.'''
        result = self._values.get("data_source_arn")
        assert result is not None, "Required property 'data_source_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def input_columns(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPhysicalTableMapS3SourceInputColumns"]]:
        '''input_columns block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
        '''
        result = self._values.get("input_columns")
        assert result is not None, "Required property 'input_columns' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetPhysicalTableMapS3SourceInputColumns"]], result)

    @builtins.property
    def upload_settings(
        self,
    ) -> "QuicksightDataSetPhysicalTableMapS3SourceUploadSettings":
        '''upload_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#upload_settings QuicksightDataSet#upload_settings}
        '''
        result = self._values.get("upload_settings")
        assert result is not None, "Required property 'upload_settings' is missing"
        return typing.cast("QuicksightDataSetPhysicalTableMapS3SourceUploadSettings", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetPhysicalTableMapS3Source(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceInputColumns",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "type": "type"},
)
class QuicksightDataSetPhysicalTableMapS3SourceInputColumns:
    def __init__(self, *, name: builtins.str, type: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6dc30b2b0dd31bd556f39f25eec00efd4622528907919eff579718e50bd4037c)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "type": type,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetPhysicalTableMapS3SourceInputColumns(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetPhysicalTableMapS3SourceInputColumnsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceInputColumnsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9b937dae359d5aeab2c934130cc0ba6b47f0d6f94f745f3b6745009ccf97a622)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetPhysicalTableMapS3SourceInputColumnsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b84bc120a4572e78a836dba504a2ff5cb8d04b6007dbbe58ab921e24910ba21)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetPhysicalTableMapS3SourceInputColumnsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__68bd51fe8e912daf49e377653bd3821faa7f0ac469c0e4e84a7d74653c013c54)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2ded9f9d2bf23f755f7c51467be8a65f4c7a73e6bd2ebc1a0184de7c5844883c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5e6d1f88df522426002e3aec39da3674acbed25e15cec3b7f2b84fcd8744237b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapS3SourceInputColumns]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapS3SourceInputColumns]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapS3SourceInputColumns]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3c787b115606447b8682a6c751a0eeda6b024f429bd0349faa6ce7ac45ddcf6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetPhysicalTableMapS3SourceInputColumnsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceInputColumnsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8ad742bf26a10f43ef02c56f6ce4cf4065e6625e0537bdf0f94438b7fee095cb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7fe933a0255d80751d42a422bec7b04bafa3b45548722636b86dd6325f79ce5b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4494781b1813aec5b76403eddf305da686aa31e3732c7188de22eb11a3f12ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapS3SourceInputColumns]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapS3SourceInputColumns]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapS3SourceInputColumns]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3823b0a89394a78c1a62fe407e36779e27dfafc494ae23e5490b1218cc8bb47e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetPhysicalTableMapS3SourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e094e9cf242eebae0f0318bf5bfd048510c7ab7678a5fc46c9e7e40ad09ebd3a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInputColumns")
    def put_input_columns(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMapS3SourceInputColumns, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b9cb1264c07d3ddda4461f6749082961d36260f9041b31be163943ba3654f23)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInputColumns", [value]))

    @jsii.member(jsii_name="putUploadSettings")
    def put_upload_settings(
        self,
        *,
        contains_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        delimiter: typing.Optional[builtins.str] = None,
        format: typing.Optional[builtins.str] = None,
        start_from_row: typing.Optional[jsii.Number] = None,
        text_qualifier: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param contains_header: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#contains_header QuicksightDataSet#contains_header}.
        :param delimiter: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#delimiter QuicksightDataSet#delimiter}.
        :param format: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format QuicksightDataSet#format}.
        :param start_from_row: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#start_from_row QuicksightDataSet#start_from_row}.
        :param text_qualifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#text_qualifier QuicksightDataSet#text_qualifier}.
        '''
        value = QuicksightDataSetPhysicalTableMapS3SourceUploadSettings(
            contains_header=contains_header,
            delimiter=delimiter,
            format=format,
            start_from_row=start_from_row,
            text_qualifier=text_qualifier,
        )

        return typing.cast(None, jsii.invoke(self, "putUploadSettings", [value]))

    @builtins.property
    @jsii.member(jsii_name="inputColumns")
    def input_columns(
        self,
    ) -> QuicksightDataSetPhysicalTableMapS3SourceInputColumnsList:
        return typing.cast(QuicksightDataSetPhysicalTableMapS3SourceInputColumnsList, jsii.get(self, "inputColumns"))

    @builtins.property
    @jsii.member(jsii_name="uploadSettings")
    def upload_settings(
        self,
    ) -> "QuicksightDataSetPhysicalTableMapS3SourceUploadSettingsOutputReference":
        return typing.cast("QuicksightDataSetPhysicalTableMapS3SourceUploadSettingsOutputReference", jsii.get(self, "uploadSettings"))

    @builtins.property
    @jsii.member(jsii_name="dataSourceArnInput")
    def data_source_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataSourceArnInput"))

    @builtins.property
    @jsii.member(jsii_name="inputColumnsInput")
    def input_columns_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapS3SourceInputColumns]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapS3SourceInputColumns]]], jsii.get(self, "inputColumnsInput"))

    @builtins.property
    @jsii.member(jsii_name="uploadSettingsInput")
    def upload_settings_input(
        self,
    ) -> typing.Optional["QuicksightDataSetPhysicalTableMapS3SourceUploadSettings"]:
        return typing.cast(typing.Optional["QuicksightDataSetPhysicalTableMapS3SourceUploadSettings"], jsii.get(self, "uploadSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSourceArn")
    def data_source_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataSourceArn"))

    @data_source_arn.setter
    def data_source_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08b672fe26be66d0ca39bc7f478676119a0b71131f3b808e1e29e7eef5adcbbd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataSourceArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetPhysicalTableMapS3Source]:
        return typing.cast(typing.Optional[QuicksightDataSetPhysicalTableMapS3Source], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetPhysicalTableMapS3Source],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40eafce6f3c136838828848f783becb3e88dfb99b3c053de007885faac645ebb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings",
    jsii_struct_bases=[],
    name_mapping={
        "contains_header": "containsHeader",
        "delimiter": "delimiter",
        "format": "format",
        "start_from_row": "startFromRow",
        "text_qualifier": "textQualifier",
    },
)
class QuicksightDataSetPhysicalTableMapS3SourceUploadSettings:
    def __init__(
        self,
        *,
        contains_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        delimiter: typing.Optional[builtins.str] = None,
        format: typing.Optional[builtins.str] = None,
        start_from_row: typing.Optional[jsii.Number] = None,
        text_qualifier: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param contains_header: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#contains_header QuicksightDataSet#contains_header}.
        :param delimiter: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#delimiter QuicksightDataSet#delimiter}.
        :param format: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format QuicksightDataSet#format}.
        :param start_from_row: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#start_from_row QuicksightDataSet#start_from_row}.
        :param text_qualifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#text_qualifier QuicksightDataSet#text_qualifier}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81262ec932d4fa7f52fca9e3cea895a5da911693c5bb3099d8925f9b76be390f)
            check_type(argname="argument contains_header", value=contains_header, expected_type=type_hints["contains_header"])
            check_type(argname="argument delimiter", value=delimiter, expected_type=type_hints["delimiter"])
            check_type(argname="argument format", value=format, expected_type=type_hints["format"])
            check_type(argname="argument start_from_row", value=start_from_row, expected_type=type_hints["start_from_row"])
            check_type(argname="argument text_qualifier", value=text_qualifier, expected_type=type_hints["text_qualifier"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if contains_header is not None:
            self._values["contains_header"] = contains_header
        if delimiter is not None:
            self._values["delimiter"] = delimiter
        if format is not None:
            self._values["format"] = format
        if start_from_row is not None:
            self._values["start_from_row"] = start_from_row
        if text_qualifier is not None:
            self._values["text_qualifier"] = text_qualifier

    @builtins.property
    def contains_header(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#contains_header QuicksightDataSet#contains_header}.'''
        result = self._values.get("contains_header")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def delimiter(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#delimiter QuicksightDataSet#delimiter}.'''
        result = self._values.get("delimiter")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def format(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format QuicksightDataSet#format}.'''
        result = self._values.get("format")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start_from_row(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#start_from_row QuicksightDataSet#start_from_row}.'''
        result = self._values.get("start_from_row")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def text_qualifier(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#text_qualifier QuicksightDataSet#text_qualifier}.'''
        result = self._values.get("text_qualifier")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetPhysicalTableMapS3SourceUploadSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetPhysicalTableMapS3SourceUploadSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceUploadSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a606d3dd9177c5cdc3b94061258ab90194c46395ce5390d25f9a9f86c1d1faa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetContainsHeader")
    def reset_contains_header(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainsHeader", []))

    @jsii.member(jsii_name="resetDelimiter")
    def reset_delimiter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDelimiter", []))

    @jsii.member(jsii_name="resetFormat")
    def reset_format(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFormat", []))

    @jsii.member(jsii_name="resetStartFromRow")
    def reset_start_from_row(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartFromRow", []))

    @jsii.member(jsii_name="resetTextQualifier")
    def reset_text_qualifier(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTextQualifier", []))

    @builtins.property
    @jsii.member(jsii_name="containsHeaderInput")
    def contains_header_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "containsHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="delimiterInput")
    def delimiter_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "delimiterInput"))

    @builtins.property
    @jsii.member(jsii_name="formatInput")
    def format_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "formatInput"))

    @builtins.property
    @jsii.member(jsii_name="startFromRowInput")
    def start_from_row_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "startFromRowInput"))

    @builtins.property
    @jsii.member(jsii_name="textQualifierInput")
    def text_qualifier_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "textQualifierInput"))

    @builtins.property
    @jsii.member(jsii_name="containsHeader")
    def contains_header(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "containsHeader"))

    @contains_header.setter
    def contains_header(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__95a2b0c68d96d7cb817be0ba9d558371dfa14d3312b16d96cabebdc02bc6bc6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "containsHeader", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delimiter")
    def delimiter(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delimiter"))

    @delimiter.setter
    def delimiter(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c9ccabeaf000aa89fd7c39ee1ea3e68727e6a4e2bb856b56b3131cdc0e0ef1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delimiter", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="format")
    def format(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "format"))

    @format.setter
    def format(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a3b55b76b0e5ebfb616eb0a809d960a539084908b02dbca4305cd1ad38d0d8fa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "format", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startFromRow")
    def start_from_row(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "startFromRow"))

    @start_from_row.setter
    def start_from_row(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7e42303d82fea9e9ef3e5219762d9639517c350e8d627fcd506eb4abdef57c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startFromRow", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="textQualifier")
    def text_qualifier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "textQualifier"))

    @text_qualifier.setter
    def text_qualifier(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30674e12c6e87f00a1e99d02c0c4c969d58fc6d9e8e002d57d1eb3df38050a80)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "textQualifier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetPhysicalTableMapS3SourceUploadSettings]:
        return typing.cast(typing.Optional[QuicksightDataSetPhysicalTableMapS3SourceUploadSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetPhysicalTableMapS3SourceUploadSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2b4e5a30d598051b8086ce8b67d545e8fcb04295b579de8a0efebd3411621e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRefreshProperties",
    jsii_struct_bases=[],
    name_mapping={"refresh_configuration": "refreshConfiguration"},
)
class QuicksightDataSetRefreshProperties:
    def __init__(
        self,
        *,
        refresh_configuration: typing.Union["QuicksightDataSetRefreshPropertiesRefreshConfiguration", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param refresh_configuration: refresh_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_configuration QuicksightDataSet#refresh_configuration}
        '''
        if isinstance(refresh_configuration, dict):
            refresh_configuration = QuicksightDataSetRefreshPropertiesRefreshConfiguration(**refresh_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7c02fa961b3a585acaf7741fc891e0c9b6413f613da99d3e1e69e5a8db3031be)
            check_type(argname="argument refresh_configuration", value=refresh_configuration, expected_type=type_hints["refresh_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "refresh_configuration": refresh_configuration,
        }

    @builtins.property
    def refresh_configuration(
        self,
    ) -> "QuicksightDataSetRefreshPropertiesRefreshConfiguration":
        '''refresh_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_configuration QuicksightDataSet#refresh_configuration}
        '''
        result = self._values.get("refresh_configuration")
        assert result is not None, "Required property 'refresh_configuration' is missing"
        return typing.cast("QuicksightDataSetRefreshPropertiesRefreshConfiguration", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetRefreshProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetRefreshPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__06c4bf05e3752eb8b9a9c18eaa99e34a288785dba258d6f7b7d0062c836c5630)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRefreshConfiguration")
    def put_refresh_configuration(
        self,
        *,
        incremental_refresh: typing.Union["QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param incremental_refresh: incremental_refresh block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#incremental_refresh QuicksightDataSet#incremental_refresh}
        '''
        value = QuicksightDataSetRefreshPropertiesRefreshConfiguration(
            incremental_refresh=incremental_refresh
        )

        return typing.cast(None, jsii.invoke(self, "putRefreshConfiguration", [value]))

    @builtins.property
    @jsii.member(jsii_name="refreshConfiguration")
    def refresh_configuration(
        self,
    ) -> "QuicksightDataSetRefreshPropertiesRefreshConfigurationOutputReference":
        return typing.cast("QuicksightDataSetRefreshPropertiesRefreshConfigurationOutputReference", jsii.get(self, "refreshConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="refreshConfigurationInput")
    def refresh_configuration_input(
        self,
    ) -> typing.Optional["QuicksightDataSetRefreshPropertiesRefreshConfiguration"]:
        return typing.cast(typing.Optional["QuicksightDataSetRefreshPropertiesRefreshConfiguration"], jsii.get(self, "refreshConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[QuicksightDataSetRefreshProperties]:
        return typing.cast(typing.Optional[QuicksightDataSetRefreshProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetRefreshProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf4e437140785483823a1631526dfb958e9ac486894216afb859df45ad0388dc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfiguration",
    jsii_struct_bases=[],
    name_mapping={"incremental_refresh": "incrementalRefresh"},
)
class QuicksightDataSetRefreshPropertiesRefreshConfiguration:
    def __init__(
        self,
        *,
        incremental_refresh: typing.Union["QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param incremental_refresh: incremental_refresh block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#incremental_refresh QuicksightDataSet#incremental_refresh}
        '''
        if isinstance(incremental_refresh, dict):
            incremental_refresh = QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh(**incremental_refresh)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2218a59e7f0941aec670993bf28296cc9e632c6a5a26c3cbd65ae954263a463c)
            check_type(argname="argument incremental_refresh", value=incremental_refresh, expected_type=type_hints["incremental_refresh"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "incremental_refresh": incremental_refresh,
        }

    @builtins.property
    def incremental_refresh(
        self,
    ) -> "QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh":
        '''incremental_refresh block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#incremental_refresh QuicksightDataSet#incremental_refresh}
        '''
        result = self._values.get("incremental_refresh")
        assert result is not None, "Required property 'incremental_refresh' is missing"
        return typing.cast("QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetRefreshPropertiesRefreshConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh",
    jsii_struct_bases=[],
    name_mapping={"lookback_window": "lookbackWindow"},
)
class QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh:
    def __init__(
        self,
        *,
        lookback_window: typing.Union["QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param lookback_window: lookback_window block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#lookback_window QuicksightDataSet#lookback_window}
        '''
        if isinstance(lookback_window, dict):
            lookback_window = QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow(**lookback_window)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ad076b1f7f50e0b9bc86298eade63199de1fd2416c1a27b1566ee1686f1a621)
            check_type(argname="argument lookback_window", value=lookback_window, expected_type=type_hints["lookback_window"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "lookback_window": lookback_window,
        }

    @builtins.property
    def lookback_window(
        self,
    ) -> "QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow":
        '''lookback_window block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#lookback_window QuicksightDataSet#lookback_window}
        '''
        result = self._values.get("lookback_window")
        assert result is not None, "Required property 'lookback_window' is missing"
        return typing.cast("QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow",
    jsii_struct_bases=[],
    name_mapping={
        "column_name": "columnName",
        "size": "size",
        "size_unit": "sizeUnit",
    },
)
class QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow:
    def __init__(
        self,
        *,
        column_name: builtins.str,
        size: jsii.Number,
        size_unit: builtins.str,
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#size QuicksightDataSet#size}.
        :param size_unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#size_unit QuicksightDataSet#size_unit}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43fc14b1334c6f96a8d9095080268e149c1eecab3b1d4e394a886332c212be39)
            check_type(argname="argument column_name", value=column_name, expected_type=type_hints["column_name"])
            check_type(argname="argument size", value=size, expected_type=type_hints["size"])
            check_type(argname="argument size_unit", value=size_unit, expected_type=type_hints["size_unit"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "column_name": column_name,
            "size": size,
            "size_unit": size_unit,
        }

    @builtins.property
    def column_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.'''
        result = self._values.get("column_name")
        assert result is not None, "Required property 'column_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def size(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#size QuicksightDataSet#size}.'''
        result = self._values.get("size")
        assert result is not None, "Required property 'size' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def size_unit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#size_unit QuicksightDataSet#size_unit}.'''
        result = self._values.get("size_unit")
        assert result is not None, "Required property 'size_unit' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8a72944faa65db49a593b7384bfc7f2593ded4e7390268afa0cf194dbb451620)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="columnNameInput")
    def column_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "columnNameInput"))

    @builtins.property
    @jsii.member(jsii_name="sizeInput")
    def size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "sizeInput"))

    @builtins.property
    @jsii.member(jsii_name="sizeUnitInput")
    def size_unit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sizeUnitInput"))

    @builtins.property
    @jsii.member(jsii_name="columnName")
    def column_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "columnName"))

    @column_name.setter
    def column_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8af7ec7ebf29b04b16e9572d81ff41ca20c8edb957e21824c06611233595fc5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columnName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="size")
    def size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "size"))

    @size.setter
    def size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e03df5dc63ea6abe88147212c13b15b7e5d4f4599f90af1ce9dd34ff72721a29)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "size", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sizeUnit")
    def size_unit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sizeUnit"))

    @size_unit.setter
    def size_unit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__10b69b5392e2c7141390e1beff3249a18d7d822b44425d43e9cb4bd8e0c8c6ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sizeUnit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow]:
        return typing.cast(typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2e4128a6ea6ab3bec2e74da81e635e49707bbf42d5f0fb536ccfb4a374fe6dd1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__12d66a9724a0fda492d580a41a2678e3c31dc894f7268dedc636cc76b07fcb01)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putLookbackWindow")
    def put_lookback_window(
        self,
        *,
        column_name: builtins.str,
        size: jsii.Number,
        size_unit: builtins.str,
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#size QuicksightDataSet#size}.
        :param size_unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#size_unit QuicksightDataSet#size_unit}.
        '''
        value = QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow(
            column_name=column_name, size=size, size_unit=size_unit
        )

        return typing.cast(None, jsii.invoke(self, "putLookbackWindow", [value]))

    @builtins.property
    @jsii.member(jsii_name="lookbackWindow")
    def lookback_window(
        self,
    ) -> QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference:
        return typing.cast(QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference, jsii.get(self, "lookbackWindow"))

    @builtins.property
    @jsii.member(jsii_name="lookbackWindowInput")
    def lookback_window_input(
        self,
    ) -> typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow]:
        return typing.cast(typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow], jsii.get(self, "lookbackWindowInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh]:
        return typing.cast(typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c1e3cdc4b6342f1e0296a6449f141e6579a3ce4aa457872d808b9cd8b56f2ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetRefreshPropertiesRefreshConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1f8d46d3e0c703f57992dabf95f1bf9cf56544a6421047f651d8ddb2bc6f5e50)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putIncrementalRefresh")
    def put_incremental_refresh(
        self,
        *,
        lookback_window: typing.Union[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow, typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param lookback_window: lookback_window block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#lookback_window QuicksightDataSet#lookback_window}
        '''
        value = QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh(
            lookback_window=lookback_window
        )

        return typing.cast(None, jsii.invoke(self, "putIncrementalRefresh", [value]))

    @builtins.property
    @jsii.member(jsii_name="incrementalRefresh")
    def incremental_refresh(
        self,
    ) -> QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference:
        return typing.cast(QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference, jsii.get(self, "incrementalRefresh"))

    @builtins.property
    @jsii.member(jsii_name="incrementalRefreshInput")
    def incremental_refresh_input(
        self,
    ) -> typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh]:
        return typing.cast(typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh], jsii.get(self, "incrementalRefreshInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfiguration]:
        return typing.cast(typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__380221e8b208128c3dd14bfb8bdee2b6d6321ff880783faaaab4f10533782fa8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionDataSet",
    jsii_struct_bases=[],
    name_mapping={
        "arn": "arn",
        "permission_policy": "permissionPolicy",
        "format_version": "formatVersion",
        "namespace": "namespace",
        "status": "status",
    },
)
class QuicksightDataSetRowLevelPermissionDataSet:
    def __init__(
        self,
        *,
        arn: builtins.str,
        permission_policy: builtins.str,
        format_version: typing.Optional[builtins.str] = None,
        namespace: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#arn QuicksightDataSet#arn}.
        :param permission_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permission_policy QuicksightDataSet#permission_policy}.
        :param format_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format_version QuicksightDataSet#format_version}.
        :param namespace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#namespace QuicksightDataSet#namespace}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#status QuicksightDataSet#status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e129e73550457a3138f93e496ae17e098de7e7202719fb898686f91dc51b805)
            check_type(argname="argument arn", value=arn, expected_type=type_hints["arn"])
            check_type(argname="argument permission_policy", value=permission_policy, expected_type=type_hints["permission_policy"])
            check_type(argname="argument format_version", value=format_version, expected_type=type_hints["format_version"])
            check_type(argname="argument namespace", value=namespace, expected_type=type_hints["namespace"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "arn": arn,
            "permission_policy": permission_policy,
        }
        if format_version is not None:
            self._values["format_version"] = format_version
        if namespace is not None:
            self._values["namespace"] = namespace
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#arn QuicksightDataSet#arn}.'''
        result = self._values.get("arn")
        assert result is not None, "Required property 'arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def permission_policy(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permission_policy QuicksightDataSet#permission_policy}.'''
        result = self._values.get("permission_policy")
        assert result is not None, "Required property 'permission_policy' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def format_version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format_version QuicksightDataSet#format_version}.'''
        result = self._values.get("format_version")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def namespace(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#namespace QuicksightDataSet#namespace}.'''
        result = self._values.get("namespace")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#status QuicksightDataSet#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetRowLevelPermissionDataSet(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetRowLevelPermissionDataSetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionDataSetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__96bf4a9531a8a0b10e4a96be6af1d42369bb6fc6c493ffbca4cecae1c9127b76)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetFormatVersion")
    def reset_format_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFormatVersion", []))

    @jsii.member(jsii_name="resetNamespace")
    def reset_namespace(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNamespace", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="arnInput")
    def arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "arnInput"))

    @builtins.property
    @jsii.member(jsii_name="formatVersionInput")
    def format_version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "formatVersionInput"))

    @builtins.property
    @jsii.member(jsii_name="namespaceInput")
    def namespace_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namespaceInput"))

    @builtins.property
    @jsii.member(jsii_name="permissionPolicyInput")
    def permission_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "permissionPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @arn.setter
    def arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__82aad82fa9893334dca440003cf719ce5d148edd775370c3f31560c3164fa5d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "arn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="formatVersion")
    def format_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "formatVersion"))

    @format_version.setter
    def format_version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b027ab28b0a239167e70483cf2924c8abb6a36e19aef939e1d3e0cdda869ab6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "formatVersion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namespace")
    def namespace(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namespace"))

    @namespace.setter
    def namespace(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05a23500408b6702c984f2d238b0a53d365c13ea09d7c926d507780d42a9a356)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namespace", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="permissionPolicy")
    def permission_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "permissionPolicy"))

    @permission_policy.setter
    def permission_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0589f26af1f8b3d917f10a88bcbdbbcab2cabe2bd303ec9581ccfbcaefd5a1ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "permissionPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49d7c604c0521e77af1fec0244bd389d5055a6f36ed16634aaebc1432ee04e1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetRowLevelPermissionDataSet]:
        return typing.cast(typing.Optional[QuicksightDataSetRowLevelPermissionDataSet], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetRowLevelPermissionDataSet],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__de0d1ac339cc453094130614d1dfc2955b33e6ccd08b961d8f178f97ba6583af)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionTagConfiguration",
    jsii_struct_bases=[],
    name_mapping={"tag_rules": "tagRules", "status": "status"},
)
class QuicksightDataSetRowLevelPermissionTagConfiguration:
    def __init__(
        self,
        *,
        tag_rules: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetRowLevelPermissionTagConfigurationTagRules", typing.Dict[builtins.str, typing.Any]]]],
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param tag_rules: tag_rules block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_rules QuicksightDataSet#tag_rules}
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#status QuicksightDataSet#status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dd242733d89303c5631fee248142f8ea7168a75eee5b073eb4a103c0ebcbf911)
            check_type(argname="argument tag_rules", value=tag_rules, expected_type=type_hints["tag_rules"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "tag_rules": tag_rules,
        }
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def tag_rules(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetRowLevelPermissionTagConfigurationTagRules"]]:
        '''tag_rules block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_rules QuicksightDataSet#tag_rules}
        '''
        result = self._values.get("tag_rules")
        assert result is not None, "Required property 'tag_rules' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetRowLevelPermissionTagConfigurationTagRules"]], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#status QuicksightDataSet#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetRowLevelPermissionTagConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetRowLevelPermissionTagConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionTagConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0003ebf885e7991adff04601cd697601be546b53ff671d7c829b76c16cad46e4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putTagRules")
    def put_tag_rules(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDataSetRowLevelPermissionTagConfigurationTagRules", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c987c320713066928e29129bf818c95cde6e36609634d39bd74892fa4236716b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTagRules", [value]))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="tagRules")
    def tag_rules(
        self,
    ) -> "QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesList":
        return typing.cast("QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesList", jsii.get(self, "tagRules"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="tagRulesInput")
    def tag_rules_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetRowLevelPermissionTagConfigurationTagRules"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDataSetRowLevelPermissionTagConfigurationTagRules"]]], jsii.get(self, "tagRulesInput"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ad0919ab1da6fcac0d234ee9134aa01910be4d97e01e64b1151082d6add74c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDataSetRowLevelPermissionTagConfiguration]:
        return typing.cast(typing.Optional[QuicksightDataSetRowLevelPermissionTagConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDataSetRowLevelPermissionTagConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c1be600edae9e5c90d64c9af3d3180ac74d14b4c2c4609772543e1d9c9599db)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionTagConfigurationTagRules",
    jsii_struct_bases=[],
    name_mapping={
        "column_name": "columnName",
        "tag_key": "tagKey",
        "match_all_value": "matchAllValue",
        "tag_multi_value_delimiter": "tagMultiValueDelimiter",
    },
)
class QuicksightDataSetRowLevelPermissionTagConfigurationTagRules:
    def __init__(
        self,
        *,
        column_name: builtins.str,
        tag_key: builtins.str,
        match_all_value: typing.Optional[builtins.str] = None,
        tag_multi_value_delimiter: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param column_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
        :param tag_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_key QuicksightDataSet#tag_key}.
        :param match_all_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#match_all_value QuicksightDataSet#match_all_value}.
        :param tag_multi_value_delimiter: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_multi_value_delimiter QuicksightDataSet#tag_multi_value_delimiter}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4459ea1538db917df71febb2cfcef4ffdaf48baf65d7b9d595c48f2b4d1a355a)
            check_type(argname="argument column_name", value=column_name, expected_type=type_hints["column_name"])
            check_type(argname="argument tag_key", value=tag_key, expected_type=type_hints["tag_key"])
            check_type(argname="argument match_all_value", value=match_all_value, expected_type=type_hints["match_all_value"])
            check_type(argname="argument tag_multi_value_delimiter", value=tag_multi_value_delimiter, expected_type=type_hints["tag_multi_value_delimiter"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "column_name": column_name,
            "tag_key": tag_key,
        }
        if match_all_value is not None:
            self._values["match_all_value"] = match_all_value
        if tag_multi_value_delimiter is not None:
            self._values["tag_multi_value_delimiter"] = tag_multi_value_delimiter

    @builtins.property
    def column_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.'''
        result = self._values.get("column_name")
        assert result is not None, "Required property 'column_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def tag_key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_key QuicksightDataSet#tag_key}.'''
        result = self._values.get("tag_key")
        assert result is not None, "Required property 'tag_key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def match_all_value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#match_all_value QuicksightDataSet#match_all_value}.'''
        result = self._values.get("match_all_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tag_multi_value_delimiter(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_multi_value_delimiter QuicksightDataSet#tag_multi_value_delimiter}.'''
        result = self._values.get("tag_multi_value_delimiter")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDataSetRowLevelPermissionTagConfigurationTagRules(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__282c16961e2b46fc8a18c1e744ac882f5f507c212c0c5c6a6e1cba8da0ba84a2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12c4af91625ef8d6e0307804d0e3eb0b2db31976de676678a41b5af179b1ecef)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30a5cc87f847927ee01c09804cec368b8aeb3a4c308f2e277cd594428c8a1781)
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
            type_hints = typing.get_type_hints(_typecheckingstub__30ee9eab50b8048d13fad78153c561e5141f376370dccee4fd92041a2983f674)
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
            type_hints = typing.get_type_hints(_typecheckingstub__fb724963ab2b15b64ce311c474452a43f60848e9839f8ac24edc9455af3398c9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetRowLevelPermissionTagConfigurationTagRules]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetRowLevelPermissionTagConfigurationTagRules]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetRowLevelPermissionTagConfigurationTagRules]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eae8cc09fba14404d0174fb4788a38d2219bd1edaffcf1a14a966dba443e533d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__68373d0cb012e67ab0df809cbe4a49b33a2bb4e8d3841e63841641748e0e0276)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetMatchAllValue")
    def reset_match_all_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMatchAllValue", []))

    @jsii.member(jsii_name="resetTagMultiValueDelimiter")
    def reset_tag_multi_value_delimiter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagMultiValueDelimiter", []))

    @builtins.property
    @jsii.member(jsii_name="columnNameInput")
    def column_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "columnNameInput"))

    @builtins.property
    @jsii.member(jsii_name="matchAllValueInput")
    def match_all_value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "matchAllValueInput"))

    @builtins.property
    @jsii.member(jsii_name="tagKeyInput")
    def tag_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "tagKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="tagMultiValueDelimiterInput")
    def tag_multi_value_delimiter_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "tagMultiValueDelimiterInput"))

    @builtins.property
    @jsii.member(jsii_name="columnName")
    def column_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "columnName"))

    @column_name.setter
    def column_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__835efdd0760960e0a80f18ad071ef690adcfcc41e2f65c2b5d5f26fe22172c6f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "columnName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="matchAllValue")
    def match_all_value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "matchAllValue"))

    @match_all_value.setter
    def match_all_value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__70feac890a729b75de8a44b2b863b64013e84f9506431992317e4fc2289228ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "matchAllValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagKey")
    def tag_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tagKey"))

    @tag_key.setter
    def tag_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7050a4fcf7b858206bd58f3c20d02adb83aa63b17788fcca50c018b8c4e07ed2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagMultiValueDelimiter")
    def tag_multi_value_delimiter(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tagMultiValueDelimiter"))

    @tag_multi_value_delimiter.setter
    def tag_multi_value_delimiter(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5006bad3afac028dee287b051e60a3fd48a504dc034a3dbebe4cf82d0f4a65f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagMultiValueDelimiter", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetRowLevelPermissionTagConfigurationTagRules]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetRowLevelPermissionTagConfigurationTagRules]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetRowLevelPermissionTagConfigurationTagRules]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22003962735d80e621043d302b22dcf515e679ecbec12f3f1f9fb2a106a6a3bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "QuicksightDataSet",
    "QuicksightDataSetColumnGroups",
    "QuicksightDataSetColumnGroupsGeoSpatialColumnGroup",
    "QuicksightDataSetColumnGroupsGeoSpatialColumnGroupOutputReference",
    "QuicksightDataSetColumnGroupsList",
    "QuicksightDataSetColumnGroupsOutputReference",
    "QuicksightDataSetColumnLevelPermissionRules",
    "QuicksightDataSetColumnLevelPermissionRulesList",
    "QuicksightDataSetColumnLevelPermissionRulesOutputReference",
    "QuicksightDataSetConfig",
    "QuicksightDataSetDataSetUsageConfiguration",
    "QuicksightDataSetDataSetUsageConfigurationOutputReference",
    "QuicksightDataSetFieldFolders",
    "QuicksightDataSetFieldFoldersList",
    "QuicksightDataSetFieldFoldersOutputReference",
    "QuicksightDataSetLogicalTableMap",
    "QuicksightDataSetLogicalTableMapDataTransforms",
    "QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation",
    "QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperationOutputReference",
    "QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation",
    "QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns",
    "QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumnsList",
    "QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumnsOutputReference",
    "QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationOutputReference",
    "QuicksightDataSetLogicalTableMapDataTransformsFilterOperation",
    "QuicksightDataSetLogicalTableMapDataTransformsFilterOperationOutputReference",
    "QuicksightDataSetLogicalTableMapDataTransformsList",
    "QuicksightDataSetLogicalTableMapDataTransformsOutputReference",
    "QuicksightDataSetLogicalTableMapDataTransformsProjectOperation",
    "QuicksightDataSetLogicalTableMapDataTransformsProjectOperationOutputReference",
    "QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation",
    "QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference",
    "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation",
    "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationOutputReference",
    "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags",
    "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription",
    "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescriptionOutputReference",
    "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsList",
    "QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsOutputReference",
    "QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation",
    "QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperationOutputReference",
    "QuicksightDataSetLogicalTableMapList",
    "QuicksightDataSetLogicalTableMapOutputReference",
    "QuicksightDataSetLogicalTableMapSource",
    "QuicksightDataSetLogicalTableMapSourceJoinInstruction",
    "QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties",
    "QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyPropertiesOutputReference",
    "QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference",
    "QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties",
    "QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyPropertiesOutputReference",
    "QuicksightDataSetLogicalTableMapSourceOutputReference",
    "QuicksightDataSetOutputColumns",
    "QuicksightDataSetOutputColumnsList",
    "QuicksightDataSetOutputColumnsOutputReference",
    "QuicksightDataSetPermissions",
    "QuicksightDataSetPermissionsList",
    "QuicksightDataSetPermissionsOutputReference",
    "QuicksightDataSetPhysicalTableMap",
    "QuicksightDataSetPhysicalTableMapCustomSql",
    "QuicksightDataSetPhysicalTableMapCustomSqlColumns",
    "QuicksightDataSetPhysicalTableMapCustomSqlColumnsList",
    "QuicksightDataSetPhysicalTableMapCustomSqlColumnsOutputReference",
    "QuicksightDataSetPhysicalTableMapCustomSqlOutputReference",
    "QuicksightDataSetPhysicalTableMapList",
    "QuicksightDataSetPhysicalTableMapOutputReference",
    "QuicksightDataSetPhysicalTableMapRelationalTable",
    "QuicksightDataSetPhysicalTableMapRelationalTableInputColumns",
    "QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsList",
    "QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsOutputReference",
    "QuicksightDataSetPhysicalTableMapRelationalTableOutputReference",
    "QuicksightDataSetPhysicalTableMapS3Source",
    "QuicksightDataSetPhysicalTableMapS3SourceInputColumns",
    "QuicksightDataSetPhysicalTableMapS3SourceInputColumnsList",
    "QuicksightDataSetPhysicalTableMapS3SourceInputColumnsOutputReference",
    "QuicksightDataSetPhysicalTableMapS3SourceOutputReference",
    "QuicksightDataSetPhysicalTableMapS3SourceUploadSettings",
    "QuicksightDataSetPhysicalTableMapS3SourceUploadSettingsOutputReference",
    "QuicksightDataSetRefreshProperties",
    "QuicksightDataSetRefreshPropertiesOutputReference",
    "QuicksightDataSetRefreshPropertiesRefreshConfiguration",
    "QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh",
    "QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow",
    "QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference",
    "QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference",
    "QuicksightDataSetRefreshPropertiesRefreshConfigurationOutputReference",
    "QuicksightDataSetRowLevelPermissionDataSet",
    "QuicksightDataSetRowLevelPermissionDataSetOutputReference",
    "QuicksightDataSetRowLevelPermissionTagConfiguration",
    "QuicksightDataSetRowLevelPermissionTagConfigurationOutputReference",
    "QuicksightDataSetRowLevelPermissionTagConfigurationTagRules",
    "QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesList",
    "QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesOutputReference",
]

publication.publish()

def _typecheckingstub__80cfae33304e1e5cf43b234196d83b822ff98e1f651108aad06ff39a56150eac(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    data_set_id: builtins.str,
    import_mode: builtins.str,
    name: builtins.str,
    aws_account_id: typing.Optional[builtins.str] = None,
    column_groups: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetColumnGroups, typing.Dict[builtins.str, typing.Any]]]]] = None,
    column_level_permission_rules: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetColumnLevelPermissionRules, typing.Dict[builtins.str, typing.Any]]]]] = None,
    data_set_usage_configuration: typing.Optional[typing.Union[QuicksightDataSetDataSetUsageConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    field_folders: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetFieldFolders, typing.Dict[builtins.str, typing.Any]]]]] = None,
    id: typing.Optional[builtins.str] = None,
    logical_table_map: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMap, typing.Dict[builtins.str, typing.Any]]]]] = None,
    permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPermissions, typing.Dict[builtins.str, typing.Any]]]]] = None,
    physical_table_map: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMap, typing.Dict[builtins.str, typing.Any]]]]] = None,
    refresh_properties: typing.Optional[typing.Union[QuicksightDataSetRefreshProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    row_level_permission_data_set: typing.Optional[typing.Union[QuicksightDataSetRowLevelPermissionDataSet, typing.Dict[builtins.str, typing.Any]]] = None,
    row_level_permission_tag_configuration: typing.Optional[typing.Union[QuicksightDataSetRowLevelPermissionTagConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
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

def _typecheckingstub__bb5f985fe1c04cd98dfb1569f6942b55decb5207721072bdb6302d66e4fb7736(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b9e549f23148d11d13946717c910bd62a21801064b78e02d390438221ff1142(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetColumnGroups, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b250922fa581f3cdd0f73fc6379d856433fade879d7176753a07cd4697840719(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetColumnLevelPermissionRules, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28bc24f15b54aadd97ab4f449c6a18fd0dcfef41f48268b300d7690a7c858bde(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetFieldFolders, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__745dde2cfd2e7e817269b8c8ed62ce6382ace75c62d1c160ad664500778785f6(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMap, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4de07cb77c1c0b51cd222189a4d2c79bde08770fd29ee3d15bb9796b9fa88019(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPermissions, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ef6e0f05b79cb45e3ec09f701afabf00ad20d75770efa08e8996d8faa13eb38(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMap, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f84285f48dc5842e09dbc9328f4e2400ab012c97723b3e29aae6c4927f7091f5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a512ae84667ac13e4d2d5abbaed24d0da2e869a4f3520f9d4f2869e11cbb5be3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__091b60442f92694cd9854fbcae128a8f3c7435f9b2f9f8c2a97014c7f541b371(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7666c47692c08eb2c95d6cf5158cdbd83f0879382f5490bec5a2897459928b27(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e899c8af7e84747e97eede0488dcdbc75498bbcfc6d52040282d52dcacdcf266(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1dcb99a9b5702fd62128df533ab5eab220b030229a614e3a95179db25b7ae2a(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a29d796ae1dca89e2cd79910d7660d064e6ec3e36fef2546f00da997903e11ae(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__302fb9e8260ba96840268c9a68924a4f48bd5acc19cb3ff20a16974ac174ef06(
    *,
    geo_spatial_column_group: typing.Optional[typing.Union[QuicksightDataSetColumnGroupsGeoSpatialColumnGroup, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eaf140083fd2e30d62f6c18f9c646b7e1a2311b2c16dc383749ee1b86a483eb2(
    *,
    columns: typing.Sequence[builtins.str],
    country_code: builtins.str,
    name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54949bf557b0a70333aa14b9c1a95f2727a5a738d954b1250d60257396e937aa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1612046c7b3ad21fb403c58467b287d194b87442aa63cd4da1353cc17b6c96c2(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf7aa6f75051f1ca70dfdc0d595b1247a686ca88da1f9e4af931b8245bf00824(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb62bf5aeecdb3e3e89e4a133965c0bda97b62accabf1a4564be7368d1bd1752(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40d837f2338017810892fe52195762996ed20e6a15f60dbf29811d8bab6df052(
    value: typing.Optional[QuicksightDataSetColumnGroupsGeoSpatialColumnGroup],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79a90950098d328ed2a219d22bb5ae81816d54ee202bea0d880e840ba0a70c48(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6105848b948487ae793cdf35d47446d598cc588b85249b068582de844b4564e1(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d10d677c97f27fc250b4a0e3062fd14ec9519673d82a95011e13962d3ec0b553(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__139e0b1508a4fe77e69d541729937b17598b9a717b6ef71b7fbda3851fe27299(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8979c78f9cb9fb0e2be3a14f7ed9de248f178abc40756ef3ab20ab14c6b7d6ba(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ac9e5d4bb8223e2ca09101cbd23b67e788003c37a428d1e5441583a4ad7b230(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnGroups]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01f82b858074e794bef817dcddca1a82cc955b3ffa5a9a39e03ee11749f7be95(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98d284317e8bad09caa8cf9d2f178ec2168f6e74b49d08e94524ea79a95e0ab4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetColumnGroups]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8811ca1d3d167cade260ff75f0e003893cf1699744ec5ce55ac5a2967ff6e793(
    *,
    column_names: typing.Optional[typing.Sequence[builtins.str]] = None,
    principals: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__756eed217fa0431e83412a04d60c17aec54724b816c65391e27085c5d5df6738(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49cc121dfbd6bc2b0284f110a1ed0e5a969694c20544ff1cd04162a88e35295e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72db5816a793268cca9a27b53fe38d85d04bd8463e0a4c9f71e9fc26bdc3f8fe(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7f8171c7b027a0df8c3ad8aeeb13b27b453250fbda9d4a6abdc6f16dc4b9ff3(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95bbb5c46db873edd85cdb926fe2a6eb5b1a1e69865697a1f82bc4ac12a8c2a6(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9dba493aa4a296a95146b90ab3e122278964aa01d6d16417cb4929c7282a713(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetColumnLevelPermissionRules]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d03c423cac7ced6d8ba8290a0db0597430c5209e936121031ad723152fb8b43(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ac3a04dc081cf6e8b9ad8e5d970a762ca11bfcc4c730fcf53ae0b1ecd84db43(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9dbb7d702bcdbaec108d83ed5ecbd9f95c9238333611a9ea55dec0382294794(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__facccd3f031a815c1936f841271a744b61c837b39cd6f97ba7443e99698d3322(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetColumnLevelPermissionRules]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6bc0de995964d1ab26786f06ee892587aa1556cfa83a3e50064fee8903abc64(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    data_set_id: builtins.str,
    import_mode: builtins.str,
    name: builtins.str,
    aws_account_id: typing.Optional[builtins.str] = None,
    column_groups: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetColumnGroups, typing.Dict[builtins.str, typing.Any]]]]] = None,
    column_level_permission_rules: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetColumnLevelPermissionRules, typing.Dict[builtins.str, typing.Any]]]]] = None,
    data_set_usage_configuration: typing.Optional[typing.Union[QuicksightDataSetDataSetUsageConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    field_folders: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetFieldFolders, typing.Dict[builtins.str, typing.Any]]]]] = None,
    id: typing.Optional[builtins.str] = None,
    logical_table_map: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMap, typing.Dict[builtins.str, typing.Any]]]]] = None,
    permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPermissions, typing.Dict[builtins.str, typing.Any]]]]] = None,
    physical_table_map: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMap, typing.Dict[builtins.str, typing.Any]]]]] = None,
    refresh_properties: typing.Optional[typing.Union[QuicksightDataSetRefreshProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    row_level_permission_data_set: typing.Optional[typing.Union[QuicksightDataSetRowLevelPermissionDataSet, typing.Dict[builtins.str, typing.Any]]] = None,
    row_level_permission_tag_configuration: typing.Optional[typing.Union[QuicksightDataSetRowLevelPermissionTagConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__538714496229f19a5c9ca2b5adc53e7e06b7e31a48c86fc9ff1cce4e7c144e26(
    *,
    disable_use_as_direct_query_source: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    disable_use_as_imported_source: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed21313ed99061479ea7d4aeb79e201eeb49d5479099a3175eccb8ad49929b47(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aae70a0b8d2a08e2cdf013a1cbf64cc466e8484a096d3ed527ef25b07960163d(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f1869a3618afc4e7c5fe4b8be9ef75d45ca9d84ca235dd2cab08c81a45de572(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c475488840dc187276a5d08bf8fb58c45d0547a9aff9d0b3715fc1601ee581bf(
    value: typing.Optional[QuicksightDataSetDataSetUsageConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c1a2b5518841749d9c28e2a863204bf57ec6b67c9dc5e2690ea3807ccbeb496(
    *,
    field_folders_id: builtins.str,
    columns: typing.Optional[typing.Sequence[builtins.str]] = None,
    description: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ed819d4c8a7adb3d070f72d9bc5c92697fbacc206a570571c33822cfc0a5383(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09786314fd26cae0c5f18981ce68a2e117fe0503944e1e056735ce89056aa68a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cae032ce67be10ee0fc21ac4b66a503463135e21f62233d8f63822e24f3c5b56(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06998a04d33873412b0a0b9ef9da6d083283ee7020c81a70ddc0164065b75319(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d07e453f136fc05c24c80fefea37d6bd664ad63c669b425791efe70aec5e6f76(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b00242f43150cf367addde4bf9715ec4280e73ed53c4d68698a0c9efe361456e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetFieldFolders]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0817a6ad458bb491555abae70b0507b22d84706f4f748c4ddf71956c9cb6f8c0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdf4a82474bfba45d7f806ef6e00246f873161f8c7d70f7932848568215093db(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__732f360760f7efa162a7bf51e9e0539c824668724c499f73877465469c0edd88(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9beea5dd80dbc6c8c10772a04c0bb69ff6c753fae9bfc0225d4619512b4bf214(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b19a3ec132569fc27385620fb743c10bf75880209c3018ae3d05be8daee6b7b7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetFieldFolders]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__870bf540afc8ec1c2757d8852afb564d6aa45983c14ce9a4966d8ccb95a77db6(
    *,
    alias: builtins.str,
    logical_table_map_id: builtins.str,
    source: typing.Union[QuicksightDataSetLogicalTableMapSource, typing.Dict[builtins.str, typing.Any]],
    data_transforms: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMapDataTransforms, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14cf89440213dcfd926d53c7120d4b416f07d9d244380f3ba07070805f6c5a4a(
    *,
    cast_column_type_operation: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation, typing.Dict[builtins.str, typing.Any]]] = None,
    create_columns_operation: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation, typing.Dict[builtins.str, typing.Any]]] = None,
    filter_operation: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsFilterOperation, typing.Dict[builtins.str, typing.Any]]] = None,
    project_operation: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsProjectOperation, typing.Dict[builtins.str, typing.Any]]] = None,
    rename_column_operation: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation, typing.Dict[builtins.str, typing.Any]]] = None,
    tag_column_operation: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation, typing.Dict[builtins.str, typing.Any]]] = None,
    untag_column_operation: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e94347c8ae9b96eda21562a33cd47c3f40c390312ac8bc752debe726482d354(
    *,
    column_name: builtins.str,
    new_column_type: builtins.str,
    format: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6213c2fcd994a5571ab2c2c149f0ae6efc4cbdfa6aeb82a3b8756c625c43a17(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf56e797304491feac0fd814efb693b3eda64666d7c67c2bffb1d20e9c9c0edb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__968a1b625bb67a2e19e6897be01547fe893f53420df0d18571d57feab9ea15b1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3abc260c35523b32def067f91791db4e8d6335bae6937ca617667aa9a1c773e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5901e0a33a5d3f865c1fa3f01e2b667bbb9dc64cf11d064eb363156991b7f56e(
    value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dcea88f03696f2c60ee2c5598dc37e1189acc556f0bf94c701e3b24ab3d45ab9(
    *,
    columns: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cccfeb4a872c31638683efd74ebdcf14795d05b850dcd13b28d5ebfa29575cbc(
    *,
    column_id: builtins.str,
    column_name: builtins.str,
    expression: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2151992f9c30063a306d86c9b23d7023d04665d75776f2fd2565c76dd70ff9db(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ead8f4f8f559b0b9fcc350c416eee0a104251f64ac1625ce95f726d5bd523800(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22ea7b9e402d84b97f73a7aeb94abed047a11bd90a3ba66f6b75010f5d450d2d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__247740c2b6f7970b7b292e5bf93e7d44d159e0375c79d74debeb406136755da7(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af1366886775af8e0526c366acaaee961aa1936a2917a400b5d5fcf45ac75598(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2de1b5cc2d0d42407c778d49f35a3167742328f66f92f230ad445ad4f1dc4562(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d9041c588fb43c8948c4dbc5d1c0f8e4579c46af75b25a8e0fd0e78997d27ef(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0d9b00adc9926ee71135fff04ab23bdb8c5be77bd091c36258359c6ab9de690(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bfd8ab46422a4b708f2b921ddce8f1ee6567fe53aca9e6d198577e8c5e807186(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__841a9bde33dd0dc82cfd19e8a6b3744a714e42b266fca9ff6d329150ada37b11(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d0819af2b19cea5966f227b4713afc932a8b5dae6874d829ff4713af5365396(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b600453f3ff9e3126af0972dd29f5e46059049a203d94eea57c8c401414d916d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__849082c7ab7a799a30b32c8d5f0859aef9aaa8984196464ccd56bfd23c23a121(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c9ea9cd9f18a4cd31bb794c95f788c7eed0a2f1a493df3a8ac620b68bc0a789b(
    value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b7ca5c36d723164d8f0fdd5fbae0298499f381656e174769a25964b3cad7014(
    *,
    condition_expression: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a91604b50b38da2e1f91fa268a96a643df56a42002e0e19532121699091ea08(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d9b41b322d5f7c7e65f2fa36f6e35d1ecffc69198c7a3d2f3ff967d22d8ea54(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d105fe7a6d77a8d398d717be2bceb9c60205341875985cebf56d1ed7463cfe7(
    value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsFilterOperation],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9c05b014695351909a66cea27f4735da2c6714cac25afbd979f684e3fa1d246(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6390126b73e01b8568da9ab587e5f11fa3e745590d7dd060b8d26d6dbc52ef8a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23e532ea37083af697268d366b82bc8db48188b7c2b3219d5ccb07b1ac3ef61d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec58a20b0308a1b478ad4d7e23d8173d806a90d9c087048d30a040f0ba747f62(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e67b1054b797265f582d06c139ef8b35ee4d63d82898846962f69382cdf90a7(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65d218a44727a67eff94c159720f33efa044579b168f331ac1b42faee1f86f13(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransforms]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc4c164caa5eae59521557a5b51aad12fc533f52fbec38c8b06bfeffef89f5bf(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ce39c827e6e54dbe61304828e4ee231230bba8e2fe97f4dbfc9184ef147a221(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransforms]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6c392af5d1286bf59901d6e33dc575dbbc2ddc0f88204bba2ca415dbba292db(
    *,
    projected_columns: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c403a1e9b37c0344a5090ad935a788ef9f43d9cc17f05ba69e05b90ed9b20e9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7fc167cf525279b0a7719a857ba64ac58483961f0d0a9284a9a62cfe69e82616(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c07c1f2f55455fd636ca5e6d0fd7f10114b6db0c55b93e3e2a9dfdb6a3f2198(
    value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsProjectOperation],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c18f9922207d938209eb908a34d264db48b8cd6869da41f86b0aa65f0eaeb289(
    *,
    column_name: builtins.str,
    new_column_name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__457c014219b3f951cf5b92d2991ca2fb235e8da412fb91fbe06013d891f16568(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__247bf2a062885f8ca14f979f594834b45a0499442e06b8c8a72452a8afc0ac96(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7bc5bd96c6e3b34c83709775d3ffc2d1a2b17993420828fdb38f3cf219106d2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a3bf7d002de866cbd6a88b424265970e07cae8744907c6d04e77446a2bfc72e(
    value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5c3752c287cc738e5d1b22b54c67e04117926a6529a5966d922e3e55f40685d(
    *,
    column_name: builtins.str,
    tags: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30e99deffed1d306bcf6d80c6d1518e803ddfc3373eb47040daa006c0b1d0b39(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e7a8465c1af2b1040242d115916c134b416c6581410cf816e708c6dcd573a03(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__022cd1af9c26c735a35453890757ec786166e219d098c9bec9e81ffde6385c3d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5fb9cba95670afa9099d97e9003e13d1768974c7703cdfc73f3b7eeb44be1a9(
    value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c337be212236d78205bff88f91612099b4eb6fdce0eaf15156d8a49f1296dfc(
    *,
    column_description: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription, typing.Dict[builtins.str, typing.Any]]] = None,
    column_geographic_role: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d3c354c45688d0c45cabb4ae64581c5c70895d2c9b976906fb2227ef301baa8(
    *,
    text: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77539380c2e25d23b9a2cecb801f17212e10858179dbdf26caa7b8b8fcf38cde(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1698fe6fc5d0da6666d0e9192328e430c79e2ebc34527b7707c3f12cb19badf7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bec92bdc7478f5648613f3feb9994f9578e76e3ee52b343f9f72db80307196a7(
    value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32c1495d169abcec6a4e30360337570696178876a0f889b6321f8f68cd66bc9d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cabf1b5b843864a621afd078df62793c4d8f26c200ea42929f646b74629ea378(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c642d514065b300f16f15bc5c5b403ff5917be591f9e9b9134652a0b7af9f2bd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d110afef4bb65fb0c8129370a47bfd229319a3fa1c4301dd2b99f725c9cbbbd3(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e58a8d10dc6167070d241e81a3894b6e4425bd5324bc30df989755b5ae2ab2f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f255406b47cdd4d9ddbe5fbd6b5d35cd58b0a46e1b5ef59428223b5a4e9f94c8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5bf5849b84e9f4df63ba231d4791431f4d8826d782431a68d0fd12c898f48a20(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efa2b9b50137e8b19eba5ecf0b6af254f862ba3eba25e67ce24153dccda5a1a1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__086d1a892aef1084247c29f10ad0f623c467adf7abab565ad5af280cb2f4fc79(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc8bbbab56303b1d8e7764141872f80143c8eac8c6a47637f30ff1119dfec119(
    *,
    column_name: builtins.str,
    tag_names: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd77dac5092f82e4547ceca4d9aca071746c7eba785754ddee3c8c2d809dd6a0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f13d5cf727df5ffebeb48900d163320d5091aa36f21d4e3c69be2024ddfdf855(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1f0c42895ebdc1cd768ff07996ba1c79be23a143da1df8f3303afafd5672497(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8bb2f956c6ee570af1a611b356d7d3975575331b446ad9c8421ee0a7072ef2f2(
    value: typing.Optional[QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__372e61b2b90e7fbea7a39686cca7285c05433ddb1de35573c7fb17af5efeda0a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d18f61eba2caea1b9d7d7506cbb7b4e8f77647956fac516b687dde064c275842(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a7eed32968fec3d95ea32daa24b0fec93cf9ebac9581bd49c428491f075cfec(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__595e8c5e6343930cb92c8c970c3d90cf0dc45697488a55d0b99238a6d4819cfd(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e12a5671eba85c75be4d492a079c42591a52ef8e2726489bf39d1042cb3fd88a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0cde2d4b90ac9ce590efeb700a078cc6ce4826b676a08dbf184390052cb6c3ee(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetLogicalTableMap]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9aba6aad76592a2e41f3ecb18d6a89bce019e9b7c54fc9b557623f0906e190f8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd503b2e7deabc8d5d9834754fac8c003425e80df61087e44968881f8dacb4d0(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetLogicalTableMapDataTransforms, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dcdd2b3e913f91fd91d7672c8ac5891967d9e2a9326d512ebc3ffbabb16270d6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0b91c0f8d1e61645607d0c12f37bca283f19140691d21bd4bc2d32d30da72fb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac78f9909bf59ee5db97b9ca16aa0041852240c5ef14c110d4e776f18ac8f104(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetLogicalTableMap]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d2e5b46aa5dd4e0c77d3a0ec6f63dbea3e2044f48e61773ac39ea59dd995195(
    *,
    data_set_arn: typing.Optional[builtins.str] = None,
    join_instruction: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapSourceJoinInstruction, typing.Dict[builtins.str, typing.Any]]] = None,
    physical_table_id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29a4f3b0e59a30bf4fe8956ad5e9eb1d83967f33ef615ddfda6d929e972a1410(
    *,
    left_operand: builtins.str,
    on_clause: builtins.str,
    right_operand: builtins.str,
    type: builtins.str,
    left_join_key_properties: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    right_join_key_properties: typing.Optional[typing.Union[QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a74b4dc324bb6c1a88a247e42e3d76b7685e73c1e41bb1e734a5b86b4b6f8d4(
    *,
    unique_key: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__702c46ac903721e4295c552163264f1284b73af24af205675813357d712d48d7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af179d18208269a0741d52a483288be2640d27aaf820fa0f4afe19a17655740a(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d47e53bf277cfbcea54911748e9be5dd8b98d0a2eaa2659adcb0d10c047ec5e1(
    value: typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8ddf31ed2f771073c1d4d080df47f5c5714f73c93a9f868467527f3215b815f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7fee8a851cdef702601656b5c5a8bd4de1ef7adc349de1fc77ad783a5039e5d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0f4d898a408d44ba71cbdc31b6240d15754aa3abcc8131aaf70de4965c6013d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__36cd6c4bfb0f0f81f5d82dcad1c8773a392aee0784c078fcbdd9150081c2ee5c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd1efe54f0674e5c6bd033a1f01eddde87cb757cf6c9e666ec44e59b19066789(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2206446555c42560b299cb4b5d85134feb73eecbf8562ec7529a83bd701e18ce(
    value: typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstruction],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a1af194d09bb348db0fe5851a6ef14c1bf68db13bcbee66278588db80685731(
    *,
    unique_key: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a3c349d5ab70e164725ca957625a2c8232f985d39358444c9714152558a0683(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9477722bb39bb5617507ce507c5113d9306e4517cbaef9669d2507ef4846ac6(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3700f99247ddb3fe16d85997367e01366f13cb3114c62b72932abce42038e7c1(
    value: typing.Optional[QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86b3e48419562ec1e938fa72c91ab5266e75ef0f60e2e918bc548bcf68f5ed78(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__129cd1572069930a28700e0ecaec9be565f8e75146b5be8aec3f41e98bf2605c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d13fc77d3e4896676dc7e3514fa69e3d72a1723896c609aff0ebec7afd6ef600(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5adad4663ace1517e1709ce3575156bde8b276d47a598d950b7ea4a6aab08d2(
    value: typing.Optional[QuicksightDataSetLogicalTableMapSource],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2cfef623eef496a2841128f71e0db0ba630f36291166df49b7433f9d58c8c42c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e80710ac42df7f641e6367b93311cd1ef672582dfb9ea2295ad9797ae3d53128(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8f8d50e5d38c87cdadfc9d12ea9e83fd33829d1d29ef9c64785051587cc8d8a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2ee21a01db197011711f3382aa8c6e0807d83928ba8d5506d2fafa03fa3a534(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc8ac28001d27f7a8196c3359f47c8a1aa6266f15e8aa21428ca505a94821421(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6dda407b7bc9570978124e11bea722133de18bf0087d6bc3c102867d5c7edd58(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93a3ad013fb48cd2f0cc30e2dcef4b0f8d62f1db8e1c6c4f49a485baa9f9aebd(
    value: typing.Optional[QuicksightDataSetOutputColumns],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17c9866eea365ed8b6825443a84a39aed7518d69e0a64985c41a5e5ec7289ecd(
    *,
    actions: typing.Sequence[builtins.str],
    principal: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61fad2da77bdf169744ffdc9bbd5fc9ab12e90ddab01dc18943221f59fceca86(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d8dff501a7a2845f7ea33ad823812b26408869a6c0bbc8d2de1d1d85557ba2e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8a1cb07d79ce74151aa53bbb1126a66d8ddcce4a4981440dca44d90fdef07cd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5057319baa19343fe79d1ed8c7101ff15f2e09c674ec6e6eba0014d4997db628(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66364980b8c2170196c5935991ed0a61e955cb7cc47a37d948fa96cac943ce05(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__faa90896603a8c7495284764e92c1136a09c1ca4c3ff7d83fdee43de3b827af5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPermissions]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2223f497611b100166f9a1e9bca679fcb78e764fff4d3b0ca36f85b79ff6a68d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ffe822a1090621cb8314874261c6df14a4a88afe623d63697bafb2b25aa7bce1(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2279e54d195756a429c60167ad2b4ba9dbbbdc89b6c64fa57662994d1d90a73f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62935bc63735be07952623c5c2a0ecf94cc2dcfbdb5f2469757de03eaf856e1d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPermissions]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3a6bcdf2af51a2d689dacb27201b8134451b479c157cdf9746a273067097824(
    *,
    physical_table_map_id: builtins.str,
    custom_sql: typing.Optional[typing.Union[QuicksightDataSetPhysicalTableMapCustomSql, typing.Dict[builtins.str, typing.Any]]] = None,
    relational_table: typing.Optional[typing.Union[QuicksightDataSetPhysicalTableMapRelationalTable, typing.Dict[builtins.str, typing.Any]]] = None,
    s3_source: typing.Optional[typing.Union[QuicksightDataSetPhysicalTableMapS3Source, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__293f52988c039672ba9dfa043c9fba6b8c1964469c7d14afdd0a3f0ed648642b(
    *,
    data_source_arn: builtins.str,
    name: builtins.str,
    sql_query: builtins.str,
    columns: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMapCustomSqlColumns, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b63e46a281f2b1d035178e0ecf54eadd86c0b66f7580abac121ffbdde0b1faa0(
    *,
    name: builtins.str,
    type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1199f199245cb0c775e409990361f778cd542a5ea01d8bd26f378b8af261a399(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1530449721a371dd45cf9d745cd0eebda7d9bf7dd9edef2d90e3532031215b5(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33e813194e1a2472ed9f4410efe282d8d42ac8c9dbd702d593726fb751434eb9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee6a6e9ca0ec7c8c40cc22f10d6cd7539078f2f341af8577f2dcb05347668fed(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e25a6155230b890b9a51fb8b9e5a96b6d963dfc8076854c69a28b590033da6c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dedca3ceb736d99d36100a455d822e18e0fee8d42a8e10b52815cd4163c09b3a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapCustomSqlColumns]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dca998e635e801e652aa0fb296ad47e6f2b0b2efa66f503e507721ef94db5982(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e1b7bfbd6576ed6da627df8829191b83c7017706d76438ab89336b09a07faeb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a006b2332661a46cd99a26b4ebd63fa31f4253fe61271850c196450dddebd61(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7fae9a36e1e31bc5d2b992bf35a673f3ae665fc071989da47ce17a471a12704b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapCustomSqlColumns]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28c4b5b4e8b2b2738d86ae4bda23a8c292d40d8bc93e2d122c317cf6717ccb61(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0621d8c4788f23e99368353d83e81e921d9c5d24ef77807a2e6f5c73d0a1f7a4(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMapCustomSqlColumns, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9772fa7a2c6c5c68127e6231ca90c9082012aecd3077aec7deae9c0e3dc96ee3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7652324d9a598af1591f92ea0670c70b65a0763a67bfedea72172ba7ddff8f1d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f59c6c97f0438800c77b1c67683de126e552171f7cba2fe3c6279d1140815fa8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__418be3b58001012ee3ccd6bdb0a6f0c63d7609523491e67b4cf9c7391719f78e(
    value: typing.Optional[QuicksightDataSetPhysicalTableMapCustomSql],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e382fecac384dabfdabe7aa388c5df99731b289c656c5a0aa74a875c96e20f2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e4dff8365471f1f0ba858090fa3b6991504f8fd706a92d38733095959295d9e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d167a62f9a472ece4a5bafe7005d99278512d49eff4b6c10e4e90d13c8ddd578(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a9ad2dd5c5895e193b31c4980a3d3dcd823084af8eb9bf39facf8d2e9973103(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96d09417371a326c6e77a06ae5d9f33a4df1d32db4a0ffaa3566fce3844b2fd3(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05cb1319b06fae6a41d18b31931f2ba64f37d42e1824a68ecb635ab2d2fa84c5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMap]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__957b19a6d152a41674a6f0c0b35df5f94f9e7d8ae51a381b23fe499a48698c83(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09e51139254fbe66818b3b9d8b45bd379d2fd7fd1fef43c454d249ecd9f392a0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0628c57dae2c81022c83c6b070c789b6e8992cf83e426c787ea6d56f9198115(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMap]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__254c05044730c4083553d55229d0e314fff67c125b9fc32905a42788da1e6fd9(
    *,
    data_source_arn: builtins.str,
    input_columns: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMapRelationalTableInputColumns, typing.Dict[builtins.str, typing.Any]]]],
    name: builtins.str,
    catalog: typing.Optional[builtins.str] = None,
    schema: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f417a5a75a3ca0c371f7cc3ac8f400d9ce79bcdca8136a92b705cbd128ea2f2a(
    *,
    name: builtins.str,
    type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9035172278d9a9d49d111e4e0ece358d057f3f76863348a5bf653a3eebaebf08(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f57d85e4e93b1c0d08777526434124b860e8ad0cc2896da0b147d503c5af1942(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2d711c91c8683de880729f2c42f206aaee7732726f7fb707f712fa4d7df44ff(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__671b3a18319c3c5abbb773d9c91ccb5f47963a6a300dcd5df5547ae6623cfaba(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29ea8d3815d15ec50b58b0e20ce702fca5468074b59176d87dc0f8725db89b65(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8790de853b89792c7ed11a4434c7f5d7f39308a54b3826e720f0620a3b0d456(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapRelationalTableInputColumns]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87694b5d812005ab134cc99796b7c663b61352fa632390690508ab9e2e8ff213(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f6aa1580af92938c9fd1f3f35a7546f243b3bda2509c79c95b73e05b10f8cd5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42720c75ff75f1d9c5e57a956c1241e922379219f97a865d6a6015092625ebe4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b42d91918cd3b0ce245c61fb086eb325d70b997950acc4d579f03514a004d4b3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapRelationalTableInputColumns]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5f70f99e3f03a35e8ab613be11893f44a9edd0755dc3f95ac30b3deb35fff8f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47749229cc259a9da360c6a5a32766245098569a1eaa776e397dbb1151321f8c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMapRelationalTableInputColumns, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1cd3b39475a4f19c7fc41d6a7f8e4c37f7eaeabe88b8134471b52ac8dab0b88c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff4838e7bd16195419f4ce057de995c2f477ddde9e8fb48c9fe3e57beb3db83a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb90a36daf6d428b81f15f95ca7a8a548530af5a75a8bb426bd1a4756c43bbe0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f8454bdcd71f0ea6c2520e4c91a774b4057c66b4cfb4b33ccee95f9fff850b5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9b75737db48a87594b90ac31d2565fdd4234f0f32393e3720bbcdc59ae14f9f(
    value: typing.Optional[QuicksightDataSetPhysicalTableMapRelationalTable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__613e28c4e2482ca81271e3cf30ea2ff5a3c3f24095f763f2f94627a3b36419af(
    *,
    data_source_arn: builtins.str,
    input_columns: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMapS3SourceInputColumns, typing.Dict[builtins.str, typing.Any]]]],
    upload_settings: typing.Union[QuicksightDataSetPhysicalTableMapS3SourceUploadSettings, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6dc30b2b0dd31bd556f39f25eec00efd4622528907919eff579718e50bd4037c(
    *,
    name: builtins.str,
    type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b937dae359d5aeab2c934130cc0ba6b47f0d6f94f745f3b6745009ccf97a622(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b84bc120a4572e78a836dba504a2ff5cb8d04b6007dbbe58ab921e24910ba21(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68bd51fe8e912daf49e377653bd3821faa7f0ac469c0e4e84a7d74653c013c54(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ded9f9d2bf23f755f7c51467be8a65f4c7a73e6bd2ebc1a0184de7c5844883c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e6d1f88df522426002e3aec39da3674acbed25e15cec3b7f2b84fcd8744237b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3c787b115606447b8682a6c751a0eeda6b024f429bd0349faa6ce7ac45ddcf6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetPhysicalTableMapS3SourceInputColumns]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ad742bf26a10f43ef02c56f6ce4cf4065e6625e0537bdf0f94438b7fee095cb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7fe933a0255d80751d42a422bec7b04bafa3b45548722636b86dd6325f79ce5b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4494781b1813aec5b76403eddf305da686aa31e3732c7188de22eb11a3f12ef(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3823b0a89394a78c1a62fe407e36779e27dfafc494ae23e5490b1218cc8bb47e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetPhysicalTableMapS3SourceInputColumns]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e094e9cf242eebae0f0318bf5bfd048510c7ab7678a5fc46c9e7e40ad09ebd3a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b9cb1264c07d3ddda4461f6749082961d36260f9041b31be163943ba3654f23(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetPhysicalTableMapS3SourceInputColumns, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08b672fe26be66d0ca39bc7f478676119a0b71131f3b808e1e29e7eef5adcbbd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40eafce6f3c136838828848f783becb3e88dfb99b3c053de007885faac645ebb(
    value: typing.Optional[QuicksightDataSetPhysicalTableMapS3Source],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81262ec932d4fa7f52fca9e3cea895a5da911693c5bb3099d8925f9b76be390f(
    *,
    contains_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    delimiter: typing.Optional[builtins.str] = None,
    format: typing.Optional[builtins.str] = None,
    start_from_row: typing.Optional[jsii.Number] = None,
    text_qualifier: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a606d3dd9177c5cdc3b94061258ab90194c46395ce5390d25f9a9f86c1d1faa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95a2b0c68d96d7cb817be0ba9d558371dfa14d3312b16d96cabebdc02bc6bc6b(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c9ccabeaf000aa89fd7c39ee1ea3e68727e6a4e2bb856b56b3131cdc0e0ef1c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a3b55b76b0e5ebfb616eb0a809d960a539084908b02dbca4305cd1ad38d0d8fa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7e42303d82fea9e9ef3e5219762d9639517c350e8d627fcd506eb4abdef57c4(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30674e12c6e87f00a1e99d02c0c4c969d58fc6d9e8e002d57d1eb3df38050a80(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2b4e5a30d598051b8086ce8b67d545e8fcb04295b579de8a0efebd3411621e4(
    value: typing.Optional[QuicksightDataSetPhysicalTableMapS3SourceUploadSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c02fa961b3a585acaf7741fc891e0c9b6413f613da99d3e1e69e5a8db3031be(
    *,
    refresh_configuration: typing.Union[QuicksightDataSetRefreshPropertiesRefreshConfiguration, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06c4bf05e3752eb8b9a9c18eaa99e34a288785dba258d6f7b7d0062c836c5630(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf4e437140785483823a1631526dfb958e9ac486894216afb859df45ad0388dc(
    value: typing.Optional[QuicksightDataSetRefreshProperties],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2218a59e7f0941aec670993bf28296cc9e632c6a5a26c3cbd65ae954263a463c(
    *,
    incremental_refresh: typing.Union[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ad076b1f7f50e0b9bc86298eade63199de1fd2416c1a27b1566ee1686f1a621(
    *,
    lookback_window: typing.Union[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43fc14b1334c6f96a8d9095080268e149c1eecab3b1d4e394a886332c212be39(
    *,
    column_name: builtins.str,
    size: jsii.Number,
    size_unit: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a72944faa65db49a593b7384bfc7f2593ded4e7390268afa0cf194dbb451620(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8af7ec7ebf29b04b16e9572d81ff41ca20c8edb957e21824c06611233595fc5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e03df5dc63ea6abe88147212c13b15b7e5d4f4599f90af1ce9dd34ff72721a29(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10b69b5392e2c7141390e1beff3249a18d7d822b44425d43e9cb4bd8e0c8c6ba(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e4128a6ea6ab3bec2e74da81e635e49707bbf42d5f0fb536ccfb4a374fe6dd1(
    value: typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12d66a9724a0fda492d580a41a2678e3c31dc894f7268dedc636cc76b07fcb01(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c1e3cdc4b6342f1e0296a6449f141e6579a3ce4aa457872d808b9cd8b56f2ef(
    value: typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f8d46d3e0c703f57992dabf95f1bf9cf56544a6421047f651d8ddb2bc6f5e50(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__380221e8b208128c3dd14bfb8bdee2b6d6321ff880783faaaab4f10533782fa8(
    value: typing.Optional[QuicksightDataSetRefreshPropertiesRefreshConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e129e73550457a3138f93e496ae17e098de7e7202719fb898686f91dc51b805(
    *,
    arn: builtins.str,
    permission_policy: builtins.str,
    format_version: typing.Optional[builtins.str] = None,
    namespace: typing.Optional[builtins.str] = None,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96bf4a9531a8a0b10e4a96be6af1d42369bb6fc6c493ffbca4cecae1c9127b76(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82aad82fa9893334dca440003cf719ce5d148edd775370c3f31560c3164fa5d9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b027ab28b0a239167e70483cf2924c8abb6a36e19aef939e1d3e0cdda869ab6b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05a23500408b6702c984f2d238b0a53d365c13ea09d7c926d507780d42a9a356(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0589f26af1f8b3d917f10a88bcbdbbcab2cabe2bd303ec9581ccfbcaefd5a1ce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49d7c604c0521e77af1fec0244bd389d5055a6f36ed16634aaebc1432ee04e1c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de0d1ac339cc453094130614d1dfc2955b33e6ccd08b961d8f178f97ba6583af(
    value: typing.Optional[QuicksightDataSetRowLevelPermissionDataSet],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd242733d89303c5631fee248142f8ea7168a75eee5b073eb4a103c0ebcbf911(
    *,
    tag_rules: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetRowLevelPermissionTagConfigurationTagRules, typing.Dict[builtins.str, typing.Any]]]],
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0003ebf885e7991adff04601cd697601be546b53ff671d7c829b76c16cad46e4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c987c320713066928e29129bf818c95cde6e36609634d39bd74892fa4236716b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDataSetRowLevelPermissionTagConfigurationTagRules, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ad0919ab1da6fcac0d234ee9134aa01910be4d97e01e64b1151082d6add74c4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c1be600edae9e5c90d64c9af3d3180ac74d14b4c2c4609772543e1d9c9599db(
    value: typing.Optional[QuicksightDataSetRowLevelPermissionTagConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4459ea1538db917df71febb2cfcef4ffdaf48baf65d7b9d595c48f2b4d1a355a(
    *,
    column_name: builtins.str,
    tag_key: builtins.str,
    match_all_value: typing.Optional[builtins.str] = None,
    tag_multi_value_delimiter: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__282c16961e2b46fc8a18c1e744ac882f5f507c212c0c5c6a6e1cba8da0ba84a2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12c4af91625ef8d6e0307804d0e3eb0b2db31976de676678a41b5af179b1ecef(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30a5cc87f847927ee01c09804cec368b8aeb3a4c308f2e277cd594428c8a1781(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30ee9eab50b8048d13fad78153c561e5141f376370dccee4fd92041a2983f674(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb724963ab2b15b64ce311c474452a43f60848e9839f8ac24edc9455af3398c9(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eae8cc09fba14404d0174fb4788a38d2219bd1edaffcf1a14a966dba443e533d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDataSetRowLevelPermissionTagConfigurationTagRules]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68373d0cb012e67ab0df809cbe4a49b33a2bb4e8d3841e63841641748e0e0276(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__835efdd0760960e0a80f18ad071ef690adcfcc41e2f65c2b5d5f26fe22172c6f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70feac890a729b75de8a44b2b863b64013e84f9506431992317e4fc2289228ab(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7050a4fcf7b858206bd58f3c20d02adb83aa63b17788fcca50c018b8c4e07ed2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5006bad3afac028dee287b051e60a3fd48a504dc034a3dbebe4cf82d0f4a65f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22003962735d80e621043d302b22dcf515e679ecbec12f3f1f9fb2a106a6a3bc(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDataSetRowLevelPermissionTagConfigurationTagRules]],
) -> None:
    """Type checking stubs"""
    pass
