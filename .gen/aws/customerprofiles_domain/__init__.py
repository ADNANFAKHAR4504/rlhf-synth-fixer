r'''
# `aws_customerprofiles_domain`

Refer to the Terraform Registry for docs: [`aws_customerprofiles_domain`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain).
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


class CustomerprofilesDomain(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomain",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain aws_customerprofiles_domain}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        default_expiration_days: jsii.Number,
        domain_name: builtins.str,
        dead_letter_queue_url: typing.Optional[builtins.str] = None,
        default_encryption_key: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        matching: typing.Optional[typing.Union["CustomerprofilesDomainMatching", typing.Dict[builtins.str, typing.Any]]] = None,
        rule_based_matching: typing.Optional[typing.Union["CustomerprofilesDomainRuleBasedMatching", typing.Dict[builtins.str, typing.Any]]] = None,
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
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain aws_customerprofiles_domain} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param default_expiration_days: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#default_expiration_days CustomerprofilesDomain#default_expiration_days}.
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#domain_name CustomerprofilesDomain#domain_name}.
        :param dead_letter_queue_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#dead_letter_queue_url CustomerprofilesDomain#dead_letter_queue_url}.
        :param default_encryption_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#default_encryption_key CustomerprofilesDomain#default_encryption_key}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#id CustomerprofilesDomain#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param matching: matching block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching CustomerprofilesDomain#matching}
        :param rule_based_matching: rule_based_matching block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#rule_based_matching CustomerprofilesDomain#rule_based_matching}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#tags CustomerprofilesDomain#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#tags_all CustomerprofilesDomain#tags_all}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8bffed2bd8dca099c4d61a6a307b4127164248a88fb9f005eff0aa1403abff70)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = CustomerprofilesDomainConfig(
            default_expiration_days=default_expiration_days,
            domain_name=domain_name,
            dead_letter_queue_url=dead_letter_queue_url,
            default_encryption_key=default_encryption_key,
            id=id,
            matching=matching,
            rule_based_matching=rule_based_matching,
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
        '''Generates CDKTF code for importing a CustomerprofilesDomain resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the CustomerprofilesDomain to import.
        :param import_from_id: The id of the existing CustomerprofilesDomain that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the CustomerprofilesDomain to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08d8a944bc66ac565af07cf7bc04e689a71551ba2eb759b5d016c2e212c11e13)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putMatching")
    def put_matching(
        self,
        *,
        enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        auto_merging: typing.Optional[typing.Union["CustomerprofilesDomainMatchingAutoMerging", typing.Dict[builtins.str, typing.Any]]] = None,
        exporting_config: typing.Optional[typing.Union["CustomerprofilesDomainMatchingExportingConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        job_schedule: typing.Optional[typing.Union["CustomerprofilesDomainMatchingJobSchedule", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.
        :param auto_merging: auto_merging block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#auto_merging CustomerprofilesDomain#auto_merging}
        :param exporting_config: exporting_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#exporting_config CustomerprofilesDomain#exporting_config}
        :param job_schedule: job_schedule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#job_schedule CustomerprofilesDomain#job_schedule}
        '''
        value = CustomerprofilesDomainMatching(
            enabled=enabled,
            auto_merging=auto_merging,
            exporting_config=exporting_config,
            job_schedule=job_schedule,
        )

        return typing.cast(None, jsii.invoke(self, "putMatching", [value]))

    @jsii.member(jsii_name="putRuleBasedMatching")
    def put_rule_based_matching(
        self,
        *,
        enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        attribute_types_selector: typing.Optional[typing.Union["CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector", typing.Dict[builtins.str, typing.Any]]] = None,
        conflict_resolution: typing.Optional[typing.Union["CustomerprofilesDomainRuleBasedMatchingConflictResolution", typing.Dict[builtins.str, typing.Any]]] = None,
        exporting_config: typing.Optional[typing.Union["CustomerprofilesDomainRuleBasedMatchingExportingConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        matching_rules: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CustomerprofilesDomainRuleBasedMatchingMatchingRules", typing.Dict[builtins.str, typing.Any]]]]] = None,
        max_allowed_rule_level_for_matching: typing.Optional[jsii.Number] = None,
        max_allowed_rule_level_for_merging: typing.Optional[jsii.Number] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.
        :param attribute_types_selector: attribute_types_selector block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#attribute_types_selector CustomerprofilesDomain#attribute_types_selector}
        :param conflict_resolution: conflict_resolution block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolution CustomerprofilesDomain#conflict_resolution}
        :param exporting_config: exporting_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#exporting_config CustomerprofilesDomain#exporting_config}
        :param matching_rules: matching_rules block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_rules CustomerprofilesDomain#matching_rules}
        :param max_allowed_rule_level_for_matching: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#max_allowed_rule_level_for_matching CustomerprofilesDomain#max_allowed_rule_level_for_matching}.
        :param max_allowed_rule_level_for_merging: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#max_allowed_rule_level_for_merging CustomerprofilesDomain#max_allowed_rule_level_for_merging}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#status CustomerprofilesDomain#status}.
        '''
        value = CustomerprofilesDomainRuleBasedMatching(
            enabled=enabled,
            attribute_types_selector=attribute_types_selector,
            conflict_resolution=conflict_resolution,
            exporting_config=exporting_config,
            matching_rules=matching_rules,
            max_allowed_rule_level_for_matching=max_allowed_rule_level_for_matching,
            max_allowed_rule_level_for_merging=max_allowed_rule_level_for_merging,
            status=status,
        )

        return typing.cast(None, jsii.invoke(self, "putRuleBasedMatching", [value]))

    @jsii.member(jsii_name="resetDeadLetterQueueUrl")
    def reset_dead_letter_queue_url(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeadLetterQueueUrl", []))

    @jsii.member(jsii_name="resetDefaultEncryptionKey")
    def reset_default_encryption_key(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultEncryptionKey", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetMatching")
    def reset_matching(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMatching", []))

    @jsii.member(jsii_name="resetRuleBasedMatching")
    def reset_rule_based_matching(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRuleBasedMatching", []))

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
    @jsii.member(jsii_name="matching")
    def matching(self) -> "CustomerprofilesDomainMatchingOutputReference":
        return typing.cast("CustomerprofilesDomainMatchingOutputReference", jsii.get(self, "matching"))

    @builtins.property
    @jsii.member(jsii_name="ruleBasedMatching")
    def rule_based_matching(
        self,
    ) -> "CustomerprofilesDomainRuleBasedMatchingOutputReference":
        return typing.cast("CustomerprofilesDomainRuleBasedMatchingOutputReference", jsii.get(self, "ruleBasedMatching"))

    @builtins.property
    @jsii.member(jsii_name="deadLetterQueueUrlInput")
    def dead_letter_queue_url_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deadLetterQueueUrlInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultEncryptionKeyInput")
    def default_encryption_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultEncryptionKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultExpirationDaysInput")
    def default_expiration_days_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultExpirationDaysInput"))

    @builtins.property
    @jsii.member(jsii_name="domainNameInput")
    def domain_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainNameInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="matchingInput")
    def matching_input(self) -> typing.Optional["CustomerprofilesDomainMatching"]:
        return typing.cast(typing.Optional["CustomerprofilesDomainMatching"], jsii.get(self, "matchingInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleBasedMatchingInput")
    def rule_based_matching_input(
        self,
    ) -> typing.Optional["CustomerprofilesDomainRuleBasedMatching"]:
        return typing.cast(typing.Optional["CustomerprofilesDomainRuleBasedMatching"], jsii.get(self, "ruleBasedMatchingInput"))

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
    @jsii.member(jsii_name="deadLetterQueueUrl")
    def dead_letter_queue_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deadLetterQueueUrl"))

    @dead_letter_queue_url.setter
    def dead_letter_queue_url(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15a8bcadb771405f084fba268fa25567bcf7fac46bf42163277566c6fcec7018)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deadLetterQueueUrl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultEncryptionKey")
    def default_encryption_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultEncryptionKey"))

    @default_encryption_key.setter
    def default_encryption_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c07aaced82d0bc9ab0aa4531f6e0e016066a8c75c08ff317881d86f683ae8a92)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultEncryptionKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultExpirationDays")
    def default_expiration_days(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultExpirationDays"))

    @default_expiration_days.setter
    def default_expiration_days(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d0522c6f404c015934c0e003487d7d8bb628a4142e555068deaf311caf58e8d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultExpirationDays", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="domainName")
    def domain_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domainName"))

    @domain_name.setter
    def domain_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__572e9c27d061d4b1a172dd88dd5c39093a6be7f69402bbc59ba2ee879783f338)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domainName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b15f94f9438866dd30fa51aacee06c2efc92e73b9dce7bf3c9c1f9532873495)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c28da7049d856f5a04439d88ad5900dc6cdc3c67778eca43d2cb0a3f0bd53ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce51ad6b6e12f4637c36b3b0e68eab8b23b5546930cf0a93ed27336d1ee6e9a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "default_expiration_days": "defaultExpirationDays",
        "domain_name": "domainName",
        "dead_letter_queue_url": "deadLetterQueueUrl",
        "default_encryption_key": "defaultEncryptionKey",
        "id": "id",
        "matching": "matching",
        "rule_based_matching": "ruleBasedMatching",
        "tags": "tags",
        "tags_all": "tagsAll",
    },
)
class CustomerprofilesDomainConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        default_expiration_days: jsii.Number,
        domain_name: builtins.str,
        dead_letter_queue_url: typing.Optional[builtins.str] = None,
        default_encryption_key: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        matching: typing.Optional[typing.Union["CustomerprofilesDomainMatching", typing.Dict[builtins.str, typing.Any]]] = None,
        rule_based_matching: typing.Optional[typing.Union["CustomerprofilesDomainRuleBasedMatching", typing.Dict[builtins.str, typing.Any]]] = None,
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
        :param default_expiration_days: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#default_expiration_days CustomerprofilesDomain#default_expiration_days}.
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#domain_name CustomerprofilesDomain#domain_name}.
        :param dead_letter_queue_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#dead_letter_queue_url CustomerprofilesDomain#dead_letter_queue_url}.
        :param default_encryption_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#default_encryption_key CustomerprofilesDomain#default_encryption_key}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#id CustomerprofilesDomain#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param matching: matching block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching CustomerprofilesDomain#matching}
        :param rule_based_matching: rule_based_matching block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#rule_based_matching CustomerprofilesDomain#rule_based_matching}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#tags CustomerprofilesDomain#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#tags_all CustomerprofilesDomain#tags_all}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(matching, dict):
            matching = CustomerprofilesDomainMatching(**matching)
        if isinstance(rule_based_matching, dict):
            rule_based_matching = CustomerprofilesDomainRuleBasedMatching(**rule_based_matching)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15ff99dbea96344546cb0d29bd89f2329cea708e43e4e4a9d623d7fb2eeea464)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument default_expiration_days", value=default_expiration_days, expected_type=type_hints["default_expiration_days"])
            check_type(argname="argument domain_name", value=domain_name, expected_type=type_hints["domain_name"])
            check_type(argname="argument dead_letter_queue_url", value=dead_letter_queue_url, expected_type=type_hints["dead_letter_queue_url"])
            check_type(argname="argument default_encryption_key", value=default_encryption_key, expected_type=type_hints["default_encryption_key"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument matching", value=matching, expected_type=type_hints["matching"])
            check_type(argname="argument rule_based_matching", value=rule_based_matching, expected_type=type_hints["rule_based_matching"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_expiration_days": default_expiration_days,
            "domain_name": domain_name,
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
        if dead_letter_queue_url is not None:
            self._values["dead_letter_queue_url"] = dead_letter_queue_url
        if default_encryption_key is not None:
            self._values["default_encryption_key"] = default_encryption_key
        if id is not None:
            self._values["id"] = id
        if matching is not None:
            self._values["matching"] = matching
        if rule_based_matching is not None:
            self._values["rule_based_matching"] = rule_based_matching
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
    def default_expiration_days(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#default_expiration_days CustomerprofilesDomain#default_expiration_days}.'''
        result = self._values.get("default_expiration_days")
        assert result is not None, "Required property 'default_expiration_days' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def domain_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#domain_name CustomerprofilesDomain#domain_name}.'''
        result = self._values.get("domain_name")
        assert result is not None, "Required property 'domain_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def dead_letter_queue_url(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#dead_letter_queue_url CustomerprofilesDomain#dead_letter_queue_url}.'''
        result = self._values.get("dead_letter_queue_url")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def default_encryption_key(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#default_encryption_key CustomerprofilesDomain#default_encryption_key}.'''
        result = self._values.get("default_encryption_key")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#id CustomerprofilesDomain#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def matching(self) -> typing.Optional["CustomerprofilesDomainMatching"]:
        '''matching block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching CustomerprofilesDomain#matching}
        '''
        result = self._values.get("matching")
        return typing.cast(typing.Optional["CustomerprofilesDomainMatching"], result)

    @builtins.property
    def rule_based_matching(
        self,
    ) -> typing.Optional["CustomerprofilesDomainRuleBasedMatching"]:
        '''rule_based_matching block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#rule_based_matching CustomerprofilesDomain#rule_based_matching}
        '''
        result = self._values.get("rule_based_matching")
        return typing.cast(typing.Optional["CustomerprofilesDomainRuleBasedMatching"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#tags CustomerprofilesDomain#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#tags_all CustomerprofilesDomain#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatching",
    jsii_struct_bases=[],
    name_mapping={
        "enabled": "enabled",
        "auto_merging": "autoMerging",
        "exporting_config": "exportingConfig",
        "job_schedule": "jobSchedule",
    },
)
class CustomerprofilesDomainMatching:
    def __init__(
        self,
        *,
        enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        auto_merging: typing.Optional[typing.Union["CustomerprofilesDomainMatchingAutoMerging", typing.Dict[builtins.str, typing.Any]]] = None,
        exporting_config: typing.Optional[typing.Union["CustomerprofilesDomainMatchingExportingConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        job_schedule: typing.Optional[typing.Union["CustomerprofilesDomainMatchingJobSchedule", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.
        :param auto_merging: auto_merging block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#auto_merging CustomerprofilesDomain#auto_merging}
        :param exporting_config: exporting_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#exporting_config CustomerprofilesDomain#exporting_config}
        :param job_schedule: job_schedule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#job_schedule CustomerprofilesDomain#job_schedule}
        '''
        if isinstance(auto_merging, dict):
            auto_merging = CustomerprofilesDomainMatchingAutoMerging(**auto_merging)
        if isinstance(exporting_config, dict):
            exporting_config = CustomerprofilesDomainMatchingExportingConfig(**exporting_config)
        if isinstance(job_schedule, dict):
            job_schedule = CustomerprofilesDomainMatchingJobSchedule(**job_schedule)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__825cf70c05d57b3da8f85654df7d516644d6141a21d378a7997a2d6286a7fe86)
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
            check_type(argname="argument auto_merging", value=auto_merging, expected_type=type_hints["auto_merging"])
            check_type(argname="argument exporting_config", value=exporting_config, expected_type=type_hints["exporting_config"])
            check_type(argname="argument job_schedule", value=job_schedule, expected_type=type_hints["job_schedule"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "enabled": enabled,
        }
        if auto_merging is not None:
            self._values["auto_merging"] = auto_merging
        if exporting_config is not None:
            self._values["exporting_config"] = exporting_config
        if job_schedule is not None:
            self._values["job_schedule"] = job_schedule

    @builtins.property
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.'''
        result = self._values.get("enabled")
        assert result is not None, "Required property 'enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def auto_merging(
        self,
    ) -> typing.Optional["CustomerprofilesDomainMatchingAutoMerging"]:
        '''auto_merging block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#auto_merging CustomerprofilesDomain#auto_merging}
        '''
        result = self._values.get("auto_merging")
        return typing.cast(typing.Optional["CustomerprofilesDomainMatchingAutoMerging"], result)

    @builtins.property
    def exporting_config(
        self,
    ) -> typing.Optional["CustomerprofilesDomainMatchingExportingConfig"]:
        '''exporting_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#exporting_config CustomerprofilesDomain#exporting_config}
        '''
        result = self._values.get("exporting_config")
        return typing.cast(typing.Optional["CustomerprofilesDomainMatchingExportingConfig"], result)

    @builtins.property
    def job_schedule(
        self,
    ) -> typing.Optional["CustomerprofilesDomainMatchingJobSchedule"]:
        '''job_schedule block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#job_schedule CustomerprofilesDomain#job_schedule}
        '''
        result = self._values.get("job_schedule")
        return typing.cast(typing.Optional["CustomerprofilesDomainMatchingJobSchedule"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainMatching(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMerging",
    jsii_struct_bases=[],
    name_mapping={
        "enabled": "enabled",
        "conflict_resolution": "conflictResolution",
        "consolidation": "consolidation",
        "min_allowed_confidence_score_for_merging": "minAllowedConfidenceScoreForMerging",
    },
)
class CustomerprofilesDomainMatchingAutoMerging:
    def __init__(
        self,
        *,
        enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        conflict_resolution: typing.Optional[typing.Union["CustomerprofilesDomainMatchingAutoMergingConflictResolution", typing.Dict[builtins.str, typing.Any]]] = None,
        consolidation: typing.Optional[typing.Union["CustomerprofilesDomainMatchingAutoMergingConsolidation", typing.Dict[builtins.str, typing.Any]]] = None,
        min_allowed_confidence_score_for_merging: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.
        :param conflict_resolution: conflict_resolution block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolution CustomerprofilesDomain#conflict_resolution}
        :param consolidation: consolidation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#consolidation CustomerprofilesDomain#consolidation}
        :param min_allowed_confidence_score_for_merging: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#min_allowed_confidence_score_for_merging CustomerprofilesDomain#min_allowed_confidence_score_for_merging}.
        '''
        if isinstance(conflict_resolution, dict):
            conflict_resolution = CustomerprofilesDomainMatchingAutoMergingConflictResolution(**conflict_resolution)
        if isinstance(consolidation, dict):
            consolidation = CustomerprofilesDomainMatchingAutoMergingConsolidation(**consolidation)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__182646f5cbce936f840082ba30e30f28ddf37feaec97640527c8115901c3e989)
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
            check_type(argname="argument conflict_resolution", value=conflict_resolution, expected_type=type_hints["conflict_resolution"])
            check_type(argname="argument consolidation", value=consolidation, expected_type=type_hints["consolidation"])
            check_type(argname="argument min_allowed_confidence_score_for_merging", value=min_allowed_confidence_score_for_merging, expected_type=type_hints["min_allowed_confidence_score_for_merging"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "enabled": enabled,
        }
        if conflict_resolution is not None:
            self._values["conflict_resolution"] = conflict_resolution
        if consolidation is not None:
            self._values["consolidation"] = consolidation
        if min_allowed_confidence_score_for_merging is not None:
            self._values["min_allowed_confidence_score_for_merging"] = min_allowed_confidence_score_for_merging

    @builtins.property
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.'''
        result = self._values.get("enabled")
        assert result is not None, "Required property 'enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def conflict_resolution(
        self,
    ) -> typing.Optional["CustomerprofilesDomainMatchingAutoMergingConflictResolution"]:
        '''conflict_resolution block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolution CustomerprofilesDomain#conflict_resolution}
        '''
        result = self._values.get("conflict_resolution")
        return typing.cast(typing.Optional["CustomerprofilesDomainMatchingAutoMergingConflictResolution"], result)

    @builtins.property
    def consolidation(
        self,
    ) -> typing.Optional["CustomerprofilesDomainMatchingAutoMergingConsolidation"]:
        '''consolidation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#consolidation CustomerprofilesDomain#consolidation}
        '''
        result = self._values.get("consolidation")
        return typing.cast(typing.Optional["CustomerprofilesDomainMatchingAutoMergingConsolidation"], result)

    @builtins.property
    def min_allowed_confidence_score_for_merging(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#min_allowed_confidence_score_for_merging CustomerprofilesDomain#min_allowed_confidence_score_for_merging}.'''
        result = self._values.get("min_allowed_confidence_score_for_merging")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainMatchingAutoMerging(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMergingConflictResolution",
    jsii_struct_bases=[],
    name_mapping={
        "conflict_resolving_model": "conflictResolvingModel",
        "source_name": "sourceName",
    },
)
class CustomerprofilesDomainMatchingAutoMergingConflictResolution:
    def __init__(
        self,
        *,
        conflict_resolving_model: builtins.str,
        source_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param conflict_resolving_model: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolving_model CustomerprofilesDomain#conflict_resolving_model}.
        :param source_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#source_name CustomerprofilesDomain#source_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c592a087029dc09fa467fe0ebdb65c6d97f47da6ae8cdc05cf21829108d66877)
            check_type(argname="argument conflict_resolving_model", value=conflict_resolving_model, expected_type=type_hints["conflict_resolving_model"])
            check_type(argname="argument source_name", value=source_name, expected_type=type_hints["source_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "conflict_resolving_model": conflict_resolving_model,
        }
        if source_name is not None:
            self._values["source_name"] = source_name

    @builtins.property
    def conflict_resolving_model(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolving_model CustomerprofilesDomain#conflict_resolving_model}.'''
        result = self._values.get("conflict_resolving_model")
        assert result is not None, "Required property 'conflict_resolving_model' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def source_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#source_name CustomerprofilesDomain#source_name}.'''
        result = self._values.get("source_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainMatchingAutoMergingConflictResolution(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesDomainMatchingAutoMergingConflictResolutionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMergingConflictResolutionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__be8bb7b583f8d98efdd980241787501cfb41d985d36c2e0234bdcc4e8179809d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSourceName")
    def reset_source_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceName", []))

    @builtins.property
    @jsii.member(jsii_name="conflictResolvingModelInput")
    def conflict_resolving_model_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "conflictResolvingModelInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceNameInput")
    def source_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceNameInput"))

    @builtins.property
    @jsii.member(jsii_name="conflictResolvingModel")
    def conflict_resolving_model(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "conflictResolvingModel"))

    @conflict_resolving_model.setter
    def conflict_resolving_model(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a244ac0efa0264f369626214bedb38b4993adecb7b95d18dc246018fa475c6d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "conflictResolvingModel", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sourceName")
    def source_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceName"))

    @source_name.setter
    def source_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c524b3367d4fff205737b0e2aca0e6c38a15fb85440ad7fdf5144109f23c225)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingAutoMergingConflictResolution]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingAutoMergingConflictResolution], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainMatchingAutoMergingConflictResolution],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b13d6a5df2cba16e4111c047d39ebaadf9b460f758125920571454d4cf93dc75)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMergingConsolidation",
    jsii_struct_bases=[],
    name_mapping={"matching_attributes_list": "matchingAttributesList"},
)
class CustomerprofilesDomainMatchingAutoMergingConsolidation:
    def __init__(
        self,
        *,
        matching_attributes_list: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Sequence[builtins.str]]],
    ) -> None:
        '''
        :param matching_attributes_list: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_attributes_list CustomerprofilesDomain#matching_attributes_list}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1060c90eedf16bbeeb16bd9dee4a401bc2ed4fa29abbd2bdb2232e57297ca92)
            check_type(argname="argument matching_attributes_list", value=matching_attributes_list, expected_type=type_hints["matching_attributes_list"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "matching_attributes_list": matching_attributes_list,
        }

    @builtins.property
    def matching_attributes_list(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[typing.List[builtins.str]]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_attributes_list CustomerprofilesDomain#matching_attributes_list}.'''
        result = self._values.get("matching_attributes_list")
        assert result is not None, "Required property 'matching_attributes_list' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[typing.List[builtins.str]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainMatchingAutoMergingConsolidation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3bb485e0f7bf6baef0c53a507d74337f1b86bd4d745cfb41a4b31a566f975e3c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="matchingAttributesListInput")
    def matching_attributes_list_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[typing.List[builtins.str]]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[typing.List[builtins.str]]]], jsii.get(self, "matchingAttributesListInput"))

    @builtins.property
    @jsii.member(jsii_name="matchingAttributesList")
    def matching_attributes_list(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[typing.List[builtins.str]]]:
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[typing.List[builtins.str]]], jsii.get(self, "matchingAttributesList"))

    @matching_attributes_list.setter
    def matching_attributes_list(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[typing.List[builtins.str]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b43e4d9e81203346b9e3cc441c9ba25ce58b058aca89ced4370303f405f8629)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "matchingAttributesList", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingAutoMergingConsolidation]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingAutoMergingConsolidation], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainMatchingAutoMergingConsolidation],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49b94f3a5d032c72fb9e3f28187544bf8c69900628a4ff353c481a59d1809a35)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CustomerprofilesDomainMatchingAutoMergingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMergingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__53aed4515c0837555f495210099ae997b85b28d8868ebff55878d0cf7643c160)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putConflictResolution")
    def put_conflict_resolution(
        self,
        *,
        conflict_resolving_model: builtins.str,
        source_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param conflict_resolving_model: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolving_model CustomerprofilesDomain#conflict_resolving_model}.
        :param source_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#source_name CustomerprofilesDomain#source_name}.
        '''
        value = CustomerprofilesDomainMatchingAutoMergingConflictResolution(
            conflict_resolving_model=conflict_resolving_model, source_name=source_name
        )

        return typing.cast(None, jsii.invoke(self, "putConflictResolution", [value]))

    @jsii.member(jsii_name="putConsolidation")
    def put_consolidation(
        self,
        *,
        matching_attributes_list: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Sequence[builtins.str]]],
    ) -> None:
        '''
        :param matching_attributes_list: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_attributes_list CustomerprofilesDomain#matching_attributes_list}.
        '''
        value = CustomerprofilesDomainMatchingAutoMergingConsolidation(
            matching_attributes_list=matching_attributes_list
        )

        return typing.cast(None, jsii.invoke(self, "putConsolidation", [value]))

    @jsii.member(jsii_name="resetConflictResolution")
    def reset_conflict_resolution(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConflictResolution", []))

    @jsii.member(jsii_name="resetConsolidation")
    def reset_consolidation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConsolidation", []))

    @jsii.member(jsii_name="resetMinAllowedConfidenceScoreForMerging")
    def reset_min_allowed_confidence_score_for_merging(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinAllowedConfidenceScoreForMerging", []))

    @builtins.property
    @jsii.member(jsii_name="conflictResolution")
    def conflict_resolution(
        self,
    ) -> CustomerprofilesDomainMatchingAutoMergingConflictResolutionOutputReference:
        return typing.cast(CustomerprofilesDomainMatchingAutoMergingConflictResolutionOutputReference, jsii.get(self, "conflictResolution"))

    @builtins.property
    @jsii.member(jsii_name="consolidation")
    def consolidation(
        self,
    ) -> CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference:
        return typing.cast(CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference, jsii.get(self, "consolidation"))

    @builtins.property
    @jsii.member(jsii_name="conflictResolutionInput")
    def conflict_resolution_input(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingAutoMergingConflictResolution]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingAutoMergingConflictResolution], jsii.get(self, "conflictResolutionInput"))

    @builtins.property
    @jsii.member(jsii_name="consolidationInput")
    def consolidation_input(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingAutoMergingConsolidation]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingAutoMergingConsolidation], jsii.get(self, "consolidationInput"))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="minAllowedConfidenceScoreForMergingInput")
    def min_allowed_confidence_score_for_merging_input(
        self,
    ) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minAllowedConfidenceScoreForMergingInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__ff67f844d1f00e68661826b218c869a6e2464432c6f3b990c533eb1aa800d0b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minAllowedConfidenceScoreForMerging")
    def min_allowed_confidence_score_for_merging(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minAllowedConfidenceScoreForMerging"))

    @min_allowed_confidence_score_for_merging.setter
    def min_allowed_confidence_score_for_merging(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c24f288791d4ef95ee6fb1e2e3939fb93892519020b5de3483123985ae2ce3a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minAllowedConfidenceScoreForMerging", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingAutoMerging]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingAutoMerging], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainMatchingAutoMerging],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4dc909ccdaa626353057aecd995be28f5dbc6d5afe39b4906e885bab9ea7042b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingExportingConfig",
    jsii_struct_bases=[],
    name_mapping={"s3_exporting": "s3Exporting"},
)
class CustomerprofilesDomainMatchingExportingConfig:
    def __init__(
        self,
        *,
        s3_exporting: typing.Optional[typing.Union["CustomerprofilesDomainMatchingExportingConfigS3Exporting", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param s3_exporting: s3_exporting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_exporting CustomerprofilesDomain#s3_exporting}
        '''
        if isinstance(s3_exporting, dict):
            s3_exporting = CustomerprofilesDomainMatchingExportingConfigS3Exporting(**s3_exporting)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea566226ac416cda178c1a3ce6dad40be997bc281423fcdcd9a0ded0932e7617)
            check_type(argname="argument s3_exporting", value=s3_exporting, expected_type=type_hints["s3_exporting"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if s3_exporting is not None:
            self._values["s3_exporting"] = s3_exporting

    @builtins.property
    def s3_exporting(
        self,
    ) -> typing.Optional["CustomerprofilesDomainMatchingExportingConfigS3Exporting"]:
        '''s3_exporting block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_exporting CustomerprofilesDomain#s3_exporting}
        '''
        result = self._values.get("s3_exporting")
        return typing.cast(typing.Optional["CustomerprofilesDomainMatchingExportingConfigS3Exporting"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainMatchingExportingConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesDomainMatchingExportingConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingExportingConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5e5c715e2705062f969716dddffd876dd2817fd14cc668212f9236c3b35db52d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putS3Exporting")
    def put_s3_exporting(
        self,
        *,
        s3_bucket_name: builtins.str,
        s3_key_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_bucket_name CustomerprofilesDomain#s3_bucket_name}.
        :param s3_key_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_key_name CustomerprofilesDomain#s3_key_name}.
        '''
        value = CustomerprofilesDomainMatchingExportingConfigS3Exporting(
            s3_bucket_name=s3_bucket_name, s3_key_name=s3_key_name
        )

        return typing.cast(None, jsii.invoke(self, "putS3Exporting", [value]))

    @jsii.member(jsii_name="resetS3Exporting")
    def reset_s3_exporting(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3Exporting", []))

    @builtins.property
    @jsii.member(jsii_name="s3Exporting")
    def s3_exporting(
        self,
    ) -> "CustomerprofilesDomainMatchingExportingConfigS3ExportingOutputReference":
        return typing.cast("CustomerprofilesDomainMatchingExportingConfigS3ExportingOutputReference", jsii.get(self, "s3Exporting"))

    @builtins.property
    @jsii.member(jsii_name="s3ExportingInput")
    def s3_exporting_input(
        self,
    ) -> typing.Optional["CustomerprofilesDomainMatchingExportingConfigS3Exporting"]:
        return typing.cast(typing.Optional["CustomerprofilesDomainMatchingExportingConfigS3Exporting"], jsii.get(self, "s3ExportingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingExportingConfig]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingExportingConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainMatchingExportingConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fbec4112c89a28cbaf5dedaabedd8266fabd797cc1c75a83e201cd102164fe82)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingExportingConfigS3Exporting",
    jsii_struct_bases=[],
    name_mapping={"s3_bucket_name": "s3BucketName", "s3_key_name": "s3KeyName"},
)
class CustomerprofilesDomainMatchingExportingConfigS3Exporting:
    def __init__(
        self,
        *,
        s3_bucket_name: builtins.str,
        s3_key_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_bucket_name CustomerprofilesDomain#s3_bucket_name}.
        :param s3_key_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_key_name CustomerprofilesDomain#s3_key_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca5e5ea348b7d37296d8faa6ef4af3090ee6de303e7bed24e7953ec9533238b7)
            check_type(argname="argument s3_bucket_name", value=s3_bucket_name, expected_type=type_hints["s3_bucket_name"])
            check_type(argname="argument s3_key_name", value=s3_key_name, expected_type=type_hints["s3_key_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "s3_bucket_name": s3_bucket_name,
        }
        if s3_key_name is not None:
            self._values["s3_key_name"] = s3_key_name

    @builtins.property
    def s3_bucket_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_bucket_name CustomerprofilesDomain#s3_bucket_name}.'''
        result = self._values.get("s3_bucket_name")
        assert result is not None, "Required property 's3_bucket_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_key_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_key_name CustomerprofilesDomain#s3_key_name}.'''
        result = self._values.get("s3_key_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainMatchingExportingConfigS3Exporting(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesDomainMatchingExportingConfigS3ExportingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingExportingConfigS3ExportingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__da326825169d7819103e7dac10b2dc1c31efeb1c3e6ab09cd85f15123685b3c3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetS3KeyName")
    def reset_s3_key_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3KeyName", []))

    @builtins.property
    @jsii.member(jsii_name="s3BucketNameInput")
    def s3_bucket_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3BucketNameInput"))

    @builtins.property
    @jsii.member(jsii_name="s3KeyNameInput")
    def s3_key_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3KeyNameInput"))

    @builtins.property
    @jsii.member(jsii_name="s3BucketName")
    def s3_bucket_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3BucketName"))

    @s3_bucket_name.setter
    def s3_bucket_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce263d3387499988d61becdc15ceeb6a44904e942069c26b6620a5aa4f0da180)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3BucketName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3KeyName")
    def s3_key_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3KeyName"))

    @s3_key_name.setter
    def s3_key_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ce5aed78fe46e74b0c658f47a027def466647683e57f47678eae39c11d567e0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3KeyName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingExportingConfigS3Exporting]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingExportingConfigS3Exporting], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainMatchingExportingConfigS3Exporting],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fba421ca4099b89ce01fc112a2f223d4f8d08e7ad7d52c8272f7fa298828d15a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingJobSchedule",
    jsii_struct_bases=[],
    name_mapping={"day_of_the_week": "dayOfTheWeek", "time": "time"},
)
class CustomerprofilesDomainMatchingJobSchedule:
    def __init__(self, *, day_of_the_week: builtins.str, time: builtins.str) -> None:
        '''
        :param day_of_the_week: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#day_of_the_week CustomerprofilesDomain#day_of_the_week}.
        :param time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#time CustomerprofilesDomain#time}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__658a97b9e31a7eaebcc8bb4304e5940fc1e0a4c4abb2fe290d396ae5e1a24e64)
            check_type(argname="argument day_of_the_week", value=day_of_the_week, expected_type=type_hints["day_of_the_week"])
            check_type(argname="argument time", value=time, expected_type=type_hints["time"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "day_of_the_week": day_of_the_week,
            "time": time,
        }

    @builtins.property
    def day_of_the_week(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#day_of_the_week CustomerprofilesDomain#day_of_the_week}.'''
        result = self._values.get("day_of_the_week")
        assert result is not None, "Required property 'day_of_the_week' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def time(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#time CustomerprofilesDomain#time}.'''
        result = self._values.get("time")
        assert result is not None, "Required property 'time' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainMatchingJobSchedule(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesDomainMatchingJobScheduleOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingJobScheduleOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3b35cf8163a085a6f8f21c51a6185b25fb41250c21810bad362feda08e774fe4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="dayOfTheWeekInput")
    def day_of_the_week_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dayOfTheWeekInput"))

    @builtins.property
    @jsii.member(jsii_name="timeInput")
    def time_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "timeInput"))

    @builtins.property
    @jsii.member(jsii_name="dayOfTheWeek")
    def day_of_the_week(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dayOfTheWeek"))

    @day_of_the_week.setter
    def day_of_the_week(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d18077a229cb0565cd8dc596e9ca19e55f3415c1862b9590cd38050aec5a0cda)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dayOfTheWeek", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="time")
    def time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "time"))

    @time.setter
    def time(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ebcf22b6928d259e144fb827d92d52f8fbf52604c0cfd9ffb5e010cfaa472593)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "time", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingJobSchedule]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingJobSchedule], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainMatchingJobSchedule],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ba3002c6ad80c7418095f3dbde2a0dec12f50e538d79c9ef010e0b46c029fdc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CustomerprofilesDomainMatchingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainMatchingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ac0e7c17830ea0fda01e21472014d35fa70d3e8749d693576303238ed2b62588)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAutoMerging")
    def put_auto_merging(
        self,
        *,
        enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        conflict_resolution: typing.Optional[typing.Union[CustomerprofilesDomainMatchingAutoMergingConflictResolution, typing.Dict[builtins.str, typing.Any]]] = None,
        consolidation: typing.Optional[typing.Union[CustomerprofilesDomainMatchingAutoMergingConsolidation, typing.Dict[builtins.str, typing.Any]]] = None,
        min_allowed_confidence_score_for_merging: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.
        :param conflict_resolution: conflict_resolution block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolution CustomerprofilesDomain#conflict_resolution}
        :param consolidation: consolidation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#consolidation CustomerprofilesDomain#consolidation}
        :param min_allowed_confidence_score_for_merging: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#min_allowed_confidence_score_for_merging CustomerprofilesDomain#min_allowed_confidence_score_for_merging}.
        '''
        value = CustomerprofilesDomainMatchingAutoMerging(
            enabled=enabled,
            conflict_resolution=conflict_resolution,
            consolidation=consolidation,
            min_allowed_confidence_score_for_merging=min_allowed_confidence_score_for_merging,
        )

        return typing.cast(None, jsii.invoke(self, "putAutoMerging", [value]))

    @jsii.member(jsii_name="putExportingConfig")
    def put_exporting_config(
        self,
        *,
        s3_exporting: typing.Optional[typing.Union[CustomerprofilesDomainMatchingExportingConfigS3Exporting, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param s3_exporting: s3_exporting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_exporting CustomerprofilesDomain#s3_exporting}
        '''
        value = CustomerprofilesDomainMatchingExportingConfig(
            s3_exporting=s3_exporting
        )

        return typing.cast(None, jsii.invoke(self, "putExportingConfig", [value]))

    @jsii.member(jsii_name="putJobSchedule")
    def put_job_schedule(
        self,
        *,
        day_of_the_week: builtins.str,
        time: builtins.str,
    ) -> None:
        '''
        :param day_of_the_week: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#day_of_the_week CustomerprofilesDomain#day_of_the_week}.
        :param time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#time CustomerprofilesDomain#time}.
        '''
        value = CustomerprofilesDomainMatchingJobSchedule(
            day_of_the_week=day_of_the_week, time=time
        )

        return typing.cast(None, jsii.invoke(self, "putJobSchedule", [value]))

    @jsii.member(jsii_name="resetAutoMerging")
    def reset_auto_merging(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAutoMerging", []))

    @jsii.member(jsii_name="resetExportingConfig")
    def reset_exporting_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExportingConfig", []))

    @jsii.member(jsii_name="resetJobSchedule")
    def reset_job_schedule(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetJobSchedule", []))

    @builtins.property
    @jsii.member(jsii_name="autoMerging")
    def auto_merging(self) -> CustomerprofilesDomainMatchingAutoMergingOutputReference:
        return typing.cast(CustomerprofilesDomainMatchingAutoMergingOutputReference, jsii.get(self, "autoMerging"))

    @builtins.property
    @jsii.member(jsii_name="exportingConfig")
    def exporting_config(
        self,
    ) -> CustomerprofilesDomainMatchingExportingConfigOutputReference:
        return typing.cast(CustomerprofilesDomainMatchingExportingConfigOutputReference, jsii.get(self, "exportingConfig"))

    @builtins.property
    @jsii.member(jsii_name="jobSchedule")
    def job_schedule(self) -> CustomerprofilesDomainMatchingJobScheduleOutputReference:
        return typing.cast(CustomerprofilesDomainMatchingJobScheduleOutputReference, jsii.get(self, "jobSchedule"))

    @builtins.property
    @jsii.member(jsii_name="autoMergingInput")
    def auto_merging_input(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingAutoMerging]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingAutoMerging], jsii.get(self, "autoMergingInput"))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="exportingConfigInput")
    def exporting_config_input(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingExportingConfig]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingExportingConfig], jsii.get(self, "exportingConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="jobScheduleInput")
    def job_schedule_input(
        self,
    ) -> typing.Optional[CustomerprofilesDomainMatchingJobSchedule]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatchingJobSchedule], jsii.get(self, "jobScheduleInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__2e6ed7f5663cb6632984cca2ea5c42e9c7a44ca66f7e50b3381dc0ecf3c87339)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CustomerprofilesDomainMatching]:
        return typing.cast(typing.Optional[CustomerprofilesDomainMatching], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainMatching],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db2f38ebad66714ecafd50afa446903c7f290336a521a4ad857fc4b8d8d08b80)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatching",
    jsii_struct_bases=[],
    name_mapping={
        "enabled": "enabled",
        "attribute_types_selector": "attributeTypesSelector",
        "conflict_resolution": "conflictResolution",
        "exporting_config": "exportingConfig",
        "matching_rules": "matchingRules",
        "max_allowed_rule_level_for_matching": "maxAllowedRuleLevelForMatching",
        "max_allowed_rule_level_for_merging": "maxAllowedRuleLevelForMerging",
        "status": "status",
    },
)
class CustomerprofilesDomainRuleBasedMatching:
    def __init__(
        self,
        *,
        enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        attribute_types_selector: typing.Optional[typing.Union["CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector", typing.Dict[builtins.str, typing.Any]]] = None,
        conflict_resolution: typing.Optional[typing.Union["CustomerprofilesDomainRuleBasedMatchingConflictResolution", typing.Dict[builtins.str, typing.Any]]] = None,
        exporting_config: typing.Optional[typing.Union["CustomerprofilesDomainRuleBasedMatchingExportingConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        matching_rules: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CustomerprofilesDomainRuleBasedMatchingMatchingRules", typing.Dict[builtins.str, typing.Any]]]]] = None,
        max_allowed_rule_level_for_matching: typing.Optional[jsii.Number] = None,
        max_allowed_rule_level_for_merging: typing.Optional[jsii.Number] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.
        :param attribute_types_selector: attribute_types_selector block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#attribute_types_selector CustomerprofilesDomain#attribute_types_selector}
        :param conflict_resolution: conflict_resolution block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolution CustomerprofilesDomain#conflict_resolution}
        :param exporting_config: exporting_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#exporting_config CustomerprofilesDomain#exporting_config}
        :param matching_rules: matching_rules block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_rules CustomerprofilesDomain#matching_rules}
        :param max_allowed_rule_level_for_matching: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#max_allowed_rule_level_for_matching CustomerprofilesDomain#max_allowed_rule_level_for_matching}.
        :param max_allowed_rule_level_for_merging: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#max_allowed_rule_level_for_merging CustomerprofilesDomain#max_allowed_rule_level_for_merging}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#status CustomerprofilesDomain#status}.
        '''
        if isinstance(attribute_types_selector, dict):
            attribute_types_selector = CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector(**attribute_types_selector)
        if isinstance(conflict_resolution, dict):
            conflict_resolution = CustomerprofilesDomainRuleBasedMatchingConflictResolution(**conflict_resolution)
        if isinstance(exporting_config, dict):
            exporting_config = CustomerprofilesDomainRuleBasedMatchingExportingConfig(**exporting_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__772e1a08a5d0845c8d44beb4a0798e8026e3445fa49eb9085af4abc9d98ab56b)
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
            check_type(argname="argument attribute_types_selector", value=attribute_types_selector, expected_type=type_hints["attribute_types_selector"])
            check_type(argname="argument conflict_resolution", value=conflict_resolution, expected_type=type_hints["conflict_resolution"])
            check_type(argname="argument exporting_config", value=exporting_config, expected_type=type_hints["exporting_config"])
            check_type(argname="argument matching_rules", value=matching_rules, expected_type=type_hints["matching_rules"])
            check_type(argname="argument max_allowed_rule_level_for_matching", value=max_allowed_rule_level_for_matching, expected_type=type_hints["max_allowed_rule_level_for_matching"])
            check_type(argname="argument max_allowed_rule_level_for_merging", value=max_allowed_rule_level_for_merging, expected_type=type_hints["max_allowed_rule_level_for_merging"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "enabled": enabled,
        }
        if attribute_types_selector is not None:
            self._values["attribute_types_selector"] = attribute_types_selector
        if conflict_resolution is not None:
            self._values["conflict_resolution"] = conflict_resolution
        if exporting_config is not None:
            self._values["exporting_config"] = exporting_config
        if matching_rules is not None:
            self._values["matching_rules"] = matching_rules
        if max_allowed_rule_level_for_matching is not None:
            self._values["max_allowed_rule_level_for_matching"] = max_allowed_rule_level_for_matching
        if max_allowed_rule_level_for_merging is not None:
            self._values["max_allowed_rule_level_for_merging"] = max_allowed_rule_level_for_merging
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.'''
        result = self._values.get("enabled")
        assert result is not None, "Required property 'enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def attribute_types_selector(
        self,
    ) -> typing.Optional["CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector"]:
        '''attribute_types_selector block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#attribute_types_selector CustomerprofilesDomain#attribute_types_selector}
        '''
        result = self._values.get("attribute_types_selector")
        return typing.cast(typing.Optional["CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector"], result)

    @builtins.property
    def conflict_resolution(
        self,
    ) -> typing.Optional["CustomerprofilesDomainRuleBasedMatchingConflictResolution"]:
        '''conflict_resolution block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolution CustomerprofilesDomain#conflict_resolution}
        '''
        result = self._values.get("conflict_resolution")
        return typing.cast(typing.Optional["CustomerprofilesDomainRuleBasedMatchingConflictResolution"], result)

    @builtins.property
    def exporting_config(
        self,
    ) -> typing.Optional["CustomerprofilesDomainRuleBasedMatchingExportingConfig"]:
        '''exporting_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#exporting_config CustomerprofilesDomain#exporting_config}
        '''
        result = self._values.get("exporting_config")
        return typing.cast(typing.Optional["CustomerprofilesDomainRuleBasedMatchingExportingConfig"], result)

    @builtins.property
    def matching_rules(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CustomerprofilesDomainRuleBasedMatchingMatchingRules"]]]:
        '''matching_rules block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_rules CustomerprofilesDomain#matching_rules}
        '''
        result = self._values.get("matching_rules")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CustomerprofilesDomainRuleBasedMatchingMatchingRules"]]], result)

    @builtins.property
    def max_allowed_rule_level_for_matching(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#max_allowed_rule_level_for_matching CustomerprofilesDomain#max_allowed_rule_level_for_matching}.'''
        result = self._values.get("max_allowed_rule_level_for_matching")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def max_allowed_rule_level_for_merging(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#max_allowed_rule_level_for_merging CustomerprofilesDomain#max_allowed_rule_level_for_merging}.'''
        result = self._values.get("max_allowed_rule_level_for_merging")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#status CustomerprofilesDomain#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainRuleBasedMatching(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector",
    jsii_struct_bases=[],
    name_mapping={
        "attribute_matching_model": "attributeMatchingModel",
        "address": "address",
        "email_address": "emailAddress",
        "phone_number": "phoneNumber",
    },
)
class CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector:
    def __init__(
        self,
        *,
        attribute_matching_model: builtins.str,
        address: typing.Optional[typing.Sequence[builtins.str]] = None,
        email_address: typing.Optional[typing.Sequence[builtins.str]] = None,
        phone_number: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param attribute_matching_model: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#attribute_matching_model CustomerprofilesDomain#attribute_matching_model}.
        :param address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#address CustomerprofilesDomain#address}.
        :param email_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#email_address CustomerprofilesDomain#email_address}.
        :param phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#phone_number CustomerprofilesDomain#phone_number}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1db505846e580f1728a7623c955086f62c0dcb5fa2e328815813752d385d783e)
            check_type(argname="argument attribute_matching_model", value=attribute_matching_model, expected_type=type_hints["attribute_matching_model"])
            check_type(argname="argument address", value=address, expected_type=type_hints["address"])
            check_type(argname="argument email_address", value=email_address, expected_type=type_hints["email_address"])
            check_type(argname="argument phone_number", value=phone_number, expected_type=type_hints["phone_number"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "attribute_matching_model": attribute_matching_model,
        }
        if address is not None:
            self._values["address"] = address
        if email_address is not None:
            self._values["email_address"] = email_address
        if phone_number is not None:
            self._values["phone_number"] = phone_number

    @builtins.property
    def attribute_matching_model(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#attribute_matching_model CustomerprofilesDomain#attribute_matching_model}.'''
        result = self._values.get("attribute_matching_model")
        assert result is not None, "Required property 'attribute_matching_model' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def address(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#address CustomerprofilesDomain#address}.'''
        result = self._values.get("address")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def email_address(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#email_address CustomerprofilesDomain#email_address}.'''
        result = self._values.get("email_address")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def phone_number(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#phone_number CustomerprofilesDomain#phone_number}.'''
        result = self._values.get("phone_number")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ba95063e9b18b1ccac5d1e9e1d38492c8a27f50d201828647f33eea872d658c4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAddress")
    def reset_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress", []))

    @jsii.member(jsii_name="resetEmailAddress")
    def reset_email_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmailAddress", []))

    @jsii.member(jsii_name="resetPhoneNumber")
    def reset_phone_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPhoneNumber", []))

    @builtins.property
    @jsii.member(jsii_name="addressInput")
    def address_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "addressInput"))

    @builtins.property
    @jsii.member(jsii_name="attributeMatchingModelInput")
    def attribute_matching_model_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "attributeMatchingModelInput"))

    @builtins.property
    @jsii.member(jsii_name="emailAddressInput")
    def email_address_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "emailAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="phoneNumberInput")
    def phone_number_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "phoneNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="address")
    def address(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "address"))

    @address.setter
    def address(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__706f9f5a2c9455e2440adc2ffb43f6294361fe8550493a3bf9b64d10fe9ce41d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="attributeMatchingModel")
    def attribute_matching_model(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "attributeMatchingModel"))

    @attribute_matching_model.setter
    def attribute_matching_model(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd86ba832429317d8f6644a2066d97ff18139c4791c90bafc49ab6f1de4d3806)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "attributeMatchingModel", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="emailAddress")
    def email_address(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "emailAddress"))

    @email_address.setter
    def email_address(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__16c67bb51e6d0aa6592d9cf45c27e878f99fbf1a94c952dede832fa401535f43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "emailAddress", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="phoneNumber")
    def phone_number(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "phoneNumber"))

    @phone_number.setter
    def phone_number(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__218933c1616bad2362a16c017772ac4f4d8fa24316b2a61415a526478fa82dba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "phoneNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector]:
        return typing.cast(typing.Optional[CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8a63978ddd9e96564fe15e53c75bf64deec146fbac14fe414484d79238111b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingConflictResolution",
    jsii_struct_bases=[],
    name_mapping={
        "conflict_resolving_model": "conflictResolvingModel",
        "source_name": "sourceName",
    },
)
class CustomerprofilesDomainRuleBasedMatchingConflictResolution:
    def __init__(
        self,
        *,
        conflict_resolving_model: builtins.str,
        source_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param conflict_resolving_model: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolving_model CustomerprofilesDomain#conflict_resolving_model}.
        :param source_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#source_name CustomerprofilesDomain#source_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96acdee01a734a42856c7a74e3e66f4d2dbf756b0902b843669e55e66d0ac0c7)
            check_type(argname="argument conflict_resolving_model", value=conflict_resolving_model, expected_type=type_hints["conflict_resolving_model"])
            check_type(argname="argument source_name", value=source_name, expected_type=type_hints["source_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "conflict_resolving_model": conflict_resolving_model,
        }
        if source_name is not None:
            self._values["source_name"] = source_name

    @builtins.property
    def conflict_resolving_model(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolving_model CustomerprofilesDomain#conflict_resolving_model}.'''
        result = self._values.get("conflict_resolving_model")
        assert result is not None, "Required property 'conflict_resolving_model' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def source_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#source_name CustomerprofilesDomain#source_name}.'''
        result = self._values.get("source_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainRuleBasedMatchingConflictResolution(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bf68630fd5399fdc230413915f0954e3b53a7177898d319f8bcda24864a9fb5a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSourceName")
    def reset_source_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceName", []))

    @builtins.property
    @jsii.member(jsii_name="conflictResolvingModelInput")
    def conflict_resolving_model_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "conflictResolvingModelInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceNameInput")
    def source_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceNameInput"))

    @builtins.property
    @jsii.member(jsii_name="conflictResolvingModel")
    def conflict_resolving_model(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "conflictResolvingModel"))

    @conflict_resolving_model.setter
    def conflict_resolving_model(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5374accfd35254e799a443ce89810230a9d6a77cf6a65c047c7cecd0893c18d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "conflictResolvingModel", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sourceName")
    def source_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceName"))

    @source_name.setter
    def source_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27bf82979555c683945f25f216e40732b594be29069ca707db485122ea43df16)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainRuleBasedMatchingConflictResolution]:
        return typing.cast(typing.Optional[CustomerprofilesDomainRuleBasedMatchingConflictResolution], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainRuleBasedMatchingConflictResolution],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bcc599832d0d2880e214b24ea16341a70e55f1278550a791a789a9838005825a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingExportingConfig",
    jsii_struct_bases=[],
    name_mapping={"s3_exporting": "s3Exporting"},
)
class CustomerprofilesDomainRuleBasedMatchingExportingConfig:
    def __init__(
        self,
        *,
        s3_exporting: typing.Optional[typing.Union["CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param s3_exporting: s3_exporting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_exporting CustomerprofilesDomain#s3_exporting}
        '''
        if isinstance(s3_exporting, dict):
            s3_exporting = CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting(**s3_exporting)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73c284451d9ab6e4d06da0accd73bd0539b5c88c59e0a38f9f62a173adf2abd4)
            check_type(argname="argument s3_exporting", value=s3_exporting, expected_type=type_hints["s3_exporting"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if s3_exporting is not None:
            self._values["s3_exporting"] = s3_exporting

    @builtins.property
    def s3_exporting(
        self,
    ) -> typing.Optional["CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting"]:
        '''s3_exporting block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_exporting CustomerprofilesDomain#s3_exporting}
        '''
        result = self._values.get("s3_exporting")
        return typing.cast(typing.Optional["CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainRuleBasedMatchingExportingConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7e19828b7f09e5ffd666f13d3fccf14c665276a1c7fc6f366d187dfd61b8fa82)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putS3Exporting")
    def put_s3_exporting(
        self,
        *,
        s3_bucket_name: builtins.str,
        s3_key_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_bucket_name CustomerprofilesDomain#s3_bucket_name}.
        :param s3_key_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_key_name CustomerprofilesDomain#s3_key_name}.
        '''
        value = CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting(
            s3_bucket_name=s3_bucket_name, s3_key_name=s3_key_name
        )

        return typing.cast(None, jsii.invoke(self, "putS3Exporting", [value]))

    @jsii.member(jsii_name="resetS3Exporting")
    def reset_s3_exporting(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3Exporting", []))

    @builtins.property
    @jsii.member(jsii_name="s3Exporting")
    def s3_exporting(
        self,
    ) -> "CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference":
        return typing.cast("CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference", jsii.get(self, "s3Exporting"))

    @builtins.property
    @jsii.member(jsii_name="s3ExportingInput")
    def s3_exporting_input(
        self,
    ) -> typing.Optional["CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting"]:
        return typing.cast(typing.Optional["CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting"], jsii.get(self, "s3ExportingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainRuleBasedMatchingExportingConfig]:
        return typing.cast(typing.Optional[CustomerprofilesDomainRuleBasedMatchingExportingConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainRuleBasedMatchingExportingConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bef3bd957dd22adaea7bde39a55e7ad4a4366cb908998cfa1e0426bf07d73fba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting",
    jsii_struct_bases=[],
    name_mapping={"s3_bucket_name": "s3BucketName", "s3_key_name": "s3KeyName"},
)
class CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting:
    def __init__(
        self,
        *,
        s3_bucket_name: builtins.str,
        s3_key_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_bucket_name CustomerprofilesDomain#s3_bucket_name}.
        :param s3_key_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_key_name CustomerprofilesDomain#s3_key_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__34bacaf468535badb043de88f5267d878226a637188c79ece1c321d1a9d6d60f)
            check_type(argname="argument s3_bucket_name", value=s3_bucket_name, expected_type=type_hints["s3_bucket_name"])
            check_type(argname="argument s3_key_name", value=s3_key_name, expected_type=type_hints["s3_key_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "s3_bucket_name": s3_bucket_name,
        }
        if s3_key_name is not None:
            self._values["s3_key_name"] = s3_key_name

    @builtins.property
    def s3_bucket_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_bucket_name CustomerprofilesDomain#s3_bucket_name}.'''
        result = self._values.get("s3_bucket_name")
        assert result is not None, "Required property 's3_bucket_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_key_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_key_name CustomerprofilesDomain#s3_key_name}.'''
        result = self._values.get("s3_key_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__db87479231826288d697a473e637e3b86b241560608ac7c2a4342e7bad993688)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetS3KeyName")
    def reset_s3_key_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3KeyName", []))

    @builtins.property
    @jsii.member(jsii_name="s3BucketNameInput")
    def s3_bucket_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3BucketNameInput"))

    @builtins.property
    @jsii.member(jsii_name="s3KeyNameInput")
    def s3_key_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3KeyNameInput"))

    @builtins.property
    @jsii.member(jsii_name="s3BucketName")
    def s3_bucket_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3BucketName"))

    @s3_bucket_name.setter
    def s3_bucket_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a218c04d2d3709553b7cc716e1436bdd9882a373e0da500422f7722c13e200f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3BucketName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3KeyName")
    def s3_key_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3KeyName"))

    @s3_key_name.setter
    def s3_key_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7162a8dad8a91c8dbf4c3f58041504462a180b87bcb650a60386fd6840ed7651)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3KeyName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting]:
        return typing.cast(typing.Optional[CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81b7dc8000273d957bbd9bf0353fccb31d01f7ae4cafd35c0e8bd0fabcdc2933)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingMatchingRules",
    jsii_struct_bases=[],
    name_mapping={"rule": "rule"},
)
class CustomerprofilesDomainRuleBasedMatchingMatchingRules:
    def __init__(self, *, rule: typing.Sequence[builtins.str]) -> None:
        '''
        :param rule: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#rule CustomerprofilesDomain#rule}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ff84383781a0210ec9c5fda5f94e9b68a17b443ba1a3ef6e8230861e8649b6f)
            check_type(argname="argument rule", value=rule, expected_type=type_hints["rule"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "rule": rule,
        }

    @builtins.property
    def rule(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#rule CustomerprofilesDomain#rule}.'''
        result = self._values.get("rule")
        assert result is not None, "Required property 'rule' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesDomainRuleBasedMatchingMatchingRules(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesDomainRuleBasedMatchingMatchingRulesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingMatchingRulesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0d5e764d3f8de0d49c0b64b30fd4468335ac085d07a301999659191d807f1a38)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CustomerprofilesDomainRuleBasedMatchingMatchingRulesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8bb2beeeb9465572afd80081c3e7749fb159ceab2a58cf213b20584c6bb43350)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CustomerprofilesDomainRuleBasedMatchingMatchingRulesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9294a6622babdb90c97332c6d69fc40ba806dca17ffaecc1d00a169888e35a10)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ec9c6a7a69edddf9babe3e15e7b1d025ae30c94e13513362c24c26bd02929557)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5e4bcaca92ba39bc10e8582a12c1358426d1d68452f1c154462411ceb5a0f837)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CustomerprofilesDomainRuleBasedMatchingMatchingRules]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CustomerprofilesDomainRuleBasedMatchingMatchingRules]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CustomerprofilesDomainRuleBasedMatchingMatchingRules]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2dc90d448c2c72c99b97636ca15210917faf69ca8fede3e3749cff2a482dcb7d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CustomerprofilesDomainRuleBasedMatchingMatchingRulesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingMatchingRulesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0e86d16c9e88b9096118b0aa7dec6740dc3e35004065a31d49b4c0a71143ede4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="ruleInput")
    def rule_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "ruleInput"))

    @builtins.property
    @jsii.member(jsii_name="rule")
    def rule(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "rule"))

    @rule.setter
    def rule(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__35c5abb42928db93f5eddf6cee22798a52bda61921db6667752398f4e6ca156f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rule", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CustomerprofilesDomainRuleBasedMatchingMatchingRules]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CustomerprofilesDomainRuleBasedMatchingMatchingRules]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CustomerprofilesDomainRuleBasedMatchingMatchingRules]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f78cc6f692368a6ce637636cfa3ad76352edd379ed776c2bda76cd5b264883b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CustomerprofilesDomainRuleBasedMatchingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5e1b8bfaac2a1ced86e4bbaff1c79a7007830d6e9b628ad7bc408303ac6ded79)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAttributeTypesSelector")
    def put_attribute_types_selector(
        self,
        *,
        attribute_matching_model: builtins.str,
        address: typing.Optional[typing.Sequence[builtins.str]] = None,
        email_address: typing.Optional[typing.Sequence[builtins.str]] = None,
        phone_number: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param attribute_matching_model: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#attribute_matching_model CustomerprofilesDomain#attribute_matching_model}.
        :param address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#address CustomerprofilesDomain#address}.
        :param email_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#email_address CustomerprofilesDomain#email_address}.
        :param phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#phone_number CustomerprofilesDomain#phone_number}.
        '''
        value = CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector(
            attribute_matching_model=attribute_matching_model,
            address=address,
            email_address=email_address,
            phone_number=phone_number,
        )

        return typing.cast(None, jsii.invoke(self, "putAttributeTypesSelector", [value]))

    @jsii.member(jsii_name="putConflictResolution")
    def put_conflict_resolution(
        self,
        *,
        conflict_resolving_model: builtins.str,
        source_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param conflict_resolving_model: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolving_model CustomerprofilesDomain#conflict_resolving_model}.
        :param source_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#source_name CustomerprofilesDomain#source_name}.
        '''
        value = CustomerprofilesDomainRuleBasedMatchingConflictResolution(
            conflict_resolving_model=conflict_resolving_model, source_name=source_name
        )

        return typing.cast(None, jsii.invoke(self, "putConflictResolution", [value]))

    @jsii.member(jsii_name="putExportingConfig")
    def put_exporting_config(
        self,
        *,
        s3_exporting: typing.Optional[typing.Union[CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param s3_exporting: s3_exporting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_exporting CustomerprofilesDomain#s3_exporting}
        '''
        value = CustomerprofilesDomainRuleBasedMatchingExportingConfig(
            s3_exporting=s3_exporting
        )

        return typing.cast(None, jsii.invoke(self, "putExportingConfig", [value]))

    @jsii.member(jsii_name="putMatchingRules")
    def put_matching_rules(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CustomerprofilesDomainRuleBasedMatchingMatchingRules, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__040dad51079d10fb43dcc4a54764f73dd97177e5863e4e55bdd50e7c619048aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMatchingRules", [value]))

    @jsii.member(jsii_name="resetAttributeTypesSelector")
    def reset_attribute_types_selector(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAttributeTypesSelector", []))

    @jsii.member(jsii_name="resetConflictResolution")
    def reset_conflict_resolution(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConflictResolution", []))

    @jsii.member(jsii_name="resetExportingConfig")
    def reset_exporting_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExportingConfig", []))

    @jsii.member(jsii_name="resetMatchingRules")
    def reset_matching_rules(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMatchingRules", []))

    @jsii.member(jsii_name="resetMaxAllowedRuleLevelForMatching")
    def reset_max_allowed_rule_level_for_matching(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxAllowedRuleLevelForMatching", []))

    @jsii.member(jsii_name="resetMaxAllowedRuleLevelForMerging")
    def reset_max_allowed_rule_level_for_merging(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxAllowedRuleLevelForMerging", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="attributeTypesSelector")
    def attribute_types_selector(
        self,
    ) -> CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference:
        return typing.cast(CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference, jsii.get(self, "attributeTypesSelector"))

    @builtins.property
    @jsii.member(jsii_name="conflictResolution")
    def conflict_resolution(
        self,
    ) -> CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference:
        return typing.cast(CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference, jsii.get(self, "conflictResolution"))

    @builtins.property
    @jsii.member(jsii_name="exportingConfig")
    def exporting_config(
        self,
    ) -> CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference:
        return typing.cast(CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference, jsii.get(self, "exportingConfig"))

    @builtins.property
    @jsii.member(jsii_name="matchingRules")
    def matching_rules(
        self,
    ) -> CustomerprofilesDomainRuleBasedMatchingMatchingRulesList:
        return typing.cast(CustomerprofilesDomainRuleBasedMatchingMatchingRulesList, jsii.get(self, "matchingRules"))

    @builtins.property
    @jsii.member(jsii_name="attributeTypesSelectorInput")
    def attribute_types_selector_input(
        self,
    ) -> typing.Optional[CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector]:
        return typing.cast(typing.Optional[CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector], jsii.get(self, "attributeTypesSelectorInput"))

    @builtins.property
    @jsii.member(jsii_name="conflictResolutionInput")
    def conflict_resolution_input(
        self,
    ) -> typing.Optional[CustomerprofilesDomainRuleBasedMatchingConflictResolution]:
        return typing.cast(typing.Optional[CustomerprofilesDomainRuleBasedMatchingConflictResolution], jsii.get(self, "conflictResolutionInput"))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="exportingConfigInput")
    def exporting_config_input(
        self,
    ) -> typing.Optional[CustomerprofilesDomainRuleBasedMatchingExportingConfig]:
        return typing.cast(typing.Optional[CustomerprofilesDomainRuleBasedMatchingExportingConfig], jsii.get(self, "exportingConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="matchingRulesInput")
    def matching_rules_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CustomerprofilesDomainRuleBasedMatchingMatchingRules]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CustomerprofilesDomainRuleBasedMatchingMatchingRules]]], jsii.get(self, "matchingRulesInput"))

    @builtins.property
    @jsii.member(jsii_name="maxAllowedRuleLevelForMatchingInput")
    def max_allowed_rule_level_for_matching_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxAllowedRuleLevelForMatchingInput"))

    @builtins.property
    @jsii.member(jsii_name="maxAllowedRuleLevelForMergingInput")
    def max_allowed_rule_level_for_merging_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxAllowedRuleLevelForMergingInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__7dddc7170563ad80e0b6bf9b35e2ef87d39983d2ac7aec327489226f4dcd9931)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxAllowedRuleLevelForMatching")
    def max_allowed_rule_level_for_matching(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxAllowedRuleLevelForMatching"))

    @max_allowed_rule_level_for_matching.setter
    def max_allowed_rule_level_for_matching(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4f5737fca59cfa8b2e033dac067ee3940df0ef80cc30f99a881c254e58733ed7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxAllowedRuleLevelForMatching", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxAllowedRuleLevelForMerging")
    def max_allowed_rule_level_for_merging(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxAllowedRuleLevelForMerging"))

    @max_allowed_rule_level_for_merging.setter
    def max_allowed_rule_level_for_merging(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22a110c48a29f43e7cd52ecb1f3b9d83299b9ea1b83c232e64b07d294b52a5af)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxAllowedRuleLevelForMerging", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__70bf2be950bd4c919dbb5b02bbf15f728c734834df0a371f6a34bd827b0377e1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CustomerprofilesDomainRuleBasedMatching]:
        return typing.cast(typing.Optional[CustomerprofilesDomainRuleBasedMatching], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesDomainRuleBasedMatching],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__433566cd0309afaad23ca27e3d735b66512ef9d138f18b1f0bcab1ad7c32505b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "CustomerprofilesDomain",
    "CustomerprofilesDomainConfig",
    "CustomerprofilesDomainMatching",
    "CustomerprofilesDomainMatchingAutoMerging",
    "CustomerprofilesDomainMatchingAutoMergingConflictResolution",
    "CustomerprofilesDomainMatchingAutoMergingConflictResolutionOutputReference",
    "CustomerprofilesDomainMatchingAutoMergingConsolidation",
    "CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference",
    "CustomerprofilesDomainMatchingAutoMergingOutputReference",
    "CustomerprofilesDomainMatchingExportingConfig",
    "CustomerprofilesDomainMatchingExportingConfigOutputReference",
    "CustomerprofilesDomainMatchingExportingConfigS3Exporting",
    "CustomerprofilesDomainMatchingExportingConfigS3ExportingOutputReference",
    "CustomerprofilesDomainMatchingJobSchedule",
    "CustomerprofilesDomainMatchingJobScheduleOutputReference",
    "CustomerprofilesDomainMatchingOutputReference",
    "CustomerprofilesDomainRuleBasedMatching",
    "CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector",
    "CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference",
    "CustomerprofilesDomainRuleBasedMatchingConflictResolution",
    "CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference",
    "CustomerprofilesDomainRuleBasedMatchingExportingConfig",
    "CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference",
    "CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting",
    "CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference",
    "CustomerprofilesDomainRuleBasedMatchingMatchingRules",
    "CustomerprofilesDomainRuleBasedMatchingMatchingRulesList",
    "CustomerprofilesDomainRuleBasedMatchingMatchingRulesOutputReference",
    "CustomerprofilesDomainRuleBasedMatchingOutputReference",
]

publication.publish()

def _typecheckingstub__8bffed2bd8dca099c4d61a6a307b4127164248a88fb9f005eff0aa1403abff70(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    default_expiration_days: jsii.Number,
    domain_name: builtins.str,
    dead_letter_queue_url: typing.Optional[builtins.str] = None,
    default_encryption_key: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    matching: typing.Optional[typing.Union[CustomerprofilesDomainMatching, typing.Dict[builtins.str, typing.Any]]] = None,
    rule_based_matching: typing.Optional[typing.Union[CustomerprofilesDomainRuleBasedMatching, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__08d8a944bc66ac565af07cf7bc04e689a71551ba2eb759b5d016c2e212c11e13(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15a8bcadb771405f084fba268fa25567bcf7fac46bf42163277566c6fcec7018(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c07aaced82d0bc9ab0aa4531f6e0e016066a8c75c08ff317881d86f683ae8a92(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d0522c6f404c015934c0e003487d7d8bb628a4142e555068deaf311caf58e8d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__572e9c27d061d4b1a172dd88dd5c39093a6be7f69402bbc59ba2ee879783f338(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b15f94f9438866dd30fa51aacee06c2efc92e73b9dce7bf3c9c1f9532873495(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c28da7049d856f5a04439d88ad5900dc6cdc3c67778eca43d2cb0a3f0bd53ed(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce51ad6b6e12f4637c36b3b0e68eab8b23b5546930cf0a93ed27336d1ee6e9a0(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15ff99dbea96344546cb0d29bd89f2329cea708e43e4e4a9d623d7fb2eeea464(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    default_expiration_days: jsii.Number,
    domain_name: builtins.str,
    dead_letter_queue_url: typing.Optional[builtins.str] = None,
    default_encryption_key: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    matching: typing.Optional[typing.Union[CustomerprofilesDomainMatching, typing.Dict[builtins.str, typing.Any]]] = None,
    rule_based_matching: typing.Optional[typing.Union[CustomerprofilesDomainRuleBasedMatching, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__825cf70c05d57b3da8f85654df7d516644d6141a21d378a7997a2d6286a7fe86(
    *,
    enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    auto_merging: typing.Optional[typing.Union[CustomerprofilesDomainMatchingAutoMerging, typing.Dict[builtins.str, typing.Any]]] = None,
    exporting_config: typing.Optional[typing.Union[CustomerprofilesDomainMatchingExportingConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    job_schedule: typing.Optional[typing.Union[CustomerprofilesDomainMatchingJobSchedule, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__182646f5cbce936f840082ba30e30f28ddf37feaec97640527c8115901c3e989(
    *,
    enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    conflict_resolution: typing.Optional[typing.Union[CustomerprofilesDomainMatchingAutoMergingConflictResolution, typing.Dict[builtins.str, typing.Any]]] = None,
    consolidation: typing.Optional[typing.Union[CustomerprofilesDomainMatchingAutoMergingConsolidation, typing.Dict[builtins.str, typing.Any]]] = None,
    min_allowed_confidence_score_for_merging: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c592a087029dc09fa467fe0ebdb65c6d97f47da6ae8cdc05cf21829108d66877(
    *,
    conflict_resolving_model: builtins.str,
    source_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be8bb7b583f8d98efdd980241787501cfb41d985d36c2e0234bdcc4e8179809d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a244ac0efa0264f369626214bedb38b4993adecb7b95d18dc246018fa475c6d0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c524b3367d4fff205737b0e2aca0e6c38a15fb85440ad7fdf5144109f23c225(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b13d6a5df2cba16e4111c047d39ebaadf9b460f758125920571454d4cf93dc75(
    value: typing.Optional[CustomerprofilesDomainMatchingAutoMergingConflictResolution],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1060c90eedf16bbeeb16bd9dee4a401bc2ed4fa29abbd2bdb2232e57297ca92(
    *,
    matching_attributes_list: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Sequence[builtins.str]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3bb485e0f7bf6baef0c53a507d74337f1b86bd4d745cfb41a4b31a566f975e3c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b43e4d9e81203346b9e3cc441c9ba25ce58b058aca89ced4370303f405f8629(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[typing.List[builtins.str]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49b94f3a5d032c72fb9e3f28187544bf8c69900628a4ff353c481a59d1809a35(
    value: typing.Optional[CustomerprofilesDomainMatchingAutoMergingConsolidation],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53aed4515c0837555f495210099ae997b85b28d8868ebff55878d0cf7643c160(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff67f844d1f00e68661826b218c869a6e2464432c6f3b990c533eb1aa800d0b5(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c24f288791d4ef95ee6fb1e2e3939fb93892519020b5de3483123985ae2ce3a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4dc909ccdaa626353057aecd995be28f5dbc6d5afe39b4906e885bab9ea7042b(
    value: typing.Optional[CustomerprofilesDomainMatchingAutoMerging],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea566226ac416cda178c1a3ce6dad40be997bc281423fcdcd9a0ded0932e7617(
    *,
    s3_exporting: typing.Optional[typing.Union[CustomerprofilesDomainMatchingExportingConfigS3Exporting, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e5c715e2705062f969716dddffd876dd2817fd14cc668212f9236c3b35db52d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fbec4112c89a28cbaf5dedaabedd8266fabd797cc1c75a83e201cd102164fe82(
    value: typing.Optional[CustomerprofilesDomainMatchingExportingConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca5e5ea348b7d37296d8faa6ef4af3090ee6de303e7bed24e7953ec9533238b7(
    *,
    s3_bucket_name: builtins.str,
    s3_key_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da326825169d7819103e7dac10b2dc1c31efeb1c3e6ab09cd85f15123685b3c3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce263d3387499988d61becdc15ceeb6a44904e942069c26b6620a5aa4f0da180(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ce5aed78fe46e74b0c658f47a027def466647683e57f47678eae39c11d567e0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fba421ca4099b89ce01fc112a2f223d4f8d08e7ad7d52c8272f7fa298828d15a(
    value: typing.Optional[CustomerprofilesDomainMatchingExportingConfigS3Exporting],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__658a97b9e31a7eaebcc8bb4304e5940fc1e0a4c4abb2fe290d396ae5e1a24e64(
    *,
    day_of_the_week: builtins.str,
    time: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b35cf8163a085a6f8f21c51a6185b25fb41250c21810bad362feda08e774fe4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d18077a229cb0565cd8dc596e9ca19e55f3415c1862b9590cd38050aec5a0cda(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebcf22b6928d259e144fb827d92d52f8fbf52604c0cfd9ffb5e010cfaa472593(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ba3002c6ad80c7418095f3dbde2a0dec12f50e538d79c9ef010e0b46c029fdc(
    value: typing.Optional[CustomerprofilesDomainMatchingJobSchedule],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac0e7c17830ea0fda01e21472014d35fa70d3e8749d693576303238ed2b62588(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e6ed7f5663cb6632984cca2ea5c42e9c7a44ca66f7e50b3381dc0ecf3c87339(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db2f38ebad66714ecafd50afa446903c7f290336a521a4ad857fc4b8d8d08b80(
    value: typing.Optional[CustomerprofilesDomainMatching],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__772e1a08a5d0845c8d44beb4a0798e8026e3445fa49eb9085af4abc9d98ab56b(
    *,
    enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    attribute_types_selector: typing.Optional[typing.Union[CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector, typing.Dict[builtins.str, typing.Any]]] = None,
    conflict_resolution: typing.Optional[typing.Union[CustomerprofilesDomainRuleBasedMatchingConflictResolution, typing.Dict[builtins.str, typing.Any]]] = None,
    exporting_config: typing.Optional[typing.Union[CustomerprofilesDomainRuleBasedMatchingExportingConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    matching_rules: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CustomerprofilesDomainRuleBasedMatchingMatchingRules, typing.Dict[builtins.str, typing.Any]]]]] = None,
    max_allowed_rule_level_for_matching: typing.Optional[jsii.Number] = None,
    max_allowed_rule_level_for_merging: typing.Optional[jsii.Number] = None,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1db505846e580f1728a7623c955086f62c0dcb5fa2e328815813752d385d783e(
    *,
    attribute_matching_model: builtins.str,
    address: typing.Optional[typing.Sequence[builtins.str]] = None,
    email_address: typing.Optional[typing.Sequence[builtins.str]] = None,
    phone_number: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba95063e9b18b1ccac5d1e9e1d38492c8a27f50d201828647f33eea872d658c4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__706f9f5a2c9455e2440adc2ffb43f6294361fe8550493a3bf9b64d10fe9ce41d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd86ba832429317d8f6644a2066d97ff18139c4791c90bafc49ab6f1de4d3806(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__16c67bb51e6d0aa6592d9cf45c27e878f99fbf1a94c952dede832fa401535f43(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__218933c1616bad2362a16c017772ac4f4d8fa24316b2a61415a526478fa82dba(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8a63978ddd9e96564fe15e53c75bf64deec146fbac14fe414484d79238111b6(
    value: typing.Optional[CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96acdee01a734a42856c7a74e3e66f4d2dbf756b0902b843669e55e66d0ac0c7(
    *,
    conflict_resolving_model: builtins.str,
    source_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf68630fd5399fdc230413915f0954e3b53a7177898d319f8bcda24864a9fb5a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5374accfd35254e799a443ce89810230a9d6a77cf6a65c047c7cecd0893c18d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27bf82979555c683945f25f216e40732b594be29069ca707db485122ea43df16(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bcc599832d0d2880e214b24ea16341a70e55f1278550a791a789a9838005825a(
    value: typing.Optional[CustomerprofilesDomainRuleBasedMatchingConflictResolution],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73c284451d9ab6e4d06da0accd73bd0539b5c88c59e0a38f9f62a173adf2abd4(
    *,
    s3_exporting: typing.Optional[typing.Union[CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e19828b7f09e5ffd666f13d3fccf14c665276a1c7fc6f366d187dfd61b8fa82(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bef3bd957dd22adaea7bde39a55e7ad4a4366cb908998cfa1e0426bf07d73fba(
    value: typing.Optional[CustomerprofilesDomainRuleBasedMatchingExportingConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__34bacaf468535badb043de88f5267d878226a637188c79ece1c321d1a9d6d60f(
    *,
    s3_bucket_name: builtins.str,
    s3_key_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db87479231826288d697a473e637e3b86b241560608ac7c2a4342e7bad993688(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a218c04d2d3709553b7cc716e1436bdd9882a373e0da500422f7722c13e200f3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7162a8dad8a91c8dbf4c3f58041504462a180b87bcb650a60386fd6840ed7651(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81b7dc8000273d957bbd9bf0353fccb31d01f7ae4cafd35c0e8bd0fabcdc2933(
    value: typing.Optional[CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ff84383781a0210ec9c5fda5f94e9b68a17b443ba1a3ef6e8230861e8649b6f(
    *,
    rule: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d5e764d3f8de0d49c0b64b30fd4468335ac085d07a301999659191d807f1a38(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8bb2beeeb9465572afd80081c3e7749fb159ceab2a58cf213b20584c6bb43350(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9294a6622babdb90c97332c6d69fc40ba806dca17ffaecc1d00a169888e35a10(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec9c6a7a69edddf9babe3e15e7b1d025ae30c94e13513362c24c26bd02929557(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e4bcaca92ba39bc10e8582a12c1358426d1d68452f1c154462411ceb5a0f837(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2dc90d448c2c72c99b97636ca15210917faf69ca8fede3e3749cff2a482dcb7d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CustomerprofilesDomainRuleBasedMatchingMatchingRules]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e86d16c9e88b9096118b0aa7dec6740dc3e35004065a31d49b4c0a71143ede4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35c5abb42928db93f5eddf6cee22798a52bda61921db6667752398f4e6ca156f(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f78cc6f692368a6ce637636cfa3ad76352edd379ed776c2bda76cd5b264883b5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CustomerprofilesDomainRuleBasedMatchingMatchingRules]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e1b8bfaac2a1ced86e4bbaff1c79a7007830d6e9b628ad7bc408303ac6ded79(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__040dad51079d10fb43dcc4a54764f73dd97177e5863e4e55bdd50e7c619048aa(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CustomerprofilesDomainRuleBasedMatchingMatchingRules, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7dddc7170563ad80e0b6bf9b35e2ef87d39983d2ac7aec327489226f4dcd9931(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f5737fca59cfa8b2e033dac067ee3940df0ef80cc30f99a881c254e58733ed7(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22a110c48a29f43e7cd52ecb1f3b9d83299b9ea1b83c232e64b07d294b52a5af(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70bf2be950bd4c919dbb5b02bbf15f728c734834df0a371f6a34bd827b0377e1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__433566cd0309afaad23ca27e3d735b66512ef9d138f18b1f0bcab1ad7c32505b(
    value: typing.Optional[CustomerprofilesDomainRuleBasedMatching],
) -> None:
    """Type checking stubs"""
    pass
