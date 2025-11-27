r'''
# `aws_customerprofiles_profile`

Refer to the Terraform Registry for docs: [`aws_customerprofiles_profile`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile).
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


class CustomerprofilesProfile(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesProfile.CustomerprofilesProfile",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile aws_customerprofiles_profile}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        domain_name: builtins.str,
        account_number: typing.Optional[builtins.str] = None,
        additional_information: typing.Optional[builtins.str] = None,
        address: typing.Optional[typing.Union["CustomerprofilesProfileAddress", typing.Dict[builtins.str, typing.Any]]] = None,
        attributes: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        billing_address: typing.Optional[typing.Union["CustomerprofilesProfileBillingAddress", typing.Dict[builtins.str, typing.Any]]] = None,
        birth_date: typing.Optional[builtins.str] = None,
        business_email_address: typing.Optional[builtins.str] = None,
        business_name: typing.Optional[builtins.str] = None,
        business_phone_number: typing.Optional[builtins.str] = None,
        email_address: typing.Optional[builtins.str] = None,
        first_name: typing.Optional[builtins.str] = None,
        gender_string: typing.Optional[builtins.str] = None,
        home_phone_number: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        last_name: typing.Optional[builtins.str] = None,
        mailing_address: typing.Optional[typing.Union["CustomerprofilesProfileMailingAddress", typing.Dict[builtins.str, typing.Any]]] = None,
        middle_name: typing.Optional[builtins.str] = None,
        mobile_phone_number: typing.Optional[builtins.str] = None,
        party_type_string: typing.Optional[builtins.str] = None,
        personal_email_address: typing.Optional[builtins.str] = None,
        phone_number: typing.Optional[builtins.str] = None,
        shipping_address: typing.Optional[typing.Union["CustomerprofilesProfileShippingAddress", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile aws_customerprofiles_profile} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#domain_name CustomerprofilesProfile#domain_name}.
        :param account_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#account_number CustomerprofilesProfile#account_number}.
        :param additional_information: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#additional_information CustomerprofilesProfile#additional_information}.
        :param address: address block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address CustomerprofilesProfile#address}
        :param attributes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#attributes CustomerprofilesProfile#attributes}.
        :param billing_address: billing_address block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#billing_address CustomerprofilesProfile#billing_address}
        :param birth_date: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#birth_date CustomerprofilesProfile#birth_date}.
        :param business_email_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_email_address CustomerprofilesProfile#business_email_address}.
        :param business_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_name CustomerprofilesProfile#business_name}.
        :param business_phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_phone_number CustomerprofilesProfile#business_phone_number}.
        :param email_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#email_address CustomerprofilesProfile#email_address}.
        :param first_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#first_name CustomerprofilesProfile#first_name}.
        :param gender_string: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#gender_string CustomerprofilesProfile#gender_string}.
        :param home_phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#home_phone_number CustomerprofilesProfile#home_phone_number}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#id CustomerprofilesProfile#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param last_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#last_name CustomerprofilesProfile#last_name}.
        :param mailing_address: mailing_address block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mailing_address CustomerprofilesProfile#mailing_address}
        :param middle_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#middle_name CustomerprofilesProfile#middle_name}.
        :param mobile_phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mobile_phone_number CustomerprofilesProfile#mobile_phone_number}.
        :param party_type_string: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#party_type_string CustomerprofilesProfile#party_type_string}.
        :param personal_email_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#personal_email_address CustomerprofilesProfile#personal_email_address}.
        :param phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#phone_number CustomerprofilesProfile#phone_number}.
        :param shipping_address: shipping_address block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#shipping_address CustomerprofilesProfile#shipping_address}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eea87255d1a85ea574b11cf7741c4590f280b395d16395992533470cd97ca221)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = CustomerprofilesProfileConfig(
            domain_name=domain_name,
            account_number=account_number,
            additional_information=additional_information,
            address=address,
            attributes=attributes,
            billing_address=billing_address,
            birth_date=birth_date,
            business_email_address=business_email_address,
            business_name=business_name,
            business_phone_number=business_phone_number,
            email_address=email_address,
            first_name=first_name,
            gender_string=gender_string,
            home_phone_number=home_phone_number,
            id=id,
            last_name=last_name,
            mailing_address=mailing_address,
            middle_name=middle_name,
            mobile_phone_number=mobile_phone_number,
            party_type_string=party_type_string,
            personal_email_address=personal_email_address,
            phone_number=phone_number,
            shipping_address=shipping_address,
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
        '''Generates CDKTF code for importing a CustomerprofilesProfile resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the CustomerprofilesProfile to import.
        :param import_from_id: The id of the existing CustomerprofilesProfile that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the CustomerprofilesProfile to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5abf2426b57d406638794a592e05d3112b3f2f697edab0f91511e4f788530c0)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAddress")
    def put_address(
        self,
        *,
        address1: typing.Optional[builtins.str] = None,
        address2: typing.Optional[builtins.str] = None,
        address3: typing.Optional[builtins.str] = None,
        address4: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        country: typing.Optional[builtins.str] = None,
        county: typing.Optional[builtins.str] = None,
        postal_code: typing.Optional[builtins.str] = None,
        province: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.
        :param address2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.
        :param address3: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.
        :param address4: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.
        :param country: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.
        :param county: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.
        :param postal_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.
        :param province: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.
        '''
        value = CustomerprofilesProfileAddress(
            address1=address1,
            address2=address2,
            address3=address3,
            address4=address4,
            city=city,
            country=country,
            county=county,
            postal_code=postal_code,
            province=province,
            state=state,
        )

        return typing.cast(None, jsii.invoke(self, "putAddress", [value]))

    @jsii.member(jsii_name="putBillingAddress")
    def put_billing_address(
        self,
        *,
        address1: typing.Optional[builtins.str] = None,
        address2: typing.Optional[builtins.str] = None,
        address3: typing.Optional[builtins.str] = None,
        address4: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        country: typing.Optional[builtins.str] = None,
        county: typing.Optional[builtins.str] = None,
        postal_code: typing.Optional[builtins.str] = None,
        province: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.
        :param address2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.
        :param address3: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.
        :param address4: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.
        :param country: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.
        :param county: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.
        :param postal_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.
        :param province: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.
        '''
        value = CustomerprofilesProfileBillingAddress(
            address1=address1,
            address2=address2,
            address3=address3,
            address4=address4,
            city=city,
            country=country,
            county=county,
            postal_code=postal_code,
            province=province,
            state=state,
        )

        return typing.cast(None, jsii.invoke(self, "putBillingAddress", [value]))

    @jsii.member(jsii_name="putMailingAddress")
    def put_mailing_address(
        self,
        *,
        address1: typing.Optional[builtins.str] = None,
        address2: typing.Optional[builtins.str] = None,
        address3: typing.Optional[builtins.str] = None,
        address4: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        country: typing.Optional[builtins.str] = None,
        county: typing.Optional[builtins.str] = None,
        postal_code: typing.Optional[builtins.str] = None,
        province: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.
        :param address2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.
        :param address3: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.
        :param address4: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.
        :param country: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.
        :param county: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.
        :param postal_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.
        :param province: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.
        '''
        value = CustomerprofilesProfileMailingAddress(
            address1=address1,
            address2=address2,
            address3=address3,
            address4=address4,
            city=city,
            country=country,
            county=county,
            postal_code=postal_code,
            province=province,
            state=state,
        )

        return typing.cast(None, jsii.invoke(self, "putMailingAddress", [value]))

    @jsii.member(jsii_name="putShippingAddress")
    def put_shipping_address(
        self,
        *,
        address1: typing.Optional[builtins.str] = None,
        address2: typing.Optional[builtins.str] = None,
        address3: typing.Optional[builtins.str] = None,
        address4: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        country: typing.Optional[builtins.str] = None,
        county: typing.Optional[builtins.str] = None,
        postal_code: typing.Optional[builtins.str] = None,
        province: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.
        :param address2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.
        :param address3: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.
        :param address4: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.
        :param country: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.
        :param county: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.
        :param postal_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.
        :param province: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.
        '''
        value = CustomerprofilesProfileShippingAddress(
            address1=address1,
            address2=address2,
            address3=address3,
            address4=address4,
            city=city,
            country=country,
            county=county,
            postal_code=postal_code,
            province=province,
            state=state,
        )

        return typing.cast(None, jsii.invoke(self, "putShippingAddress", [value]))

    @jsii.member(jsii_name="resetAccountNumber")
    def reset_account_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccountNumber", []))

    @jsii.member(jsii_name="resetAdditionalInformation")
    def reset_additional_information(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAdditionalInformation", []))

    @jsii.member(jsii_name="resetAddress")
    def reset_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress", []))

    @jsii.member(jsii_name="resetAttributes")
    def reset_attributes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAttributes", []))

    @jsii.member(jsii_name="resetBillingAddress")
    def reset_billing_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBillingAddress", []))

    @jsii.member(jsii_name="resetBirthDate")
    def reset_birth_date(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBirthDate", []))

    @jsii.member(jsii_name="resetBusinessEmailAddress")
    def reset_business_email_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBusinessEmailAddress", []))

    @jsii.member(jsii_name="resetBusinessName")
    def reset_business_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBusinessName", []))

    @jsii.member(jsii_name="resetBusinessPhoneNumber")
    def reset_business_phone_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBusinessPhoneNumber", []))

    @jsii.member(jsii_name="resetEmailAddress")
    def reset_email_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmailAddress", []))

    @jsii.member(jsii_name="resetFirstName")
    def reset_first_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFirstName", []))

    @jsii.member(jsii_name="resetGenderString")
    def reset_gender_string(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGenderString", []))

    @jsii.member(jsii_name="resetHomePhoneNumber")
    def reset_home_phone_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHomePhoneNumber", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetLastName")
    def reset_last_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLastName", []))

    @jsii.member(jsii_name="resetMailingAddress")
    def reset_mailing_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMailingAddress", []))

    @jsii.member(jsii_name="resetMiddleName")
    def reset_middle_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMiddleName", []))

    @jsii.member(jsii_name="resetMobilePhoneNumber")
    def reset_mobile_phone_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMobilePhoneNumber", []))

    @jsii.member(jsii_name="resetPartyTypeString")
    def reset_party_type_string(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPartyTypeString", []))

    @jsii.member(jsii_name="resetPersonalEmailAddress")
    def reset_personal_email_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPersonalEmailAddress", []))

    @jsii.member(jsii_name="resetPhoneNumber")
    def reset_phone_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPhoneNumber", []))

    @jsii.member(jsii_name="resetShippingAddress")
    def reset_shipping_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetShippingAddress", []))

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
    @jsii.member(jsii_name="address")
    def address(self) -> "CustomerprofilesProfileAddressOutputReference":
        return typing.cast("CustomerprofilesProfileAddressOutputReference", jsii.get(self, "address"))

    @builtins.property
    @jsii.member(jsii_name="billingAddress")
    def billing_address(self) -> "CustomerprofilesProfileBillingAddressOutputReference":
        return typing.cast("CustomerprofilesProfileBillingAddressOutputReference", jsii.get(self, "billingAddress"))

    @builtins.property
    @jsii.member(jsii_name="mailingAddress")
    def mailing_address(self) -> "CustomerprofilesProfileMailingAddressOutputReference":
        return typing.cast("CustomerprofilesProfileMailingAddressOutputReference", jsii.get(self, "mailingAddress"))

    @builtins.property
    @jsii.member(jsii_name="shippingAddress")
    def shipping_address(
        self,
    ) -> "CustomerprofilesProfileShippingAddressOutputReference":
        return typing.cast("CustomerprofilesProfileShippingAddressOutputReference", jsii.get(self, "shippingAddress"))

    @builtins.property
    @jsii.member(jsii_name="accountNumberInput")
    def account_number_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "accountNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="additionalInformationInput")
    def additional_information_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "additionalInformationInput"))

    @builtins.property
    @jsii.member(jsii_name="addressInput")
    def address_input(self) -> typing.Optional["CustomerprofilesProfileAddress"]:
        return typing.cast(typing.Optional["CustomerprofilesProfileAddress"], jsii.get(self, "addressInput"))

    @builtins.property
    @jsii.member(jsii_name="attributesInput")
    def attributes_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "attributesInput"))

    @builtins.property
    @jsii.member(jsii_name="billingAddressInput")
    def billing_address_input(
        self,
    ) -> typing.Optional["CustomerprofilesProfileBillingAddress"]:
        return typing.cast(typing.Optional["CustomerprofilesProfileBillingAddress"], jsii.get(self, "billingAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="birthDateInput")
    def birth_date_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "birthDateInput"))

    @builtins.property
    @jsii.member(jsii_name="businessEmailAddressInput")
    def business_email_address_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "businessEmailAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="businessNameInput")
    def business_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "businessNameInput"))

    @builtins.property
    @jsii.member(jsii_name="businessPhoneNumberInput")
    def business_phone_number_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "businessPhoneNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="domainNameInput")
    def domain_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainNameInput"))

    @builtins.property
    @jsii.member(jsii_name="emailAddressInput")
    def email_address_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "emailAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="firstNameInput")
    def first_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "firstNameInput"))

    @builtins.property
    @jsii.member(jsii_name="genderStringInput")
    def gender_string_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "genderStringInput"))

    @builtins.property
    @jsii.member(jsii_name="homePhoneNumberInput")
    def home_phone_number_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "homePhoneNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="lastNameInput")
    def last_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lastNameInput"))

    @builtins.property
    @jsii.member(jsii_name="mailingAddressInput")
    def mailing_address_input(
        self,
    ) -> typing.Optional["CustomerprofilesProfileMailingAddress"]:
        return typing.cast(typing.Optional["CustomerprofilesProfileMailingAddress"], jsii.get(self, "mailingAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="middleNameInput")
    def middle_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "middleNameInput"))

    @builtins.property
    @jsii.member(jsii_name="mobilePhoneNumberInput")
    def mobile_phone_number_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "mobilePhoneNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="partyTypeStringInput")
    def party_type_string_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "partyTypeStringInput"))

    @builtins.property
    @jsii.member(jsii_name="personalEmailAddressInput")
    def personal_email_address_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "personalEmailAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="phoneNumberInput")
    def phone_number_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "phoneNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="shippingAddressInput")
    def shipping_address_input(
        self,
    ) -> typing.Optional["CustomerprofilesProfileShippingAddress"]:
        return typing.cast(typing.Optional["CustomerprofilesProfileShippingAddress"], jsii.get(self, "shippingAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="accountNumber")
    def account_number(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accountNumber"))

    @account_number.setter
    def account_number(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85f657e06faef6253e7c15f59128ef6cc3345848a2dd921517facd01f27df13f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accountNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="additionalInformation")
    def additional_information(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "additionalInformation"))

    @additional_information.setter
    def additional_information(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7434d46ee055367ca7d7d54421fd9cb13e2dde042e063c9fb65777b9141c7a51)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "additionalInformation", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="attributes")
    def attributes(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "attributes"))

    @attributes.setter
    def attributes(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2a46e95becf65a37cb51e211d843ef08242df88ba6ff651510718aaeb6d465d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "attributes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="birthDate")
    def birth_date(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "birthDate"))

    @birth_date.setter
    def birth_date(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ec4ff4e4e61c898b5a12935d3c8f0ca3aa1b3ef79a280e30b36cb6f13569916)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "birthDate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="businessEmailAddress")
    def business_email_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "businessEmailAddress"))

    @business_email_address.setter
    def business_email_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2766f2622bcd253e2ff841987f53e69ed2236be53ab13c4e2fc9de63c5b4b43d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "businessEmailAddress", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="businessName")
    def business_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "businessName"))

    @business_name.setter
    def business_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c675466cb91075f49350bdf1714a1fcae540dc59f8e98321d5525cc33cdb6fc8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "businessName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="businessPhoneNumber")
    def business_phone_number(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "businessPhoneNumber"))

    @business_phone_number.setter
    def business_phone_number(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8aa3677e6e56a68bfe1174eb174f71ffaab197d6fb059fa0b022bf42584b8a37)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "businessPhoneNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="domainName")
    def domain_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domainName"))

    @domain_name.setter
    def domain_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3adc864de56c2c827492ec66a65ff74e7b670033af6a370226f78cad6b49fc4d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domainName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="emailAddress")
    def email_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "emailAddress"))

    @email_address.setter
    def email_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d07a8a79b6ab04f5c51891b46218f62a9903c1c1ed71b4e1abc0117486c42719)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "emailAddress", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="firstName")
    def first_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "firstName"))

    @first_name.setter
    def first_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__680ade0d9720d46e4712d05f1895b55903b673026b76b7e3a36b57867f9edd3c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "firstName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="genderString")
    def gender_string(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "genderString"))

    @gender_string.setter
    def gender_string(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e43d25d9ba166a202f3006807de826e3ee170960977344ecd70f52b1064481a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "genderString", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="homePhoneNumber")
    def home_phone_number(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "homePhoneNumber"))

    @home_phone_number.setter
    def home_phone_number(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b4a2820c452b6bcacabe992c3e8faa92f5b2281eb2912603dd71ee53b0d9126)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "homePhoneNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d78a53e554f705a0890361a117b6747f49805a6f6d7bbef21e674f7e45773960)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lastName")
    def last_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastName"))

    @last_name.setter
    def last_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__313ea1d5ed01d2ca179c4cc329a2b784d379628113f706eb3609f1042a91d3d7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lastName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="middleName")
    def middle_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "middleName"))

    @middle_name.setter
    def middle_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ecdc9181ffa1736d59c95595be2937840c5fe23ac024e1b4fe7f30eb8e417f76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "middleName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="mobilePhoneNumber")
    def mobile_phone_number(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mobilePhoneNumber"))

    @mobile_phone_number.setter
    def mobile_phone_number(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f6cef2d1e0913fe36b946ce1c562462fb61e171070b8aecf31da1ce4476bb40)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mobilePhoneNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="partyTypeString")
    def party_type_string(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "partyTypeString"))

    @party_type_string.setter
    def party_type_string(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc8dd0c61d9d2bbb11ce480e17e7206e250b16c9f34d1f01dca829b805349eaa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "partyTypeString", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="personalEmailAddress")
    def personal_email_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "personalEmailAddress"))

    @personal_email_address.setter
    def personal_email_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6877811bb3ca096e9d328a8870ab3407b9e62d39fc4c7eb2a9d8cc97e36c5894)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "personalEmailAddress", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="phoneNumber")
    def phone_number(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "phoneNumber"))

    @phone_number.setter
    def phone_number(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf69fcecaf84885adf2097e764eb5e124c05c43a55a6bcecc8a933bab53f2d25)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "phoneNumber", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesProfile.CustomerprofilesProfileAddress",
    jsii_struct_bases=[],
    name_mapping={
        "address1": "address1",
        "address2": "address2",
        "address3": "address3",
        "address4": "address4",
        "city": "city",
        "country": "country",
        "county": "county",
        "postal_code": "postalCode",
        "province": "province",
        "state": "state",
    },
)
class CustomerprofilesProfileAddress:
    def __init__(
        self,
        *,
        address1: typing.Optional[builtins.str] = None,
        address2: typing.Optional[builtins.str] = None,
        address3: typing.Optional[builtins.str] = None,
        address4: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        country: typing.Optional[builtins.str] = None,
        county: typing.Optional[builtins.str] = None,
        postal_code: typing.Optional[builtins.str] = None,
        province: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.
        :param address2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.
        :param address3: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.
        :param address4: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.
        :param country: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.
        :param county: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.
        :param postal_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.
        :param province: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__108aec28213b540352c3b2dfe46bf67e749622be44e2eb74bbfc66ff2f7fdd79)
            check_type(argname="argument address1", value=address1, expected_type=type_hints["address1"])
            check_type(argname="argument address2", value=address2, expected_type=type_hints["address2"])
            check_type(argname="argument address3", value=address3, expected_type=type_hints["address3"])
            check_type(argname="argument address4", value=address4, expected_type=type_hints["address4"])
            check_type(argname="argument city", value=city, expected_type=type_hints["city"])
            check_type(argname="argument country", value=country, expected_type=type_hints["country"])
            check_type(argname="argument county", value=county, expected_type=type_hints["county"])
            check_type(argname="argument postal_code", value=postal_code, expected_type=type_hints["postal_code"])
            check_type(argname="argument province", value=province, expected_type=type_hints["province"])
            check_type(argname="argument state", value=state, expected_type=type_hints["state"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if address1 is not None:
            self._values["address1"] = address1
        if address2 is not None:
            self._values["address2"] = address2
        if address3 is not None:
            self._values["address3"] = address3
        if address4 is not None:
            self._values["address4"] = address4
        if city is not None:
            self._values["city"] = city
        if country is not None:
            self._values["country"] = country
        if county is not None:
            self._values["county"] = county
        if postal_code is not None:
            self._values["postal_code"] = postal_code
        if province is not None:
            self._values["province"] = province
        if state is not None:
            self._values["state"] = state

    @builtins.property
    def address1(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.'''
        result = self._values.get("address1")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address2(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.'''
        result = self._values.get("address2")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address3(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.'''
        result = self._values.get("address3")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address4(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.'''
        result = self._values.get("address4")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def city(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.'''
        result = self._values.get("city")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def country(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.'''
        result = self._values.get("country")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def county(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.'''
        result = self._values.get("county")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def postal_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.'''
        result = self._values.get("postal_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def province(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.'''
        result = self._values.get("province")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.'''
        result = self._values.get("state")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesProfileAddress(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesProfileAddressOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesProfile.CustomerprofilesProfileAddressOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6673ec4fbba80e4878b68510be58bb765acc905a6ed9926322a106f81c4d2e1a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAddress1")
    def reset_address1(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress1", []))

    @jsii.member(jsii_name="resetAddress2")
    def reset_address2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress2", []))

    @jsii.member(jsii_name="resetAddress3")
    def reset_address3(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress3", []))

    @jsii.member(jsii_name="resetAddress4")
    def reset_address4(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress4", []))

    @jsii.member(jsii_name="resetCity")
    def reset_city(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCity", []))

    @jsii.member(jsii_name="resetCountry")
    def reset_country(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCountry", []))

    @jsii.member(jsii_name="resetCounty")
    def reset_county(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCounty", []))

    @jsii.member(jsii_name="resetPostalCode")
    def reset_postal_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPostalCode", []))

    @jsii.member(jsii_name="resetProvince")
    def reset_province(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProvince", []))

    @jsii.member(jsii_name="resetState")
    def reset_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetState", []))

    @builtins.property
    @jsii.member(jsii_name="address1Input")
    def address1_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address1Input"))

    @builtins.property
    @jsii.member(jsii_name="address2Input")
    def address2_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address2Input"))

    @builtins.property
    @jsii.member(jsii_name="address3Input")
    def address3_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address3Input"))

    @builtins.property
    @jsii.member(jsii_name="address4Input")
    def address4_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address4Input"))

    @builtins.property
    @jsii.member(jsii_name="cityInput")
    def city_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cityInput"))

    @builtins.property
    @jsii.member(jsii_name="countryInput")
    def country_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryInput"))

    @builtins.property
    @jsii.member(jsii_name="countyInput")
    def county_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countyInput"))

    @builtins.property
    @jsii.member(jsii_name="postalCodeInput")
    def postal_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "postalCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="provinceInput")
    def province_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "provinceInput"))

    @builtins.property
    @jsii.member(jsii_name="stateInput")
    def state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stateInput"))

    @builtins.property
    @jsii.member(jsii_name="address1")
    def address1(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address1"))

    @address1.setter
    def address1(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e5cd101e8cd0f86780071f8262db22d92c7c8d2390928361aaeb0f1ea6950d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address1", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address2")
    def address2(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address2"))

    @address2.setter
    def address2(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__39ca0a5b74849c0f1af36ff0679d295298d3061a1d0fc0ae63368f2fa53ef542)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address3")
    def address3(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address3"))

    @address3.setter
    def address3(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8e938804bb47618b7eb2ea144d8084cc4d5a250a6d24ae818b78b4f29d4cba2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address3", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address4")
    def address4(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address4"))

    @address4.setter
    def address4(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7bc8f1080b0a544152267f0c365d973cd46398650fec14d568bf473596f6226d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address4", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="city")
    def city(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "city"))

    @city.setter
    def city(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5c92731dd4c4e2d60303d9b706f1e8084463d9f8f26b24a28b92ef48bd8d3bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "city", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="country")
    def country(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "country"))

    @country.setter
    def country(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f999997cc113e05edf09af463eed0f8054e8ef8ca625dce33a49edc4fe06b00)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "country", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="county")
    def county(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "county"))

    @county.setter
    def county(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1f7ccc26a300e8c982d98ed115c1ce601538ce1e1a0cc1be07894b395782914)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "county", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="postalCode")
    def postal_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "postalCode"))

    @postal_code.setter
    def postal_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6da1f91e1af4f3c93fec6d1ec920e284cf584a012227a95b21734a4a1aa2c43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "postalCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="province")
    def province(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "province"))

    @province.setter
    def province(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ea2d68bb4cc840e62fed0f30fb9601a4a59187b85b0b75e4f3b9cae67b53ddf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "province", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="state")
    def state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "state"))

    @state.setter
    def state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7848ac92c6e4933257d3a399180fdb4219e2c2cc579c2f62f690783db3ccffb0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "state", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CustomerprofilesProfileAddress]:
        return typing.cast(typing.Optional[CustomerprofilesProfileAddress], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesProfileAddress],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db21d5efa0efbeacdbc65c2bafd4c2d6cd102640a8289069ab7c9bf73dfd4ebf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesProfile.CustomerprofilesProfileBillingAddress",
    jsii_struct_bases=[],
    name_mapping={
        "address1": "address1",
        "address2": "address2",
        "address3": "address3",
        "address4": "address4",
        "city": "city",
        "country": "country",
        "county": "county",
        "postal_code": "postalCode",
        "province": "province",
        "state": "state",
    },
)
class CustomerprofilesProfileBillingAddress:
    def __init__(
        self,
        *,
        address1: typing.Optional[builtins.str] = None,
        address2: typing.Optional[builtins.str] = None,
        address3: typing.Optional[builtins.str] = None,
        address4: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        country: typing.Optional[builtins.str] = None,
        county: typing.Optional[builtins.str] = None,
        postal_code: typing.Optional[builtins.str] = None,
        province: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.
        :param address2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.
        :param address3: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.
        :param address4: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.
        :param country: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.
        :param county: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.
        :param postal_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.
        :param province: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4f2112a3c73e40cfe9706188194f0bc77fa1f250ccc5f3d3ddfdc41fe25b05d1)
            check_type(argname="argument address1", value=address1, expected_type=type_hints["address1"])
            check_type(argname="argument address2", value=address2, expected_type=type_hints["address2"])
            check_type(argname="argument address3", value=address3, expected_type=type_hints["address3"])
            check_type(argname="argument address4", value=address4, expected_type=type_hints["address4"])
            check_type(argname="argument city", value=city, expected_type=type_hints["city"])
            check_type(argname="argument country", value=country, expected_type=type_hints["country"])
            check_type(argname="argument county", value=county, expected_type=type_hints["county"])
            check_type(argname="argument postal_code", value=postal_code, expected_type=type_hints["postal_code"])
            check_type(argname="argument province", value=province, expected_type=type_hints["province"])
            check_type(argname="argument state", value=state, expected_type=type_hints["state"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if address1 is not None:
            self._values["address1"] = address1
        if address2 is not None:
            self._values["address2"] = address2
        if address3 is not None:
            self._values["address3"] = address3
        if address4 is not None:
            self._values["address4"] = address4
        if city is not None:
            self._values["city"] = city
        if country is not None:
            self._values["country"] = country
        if county is not None:
            self._values["county"] = county
        if postal_code is not None:
            self._values["postal_code"] = postal_code
        if province is not None:
            self._values["province"] = province
        if state is not None:
            self._values["state"] = state

    @builtins.property
    def address1(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.'''
        result = self._values.get("address1")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address2(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.'''
        result = self._values.get("address2")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address3(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.'''
        result = self._values.get("address3")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address4(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.'''
        result = self._values.get("address4")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def city(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.'''
        result = self._values.get("city")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def country(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.'''
        result = self._values.get("country")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def county(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.'''
        result = self._values.get("county")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def postal_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.'''
        result = self._values.get("postal_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def province(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.'''
        result = self._values.get("province")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.'''
        result = self._values.get("state")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesProfileBillingAddress(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesProfileBillingAddressOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesProfile.CustomerprofilesProfileBillingAddressOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__411842130b4ca19f23e46b34b5beb1c5b71c13eede1673f01be7ffd31666207d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAddress1")
    def reset_address1(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress1", []))

    @jsii.member(jsii_name="resetAddress2")
    def reset_address2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress2", []))

    @jsii.member(jsii_name="resetAddress3")
    def reset_address3(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress3", []))

    @jsii.member(jsii_name="resetAddress4")
    def reset_address4(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress4", []))

    @jsii.member(jsii_name="resetCity")
    def reset_city(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCity", []))

    @jsii.member(jsii_name="resetCountry")
    def reset_country(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCountry", []))

    @jsii.member(jsii_name="resetCounty")
    def reset_county(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCounty", []))

    @jsii.member(jsii_name="resetPostalCode")
    def reset_postal_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPostalCode", []))

    @jsii.member(jsii_name="resetProvince")
    def reset_province(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProvince", []))

    @jsii.member(jsii_name="resetState")
    def reset_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetState", []))

    @builtins.property
    @jsii.member(jsii_name="address1Input")
    def address1_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address1Input"))

    @builtins.property
    @jsii.member(jsii_name="address2Input")
    def address2_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address2Input"))

    @builtins.property
    @jsii.member(jsii_name="address3Input")
    def address3_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address3Input"))

    @builtins.property
    @jsii.member(jsii_name="address4Input")
    def address4_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address4Input"))

    @builtins.property
    @jsii.member(jsii_name="cityInput")
    def city_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cityInput"))

    @builtins.property
    @jsii.member(jsii_name="countryInput")
    def country_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryInput"))

    @builtins.property
    @jsii.member(jsii_name="countyInput")
    def county_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countyInput"))

    @builtins.property
    @jsii.member(jsii_name="postalCodeInput")
    def postal_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "postalCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="provinceInput")
    def province_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "provinceInput"))

    @builtins.property
    @jsii.member(jsii_name="stateInput")
    def state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stateInput"))

    @builtins.property
    @jsii.member(jsii_name="address1")
    def address1(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address1"))

    @address1.setter
    def address1(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84da49a3c108a426cdfbf83282be83a7b84543406bdf6b420519f63cb5ae3f39)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address1", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address2")
    def address2(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address2"))

    @address2.setter
    def address2(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__946c3dcd2ca140d9406164f037749a543e55e8793cc0781f21ced0141d41c7f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address3")
    def address3(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address3"))

    @address3.setter
    def address3(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6a317f0f235f97d4ec9594b06c20ef844c4fb14f0033c0e486250bbcb92d847c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address3", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address4")
    def address4(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address4"))

    @address4.setter
    def address4(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fce5e5015b538ddae29aee5a93d32be05b0e087f5360196be5fd925c6409176c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address4", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="city")
    def city(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "city"))

    @city.setter
    def city(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5bb1a0a50bbe03a8a693cea573990157196d529f270ec2a7e6c271086e56a43f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "city", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="country")
    def country(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "country"))

    @country.setter
    def country(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06c5a4d34734f0030e14a34b869a36e45c171f8d28ea1863d2fc513732266c80)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "country", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="county")
    def county(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "county"))

    @county.setter
    def county(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eac4e4456c23621d07be57077b0abb55788a4b16eb3a23e3394aa8f6cf0ac3e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "county", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="postalCode")
    def postal_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "postalCode"))

    @postal_code.setter
    def postal_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27f6361020020e0fcbfe4b6a3b90144dde42d1d15b8bca97570a6e2fbe9ad522)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "postalCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="province")
    def province(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "province"))

    @province.setter
    def province(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49f802f599b4259bd21b542a211e1543a5d52e3a63e2d1289cde5308ab35c10e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "province", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="state")
    def state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "state"))

    @state.setter
    def state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e9b1bd7606c5e0c95a55cee2185a69040974e1efbd8a97301dc2219e17968ef2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "state", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CustomerprofilesProfileBillingAddress]:
        return typing.cast(typing.Optional[CustomerprofilesProfileBillingAddress], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesProfileBillingAddress],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__28ee37e73d22410de06ab1d94b153bc84b9b51fb1fbaa52b016e23cb86ea7370)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesProfile.CustomerprofilesProfileConfig",
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
        "account_number": "accountNumber",
        "additional_information": "additionalInformation",
        "address": "address",
        "attributes": "attributes",
        "billing_address": "billingAddress",
        "birth_date": "birthDate",
        "business_email_address": "businessEmailAddress",
        "business_name": "businessName",
        "business_phone_number": "businessPhoneNumber",
        "email_address": "emailAddress",
        "first_name": "firstName",
        "gender_string": "genderString",
        "home_phone_number": "homePhoneNumber",
        "id": "id",
        "last_name": "lastName",
        "mailing_address": "mailingAddress",
        "middle_name": "middleName",
        "mobile_phone_number": "mobilePhoneNumber",
        "party_type_string": "partyTypeString",
        "personal_email_address": "personalEmailAddress",
        "phone_number": "phoneNumber",
        "shipping_address": "shippingAddress",
    },
)
class CustomerprofilesProfileConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        account_number: typing.Optional[builtins.str] = None,
        additional_information: typing.Optional[builtins.str] = None,
        address: typing.Optional[typing.Union[CustomerprofilesProfileAddress, typing.Dict[builtins.str, typing.Any]]] = None,
        attributes: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        billing_address: typing.Optional[typing.Union[CustomerprofilesProfileBillingAddress, typing.Dict[builtins.str, typing.Any]]] = None,
        birth_date: typing.Optional[builtins.str] = None,
        business_email_address: typing.Optional[builtins.str] = None,
        business_name: typing.Optional[builtins.str] = None,
        business_phone_number: typing.Optional[builtins.str] = None,
        email_address: typing.Optional[builtins.str] = None,
        first_name: typing.Optional[builtins.str] = None,
        gender_string: typing.Optional[builtins.str] = None,
        home_phone_number: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        last_name: typing.Optional[builtins.str] = None,
        mailing_address: typing.Optional[typing.Union["CustomerprofilesProfileMailingAddress", typing.Dict[builtins.str, typing.Any]]] = None,
        middle_name: typing.Optional[builtins.str] = None,
        mobile_phone_number: typing.Optional[builtins.str] = None,
        party_type_string: typing.Optional[builtins.str] = None,
        personal_email_address: typing.Optional[builtins.str] = None,
        phone_number: typing.Optional[builtins.str] = None,
        shipping_address: typing.Optional[typing.Union["CustomerprofilesProfileShippingAddress", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#domain_name CustomerprofilesProfile#domain_name}.
        :param account_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#account_number CustomerprofilesProfile#account_number}.
        :param additional_information: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#additional_information CustomerprofilesProfile#additional_information}.
        :param address: address block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address CustomerprofilesProfile#address}
        :param attributes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#attributes CustomerprofilesProfile#attributes}.
        :param billing_address: billing_address block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#billing_address CustomerprofilesProfile#billing_address}
        :param birth_date: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#birth_date CustomerprofilesProfile#birth_date}.
        :param business_email_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_email_address CustomerprofilesProfile#business_email_address}.
        :param business_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_name CustomerprofilesProfile#business_name}.
        :param business_phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_phone_number CustomerprofilesProfile#business_phone_number}.
        :param email_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#email_address CustomerprofilesProfile#email_address}.
        :param first_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#first_name CustomerprofilesProfile#first_name}.
        :param gender_string: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#gender_string CustomerprofilesProfile#gender_string}.
        :param home_phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#home_phone_number CustomerprofilesProfile#home_phone_number}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#id CustomerprofilesProfile#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param last_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#last_name CustomerprofilesProfile#last_name}.
        :param mailing_address: mailing_address block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mailing_address CustomerprofilesProfile#mailing_address}
        :param middle_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#middle_name CustomerprofilesProfile#middle_name}.
        :param mobile_phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mobile_phone_number CustomerprofilesProfile#mobile_phone_number}.
        :param party_type_string: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#party_type_string CustomerprofilesProfile#party_type_string}.
        :param personal_email_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#personal_email_address CustomerprofilesProfile#personal_email_address}.
        :param phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#phone_number CustomerprofilesProfile#phone_number}.
        :param shipping_address: shipping_address block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#shipping_address CustomerprofilesProfile#shipping_address}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(address, dict):
            address = CustomerprofilesProfileAddress(**address)
        if isinstance(billing_address, dict):
            billing_address = CustomerprofilesProfileBillingAddress(**billing_address)
        if isinstance(mailing_address, dict):
            mailing_address = CustomerprofilesProfileMailingAddress(**mailing_address)
        if isinstance(shipping_address, dict):
            shipping_address = CustomerprofilesProfileShippingAddress(**shipping_address)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3c367b69fbc1bf2d0bb467bce1f11c68abe8fd140f71e675a7f404a2c73e5d1)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument domain_name", value=domain_name, expected_type=type_hints["domain_name"])
            check_type(argname="argument account_number", value=account_number, expected_type=type_hints["account_number"])
            check_type(argname="argument additional_information", value=additional_information, expected_type=type_hints["additional_information"])
            check_type(argname="argument address", value=address, expected_type=type_hints["address"])
            check_type(argname="argument attributes", value=attributes, expected_type=type_hints["attributes"])
            check_type(argname="argument billing_address", value=billing_address, expected_type=type_hints["billing_address"])
            check_type(argname="argument birth_date", value=birth_date, expected_type=type_hints["birth_date"])
            check_type(argname="argument business_email_address", value=business_email_address, expected_type=type_hints["business_email_address"])
            check_type(argname="argument business_name", value=business_name, expected_type=type_hints["business_name"])
            check_type(argname="argument business_phone_number", value=business_phone_number, expected_type=type_hints["business_phone_number"])
            check_type(argname="argument email_address", value=email_address, expected_type=type_hints["email_address"])
            check_type(argname="argument first_name", value=first_name, expected_type=type_hints["first_name"])
            check_type(argname="argument gender_string", value=gender_string, expected_type=type_hints["gender_string"])
            check_type(argname="argument home_phone_number", value=home_phone_number, expected_type=type_hints["home_phone_number"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument last_name", value=last_name, expected_type=type_hints["last_name"])
            check_type(argname="argument mailing_address", value=mailing_address, expected_type=type_hints["mailing_address"])
            check_type(argname="argument middle_name", value=middle_name, expected_type=type_hints["middle_name"])
            check_type(argname="argument mobile_phone_number", value=mobile_phone_number, expected_type=type_hints["mobile_phone_number"])
            check_type(argname="argument party_type_string", value=party_type_string, expected_type=type_hints["party_type_string"])
            check_type(argname="argument personal_email_address", value=personal_email_address, expected_type=type_hints["personal_email_address"])
            check_type(argname="argument phone_number", value=phone_number, expected_type=type_hints["phone_number"])
            check_type(argname="argument shipping_address", value=shipping_address, expected_type=type_hints["shipping_address"])
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
        if account_number is not None:
            self._values["account_number"] = account_number
        if additional_information is not None:
            self._values["additional_information"] = additional_information
        if address is not None:
            self._values["address"] = address
        if attributes is not None:
            self._values["attributes"] = attributes
        if billing_address is not None:
            self._values["billing_address"] = billing_address
        if birth_date is not None:
            self._values["birth_date"] = birth_date
        if business_email_address is not None:
            self._values["business_email_address"] = business_email_address
        if business_name is not None:
            self._values["business_name"] = business_name
        if business_phone_number is not None:
            self._values["business_phone_number"] = business_phone_number
        if email_address is not None:
            self._values["email_address"] = email_address
        if first_name is not None:
            self._values["first_name"] = first_name
        if gender_string is not None:
            self._values["gender_string"] = gender_string
        if home_phone_number is not None:
            self._values["home_phone_number"] = home_phone_number
        if id is not None:
            self._values["id"] = id
        if last_name is not None:
            self._values["last_name"] = last_name
        if mailing_address is not None:
            self._values["mailing_address"] = mailing_address
        if middle_name is not None:
            self._values["middle_name"] = middle_name
        if mobile_phone_number is not None:
            self._values["mobile_phone_number"] = mobile_phone_number
        if party_type_string is not None:
            self._values["party_type_string"] = party_type_string
        if personal_email_address is not None:
            self._values["personal_email_address"] = personal_email_address
        if phone_number is not None:
            self._values["phone_number"] = phone_number
        if shipping_address is not None:
            self._values["shipping_address"] = shipping_address

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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#domain_name CustomerprofilesProfile#domain_name}.'''
        result = self._values.get("domain_name")
        assert result is not None, "Required property 'domain_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def account_number(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#account_number CustomerprofilesProfile#account_number}.'''
        result = self._values.get("account_number")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def additional_information(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#additional_information CustomerprofilesProfile#additional_information}.'''
        result = self._values.get("additional_information")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address(self) -> typing.Optional[CustomerprofilesProfileAddress]:
        '''address block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address CustomerprofilesProfile#address}
        '''
        result = self._values.get("address")
        return typing.cast(typing.Optional[CustomerprofilesProfileAddress], result)

    @builtins.property
    def attributes(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#attributes CustomerprofilesProfile#attributes}.'''
        result = self._values.get("attributes")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def billing_address(self) -> typing.Optional[CustomerprofilesProfileBillingAddress]:
        '''billing_address block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#billing_address CustomerprofilesProfile#billing_address}
        '''
        result = self._values.get("billing_address")
        return typing.cast(typing.Optional[CustomerprofilesProfileBillingAddress], result)

    @builtins.property
    def birth_date(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#birth_date CustomerprofilesProfile#birth_date}.'''
        result = self._values.get("birth_date")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def business_email_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_email_address CustomerprofilesProfile#business_email_address}.'''
        result = self._values.get("business_email_address")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def business_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_name CustomerprofilesProfile#business_name}.'''
        result = self._values.get("business_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def business_phone_number(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_phone_number CustomerprofilesProfile#business_phone_number}.'''
        result = self._values.get("business_phone_number")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def email_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#email_address CustomerprofilesProfile#email_address}.'''
        result = self._values.get("email_address")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def first_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#first_name CustomerprofilesProfile#first_name}.'''
        result = self._values.get("first_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def gender_string(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#gender_string CustomerprofilesProfile#gender_string}.'''
        result = self._values.get("gender_string")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def home_phone_number(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#home_phone_number CustomerprofilesProfile#home_phone_number}.'''
        result = self._values.get("home_phone_number")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#id CustomerprofilesProfile#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def last_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#last_name CustomerprofilesProfile#last_name}.'''
        result = self._values.get("last_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def mailing_address(
        self,
    ) -> typing.Optional["CustomerprofilesProfileMailingAddress"]:
        '''mailing_address block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mailing_address CustomerprofilesProfile#mailing_address}
        '''
        result = self._values.get("mailing_address")
        return typing.cast(typing.Optional["CustomerprofilesProfileMailingAddress"], result)

    @builtins.property
    def middle_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#middle_name CustomerprofilesProfile#middle_name}.'''
        result = self._values.get("middle_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def mobile_phone_number(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mobile_phone_number CustomerprofilesProfile#mobile_phone_number}.'''
        result = self._values.get("mobile_phone_number")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def party_type_string(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#party_type_string CustomerprofilesProfile#party_type_string}.'''
        result = self._values.get("party_type_string")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def personal_email_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#personal_email_address CustomerprofilesProfile#personal_email_address}.'''
        result = self._values.get("personal_email_address")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def phone_number(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#phone_number CustomerprofilesProfile#phone_number}.'''
        result = self._values.get("phone_number")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def shipping_address(
        self,
    ) -> typing.Optional["CustomerprofilesProfileShippingAddress"]:
        '''shipping_address block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#shipping_address CustomerprofilesProfile#shipping_address}
        '''
        result = self._values.get("shipping_address")
        return typing.cast(typing.Optional["CustomerprofilesProfileShippingAddress"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesProfileConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.customerprofilesProfile.CustomerprofilesProfileMailingAddress",
    jsii_struct_bases=[],
    name_mapping={
        "address1": "address1",
        "address2": "address2",
        "address3": "address3",
        "address4": "address4",
        "city": "city",
        "country": "country",
        "county": "county",
        "postal_code": "postalCode",
        "province": "province",
        "state": "state",
    },
)
class CustomerprofilesProfileMailingAddress:
    def __init__(
        self,
        *,
        address1: typing.Optional[builtins.str] = None,
        address2: typing.Optional[builtins.str] = None,
        address3: typing.Optional[builtins.str] = None,
        address4: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        country: typing.Optional[builtins.str] = None,
        county: typing.Optional[builtins.str] = None,
        postal_code: typing.Optional[builtins.str] = None,
        province: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.
        :param address2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.
        :param address3: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.
        :param address4: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.
        :param country: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.
        :param county: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.
        :param postal_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.
        :param province: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e01cff2d1e00794ea63e46b5e7860ea5485bece5829f6edd72addaf7cf3040c2)
            check_type(argname="argument address1", value=address1, expected_type=type_hints["address1"])
            check_type(argname="argument address2", value=address2, expected_type=type_hints["address2"])
            check_type(argname="argument address3", value=address3, expected_type=type_hints["address3"])
            check_type(argname="argument address4", value=address4, expected_type=type_hints["address4"])
            check_type(argname="argument city", value=city, expected_type=type_hints["city"])
            check_type(argname="argument country", value=country, expected_type=type_hints["country"])
            check_type(argname="argument county", value=county, expected_type=type_hints["county"])
            check_type(argname="argument postal_code", value=postal_code, expected_type=type_hints["postal_code"])
            check_type(argname="argument province", value=province, expected_type=type_hints["province"])
            check_type(argname="argument state", value=state, expected_type=type_hints["state"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if address1 is not None:
            self._values["address1"] = address1
        if address2 is not None:
            self._values["address2"] = address2
        if address3 is not None:
            self._values["address3"] = address3
        if address4 is not None:
            self._values["address4"] = address4
        if city is not None:
            self._values["city"] = city
        if country is not None:
            self._values["country"] = country
        if county is not None:
            self._values["county"] = county
        if postal_code is not None:
            self._values["postal_code"] = postal_code
        if province is not None:
            self._values["province"] = province
        if state is not None:
            self._values["state"] = state

    @builtins.property
    def address1(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.'''
        result = self._values.get("address1")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address2(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.'''
        result = self._values.get("address2")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address3(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.'''
        result = self._values.get("address3")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address4(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.'''
        result = self._values.get("address4")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def city(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.'''
        result = self._values.get("city")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def country(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.'''
        result = self._values.get("country")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def county(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.'''
        result = self._values.get("county")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def postal_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.'''
        result = self._values.get("postal_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def province(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.'''
        result = self._values.get("province")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.'''
        result = self._values.get("state")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesProfileMailingAddress(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesProfileMailingAddressOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesProfile.CustomerprofilesProfileMailingAddressOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__809e8c1a2d71ff58fc354e0c276ee56b154bffca8aeb8d4302de3ff9f43919b5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAddress1")
    def reset_address1(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress1", []))

    @jsii.member(jsii_name="resetAddress2")
    def reset_address2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress2", []))

    @jsii.member(jsii_name="resetAddress3")
    def reset_address3(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress3", []))

    @jsii.member(jsii_name="resetAddress4")
    def reset_address4(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress4", []))

    @jsii.member(jsii_name="resetCity")
    def reset_city(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCity", []))

    @jsii.member(jsii_name="resetCountry")
    def reset_country(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCountry", []))

    @jsii.member(jsii_name="resetCounty")
    def reset_county(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCounty", []))

    @jsii.member(jsii_name="resetPostalCode")
    def reset_postal_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPostalCode", []))

    @jsii.member(jsii_name="resetProvince")
    def reset_province(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProvince", []))

    @jsii.member(jsii_name="resetState")
    def reset_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetState", []))

    @builtins.property
    @jsii.member(jsii_name="address1Input")
    def address1_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address1Input"))

    @builtins.property
    @jsii.member(jsii_name="address2Input")
    def address2_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address2Input"))

    @builtins.property
    @jsii.member(jsii_name="address3Input")
    def address3_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address3Input"))

    @builtins.property
    @jsii.member(jsii_name="address4Input")
    def address4_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address4Input"))

    @builtins.property
    @jsii.member(jsii_name="cityInput")
    def city_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cityInput"))

    @builtins.property
    @jsii.member(jsii_name="countryInput")
    def country_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryInput"))

    @builtins.property
    @jsii.member(jsii_name="countyInput")
    def county_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countyInput"))

    @builtins.property
    @jsii.member(jsii_name="postalCodeInput")
    def postal_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "postalCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="provinceInput")
    def province_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "provinceInput"))

    @builtins.property
    @jsii.member(jsii_name="stateInput")
    def state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stateInput"))

    @builtins.property
    @jsii.member(jsii_name="address1")
    def address1(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address1"))

    @address1.setter
    def address1(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a98fad71cfcaf5d1a56f4fd05e82dfe2ffdc23702800a22b1a1a2975620257e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address1", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address2")
    def address2(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address2"))

    @address2.setter
    def address2(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2a75f4970fd7c9bb460f868a83ddeaf3b710b1f3f8120305c6ceeb88a76dc7f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address3")
    def address3(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address3"))

    @address3.setter
    def address3(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5fdeff4b11cc2f1c1ed99b6a167048fb54c9d09fad2dd642f1ad6bdc80c55ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address3", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address4")
    def address4(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address4"))

    @address4.setter
    def address4(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a85e09f877f5534b1adfb67b2702d567ae38da1941707b77f4637a131e8f7b62)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address4", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="city")
    def city(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "city"))

    @city.setter
    def city(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9cf487cb9a16c6778690b498b615e8d477ba54c15ee9f98830d775c6d112a774)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "city", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="country")
    def country(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "country"))

    @country.setter
    def country(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7af1032ef323b60f80a7808fad5be21bd7429697ef0762c69406ad90a8edeb6c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "country", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="county")
    def county(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "county"))

    @county.setter
    def county(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__590ac1bb1d1709077fbbf5a3358a9bb105161a0afa6eea4380d1f9ad28a0339c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "county", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="postalCode")
    def postal_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "postalCode"))

    @postal_code.setter
    def postal_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0832aedaa9310672c5a677f18947418cf2a90f8d8175ecd9adbedc5bd51342ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "postalCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="province")
    def province(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "province"))

    @province.setter
    def province(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a02b8a63b8fc538743a19a04295c786ab8dadb1afd32fbfad9496a8e54860c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "province", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="state")
    def state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "state"))

    @state.setter
    def state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__469e5b06f8a22f0b567b8d9939722c62b135277f4250797ca42d7a4c6ebb9f89)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "state", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CustomerprofilesProfileMailingAddress]:
        return typing.cast(typing.Optional[CustomerprofilesProfileMailingAddress], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesProfileMailingAddress],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c646f71689f76f0a59d1069dff561512001eac9f986885746c0da4f82f46dc2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.customerprofilesProfile.CustomerprofilesProfileShippingAddress",
    jsii_struct_bases=[],
    name_mapping={
        "address1": "address1",
        "address2": "address2",
        "address3": "address3",
        "address4": "address4",
        "city": "city",
        "country": "country",
        "county": "county",
        "postal_code": "postalCode",
        "province": "province",
        "state": "state",
    },
)
class CustomerprofilesProfileShippingAddress:
    def __init__(
        self,
        *,
        address1: typing.Optional[builtins.str] = None,
        address2: typing.Optional[builtins.str] = None,
        address3: typing.Optional[builtins.str] = None,
        address4: typing.Optional[builtins.str] = None,
        city: typing.Optional[builtins.str] = None,
        country: typing.Optional[builtins.str] = None,
        county: typing.Optional[builtins.str] = None,
        postal_code: typing.Optional[builtins.str] = None,
        province: typing.Optional[builtins.str] = None,
        state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.
        :param address2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.
        :param address3: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.
        :param address4: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.
        :param country: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.
        :param county: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.
        :param postal_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.
        :param province: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e0616d032eb7d90ceaa3029a86b32787aa1365b638f8932085972aba5c2814aa)
            check_type(argname="argument address1", value=address1, expected_type=type_hints["address1"])
            check_type(argname="argument address2", value=address2, expected_type=type_hints["address2"])
            check_type(argname="argument address3", value=address3, expected_type=type_hints["address3"])
            check_type(argname="argument address4", value=address4, expected_type=type_hints["address4"])
            check_type(argname="argument city", value=city, expected_type=type_hints["city"])
            check_type(argname="argument country", value=country, expected_type=type_hints["country"])
            check_type(argname="argument county", value=county, expected_type=type_hints["county"])
            check_type(argname="argument postal_code", value=postal_code, expected_type=type_hints["postal_code"])
            check_type(argname="argument province", value=province, expected_type=type_hints["province"])
            check_type(argname="argument state", value=state, expected_type=type_hints["state"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if address1 is not None:
            self._values["address1"] = address1
        if address2 is not None:
            self._values["address2"] = address2
        if address3 is not None:
            self._values["address3"] = address3
        if address4 is not None:
            self._values["address4"] = address4
        if city is not None:
            self._values["city"] = city
        if country is not None:
            self._values["country"] = country
        if county is not None:
            self._values["county"] = county
        if postal_code is not None:
            self._values["postal_code"] = postal_code
        if province is not None:
            self._values["province"] = province
        if state is not None:
            self._values["state"] = state

    @builtins.property
    def address1(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.'''
        result = self._values.get("address1")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address2(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.'''
        result = self._values.get("address2")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address3(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.'''
        result = self._values.get("address3")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address4(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.'''
        result = self._values.get("address4")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def city(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.'''
        result = self._values.get("city")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def country(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.'''
        result = self._values.get("country")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def county(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.'''
        result = self._values.get("county")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def postal_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.'''
        result = self._values.get("postal_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def province(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.'''
        result = self._values.get("province")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.'''
        result = self._values.get("state")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CustomerprofilesProfileShippingAddress(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CustomerprofilesProfileShippingAddressOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.customerprofilesProfile.CustomerprofilesProfileShippingAddressOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f5faf1a24a7b557d2c8ee53b076603f6cbf57f4e9693c69c3f4a5e5bb4da5b12)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAddress1")
    def reset_address1(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress1", []))

    @jsii.member(jsii_name="resetAddress2")
    def reset_address2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress2", []))

    @jsii.member(jsii_name="resetAddress3")
    def reset_address3(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress3", []))

    @jsii.member(jsii_name="resetAddress4")
    def reset_address4(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddress4", []))

    @jsii.member(jsii_name="resetCity")
    def reset_city(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCity", []))

    @jsii.member(jsii_name="resetCountry")
    def reset_country(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCountry", []))

    @jsii.member(jsii_name="resetCounty")
    def reset_county(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCounty", []))

    @jsii.member(jsii_name="resetPostalCode")
    def reset_postal_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPostalCode", []))

    @jsii.member(jsii_name="resetProvince")
    def reset_province(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProvince", []))

    @jsii.member(jsii_name="resetState")
    def reset_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetState", []))

    @builtins.property
    @jsii.member(jsii_name="address1Input")
    def address1_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address1Input"))

    @builtins.property
    @jsii.member(jsii_name="address2Input")
    def address2_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address2Input"))

    @builtins.property
    @jsii.member(jsii_name="address3Input")
    def address3_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address3Input"))

    @builtins.property
    @jsii.member(jsii_name="address4Input")
    def address4_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "address4Input"))

    @builtins.property
    @jsii.member(jsii_name="cityInput")
    def city_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cityInput"))

    @builtins.property
    @jsii.member(jsii_name="countryInput")
    def country_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryInput"))

    @builtins.property
    @jsii.member(jsii_name="countyInput")
    def county_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countyInput"))

    @builtins.property
    @jsii.member(jsii_name="postalCodeInput")
    def postal_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "postalCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="provinceInput")
    def province_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "provinceInput"))

    @builtins.property
    @jsii.member(jsii_name="stateInput")
    def state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stateInput"))

    @builtins.property
    @jsii.member(jsii_name="address1")
    def address1(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address1"))

    @address1.setter
    def address1(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85842882568f7967c43e18e7d343fe492fbb59a0a664bb77e8e45b76e8c1e067)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address1", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address2")
    def address2(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address2"))

    @address2.setter
    def address2(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__957ccdf6d4afb96b4e3628cf82582f046b0092f47f38f6344b406eeaeab14323)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address3")
    def address3(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address3"))

    @address3.setter
    def address3(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5a98233adcb09f379e2583a6d7023cc4b68310b35ef52391a563aecc7bf3cf5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address3", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="address4")
    def address4(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "address4"))

    @address4.setter
    def address4(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__31e4d6aa5736675ea2f0ed54ec317a62c42b52c6b0ad972175c01c5cd1283b9e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "address4", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="city")
    def city(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "city"))

    @city.setter
    def city(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b38462127608eae82e0ab2abc4f4b8db089f4eb0b6b7f32f8223b7cf40ae541)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "city", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="country")
    def country(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "country"))

    @country.setter
    def country(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3a89a6768e0ad5614e8ed5b22494c1f87b4e7b94f30380885e902f94d7ffd36)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "country", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="county")
    def county(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "county"))

    @county.setter
    def county(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e10c6788eeb35853d3db2b7f71ea23fd8cdf9881849f6d5e0b4f5708aebb597)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "county", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="postalCode")
    def postal_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "postalCode"))

    @postal_code.setter
    def postal_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c82d851125421d6aab485276c2d0e7e3dc956479ce4e7a11856a55e73bca9ec4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "postalCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="province")
    def province(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "province"))

    @province.setter
    def province(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a966064b8c179753bd7b049dbc8df722958affe294718aefd24ecb6622619ba7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "province", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="state")
    def state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "state"))

    @state.setter
    def state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__634a323c12ab225689a4eb1356516b074a50a8b8acc91a31785894b20ba5509c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "state", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CustomerprofilesProfileShippingAddress]:
        return typing.cast(typing.Optional[CustomerprofilesProfileShippingAddress], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CustomerprofilesProfileShippingAddress],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a116034f1c80da21ceaf6b26057179d14d264d3d513caf835f7d886d7b3153ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "CustomerprofilesProfile",
    "CustomerprofilesProfileAddress",
    "CustomerprofilesProfileAddressOutputReference",
    "CustomerprofilesProfileBillingAddress",
    "CustomerprofilesProfileBillingAddressOutputReference",
    "CustomerprofilesProfileConfig",
    "CustomerprofilesProfileMailingAddress",
    "CustomerprofilesProfileMailingAddressOutputReference",
    "CustomerprofilesProfileShippingAddress",
    "CustomerprofilesProfileShippingAddressOutputReference",
]

publication.publish()

def _typecheckingstub__eea87255d1a85ea574b11cf7741c4590f280b395d16395992533470cd97ca221(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    domain_name: builtins.str,
    account_number: typing.Optional[builtins.str] = None,
    additional_information: typing.Optional[builtins.str] = None,
    address: typing.Optional[typing.Union[CustomerprofilesProfileAddress, typing.Dict[builtins.str, typing.Any]]] = None,
    attributes: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    billing_address: typing.Optional[typing.Union[CustomerprofilesProfileBillingAddress, typing.Dict[builtins.str, typing.Any]]] = None,
    birth_date: typing.Optional[builtins.str] = None,
    business_email_address: typing.Optional[builtins.str] = None,
    business_name: typing.Optional[builtins.str] = None,
    business_phone_number: typing.Optional[builtins.str] = None,
    email_address: typing.Optional[builtins.str] = None,
    first_name: typing.Optional[builtins.str] = None,
    gender_string: typing.Optional[builtins.str] = None,
    home_phone_number: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    last_name: typing.Optional[builtins.str] = None,
    mailing_address: typing.Optional[typing.Union[CustomerprofilesProfileMailingAddress, typing.Dict[builtins.str, typing.Any]]] = None,
    middle_name: typing.Optional[builtins.str] = None,
    mobile_phone_number: typing.Optional[builtins.str] = None,
    party_type_string: typing.Optional[builtins.str] = None,
    personal_email_address: typing.Optional[builtins.str] = None,
    phone_number: typing.Optional[builtins.str] = None,
    shipping_address: typing.Optional[typing.Union[CustomerprofilesProfileShippingAddress, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__a5abf2426b57d406638794a592e05d3112b3f2f697edab0f91511e4f788530c0(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85f657e06faef6253e7c15f59128ef6cc3345848a2dd921517facd01f27df13f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7434d46ee055367ca7d7d54421fd9cb13e2dde042e063c9fb65777b9141c7a51(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2a46e95becf65a37cb51e211d843ef08242df88ba6ff651510718aaeb6d465d(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ec4ff4e4e61c898b5a12935d3c8f0ca3aa1b3ef79a280e30b36cb6f13569916(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2766f2622bcd253e2ff841987f53e69ed2236be53ab13c4e2fc9de63c5b4b43d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c675466cb91075f49350bdf1714a1fcae540dc59f8e98321d5525cc33cdb6fc8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8aa3677e6e56a68bfe1174eb174f71ffaab197d6fb059fa0b022bf42584b8a37(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3adc864de56c2c827492ec66a65ff74e7b670033af6a370226f78cad6b49fc4d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d07a8a79b6ab04f5c51891b46218f62a9903c1c1ed71b4e1abc0117486c42719(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__680ade0d9720d46e4712d05f1895b55903b673026b76b7e3a36b57867f9edd3c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e43d25d9ba166a202f3006807de826e3ee170960977344ecd70f52b1064481a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b4a2820c452b6bcacabe992c3e8faa92f5b2281eb2912603dd71ee53b0d9126(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d78a53e554f705a0890361a117b6747f49805a6f6d7bbef21e674f7e45773960(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__313ea1d5ed01d2ca179c4cc329a2b784d379628113f706eb3609f1042a91d3d7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ecdc9181ffa1736d59c95595be2937840c5fe23ac024e1b4fe7f30eb8e417f76(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f6cef2d1e0913fe36b946ce1c562462fb61e171070b8aecf31da1ce4476bb40(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc8dd0c61d9d2bbb11ce480e17e7206e250b16c9f34d1f01dca829b805349eaa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6877811bb3ca096e9d328a8870ab3407b9e62d39fc4c7eb2a9d8cc97e36c5894(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf69fcecaf84885adf2097e764eb5e124c05c43a55a6bcecc8a933bab53f2d25(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__108aec28213b540352c3b2dfe46bf67e749622be44e2eb74bbfc66ff2f7fdd79(
    *,
    address1: typing.Optional[builtins.str] = None,
    address2: typing.Optional[builtins.str] = None,
    address3: typing.Optional[builtins.str] = None,
    address4: typing.Optional[builtins.str] = None,
    city: typing.Optional[builtins.str] = None,
    country: typing.Optional[builtins.str] = None,
    county: typing.Optional[builtins.str] = None,
    postal_code: typing.Optional[builtins.str] = None,
    province: typing.Optional[builtins.str] = None,
    state: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6673ec4fbba80e4878b68510be58bb765acc905a6ed9926322a106f81c4d2e1a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e5cd101e8cd0f86780071f8262db22d92c7c8d2390928361aaeb0f1ea6950d6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__39ca0a5b74849c0f1af36ff0679d295298d3061a1d0fc0ae63368f2fa53ef542(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8e938804bb47618b7eb2ea144d8084cc4d5a250a6d24ae818b78b4f29d4cba2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7bc8f1080b0a544152267f0c365d973cd46398650fec14d568bf473596f6226d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5c92731dd4c4e2d60303d9b706f1e8084463d9f8f26b24a28b92ef48bd8d3bf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f999997cc113e05edf09af463eed0f8054e8ef8ca625dce33a49edc4fe06b00(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1f7ccc26a300e8c982d98ed115c1ce601538ce1e1a0cc1be07894b395782914(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6da1f91e1af4f3c93fec6d1ec920e284cf584a012227a95b21734a4a1aa2c43(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ea2d68bb4cc840e62fed0f30fb9601a4a59187b85b0b75e4f3b9cae67b53ddf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7848ac92c6e4933257d3a399180fdb4219e2c2cc579c2f62f690783db3ccffb0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db21d5efa0efbeacdbc65c2bafd4c2d6cd102640a8289069ab7c9bf73dfd4ebf(
    value: typing.Optional[CustomerprofilesProfileAddress],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f2112a3c73e40cfe9706188194f0bc77fa1f250ccc5f3d3ddfdc41fe25b05d1(
    *,
    address1: typing.Optional[builtins.str] = None,
    address2: typing.Optional[builtins.str] = None,
    address3: typing.Optional[builtins.str] = None,
    address4: typing.Optional[builtins.str] = None,
    city: typing.Optional[builtins.str] = None,
    country: typing.Optional[builtins.str] = None,
    county: typing.Optional[builtins.str] = None,
    postal_code: typing.Optional[builtins.str] = None,
    province: typing.Optional[builtins.str] = None,
    state: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__411842130b4ca19f23e46b34b5beb1c5b71c13eede1673f01be7ffd31666207d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84da49a3c108a426cdfbf83282be83a7b84543406bdf6b420519f63cb5ae3f39(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__946c3dcd2ca140d9406164f037749a543e55e8793cc0781f21ced0141d41c7f0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a317f0f235f97d4ec9594b06c20ef844c4fb14f0033c0e486250bbcb92d847c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fce5e5015b538ddae29aee5a93d32be05b0e087f5360196be5fd925c6409176c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5bb1a0a50bbe03a8a693cea573990157196d529f270ec2a7e6c271086e56a43f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06c5a4d34734f0030e14a34b869a36e45c171f8d28ea1863d2fc513732266c80(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eac4e4456c23621d07be57077b0abb55788a4b16eb3a23e3394aa8f6cf0ac3e8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27f6361020020e0fcbfe4b6a3b90144dde42d1d15b8bca97570a6e2fbe9ad522(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49f802f599b4259bd21b542a211e1543a5d52e3a63e2d1289cde5308ab35c10e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9b1bd7606c5e0c95a55cee2185a69040974e1efbd8a97301dc2219e17968ef2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28ee37e73d22410de06ab1d94b153bc84b9b51fb1fbaa52b016e23cb86ea7370(
    value: typing.Optional[CustomerprofilesProfileBillingAddress],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3c367b69fbc1bf2d0bb467bce1f11c68abe8fd140f71e675a7f404a2c73e5d1(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    domain_name: builtins.str,
    account_number: typing.Optional[builtins.str] = None,
    additional_information: typing.Optional[builtins.str] = None,
    address: typing.Optional[typing.Union[CustomerprofilesProfileAddress, typing.Dict[builtins.str, typing.Any]]] = None,
    attributes: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    billing_address: typing.Optional[typing.Union[CustomerprofilesProfileBillingAddress, typing.Dict[builtins.str, typing.Any]]] = None,
    birth_date: typing.Optional[builtins.str] = None,
    business_email_address: typing.Optional[builtins.str] = None,
    business_name: typing.Optional[builtins.str] = None,
    business_phone_number: typing.Optional[builtins.str] = None,
    email_address: typing.Optional[builtins.str] = None,
    first_name: typing.Optional[builtins.str] = None,
    gender_string: typing.Optional[builtins.str] = None,
    home_phone_number: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    last_name: typing.Optional[builtins.str] = None,
    mailing_address: typing.Optional[typing.Union[CustomerprofilesProfileMailingAddress, typing.Dict[builtins.str, typing.Any]]] = None,
    middle_name: typing.Optional[builtins.str] = None,
    mobile_phone_number: typing.Optional[builtins.str] = None,
    party_type_string: typing.Optional[builtins.str] = None,
    personal_email_address: typing.Optional[builtins.str] = None,
    phone_number: typing.Optional[builtins.str] = None,
    shipping_address: typing.Optional[typing.Union[CustomerprofilesProfileShippingAddress, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e01cff2d1e00794ea63e46b5e7860ea5485bece5829f6edd72addaf7cf3040c2(
    *,
    address1: typing.Optional[builtins.str] = None,
    address2: typing.Optional[builtins.str] = None,
    address3: typing.Optional[builtins.str] = None,
    address4: typing.Optional[builtins.str] = None,
    city: typing.Optional[builtins.str] = None,
    country: typing.Optional[builtins.str] = None,
    county: typing.Optional[builtins.str] = None,
    postal_code: typing.Optional[builtins.str] = None,
    province: typing.Optional[builtins.str] = None,
    state: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__809e8c1a2d71ff58fc354e0c276ee56b154bffca8aeb8d4302de3ff9f43919b5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a98fad71cfcaf5d1a56f4fd05e82dfe2ffdc23702800a22b1a1a2975620257e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2a75f4970fd7c9bb460f868a83ddeaf3b710b1f3f8120305c6ceeb88a76dc7f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5fdeff4b11cc2f1c1ed99b6a167048fb54c9d09fad2dd642f1ad6bdc80c55ce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a85e09f877f5534b1adfb67b2702d567ae38da1941707b77f4637a131e8f7b62(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9cf487cb9a16c6778690b498b615e8d477ba54c15ee9f98830d775c6d112a774(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7af1032ef323b60f80a7808fad5be21bd7429697ef0762c69406ad90a8edeb6c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__590ac1bb1d1709077fbbf5a3358a9bb105161a0afa6eea4380d1f9ad28a0339c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0832aedaa9310672c5a677f18947418cf2a90f8d8175ecd9adbedc5bd51342ad(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a02b8a63b8fc538743a19a04295c786ab8dadb1afd32fbfad9496a8e54860c5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__469e5b06f8a22f0b567b8d9939722c62b135277f4250797ca42d7a4c6ebb9f89(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c646f71689f76f0a59d1069dff561512001eac9f986885746c0da4f82f46dc2(
    value: typing.Optional[CustomerprofilesProfileMailingAddress],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0616d032eb7d90ceaa3029a86b32787aa1365b638f8932085972aba5c2814aa(
    *,
    address1: typing.Optional[builtins.str] = None,
    address2: typing.Optional[builtins.str] = None,
    address3: typing.Optional[builtins.str] = None,
    address4: typing.Optional[builtins.str] = None,
    city: typing.Optional[builtins.str] = None,
    country: typing.Optional[builtins.str] = None,
    county: typing.Optional[builtins.str] = None,
    postal_code: typing.Optional[builtins.str] = None,
    province: typing.Optional[builtins.str] = None,
    state: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5faf1a24a7b557d2c8ee53b076603f6cbf57f4e9693c69c3f4a5e5bb4da5b12(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85842882568f7967c43e18e7d343fe492fbb59a0a664bb77e8e45b76e8c1e067(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__957ccdf6d4afb96b4e3628cf82582f046b0092f47f38f6344b406eeaeab14323(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5a98233adcb09f379e2583a6d7023cc4b68310b35ef52391a563aecc7bf3cf5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31e4d6aa5736675ea2f0ed54ec317a62c42b52c6b0ad972175c01c5cd1283b9e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b38462127608eae82e0ab2abc4f4b8db089f4eb0b6b7f32f8223b7cf40ae541(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3a89a6768e0ad5614e8ed5b22494c1f87b4e7b94f30380885e902f94d7ffd36(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e10c6788eeb35853d3db2b7f71ea23fd8cdf9881849f6d5e0b4f5708aebb597(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c82d851125421d6aab485276c2d0e7e3dc956479ce4e7a11856a55e73bca9ec4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a966064b8c179753bd7b049dbc8df722958affe294718aefd24ecb6622619ba7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__634a323c12ab225689a4eb1356516b074a50a8b8acc91a31785894b20ba5509c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a116034f1c80da21ceaf6b26057179d14d264d3d513caf835f7d886d7b3153ac(
    value: typing.Optional[CustomerprofilesProfileShippingAddress],
) -> None:
    """Type checking stubs"""
    pass
