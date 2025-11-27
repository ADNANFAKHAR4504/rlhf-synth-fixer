r'''
# `aws_quicksight_dashboard`

Refer to the Terraform Registry for docs: [`aws_quicksight_dashboard`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard).
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


class QuicksightDashboard(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboard",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard aws_quicksight_dashboard}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        dashboard_id: builtins.str,
        name: builtins.str,
        version_description: builtins.str,
        aws_account_id: typing.Optional[builtins.str] = None,
        dashboard_publish_options: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        definition: typing.Any = None,
        id: typing.Optional[builtins.str] = None,
        parameters: typing.Optional[typing.Union["QuicksightDashboardParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardPermissions", typing.Dict[builtins.str, typing.Any]]]]] = None,
        source_entity: typing.Optional[typing.Union["QuicksightDashboardSourceEntity", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        theme_arn: typing.Optional[builtins.str] = None,
        timeouts: typing.Optional[typing.Union["QuicksightDashboardTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard aws_quicksight_dashboard} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param dashboard_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_id QuicksightDashboard#dashboard_id}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.
        :param version_description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#version_description QuicksightDashboard#version_description}.
        :param aws_account_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#aws_account_id QuicksightDashboard#aws_account_id}.
        :param dashboard_publish_options: dashboard_publish_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_publish_options QuicksightDashboard#dashboard_publish_options}
        :param definition: definition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#definition QuicksightDashboard#definition}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#id QuicksightDashboard#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param parameters: parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#parameters QuicksightDashboard#parameters}
        :param permissions: permissions block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#permissions QuicksightDashboard#permissions}
        :param source_entity: source_entity block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#source_entity QuicksightDashboard#source_entity}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags QuicksightDashboard#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags_all QuicksightDashboard#tags_all}.
        :param theme_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#theme_arn QuicksightDashboard#theme_arn}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#timeouts QuicksightDashboard#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c6a359edde124446fc195e7bc8763c01309df6e420b0b0123148b01df415749)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = QuicksightDashboardConfig(
            dashboard_id=dashboard_id,
            name=name,
            version_description=version_description,
            aws_account_id=aws_account_id,
            dashboard_publish_options=dashboard_publish_options,
            definition=definition,
            id=id,
            parameters=parameters,
            permissions=permissions,
            source_entity=source_entity,
            tags=tags,
            tags_all=tags_all,
            theme_arn=theme_arn,
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
        '''Generates CDKTF code for importing a QuicksightDashboard resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the QuicksightDashboard to import.
        :param import_from_id: The id of the existing QuicksightDashboard that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the QuicksightDashboard to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec3d95fd554d4b3215aeeccea495967b699b5bd7c401d3f31d5f833e78e0f554)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putDashboardPublishOptions")
    def put_dashboard_publish_options(
        self,
        *,
        ad_hoc_filtering_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption", typing.Dict[builtins.str, typing.Any]]] = None,
        data_point_drill_up_down_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption", typing.Dict[builtins.str, typing.Any]]] = None,
        data_point_menu_label_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption", typing.Dict[builtins.str, typing.Any]]] = None,
        data_point_tooltip_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption", typing.Dict[builtins.str, typing.Any]]] = None,
        export_to_csv_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsExportToCsvOption", typing.Dict[builtins.str, typing.Any]]] = None,
        export_with_hidden_fields_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption", typing.Dict[builtins.str, typing.Any]]] = None,
        sheet_controls_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsSheetControlsOption", typing.Dict[builtins.str, typing.Any]]] = None,
        sheet_layout_element_maximization_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption", typing.Dict[builtins.str, typing.Any]]] = None,
        visual_axis_sort_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption", typing.Dict[builtins.str, typing.Any]]] = None,
        visual_menu_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsVisualMenuOption", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param ad_hoc_filtering_option: ad_hoc_filtering_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#ad_hoc_filtering_option QuicksightDashboard#ad_hoc_filtering_option}
        :param data_point_drill_up_down_option: data_point_drill_up_down_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_drill_up_down_option QuicksightDashboard#data_point_drill_up_down_option}
        :param data_point_menu_label_option: data_point_menu_label_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_menu_label_option QuicksightDashboard#data_point_menu_label_option}
        :param data_point_tooltip_option: data_point_tooltip_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_tooltip_option QuicksightDashboard#data_point_tooltip_option}
        :param export_to_csv_option: export_to_csv_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#export_to_csv_option QuicksightDashboard#export_to_csv_option}
        :param export_with_hidden_fields_option: export_with_hidden_fields_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#export_with_hidden_fields_option QuicksightDashboard#export_with_hidden_fields_option}
        :param sheet_controls_option: sheet_controls_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#sheet_controls_option QuicksightDashboard#sheet_controls_option}
        :param sheet_layout_element_maximization_option: sheet_layout_element_maximization_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#sheet_layout_element_maximization_option QuicksightDashboard#sheet_layout_element_maximization_option}
        :param visual_axis_sort_option: visual_axis_sort_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visual_axis_sort_option QuicksightDashboard#visual_axis_sort_option}
        :param visual_menu_option: visual_menu_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visual_menu_option QuicksightDashboard#visual_menu_option}
        '''
        value = QuicksightDashboardDashboardPublishOptions(
            ad_hoc_filtering_option=ad_hoc_filtering_option,
            data_point_drill_up_down_option=data_point_drill_up_down_option,
            data_point_menu_label_option=data_point_menu_label_option,
            data_point_tooltip_option=data_point_tooltip_option,
            export_to_csv_option=export_to_csv_option,
            export_with_hidden_fields_option=export_with_hidden_fields_option,
            sheet_controls_option=sheet_controls_option,
            sheet_layout_element_maximization_option=sheet_layout_element_maximization_option,
            visual_axis_sort_option=visual_axis_sort_option,
            visual_menu_option=visual_menu_option,
        )

        return typing.cast(None, jsii.invoke(self, "putDashboardPublishOptions", [value]))

    @jsii.member(jsii_name="putParameters")
    def put_parameters(
        self,
        *,
        date_time_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardParametersDateTimeParameters", typing.Dict[builtins.str, typing.Any]]]]] = None,
        decimal_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardParametersDecimalParameters", typing.Dict[builtins.str, typing.Any]]]]] = None,
        integer_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardParametersIntegerParameters", typing.Dict[builtins.str, typing.Any]]]]] = None,
        string_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardParametersStringParameters", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param date_time_parameters: date_time_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#date_time_parameters QuicksightDashboard#date_time_parameters}
        :param decimal_parameters: decimal_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#decimal_parameters QuicksightDashboard#decimal_parameters}
        :param integer_parameters: integer_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#integer_parameters QuicksightDashboard#integer_parameters}
        :param string_parameters: string_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#string_parameters QuicksightDashboard#string_parameters}
        '''
        value = QuicksightDashboardParameters(
            date_time_parameters=date_time_parameters,
            decimal_parameters=decimal_parameters,
            integer_parameters=integer_parameters,
            string_parameters=string_parameters,
        )

        return typing.cast(None, jsii.invoke(self, "putParameters", [value]))

    @jsii.member(jsii_name="putPermissions")
    def put_permissions(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardPermissions", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5a0c63b9b2b7944b84af52cd628142c85552e29aa9b121a1f8c39660fcc2650)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPermissions", [value]))

    @jsii.member(jsii_name="putSourceEntity")
    def put_source_entity(
        self,
        *,
        source_template: typing.Optional[typing.Union["QuicksightDashboardSourceEntitySourceTemplate", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param source_template: source_template block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#source_template QuicksightDashboard#source_template}
        '''
        value = QuicksightDashboardSourceEntity(source_template=source_template)

        return typing.cast(None, jsii.invoke(self, "putSourceEntity", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#create QuicksightDashboard#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#delete QuicksightDashboard#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#update QuicksightDashboard#update}.
        '''
        value = QuicksightDashboardTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetAwsAccountId")
    def reset_aws_account_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAwsAccountId", []))

    @jsii.member(jsii_name="resetDashboardPublishOptions")
    def reset_dashboard_publish_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDashboardPublishOptions", []))

    @jsii.member(jsii_name="resetDefinition")
    def reset_definition(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefinition", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetParameters")
    def reset_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParameters", []))

    @jsii.member(jsii_name="resetPermissions")
    def reset_permissions(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPermissions", []))

    @jsii.member(jsii_name="resetSourceEntity")
    def reset_source_entity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceEntity", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetThemeArn")
    def reset_theme_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetThemeArn", []))

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
    @jsii.member(jsii_name="dashboardPublishOptions")
    def dashboard_publish_options(
        self,
    ) -> "QuicksightDashboardDashboardPublishOptionsOutputReference":
        return typing.cast("QuicksightDashboardDashboardPublishOptionsOutputReference", jsii.get(self, "dashboardPublishOptions"))

    @builtins.property
    @jsii.member(jsii_name="definitionInput")
    def definition_input(self) -> typing.Any:
        return typing.cast(typing.Any, jsii.get(self, "definitionInput"))

    @builtins.property
    @jsii.member(jsii_name="lastPublishedTime")
    def last_published_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastPublishedTime"))

    @builtins.property
    @jsii.member(jsii_name="lastUpdatedTime")
    def last_updated_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastUpdatedTime"))

    @builtins.property
    @jsii.member(jsii_name="parameters")
    def parameters(self) -> "QuicksightDashboardParametersOutputReference":
        return typing.cast("QuicksightDashboardParametersOutputReference", jsii.get(self, "parameters"))

    @builtins.property
    @jsii.member(jsii_name="permissions")
    def permissions(self) -> "QuicksightDashboardPermissionsList":
        return typing.cast("QuicksightDashboardPermissionsList", jsii.get(self, "permissions"))

    @builtins.property
    @jsii.member(jsii_name="sourceEntity")
    def source_entity(self) -> "QuicksightDashboardSourceEntityOutputReference":
        return typing.cast("QuicksightDashboardSourceEntityOutputReference", jsii.get(self, "sourceEntity"))

    @builtins.property
    @jsii.member(jsii_name="sourceEntityArn")
    def source_entity_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceEntityArn"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "QuicksightDashboardTimeoutsOutputReference":
        return typing.cast("QuicksightDashboardTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="versionNumber")
    def version_number(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "versionNumber"))

    @builtins.property
    @jsii.member(jsii_name="awsAccountIdInput")
    def aws_account_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "awsAccountIdInput"))

    @builtins.property
    @jsii.member(jsii_name="dashboardIdInput")
    def dashboard_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dashboardIdInput"))

    @builtins.property
    @jsii.member(jsii_name="dashboardPublishOptionsInput")
    def dashboard_publish_options_input(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptions"]:
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptions"], jsii.get(self, "dashboardPublishOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="parametersInput")
    def parameters_input(self) -> typing.Optional["QuicksightDashboardParameters"]:
        return typing.cast(typing.Optional["QuicksightDashboardParameters"], jsii.get(self, "parametersInput"))

    @builtins.property
    @jsii.member(jsii_name="permissionsInput")
    def permissions_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardPermissions"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardPermissions"]]], jsii.get(self, "permissionsInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceEntityInput")
    def source_entity_input(self) -> typing.Optional["QuicksightDashboardSourceEntity"]:
        return typing.cast(typing.Optional["QuicksightDashboardSourceEntity"], jsii.get(self, "sourceEntityInput"))

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
    @jsii.member(jsii_name="themeArnInput")
    def theme_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "themeArnInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "QuicksightDashboardTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "QuicksightDashboardTimeouts"]], jsii.get(self, "timeoutsInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__bee654d7a881f1a6d5e1d3b34b54bf4064fa669f6550a2b8dea6d09cff2b203c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "awsAccountId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dashboardId")
    def dashboard_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dashboardId"))

    @dashboard_id.setter
    def dashboard_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f6443e32239a2729d1bf6396c222ad5faa030155543ab5e44bf558e85e85dad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dashboardId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="definition")
    def definition(self) -> typing.Any:
        return typing.cast(typing.Any, jsii.get(self, "definition"))

    @definition.setter
    def definition(self, value: typing.Any) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__323cf62786f7be080d7a4fd82563fbc5f3a0f91743d1f163ae851615d0bfc060)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "definition", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__51a2d7a22289e9315202687ed260ae3a9072f8c70b97754b1d63b59e37ea4b7a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__388a219982adff399597ef3c59f20e1976c1aad8be1ffa6ccaac32347bc6992c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07f656e46cc9bb113a044678732d0d613e0c7b9d931a8878e002452cae8b3926)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d37c8880a7f3e0edb9e1ec4bd54ab205d19d2dfe386f61f46dfa1e102f0f4b9d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="themeArn")
    def theme_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "themeArn"))

    @theme_arn.setter
    def theme_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__880051c7299f77845855afa6eceae24d7af4aedc5f2c01a6aecd6933739484b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "themeArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="versionDescription")
    def version_description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "versionDescription"))

    @version_description.setter
    def version_description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc13824577de75f4b98acc47241eb6d74a6f95003a8374c34b43ac3287cce388)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "versionDescription", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "dashboard_id": "dashboardId",
        "name": "name",
        "version_description": "versionDescription",
        "aws_account_id": "awsAccountId",
        "dashboard_publish_options": "dashboardPublishOptions",
        "definition": "definition",
        "id": "id",
        "parameters": "parameters",
        "permissions": "permissions",
        "source_entity": "sourceEntity",
        "tags": "tags",
        "tags_all": "tagsAll",
        "theme_arn": "themeArn",
        "timeouts": "timeouts",
    },
)
class QuicksightDashboardConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        dashboard_id: builtins.str,
        name: builtins.str,
        version_description: builtins.str,
        aws_account_id: typing.Optional[builtins.str] = None,
        dashboard_publish_options: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        definition: typing.Any = None,
        id: typing.Optional[builtins.str] = None,
        parameters: typing.Optional[typing.Union["QuicksightDashboardParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardPermissions", typing.Dict[builtins.str, typing.Any]]]]] = None,
        source_entity: typing.Optional[typing.Union["QuicksightDashboardSourceEntity", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        theme_arn: typing.Optional[builtins.str] = None,
        timeouts: typing.Optional[typing.Union["QuicksightDashboardTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param dashboard_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_id QuicksightDashboard#dashboard_id}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.
        :param version_description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#version_description QuicksightDashboard#version_description}.
        :param aws_account_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#aws_account_id QuicksightDashboard#aws_account_id}.
        :param dashboard_publish_options: dashboard_publish_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_publish_options QuicksightDashboard#dashboard_publish_options}
        :param definition: definition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#definition QuicksightDashboard#definition}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#id QuicksightDashboard#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param parameters: parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#parameters QuicksightDashboard#parameters}
        :param permissions: permissions block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#permissions QuicksightDashboard#permissions}
        :param source_entity: source_entity block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#source_entity QuicksightDashboard#source_entity}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags QuicksightDashboard#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags_all QuicksightDashboard#tags_all}.
        :param theme_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#theme_arn QuicksightDashboard#theme_arn}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#timeouts QuicksightDashboard#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(dashboard_publish_options, dict):
            dashboard_publish_options = QuicksightDashboardDashboardPublishOptions(**dashboard_publish_options)
        if isinstance(parameters, dict):
            parameters = QuicksightDashboardParameters(**parameters)
        if isinstance(source_entity, dict):
            source_entity = QuicksightDashboardSourceEntity(**source_entity)
        if isinstance(timeouts, dict):
            timeouts = QuicksightDashboardTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6924268a464a047b79225d8e07d0797c7da3c01999ae89792ad2c1232aa91e72)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument dashboard_id", value=dashboard_id, expected_type=type_hints["dashboard_id"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument version_description", value=version_description, expected_type=type_hints["version_description"])
            check_type(argname="argument aws_account_id", value=aws_account_id, expected_type=type_hints["aws_account_id"])
            check_type(argname="argument dashboard_publish_options", value=dashboard_publish_options, expected_type=type_hints["dashboard_publish_options"])
            check_type(argname="argument definition", value=definition, expected_type=type_hints["definition"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument parameters", value=parameters, expected_type=type_hints["parameters"])
            check_type(argname="argument permissions", value=permissions, expected_type=type_hints["permissions"])
            check_type(argname="argument source_entity", value=source_entity, expected_type=type_hints["source_entity"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument theme_arn", value=theme_arn, expected_type=type_hints["theme_arn"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "dashboard_id": dashboard_id,
            "name": name,
            "version_description": version_description,
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
        if dashboard_publish_options is not None:
            self._values["dashboard_publish_options"] = dashboard_publish_options
        if definition is not None:
            self._values["definition"] = definition
        if id is not None:
            self._values["id"] = id
        if parameters is not None:
            self._values["parameters"] = parameters
        if permissions is not None:
            self._values["permissions"] = permissions
        if source_entity is not None:
            self._values["source_entity"] = source_entity
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if theme_arn is not None:
            self._values["theme_arn"] = theme_arn
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
    def dashboard_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_id QuicksightDashboard#dashboard_id}.'''
        result = self._values.get("dashboard_id")
        assert result is not None, "Required property 'dashboard_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def version_description(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#version_description QuicksightDashboard#version_description}.'''
        result = self._values.get("version_description")
        assert result is not None, "Required property 'version_description' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def aws_account_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#aws_account_id QuicksightDashboard#aws_account_id}.'''
        result = self._values.get("aws_account_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def dashboard_publish_options(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptions"]:
        '''dashboard_publish_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_publish_options QuicksightDashboard#dashboard_publish_options}
        '''
        result = self._values.get("dashboard_publish_options")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptions"], result)

    @builtins.property
    def definition(self) -> typing.Any:
        '''definition block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#definition QuicksightDashboard#definition}
        '''
        result = self._values.get("definition")
        return typing.cast(typing.Any, result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#id QuicksightDashboard#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def parameters(self) -> typing.Optional["QuicksightDashboardParameters"]:
        '''parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#parameters QuicksightDashboard#parameters}
        '''
        result = self._values.get("parameters")
        return typing.cast(typing.Optional["QuicksightDashboardParameters"], result)

    @builtins.property
    def permissions(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardPermissions"]]]:
        '''permissions block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#permissions QuicksightDashboard#permissions}
        '''
        result = self._values.get("permissions")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardPermissions"]]], result)

    @builtins.property
    def source_entity(self) -> typing.Optional["QuicksightDashboardSourceEntity"]:
        '''source_entity block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#source_entity QuicksightDashboard#source_entity}
        '''
        result = self._values.get("source_entity")
        return typing.cast(typing.Optional["QuicksightDashboardSourceEntity"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags QuicksightDashboard#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags_all QuicksightDashboard#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def theme_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#theme_arn QuicksightDashboard#theme_arn}.'''
        result = self._values.get("theme_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["QuicksightDashboardTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#timeouts QuicksightDashboard#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["QuicksightDashboardTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptions",
    jsii_struct_bases=[],
    name_mapping={
        "ad_hoc_filtering_option": "adHocFilteringOption",
        "data_point_drill_up_down_option": "dataPointDrillUpDownOption",
        "data_point_menu_label_option": "dataPointMenuLabelOption",
        "data_point_tooltip_option": "dataPointTooltipOption",
        "export_to_csv_option": "exportToCsvOption",
        "export_with_hidden_fields_option": "exportWithHiddenFieldsOption",
        "sheet_controls_option": "sheetControlsOption",
        "sheet_layout_element_maximization_option": "sheetLayoutElementMaximizationOption",
        "visual_axis_sort_option": "visualAxisSortOption",
        "visual_menu_option": "visualMenuOption",
    },
)
class QuicksightDashboardDashboardPublishOptions:
    def __init__(
        self,
        *,
        ad_hoc_filtering_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption", typing.Dict[builtins.str, typing.Any]]] = None,
        data_point_drill_up_down_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption", typing.Dict[builtins.str, typing.Any]]] = None,
        data_point_menu_label_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption", typing.Dict[builtins.str, typing.Any]]] = None,
        data_point_tooltip_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption", typing.Dict[builtins.str, typing.Any]]] = None,
        export_to_csv_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsExportToCsvOption", typing.Dict[builtins.str, typing.Any]]] = None,
        export_with_hidden_fields_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption", typing.Dict[builtins.str, typing.Any]]] = None,
        sheet_controls_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsSheetControlsOption", typing.Dict[builtins.str, typing.Any]]] = None,
        sheet_layout_element_maximization_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption", typing.Dict[builtins.str, typing.Any]]] = None,
        visual_axis_sort_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption", typing.Dict[builtins.str, typing.Any]]] = None,
        visual_menu_option: typing.Optional[typing.Union["QuicksightDashboardDashboardPublishOptionsVisualMenuOption", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param ad_hoc_filtering_option: ad_hoc_filtering_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#ad_hoc_filtering_option QuicksightDashboard#ad_hoc_filtering_option}
        :param data_point_drill_up_down_option: data_point_drill_up_down_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_drill_up_down_option QuicksightDashboard#data_point_drill_up_down_option}
        :param data_point_menu_label_option: data_point_menu_label_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_menu_label_option QuicksightDashboard#data_point_menu_label_option}
        :param data_point_tooltip_option: data_point_tooltip_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_tooltip_option QuicksightDashboard#data_point_tooltip_option}
        :param export_to_csv_option: export_to_csv_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#export_to_csv_option QuicksightDashboard#export_to_csv_option}
        :param export_with_hidden_fields_option: export_with_hidden_fields_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#export_with_hidden_fields_option QuicksightDashboard#export_with_hidden_fields_option}
        :param sheet_controls_option: sheet_controls_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#sheet_controls_option QuicksightDashboard#sheet_controls_option}
        :param sheet_layout_element_maximization_option: sheet_layout_element_maximization_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#sheet_layout_element_maximization_option QuicksightDashboard#sheet_layout_element_maximization_option}
        :param visual_axis_sort_option: visual_axis_sort_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visual_axis_sort_option QuicksightDashboard#visual_axis_sort_option}
        :param visual_menu_option: visual_menu_option block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visual_menu_option QuicksightDashboard#visual_menu_option}
        '''
        if isinstance(ad_hoc_filtering_option, dict):
            ad_hoc_filtering_option = QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption(**ad_hoc_filtering_option)
        if isinstance(data_point_drill_up_down_option, dict):
            data_point_drill_up_down_option = QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption(**data_point_drill_up_down_option)
        if isinstance(data_point_menu_label_option, dict):
            data_point_menu_label_option = QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption(**data_point_menu_label_option)
        if isinstance(data_point_tooltip_option, dict):
            data_point_tooltip_option = QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption(**data_point_tooltip_option)
        if isinstance(export_to_csv_option, dict):
            export_to_csv_option = QuicksightDashboardDashboardPublishOptionsExportToCsvOption(**export_to_csv_option)
        if isinstance(export_with_hidden_fields_option, dict):
            export_with_hidden_fields_option = QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption(**export_with_hidden_fields_option)
        if isinstance(sheet_controls_option, dict):
            sheet_controls_option = QuicksightDashboardDashboardPublishOptionsSheetControlsOption(**sheet_controls_option)
        if isinstance(sheet_layout_element_maximization_option, dict):
            sheet_layout_element_maximization_option = QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption(**sheet_layout_element_maximization_option)
        if isinstance(visual_axis_sort_option, dict):
            visual_axis_sort_option = QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption(**visual_axis_sort_option)
        if isinstance(visual_menu_option, dict):
            visual_menu_option = QuicksightDashboardDashboardPublishOptionsVisualMenuOption(**visual_menu_option)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1092eb7486ec406ca0e24b07122d7764db75f54ad8fcab0ab3dc92be3b9f1618)
            check_type(argname="argument ad_hoc_filtering_option", value=ad_hoc_filtering_option, expected_type=type_hints["ad_hoc_filtering_option"])
            check_type(argname="argument data_point_drill_up_down_option", value=data_point_drill_up_down_option, expected_type=type_hints["data_point_drill_up_down_option"])
            check_type(argname="argument data_point_menu_label_option", value=data_point_menu_label_option, expected_type=type_hints["data_point_menu_label_option"])
            check_type(argname="argument data_point_tooltip_option", value=data_point_tooltip_option, expected_type=type_hints["data_point_tooltip_option"])
            check_type(argname="argument export_to_csv_option", value=export_to_csv_option, expected_type=type_hints["export_to_csv_option"])
            check_type(argname="argument export_with_hidden_fields_option", value=export_with_hidden_fields_option, expected_type=type_hints["export_with_hidden_fields_option"])
            check_type(argname="argument sheet_controls_option", value=sheet_controls_option, expected_type=type_hints["sheet_controls_option"])
            check_type(argname="argument sheet_layout_element_maximization_option", value=sheet_layout_element_maximization_option, expected_type=type_hints["sheet_layout_element_maximization_option"])
            check_type(argname="argument visual_axis_sort_option", value=visual_axis_sort_option, expected_type=type_hints["visual_axis_sort_option"])
            check_type(argname="argument visual_menu_option", value=visual_menu_option, expected_type=type_hints["visual_menu_option"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if ad_hoc_filtering_option is not None:
            self._values["ad_hoc_filtering_option"] = ad_hoc_filtering_option
        if data_point_drill_up_down_option is not None:
            self._values["data_point_drill_up_down_option"] = data_point_drill_up_down_option
        if data_point_menu_label_option is not None:
            self._values["data_point_menu_label_option"] = data_point_menu_label_option
        if data_point_tooltip_option is not None:
            self._values["data_point_tooltip_option"] = data_point_tooltip_option
        if export_to_csv_option is not None:
            self._values["export_to_csv_option"] = export_to_csv_option
        if export_with_hidden_fields_option is not None:
            self._values["export_with_hidden_fields_option"] = export_with_hidden_fields_option
        if sheet_controls_option is not None:
            self._values["sheet_controls_option"] = sheet_controls_option
        if sheet_layout_element_maximization_option is not None:
            self._values["sheet_layout_element_maximization_option"] = sheet_layout_element_maximization_option
        if visual_axis_sort_option is not None:
            self._values["visual_axis_sort_option"] = visual_axis_sort_option
        if visual_menu_option is not None:
            self._values["visual_menu_option"] = visual_menu_option

    @builtins.property
    def ad_hoc_filtering_option(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption"]:
        '''ad_hoc_filtering_option block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#ad_hoc_filtering_option QuicksightDashboard#ad_hoc_filtering_option}
        '''
        result = self._values.get("ad_hoc_filtering_option")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption"], result)

    @builtins.property
    def data_point_drill_up_down_option(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption"]:
        '''data_point_drill_up_down_option block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_drill_up_down_option QuicksightDashboard#data_point_drill_up_down_option}
        '''
        result = self._values.get("data_point_drill_up_down_option")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption"], result)

    @builtins.property
    def data_point_menu_label_option(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption"]:
        '''data_point_menu_label_option block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_menu_label_option QuicksightDashboard#data_point_menu_label_option}
        '''
        result = self._values.get("data_point_menu_label_option")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption"], result)

    @builtins.property
    def data_point_tooltip_option(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption"]:
        '''data_point_tooltip_option block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_tooltip_option QuicksightDashboard#data_point_tooltip_option}
        '''
        result = self._values.get("data_point_tooltip_option")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption"], result)

    @builtins.property
    def export_to_csv_option(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsExportToCsvOption"]:
        '''export_to_csv_option block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#export_to_csv_option QuicksightDashboard#export_to_csv_option}
        '''
        result = self._values.get("export_to_csv_option")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsExportToCsvOption"], result)

    @builtins.property
    def export_with_hidden_fields_option(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption"]:
        '''export_with_hidden_fields_option block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#export_with_hidden_fields_option QuicksightDashboard#export_with_hidden_fields_option}
        '''
        result = self._values.get("export_with_hidden_fields_option")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption"], result)

    @builtins.property
    def sheet_controls_option(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsSheetControlsOption"]:
        '''sheet_controls_option block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#sheet_controls_option QuicksightDashboard#sheet_controls_option}
        '''
        result = self._values.get("sheet_controls_option")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsSheetControlsOption"], result)

    @builtins.property
    def sheet_layout_element_maximization_option(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption"]:
        '''sheet_layout_element_maximization_option block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#sheet_layout_element_maximization_option QuicksightDashboard#sheet_layout_element_maximization_option}
        '''
        result = self._values.get("sheet_layout_element_maximization_option")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption"], result)

    @builtins.property
    def visual_axis_sort_option(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption"]:
        '''visual_axis_sort_option block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visual_axis_sort_option QuicksightDashboard#visual_axis_sort_option}
        '''
        result = self._values.get("visual_axis_sort_option")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption"], result)

    @builtins.property
    def visual_menu_option(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsVisualMenuOption"]:
        '''visual_menu_option block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visual_menu_option QuicksightDashboard#visual_menu_option}
        '''
        result = self._values.get("visual_menu_option")
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsVisualMenuOption"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption",
    jsii_struct_bases=[],
    name_mapping={"availability_status": "availabilityStatus"},
)
class QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption:
    def __init__(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e09b66b90feb4463758e0793f374626e863b15d72d1b0d9e29ace3a28d30229)
            check_type(argname="argument availability_status", value=availability_status, expected_type=type_hints["availability_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_status is not None:
            self._values["availability_status"] = availability_status

    @builtins.property
    def availability_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.'''
        result = self._values.get("availability_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardDashboardPublishOptionsAdHocFilteringOptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b14e25a792414ee08b25711234fa7a342093b7d48f67a880108ad8661a5516ba)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAvailabilityStatus")
    def reset_availability_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityStatus", []))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatusInput")
    def availability_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatus")
    def availability_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityStatus"))

    @availability_status.setter
    def availability_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02ac41b7bb7d0dd99d15d3484b125feed7d70e8f605c35825e63f2791c4d65a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__66e09a6a133ac10bfeec43857c674e72f46b07ee27756bf4e3627be4412680f2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption",
    jsii_struct_bases=[],
    name_mapping={"availability_status": "availabilityStatus"},
)
class QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption:
    def __init__(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff3e7798be64634a30264ab1ace5c89e5229565ab8a8e095e4494db0db174f67)
            check_type(argname="argument availability_status", value=availability_status, expected_type=type_hints["availability_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_status is not None:
            self._values["availability_status"] = availability_status

    @builtins.property
    def availability_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.'''
        result = self._values.get("availability_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c17f55faa9a88ab48322d709ab2634475fc1fb7b90e400cb0932a4cd0377c198)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAvailabilityStatus")
    def reset_availability_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityStatus", []))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatusInput")
    def availability_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatus")
    def availability_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityStatus"))

    @availability_status.setter
    def availability_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b8a52e2d4c4775f18e4678ef8de9778cfb60ffe4862f3dd3031c86b061ece28)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fdeedf7961eb0def11ea04c80c168d9c0f5b924dc50c1bdbca11025d8c5d02b7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption",
    jsii_struct_bases=[],
    name_mapping={"availability_status": "availabilityStatus"},
)
class QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption:
    def __init__(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e21f77e83d4de331c08fb54d3ceb58d33b8ec4c64aaa33a25dbc89819c88f7a9)
            check_type(argname="argument availability_status", value=availability_status, expected_type=type_hints["availability_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_status is not None:
            self._values["availability_status"] = availability_status

    @builtins.property
    def availability_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.'''
        result = self._values.get("availability_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__db4d3586e20cf81b14b673c472149be1ee9b0e523e79832636a085113415cab1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAvailabilityStatus")
    def reset_availability_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityStatus", []))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatusInput")
    def availability_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatus")
    def availability_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityStatus"))

    @availability_status.setter
    def availability_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__931a689775937e780752abb995f71f68f8f75c6d4e0f9dcf324508f09ab9edc8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ec575c526573cd35c07524d331d1dee052c818985fbfe7c0bc7b71cfe7b74e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption",
    jsii_struct_bases=[],
    name_mapping={"availability_status": "availabilityStatus"},
)
class QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption:
    def __init__(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88cde4b804c7f943331c96a5bab3437e996d5c98413dcd5184fb17d863798f11)
            check_type(argname="argument availability_status", value=availability_status, expected_type=type_hints["availability_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_status is not None:
            self._values["availability_status"] = availability_status

    @builtins.property
    def availability_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.'''
        result = self._values.get("availability_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__df5571522cc408fc52ced536200bd4d9284fa1d3c3d96ac7800efff1a4f55ec3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAvailabilityStatus")
    def reset_availability_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityStatus", []))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatusInput")
    def availability_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatus")
    def availability_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityStatus"))

    @availability_status.setter
    def availability_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44e0c23a9c8df8f814f802afa587e66677450da8f34476a7aaa6875a2ba24896)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c59304a6e35716543281c3d55f56f005da533e2e62ab60846c6ccb8e218bcbe2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOption",
    jsii_struct_bases=[],
    name_mapping={"availability_status": "availabilityStatus"},
)
class QuicksightDashboardDashboardPublishOptionsExportToCsvOption:
    def __init__(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75bae76292495b2a34927984ff6cad08d449910872ca4b009c59d9c713ec8546)
            check_type(argname="argument availability_status", value=availability_status, expected_type=type_hints["availability_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_status is not None:
            self._values["availability_status"] = availability_status

    @builtins.property
    def availability_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.'''
        result = self._values.get("availability_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptionsExportToCsvOption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardDashboardPublishOptionsExportToCsvOptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__927aa65754385a7f73155552a3278b4dcddc64587cb2c8e89fccd24c304cfdeb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAvailabilityStatus")
    def reset_availability_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityStatus", []))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatusInput")
    def availability_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatus")
    def availability_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityStatus"))

    @availability_status.setter
    def availability_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61a8b2d612fce66cfc6edf1088ad7629d55fc74c57476e6b737fb65b389c530b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsExportToCsvOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsExportToCsvOption], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptionsExportToCsvOption],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e389ed8013ded632655eb6282a410e888ce68584fd5f4e6d883e0643d4ec269d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption",
    jsii_struct_bases=[],
    name_mapping={"availability_status": "availabilityStatus"},
)
class QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption:
    def __init__(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d20d7f77745a7ad90dd0be5b2af6e5135a8e95c44559ab0759b12ccf845c49bc)
            check_type(argname="argument availability_status", value=availability_status, expected_type=type_hints["availability_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_status is not None:
            self._values["availability_status"] = availability_status

    @builtins.property
    def availability_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.'''
        result = self._values.get("availability_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c7d977f1d13e813b4c60052272b28a51b5f8ca216dabd5abe03339edb57ea3b9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAvailabilityStatus")
    def reset_availability_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityStatus", []))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatusInput")
    def availability_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatus")
    def availability_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityStatus"))

    @availability_status.setter
    def availability_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21d2c56d52dfac4627b0dcd61480589f813ec19af1f7b5b03c0bc696a53a29bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cda5d1eb593761b48abafd0b210edade7a13098a45e2bc1d0fc3ecd5fb9befaf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDashboardDashboardPublishOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5880fee46cf38e18b194379a33783deaec50539cd042a2922eab34012b1fa62d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAdHocFilteringOption")
    def put_ad_hoc_filtering_option(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        value = QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption(
            availability_status=availability_status
        )

        return typing.cast(None, jsii.invoke(self, "putAdHocFilteringOption", [value]))

    @jsii.member(jsii_name="putDataPointDrillUpDownOption")
    def put_data_point_drill_up_down_option(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        value = QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption(
            availability_status=availability_status
        )

        return typing.cast(None, jsii.invoke(self, "putDataPointDrillUpDownOption", [value]))

    @jsii.member(jsii_name="putDataPointMenuLabelOption")
    def put_data_point_menu_label_option(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        value = QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption(
            availability_status=availability_status
        )

        return typing.cast(None, jsii.invoke(self, "putDataPointMenuLabelOption", [value]))

    @jsii.member(jsii_name="putDataPointTooltipOption")
    def put_data_point_tooltip_option(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        value = QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption(
            availability_status=availability_status
        )

        return typing.cast(None, jsii.invoke(self, "putDataPointTooltipOption", [value]))

    @jsii.member(jsii_name="putExportToCsvOption")
    def put_export_to_csv_option(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        value = QuicksightDashboardDashboardPublishOptionsExportToCsvOption(
            availability_status=availability_status
        )

        return typing.cast(None, jsii.invoke(self, "putExportToCsvOption", [value]))

    @jsii.member(jsii_name="putExportWithHiddenFieldsOption")
    def put_export_with_hidden_fields_option(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        value = QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption(
            availability_status=availability_status
        )

        return typing.cast(None, jsii.invoke(self, "putExportWithHiddenFieldsOption", [value]))

    @jsii.member(jsii_name="putSheetControlsOption")
    def put_sheet_controls_option(
        self,
        *,
        visibility_state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param visibility_state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visibility_state QuicksightDashboard#visibility_state}.
        '''
        value = QuicksightDashboardDashboardPublishOptionsSheetControlsOption(
            visibility_state=visibility_state
        )

        return typing.cast(None, jsii.invoke(self, "putSheetControlsOption", [value]))

    @jsii.member(jsii_name="putSheetLayoutElementMaximizationOption")
    def put_sheet_layout_element_maximization_option(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        value = QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption(
            availability_status=availability_status
        )

        return typing.cast(None, jsii.invoke(self, "putSheetLayoutElementMaximizationOption", [value]))

    @jsii.member(jsii_name="putVisualAxisSortOption")
    def put_visual_axis_sort_option(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        value = QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption(
            availability_status=availability_status
        )

        return typing.cast(None, jsii.invoke(self, "putVisualAxisSortOption", [value]))

    @jsii.member(jsii_name="putVisualMenuOption")
    def put_visual_menu_option(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        value = QuicksightDashboardDashboardPublishOptionsVisualMenuOption(
            availability_status=availability_status
        )

        return typing.cast(None, jsii.invoke(self, "putVisualMenuOption", [value]))

    @jsii.member(jsii_name="resetAdHocFilteringOption")
    def reset_ad_hoc_filtering_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAdHocFilteringOption", []))

    @jsii.member(jsii_name="resetDataPointDrillUpDownOption")
    def reset_data_point_drill_up_down_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataPointDrillUpDownOption", []))

    @jsii.member(jsii_name="resetDataPointMenuLabelOption")
    def reset_data_point_menu_label_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataPointMenuLabelOption", []))

    @jsii.member(jsii_name="resetDataPointTooltipOption")
    def reset_data_point_tooltip_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataPointTooltipOption", []))

    @jsii.member(jsii_name="resetExportToCsvOption")
    def reset_export_to_csv_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExportToCsvOption", []))

    @jsii.member(jsii_name="resetExportWithHiddenFieldsOption")
    def reset_export_with_hidden_fields_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExportWithHiddenFieldsOption", []))

    @jsii.member(jsii_name="resetSheetControlsOption")
    def reset_sheet_controls_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSheetControlsOption", []))

    @jsii.member(jsii_name="resetSheetLayoutElementMaximizationOption")
    def reset_sheet_layout_element_maximization_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSheetLayoutElementMaximizationOption", []))

    @jsii.member(jsii_name="resetVisualAxisSortOption")
    def reset_visual_axis_sort_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVisualAxisSortOption", []))

    @jsii.member(jsii_name="resetVisualMenuOption")
    def reset_visual_menu_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVisualMenuOption", []))

    @builtins.property
    @jsii.member(jsii_name="adHocFilteringOption")
    def ad_hoc_filtering_option(
        self,
    ) -> QuicksightDashboardDashboardPublishOptionsAdHocFilteringOptionOutputReference:
        return typing.cast(QuicksightDashboardDashboardPublishOptionsAdHocFilteringOptionOutputReference, jsii.get(self, "adHocFilteringOption"))

    @builtins.property
    @jsii.member(jsii_name="dataPointDrillUpDownOption")
    def data_point_drill_up_down_option(
        self,
    ) -> QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOptionOutputReference:
        return typing.cast(QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOptionOutputReference, jsii.get(self, "dataPointDrillUpDownOption"))

    @builtins.property
    @jsii.member(jsii_name="dataPointMenuLabelOption")
    def data_point_menu_label_option(
        self,
    ) -> QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOptionOutputReference:
        return typing.cast(QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOptionOutputReference, jsii.get(self, "dataPointMenuLabelOption"))

    @builtins.property
    @jsii.member(jsii_name="dataPointTooltipOption")
    def data_point_tooltip_option(
        self,
    ) -> QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference:
        return typing.cast(QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference, jsii.get(self, "dataPointTooltipOption"))

    @builtins.property
    @jsii.member(jsii_name="exportToCsvOption")
    def export_to_csv_option(
        self,
    ) -> QuicksightDashboardDashboardPublishOptionsExportToCsvOptionOutputReference:
        return typing.cast(QuicksightDashboardDashboardPublishOptionsExportToCsvOptionOutputReference, jsii.get(self, "exportToCsvOption"))

    @builtins.property
    @jsii.member(jsii_name="exportWithHiddenFieldsOption")
    def export_with_hidden_fields_option(
        self,
    ) -> QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOptionOutputReference:
        return typing.cast(QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOptionOutputReference, jsii.get(self, "exportWithHiddenFieldsOption"))

    @builtins.property
    @jsii.member(jsii_name="sheetControlsOption")
    def sheet_controls_option(
        self,
    ) -> "QuicksightDashboardDashboardPublishOptionsSheetControlsOptionOutputReference":
        return typing.cast("QuicksightDashboardDashboardPublishOptionsSheetControlsOptionOutputReference", jsii.get(self, "sheetControlsOption"))

    @builtins.property
    @jsii.member(jsii_name="sheetLayoutElementMaximizationOption")
    def sheet_layout_element_maximization_option(
        self,
    ) -> "QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOptionOutputReference":
        return typing.cast("QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOptionOutputReference", jsii.get(self, "sheetLayoutElementMaximizationOption"))

    @builtins.property
    @jsii.member(jsii_name="visualAxisSortOption")
    def visual_axis_sort_option(
        self,
    ) -> "QuicksightDashboardDashboardPublishOptionsVisualAxisSortOptionOutputReference":
        return typing.cast("QuicksightDashboardDashboardPublishOptionsVisualAxisSortOptionOutputReference", jsii.get(self, "visualAxisSortOption"))

    @builtins.property
    @jsii.member(jsii_name="visualMenuOption")
    def visual_menu_option(
        self,
    ) -> "QuicksightDashboardDashboardPublishOptionsVisualMenuOptionOutputReference":
        return typing.cast("QuicksightDashboardDashboardPublishOptionsVisualMenuOptionOutputReference", jsii.get(self, "visualMenuOption"))

    @builtins.property
    @jsii.member(jsii_name="adHocFilteringOptionInput")
    def ad_hoc_filtering_option_input(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption], jsii.get(self, "adHocFilteringOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="dataPointDrillUpDownOptionInput")
    def data_point_drill_up_down_option_input(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption], jsii.get(self, "dataPointDrillUpDownOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="dataPointMenuLabelOptionInput")
    def data_point_menu_label_option_input(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption], jsii.get(self, "dataPointMenuLabelOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="dataPointTooltipOptionInput")
    def data_point_tooltip_option_input(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption], jsii.get(self, "dataPointTooltipOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="exportToCsvOptionInput")
    def export_to_csv_option_input(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsExportToCsvOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsExportToCsvOption], jsii.get(self, "exportToCsvOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="exportWithHiddenFieldsOptionInput")
    def export_with_hidden_fields_option_input(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption], jsii.get(self, "exportWithHiddenFieldsOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="sheetControlsOptionInput")
    def sheet_controls_option_input(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsSheetControlsOption"]:
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsSheetControlsOption"], jsii.get(self, "sheetControlsOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="sheetLayoutElementMaximizationOptionInput")
    def sheet_layout_element_maximization_option_input(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption"]:
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption"], jsii.get(self, "sheetLayoutElementMaximizationOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="visualAxisSortOptionInput")
    def visual_axis_sort_option_input(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption"]:
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption"], jsii.get(self, "visualAxisSortOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="visualMenuOptionInput")
    def visual_menu_option_input(
        self,
    ) -> typing.Optional["QuicksightDashboardDashboardPublishOptionsVisualMenuOption"]:
        return typing.cast(typing.Optional["QuicksightDashboardDashboardPublishOptionsVisualMenuOption"], jsii.get(self, "visualMenuOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptions]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1b67e5332438de380c264b71ee077595d29ac84771c75bbdb2302eae94dda39)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption",
    jsii_struct_bases=[],
    name_mapping={"visibility_state": "visibilityState"},
)
class QuicksightDashboardDashboardPublishOptionsSheetControlsOption:
    def __init__(
        self,
        *,
        visibility_state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param visibility_state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visibility_state QuicksightDashboard#visibility_state}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__865716012ccc6c05e54af4d5e8482190298bfddda31ca4e4e6bdf27f402d340c)
            check_type(argname="argument visibility_state", value=visibility_state, expected_type=type_hints["visibility_state"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if visibility_state is not None:
            self._values["visibility_state"] = visibility_state

    @builtins.property
    def visibility_state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visibility_state QuicksightDashboard#visibility_state}.'''
        result = self._values.get("visibility_state")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptionsSheetControlsOption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardDashboardPublishOptionsSheetControlsOptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6b06e9dff2dcfb4e7e9579fc8d09cc3b29c3758928d26bf55cfc4f966136adbb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetVisibilityState")
    def reset_visibility_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVisibilityState", []))

    @builtins.property
    @jsii.member(jsii_name="visibilityStateInput")
    def visibility_state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "visibilityStateInput"))

    @builtins.property
    @jsii.member(jsii_name="visibilityState")
    def visibility_state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "visibilityState"))

    @visibility_state.setter
    def visibility_state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d05ab7cce74bb7d5336e1891d9ef6027b5fff45164ff26309f599776f84b691c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "visibilityState", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsSheetControlsOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsSheetControlsOption], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptionsSheetControlsOption],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7420251d7b4fc1c15c042d1ad9059285e9de80f9297d861b4bc6c420ea62a0bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption",
    jsii_struct_bases=[],
    name_mapping={"availability_status": "availabilityStatus"},
)
class QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption:
    def __init__(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9593e0f09ca9814c27d63041284abbea3fc01644376759c5ca30a1c96b415f4)
            check_type(argname="argument availability_status", value=availability_status, expected_type=type_hints["availability_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_status is not None:
            self._values["availability_status"] = availability_status

    @builtins.property
    def availability_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.'''
        result = self._values.get("availability_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aa738a3b6bbe91e1cabbe5fbf4717551768f58d16e61c600c05baaa78c9aeaf5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAvailabilityStatus")
    def reset_availability_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityStatus", []))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatusInput")
    def availability_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatus")
    def availability_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityStatus"))

    @availability_status.setter
    def availability_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__964aa776e20ee939af4f68671fb42b6e7b03939841ea15c2be26009c716581ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6fbda9045615cf87eb77fb1eadf671878ab0e9e305d180e6ffbaa8135ce4ec4e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption",
    jsii_struct_bases=[],
    name_mapping={"availability_status": "availabilityStatus"},
)
class QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption:
    def __init__(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9bb554f6142733af027db061301840e1e6906c242200bfb2c9e88304cccd31bd)
            check_type(argname="argument availability_status", value=availability_status, expected_type=type_hints["availability_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_status is not None:
            self._values["availability_status"] = availability_status

    @builtins.property
    def availability_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.'''
        result = self._values.get("availability_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardDashboardPublishOptionsVisualAxisSortOptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__34571ed64558783c7728ebef1d41005bb458663526c78abf7c2499a104a826b1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAvailabilityStatus")
    def reset_availability_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityStatus", []))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatusInput")
    def availability_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatus")
    def availability_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityStatus"))

    @availability_status.setter
    def availability_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a78fea244a19a4dc0c4f7a4e6c6f58605158759bad81768611e33095e386a58)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64560aa503be7e47592f0f1ffdbcdfb23a10fcad6116e30d008147cd5a5b5bef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption",
    jsii_struct_bases=[],
    name_mapping={"availability_status": "availabilityStatus"},
)
class QuicksightDashboardDashboardPublishOptionsVisualMenuOption:
    def __init__(
        self,
        *,
        availability_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param availability_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53eb968d1fbdb34d6ce927708b618d211b8ad0a03bceffb96c2b917adc5f7230)
            check_type(argname="argument availability_status", value=availability_status, expected_type=type_hints["availability_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_status is not None:
            self._values["availability_status"] = availability_status

    @builtins.property
    def availability_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.'''
        result = self._values.get("availability_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardDashboardPublishOptionsVisualMenuOption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardDashboardPublishOptionsVisualMenuOptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b730625910f7a6adf771dce74844aeee87be242191a4d3b97ec043d266820a69)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAvailabilityStatus")
    def reset_availability_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityStatus", []))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatusInput")
    def availability_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityStatus")
    def availability_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityStatus"))

    @availability_status.setter
    def availability_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2663e4e5f7b178b3e47c249ce9e81ce60d2d5d7fb29c1250b76e12568f475edf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardDashboardPublishOptionsVisualMenuOption]:
        return typing.cast(typing.Optional[QuicksightDashboardDashboardPublishOptionsVisualMenuOption], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardDashboardPublishOptionsVisualMenuOption],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dd56fd80ce3d13725957da36af2349d7c6ef627c85b6a018cb1ff26f09b2e463)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParameters",
    jsii_struct_bases=[],
    name_mapping={
        "date_time_parameters": "dateTimeParameters",
        "decimal_parameters": "decimalParameters",
        "integer_parameters": "integerParameters",
        "string_parameters": "stringParameters",
    },
)
class QuicksightDashboardParameters:
    def __init__(
        self,
        *,
        date_time_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardParametersDateTimeParameters", typing.Dict[builtins.str, typing.Any]]]]] = None,
        decimal_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardParametersDecimalParameters", typing.Dict[builtins.str, typing.Any]]]]] = None,
        integer_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardParametersIntegerParameters", typing.Dict[builtins.str, typing.Any]]]]] = None,
        string_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardParametersStringParameters", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param date_time_parameters: date_time_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#date_time_parameters QuicksightDashboard#date_time_parameters}
        :param decimal_parameters: decimal_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#decimal_parameters QuicksightDashboard#decimal_parameters}
        :param integer_parameters: integer_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#integer_parameters QuicksightDashboard#integer_parameters}
        :param string_parameters: string_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#string_parameters QuicksightDashboard#string_parameters}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aec8bdbbf2b59ae90a367c7a6b1d3ab1f72cf9a574ea5c43a265675c6c6daced)
            check_type(argname="argument date_time_parameters", value=date_time_parameters, expected_type=type_hints["date_time_parameters"])
            check_type(argname="argument decimal_parameters", value=decimal_parameters, expected_type=type_hints["decimal_parameters"])
            check_type(argname="argument integer_parameters", value=integer_parameters, expected_type=type_hints["integer_parameters"])
            check_type(argname="argument string_parameters", value=string_parameters, expected_type=type_hints["string_parameters"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if date_time_parameters is not None:
            self._values["date_time_parameters"] = date_time_parameters
        if decimal_parameters is not None:
            self._values["decimal_parameters"] = decimal_parameters
        if integer_parameters is not None:
            self._values["integer_parameters"] = integer_parameters
        if string_parameters is not None:
            self._values["string_parameters"] = string_parameters

    @builtins.property
    def date_time_parameters(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardParametersDateTimeParameters"]]]:
        '''date_time_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#date_time_parameters QuicksightDashboard#date_time_parameters}
        '''
        result = self._values.get("date_time_parameters")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardParametersDateTimeParameters"]]], result)

    @builtins.property
    def decimal_parameters(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardParametersDecimalParameters"]]]:
        '''decimal_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#decimal_parameters QuicksightDashboard#decimal_parameters}
        '''
        result = self._values.get("decimal_parameters")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardParametersDecimalParameters"]]], result)

    @builtins.property
    def integer_parameters(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardParametersIntegerParameters"]]]:
        '''integer_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#integer_parameters QuicksightDashboard#integer_parameters}
        '''
        result = self._values.get("integer_parameters")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardParametersIntegerParameters"]]], result)

    @builtins.property
    def string_parameters(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardParametersStringParameters"]]]:
        '''string_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#string_parameters QuicksightDashboard#string_parameters}
        '''
        result = self._values.get("string_parameters")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardParametersStringParameters"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersDateTimeParameters",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "values": "values"},
)
class QuicksightDashboardParametersDateTimeParameters:
    def __init__(
        self,
        *,
        name: builtins.str,
        values: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.
        :param values: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#values QuicksightDashboard#values}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d16147682a6cf6731d24d77bf3c5940015540dfb236b1bd9a7a39ccdd57dcb5)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument values", value=values, expected_type=type_hints["values"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "values": values,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def values(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#values QuicksightDashboard#values}.'''
        result = self._values.get("values")
        assert result is not None, "Required property 'values' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardParametersDateTimeParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardParametersDateTimeParametersList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersDateTimeParametersList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0ccc9de85309af49d3677a61b42b4f0cd497d9b2a24abf91b2202b55e42de349)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDashboardParametersDateTimeParametersOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4ab334f6a6fe8d8972959e1a3db76d06cefe65378e4dc1f08b5612383d5b660)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDashboardParametersDateTimeParametersOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__97a152f7fa647ea1f32c26daf569d0f2864ca94184710f0f826d2db338587e53)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9d44de1f9774159b50998247e568ac2660a9425b0dd6f8643b592eb41848d74b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8685e4fa6a609ab65145cbc862f8c7e579354e723fc8635d3bdd39f348df6bf9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDateTimeParameters]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDateTimeParameters]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDateTimeParameters]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ff52b10be2f5e618754b1c262bbb5b10585ed8f17e39263104ba432e266ebb8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDashboardParametersDateTimeParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersDateTimeParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1de9d6e2eaccb87250e3d6c992442062cc18b25cab0a12a94e65b7ca57ea1c40)
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
    @jsii.member(jsii_name="valuesInput")
    def values_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "valuesInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a28e91b97f2a0d66aaf8e3b00a91e922c50ff41c96260e1be6fde35f6fc7027)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="values")
    def values(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "values"))

    @values.setter
    def values(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9fd419d6954442d1205cce02bb1ff8a418a5a2650ef35be0d22874737cf95c64)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "values", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersDateTimeParameters]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersDateTimeParameters]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersDateTimeParameters]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05afedd3afd5a5a877639be336dff78d74033f276c03aed59a76ea59fb30e6e5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersDecimalParameters",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "values": "values"},
)
class QuicksightDashboardParametersDecimalParameters:
    def __init__(
        self,
        *,
        name: builtins.str,
        values: typing.Sequence[jsii.Number],
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.
        :param values: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#values QuicksightDashboard#values}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__511376e12ae79bf7415ced354158c2029c41424192de6b9236c3edcac2f9e1f2)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument values", value=values, expected_type=type_hints["values"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "values": values,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def values(self) -> typing.List[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#values QuicksightDashboard#values}.'''
        result = self._values.get("values")
        assert result is not None, "Required property 'values' is missing"
        return typing.cast(typing.List[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardParametersDecimalParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardParametersDecimalParametersList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersDecimalParametersList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__483cdcca1ee2b79898adb3abf491a3032bb22811587e526d9c1d7a46b44cfcd0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDashboardParametersDecimalParametersOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__807b5076db1dd36fc2d95ff40553bac451c337022c8e33861705ac6646cb6324)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDashboardParametersDecimalParametersOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15f399ebc18145d6d78eb75c59b47b39c096eeebeac0fad3a01b78dafba20802)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5f9bb11f69ffa9eba49c32a01316b3e7d26aeba3a60b408c506eb89d170e8991)
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
            type_hints = typing.get_type_hints(_typecheckingstub__306c95c477ea8bba1933d91d416f98a312a0d09a0bf73653e63a27549c68d19a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDecimalParameters]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDecimalParameters]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDecimalParameters]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d072076bdd7d11576e153b8731a016579682efb1f323722558b553f1f797586)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDashboardParametersDecimalParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersDecimalParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7b1b5c2de908ace25386c629b5d2c188009f4763226a7c9bad9c1fc9dbc2d830)
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
    @jsii.member(jsii_name="valuesInput")
    def values_input(self) -> typing.Optional[typing.List[jsii.Number]]:
        return typing.cast(typing.Optional[typing.List[jsii.Number]], jsii.get(self, "valuesInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22f31db49b76a147f651c1ba872f626652e786051f66a1faebd98717068b1334)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="values")
    def values(self) -> typing.List[jsii.Number]:
        return typing.cast(typing.List[jsii.Number], jsii.get(self, "values"))

    @values.setter
    def values(self, value: typing.List[jsii.Number]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__903384e878d8870146e89f43fefd8778cee304f23a3d535c563cddc8d2617a2d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "values", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersDecimalParameters]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersDecimalParameters]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersDecimalParameters]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f41dada98bc652fc45e0a24b3ec13876becb4bceb06c0c5690b2e38d3197ef6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersIntegerParameters",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "values": "values"},
)
class QuicksightDashboardParametersIntegerParameters:
    def __init__(
        self,
        *,
        name: builtins.str,
        values: typing.Sequence[jsii.Number],
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.
        :param values: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#values QuicksightDashboard#values}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04659655ca9795713f4894ffe653b20623fd4f806be798cbc9649d99714dc901)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument values", value=values, expected_type=type_hints["values"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "values": values,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def values(self) -> typing.List[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#values QuicksightDashboard#values}.'''
        result = self._values.get("values")
        assert result is not None, "Required property 'values' is missing"
        return typing.cast(typing.List[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardParametersIntegerParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardParametersIntegerParametersList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersIntegerParametersList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ba615e3a6410578bd05b0544bd0548ddac3fee38b71e46beb9197361286eac7b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDashboardParametersIntegerParametersOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d775f607ee3dc1bdac50f8f083f20e57f40e59fc1d481c0dc10f45975fb5fb83)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDashboardParametersIntegerParametersOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__493ab0ee743f4e2a805e93b32ac25469e733e35ccc3c2314af8a165f33d5a4d0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__31353a24d5dfbba5443f9e8a6d36f6b0a7fc236ec7db9b0e094490773faf4c3b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3407ac20274a7e730695b7058256c7bc2058f6542e3bf8a0473872a0189fa687)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersIntegerParameters]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersIntegerParameters]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersIntegerParameters]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99690d4965bbef065524ebf3ca743e33c3183eee841bb29b32520244a0214731)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDashboardParametersIntegerParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersIntegerParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f1d195dca88c3513d37ebbec667049cee6f5795e2f14c82c0e8e78458ef042a8)
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
    @jsii.member(jsii_name="valuesInput")
    def values_input(self) -> typing.Optional[typing.List[jsii.Number]]:
        return typing.cast(typing.Optional[typing.List[jsii.Number]], jsii.get(self, "valuesInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3903ff83df345ad45b5dd5d92756739c9ef8d7774230f9357fa18d007de88192)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="values")
    def values(self) -> typing.List[jsii.Number]:
        return typing.cast(typing.List[jsii.Number], jsii.get(self, "values"))

    @values.setter
    def values(self, value: typing.List[jsii.Number]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78d46e78407e82fa6ee4df973a8dc4cbdeb20221384a5a35bf72e2f1446fa333)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "values", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersIntegerParameters]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersIntegerParameters]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersIntegerParameters]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eedf44bcce2a5a9b1396ac24f23cde3fb9cc4cda54718d01f6dfa0c2dfb53a45)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDashboardParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__25b30d2d4d91b410c4b88d7a11f384c1325217bd0f140aff44d7f0fbf1a29bd2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDateTimeParameters")
    def put_date_time_parameters(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersDateTimeParameters, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07bfa3b1d11da624f1abbd455ad4af7998c41c98fd9e149cb016f71ed00c9f55)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDateTimeParameters", [value]))

    @jsii.member(jsii_name="putDecimalParameters")
    def put_decimal_parameters(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersDecimalParameters, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0979315c3fb984c5f53680d36c31b4fe439a1f62a1792aea0c82ff0e6966f31)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDecimalParameters", [value]))

    @jsii.member(jsii_name="putIntegerParameters")
    def put_integer_parameters(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersIntegerParameters, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7a82d22428c1d8d11d81dfdb36ba12236af3f5f097d8cbecb544ce9e899b3ed7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putIntegerParameters", [value]))

    @jsii.member(jsii_name="putStringParameters")
    def put_string_parameters(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardParametersStringParameters", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e3b3545e2058c563a86625bfd467a868a7bc823f884effceaf5629d43066ecd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putStringParameters", [value]))

    @jsii.member(jsii_name="resetDateTimeParameters")
    def reset_date_time_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDateTimeParameters", []))

    @jsii.member(jsii_name="resetDecimalParameters")
    def reset_decimal_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDecimalParameters", []))

    @jsii.member(jsii_name="resetIntegerParameters")
    def reset_integer_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIntegerParameters", []))

    @jsii.member(jsii_name="resetStringParameters")
    def reset_string_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStringParameters", []))

    @builtins.property
    @jsii.member(jsii_name="dateTimeParameters")
    def date_time_parameters(
        self,
    ) -> QuicksightDashboardParametersDateTimeParametersList:
        return typing.cast(QuicksightDashboardParametersDateTimeParametersList, jsii.get(self, "dateTimeParameters"))

    @builtins.property
    @jsii.member(jsii_name="decimalParameters")
    def decimal_parameters(self) -> QuicksightDashboardParametersDecimalParametersList:
        return typing.cast(QuicksightDashboardParametersDecimalParametersList, jsii.get(self, "decimalParameters"))

    @builtins.property
    @jsii.member(jsii_name="integerParameters")
    def integer_parameters(self) -> QuicksightDashboardParametersIntegerParametersList:
        return typing.cast(QuicksightDashboardParametersIntegerParametersList, jsii.get(self, "integerParameters"))

    @builtins.property
    @jsii.member(jsii_name="stringParameters")
    def string_parameters(self) -> "QuicksightDashboardParametersStringParametersList":
        return typing.cast("QuicksightDashboardParametersStringParametersList", jsii.get(self, "stringParameters"))

    @builtins.property
    @jsii.member(jsii_name="dateTimeParametersInput")
    def date_time_parameters_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDateTimeParameters]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDateTimeParameters]]], jsii.get(self, "dateTimeParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="decimalParametersInput")
    def decimal_parameters_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDecimalParameters]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDecimalParameters]]], jsii.get(self, "decimalParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="integerParametersInput")
    def integer_parameters_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersIntegerParameters]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersIntegerParameters]]], jsii.get(self, "integerParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="stringParametersInput")
    def string_parameters_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardParametersStringParameters"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardParametersStringParameters"]]], jsii.get(self, "stringParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[QuicksightDashboardParameters]:
        return typing.cast(typing.Optional[QuicksightDashboardParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84f7335eaeb2bfc1aacf99a8cc70a1aae317e53b3298d4038ab809118bd0b753)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersStringParameters",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "values": "values"},
)
class QuicksightDashboardParametersStringParameters:
    def __init__(
        self,
        *,
        name: builtins.str,
        values: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.
        :param values: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#values QuicksightDashboard#values}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05c5a8bbd734dfcfe73737b186b30a61e50c05ecb34e38273ecb2d7185e33d24)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument values", value=values, expected_type=type_hints["values"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "values": values,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def values(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#values QuicksightDashboard#values}.'''
        result = self._values.get("values")
        assert result is not None, "Required property 'values' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardParametersStringParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardParametersStringParametersList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersStringParametersList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a46a4a413f3a125b5b52069bee44c6b95d5b2691714138b750015b13d234e820)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDashboardParametersStringParametersOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__457be7d66cf1da3af79e909b0fc98fa92e9310b3181625336d898256a7eff9b9)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDashboardParametersStringParametersOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02265a7c1fe66c3de5a854a3c6c8a4815ee01865b4e3f8d01fba3ba5de697ece)
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
            type_hints = typing.get_type_hints(_typecheckingstub__efb41738de14d49907ca2e384a3b63d895755fc8a30fc235a93bf04026d3ce48)
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
            type_hints = typing.get_type_hints(_typecheckingstub__77ed8d2c34f7abffd6a935022d96b1c2a122cea3925381279d6641b8b5935541)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersStringParameters]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersStringParameters]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersStringParameters]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fed20efda14d27da2148079d6115bd27c9c6635534117922cd36142b84432281)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDashboardParametersStringParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardParametersStringParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8e1bdf992d1403acf184ba45207df71a5455e6daccbfa820582b4f42fc9e0ac9)
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
    @jsii.member(jsii_name="valuesInput")
    def values_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "valuesInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a9015bde8b932652ec0683086aef9c58ba782c52fc150786fe7937b0682afb8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="values")
    def values(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "values"))

    @values.setter
    def values(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3bc0ca941fdf681bfff86846cd2784162a0ef805fa87df75e9dd9017e51472c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "values", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersStringParameters]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersStringParameters]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersStringParameters]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d814af03300d5514ed61c9b7ecf8cb0b13d2757eb26ee9828ea2fbaca1c1f3f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardPermissions",
    jsii_struct_bases=[],
    name_mapping={"actions": "actions", "principal": "principal"},
)
class QuicksightDashboardPermissions:
    def __init__(
        self,
        *,
        actions: typing.Sequence[builtins.str],
        principal: builtins.str,
    ) -> None:
        '''
        :param actions: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#actions QuicksightDashboard#actions}.
        :param principal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#principal QuicksightDashboard#principal}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__00f8a1ab33832d7e128809b03442f91d1448403495fe2770daab8126800a6978)
            check_type(argname="argument actions", value=actions, expected_type=type_hints["actions"])
            check_type(argname="argument principal", value=principal, expected_type=type_hints["principal"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "actions": actions,
            "principal": principal,
        }

    @builtins.property
    def actions(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#actions QuicksightDashboard#actions}.'''
        result = self._values.get("actions")
        assert result is not None, "Required property 'actions' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def principal(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#principal QuicksightDashboard#principal}.'''
        result = self._values.get("principal")
        assert result is not None, "Required property 'principal' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardPermissions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardPermissionsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardPermissionsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__411cb4f10cc001e841b207923c8f87e0fb0a607e956cdc5288f54621ba28c602)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDashboardPermissionsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4296fd074b25b40621cba4a16ce3d3f523738bcaaad8920393d833e5cb7c22cf)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDashboardPermissionsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b360e6d5fdbf4ae5c113284d642d82935f2ca1a32b05c49eb1289a53e30ee82)
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
            type_hints = typing.get_type_hints(_typecheckingstub__98d6e3bedeaf5694deabf81f91fa297a13dd8815d45ec7b685a1a00da0b7911a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__325a1fdc3d85646fc640580a65069aa4244722fef72b8c4a5d78ea13dbf693b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardPermissions]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardPermissions]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardPermissions]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f5de7d385a8d6666424e3488927e55f995486baaba87232cc95edb4ae4ecff3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDashboardPermissionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardPermissionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9f8a6b6c3e7e3432196dead53dd79c707f2b168d63b111c737d2a89c5f118e5a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__888a0ae6d099525940395642219ca84f191d6ddd71d947d5a0288bafc24f2e0a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "actions", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="principal")
    def principal(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "principal"))

    @principal.setter
    def principal(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__995585710e51e6d3dc5cd8bb30ebaae37e1d6f1386151497f10d8d91a0ad20bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "principal", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardPermissions]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardPermissions]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardPermissions]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ea993ff1e98e81013c3e4372dff8ddbe9c7f063a0a3169b96b776c25b8329b7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardSourceEntity",
    jsii_struct_bases=[],
    name_mapping={"source_template": "sourceTemplate"},
)
class QuicksightDashboardSourceEntity:
    def __init__(
        self,
        *,
        source_template: typing.Optional[typing.Union["QuicksightDashboardSourceEntitySourceTemplate", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param source_template: source_template block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#source_template QuicksightDashboard#source_template}
        '''
        if isinstance(source_template, dict):
            source_template = QuicksightDashboardSourceEntitySourceTemplate(**source_template)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ccd1d22a24f93f29550df5ef93920a83e9857882cb5d940e7601cd44d147b79)
            check_type(argname="argument source_template", value=source_template, expected_type=type_hints["source_template"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if source_template is not None:
            self._values["source_template"] = source_template

    @builtins.property
    def source_template(
        self,
    ) -> typing.Optional["QuicksightDashboardSourceEntitySourceTemplate"]:
        '''source_template block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#source_template QuicksightDashboard#source_template}
        '''
        result = self._values.get("source_template")
        return typing.cast(typing.Optional["QuicksightDashboardSourceEntitySourceTemplate"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardSourceEntity(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardSourceEntityOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardSourceEntityOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fd7d8480a32acca5d16a35a3637ab9a95c218ca24d3695e8dad1d0b59e9e112c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putSourceTemplate")
    def put_source_template(
        self,
        *,
        arn: builtins.str,
        data_set_references: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardSourceEntitySourceTemplateDataSetReferences", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#arn QuicksightDashboard#arn}.
        :param data_set_references: data_set_references block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_set_references QuicksightDashboard#data_set_references}
        '''
        value = QuicksightDashboardSourceEntitySourceTemplate(
            arn=arn, data_set_references=data_set_references
        )

        return typing.cast(None, jsii.invoke(self, "putSourceTemplate", [value]))

    @jsii.member(jsii_name="resetSourceTemplate")
    def reset_source_template(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceTemplate", []))

    @builtins.property
    @jsii.member(jsii_name="sourceTemplate")
    def source_template(
        self,
    ) -> "QuicksightDashboardSourceEntitySourceTemplateOutputReference":
        return typing.cast("QuicksightDashboardSourceEntitySourceTemplateOutputReference", jsii.get(self, "sourceTemplate"))

    @builtins.property
    @jsii.member(jsii_name="sourceTemplateInput")
    def source_template_input(
        self,
    ) -> typing.Optional["QuicksightDashboardSourceEntitySourceTemplate"]:
        return typing.cast(typing.Optional["QuicksightDashboardSourceEntitySourceTemplate"], jsii.get(self, "sourceTemplateInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[QuicksightDashboardSourceEntity]:
        return typing.cast(typing.Optional[QuicksightDashboardSourceEntity], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardSourceEntity],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab196c5d17f7da9d6ad6735be398802900c6eb5207b33dc4075ace460390feba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardSourceEntitySourceTemplate",
    jsii_struct_bases=[],
    name_mapping={"arn": "arn", "data_set_references": "dataSetReferences"},
)
class QuicksightDashboardSourceEntitySourceTemplate:
    def __init__(
        self,
        *,
        arn: builtins.str,
        data_set_references: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["QuicksightDashboardSourceEntitySourceTemplateDataSetReferences", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#arn QuicksightDashboard#arn}.
        :param data_set_references: data_set_references block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_set_references QuicksightDashboard#data_set_references}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__011ecdb6b76f014fff4c64443c32deb620ba62711387a0794ba9443823673e98)
            check_type(argname="argument arn", value=arn, expected_type=type_hints["arn"])
            check_type(argname="argument data_set_references", value=data_set_references, expected_type=type_hints["data_set_references"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "arn": arn,
            "data_set_references": data_set_references,
        }

    @builtins.property
    def arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#arn QuicksightDashboard#arn}.'''
        result = self._values.get("arn")
        assert result is not None, "Required property 'arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def data_set_references(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardSourceEntitySourceTemplateDataSetReferences"]]:
        '''data_set_references block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_set_references QuicksightDashboard#data_set_references}
        '''
        result = self._values.get("data_set_references")
        assert result is not None, "Required property 'data_set_references' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["QuicksightDashboardSourceEntitySourceTemplateDataSetReferences"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardSourceEntitySourceTemplate(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardSourceEntitySourceTemplateDataSetReferences",
    jsii_struct_bases=[],
    name_mapping={
        "data_set_arn": "dataSetArn",
        "data_set_placeholder": "dataSetPlaceholder",
    },
)
class QuicksightDashboardSourceEntitySourceTemplateDataSetReferences:
    def __init__(
        self,
        *,
        data_set_arn: builtins.str,
        data_set_placeholder: builtins.str,
    ) -> None:
        '''
        :param data_set_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_set_arn QuicksightDashboard#data_set_arn}.
        :param data_set_placeholder: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_set_placeholder QuicksightDashboard#data_set_placeholder}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b4e5056b9f81980f87838e6674326d0b1a35ab648e940f69360705747648a883)
            check_type(argname="argument data_set_arn", value=data_set_arn, expected_type=type_hints["data_set_arn"])
            check_type(argname="argument data_set_placeholder", value=data_set_placeholder, expected_type=type_hints["data_set_placeholder"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "data_set_arn": data_set_arn,
            "data_set_placeholder": data_set_placeholder,
        }

    @builtins.property
    def data_set_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_set_arn QuicksightDashboard#data_set_arn}.'''
        result = self._values.get("data_set_arn")
        assert result is not None, "Required property 'data_set_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def data_set_placeholder(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_set_placeholder QuicksightDashboard#data_set_placeholder}.'''
        result = self._values.get("data_set_placeholder")
        assert result is not None, "Required property 'data_set_placeholder' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardSourceEntitySourceTemplateDataSetReferences(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardSourceEntitySourceTemplateDataSetReferencesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardSourceEntitySourceTemplateDataSetReferencesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ce729d719f83c423752d639a60c2e9aabe6fb31a5012ebac5151f935d2ce7c40)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "QuicksightDashboardSourceEntitySourceTemplateDataSetReferencesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9b7e09b4daf51b22e825fb70b84682bed11a83ef7f30d7b079072a82653ff75)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("QuicksightDashboardSourceEntitySourceTemplateDataSetReferencesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0734ec2f19afaf907fc57b1f4ba9c0ac6cbe842c789b56c5ac50c4a1f1aabcda)
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
            type_hints = typing.get_type_hints(_typecheckingstub__24216309b1d9d4777232966f99922fd48086c04621d097c6bfdf247bf9ffd7d0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6bd6bc0b670e584c85117776107183ac65cc03837838a934b38d77212f593d61)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardSourceEntitySourceTemplateDataSetReferences]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardSourceEntitySourceTemplateDataSetReferences]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardSourceEntitySourceTemplateDataSetReferences]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81f612e091e743eb5a98d7015b5757bbc906f06bfba107c105f3f7897bc9da31)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDashboardSourceEntitySourceTemplateDataSetReferencesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardSourceEntitySourceTemplateDataSetReferencesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9c8c7f02050341cca76952394c4ac7c8215598d48ce72890926af86fbcbf9c56)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="dataSetArnInput")
    def data_set_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataSetArnInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSetPlaceholderInput")
    def data_set_placeholder_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataSetPlaceholderInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSetArn")
    def data_set_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataSetArn"))

    @data_set_arn.setter
    def data_set_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee2a5a7b8ede484643f4d7307eb5354361fcb38cfe01b30eda6aebf4ab66ad28)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataSetArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dataSetPlaceholder")
    def data_set_placeholder(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataSetPlaceholder"))

    @data_set_placeholder.setter
    def data_set_placeholder(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b15a9951b0fbea22b1ea123f27eec007ed3647c8362e68a0278da722d3b794a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataSetPlaceholder", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardSourceEntitySourceTemplateDataSetReferences]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardSourceEntitySourceTemplateDataSetReferences]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardSourceEntitySourceTemplateDataSetReferences]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a111ad4d4e505b81926b7dd228ae9f2b3599570b3769213143e649ba214b2cbf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class QuicksightDashboardSourceEntitySourceTemplateOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardSourceEntitySourceTemplateOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__29b33c4249245f791a0557f544b3d5e320faf5cd112752bb9b1040d54221c3c2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDataSetReferences")
    def put_data_set_references(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardSourceEntitySourceTemplateDataSetReferences, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ad17e0e589ebbb6bdbe16d359ed227abf9361aeef7c8980c60d1c5ecd705470)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDataSetReferences", [value]))

    @builtins.property
    @jsii.member(jsii_name="dataSetReferences")
    def data_set_references(
        self,
    ) -> QuicksightDashboardSourceEntitySourceTemplateDataSetReferencesList:
        return typing.cast(QuicksightDashboardSourceEntitySourceTemplateDataSetReferencesList, jsii.get(self, "dataSetReferences"))

    @builtins.property
    @jsii.member(jsii_name="arnInput")
    def arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "arnInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSetReferencesInput")
    def data_set_references_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardSourceEntitySourceTemplateDataSetReferences]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardSourceEntitySourceTemplateDataSetReferences]]], jsii.get(self, "dataSetReferencesInput"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @arn.setter
    def arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__724df8279981c1aca78ea4552bb79635075ac779d1317c59de8160cfaca7184a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "arn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[QuicksightDashboardSourceEntitySourceTemplate]:
        return typing.cast(typing.Optional[QuicksightDashboardSourceEntitySourceTemplate], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[QuicksightDashboardSourceEntitySourceTemplate],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dbce51ca6805e97838b366788f17d5bf04248e4c245210d9ef5e011da5bed8c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.quicksightDashboard.QuicksightDashboardTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class QuicksightDashboardTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#create QuicksightDashboard#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#delete QuicksightDashboard#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#update QuicksightDashboard#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67a56ccba7abdf4b4d5dba0d5a43fe7860a43e1671639230a5a920c1accbf6dc)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#create QuicksightDashboard#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#delete QuicksightDashboard#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#update QuicksightDashboard#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "QuicksightDashboardTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class QuicksightDashboardTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.quicksightDashboard.QuicksightDashboardTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aa7140628a755ecb894af90f5cbc9b80dd2e8020865850c9ab9fc53ffc3a3877)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a75ab7f014c1cb9b1695ba3870638f4d5915e53b15c703b5b38c1c95b812b1c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e0b5ac2a68b32a33b1152995134fae0f61b2ddd1e5d6bcf822aad6048683da26)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e894f4de9d813f259eb1c60b1db4141719f5468c534fbec02a45a742997e092)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3da44d0b6d36f4e6968334fbf3097dc5c71dbfe3d46ea54ad1cc1f4a76e767a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "QuicksightDashboard",
    "QuicksightDashboardConfig",
    "QuicksightDashboardDashboardPublishOptions",
    "QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption",
    "QuicksightDashboardDashboardPublishOptionsAdHocFilteringOptionOutputReference",
    "QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption",
    "QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOptionOutputReference",
    "QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption",
    "QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOptionOutputReference",
    "QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption",
    "QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference",
    "QuicksightDashboardDashboardPublishOptionsExportToCsvOption",
    "QuicksightDashboardDashboardPublishOptionsExportToCsvOptionOutputReference",
    "QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption",
    "QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOptionOutputReference",
    "QuicksightDashboardDashboardPublishOptionsOutputReference",
    "QuicksightDashboardDashboardPublishOptionsSheetControlsOption",
    "QuicksightDashboardDashboardPublishOptionsSheetControlsOptionOutputReference",
    "QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption",
    "QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOptionOutputReference",
    "QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption",
    "QuicksightDashboardDashboardPublishOptionsVisualAxisSortOptionOutputReference",
    "QuicksightDashboardDashboardPublishOptionsVisualMenuOption",
    "QuicksightDashboardDashboardPublishOptionsVisualMenuOptionOutputReference",
    "QuicksightDashboardParameters",
    "QuicksightDashboardParametersDateTimeParameters",
    "QuicksightDashboardParametersDateTimeParametersList",
    "QuicksightDashboardParametersDateTimeParametersOutputReference",
    "QuicksightDashboardParametersDecimalParameters",
    "QuicksightDashboardParametersDecimalParametersList",
    "QuicksightDashboardParametersDecimalParametersOutputReference",
    "QuicksightDashboardParametersIntegerParameters",
    "QuicksightDashboardParametersIntegerParametersList",
    "QuicksightDashboardParametersIntegerParametersOutputReference",
    "QuicksightDashboardParametersOutputReference",
    "QuicksightDashboardParametersStringParameters",
    "QuicksightDashboardParametersStringParametersList",
    "QuicksightDashboardParametersStringParametersOutputReference",
    "QuicksightDashboardPermissions",
    "QuicksightDashboardPermissionsList",
    "QuicksightDashboardPermissionsOutputReference",
    "QuicksightDashboardSourceEntity",
    "QuicksightDashboardSourceEntityOutputReference",
    "QuicksightDashboardSourceEntitySourceTemplate",
    "QuicksightDashboardSourceEntitySourceTemplateDataSetReferences",
    "QuicksightDashboardSourceEntitySourceTemplateDataSetReferencesList",
    "QuicksightDashboardSourceEntitySourceTemplateDataSetReferencesOutputReference",
    "QuicksightDashboardSourceEntitySourceTemplateOutputReference",
    "QuicksightDashboardTimeouts",
    "QuicksightDashboardTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__8c6a359edde124446fc195e7bc8763c01309df6e420b0b0123148b01df415749(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    dashboard_id: builtins.str,
    name: builtins.str,
    version_description: builtins.str,
    aws_account_id: typing.Optional[builtins.str] = None,
    dashboard_publish_options: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    definition: typing.Any = None,
    id: typing.Optional[builtins.str] = None,
    parameters: typing.Optional[typing.Union[QuicksightDashboardParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardPermissions, typing.Dict[builtins.str, typing.Any]]]]] = None,
    source_entity: typing.Optional[typing.Union[QuicksightDashboardSourceEntity, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    theme_arn: typing.Optional[builtins.str] = None,
    timeouts: typing.Optional[typing.Union[QuicksightDashboardTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__ec3d95fd554d4b3215aeeccea495967b699b5bd7c401d3f31d5f833e78e0f554(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5a0c63b9b2b7944b84af52cd628142c85552e29aa9b121a1f8c39660fcc2650(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardPermissions, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bee654d7a881f1a6d5e1d3b34b54bf4064fa669f6550a2b8dea6d09cff2b203c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f6443e32239a2729d1bf6396c222ad5faa030155543ab5e44bf558e85e85dad(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__323cf62786f7be080d7a4fd82563fbc5f3a0f91743d1f163ae851615d0bfc060(
    value: typing.Any,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__51a2d7a22289e9315202687ed260ae3a9072f8c70b97754b1d63b59e37ea4b7a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__388a219982adff399597ef3c59f20e1976c1aad8be1ffa6ccaac32347bc6992c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07f656e46cc9bb113a044678732d0d613e0c7b9d931a8878e002452cae8b3926(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d37c8880a7f3e0edb9e1ec4bd54ab205d19d2dfe386f61f46dfa1e102f0f4b9d(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__880051c7299f77845855afa6eceae24d7af4aedc5f2c01a6aecd6933739484b5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc13824577de75f4b98acc47241eb6d74a6f95003a8374c34b43ac3287cce388(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6924268a464a047b79225d8e07d0797c7da3c01999ae89792ad2c1232aa91e72(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    dashboard_id: builtins.str,
    name: builtins.str,
    version_description: builtins.str,
    aws_account_id: typing.Optional[builtins.str] = None,
    dashboard_publish_options: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    definition: typing.Any = None,
    id: typing.Optional[builtins.str] = None,
    parameters: typing.Optional[typing.Union[QuicksightDashboardParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    permissions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardPermissions, typing.Dict[builtins.str, typing.Any]]]]] = None,
    source_entity: typing.Optional[typing.Union[QuicksightDashboardSourceEntity, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    theme_arn: typing.Optional[builtins.str] = None,
    timeouts: typing.Optional[typing.Union[QuicksightDashboardTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1092eb7486ec406ca0e24b07122d7764db75f54ad8fcab0ab3dc92be3b9f1618(
    *,
    ad_hoc_filtering_option: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption, typing.Dict[builtins.str, typing.Any]]] = None,
    data_point_drill_up_down_option: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption, typing.Dict[builtins.str, typing.Any]]] = None,
    data_point_menu_label_option: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption, typing.Dict[builtins.str, typing.Any]]] = None,
    data_point_tooltip_option: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption, typing.Dict[builtins.str, typing.Any]]] = None,
    export_to_csv_option: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptionsExportToCsvOption, typing.Dict[builtins.str, typing.Any]]] = None,
    export_with_hidden_fields_option: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption, typing.Dict[builtins.str, typing.Any]]] = None,
    sheet_controls_option: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptionsSheetControlsOption, typing.Dict[builtins.str, typing.Any]]] = None,
    sheet_layout_element_maximization_option: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption, typing.Dict[builtins.str, typing.Any]]] = None,
    visual_axis_sort_option: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption, typing.Dict[builtins.str, typing.Any]]] = None,
    visual_menu_option: typing.Optional[typing.Union[QuicksightDashboardDashboardPublishOptionsVisualMenuOption, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e09b66b90feb4463758e0793f374626e863b15d72d1b0d9e29ace3a28d30229(
    *,
    availability_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b14e25a792414ee08b25711234fa7a342093b7d48f67a880108ad8661a5516ba(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02ac41b7bb7d0dd99d15d3484b125feed7d70e8f605c35825e63f2791c4d65a8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66e09a6a133ac10bfeec43857c674e72f46b07ee27756bf4e3627be4412680f2(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff3e7798be64634a30264ab1ace5c89e5229565ab8a8e095e4494db0db174f67(
    *,
    availability_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c17f55faa9a88ab48322d709ab2634475fc1fb7b90e400cb0932a4cd0377c198(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b8a52e2d4c4775f18e4678ef8de9778cfb60ffe4862f3dd3031c86b061ece28(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdeedf7961eb0def11ea04c80c168d9c0f5b924dc50c1bdbca11025d8c5d02b7(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e21f77e83d4de331c08fb54d3ceb58d33b8ec4c64aaa33a25dbc89819c88f7a9(
    *,
    availability_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db4d3586e20cf81b14b673c472149be1ee9b0e523e79832636a085113415cab1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__931a689775937e780752abb995f71f68f8f75c6d4e0f9dcf324508f09ab9edc8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ec575c526573cd35c07524d331d1dee052c818985fbfe7c0bc7b71cfe7b74e9(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88cde4b804c7f943331c96a5bab3437e996d5c98413dcd5184fb17d863798f11(
    *,
    availability_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df5571522cc408fc52ced536200bd4d9284fa1d3c3d96ac7800efff1a4f55ec3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44e0c23a9c8df8f814f802afa587e66677450da8f34476a7aaa6875a2ba24896(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c59304a6e35716543281c3d55f56f005da533e2e62ab60846c6ccb8e218bcbe2(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75bae76292495b2a34927984ff6cad08d449910872ca4b009c59d9c713ec8546(
    *,
    availability_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__927aa65754385a7f73155552a3278b4dcddc64587cb2c8e89fccd24c304cfdeb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61a8b2d612fce66cfc6edf1088ad7629d55fc74c57476e6b737fb65b389c530b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e389ed8013ded632655eb6282a410e888ce68584fd5f4e6d883e0643d4ec269d(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptionsExportToCsvOption],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d20d7f77745a7ad90dd0be5b2af6e5135a8e95c44559ab0759b12ccf845c49bc(
    *,
    availability_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7d977f1d13e813b4c60052272b28a51b5f8ca216dabd5abe03339edb57ea3b9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21d2c56d52dfac4627b0dcd61480589f813ec19af1f7b5b03c0bc696a53a29bc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cda5d1eb593761b48abafd0b210edade7a13098a45e2bc1d0fc3ecd5fb9befaf(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5880fee46cf38e18b194379a33783deaec50539cd042a2922eab34012b1fa62d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1b67e5332438de380c264b71ee077595d29ac84771c75bbdb2302eae94dda39(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__865716012ccc6c05e54af4d5e8482190298bfddda31ca4e4e6bdf27f402d340c(
    *,
    visibility_state: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b06e9dff2dcfb4e7e9579fc8d09cc3b29c3758928d26bf55cfc4f966136adbb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d05ab7cce74bb7d5336e1891d9ef6027b5fff45164ff26309f599776f84b691c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7420251d7b4fc1c15c042d1ad9059285e9de80f9297d861b4bc6c420ea62a0bf(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptionsSheetControlsOption],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9593e0f09ca9814c27d63041284abbea3fc01644376759c5ca30a1c96b415f4(
    *,
    availability_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa738a3b6bbe91e1cabbe5fbf4717551768f58d16e61c600c05baaa78c9aeaf5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__964aa776e20ee939af4f68671fb42b6e7b03939841ea15c2be26009c716581ab(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fbda9045615cf87eb77fb1eadf671878ab0e9e305d180e6ffbaa8135ce4ec4e(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9bb554f6142733af027db061301840e1e6906c242200bfb2c9e88304cccd31bd(
    *,
    availability_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__34571ed64558783c7728ebef1d41005bb458663526c78abf7c2499a104a826b1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a78fea244a19a4dc0c4f7a4e6c6f58605158759bad81768611e33095e386a58(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64560aa503be7e47592f0f1ffdbcdfb23a10fcad6116e30d008147cd5a5b5bef(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53eb968d1fbdb34d6ce927708b618d211b8ad0a03bceffb96c2b917adc5f7230(
    *,
    availability_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b730625910f7a6adf771dce74844aeee87be242191a4d3b97ec043d266820a69(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2663e4e5f7b178b3e47c249ce9e81ce60d2d5d7fb29c1250b76e12568f475edf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd56fd80ce3d13725957da36af2349d7c6ef627c85b6a018cb1ff26f09b2e463(
    value: typing.Optional[QuicksightDashboardDashboardPublishOptionsVisualMenuOption],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aec8bdbbf2b59ae90a367c7a6b1d3ab1f72cf9a574ea5c43a265675c6c6daced(
    *,
    date_time_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersDateTimeParameters, typing.Dict[builtins.str, typing.Any]]]]] = None,
    decimal_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersDecimalParameters, typing.Dict[builtins.str, typing.Any]]]]] = None,
    integer_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersIntegerParameters, typing.Dict[builtins.str, typing.Any]]]]] = None,
    string_parameters: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersStringParameters, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d16147682a6cf6731d24d77bf3c5940015540dfb236b1bd9a7a39ccdd57dcb5(
    *,
    name: builtins.str,
    values: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ccc9de85309af49d3677a61b42b4f0cd497d9b2a24abf91b2202b55e42de349(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4ab334f6a6fe8d8972959e1a3db76d06cefe65378e4dc1f08b5612383d5b660(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__97a152f7fa647ea1f32c26daf569d0f2864ca94184710f0f826d2db338587e53(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d44de1f9774159b50998247e568ac2660a9425b0dd6f8643b592eb41848d74b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8685e4fa6a609ab65145cbc862f8c7e579354e723fc8635d3bdd39f348df6bf9(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ff52b10be2f5e618754b1c262bbb5b10585ed8f17e39263104ba432e266ebb8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDateTimeParameters]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1de9d6e2eaccb87250e3d6c992442062cc18b25cab0a12a94e65b7ca57ea1c40(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a28e91b97f2a0d66aaf8e3b00a91e922c50ff41c96260e1be6fde35f6fc7027(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9fd419d6954442d1205cce02bb1ff8a418a5a2650ef35be0d22874737cf95c64(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05afedd3afd5a5a877639be336dff78d74033f276c03aed59a76ea59fb30e6e5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersDateTimeParameters]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__511376e12ae79bf7415ced354158c2029c41424192de6b9236c3edcac2f9e1f2(
    *,
    name: builtins.str,
    values: typing.Sequence[jsii.Number],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__483cdcca1ee2b79898adb3abf491a3032bb22811587e526d9c1d7a46b44cfcd0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__807b5076db1dd36fc2d95ff40553bac451c337022c8e33861705ac6646cb6324(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15f399ebc18145d6d78eb75c59b47b39c096eeebeac0fad3a01b78dafba20802(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f9bb11f69ffa9eba49c32a01316b3e7d26aeba3a60b408c506eb89d170e8991(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__306c95c477ea8bba1933d91d416f98a312a0d09a0bf73653e63a27549c68d19a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d072076bdd7d11576e153b8731a016579682efb1f323722558b553f1f797586(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersDecimalParameters]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b1b5c2de908ace25386c629b5d2c188009f4763226a7c9bad9c1fc9dbc2d830(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22f31db49b76a147f651c1ba872f626652e786051f66a1faebd98717068b1334(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__903384e878d8870146e89f43fefd8778cee304f23a3d535c563cddc8d2617a2d(
    value: typing.List[jsii.Number],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f41dada98bc652fc45e0a24b3ec13876becb4bceb06c0c5690b2e38d3197ef6b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersDecimalParameters]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04659655ca9795713f4894ffe653b20623fd4f806be798cbc9649d99714dc901(
    *,
    name: builtins.str,
    values: typing.Sequence[jsii.Number],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba615e3a6410578bd05b0544bd0548ddac3fee38b71e46beb9197361286eac7b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d775f607ee3dc1bdac50f8f083f20e57f40e59fc1d481c0dc10f45975fb5fb83(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__493ab0ee743f4e2a805e93b32ac25469e733e35ccc3c2314af8a165f33d5a4d0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31353a24d5dfbba5443f9e8a6d36f6b0a7fc236ec7db9b0e094490773faf4c3b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3407ac20274a7e730695b7058256c7bc2058f6542e3bf8a0473872a0189fa687(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99690d4965bbef065524ebf3ca743e33c3183eee841bb29b32520244a0214731(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersIntegerParameters]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1d195dca88c3513d37ebbec667049cee6f5795e2f14c82c0e8e78458ef042a8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3903ff83df345ad45b5dd5d92756739c9ef8d7774230f9357fa18d007de88192(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78d46e78407e82fa6ee4df973a8dc4cbdeb20221384a5a35bf72e2f1446fa333(
    value: typing.List[jsii.Number],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eedf44bcce2a5a9b1396ac24f23cde3fb9cc4cda54718d01f6dfa0c2dfb53a45(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersIntegerParameters]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25b30d2d4d91b410c4b88d7a11f384c1325217bd0f140aff44d7f0fbf1a29bd2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07bfa3b1d11da624f1abbd455ad4af7998c41c98fd9e149cb016f71ed00c9f55(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersDateTimeParameters, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0979315c3fb984c5f53680d36c31b4fe439a1f62a1792aea0c82ff0e6966f31(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersDecimalParameters, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a82d22428c1d8d11d81dfdb36ba12236af3f5f097d8cbecb544ce9e899b3ed7(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersIntegerParameters, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e3b3545e2058c563a86625bfd467a868a7bc823f884effceaf5629d43066ecd(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardParametersStringParameters, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84f7335eaeb2bfc1aacf99a8cc70a1aae317e53b3298d4038ab809118bd0b753(
    value: typing.Optional[QuicksightDashboardParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05c5a8bbd734dfcfe73737b186b30a61e50c05ecb34e38273ecb2d7185e33d24(
    *,
    name: builtins.str,
    values: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a46a4a413f3a125b5b52069bee44c6b95d5b2691714138b750015b13d234e820(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__457be7d66cf1da3af79e909b0fc98fa92e9310b3181625336d898256a7eff9b9(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02265a7c1fe66c3de5a854a3c6c8a4815ee01865b4e3f8d01fba3ba5de697ece(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efb41738de14d49907ca2e384a3b63d895755fc8a30fc235a93bf04026d3ce48(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77ed8d2c34f7abffd6a935022d96b1c2a122cea3925381279d6641b8b5935541(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fed20efda14d27da2148079d6115bd27c9c6635534117922cd36142b84432281(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardParametersStringParameters]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e1bdf992d1403acf184ba45207df71a5455e6daccbfa820582b4f42fc9e0ac9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a9015bde8b932652ec0683086aef9c58ba782c52fc150786fe7937b0682afb8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3bc0ca941fdf681bfff86846cd2784162a0ef805fa87df75e9dd9017e51472c6(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d814af03300d5514ed61c9b7ecf8cb0b13d2757eb26ee9828ea2fbaca1c1f3f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardParametersStringParameters]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00f8a1ab33832d7e128809b03442f91d1448403495fe2770daab8126800a6978(
    *,
    actions: typing.Sequence[builtins.str],
    principal: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__411cb4f10cc001e841b207923c8f87e0fb0a607e956cdc5288f54621ba28c602(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4296fd074b25b40621cba4a16ce3d3f523738bcaaad8920393d833e5cb7c22cf(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b360e6d5fdbf4ae5c113284d642d82935f2ca1a32b05c49eb1289a53e30ee82(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98d6e3bedeaf5694deabf81f91fa297a13dd8815d45ec7b685a1a00da0b7911a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__325a1fdc3d85646fc640580a65069aa4244722fef72b8c4a5d78ea13dbf693b4(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f5de7d385a8d6666424e3488927e55f995486baaba87232cc95edb4ae4ecff3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardPermissions]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f8a6b6c3e7e3432196dead53dd79c707f2b168d63b111c737d2a89c5f118e5a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__888a0ae6d099525940395642219ca84f191d6ddd71d947d5a0288bafc24f2e0a(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__995585710e51e6d3dc5cd8bb30ebaae37e1d6f1386151497f10d8d91a0ad20bc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ea993ff1e98e81013c3e4372dff8ddbe9c7f063a0a3169b96b776c25b8329b7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardPermissions]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ccd1d22a24f93f29550df5ef93920a83e9857882cb5d940e7601cd44d147b79(
    *,
    source_template: typing.Optional[typing.Union[QuicksightDashboardSourceEntitySourceTemplate, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd7d8480a32acca5d16a35a3637ab9a95c218ca24d3695e8dad1d0b59e9e112c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab196c5d17f7da9d6ad6735be398802900c6eb5207b33dc4075ace460390feba(
    value: typing.Optional[QuicksightDashboardSourceEntity],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__011ecdb6b76f014fff4c64443c32deb620ba62711387a0794ba9443823673e98(
    *,
    arn: builtins.str,
    data_set_references: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardSourceEntitySourceTemplateDataSetReferences, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4e5056b9f81980f87838e6674326d0b1a35ab648e940f69360705747648a883(
    *,
    data_set_arn: builtins.str,
    data_set_placeholder: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce729d719f83c423752d639a60c2e9aabe6fb31a5012ebac5151f935d2ce7c40(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9b7e09b4daf51b22e825fb70b84682bed11a83ef7f30d7b079072a82653ff75(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0734ec2f19afaf907fc57b1f4ba9c0ac6cbe842c789b56c5ac50c4a1f1aabcda(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24216309b1d9d4777232966f99922fd48086c04621d097c6bfdf247bf9ffd7d0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bd6bc0b670e584c85117776107183ac65cc03837838a934b38d77212f593d61(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81f612e091e743eb5a98d7015b5757bbc906f06bfba107c105f3f7897bc9da31(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[QuicksightDashboardSourceEntitySourceTemplateDataSetReferences]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c8c7f02050341cca76952394c4ac7c8215598d48ce72890926af86fbcbf9c56(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee2a5a7b8ede484643f4d7307eb5354361fcb38cfe01b30eda6aebf4ab66ad28(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b15a9951b0fbea22b1ea123f27eec007ed3647c8362e68a0278da722d3b794a0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a111ad4d4e505b81926b7dd228ae9f2b3599570b3769213143e649ba214b2cbf(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardSourceEntitySourceTemplateDataSetReferences]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29b33c4249245f791a0557f544b3d5e320faf5cd112752bb9b1040d54221c3c2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ad17e0e589ebbb6bdbe16d359ed227abf9361aeef7c8980c60d1c5ecd705470(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[QuicksightDashboardSourceEntitySourceTemplateDataSetReferences, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__724df8279981c1aca78ea4552bb79635075ac779d1317c59de8160cfaca7184a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dbce51ca6805e97838b366788f17d5bf04248e4c245210d9ef5e011da5bed8c8(
    value: typing.Optional[QuicksightDashboardSourceEntitySourceTemplate],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67a56ccba7abdf4b4d5dba0d5a43fe7860a43e1671639230a5a920c1accbf6dc(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa7140628a755ecb894af90f5cbc9b80dd2e8020865850c9ab9fc53ffc3a3877(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a75ab7f014c1cb9b1695ba3870638f4d5915e53b15c703b5b38c1c95b812b1c4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0b5ac2a68b32a33b1152995134fae0f61b2ddd1e5d6bcf822aad6048683da26(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e894f4de9d813f259eb1c60b1db4141719f5468c534fbec02a45a742997e092(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3da44d0b6d36f4e6968334fbf3097dc5c71dbfe3d46ea54ad1cc1f4a76e767a8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, QuicksightDashboardTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
