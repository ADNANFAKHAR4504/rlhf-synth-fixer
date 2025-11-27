r'''
# `aws_route53domains_domain`

Refer to the Terraform Registry for docs: [`aws_route53domains_domain`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain).
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


class Route53DomainsDomain(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomain",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain aws_route53domains_domain}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        domain_name: builtins.str,
        admin_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainAdminContact", typing.Dict[builtins.str, typing.Any]]]]] = None,
        admin_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        auto_renew: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        billing_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainBillingContact", typing.Dict[builtins.str, typing.Any]]]]] = None,
        billing_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        duration_in_years: typing.Optional[jsii.Number] = None,
        name_server: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainNameServer", typing.Dict[builtins.str, typing.Any]]]]] = None,
        registrant_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainRegistrantContact", typing.Dict[builtins.str, typing.Any]]]]] = None,
        registrant_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tech_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainTechContact", typing.Dict[builtins.str, typing.Any]]]]] = None,
        tech_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        timeouts: typing.Optional[typing.Union["Route53DomainsDomainTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        transfer_lock: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain aws_route53domains_domain} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#domain_name Route53DomainsDomain#domain_name}.
        :param admin_contact: admin_contact block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_contact Route53DomainsDomain#admin_contact}
        :param admin_privacy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_privacy Route53DomainsDomain#admin_privacy}.
        :param auto_renew: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#auto_renew Route53DomainsDomain#auto_renew}.
        :param billing_contact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_contact Route53DomainsDomain#billing_contact}.
        :param billing_privacy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_privacy Route53DomainsDomain#billing_privacy}.
        :param duration_in_years: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#duration_in_years Route53DomainsDomain#duration_in_years}.
        :param name_server: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name_server Route53DomainsDomain#name_server}.
        :param registrant_contact: registrant_contact block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_contact Route53DomainsDomain#registrant_contact}
        :param registrant_privacy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_privacy Route53DomainsDomain#registrant_privacy}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tags Route53DomainsDomain#tags}.
        :param tech_contact: tech_contact block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_contact Route53DomainsDomain#tech_contact}
        :param tech_privacy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_privacy Route53DomainsDomain#tech_privacy}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#timeouts Route53DomainsDomain#timeouts}
        :param transfer_lock: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#transfer_lock Route53DomainsDomain#transfer_lock}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cca0b33b009827a34baf1c66e83607e21452b6c011d9d04460c23e654bc1bc4b)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = Route53DomainsDomainConfig(
            domain_name=domain_name,
            admin_contact=admin_contact,
            admin_privacy=admin_privacy,
            auto_renew=auto_renew,
            billing_contact=billing_contact,
            billing_privacy=billing_privacy,
            duration_in_years=duration_in_years,
            name_server=name_server,
            registrant_contact=registrant_contact,
            registrant_privacy=registrant_privacy,
            tags=tags,
            tech_contact=tech_contact,
            tech_privacy=tech_privacy,
            timeouts=timeouts,
            transfer_lock=transfer_lock,
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
        '''Generates CDKTF code for importing a Route53DomainsDomain resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Route53DomainsDomain to import.
        :param import_from_id: The id of the existing Route53DomainsDomain that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Route53DomainsDomain to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__524230adad742b16a11b695e4d9d108c39464511b65d9f57ffd89869984282b0)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAdminContact")
    def put_admin_contact(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainAdminContact", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4cf6dd46beab94294cbee34145e0a0a9abc2e5f672736d2e94dca1803bbb4f5b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAdminContact", [value]))

    @jsii.member(jsii_name="putBillingContact")
    def put_billing_contact(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainBillingContact", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e77290abd95108150bc9a48a72d7cf56bfd3b1ec6ac218ff5e1f41e8c16adbd2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putBillingContact", [value]))

    @jsii.member(jsii_name="putNameServer")
    def put_name_server(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainNameServer", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__441f4f2b6d5680a27bccb2a538325268677fa6fc1951dcb78af552449b712fd5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putNameServer", [value]))

    @jsii.member(jsii_name="putRegistrantContact")
    def put_registrant_contact(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainRegistrantContact", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dddab91df36962012745ba26b4609ceaa2595b1b450d077fe3d2ea9dc728d0f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRegistrantContact", [value]))

    @jsii.member(jsii_name="putTechContact")
    def put_tech_contact(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainTechContact", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fa9849737f7c6f747df531d3468c5e078328a3778d2e4dd898e9ccd68d96dde8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTechContact", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#create Route53DomainsDomain#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#delete Route53DomainsDomain#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#update Route53DomainsDomain#update}
        '''
        value = Route53DomainsDomainTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetAdminContact")
    def reset_admin_contact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAdminContact", []))

    @jsii.member(jsii_name="resetAdminPrivacy")
    def reset_admin_privacy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAdminPrivacy", []))

    @jsii.member(jsii_name="resetAutoRenew")
    def reset_auto_renew(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAutoRenew", []))

    @jsii.member(jsii_name="resetBillingContact")
    def reset_billing_contact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBillingContact", []))

    @jsii.member(jsii_name="resetBillingPrivacy")
    def reset_billing_privacy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBillingPrivacy", []))

    @jsii.member(jsii_name="resetDurationInYears")
    def reset_duration_in_years(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDurationInYears", []))

    @jsii.member(jsii_name="resetNameServer")
    def reset_name_server(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNameServer", []))

    @jsii.member(jsii_name="resetRegistrantContact")
    def reset_registrant_contact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegistrantContact", []))

    @jsii.member(jsii_name="resetRegistrantPrivacy")
    def reset_registrant_privacy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegistrantPrivacy", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTechContact")
    def reset_tech_contact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTechContact", []))

    @jsii.member(jsii_name="resetTechPrivacy")
    def reset_tech_privacy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTechPrivacy", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

    @jsii.member(jsii_name="resetTransferLock")
    def reset_transfer_lock(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTransferLock", []))

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
    @jsii.member(jsii_name="abuseContactEmail")
    def abuse_contact_email(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "abuseContactEmail"))

    @builtins.property
    @jsii.member(jsii_name="abuseContactPhone")
    def abuse_contact_phone(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "abuseContactPhone"))

    @builtins.property
    @jsii.member(jsii_name="adminContact")
    def admin_contact(self) -> "Route53DomainsDomainAdminContactList":
        return typing.cast("Route53DomainsDomainAdminContactList", jsii.get(self, "adminContact"))

    @builtins.property
    @jsii.member(jsii_name="billingContact")
    def billing_contact(self) -> "Route53DomainsDomainBillingContactList":
        return typing.cast("Route53DomainsDomainBillingContactList", jsii.get(self, "billingContact"))

    @builtins.property
    @jsii.member(jsii_name="creationDate")
    def creation_date(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "creationDate"))

    @builtins.property
    @jsii.member(jsii_name="expirationDate")
    def expiration_date(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "expirationDate"))

    @builtins.property
    @jsii.member(jsii_name="hostedZoneId")
    def hosted_zone_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "hostedZoneId"))

    @builtins.property
    @jsii.member(jsii_name="nameServer")
    def name_server(self) -> "Route53DomainsDomainNameServerList":
        return typing.cast("Route53DomainsDomainNameServerList", jsii.get(self, "nameServer"))

    @builtins.property
    @jsii.member(jsii_name="registrantContact")
    def registrant_contact(self) -> "Route53DomainsDomainRegistrantContactList":
        return typing.cast("Route53DomainsDomainRegistrantContactList", jsii.get(self, "registrantContact"))

    @builtins.property
    @jsii.member(jsii_name="registrarName")
    def registrar_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "registrarName"))

    @builtins.property
    @jsii.member(jsii_name="registrarUrl")
    def registrar_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "registrarUrl"))

    @builtins.property
    @jsii.member(jsii_name="statusList")
    def status_list(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "statusList"))

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> _cdktf_9a9027ec.StringMap:
        return typing.cast(_cdktf_9a9027ec.StringMap, jsii.get(self, "tagsAll"))

    @builtins.property
    @jsii.member(jsii_name="techContact")
    def tech_contact(self) -> "Route53DomainsDomainTechContactList":
        return typing.cast("Route53DomainsDomainTechContactList", jsii.get(self, "techContact"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "Route53DomainsDomainTimeoutsOutputReference":
        return typing.cast("Route53DomainsDomainTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="updatedDate")
    def updated_date(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "updatedDate"))

    @builtins.property
    @jsii.member(jsii_name="whoisServer")
    def whois_server(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "whoisServer"))

    @builtins.property
    @jsii.member(jsii_name="adminContactInput")
    def admin_contact_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainAdminContact"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainAdminContact"]]], jsii.get(self, "adminContactInput"))

    @builtins.property
    @jsii.member(jsii_name="adminPrivacyInput")
    def admin_privacy_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "adminPrivacyInput"))

    @builtins.property
    @jsii.member(jsii_name="autoRenewInput")
    def auto_renew_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "autoRenewInput"))

    @builtins.property
    @jsii.member(jsii_name="billingContactInput")
    def billing_contact_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainBillingContact"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainBillingContact"]]], jsii.get(self, "billingContactInput"))

    @builtins.property
    @jsii.member(jsii_name="billingPrivacyInput")
    def billing_privacy_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "billingPrivacyInput"))

    @builtins.property
    @jsii.member(jsii_name="domainNameInput")
    def domain_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainNameInput"))

    @builtins.property
    @jsii.member(jsii_name="durationInYearsInput")
    def duration_in_years_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "durationInYearsInput"))

    @builtins.property
    @jsii.member(jsii_name="nameServerInput")
    def name_server_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainNameServer"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainNameServer"]]], jsii.get(self, "nameServerInput"))

    @builtins.property
    @jsii.member(jsii_name="registrantContactInput")
    def registrant_contact_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainRegistrantContact"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainRegistrantContact"]]], jsii.get(self, "registrantContactInput"))

    @builtins.property
    @jsii.member(jsii_name="registrantPrivacyInput")
    def registrant_privacy_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "registrantPrivacyInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="techContactInput")
    def tech_contact_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainTechContact"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainTechContact"]]], jsii.get(self, "techContactInput"))

    @builtins.property
    @jsii.member(jsii_name="techPrivacyInput")
    def tech_privacy_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "techPrivacyInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "Route53DomainsDomainTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "Route53DomainsDomainTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="transferLockInput")
    def transfer_lock_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "transferLockInput"))

    @builtins.property
    @jsii.member(jsii_name="adminPrivacy")
    def admin_privacy(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "adminPrivacy"))

    @admin_privacy.setter
    def admin_privacy(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af7bb621d8cd04568b08a801c077c17327b47e1a53ec7df4d272814b993b5d7f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "adminPrivacy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="autoRenew")
    def auto_renew(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "autoRenew"))

    @auto_renew.setter
    def auto_renew(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79bdc7419316636084cb1cb9cd9dded294a266362374853a04b6ce9c50d3a6a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "autoRenew", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="billingPrivacy")
    def billing_privacy(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "billingPrivacy"))

    @billing_privacy.setter
    def billing_privacy(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d6b588b60128dc0eb743ec72ec03a5ab19c09b12066394d60c24d06c0af318d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "billingPrivacy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="domainName")
    def domain_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domainName"))

    @domain_name.setter
    def domain_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd7c5b50e30fd139e98aac1bccfb1acb97a0f1d190f94799bb81a5c5237e6b2b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domainName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="durationInYears")
    def duration_in_years(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "durationInYears"))

    @duration_in_years.setter
    def duration_in_years(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__729861842f556965bd57ac0cdd14398925463d53f93ac94afc90e3873123a0ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "durationInYears", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="registrantPrivacy")
    def registrant_privacy(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "registrantPrivacy"))

    @registrant_privacy.setter
    def registrant_privacy(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f5704d6d39c2572fe246d9043bda5986022d61255bc7d64375c4ffa60c884f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "registrantPrivacy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__380a90eeec4c3002abdb6940a94941c520f2851f4dddbd861ad92eb193bf8ff6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="techPrivacy")
    def tech_privacy(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "techPrivacy"))

    @tech_privacy.setter
    def tech_privacy(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0883a4c20ff0d93b9fee958c45071f955c019880245f9e76b9934f4088a9aa71)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "techPrivacy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="transferLock")
    def transfer_lock(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "transferLock"))

    @transfer_lock.setter
    def transfer_lock(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05ee8afe5f31edc54dee456261623301cf60378f696f5a5baa6e1ff6f7ec4867)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "transferLock", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainAdminContact",
    jsii_struct_bases=[],
    name_mapping={
        "address_line1": "addressLine1",
        "address_line2": "addressLine2",
        "city": "city",
        "contact_type": "contactType",
        "country_code": "countryCode",
        "email": "email",
        "extra_param": "extraParam",
        "fax": "fax",
        "first_name": "firstName",
        "last_name": "lastName",
        "organization_name": "organizationName",
        "phone_number": "phoneNumber",
        "state": "state",
        "zip_code": "zipCode",
    },
)
class Route53DomainsDomainAdminContact:
    def __init__(
        self,
        *,
        address_line1: typing.Optional[builtins.str] = None,
        address_line2: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        contact_type: typing.Optional[builtins.str] = None,
        country_code: typing.Optional[builtins.str] = None,
        email: typing.Optional[builtins.str] = None,
        extra_param: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainAdminContactExtraParam", typing.Dict[builtins.str, typing.Any]]]]] = None,
        fax: typing.Optional[builtins.str] = None,
        first_name: typing.Optional[builtins.str] = None,
        last_name: typing.Optional[builtins.str] = None,
        organization_name: typing.Optional[builtins.str] = None,
        phone_number: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
        zip_code: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address_line1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_1 Route53DomainsDomain#address_line_1}.
        :param address_line2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_2 Route53DomainsDomain#address_line_2}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#city Route53DomainsDomain#city}.
        :param contact_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#contact_type Route53DomainsDomain#contact_type}.
        :param country_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#country_code Route53DomainsDomain#country_code}.
        :param email: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#email Route53DomainsDomain#email}.
        :param extra_param: extra_param block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}
        :param fax: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#fax Route53DomainsDomain#fax}.
        :param first_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#first_name Route53DomainsDomain#first_name}.
        :param last_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#last_name Route53DomainsDomain#last_name}.
        :param organization_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#organization_name Route53DomainsDomain#organization_name}.
        :param phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#phone_number Route53DomainsDomain#phone_number}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#state Route53DomainsDomain#state}.
        :param zip_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#zip_code Route53DomainsDomain#zip_code}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__63b151160ebed9c0b02aba64a726710d55ee16f3042da161ece99288a2c0de7d)
            check_type(argname="argument address_line1", value=address_line1, expected_type=type_hints["address_line1"])
            check_type(argname="argument address_line2", value=address_line2, expected_type=type_hints["address_line2"])
            check_type(argname="argument city", value=city, expected_type=type_hints["city"])
            check_type(argname="argument contact_type", value=contact_type, expected_type=type_hints["contact_type"])
            check_type(argname="argument country_code", value=country_code, expected_type=type_hints["country_code"])
            check_type(argname="argument email", value=email, expected_type=type_hints["email"])
            check_type(argname="argument extra_param", value=extra_param, expected_type=type_hints["extra_param"])
            check_type(argname="argument fax", value=fax, expected_type=type_hints["fax"])
            check_type(argname="argument first_name", value=first_name, expected_type=type_hints["first_name"])
            check_type(argname="argument last_name", value=last_name, expected_type=type_hints["last_name"])
            check_type(argname="argument organization_name", value=organization_name, expected_type=type_hints["organization_name"])
            check_type(argname="argument phone_number", value=phone_number, expected_type=type_hints["phone_number"])
            check_type(argname="argument state", value=state, expected_type=type_hints["state"])
            check_type(argname="argument zip_code", value=zip_code, expected_type=type_hints["zip_code"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if address_line1 is not None:
            self._values["address_line1"] = address_line1
        if address_line2 is not None:
            self._values["address_line2"] = address_line2
        if city is not None:
            self._values["city"] = city
        if contact_type is not None:
            self._values["contact_type"] = contact_type
        if country_code is not None:
            self._values["country_code"] = country_code
        if email is not None:
            self._values["email"] = email
        if extra_param is not None:
            self._values["extra_param"] = extra_param
        if fax is not None:
            self._values["fax"] = fax
        if first_name is not None:
            self._values["first_name"] = first_name
        if last_name is not None:
            self._values["last_name"] = last_name
        if organization_name is not None:
            self._values["organization_name"] = organization_name
        if phone_number is not None:
            self._values["phone_number"] = phone_number
        if state is not None:
            self._values["state"] = state
        if zip_code is not None:
            self._values["zip_code"] = zip_code

    @builtins.property
    def address_line1(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_1 Route53DomainsDomain#address_line_1}.'''
        result = self._values.get("address_line1")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address_line2(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_2 Route53DomainsDomain#address_line_2}.'''
        result = self._values.get("address_line2")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def city(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#city Route53DomainsDomain#city}.'''
        result = self._values.get("city")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def contact_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#contact_type Route53DomainsDomain#contact_type}.'''
        result = self._values.get("contact_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def country_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#country_code Route53DomainsDomain#country_code}.'''
        result = self._values.get("country_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def email(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#email Route53DomainsDomain#email}.'''
        result = self._values.get("email")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def extra_param(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainAdminContactExtraParam"]]]:
        '''extra_param block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}
        '''
        result = self._values.get("extra_param")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainAdminContactExtraParam"]]], result)

    @builtins.property
    def fax(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#fax Route53DomainsDomain#fax}.'''
        result = self._values.get("fax")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def first_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#first_name Route53DomainsDomain#first_name}.'''
        result = self._values.get("first_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def last_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#last_name Route53DomainsDomain#last_name}.'''
        result = self._values.get("last_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def organization_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#organization_name Route53DomainsDomain#organization_name}.'''
        result = self._values.get("organization_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def phone_number(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#phone_number Route53DomainsDomain#phone_number}.'''
        result = self._values.get("phone_number")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#state Route53DomainsDomain#state}.'''
        result = self._values.get("state")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def zip_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#zip_code Route53DomainsDomain#zip_code}.'''
        result = self._values.get("zip_code")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainAdminContact(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainAdminContactExtraParam",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Route53DomainsDomainAdminContactExtraParam:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#value Route53DomainsDomain#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f0039103b598d4968ac11827b8e077a4d29e373d807d408332f9c476fa94770)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#value Route53DomainsDomain#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainAdminContactExtraParam(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53DomainsDomainAdminContactExtraParamList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainAdminContactExtraParamList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__41fe4ebe3c32ace78d2928e53062f5985f7de1233bea649c96be65141d8dcb48)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53DomainsDomainAdminContactExtraParamOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f3fd09eb4245f9643c1de42a02a5b5b11889ccbfe7357e8e1cda517a5efccff)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53DomainsDomainAdminContactExtraParamOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a67ce4e379d76515906aa71ec502273165bce63cd8f8b269da040f0de1d28f0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6d8a36b79f1af95dc48937a2727c683a3080a783e2f27f7251462031ffc5ca92)
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
            type_hints = typing.get_type_hints(_typecheckingstub__151d57b5d7eb8c60ace7067ad519a299d1d9d2d7ad1fcb25a88ef03600c15158)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContactExtraParam]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContactExtraParam]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContactExtraParam]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1fbf6a075e9ae0aa783fe030405d6ae009e9f235c276b50221fc5bc494f8967)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainAdminContactExtraParamOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainAdminContactExtraParamOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6f74be42d960283f3b2259f35241a17156e98f24b4cbfdd1085c56eac4326d2f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e67af8db3859f16d6e2aeaea66e4d57919eb2874e2f46f079d5baa108562a57a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__449dd2a50bd1d97d521492705ac864903aefbcc9e70fd9a4d08911cf145418ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainAdminContactExtraParam]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainAdminContactExtraParam]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainAdminContactExtraParam]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e513e9d3e09fdb466d6d8510bc2f7b8a351a95804958068ae8c8c505247154c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainAdminContactList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainAdminContactList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__098ab85c80456b2e867af641faa2022dfabd40f6f4465ec3ad06265267a8b449)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53DomainsDomainAdminContactOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2058ab171aaca2fdf34dd82cdf61b03638621dbfcf468251faf9c4798c080b09)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53DomainsDomainAdminContactOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7da96fca69e2107eca24410c23da1cbb59121d2a90c9b24ed80b760bbdfaeec8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bc780562216a766a49b8f08cf0639fd4429b95a678d4005634fc6d12fb77011d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f538d2b60e719e58012f5ea96650c159023cab5ec33b8afc088d9b2afa26bc1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContact]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContact]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContact]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b466bddc7141c0185654fc327599e41114b04d8be99227bde1c1df3abb888981)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainAdminContactOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainAdminContactOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a2db8f4e97db68529fa7e27c478f25320d43d0d1d906796d1098651afa369820)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putExtraParam")
    def put_extra_param(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainAdminContactExtraParam, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5cedd41a936ef28c0a993c03ef4e67e50a69dab01203766e1e78d5f3644e3dac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putExtraParam", [value]))

    @jsii.member(jsii_name="resetAddressLine1")
    def reset_address_line1(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressLine1", []))

    @jsii.member(jsii_name="resetAddressLine2")
    def reset_address_line2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressLine2", []))

    @jsii.member(jsii_name="resetCity")
    def reset_city(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCity", []))

    @jsii.member(jsii_name="resetContactType")
    def reset_contact_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContactType", []))

    @jsii.member(jsii_name="resetCountryCode")
    def reset_country_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCountryCode", []))

    @jsii.member(jsii_name="resetEmail")
    def reset_email(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmail", []))

    @jsii.member(jsii_name="resetExtraParam")
    def reset_extra_param(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExtraParam", []))

    @jsii.member(jsii_name="resetFax")
    def reset_fax(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFax", []))

    @jsii.member(jsii_name="resetFirstName")
    def reset_first_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFirstName", []))

    @jsii.member(jsii_name="resetLastName")
    def reset_last_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLastName", []))

    @jsii.member(jsii_name="resetOrganizationName")
    def reset_organization_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOrganizationName", []))

    @jsii.member(jsii_name="resetPhoneNumber")
    def reset_phone_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPhoneNumber", []))

    @jsii.member(jsii_name="resetState")
    def reset_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetState", []))

    @jsii.member(jsii_name="resetZipCode")
    def reset_zip_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetZipCode", []))

    @builtins.property
    @jsii.member(jsii_name="extraParam")
    def extra_param(self) -> Route53DomainsDomainAdminContactExtraParamList:
        return typing.cast(Route53DomainsDomainAdminContactExtraParamList, jsii.get(self, "extraParam"))

    @builtins.property
    @jsii.member(jsii_name="addressLine1Input")
    def address_line1_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine1Input"))

    @builtins.property
    @jsii.member(jsii_name="addressLine2Input")
    def address_line2_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine2Input"))

    @builtins.property
    @jsii.member(jsii_name="cityInput")
    def city_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cityInput"))

    @builtins.property
    @jsii.member(jsii_name="contactTypeInput")
    def contact_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contactTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="countryCodeInput")
    def country_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="emailInput")
    def email_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "emailInput"))

    @builtins.property
    @jsii.member(jsii_name="extraParamInput")
    def extra_param_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContactExtraParam]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContactExtraParam]]], jsii.get(self, "extraParamInput"))

    @builtins.property
    @jsii.member(jsii_name="faxInput")
    def fax_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "faxInput"))

    @builtins.property
    @jsii.member(jsii_name="firstNameInput")
    def first_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "firstNameInput"))

    @builtins.property
    @jsii.member(jsii_name="lastNameInput")
    def last_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lastNameInput"))

    @builtins.property
    @jsii.member(jsii_name="organizationNameInput")
    def organization_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "organizationNameInput"))

    @builtins.property
    @jsii.member(jsii_name="phoneNumberInput")
    def phone_number_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "phoneNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="stateInput")
    def state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stateInput"))

    @builtins.property
    @jsii.member(jsii_name="zipCodeInput")
    def zip_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "zipCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="addressLine1")
    def address_line1(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine1"))

    @address_line1.setter
    def address_line1(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23ac00f6c2c0802c0af944e8a7ef864d887a5ce367ada60a81ff5f235b648abd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine1", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="addressLine2")
    def address_line2(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine2"))

    @address_line2.setter
    def address_line2(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__763b874274c19a8371f596f60f00d522492657569eb373f3fd0167c8591b278c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="city")
    def city(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "city"))

    @city.setter
    def city(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1be0bf2a9b19a141e0651fc92fa5020def7fd2622f6bfc9e1397a7d3369c455)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "city", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="contactType")
    def contact_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contactType"))

    @contact_type.setter
    def contact_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe2d3f740c26d74ab9690f2903363f8c622e37f9e2d4d47537a7935ecde3dff7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contactType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="countryCode")
    def country_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "countryCode"))

    @country_code.setter
    def country_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eeaa934228e1c4490f362afba2c0b2464531426e5589d2c8ea6fb447f34333c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "countryCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="email")
    def email(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "email"))

    @email.setter
    def email(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efd177aed92b7622f377c5779e96c078ab79c9b9b667b9e0b58214762d00958a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "email", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fax")
    def fax(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fax"))

    @fax.setter
    def fax(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2260018e8f5e7955572a07ebaf2c4b7e72f3bf238814e3bfa231f95109e14412)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fax", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="firstName")
    def first_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "firstName"))

    @first_name.setter
    def first_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__570aab2ae60fea8db4b37fc9f6638328cbd7a1485cdf1af51330a9a7a99f6a38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "firstName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lastName")
    def last_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastName"))

    @last_name.setter
    def last_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32b8913377c7fad1dac197cb1c6a48508aec428e1f8204ff7661cf0e65a4add1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lastName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="organizationName")
    def organization_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "organizationName"))

    @organization_name.setter
    def organization_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3c15d3ad680c1857f6fdd1bbe5a870e49b669b14064c3dccafa3a58e5748cbed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "organizationName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="phoneNumber")
    def phone_number(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "phoneNumber"))

    @phone_number.setter
    def phone_number(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3cd5f4f06b6f06ffa116e8abbfbc123e4d6391b6451629ad93f1f9a9808b722f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "phoneNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="state")
    def state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "state"))

    @state.setter
    def state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc87248234cdd0a4bab524c62cfb7ff391b60a8377e9356218969120605b1991)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "state", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="zipCode")
    def zip_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "zipCode"))

    @zip_code.setter
    def zip_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f26dd5739a9ee06f9b3fab0935b311f5ef5ee6f48d692db2413340c5662d7015)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "zipCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainAdminContact]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainAdminContact]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainAdminContact]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2ca1ee255a74829a8c877ca7a09d7ebbde057199a0cac0279461334eb4cf1fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainBillingContact",
    jsii_struct_bases=[],
    name_mapping={
        "address_line1": "addressLine1",
        "address_line2": "addressLine2",
        "city": "city",
        "contact_type": "contactType",
        "country_code": "countryCode",
        "email": "email",
        "extra_param": "extraParam",
        "fax": "fax",
        "first_name": "firstName",
        "last_name": "lastName",
        "organization_name": "organizationName",
        "phone_number": "phoneNumber",
        "state": "state",
        "zip_code": "zipCode",
    },
)
class Route53DomainsDomainBillingContact:
    def __init__(
        self,
        *,
        address_line1: typing.Optional[builtins.str] = None,
        address_line2: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        contact_type: typing.Optional[builtins.str] = None,
        country_code: typing.Optional[builtins.str] = None,
        email: typing.Optional[builtins.str] = None,
        extra_param: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainBillingContactExtraParam", typing.Dict[builtins.str, typing.Any]]]]] = None,
        fax: typing.Optional[builtins.str] = None,
        first_name: typing.Optional[builtins.str] = None,
        last_name: typing.Optional[builtins.str] = None,
        organization_name: typing.Optional[builtins.str] = None,
        phone_number: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
        zip_code: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address_line1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_1 Route53DomainsDomain#address_line_1}.
        :param address_line2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_2 Route53DomainsDomain#address_line_2}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#city Route53DomainsDomain#city}.
        :param contact_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#contact_type Route53DomainsDomain#contact_type}.
        :param country_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#country_code Route53DomainsDomain#country_code}.
        :param email: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#email Route53DomainsDomain#email}.
        :param extra_param: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}.
        :param fax: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#fax Route53DomainsDomain#fax}.
        :param first_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#first_name Route53DomainsDomain#first_name}.
        :param last_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#last_name Route53DomainsDomain#last_name}.
        :param organization_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#organization_name Route53DomainsDomain#organization_name}.
        :param phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#phone_number Route53DomainsDomain#phone_number}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#state Route53DomainsDomain#state}.
        :param zip_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#zip_code Route53DomainsDomain#zip_code}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a3b45b03e2a22d30233cf329d72a7248d62ae68179c662c471489fb90e5ea58)
            check_type(argname="argument address_line1", value=address_line1, expected_type=type_hints["address_line1"])
            check_type(argname="argument address_line2", value=address_line2, expected_type=type_hints["address_line2"])
            check_type(argname="argument city", value=city, expected_type=type_hints["city"])
            check_type(argname="argument contact_type", value=contact_type, expected_type=type_hints["contact_type"])
            check_type(argname="argument country_code", value=country_code, expected_type=type_hints["country_code"])
            check_type(argname="argument email", value=email, expected_type=type_hints["email"])
            check_type(argname="argument extra_param", value=extra_param, expected_type=type_hints["extra_param"])
            check_type(argname="argument fax", value=fax, expected_type=type_hints["fax"])
            check_type(argname="argument first_name", value=first_name, expected_type=type_hints["first_name"])
            check_type(argname="argument last_name", value=last_name, expected_type=type_hints["last_name"])
            check_type(argname="argument organization_name", value=organization_name, expected_type=type_hints["organization_name"])
            check_type(argname="argument phone_number", value=phone_number, expected_type=type_hints["phone_number"])
            check_type(argname="argument state", value=state, expected_type=type_hints["state"])
            check_type(argname="argument zip_code", value=zip_code, expected_type=type_hints["zip_code"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if address_line1 is not None:
            self._values["address_line1"] = address_line1
        if address_line2 is not None:
            self._values["address_line2"] = address_line2
        if city is not None:
            self._values["city"] = city
        if contact_type is not None:
            self._values["contact_type"] = contact_type
        if country_code is not None:
            self._values["country_code"] = country_code
        if email is not None:
            self._values["email"] = email
        if extra_param is not None:
            self._values["extra_param"] = extra_param
        if fax is not None:
            self._values["fax"] = fax
        if first_name is not None:
            self._values["first_name"] = first_name
        if last_name is not None:
            self._values["last_name"] = last_name
        if organization_name is not None:
            self._values["organization_name"] = organization_name
        if phone_number is not None:
            self._values["phone_number"] = phone_number
        if state is not None:
            self._values["state"] = state
        if zip_code is not None:
            self._values["zip_code"] = zip_code

    @builtins.property
    def address_line1(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_1 Route53DomainsDomain#address_line_1}.'''
        result = self._values.get("address_line1")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address_line2(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_2 Route53DomainsDomain#address_line_2}.'''
        result = self._values.get("address_line2")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def city(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#city Route53DomainsDomain#city}.'''
        result = self._values.get("city")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def contact_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#contact_type Route53DomainsDomain#contact_type}.'''
        result = self._values.get("contact_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def country_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#country_code Route53DomainsDomain#country_code}.'''
        result = self._values.get("country_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def email(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#email Route53DomainsDomain#email}.'''
        result = self._values.get("email")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def extra_param(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainBillingContactExtraParam"]]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}.'''
        result = self._values.get("extra_param")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainBillingContactExtraParam"]]], result)

    @builtins.property
    def fax(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#fax Route53DomainsDomain#fax}.'''
        result = self._values.get("fax")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def first_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#first_name Route53DomainsDomain#first_name}.'''
        result = self._values.get("first_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def last_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#last_name Route53DomainsDomain#last_name}.'''
        result = self._values.get("last_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def organization_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#organization_name Route53DomainsDomain#organization_name}.'''
        result = self._values.get("organization_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def phone_number(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#phone_number Route53DomainsDomain#phone_number}.'''
        result = self._values.get("phone_number")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#state Route53DomainsDomain#state}.'''
        result = self._values.get("state")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def zip_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#zip_code Route53DomainsDomain#zip_code}.'''
        result = self._values.get("zip_code")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainBillingContact(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainBillingContactExtraParam",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Route53DomainsDomainBillingContactExtraParam:
    def __init__(
        self,
        *,
        name: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#value Route53DomainsDomain#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21a090a069ec3f1d5455e821d0c61c95d5659120a1da9ffb3bbe0e1e98cb7f42)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if name is not None:
            self._values["name"] = name
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#value Route53DomainsDomain#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainBillingContactExtraParam(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53DomainsDomainBillingContactExtraParamList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainBillingContactExtraParamList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__29faf81e8fae5ca8a164a6c5c35920816a3315a0db7591b9846450e3273be7ba)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53DomainsDomainBillingContactExtraParamOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8acf1de76873c55a694d2bdb2e292096460c9206317d1f1c6526314a8296727)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53DomainsDomainBillingContactExtraParamOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e7d518a39c1681356add9304dd1559767da5676fe650d7e7c740717a7abf5f8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0c12c6d5fe124d23c07420b22461d3ed95325530526984d8fcc62198c707f9ff)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6ba21ed830c5dad41c91566f7956d39c37e21c2870708cdac5e2e74ac36ab6ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContactExtraParam]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContactExtraParam]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContactExtraParam]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca61a96c2c2b57afe4fe11c7ca8e1a2b6e0e91c2d2a09501252f1f4a83d17efa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainBillingContactExtraParamOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainBillingContactExtraParamOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9afcc33629e8a87c80c4b8dc3f21fa8b1397b57dd7aaeffb257e6504038a1e0e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

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
            type_hints = typing.get_type_hints(_typecheckingstub__751913ea93ad233a702e6c82333e10e106affcd315d8023966f6c7b8c3f1d12a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac93943305e8fbc0ed307b2b89b625861900dbf97a007770f49dd2d6689a8d2a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainBillingContactExtraParam]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainBillingContactExtraParam]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainBillingContactExtraParam]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56b8597f560ecaca53287bf464794c3320a51298207ba1d27bf251a709738e01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainBillingContactList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainBillingContactList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8418c0e22788be051a5758a6e66b5aff9297e69873f2fdc248252f73f76d85e5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53DomainsDomainBillingContactOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__19e16c55afaa569f97a9adb404d2e4ef7afe647ffc5bcbb1496f11b711a5c179)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53DomainsDomainBillingContactOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c29dd39a766fabd806cb2cfae1785f0be6f74b60745b404d26c1576dfe84c933)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8a0cb18a8ad5e275acd0bac5b4cfde38be4e4f4c0479f40b92995534ec784174)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6de7e31ce1948ab551148a996b3c8b4825f97f8f6e025fa52ce4e37944793d45)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContact]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContact]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContact]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aaf17af0407ea6eccfcb7cef5f0a1b98fa5e23464e20eec9c6f10acc11d02e3f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainBillingContactOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainBillingContactOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1506c04db8a2fa6dab68d470d66f486d3b8c210240bdf2a3ec7333bfe6b0b7ac)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putExtraParam")
    def put_extra_param(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainBillingContactExtraParam, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9dcd5c04a8d7b461912ed069ae08f884961cbaabbbefef17023529fdff8b4a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putExtraParam", [value]))

    @jsii.member(jsii_name="resetAddressLine1")
    def reset_address_line1(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressLine1", []))

    @jsii.member(jsii_name="resetAddressLine2")
    def reset_address_line2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressLine2", []))

    @jsii.member(jsii_name="resetCity")
    def reset_city(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCity", []))

    @jsii.member(jsii_name="resetContactType")
    def reset_contact_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContactType", []))

    @jsii.member(jsii_name="resetCountryCode")
    def reset_country_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCountryCode", []))

    @jsii.member(jsii_name="resetEmail")
    def reset_email(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmail", []))

    @jsii.member(jsii_name="resetExtraParam")
    def reset_extra_param(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExtraParam", []))

    @jsii.member(jsii_name="resetFax")
    def reset_fax(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFax", []))

    @jsii.member(jsii_name="resetFirstName")
    def reset_first_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFirstName", []))

    @jsii.member(jsii_name="resetLastName")
    def reset_last_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLastName", []))

    @jsii.member(jsii_name="resetOrganizationName")
    def reset_organization_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOrganizationName", []))

    @jsii.member(jsii_name="resetPhoneNumber")
    def reset_phone_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPhoneNumber", []))

    @jsii.member(jsii_name="resetState")
    def reset_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetState", []))

    @jsii.member(jsii_name="resetZipCode")
    def reset_zip_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetZipCode", []))

    @builtins.property
    @jsii.member(jsii_name="extraParam")
    def extra_param(self) -> Route53DomainsDomainBillingContactExtraParamList:
        return typing.cast(Route53DomainsDomainBillingContactExtraParamList, jsii.get(self, "extraParam"))

    @builtins.property
    @jsii.member(jsii_name="addressLine1Input")
    def address_line1_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine1Input"))

    @builtins.property
    @jsii.member(jsii_name="addressLine2Input")
    def address_line2_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine2Input"))

    @builtins.property
    @jsii.member(jsii_name="cityInput")
    def city_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cityInput"))

    @builtins.property
    @jsii.member(jsii_name="contactTypeInput")
    def contact_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contactTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="countryCodeInput")
    def country_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="emailInput")
    def email_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "emailInput"))

    @builtins.property
    @jsii.member(jsii_name="extraParamInput")
    def extra_param_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContactExtraParam]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContactExtraParam]]], jsii.get(self, "extraParamInput"))

    @builtins.property
    @jsii.member(jsii_name="faxInput")
    def fax_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "faxInput"))

    @builtins.property
    @jsii.member(jsii_name="firstNameInput")
    def first_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "firstNameInput"))

    @builtins.property
    @jsii.member(jsii_name="lastNameInput")
    def last_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lastNameInput"))

    @builtins.property
    @jsii.member(jsii_name="organizationNameInput")
    def organization_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "organizationNameInput"))

    @builtins.property
    @jsii.member(jsii_name="phoneNumberInput")
    def phone_number_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "phoneNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="stateInput")
    def state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stateInput"))

    @builtins.property
    @jsii.member(jsii_name="zipCodeInput")
    def zip_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "zipCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="addressLine1")
    def address_line1(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine1"))

    @address_line1.setter
    def address_line1(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5982493b65cc9f1c40f11cf52df1a341fd0fa4026f30cac9c8e846b92303621a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine1", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="addressLine2")
    def address_line2(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine2"))

    @address_line2.setter
    def address_line2(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db2baedd5b3f441978697041ff2460e19d0222f2841e105df73b589e60f84c56)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="city")
    def city(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "city"))

    @city.setter
    def city(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb663cdc1f8d30ce16e6630a8dbc8f10be78a163a23b36126fba0f6b963d8a98)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "city", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="contactType")
    def contact_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contactType"))

    @contact_type.setter
    def contact_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a4c8db34e605e6a47ca34235239c12d534e1b36185b8ef5f2dc7ef46dbe9e37)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contactType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="countryCode")
    def country_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "countryCode"))

    @country_code.setter
    def country_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a294ac628b12fcd87f80dd48d1b5e0ff9dd1b8185aafd336fbfbfee9bbe2f79a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "countryCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="email")
    def email(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "email"))

    @email.setter
    def email(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__083177a47eb52178a5f71abd48406ad9cecbed021a64dfba3a5108ad3627b578)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "email", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fax")
    def fax(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fax"))

    @fax.setter
    def fax(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__20202456c9ac58a8200a40e7968132616d30950981061a19d972a192727d0630)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fax", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="firstName")
    def first_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "firstName"))

    @first_name.setter
    def first_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9553a4636f8d9a274b9d058fc0508fe4c8e1a50055193017bc7935d54f0230b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "firstName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lastName")
    def last_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastName"))

    @last_name.setter
    def last_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2fb56702bfac09a547a190f67f092de0d2359bd2be6f24eda408050f618c9ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lastName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="organizationName")
    def organization_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "organizationName"))

    @organization_name.setter
    def organization_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__237f9b0d26101931ee780e02fa2df25a4a8c964461f68ef61ca30f9b88056397)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "organizationName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="phoneNumber")
    def phone_number(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "phoneNumber"))

    @phone_number.setter
    def phone_number(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8a8131e5079e378a09aab9168a9940b1537b8dc0af7ff1be46043ce8c8940e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "phoneNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="state")
    def state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "state"))

    @state.setter
    def state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ccca1940ca23f7cbd6fb642db72005a85adf269ca926be7e0d33f32773df7d91)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "state", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="zipCode")
    def zip_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "zipCode"))

    @zip_code.setter
    def zip_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04a825d6ed07cecedaed739cb59692af434f96cbb2c162e06b73d26331951320)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "zipCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainBillingContact]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainBillingContact]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainBillingContact]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f05d3f4f990d85091c99c953ed13433a13da4dd1e8ef327fa77b3054a55e9a02)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "domain_name": "domainName",
        "admin_contact": "adminContact",
        "admin_privacy": "adminPrivacy",
        "auto_renew": "autoRenew",
        "billing_contact": "billingContact",
        "billing_privacy": "billingPrivacy",
        "duration_in_years": "durationInYears",
        "name_server": "nameServer",
        "registrant_contact": "registrantContact",
        "registrant_privacy": "registrantPrivacy",
        "tags": "tags",
        "tech_contact": "techContact",
        "tech_privacy": "techPrivacy",
        "timeouts": "timeouts",
        "transfer_lock": "transferLock",
    },
)
class Route53DomainsDomainConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        domain_name: builtins.str,
        admin_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainAdminContact, typing.Dict[builtins.str, typing.Any]]]]] = None,
        admin_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        auto_renew: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        billing_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainBillingContact, typing.Dict[builtins.str, typing.Any]]]]] = None,
        billing_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        duration_in_years: typing.Optional[jsii.Number] = None,
        name_server: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainNameServer", typing.Dict[builtins.str, typing.Any]]]]] = None,
        registrant_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainRegistrantContact", typing.Dict[builtins.str, typing.Any]]]]] = None,
        registrant_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tech_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainTechContact", typing.Dict[builtins.str, typing.Any]]]]] = None,
        tech_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        timeouts: typing.Optional[typing.Union["Route53DomainsDomainTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        transfer_lock: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#domain_name Route53DomainsDomain#domain_name}.
        :param admin_contact: admin_contact block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_contact Route53DomainsDomain#admin_contact}
        :param admin_privacy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_privacy Route53DomainsDomain#admin_privacy}.
        :param auto_renew: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#auto_renew Route53DomainsDomain#auto_renew}.
        :param billing_contact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_contact Route53DomainsDomain#billing_contact}.
        :param billing_privacy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_privacy Route53DomainsDomain#billing_privacy}.
        :param duration_in_years: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#duration_in_years Route53DomainsDomain#duration_in_years}.
        :param name_server: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name_server Route53DomainsDomain#name_server}.
        :param registrant_contact: registrant_contact block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_contact Route53DomainsDomain#registrant_contact}
        :param registrant_privacy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_privacy Route53DomainsDomain#registrant_privacy}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tags Route53DomainsDomain#tags}.
        :param tech_contact: tech_contact block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_contact Route53DomainsDomain#tech_contact}
        :param tech_privacy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_privacy Route53DomainsDomain#tech_privacy}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#timeouts Route53DomainsDomain#timeouts}
        :param transfer_lock: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#transfer_lock Route53DomainsDomain#transfer_lock}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(timeouts, dict):
            timeouts = Route53DomainsDomainTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__66da50dcdd09b256dd721b4e3fb7f7b74ddff01bbcb6c92d73558cada39f2486)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument domain_name", value=domain_name, expected_type=type_hints["domain_name"])
            check_type(argname="argument admin_contact", value=admin_contact, expected_type=type_hints["admin_contact"])
            check_type(argname="argument admin_privacy", value=admin_privacy, expected_type=type_hints["admin_privacy"])
            check_type(argname="argument auto_renew", value=auto_renew, expected_type=type_hints["auto_renew"])
            check_type(argname="argument billing_contact", value=billing_contact, expected_type=type_hints["billing_contact"])
            check_type(argname="argument billing_privacy", value=billing_privacy, expected_type=type_hints["billing_privacy"])
            check_type(argname="argument duration_in_years", value=duration_in_years, expected_type=type_hints["duration_in_years"])
            check_type(argname="argument name_server", value=name_server, expected_type=type_hints["name_server"])
            check_type(argname="argument registrant_contact", value=registrant_contact, expected_type=type_hints["registrant_contact"])
            check_type(argname="argument registrant_privacy", value=registrant_privacy, expected_type=type_hints["registrant_privacy"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tech_contact", value=tech_contact, expected_type=type_hints["tech_contact"])
            check_type(argname="argument tech_privacy", value=tech_privacy, expected_type=type_hints["tech_privacy"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
            check_type(argname="argument transfer_lock", value=transfer_lock, expected_type=type_hints["transfer_lock"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
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
        if admin_contact is not None:
            self._values["admin_contact"] = admin_contact
        if admin_privacy is not None:
            self._values["admin_privacy"] = admin_privacy
        if auto_renew is not None:
            self._values["auto_renew"] = auto_renew
        if billing_contact is not None:
            self._values["billing_contact"] = billing_contact
        if billing_privacy is not None:
            self._values["billing_privacy"] = billing_privacy
        if duration_in_years is not None:
            self._values["duration_in_years"] = duration_in_years
        if name_server is not None:
            self._values["name_server"] = name_server
        if registrant_contact is not None:
            self._values["registrant_contact"] = registrant_contact
        if registrant_privacy is not None:
            self._values["registrant_privacy"] = registrant_privacy
        if tags is not None:
            self._values["tags"] = tags
        if tech_contact is not None:
            self._values["tech_contact"] = tech_contact
        if tech_privacy is not None:
            self._values["tech_privacy"] = tech_privacy
        if timeouts is not None:
            self._values["timeouts"] = timeouts
        if transfer_lock is not None:
            self._values["transfer_lock"] = transfer_lock

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
    def domain_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#domain_name Route53DomainsDomain#domain_name}.'''
        result = self._values.get("domain_name")
        assert result is not None, "Required property 'domain_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def admin_contact(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContact]]]:
        '''admin_contact block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_contact Route53DomainsDomain#admin_contact}
        '''
        result = self._values.get("admin_contact")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContact]]], result)

    @builtins.property
    def admin_privacy(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_privacy Route53DomainsDomain#admin_privacy}.'''
        result = self._values.get("admin_privacy")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def auto_renew(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#auto_renew Route53DomainsDomain#auto_renew}.'''
        result = self._values.get("auto_renew")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def billing_contact(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContact]]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_contact Route53DomainsDomain#billing_contact}.'''
        result = self._values.get("billing_contact")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContact]]], result)

    @builtins.property
    def billing_privacy(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_privacy Route53DomainsDomain#billing_privacy}.'''
        result = self._values.get("billing_privacy")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def duration_in_years(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#duration_in_years Route53DomainsDomain#duration_in_years}.'''
        result = self._values.get("duration_in_years")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def name_server(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainNameServer"]]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name_server Route53DomainsDomain#name_server}.'''
        result = self._values.get("name_server")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainNameServer"]]], result)

    @builtins.property
    def registrant_contact(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainRegistrantContact"]]]:
        '''registrant_contact block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_contact Route53DomainsDomain#registrant_contact}
        '''
        result = self._values.get("registrant_contact")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainRegistrantContact"]]], result)

    @builtins.property
    def registrant_privacy(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_privacy Route53DomainsDomain#registrant_privacy}.'''
        result = self._values.get("registrant_privacy")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tags Route53DomainsDomain#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tech_contact(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainTechContact"]]]:
        '''tech_contact block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_contact Route53DomainsDomain#tech_contact}
        '''
        result = self._values.get("tech_contact")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainTechContact"]]], result)

    @builtins.property
    def tech_privacy(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_privacy Route53DomainsDomain#tech_privacy}.'''
        result = self._values.get("tech_privacy")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["Route53DomainsDomainTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#timeouts Route53DomainsDomain#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["Route53DomainsDomainTimeouts"], result)

    @builtins.property
    def transfer_lock(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#transfer_lock Route53DomainsDomain#transfer_lock}.'''
        result = self._values.get("transfer_lock")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainNameServer",
    jsii_struct_bases=[],
    name_mapping={"glue_ips": "glueIps", "name": "name"},
)
class Route53DomainsDomainNameServer:
    def __init__(
        self,
        *,
        glue_ips: typing.Optional[typing.Sequence[builtins.str]] = None,
        name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param glue_ips: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#glue_ips Route53DomainsDomain#glue_ips}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23db45653ae46f8b801c2626d2e8a4c75db40f7ced4cb046623aa7ccb2490a00)
            check_type(argname="argument glue_ips", value=glue_ips, expected_type=type_hints["glue_ips"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if glue_ips is not None:
            self._values["glue_ips"] = glue_ips
        if name is not None:
            self._values["name"] = name

    @builtins.property
    def glue_ips(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#glue_ips Route53DomainsDomain#glue_ips}.'''
        result = self._values.get("glue_ips")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainNameServer(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53DomainsDomainNameServerList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainNameServerList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f27ee34b3edaaff5a607a06e8636ff63dfb9fcd208fd01ab1003d3167d816461)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53DomainsDomainNameServerOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f1d6f5198ef0db8ca7777a935d10f3473607de1f1ed900e8f9db0e2cce4161e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53DomainsDomainNameServerOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__69fb521ff55597c325a25866639203365c6097e559d74130958e937243fa432a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0fdef7bc7000d892187f5c3bd26a6b257cb3d19c8e8d6d086f07165000d2e5a3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c2a8029bd8b284ae5b8b116e28a2a0f5fbd513b21ae0a4769186003d2e5a63ca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainNameServer]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainNameServer]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainNameServer]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9efd14da505f9043f7652c19ac040b87a3154e5a69a65341edf5b4bef7049afe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainNameServerOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainNameServerOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9ca6aa1de1cb8a0f8fadb36f8ec33f3f5fbf290d3e83b578b719a6334cd3031e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetGlueIps")
    def reset_glue_ips(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGlueIps", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @builtins.property
    @jsii.member(jsii_name="glueIpsInput")
    def glue_ips_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "glueIpsInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="glueIps")
    def glue_ips(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "glueIps"))

    @glue_ips.setter
    def glue_ips(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__acc597f6365709f3ca93a5cda862ded3b9b76d6b0e2d6d8d996e96f7fbb44f11)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "glueIps", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6aaa9def3da8bfa82a709b5fa284fbe4cb6144aaf2aa9a0fcd4cb33c60c0e37)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainNameServer]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainNameServer]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainNameServer]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62861f00094843c00e4b2ae75715ef27b4597096a79b60c224a530c7fe27c0ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainRegistrantContact",
    jsii_struct_bases=[],
    name_mapping={
        "address_line1": "addressLine1",
        "address_line2": "addressLine2",
        "city": "city",
        "contact_type": "contactType",
        "country_code": "countryCode",
        "email": "email",
        "extra_param": "extraParam",
        "fax": "fax",
        "first_name": "firstName",
        "last_name": "lastName",
        "organization_name": "organizationName",
        "phone_number": "phoneNumber",
        "state": "state",
        "zip_code": "zipCode",
    },
)
class Route53DomainsDomainRegistrantContact:
    def __init__(
        self,
        *,
        address_line1: typing.Optional[builtins.str] = None,
        address_line2: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        contact_type: typing.Optional[builtins.str] = None,
        country_code: typing.Optional[builtins.str] = None,
        email: typing.Optional[builtins.str] = None,
        extra_param: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainRegistrantContactExtraParam", typing.Dict[builtins.str, typing.Any]]]]] = None,
        fax: typing.Optional[builtins.str] = None,
        first_name: typing.Optional[builtins.str] = None,
        last_name: typing.Optional[builtins.str] = None,
        organization_name: typing.Optional[builtins.str] = None,
        phone_number: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
        zip_code: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address_line1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_1 Route53DomainsDomain#address_line_1}.
        :param address_line2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_2 Route53DomainsDomain#address_line_2}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#city Route53DomainsDomain#city}.
        :param contact_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#contact_type Route53DomainsDomain#contact_type}.
        :param country_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#country_code Route53DomainsDomain#country_code}.
        :param email: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#email Route53DomainsDomain#email}.
        :param extra_param: extra_param block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}
        :param fax: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#fax Route53DomainsDomain#fax}.
        :param first_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#first_name Route53DomainsDomain#first_name}.
        :param last_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#last_name Route53DomainsDomain#last_name}.
        :param organization_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#organization_name Route53DomainsDomain#organization_name}.
        :param phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#phone_number Route53DomainsDomain#phone_number}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#state Route53DomainsDomain#state}.
        :param zip_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#zip_code Route53DomainsDomain#zip_code}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99cbb172ca60b33dcb0a0dcb99d7f6c3658b1cb3be485295bf5ebaf8a67aa0ab)
            check_type(argname="argument address_line1", value=address_line1, expected_type=type_hints["address_line1"])
            check_type(argname="argument address_line2", value=address_line2, expected_type=type_hints["address_line2"])
            check_type(argname="argument city", value=city, expected_type=type_hints["city"])
            check_type(argname="argument contact_type", value=contact_type, expected_type=type_hints["contact_type"])
            check_type(argname="argument country_code", value=country_code, expected_type=type_hints["country_code"])
            check_type(argname="argument email", value=email, expected_type=type_hints["email"])
            check_type(argname="argument extra_param", value=extra_param, expected_type=type_hints["extra_param"])
            check_type(argname="argument fax", value=fax, expected_type=type_hints["fax"])
            check_type(argname="argument first_name", value=first_name, expected_type=type_hints["first_name"])
            check_type(argname="argument last_name", value=last_name, expected_type=type_hints["last_name"])
            check_type(argname="argument organization_name", value=organization_name, expected_type=type_hints["organization_name"])
            check_type(argname="argument phone_number", value=phone_number, expected_type=type_hints["phone_number"])
            check_type(argname="argument state", value=state, expected_type=type_hints["state"])
            check_type(argname="argument zip_code", value=zip_code, expected_type=type_hints["zip_code"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if address_line1 is not None:
            self._values["address_line1"] = address_line1
        if address_line2 is not None:
            self._values["address_line2"] = address_line2
        if city is not None:
            self._values["city"] = city
        if contact_type is not None:
            self._values["contact_type"] = contact_type
        if country_code is not None:
            self._values["country_code"] = country_code
        if email is not None:
            self._values["email"] = email
        if extra_param is not None:
            self._values["extra_param"] = extra_param
        if fax is not None:
            self._values["fax"] = fax
        if first_name is not None:
            self._values["first_name"] = first_name
        if last_name is not None:
            self._values["last_name"] = last_name
        if organization_name is not None:
            self._values["organization_name"] = organization_name
        if phone_number is not None:
            self._values["phone_number"] = phone_number
        if state is not None:
            self._values["state"] = state
        if zip_code is not None:
            self._values["zip_code"] = zip_code

    @builtins.property
    def address_line1(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_1 Route53DomainsDomain#address_line_1}.'''
        result = self._values.get("address_line1")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address_line2(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_2 Route53DomainsDomain#address_line_2}.'''
        result = self._values.get("address_line2")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def city(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#city Route53DomainsDomain#city}.'''
        result = self._values.get("city")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def contact_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#contact_type Route53DomainsDomain#contact_type}.'''
        result = self._values.get("contact_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def country_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#country_code Route53DomainsDomain#country_code}.'''
        result = self._values.get("country_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def email(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#email Route53DomainsDomain#email}.'''
        result = self._values.get("email")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def extra_param(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainRegistrantContactExtraParam"]]]:
        '''extra_param block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}
        '''
        result = self._values.get("extra_param")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainRegistrantContactExtraParam"]]], result)

    @builtins.property
    def fax(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#fax Route53DomainsDomain#fax}.'''
        result = self._values.get("fax")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def first_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#first_name Route53DomainsDomain#first_name}.'''
        result = self._values.get("first_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def last_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#last_name Route53DomainsDomain#last_name}.'''
        result = self._values.get("last_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def organization_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#organization_name Route53DomainsDomain#organization_name}.'''
        result = self._values.get("organization_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def phone_number(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#phone_number Route53DomainsDomain#phone_number}.'''
        result = self._values.get("phone_number")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#state Route53DomainsDomain#state}.'''
        result = self._values.get("state")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def zip_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#zip_code Route53DomainsDomain#zip_code}.'''
        result = self._values.get("zip_code")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainRegistrantContact(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainRegistrantContactExtraParam",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Route53DomainsDomainRegistrantContactExtraParam:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#value Route53DomainsDomain#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a64ef9edd63e27d1a46b30c05ebfe06ab60700ac846c3782d4c352a53355cbc1)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#value Route53DomainsDomain#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainRegistrantContactExtraParam(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53DomainsDomainRegistrantContactExtraParamList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainRegistrantContactExtraParamList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4ab306f3e479b2aa2489a7f6a0972b3e10f7845a52fdd15bb4db15dd1b0fff17)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53DomainsDomainRegistrantContactExtraParamOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c176b4c68cf82da2160ae1896a7a435ce710a197c2540aec82b766f353e5b47f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53DomainsDomainRegistrantContactExtraParamOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b545ec63647b7997556952ce3fabd32b6520401e0c48715cff7c71947d49a67)
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
            type_hints = typing.get_type_hints(_typecheckingstub__fd8ea1437cc89ab22136e63f0ec6e360c255c802c0eb6cb4be28d36ce218fd41)
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
            type_hints = typing.get_type_hints(_typecheckingstub__30aafa2fdab41f6eb68be22eda56979eb682f57a32b9489c966409ed6ea1f820)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainRegistrantContactExtraParam]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainRegistrantContactExtraParam]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainRegistrantContactExtraParam]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3adfd8131566786a0b9ff458e021a54516cc702719fb705a4c7872bcc2445dcd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainRegistrantContactExtraParamOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainRegistrantContactExtraParamOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__09367cf4d0bb5c3abba5d9c25a89e3b7191f1425d4984b086c73f8961e93e966)
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
            type_hints = typing.get_type_hints(_typecheckingstub__eeb48f0c7d1b45d2412cfd82346f6961f7fd1bf32024d6c1f426c9a7d0a25758)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85edd0ded0e23750fc26f42845aa4d96e71b75f910981cd39a8e5cffe494a99f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainRegistrantContactExtraParam]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainRegistrantContactExtraParam]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainRegistrantContactExtraParam]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9566d7366ad9aa16cfb143569402af7b8bf99b4a4bd3c3f690e3f0ac4b7463f8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainRegistrantContactList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainRegistrantContactList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d9984e96043f6cb54952c6e778701ecf486a8a26921521b109d27d825c31ca60)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53DomainsDomainRegistrantContactOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2b5c8b99477331dfe3d78ed7d6ac6f4092f8bf2c9ef113b04914f7d107a234ed)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53DomainsDomainRegistrantContactOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3f82baede76f580fe22c63bf56ca08fa6b634d09f4ae6269d62c880eac916206)
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
            type_hints = typing.get_type_hints(_typecheckingstub__404d053a0cadbfdef8ee7ef831d0589f419fc1dbe84da323093ee863700e7943)
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
            type_hints = typing.get_type_hints(_typecheckingstub__82043f75318aa25773adf4e03c4fd10c3722ad3dc6fc873ac71cb5603c2a0b66)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainRegistrantContact]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainRegistrantContact]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainRegistrantContact]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2234588da86397e63365b53dd5ff84a41414e90b7dfbd919992c03b30e6f7657)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainRegistrantContactOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainRegistrantContactOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f9d5a0ad64408649b4931009cce07663bf5204011470f126dbf59991f046f327)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putExtraParam")
    def put_extra_param(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainRegistrantContactExtraParam, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83d02c31ff28107d35f4133e42794ad2fbdaa8c28b1ecf4adaf49e7dafa0c351)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putExtraParam", [value]))

    @jsii.member(jsii_name="resetAddressLine1")
    def reset_address_line1(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressLine1", []))

    @jsii.member(jsii_name="resetAddressLine2")
    def reset_address_line2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressLine2", []))

    @jsii.member(jsii_name="resetCity")
    def reset_city(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCity", []))

    @jsii.member(jsii_name="resetContactType")
    def reset_contact_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContactType", []))

    @jsii.member(jsii_name="resetCountryCode")
    def reset_country_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCountryCode", []))

    @jsii.member(jsii_name="resetEmail")
    def reset_email(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmail", []))

    @jsii.member(jsii_name="resetExtraParam")
    def reset_extra_param(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExtraParam", []))

    @jsii.member(jsii_name="resetFax")
    def reset_fax(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFax", []))

    @jsii.member(jsii_name="resetFirstName")
    def reset_first_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFirstName", []))

    @jsii.member(jsii_name="resetLastName")
    def reset_last_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLastName", []))

    @jsii.member(jsii_name="resetOrganizationName")
    def reset_organization_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOrganizationName", []))

    @jsii.member(jsii_name="resetPhoneNumber")
    def reset_phone_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPhoneNumber", []))

    @jsii.member(jsii_name="resetState")
    def reset_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetState", []))

    @jsii.member(jsii_name="resetZipCode")
    def reset_zip_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetZipCode", []))

    @builtins.property
    @jsii.member(jsii_name="extraParam")
    def extra_param(self) -> Route53DomainsDomainRegistrantContactExtraParamList:
        return typing.cast(Route53DomainsDomainRegistrantContactExtraParamList, jsii.get(self, "extraParam"))

    @builtins.property
    @jsii.member(jsii_name="addressLine1Input")
    def address_line1_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine1Input"))

    @builtins.property
    @jsii.member(jsii_name="addressLine2Input")
    def address_line2_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine2Input"))

    @builtins.property
    @jsii.member(jsii_name="cityInput")
    def city_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cityInput"))

    @builtins.property
    @jsii.member(jsii_name="contactTypeInput")
    def contact_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contactTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="countryCodeInput")
    def country_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="emailInput")
    def email_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "emailInput"))

    @builtins.property
    @jsii.member(jsii_name="extraParamInput")
    def extra_param_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainRegistrantContactExtraParam]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainRegistrantContactExtraParam]]], jsii.get(self, "extraParamInput"))

    @builtins.property
    @jsii.member(jsii_name="faxInput")
    def fax_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "faxInput"))

    @builtins.property
    @jsii.member(jsii_name="firstNameInput")
    def first_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "firstNameInput"))

    @builtins.property
    @jsii.member(jsii_name="lastNameInput")
    def last_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lastNameInput"))

    @builtins.property
    @jsii.member(jsii_name="organizationNameInput")
    def organization_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "organizationNameInput"))

    @builtins.property
    @jsii.member(jsii_name="phoneNumberInput")
    def phone_number_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "phoneNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="stateInput")
    def state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stateInput"))

    @builtins.property
    @jsii.member(jsii_name="zipCodeInput")
    def zip_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "zipCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="addressLine1")
    def address_line1(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine1"))

    @address_line1.setter
    def address_line1(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ed2704d11afd3e5a27de199a8b562fed820372a6fc96a2c17b39bc97adb41c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine1", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="addressLine2")
    def address_line2(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine2"))

    @address_line2.setter
    def address_line2(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__98de63f6bf60340e44430e621157cd63a779d6552aedced8e59d80ca34a3e37d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="city")
    def city(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "city"))

    @city.setter
    def city(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6820c341b7982d03ae159252e0456ff1191aad91e986fb8fc2b21fbeace71aac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "city", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="contactType")
    def contact_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contactType"))

    @contact_type.setter
    def contact_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3fb7dc72be7229fae164589853de4d2e91e1a156053e8ef413de1a3956a7c93)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contactType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="countryCode")
    def country_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "countryCode"))

    @country_code.setter
    def country_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23bc6307186b1f585d7352f3d465fc666abc63d06cead33a30dec7638e5157cd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "countryCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="email")
    def email(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "email"))

    @email.setter
    def email(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e43c205dc73df44d0bd61df82dc3d280e58040f9761ccb0fb660017f75e49d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "email", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fax")
    def fax(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fax"))

    @fax.setter
    def fax(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b095336de46866d2ce488bd30f3b702e986eced88c1d5b071083026174420f9f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fax", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="firstName")
    def first_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "firstName"))

    @first_name.setter
    def first_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0fa0db0c52f23ccabd8c4f56251561ab2a5196edb8b3f1dde43f902de5d0b380)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "firstName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lastName")
    def last_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastName"))

    @last_name.setter
    def last_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67cec470809691e63344bb41239eee0183eb8841d13a134bed27453f275ba54a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lastName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="organizationName")
    def organization_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "organizationName"))

    @organization_name.setter
    def organization_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ccf7c8397d16166a9a019faff99775b809d64601e0daa4ec82f581e93450330)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "organizationName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="phoneNumber")
    def phone_number(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "phoneNumber"))

    @phone_number.setter
    def phone_number(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec583a36aa01d8ba5cb0c3da714ef68c5c02f7333944fc4556a03714dfc5ab4e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "phoneNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="state")
    def state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "state"))

    @state.setter
    def state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d94683754eb7453e6de44bb8c9e4d080e728cf554d69d7be704dacf05237b14f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "state", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="zipCode")
    def zip_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "zipCode"))

    @zip_code.setter
    def zip_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9872bea52410190694392f4810bcef9677fd71597696dc4f613730534e96b915)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "zipCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainRegistrantContact]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainRegistrantContact]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainRegistrantContact]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6779b6bfd991f650ad906d8648d3adcf1b25e67ce3c11177121dd8565dd412fe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainTechContact",
    jsii_struct_bases=[],
    name_mapping={
        "address_line1": "addressLine1",
        "address_line2": "addressLine2",
        "city": "city",
        "contact_type": "contactType",
        "country_code": "countryCode",
        "email": "email",
        "extra_param": "extraParam",
        "fax": "fax",
        "first_name": "firstName",
        "last_name": "lastName",
        "organization_name": "organizationName",
        "phone_number": "phoneNumber",
        "state": "state",
        "zip_code": "zipCode",
    },
)
class Route53DomainsDomainTechContact:
    def __init__(
        self,
        *,
        address_line1: typing.Optional[builtins.str] = None,
        address_line2: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        contact_type: typing.Optional[builtins.str] = None,
        country_code: typing.Optional[builtins.str] = None,
        email: typing.Optional[builtins.str] = None,
        extra_param: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53DomainsDomainTechContactExtraParam", typing.Dict[builtins.str, typing.Any]]]]] = None,
        fax: typing.Optional[builtins.str] = None,
        first_name: typing.Optional[builtins.str] = None,
        last_name: typing.Optional[builtins.str] = None,
        organization_name: typing.Optional[builtins.str] = None,
        phone_number: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
        zip_code: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address_line1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_1 Route53DomainsDomain#address_line_1}.
        :param address_line2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_2 Route53DomainsDomain#address_line_2}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#city Route53DomainsDomain#city}.
        :param contact_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#contact_type Route53DomainsDomain#contact_type}.
        :param country_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#country_code Route53DomainsDomain#country_code}.
        :param email: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#email Route53DomainsDomain#email}.
        :param extra_param: extra_param block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}
        :param fax: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#fax Route53DomainsDomain#fax}.
        :param first_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#first_name Route53DomainsDomain#first_name}.
        :param last_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#last_name Route53DomainsDomain#last_name}.
        :param organization_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#organization_name Route53DomainsDomain#organization_name}.
        :param phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#phone_number Route53DomainsDomain#phone_number}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#state Route53DomainsDomain#state}.
        :param zip_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#zip_code Route53DomainsDomain#zip_code}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd41e90ceb64d45487661156044c340cebcae93dfb49bf0d46f8e14c92a472b8)
            check_type(argname="argument address_line1", value=address_line1, expected_type=type_hints["address_line1"])
            check_type(argname="argument address_line2", value=address_line2, expected_type=type_hints["address_line2"])
            check_type(argname="argument city", value=city, expected_type=type_hints["city"])
            check_type(argname="argument contact_type", value=contact_type, expected_type=type_hints["contact_type"])
            check_type(argname="argument country_code", value=country_code, expected_type=type_hints["country_code"])
            check_type(argname="argument email", value=email, expected_type=type_hints["email"])
            check_type(argname="argument extra_param", value=extra_param, expected_type=type_hints["extra_param"])
            check_type(argname="argument fax", value=fax, expected_type=type_hints["fax"])
            check_type(argname="argument first_name", value=first_name, expected_type=type_hints["first_name"])
            check_type(argname="argument last_name", value=last_name, expected_type=type_hints["last_name"])
            check_type(argname="argument organization_name", value=organization_name, expected_type=type_hints["organization_name"])
            check_type(argname="argument phone_number", value=phone_number, expected_type=type_hints["phone_number"])
            check_type(argname="argument state", value=state, expected_type=type_hints["state"])
            check_type(argname="argument zip_code", value=zip_code, expected_type=type_hints["zip_code"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if address_line1 is not None:
            self._values["address_line1"] = address_line1
        if address_line2 is not None:
            self._values["address_line2"] = address_line2
        if city is not None:
            self._values["city"] = city
        if contact_type is not None:
            self._values["contact_type"] = contact_type
        if country_code is not None:
            self._values["country_code"] = country_code
        if email is not None:
            self._values["email"] = email
        if extra_param is not None:
            self._values["extra_param"] = extra_param
        if fax is not None:
            self._values["fax"] = fax
        if first_name is not None:
            self._values["first_name"] = first_name
        if last_name is not None:
            self._values["last_name"] = last_name
        if organization_name is not None:
            self._values["organization_name"] = organization_name
        if phone_number is not None:
            self._values["phone_number"] = phone_number
        if state is not None:
            self._values["state"] = state
        if zip_code is not None:
            self._values["zip_code"] = zip_code

    @builtins.property
    def address_line1(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_1 Route53DomainsDomain#address_line_1}.'''
        result = self._values.get("address_line1")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address_line2(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_2 Route53DomainsDomain#address_line_2}.'''
        result = self._values.get("address_line2")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def city(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#city Route53DomainsDomain#city}.'''
        result = self._values.get("city")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def contact_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#contact_type Route53DomainsDomain#contact_type}.'''
        result = self._values.get("contact_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def country_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#country_code Route53DomainsDomain#country_code}.'''
        result = self._values.get("country_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def email(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#email Route53DomainsDomain#email}.'''
        result = self._values.get("email")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def extra_param(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainTechContactExtraParam"]]]:
        '''extra_param block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}
        '''
        result = self._values.get("extra_param")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53DomainsDomainTechContactExtraParam"]]], result)

    @builtins.property
    def fax(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#fax Route53DomainsDomain#fax}.'''
        result = self._values.get("fax")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def first_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#first_name Route53DomainsDomain#first_name}.'''
        result = self._values.get("first_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def last_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#last_name Route53DomainsDomain#last_name}.'''
        result = self._values.get("last_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def organization_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#organization_name Route53DomainsDomain#organization_name}.'''
        result = self._values.get("organization_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def phone_number(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#phone_number Route53DomainsDomain#phone_number}.'''
        result = self._values.get("phone_number")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#state Route53DomainsDomain#state}.'''
        result = self._values.get("state")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def zip_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#zip_code Route53DomainsDomain#zip_code}.'''
        result = self._values.get("zip_code")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainTechContact(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainTechContactExtraParam",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Route53DomainsDomainTechContactExtraParam:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#value Route53DomainsDomain#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e3138e7c34b7ce5149511cec0e8fc133683c1277857ec247a0c0062cc153c5d)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#value Route53DomainsDomain#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainTechContactExtraParam(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53DomainsDomainTechContactExtraParamList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainTechContactExtraParamList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a9dee47ffc524930aa86a9c80693fc1492e2626699b8f4b5843e50398bc6e55f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53DomainsDomainTechContactExtraParamOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76fcb01078880ea576cf0a2ee2f48aa254ded99a81a8637ca49d6ba271f9dd7d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53DomainsDomainTechContactExtraParamOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d21d22d803d2093218f3a2fb1612ba9f70ea18b315a84bf2ea772e69585d988)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e95bf9c32284ae83390b21fc63281a5feb863cf24615bc1fa8424b07f84f8ddb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6431d3328929d5aecb1932e471b66f42b70e9b6c0c60cf9df62fa390a51b1083)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainTechContactExtraParam]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainTechContactExtraParam]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainTechContactExtraParam]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__93916fdf06dd996be939bc0bcd92692ec9bac405c42cb3dae026630d6399ad9c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainTechContactExtraParamOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainTechContactExtraParamOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a63f535b0d9ab90d83f8a24195d9ec7a0fdf79ea0596f72b7d1011f1b873fce)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d7cb2f9562ebce877aa41d01f36e40d70fabd032959d4763eeed097a31b2f3f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3147be9d31926fa9f39a6e5490b75952429a0a2665ca49440ef099e1c3920c47)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTechContactExtraParam]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTechContactExtraParam]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTechContactExtraParam]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5a7bf41ad3a26641ab50b50a42dd9fd9dd2ae52390f39fd9ec33f459f592e93)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainTechContactList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainTechContactList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__725108e4baa45d27ca1135595e6447ec7c4df1b2757c1a57e4771ca476bc2140)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53DomainsDomainTechContactOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6e2c24d8374fa6ce251258c8a01065bad38a968eb767800b945c93c1409e6c0)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53DomainsDomainTechContactOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8806af4e425b90ab88f0bc6630a19e61b0cbab1239aa819ab100a4cc3c58341b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__83804f5da112102b0167346cb28b73b2667b3ad653688f67318ed5b64a58b520)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c0a09cddc08c87a56bc153dca3f815d77533b28dd55eb4f5ebd0f800b31a552f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainTechContact]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainTechContact]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainTechContact]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b66a3b5f5846599931f7b3ef8c9025f9c4b447fc0482373143c37644c9ffb090)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53DomainsDomainTechContactOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainTechContactOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e27bb9e42707eaf46ffd0a7ceba65a2325981dbf20ba8d2cc25fcfddfc29e13b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putExtraParam")
    def put_extra_param(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainTechContactExtraParam, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87a40adf655f680ce49db824d45a2cf3989cda30abe6df676aab7c3795f7bb1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putExtraParam", [value]))

    @jsii.member(jsii_name="resetAddressLine1")
    def reset_address_line1(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressLine1", []))

    @jsii.member(jsii_name="resetAddressLine2")
    def reset_address_line2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressLine2", []))

    @jsii.member(jsii_name="resetCity")
    def reset_city(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCity", []))

    @jsii.member(jsii_name="resetContactType")
    def reset_contact_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContactType", []))

    @jsii.member(jsii_name="resetCountryCode")
    def reset_country_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCountryCode", []))

    @jsii.member(jsii_name="resetEmail")
    def reset_email(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmail", []))

    @jsii.member(jsii_name="resetExtraParam")
    def reset_extra_param(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExtraParam", []))

    @jsii.member(jsii_name="resetFax")
    def reset_fax(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFax", []))

    @jsii.member(jsii_name="resetFirstName")
    def reset_first_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFirstName", []))

    @jsii.member(jsii_name="resetLastName")
    def reset_last_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLastName", []))

    @jsii.member(jsii_name="resetOrganizationName")
    def reset_organization_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOrganizationName", []))

    @jsii.member(jsii_name="resetPhoneNumber")
    def reset_phone_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPhoneNumber", []))

    @jsii.member(jsii_name="resetState")
    def reset_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetState", []))

    @jsii.member(jsii_name="resetZipCode")
    def reset_zip_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetZipCode", []))

    @builtins.property
    @jsii.member(jsii_name="extraParam")
    def extra_param(self) -> Route53DomainsDomainTechContactExtraParamList:
        return typing.cast(Route53DomainsDomainTechContactExtraParamList, jsii.get(self, "extraParam"))

    @builtins.property
    @jsii.member(jsii_name="addressLine1Input")
    def address_line1_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine1Input"))

    @builtins.property
    @jsii.member(jsii_name="addressLine2Input")
    def address_line2_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine2Input"))

    @builtins.property
    @jsii.member(jsii_name="cityInput")
    def city_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cityInput"))

    @builtins.property
    @jsii.member(jsii_name="contactTypeInput")
    def contact_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contactTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="countryCodeInput")
    def country_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="emailInput")
    def email_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "emailInput"))

    @builtins.property
    @jsii.member(jsii_name="extraParamInput")
    def extra_param_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainTechContactExtraParam]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainTechContactExtraParam]]], jsii.get(self, "extraParamInput"))

    @builtins.property
    @jsii.member(jsii_name="faxInput")
    def fax_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "faxInput"))

    @builtins.property
    @jsii.member(jsii_name="firstNameInput")
    def first_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "firstNameInput"))

    @builtins.property
    @jsii.member(jsii_name="lastNameInput")
    def last_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lastNameInput"))

    @builtins.property
    @jsii.member(jsii_name="organizationNameInput")
    def organization_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "organizationNameInput"))

    @builtins.property
    @jsii.member(jsii_name="phoneNumberInput")
    def phone_number_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "phoneNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="stateInput")
    def state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stateInput"))

    @builtins.property
    @jsii.member(jsii_name="zipCodeInput")
    def zip_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "zipCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="addressLine1")
    def address_line1(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine1"))

    @address_line1.setter
    def address_line1(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7ac74f2b10085df97247905a69c43022a7e42b958d1fb78d01dc2c739813d8ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine1", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="addressLine2")
    def address_line2(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine2"))

    @address_line2.setter
    def address_line2(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ba4abda697cea277b0b1652e70b632ac250bb043125a1c8230a93cc526c168d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="city")
    def city(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "city"))

    @city.setter
    def city(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__630ba2f2f43f22d08c7b14cf1ce768d936f7923ddb65e90c8c3d930b654eeee3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "city", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="contactType")
    def contact_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contactType"))

    @contact_type.setter
    def contact_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d14d384b1df49f1471de1c1cb1d10b826d693bb6ed5200653f54260b2c997e93)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contactType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="countryCode")
    def country_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "countryCode"))

    @country_code.setter
    def country_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ebdaef9c2a0c12b4b4f2f5d3910b320ff9bc214299cc29d26b9cadab4aab4503)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "countryCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="email")
    def email(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "email"))

    @email.setter
    def email(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24496b0bf82ca9b175efbd74d9a54670685b7a5d502bb9dab43f9d056a45c0e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "email", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fax")
    def fax(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fax"))

    @fax.setter
    def fax(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__310602a2861f6932f93278a654e83716387edf1bce0b67405307ce837facd892)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fax", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="firstName")
    def first_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "firstName"))

    @first_name.setter
    def first_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43a67dabd59a0bd8f4d293274115f29c588e2d9620abab70e2102743a3f49c38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "firstName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lastName")
    def last_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastName"))

    @last_name.setter
    def last_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__844c495a6da2ee299d1aa055d60e047b0eb121733104f163c3ac2a6a471bf644)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lastName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="organizationName")
    def organization_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "organizationName"))

    @organization_name.setter
    def organization_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__34db3b19c1ccb0a8088668ed120dd6bf62f4896b78918ec07d9583521f629799)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "organizationName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="phoneNumber")
    def phone_number(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "phoneNumber"))

    @phone_number.setter
    def phone_number(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bca6e3c7acec45a64b3682f4d96d17ef86f408b12e6ccb5712134ea6a6008f36)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "phoneNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="state")
    def state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "state"))

    @state.setter
    def state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__257d71267717465bdacab89f86da24cc51d438fb5e626ed12799358918138057)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "state", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="zipCode")
    def zip_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "zipCode"))

    @zip_code.setter
    def zip_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5afa4858c1d3f2893a0940daeb024db527ecdb33cf454ffcfc9acd87ddab3543)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "zipCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTechContact]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTechContact]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTechContact]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3ec10e880896cae56b9d84bc609f38bb7033767699ff55fd946593e53f29080)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class Route53DomainsDomainTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#create Route53DomainsDomain#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#delete Route53DomainsDomain#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#update Route53DomainsDomain#update}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3041930ffd3fdc47a205314a2e29454118a8dd5372e2aaf0d4632b264addb6f6)
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

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#create Route53DomainsDomain#create}
        '''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#delete Route53DomainsDomain#delete}
        '''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#update Route53DomainsDomain#update}
        '''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53DomainsDomainTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53DomainsDomainTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53DomainsDomain.Route53DomainsDomainTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a6ad15261b19ba38df1b66eac106baf80bcafab96eda4efa37df23affb412d1e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__600e6e79e4332ee7245592cab06b4b391c17e008b9f1dd90d5dca24b295a3f4f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a59efa392b5f9d09902b368848740ddfb256a6feb70e33573050e558d4ee42be)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22bbba2be94f74526847f16bbfe535c6aca6bfdabb54bf623d4885e9fc0c36b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04b0b3f7f2d92e4386074a86deaecbd9817293727db4a34d55fc45dcf56efaaa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Route53DomainsDomain",
    "Route53DomainsDomainAdminContact",
    "Route53DomainsDomainAdminContactExtraParam",
    "Route53DomainsDomainAdminContactExtraParamList",
    "Route53DomainsDomainAdminContactExtraParamOutputReference",
    "Route53DomainsDomainAdminContactList",
    "Route53DomainsDomainAdminContactOutputReference",
    "Route53DomainsDomainBillingContact",
    "Route53DomainsDomainBillingContactExtraParam",
    "Route53DomainsDomainBillingContactExtraParamList",
    "Route53DomainsDomainBillingContactExtraParamOutputReference",
    "Route53DomainsDomainBillingContactList",
    "Route53DomainsDomainBillingContactOutputReference",
    "Route53DomainsDomainConfig",
    "Route53DomainsDomainNameServer",
    "Route53DomainsDomainNameServerList",
    "Route53DomainsDomainNameServerOutputReference",
    "Route53DomainsDomainRegistrantContact",
    "Route53DomainsDomainRegistrantContactExtraParam",
    "Route53DomainsDomainRegistrantContactExtraParamList",
    "Route53DomainsDomainRegistrantContactExtraParamOutputReference",
    "Route53DomainsDomainRegistrantContactList",
    "Route53DomainsDomainRegistrantContactOutputReference",
    "Route53DomainsDomainTechContact",
    "Route53DomainsDomainTechContactExtraParam",
    "Route53DomainsDomainTechContactExtraParamList",
    "Route53DomainsDomainTechContactExtraParamOutputReference",
    "Route53DomainsDomainTechContactList",
    "Route53DomainsDomainTechContactOutputReference",
    "Route53DomainsDomainTimeouts",
    "Route53DomainsDomainTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__cca0b33b009827a34baf1c66e83607e21452b6c011d9d04460c23e654bc1bc4b(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    domain_name: builtins.str,
    admin_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainAdminContact, typing.Dict[builtins.str, typing.Any]]]]] = None,
    admin_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    auto_renew: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    billing_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainBillingContact, typing.Dict[builtins.str, typing.Any]]]]] = None,
    billing_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    duration_in_years: typing.Optional[jsii.Number] = None,
    name_server: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainNameServer, typing.Dict[builtins.str, typing.Any]]]]] = None,
    registrant_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainRegistrantContact, typing.Dict[builtins.str, typing.Any]]]]] = None,
    registrant_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tech_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainTechContact, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tech_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    timeouts: typing.Optional[typing.Union[Route53DomainsDomainTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    transfer_lock: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
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

def _typecheckingstub__524230adad742b16a11b695e4d9d108c39464511b65d9f57ffd89869984282b0(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4cf6dd46beab94294cbee34145e0a0a9abc2e5f672736d2e94dca1803bbb4f5b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainAdminContact, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e77290abd95108150bc9a48a72d7cf56bfd3b1ec6ac218ff5e1f41e8c16adbd2(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainBillingContact, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__441f4f2b6d5680a27bccb2a538325268677fa6fc1951dcb78af552449b712fd5(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainNameServer, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dddab91df36962012745ba26b4609ceaa2595b1b450d077fe3d2ea9dc728d0f0(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainRegistrantContact, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa9849737f7c6f747df531d3468c5e078328a3778d2e4dd898e9ccd68d96dde8(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainTechContact, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af7bb621d8cd04568b08a801c077c17327b47e1a53ec7df4d272814b993b5d7f(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79bdc7419316636084cb1cb9cd9dded294a266362374853a04b6ce9c50d3a6a6(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d6b588b60128dc0eb743ec72ec03a5ab19c09b12066394d60c24d06c0af318d(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd7c5b50e30fd139e98aac1bccfb1acb97a0f1d190f94799bb81a5c5237e6b2b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__729861842f556965bd57ac0cdd14398925463d53f93ac94afc90e3873123a0ed(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f5704d6d39c2572fe246d9043bda5986022d61255bc7d64375c4ffa60c884f3(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__380a90eeec4c3002abdb6940a94941c520f2851f4dddbd861ad92eb193bf8ff6(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0883a4c20ff0d93b9fee958c45071f955c019880245f9e76b9934f4088a9aa71(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05ee8afe5f31edc54dee456261623301cf60378f696f5a5baa6e1ff6f7ec4867(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63b151160ebed9c0b02aba64a726710d55ee16f3042da161ece99288a2c0de7d(
    *,
    address_line1: typing.Optional[builtins.str] = None,
    address_line2: typing.Optional[builtins.str] = None,
    city: typing.Optional[builtins.str] = None,
    contact_type: typing.Optional[builtins.str] = None,
    country_code: typing.Optional[builtins.str] = None,
    email: typing.Optional[builtins.str] = None,
    extra_param: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainAdminContactExtraParam, typing.Dict[builtins.str, typing.Any]]]]] = None,
    fax: typing.Optional[builtins.str] = None,
    first_name: typing.Optional[builtins.str] = None,
    last_name: typing.Optional[builtins.str] = None,
    organization_name: typing.Optional[builtins.str] = None,
    phone_number: typing.Optional[builtins.str] = None,
    state: typing.Optional[builtins.str] = None,
    zip_code: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f0039103b598d4968ac11827b8e077a4d29e373d807d408332f9c476fa94770(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41fe4ebe3c32ace78d2928e53062f5985f7de1233bea649c96be65141d8dcb48(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f3fd09eb4245f9643c1de42a02a5b5b11889ccbfe7357e8e1cda517a5efccff(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a67ce4e379d76515906aa71ec502273165bce63cd8f8b269da040f0de1d28f0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d8a36b79f1af95dc48937a2727c683a3080a783e2f27f7251462031ffc5ca92(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__151d57b5d7eb8c60ace7067ad519a299d1d9d2d7ad1fcb25a88ef03600c15158(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1fbf6a075e9ae0aa783fe030405d6ae009e9f235c276b50221fc5bc494f8967(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContactExtraParam]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f74be42d960283f3b2259f35241a17156e98f24b4cbfdd1085c56eac4326d2f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e67af8db3859f16d6e2aeaea66e4d57919eb2874e2f46f079d5baa108562a57a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__449dd2a50bd1d97d521492705ac864903aefbcc9e70fd9a4d08911cf145418ce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e513e9d3e09fdb466d6d8510bc2f7b8a351a95804958068ae8c8c505247154c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainAdminContactExtraParam]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__098ab85c80456b2e867af641faa2022dfabd40f6f4465ec3ad06265267a8b449(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2058ab171aaca2fdf34dd82cdf61b03638621dbfcf468251faf9c4798c080b09(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7da96fca69e2107eca24410c23da1cbb59121d2a90c9b24ed80b760bbdfaeec8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc780562216a766a49b8f08cf0639fd4429b95a678d4005634fc6d12fb77011d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f538d2b60e719e58012f5ea96650c159023cab5ec33b8afc088d9b2afa26bc1c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b466bddc7141c0185654fc327599e41114b04d8be99227bde1c1df3abb888981(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainAdminContact]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2db8f4e97db68529fa7e27c478f25320d43d0d1d906796d1098651afa369820(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5cedd41a936ef28c0a993c03ef4e67e50a69dab01203766e1e78d5f3644e3dac(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainAdminContactExtraParam, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23ac00f6c2c0802c0af944e8a7ef864d887a5ce367ada60a81ff5f235b648abd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__763b874274c19a8371f596f60f00d522492657569eb373f3fd0167c8591b278c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1be0bf2a9b19a141e0651fc92fa5020def7fd2622f6bfc9e1397a7d3369c455(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe2d3f740c26d74ab9690f2903363f8c622e37f9e2d4d47537a7935ecde3dff7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eeaa934228e1c4490f362afba2c0b2464531426e5589d2c8ea6fb447f34333c4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efd177aed92b7622f377c5779e96c078ab79c9b9b667b9e0b58214762d00958a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2260018e8f5e7955572a07ebaf2c4b7e72f3bf238814e3bfa231f95109e14412(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__570aab2ae60fea8db4b37fc9f6638328cbd7a1485cdf1af51330a9a7a99f6a38(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32b8913377c7fad1dac197cb1c6a48508aec428e1f8204ff7661cf0e65a4add1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c15d3ad680c1857f6fdd1bbe5a870e49b669b14064c3dccafa3a58e5748cbed(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cd5f4f06b6f06ffa116e8abbfbc123e4d6391b6451629ad93f1f9a9808b722f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc87248234cdd0a4bab524c62cfb7ff391b60a8377e9356218969120605b1991(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f26dd5739a9ee06f9b3fab0935b311f5ef5ee6f48d692db2413340c5662d7015(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2ca1ee255a74829a8c877ca7a09d7ebbde057199a0cac0279461334eb4cf1fb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainAdminContact]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a3b45b03e2a22d30233cf329d72a7248d62ae68179c662c471489fb90e5ea58(
    *,
    address_line1: typing.Optional[builtins.str] = None,
    address_line2: typing.Optional[builtins.str] = None,
    city: typing.Optional[builtins.str] = None,
    contact_type: typing.Optional[builtins.str] = None,
    country_code: typing.Optional[builtins.str] = None,
    email: typing.Optional[builtins.str] = None,
    extra_param: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainBillingContactExtraParam, typing.Dict[builtins.str, typing.Any]]]]] = None,
    fax: typing.Optional[builtins.str] = None,
    first_name: typing.Optional[builtins.str] = None,
    last_name: typing.Optional[builtins.str] = None,
    organization_name: typing.Optional[builtins.str] = None,
    phone_number: typing.Optional[builtins.str] = None,
    state: typing.Optional[builtins.str] = None,
    zip_code: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21a090a069ec3f1d5455e821d0c61c95d5659120a1da9ffb3bbe0e1e98cb7f42(
    *,
    name: typing.Optional[builtins.str] = None,
    value: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29faf81e8fae5ca8a164a6c5c35920816a3315a0db7591b9846450e3273be7ba(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8acf1de76873c55a694d2bdb2e292096460c9206317d1f1c6526314a8296727(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e7d518a39c1681356add9304dd1559767da5676fe650d7e7c740717a7abf5f8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c12c6d5fe124d23c07420b22461d3ed95325530526984d8fcc62198c707f9ff(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ba21ed830c5dad41c91566f7956d39c37e21c2870708cdac5e2e74ac36ab6ad(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca61a96c2c2b57afe4fe11c7ca8e1a2b6e0e91c2d2a09501252f1f4a83d17efa(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContactExtraParam]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9afcc33629e8a87c80c4b8dc3f21fa8b1397b57dd7aaeffb257e6504038a1e0e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__751913ea93ad233a702e6c82333e10e106affcd315d8023966f6c7b8c3f1d12a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac93943305e8fbc0ed307b2b89b625861900dbf97a007770f49dd2d6689a8d2a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56b8597f560ecaca53287bf464794c3320a51298207ba1d27bf251a709738e01(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainBillingContactExtraParam]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8418c0e22788be051a5758a6e66b5aff9297e69873f2fdc248252f73f76d85e5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19e16c55afaa569f97a9adb404d2e4ef7afe647ffc5bcbb1496f11b711a5c179(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c29dd39a766fabd806cb2cfae1785f0be6f74b60745b404d26c1576dfe84c933(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a0cb18a8ad5e275acd0bac5b4cfde38be4e4f4c0479f40b92995534ec784174(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6de7e31ce1948ab551148a996b3c8b4825f97f8f6e025fa52ce4e37944793d45(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aaf17af0407ea6eccfcb7cef5f0a1b98fa5e23464e20eec9c6f10acc11d02e3f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainBillingContact]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1506c04db8a2fa6dab68d470d66f486d3b8c210240bdf2a3ec7333bfe6b0b7ac(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9dcd5c04a8d7b461912ed069ae08f884961cbaabbbefef17023529fdff8b4a8(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainBillingContactExtraParam, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5982493b65cc9f1c40f11cf52df1a341fd0fa4026f30cac9c8e846b92303621a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db2baedd5b3f441978697041ff2460e19d0222f2841e105df73b589e60f84c56(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb663cdc1f8d30ce16e6630a8dbc8f10be78a163a23b36126fba0f6b963d8a98(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a4c8db34e605e6a47ca34235239c12d534e1b36185b8ef5f2dc7ef46dbe9e37(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a294ac628b12fcd87f80dd48d1b5e0ff9dd1b8185aafd336fbfbfee9bbe2f79a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__083177a47eb52178a5f71abd48406ad9cecbed021a64dfba3a5108ad3627b578(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__20202456c9ac58a8200a40e7968132616d30950981061a19d972a192727d0630(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9553a4636f8d9a274b9d058fc0508fe4c8e1a50055193017bc7935d54f0230b2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2fb56702bfac09a547a190f67f092de0d2359bd2be6f24eda408050f618c9ba(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__237f9b0d26101931ee780e02fa2df25a4a8c964461f68ef61ca30f9b88056397(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8a8131e5079e378a09aab9168a9940b1537b8dc0af7ff1be46043ce8c8940e9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ccca1940ca23f7cbd6fb642db72005a85adf269ca926be7e0d33f32773df7d91(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04a825d6ed07cecedaed739cb59692af434f96cbb2c162e06b73d26331951320(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f05d3f4f990d85091c99c953ed13433a13da4dd1e8ef327fa77b3054a55e9a02(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainBillingContact]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66da50dcdd09b256dd721b4e3fb7f7b74ddff01bbcb6c92d73558cada39f2486(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    domain_name: builtins.str,
    admin_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainAdminContact, typing.Dict[builtins.str, typing.Any]]]]] = None,
    admin_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    auto_renew: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    billing_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainBillingContact, typing.Dict[builtins.str, typing.Any]]]]] = None,
    billing_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    duration_in_years: typing.Optional[jsii.Number] = None,
    name_server: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainNameServer, typing.Dict[builtins.str, typing.Any]]]]] = None,
    registrant_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainRegistrantContact, typing.Dict[builtins.str, typing.Any]]]]] = None,
    registrant_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tech_contact: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainTechContact, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tech_privacy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    timeouts: typing.Optional[typing.Union[Route53DomainsDomainTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    transfer_lock: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23db45653ae46f8b801c2626d2e8a4c75db40f7ced4cb046623aa7ccb2490a00(
    *,
    glue_ips: typing.Optional[typing.Sequence[builtins.str]] = None,
    name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f27ee34b3edaaff5a607a06e8636ff63dfb9fcd208fd01ab1003d3167d816461(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f1d6f5198ef0db8ca7777a935d10f3473607de1f1ed900e8f9db0e2cce4161e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69fb521ff55597c325a25866639203365c6097e559d74130958e937243fa432a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0fdef7bc7000d892187f5c3bd26a6b257cb3d19c8e8d6d086f07165000d2e5a3(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2a8029bd8b284ae5b8b116e28a2a0f5fbd513b21ae0a4769186003d2e5a63ca(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9efd14da505f9043f7652c19ac040b87a3154e5a69a65341edf5b4bef7049afe(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainNameServer]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ca6aa1de1cb8a0f8fadb36f8ec33f3f5fbf290d3e83b578b719a6334cd3031e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__acc597f6365709f3ca93a5cda862ded3b9b76d6b0e2d6d8d996e96f7fbb44f11(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6aaa9def3da8bfa82a709b5fa284fbe4cb6144aaf2aa9a0fcd4cb33c60c0e37(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62861f00094843c00e4b2ae75715ef27b4597096a79b60c224a530c7fe27c0ec(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainNameServer]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99cbb172ca60b33dcb0a0dcb99d7f6c3658b1cb3be485295bf5ebaf8a67aa0ab(
    *,
    address_line1: typing.Optional[builtins.str] = None,
    address_line2: typing.Optional[builtins.str] = None,
    city: typing.Optional[builtins.str] = None,
    contact_type: typing.Optional[builtins.str] = None,
    country_code: typing.Optional[builtins.str] = None,
    email: typing.Optional[builtins.str] = None,
    extra_param: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainRegistrantContactExtraParam, typing.Dict[builtins.str, typing.Any]]]]] = None,
    fax: typing.Optional[builtins.str] = None,
    first_name: typing.Optional[builtins.str] = None,
    last_name: typing.Optional[builtins.str] = None,
    organization_name: typing.Optional[builtins.str] = None,
    phone_number: typing.Optional[builtins.str] = None,
    state: typing.Optional[builtins.str] = None,
    zip_code: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a64ef9edd63e27d1a46b30c05ebfe06ab60700ac846c3782d4c352a53355cbc1(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ab306f3e479b2aa2489a7f6a0972b3e10f7845a52fdd15bb4db15dd1b0fff17(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c176b4c68cf82da2160ae1896a7a435ce710a197c2540aec82b766f353e5b47f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b545ec63647b7997556952ce3fabd32b6520401e0c48715cff7c71947d49a67(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd8ea1437cc89ab22136e63f0ec6e360c255c802c0eb6cb4be28d36ce218fd41(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30aafa2fdab41f6eb68be22eda56979eb682f57a32b9489c966409ed6ea1f820(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3adfd8131566786a0b9ff458e021a54516cc702719fb705a4c7872bcc2445dcd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainRegistrantContactExtraParam]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09367cf4d0bb5c3abba5d9c25a89e3b7191f1425d4984b086c73f8961e93e966(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eeb48f0c7d1b45d2412cfd82346f6961f7fd1bf32024d6c1f426c9a7d0a25758(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85edd0ded0e23750fc26f42845aa4d96e71b75f910981cd39a8e5cffe494a99f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9566d7366ad9aa16cfb143569402af7b8bf99b4a4bd3c3f690e3f0ac4b7463f8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainRegistrantContactExtraParam]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9984e96043f6cb54952c6e778701ecf486a8a26921521b109d27d825c31ca60(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b5c8b99477331dfe3d78ed7d6ac6f4092f8bf2c9ef113b04914f7d107a234ed(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f82baede76f580fe22c63bf56ca08fa6b634d09f4ae6269d62c880eac916206(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__404d053a0cadbfdef8ee7ef831d0589f419fc1dbe84da323093ee863700e7943(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82043f75318aa25773adf4e03c4fd10c3722ad3dc6fc873ac71cb5603c2a0b66(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2234588da86397e63365b53dd5ff84a41414e90b7dfbd919992c03b30e6f7657(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainRegistrantContact]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9d5a0ad64408649b4931009cce07663bf5204011470f126dbf59991f046f327(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83d02c31ff28107d35f4133e42794ad2fbdaa8c28b1ecf4adaf49e7dafa0c351(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainRegistrantContactExtraParam, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ed2704d11afd3e5a27de199a8b562fed820372a6fc96a2c17b39bc97adb41c8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98de63f6bf60340e44430e621157cd63a779d6552aedced8e59d80ca34a3e37d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6820c341b7982d03ae159252e0456ff1191aad91e986fb8fc2b21fbeace71aac(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3fb7dc72be7229fae164589853de4d2e91e1a156053e8ef413de1a3956a7c93(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23bc6307186b1f585d7352f3d465fc666abc63d06cead33a30dec7638e5157cd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e43c205dc73df44d0bd61df82dc3d280e58040f9761ccb0fb660017f75e49d2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b095336de46866d2ce488bd30f3b702e986eced88c1d5b071083026174420f9f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0fa0db0c52f23ccabd8c4f56251561ab2a5196edb8b3f1dde43f902de5d0b380(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67cec470809691e63344bb41239eee0183eb8841d13a134bed27453f275ba54a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ccf7c8397d16166a9a019faff99775b809d64601e0daa4ec82f581e93450330(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec583a36aa01d8ba5cb0c3da714ef68c5c02f7333944fc4556a03714dfc5ab4e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d94683754eb7453e6de44bb8c9e4d080e728cf554d69d7be704dacf05237b14f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9872bea52410190694392f4810bcef9677fd71597696dc4f613730534e96b915(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6779b6bfd991f650ad906d8648d3adcf1b25e67ce3c11177121dd8565dd412fe(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainRegistrantContact]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd41e90ceb64d45487661156044c340cebcae93dfb49bf0d46f8e14c92a472b8(
    *,
    address_line1: typing.Optional[builtins.str] = None,
    address_line2: typing.Optional[builtins.str] = None,
    city: typing.Optional[builtins.str] = None,
    contact_type: typing.Optional[builtins.str] = None,
    country_code: typing.Optional[builtins.str] = None,
    email: typing.Optional[builtins.str] = None,
    extra_param: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainTechContactExtraParam, typing.Dict[builtins.str, typing.Any]]]]] = None,
    fax: typing.Optional[builtins.str] = None,
    first_name: typing.Optional[builtins.str] = None,
    last_name: typing.Optional[builtins.str] = None,
    organization_name: typing.Optional[builtins.str] = None,
    phone_number: typing.Optional[builtins.str] = None,
    state: typing.Optional[builtins.str] = None,
    zip_code: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e3138e7c34b7ce5149511cec0e8fc133683c1277857ec247a0c0062cc153c5d(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9dee47ffc524930aa86a9c80693fc1492e2626699b8f4b5843e50398bc6e55f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76fcb01078880ea576cf0a2ee2f48aa254ded99a81a8637ca49d6ba271f9dd7d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d21d22d803d2093218f3a2fb1612ba9f70ea18b315a84bf2ea772e69585d988(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e95bf9c32284ae83390b21fc63281a5feb863cf24615bc1fa8424b07f84f8ddb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6431d3328929d5aecb1932e471b66f42b70e9b6c0c60cf9df62fa390a51b1083(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93916fdf06dd996be939bc0bcd92692ec9bac405c42cb3dae026630d6399ad9c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainTechContactExtraParam]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a63f535b0d9ab90d83f8a24195d9ec7a0fdf79ea0596f72b7d1011f1b873fce(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7cb2f9562ebce877aa41d01f36e40d70fabd032959d4763eeed097a31b2f3f3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3147be9d31926fa9f39a6e5490b75952429a0a2665ca49440ef099e1c3920c47(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5a7bf41ad3a26641ab50b50a42dd9fd9dd2ae52390f39fd9ec33f459f592e93(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTechContactExtraParam]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__725108e4baa45d27ca1135595e6447ec7c4df1b2757c1a57e4771ca476bc2140(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6e2c24d8374fa6ce251258c8a01065bad38a968eb767800b945c93c1409e6c0(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8806af4e425b90ab88f0bc6630a19e61b0cbab1239aa819ab100a4cc3c58341b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83804f5da112102b0167346cb28b73b2667b3ad653688f67318ed5b64a58b520(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0a09cddc08c87a56bc153dca3f815d77533b28dd55eb4f5ebd0f800b31a552f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b66a3b5f5846599931f7b3ef8c9025f9c4b447fc0482373143c37644c9ffb090(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53DomainsDomainTechContact]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e27bb9e42707eaf46ffd0a7ceba65a2325981dbf20ba8d2cc25fcfddfc29e13b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87a40adf655f680ce49db824d45a2cf3989cda30abe6df676aab7c3795f7bb1c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53DomainsDomainTechContactExtraParam, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ac74f2b10085df97247905a69c43022a7e42b958d1fb78d01dc2c739813d8ac(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ba4abda697cea277b0b1652e70b632ac250bb043125a1c8230a93cc526c168d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__630ba2f2f43f22d08c7b14cf1ce768d936f7923ddb65e90c8c3d930b654eeee3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d14d384b1df49f1471de1c1cb1d10b826d693bb6ed5200653f54260b2c997e93(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebdaef9c2a0c12b4b4f2f5d3910b320ff9bc214299cc29d26b9cadab4aab4503(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24496b0bf82ca9b175efbd74d9a54670685b7a5d502bb9dab43f9d056a45c0e7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__310602a2861f6932f93278a654e83716387edf1bce0b67405307ce837facd892(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43a67dabd59a0bd8f4d293274115f29c588e2d9620abab70e2102743a3f49c38(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__844c495a6da2ee299d1aa055d60e047b0eb121733104f163c3ac2a6a471bf644(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__34db3b19c1ccb0a8088668ed120dd6bf62f4896b78918ec07d9583521f629799(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bca6e3c7acec45a64b3682f4d96d17ef86f408b12e6ccb5712134ea6a6008f36(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__257d71267717465bdacab89f86da24cc51d438fb5e626ed12799358918138057(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5afa4858c1d3f2893a0940daeb024db527ecdb33cf454ffcfc9acd87ddab3543(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3ec10e880896cae56b9d84bc609f38bb7033767699ff55fd946593e53f29080(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTechContact]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3041930ffd3fdc47a205314a2e29454118a8dd5372e2aaf0d4632b264addb6f6(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6ad15261b19ba38df1b66eac106baf80bcafab96eda4efa37df23affb412d1e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__600e6e79e4332ee7245592cab06b4b391c17e008b9f1dd90d5dca24b295a3f4f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a59efa392b5f9d09902b368848740ddfb256a6feb70e33573050e558d4ee42be(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22bbba2be94f74526847f16bbfe535c6aca6bfdabb54bf623d4885e9fc0c36b8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04b0b3f7f2d92e4386074a86deaecbd9817293727db4a34d55fc45dcf56efaaa(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53DomainsDomainTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
