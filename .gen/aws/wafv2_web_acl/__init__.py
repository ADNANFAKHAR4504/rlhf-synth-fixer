r'''
# `aws_wafv2_web_acl`

Refer to the Terraform Registry for docs: [`aws_wafv2_web_acl`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl).
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


class Wafv2WebAcl(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAcl",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl aws_wafv2_web_acl}.'''

    def __init__(
        self,
        scope_: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        default_action: typing.Union["Wafv2WebAclDefaultAction", typing.Dict[builtins.str, typing.Any]],
        scope: builtins.str,
        visibility_config: typing.Union["Wafv2WebAclVisibilityConfig", typing.Dict[builtins.str, typing.Any]],
        association_config: typing.Optional[typing.Union["Wafv2WebAclAssociationConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        captcha_config: typing.Optional[typing.Union["Wafv2WebAclCaptchaConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        challenge_config: typing.Optional[typing.Union["Wafv2WebAclChallengeConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        custom_response_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclCustomResponseBody", typing.Dict[builtins.str, typing.Any]]]]] = None,
        data_protection_config: typing.Optional[typing.Union["Wafv2WebAclDataProtectionConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        description: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        rule: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRule", typing.Dict[builtins.str, typing.Any]]]]] = None,
        rule_json: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        token_domains: typing.Optional[typing.Sequence[builtins.str]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl aws_wafv2_web_acl} Resource.

        :param scope_: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param default_action: default_action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_action Wafv2WebAcl#default_action}
        :param scope: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#scope Wafv2WebAcl#scope}.
        :param visibility_config: visibility_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#visibility_config Wafv2WebAcl#visibility_config}
        :param association_config: association_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#association_config Wafv2WebAcl#association_config}
        :param captcha_config: captcha_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha_config Wafv2WebAcl#captcha_config}
        :param challenge_config: challenge_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge_config Wafv2WebAcl#challenge_config}
        :param custom_response_body: custom_response_body block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body Wafv2WebAcl#custom_response_body}
        :param data_protection_config: data_protection_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection_config Wafv2WebAcl#data_protection_config}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#description Wafv2WebAcl#description}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#id Wafv2WebAcl#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name_prefix Wafv2WebAcl#name_prefix}.
        :param rule: rule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule Wafv2WebAcl#rule}
        :param rule_json: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_json Wafv2WebAcl#rule_json}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags Wafv2WebAcl#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags_all Wafv2WebAcl#tags_all}.
        :param token_domains: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#token_domains Wafv2WebAcl#token_domains}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__74bcca1b9da33111e483c9125b8e5850cfc5dbd08a99d4e97e42cb2ea6a887db)
            check_type(argname="argument scope_", value=scope_, expected_type=type_hints["scope_"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = Wafv2WebAclConfig(
            default_action=default_action,
            scope=scope,
            visibility_config=visibility_config,
            association_config=association_config,
            captcha_config=captcha_config,
            challenge_config=challenge_config,
            custom_response_body=custom_response_body,
            data_protection_config=data_protection_config,
            description=description,
            id=id,
            name=name,
            name_prefix=name_prefix,
            rule=rule,
            rule_json=rule_json,
            tags=tags,
            tags_all=tags_all,
            token_domains=token_domains,
            connection=connection,
            count=count,
            depends_on=depends_on,
            for_each=for_each,
            lifecycle=lifecycle,
            provider=provider,
            provisioners=provisioners,
        )

        jsii.create(self.__class__, self, [scope_, id_, config])

    @jsii.member(jsii_name="generateConfigForImport")
    @builtins.classmethod
    def generate_config_for_import(
        cls,
        scope: _constructs_77d1e7e8.Construct,
        import_to_id: builtins.str,
        import_from_id: builtins.str,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    ) -> _cdktf_9a9027ec.ImportableResource:
        '''Generates CDKTF code for importing a Wafv2WebAcl resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Wafv2WebAcl to import.
        :param import_from_id: The id of the existing Wafv2WebAcl that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Wafv2WebAcl to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0211a81058973af145e2ac701c42e428d21b087ad884b0fc66ee7aa22eea5032)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAssociationConfig")
    def put_association_config(
        self,
        *,
        request_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclAssociationConfigRequestBody", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param request_body: request_body block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#request_body Wafv2WebAcl#request_body}
        '''
        value = Wafv2WebAclAssociationConfig(request_body=request_body)

        return typing.cast(None, jsii.invoke(self, "putAssociationConfig", [value]))

    @jsii.member(jsii_name="putCaptchaConfig")
    def put_captcha_config(
        self,
        *,
        immunity_time_property: typing.Optional[typing.Union["Wafv2WebAclCaptchaConfigImmunityTimeProperty", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param immunity_time_property: immunity_time_property block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        value = Wafv2WebAclCaptchaConfig(immunity_time_property=immunity_time_property)

        return typing.cast(None, jsii.invoke(self, "putCaptchaConfig", [value]))

    @jsii.member(jsii_name="putChallengeConfig")
    def put_challenge_config(
        self,
        *,
        immunity_time_property: typing.Optional[typing.Union["Wafv2WebAclChallengeConfigImmunityTimeProperty", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param immunity_time_property: immunity_time_property block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        value = Wafv2WebAclChallengeConfig(
            immunity_time_property=immunity_time_property
        )

        return typing.cast(None, jsii.invoke(self, "putChallengeConfig", [value]))

    @jsii.member(jsii_name="putCustomResponseBody")
    def put_custom_response_body(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclCustomResponseBody", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dad8390e8b836afab749cfff58b94cf165c1f6eebb8232597db6a78038f78307)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCustomResponseBody", [value]))

    @jsii.member(jsii_name="putDataProtectionConfig")
    def put_data_protection_config(
        self,
        *,
        data_protection: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclDataProtectionConfigDataProtection", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param data_protection: data_protection block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection Wafv2WebAcl#data_protection}
        '''
        value = Wafv2WebAclDataProtectionConfig(data_protection=data_protection)

        return typing.cast(None, jsii.invoke(self, "putDataProtectionConfig", [value]))

    @jsii.member(jsii_name="putDefaultAction")
    def put_default_action(
        self,
        *,
        allow: typing.Optional[typing.Union["Wafv2WebAclDefaultActionAllow", typing.Dict[builtins.str, typing.Any]]] = None,
        block: typing.Optional[typing.Union["Wafv2WebAclDefaultActionBlock", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param allow: allow block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#allow Wafv2WebAcl#allow}
        :param block: block block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#block Wafv2WebAcl#block}
        '''
        value = Wafv2WebAclDefaultAction(allow=allow, block=block)

        return typing.cast(None, jsii.invoke(self, "putDefaultAction", [value]))

    @jsii.member(jsii_name="putRule")
    def put_rule(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRule", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5f198a921980f436082f3caba5f9b9ea9dd6ccc8bb17aa15f0fdaaa4c67c695d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRule", [value]))

    @jsii.member(jsii_name="putVisibilityConfig")
    def put_visibility_config(
        self,
        *,
        cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        metric_name: builtins.str,
        sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param cloudwatch_metrics_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cloudwatch_metrics_enabled Wafv2WebAcl#cloudwatch_metrics_enabled}.
        :param metric_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#metric_name Wafv2WebAcl#metric_name}.
        :param sampled_requests_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#sampled_requests_enabled Wafv2WebAcl#sampled_requests_enabled}.
        '''
        value = Wafv2WebAclVisibilityConfig(
            cloudwatch_metrics_enabled=cloudwatch_metrics_enabled,
            metric_name=metric_name,
            sampled_requests_enabled=sampled_requests_enabled,
        )

        return typing.cast(None, jsii.invoke(self, "putVisibilityConfig", [value]))

    @jsii.member(jsii_name="resetAssociationConfig")
    def reset_association_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAssociationConfig", []))

    @jsii.member(jsii_name="resetCaptchaConfig")
    def reset_captcha_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCaptchaConfig", []))

    @jsii.member(jsii_name="resetChallengeConfig")
    def reset_challenge_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetChallengeConfig", []))

    @jsii.member(jsii_name="resetCustomResponseBody")
    def reset_custom_response_body(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomResponseBody", []))

    @jsii.member(jsii_name="resetDataProtectionConfig")
    def reset_data_protection_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataProtectionConfig", []))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetNamePrefix")
    def reset_name_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNamePrefix", []))

    @jsii.member(jsii_name="resetRule")
    def reset_rule(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRule", []))

    @jsii.member(jsii_name="resetRuleJson")
    def reset_rule_json(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRuleJson", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTokenDomains")
    def reset_token_domains(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTokenDomains", []))

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
    @jsii.member(jsii_name="applicationIntegrationUrl")
    def application_integration_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "applicationIntegrationUrl"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="associationConfig")
    def association_config(self) -> "Wafv2WebAclAssociationConfigOutputReference":
        return typing.cast("Wafv2WebAclAssociationConfigOutputReference", jsii.get(self, "associationConfig"))

    @builtins.property
    @jsii.member(jsii_name="capacity")
    def capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "capacity"))

    @builtins.property
    @jsii.member(jsii_name="captchaConfig")
    def captcha_config(self) -> "Wafv2WebAclCaptchaConfigOutputReference":
        return typing.cast("Wafv2WebAclCaptchaConfigOutputReference", jsii.get(self, "captchaConfig"))

    @builtins.property
    @jsii.member(jsii_name="challengeConfig")
    def challenge_config(self) -> "Wafv2WebAclChallengeConfigOutputReference":
        return typing.cast("Wafv2WebAclChallengeConfigOutputReference", jsii.get(self, "challengeConfig"))

    @builtins.property
    @jsii.member(jsii_name="customResponseBody")
    def custom_response_body(self) -> "Wafv2WebAclCustomResponseBodyList":
        return typing.cast("Wafv2WebAclCustomResponseBodyList", jsii.get(self, "customResponseBody"))

    @builtins.property
    @jsii.member(jsii_name="dataProtectionConfig")
    def data_protection_config(
        self,
    ) -> "Wafv2WebAclDataProtectionConfigOutputReference":
        return typing.cast("Wafv2WebAclDataProtectionConfigOutputReference", jsii.get(self, "dataProtectionConfig"))

    @builtins.property
    @jsii.member(jsii_name="defaultAction")
    def default_action(self) -> "Wafv2WebAclDefaultActionOutputReference":
        return typing.cast("Wafv2WebAclDefaultActionOutputReference", jsii.get(self, "defaultAction"))

    @builtins.property
    @jsii.member(jsii_name="lockToken")
    def lock_token(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lockToken"))

    @builtins.property
    @jsii.member(jsii_name="rule")
    def rule(self) -> "Wafv2WebAclRuleList":
        return typing.cast("Wafv2WebAclRuleList", jsii.get(self, "rule"))

    @builtins.property
    @jsii.member(jsii_name="visibilityConfig")
    def visibility_config(self) -> "Wafv2WebAclVisibilityConfigOutputReference":
        return typing.cast("Wafv2WebAclVisibilityConfigOutputReference", jsii.get(self, "visibilityConfig"))

    @builtins.property
    @jsii.member(jsii_name="associationConfigInput")
    def association_config_input(
        self,
    ) -> typing.Optional["Wafv2WebAclAssociationConfig"]:
        return typing.cast(typing.Optional["Wafv2WebAclAssociationConfig"], jsii.get(self, "associationConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="captchaConfigInput")
    def captcha_config_input(self) -> typing.Optional["Wafv2WebAclCaptchaConfig"]:
        return typing.cast(typing.Optional["Wafv2WebAclCaptchaConfig"], jsii.get(self, "captchaConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="challengeConfigInput")
    def challenge_config_input(self) -> typing.Optional["Wafv2WebAclChallengeConfig"]:
        return typing.cast(typing.Optional["Wafv2WebAclChallengeConfig"], jsii.get(self, "challengeConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="customResponseBodyInput")
    def custom_response_body_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclCustomResponseBody"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclCustomResponseBody"]]], jsii.get(self, "customResponseBodyInput"))

    @builtins.property
    @jsii.member(jsii_name="dataProtectionConfigInput")
    def data_protection_config_input(
        self,
    ) -> typing.Optional["Wafv2WebAclDataProtectionConfig"]:
        return typing.cast(typing.Optional["Wafv2WebAclDataProtectionConfig"], jsii.get(self, "dataProtectionConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultActionInput")
    def default_action_input(self) -> typing.Optional["Wafv2WebAclDefaultAction"]:
        return typing.cast(typing.Optional["Wafv2WebAclDefaultAction"], jsii.get(self, "defaultActionInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="namePrefixInput")
    def name_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namePrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleInput")
    def rule_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRule"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRule"]]], jsii.get(self, "ruleInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleJsonInput")
    def rule_json_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ruleJsonInput"))

    @builtins.property
    @jsii.member(jsii_name="scopeInput")
    def scope_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "scopeInput"))

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
    @jsii.member(jsii_name="tokenDomainsInput")
    def token_domains_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "tokenDomainsInput"))

    @builtins.property
    @jsii.member(jsii_name="visibilityConfigInput")
    def visibility_config_input(self) -> typing.Optional["Wafv2WebAclVisibilityConfig"]:
        return typing.cast(typing.Optional["Wafv2WebAclVisibilityConfig"], jsii.get(self, "visibilityConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f70c3dc5d40b4dce446db3e694a082d9a4acf5d11158a67ba6d2c6fbdabd9138)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__adc183435eb9e2c67b505eeb3a3e991972c38f0b8e2b30ae9e5111ea11e28d0a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b20286eceb4f643b1482ee966f1f9f63bd6a6dafd3e0b2c6bfb84e2dcf1c559)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namePrefix")
    def name_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namePrefix"))

    @name_prefix.setter
    def name_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b86c4c934618cf61ac53353bc24c8b8166d3710f185ba427e9877e74ee3e6d57)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namePrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ruleJson")
    def rule_json(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ruleJson"))

    @rule_json.setter
    def rule_json(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b410044cfc2ce90f207346282aad7e2b7f05a084d0b8931ddc76c2712a6d2c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ruleJson", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="scope")
    def scope(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "scope"))

    @scope.setter
    def scope(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08c070cd01e476b10988078e3475aba0ef4baa5b1e317e52843385fb2a070597)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "scope", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec7673b42c9fcda57d13ea18f816e4d0bb5be7159658d0c4996b691a81f935b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5260df2f1243a794bd5722fd3d128bd494003930942f329ee6774d5f9ec2f948)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tokenDomains")
    def token_domains(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "tokenDomains"))

    @token_domains.setter
    def token_domains(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90d9489758a4924e355d3bcb6bf0d905aa93253727421d6f1941bdc040ff2e2f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tokenDomains", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfig",
    jsii_struct_bases=[],
    name_mapping={"request_body": "requestBody"},
)
class Wafv2WebAclAssociationConfig:
    def __init__(
        self,
        *,
        request_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclAssociationConfigRequestBody", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param request_body: request_body block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#request_body Wafv2WebAcl#request_body}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ca204ce826c792015954a5b9ec8f5e6a9213de6304d3c4a5ca93c9f2b0b92c5)
            check_type(argname="argument request_body", value=request_body, expected_type=type_hints["request_body"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if request_body is not None:
            self._values["request_body"] = request_body

    @builtins.property
    def request_body(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclAssociationConfigRequestBody"]]]:
        '''request_body block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#request_body Wafv2WebAcl#request_body}
        '''
        result = self._values.get("request_body")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclAssociationConfigRequestBody"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclAssociationConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclAssociationConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3ac10b5be8250055913a30f99291055257cd51ef20666b9018ea109656a04cb4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRequestBody")
    def put_request_body(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclAssociationConfigRequestBody", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d07a3af1de9b766767ad86a10d22ee07722d4cf4ae1c802055c5b4424617012)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRequestBody", [value]))

    @jsii.member(jsii_name="resetRequestBody")
    def reset_request_body(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRequestBody", []))

    @builtins.property
    @jsii.member(jsii_name="requestBody")
    def request_body(self) -> "Wafv2WebAclAssociationConfigRequestBodyList":
        return typing.cast("Wafv2WebAclAssociationConfigRequestBodyList", jsii.get(self, "requestBody"))

    @builtins.property
    @jsii.member(jsii_name="requestBodyInput")
    def request_body_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclAssociationConfigRequestBody"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclAssociationConfigRequestBody"]]], jsii.get(self, "requestBodyInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclAssociationConfig]:
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclAssociationConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__58191a0d3d1ea545dd89452a41e201261ed949c5770e5972175113aac93fa812)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBody",
    jsii_struct_bases=[],
    name_mapping={
        "api_gateway": "apiGateway",
        "app_runner_service": "appRunnerService",
        "cloudfront": "cloudfront",
        "cognito_user_pool": "cognitoUserPool",
        "verified_access_instance": "verifiedAccessInstance",
    },
)
class Wafv2WebAclAssociationConfigRequestBody:
    def __init__(
        self,
        *,
        api_gateway: typing.Optional[typing.Union["Wafv2WebAclAssociationConfigRequestBodyApiGateway", typing.Dict[builtins.str, typing.Any]]] = None,
        app_runner_service: typing.Optional[typing.Union["Wafv2WebAclAssociationConfigRequestBodyAppRunnerService", typing.Dict[builtins.str, typing.Any]]] = None,
        cloudfront: typing.Optional[typing.Union["Wafv2WebAclAssociationConfigRequestBodyCloudfront", typing.Dict[builtins.str, typing.Any]]] = None,
        cognito_user_pool: typing.Optional[typing.Union["Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool", typing.Dict[builtins.str, typing.Any]]] = None,
        verified_access_instance: typing.Optional[typing.Union["Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param api_gateway: api_gateway block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#api_gateway Wafv2WebAcl#api_gateway}
        :param app_runner_service: app_runner_service block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#app_runner_service Wafv2WebAcl#app_runner_service}
        :param cloudfront: cloudfront block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cloudfront Wafv2WebAcl#cloudfront}
        :param cognito_user_pool: cognito_user_pool block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cognito_user_pool Wafv2WebAcl#cognito_user_pool}
        :param verified_access_instance: verified_access_instance block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#verified_access_instance Wafv2WebAcl#verified_access_instance}
        '''
        if isinstance(api_gateway, dict):
            api_gateway = Wafv2WebAclAssociationConfigRequestBodyApiGateway(**api_gateway)
        if isinstance(app_runner_service, dict):
            app_runner_service = Wafv2WebAclAssociationConfigRequestBodyAppRunnerService(**app_runner_service)
        if isinstance(cloudfront, dict):
            cloudfront = Wafv2WebAclAssociationConfigRequestBodyCloudfront(**cloudfront)
        if isinstance(cognito_user_pool, dict):
            cognito_user_pool = Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool(**cognito_user_pool)
        if isinstance(verified_access_instance, dict):
            verified_access_instance = Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance(**verified_access_instance)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7c1df715d0ce0cda73f46954c5266e04c5fbae5ed4d93d55bc2ca6e7a5d05388)
            check_type(argname="argument api_gateway", value=api_gateway, expected_type=type_hints["api_gateway"])
            check_type(argname="argument app_runner_service", value=app_runner_service, expected_type=type_hints["app_runner_service"])
            check_type(argname="argument cloudfront", value=cloudfront, expected_type=type_hints["cloudfront"])
            check_type(argname="argument cognito_user_pool", value=cognito_user_pool, expected_type=type_hints["cognito_user_pool"])
            check_type(argname="argument verified_access_instance", value=verified_access_instance, expected_type=type_hints["verified_access_instance"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if api_gateway is not None:
            self._values["api_gateway"] = api_gateway
        if app_runner_service is not None:
            self._values["app_runner_service"] = app_runner_service
        if cloudfront is not None:
            self._values["cloudfront"] = cloudfront
        if cognito_user_pool is not None:
            self._values["cognito_user_pool"] = cognito_user_pool
        if verified_access_instance is not None:
            self._values["verified_access_instance"] = verified_access_instance

    @builtins.property
    def api_gateway(
        self,
    ) -> typing.Optional["Wafv2WebAclAssociationConfigRequestBodyApiGateway"]:
        '''api_gateway block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#api_gateway Wafv2WebAcl#api_gateway}
        '''
        result = self._values.get("api_gateway")
        return typing.cast(typing.Optional["Wafv2WebAclAssociationConfigRequestBodyApiGateway"], result)

    @builtins.property
    def app_runner_service(
        self,
    ) -> typing.Optional["Wafv2WebAclAssociationConfigRequestBodyAppRunnerService"]:
        '''app_runner_service block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#app_runner_service Wafv2WebAcl#app_runner_service}
        '''
        result = self._values.get("app_runner_service")
        return typing.cast(typing.Optional["Wafv2WebAclAssociationConfigRequestBodyAppRunnerService"], result)

    @builtins.property
    def cloudfront(
        self,
    ) -> typing.Optional["Wafv2WebAclAssociationConfigRequestBodyCloudfront"]:
        '''cloudfront block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cloudfront Wafv2WebAcl#cloudfront}
        '''
        result = self._values.get("cloudfront")
        return typing.cast(typing.Optional["Wafv2WebAclAssociationConfigRequestBodyCloudfront"], result)

    @builtins.property
    def cognito_user_pool(
        self,
    ) -> typing.Optional["Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool"]:
        '''cognito_user_pool block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cognito_user_pool Wafv2WebAcl#cognito_user_pool}
        '''
        result = self._values.get("cognito_user_pool")
        return typing.cast(typing.Optional["Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool"], result)

    @builtins.property
    def verified_access_instance(
        self,
    ) -> typing.Optional["Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance"]:
        '''verified_access_instance block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#verified_access_instance Wafv2WebAcl#verified_access_instance}
        '''
        result = self._values.get("verified_access_instance")
        return typing.cast(typing.Optional["Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclAssociationConfigRequestBody(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyApiGateway",
    jsii_struct_bases=[],
    name_mapping={"default_size_inspection_limit": "defaultSizeInspectionLimit"},
)
class Wafv2WebAclAssociationConfigRequestBodyApiGateway:
    def __init__(self, *, default_size_inspection_limit: builtins.str) -> None:
        '''
        :param default_size_inspection_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1825ae4a3497149a6af4f830e88394f28f542e6a6306f251f2f388f64e4e7fa1)
            check_type(argname="argument default_size_inspection_limit", value=default_size_inspection_limit, expected_type=type_hints["default_size_inspection_limit"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_size_inspection_limit": default_size_inspection_limit,
        }

    @builtins.property
    def default_size_inspection_limit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.'''
        result = self._values.get("default_size_inspection_limit")
        assert result is not None, "Required property 'default_size_inspection_limit' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclAssociationConfigRequestBodyApiGateway(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclAssociationConfigRequestBodyApiGatewayOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyApiGatewayOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__53107c898f62613184e230b0068f8c09d40bfed6d43b514b2980076e3042d5ff)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="defaultSizeInspectionLimitInput")
    def default_size_inspection_limit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultSizeInspectionLimitInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultSizeInspectionLimit")
    def default_size_inspection_limit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultSizeInspectionLimit"))

    @default_size_inspection_limit.setter
    def default_size_inspection_limit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__badf3c66c21df4e9dfc35ea205466de2d62a248d13885fb7b7e2c8509a5355ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultSizeInspectionLimit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclAssociationConfigRequestBodyApiGateway]:
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfigRequestBodyApiGateway], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclAssociationConfigRequestBodyApiGateway],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c36e75475720cf33e0b9d02440de157cc36699e3f2576856c59d55c8a436cf0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerService",
    jsii_struct_bases=[],
    name_mapping={"default_size_inspection_limit": "defaultSizeInspectionLimit"},
)
class Wafv2WebAclAssociationConfigRequestBodyAppRunnerService:
    def __init__(self, *, default_size_inspection_limit: builtins.str) -> None:
        '''
        :param default_size_inspection_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__89db2b02c6375d8ac7cc724cac493e545cc8724b000e118a80bc24e7314b92f3)
            check_type(argname="argument default_size_inspection_limit", value=default_size_inspection_limit, expected_type=type_hints["default_size_inspection_limit"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_size_inspection_limit": default_size_inspection_limit,
        }

    @builtins.property
    def default_size_inspection_limit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.'''
        result = self._values.get("default_size_inspection_limit")
        assert result is not None, "Required property 'default_size_inspection_limit' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclAssociationConfigRequestBodyAppRunnerService(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclAssociationConfigRequestBodyAppRunnerServiceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerServiceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1973ebb04dbbc484c45881959044f3b23e80bae40e0de29de102ea4c33673fe0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="defaultSizeInspectionLimitInput")
    def default_size_inspection_limit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultSizeInspectionLimitInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultSizeInspectionLimit")
    def default_size_inspection_limit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultSizeInspectionLimit"))

    @default_size_inspection_limit.setter
    def default_size_inspection_limit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__482b9527f8f0cd7a1d5ca7823b606fe438465c95122ed20b5d509680552c4762)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultSizeInspectionLimit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclAssociationConfigRequestBodyAppRunnerService]:
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfigRequestBodyAppRunnerService], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclAssociationConfigRequestBodyAppRunnerService],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3f2b53c3c82ab7ec2d1b1dd50ac68b5520ee663d2f1b35f350b63829cb229430)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyCloudfront",
    jsii_struct_bases=[],
    name_mapping={"default_size_inspection_limit": "defaultSizeInspectionLimit"},
)
class Wafv2WebAclAssociationConfigRequestBodyCloudfront:
    def __init__(self, *, default_size_inspection_limit: builtins.str) -> None:
        '''
        :param default_size_inspection_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0070071be4c69b8d0a7f4e36feb6e83f62c26f48405bdc29d0da542847f8d295)
            check_type(argname="argument default_size_inspection_limit", value=default_size_inspection_limit, expected_type=type_hints["default_size_inspection_limit"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_size_inspection_limit": default_size_inspection_limit,
        }

    @builtins.property
    def default_size_inspection_limit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.'''
        result = self._values.get("default_size_inspection_limit")
        assert result is not None, "Required property 'default_size_inspection_limit' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclAssociationConfigRequestBodyCloudfront(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclAssociationConfigRequestBodyCloudfrontOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyCloudfrontOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d1ca9523489be03fc888b31f4d307d547bd818ccd45aa0eb84914354ba7becec)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="defaultSizeInspectionLimitInput")
    def default_size_inspection_limit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultSizeInspectionLimitInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultSizeInspectionLimit")
    def default_size_inspection_limit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultSizeInspectionLimit"))

    @default_size_inspection_limit.setter
    def default_size_inspection_limit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d02c4c3e5478fc07d376e432e3064a93ef6d7a8cf9295d6e4a64b3466d5aef1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultSizeInspectionLimit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCloudfront]:
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCloudfront], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCloudfront],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64001839cbd428a98ada2b5d72e89ab28280fdb3fef8bf2964cdd65d0b869289)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool",
    jsii_struct_bases=[],
    name_mapping={"default_size_inspection_limit": "defaultSizeInspectionLimit"},
)
class Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool:
    def __init__(self, *, default_size_inspection_limit: builtins.str) -> None:
        '''
        :param default_size_inspection_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61690dee49e48c863a8bfc7ba45f0f94ba3bd1f5946cf970a818cdfa2a033866)
            check_type(argname="argument default_size_inspection_limit", value=default_size_inspection_limit, expected_type=type_hints["default_size_inspection_limit"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_size_inspection_limit": default_size_inspection_limit,
        }

    @builtins.property
    def default_size_inspection_limit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.'''
        result = self._values.get("default_size_inspection_limit")
        assert result is not None, "Required property 'default_size_inspection_limit' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclAssociationConfigRequestBodyCognitoUserPoolOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPoolOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aae0689d2008742398384521262e00cef40fda264e1f02385526733e3b207603)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="defaultSizeInspectionLimitInput")
    def default_size_inspection_limit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultSizeInspectionLimitInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultSizeInspectionLimit")
    def default_size_inspection_limit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultSizeInspectionLimit"))

    @default_size_inspection_limit.setter
    def default_size_inspection_limit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e8f15848273a7106597c0d1fec0c4b3b2a667761edfcb9965e339fb3f9d9506)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultSizeInspectionLimit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool]:
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b16f9e52cdd29b7bc9589a784e2173ead33f0f5ba87083fe00be5ceadb218805)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclAssociationConfigRequestBodyList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f2ba114fe38fc40d03b5e580730fbac49dc1226b294b42c71aa1eb77eb85f239)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2WebAclAssociationConfigRequestBodyOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3182a144b46fd155bbe9f574be114a358e7b7415fa8ff623b17b9803af68e98)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclAssociationConfigRequestBodyOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14dc988228a1879cd8f0d9b53bf978e852ebe9d8e11893021f37f2038e43d345)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5eb2fcc994c89e72d330930fe3c901a82496f01e8eff142eb000878035831b55)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d86fb803e098668a33cdda8b403ae1b15d43a5618667a3da3adc24081d87445b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclAssociationConfigRequestBody]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclAssociationConfigRequestBody]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclAssociationConfigRequestBody]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__29e0422c4e75bbe1ed55f404d42febf2c39245fa6033a97152a4a5c14289455e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclAssociationConfigRequestBodyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__31ad93cb562add915352328ce2ec831f7033451767d450590a1a16bce1be017c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putApiGateway")
    def put_api_gateway(self, *, default_size_inspection_limit: builtins.str) -> None:
        '''
        :param default_size_inspection_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
        '''
        value = Wafv2WebAclAssociationConfigRequestBodyApiGateway(
            default_size_inspection_limit=default_size_inspection_limit
        )

        return typing.cast(None, jsii.invoke(self, "putApiGateway", [value]))

    @jsii.member(jsii_name="putAppRunnerService")
    def put_app_runner_service(
        self,
        *,
        default_size_inspection_limit: builtins.str,
    ) -> None:
        '''
        :param default_size_inspection_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
        '''
        value = Wafv2WebAclAssociationConfigRequestBodyAppRunnerService(
            default_size_inspection_limit=default_size_inspection_limit
        )

        return typing.cast(None, jsii.invoke(self, "putAppRunnerService", [value]))

    @jsii.member(jsii_name="putCloudfront")
    def put_cloudfront(self, *, default_size_inspection_limit: builtins.str) -> None:
        '''
        :param default_size_inspection_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
        '''
        value = Wafv2WebAclAssociationConfigRequestBodyCloudfront(
            default_size_inspection_limit=default_size_inspection_limit
        )

        return typing.cast(None, jsii.invoke(self, "putCloudfront", [value]))

    @jsii.member(jsii_name="putCognitoUserPool")
    def put_cognito_user_pool(
        self,
        *,
        default_size_inspection_limit: builtins.str,
    ) -> None:
        '''
        :param default_size_inspection_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
        '''
        value = Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool(
            default_size_inspection_limit=default_size_inspection_limit
        )

        return typing.cast(None, jsii.invoke(self, "putCognitoUserPool", [value]))

    @jsii.member(jsii_name="putVerifiedAccessInstance")
    def put_verified_access_instance(
        self,
        *,
        default_size_inspection_limit: builtins.str,
    ) -> None:
        '''
        :param default_size_inspection_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
        '''
        value = Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance(
            default_size_inspection_limit=default_size_inspection_limit
        )

        return typing.cast(None, jsii.invoke(self, "putVerifiedAccessInstance", [value]))

    @jsii.member(jsii_name="resetApiGateway")
    def reset_api_gateway(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetApiGateway", []))

    @jsii.member(jsii_name="resetAppRunnerService")
    def reset_app_runner_service(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAppRunnerService", []))

    @jsii.member(jsii_name="resetCloudfront")
    def reset_cloudfront(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCloudfront", []))

    @jsii.member(jsii_name="resetCognitoUserPool")
    def reset_cognito_user_pool(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCognitoUserPool", []))

    @jsii.member(jsii_name="resetVerifiedAccessInstance")
    def reset_verified_access_instance(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVerifiedAccessInstance", []))

    @builtins.property
    @jsii.member(jsii_name="apiGateway")
    def api_gateway(
        self,
    ) -> Wafv2WebAclAssociationConfigRequestBodyApiGatewayOutputReference:
        return typing.cast(Wafv2WebAclAssociationConfigRequestBodyApiGatewayOutputReference, jsii.get(self, "apiGateway"))

    @builtins.property
    @jsii.member(jsii_name="appRunnerService")
    def app_runner_service(
        self,
    ) -> Wafv2WebAclAssociationConfigRequestBodyAppRunnerServiceOutputReference:
        return typing.cast(Wafv2WebAclAssociationConfigRequestBodyAppRunnerServiceOutputReference, jsii.get(self, "appRunnerService"))

    @builtins.property
    @jsii.member(jsii_name="cloudfront")
    def cloudfront(
        self,
    ) -> Wafv2WebAclAssociationConfigRequestBodyCloudfrontOutputReference:
        return typing.cast(Wafv2WebAclAssociationConfigRequestBodyCloudfrontOutputReference, jsii.get(self, "cloudfront"))

    @builtins.property
    @jsii.member(jsii_name="cognitoUserPool")
    def cognito_user_pool(
        self,
    ) -> Wafv2WebAclAssociationConfigRequestBodyCognitoUserPoolOutputReference:
        return typing.cast(Wafv2WebAclAssociationConfigRequestBodyCognitoUserPoolOutputReference, jsii.get(self, "cognitoUserPool"))

    @builtins.property
    @jsii.member(jsii_name="verifiedAccessInstance")
    def verified_access_instance(
        self,
    ) -> "Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference":
        return typing.cast("Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference", jsii.get(self, "verifiedAccessInstance"))

    @builtins.property
    @jsii.member(jsii_name="apiGatewayInput")
    def api_gateway_input(
        self,
    ) -> typing.Optional[Wafv2WebAclAssociationConfigRequestBodyApiGateway]:
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfigRequestBodyApiGateway], jsii.get(self, "apiGatewayInput"))

    @builtins.property
    @jsii.member(jsii_name="appRunnerServiceInput")
    def app_runner_service_input(
        self,
    ) -> typing.Optional[Wafv2WebAclAssociationConfigRequestBodyAppRunnerService]:
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfigRequestBodyAppRunnerService], jsii.get(self, "appRunnerServiceInput"))

    @builtins.property
    @jsii.member(jsii_name="cloudfrontInput")
    def cloudfront_input(
        self,
    ) -> typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCloudfront]:
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCloudfront], jsii.get(self, "cloudfrontInput"))

    @builtins.property
    @jsii.member(jsii_name="cognitoUserPoolInput")
    def cognito_user_pool_input(
        self,
    ) -> typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool]:
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool], jsii.get(self, "cognitoUserPoolInput"))

    @builtins.property
    @jsii.member(jsii_name="verifiedAccessInstanceInput")
    def verified_access_instance_input(
        self,
    ) -> typing.Optional["Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance"]:
        return typing.cast(typing.Optional["Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance"], jsii.get(self, "verifiedAccessInstanceInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclAssociationConfigRequestBody]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclAssociationConfigRequestBody]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclAssociationConfigRequestBody]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e1966ef15b7974ad8c37b8d830d205cb127e40e865813b8526f20b098124e91)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance",
    jsii_struct_bases=[],
    name_mapping={"default_size_inspection_limit": "defaultSizeInspectionLimit"},
)
class Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance:
    def __init__(self, *, default_size_inspection_limit: builtins.str) -> None:
        '''
        :param default_size_inspection_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3d0bcf707f84c5b14bc23330fb29d7354d14bea5172e9b6a59ad96ba372f2f5)
            check_type(argname="argument default_size_inspection_limit", value=default_size_inspection_limit, expected_type=type_hints["default_size_inspection_limit"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_size_inspection_limit": default_size_inspection_limit,
        }

    @builtins.property
    def default_size_inspection_limit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.'''
        result = self._values.get("default_size_inspection_limit")
        assert result is not None, "Required property 'default_size_inspection_limit' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8eb519ecd299e93b0c698cbad19e8dd29e4c5d83b2f2deb0fd8cfdcbf08a7a54)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="defaultSizeInspectionLimitInput")
    def default_size_inspection_limit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultSizeInspectionLimitInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultSizeInspectionLimit")
    def default_size_inspection_limit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultSizeInspectionLimit"))

    @default_size_inspection_limit.setter
    def default_size_inspection_limit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__769bdbdc191c4853054295a22209ebaa2848e370abe2476bde50d5b4e930db2a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultSizeInspectionLimit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance]:
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__528d88936886a2fcb63c741dc007044bdfcf49c90a9fe4f82d15723a0c0d6aff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclCaptchaConfig",
    jsii_struct_bases=[],
    name_mapping={"immunity_time_property": "immunityTimeProperty"},
)
class Wafv2WebAclCaptchaConfig:
    def __init__(
        self,
        *,
        immunity_time_property: typing.Optional[typing.Union["Wafv2WebAclCaptchaConfigImmunityTimeProperty", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param immunity_time_property: immunity_time_property block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        if isinstance(immunity_time_property, dict):
            immunity_time_property = Wafv2WebAclCaptchaConfigImmunityTimeProperty(**immunity_time_property)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e355eef5736f2b4cd09c28bff6e74cfab265463236747988f50fa23bccc4c8e1)
            check_type(argname="argument immunity_time_property", value=immunity_time_property, expected_type=type_hints["immunity_time_property"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if immunity_time_property is not None:
            self._values["immunity_time_property"] = immunity_time_property

    @builtins.property
    def immunity_time_property(
        self,
    ) -> typing.Optional["Wafv2WebAclCaptchaConfigImmunityTimeProperty"]:
        '''immunity_time_property block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        result = self._values.get("immunity_time_property")
        return typing.cast(typing.Optional["Wafv2WebAclCaptchaConfigImmunityTimeProperty"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclCaptchaConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclCaptchaConfigImmunityTimeProperty",
    jsii_struct_bases=[],
    name_mapping={"immunity_time": "immunityTime"},
)
class Wafv2WebAclCaptchaConfigImmunityTimeProperty:
    def __init__(self, *, immunity_time: typing.Optional[jsii.Number] = None) -> None:
        '''
        :param immunity_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a36ac45d4242a19c6d363f32f537a29cd21d1f02fd34829296d8db4d105683fd)
            check_type(argname="argument immunity_time", value=immunity_time, expected_type=type_hints["immunity_time"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if immunity_time is not None:
            self._values["immunity_time"] = immunity_time

    @builtins.property
    def immunity_time(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.'''
        result = self._values.get("immunity_time")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclCaptchaConfigImmunityTimeProperty(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclCaptchaConfigImmunityTimePropertyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclCaptchaConfigImmunityTimePropertyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9ada4c34acd4bb1964aedf6284d5073623d307abf1dc71aea6008c338374a6e0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetImmunityTime")
    def reset_immunity_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImmunityTime", []))

    @builtins.property
    @jsii.member(jsii_name="immunityTimeInput")
    def immunity_time_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "immunityTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="immunityTime")
    def immunity_time(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "immunityTime"))

    @immunity_time.setter
    def immunity_time(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a8c2a291916473288a92293fc0749302e129312cc0e5c1f29a724b522eb7976)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "immunityTime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclCaptchaConfigImmunityTimeProperty]:
        return typing.cast(typing.Optional[Wafv2WebAclCaptchaConfigImmunityTimeProperty], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclCaptchaConfigImmunityTimeProperty],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__394a39f868ef674c6b3d1789526d90e81508b8f31e209802b5dd1ef195b3676b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclCaptchaConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclCaptchaConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a97f71651ad9a6014cb72f7119276fa1f30e734b8199b41e31a151ea20f1ef3a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putImmunityTimeProperty")
    def put_immunity_time_property(
        self,
        *,
        immunity_time: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param immunity_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.
        '''
        value = Wafv2WebAclCaptchaConfigImmunityTimeProperty(
            immunity_time=immunity_time
        )

        return typing.cast(None, jsii.invoke(self, "putImmunityTimeProperty", [value]))

    @jsii.member(jsii_name="resetImmunityTimeProperty")
    def reset_immunity_time_property(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImmunityTimeProperty", []))

    @builtins.property
    @jsii.member(jsii_name="immunityTimeProperty")
    def immunity_time_property(
        self,
    ) -> Wafv2WebAclCaptchaConfigImmunityTimePropertyOutputReference:
        return typing.cast(Wafv2WebAclCaptchaConfigImmunityTimePropertyOutputReference, jsii.get(self, "immunityTimeProperty"))

    @builtins.property
    @jsii.member(jsii_name="immunityTimePropertyInput")
    def immunity_time_property_input(
        self,
    ) -> typing.Optional[Wafv2WebAclCaptchaConfigImmunityTimeProperty]:
        return typing.cast(typing.Optional[Wafv2WebAclCaptchaConfigImmunityTimeProperty], jsii.get(self, "immunityTimePropertyInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclCaptchaConfig]:
        return typing.cast(typing.Optional[Wafv2WebAclCaptchaConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[Wafv2WebAclCaptchaConfig]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b93838adebd10745c7e9babfdae4e670c2a2b0903b69d049396d12734e747f7a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclChallengeConfig",
    jsii_struct_bases=[],
    name_mapping={"immunity_time_property": "immunityTimeProperty"},
)
class Wafv2WebAclChallengeConfig:
    def __init__(
        self,
        *,
        immunity_time_property: typing.Optional[typing.Union["Wafv2WebAclChallengeConfigImmunityTimeProperty", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param immunity_time_property: immunity_time_property block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        if isinstance(immunity_time_property, dict):
            immunity_time_property = Wafv2WebAclChallengeConfigImmunityTimeProperty(**immunity_time_property)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eaed3176df1aaac97eaf0db41d27a65c1d12c149ed494946362e659e0a367b24)
            check_type(argname="argument immunity_time_property", value=immunity_time_property, expected_type=type_hints["immunity_time_property"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if immunity_time_property is not None:
            self._values["immunity_time_property"] = immunity_time_property

    @builtins.property
    def immunity_time_property(
        self,
    ) -> typing.Optional["Wafv2WebAclChallengeConfigImmunityTimeProperty"]:
        '''immunity_time_property block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        result = self._values.get("immunity_time_property")
        return typing.cast(typing.Optional["Wafv2WebAclChallengeConfigImmunityTimeProperty"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclChallengeConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclChallengeConfigImmunityTimeProperty",
    jsii_struct_bases=[],
    name_mapping={"immunity_time": "immunityTime"},
)
class Wafv2WebAclChallengeConfigImmunityTimeProperty:
    def __init__(self, *, immunity_time: typing.Optional[jsii.Number] = None) -> None:
        '''
        :param immunity_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb1632eae419b0011266bf1031030d155a326bcd7b9b5e23ad132a8586f079fa)
            check_type(argname="argument immunity_time", value=immunity_time, expected_type=type_hints["immunity_time"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if immunity_time is not None:
            self._values["immunity_time"] = immunity_time

    @builtins.property
    def immunity_time(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.'''
        result = self._values.get("immunity_time")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclChallengeConfigImmunityTimeProperty(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclChallengeConfigImmunityTimePropertyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclChallengeConfigImmunityTimePropertyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e663b87b7edf15a6c349ca86020b1afb4dcb0969bdf46c6ef6f8e19f89dd7b79)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetImmunityTime")
    def reset_immunity_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImmunityTime", []))

    @builtins.property
    @jsii.member(jsii_name="immunityTimeInput")
    def immunity_time_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "immunityTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="immunityTime")
    def immunity_time(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "immunityTime"))

    @immunity_time.setter
    def immunity_time(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7638252de83db1fac3611136edb29bb6c86c69be14f80ad4a8530e30c2d2b25)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "immunityTime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclChallengeConfigImmunityTimeProperty]:
        return typing.cast(typing.Optional[Wafv2WebAclChallengeConfigImmunityTimeProperty], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclChallengeConfigImmunityTimeProperty],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__89851b82b88f5ad221ece2511e109e47c3b99463f3d1cd8de50cc59879e8a5fa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclChallengeConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclChallengeConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__85d6adf8e3a2c45462916d1f303ee316a5f513b1fc8b786c3fc9e31959dbca8e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putImmunityTimeProperty")
    def put_immunity_time_property(
        self,
        *,
        immunity_time: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param immunity_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.
        '''
        value = Wafv2WebAclChallengeConfigImmunityTimeProperty(
            immunity_time=immunity_time
        )

        return typing.cast(None, jsii.invoke(self, "putImmunityTimeProperty", [value]))

    @jsii.member(jsii_name="resetImmunityTimeProperty")
    def reset_immunity_time_property(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImmunityTimeProperty", []))

    @builtins.property
    @jsii.member(jsii_name="immunityTimeProperty")
    def immunity_time_property(
        self,
    ) -> Wafv2WebAclChallengeConfigImmunityTimePropertyOutputReference:
        return typing.cast(Wafv2WebAclChallengeConfigImmunityTimePropertyOutputReference, jsii.get(self, "immunityTimeProperty"))

    @builtins.property
    @jsii.member(jsii_name="immunityTimePropertyInput")
    def immunity_time_property_input(
        self,
    ) -> typing.Optional[Wafv2WebAclChallengeConfigImmunityTimeProperty]:
        return typing.cast(typing.Optional[Wafv2WebAclChallengeConfigImmunityTimeProperty], jsii.get(self, "immunityTimePropertyInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclChallengeConfig]:
        return typing.cast(typing.Optional[Wafv2WebAclChallengeConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclChallengeConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a0d8f4ad16bdf9e0a7548d7cd93ab1a2a9b04801337cdcf7c33e1d5023fd437)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "default_action": "defaultAction",
        "scope": "scope",
        "visibility_config": "visibilityConfig",
        "association_config": "associationConfig",
        "captcha_config": "captchaConfig",
        "challenge_config": "challengeConfig",
        "custom_response_body": "customResponseBody",
        "data_protection_config": "dataProtectionConfig",
        "description": "description",
        "id": "id",
        "name": "name",
        "name_prefix": "namePrefix",
        "rule": "rule",
        "rule_json": "ruleJson",
        "tags": "tags",
        "tags_all": "tagsAll",
        "token_domains": "tokenDomains",
    },
)
class Wafv2WebAclConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        default_action: typing.Union["Wafv2WebAclDefaultAction", typing.Dict[builtins.str, typing.Any]],
        scope: builtins.str,
        visibility_config: typing.Union["Wafv2WebAclVisibilityConfig", typing.Dict[builtins.str, typing.Any]],
        association_config: typing.Optional[typing.Union[Wafv2WebAclAssociationConfig, typing.Dict[builtins.str, typing.Any]]] = None,
        captcha_config: typing.Optional[typing.Union[Wafv2WebAclCaptchaConfig, typing.Dict[builtins.str, typing.Any]]] = None,
        challenge_config: typing.Optional[typing.Union[Wafv2WebAclChallengeConfig, typing.Dict[builtins.str, typing.Any]]] = None,
        custom_response_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclCustomResponseBody", typing.Dict[builtins.str, typing.Any]]]]] = None,
        data_protection_config: typing.Optional[typing.Union["Wafv2WebAclDataProtectionConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        description: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        rule: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRule", typing.Dict[builtins.str, typing.Any]]]]] = None,
        rule_json: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        token_domains: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param default_action: default_action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_action Wafv2WebAcl#default_action}
        :param scope: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#scope Wafv2WebAcl#scope}.
        :param visibility_config: visibility_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#visibility_config Wafv2WebAcl#visibility_config}
        :param association_config: association_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#association_config Wafv2WebAcl#association_config}
        :param captcha_config: captcha_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha_config Wafv2WebAcl#captcha_config}
        :param challenge_config: challenge_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge_config Wafv2WebAcl#challenge_config}
        :param custom_response_body: custom_response_body block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body Wafv2WebAcl#custom_response_body}
        :param data_protection_config: data_protection_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection_config Wafv2WebAcl#data_protection_config}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#description Wafv2WebAcl#description}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#id Wafv2WebAcl#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name_prefix Wafv2WebAcl#name_prefix}.
        :param rule: rule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule Wafv2WebAcl#rule}
        :param rule_json: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_json Wafv2WebAcl#rule_json}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags Wafv2WebAcl#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags_all Wafv2WebAcl#tags_all}.
        :param token_domains: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#token_domains Wafv2WebAcl#token_domains}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(default_action, dict):
            default_action = Wafv2WebAclDefaultAction(**default_action)
        if isinstance(visibility_config, dict):
            visibility_config = Wafv2WebAclVisibilityConfig(**visibility_config)
        if isinstance(association_config, dict):
            association_config = Wafv2WebAclAssociationConfig(**association_config)
        if isinstance(captcha_config, dict):
            captcha_config = Wafv2WebAclCaptchaConfig(**captcha_config)
        if isinstance(challenge_config, dict):
            challenge_config = Wafv2WebAclChallengeConfig(**challenge_config)
        if isinstance(data_protection_config, dict):
            data_protection_config = Wafv2WebAclDataProtectionConfig(**data_protection_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2b23a610e33ef141618bb1c623cbb861407aea13645dd6d97457c8ca2afa560)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument default_action", value=default_action, expected_type=type_hints["default_action"])
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument visibility_config", value=visibility_config, expected_type=type_hints["visibility_config"])
            check_type(argname="argument association_config", value=association_config, expected_type=type_hints["association_config"])
            check_type(argname="argument captcha_config", value=captcha_config, expected_type=type_hints["captcha_config"])
            check_type(argname="argument challenge_config", value=challenge_config, expected_type=type_hints["challenge_config"])
            check_type(argname="argument custom_response_body", value=custom_response_body, expected_type=type_hints["custom_response_body"])
            check_type(argname="argument data_protection_config", value=data_protection_config, expected_type=type_hints["data_protection_config"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument name_prefix", value=name_prefix, expected_type=type_hints["name_prefix"])
            check_type(argname="argument rule", value=rule, expected_type=type_hints["rule"])
            check_type(argname="argument rule_json", value=rule_json, expected_type=type_hints["rule_json"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument token_domains", value=token_domains, expected_type=type_hints["token_domains"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_action": default_action,
            "scope": scope,
            "visibility_config": visibility_config,
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
        if association_config is not None:
            self._values["association_config"] = association_config
        if captcha_config is not None:
            self._values["captcha_config"] = captcha_config
        if challenge_config is not None:
            self._values["challenge_config"] = challenge_config
        if custom_response_body is not None:
            self._values["custom_response_body"] = custom_response_body
        if data_protection_config is not None:
            self._values["data_protection_config"] = data_protection_config
        if description is not None:
            self._values["description"] = description
        if id is not None:
            self._values["id"] = id
        if name is not None:
            self._values["name"] = name
        if name_prefix is not None:
            self._values["name_prefix"] = name_prefix
        if rule is not None:
            self._values["rule"] = rule
        if rule_json is not None:
            self._values["rule_json"] = rule_json
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if token_domains is not None:
            self._values["token_domains"] = token_domains

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
    def default_action(self) -> "Wafv2WebAclDefaultAction":
        '''default_action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_action Wafv2WebAcl#default_action}
        '''
        result = self._values.get("default_action")
        assert result is not None, "Required property 'default_action' is missing"
        return typing.cast("Wafv2WebAclDefaultAction", result)

    @builtins.property
    def scope(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#scope Wafv2WebAcl#scope}.'''
        result = self._values.get("scope")
        assert result is not None, "Required property 'scope' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def visibility_config(self) -> "Wafv2WebAclVisibilityConfig":
        '''visibility_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#visibility_config Wafv2WebAcl#visibility_config}
        '''
        result = self._values.get("visibility_config")
        assert result is not None, "Required property 'visibility_config' is missing"
        return typing.cast("Wafv2WebAclVisibilityConfig", result)

    @builtins.property
    def association_config(self) -> typing.Optional[Wafv2WebAclAssociationConfig]:
        '''association_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#association_config Wafv2WebAcl#association_config}
        '''
        result = self._values.get("association_config")
        return typing.cast(typing.Optional[Wafv2WebAclAssociationConfig], result)

    @builtins.property
    def captcha_config(self) -> typing.Optional[Wafv2WebAclCaptchaConfig]:
        '''captcha_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha_config Wafv2WebAcl#captcha_config}
        '''
        result = self._values.get("captcha_config")
        return typing.cast(typing.Optional[Wafv2WebAclCaptchaConfig], result)

    @builtins.property
    def challenge_config(self) -> typing.Optional[Wafv2WebAclChallengeConfig]:
        '''challenge_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge_config Wafv2WebAcl#challenge_config}
        '''
        result = self._values.get("challenge_config")
        return typing.cast(typing.Optional[Wafv2WebAclChallengeConfig], result)

    @builtins.property
    def custom_response_body(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclCustomResponseBody"]]]:
        '''custom_response_body block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body Wafv2WebAcl#custom_response_body}
        '''
        result = self._values.get("custom_response_body")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclCustomResponseBody"]]], result)

    @builtins.property
    def data_protection_config(
        self,
    ) -> typing.Optional["Wafv2WebAclDataProtectionConfig"]:
        '''data_protection_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection_config Wafv2WebAcl#data_protection_config}
        '''
        result = self._values.get("data_protection_config")
        return typing.cast(typing.Optional["Wafv2WebAclDataProtectionConfig"], result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#description Wafv2WebAcl#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#id Wafv2WebAcl#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name_prefix Wafv2WebAcl#name_prefix}.'''
        result = self._values.get("name_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def rule(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRule"]]]:
        '''rule block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule Wafv2WebAcl#rule}
        '''
        result = self._values.get("rule")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRule"]]], result)

    @builtins.property
    def rule_json(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_json Wafv2WebAcl#rule_json}.'''
        result = self._values.get("rule_json")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags Wafv2WebAcl#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags_all Wafv2WebAcl#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def token_domains(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#token_domains Wafv2WebAcl#token_domains}.'''
        result = self._values.get("token_domains")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclCustomResponseBody",
    jsii_struct_bases=[],
    name_mapping={"content": "content", "content_type": "contentType", "key": "key"},
)
class Wafv2WebAclCustomResponseBody:
    def __init__(
        self,
        *,
        content: builtins.str,
        content_type: builtins.str,
        key: builtins.str,
    ) -> None:
        '''
        :param content: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#content Wafv2WebAcl#content}.
        :param content_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#content_type Wafv2WebAcl#content_type}.
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#key Wafv2WebAcl#key}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__48c59ede7e6fa6b5815fd697bd22c36fbd62b661a38c85bad5864cd66447740a)
            check_type(argname="argument content", value=content, expected_type=type_hints["content"])
            check_type(argname="argument content_type", value=content_type, expected_type=type_hints["content_type"])
            check_type(argname="argument key", value=key, expected_type=type_hints["key"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "content": content,
            "content_type": content_type,
            "key": key,
        }

    @builtins.property
    def content(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#content Wafv2WebAcl#content}.'''
        result = self._values.get("content")
        assert result is not None, "Required property 'content' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def content_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#content_type Wafv2WebAcl#content_type}.'''
        result = self._values.get("content_type")
        assert result is not None, "Required property 'content_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#key Wafv2WebAcl#key}.'''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclCustomResponseBody(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclCustomResponseBodyList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclCustomResponseBodyList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dd2f371f2d01480c0b48de765b2f257b34b4406673bf1d2d92465fec526b6dc9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "Wafv2WebAclCustomResponseBodyOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c697613bb53ac61e5174325681fa48222e3bd0d337d4a89ea324dc84de2b2bb)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclCustomResponseBodyOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd9b40aafb6c773ddc032b48fc4ff0c477b4760fb588e1a036492f6c5726f3fd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__17c41d61135ae3a3917466cce64367458de339312f65950b6a31b8564711dbc5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5b3613943df7c75a3750dc6898733ad14792beb4ae4e26b3425c83902135c4f8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclCustomResponseBody]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclCustomResponseBody]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclCustomResponseBody]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5bbd83956602f16a19888c533f524fa61928628eaaeaf2d24d617c99b153436e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclCustomResponseBodyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclCustomResponseBodyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f6f8ea6d7c2222938907aa27f7512a96427a12772084fdd1a392e37234421df9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="contentInput")
    def content_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contentInput"))

    @builtins.property
    @jsii.member(jsii_name="contentTypeInput")
    def content_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contentTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="keyInput")
    def key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "keyInput"))

    @builtins.property
    @jsii.member(jsii_name="content")
    def content(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "content"))

    @content.setter
    def content(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__521df35b06d860b5392b6f7c2b3d558857481f24fcf8377953534e0c6624bc68)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "content", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="contentType")
    def content_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contentType"))

    @content_type.setter
    def content_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a0e27f5ec82732dc2d19cd44a8dda65b686543a617637e2d033c492f7255c48)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contentType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da98854931df7f102302778213fa19dd756979c3710ac1583c117950e5fea5d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclCustomResponseBody]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclCustomResponseBody]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclCustomResponseBody]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9207537bf08b086353b62d4899ba8cb3a6f70fab12e91e0ba24271690abc9117)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfig",
    jsii_struct_bases=[],
    name_mapping={"data_protection": "dataProtection"},
)
class Wafv2WebAclDataProtectionConfig:
    def __init__(
        self,
        *,
        data_protection: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclDataProtectionConfigDataProtection", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param data_protection: data_protection block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection Wafv2WebAcl#data_protection}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a456f6c2dc061fcd81048a586b507e545a43e520aa7e3f1049beff50d13f29a5)
            check_type(argname="argument data_protection", value=data_protection, expected_type=type_hints["data_protection"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if data_protection is not None:
            self._values["data_protection"] = data_protection

    @builtins.property
    def data_protection(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclDataProtectionConfigDataProtection"]]]:
        '''data_protection block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection Wafv2WebAcl#data_protection}
        '''
        result = self._values.get("data_protection")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclDataProtectionConfigDataProtection"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclDataProtectionConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigDataProtection",
    jsii_struct_bases=[],
    name_mapping={
        "action": "action",
        "field": "field",
        "exclude_rate_based_details": "excludeRateBasedDetails",
        "exclude_rule_match_details": "excludeRuleMatchDetails",
    },
)
class Wafv2WebAclDataProtectionConfigDataProtection:
    def __init__(
        self,
        *,
        action: builtins.str,
        field: typing.Union["Wafv2WebAclDataProtectionConfigDataProtectionField", typing.Dict[builtins.str, typing.Any]],
        exclude_rate_based_details: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        exclude_rule_match_details: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param action: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#action Wafv2WebAcl#action}.
        :param field: field block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field Wafv2WebAcl#field}
        :param exclude_rate_based_details: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#exclude_rate_based_details Wafv2WebAcl#exclude_rate_based_details}.
        :param exclude_rule_match_details: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#exclude_rule_match_details Wafv2WebAcl#exclude_rule_match_details}.
        '''
        if isinstance(field, dict):
            field = Wafv2WebAclDataProtectionConfigDataProtectionField(**field)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3807dacf308aa820a7c50e43d0ff0cfe26204acd6d5d204e2cc8db223211339)
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument field", value=field, expected_type=type_hints["field"])
            check_type(argname="argument exclude_rate_based_details", value=exclude_rate_based_details, expected_type=type_hints["exclude_rate_based_details"])
            check_type(argname="argument exclude_rule_match_details", value=exclude_rule_match_details, expected_type=type_hints["exclude_rule_match_details"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action": action,
            "field": field,
        }
        if exclude_rate_based_details is not None:
            self._values["exclude_rate_based_details"] = exclude_rate_based_details
        if exclude_rule_match_details is not None:
            self._values["exclude_rule_match_details"] = exclude_rule_match_details

    @builtins.property
    def action(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#action Wafv2WebAcl#action}.'''
        result = self._values.get("action")
        assert result is not None, "Required property 'action' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def field(self) -> "Wafv2WebAclDataProtectionConfigDataProtectionField":
        '''field block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field Wafv2WebAcl#field}
        '''
        result = self._values.get("field")
        assert result is not None, "Required property 'field' is missing"
        return typing.cast("Wafv2WebAclDataProtectionConfigDataProtectionField", result)

    @builtins.property
    def exclude_rate_based_details(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#exclude_rate_based_details Wafv2WebAcl#exclude_rate_based_details}.'''
        result = self._values.get("exclude_rate_based_details")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def exclude_rule_match_details(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#exclude_rule_match_details Wafv2WebAcl#exclude_rule_match_details}.'''
        result = self._values.get("exclude_rule_match_details")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclDataProtectionConfigDataProtection(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigDataProtectionField",
    jsii_struct_bases=[],
    name_mapping={"field_type": "fieldType", "field_keys": "fieldKeys"},
)
class Wafv2WebAclDataProtectionConfigDataProtectionField:
    def __init__(
        self,
        *,
        field_type: builtins.str,
        field_keys: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param field_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field_type Wafv2WebAcl#field_type}.
        :param field_keys: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field_keys Wafv2WebAcl#field_keys}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb4290140b6862ec625f677ba76a959a7a6e773529cca0de5a5c78e592f29517)
            check_type(argname="argument field_type", value=field_type, expected_type=type_hints["field_type"])
            check_type(argname="argument field_keys", value=field_keys, expected_type=type_hints["field_keys"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "field_type": field_type,
        }
        if field_keys is not None:
            self._values["field_keys"] = field_keys

    @builtins.property
    def field_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field_type Wafv2WebAcl#field_type}.'''
        result = self._values.get("field_type")
        assert result is not None, "Required property 'field_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def field_keys(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field_keys Wafv2WebAcl#field_keys}.'''
        result = self._values.get("field_keys")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclDataProtectionConfigDataProtectionField(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__04ebf2e1d8f3e48412e2721565d82d9d7097e67be5457a6d2a0c2fc73b8bf998)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetFieldKeys")
    def reset_field_keys(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFieldKeys", []))

    @builtins.property
    @jsii.member(jsii_name="fieldKeysInput")
    def field_keys_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "fieldKeysInput"))

    @builtins.property
    @jsii.member(jsii_name="fieldTypeInput")
    def field_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "fieldTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="fieldKeys")
    def field_keys(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "fieldKeys"))

    @field_keys.setter
    def field_keys(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2bdebe55567510c843ef66ff05745dd1a819cb6a85b4f9f0b13f077d448e743d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fieldKeys", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fieldType")
    def field_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fieldType"))

    @field_type.setter
    def field_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9c1029c9c75b091779330a3e0a8227fb1d79ea2f529d5bb8a3c573b6eca05c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fieldType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclDataProtectionConfigDataProtectionField]:
        return typing.cast(typing.Optional[Wafv2WebAclDataProtectionConfigDataProtectionField], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclDataProtectionConfigDataProtectionField],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a797d0f146d4021712e4d5382dd3b700837b79514188e390021e7f9401982e37)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclDataProtectionConfigDataProtectionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigDataProtectionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__28cdf6e05c5d3719d615db28faefe51a606e5cd567584a9816ad10bc86f25049)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2WebAclDataProtectionConfigDataProtectionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__835a4e54ba7962b5b11504a344b3e96cbfd13bba0531c55512651591423a356c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclDataProtectionConfigDataProtectionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42216433883b530cd79c621836a37bee05e8546691e5082b3d1a4e532f682db2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2af2862c517592e8b546b5e4842a19e950af59accc8df5af32d38eeec8096f4d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ec8f604c39d5fa2061ef57c78f6c74816c403f923c5eb427945a5c524ddf05b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDataProtectionConfigDataProtection]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDataProtectionConfigDataProtection]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDataProtectionConfigDataProtection]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a119f86c242b354179bf1b4de84ea355677b07e4bb2ef5f17a8db670c688c77)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclDataProtectionConfigDataProtectionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigDataProtectionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__284055d80141f4ce23b409ada0ab77860d5a910fe694e5e2203c4430936b2632)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putField")
    def put_field(
        self,
        *,
        field_type: builtins.str,
        field_keys: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param field_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field_type Wafv2WebAcl#field_type}.
        :param field_keys: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field_keys Wafv2WebAcl#field_keys}.
        '''
        value = Wafv2WebAclDataProtectionConfigDataProtectionField(
            field_type=field_type, field_keys=field_keys
        )

        return typing.cast(None, jsii.invoke(self, "putField", [value]))

    @jsii.member(jsii_name="resetExcludeRateBasedDetails")
    def reset_exclude_rate_based_details(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExcludeRateBasedDetails", []))

    @jsii.member(jsii_name="resetExcludeRuleMatchDetails")
    def reset_exclude_rule_match_details(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExcludeRuleMatchDetails", []))

    @builtins.property
    @jsii.member(jsii_name="field")
    def field(
        self,
    ) -> Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference:
        return typing.cast(Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference, jsii.get(self, "field"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="excludeRateBasedDetailsInput")
    def exclude_rate_based_details_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "excludeRateBasedDetailsInput"))

    @builtins.property
    @jsii.member(jsii_name="excludeRuleMatchDetailsInput")
    def exclude_rule_match_details_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "excludeRuleMatchDetailsInput"))

    @builtins.property
    @jsii.member(jsii_name="fieldInput")
    def field_input(
        self,
    ) -> typing.Optional[Wafv2WebAclDataProtectionConfigDataProtectionField]:
        return typing.cast(typing.Optional[Wafv2WebAclDataProtectionConfigDataProtectionField], jsii.get(self, "fieldInput"))

    @builtins.property
    @jsii.member(jsii_name="action")
    def action(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "action"))

    @action.setter
    def action(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__617ef19623bc6da99d9e4cd302001b16cafd9cc4ed54c733dbc51887f7b73176)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "action", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="excludeRateBasedDetails")
    def exclude_rate_based_details(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "excludeRateBasedDetails"))

    @exclude_rate_based_details.setter
    def exclude_rate_based_details(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12460ee050659b72cd42ebd715534761f78ef8f20b52da7e71ce72b47d2ef2c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "excludeRateBasedDetails", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="excludeRuleMatchDetails")
    def exclude_rule_match_details(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "excludeRuleMatchDetails"))

    @exclude_rule_match_details.setter
    def exclude_rule_match_details(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cce39500b2b6c9eaa64931762b4e5242b28edd794560b7e184696f28bdadc70f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "excludeRuleMatchDetails", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDataProtectionConfigDataProtection]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDataProtectionConfigDataProtection]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDataProtectionConfigDataProtection]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__348f0b1bad65159041a3b069371f6d4ee866923b8be9c6fea79322f0e596e7a7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclDataProtectionConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b15678a484b659f77a8e15f68735b471dea3a532a0018c58e8e6ef382acff510)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDataProtection")
    def put_data_protection(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclDataProtectionConfigDataProtection, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__059faab5be44ec61b00c4bb005abe7590087641a4cd11b71769e18d646a5690d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDataProtection", [value]))

    @jsii.member(jsii_name="resetDataProtection")
    def reset_data_protection(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataProtection", []))

    @builtins.property
    @jsii.member(jsii_name="dataProtection")
    def data_protection(self) -> Wafv2WebAclDataProtectionConfigDataProtectionList:
        return typing.cast(Wafv2WebAclDataProtectionConfigDataProtectionList, jsii.get(self, "dataProtection"))

    @builtins.property
    @jsii.member(jsii_name="dataProtectionInput")
    def data_protection_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDataProtectionConfigDataProtection]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDataProtectionConfigDataProtection]]], jsii.get(self, "dataProtectionInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclDataProtectionConfig]:
        return typing.cast(typing.Optional[Wafv2WebAclDataProtectionConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclDataProtectionConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3c00fa074ae469dcf9c0701fdd8a5b2e254a728a1010440665ba4680513be8c7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultAction",
    jsii_struct_bases=[],
    name_mapping={"allow": "allow", "block": "block"},
)
class Wafv2WebAclDefaultAction:
    def __init__(
        self,
        *,
        allow: typing.Optional[typing.Union["Wafv2WebAclDefaultActionAllow", typing.Dict[builtins.str, typing.Any]]] = None,
        block: typing.Optional[typing.Union["Wafv2WebAclDefaultActionBlock", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param allow: allow block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#allow Wafv2WebAcl#allow}
        :param block: block block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#block Wafv2WebAcl#block}
        '''
        if isinstance(allow, dict):
            allow = Wafv2WebAclDefaultActionAllow(**allow)
        if isinstance(block, dict):
            block = Wafv2WebAclDefaultActionBlock(**block)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ffd966b2d347c7ddf1bfb8d9a836754eda8d15696a87e7a34d84d95ae0d67d49)
            check_type(argname="argument allow", value=allow, expected_type=type_hints["allow"])
            check_type(argname="argument block", value=block, expected_type=type_hints["block"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if allow is not None:
            self._values["allow"] = allow
        if block is not None:
            self._values["block"] = block

    @builtins.property
    def allow(self) -> typing.Optional["Wafv2WebAclDefaultActionAllow"]:
        '''allow block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#allow Wafv2WebAcl#allow}
        '''
        result = self._values.get("allow")
        return typing.cast(typing.Optional["Wafv2WebAclDefaultActionAllow"], result)

    @builtins.property
    def block(self) -> typing.Optional["Wafv2WebAclDefaultActionBlock"]:
        '''block block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#block Wafv2WebAcl#block}
        '''
        result = self._values.get("block")
        return typing.cast(typing.Optional["Wafv2WebAclDefaultActionBlock"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclDefaultAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionAllow",
    jsii_struct_bases=[],
    name_mapping={"custom_request_handling": "customRequestHandling"},
)
class Wafv2WebAclDefaultActionAllow:
    def __init__(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union["Wafv2WebAclDefaultActionAllowCustomRequestHandling", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        if isinstance(custom_request_handling, dict):
            custom_request_handling = Wafv2WebAclDefaultActionAllowCustomRequestHandling(**custom_request_handling)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3453f86fe364e477a6542f2b86622f40a3afe91677128a70689b4b6bb65f337e)
            check_type(argname="argument custom_request_handling", value=custom_request_handling, expected_type=type_hints["custom_request_handling"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_request_handling is not None:
            self._values["custom_request_handling"] = custom_request_handling

    @builtins.property
    def custom_request_handling(
        self,
    ) -> typing.Optional["Wafv2WebAclDefaultActionAllowCustomRequestHandling"]:
        '''custom_request_handling block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        result = self._values.get("custom_request_handling")
        return typing.cast(typing.Optional["Wafv2WebAclDefaultActionAllowCustomRequestHandling"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclDefaultActionAllow(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionAllowCustomRequestHandling",
    jsii_struct_bases=[],
    name_mapping={"insert_header": "insertHeader"},
)
class Wafv2WebAclDefaultActionAllowCustomRequestHandling:
    def __init__(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff1adf30d2b128bb5a042051ef12e58c16ffad96f31df735a9d882692b852af2)
            check_type(argname="argument insert_header", value=insert_header, expected_type=type_hints["insert_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insert_header": insert_header,
        }

    @builtins.property
    def insert_header(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader"]]:
        '''insert_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        result = self._values.get("insert_header")
        assert result is not None, "Required property 'insert_header' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclDefaultActionAllowCustomRequestHandling(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8df097c5a98fbc0c4d2ceaf516c040545f8a1d8852de79313e054b4d62b32a5a)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__afaa8b4136e8e32648038c33573a519c2d6d7ae7a1e454c959f86ca7cc76b2b6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9ae6a04e75046f4824a226a6c28e6e8126e24f0fec26f956d90ab2b6cf37bdc4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a0ccd3f7acbb640c423ceb105666f46670f4c47b627998334e54028b74b1a95c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f1135b20c8b3604bf71fb0e752d336842a8cf84a9e4789dd107f1a96f04b67dd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0e491f0991d2ebf601f20f7e45b397e20720d78460234894be6a07dd939a9a05)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23b69d2987090f636172e65e673f531bcc31751d54a7ebd1669c6ce469952194)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__eed267e0d8ba0b5f38930e25f5a55c43162d3bbb85f547e7d2d443635fd48ffe)
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
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f04a142581d2f91a002894f4d0c018f707cb1c894b116f44bf57ed3b5c7227b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__879ac2694c7b96fc294f631086281631b02abb35dbd32bb9c33f22c6682a05ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f44cab440349aa54cc759d09e5c5633502427bd67ac9febbfef2eaf2971bd9d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclDefaultActionAllowCustomRequestHandlingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionAllowCustomRequestHandlingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b1229f499552d9cd41b29398b764955af24af07771372ad7c108da616322a299)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInsertHeader")
    def put_insert_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cfd57fd088d6963944e7416d1896561546a9232b1e5cbaa4a8ae73b529bd19e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInsertHeader", [value]))

    @builtins.property
    @jsii.member(jsii_name="insertHeader")
    def insert_header(
        self,
    ) -> Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeaderList:
        return typing.cast(Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeaderList, jsii.get(self, "insertHeader"))

    @builtins.property
    @jsii.member(jsii_name="insertHeaderInput")
    def insert_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader]]], jsii.get(self, "insertHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclDefaultActionAllowCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2WebAclDefaultActionAllowCustomRequestHandling], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclDefaultActionAllowCustomRequestHandling],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a27a56808e05cd83b20de2727b84cef35710fcabc4de6b14ba82b297d5c3a772)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclDefaultActionAllowOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionAllowOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8c725db33f1df27e827307017a86b6b0985dd7ee6de72bef320fa421029d12bc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomRequestHandling")
    def put_custom_request_handling(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        value = Wafv2WebAclDefaultActionAllowCustomRequestHandling(
            insert_header=insert_header
        )

        return typing.cast(None, jsii.invoke(self, "putCustomRequestHandling", [value]))

    @jsii.member(jsii_name="resetCustomRequestHandling")
    def reset_custom_request_handling(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomRequestHandling", []))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandling")
    def custom_request_handling(
        self,
    ) -> Wafv2WebAclDefaultActionAllowCustomRequestHandlingOutputReference:
        return typing.cast(Wafv2WebAclDefaultActionAllowCustomRequestHandlingOutputReference, jsii.get(self, "customRequestHandling"))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandlingInput")
    def custom_request_handling_input(
        self,
    ) -> typing.Optional[Wafv2WebAclDefaultActionAllowCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2WebAclDefaultActionAllowCustomRequestHandling], jsii.get(self, "customRequestHandlingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclDefaultActionAllow]:
        return typing.cast(typing.Optional[Wafv2WebAclDefaultActionAllow], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclDefaultActionAllow],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__009ddb65ad0917e74301d2df82ad8f2b3367b8d891aa86bb0ceb9e2c45fbeb33)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionBlock",
    jsii_struct_bases=[],
    name_mapping={"custom_response": "customResponse"},
)
class Wafv2WebAclDefaultActionBlock:
    def __init__(
        self,
        *,
        custom_response: typing.Optional[typing.Union["Wafv2WebAclDefaultActionBlockCustomResponse", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_response: custom_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response Wafv2WebAcl#custom_response}
        '''
        if isinstance(custom_response, dict):
            custom_response = Wafv2WebAclDefaultActionBlockCustomResponse(**custom_response)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__762994292e94c71108919bf3a77310a749066f62e6e35b608dc618bce7e0a5d1)
            check_type(argname="argument custom_response", value=custom_response, expected_type=type_hints["custom_response"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_response is not None:
            self._values["custom_response"] = custom_response

    @builtins.property
    def custom_response(
        self,
    ) -> typing.Optional["Wafv2WebAclDefaultActionBlockCustomResponse"]:
        '''custom_response block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response Wafv2WebAcl#custom_response}
        '''
        result = self._values.get("custom_response")
        return typing.cast(typing.Optional["Wafv2WebAclDefaultActionBlockCustomResponse"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclDefaultActionBlock(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionBlockCustomResponse",
    jsii_struct_bases=[],
    name_mapping={
        "response_code": "responseCode",
        "custom_response_body_key": "customResponseBodyKey",
        "response_header": "responseHeader",
    },
)
class Wafv2WebAclDefaultActionBlockCustomResponse:
    def __init__(
        self,
        *,
        response_code: jsii.Number,
        custom_response_body_key: typing.Optional[builtins.str] = None,
        response_header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param response_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_code Wafv2WebAcl#response_code}.
        :param custom_response_body_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body_key Wafv2WebAcl#custom_response_body_key}.
        :param response_header: response_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_header Wafv2WebAcl#response_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa71d26cc220ad33400090b42293ba0a0433946034770894c3aa8cddee4ae81d)
            check_type(argname="argument response_code", value=response_code, expected_type=type_hints["response_code"])
            check_type(argname="argument custom_response_body_key", value=custom_response_body_key, expected_type=type_hints["custom_response_body_key"])
            check_type(argname="argument response_header", value=response_header, expected_type=type_hints["response_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "response_code": response_code,
        }
        if custom_response_body_key is not None:
            self._values["custom_response_body_key"] = custom_response_body_key
        if response_header is not None:
            self._values["response_header"] = response_header

    @builtins.property
    def response_code(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_code Wafv2WebAcl#response_code}.'''
        result = self._values.get("response_code")
        assert result is not None, "Required property 'response_code' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def custom_response_body_key(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body_key Wafv2WebAcl#custom_response_body_key}.'''
        result = self._values.get("custom_response_body_key")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def response_header(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader"]]]:
        '''response_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_header Wafv2WebAcl#response_header}
        '''
        result = self._values.get("response_header")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclDefaultActionBlockCustomResponse(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclDefaultActionBlockCustomResponseOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionBlockCustomResponseOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9280adc9415b70919f1945a370f6fd757daf57c06b9c5a1d9f0dcfbed6aca591)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putResponseHeader")
    def put_response_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__732b778e689034fd1fff4a34c8699e5abe76f7cbc4b0e0dc2cb2fbbf7f0acb28)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResponseHeader", [value]))

    @jsii.member(jsii_name="resetCustomResponseBodyKey")
    def reset_custom_response_body_key(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomResponseBodyKey", []))

    @jsii.member(jsii_name="resetResponseHeader")
    def reset_response_header(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResponseHeader", []))

    @builtins.property
    @jsii.member(jsii_name="responseHeader")
    def response_header(
        self,
    ) -> "Wafv2WebAclDefaultActionBlockCustomResponseResponseHeaderList":
        return typing.cast("Wafv2WebAclDefaultActionBlockCustomResponseResponseHeaderList", jsii.get(self, "responseHeader"))

    @builtins.property
    @jsii.member(jsii_name="customResponseBodyKeyInput")
    def custom_response_body_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "customResponseBodyKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="responseCodeInput")
    def response_code_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "responseCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="responseHeaderInput")
    def response_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader"]]], jsii.get(self, "responseHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="customResponseBodyKey")
    def custom_response_body_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customResponseBodyKey"))

    @custom_response_body_key.setter
    def custom_response_body_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96ae80333b6d44dd10f82fdc603fca903b93b18b695c3a86cfc3a015f8992f9a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customResponseBodyKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="responseCode")
    def response_code(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "responseCode"))

    @response_code.setter
    def response_code(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d68d72dab4a3d8e44384e183ce5020fe3939f7c0dabdf8ac0fb5448cd3c690c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "responseCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclDefaultActionBlockCustomResponse]:
        return typing.cast(typing.Optional[Wafv2WebAclDefaultActionBlockCustomResponse], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclDefaultActionBlockCustomResponse],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ee6e0c2c55d1bffa8e06a880451fcf89734535d420a163b9b2a79037e2ef4fc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96523b56a83ef76a0b0bae5a2d6efbbf9005625aec834892319d2ed02dad0f61)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclDefaultActionBlockCustomResponseResponseHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionBlockCustomResponseResponseHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__770ac716224ea4c08f3dd652e5c6bafa9d0219b056545b9e7b3aac0ac2158dfd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2WebAclDefaultActionBlockCustomResponseResponseHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b230ecbfb93f7fa86bdf394577fa007134ada119c5096f4ea3cfba4bd1d5887)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclDefaultActionBlockCustomResponseResponseHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79ea81c43155917d8d644e2b79f1b0a86dcf6bb802f35215a4a3467a49d04d2f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__00d61603f1cac01379f0ea527774aeab45d6516533ca5c391de9366b63101715)
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
            type_hints = typing.get_type_hints(_typecheckingstub__044165c71c415a07ed9c3f3d7d7f18126e31b24464480c34db859c344ded08ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8fbc5b3aada59ac8e125bbd166b84f7c43ec4bc6f881a09eb8da163d28c367c0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclDefaultActionBlockCustomResponseResponseHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionBlockCustomResponseResponseHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8b3415d8a0a594ce996436f02ac16f06b2426cd0979d4df29ae6d335b4e256ec)
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
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07b900ec8c04a6588c8104522bae18b1017d31730871b730893a303600bb8a64)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c885095452dfebd801c499ba6bc195e169680d7d09e2bda06bbe8c975e8c1d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1cd6a08e5b814ade28b8d992c027613a0828dea4720728343e9b0df5a50f5dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclDefaultActionBlockOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionBlockOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ebc6976f8bbe5e02597316343b77faf759018f05403d50cf498151f0383278c8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomResponse")
    def put_custom_response(
        self,
        *,
        response_code: jsii.Number,
        custom_response_body_key: typing.Optional[builtins.str] = None,
        response_header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param response_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_code Wafv2WebAcl#response_code}.
        :param custom_response_body_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body_key Wafv2WebAcl#custom_response_body_key}.
        :param response_header: response_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_header Wafv2WebAcl#response_header}
        '''
        value = Wafv2WebAclDefaultActionBlockCustomResponse(
            response_code=response_code,
            custom_response_body_key=custom_response_body_key,
            response_header=response_header,
        )

        return typing.cast(None, jsii.invoke(self, "putCustomResponse", [value]))

    @jsii.member(jsii_name="resetCustomResponse")
    def reset_custom_response(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomResponse", []))

    @builtins.property
    @jsii.member(jsii_name="customResponse")
    def custom_response(
        self,
    ) -> Wafv2WebAclDefaultActionBlockCustomResponseOutputReference:
        return typing.cast(Wafv2WebAclDefaultActionBlockCustomResponseOutputReference, jsii.get(self, "customResponse"))

    @builtins.property
    @jsii.member(jsii_name="customResponseInput")
    def custom_response_input(
        self,
    ) -> typing.Optional[Wafv2WebAclDefaultActionBlockCustomResponse]:
        return typing.cast(typing.Optional[Wafv2WebAclDefaultActionBlockCustomResponse], jsii.get(self, "customResponseInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclDefaultActionBlock]:
        return typing.cast(typing.Optional[Wafv2WebAclDefaultActionBlock], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclDefaultActionBlock],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6365d1a411dc22d639865440fbc3e9e38928c5acfd1fa6113c86fdeb9ca9e6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclDefaultActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclDefaultActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6cb1180af3df3c7e49438d78e3c534fd0abd7edb7c2e7bc50555b88311d34d44)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAllow")
    def put_allow(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union[Wafv2WebAclDefaultActionAllowCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        value = Wafv2WebAclDefaultActionAllow(
            custom_request_handling=custom_request_handling
        )

        return typing.cast(None, jsii.invoke(self, "putAllow", [value]))

    @jsii.member(jsii_name="putBlock")
    def put_block(
        self,
        *,
        custom_response: typing.Optional[typing.Union[Wafv2WebAclDefaultActionBlockCustomResponse, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_response: custom_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response Wafv2WebAcl#custom_response}
        '''
        value = Wafv2WebAclDefaultActionBlock(custom_response=custom_response)

        return typing.cast(None, jsii.invoke(self, "putBlock", [value]))

    @jsii.member(jsii_name="resetAllow")
    def reset_allow(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllow", []))

    @jsii.member(jsii_name="resetBlock")
    def reset_block(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBlock", []))

    @builtins.property
    @jsii.member(jsii_name="allow")
    def allow(self) -> Wafv2WebAclDefaultActionAllowOutputReference:
        return typing.cast(Wafv2WebAclDefaultActionAllowOutputReference, jsii.get(self, "allow"))

    @builtins.property
    @jsii.member(jsii_name="block")
    def block(self) -> Wafv2WebAclDefaultActionBlockOutputReference:
        return typing.cast(Wafv2WebAclDefaultActionBlockOutputReference, jsii.get(self, "block"))

    @builtins.property
    @jsii.member(jsii_name="allowInput")
    def allow_input(self) -> typing.Optional[Wafv2WebAclDefaultActionAllow]:
        return typing.cast(typing.Optional[Wafv2WebAclDefaultActionAllow], jsii.get(self, "allowInput"))

    @builtins.property
    @jsii.member(jsii_name="blockInput")
    def block_input(self) -> typing.Optional[Wafv2WebAclDefaultActionBlock]:
        return typing.cast(typing.Optional[Wafv2WebAclDefaultActionBlock], jsii.get(self, "blockInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclDefaultAction]:
        return typing.cast(typing.Optional[Wafv2WebAclDefaultAction], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[Wafv2WebAclDefaultAction]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__19c6ff931fefd510a100f162291067d0c6d7b593feab6b8942983d6e573d3c5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRule",
    jsii_struct_bases=[],
    name_mapping={
        "name": "name",
        "priority": "priority",
        "visibility_config": "visibilityConfig",
        "action": "action",
        "captcha_config": "captchaConfig",
        "challenge_config": "challengeConfig",
        "override_action": "overrideAction",
        "rule_label": "ruleLabel",
        "statement": "statement",
    },
)
class Wafv2WebAclRule:
    def __init__(
        self,
        *,
        name: builtins.str,
        priority: jsii.Number,
        visibility_config: typing.Union["Wafv2WebAclRuleVisibilityConfig", typing.Dict[builtins.str, typing.Any]],
        action: typing.Optional[typing.Union["Wafv2WebAclRuleAction", typing.Dict[builtins.str, typing.Any]]] = None,
        captcha_config: typing.Optional[typing.Union["Wafv2WebAclRuleCaptchaConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        challenge_config: typing.Optional[typing.Union["Wafv2WebAclRuleChallengeConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        override_action: typing.Optional[typing.Union["Wafv2WebAclRuleOverrideAction", typing.Dict[builtins.str, typing.Any]]] = None,
        rule_label: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRuleRuleLabel", typing.Dict[builtins.str, typing.Any]]]]] = None,
        statement: typing.Any = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        :param priority: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#priority Wafv2WebAcl#priority}.
        :param visibility_config: visibility_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#visibility_config Wafv2WebAcl#visibility_config}
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#action Wafv2WebAcl#action}
        :param captcha_config: captcha_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha_config Wafv2WebAcl#captcha_config}
        :param challenge_config: challenge_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge_config Wafv2WebAcl#challenge_config}
        :param override_action: override_action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#override_action Wafv2WebAcl#override_action}
        :param rule_label: rule_label block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_label Wafv2WebAcl#rule_label}
        :param statement: statement block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#statement Wafv2WebAcl#statement}
        '''
        if isinstance(visibility_config, dict):
            visibility_config = Wafv2WebAclRuleVisibilityConfig(**visibility_config)
        if isinstance(action, dict):
            action = Wafv2WebAclRuleAction(**action)
        if isinstance(captcha_config, dict):
            captcha_config = Wafv2WebAclRuleCaptchaConfig(**captcha_config)
        if isinstance(challenge_config, dict):
            challenge_config = Wafv2WebAclRuleChallengeConfig(**challenge_config)
        if isinstance(override_action, dict):
            override_action = Wafv2WebAclRuleOverrideAction(**override_action)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1aa11800620dba229223290e234c15062db57c67ae1247296ae83cc7860780ef)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument priority", value=priority, expected_type=type_hints["priority"])
            check_type(argname="argument visibility_config", value=visibility_config, expected_type=type_hints["visibility_config"])
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument captcha_config", value=captcha_config, expected_type=type_hints["captcha_config"])
            check_type(argname="argument challenge_config", value=challenge_config, expected_type=type_hints["challenge_config"])
            check_type(argname="argument override_action", value=override_action, expected_type=type_hints["override_action"])
            check_type(argname="argument rule_label", value=rule_label, expected_type=type_hints["rule_label"])
            check_type(argname="argument statement", value=statement, expected_type=type_hints["statement"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "priority": priority,
            "visibility_config": visibility_config,
        }
        if action is not None:
            self._values["action"] = action
        if captcha_config is not None:
            self._values["captcha_config"] = captcha_config
        if challenge_config is not None:
            self._values["challenge_config"] = challenge_config
        if override_action is not None:
            self._values["override_action"] = override_action
        if rule_label is not None:
            self._values["rule_label"] = rule_label
        if statement is not None:
            self._values["statement"] = statement

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def priority(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#priority Wafv2WebAcl#priority}.'''
        result = self._values.get("priority")
        assert result is not None, "Required property 'priority' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def visibility_config(self) -> "Wafv2WebAclRuleVisibilityConfig":
        '''visibility_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#visibility_config Wafv2WebAcl#visibility_config}
        '''
        result = self._values.get("visibility_config")
        assert result is not None, "Required property 'visibility_config' is missing"
        return typing.cast("Wafv2WebAclRuleVisibilityConfig", result)

    @builtins.property
    def action(self) -> typing.Optional["Wafv2WebAclRuleAction"]:
        '''action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#action Wafv2WebAcl#action}
        '''
        result = self._values.get("action")
        return typing.cast(typing.Optional["Wafv2WebAclRuleAction"], result)

    @builtins.property
    def captcha_config(self) -> typing.Optional["Wafv2WebAclRuleCaptchaConfig"]:
        '''captcha_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha_config Wafv2WebAcl#captcha_config}
        '''
        result = self._values.get("captcha_config")
        return typing.cast(typing.Optional["Wafv2WebAclRuleCaptchaConfig"], result)

    @builtins.property
    def challenge_config(self) -> typing.Optional["Wafv2WebAclRuleChallengeConfig"]:
        '''challenge_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge_config Wafv2WebAcl#challenge_config}
        '''
        result = self._values.get("challenge_config")
        return typing.cast(typing.Optional["Wafv2WebAclRuleChallengeConfig"], result)

    @builtins.property
    def override_action(self) -> typing.Optional["Wafv2WebAclRuleOverrideAction"]:
        '''override_action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#override_action Wafv2WebAcl#override_action}
        '''
        result = self._values.get("override_action")
        return typing.cast(typing.Optional["Wafv2WebAclRuleOverrideAction"], result)

    @builtins.property
    def rule_label(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleRuleLabel"]]]:
        '''rule_label block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_label Wafv2WebAcl#rule_label}
        '''
        result = self._values.get("rule_label")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleRuleLabel"]]], result)

    @builtins.property
    def statement(self) -> typing.Any:
        '''statement block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#statement Wafv2WebAcl#statement}
        '''
        result = self._values.get("statement")
        return typing.cast(typing.Any, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRule(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleAction",
    jsii_struct_bases=[],
    name_mapping={
        "allow": "allow",
        "block": "block",
        "captcha": "captcha",
        "challenge": "challenge",
        "count": "count",
    },
)
class Wafv2WebAclRuleAction:
    def __init__(
        self,
        *,
        allow: typing.Optional[typing.Union["Wafv2WebAclRuleActionAllow", typing.Dict[builtins.str, typing.Any]]] = None,
        block: typing.Optional[typing.Union["Wafv2WebAclRuleActionBlock", typing.Dict[builtins.str, typing.Any]]] = None,
        captcha: typing.Optional[typing.Union["Wafv2WebAclRuleActionCaptcha", typing.Dict[builtins.str, typing.Any]]] = None,
        challenge: typing.Optional[typing.Union["Wafv2WebAclRuleActionChallenge", typing.Dict[builtins.str, typing.Any]]] = None,
        count: typing.Optional[typing.Union["Wafv2WebAclRuleActionCount", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param allow: allow block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#allow Wafv2WebAcl#allow}
        :param block: block block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#block Wafv2WebAcl#block}
        :param captcha: captcha block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha Wafv2WebAcl#captcha}
        :param challenge: challenge block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge Wafv2WebAcl#challenge}
        :param count: count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#count Wafv2WebAcl#count}
        '''
        if isinstance(allow, dict):
            allow = Wafv2WebAclRuleActionAllow(**allow)
        if isinstance(block, dict):
            block = Wafv2WebAclRuleActionBlock(**block)
        if isinstance(captcha, dict):
            captcha = Wafv2WebAclRuleActionCaptcha(**captcha)
        if isinstance(challenge, dict):
            challenge = Wafv2WebAclRuleActionChallenge(**challenge)
        if isinstance(count, dict):
            count = Wafv2WebAclRuleActionCount(**count)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01fa56be8d25c9af2d4e51d5b30dc340f02adb70028cf0d72c48da66e35a2bd1)
            check_type(argname="argument allow", value=allow, expected_type=type_hints["allow"])
            check_type(argname="argument block", value=block, expected_type=type_hints["block"])
            check_type(argname="argument captcha", value=captcha, expected_type=type_hints["captcha"])
            check_type(argname="argument challenge", value=challenge, expected_type=type_hints["challenge"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if allow is not None:
            self._values["allow"] = allow
        if block is not None:
            self._values["block"] = block
        if captcha is not None:
            self._values["captcha"] = captcha
        if challenge is not None:
            self._values["challenge"] = challenge
        if count is not None:
            self._values["count"] = count

    @builtins.property
    def allow(self) -> typing.Optional["Wafv2WebAclRuleActionAllow"]:
        '''allow block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#allow Wafv2WebAcl#allow}
        '''
        result = self._values.get("allow")
        return typing.cast(typing.Optional["Wafv2WebAclRuleActionAllow"], result)

    @builtins.property
    def block(self) -> typing.Optional["Wafv2WebAclRuleActionBlock"]:
        '''block block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#block Wafv2WebAcl#block}
        '''
        result = self._values.get("block")
        return typing.cast(typing.Optional["Wafv2WebAclRuleActionBlock"], result)

    @builtins.property
    def captcha(self) -> typing.Optional["Wafv2WebAclRuleActionCaptcha"]:
        '''captcha block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha Wafv2WebAcl#captcha}
        '''
        result = self._values.get("captcha")
        return typing.cast(typing.Optional["Wafv2WebAclRuleActionCaptcha"], result)

    @builtins.property
    def challenge(self) -> typing.Optional["Wafv2WebAclRuleActionChallenge"]:
        '''challenge block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge Wafv2WebAcl#challenge}
        '''
        result = self._values.get("challenge")
        return typing.cast(typing.Optional["Wafv2WebAclRuleActionChallenge"], result)

    @builtins.property
    def count(self) -> typing.Optional["Wafv2WebAclRuleActionCount"]:
        '''count block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#count Wafv2WebAcl#count}
        '''
        result = self._values.get("count")
        return typing.cast(typing.Optional["Wafv2WebAclRuleActionCount"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionAllow",
    jsii_struct_bases=[],
    name_mapping={"custom_request_handling": "customRequestHandling"},
)
class Wafv2WebAclRuleActionAllow:
    def __init__(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union["Wafv2WebAclRuleActionAllowCustomRequestHandling", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        if isinstance(custom_request_handling, dict):
            custom_request_handling = Wafv2WebAclRuleActionAllowCustomRequestHandling(**custom_request_handling)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8a8e5704360ba73a0de6973c13db775d8e6f62fa8f01fa8d8924d424fcf44bc)
            check_type(argname="argument custom_request_handling", value=custom_request_handling, expected_type=type_hints["custom_request_handling"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_request_handling is not None:
            self._values["custom_request_handling"] = custom_request_handling

    @builtins.property
    def custom_request_handling(
        self,
    ) -> typing.Optional["Wafv2WebAclRuleActionAllowCustomRequestHandling"]:
        '''custom_request_handling block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        result = self._values.get("custom_request_handling")
        return typing.cast(typing.Optional["Wafv2WebAclRuleActionAllowCustomRequestHandling"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionAllow(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionAllowCustomRequestHandling",
    jsii_struct_bases=[],
    name_mapping={"insert_header": "insertHeader"},
)
class Wafv2WebAclRuleActionAllowCustomRequestHandling:
    def __init__(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5cdc65327260e4f93b7a673a425eae5b3ccf15fd8438b5442de6c9af21807b9c)
            check_type(argname="argument insert_header", value=insert_header, expected_type=type_hints["insert_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insert_header": insert_header,
        }

    @builtins.property
    def insert_header(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader"]]:
        '''insert_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        result = self._values.get("insert_header")
        assert result is not None, "Required property 'insert_header' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionAllowCustomRequestHandling(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df0761870345f0679d492cfc53cb4a95adac27f15a4f893bd76a62313caf4f94)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f678ec7aa9446db7eef5382cd2943ac9604e105e28e12065b166b39ae1b28f01)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0e2a00b02712a3563bde00128f3596f70ad75adc8ae7cee53fcd56b591945f9)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c98405ad7389f3fb789fc0512c9688e3e38000584fb050644158d64bec51bd7a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bf627d54ac02ee0d2396df361ab60ae2b7a6da2ccb4fa9b3be87671e85e67f39)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e5377b1371871a4aa65d067eecff8d3b9b93a1f2b000fc904dd9ee072ae77976)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5f5cd29a17e5d906dce97cbf6afa2b9c060edf13b526fe123a125d373ad98f68)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7d49ae94e5a84907ac9935cbb4f7ed6cff226b0695900d70dd415d2575262926)
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
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fbb33fb6067a53d5d887bf9cde4df70a39a2b20ec548b7d8b4531a3cc30fb59d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a35c0a233383b35bd6d167f6f952712a1b13f66de44f900e205d4cbcc557a2b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af1ab7254bc6d3346a6bd37d3fee4300ef1dbd6518844e89aa3ab12896d916e2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionAllowCustomRequestHandlingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionAllowCustomRequestHandlingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fc87c56130976b5a24d730665417a03472338c056ef9860591e58f9ba1ffef7e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInsertHeader")
    def put_insert_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c1686844be5ee029db86b2fa715bd93d55a195923ae17c9c36d39e27e52fab7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInsertHeader", [value]))

    @builtins.property
    @jsii.member(jsii_name="insertHeader")
    def insert_header(
        self,
    ) -> Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeaderList:
        return typing.cast(Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeaderList, jsii.get(self, "insertHeader"))

    @builtins.property
    @jsii.member(jsii_name="insertHeaderInput")
    def insert_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader]]], jsii.get(self, "insertHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleActionAllowCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionAllowCustomRequestHandling], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleActionAllowCustomRequestHandling],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7140a79eb925937016b0d6e0f9d6125c74d093c9a25ea2ff2d49e650287dde9b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionAllowOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionAllowOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8a212c8d81f9ec2b3e8c0db1916988d9d575903d296c47a111625a53b29380cd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomRequestHandling")
    def put_custom_request_handling(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        value = Wafv2WebAclRuleActionAllowCustomRequestHandling(
            insert_header=insert_header
        )

        return typing.cast(None, jsii.invoke(self, "putCustomRequestHandling", [value]))

    @jsii.member(jsii_name="resetCustomRequestHandling")
    def reset_custom_request_handling(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomRequestHandling", []))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandling")
    def custom_request_handling(
        self,
    ) -> Wafv2WebAclRuleActionAllowCustomRequestHandlingOutputReference:
        return typing.cast(Wafv2WebAclRuleActionAllowCustomRequestHandlingOutputReference, jsii.get(self, "customRequestHandling"))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandlingInput")
    def custom_request_handling_input(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleActionAllowCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionAllowCustomRequestHandling], jsii.get(self, "customRequestHandlingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleActionAllow]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionAllow], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleActionAllow],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a953437038c6badda026e0d91ec24649d69c3c62a41d859c69c51533acc6785)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionBlock",
    jsii_struct_bases=[],
    name_mapping={"custom_response": "customResponse"},
)
class Wafv2WebAclRuleActionBlock:
    def __init__(
        self,
        *,
        custom_response: typing.Optional[typing.Union["Wafv2WebAclRuleActionBlockCustomResponse", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_response: custom_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response Wafv2WebAcl#custom_response}
        '''
        if isinstance(custom_response, dict):
            custom_response = Wafv2WebAclRuleActionBlockCustomResponse(**custom_response)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa27f689f2654baaf5402f6f3d82338cb4f055beeea06cbfd8334f8ab85c4415)
            check_type(argname="argument custom_response", value=custom_response, expected_type=type_hints["custom_response"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_response is not None:
            self._values["custom_response"] = custom_response

    @builtins.property
    def custom_response(
        self,
    ) -> typing.Optional["Wafv2WebAclRuleActionBlockCustomResponse"]:
        '''custom_response block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response Wafv2WebAcl#custom_response}
        '''
        result = self._values.get("custom_response")
        return typing.cast(typing.Optional["Wafv2WebAclRuleActionBlockCustomResponse"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionBlock(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionBlockCustomResponse",
    jsii_struct_bases=[],
    name_mapping={
        "response_code": "responseCode",
        "custom_response_body_key": "customResponseBodyKey",
        "response_header": "responseHeader",
    },
)
class Wafv2WebAclRuleActionBlockCustomResponse:
    def __init__(
        self,
        *,
        response_code: jsii.Number,
        custom_response_body_key: typing.Optional[builtins.str] = None,
        response_header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRuleActionBlockCustomResponseResponseHeader", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param response_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_code Wafv2WebAcl#response_code}.
        :param custom_response_body_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body_key Wafv2WebAcl#custom_response_body_key}.
        :param response_header: response_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_header Wafv2WebAcl#response_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a9634bee3f6fbd084a93a782653be6267334e2cdad7a4e4fcfe115524c8ed1a)
            check_type(argname="argument response_code", value=response_code, expected_type=type_hints["response_code"])
            check_type(argname="argument custom_response_body_key", value=custom_response_body_key, expected_type=type_hints["custom_response_body_key"])
            check_type(argname="argument response_header", value=response_header, expected_type=type_hints["response_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "response_code": response_code,
        }
        if custom_response_body_key is not None:
            self._values["custom_response_body_key"] = custom_response_body_key
        if response_header is not None:
            self._values["response_header"] = response_header

    @builtins.property
    def response_code(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_code Wafv2WebAcl#response_code}.'''
        result = self._values.get("response_code")
        assert result is not None, "Required property 'response_code' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def custom_response_body_key(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body_key Wafv2WebAcl#custom_response_body_key}.'''
        result = self._values.get("custom_response_body_key")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def response_header(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionBlockCustomResponseResponseHeader"]]]:
        '''response_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_header Wafv2WebAcl#response_header}
        '''
        result = self._values.get("response_header")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionBlockCustomResponseResponseHeader"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionBlockCustomResponse(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleActionBlockCustomResponseOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionBlockCustomResponseOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0069b9260fbad328fadfe53a10453c704024c26d7675916922d82a66bdec3700)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putResponseHeader")
    def put_response_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRuleActionBlockCustomResponseResponseHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67f9151d1c750132a01946ab1f731e969c2fa38d64052c3945a64dfac473dccd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResponseHeader", [value]))

    @jsii.member(jsii_name="resetCustomResponseBodyKey")
    def reset_custom_response_body_key(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomResponseBodyKey", []))

    @jsii.member(jsii_name="resetResponseHeader")
    def reset_response_header(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResponseHeader", []))

    @builtins.property
    @jsii.member(jsii_name="responseHeader")
    def response_header(
        self,
    ) -> "Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderList":
        return typing.cast("Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderList", jsii.get(self, "responseHeader"))

    @builtins.property
    @jsii.member(jsii_name="customResponseBodyKeyInput")
    def custom_response_body_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "customResponseBodyKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="responseCodeInput")
    def response_code_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "responseCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="responseHeaderInput")
    def response_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionBlockCustomResponseResponseHeader"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionBlockCustomResponseResponseHeader"]]], jsii.get(self, "responseHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="customResponseBodyKey")
    def custom_response_body_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customResponseBodyKey"))

    @custom_response_body_key.setter
    def custom_response_body_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b30779274a234d0de4240c2c915cb7d8da7597e70766ee2317d199030b75863e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customResponseBodyKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="responseCode")
    def response_code(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "responseCode"))

    @response_code.setter
    def response_code(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5887b2c27accf7a2ad13167379b4545fa37aaee98ec1a993e84b07fc6d9a995c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "responseCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleActionBlockCustomResponse]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionBlockCustomResponse], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleActionBlockCustomResponse],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4f79c3228a01f0bbe1dbc85146dc45d4e8395a88d72b8ae7bc175b074d01698)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionBlockCustomResponseResponseHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2WebAclRuleActionBlockCustomResponseResponseHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__418a04d23e4bfc75a109d6cfb6c9876ea45b30b679cd02fee1e8e305aa013f24)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionBlockCustomResponseResponseHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e3b146fc3afeaeb366580f5192d1ebcec1b377338ead8024f0514520080b2d45)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e8b4bbf854e52f5c5c09f48392f7ba140984e06036f09ef2dcc2915b9a7a3db)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32d9f9c49b7d0cdbdd875beb489399256e4a9d529e9af83f1088528406641338)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6e176304627238a8b3763fa0a4af013629a1867b10dffb9550cdeefeae9f8f24)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2d64ad5f6c290a969d919aa557ec3ac3642e72b6136b7313ac583b94c44a2126)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionBlockCustomResponseResponseHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionBlockCustomResponseResponseHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionBlockCustomResponseResponseHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2e6aac0d5b08a051df3b0ca9be80947a093d97b84bf261dbd1b1753c8da4f4ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__670e2ce2d6399a108318159a0b633f8c0638f575d14ee81b7e1fae0101f705f3)
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
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c62d3077e72e00693abd91c9bf6aacd86031de94814b4b533c8e5850103e741)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e02bf71cce5c473fd15c7c2778643b021123e3f6659b9cb19fd64e89395112ca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionBlockCustomResponseResponseHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionBlockCustomResponseResponseHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionBlockCustomResponseResponseHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f1cb812036d98f878f4fee055e7890045d158a643a5a22334d88763a4ace16b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionBlockOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionBlockOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b57fd3ac3291c912859a6f744cdf074298ce6f13b82b7018f523962b9c23cd53)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomResponse")
    def put_custom_response(
        self,
        *,
        response_code: jsii.Number,
        custom_response_body_key: typing.Optional[builtins.str] = None,
        response_header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionBlockCustomResponseResponseHeader, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param response_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_code Wafv2WebAcl#response_code}.
        :param custom_response_body_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body_key Wafv2WebAcl#custom_response_body_key}.
        :param response_header: response_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_header Wafv2WebAcl#response_header}
        '''
        value = Wafv2WebAclRuleActionBlockCustomResponse(
            response_code=response_code,
            custom_response_body_key=custom_response_body_key,
            response_header=response_header,
        )

        return typing.cast(None, jsii.invoke(self, "putCustomResponse", [value]))

    @jsii.member(jsii_name="resetCustomResponse")
    def reset_custom_response(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomResponse", []))

    @builtins.property
    @jsii.member(jsii_name="customResponse")
    def custom_response(
        self,
    ) -> Wafv2WebAclRuleActionBlockCustomResponseOutputReference:
        return typing.cast(Wafv2WebAclRuleActionBlockCustomResponseOutputReference, jsii.get(self, "customResponse"))

    @builtins.property
    @jsii.member(jsii_name="customResponseInput")
    def custom_response_input(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleActionBlockCustomResponse]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionBlockCustomResponse], jsii.get(self, "customResponseInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleActionBlock]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionBlock], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleActionBlock],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41a84bb42e46f505c7162c54b08712402a60df8f566f2e10088b58d86adf5147)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCaptcha",
    jsii_struct_bases=[],
    name_mapping={"custom_request_handling": "customRequestHandling"},
)
class Wafv2WebAclRuleActionCaptcha:
    def __init__(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union["Wafv2WebAclRuleActionCaptchaCustomRequestHandling", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        if isinstance(custom_request_handling, dict):
            custom_request_handling = Wafv2WebAclRuleActionCaptchaCustomRequestHandling(**custom_request_handling)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42d2c51239ccdf5bb447332874b47b5e6203f27bfceb40cae1526397f3567c19)
            check_type(argname="argument custom_request_handling", value=custom_request_handling, expected_type=type_hints["custom_request_handling"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_request_handling is not None:
            self._values["custom_request_handling"] = custom_request_handling

    @builtins.property
    def custom_request_handling(
        self,
    ) -> typing.Optional["Wafv2WebAclRuleActionCaptchaCustomRequestHandling"]:
        '''custom_request_handling block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        result = self._values.get("custom_request_handling")
        return typing.cast(typing.Optional["Wafv2WebAclRuleActionCaptchaCustomRequestHandling"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionCaptcha(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCaptchaCustomRequestHandling",
    jsii_struct_bases=[],
    name_mapping={"insert_header": "insertHeader"},
)
class Wafv2WebAclRuleActionCaptchaCustomRequestHandling:
    def __init__(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ecd6b3408ec1a77a7f2633c128c901388c6f35d641bcca32977a4c7bf4147db3)
            check_type(argname="argument insert_header", value=insert_header, expected_type=type_hints["insert_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insert_header": insert_header,
        }

    @builtins.property
    def insert_header(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader"]]:
        '''insert_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        result = self._values.get("insert_header")
        assert result is not None, "Required property 'insert_header' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionCaptchaCustomRequestHandling(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6a66a14c6bd48397cfbbbb16d94cd53c2cdf413f8150f1fdc2e9a9f3ae39c0a)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5fc631dbd029929d51e7a5c3823bcccd353f65c8b483efaa961f1e8b1781f3fc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__70a1cfcc22b8f3ab475cbb1df555b164d3ccfff58651bc990eb193882d87fe1e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42ad57a5f361f133d1edee030199d5538b074be80b148a39ec5d8b43cea5bbc6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b1c9106eef1e815fca08f01c7ebfd7a5593e10c5b38470c13de8f33885c0878e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6fcc4d5a40f5c356b5cf383376befa5c6e97300b33ff801ed07f7825151a7e1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1355c62f879aea61dfe4df5af0bf7922474e98ac2fc4420e909d1645b2c84e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d656430a38f353422d8956005731b2f9122ead31eca52b5f8fce7c5132bd8f2c)
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
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c744fb39b54e693b4782c3bb018debb05d620930ae6399f33480886416b0279c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08756486289590a2c395e9fffefaf7c3fb492bcb27162f7534b85e0fb079699e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__69ac5b1c87362c246266abc3873b3541a3563ee39179b3598e064c68246cb3fa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionCaptchaCustomRequestHandlingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCaptchaCustomRequestHandlingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__da26be1279395aa158ea502ba264186d9226193b4255dbfb8a7bbf6fff423788)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInsertHeader")
    def put_insert_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd23e27fd70b10365d6c8a1d452dfc2190caf99d20fc1cc8bfb863eed34e911d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInsertHeader", [value]))

    @builtins.property
    @jsii.member(jsii_name="insertHeader")
    def insert_header(
        self,
    ) -> Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeaderList:
        return typing.cast(Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeaderList, jsii.get(self, "insertHeader"))

    @builtins.property
    @jsii.member(jsii_name="insertHeaderInput")
    def insert_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader]]], jsii.get(self, "insertHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleActionCaptchaCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionCaptchaCustomRequestHandling], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleActionCaptchaCustomRequestHandling],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ac566e21f1685f9f2b0a9af19049432540ecda39af8892ab08175e9c4241a73)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionCaptchaOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCaptchaOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__59431a6bc2ba191eff09e9fb42309b9d869ecbf241123f6c28572ee0a21c26c4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomRequestHandling")
    def put_custom_request_handling(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        value = Wafv2WebAclRuleActionCaptchaCustomRequestHandling(
            insert_header=insert_header
        )

        return typing.cast(None, jsii.invoke(self, "putCustomRequestHandling", [value]))

    @jsii.member(jsii_name="resetCustomRequestHandling")
    def reset_custom_request_handling(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomRequestHandling", []))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandling")
    def custom_request_handling(
        self,
    ) -> Wafv2WebAclRuleActionCaptchaCustomRequestHandlingOutputReference:
        return typing.cast(Wafv2WebAclRuleActionCaptchaCustomRequestHandlingOutputReference, jsii.get(self, "customRequestHandling"))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandlingInput")
    def custom_request_handling_input(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleActionCaptchaCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionCaptchaCustomRequestHandling], jsii.get(self, "customRequestHandlingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleActionCaptcha]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionCaptcha], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleActionCaptcha],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ea796c8cbebe7e6d17bb01ac305b0be8a40231b0b35cea34cfacd9f605a7c50)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionChallenge",
    jsii_struct_bases=[],
    name_mapping={"custom_request_handling": "customRequestHandling"},
)
class Wafv2WebAclRuleActionChallenge:
    def __init__(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union["Wafv2WebAclRuleActionChallengeCustomRequestHandling", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        if isinstance(custom_request_handling, dict):
            custom_request_handling = Wafv2WebAclRuleActionChallengeCustomRequestHandling(**custom_request_handling)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ace5c6da8d92b644e19923af7d2b0ac2c04f6000268d81ad022cc26c0bfce294)
            check_type(argname="argument custom_request_handling", value=custom_request_handling, expected_type=type_hints["custom_request_handling"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_request_handling is not None:
            self._values["custom_request_handling"] = custom_request_handling

    @builtins.property
    def custom_request_handling(
        self,
    ) -> typing.Optional["Wafv2WebAclRuleActionChallengeCustomRequestHandling"]:
        '''custom_request_handling block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        result = self._values.get("custom_request_handling")
        return typing.cast(typing.Optional["Wafv2WebAclRuleActionChallengeCustomRequestHandling"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionChallenge(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionChallengeCustomRequestHandling",
    jsii_struct_bases=[],
    name_mapping={"insert_header": "insertHeader"},
)
class Wafv2WebAclRuleActionChallengeCustomRequestHandling:
    def __init__(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1677690d72ee46c8ec7718e9794cde2a214123531766aebf2816b4bf266f3793)
            check_type(argname="argument insert_header", value=insert_header, expected_type=type_hints["insert_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insert_header": insert_header,
        }

    @builtins.property
    def insert_header(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader"]]:
        '''insert_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        result = self._values.get("insert_header")
        assert result is not None, "Required property 'insert_header' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionChallengeCustomRequestHandling(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b07aab258bf1630dad99639f39edaa23bce6aa6f17e1b3cebf615a094fdc538a)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__374d8498bc6fbd5c7ca46250f30c777b8aadb1752c56578bc18ef713a7ce3e9a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8dab096ca1be202753559995e25f059acfe90a66bcb0a8ad2e83b34ad79199a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__192a52a41ec80cfd1ff364c333795617dd6093135bcf330b00f8ff45c915e4e5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__eb3599655b4932e5210a9e284b748fee00177210524a84d20f58c0cd9292f81d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__200a14a487947265af47b6de1e89e25870556dc9f3a4fa28fb9b57b3171ba463)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85e9c36e7214cb6cd2aa22d15c09f050cdab87cd5e60fc4ac017c96c89f597c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__30849916d7470dc24eccd52e75d0dbd533c85e0b8592304df430834216a61ba8)
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
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01faad36359e7edabda4bc3e514f9f3c1485a61914751d960fbd94d348f61f8f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__36d4b864bb0133137ee315c77e796f99ad3f1fd2a2578832c62a198fa13fd88e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf29f52e0235ddf7dbc6743ddcc02c6c357f335e7207ccb138bcc349da03ee90)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionChallengeCustomRequestHandlingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionChallengeCustomRequestHandlingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e3afa17c9543de2e4285a1dec550a91df2e3d3027bb96ed3cec7ca64a2daedbc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInsertHeader")
    def put_insert_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4bb5cd7a477f004d362c4c167e88fa40652ff43d7c61261ddad239996ada3400)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInsertHeader", [value]))

    @builtins.property
    @jsii.member(jsii_name="insertHeader")
    def insert_header(
        self,
    ) -> Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeaderList:
        return typing.cast(Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeaderList, jsii.get(self, "insertHeader"))

    @builtins.property
    @jsii.member(jsii_name="insertHeaderInput")
    def insert_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader]]], jsii.get(self, "insertHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleActionChallengeCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionChallengeCustomRequestHandling], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleActionChallengeCustomRequestHandling],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e3d69f87cf78c0dcea048f2f09d39984c9b69d567e56981683f1b3a2176e528)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionChallengeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionChallengeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d20f7779e7eed05a830f813df7728b133adf204ba0c7e77a77998e9a20411db4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomRequestHandling")
    def put_custom_request_handling(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        value = Wafv2WebAclRuleActionChallengeCustomRequestHandling(
            insert_header=insert_header
        )

        return typing.cast(None, jsii.invoke(self, "putCustomRequestHandling", [value]))

    @jsii.member(jsii_name="resetCustomRequestHandling")
    def reset_custom_request_handling(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomRequestHandling", []))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandling")
    def custom_request_handling(
        self,
    ) -> Wafv2WebAclRuleActionChallengeCustomRequestHandlingOutputReference:
        return typing.cast(Wafv2WebAclRuleActionChallengeCustomRequestHandlingOutputReference, jsii.get(self, "customRequestHandling"))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandlingInput")
    def custom_request_handling_input(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleActionChallengeCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionChallengeCustomRequestHandling], jsii.get(self, "customRequestHandlingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleActionChallenge]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionChallenge], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleActionChallenge],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__317a6235f655d1d6badc971f3c62519fbf8da3274586e65d03c2add84fbee9b7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCount",
    jsii_struct_bases=[],
    name_mapping={"custom_request_handling": "customRequestHandling"},
)
class Wafv2WebAclRuleActionCount:
    def __init__(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union["Wafv2WebAclRuleActionCountCustomRequestHandling", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        if isinstance(custom_request_handling, dict):
            custom_request_handling = Wafv2WebAclRuleActionCountCustomRequestHandling(**custom_request_handling)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59548aca1b7a773ff9616bbc8de99150df8b7c1e3893c407c6eaf16dacb730be)
            check_type(argname="argument custom_request_handling", value=custom_request_handling, expected_type=type_hints["custom_request_handling"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_request_handling is not None:
            self._values["custom_request_handling"] = custom_request_handling

    @builtins.property
    def custom_request_handling(
        self,
    ) -> typing.Optional["Wafv2WebAclRuleActionCountCustomRequestHandling"]:
        '''custom_request_handling block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        result = self._values.get("custom_request_handling")
        return typing.cast(typing.Optional["Wafv2WebAclRuleActionCountCustomRequestHandling"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionCount(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCountCustomRequestHandling",
    jsii_struct_bases=[],
    name_mapping={"insert_header": "insertHeader"},
)
class Wafv2WebAclRuleActionCountCustomRequestHandling:
    def __init__(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__31c40dbb928a64245a7acb7baff63ad162571df1af3868433c06881f1a6ec61b)
            check_type(argname="argument insert_header", value=insert_header, expected_type=type_hints["insert_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insert_header": insert_header,
        }

    @builtins.property
    def insert_header(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader"]]:
        '''insert_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        result = self._values.get("insert_header")
        assert result is not None, "Required property 'insert_header' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionCountCustomRequestHandling(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca9b1b54a3639c79adbf27dcae1545df6ab78280149e8bbd99153e342e207d1a)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#value Wafv2WebAcl#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8d3b21a0fad9bf18e718a07762b976e161176917ffda3a2cbce16b473a410b62)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aaf4065c8fc77a1139c708c6aa2533035a2d344a45e059184bb174bdda70d677)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__77493beee854d2c1d2ec828266af0b66f1783b3e5adba3936004dfd1baf191d6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__50dfe9c53604ac92e9171cba3be7849edf238eef3185ac19b7978c88cf0f0bf0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__237fe588fe988f04cfbe7f2baac45e562eb171e9b7d660e72af2c48b1807dbf1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__754ba0026011e9c69ced9cf880c1260b64a84cc6a026429b461f85e1135ae4a7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7e9e91e658476ce510a0294b4eef0d2ec4978ff2525a02c689d846254a949d4e)
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
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f941ec9ca4bd394d477a86acca338a3d4d30879205d868f3ac2922c834c6aa03)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49832546194a96ebc3ff950a881459fd69e1271975fcdcfdabb06b92aeb7eab9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd7a22ccad84acfd4a687eff6b13c12c57626a1c99027a5dfdceb3aa35d430c9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionCountCustomRequestHandlingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCountCustomRequestHandlingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f1e88776ae5ff27010682c020118bec80908c453fd0440a04c15b965002c5ceb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInsertHeader")
    def put_insert_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7963ea60ae763cceae9cb5b23466825c2631635b780d6b69929bdf8f42f57868)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInsertHeader", [value]))

    @builtins.property
    @jsii.member(jsii_name="insertHeader")
    def insert_header(
        self,
    ) -> Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeaderList:
        return typing.cast(Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeaderList, jsii.get(self, "insertHeader"))

    @builtins.property
    @jsii.member(jsii_name="insertHeaderInput")
    def insert_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader]]], jsii.get(self, "insertHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleActionCountCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionCountCustomRequestHandling], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleActionCountCustomRequestHandling],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7b9f27ca5357d6f7f513e68bcbaa4401f5276bc2eef704ba0c9d9c05b888148)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionCountOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionCountOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__501bc985fefd732b4c66910d2a1f50abebfd880a63434d0893c36b7687bece5e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomRequestHandling")
    def put_custom_request_handling(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#insert_header Wafv2WebAcl#insert_header}
        '''
        value = Wafv2WebAclRuleActionCountCustomRequestHandling(
            insert_header=insert_header
        )

        return typing.cast(None, jsii.invoke(self, "putCustomRequestHandling", [value]))

    @jsii.member(jsii_name="resetCustomRequestHandling")
    def reset_custom_request_handling(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomRequestHandling", []))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandling")
    def custom_request_handling(
        self,
    ) -> Wafv2WebAclRuleActionCountCustomRequestHandlingOutputReference:
        return typing.cast(Wafv2WebAclRuleActionCountCustomRequestHandlingOutputReference, jsii.get(self, "customRequestHandling"))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandlingInput")
    def custom_request_handling_input(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleActionCountCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionCountCustomRequestHandling], jsii.get(self, "customRequestHandlingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleActionCount]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionCount], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleActionCount],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d34d6028a8ca2cd7b9782e3eca6abb21119799b5b845b287060b4ca49a89446)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ddf782145cb271e0454c812fad91241f67aed1a98eb01cf17aef9e3cfe9fe000)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAllow")
    def put_allow(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union[Wafv2WebAclRuleActionAllowCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        value = Wafv2WebAclRuleActionAllow(
            custom_request_handling=custom_request_handling
        )

        return typing.cast(None, jsii.invoke(self, "putAllow", [value]))

    @jsii.member(jsii_name="putBlock")
    def put_block(
        self,
        *,
        custom_response: typing.Optional[typing.Union[Wafv2WebAclRuleActionBlockCustomResponse, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_response: custom_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response Wafv2WebAcl#custom_response}
        '''
        value = Wafv2WebAclRuleActionBlock(custom_response=custom_response)

        return typing.cast(None, jsii.invoke(self, "putBlock", [value]))

    @jsii.member(jsii_name="putCaptcha")
    def put_captcha(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union[Wafv2WebAclRuleActionCaptchaCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        value = Wafv2WebAclRuleActionCaptcha(
            custom_request_handling=custom_request_handling
        )

        return typing.cast(None, jsii.invoke(self, "putCaptcha", [value]))

    @jsii.member(jsii_name="putChallenge")
    def put_challenge(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union[Wafv2WebAclRuleActionChallengeCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        value = Wafv2WebAclRuleActionChallenge(
            custom_request_handling=custom_request_handling
        )

        return typing.cast(None, jsii.invoke(self, "putChallenge", [value]))

    @jsii.member(jsii_name="putCount")
    def put_count(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union[Wafv2WebAclRuleActionCountCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
        '''
        value = Wafv2WebAclRuleActionCount(
            custom_request_handling=custom_request_handling
        )

        return typing.cast(None, jsii.invoke(self, "putCount", [value]))

    @jsii.member(jsii_name="resetAllow")
    def reset_allow(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllow", []))

    @jsii.member(jsii_name="resetBlock")
    def reset_block(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBlock", []))

    @jsii.member(jsii_name="resetCaptcha")
    def reset_captcha(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCaptcha", []))

    @jsii.member(jsii_name="resetChallenge")
    def reset_challenge(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetChallenge", []))

    @jsii.member(jsii_name="resetCount")
    def reset_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCount", []))

    @builtins.property
    @jsii.member(jsii_name="allow")
    def allow(self) -> Wafv2WebAclRuleActionAllowOutputReference:
        return typing.cast(Wafv2WebAclRuleActionAllowOutputReference, jsii.get(self, "allow"))

    @builtins.property
    @jsii.member(jsii_name="block")
    def block(self) -> Wafv2WebAclRuleActionBlockOutputReference:
        return typing.cast(Wafv2WebAclRuleActionBlockOutputReference, jsii.get(self, "block"))

    @builtins.property
    @jsii.member(jsii_name="captcha")
    def captcha(self) -> Wafv2WebAclRuleActionCaptchaOutputReference:
        return typing.cast(Wafv2WebAclRuleActionCaptchaOutputReference, jsii.get(self, "captcha"))

    @builtins.property
    @jsii.member(jsii_name="challenge")
    def challenge(self) -> Wafv2WebAclRuleActionChallengeOutputReference:
        return typing.cast(Wafv2WebAclRuleActionChallengeOutputReference, jsii.get(self, "challenge"))

    @builtins.property
    @jsii.member(jsii_name="count")
    def count(self) -> Wafv2WebAclRuleActionCountOutputReference:
        return typing.cast(Wafv2WebAclRuleActionCountOutputReference, jsii.get(self, "count"))

    @builtins.property
    @jsii.member(jsii_name="allowInput")
    def allow_input(self) -> typing.Optional[Wafv2WebAclRuleActionAllow]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionAllow], jsii.get(self, "allowInput"))

    @builtins.property
    @jsii.member(jsii_name="blockInput")
    def block_input(self) -> typing.Optional[Wafv2WebAclRuleActionBlock]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionBlock], jsii.get(self, "blockInput"))

    @builtins.property
    @jsii.member(jsii_name="captchaInput")
    def captcha_input(self) -> typing.Optional[Wafv2WebAclRuleActionCaptcha]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionCaptcha], jsii.get(self, "captchaInput"))

    @builtins.property
    @jsii.member(jsii_name="challengeInput")
    def challenge_input(self) -> typing.Optional[Wafv2WebAclRuleActionChallenge]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionChallenge], jsii.get(self, "challengeInput"))

    @builtins.property
    @jsii.member(jsii_name="countInput")
    def count_input(self) -> typing.Optional[Wafv2WebAclRuleActionCount]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleActionCount], jsii.get(self, "countInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleAction]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleAction], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[Wafv2WebAclRuleAction]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3f0e1cd3c65142f3f93c2459ddefd85cd380dff9f5151a5ba119df559bce4c9b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleCaptchaConfig",
    jsii_struct_bases=[],
    name_mapping={"immunity_time_property": "immunityTimeProperty"},
)
class Wafv2WebAclRuleCaptchaConfig:
    def __init__(
        self,
        *,
        immunity_time_property: typing.Optional[typing.Union["Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param immunity_time_property: immunity_time_property block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        if isinstance(immunity_time_property, dict):
            immunity_time_property = Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty(**immunity_time_property)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c56cce68b8bc359043c8b8daa9b7d093dc90e86cec36d200410a6f5298c89855)
            check_type(argname="argument immunity_time_property", value=immunity_time_property, expected_type=type_hints["immunity_time_property"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if immunity_time_property is not None:
            self._values["immunity_time_property"] = immunity_time_property

    @builtins.property
    def immunity_time_property(
        self,
    ) -> typing.Optional["Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty"]:
        '''immunity_time_property block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        result = self._values.get("immunity_time_property")
        return typing.cast(typing.Optional["Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleCaptchaConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty",
    jsii_struct_bases=[],
    name_mapping={"immunity_time": "immunityTime"},
)
class Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty:
    def __init__(self, *, immunity_time: typing.Optional[jsii.Number] = None) -> None:
        '''
        :param immunity_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e24eeb203ef6bfea61320119c7357a297fd55c6d128b7ab414eed4a978dff9e)
            check_type(argname="argument immunity_time", value=immunity_time, expected_type=type_hints["immunity_time"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if immunity_time is not None:
            self._values["immunity_time"] = immunity_time

    @builtins.property
    def immunity_time(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.'''
        result = self._values.get("immunity_time")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleCaptchaConfigImmunityTimePropertyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleCaptchaConfigImmunityTimePropertyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3106a19804531978812407e768156bb9eb0dfee477258d760d86d510f968a7d8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetImmunityTime")
    def reset_immunity_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImmunityTime", []))

    @builtins.property
    @jsii.member(jsii_name="immunityTimeInput")
    def immunity_time_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "immunityTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="immunityTime")
    def immunity_time(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "immunityTime"))

    @immunity_time.setter
    def immunity_time(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7302bd9361f15fb515dddb9a5f4747e2478f81e3bf18eeda3139f72445683a63)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "immunityTime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ea989a65a0b4c82b35b4fbee680a259581a761cd59ef2d53f2b8a763b841327)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleCaptchaConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleCaptchaConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ea08212713474d4165d6fff8bec071dc04b663d129ca971d2e49f548e003e426)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putImmunityTimeProperty")
    def put_immunity_time_property(
        self,
        *,
        immunity_time: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param immunity_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.
        '''
        value = Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty(
            immunity_time=immunity_time
        )

        return typing.cast(None, jsii.invoke(self, "putImmunityTimeProperty", [value]))

    @jsii.member(jsii_name="resetImmunityTimeProperty")
    def reset_immunity_time_property(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImmunityTimeProperty", []))

    @builtins.property
    @jsii.member(jsii_name="immunityTimeProperty")
    def immunity_time_property(
        self,
    ) -> Wafv2WebAclRuleCaptchaConfigImmunityTimePropertyOutputReference:
        return typing.cast(Wafv2WebAclRuleCaptchaConfigImmunityTimePropertyOutputReference, jsii.get(self, "immunityTimeProperty"))

    @builtins.property
    @jsii.member(jsii_name="immunityTimePropertyInput")
    def immunity_time_property_input(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty], jsii.get(self, "immunityTimePropertyInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleCaptchaConfig]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleCaptchaConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleCaptchaConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c69c500b9e19975bc425f03f8aea6316a7fbebeb912b92536505f009cb82bbe8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleChallengeConfig",
    jsii_struct_bases=[],
    name_mapping={"immunity_time_property": "immunityTimeProperty"},
)
class Wafv2WebAclRuleChallengeConfig:
    def __init__(
        self,
        *,
        immunity_time_property: typing.Optional[typing.Union["Wafv2WebAclRuleChallengeConfigImmunityTimeProperty", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param immunity_time_property: immunity_time_property block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        if isinstance(immunity_time_property, dict):
            immunity_time_property = Wafv2WebAclRuleChallengeConfigImmunityTimeProperty(**immunity_time_property)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c94954b3ac454547df29dd5bc676b18bcfabcfed5dec38b7c3d43267d1eec1f)
            check_type(argname="argument immunity_time_property", value=immunity_time_property, expected_type=type_hints["immunity_time_property"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if immunity_time_property is not None:
            self._values["immunity_time_property"] = immunity_time_property

    @builtins.property
    def immunity_time_property(
        self,
    ) -> typing.Optional["Wafv2WebAclRuleChallengeConfigImmunityTimeProperty"]:
        '''immunity_time_property block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        result = self._values.get("immunity_time_property")
        return typing.cast(typing.Optional["Wafv2WebAclRuleChallengeConfigImmunityTimeProperty"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleChallengeConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleChallengeConfigImmunityTimeProperty",
    jsii_struct_bases=[],
    name_mapping={"immunity_time": "immunityTime"},
)
class Wafv2WebAclRuleChallengeConfigImmunityTimeProperty:
    def __init__(self, *, immunity_time: typing.Optional[jsii.Number] = None) -> None:
        '''
        :param immunity_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abbefc725330c98192b8ca2b52fe365fed21437a9d09eaa850f73443b2ade8c2)
            check_type(argname="argument immunity_time", value=immunity_time, expected_type=type_hints["immunity_time"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if immunity_time is not None:
            self._values["immunity_time"] = immunity_time

    @builtins.property
    def immunity_time(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.'''
        result = self._values.get("immunity_time")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleChallengeConfigImmunityTimeProperty(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleChallengeConfigImmunityTimePropertyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleChallengeConfigImmunityTimePropertyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__91e0851c0e0d7fb3841e5b1da1e5473a3e6ccdd27c8eb21151a5ee8cf0c3d834)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetImmunityTime")
    def reset_immunity_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImmunityTime", []))

    @builtins.property
    @jsii.member(jsii_name="immunityTimeInput")
    def immunity_time_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "immunityTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="immunityTime")
    def immunity_time(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "immunityTime"))

    @immunity_time.setter
    def immunity_time(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4cc2cdf8bd5335233ddeb1691ec7cf8a923ae99db2abdab449c0febcb0e8f1d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "immunityTime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleChallengeConfigImmunityTimeProperty]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleChallengeConfigImmunityTimeProperty], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleChallengeConfigImmunityTimeProperty],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5922ccab3f18411d2e238831058509f3cf558213f16fc794699fe1047308e4a7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleChallengeConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleChallengeConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7310923e4639235b5179baded0c95893dc0e8cd06aca8e36096675b4afe7f575)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putImmunityTimeProperty")
    def put_immunity_time_property(
        self,
        *,
        immunity_time: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param immunity_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.
        '''
        value = Wafv2WebAclRuleChallengeConfigImmunityTimeProperty(
            immunity_time=immunity_time
        )

        return typing.cast(None, jsii.invoke(self, "putImmunityTimeProperty", [value]))

    @jsii.member(jsii_name="resetImmunityTimeProperty")
    def reset_immunity_time_property(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImmunityTimeProperty", []))

    @builtins.property
    @jsii.member(jsii_name="immunityTimeProperty")
    def immunity_time_property(
        self,
    ) -> Wafv2WebAclRuleChallengeConfigImmunityTimePropertyOutputReference:
        return typing.cast(Wafv2WebAclRuleChallengeConfigImmunityTimePropertyOutputReference, jsii.get(self, "immunityTimeProperty"))

    @builtins.property
    @jsii.member(jsii_name="immunityTimePropertyInput")
    def immunity_time_property_input(
        self,
    ) -> typing.Optional[Wafv2WebAclRuleChallengeConfigImmunityTimeProperty]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleChallengeConfigImmunityTimeProperty], jsii.get(self, "immunityTimePropertyInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleChallengeConfig]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleChallengeConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleChallengeConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6bd9b7f1c2bbd4b59c2ade78d9525abf68552f1d05764789dd5a1bfbb9f364b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__68a71874ee24a4f97dee6ddca399ac700dad6b2d1816d445cb6733b9e687fabf)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "Wafv2WebAclRuleOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8735e0c0a1e1de7eeabeee4c391f80a4297cf7abe5874e3e40484b6ddb19ac2f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclRuleOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ca241d61527a9ffe678fe6410674a1bca62f3ab5401bfe513f7d6741d565ca1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0dc8664bf97f444b2848d296245e5637dc0557001b8839741fc6d1dc4ff05696)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d91d8fa7f2af508b699a31e45062e80cf7901e7d7d3c10dfa0f7b9b4d717e6d7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRule]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRule]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRule]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6c3b198e5d6b735f5a534d571af26c46eb49a0b333492106f4bcf99b1d367d7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a0533c14cbe1f942143b7b728df33edf7dbed32f6c15bcb7905745e004cef1b1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAction")
    def put_action(
        self,
        *,
        allow: typing.Optional[typing.Union[Wafv2WebAclRuleActionAllow, typing.Dict[builtins.str, typing.Any]]] = None,
        block: typing.Optional[typing.Union[Wafv2WebAclRuleActionBlock, typing.Dict[builtins.str, typing.Any]]] = None,
        captcha: typing.Optional[typing.Union[Wafv2WebAclRuleActionCaptcha, typing.Dict[builtins.str, typing.Any]]] = None,
        challenge: typing.Optional[typing.Union[Wafv2WebAclRuleActionChallenge, typing.Dict[builtins.str, typing.Any]]] = None,
        count: typing.Optional[typing.Union[Wafv2WebAclRuleActionCount, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param allow: allow block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#allow Wafv2WebAcl#allow}
        :param block: block block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#block Wafv2WebAcl#block}
        :param captcha: captcha block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha Wafv2WebAcl#captcha}
        :param challenge: challenge block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge Wafv2WebAcl#challenge}
        :param count: count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#count Wafv2WebAcl#count}
        '''
        value = Wafv2WebAclRuleAction(
            allow=allow, block=block, captcha=captcha, challenge=challenge, count=count
        )

        return typing.cast(None, jsii.invoke(self, "putAction", [value]))

    @jsii.member(jsii_name="putCaptchaConfig")
    def put_captcha_config(
        self,
        *,
        immunity_time_property: typing.Optional[typing.Union[Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param immunity_time_property: immunity_time_property block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        value = Wafv2WebAclRuleCaptchaConfig(
            immunity_time_property=immunity_time_property
        )

        return typing.cast(None, jsii.invoke(self, "putCaptchaConfig", [value]))

    @jsii.member(jsii_name="putChallengeConfig")
    def put_challenge_config(
        self,
        *,
        immunity_time_property: typing.Optional[typing.Union[Wafv2WebAclRuleChallengeConfigImmunityTimeProperty, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param immunity_time_property: immunity_time_property block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
        '''
        value = Wafv2WebAclRuleChallengeConfig(
            immunity_time_property=immunity_time_property
        )

        return typing.cast(None, jsii.invoke(self, "putChallengeConfig", [value]))

    @jsii.member(jsii_name="putOverrideAction")
    def put_override_action(
        self,
        *,
        count: typing.Optional[typing.Union["Wafv2WebAclRuleOverrideActionCount", typing.Dict[builtins.str, typing.Any]]] = None,
        none: typing.Optional[typing.Union["Wafv2WebAclRuleOverrideActionNone", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param count: count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#count Wafv2WebAcl#count}
        :param none: none block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#none Wafv2WebAcl#none}
        '''
        value = Wafv2WebAclRuleOverrideAction(count=count, none=none)

        return typing.cast(None, jsii.invoke(self, "putOverrideAction", [value]))

    @jsii.member(jsii_name="putRuleLabel")
    def put_rule_label(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2WebAclRuleRuleLabel", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__507d30f88b5afaea82abe2a81b9c5a8a221bcca0ca876c90063b50ac3390c62a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRuleLabel", [value]))

    @jsii.member(jsii_name="putVisibilityConfig")
    def put_visibility_config(
        self,
        *,
        cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        metric_name: builtins.str,
        sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param cloudwatch_metrics_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cloudwatch_metrics_enabled Wafv2WebAcl#cloudwatch_metrics_enabled}.
        :param metric_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#metric_name Wafv2WebAcl#metric_name}.
        :param sampled_requests_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#sampled_requests_enabled Wafv2WebAcl#sampled_requests_enabled}.
        '''
        value = Wafv2WebAclRuleVisibilityConfig(
            cloudwatch_metrics_enabled=cloudwatch_metrics_enabled,
            metric_name=metric_name,
            sampled_requests_enabled=sampled_requests_enabled,
        )

        return typing.cast(None, jsii.invoke(self, "putVisibilityConfig", [value]))

    @jsii.member(jsii_name="resetAction")
    def reset_action(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAction", []))

    @jsii.member(jsii_name="resetCaptchaConfig")
    def reset_captcha_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCaptchaConfig", []))

    @jsii.member(jsii_name="resetChallengeConfig")
    def reset_challenge_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetChallengeConfig", []))

    @jsii.member(jsii_name="resetOverrideAction")
    def reset_override_action(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOverrideAction", []))

    @jsii.member(jsii_name="resetRuleLabel")
    def reset_rule_label(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRuleLabel", []))

    @jsii.member(jsii_name="resetStatement")
    def reset_statement(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatement", []))

    @builtins.property
    @jsii.member(jsii_name="action")
    def action(self) -> Wafv2WebAclRuleActionOutputReference:
        return typing.cast(Wafv2WebAclRuleActionOutputReference, jsii.get(self, "action"))

    @builtins.property
    @jsii.member(jsii_name="captchaConfig")
    def captcha_config(self) -> Wafv2WebAclRuleCaptchaConfigOutputReference:
        return typing.cast(Wafv2WebAclRuleCaptchaConfigOutputReference, jsii.get(self, "captchaConfig"))

    @builtins.property
    @jsii.member(jsii_name="challengeConfig")
    def challenge_config(self) -> Wafv2WebAclRuleChallengeConfigOutputReference:
        return typing.cast(Wafv2WebAclRuleChallengeConfigOutputReference, jsii.get(self, "challengeConfig"))

    @builtins.property
    @jsii.member(jsii_name="overrideAction")
    def override_action(self) -> "Wafv2WebAclRuleOverrideActionOutputReference":
        return typing.cast("Wafv2WebAclRuleOverrideActionOutputReference", jsii.get(self, "overrideAction"))

    @builtins.property
    @jsii.member(jsii_name="ruleLabel")
    def rule_label(self) -> "Wafv2WebAclRuleRuleLabelList":
        return typing.cast("Wafv2WebAclRuleRuleLabelList", jsii.get(self, "ruleLabel"))

    @builtins.property
    @jsii.member(jsii_name="statementInput")
    def statement_input(self) -> typing.Any:
        return typing.cast(typing.Any, jsii.get(self, "statementInput"))

    @builtins.property
    @jsii.member(jsii_name="visibilityConfig")
    def visibility_config(self) -> "Wafv2WebAclRuleVisibilityConfigOutputReference":
        return typing.cast("Wafv2WebAclRuleVisibilityConfigOutputReference", jsii.get(self, "visibilityConfig"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(self) -> typing.Optional[Wafv2WebAclRuleAction]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleAction], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="captchaConfigInput")
    def captcha_config_input(self) -> typing.Optional[Wafv2WebAclRuleCaptchaConfig]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleCaptchaConfig], jsii.get(self, "captchaConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="challengeConfigInput")
    def challenge_config_input(self) -> typing.Optional[Wafv2WebAclRuleChallengeConfig]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleChallengeConfig], jsii.get(self, "challengeConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="overrideActionInput")
    def override_action_input(self) -> typing.Optional["Wafv2WebAclRuleOverrideAction"]:
        return typing.cast(typing.Optional["Wafv2WebAclRuleOverrideAction"], jsii.get(self, "overrideActionInput"))

    @builtins.property
    @jsii.member(jsii_name="priorityInput")
    def priority_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "priorityInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleLabelInput")
    def rule_label_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleRuleLabel"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2WebAclRuleRuleLabel"]]], jsii.get(self, "ruleLabelInput"))

    @builtins.property
    @jsii.member(jsii_name="visibilityConfigInput")
    def visibility_config_input(
        self,
    ) -> typing.Optional["Wafv2WebAclRuleVisibilityConfig"]:
        return typing.cast(typing.Optional["Wafv2WebAclRuleVisibilityConfig"], jsii.get(self, "visibilityConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d35691b81388e99cd7f96cb4ffaa328d15367dad219ab53bfddfdeafb8d3595)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="priority")
    def priority(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "priority"))

    @priority.setter
    def priority(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87af4bca76a2472d52c3b7c7997327f679a17739c243967539a70275002523e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "priority", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="statement")
    def statement(self) -> typing.Any:
        return typing.cast(typing.Any, jsii.get(self, "statement"))

    @statement.setter
    def statement(self, value: typing.Any) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3871ff3e275bff2c8984840667206077db0bf4659ec1d4cd5facf003212242d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "statement", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRule]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRule]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRule]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__596661f30a033faf12d1b6f3b36b6222f8aac373485f26e84699cd73471b232c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleOverrideAction",
    jsii_struct_bases=[],
    name_mapping={"count": "count", "none": "none"},
)
class Wafv2WebAclRuleOverrideAction:
    def __init__(
        self,
        *,
        count: typing.Optional[typing.Union["Wafv2WebAclRuleOverrideActionCount", typing.Dict[builtins.str, typing.Any]]] = None,
        none: typing.Optional[typing.Union["Wafv2WebAclRuleOverrideActionNone", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param count: count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#count Wafv2WebAcl#count}
        :param none: none block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#none Wafv2WebAcl#none}
        '''
        if isinstance(count, dict):
            count = Wafv2WebAclRuleOverrideActionCount(**count)
        if isinstance(none, dict):
            none = Wafv2WebAclRuleOverrideActionNone(**none)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7c607d955ed818f8cfad9036a7b240022aeeffc7ea5c6244e63d45023fae605b)
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument none", value=none, expected_type=type_hints["none"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if count is not None:
            self._values["count"] = count
        if none is not None:
            self._values["none"] = none

    @builtins.property
    def count(self) -> typing.Optional["Wafv2WebAclRuleOverrideActionCount"]:
        '''count block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#count Wafv2WebAcl#count}
        '''
        result = self._values.get("count")
        return typing.cast(typing.Optional["Wafv2WebAclRuleOverrideActionCount"], result)

    @builtins.property
    def none(self) -> typing.Optional["Wafv2WebAclRuleOverrideActionNone"]:
        '''none block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#none Wafv2WebAcl#none}
        '''
        result = self._values.get("none")
        return typing.cast(typing.Optional["Wafv2WebAclRuleOverrideActionNone"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleOverrideAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleOverrideActionCount",
    jsii_struct_bases=[],
    name_mapping={},
)
class Wafv2WebAclRuleOverrideActionCount:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleOverrideActionCount(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleOverrideActionCountOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleOverrideActionCountOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f13f7d4a9b85adccb9c87871794704f5b284aad6b0de9b6f6d6454124b0dc9ec)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleOverrideActionCount]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleOverrideActionCount], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleOverrideActionCount],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__57e25e4394cc047ee3a58969a698a77a9c4ddd8ca7856a466492c7177f430e9e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleOverrideActionNone",
    jsii_struct_bases=[],
    name_mapping={},
)
class Wafv2WebAclRuleOverrideActionNone:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleOverrideActionNone(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleOverrideActionNoneOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleOverrideActionNoneOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__996ca002f2a8a0de1bc30d2bfd30c98c992928635524d449cde64d125fb2b5b8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleOverrideActionNone]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleOverrideActionNone], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleOverrideActionNone],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__26293d9e901845fa893fd978c6342a421fe703ea1eed8676088f3fd35e5e7ced)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleOverrideActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleOverrideActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a5a93d72a061cf19fc48df9f23865052c4ae6a5344bb60f06ce76702cee97176)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCount")
    def put_count(self) -> None:
        value = Wafv2WebAclRuleOverrideActionCount()

        return typing.cast(None, jsii.invoke(self, "putCount", [value]))

    @jsii.member(jsii_name="putNone")
    def put_none(self) -> None:
        value = Wafv2WebAclRuleOverrideActionNone()

        return typing.cast(None, jsii.invoke(self, "putNone", [value]))

    @jsii.member(jsii_name="resetCount")
    def reset_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCount", []))

    @jsii.member(jsii_name="resetNone")
    def reset_none(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNone", []))

    @builtins.property
    @jsii.member(jsii_name="count")
    def count(self) -> Wafv2WebAclRuleOverrideActionCountOutputReference:
        return typing.cast(Wafv2WebAclRuleOverrideActionCountOutputReference, jsii.get(self, "count"))

    @builtins.property
    @jsii.member(jsii_name="none")
    def none(self) -> Wafv2WebAclRuleOverrideActionNoneOutputReference:
        return typing.cast(Wafv2WebAclRuleOverrideActionNoneOutputReference, jsii.get(self, "none"))

    @builtins.property
    @jsii.member(jsii_name="countInput")
    def count_input(self) -> typing.Optional[Wafv2WebAclRuleOverrideActionCount]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleOverrideActionCount], jsii.get(self, "countInput"))

    @builtins.property
    @jsii.member(jsii_name="noneInput")
    def none_input(self) -> typing.Optional[Wafv2WebAclRuleOverrideActionNone]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleOverrideActionNone], jsii.get(self, "noneInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleOverrideAction]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleOverrideAction], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleOverrideAction],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__471f078309f99a48b654c865ddd666a1df27c64f191adea493c5a29821ebd8f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleRuleLabel",
    jsii_struct_bases=[],
    name_mapping={"name": "name"},
)
class Wafv2WebAclRuleRuleLabel:
    def __init__(self, *, name: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fdc2a9089efdce79b2f09e39bcf227c0e2ea65a3f92a2680f1425dbf0e67e6fb)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleRuleLabel(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleRuleLabelList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleRuleLabelList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3da24a4afcbce00f5d6832c50c75eb23ebe61807b1a9fc4860c7d8144eace8c0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "Wafv2WebAclRuleRuleLabelOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2526941613721383fe7152258e8388155ad34e832f6b4c8926ba3df43dd0a62)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2WebAclRuleRuleLabelOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6fc3a6228188489742b64d38307aab827c762002e8509ff004a4bfc705b27993)
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
            type_hints = typing.get_type_hints(_typecheckingstub__db8fcf969c88dc94a178c0d5dcd060862fe3ff885a288e4a20c37c4e4770dc9a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c18f8502c24071744ccbf29aaf6bd16b531911dfcbef3ed140d4a276533a0642)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleRuleLabel]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleRuleLabel]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleRuleLabel]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c8871640007152ed95945ddb0ef21622017a6ededbab74243360dc196903420)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2WebAclRuleRuleLabelOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleRuleLabelOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__28ee80392e38af2a828bad7ba5f9437e8807f29e614910d29f1aa00986fdb330)
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
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61070b01e050e9b65bb4edb95160b7ebf4fd276b58ca9b51afb8b692f6c413fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleRuleLabel]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleRuleLabel]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleRuleLabel]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d9d59c8acc00ac8f32a2e21613a8f7c5b61a1278de2d323009c692748094697)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleVisibilityConfig",
    jsii_struct_bases=[],
    name_mapping={
        "cloudwatch_metrics_enabled": "cloudwatchMetricsEnabled",
        "metric_name": "metricName",
        "sampled_requests_enabled": "sampledRequestsEnabled",
    },
)
class Wafv2WebAclRuleVisibilityConfig:
    def __init__(
        self,
        *,
        cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        metric_name: builtins.str,
        sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param cloudwatch_metrics_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cloudwatch_metrics_enabled Wafv2WebAcl#cloudwatch_metrics_enabled}.
        :param metric_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#metric_name Wafv2WebAcl#metric_name}.
        :param sampled_requests_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#sampled_requests_enabled Wafv2WebAcl#sampled_requests_enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f0f3e58bdcc92442258163554cc0a84222634fd49e0a5b2e29260409a1fa33eb)
            check_type(argname="argument cloudwatch_metrics_enabled", value=cloudwatch_metrics_enabled, expected_type=type_hints["cloudwatch_metrics_enabled"])
            check_type(argname="argument metric_name", value=metric_name, expected_type=type_hints["metric_name"])
            check_type(argname="argument sampled_requests_enabled", value=sampled_requests_enabled, expected_type=type_hints["sampled_requests_enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "cloudwatch_metrics_enabled": cloudwatch_metrics_enabled,
            "metric_name": metric_name,
            "sampled_requests_enabled": sampled_requests_enabled,
        }

    @builtins.property
    def cloudwatch_metrics_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cloudwatch_metrics_enabled Wafv2WebAcl#cloudwatch_metrics_enabled}.'''
        result = self._values.get("cloudwatch_metrics_enabled")
        assert result is not None, "Required property 'cloudwatch_metrics_enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def metric_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#metric_name Wafv2WebAcl#metric_name}.'''
        result = self._values.get("metric_name")
        assert result is not None, "Required property 'metric_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def sampled_requests_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#sampled_requests_enabled Wafv2WebAcl#sampled_requests_enabled}.'''
        result = self._values.get("sampled_requests_enabled")
        assert result is not None, "Required property 'sampled_requests_enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclRuleVisibilityConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclRuleVisibilityConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclRuleVisibilityConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e9b9e8f3edde8eca61030e3433c160055157c764be5569a3a1ce62fda22c800d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="cloudwatchMetricsEnabledInput")
    def cloudwatch_metrics_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "cloudwatchMetricsEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="metricNameInput")
    def metric_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "metricNameInput"))

    @builtins.property
    @jsii.member(jsii_name="sampledRequestsEnabledInput")
    def sampled_requests_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "sampledRequestsEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchMetricsEnabled")
    def cloudwatch_metrics_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "cloudwatchMetricsEnabled"))

    @cloudwatch_metrics_enabled.setter
    def cloudwatch_metrics_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2dab47ca7a629422911563db707b3a141d1b1beacd822ec327ef1b2bc297d2b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cloudwatchMetricsEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="metricName")
    def metric_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "metricName"))

    @metric_name.setter
    def metric_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83ca27fc88389ecfd900e3a9ede01191a694821a663d165a3b8d94ff5f4e41a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "metricName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sampledRequestsEnabled")
    def sampled_requests_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "sampledRequestsEnabled"))

    @sampled_requests_enabled.setter
    def sampled_requests_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6d73552311e1b61666f0f6bd73847054ac00ce8e9c90d8ff44d8e8efcc1fead)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sampledRequestsEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclRuleVisibilityConfig]:
        return typing.cast(typing.Optional[Wafv2WebAclRuleVisibilityConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclRuleVisibilityConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07c2a1b5e7367db1c1da6a2a0edfe1a6c94fb9e339f5cb28bb8abe0fe8b8de8e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclVisibilityConfig",
    jsii_struct_bases=[],
    name_mapping={
        "cloudwatch_metrics_enabled": "cloudwatchMetricsEnabled",
        "metric_name": "metricName",
        "sampled_requests_enabled": "sampledRequestsEnabled",
    },
)
class Wafv2WebAclVisibilityConfig:
    def __init__(
        self,
        *,
        cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        metric_name: builtins.str,
        sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param cloudwatch_metrics_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cloudwatch_metrics_enabled Wafv2WebAcl#cloudwatch_metrics_enabled}.
        :param metric_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#metric_name Wafv2WebAcl#metric_name}.
        :param sampled_requests_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#sampled_requests_enabled Wafv2WebAcl#sampled_requests_enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e0802692d91b910413568b9167abac4732040666e428b0054d731bbae8d4ded9)
            check_type(argname="argument cloudwatch_metrics_enabled", value=cloudwatch_metrics_enabled, expected_type=type_hints["cloudwatch_metrics_enabled"])
            check_type(argname="argument metric_name", value=metric_name, expected_type=type_hints["metric_name"])
            check_type(argname="argument sampled_requests_enabled", value=sampled_requests_enabled, expected_type=type_hints["sampled_requests_enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "cloudwatch_metrics_enabled": cloudwatch_metrics_enabled,
            "metric_name": metric_name,
            "sampled_requests_enabled": sampled_requests_enabled,
        }

    @builtins.property
    def cloudwatch_metrics_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cloudwatch_metrics_enabled Wafv2WebAcl#cloudwatch_metrics_enabled}.'''
        result = self._values.get("cloudwatch_metrics_enabled")
        assert result is not None, "Required property 'cloudwatch_metrics_enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def metric_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#metric_name Wafv2WebAcl#metric_name}.'''
        result = self._values.get("metric_name")
        assert result is not None, "Required property 'metric_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def sampled_requests_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#sampled_requests_enabled Wafv2WebAcl#sampled_requests_enabled}.'''
        result = self._values.get("sampled_requests_enabled")
        assert result is not None, "Required property 'sampled_requests_enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2WebAclVisibilityConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2WebAclVisibilityConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2WebAcl.Wafv2WebAclVisibilityConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__17288f4bfa474ae64871b9b692a90751689845c68133d0a9c443e5735926077c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="cloudwatchMetricsEnabledInput")
    def cloudwatch_metrics_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "cloudwatchMetricsEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="metricNameInput")
    def metric_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "metricNameInput"))

    @builtins.property
    @jsii.member(jsii_name="sampledRequestsEnabledInput")
    def sampled_requests_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "sampledRequestsEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchMetricsEnabled")
    def cloudwatch_metrics_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "cloudwatchMetricsEnabled"))

    @cloudwatch_metrics_enabled.setter
    def cloudwatch_metrics_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ea458a0dc2126c4f28172b0a8512fde751a17c83e9bfdc2192b7a3ab38a84d4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cloudwatchMetricsEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="metricName")
    def metric_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "metricName"))

    @metric_name.setter
    def metric_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__275396df5fa93d4351b6d60179fb36ac11a24f63d575c2614811d6e4f566991c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "metricName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sampledRequestsEnabled")
    def sampled_requests_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "sampledRequestsEnabled"))

    @sampled_requests_enabled.setter
    def sampled_requests_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ac092303792cfaf4a556094a36a8e8118834233ad58db2d036e0ad0c17cea43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sampledRequestsEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2WebAclVisibilityConfig]:
        return typing.cast(typing.Optional[Wafv2WebAclVisibilityConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2WebAclVisibilityConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1a988e8e43e7557076f40ff9f3c71fdcd20ff2e9116002c8878df32bb89ba19)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Wafv2WebAcl",
    "Wafv2WebAclAssociationConfig",
    "Wafv2WebAclAssociationConfigOutputReference",
    "Wafv2WebAclAssociationConfigRequestBody",
    "Wafv2WebAclAssociationConfigRequestBodyApiGateway",
    "Wafv2WebAclAssociationConfigRequestBodyApiGatewayOutputReference",
    "Wafv2WebAclAssociationConfigRequestBodyAppRunnerService",
    "Wafv2WebAclAssociationConfigRequestBodyAppRunnerServiceOutputReference",
    "Wafv2WebAclAssociationConfigRequestBodyCloudfront",
    "Wafv2WebAclAssociationConfigRequestBodyCloudfrontOutputReference",
    "Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool",
    "Wafv2WebAclAssociationConfigRequestBodyCognitoUserPoolOutputReference",
    "Wafv2WebAclAssociationConfigRequestBodyList",
    "Wafv2WebAclAssociationConfigRequestBodyOutputReference",
    "Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance",
    "Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference",
    "Wafv2WebAclCaptchaConfig",
    "Wafv2WebAclCaptchaConfigImmunityTimeProperty",
    "Wafv2WebAclCaptchaConfigImmunityTimePropertyOutputReference",
    "Wafv2WebAclCaptchaConfigOutputReference",
    "Wafv2WebAclChallengeConfig",
    "Wafv2WebAclChallengeConfigImmunityTimeProperty",
    "Wafv2WebAclChallengeConfigImmunityTimePropertyOutputReference",
    "Wafv2WebAclChallengeConfigOutputReference",
    "Wafv2WebAclConfig",
    "Wafv2WebAclCustomResponseBody",
    "Wafv2WebAclCustomResponseBodyList",
    "Wafv2WebAclCustomResponseBodyOutputReference",
    "Wafv2WebAclDataProtectionConfig",
    "Wafv2WebAclDataProtectionConfigDataProtection",
    "Wafv2WebAclDataProtectionConfigDataProtectionField",
    "Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference",
    "Wafv2WebAclDataProtectionConfigDataProtectionList",
    "Wafv2WebAclDataProtectionConfigDataProtectionOutputReference",
    "Wafv2WebAclDataProtectionConfigOutputReference",
    "Wafv2WebAclDefaultAction",
    "Wafv2WebAclDefaultActionAllow",
    "Wafv2WebAclDefaultActionAllowCustomRequestHandling",
    "Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader",
    "Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeaderList",
    "Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeaderOutputReference",
    "Wafv2WebAclDefaultActionAllowCustomRequestHandlingOutputReference",
    "Wafv2WebAclDefaultActionAllowOutputReference",
    "Wafv2WebAclDefaultActionBlock",
    "Wafv2WebAclDefaultActionBlockCustomResponse",
    "Wafv2WebAclDefaultActionBlockCustomResponseOutputReference",
    "Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader",
    "Wafv2WebAclDefaultActionBlockCustomResponseResponseHeaderList",
    "Wafv2WebAclDefaultActionBlockCustomResponseResponseHeaderOutputReference",
    "Wafv2WebAclDefaultActionBlockOutputReference",
    "Wafv2WebAclDefaultActionOutputReference",
    "Wafv2WebAclRule",
    "Wafv2WebAclRuleAction",
    "Wafv2WebAclRuleActionAllow",
    "Wafv2WebAclRuleActionAllowCustomRequestHandling",
    "Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader",
    "Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeaderList",
    "Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeaderOutputReference",
    "Wafv2WebAclRuleActionAllowCustomRequestHandlingOutputReference",
    "Wafv2WebAclRuleActionAllowOutputReference",
    "Wafv2WebAclRuleActionBlock",
    "Wafv2WebAclRuleActionBlockCustomResponse",
    "Wafv2WebAclRuleActionBlockCustomResponseOutputReference",
    "Wafv2WebAclRuleActionBlockCustomResponseResponseHeader",
    "Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderList",
    "Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderOutputReference",
    "Wafv2WebAclRuleActionBlockOutputReference",
    "Wafv2WebAclRuleActionCaptcha",
    "Wafv2WebAclRuleActionCaptchaCustomRequestHandling",
    "Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader",
    "Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeaderList",
    "Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeaderOutputReference",
    "Wafv2WebAclRuleActionCaptchaCustomRequestHandlingOutputReference",
    "Wafv2WebAclRuleActionCaptchaOutputReference",
    "Wafv2WebAclRuleActionChallenge",
    "Wafv2WebAclRuleActionChallengeCustomRequestHandling",
    "Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader",
    "Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeaderList",
    "Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeaderOutputReference",
    "Wafv2WebAclRuleActionChallengeCustomRequestHandlingOutputReference",
    "Wafv2WebAclRuleActionChallengeOutputReference",
    "Wafv2WebAclRuleActionCount",
    "Wafv2WebAclRuleActionCountCustomRequestHandling",
    "Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader",
    "Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeaderList",
    "Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeaderOutputReference",
    "Wafv2WebAclRuleActionCountCustomRequestHandlingOutputReference",
    "Wafv2WebAclRuleActionCountOutputReference",
    "Wafv2WebAclRuleActionOutputReference",
    "Wafv2WebAclRuleCaptchaConfig",
    "Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty",
    "Wafv2WebAclRuleCaptchaConfigImmunityTimePropertyOutputReference",
    "Wafv2WebAclRuleCaptchaConfigOutputReference",
    "Wafv2WebAclRuleChallengeConfig",
    "Wafv2WebAclRuleChallengeConfigImmunityTimeProperty",
    "Wafv2WebAclRuleChallengeConfigImmunityTimePropertyOutputReference",
    "Wafv2WebAclRuleChallengeConfigOutputReference",
    "Wafv2WebAclRuleList",
    "Wafv2WebAclRuleOutputReference",
    "Wafv2WebAclRuleOverrideAction",
    "Wafv2WebAclRuleOverrideActionCount",
    "Wafv2WebAclRuleOverrideActionCountOutputReference",
    "Wafv2WebAclRuleOverrideActionNone",
    "Wafv2WebAclRuleOverrideActionNoneOutputReference",
    "Wafv2WebAclRuleOverrideActionOutputReference",
    "Wafv2WebAclRuleRuleLabel",
    "Wafv2WebAclRuleRuleLabelList",
    "Wafv2WebAclRuleRuleLabelOutputReference",
    "Wafv2WebAclRuleVisibilityConfig",
    "Wafv2WebAclRuleVisibilityConfigOutputReference",
    "Wafv2WebAclVisibilityConfig",
    "Wafv2WebAclVisibilityConfigOutputReference",
]

publication.publish()

def _typecheckingstub__74bcca1b9da33111e483c9125b8e5850cfc5dbd08a99d4e97e42cb2ea6a887db(
    scope_: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    default_action: typing.Union[Wafv2WebAclDefaultAction, typing.Dict[builtins.str, typing.Any]],
    scope: builtins.str,
    visibility_config: typing.Union[Wafv2WebAclVisibilityConfig, typing.Dict[builtins.str, typing.Any]],
    association_config: typing.Optional[typing.Union[Wafv2WebAclAssociationConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    captcha_config: typing.Optional[typing.Union[Wafv2WebAclCaptchaConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    challenge_config: typing.Optional[typing.Union[Wafv2WebAclChallengeConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    custom_response_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclCustomResponseBody, typing.Dict[builtins.str, typing.Any]]]]] = None,
    data_protection_config: typing.Optional[typing.Union[Wafv2WebAclDataProtectionConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    description: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    rule: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRule, typing.Dict[builtins.str, typing.Any]]]]] = None,
    rule_json: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    token_domains: typing.Optional[typing.Sequence[builtins.str]] = None,
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

def _typecheckingstub__0211a81058973af145e2ac701c42e428d21b087ad884b0fc66ee7aa22eea5032(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dad8390e8b836afab749cfff58b94cf165c1f6eebb8232597db6a78038f78307(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclCustomResponseBody, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f198a921980f436082f3caba5f9b9ea9dd6ccc8bb17aa15f0fdaaa4c67c695d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRule, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f70c3dc5d40b4dce446db3e694a082d9a4acf5d11158a67ba6d2c6fbdabd9138(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__adc183435eb9e2c67b505eeb3a3e991972c38f0b8e2b30ae9e5111ea11e28d0a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b20286eceb4f643b1482ee966f1f9f63bd6a6dafd3e0b2c6bfb84e2dcf1c559(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b86c4c934618cf61ac53353bc24c8b8166d3710f185ba427e9877e74ee3e6d57(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b410044cfc2ce90f207346282aad7e2b7f05a084d0b8931ddc76c2712a6d2c6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08c070cd01e476b10988078e3475aba0ef4baa5b1e317e52843385fb2a070597(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec7673b42c9fcda57d13ea18f816e4d0bb5be7159658d0c4996b691a81f935b6(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5260df2f1243a794bd5722fd3d128bd494003930942f329ee6774d5f9ec2f948(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90d9489758a4924e355d3bcb6bf0d905aa93253727421d6f1941bdc040ff2e2f(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ca204ce826c792015954a5b9ec8f5e6a9213de6304d3c4a5ca93c9f2b0b92c5(
    *,
    request_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclAssociationConfigRequestBody, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ac10b5be8250055913a30f99291055257cd51ef20666b9018ea109656a04cb4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d07a3af1de9b766767ad86a10d22ee07722d4cf4ae1c802055c5b4424617012(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclAssociationConfigRequestBody, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58191a0d3d1ea545dd89452a41e201261ed949c5770e5972175113aac93fa812(
    value: typing.Optional[Wafv2WebAclAssociationConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c1df715d0ce0cda73f46954c5266e04c5fbae5ed4d93d55bc2ca6e7a5d05388(
    *,
    api_gateway: typing.Optional[typing.Union[Wafv2WebAclAssociationConfigRequestBodyApiGateway, typing.Dict[builtins.str, typing.Any]]] = None,
    app_runner_service: typing.Optional[typing.Union[Wafv2WebAclAssociationConfigRequestBodyAppRunnerService, typing.Dict[builtins.str, typing.Any]]] = None,
    cloudfront: typing.Optional[typing.Union[Wafv2WebAclAssociationConfigRequestBodyCloudfront, typing.Dict[builtins.str, typing.Any]]] = None,
    cognito_user_pool: typing.Optional[typing.Union[Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool, typing.Dict[builtins.str, typing.Any]]] = None,
    verified_access_instance: typing.Optional[typing.Union[Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1825ae4a3497149a6af4f830e88394f28f542e6a6306f251f2f388f64e4e7fa1(
    *,
    default_size_inspection_limit: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53107c898f62613184e230b0068f8c09d40bfed6d43b514b2980076e3042d5ff(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__badf3c66c21df4e9dfc35ea205466de2d62a248d13885fb7b7e2c8509a5355ac(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c36e75475720cf33e0b9d02440de157cc36699e3f2576856c59d55c8a436cf0(
    value: typing.Optional[Wafv2WebAclAssociationConfigRequestBodyApiGateway],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__89db2b02c6375d8ac7cc724cac493e545cc8724b000e118a80bc24e7314b92f3(
    *,
    default_size_inspection_limit: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1973ebb04dbbc484c45881959044f3b23e80bae40e0de29de102ea4c33673fe0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__482b9527f8f0cd7a1d5ca7823b606fe438465c95122ed20b5d509680552c4762(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f2b53c3c82ab7ec2d1b1dd50ac68b5520ee663d2f1b35f350b63829cb229430(
    value: typing.Optional[Wafv2WebAclAssociationConfigRequestBodyAppRunnerService],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0070071be4c69b8d0a7f4e36feb6e83f62c26f48405bdc29d0da542847f8d295(
    *,
    default_size_inspection_limit: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1ca9523489be03fc888b31f4d307d547bd818ccd45aa0eb84914354ba7becec(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d02c4c3e5478fc07d376e432e3064a93ef6d7a8cf9295d6e4a64b3466d5aef1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64001839cbd428a98ada2b5d72e89ab28280fdb3fef8bf2964cdd65d0b869289(
    value: typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCloudfront],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61690dee49e48c863a8bfc7ba45f0f94ba3bd1f5946cf970a818cdfa2a033866(
    *,
    default_size_inspection_limit: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aae0689d2008742398384521262e00cef40fda264e1f02385526733e3b207603(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e8f15848273a7106597c0d1fec0c4b3b2a667761edfcb9965e339fb3f9d9506(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b16f9e52cdd29b7bc9589a784e2173ead33f0f5ba87083fe00be5ceadb218805(
    value: typing.Optional[Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2ba114fe38fc40d03b5e580730fbac49dc1226b294b42c71aa1eb77eb85f239(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3182a144b46fd155bbe9f574be114a358e7b7415fa8ff623b17b9803af68e98(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14dc988228a1879cd8f0d9b53bf978e852ebe9d8e11893021f37f2038e43d345(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5eb2fcc994c89e72d330930fe3c901a82496f01e8eff142eb000878035831b55(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d86fb803e098668a33cdda8b403ae1b15d43a5618667a3da3adc24081d87445b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29e0422c4e75bbe1ed55f404d42febf2c39245fa6033a97152a4a5c14289455e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclAssociationConfigRequestBody]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31ad93cb562add915352328ce2ec831f7033451767d450590a1a16bce1be017c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e1966ef15b7974ad8c37b8d830d205cb127e40e865813b8526f20b098124e91(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclAssociationConfigRequestBody]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3d0bcf707f84c5b14bc23330fb29d7354d14bea5172e9b6a59ad96ba372f2f5(
    *,
    default_size_inspection_limit: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8eb519ecd299e93b0c698cbad19e8dd29e4c5d83b2f2deb0fd8cfdcbf08a7a54(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__769bdbdc191c4853054295a22209ebaa2848e370abe2476bde50d5b4e930db2a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__528d88936886a2fcb63c741dc007044bdfcf49c90a9fe4f82d15723a0c0d6aff(
    value: typing.Optional[Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e355eef5736f2b4cd09c28bff6e74cfab265463236747988f50fa23bccc4c8e1(
    *,
    immunity_time_property: typing.Optional[typing.Union[Wafv2WebAclCaptchaConfigImmunityTimeProperty, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a36ac45d4242a19c6d363f32f537a29cd21d1f02fd34829296d8db4d105683fd(
    *,
    immunity_time: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ada4c34acd4bb1964aedf6284d5073623d307abf1dc71aea6008c338374a6e0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a8c2a291916473288a92293fc0749302e129312cc0e5c1f29a724b522eb7976(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__394a39f868ef674c6b3d1789526d90e81508b8f31e209802b5dd1ef195b3676b(
    value: typing.Optional[Wafv2WebAclCaptchaConfigImmunityTimeProperty],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a97f71651ad9a6014cb72f7119276fa1f30e734b8199b41e31a151ea20f1ef3a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b93838adebd10745c7e9babfdae4e670c2a2b0903b69d049396d12734e747f7a(
    value: typing.Optional[Wafv2WebAclCaptchaConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eaed3176df1aaac97eaf0db41d27a65c1d12c149ed494946362e659e0a367b24(
    *,
    immunity_time_property: typing.Optional[typing.Union[Wafv2WebAclChallengeConfigImmunityTimeProperty, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb1632eae419b0011266bf1031030d155a326bcd7b9b5e23ad132a8586f079fa(
    *,
    immunity_time: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e663b87b7edf15a6c349ca86020b1afb4dcb0969bdf46c6ef6f8e19f89dd7b79(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7638252de83db1fac3611136edb29bb6c86c69be14f80ad4a8530e30c2d2b25(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__89851b82b88f5ad221ece2511e109e47c3b99463f3d1cd8de50cc59879e8a5fa(
    value: typing.Optional[Wafv2WebAclChallengeConfigImmunityTimeProperty],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85d6adf8e3a2c45462916d1f303ee316a5f513b1fc8b786c3fc9e31959dbca8e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a0d8f4ad16bdf9e0a7548d7cd93ab1a2a9b04801337cdcf7c33e1d5023fd437(
    value: typing.Optional[Wafv2WebAclChallengeConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2b23a610e33ef141618bb1c623cbb861407aea13645dd6d97457c8ca2afa560(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    default_action: typing.Union[Wafv2WebAclDefaultAction, typing.Dict[builtins.str, typing.Any]],
    scope: builtins.str,
    visibility_config: typing.Union[Wafv2WebAclVisibilityConfig, typing.Dict[builtins.str, typing.Any]],
    association_config: typing.Optional[typing.Union[Wafv2WebAclAssociationConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    captcha_config: typing.Optional[typing.Union[Wafv2WebAclCaptchaConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    challenge_config: typing.Optional[typing.Union[Wafv2WebAclChallengeConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    custom_response_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclCustomResponseBody, typing.Dict[builtins.str, typing.Any]]]]] = None,
    data_protection_config: typing.Optional[typing.Union[Wafv2WebAclDataProtectionConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    description: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    rule: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRule, typing.Dict[builtins.str, typing.Any]]]]] = None,
    rule_json: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    token_domains: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__48c59ede7e6fa6b5815fd697bd22c36fbd62b661a38c85bad5864cd66447740a(
    *,
    content: builtins.str,
    content_type: builtins.str,
    key: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd2f371f2d01480c0b48de765b2f257b34b4406673bf1d2d92465fec526b6dc9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c697613bb53ac61e5174325681fa48222e3bd0d337d4a89ea324dc84de2b2bb(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd9b40aafb6c773ddc032b48fc4ff0c477b4760fb588e1a036492f6c5726f3fd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17c41d61135ae3a3917466cce64367458de339312f65950b6a31b8564711dbc5(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b3613943df7c75a3750dc6898733ad14792beb4ae4e26b3425c83902135c4f8(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5bbd83956602f16a19888c533f524fa61928628eaaeaf2d24d617c99b153436e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclCustomResponseBody]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6f8ea6d7c2222938907aa27f7512a96427a12772084fdd1a392e37234421df9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__521df35b06d860b5392b6f7c2b3d558857481f24fcf8377953534e0c6624bc68(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a0e27f5ec82732dc2d19cd44a8dda65b686543a617637e2d033c492f7255c48(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da98854931df7f102302778213fa19dd756979c3710ac1583c117950e5fea5d1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9207537bf08b086353b62d4899ba8cb3a6f70fab12e91e0ba24271690abc9117(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclCustomResponseBody]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a456f6c2dc061fcd81048a586b507e545a43e520aa7e3f1049beff50d13f29a5(
    *,
    data_protection: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclDataProtectionConfigDataProtection, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3807dacf308aa820a7c50e43d0ff0cfe26204acd6d5d204e2cc8db223211339(
    *,
    action: builtins.str,
    field: typing.Union[Wafv2WebAclDataProtectionConfigDataProtectionField, typing.Dict[builtins.str, typing.Any]],
    exclude_rate_based_details: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    exclude_rule_match_details: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb4290140b6862ec625f677ba76a959a7a6e773529cca0de5a5c78e592f29517(
    *,
    field_type: builtins.str,
    field_keys: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04ebf2e1d8f3e48412e2721565d82d9d7097e67be5457a6d2a0c2fc73b8bf998(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2bdebe55567510c843ef66ff05745dd1a819cb6a85b4f9f0b13f077d448e743d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9c1029c9c75b091779330a3e0a8227fb1d79ea2f529d5bb8a3c573b6eca05c1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a797d0f146d4021712e4d5382dd3b700837b79514188e390021e7f9401982e37(
    value: typing.Optional[Wafv2WebAclDataProtectionConfigDataProtectionField],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28cdf6e05c5d3719d615db28faefe51a606e5cd567584a9816ad10bc86f25049(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__835a4e54ba7962b5b11504a344b3e96cbfd13bba0531c55512651591423a356c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42216433883b530cd79c621836a37bee05e8546691e5082b3d1a4e532f682db2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2af2862c517592e8b546b5e4842a19e950af59accc8df5af32d38eeec8096f4d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec8f604c39d5fa2061ef57c78f6c74816c403f923c5eb427945a5c524ddf05b2(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a119f86c242b354179bf1b4de84ea355677b07e4bb2ef5f17a8db670c688c77(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDataProtectionConfigDataProtection]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__284055d80141f4ce23b409ada0ab77860d5a910fe694e5e2203c4430936b2632(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__617ef19623bc6da99d9e4cd302001b16cafd9cc4ed54c733dbc51887f7b73176(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12460ee050659b72cd42ebd715534761f78ef8f20b52da7e71ce72b47d2ef2c6(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cce39500b2b6c9eaa64931762b4e5242b28edd794560b7e184696f28bdadc70f(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__348f0b1bad65159041a3b069371f6d4ee866923b8be9c6fea79322f0e596e7a7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDataProtectionConfigDataProtection]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b15678a484b659f77a8e15f68735b471dea3a532a0018c58e8e6ef382acff510(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__059faab5be44ec61b00c4bb005abe7590087641a4cd11b71769e18d646a5690d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclDataProtectionConfigDataProtection, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c00fa074ae469dcf9c0701fdd8a5b2e254a728a1010440665ba4680513be8c7(
    value: typing.Optional[Wafv2WebAclDataProtectionConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ffd966b2d347c7ddf1bfb8d9a836754eda8d15696a87e7a34d84d95ae0d67d49(
    *,
    allow: typing.Optional[typing.Union[Wafv2WebAclDefaultActionAllow, typing.Dict[builtins.str, typing.Any]]] = None,
    block: typing.Optional[typing.Union[Wafv2WebAclDefaultActionBlock, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3453f86fe364e477a6542f2b86622f40a3afe91677128a70689b4b6bb65f337e(
    *,
    custom_request_handling: typing.Optional[typing.Union[Wafv2WebAclDefaultActionAllowCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff1adf30d2b128bb5a042051ef12e58c16ffad96f31df735a9d882692b852af2(
    *,
    insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8df097c5a98fbc0c4d2ceaf516c040545f8a1d8852de79313e054b4d62b32a5a(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afaa8b4136e8e32648038c33573a519c2d6d7ae7a1e454c959f86ca7cc76b2b6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ae6a04e75046f4824a226a6c28e6e8126e24f0fec26f956d90ab2b6cf37bdc4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0ccd3f7acbb640c423ceb105666f46670f4c47b627998334e54028b74b1a95c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1135b20c8b3604bf71fb0e752d336842a8cf84a9e4789dd107f1a96f04b67dd(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e491f0991d2ebf601f20f7e45b397e20720d78460234894be6a07dd939a9a05(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23b69d2987090f636172e65e673f531bcc31751d54a7ebd1669c6ce469952194(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eed267e0d8ba0b5f38930e25f5a55c43162d3bbb85f547e7d2d443635fd48ffe(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f04a142581d2f91a002894f4d0c018f707cb1c894b116f44bf57ed3b5c7227b5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__879ac2694c7b96fc294f631086281631b02abb35dbd32bb9c33f22c6682a05ef(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f44cab440349aa54cc759d09e5c5633502427bd67ac9febbfef2eaf2971bd9d1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1229f499552d9cd41b29398b764955af24af07771372ad7c108da616322a299(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cfd57fd088d6963944e7416d1896561546a9232b1e5cbaa4a8ae73b529bd19e9(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclDefaultActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a27a56808e05cd83b20de2727b84cef35710fcabc4de6b14ba82b297d5c3a772(
    value: typing.Optional[Wafv2WebAclDefaultActionAllowCustomRequestHandling],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c725db33f1df27e827307017a86b6b0985dd7ee6de72bef320fa421029d12bc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__009ddb65ad0917e74301d2df82ad8f2b3367b8d891aa86bb0ceb9e2c45fbeb33(
    value: typing.Optional[Wafv2WebAclDefaultActionAllow],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__762994292e94c71108919bf3a77310a749066f62e6e35b608dc618bce7e0a5d1(
    *,
    custom_response: typing.Optional[typing.Union[Wafv2WebAclDefaultActionBlockCustomResponse, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa71d26cc220ad33400090b42293ba0a0433946034770894c3aa8cddee4ae81d(
    *,
    response_code: jsii.Number,
    custom_response_body_key: typing.Optional[builtins.str] = None,
    response_header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9280adc9415b70919f1945a370f6fd757daf57c06b9c5a1d9f0dcfbed6aca591(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__732b778e689034fd1fff4a34c8699e5abe76f7cbc4b0e0dc2cb2fbbf7f0acb28(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96ae80333b6d44dd10f82fdc603fca903b93b18b695c3a86cfc3a015f8992f9a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d68d72dab4a3d8e44384e183ce5020fe3939f7c0dabdf8ac0fb5448cd3c690c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ee6e0c2c55d1bffa8e06a880451fcf89734535d420a163b9b2a79037e2ef4fc(
    value: typing.Optional[Wafv2WebAclDefaultActionBlockCustomResponse],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96523b56a83ef76a0b0bae5a2d6efbbf9005625aec834892319d2ed02dad0f61(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__770ac716224ea4c08f3dd652e5c6bafa9d0219b056545b9e7b3aac0ac2158dfd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b230ecbfb93f7fa86bdf394577fa007134ada119c5096f4ea3cfba4bd1d5887(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79ea81c43155917d8d644e2b79f1b0a86dcf6bb802f35215a4a3467a49d04d2f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00d61603f1cac01379f0ea527774aeab45d6516533ca5c391de9366b63101715(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__044165c71c415a07ed9c3f3d7d7f18126e31b24464480c34db859c344ded08ec(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8fbc5b3aada59ac8e125bbd166b84f7c43ec4bc6f881a09eb8da163d28c367c0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b3415d8a0a594ce996436f02ac16f06b2426cd0979d4df29ae6d335b4e256ec(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07b900ec8c04a6588c8104522bae18b1017d31730871b730893a303600bb8a64(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c885095452dfebd801c499ba6bc195e169680d7d09e2bda06bbe8c975e8c1d9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1cd6a08e5b814ade28b8d992c027613a0828dea4720728343e9b0df5a50f5dd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebc6976f8bbe5e02597316343b77faf759018f05403d50cf498151f0383278c8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6365d1a411dc22d639865440fbc3e9e38928c5acfd1fa6113c86fdeb9ca9e6b(
    value: typing.Optional[Wafv2WebAclDefaultActionBlock],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6cb1180af3df3c7e49438d78e3c534fd0abd7edb7c2e7bc50555b88311d34d44(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19c6ff931fefd510a100f162291067d0c6d7b593feab6b8942983d6e573d3c5e(
    value: typing.Optional[Wafv2WebAclDefaultAction],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1aa11800620dba229223290e234c15062db57c67ae1247296ae83cc7860780ef(
    *,
    name: builtins.str,
    priority: jsii.Number,
    visibility_config: typing.Union[Wafv2WebAclRuleVisibilityConfig, typing.Dict[builtins.str, typing.Any]],
    action: typing.Optional[typing.Union[Wafv2WebAclRuleAction, typing.Dict[builtins.str, typing.Any]]] = None,
    captcha_config: typing.Optional[typing.Union[Wafv2WebAclRuleCaptchaConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    challenge_config: typing.Optional[typing.Union[Wafv2WebAclRuleChallengeConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    override_action: typing.Optional[typing.Union[Wafv2WebAclRuleOverrideAction, typing.Dict[builtins.str, typing.Any]]] = None,
    rule_label: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleRuleLabel, typing.Dict[builtins.str, typing.Any]]]]] = None,
    statement: typing.Any = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01fa56be8d25c9af2d4e51d5b30dc340f02adb70028cf0d72c48da66e35a2bd1(
    *,
    allow: typing.Optional[typing.Union[Wafv2WebAclRuleActionAllow, typing.Dict[builtins.str, typing.Any]]] = None,
    block: typing.Optional[typing.Union[Wafv2WebAclRuleActionBlock, typing.Dict[builtins.str, typing.Any]]] = None,
    captcha: typing.Optional[typing.Union[Wafv2WebAclRuleActionCaptcha, typing.Dict[builtins.str, typing.Any]]] = None,
    challenge: typing.Optional[typing.Union[Wafv2WebAclRuleActionChallenge, typing.Dict[builtins.str, typing.Any]]] = None,
    count: typing.Optional[typing.Union[Wafv2WebAclRuleActionCount, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8a8e5704360ba73a0de6973c13db775d8e6f62fa8f01fa8d8924d424fcf44bc(
    *,
    custom_request_handling: typing.Optional[typing.Union[Wafv2WebAclRuleActionAllowCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5cdc65327260e4f93b7a673a425eae5b3ccf15fd8438b5442de6c9af21807b9c(
    *,
    insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df0761870345f0679d492cfc53cb4a95adac27f15a4f893bd76a62313caf4f94(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f678ec7aa9446db7eef5382cd2943ac9604e105e28e12065b166b39ae1b28f01(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0e2a00b02712a3563bde00128f3596f70ad75adc8ae7cee53fcd56b591945f9(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c98405ad7389f3fb789fc0512c9688e3e38000584fb050644158d64bec51bd7a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf627d54ac02ee0d2396df361ab60ae2b7a6da2ccb4fa9b3be87671e85e67f39(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5377b1371871a4aa65d067eecff8d3b9b93a1f2b000fc904dd9ee072ae77976(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f5cd29a17e5d906dce97cbf6afa2b9c060edf13b526fe123a125d373ad98f68(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d49ae94e5a84907ac9935cbb4f7ed6cff226b0695900d70dd415d2575262926(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fbb33fb6067a53d5d887bf9cde4df70a39a2b20ec548b7d8b4531a3cc30fb59d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a35c0a233383b35bd6d167f6f952712a1b13f66de44f900e205d4cbcc557a2b5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af1ab7254bc6d3346a6bd37d3fee4300ef1dbd6518844e89aa3ab12896d916e2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc87c56130976b5a24d730665417a03472338c056ef9860591e58f9ba1ffef7e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c1686844be5ee029db86b2fa715bd93d55a195923ae17c9c36d39e27e52fab7(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7140a79eb925937016b0d6e0f9d6125c74d093c9a25ea2ff2d49e650287dde9b(
    value: typing.Optional[Wafv2WebAclRuleActionAllowCustomRequestHandling],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a212c8d81f9ec2b3e8c0db1916988d9d575903d296c47a111625a53b29380cd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a953437038c6badda026e0d91ec24649d69c3c62a41d859c69c51533acc6785(
    value: typing.Optional[Wafv2WebAclRuleActionAllow],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa27f689f2654baaf5402f6f3d82338cb4f055beeea06cbfd8334f8ab85c4415(
    *,
    custom_response: typing.Optional[typing.Union[Wafv2WebAclRuleActionBlockCustomResponse, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a9634bee3f6fbd084a93a782653be6267334e2cdad7a4e4fcfe115524c8ed1a(
    *,
    response_code: jsii.Number,
    custom_response_body_key: typing.Optional[builtins.str] = None,
    response_header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionBlockCustomResponseResponseHeader, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0069b9260fbad328fadfe53a10453c704024c26d7675916922d82a66bdec3700(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67f9151d1c750132a01946ab1f731e969c2fa38d64052c3945a64dfac473dccd(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionBlockCustomResponseResponseHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b30779274a234d0de4240c2c915cb7d8da7597e70766ee2317d199030b75863e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5887b2c27accf7a2ad13167379b4545fa37aaee98ec1a993e84b07fc6d9a995c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4f79c3228a01f0bbe1dbc85146dc45d4e8395a88d72b8ae7bc175b074d01698(
    value: typing.Optional[Wafv2WebAclRuleActionBlockCustomResponse],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__418a04d23e4bfc75a109d6cfb6c9876ea45b30b679cd02fee1e8e305aa013f24(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3b146fc3afeaeb366580f5192d1ebcec1b377338ead8024f0514520080b2d45(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e8b4bbf854e52f5c5c09f48392f7ba140984e06036f09ef2dcc2915b9a7a3db(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32d9f9c49b7d0cdbdd875beb489399256e4a9d529e9af83f1088528406641338(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e176304627238a8b3763fa0a4af013629a1867b10dffb9550cdeefeae9f8f24(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d64ad5f6c290a969d919aa557ec3ac3642e72b6136b7313ac583b94c44a2126(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e6aac0d5b08a051df3b0ca9be80947a093d97b84bf261dbd1b1753c8da4f4ba(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionBlockCustomResponseResponseHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__670e2ce2d6399a108318159a0b633f8c0638f575d14ee81b7e1fae0101f705f3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c62d3077e72e00693abd91c9bf6aacd86031de94814b4b533c8e5850103e741(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e02bf71cce5c473fd15c7c2778643b021123e3f6659b9cb19fd64e89395112ca(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f1cb812036d98f878f4fee055e7890045d158a643a5a22334d88763a4ace16b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionBlockCustomResponseResponseHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b57fd3ac3291c912859a6f744cdf074298ce6f13b82b7018f523962b9c23cd53(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41a84bb42e46f505c7162c54b08712402a60df8f566f2e10088b58d86adf5147(
    value: typing.Optional[Wafv2WebAclRuleActionBlock],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42d2c51239ccdf5bb447332874b47b5e6203f27bfceb40cae1526397f3567c19(
    *,
    custom_request_handling: typing.Optional[typing.Union[Wafv2WebAclRuleActionCaptchaCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ecd6b3408ec1a77a7f2633c128c901388c6f35d641bcca32977a4c7bf4147db3(
    *,
    insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6a66a14c6bd48397cfbbbb16d94cd53c2cdf413f8150f1fdc2e9a9f3ae39c0a(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5fc631dbd029929d51e7a5c3823bcccd353f65c8b483efaa961f1e8b1781f3fc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70a1cfcc22b8f3ab475cbb1df555b164d3ccfff58651bc990eb193882d87fe1e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42ad57a5f361f133d1edee030199d5538b074be80b148a39ec5d8b43cea5bbc6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1c9106eef1e815fca08f01c7ebfd7a5593e10c5b38470c13de8f33885c0878e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fcc4d5a40f5c356b5cf383376befa5c6e97300b33ff801ed07f7825151a7e1c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1355c62f879aea61dfe4df5af0bf7922474e98ac2fc4420e909d1645b2c84e7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d656430a38f353422d8956005731b2f9122ead31eca52b5f8fce7c5132bd8f2c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c744fb39b54e693b4782c3bb018debb05d620930ae6399f33480886416b0279c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08756486289590a2c395e9fffefaf7c3fb492bcb27162f7534b85e0fb079699e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69ac5b1c87362c246266abc3873b3541a3563ee39179b3598e064c68246cb3fa(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da26be1279395aa158ea502ba264186d9226193b4255dbfb8a7bbf6fff423788(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd23e27fd70b10365d6c8a1d452dfc2190caf99d20fc1cc8bfb863eed34e911d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionCaptchaCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ac566e21f1685f9f2b0a9af19049432540ecda39af8892ab08175e9c4241a73(
    value: typing.Optional[Wafv2WebAclRuleActionCaptchaCustomRequestHandling],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59431a6bc2ba191eff09e9fb42309b9d869ecbf241123f6c28572ee0a21c26c4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ea796c8cbebe7e6d17bb01ac305b0be8a40231b0b35cea34cfacd9f605a7c50(
    value: typing.Optional[Wafv2WebAclRuleActionCaptcha],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ace5c6da8d92b644e19923af7d2b0ac2c04f6000268d81ad022cc26c0bfce294(
    *,
    custom_request_handling: typing.Optional[typing.Union[Wafv2WebAclRuleActionChallengeCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1677690d72ee46c8ec7718e9794cde2a214123531766aebf2816b4bf266f3793(
    *,
    insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b07aab258bf1630dad99639f39edaa23bce6aa6f17e1b3cebf615a094fdc538a(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__374d8498bc6fbd5c7ca46250f30c777b8aadb1752c56578bc18ef713a7ce3e9a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8dab096ca1be202753559995e25f059acfe90a66bcb0a8ad2e83b34ad79199a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__192a52a41ec80cfd1ff364c333795617dd6093135bcf330b00f8ff45c915e4e5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb3599655b4932e5210a9e284b748fee00177210524a84d20f58c0cd9292f81d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__200a14a487947265af47b6de1e89e25870556dc9f3a4fa28fb9b57b3171ba463(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85e9c36e7214cb6cd2aa22d15c09f050cdab87cd5e60fc4ac017c96c89f597c4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30849916d7470dc24eccd52e75d0dbd533c85e0b8592304df430834216a61ba8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01faad36359e7edabda4bc3e514f9f3c1485a61914751d960fbd94d348f61f8f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__36d4b864bb0133137ee315c77e796f99ad3f1fd2a2578832c62a198fa13fd88e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf29f52e0235ddf7dbc6743ddcc02c6c357f335e7207ccb138bcc349da03ee90(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3afa17c9543de2e4285a1dec550a91df2e3d3027bb96ed3cec7ca64a2daedbc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4bb5cd7a477f004d362c4c167e88fa40652ff43d7c61261ddad239996ada3400(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionChallengeCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e3d69f87cf78c0dcea048f2f09d39984c9b69d567e56981683f1b3a2176e528(
    value: typing.Optional[Wafv2WebAclRuleActionChallengeCustomRequestHandling],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d20f7779e7eed05a830f813df7728b133adf204ba0c7e77a77998e9a20411db4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__317a6235f655d1d6badc971f3c62519fbf8da3274586e65d03c2add84fbee9b7(
    value: typing.Optional[Wafv2WebAclRuleActionChallenge],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59548aca1b7a773ff9616bbc8de99150df8b7c1e3893c407c6eaf16dacb730be(
    *,
    custom_request_handling: typing.Optional[typing.Union[Wafv2WebAclRuleActionCountCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31c40dbb928a64245a7acb7baff63ad162571df1af3868433c06881f1a6ec61b(
    *,
    insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca9b1b54a3639c79adbf27dcae1545df6ab78280149e8bbd99153e342e207d1a(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d3b21a0fad9bf18e718a07762b976e161176917ffda3a2cbce16b473a410b62(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aaf4065c8fc77a1139c708c6aa2533035a2d344a45e059184bb174bdda70d677(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77493beee854d2c1d2ec828266af0b66f1783b3e5adba3936004dfd1baf191d6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__50dfe9c53604ac92e9171cba3be7849edf238eef3185ac19b7978c88cf0f0bf0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__237fe588fe988f04cfbe7f2baac45e562eb171e9b7d660e72af2c48b1807dbf1(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__754ba0026011e9c69ced9cf880c1260b64a84cc6a026429b461f85e1135ae4a7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e9e91e658476ce510a0294b4eef0d2ec4978ff2525a02c689d846254a949d4e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f941ec9ca4bd394d477a86acca338a3d4d30879205d868f3ac2922c834c6aa03(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49832546194a96ebc3ff950a881459fd69e1271975fcdcfdabb06b92aeb7eab9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd7a22ccad84acfd4a687eff6b13c12c57626a1c99027a5dfdceb3aa35d430c9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1e88776ae5ff27010682c020118bec80908c453fd0440a04c15b965002c5ceb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7963ea60ae763cceae9cb5b23466825c2631635b780d6b69929bdf8f42f57868(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleActionCountCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7b9f27ca5357d6f7f513e68bcbaa4401f5276bc2eef704ba0c9d9c05b888148(
    value: typing.Optional[Wafv2WebAclRuleActionCountCustomRequestHandling],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__501bc985fefd732b4c66910d2a1f50abebfd880a63434d0893c36b7687bece5e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d34d6028a8ca2cd7b9782e3eca6abb21119799b5b845b287060b4ca49a89446(
    value: typing.Optional[Wafv2WebAclRuleActionCount],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ddf782145cb271e0454c812fad91241f67aed1a98eb01cf17aef9e3cfe9fe000(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f0e1cd3c65142f3f93c2459ddefd85cd380dff9f5151a5ba119df559bce4c9b(
    value: typing.Optional[Wafv2WebAclRuleAction],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c56cce68b8bc359043c8b8daa9b7d093dc90e86cec36d200410a6f5298c89855(
    *,
    immunity_time_property: typing.Optional[typing.Union[Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e24eeb203ef6bfea61320119c7357a297fd55c6d128b7ab414eed4a978dff9e(
    *,
    immunity_time: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3106a19804531978812407e768156bb9eb0dfee477258d760d86d510f968a7d8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7302bd9361f15fb515dddb9a5f4747e2478f81e3bf18eeda3139f72445683a63(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ea989a65a0b4c82b35b4fbee680a259581a761cd59ef2d53f2b8a763b841327(
    value: typing.Optional[Wafv2WebAclRuleCaptchaConfigImmunityTimeProperty],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea08212713474d4165d6fff8bec071dc04b663d129ca971d2e49f548e003e426(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c69c500b9e19975bc425f03f8aea6316a7fbebeb912b92536505f009cb82bbe8(
    value: typing.Optional[Wafv2WebAclRuleCaptchaConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c94954b3ac454547df29dd5bc676b18bcfabcfed5dec38b7c3d43267d1eec1f(
    *,
    immunity_time_property: typing.Optional[typing.Union[Wafv2WebAclRuleChallengeConfigImmunityTimeProperty, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abbefc725330c98192b8ca2b52fe365fed21437a9d09eaa850f73443b2ade8c2(
    *,
    immunity_time: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91e0851c0e0d7fb3841e5b1da1e5473a3e6ccdd27c8eb21151a5ee8cf0c3d834(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4cc2cdf8bd5335233ddeb1691ec7cf8a923ae99db2abdab449c0febcb0e8f1d6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5922ccab3f18411d2e238831058509f3cf558213f16fc794699fe1047308e4a7(
    value: typing.Optional[Wafv2WebAclRuleChallengeConfigImmunityTimeProperty],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7310923e4639235b5179baded0c95893dc0e8cd06aca8e36096675b4afe7f575(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6bd9b7f1c2bbd4b59c2ade78d9525abf68552f1d05764789dd5a1bfbb9f364b(
    value: typing.Optional[Wafv2WebAclRuleChallengeConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68a71874ee24a4f97dee6ddca399ac700dad6b2d1816d445cb6733b9e687fabf(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8735e0c0a1e1de7eeabeee4c391f80a4297cf7abe5874e3e40484b6ddb19ac2f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ca241d61527a9ffe678fe6410674a1bca62f3ab5401bfe513f7d6741d565ca1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0dc8664bf97f444b2848d296245e5637dc0557001b8839741fc6d1dc4ff05696(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d91d8fa7f2af508b699a31e45062e80cf7901e7d7d3c10dfa0f7b9b4d717e6d7(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6c3b198e5d6b735f5a534d571af26c46eb49a0b333492106f4bcf99b1d367d7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRule]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0533c14cbe1f942143b7b728df33edf7dbed32f6c15bcb7905745e004cef1b1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__507d30f88b5afaea82abe2a81b9c5a8a221bcca0ca876c90063b50ac3390c62a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2WebAclRuleRuleLabel, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d35691b81388e99cd7f96cb4ffaa328d15367dad219ab53bfddfdeafb8d3595(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87af4bca76a2472d52c3b7c7997327f679a17739c243967539a70275002523e9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3871ff3e275bff2c8984840667206077db0bf4659ec1d4cd5facf003212242d1(
    value: typing.Any,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__596661f30a033faf12d1b6f3b36b6222f8aac373485f26e84699cd73471b232c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRule]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c607d955ed818f8cfad9036a7b240022aeeffc7ea5c6244e63d45023fae605b(
    *,
    count: typing.Optional[typing.Union[Wafv2WebAclRuleOverrideActionCount, typing.Dict[builtins.str, typing.Any]]] = None,
    none: typing.Optional[typing.Union[Wafv2WebAclRuleOverrideActionNone, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f13f7d4a9b85adccb9c87871794704f5b284aad6b0de9b6f6d6454124b0dc9ec(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57e25e4394cc047ee3a58969a698a77a9c4ddd8ca7856a466492c7177f430e9e(
    value: typing.Optional[Wafv2WebAclRuleOverrideActionCount],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__996ca002f2a8a0de1bc30d2bfd30c98c992928635524d449cde64d125fb2b5b8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__26293d9e901845fa893fd978c6342a421fe703ea1eed8676088f3fd35e5e7ced(
    value: typing.Optional[Wafv2WebAclRuleOverrideActionNone],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5a93d72a061cf19fc48df9f23865052c4ae6a5344bb60f06ce76702cee97176(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__471f078309f99a48b654c865ddd666a1df27c64f191adea493c5a29821ebd8f9(
    value: typing.Optional[Wafv2WebAclRuleOverrideAction],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdc2a9089efdce79b2f09e39bcf227c0e2ea65a3f92a2680f1425dbf0e67e6fb(
    *,
    name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3da24a4afcbce00f5d6832c50c75eb23ebe61807b1a9fc4860c7d8144eace8c0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2526941613721383fe7152258e8388155ad34e832f6b4c8926ba3df43dd0a62(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fc3a6228188489742b64d38307aab827c762002e8509ff004a4bfc705b27993(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db8fcf969c88dc94a178c0d5dcd060862fe3ff885a288e4a20c37c4e4770dc9a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c18f8502c24071744ccbf29aaf6bd16b531911dfcbef3ed140d4a276533a0642(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c8871640007152ed95945ddb0ef21622017a6ededbab74243360dc196903420(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2WebAclRuleRuleLabel]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28ee80392e38af2a828bad7ba5f9437e8807f29e614910d29f1aa00986fdb330(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61070b01e050e9b65bb4edb95160b7ebf4fd276b58ca9b51afb8b692f6c413fd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d9d59c8acc00ac8f32a2e21613a8f7c5b61a1278de2d323009c692748094697(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2WebAclRuleRuleLabel]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0f3e58bdcc92442258163554cc0a84222634fd49e0a5b2e29260409a1fa33eb(
    *,
    cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    metric_name: builtins.str,
    sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9b9e8f3edde8eca61030e3433c160055157c764be5569a3a1ce62fda22c800d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2dab47ca7a629422911563db707b3a141d1b1beacd822ec327ef1b2bc297d2b(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83ca27fc88389ecfd900e3a9ede01191a694821a663d165a3b8d94ff5f4e41a5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6d73552311e1b61666f0f6bd73847054ac00ce8e9c90d8ff44d8e8efcc1fead(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07c2a1b5e7367db1c1da6a2a0edfe1a6c94fb9e339f5cb28bb8abe0fe8b8de8e(
    value: typing.Optional[Wafv2WebAclRuleVisibilityConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0802692d91b910413568b9167abac4732040666e428b0054d731bbae8d4ded9(
    *,
    cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    metric_name: builtins.str,
    sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17288f4bfa474ae64871b9b692a90751689845c68133d0a9c443e5735926077c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ea458a0dc2126c4f28172b0a8512fde751a17c83e9bfdc2192b7a3ab38a84d4(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__275396df5fa93d4351b6d60179fb36ac11a24f63d575c2614811d6e4f566991c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ac092303792cfaf4a556094a36a8e8118834233ad58db2d036e0ad0c17cea43(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1a988e8e43e7557076f40ff9f3c71fdcd20ff2e9116002c8878df32bb89ba19(
    value: typing.Optional[Wafv2WebAclVisibilityConfig],
) -> None:
    """Type checking stubs"""
    pass
