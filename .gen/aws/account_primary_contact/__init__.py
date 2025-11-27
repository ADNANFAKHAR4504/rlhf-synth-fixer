r'''
# `aws_account_primary_contact`

Refer to the Terraform Registry for docs: [`aws_account_primary_contact`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact).
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


class AccountPrimaryContact(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.accountPrimaryContact.AccountPrimaryContact",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact aws_account_primary_contact}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        address_line1: builtins.str,
        city: builtins.str,
        country_code: builtins.str,
        full_name: builtins.str,
        phone_number: builtins.str,
        postal_code: builtins.str,
        account_id: typing.Optional[builtins.str] = None,
        address_line2: typing.Optional[builtins.str] = None,
        address_line3: typing.Optional[builtins.str] = None,
        company_name: typing.Optional[builtins.str] = None,
        district_or_county: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        state_or_region: typing.Optional[builtins.str] = None,
        website_url: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact aws_account_primary_contact} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param address_line1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_1 AccountPrimaryContact#address_line_1}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#city AccountPrimaryContact#city}.
        :param country_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#country_code AccountPrimaryContact#country_code}.
        :param full_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#full_name AccountPrimaryContact#full_name}.
        :param phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#phone_number AccountPrimaryContact#phone_number}.
        :param postal_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#postal_code AccountPrimaryContact#postal_code}.
        :param account_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#account_id AccountPrimaryContact#account_id}.
        :param address_line2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_2 AccountPrimaryContact#address_line_2}.
        :param address_line3: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_3 AccountPrimaryContact#address_line_3}.
        :param company_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#company_name AccountPrimaryContact#company_name}.
        :param district_or_county: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#district_or_county AccountPrimaryContact#district_or_county}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#id AccountPrimaryContact#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param state_or_region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#state_or_region AccountPrimaryContact#state_or_region}.
        :param website_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#website_url AccountPrimaryContact#website_url}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14a98a5f59adde2c8876e3473670f6243361ebffd911a4d04d453be80aeb0269)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = AccountPrimaryContactConfig(
            address_line1=address_line1,
            city=city,
            country_code=country_code,
            full_name=full_name,
            phone_number=phone_number,
            postal_code=postal_code,
            account_id=account_id,
            address_line2=address_line2,
            address_line3=address_line3,
            company_name=company_name,
            district_or_county=district_or_county,
            id=id,
            state_or_region=state_or_region,
            website_url=website_url,
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
        '''Generates CDKTF code for importing a AccountPrimaryContact resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the AccountPrimaryContact to import.
        :param import_from_id: The id of the existing AccountPrimaryContact that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the AccountPrimaryContact to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d800233717b2bea5e743387ac69acf5b6f2a4ac41868af9d43574d3d34549b1)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="resetAccountId")
    def reset_account_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccountId", []))

    @jsii.member(jsii_name="resetAddressLine2")
    def reset_address_line2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressLine2", []))

    @jsii.member(jsii_name="resetAddressLine3")
    def reset_address_line3(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressLine3", []))

    @jsii.member(jsii_name="resetCompanyName")
    def reset_company_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCompanyName", []))

    @jsii.member(jsii_name="resetDistrictOrCounty")
    def reset_district_or_county(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDistrictOrCounty", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetStateOrRegion")
    def reset_state_or_region(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStateOrRegion", []))

    @jsii.member(jsii_name="resetWebsiteUrl")
    def reset_website_url(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWebsiteUrl", []))

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
    @jsii.member(jsii_name="accountIdInput")
    def account_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "accountIdInput"))

    @builtins.property
    @jsii.member(jsii_name="addressLine1Input")
    def address_line1_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine1Input"))

    @builtins.property
    @jsii.member(jsii_name="addressLine2Input")
    def address_line2_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine2Input"))

    @builtins.property
    @jsii.member(jsii_name="addressLine3Input")
    def address_line3_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "addressLine3Input"))

    @builtins.property
    @jsii.member(jsii_name="cityInput")
    def city_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cityInput"))

    @builtins.property
    @jsii.member(jsii_name="companyNameInput")
    def company_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "companyNameInput"))

    @builtins.property
    @jsii.member(jsii_name="countryCodeInput")
    def country_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="districtOrCountyInput")
    def district_or_county_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "districtOrCountyInput"))

    @builtins.property
    @jsii.member(jsii_name="fullNameInput")
    def full_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "fullNameInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="phoneNumberInput")
    def phone_number_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "phoneNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="postalCodeInput")
    def postal_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "postalCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="stateOrRegionInput")
    def state_or_region_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stateOrRegionInput"))

    @builtins.property
    @jsii.member(jsii_name="websiteUrlInput")
    def website_url_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "websiteUrlInput"))

    @builtins.property
    @jsii.member(jsii_name="accountId")
    def account_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accountId"))

    @account_id.setter
    def account_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0069c1af7c89eb46b3358eb66a3171d9877cf17ed4583a825bcccd7bb5777755)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accountId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="addressLine1")
    def address_line1(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine1"))

    @address_line1.setter
    def address_line1(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed1d3c8657089b4c7880df07f29d8918657e7bfb9d7ffdfa0c3f678ab024748c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine1", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="addressLine2")
    def address_line2(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine2"))

    @address_line2.setter
    def address_line2(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84bf877c5cfaae526fc07495392bbaf6f9b413b8dc8299f4f0665d9c1eb54094)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="addressLine3")
    def address_line3(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "addressLine3"))

    @address_line3.setter
    def address_line3(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7ae813d62d209f44199d7d850cb06eeb33650856e79b6acc8bb176c9c512170)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressLine3", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="city")
    def city(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "city"))

    @city.setter
    def city(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__269a54b0d88a150b840286983000e275b1b393df95237b4f2ce6b71b698c65db)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "city", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="companyName")
    def company_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "companyName"))

    @company_name.setter
    def company_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b69bc34042ebd93d6df212a13f64458c18efc54bdb2c67ad4f6e32454494b27)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "companyName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="countryCode")
    def country_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "countryCode"))

    @country_code.setter
    def country_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b3fb68edf5b18991a5316d2612e0673f1099fc1f3c025ea3922bebafb53dfdb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "countryCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="districtOrCounty")
    def district_or_county(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "districtOrCounty"))

    @district_or_county.setter
    def district_or_county(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f9822903e51e7bcc914c7c22b293513eb099c8001b5129996c7ecadbab3d285)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "districtOrCounty", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fullName")
    def full_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fullName"))

    @full_name.setter
    def full_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__63784f57b414eeee72f1bb109e7a910c04f3cec9b54d4efdcb3a44594c127a18)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fullName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61e640b96ba9fe834731f9302c76ebbe1287417f44da46ba64bf1ebaaf90238c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="phoneNumber")
    def phone_number(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "phoneNumber"))

    @phone_number.setter
    def phone_number(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e3886b30d7edee36a16812c86b114b6d6fab2d77cae7727c9c4ea6ad86156ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "phoneNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="postalCode")
    def postal_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "postalCode"))

    @postal_code.setter
    def postal_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c499aef70293b343c1d7b6636875f916158299b02a9f93ca1e193116850a6df)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "postalCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="stateOrRegion")
    def state_or_region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "stateOrRegion"))

    @state_or_region.setter
    def state_or_region(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__97cd0d44379fdabac5d5c365bfa928ae2de4e678f87c8e95a857b9892062c126)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "stateOrRegion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="websiteUrl")
    def website_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "websiteUrl"))

    @website_url.setter
    def website_url(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42e9afaf33ea5eb7584325eb70ba781adf6e8baa5062ebcc56f2e944966a7ac4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "websiteUrl", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.accountPrimaryContact.AccountPrimaryContactConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "address_line1": "addressLine1",
        "city": "city",
        "country_code": "countryCode",
        "full_name": "fullName",
        "phone_number": "phoneNumber",
        "postal_code": "postalCode",
        "account_id": "accountId",
        "address_line2": "addressLine2",
        "address_line3": "addressLine3",
        "company_name": "companyName",
        "district_or_county": "districtOrCounty",
        "id": "id",
        "state_or_region": "stateOrRegion",
        "website_url": "websiteUrl",
    },
)
class AccountPrimaryContactConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        address_line1: builtins.str,
        city: builtins.str,
        country_code: builtins.str,
        full_name: builtins.str,
        phone_number: builtins.str,
        postal_code: builtins.str,
        account_id: typing.Optional[builtins.str] = None,
        address_line2: typing.Optional[builtins.str] = None,
        address_line3: typing.Optional[builtins.str] = None,
        company_name: typing.Optional[builtins.str] = None,
        district_or_county: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        state_or_region: typing.Optional[builtins.str] = None,
        website_url: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param address_line1: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_1 AccountPrimaryContact#address_line_1}.
        :param city: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#city AccountPrimaryContact#city}.
        :param country_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#country_code AccountPrimaryContact#country_code}.
        :param full_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#full_name AccountPrimaryContact#full_name}.
        :param phone_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#phone_number AccountPrimaryContact#phone_number}.
        :param postal_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#postal_code AccountPrimaryContact#postal_code}.
        :param account_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#account_id AccountPrimaryContact#account_id}.
        :param address_line2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_2 AccountPrimaryContact#address_line_2}.
        :param address_line3: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_3 AccountPrimaryContact#address_line_3}.
        :param company_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#company_name AccountPrimaryContact#company_name}.
        :param district_or_county: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#district_or_county AccountPrimaryContact#district_or_county}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#id AccountPrimaryContact#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param state_or_region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#state_or_region AccountPrimaryContact#state_or_region}.
        :param website_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#website_url AccountPrimaryContact#website_url}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__448d6fb3435ff86bc42d9668b749b3620e4f9012b829960f1e793f38defe0596)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument address_line1", value=address_line1, expected_type=type_hints["address_line1"])
            check_type(argname="argument city", value=city, expected_type=type_hints["city"])
            check_type(argname="argument country_code", value=country_code, expected_type=type_hints["country_code"])
            check_type(argname="argument full_name", value=full_name, expected_type=type_hints["full_name"])
            check_type(argname="argument phone_number", value=phone_number, expected_type=type_hints["phone_number"])
            check_type(argname="argument postal_code", value=postal_code, expected_type=type_hints["postal_code"])
            check_type(argname="argument account_id", value=account_id, expected_type=type_hints["account_id"])
            check_type(argname="argument address_line2", value=address_line2, expected_type=type_hints["address_line2"])
            check_type(argname="argument address_line3", value=address_line3, expected_type=type_hints["address_line3"])
            check_type(argname="argument company_name", value=company_name, expected_type=type_hints["company_name"])
            check_type(argname="argument district_or_county", value=district_or_county, expected_type=type_hints["district_or_county"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument state_or_region", value=state_or_region, expected_type=type_hints["state_or_region"])
            check_type(argname="argument website_url", value=website_url, expected_type=type_hints["website_url"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "address_line1": address_line1,
            "city": city,
            "country_code": country_code,
            "full_name": full_name,
            "phone_number": phone_number,
            "postal_code": postal_code,
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
        if account_id is not None:
            self._values["account_id"] = account_id
        if address_line2 is not None:
            self._values["address_line2"] = address_line2
        if address_line3 is not None:
            self._values["address_line3"] = address_line3
        if company_name is not None:
            self._values["company_name"] = company_name
        if district_or_county is not None:
            self._values["district_or_county"] = district_or_county
        if id is not None:
            self._values["id"] = id
        if state_or_region is not None:
            self._values["state_or_region"] = state_or_region
        if website_url is not None:
            self._values["website_url"] = website_url

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
    def address_line1(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_1 AccountPrimaryContact#address_line_1}.'''
        result = self._values.get("address_line1")
        assert result is not None, "Required property 'address_line1' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def city(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#city AccountPrimaryContact#city}.'''
        result = self._values.get("city")
        assert result is not None, "Required property 'city' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def country_code(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#country_code AccountPrimaryContact#country_code}.'''
        result = self._values.get("country_code")
        assert result is not None, "Required property 'country_code' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def full_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#full_name AccountPrimaryContact#full_name}.'''
        result = self._values.get("full_name")
        assert result is not None, "Required property 'full_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def phone_number(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#phone_number AccountPrimaryContact#phone_number}.'''
        result = self._values.get("phone_number")
        assert result is not None, "Required property 'phone_number' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def postal_code(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#postal_code AccountPrimaryContact#postal_code}.'''
        result = self._values.get("postal_code")
        assert result is not None, "Required property 'postal_code' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def account_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#account_id AccountPrimaryContact#account_id}.'''
        result = self._values.get("account_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address_line2(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_2 AccountPrimaryContact#address_line_2}.'''
        result = self._values.get("address_line2")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def address_line3(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_3 AccountPrimaryContact#address_line_3}.'''
        result = self._values.get("address_line3")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def company_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#company_name AccountPrimaryContact#company_name}.'''
        result = self._values.get("company_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def district_or_county(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#district_or_county AccountPrimaryContact#district_or_county}.'''
        result = self._values.get("district_or_county")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#id AccountPrimaryContact#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def state_or_region(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#state_or_region AccountPrimaryContact#state_or_region}.'''
        result = self._values.get("state_or_region")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def website_url(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#website_url AccountPrimaryContact#website_url}.'''
        result = self._values.get("website_url")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AccountPrimaryContactConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


__all__ = [
    "AccountPrimaryContact",
    "AccountPrimaryContactConfig",
]

publication.publish()

def _typecheckingstub__14a98a5f59adde2c8876e3473670f6243361ebffd911a4d04d453be80aeb0269(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    address_line1: builtins.str,
    city: builtins.str,
    country_code: builtins.str,
    full_name: builtins.str,
    phone_number: builtins.str,
    postal_code: builtins.str,
    account_id: typing.Optional[builtins.str] = None,
    address_line2: typing.Optional[builtins.str] = None,
    address_line3: typing.Optional[builtins.str] = None,
    company_name: typing.Optional[builtins.str] = None,
    district_or_county: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    state_or_region: typing.Optional[builtins.str] = None,
    website_url: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__3d800233717b2bea5e743387ac69acf5b6f2a4ac41868af9d43574d3d34549b1(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0069c1af7c89eb46b3358eb66a3171d9877cf17ed4583a825bcccd7bb5777755(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed1d3c8657089b4c7880df07f29d8918657e7bfb9d7ffdfa0c3f678ab024748c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84bf877c5cfaae526fc07495392bbaf6f9b413b8dc8299f4f0665d9c1eb54094(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7ae813d62d209f44199d7d850cb06eeb33650856e79b6acc8bb176c9c512170(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__269a54b0d88a150b840286983000e275b1b393df95237b4f2ce6b71b698c65db(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b69bc34042ebd93d6df212a13f64458c18efc54bdb2c67ad4f6e32454494b27(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b3fb68edf5b18991a5316d2612e0673f1099fc1f3c025ea3922bebafb53dfdb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f9822903e51e7bcc914c7c22b293513eb099c8001b5129996c7ecadbab3d285(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63784f57b414eeee72f1bb109e7a910c04f3cec9b54d4efdcb3a44594c127a18(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61e640b96ba9fe834731f9302c76ebbe1287417f44da46ba64bf1ebaaf90238c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e3886b30d7edee36a16812c86b114b6d6fab2d77cae7727c9c4ea6ad86156ba(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c499aef70293b343c1d7b6636875f916158299b02a9f93ca1e193116850a6df(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__97cd0d44379fdabac5d5c365bfa928ae2de4e678f87c8e95a857b9892062c126(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42e9afaf33ea5eb7584325eb70ba781adf6e8baa5062ebcc56f2e944966a7ac4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__448d6fb3435ff86bc42d9668b749b3620e4f9012b829960f1e793f38defe0596(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    address_line1: builtins.str,
    city: builtins.str,
    country_code: builtins.str,
    full_name: builtins.str,
    phone_number: builtins.str,
    postal_code: builtins.str,
    account_id: typing.Optional[builtins.str] = None,
    address_line2: typing.Optional[builtins.str] = None,
    address_line3: typing.Optional[builtins.str] = None,
    company_name: typing.Optional[builtins.str] = None,
    district_or_county: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    state_or_region: typing.Optional[builtins.str] = None,
    website_url: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass
