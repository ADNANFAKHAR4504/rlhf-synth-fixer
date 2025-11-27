r'''
# `aws_quicksight_theme`

Refer to the Terraform Registry for docs: [`aws_quicksight_theme`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme).
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


class QuicksightTheme(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightTheme",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme aws_quicksight_theme}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        base_theme_id: builtins.str,
        name: builtins.str,
        theme_id: builtins.str,
        aws_account_id: typing.Optional[builtins.str] = None,
        configuration: typing.Optional[typing.Union["QuicksightThemeConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightThemePermissions", typing.Dict[builtins.str, typing.Any]]]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["QuicksightThemeTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        version_description: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme aws_quicksight_theme} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param base_theme_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#base_theme_id QuicksightTheme#base_theme_id}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#name QuicksightTheme#name}.
        :param theme_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#theme_id QuicksightTheme#theme_id}.
        :param aws_account_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#aws_account_id QuicksightTheme#aws_account_id}.
        :param configuration: configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#configuration QuicksightTheme#configuration}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#id QuicksightTheme#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param permissions: permissions block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#permissions QuicksightTheme#permissions}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tags QuicksightTheme#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tags_all QuicksightTheme#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#timeouts QuicksightTheme#timeouts}
        :param version_description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#version_description QuicksightTheme#version_description}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1e29c56ad23b9c3ea0c399141305495c49d5243cd298c574c2d027c6441fd22)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = QuicksightThemeConfig(
            base_theme_id=base_theme_id,
            name=name,
            theme_id=theme_id,
            aws_account_id=aws_account_id,
            configuration=configuration,
            id=id,
            permissions=permissions,
            tags=tags,
            tags_all=tags_all,
            timeouts=timeouts,
            version_description=version_description,
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
        '''Generates CDKTF code for importing a QuicksightTheme resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the QuicksightTheme to import.
        :param import_from_id: The id of the existing QuicksightTheme that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the QuicksightTheme to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0dd48e35af92efbc600d1a52b2347bf784ceecc0747154c2bc730219f9780ef0)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putConfiguration")
    def put_configuration(
        self,
        *,
        data_color_palette: typing.Optional[typing.Union["QuicksightThemeConfigurationDataColorPalette", typing.Dict[builtins.str, typing.Any]]] = None,
        sheet: typing.Optional[typing.Union["QuicksightThemeConfigurationSheet", typing.Dict[builtins.str, typing.Any]]] = None,
        typography: typing.Optional[typing.Union["QuicksightThemeConfigurationTypography", typing.Dict[builtins.str, typing.Any]]] = None,
        ui_color_palette: typing.Optional[typing.Union["QuicksightThemeConfigurationUiColorPalette", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param data_color_palette: data_color_palette block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#data_color_palette QuicksightTheme#data_color_palette}
        :param sheet: sheet block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#sheet QuicksightTheme#sheet}
        :param typography: typography block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#typography QuicksightTheme#typography}
        :param ui_color_palette: ui_color_palette block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#ui_color_palette QuicksightTheme#ui_color_palette}
        '''
        value = QuicksightThemeConfiguration(
            data_color_palette=data_color_palette,
            sheet=sheet,
            typography=typography,
            ui_color_palette=ui_color_palette,
        )

        return typing.cast(None, jsii.invoke(self, "putConfiguration", [value]))

    @jsii.member(jsii_name="putPermissions")
    def put_permissions(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightThemePermissions", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd14b975483a3b5ea6e7b6df28473d4ce427a4953014d35b564bc03fef50769b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPermissions", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#create QuicksightTheme#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#delete QuicksightTheme#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#update QuicksightTheme#update}.
        '''
        value = QuicksightThemeTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetAwsAccountId")
    def reset_aws_account_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAwsAccountId", []))

    @jsii.member(jsii_name="resetConfiguration")
    def reset_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConfiguration", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetPermissions")
    def reset_permissions(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPermissions", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

    @jsii.member(jsii_name="resetVersionDescription")
    def reset_version_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVersionDescription", []))

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
    @jsii.member(jsii_name="configuration")
    def configuration(self) -> "QuicksightThemeConfigurationOutputReference":
        return typing.cast("QuicksightThemeConfigurationOutputReference", jsii.get(self, "configuration"))

    @builtins.property
    @jsii.member(jsii_name="createdTime")
    def created_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "createdTime"))

    @builtins.property
    @jsii.member(jsii_name="lastUpdatedTime")
    def last_updated_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastUpdatedTime"))

    @builtins.property
    @jsii.member(jsii_name="permissions")
    def permissions(self) -> "QuicksightThemePermissionsList":
        return typing.cast("QuicksightThemePermissionsList", jsii.get(self, "permissions"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "QuicksightThemeTimeoutsOutputReference":
        return typing.cast("QuicksightThemeTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="versionNumber")
    def version_number(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "versionNumber"))

    @builtins.property
    @jsii.member(jsii_name="awsAccountIdInput")
    def aws_account_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "awsAccountIdInput"))

    @builtins.property
    @jsii.member(jsii_name="baseThemeIdInput")
    def base_theme_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "baseThemeIdInput"))

    @builtins.property
    @jsii.member(jsii_name="configurationInput")
    def configuration_input(self) -> typing.Optional["QuicksightThemeConfiguration"]:
        return typing.cast(typing.Optional["QuicksightThemeConfiguration"], jsii.get(self, "configurationInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="permissionsInput")
    def permissions_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightThemePermissions"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightThemePermissions"]]], jsii.get(self, "permissionsInput"))

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
    @jsii.member(jsii_name="themeIdInput")
    def theme_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "themeIdInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "QuicksightThemeTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "QuicksightThemeTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="versionDescriptionInput")
    def version_description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "versionDescriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="awsAccountId")
    def aws_account_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "awsAccountId"))

    @aws_account_id.setter
    def aws_account_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca435e9af3f6898a36da822219e519c07a5bd8d7555ee9b4f05618aa962bb7bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "awsAccountId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="baseThemeId")
    def base_theme_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "baseThemeId"))

    @base_theme_id.setter
    def base_theme_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b174ef90b32d3780523a597b2ddbd67014177cc3e5b71ab919f8d0efca53b91)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "baseThemeId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f82e19cd0813e838da8fa3b0ebe16c69f157f3d4fdddc0aec4973f0fe40e1fa7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3fbffd58d9614870543712173e7af31fbdacea557945654a33bfd7ab59055920)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6349344724d80a0834e47108f9a6ac217e907074d5426c7bf4ea3b7331a8d17b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c5d7a6733468cb27e5b55190ad06027ec620a176759fca31fb6a1a984dffd95)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="themeId")
    def theme_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "themeId"))

    @theme_id.setter
    def theme_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ffc8a617125c7e4aa9ba024e33887ae5ef24a64554bcd59df9e4cf4adf676f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "themeId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="versionDescription")
    def version_description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "versionDescription"))

    @version_description.setter
    def version_description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2b669716dc60d579f74c6058df5528e010b05d6089200e6c4742cd00058ebc30)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "versionDescription", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "base_theme_id": "baseThemeId",
        "name": "name",
        "theme_id": "themeId",
        "aws_account_id": "awsAccountId",
        "configuration": "configuration",
        "id": "id",
        "permissions": "permissions",
        "tags": "tags",
        "tags_all": "tagsAll",
        "timeouts": "timeouts",
        "version_description": "versionDescription",
    },
)
class QuicksightThemeConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        base_theme_id: builtins.str,
        name: builtins.str,
        theme_id: builtins.str,
        aws_account_id: typing.Optional[builtins.str] = None,
        configuration: typing.Optional[typing.Union["QuicksightThemeConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightThemePermissions", typing.Dict[builtins.str, typing.Any]]]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["QuicksightThemeTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        version_description: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param base_theme_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#base_theme_id QuicksightTheme#base_theme_id}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#name QuicksightTheme#name}.
        :param theme_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#theme_id QuicksightTheme#theme_id}.
        :param aws_account_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#aws_account_id QuicksightTheme#aws_account_id}.
        :param configuration: configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#configuration QuicksightTheme#configuration}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#id QuicksightTheme#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param permissions: permissions block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#permissions QuicksightTheme#permissions}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tags QuicksightTheme#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tags_all QuicksightTheme#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#timeouts QuicksightTheme#timeouts}
        :param version_description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#version_description QuicksightTheme#version_description}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(configuration, dict):
            configuration = QuicksightThemeConfiguration(**configuration)
        if isinstance(timeouts, dict):
            timeouts = QuicksightThemeTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ee98c5cf3550b830c1380eb080e51b544d9028c45bde0ad34b05b1d5cb5587b)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument base_theme_id", value=base_theme_id, expected_type=type_hints["base_theme_id"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument theme_id", value=theme_id, expected_type=type_hints["theme_id"])
            check_type(argname="argument aws_account_id", value=aws_account_id, expected_type=type_hints["aws_account_id"])
            check_type(argname="argument configuration", value=configuration, expected_type=type_hints["configuration"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument permissions", value=permissions, expected_type=type_hints["permissions"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
            check_type(argname="argument version_description", value=version_description, expected_type=type_hints["version_description"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "base_theme_id": base_theme_id,
            "name": name,
            "theme_id": theme_id,
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
        if configuration is not None:
            self._values["configuration"] = configuration
        if id is not None:
            self._values["id"] = id
        if permissions is not None:
            self._values["permissions"] = permissions
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if timeouts is not None:
            self._values["timeouts"] = timeouts
        if version_description is not None:
            self._values["version_description"] = version_description

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
    def base_theme_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#base_theme_id QuicksightTheme#base_theme_id}.'''
        result = self._values.get("base_theme_id")
        assert result is not None, "Required property 'base_theme_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#name QuicksightTheme#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def theme_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#theme_id QuicksightTheme#theme_id}.'''
        result = self._values.get("theme_id")
        assert result is not None, "Required property 'theme_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def aws_account_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#aws_account_id QuicksightTheme#aws_account_id}.'''
        result = self._values.get("aws_account_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def configuration(self) -> typing.Optional["QuicksightThemeConfiguration"]:
        '''configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#configuration QuicksightTheme#configuration}
        '''
        result = self._values.get("configuration")
        return typing.cast(typing.Optional["QuicksightThemeConfiguration"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#id QuicksightTheme#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def permissions(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightThemePermissions"]]]:
        '''permissions block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#permissions QuicksightTheme#permissions}
        '''
        result = self._values.get("permissions")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightThemePermissions"]]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tags QuicksightTheme#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tags_all QuicksightTheme#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["QuicksightThemeTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#timeouts QuicksightTheme#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["QuicksightThemeTimeouts"], result)

    @builtins.property
    def version_description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#version_description QuicksightTheme#version_description}.'''
        result = self._values.get("version_description")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "data_color_palette": "dataColorPalette",
        "sheet": "sheet",
        "typography": "typography",
        "ui_color_palette": "uiColorPalette",
    },
)
class QuicksightThemeConfiguration:
    def __init__(
        self,
        *,
        data_color_palette: typing.Optional[typing.Union["QuicksightThemeConfigurationDataColorPalette", typing.Dict[builtins.str, typing.Any]]] = None,
        sheet: typing.Optional[typing.Union["QuicksightThemeConfigurationSheet", typing.Dict[builtins.str, typing.Any]]] = None,
        typography: typing.Optional[typing.Union["QuicksightThemeConfigurationTypography", typing.Dict[builtins.str, typing.Any]]] = None,
        ui_color_palette: typing.Optional[typing.Union["QuicksightThemeConfigurationUiColorPalette", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param data_color_palette: data_color_palette block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#data_color_palette QuicksightTheme#data_color_palette}
        :param sheet: sheet block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#sheet QuicksightTheme#sheet}
        :param typography: typography block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#typography QuicksightTheme#typography}
        :param ui_color_palette: ui_color_palette block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#ui_color_palette QuicksightTheme#ui_color_palette}
        '''
        if isinstance(data_color_palette, dict):
            data_color_palette = QuicksightThemeConfigurationDataColorPalette(**data_color_palette)
        if isinstance(sheet, dict):
            sheet = QuicksightThemeConfigurationSheet(**sheet)
        if isinstance(typography, dict):
            typography = QuicksightThemeConfigurationTypography(**typography)
        if isinstance(ui_color_palette, dict):
            ui_color_palette = QuicksightThemeConfigurationUiColorPalette(**ui_color_palette)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__012ce87a10604e95362b1688bcc3031d9d0fbdae04d811d2f5934e09fccc68ee)
            check_type(argname="argument data_color_palette", value=data_color_palette, expected_type=type_hints["data_color_palette"])
            check_type(argname="argument sheet", value=sheet, expected_type=type_hints["sheet"])
            check_type(argname="argument typography", value=typography, expected_type=type_hints["typography"])
            check_type(argname="argument ui_color_palette", value=ui_color_palette, expected_type=type_hints["ui_color_palette"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if data_color_palette is not None:
            self._values["data_color_palette"] = data_color_palette
        if sheet is not None:
            self._values["sheet"] = sheet
        if typography is not None:
            self._values["typography"] = typography
        if ui_color_palette is not None:
            self._values["ui_color_palette"] = ui_color_palette

    @builtins.property
    def data_color_palette(
        self,
    ) -> typing.Optional["QuicksightThemeConfigurationDataColorPalette"]:
        '''data_color_palette block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#data_color_palette QuicksightTheme#data_color_palette}
        '''
        result = self._values.get("data_color_palette")
        return typing.cast(typing.Optional["QuicksightThemeConfigurationDataColorPalette"], result)

    @builtins.property
    def sheet(self) -> typing.Optional["QuicksightThemeConfigurationSheet"]:
        '''sheet block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#sheet QuicksightTheme#sheet}
        '''
        result = self._values.get("sheet")
        return typing.cast(typing.Optional["QuicksightThemeConfigurationSheet"], result)

    @builtins.property
    def typography(self) -> typing.Optional["QuicksightThemeConfigurationTypography"]:
        '''typography block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#typography QuicksightTheme#typography}
        '''
        result = self._values.get("typography")
        return typing.cast(typing.Optional["QuicksightThemeConfigurationTypography"], result)

    @builtins.property
    def ui_color_palette(
        self,
    ) -> typing.Optional["QuicksightThemeConfigurationUiColorPalette"]:
        '''ui_color_palette block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#ui_color_palette QuicksightTheme#ui_color_palette}
        '''
        result = self._values.get("ui_color_palette")
        return typing.cast(typing.Optional["QuicksightThemeConfigurationUiColorPalette"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationDataColorPalette",
    jsii_struct_bases=[],
    name_mapping={
        "colors": "colors",
        "empty_fill_color": "emptyFillColor",
        "min_max_gradient": "minMaxGradient",
    },
)
class QuicksightThemeConfigurationDataColorPalette:
    def __init__(
        self,
        *,
        colors: typing.Optional[typing.Sequence[builtins.str]] = None,
        empty_fill_color: typing.Optional[builtins.str] = None,
        min_max_gradient: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param colors: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#colors QuicksightTheme#colors}.
        :param empty_fill_color: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#empty_fill_color QuicksightTheme#empty_fill_color}.
        :param min_max_gradient: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#min_max_gradient QuicksightTheme#min_max_gradient}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5fed4c6b0a2feb72cf9be48ea41ff58e838d64ef7d16139665f440a3ffe07f65)
            check_type(argname="argument colors", value=colors, expected_type=type_hints["colors"])
            check_type(argname="argument empty_fill_color", value=empty_fill_color, expected_type=type_hints["empty_fill_color"])
            check_type(argname="argument min_max_gradient", value=min_max_gradient, expected_type=type_hints["min_max_gradient"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if colors is not None:
            self._values["colors"] = colors
        if empty_fill_color is not None:
            self._values["empty_fill_color"] = empty_fill_color
        if min_max_gradient is not None:
            self._values["min_max_gradient"] = min_max_gradient

    @builtins.property
    def colors(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#colors QuicksightTheme#colors}.'''
        result = self._values.get("colors")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def empty_fill_color(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#empty_fill_color QuicksightTheme#empty_fill_color}.'''
        result = self._values.get("empty_fill_color")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def min_max_gradient(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#min_max_gradient QuicksightTheme#min_max_gradient}.'''
        result = self._values.get("min_max_gradient")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfigurationDataColorPalette(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightThemeConfigurationDataColorPaletteOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationDataColorPaletteOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c375e9f856460f960b6ee33d64891d18415fff851705f3b6b22a79a88f9924e9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetColors")
    def reset_colors(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetColors", []))

    @jsii.member(jsii_name="resetEmptyFillColor")
    def reset_empty_fill_color(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmptyFillColor", []))

    @jsii.member(jsii_name="resetMinMaxGradient")
    def reset_min_max_gradient(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinMaxGradient", []))

    @builtins.property
    @jsii.member(jsii_name="colorsInput")
    def colors_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "colorsInput"))

    @builtins.property
    @jsii.member(jsii_name="emptyFillColorInput")
    def empty_fill_color_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "emptyFillColorInput"))

    @builtins.property
    @jsii.member(jsii_name="minMaxGradientInput")
    def min_max_gradient_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "minMaxGradientInput"))

    @builtins.property
    @jsii.member(jsii_name="colors")
    def colors(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "colors"))

    @colors.setter
    def colors(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__591346aee9ac07b6fc94876b21ad0169cdc9bb9dbea762f2057eac10dc8aca0b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "colors", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="emptyFillColor")
    def empty_fill_color(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "emptyFillColor"))

    @empty_fill_color.setter
    def empty_fill_color(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d82c3e49a6cb9ee6a8326e56b6bff68f1ddc1e177f238932c65ad3ad159da6ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "emptyFillColor", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minMaxGradient")
    def min_max_gradient(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "minMaxGradient"))

    @min_max_gradient.setter
    def min_max_gradient(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c54b2ca81282b48f92491af3a25d5c3952f2533a3753e3cdc441a9a9d42bb37b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minMaxGradient", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightThemeConfigurationDataColorPalette]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationDataColorPalette], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightThemeConfigurationDataColorPalette],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a88352cf427351f3d18a1f83493288aa4abde51bd1bbf8b8ab93a1ea6d28e917)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightThemeConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bb1772a78bbb4f9c34bf65249e0e3678bbfcb3e6b15ea255cc528ef6e4d3ca0d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDataColorPalette")
    def put_data_color_palette(
        self,
        *,
        colors: typing.Optional[typing.Sequence[builtins.str]] = None,
        empty_fill_color: typing.Optional[builtins.str] = None,
        min_max_gradient: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param colors: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#colors QuicksightTheme#colors}.
        :param empty_fill_color: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#empty_fill_color QuicksightTheme#empty_fill_color}.
        :param min_max_gradient: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#min_max_gradient QuicksightTheme#min_max_gradient}.
        '''
        value = QuicksightThemeConfigurationDataColorPalette(
            colors=colors,
            empty_fill_color=empty_fill_color,
            min_max_gradient=min_max_gradient,
        )

        return typing.cast(None, jsii.invoke(self, "putDataColorPalette", [value]))

    @jsii.member(jsii_name="putSheet")
    def put_sheet(
        self,
        *,
        tile: typing.Optional[typing.Union["QuicksightThemeConfigurationSheetTile", typing.Dict[builtins.str, typing.Any]]] = None,
        tile_layout: typing.Optional[typing.Union["QuicksightThemeConfigurationSheetTileLayout", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param tile: tile block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tile QuicksightTheme#tile}
        :param tile_layout: tile_layout block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tile_layout QuicksightTheme#tile_layout}
        '''
        value = QuicksightThemeConfigurationSheet(tile=tile, tile_layout=tile_layout)

        return typing.cast(None, jsii.invoke(self, "putSheet", [value]))

    @jsii.member(jsii_name="putTypography")
    def put_typography(
        self,
        *,
        font_families: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightThemeConfigurationTypographyFontFamilies", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param font_families: font_families block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#font_families QuicksightTheme#font_families}
        '''
        value = QuicksightThemeConfigurationTypography(font_families=font_families)

        return typing.cast(None, jsii.invoke(self, "putTypography", [value]))

    @jsii.member(jsii_name="putUiColorPalette")
    def put_ui_color_palette(
        self,
        *,
        accent: typing.Optional[builtins.str] = None,
        accent_foreground: typing.Optional[builtins.str] = None,
        danger: typing.Optional[builtins.str] = None,
        danger_foreground: typing.Optional[builtins.str] = None,
        dimension: typing.Optional[builtins.str] = None,
        dimension_foreground: typing.Optional[builtins.str] = None,
        measure: typing.Optional[builtins.str] = None,
        measure_foreground: typing.Optional[builtins.str] = None,
        primary_background: typing.Optional[builtins.str] = None,
        primary_foreground: typing.Optional[builtins.str] = None,
        secondary_background: typing.Optional[builtins.str] = None,
        secondary_foreground: typing.Optional[builtins.str] = None,
        success: typing.Optional[builtins.str] = None,
        success_foreground: typing.Optional[builtins.str] = None,
        warning: typing.Optional[builtins.str] = None,
        warning_foreground: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param accent: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#accent QuicksightTheme#accent}.
        :param accent_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#accent_foreground QuicksightTheme#accent_foreground}.
        :param danger: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#danger QuicksightTheme#danger}.
        :param danger_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#danger_foreground QuicksightTheme#danger_foreground}.
        :param dimension: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#dimension QuicksightTheme#dimension}.
        :param dimension_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#dimension_foreground QuicksightTheme#dimension_foreground}.
        :param measure: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#measure QuicksightTheme#measure}.
        :param measure_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#measure_foreground QuicksightTheme#measure_foreground}.
        :param primary_background: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#primary_background QuicksightTheme#primary_background}.
        :param primary_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#primary_foreground QuicksightTheme#primary_foreground}.
        :param secondary_background: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#secondary_background QuicksightTheme#secondary_background}.
        :param secondary_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#secondary_foreground QuicksightTheme#secondary_foreground}.
        :param success: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#success QuicksightTheme#success}.
        :param success_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#success_foreground QuicksightTheme#success_foreground}.
        :param warning: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#warning QuicksightTheme#warning}.
        :param warning_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#warning_foreground QuicksightTheme#warning_foreground}.
        '''
        value = QuicksightThemeConfigurationUiColorPalette(
            accent=accent,
            accent_foreground=accent_foreground,
            danger=danger,
            danger_foreground=danger_foreground,
            dimension=dimension,
            dimension_foreground=dimension_foreground,
            measure=measure,
            measure_foreground=measure_foreground,
            primary_background=primary_background,
            primary_foreground=primary_foreground,
            secondary_background=secondary_background,
            secondary_foreground=secondary_foreground,
            success=success,
            success_foreground=success_foreground,
            warning=warning,
            warning_foreground=warning_foreground,
        )

        return typing.cast(None, jsii.invoke(self, "putUiColorPalette", [value]))

    @jsii.member(jsii_name="resetDataColorPalette")
    def reset_data_color_palette(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataColorPalette", []))

    @jsii.member(jsii_name="resetSheet")
    def reset_sheet(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSheet", []))

    @jsii.member(jsii_name="resetTypography")
    def reset_typography(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTypography", []))

    @jsii.member(jsii_name="resetUiColorPalette")
    def reset_ui_color_palette(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUiColorPalette", []))

    @builtins.property
    @jsii.member(jsii_name="dataColorPalette")
    def data_color_palette(
        self,
    ) -> QuicksightThemeConfigurationDataColorPaletteOutputReference:
        return typing.cast(QuicksightThemeConfigurationDataColorPaletteOutputReference, jsii.get(self, "dataColorPalette"))

    @builtins.property
    @jsii.member(jsii_name="sheet")
    def sheet(self) -> "QuicksightThemeConfigurationSheetOutputReference":
        return typing.cast("QuicksightThemeConfigurationSheetOutputReference", jsii.get(self, "sheet"))

    @builtins.property
    @jsii.member(jsii_name="typography")
    def typography(self) -> "QuicksightThemeConfigurationTypographyOutputReference":
        return typing.cast("QuicksightThemeConfigurationTypographyOutputReference", jsii.get(self, "typography"))

    @builtins.property
    @jsii.member(jsii_name="uiColorPalette")
    def ui_color_palette(
        self,
    ) -> "QuicksightThemeConfigurationUiColorPaletteOutputReference":
        return typing.cast("QuicksightThemeConfigurationUiColorPaletteOutputReference", jsii.get(self, "uiColorPalette"))

    @builtins.property
    @jsii.member(jsii_name="dataColorPaletteInput")
    def data_color_palette_input(
        self,
    ) -> typing.Optional[QuicksightThemeConfigurationDataColorPalette]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationDataColorPalette], jsii.get(self, "dataColorPaletteInput"))

    @builtins.property
    @jsii.member(jsii_name="sheetInput")
    def sheet_input(self) -> typing.Optional["QuicksightThemeConfigurationSheet"]:
        return typing.cast(typing.Optional["QuicksightThemeConfigurationSheet"], jsii.get(self, "sheetInput"))

    @builtins.property
    @jsii.member(jsii_name="typographyInput")
    def typography_input(
        self,
    ) -> typing.Optional["QuicksightThemeConfigurationTypography"]:
        return typing.cast(typing.Optional["QuicksightThemeConfigurationTypography"], jsii.get(self, "typographyInput"))

    @builtins.property
    @jsii.member(jsii_name="uiColorPaletteInput")
    def ui_color_palette_input(
        self,
    ) -> typing.Optional["QuicksightThemeConfigurationUiColorPalette"]:
        return typing.cast(typing.Optional["QuicksightThemeConfigurationUiColorPalette"], jsii.get(self, "uiColorPaletteInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[QuicksightThemeConfiguration]:
        return typing.cast(typing.Optional[QuicksightThemeConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightThemeConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14cc142099863d42f0648243c4e4baba59b0cb22ab7b3c5ae1791b3c3378d768)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheet",
    jsii_struct_bases=[],
    name_mapping={"tile": "tile", "tile_layout": "tileLayout"},
)
class QuicksightThemeConfigurationSheet:
    def __init__(
        self,
        *,
        tile: typing.Optional[typing.Union["QuicksightThemeConfigurationSheetTile", typing.Dict[builtins.str, typing.Any]]] = None,
        tile_layout: typing.Optional[typing.Union["QuicksightThemeConfigurationSheetTileLayout", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param tile: tile block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tile QuicksightTheme#tile}
        :param tile_layout: tile_layout block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tile_layout QuicksightTheme#tile_layout}
        '''
        if isinstance(tile, dict):
            tile = QuicksightThemeConfigurationSheetTile(**tile)
        if isinstance(tile_layout, dict):
            tile_layout = QuicksightThemeConfigurationSheetTileLayout(**tile_layout)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__846da5230610371b4604d59f6897e22c435541c0decb84733b6995bd0fac30fc)
            check_type(argname="argument tile", value=tile, expected_type=type_hints["tile"])
            check_type(argname="argument tile_layout", value=tile_layout, expected_type=type_hints["tile_layout"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if tile is not None:
            self._values["tile"] = tile
        if tile_layout is not None:
            self._values["tile_layout"] = tile_layout

    @builtins.property
    def tile(self) -> typing.Optional["QuicksightThemeConfigurationSheetTile"]:
        '''tile block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tile QuicksightTheme#tile}
        '''
        result = self._values.get("tile")
        return typing.cast(typing.Optional["QuicksightThemeConfigurationSheetTile"], result)

    @builtins.property
    def tile_layout(
        self,
    ) -> typing.Optional["QuicksightThemeConfigurationSheetTileLayout"]:
        '''tile_layout block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tile_layout QuicksightTheme#tile_layout}
        '''
        result = self._values.get("tile_layout")
        return typing.cast(typing.Optional["QuicksightThemeConfigurationSheetTileLayout"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfigurationSheet(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightThemeConfigurationSheetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a93a31b08d08a01a0e773d6b77cea9ce4dbec7594769cda12ac2e9573a86cef)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putTile")
    def put_tile(
        self,
        *,
        border: typing.Optional[typing.Union["QuicksightThemeConfigurationSheetTileBorder", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param border: border block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#border QuicksightTheme#border}
        '''
        value = QuicksightThemeConfigurationSheetTile(border=border)

        return typing.cast(None, jsii.invoke(self, "putTile", [value]))

    @jsii.member(jsii_name="putTileLayout")
    def put_tile_layout(
        self,
        *,
        gutter: typing.Optional[typing.Union["QuicksightThemeConfigurationSheetTileLayoutGutter", typing.Dict[builtins.str, typing.Any]]] = None,
        margin: typing.Optional[typing.Union["QuicksightThemeConfigurationSheetTileLayoutMargin", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param gutter: gutter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#gutter QuicksightTheme#gutter}
        :param margin: margin block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#margin QuicksightTheme#margin}
        '''
        value = QuicksightThemeConfigurationSheetTileLayout(
            gutter=gutter, margin=margin
        )

        return typing.cast(None, jsii.invoke(self, "putTileLayout", [value]))

    @jsii.member(jsii_name="resetTile")
    def reset_tile(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTile", []))

    @jsii.member(jsii_name="resetTileLayout")
    def reset_tile_layout(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTileLayout", []))

    @builtins.property
    @jsii.member(jsii_name="tile")
    def tile(self) -> "QuicksightThemeConfigurationSheetTileOutputReference":
        return typing.cast("QuicksightThemeConfigurationSheetTileOutputReference", jsii.get(self, "tile"))

    @builtins.property
    @jsii.member(jsii_name="tileLayout")
    def tile_layout(
        self,
    ) -> "QuicksightThemeConfigurationSheetTileLayoutOutputReference":
        return typing.cast("QuicksightThemeConfigurationSheetTileLayoutOutputReference", jsii.get(self, "tileLayout"))

    @builtins.property
    @jsii.member(jsii_name="tileInput")
    def tile_input(self) -> typing.Optional["QuicksightThemeConfigurationSheetTile"]:
        return typing.cast(typing.Optional["QuicksightThemeConfigurationSheetTile"], jsii.get(self, "tileInput"))

    @builtins.property
    @jsii.member(jsii_name="tileLayoutInput")
    def tile_layout_input(
        self,
    ) -> typing.Optional["QuicksightThemeConfigurationSheetTileLayout"]:
        return typing.cast(typing.Optional["QuicksightThemeConfigurationSheetTileLayout"], jsii.get(self, "tileLayoutInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[QuicksightThemeConfigurationSheet]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationSheet], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightThemeConfigurationSheet],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3dae5783f676c457838512b689cc2e583b49ce7be2cb917db51e5011f31f603)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetTile",
    jsii_struct_bases=[],
    name_mapping={"border": "border"},
)
class QuicksightThemeConfigurationSheetTile:
    def __init__(
        self,
        *,
        border: typing.Optional[typing.Union["QuicksightThemeConfigurationSheetTileBorder", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param border: border block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#border QuicksightTheme#border}
        '''
        if isinstance(border, dict):
            border = QuicksightThemeConfigurationSheetTileBorder(**border)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7dd6f7bfca557bb101f59890d931c6e568c19220205dfb80c69d58d3b01b8ed)
            check_type(argname="argument border", value=border, expected_type=type_hints["border"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if border is not None:
            self._values["border"] = border

    @builtins.property
    def border(self) -> typing.Optional["QuicksightThemeConfigurationSheetTileBorder"]:
        '''border block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#border QuicksightTheme#border}
        '''
        result = self._values.get("border")
        return typing.cast(typing.Optional["QuicksightThemeConfigurationSheetTileBorder"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfigurationSheetTile(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetTileBorder",
    jsii_struct_bases=[],
    name_mapping={"show": "show"},
)
class QuicksightThemeConfigurationSheetTileBorder:
    def __init__(
        self,
        *,
        show: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param show: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b0fbfc5c250d2065e621d0179bf0ca73bb8c06ad9025afd055baeda1aff8914)
            check_type(argname="argument show", value=show, expected_type=type_hints["show"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if show is not None:
            self._values["show"] = show

    @builtins.property
    def show(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.'''
        result = self._values.get("show")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfigurationSheetTileBorder(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightThemeConfigurationSheetTileBorderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetTileBorderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__007ebe482b0adb686e8625c2c54b691a1f438b0fa74ca8816c942bbf4f5a1931)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetShow")
    def reset_show(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetShow", []))

    @builtins.property
    @jsii.member(jsii_name="showInput")
    def show_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "showInput"))

    @builtins.property
    @jsii.member(jsii_name="show")
    def show(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "show"))

    @show.setter
    def show(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9fbcae6beffc7132f1bb59e3fc0021854dece960214158051bca9025b3c8d849)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "show", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightThemeConfigurationSheetTileBorder]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationSheetTileBorder], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightThemeConfigurationSheetTileBorder],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62db47a9001056a778f7682286bc53f4f2ee2928af9d6a777a542f4e090faacc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayout",
    jsii_struct_bases=[],
    name_mapping={"gutter": "gutter", "margin": "margin"},
)
class QuicksightThemeConfigurationSheetTileLayout:
    def __init__(
        self,
        *,
        gutter: typing.Optional[typing.Union["QuicksightThemeConfigurationSheetTileLayoutGutter", typing.Dict[builtins.str, typing.Any]]] = None,
        margin: typing.Optional[typing.Union["QuicksightThemeConfigurationSheetTileLayoutMargin", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param gutter: gutter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#gutter QuicksightTheme#gutter}
        :param margin: margin block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#margin QuicksightTheme#margin}
        '''
        if isinstance(gutter, dict):
            gutter = QuicksightThemeConfigurationSheetTileLayoutGutter(**gutter)
        if isinstance(margin, dict):
            margin = QuicksightThemeConfigurationSheetTileLayoutMargin(**margin)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b644c5b1898a378eb7b3bec44365c7a1557a49cdcc9c4e8401a015bec06e837d)
            check_type(argname="argument gutter", value=gutter, expected_type=type_hints["gutter"])
            check_type(argname="argument margin", value=margin, expected_type=type_hints["margin"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if gutter is not None:
            self._values["gutter"] = gutter
        if margin is not None:
            self._values["margin"] = margin

    @builtins.property
    def gutter(
        self,
    ) -> typing.Optional["QuicksightThemeConfigurationSheetTileLayoutGutter"]:
        '''gutter block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#gutter QuicksightTheme#gutter}
        '''
        result = self._values.get("gutter")
        return typing.cast(typing.Optional["QuicksightThemeConfigurationSheetTileLayoutGutter"], result)

    @builtins.property
    def margin(
        self,
    ) -> typing.Optional["QuicksightThemeConfigurationSheetTileLayoutMargin"]:
        '''margin block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#margin QuicksightTheme#margin}
        '''
        result = self._values.get("margin")
        return typing.cast(typing.Optional["QuicksightThemeConfigurationSheetTileLayoutMargin"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfigurationSheetTileLayout(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayoutGutter",
    jsii_struct_bases=[],
    name_mapping={"show": "show"},
)
class QuicksightThemeConfigurationSheetTileLayoutGutter:
    def __init__(
        self,
        *,
        show: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param show: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1eff199788d5d967a0b2fb222dd911dbc3420b33792dfdb3c7262000326cddce)
            check_type(argname="argument show", value=show, expected_type=type_hints["show"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if show is not None:
            self._values["show"] = show

    @builtins.property
    def show(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.'''
        result = self._values.get("show")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfigurationSheetTileLayoutGutter(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightThemeConfigurationSheetTileLayoutGutterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayoutGutterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__950422a7d9295336d7dc9ad8a2e7420efb7728de47a73386fadd95fa0b444b92)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetShow")
    def reset_show(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetShow", []))

    @builtins.property
    @jsii.member(jsii_name="showInput")
    def show_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "showInput"))

    @builtins.property
    @jsii.member(jsii_name="show")
    def show(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "show"))

    @show.setter
    def show(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b63342fe0891befc03cfb668b8c4bf37f4d7417e0d63dc09436226175bcf7ea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "show", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightThemeConfigurationSheetTileLayoutGutter]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationSheetTileLayoutGutter], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightThemeConfigurationSheetTileLayoutGutter],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__779af5d4fa98a0fb7ac76d841f26ea75567fce768872935ad9d62c741cb53b11)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayoutMargin",
    jsii_struct_bases=[],
    name_mapping={"show": "show"},
)
class QuicksightThemeConfigurationSheetTileLayoutMargin:
    def __init__(
        self,
        *,
        show: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param show: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d51d223402374424d35199c444ad148ccf282e2cbfedc5fb7d886f607e8b93e)
            check_type(argname="argument show", value=show, expected_type=type_hints["show"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if show is not None:
            self._values["show"] = show

    @builtins.property
    def show(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.'''
        result = self._values.get("show")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfigurationSheetTileLayoutMargin(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ed21362efb75f6e27744a6d36c1616a66a7719a5e8cca481ba34acd6a8749273)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetShow")
    def reset_show(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetShow", []))

    @builtins.property
    @jsii.member(jsii_name="showInput")
    def show_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "showInput"))

    @builtins.property
    @jsii.member(jsii_name="show")
    def show(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "show"))

    @show.setter
    def show(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d835192740b452a209c992a2f5a71b3d82047343d621efb55c6c697d8b2eadce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "show", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightThemeConfigurationSheetTileLayoutMargin]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationSheetTileLayoutMargin], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightThemeConfigurationSheetTileLayoutMargin],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07947bcf98f3309b7d7d27620bf0223769e303ee82b025656888c90ecb29790b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightThemeConfigurationSheetTileLayoutOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayoutOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0b7e33ba951d9fbae3fb4a37980a3bd2312e58cde109883f7ed74e6d3edec256)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putGutter")
    def put_gutter(
        self,
        *,
        show: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param show: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.
        '''
        value = QuicksightThemeConfigurationSheetTileLayoutGutter(show=show)

        return typing.cast(None, jsii.invoke(self, "putGutter", [value]))

    @jsii.member(jsii_name="putMargin")
    def put_margin(
        self,
        *,
        show: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param show: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.
        '''
        value = QuicksightThemeConfigurationSheetTileLayoutMargin(show=show)

        return typing.cast(None, jsii.invoke(self, "putMargin", [value]))

    @jsii.member(jsii_name="resetGutter")
    def reset_gutter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGutter", []))

    @jsii.member(jsii_name="resetMargin")
    def reset_margin(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMargin", []))

    @builtins.property
    @jsii.member(jsii_name="gutter")
    def gutter(
        self,
    ) -> QuicksightThemeConfigurationSheetTileLayoutGutterOutputReference:
        return typing.cast(QuicksightThemeConfigurationSheetTileLayoutGutterOutputReference, jsii.get(self, "gutter"))

    @builtins.property
    @jsii.member(jsii_name="margin")
    def margin(
        self,
    ) -> QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference:
        return typing.cast(QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference, jsii.get(self, "margin"))

    @builtins.property
    @jsii.member(jsii_name="gutterInput")
    def gutter_input(
        self,
    ) -> typing.Optional[QuicksightThemeConfigurationSheetTileLayoutGutter]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationSheetTileLayoutGutter], jsii.get(self, "gutterInput"))

    @builtins.property
    @jsii.member(jsii_name="marginInput")
    def margin_input(
        self,
    ) -> typing.Optional[QuicksightThemeConfigurationSheetTileLayoutMargin]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationSheetTileLayoutMargin], jsii.get(self, "marginInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightThemeConfigurationSheetTileLayout]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationSheetTileLayout], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightThemeConfigurationSheetTileLayout],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c37b63404cacc97a748df2ceb7f12f57ff659d382948a8e066e4b0c7a63fbfdf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightThemeConfigurationSheetTileOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationSheetTileOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1eb306baadedb15e571e4378a08842879e6b925dad3437aca5458893874be6f9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putBorder")
    def put_border(
        self,
        *,
        show: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param show: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.
        '''
        value = QuicksightThemeConfigurationSheetTileBorder(show=show)

        return typing.cast(None, jsii.invoke(self, "putBorder", [value]))

    @jsii.member(jsii_name="resetBorder")
    def reset_border(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBorder", []))

    @builtins.property
    @jsii.member(jsii_name="border")
    def border(self) -> QuicksightThemeConfigurationSheetTileBorderOutputReference:
        return typing.cast(QuicksightThemeConfigurationSheetTileBorderOutputReference, jsii.get(self, "border"))

    @builtins.property
    @jsii.member(jsii_name="borderInput")
    def border_input(
        self,
    ) -> typing.Optional[QuicksightThemeConfigurationSheetTileBorder]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationSheetTileBorder], jsii.get(self, "borderInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[QuicksightThemeConfigurationSheetTile]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationSheetTile], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightThemeConfigurationSheetTile],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b539c1d5b9d8a4e2ad83c7d8046e0785b2e6256487d47268fb750e5465e867b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationTypography",
    jsii_struct_bases=[],
    name_mapping={"font_families": "fontFamilies"},
)
class QuicksightThemeConfigurationTypography:
    def __init__(
        self,
        *,
        font_families: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightThemeConfigurationTypographyFontFamilies", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param font_families: font_families block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#font_families QuicksightTheme#font_families}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08794ced4eaaef0bb48ec8b0854e9f215919a48919e459bdb8e6f61cd6330e8e)
            check_type(argname="argument font_families", value=font_families, expected_type=type_hints["font_families"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if font_families is not None:
            self._values["font_families"] = font_families

    @builtins.property
    def font_families(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightThemeConfigurationTypographyFontFamilies"]]]:
        '''font_families block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#font_families QuicksightTheme#font_families}
        '''
        result = self._values.get("font_families")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightThemeConfigurationTypographyFontFamilies"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfigurationTypography(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationTypographyFontFamilies",
    jsii_struct_bases=[],
    name_mapping={"font_family": "fontFamily"},
)
class QuicksightThemeConfigurationTypographyFontFamilies:
    def __init__(self, *, font_family: typing.Optional[builtins.str] = None) -> None:
        '''
        :param font_family: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#font_family QuicksightTheme#font_family}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb8e94c7430656c4e62dc4f63c31b922bce70cf5a8790572d122390c748b0ea6)
            check_type(argname="argument font_family", value=font_family, expected_type=type_hints["font_family"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if font_family is not None:
            self._values["font_family"] = font_family

    @builtins.property
    def font_family(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#font_family QuicksightTheme#font_family}.'''
        result = self._values.get("font_family")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfigurationTypographyFontFamilies(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightThemeConfigurationTypographyFontFamiliesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationTypographyFontFamiliesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cb3ef35f06d3876f0f15a781e2e7c8391aaf20dcf16d09a782563c3723824434)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightThemeConfigurationTypographyFontFamiliesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ecd2328823648f3c706bcdf90b8ea33fb31366f9e63bf6f77e96ecc485aebf2)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightThemeConfigurationTypographyFontFamiliesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0ad453f0df29951eadf00f111da724a7bed1970fc6f3cefa658b5ee453f3591)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d1e360fd5ed0cb442e503c6a1b8226211030443b685a62174adfefd7186bf4ee)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5bc31c6168c69e3e7cf58e5dfe37e1195cd2515d1be2edc15b689f66d1ab1cf8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightThemeConfigurationTypographyFontFamilies]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightThemeConfigurationTypographyFontFamilies]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightThemeConfigurationTypographyFontFamilies]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ad7fc8367023205d5a52047c0d954534656f5525bd9a218eebbc26154f1e9f97)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightThemeConfigurationTypographyFontFamiliesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationTypographyFontFamiliesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__42eb77741187da5580092fca49d093a13acc8c5df1b22eb1d6ae69e30a2db078)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetFontFamily")
    def reset_font_family(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFontFamily", []))

    @builtins.property
    @jsii.member(jsii_name="fontFamilyInput")
    def font_family_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "fontFamilyInput"))

    @builtins.property
    @jsii.member(jsii_name="fontFamily")
    def font_family(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fontFamily"))

    @font_family.setter
    def font_family(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__45ac1c6ea6f5f688301e5de2cce00b008fc1e3c053684be84c78250a91ab87ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fontFamily", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemeConfigurationTypographyFontFamilies]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemeConfigurationTypographyFontFamilies]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemeConfigurationTypographyFontFamilies]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e78155de939f069f647ecb372ed8c9ddb636df9e54b3e764db3f0995d073f05)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightThemeConfigurationTypographyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationTypographyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fdc90af06808776a30a620028b2cfe756ea49315f2a84c8e437be0e4c3acb00a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putFontFamilies")
    def put_font_families(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightThemeConfigurationTypographyFontFamilies, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ad8e54dba961650097a4ffaa8b6bbc665ff5dc22b60c79c3648f2d8c97f92cab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFontFamilies", [value]))

    @jsii.member(jsii_name="resetFontFamilies")
    def reset_font_families(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFontFamilies", []))

    @builtins.property
    @jsii.member(jsii_name="fontFamilies")
    def font_families(self) -> QuicksightThemeConfigurationTypographyFontFamiliesList:
        return typing.cast(QuicksightThemeConfigurationTypographyFontFamiliesList, jsii.get(self, "fontFamilies"))

    @builtins.property
    @jsii.member(jsii_name="fontFamiliesInput")
    def font_families_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightThemeConfigurationTypographyFontFamilies]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightThemeConfigurationTypographyFontFamilies]]], jsii.get(self, "fontFamiliesInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[QuicksightThemeConfigurationTypography]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationTypography], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightThemeConfigurationTypography],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b807cc2baafec60e2b20712970af111b15da177ec20a19ffd962f7e4f9385ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationUiColorPalette",
    jsii_struct_bases=[],
    name_mapping={
        "accent": "accent",
        "accent_foreground": "accentForeground",
        "danger": "danger",
        "danger_foreground": "dangerForeground",
        "dimension": "dimension",
        "dimension_foreground": "dimensionForeground",
        "measure": "measure",
        "measure_foreground": "measureForeground",
        "primary_background": "primaryBackground",
        "primary_foreground": "primaryForeground",
        "secondary_background": "secondaryBackground",
        "secondary_foreground": "secondaryForeground",
        "success": "success",
        "success_foreground": "successForeground",
        "warning": "warning",
        "warning_foreground": "warningForeground",
    },
)
class QuicksightThemeConfigurationUiColorPalette:
    def __init__(
        self,
        *,
        accent: typing.Optional[builtins.str] = None,
        accent_foreground: typing.Optional[builtins.str] = None,
        danger: typing.Optional[builtins.str] = None,
        danger_foreground: typing.Optional[builtins.str] = None,
        dimension: typing.Optional[builtins.str] = None,
        dimension_foreground: typing.Optional[builtins.str] = None,
        measure: typing.Optional[builtins.str] = None,
        measure_foreground: typing.Optional[builtins.str] = None,
        primary_background: typing.Optional[builtins.str] = None,
        primary_foreground: typing.Optional[builtins.str] = None,
        secondary_background: typing.Optional[builtins.str] = None,
        secondary_foreground: typing.Optional[builtins.str] = None,
        success: typing.Optional[builtins.str] = None,
        success_foreground: typing.Optional[builtins.str] = None,
        warning: typing.Optional[builtins.str] = None,
        warning_foreground: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param accent: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#accent QuicksightTheme#accent}.
        :param accent_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#accent_foreground QuicksightTheme#accent_foreground}.
        :param danger: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#danger QuicksightTheme#danger}.
        :param danger_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#danger_foreground QuicksightTheme#danger_foreground}.
        :param dimension: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#dimension QuicksightTheme#dimension}.
        :param dimension_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#dimension_foreground QuicksightTheme#dimension_foreground}.
        :param measure: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#measure QuicksightTheme#measure}.
        :param measure_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#measure_foreground QuicksightTheme#measure_foreground}.
        :param primary_background: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#primary_background QuicksightTheme#primary_background}.
        :param primary_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#primary_foreground QuicksightTheme#primary_foreground}.
        :param secondary_background: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#secondary_background QuicksightTheme#secondary_background}.
        :param secondary_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#secondary_foreground QuicksightTheme#secondary_foreground}.
        :param success: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#success QuicksightTheme#success}.
        :param success_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#success_foreground QuicksightTheme#success_foreground}.
        :param warning: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#warning QuicksightTheme#warning}.
        :param warning_foreground: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#warning_foreground QuicksightTheme#warning_foreground}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c5f596b66974cdef0cbf2d490b726f1237fd0b49097c6e891e04594bfed3633)
            check_type(argname="argument accent", value=accent, expected_type=type_hints["accent"])
            check_type(argname="argument accent_foreground", value=accent_foreground, expected_type=type_hints["accent_foreground"])
            check_type(argname="argument danger", value=danger, expected_type=type_hints["danger"])
            check_type(argname="argument danger_foreground", value=danger_foreground, expected_type=type_hints["danger_foreground"])
            check_type(argname="argument dimension", value=dimension, expected_type=type_hints["dimension"])
            check_type(argname="argument dimension_foreground", value=dimension_foreground, expected_type=type_hints["dimension_foreground"])
            check_type(argname="argument measure", value=measure, expected_type=type_hints["measure"])
            check_type(argname="argument measure_foreground", value=measure_foreground, expected_type=type_hints["measure_foreground"])
            check_type(argname="argument primary_background", value=primary_background, expected_type=type_hints["primary_background"])
            check_type(argname="argument primary_foreground", value=primary_foreground, expected_type=type_hints["primary_foreground"])
            check_type(argname="argument secondary_background", value=secondary_background, expected_type=type_hints["secondary_background"])
            check_type(argname="argument secondary_foreground", value=secondary_foreground, expected_type=type_hints["secondary_foreground"])
            check_type(argname="argument success", value=success, expected_type=type_hints["success"])
            check_type(argname="argument success_foreground", value=success_foreground, expected_type=type_hints["success_foreground"])
            check_type(argname="argument warning", value=warning, expected_type=type_hints["warning"])
            check_type(argname="argument warning_foreground", value=warning_foreground, expected_type=type_hints["warning_foreground"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if accent is not None:
            self._values["accent"] = accent
        if accent_foreground is not None:
            self._values["accent_foreground"] = accent_foreground
        if danger is not None:
            self._values["danger"] = danger
        if danger_foreground is not None:
            self._values["danger_foreground"] = danger_foreground
        if dimension is not None:
            self._values["dimension"] = dimension
        if dimension_foreground is not None:
            self._values["dimension_foreground"] = dimension_foreground
        if measure is not None:
            self._values["measure"] = measure
        if measure_foreground is not None:
            self._values["measure_foreground"] = measure_foreground
        if primary_background is not None:
            self._values["primary_background"] = primary_background
        if primary_foreground is not None:
            self._values["primary_foreground"] = primary_foreground
        if secondary_background is not None:
            self._values["secondary_background"] = secondary_background
        if secondary_foreground is not None:
            self._values["secondary_foreground"] = secondary_foreground
        if success is not None:
            self._values["success"] = success
        if success_foreground is not None:
            self._values["success_foreground"] = success_foreground
        if warning is not None:
            self._values["warning"] = warning
        if warning_foreground is not None:
            self._values["warning_foreground"] = warning_foreground

    @builtins.property
    def accent(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#accent QuicksightTheme#accent}.'''
        result = self._values.get("accent")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def accent_foreground(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#accent_foreground QuicksightTheme#accent_foreground}.'''
        result = self._values.get("accent_foreground")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def danger(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#danger QuicksightTheme#danger}.'''
        result = self._values.get("danger")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def danger_foreground(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#danger_foreground QuicksightTheme#danger_foreground}.'''
        result = self._values.get("danger_foreground")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def dimension(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#dimension QuicksightTheme#dimension}.'''
        result = self._values.get("dimension")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def dimension_foreground(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#dimension_foreground QuicksightTheme#dimension_foreground}.'''
        result = self._values.get("dimension_foreground")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def measure(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#measure QuicksightTheme#measure}.'''
        result = self._values.get("measure")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def measure_foreground(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#measure_foreground QuicksightTheme#measure_foreground}.'''
        result = self._values.get("measure_foreground")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def primary_background(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#primary_background QuicksightTheme#primary_background}.'''
        result = self._values.get("primary_background")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def primary_foreground(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#primary_foreground QuicksightTheme#primary_foreground}.'''
        result = self._values.get("primary_foreground")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def secondary_background(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#secondary_background QuicksightTheme#secondary_background}.'''
        result = self._values.get("secondary_background")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def secondary_foreground(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#secondary_foreground QuicksightTheme#secondary_foreground}.'''
        result = self._values.get("secondary_foreground")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def success(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#success QuicksightTheme#success}.'''
        result = self._values.get("success")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def success_foreground(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#success_foreground QuicksightTheme#success_foreground}.'''
        result = self._values.get("success_foreground")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def warning(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#warning QuicksightTheme#warning}.'''
        result = self._values.get("warning")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def warning_foreground(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#warning_foreground QuicksightTheme#warning_foreground}.'''
        result = self._values.get("warning_foreground")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeConfigurationUiColorPalette(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightThemeConfigurationUiColorPaletteOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeConfigurationUiColorPaletteOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5839edefe4bcd210a5aa69213e0bc81cefced68818eb50b4a0daab945530824b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAccent")
    def reset_accent(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccent", []))

    @jsii.member(jsii_name="resetAccentForeground")
    def reset_accent_foreground(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccentForeground", []))

    @jsii.member(jsii_name="resetDanger")
    def reset_danger(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDanger", []))

    @jsii.member(jsii_name="resetDangerForeground")
    def reset_danger_foreground(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDangerForeground", []))

    @jsii.member(jsii_name="resetDimension")
    def reset_dimension(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDimension", []))

    @jsii.member(jsii_name="resetDimensionForeground")
    def reset_dimension_foreground(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDimensionForeground", []))

    @jsii.member(jsii_name="resetMeasure")
    def reset_measure(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMeasure", []))

    @jsii.member(jsii_name="resetMeasureForeground")
    def reset_measure_foreground(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMeasureForeground", []))

    @jsii.member(jsii_name="resetPrimaryBackground")
    def reset_primary_background(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrimaryBackground", []))

    @jsii.member(jsii_name="resetPrimaryForeground")
    def reset_primary_foreground(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrimaryForeground", []))

    @jsii.member(jsii_name="resetSecondaryBackground")
    def reset_secondary_background(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecondaryBackground", []))

    @jsii.member(jsii_name="resetSecondaryForeground")
    def reset_secondary_foreground(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecondaryForeground", []))

    @jsii.member(jsii_name="resetSuccess")
    def reset_success(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSuccess", []))

    @jsii.member(jsii_name="resetSuccessForeground")
    def reset_success_foreground(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSuccessForeground", []))

    @jsii.member(jsii_name="resetWarning")
    def reset_warning(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWarning", []))

    @jsii.member(jsii_name="resetWarningForeground")
    def reset_warning_foreground(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWarningForeground", []))

    @builtins.property
    @jsii.member(jsii_name="accentForegroundInput")
    def accent_foreground_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "accentForegroundInput"))

    @builtins.property
    @jsii.member(jsii_name="accentInput")
    def accent_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "accentInput"))

    @builtins.property
    @jsii.member(jsii_name="dangerForegroundInput")
    def danger_foreground_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dangerForegroundInput"))

    @builtins.property
    @jsii.member(jsii_name="dangerInput")
    def danger_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dangerInput"))

    @builtins.property
    @jsii.member(jsii_name="dimensionForegroundInput")
    def dimension_foreground_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dimensionForegroundInput"))

    @builtins.property
    @jsii.member(jsii_name="dimensionInput")
    def dimension_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dimensionInput"))

    @builtins.property
    @jsii.member(jsii_name="measureForegroundInput")
    def measure_foreground_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "measureForegroundInput"))

    @builtins.property
    @jsii.member(jsii_name="measureInput")
    def measure_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "measureInput"))

    @builtins.property
    @jsii.member(jsii_name="primaryBackgroundInput")
    def primary_background_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "primaryBackgroundInput"))

    @builtins.property
    @jsii.member(jsii_name="primaryForegroundInput")
    def primary_foreground_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "primaryForegroundInput"))

    @builtins.property
    @jsii.member(jsii_name="secondaryBackgroundInput")
    def secondary_background_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "secondaryBackgroundInput"))

    @builtins.property
    @jsii.member(jsii_name="secondaryForegroundInput")
    def secondary_foreground_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "secondaryForegroundInput"))

    @builtins.property
    @jsii.member(jsii_name="successForegroundInput")
    def success_foreground_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "successForegroundInput"))

    @builtins.property
    @jsii.member(jsii_name="successInput")
    def success_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "successInput"))

    @builtins.property
    @jsii.member(jsii_name="warningForegroundInput")
    def warning_foreground_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "warningForegroundInput"))

    @builtins.property
    @jsii.member(jsii_name="warningInput")
    def warning_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "warningInput"))

    @builtins.property
    @jsii.member(jsii_name="accent")
    def accent(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accent"))

    @accent.setter
    def accent(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea8544d3b7b63f6562402e1fa08e0c9e9ad36c09bdaa36d7bf3383181ba36af1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accent", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="accentForeground")
    def accent_foreground(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accentForeground"))

    @accent_foreground.setter
    def accent_foreground(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27f6d0e2063d593ea306ad1c22764cdf6bd50c0f24729602caedda242ab5f5c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accentForeground", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="danger")
    def danger(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "danger"))

    @danger.setter
    def danger(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86daf25ffaff938366d611e87f4200f324258fb5581d1ae0b3be428154a926ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "danger", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dangerForeground")
    def danger_foreground(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dangerForeground"))

    @danger_foreground.setter
    def danger_foreground(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2d8849e43ce8c2d7934766279c57c474830735b41623f0a4a16e4db90b5a6be)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dangerForeground", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dimension")
    def dimension(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dimension"))

    @dimension.setter
    def dimension(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d15fc5bc153de4940f3cf6ee461e212bcd986d95d53bf6fc37055fb19b23212)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dimension", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dimensionForeground")
    def dimension_foreground(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dimensionForeground"))

    @dimension_foreground.setter
    def dimension_foreground(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d11b16827d1bc91c1876cc64ca2efbce2a5f7e845fc0eadbb3f81428fa921b6a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dimensionForeground", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="measure")
    def measure(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "measure"))

    @measure.setter
    def measure(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__733de254f0ca2c91c08fe2515e3dfc9d6e42c3278c984b72c2575a2b1c901c58)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "measure", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="measureForeground")
    def measure_foreground(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "measureForeground"))

    @measure_foreground.setter
    def measure_foreground(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__587f86b4f18d416dc3670d080d8f0e5303301d119c2240ca0c32e3b0a1ed6391)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "measureForeground", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="primaryBackground")
    def primary_background(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "primaryBackground"))

    @primary_background.setter
    def primary_background(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3205fb522b9af316481445555dac7bd234359cdca09a4d24cf5d6c71c49e68b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "primaryBackground", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="primaryForeground")
    def primary_foreground(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "primaryForeground"))

    @primary_foreground.setter
    def primary_foreground(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__defbf4b28ffe4c5c79ba8603e81d432c033027afa9bd0767d9297bbe39b520b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "primaryForeground", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="secondaryBackground")
    def secondary_background(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "secondaryBackground"))

    @secondary_background.setter
    def secondary_background(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__68b761e9737addb9a65a96d16fb679016a011810425e460c9e9841d3c695f010)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "secondaryBackground", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="secondaryForeground")
    def secondary_foreground(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "secondaryForeground"))

    @secondary_foreground.setter
    def secondary_foreground(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d28b6bae358e9debf9a2071616cffd544f28a2958cd6102257bd7db17b5c43cb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "secondaryForeground", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="success")
    def success(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "success"))

    @success.setter
    def success(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8dcb0accf87a60cca6f35030444ed1578a0e7a0527dfcedce8679b6cf6138f79)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "success", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="successForeground")
    def success_foreground(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "successForeground"))

    @success_foreground.setter
    def success_foreground(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7e0c6489c054ba665ccc75fd25658673d8156089ec0d613a183bfe75c103286)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "successForeground", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="warning")
    def warning(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "warning"))

    @warning.setter
    def warning(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7eb10b75db7cd7b8d807f7715df796396417489278aa542fab980839b338300e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "warning", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="warningForeground")
    def warning_foreground(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "warningForeground"))

    @warning_foreground.setter
    def warning_foreground(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd8493ead93195cad5b569b65b402c7e77c3c963de1bfa38c2c6e074f42e1d61)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "warningForeground", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightThemeConfigurationUiColorPalette]:
        return typing.cast(typing.Optional[QuicksightThemeConfigurationUiColorPalette], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightThemeConfigurationUiColorPalette],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff061d1c2f7613f5a1f67af19107d9eef3fa6b739df194a170c785d1a080c23d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemePermissions",
    jsii_struct_bases=[],
    name_mapping={"actions": "actions", "principal": "principal"},
)
class QuicksightThemePermissions:
    def __init__(
        self,
        *,
        actions: typing.Sequence[builtins.str],
        principal: builtins.str,
    ) -> None:
        '''
        :param actions: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#actions QuicksightTheme#actions}.
        :param principal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#principal QuicksightTheme#principal}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a14c5a04354496e1d58d8616334a42a9548777238295acdbce132da1673d9f2)
            check_type(argname="argument actions", value=actions, expected_type=type_hints["actions"])
            check_type(argname="argument principal", value=principal, expected_type=type_hints["principal"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "actions": actions,
            "principal": principal,
        }

    @builtins.property
    def actions(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#actions QuicksightTheme#actions}.'''
        result = self._values.get("actions")
        assert result is not None, "Required property 'actions' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def principal(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#principal QuicksightTheme#principal}.'''
        result = self._values.get("principal")
        assert result is not None, "Required property 'principal' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemePermissions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightThemePermissionsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemePermissionsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f23a30133f8efe4bd02b1120d90ab337c14a259a30938beaf909d713a7d950f4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "QuicksightThemePermissionsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d40906e87ff35015e0621405be653fd6f555df949f4df6c699fb6a7d7422589)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightThemePermissionsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8685560fd6165f4a20dce09dec3229f3e8a5832fc9bf0c36526d47011d04d383)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0cfed5bfbf28ca705752e55f8fe99e74445bcafb7f6b73922c3f3c6e66e459e5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b192dfdbda3fc4b5b34adb7e7183c269441b0a5062b31f34649c4e62fd8c9b58)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightThemePermissions]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightThemePermissions]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightThemePermissions]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ffc459289553e75da12df872a2c334f6ca5a259726407b2a2925bde92a350b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightThemePermissionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemePermissionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a73d7626f0704770cb8216185f9306bb9196a1a473b24bbb92e4ca79806907f8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d3aac0182849dd0bab8b7353340c159ea47e12bf6402d290519c7a7d2516574b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "actions", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="principal")
    def principal(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "principal"))

    @principal.setter
    def principal(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0aef3cfda20bfb4f444562d99fcfcd879b0213854cfb0b5b736c234ae650033d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "principal", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemePermissions]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemePermissions]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemePermissions]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e807c048baa2b42419110738f972ff0a3ae84f3689a63e0aad1e9f8d74ff240)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightTheme.QuicksightThemeTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class QuicksightThemeTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#create QuicksightTheme#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#delete QuicksightTheme#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#update QuicksightTheme#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8671a2e93c685e0ee36f402e5b8090704346b2e8531ecf49d4cdb6fab9dbadf1)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#create QuicksightTheme#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#delete QuicksightTheme#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#update QuicksightTheme#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightThemeTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightThemeTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightTheme.QuicksightThemeTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e474a89076a90d6e3092e31a58de6e5b60c63e2b4f9f1890747dcf8911227d4b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8644401084fd192f9e036e22b1f030a40b3a6fd8f42928bcd720f4e55d4578b9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56061f2620b0da0ac1c141a41cff970c93fb4e4e0f905ac479a60be4860c5bb5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ccf95dbdd016cffc6081be2a4fc33e177ae847f2d24025e1531d750831e8e8a3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemeTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemeTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemeTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__829cb016b1c72263018a7b31d54563144a8787a091ac37540a50ab77d4c0b627)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "QuicksightTheme",
    "QuicksightThemeConfig",
    "QuicksightThemeConfiguration",
    "QuicksightThemeConfigurationDataColorPalette",
    "QuicksightThemeConfigurationDataColorPaletteOutputReference",
    "QuicksightThemeConfigurationOutputReference",
    "QuicksightThemeConfigurationSheet",
    "QuicksightThemeConfigurationSheetOutputReference",
    "QuicksightThemeConfigurationSheetTile",
    "QuicksightThemeConfigurationSheetTileBorder",
    "QuicksightThemeConfigurationSheetTileBorderOutputReference",
    "QuicksightThemeConfigurationSheetTileLayout",
    "QuicksightThemeConfigurationSheetTileLayoutGutter",
    "QuicksightThemeConfigurationSheetTileLayoutGutterOutputReference",
    "QuicksightThemeConfigurationSheetTileLayoutMargin",
    "QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference",
    "QuicksightThemeConfigurationSheetTileLayoutOutputReference",
    "QuicksightThemeConfigurationSheetTileOutputReference",
    "QuicksightThemeConfigurationTypography",
    "QuicksightThemeConfigurationTypographyFontFamilies",
    "QuicksightThemeConfigurationTypographyFontFamiliesList",
    "QuicksightThemeConfigurationTypographyFontFamiliesOutputReference",
    "QuicksightThemeConfigurationTypographyOutputReference",
    "QuicksightThemeConfigurationUiColorPalette",
    "QuicksightThemeConfigurationUiColorPaletteOutputReference",
    "QuicksightThemePermissions",
    "QuicksightThemePermissionsList",
    "QuicksightThemePermissionsOutputReference",
    "QuicksightThemeTimeouts",
    "QuicksightThemeTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__e1e29c56ad23b9c3ea0c399141305495c49d5243cd298c574c2d027c6441fd22(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    base_theme_id: builtins.str,
    name: builtins.str,
    theme_id: builtins.str,
    aws_account_id: typing.Optional[builtins.str] = None,
    configuration: typing.Optional[typing.Union[QuicksightThemeConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightThemePermissions, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[QuicksightThemeTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    version_description: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__0dd48e35af92efbc600d1a52b2347bf784ceecc0747154c2bc730219f9780ef0(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd14b975483a3b5ea6e7b6df28473d4ce427a4953014d35b564bc03fef50769b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightThemePermissions, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca435e9af3f6898a36da822219e519c07a5bd8d7555ee9b4f05618aa962bb7bd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b174ef90b32d3780523a597b2ddbd67014177cc3e5b71ab919f8d0efca53b91(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f82e19cd0813e838da8fa3b0ebe16c69f157f3d4fdddc0aec4973f0fe40e1fa7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3fbffd58d9614870543712173e7af31fbdacea557945654a33bfd7ab59055920(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6349344724d80a0834e47108f9a6ac217e907074d5426c7bf4ea3b7331a8d17b(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c5d7a6733468cb27e5b55190ad06027ec620a176759fca31fb6a1a984dffd95(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ffc8a617125c7e4aa9ba024e33887ae5ef24a64554bcd59df9e4cf4adf676f7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b669716dc60d579f74c6058df5528e010b05d6089200e6c4742cd00058ebc30(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ee98c5cf3550b830c1380eb080e51b544d9028c45bde0ad34b05b1d5cb5587b(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    base_theme_id: builtins.str,
    name: builtins.str,
    theme_id: builtins.str,
    aws_account_id: typing.Optional[builtins.str] = None,
    configuration: typing.Optional[typing.Union[QuicksightThemeConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightThemePermissions, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[QuicksightThemeTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    version_description: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__012ce87a10604e95362b1688bcc3031d9d0fbdae04d811d2f5934e09fccc68ee(
    *,
    data_color_palette: typing.Optional[typing.Union[QuicksightThemeConfigurationDataColorPalette, typing.Dict[builtins.str, typing.Any]]] = None,
    sheet: typing.Optional[typing.Union[QuicksightThemeConfigurationSheet, typing.Dict[builtins.str, typing.Any]]] = None,
    typography: typing.Optional[typing.Union[QuicksightThemeConfigurationTypography, typing.Dict[builtins.str, typing.Any]]] = None,
    ui_color_palette: typing.Optional[typing.Union[QuicksightThemeConfigurationUiColorPalette, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5fed4c6b0a2feb72cf9be48ea41ff58e838d64ef7d16139665f440a3ffe07f65(
    *,
    colors: typing.Optional[typing.Sequence[builtins.str]] = None,
    empty_fill_color: typing.Optional[builtins.str] = None,
    min_max_gradient: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c375e9f856460f960b6ee33d64891d18415fff851705f3b6b22a79a88f9924e9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__591346aee9ac07b6fc94876b21ad0169cdc9bb9dbea762f2057eac10dc8aca0b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d82c3e49a6cb9ee6a8326e56b6bff68f1ddc1e177f238932c65ad3ad159da6ed(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c54b2ca81282b48f92491af3a25d5c3952f2533a3753e3cdc441a9a9d42bb37b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a88352cf427351f3d18a1f83493288aa4abde51bd1bbf8b8ab93a1ea6d28e917(
    value: typing.Optional[QuicksightThemeConfigurationDataColorPalette],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb1772a78bbb4f9c34bf65249e0e3678bbfcb3e6b15ea255cc528ef6e4d3ca0d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14cc142099863d42f0648243c4e4baba59b0cb22ab7b3c5ae1791b3c3378d768(
    value: typing.Optional[QuicksightThemeConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__846da5230610371b4604d59f6897e22c435541c0decb84733b6995bd0fac30fc(
    *,
    tile: typing.Optional[typing.Union[QuicksightThemeConfigurationSheetTile, typing.Dict[builtins.str, typing.Any]]] = None,
    tile_layout: typing.Optional[typing.Union[QuicksightThemeConfigurationSheetTileLayout, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a93a31b08d08a01a0e773d6b77cea9ce4dbec7594769cda12ac2e9573a86cef(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3dae5783f676c457838512b689cc2e583b49ce7be2cb917db51e5011f31f603(
    value: typing.Optional[QuicksightThemeConfigurationSheet],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7dd6f7bfca557bb101f59890d931c6e568c19220205dfb80c69d58d3b01b8ed(
    *,
    border: typing.Optional[typing.Union[QuicksightThemeConfigurationSheetTileBorder, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b0fbfc5c250d2065e621d0179bf0ca73bb8c06ad9025afd055baeda1aff8914(
    *,
    show: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__007ebe482b0adb686e8625c2c54b691a1f438b0fa74ca8816c942bbf4f5a1931(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9fbcae6beffc7132f1bb59e3fc0021854dece960214158051bca9025b3c8d849(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62db47a9001056a778f7682286bc53f4f2ee2928af9d6a777a542f4e090faacc(
    value: typing.Optional[QuicksightThemeConfigurationSheetTileBorder],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b644c5b1898a378eb7b3bec44365c7a1557a49cdcc9c4e8401a015bec06e837d(
    *,
    gutter: typing.Optional[typing.Union[QuicksightThemeConfigurationSheetTileLayoutGutter, typing.Dict[builtins.str, typing.Any]]] = None,
    margin: typing.Optional[typing.Union[QuicksightThemeConfigurationSheetTileLayoutMargin, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1eff199788d5d967a0b2fb222dd911dbc3420b33792dfdb3c7262000326cddce(
    *,
    show: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__950422a7d9295336d7dc9ad8a2e7420efb7728de47a73386fadd95fa0b444b92(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b63342fe0891befc03cfb668b8c4bf37f4d7417e0d63dc09436226175bcf7ea(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__779af5d4fa98a0fb7ac76d841f26ea75567fce768872935ad9d62c741cb53b11(
    value: typing.Optional[QuicksightThemeConfigurationSheetTileLayoutGutter],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d51d223402374424d35199c444ad148ccf282e2cbfedc5fb7d886f607e8b93e(
    *,
    show: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed21362efb75f6e27744a6d36c1616a66a7719a5e8cca481ba34acd6a8749273(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d835192740b452a209c992a2f5a71b3d82047343d621efb55c6c697d8b2eadce(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07947bcf98f3309b7d7d27620bf0223769e303ee82b025656888c90ecb29790b(
    value: typing.Optional[QuicksightThemeConfigurationSheetTileLayoutMargin],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b7e33ba951d9fbae3fb4a37980a3bd2312e58cde109883f7ed74e6d3edec256(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c37b63404cacc97a748df2ceb7f12f57ff659d382948a8e066e4b0c7a63fbfdf(
    value: typing.Optional[QuicksightThemeConfigurationSheetTileLayout],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1eb306baadedb15e571e4378a08842879e6b925dad3437aca5458893874be6f9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b539c1d5b9d8a4e2ad83c7d8046e0785b2e6256487d47268fb750e5465e867b6(
    value: typing.Optional[QuicksightThemeConfigurationSheetTile],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08794ced4eaaef0bb48ec8b0854e9f215919a48919e459bdb8e6f61cd6330e8e(
    *,
    font_families: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightThemeConfigurationTypographyFontFamilies, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb8e94c7430656c4e62dc4f63c31b922bce70cf5a8790572d122390c748b0ea6(
    *,
    font_family: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb3ef35f06d3876f0f15a781e2e7c8391aaf20dcf16d09a782563c3723824434(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ecd2328823648f3c706bcdf90b8ea33fb31366f9e63bf6f77e96ecc485aebf2(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0ad453f0df29951eadf00f111da724a7bed1970fc6f3cefa658b5ee453f3591(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1e360fd5ed0cb442e503c6a1b8226211030443b685a62174adfefd7186bf4ee(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5bc31c6168c69e3e7cf58e5dfe37e1195cd2515d1be2edc15b689f66d1ab1cf8(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad7fc8367023205d5a52047c0d954534656f5525bd9a218eebbc26154f1e9f97(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightThemeConfigurationTypographyFontFamilies]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42eb77741187da5580092fca49d093a13acc8c5df1b22eb1d6ae69e30a2db078(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45ac1c6ea6f5f688301e5de2cce00b008fc1e3c053684be84c78250a91ab87ad(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e78155de939f069f647ecb372ed8c9ddb636df9e54b3e764db3f0995d073f05(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemeConfigurationTypographyFontFamilies]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdc90af06808776a30a620028b2cfe756ea49315f2a84c8e437be0e4c3acb00a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad8e54dba961650097a4ffaa8b6bbc665ff5dc22b60c79c3648f2d8c97f92cab(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightThemeConfigurationTypographyFontFamilies, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b807cc2baafec60e2b20712970af111b15da177ec20a19ffd962f7e4f9385ac(
    value: typing.Optional[QuicksightThemeConfigurationTypography],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c5f596b66974cdef0cbf2d490b726f1237fd0b49097c6e891e04594bfed3633(
    *,
    accent: typing.Optional[builtins.str] = None,
    accent_foreground: typing.Optional[builtins.str] = None,
    danger: typing.Optional[builtins.str] = None,
    danger_foreground: typing.Optional[builtins.str] = None,
    dimension: typing.Optional[builtins.str] = None,
    dimension_foreground: typing.Optional[builtins.str] = None,
    measure: typing.Optional[builtins.str] = None,
    measure_foreground: typing.Optional[builtins.str] = None,
    primary_background: typing.Optional[builtins.str] = None,
    primary_foreground: typing.Optional[builtins.str] = None,
    secondary_background: typing.Optional[builtins.str] = None,
    secondary_foreground: typing.Optional[builtins.str] = None,
    success: typing.Optional[builtins.str] = None,
    success_foreground: typing.Optional[builtins.str] = None,
    warning: typing.Optional[builtins.str] = None,
    warning_foreground: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5839edefe4bcd210a5aa69213e0bc81cefced68818eb50b4a0daab945530824b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea8544d3b7b63f6562402e1fa08e0c9e9ad36c09bdaa36d7bf3383181ba36af1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27f6d0e2063d593ea306ad1c22764cdf6bd50c0f24729602caedda242ab5f5c4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86daf25ffaff938366d611e87f4200f324258fb5581d1ae0b3be428154a926ec(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2d8849e43ce8c2d7934766279c57c474830735b41623f0a4a16e4db90b5a6be(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d15fc5bc153de4940f3cf6ee461e212bcd986d95d53bf6fc37055fb19b23212(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d11b16827d1bc91c1876cc64ca2efbce2a5f7e845fc0eadbb3f81428fa921b6a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__733de254f0ca2c91c08fe2515e3dfc9d6e42c3278c984b72c2575a2b1c901c58(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__587f86b4f18d416dc3670d080d8f0e5303301d119c2240ca0c32e3b0a1ed6391(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3205fb522b9af316481445555dac7bd234359cdca09a4d24cf5d6c71c49e68b6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__defbf4b28ffe4c5c79ba8603e81d432c033027afa9bd0767d9297bbe39b520b3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68b761e9737addb9a65a96d16fb679016a011810425e460c9e9841d3c695f010(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d28b6bae358e9debf9a2071616cffd544f28a2958cd6102257bd7db17b5c43cb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8dcb0accf87a60cca6f35030444ed1578a0e7a0527dfcedce8679b6cf6138f79(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7e0c6489c054ba665ccc75fd25658673d8156089ec0d613a183bfe75c103286(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7eb10b75db7cd7b8d807f7715df796396417489278aa542fab980839b338300e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd8493ead93195cad5b569b65b402c7e77c3c963de1bfa38c2c6e074f42e1d61(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff061d1c2f7613f5a1f67af19107d9eef3fa6b739df194a170c785d1a080c23d(
    value: typing.Optional[QuicksightThemeConfigurationUiColorPalette],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a14c5a04354496e1d58d8616334a42a9548777238295acdbce132da1673d9f2(
    *,
    actions: typing.Sequence[builtins.str],
    principal: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f23a30133f8efe4bd02b1120d90ab337c14a259a30938beaf909d713a7d950f4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d40906e87ff35015e0621405be653fd6f555df949f4df6c699fb6a7d7422589(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8685560fd6165f4a20dce09dec3229f3e8a5832fc9bf0c36526d47011d04d383(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0cfed5bfbf28ca705752e55f8fe99e74445bcafb7f6b73922c3f3c6e66e459e5(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b192dfdbda3fc4b5b34adb7e7183c269441b0a5062b31f34649c4e62fd8c9b58(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ffc459289553e75da12df872a2c334f6ca5a259726407b2a2925bde92a350b1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightThemePermissions]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a73d7626f0704770cb8216185f9306bb9196a1a473b24bbb92e4ca79806907f8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3aac0182849dd0bab8b7353340c159ea47e12bf6402d290519c7a7d2516574b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0aef3cfda20bfb4f444562d99fcfcd879b0213854cfb0b5b736c234ae650033d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e807c048baa2b42419110738f972ff0a3ae84f3689a63e0aad1e9f8d74ff240(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemePermissions]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8671a2e93c685e0ee36f402e5b8090704346b2e8531ecf49d4cdb6fab9dbadf1(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e474a89076a90d6e3092e31a58de6e5b60c63e2b4f9f1890747dcf8911227d4b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8644401084fd192f9e036e22b1f030a40b3a6fd8f42928bcd720f4e55d4578b9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56061f2620b0da0ac1c141a41cff970c93fb4e4e0f905ac479a60be4860c5bb5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ccf95dbdd016cffc6081be2a4fc33e177ae847f2d24025e1531d750831e8e8a3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__829cb016b1c72263018a7b31d54563144a8787a091ac37540a50ab77d4c0b627(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightThemeTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
