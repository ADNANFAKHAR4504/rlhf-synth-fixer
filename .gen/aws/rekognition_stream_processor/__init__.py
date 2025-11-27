r'''
# `aws_rekognition_stream_processor`

Refer to the Terraform Registry for docs: [`aws_rekognition_stream_processor`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor).
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


class RekognitionStreamProcessor(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessor",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor aws_rekognition_stream_processor}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        name: builtins.str,
        role_arn: builtins.str,
        data_sharing_preference: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorDataSharingPreference", typing.Dict[builtins.str, typing.Any]]]]] = None,
        input: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorInput", typing.Dict[builtins.str, typing.Any]]]]] = None,
        kms_key_id: typing.Optional[builtins.str] = None,
        notification_channel: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorNotificationChannel", typing.Dict[builtins.str, typing.Any]]]]] = None,
        output: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorOutput", typing.Dict[builtins.str, typing.Any]]]]] = None,
        regions_of_interest: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorRegionsOfInterest", typing.Dict[builtins.str, typing.Any]]]]] = None,
        settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorSettings", typing.Dict[builtins.str, typing.Any]]]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["RekognitionStreamProcessorTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor aws_rekognition_stream_processor} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param name: An identifier you assign to the stream processor. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#name RekognitionStreamProcessor#name}
        :param role_arn: The Amazon Resource Number (ARN) of the IAM role that allows access to the stream processor. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#role_arn RekognitionStreamProcessor#role_arn}
        :param data_sharing_preference: data_sharing_preference block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#data_sharing_preference RekognitionStreamProcessor#data_sharing_preference}
        :param input: input block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#input RekognitionStreamProcessor#input}
        :param kms_key_id: The identifier for your AWS Key Management Service key (AWS KMS key). You can supply the Amazon Resource Name (ARN) of your KMS key, the ID of your KMS key, an alias for your KMS key, or an alias ARN. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kms_key_id RekognitionStreamProcessor#kms_key_id}
        :param notification_channel: notification_channel block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#notification_channel RekognitionStreamProcessor#notification_channel}
        :param output: output block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#output RekognitionStreamProcessor#output}
        :param regions_of_interest: regions_of_interest block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#regions_of_interest RekognitionStreamProcessor#regions_of_interest}
        :param settings: settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#settings RekognitionStreamProcessor#settings}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#tags RekognitionStreamProcessor#tags}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#timeouts RekognitionStreamProcessor#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__235738e9758cd8ee4a3c057c719d0c02cd137b736c198539d35a6cbbe487f19b)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = RekognitionStreamProcessorConfig(
            name=name,
            role_arn=role_arn,
            data_sharing_preference=data_sharing_preference,
            input=input,
            kms_key_id=kms_key_id,
            notification_channel=notification_channel,
            output=output,
            regions_of_interest=regions_of_interest,
            settings=settings,
            tags=tags,
            timeouts=timeouts,
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
        '''Generates CDKTF code for importing a RekognitionStreamProcessor resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the RekognitionStreamProcessor to import.
        :param import_from_id: The id of the existing RekognitionStreamProcessor that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the RekognitionStreamProcessor to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13c208a1e4284c916ff0e62520f612a9da46bbc35fedbf628ea5c7cbbdb6dc5f)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putDataSharingPreference")
    def put_data_sharing_preference(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorDataSharingPreference", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__57a0ac3b2fd81ce935b1c5e0951ab2ed0430be2f735f66fdb2943e72f07b2cec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDataSharingPreference", [value]))

    @jsii.member(jsii_name="putInput")
    def put_input(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorInput", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ab053dec91f35298441c32f7251ae15d7b1724318af5ea01e22d4bf40e7e062)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInput", [value]))

    @jsii.member(jsii_name="putNotificationChannel")
    def put_notification_channel(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorNotificationChannel", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eed3658c0d3b23200c73e26cc9d4b83f279d69ad51848d05955c6ab1106728dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putNotificationChannel", [value]))

    @jsii.member(jsii_name="putOutput")
    def put_output(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorOutput", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13a701f92c8789ef9756af2d02a225bbbb57c680d53d79dd23ae07348f58f391)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putOutput", [value]))

    @jsii.member(jsii_name="putRegionsOfInterest")
    def put_regions_of_interest(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorRegionsOfInterest", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7ddf8cc0f023bb5f941a8ccde2033a13d5921064a597fc31b475ea7ebecc92ea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRegionsOfInterest", [value]))

    @jsii.member(jsii_name="putSettings")
    def put_settings(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorSettings", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fcd2bc30044939c29c0af02796d24790a201284802c37e4e7e89b3ff0fc13779)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSettings", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#create RekognitionStreamProcessor#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#delete RekognitionStreamProcessor#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#update RekognitionStreamProcessor#update}
        '''
        value = RekognitionStreamProcessorTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetDataSharingPreference")
    def reset_data_sharing_preference(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataSharingPreference", []))

    @jsii.member(jsii_name="resetInput")
    def reset_input(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInput", []))

    @jsii.member(jsii_name="resetKmsKeyId")
    def reset_kms_key_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKmsKeyId", []))

    @jsii.member(jsii_name="resetNotificationChannel")
    def reset_notification_channel(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNotificationChannel", []))

    @jsii.member(jsii_name="resetOutput")
    def reset_output(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOutput", []))

    @jsii.member(jsii_name="resetRegionsOfInterest")
    def reset_regions_of_interest(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegionsOfInterest", []))

    @jsii.member(jsii_name="resetSettings")
    def reset_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSettings", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

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
    @jsii.member(jsii_name="dataSharingPreference")
    def data_sharing_preference(
        self,
    ) -> "RekognitionStreamProcessorDataSharingPreferenceList":
        return typing.cast("RekognitionStreamProcessorDataSharingPreferenceList", jsii.get(self, "dataSharingPreference"))

    @builtins.property
    @jsii.member(jsii_name="input")
    def input(self) -> "RekognitionStreamProcessorInputList":
        return typing.cast("RekognitionStreamProcessorInputList", jsii.get(self, "input"))

    @builtins.property
    @jsii.member(jsii_name="notificationChannel")
    def notification_channel(
        self,
    ) -> "RekognitionStreamProcessorNotificationChannelList":
        return typing.cast("RekognitionStreamProcessorNotificationChannelList", jsii.get(self, "notificationChannel"))

    @builtins.property
    @jsii.member(jsii_name="output")
    def output(self) -> "RekognitionStreamProcessorOutputList":
        return typing.cast("RekognitionStreamProcessorOutputList", jsii.get(self, "output"))

    @builtins.property
    @jsii.member(jsii_name="regionsOfInterest")
    def regions_of_interest(self) -> "RekognitionStreamProcessorRegionsOfInterestList":
        return typing.cast("RekognitionStreamProcessorRegionsOfInterestList", jsii.get(self, "regionsOfInterest"))

    @builtins.property
    @jsii.member(jsii_name="settings")
    def settings(self) -> "RekognitionStreamProcessorSettingsList":
        return typing.cast("RekognitionStreamProcessorSettingsList", jsii.get(self, "settings"))

    @builtins.property
    @jsii.member(jsii_name="streamProcessorArn")
    def stream_processor_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "streamProcessorArn"))

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> _cdktf_9a9027ec.StringMap:
        return typing.cast(_cdktf_9a9027ec.StringMap, jsii.get(self, "tagsAll"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "RekognitionStreamProcessorTimeoutsOutputReference":
        return typing.cast("RekognitionStreamProcessorTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="dataSharingPreferenceInput")
    def data_sharing_preference_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorDataSharingPreference"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorDataSharingPreference"]]], jsii.get(self, "dataSharingPreferenceInput"))

    @builtins.property
    @jsii.member(jsii_name="inputInput")
    def input_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorInput"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorInput"]]], jsii.get(self, "inputInput"))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyIdInput")
    def kms_key_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "kmsKeyIdInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="notificationChannelInput")
    def notification_channel_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorNotificationChannel"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorNotificationChannel"]]], jsii.get(self, "notificationChannelInput"))

    @builtins.property
    @jsii.member(jsii_name="outputInput")
    def output_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorOutput"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorOutput"]]], jsii.get(self, "outputInput"))

    @builtins.property
    @jsii.member(jsii_name="regionsOfInterestInput")
    def regions_of_interest_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorRegionsOfInterest"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorRegionsOfInterest"]]], jsii.get(self, "regionsOfInterestInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="settingsInput")
    def settings_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorSettings"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorSettings"]]], jsii.get(self, "settingsInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "RekognitionStreamProcessorTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "RekognitionStreamProcessorTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyId")
    def kms_key_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "kmsKeyId"))

    @kms_key_id.setter
    def kms_key_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8092b76fa590d79b3f57fcc5a2598d6a41caa1421496e2676028719d756751d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "kmsKeyId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__232be9eaf76df87c21675e23cbde96415ec5485a8c4c177e4150051472ea39f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08d1a8c549fe80219aa8c64e90830ba409c65e483b42d311997575090096a2ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c018311db6c0c89e5df42fd72458e9447a42e6cc6c947ceecf92ca37500f8884)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "name": "name",
        "role_arn": "roleArn",
        "data_sharing_preference": "dataSharingPreference",
        "input": "input",
        "kms_key_id": "kmsKeyId",
        "notification_channel": "notificationChannel",
        "output": "output",
        "regions_of_interest": "regionsOfInterest",
        "settings": "settings",
        "tags": "tags",
        "timeouts": "timeouts",
    },
)
class RekognitionStreamProcessorConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        name: builtins.str,
        role_arn: builtins.str,
        data_sharing_preference: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorDataSharingPreference", typing.Dict[builtins.str, typing.Any]]]]] = None,
        input: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorInput", typing.Dict[builtins.str, typing.Any]]]]] = None,
        kms_key_id: typing.Optional[builtins.str] = None,
        notification_channel: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorNotificationChannel", typing.Dict[builtins.str, typing.Any]]]]] = None,
        output: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorOutput", typing.Dict[builtins.str, typing.Any]]]]] = None,
        regions_of_interest: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorRegionsOfInterest", typing.Dict[builtins.str, typing.Any]]]]] = None,
        settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorSettings", typing.Dict[builtins.str, typing.Any]]]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["RekognitionStreamProcessorTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param name: An identifier you assign to the stream processor. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#name RekognitionStreamProcessor#name}
        :param role_arn: The Amazon Resource Number (ARN) of the IAM role that allows access to the stream processor. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#role_arn RekognitionStreamProcessor#role_arn}
        :param data_sharing_preference: data_sharing_preference block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#data_sharing_preference RekognitionStreamProcessor#data_sharing_preference}
        :param input: input block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#input RekognitionStreamProcessor#input}
        :param kms_key_id: The identifier for your AWS Key Management Service key (AWS KMS key). You can supply the Amazon Resource Name (ARN) of your KMS key, the ID of your KMS key, an alias for your KMS key, or an alias ARN. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kms_key_id RekognitionStreamProcessor#kms_key_id}
        :param notification_channel: notification_channel block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#notification_channel RekognitionStreamProcessor#notification_channel}
        :param output: output block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#output RekognitionStreamProcessor#output}
        :param regions_of_interest: regions_of_interest block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#regions_of_interest RekognitionStreamProcessor#regions_of_interest}
        :param settings: settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#settings RekognitionStreamProcessor#settings}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#tags RekognitionStreamProcessor#tags}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#timeouts RekognitionStreamProcessor#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(timeouts, dict):
            timeouts = RekognitionStreamProcessorTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d1a6a790f71dfde358af8a3f9d934de1502c2ea7e2edaef5fef550de707bf33)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument data_sharing_preference", value=data_sharing_preference, expected_type=type_hints["data_sharing_preference"])
            check_type(argname="argument input", value=input, expected_type=type_hints["input"])
            check_type(argname="argument kms_key_id", value=kms_key_id, expected_type=type_hints["kms_key_id"])
            check_type(argname="argument notification_channel", value=notification_channel, expected_type=type_hints["notification_channel"])
            check_type(argname="argument output", value=output, expected_type=type_hints["output"])
            check_type(argname="argument regions_of_interest", value=regions_of_interest, expected_type=type_hints["regions_of_interest"])
            check_type(argname="argument settings", value=settings, expected_type=type_hints["settings"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "role_arn": role_arn,
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
        if data_sharing_preference is not None:
            self._values["data_sharing_preference"] = data_sharing_preference
        if input is not None:
            self._values["input"] = input
        if kms_key_id is not None:
            self._values["kms_key_id"] = kms_key_id
        if notification_channel is not None:
            self._values["notification_channel"] = notification_channel
        if output is not None:
            self._values["output"] = output
        if regions_of_interest is not None:
            self._values["regions_of_interest"] = regions_of_interest
        if settings is not None:
            self._values["settings"] = settings
        if tags is not None:
            self._values["tags"] = tags
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
    def name(self) -> builtins.str:
        '''An identifier you assign to the stream processor.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#name RekognitionStreamProcessor#name}
        '''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def role_arn(self) -> builtins.str:
        '''The Amazon Resource Number (ARN) of the IAM role that allows access to the stream processor.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#role_arn RekognitionStreamProcessor#role_arn}
        '''
        result = self._values.get("role_arn")
        assert result is not None, "Required property 'role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def data_sharing_preference(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorDataSharingPreference"]]]:
        '''data_sharing_preference block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#data_sharing_preference RekognitionStreamProcessor#data_sharing_preference}
        '''
        result = self._values.get("data_sharing_preference")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorDataSharingPreference"]]], result)

    @builtins.property
    def input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorInput"]]]:
        '''input block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#input RekognitionStreamProcessor#input}
        '''
        result = self._values.get("input")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorInput"]]], result)

    @builtins.property
    def kms_key_id(self) -> typing.Optional[builtins.str]:
        '''The identifier for your AWS Key Management Service key (AWS KMS key).

        You can supply the Amazon Resource Name (ARN) of your KMS key, the ID of your KMS key, an alias for your KMS key, or an alias ARN.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kms_key_id RekognitionStreamProcessor#kms_key_id}
        '''
        result = self._values.get("kms_key_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def notification_channel(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorNotificationChannel"]]]:
        '''notification_channel block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#notification_channel RekognitionStreamProcessor#notification_channel}
        '''
        result = self._values.get("notification_channel")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorNotificationChannel"]]], result)

    @builtins.property
    def output(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorOutput"]]]:
        '''output block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#output RekognitionStreamProcessor#output}
        '''
        result = self._values.get("output")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorOutput"]]], result)

    @builtins.property
    def regions_of_interest(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorRegionsOfInterest"]]]:
        '''regions_of_interest block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#regions_of_interest RekognitionStreamProcessor#regions_of_interest}
        '''
        result = self._values.get("regions_of_interest")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorRegionsOfInterest"]]], result)

    @builtins.property
    def settings(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorSettings"]]]:
        '''settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#settings RekognitionStreamProcessor#settings}
        '''
        result = self._values.get("settings")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorSettings"]]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#tags RekognitionStreamProcessor#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["RekognitionStreamProcessorTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#timeouts RekognitionStreamProcessor#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["RekognitionStreamProcessorTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorDataSharingPreference",
    jsii_struct_bases=[],
    name_mapping={"opt_in": "optIn"},
)
class RekognitionStreamProcessorDataSharingPreference:
    def __init__(
        self,
        *,
        opt_in: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param opt_in: Do you want to share data with Rekognition to improve model performance. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#opt_in RekognitionStreamProcessor#opt_in}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7fdf709ae12c1df6c8d7e3cc4eee8e76fe1cbb1c0101f15f0ee7a9b75c45d4d7)
            check_type(argname="argument opt_in", value=opt_in, expected_type=type_hints["opt_in"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "opt_in": opt_in,
        }

    @builtins.property
    def opt_in(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Do you want to share data with Rekognition to improve model performance.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#opt_in RekognitionStreamProcessor#opt_in}
        '''
        result = self._values.get("opt_in")
        assert result is not None, "Required property 'opt_in' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorDataSharingPreference(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RekognitionStreamProcessorDataSharingPreferenceList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorDataSharingPreferenceList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9e0a1c257d79059a6a1fb180d20116b771c539fa835425511410cae71109c937)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorDataSharingPreferenceOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6896290bcf335e652cc037b54b96817092d6b82fb6ccfaeabbf661afaf86bf4f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorDataSharingPreferenceOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07d675159a3104138e198ea23a8e8b5a03a3ab5b291ec1c138492c99c047e342)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b9e6c433401460605ee0fe003edd4b84dfd07bcd2849835c72be96da13643541)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6ddfc12e5427b4185ab3fe6ffbe7e4479c55b6df43e785138bd96e0efa1f8273)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorDataSharingPreference]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorDataSharingPreference]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorDataSharingPreference]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0af562749e0343766c6ec8aca49695c7f5c1a252b26d5abe828622bb41d9f5ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorDataSharingPreferenceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorDataSharingPreferenceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__99351ba6857ee05f2505a295984a5dbc6beceb61467449a6f8d7bbb9f1ed8e5d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="optInInput")
    def opt_in_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "optInInput"))

    @builtins.property
    @jsii.member(jsii_name="optIn")
    def opt_in(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "optIn"))

    @opt_in.setter
    def opt_in(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3173cc776a878ff3422aced4e612b3525c1c8ce31e95fbb9738dcca2371eeefb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "optIn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorDataSharingPreference]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorDataSharingPreference]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorDataSharingPreference]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__419d415a79a6e8e0817c9eb75d12adfb3f8ed91a05ae1fb58388e3497cfbae6d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorInput",
    jsii_struct_bases=[],
    name_mapping={"kinesis_video_stream": "kinesisVideoStream"},
)
class RekognitionStreamProcessorInput:
    def __init__(
        self,
        *,
        kinesis_video_stream: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorInputKinesisVideoStream", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param kinesis_video_stream: kinesis_video_stream block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kinesis_video_stream RekognitionStreamProcessor#kinesis_video_stream}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85004db3c5cc4d0ac5085e6681c456e7c1db451503a80aae099ee84a973eda19)
            check_type(argname="argument kinesis_video_stream", value=kinesis_video_stream, expected_type=type_hints["kinesis_video_stream"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if kinesis_video_stream is not None:
            self._values["kinesis_video_stream"] = kinesis_video_stream

    @builtins.property
    def kinesis_video_stream(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorInputKinesisVideoStream"]]]:
        '''kinesis_video_stream block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kinesis_video_stream RekognitionStreamProcessor#kinesis_video_stream}
        '''
        result = self._values.get("kinesis_video_stream")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorInputKinesisVideoStream"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorInput(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorInputKinesisVideoStream",
    jsii_struct_bases=[],
    name_mapping={"arn": "arn"},
)
class RekognitionStreamProcessorInputKinesisVideoStream:
    def __init__(self, *, arn: builtins.str) -> None:
        '''
        :param arn: ARN of the Kinesis video stream stream that streams the source video. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#arn RekognitionStreamProcessor#arn}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c104946af6c40860da05cb87b59a3d7c0cc9d4f31561c3a9aa2fc1032e1c747)
            check_type(argname="argument arn", value=arn, expected_type=type_hints["arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "arn": arn,
        }

    @builtins.property
    def arn(self) -> builtins.str:
        '''ARN of the Kinesis video stream stream that streams the source video.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#arn RekognitionStreamProcessor#arn}
        '''
        result = self._values.get("arn")
        assert result is not None, "Required property 'arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorInputKinesisVideoStream(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RekognitionStreamProcessorInputKinesisVideoStreamList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorInputKinesisVideoStreamList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__93de3ffe45083935ae2c1728e872f88efc73a6868c410ee24c8f014e29826d56)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorInputKinesisVideoStreamOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea557c62768784f5394b71813ed0b3ec16943737d23d85849b4fce1ed0c7ffc9)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorInputKinesisVideoStreamOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__77da5e497472ee81f0b86fc1783e63a91e7f32f8c8d708d87cfc1957c1cbb31a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b6486d8c34fbebbac7cd642d0a5b5e3ef4e81d7a45e9571c0086e31e5d09d919)
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
            type_hints = typing.get_type_hints(_typecheckingstub__259dfff30135bc54ad9663713ee544a5a661ca7d1db4cedcb763fc968d9064e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorInputKinesisVideoStream]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorInputKinesisVideoStream]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorInputKinesisVideoStream]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc328b53bf7051b7bb5ca5b9d604ad45016a2b2bf5cedf7d7f46628c4334c48a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorInputKinesisVideoStreamOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorInputKinesisVideoStreamOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__35b9711dcfbcb53568ba23e76c9bb9e53a82ab53a97da17eceed14bccc3ca183)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="arnInput")
    def arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "arnInput"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @arn.setter
    def arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2fb77a5ccf9f4de8751cdec2ec770925ccd47d45f7153fa6369c8712d424fbb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "arn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorInputKinesisVideoStream]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorInputKinesisVideoStream]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorInputKinesisVideoStream]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64a37817101f57a4af73ff459d67c310e77a078770aacef068978419f9af5039)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorInputList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorInputList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6f5c5a5847aec40c5fe3df8deb122428db2128dab72dbe5bb9a5235fe42bdf0c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorInputOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dd66ad980bb5100a5d57a302f546958a146311b690a3d7a57e8aee6bfaff8b00)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorInputOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b356967ce3978072f7dea863d1faaca679709499edde8eed66fce46366cee71a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5df91f99eab8696605b5a29d0a1b2ce7ffcf76d6c2239f88671f3098e1826c96)
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
            type_hints = typing.get_type_hints(_typecheckingstub__18d52a2908bf1518e2cf3e63a6df67c35f56b450d867ceef75b83657a44d1915)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorInput]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorInput]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorInput]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__994aeb8796a4b7bd76bb1773c24020ea23bff8f44302e55eaa9dcd60b811eb6f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorInputOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorInputOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__885d36e351cc0f945f87b0a0f61106e9b4ab687cd1ce6a2a010950091270d531)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putKinesisVideoStream")
    def put_kinesis_video_stream(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorInputKinesisVideoStream, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9e19ac1b87930b36b6e2166381b938db936d934d7fcc4574c783742bbd509757)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putKinesisVideoStream", [value]))

    @jsii.member(jsii_name="resetKinesisVideoStream")
    def reset_kinesis_video_stream(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKinesisVideoStream", []))

    @builtins.property
    @jsii.member(jsii_name="kinesisVideoStream")
    def kinesis_video_stream(
        self,
    ) -> RekognitionStreamProcessorInputKinesisVideoStreamList:
        return typing.cast(RekognitionStreamProcessorInputKinesisVideoStreamList, jsii.get(self, "kinesisVideoStream"))

    @builtins.property
    @jsii.member(jsii_name="kinesisVideoStreamInput")
    def kinesis_video_stream_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorInputKinesisVideoStream]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorInputKinesisVideoStream]]], jsii.get(self, "kinesisVideoStreamInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorInput]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorInput]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorInput]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a68c16d143d4a716ac0b461f7dd7bcc3fa0dbdbe28d4138a226d09499af66eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorNotificationChannel",
    jsii_struct_bases=[],
    name_mapping={"sns_topic_arn": "snsTopicArn"},
)
class RekognitionStreamProcessorNotificationChannel:
    def __init__(self, *, sns_topic_arn: typing.Optional[builtins.str] = None) -> None:
        '''
        :param sns_topic_arn: The Amazon Resource Number (ARN) of the Amazon Amazon Simple Notification Service topic to which Amazon Rekognition posts the completion status. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#sns_topic_arn RekognitionStreamProcessor#sns_topic_arn}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e70e40cba2afccc26942c2676801e613de13644a5bdfbe447fcd2f7182f14dea)
            check_type(argname="argument sns_topic_arn", value=sns_topic_arn, expected_type=type_hints["sns_topic_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if sns_topic_arn is not None:
            self._values["sns_topic_arn"] = sns_topic_arn

    @builtins.property
    def sns_topic_arn(self) -> typing.Optional[builtins.str]:
        '''The Amazon Resource Number (ARN) of the Amazon Amazon Simple Notification Service topic to which Amazon Rekognition posts the completion status.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#sns_topic_arn RekognitionStreamProcessor#sns_topic_arn}
        '''
        result = self._values.get("sns_topic_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorNotificationChannel(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RekognitionStreamProcessorNotificationChannelList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorNotificationChannelList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__92886857c14efb77fa40ee3e9d5ff77e701763e3d4efadf5fcf1cfd521028694)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorNotificationChannelOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a73f73ec3337bb9cf4ea2ace6b5bbf936dedb6f4dfdc80c3163b9d5f1836ed7)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorNotificationChannelOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc32000010b6129ed656c06ab229fd1ee8dbd5bf31d06bf82f18b007d2290981)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4775076ab47bdb57fca3ed75e9b761c824e726031142ee4e4515bae4df03d94c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a725da5323dac8c87252c6550d78aeeeec3ab21b0f8370dad3b585f611677257)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorNotificationChannel]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorNotificationChannel]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorNotificationChannel]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fee6f9e9cacfed5637ea63548622c6562d157a8c64f732dac0c977bb195579e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorNotificationChannelOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorNotificationChannelOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f50a6a55c967749e38a1019d94af67062521ca38b334454672d552fc77e7d685)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetSnsTopicArn")
    def reset_sns_topic_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSnsTopicArn", []))

    @builtins.property
    @jsii.member(jsii_name="snsTopicArnInput")
    def sns_topic_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "snsTopicArnInput"))

    @builtins.property
    @jsii.member(jsii_name="snsTopicArn")
    def sns_topic_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "snsTopicArn"))

    @sns_topic_arn.setter
    def sns_topic_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__10947259f9012d0b9cbb8dba692a6e01452b2e0b8bd3919c0f469fbd963a3505)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "snsTopicArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorNotificationChannel]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorNotificationChannel]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorNotificationChannel]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37fa19da0f879cef5c735baa0aedd16144b6df24e53e04766b7e21d95ae443c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutput",
    jsii_struct_bases=[],
    name_mapping={
        "kinesis_data_stream": "kinesisDataStream",
        "s3_destination": "s3Destination",
    },
)
class RekognitionStreamProcessorOutput:
    def __init__(
        self,
        *,
        kinesis_data_stream: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorOutputKinesisDataStream", typing.Dict[builtins.str, typing.Any]]]]] = None,
        s3_destination: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorOutputS3Destination", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param kinesis_data_stream: kinesis_data_stream block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kinesis_data_stream RekognitionStreamProcessor#kinesis_data_stream}
        :param s3_destination: s3_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#s3_destination RekognitionStreamProcessor#s3_destination}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a164cba6fca1bb062445079c1c5184cdea882c4cb33ddca66f918f832efa0f43)
            check_type(argname="argument kinesis_data_stream", value=kinesis_data_stream, expected_type=type_hints["kinesis_data_stream"])
            check_type(argname="argument s3_destination", value=s3_destination, expected_type=type_hints["s3_destination"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if kinesis_data_stream is not None:
            self._values["kinesis_data_stream"] = kinesis_data_stream
        if s3_destination is not None:
            self._values["s3_destination"] = s3_destination

    @builtins.property
    def kinesis_data_stream(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorOutputKinesisDataStream"]]]:
        '''kinesis_data_stream block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kinesis_data_stream RekognitionStreamProcessor#kinesis_data_stream}
        '''
        result = self._values.get("kinesis_data_stream")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorOutputKinesisDataStream"]]], result)

    @builtins.property
    def s3_destination(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorOutputS3Destination"]]]:
        '''s3_destination block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#s3_destination RekognitionStreamProcessor#s3_destination}
        '''
        result = self._values.get("s3_destination")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorOutputS3Destination"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorOutput(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputKinesisDataStream",
    jsii_struct_bases=[],
    name_mapping={"arn": "arn"},
)
class RekognitionStreamProcessorOutputKinesisDataStream:
    def __init__(self, *, arn: typing.Optional[builtins.str] = None) -> None:
        '''
        :param arn: ARN of the output Amazon Kinesis Data Streams stream. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#arn RekognitionStreamProcessor#arn}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d627e52f9a3f96c7a3874cf8ee4fe73c2bac229f2527c3ac0f24fe75f4f3caae)
            check_type(argname="argument arn", value=arn, expected_type=type_hints["arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if arn is not None:
            self._values["arn"] = arn

    @builtins.property
    def arn(self) -> typing.Optional[builtins.str]:
        '''ARN of the output Amazon Kinesis Data Streams stream.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#arn RekognitionStreamProcessor#arn}
        '''
        result = self._values.get("arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorOutputKinesisDataStream(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RekognitionStreamProcessorOutputKinesisDataStreamList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputKinesisDataStreamList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__da5c4577ce518924b04ddb280b4c67aa0581b5b176b2b2a02564d9f8cd3588b2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorOutputKinesisDataStreamOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43dcfbf492e148f5c96518d86ca6ca393c1773fc898fab6e6defbc48df031c33)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorOutputKinesisDataStreamOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__acaaf3f41918cc96f3f1499a7dc9a3bc76ba6275440ef9d44974726568e78a53)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6d26b482836a78d103de22e02862f140fee5936dfd5d8f3c4236d346faf733cb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7184782611e196e46aa91ce12f0311565f3c64e2e41705e854c6d27f89cfe062)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutputKinesisDataStream]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutputKinesisDataStream]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutputKinesisDataStream]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52513a7c36c57400edd1b0560a3f6fc39c4065edc3b1999dd4a062266443c899)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorOutputKinesisDataStreamOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputKinesisDataStreamOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6745ed0ab2d41f87df5bdef6dd5f1754533f706437a8403bca62c6170f36d769)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetArn")
    def reset_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetArn", []))

    @builtins.property
    @jsii.member(jsii_name="arnInput")
    def arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "arnInput"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @arn.setter
    def arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43e1aef442596e8e9c085adea749f019e45f5e785ab4eb02b1dbbcac05231ba7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "arn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutputKinesisDataStream]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutputKinesisDataStream]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutputKinesisDataStream]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e52930f60a2dce5958875e6b72bf459054aa02e75fa127ef7d3b973e1d591e4f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorOutputList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d75744573d393f067c2c0f08d56d63f725316d7f34de1285eb9336dd8e143901)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorOutputOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c730a93161e57a7a1eeec9879083aa4c5ff2631f8aefa89094e935c939814d76)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorOutputOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__25f4d68631fbb60cc5f64511eb7d873f725e7b47b727d610ab63b118be8a6621)
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
            type_hints = typing.get_type_hints(_typecheckingstub__04e9c8114e44f11b26aff1ca07d63d06ebfedeaff498ee8a11ab125fc1f849af)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a0790d4506992ec8aa4e12304d02605ce4d027d37138fa1574b5fb1017a86179)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutput]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutput]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutput]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ad0394a13c79de08976cab7c19a52921bad69dd4c9cd6a0369bba78425d25d33)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorOutputOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__95b10224b92848a020eedfaa1695a6e942bc7f807f56dc35e66cb0797fa865e8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putKinesisDataStream")
    def put_kinesis_data_stream(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorOutputKinesisDataStream, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__337485064f6b87f1c49105418c3d92fefdd49c1d55b33fe4fefb5b7e66cae3d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putKinesisDataStream", [value]))

    @jsii.member(jsii_name="putS3Destination")
    def put_s3_destination(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorOutputS3Destination", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15e81c0859b46e67671818aeffa6ba577584984e20029a3721e41404e84dddc1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putS3Destination", [value]))

    @jsii.member(jsii_name="resetKinesisDataStream")
    def reset_kinesis_data_stream(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKinesisDataStream", []))

    @jsii.member(jsii_name="resetS3Destination")
    def reset_s3_destination(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3Destination", []))

    @builtins.property
    @jsii.member(jsii_name="kinesisDataStream")
    def kinesis_data_stream(
        self,
    ) -> RekognitionStreamProcessorOutputKinesisDataStreamList:
        return typing.cast(RekognitionStreamProcessorOutputKinesisDataStreamList, jsii.get(self, "kinesisDataStream"))

    @builtins.property
    @jsii.member(jsii_name="s3Destination")
    def s3_destination(self) -> "RekognitionStreamProcessorOutputS3DestinationList":
        return typing.cast("RekognitionStreamProcessorOutputS3DestinationList", jsii.get(self, "s3Destination"))

    @builtins.property
    @jsii.member(jsii_name="kinesisDataStreamInput")
    def kinesis_data_stream_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutputKinesisDataStream]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutputKinesisDataStream]]], jsii.get(self, "kinesisDataStreamInput"))

    @builtins.property
    @jsii.member(jsii_name="s3DestinationInput")
    def s3_destination_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorOutputS3Destination"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorOutputS3Destination"]]], jsii.get(self, "s3DestinationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutput]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutput]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutput]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e33517992c2b526d88a7ab473b5c0be64a8d0814021c7cce3327218d8b8d263b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputS3Destination",
    jsii_struct_bases=[],
    name_mapping={"bucket": "bucket", "key_prefix": "keyPrefix"},
)
class RekognitionStreamProcessorOutputS3Destination:
    def __init__(
        self,
        *,
        bucket: typing.Optional[builtins.str] = None,
        key_prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket: The name of the Amazon S3 bucket you want to associate with the streaming video project. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#bucket RekognitionStreamProcessor#bucket}
        :param key_prefix: The prefix value of the location within the bucket that you want the information to be published to. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#key_prefix RekognitionStreamProcessor#key_prefix}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61018b3e80f76515460a62194a2cb8069e49f8967ce31d3a0efd3126b1154a13)
            check_type(argname="argument bucket", value=bucket, expected_type=type_hints["bucket"])
            check_type(argname="argument key_prefix", value=key_prefix, expected_type=type_hints["key_prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if bucket is not None:
            self._values["bucket"] = bucket
        if key_prefix is not None:
            self._values["key_prefix"] = key_prefix

    @builtins.property
    def bucket(self) -> typing.Optional[builtins.str]:
        '''The name of the Amazon S3 bucket you want to associate with the streaming video project.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#bucket RekognitionStreamProcessor#bucket}
        '''
        result = self._values.get("bucket")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def key_prefix(self) -> typing.Optional[builtins.str]:
        '''The prefix value of the location within the bucket that you want the information to be published to.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#key_prefix RekognitionStreamProcessor#key_prefix}
        '''
        result = self._values.get("key_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorOutputS3Destination(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RekognitionStreamProcessorOutputS3DestinationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputS3DestinationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__982feff828b6017753818ab6bf87b897502b1fd67244c50faed0ccce9c8e2319)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorOutputS3DestinationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2897d4d9abccefabceedf88276a8b4d7e67fa9886c5302aa073c048468e7915)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorOutputS3DestinationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7841831fefab4c9199858348d64827e7b11d9486ea27dbfff0711ab51adb8ad4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__64a3b0fda221a295078a83273a58afe8c77103c896e7fcb653ec61e16587da6b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f1321ba605c251b0db761902d52e217a1ad8480543a15fec4b81941b768d8a82)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutputS3Destination]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutputS3Destination]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutputS3Destination]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c68cee3507926dfebab36c203511ba450dc65a7cc393796a44fc1760399f6b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorOutputS3DestinationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputS3DestinationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9b12aa01961d83c00af64773098135c626384e30d8d41301beb0d1cbe304497d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetBucket")
    def reset_bucket(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBucket", []))

    @jsii.member(jsii_name="resetKeyPrefix")
    def reset_key_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKeyPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="bucketInput")
    def bucket_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketInput"))

    @builtins.property
    @jsii.member(jsii_name="keyPrefixInput")
    def key_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "keyPrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="bucket")
    def bucket(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucket"))

    @bucket.setter
    def bucket(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c8473850bdce608d6bd0b0153b303a6e944574fe67fa8a8df82ae6093bf5164)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucket", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="keyPrefix")
    def key_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "keyPrefix"))

    @key_prefix.setter
    def key_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a4e3631e6ea3a36313389f3be0ccac413593a138349bdeb2e67876379ca415a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "keyPrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutputS3Destination]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutputS3Destination]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutputS3Destination]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a08feef16946bc7f7ed7ab005fcf351625c2043cceab5f4b27111154c8f1b10)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterest",
    jsii_struct_bases=[],
    name_mapping={"bounding_box": "boundingBox", "polygon": "polygon"},
)
class RekognitionStreamProcessorRegionsOfInterest:
    def __init__(
        self,
        *,
        bounding_box: typing.Optional[typing.Union["RekognitionStreamProcessorRegionsOfInterestBoundingBox", typing.Dict[builtins.str, typing.Any]]] = None,
        polygon: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorRegionsOfInterestPolygon", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param bounding_box: bounding_box block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#bounding_box RekognitionStreamProcessor#bounding_box}
        :param polygon: polygon block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#polygon RekognitionStreamProcessor#polygon}
        '''
        if isinstance(bounding_box, dict):
            bounding_box = RekognitionStreamProcessorRegionsOfInterestBoundingBox(**bounding_box)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0423c62908892e5280c2e6baccdd398b157d1e10c60db49a468934aa72bcc27e)
            check_type(argname="argument bounding_box", value=bounding_box, expected_type=type_hints["bounding_box"])
            check_type(argname="argument polygon", value=polygon, expected_type=type_hints["polygon"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if bounding_box is not None:
            self._values["bounding_box"] = bounding_box
        if polygon is not None:
            self._values["polygon"] = polygon

    @builtins.property
    def bounding_box(
        self,
    ) -> typing.Optional["RekognitionStreamProcessorRegionsOfInterestBoundingBox"]:
        '''bounding_box block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#bounding_box RekognitionStreamProcessor#bounding_box}
        '''
        result = self._values.get("bounding_box")
        return typing.cast(typing.Optional["RekognitionStreamProcessorRegionsOfInterestBoundingBox"], result)

    @builtins.property
    def polygon(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorRegionsOfInterestPolygon"]]]:
        '''polygon block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#polygon RekognitionStreamProcessor#polygon}
        '''
        result = self._values.get("polygon")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorRegionsOfInterestPolygon"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorRegionsOfInterest(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestBoundingBox",
    jsii_struct_bases=[],
    name_mapping={"height": "height", "left": "left", "top": "top", "width": "width"},
)
class RekognitionStreamProcessorRegionsOfInterestBoundingBox:
    def __init__(
        self,
        *,
        height: typing.Optional[jsii.Number] = None,
        left: typing.Optional[jsii.Number] = None,
        top: typing.Optional[jsii.Number] = None,
        width: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param height: Height of the bounding box as a ratio of the overall image height. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#height RekognitionStreamProcessor#height}
        :param left: Left coordinate of the bounding box as a ratio of overall image width. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#left RekognitionStreamProcessor#left}
        :param top: Top coordinate of the bounding box as a ratio of overall image height. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#top RekognitionStreamProcessor#top}
        :param width: Width of the bounding box as a ratio of the overall image width. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#width RekognitionStreamProcessor#width}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__58ca87d812c372856bab505c3ba82b16dfd1cd7def2bb1c615801ead207b9d1a)
            check_type(argname="argument height", value=height, expected_type=type_hints["height"])
            check_type(argname="argument left", value=left, expected_type=type_hints["left"])
            check_type(argname="argument top", value=top, expected_type=type_hints["top"])
            check_type(argname="argument width", value=width, expected_type=type_hints["width"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if height is not None:
            self._values["height"] = height
        if left is not None:
            self._values["left"] = left
        if top is not None:
            self._values["top"] = top
        if width is not None:
            self._values["width"] = width

    @builtins.property
    def height(self) -> typing.Optional[jsii.Number]:
        '''Height of the bounding box as a ratio of the overall image height.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#height RekognitionStreamProcessor#height}
        '''
        result = self._values.get("height")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def left(self) -> typing.Optional[jsii.Number]:
        '''Left coordinate of the bounding box as a ratio of overall image width.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#left RekognitionStreamProcessor#left}
        '''
        result = self._values.get("left")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def top(self) -> typing.Optional[jsii.Number]:
        '''Top coordinate of the bounding box as a ratio of overall image height.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#top RekognitionStreamProcessor#top}
        '''
        result = self._values.get("top")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def width(self) -> typing.Optional[jsii.Number]:
        '''Width of the bounding box as a ratio of the overall image width.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#width RekognitionStreamProcessor#width}
        '''
        result = self._values.get("width")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorRegionsOfInterestBoundingBox(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__32a32094266b946a38189bb2d8853e2138155867cb2df58d53dc558743405ba3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetHeight")
    def reset_height(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHeight", []))

    @jsii.member(jsii_name="resetLeft")
    def reset_left(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLeft", []))

    @jsii.member(jsii_name="resetTop")
    def reset_top(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTop", []))

    @jsii.member(jsii_name="resetWidth")
    def reset_width(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWidth", []))

    @builtins.property
    @jsii.member(jsii_name="heightInput")
    def height_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "heightInput"))

    @builtins.property
    @jsii.member(jsii_name="leftInput")
    def left_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "leftInput"))

    @builtins.property
    @jsii.member(jsii_name="topInput")
    def top_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "topInput"))

    @builtins.property
    @jsii.member(jsii_name="widthInput")
    def width_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "widthInput"))

    @builtins.property
    @jsii.member(jsii_name="height")
    def height(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "height"))

    @height.setter
    def height(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d669672dd06a3ab242e5ecf1ee900098592440818cb5c05671ce27941374758f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "height", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="left")
    def left(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "left"))

    @left.setter
    def left(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a4d15484d2bb1cf19f5e9681b5393fd7021ff7dbb62ffac804428e7335bc750)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "left", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="top")
    def top(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "top"))

    @top.setter
    def top(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c68d93858afc5514c03a2ae2ca6f7d010c915b447c25b12edae3f88e6c6b5ac5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "top", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="width")
    def width(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "width"))

    @width.setter
    def width(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9ad2063e363cf3a88dc5dfbf85589e3e324cf3bffae5689e21c79e6d32d2d314)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "width", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterestBoundingBox]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterestBoundingBox]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterestBoundingBox]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4362ff6221aa7c6463656bab9e57dc08e5e5add670bff84c58bd9dc8bfb83fbb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorRegionsOfInterestList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__be2579315d15ba1918b6a406890160c6b9e6df466a289288611a54d690487762)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorRegionsOfInterestOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e5e4731ca1addf07868fab182dfb368d2f853eee1e2d320ba6129923ec2b8c2)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorRegionsOfInterestOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bc73f6f963d0de506c7275ad58134ac92d8ba4a6a0313082ff457ce3340dfee5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7abb6e2a21a070c10add77fc25b67a3375848ece3de6900fd763c1a50385fcf2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b99f6dd4238be5f374b7b5e480dfcf19e19b4cf98a4b6ac22235e9c30707a609)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorRegionsOfInterest]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorRegionsOfInterest]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorRegionsOfInterest]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3ee7f21256005fcc048e2a5c3a0885794d107f296de095609205e77eb1dd960)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorRegionsOfInterestOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__877a8f593f46b682958789f84ff3d8c419e8ba68e77cd41910e3faf6c44e6306)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putBoundingBox")
    def put_bounding_box(
        self,
        *,
        height: typing.Optional[jsii.Number] = None,
        left: typing.Optional[jsii.Number] = None,
        top: typing.Optional[jsii.Number] = None,
        width: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param height: Height of the bounding box as a ratio of the overall image height. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#height RekognitionStreamProcessor#height}
        :param left: Left coordinate of the bounding box as a ratio of overall image width. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#left RekognitionStreamProcessor#left}
        :param top: Top coordinate of the bounding box as a ratio of overall image height. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#top RekognitionStreamProcessor#top}
        :param width: Width of the bounding box as a ratio of the overall image width. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#width RekognitionStreamProcessor#width}
        '''
        value = RekognitionStreamProcessorRegionsOfInterestBoundingBox(
            height=height, left=left, top=top, width=width
        )

        return typing.cast(None, jsii.invoke(self, "putBoundingBox", [value]))

    @jsii.member(jsii_name="putPolygon")
    def put_polygon(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorRegionsOfInterestPolygon", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__666b1466ca829acf2e92cc97e5f08c0a6395ef8b9362043bf7f990f522302658)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPolygon", [value]))

    @jsii.member(jsii_name="resetBoundingBox")
    def reset_bounding_box(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBoundingBox", []))

    @jsii.member(jsii_name="resetPolygon")
    def reset_polygon(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPolygon", []))

    @builtins.property
    @jsii.member(jsii_name="boundingBox")
    def bounding_box(
        self,
    ) -> RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference:
        return typing.cast(RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference, jsii.get(self, "boundingBox"))

    @builtins.property
    @jsii.member(jsii_name="polygon")
    def polygon(self) -> "RekognitionStreamProcessorRegionsOfInterestPolygonList":
        return typing.cast("RekognitionStreamProcessorRegionsOfInterestPolygonList", jsii.get(self, "polygon"))

    @builtins.property
    @jsii.member(jsii_name="boundingBoxInput")
    def bounding_box_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterestBoundingBox]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterestBoundingBox]], jsii.get(self, "boundingBoxInput"))

    @builtins.property
    @jsii.member(jsii_name="polygonInput")
    def polygon_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorRegionsOfInterestPolygon"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorRegionsOfInterestPolygon"]]], jsii.get(self, "polygonInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterest]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterest]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterest]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32c700c9c3450c088f6b31b630928ab676ee74361805a5648e7c3993e20c1216)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestPolygon",
    jsii_struct_bases=[],
    name_mapping={"x": "x", "y": "y"},
)
class RekognitionStreamProcessorRegionsOfInterestPolygon:
    def __init__(
        self,
        *,
        x: typing.Optional[jsii.Number] = None,
        y: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param x: The value of the X coordinate for a point on a Polygon. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#x RekognitionStreamProcessor#x}
        :param y: The value of the Y coordinate for a point on a Polygon. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#y RekognitionStreamProcessor#y}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32a69be62a551a21fac84574e154c6332852ead9f6d3da21f344010da7809db3)
            check_type(argname="argument x", value=x, expected_type=type_hints["x"])
            check_type(argname="argument y", value=y, expected_type=type_hints["y"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if x is not None:
            self._values["x"] = x
        if y is not None:
            self._values["y"] = y

    @builtins.property
    def x(self) -> typing.Optional[jsii.Number]:
        '''The value of the X coordinate for a point on a Polygon.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#x RekognitionStreamProcessor#x}
        '''
        result = self._values.get("x")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def y(self) -> typing.Optional[jsii.Number]:
        '''The value of the Y coordinate for a point on a Polygon.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#y RekognitionStreamProcessor#y}
        '''
        result = self._values.get("y")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorRegionsOfInterestPolygon(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RekognitionStreamProcessorRegionsOfInterestPolygonList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestPolygonList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e376b99ae2ee51e8be46f413fb8829685954756b13d22abe8df1129cca3c0ed5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorRegionsOfInterestPolygonOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac97d5bd06e2bcaa1def5b638adc2c0beca41f2d7e88dc2101c321f3b337d99c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorRegionsOfInterestPolygonOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b0a122281fd33605dde85d1ef6639e953ec2424ed6694fa100d4fddf490f0fd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__427cf0914d8897297ada49d7e2591cb296aeaebeaabdc5505f13c2f7926ed82c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__922ab2a053990e476f1d4f932927a506b999db8293b43c5b665866967c4c0a53)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorRegionsOfInterestPolygon]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorRegionsOfInterestPolygon]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorRegionsOfInterestPolygon]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8dde75ee75b3bec60aaf5a7d36dbf65786f7322e332e6651f986c6c0f88681b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorRegionsOfInterestPolygonOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestPolygonOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5df7ca5f5aee0d62889030386abe542b95a9878c7293c69af3926eeefb8f054e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetX")
    def reset_x(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetX", []))

    @jsii.member(jsii_name="resetY")
    def reset_y(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetY", []))

    @builtins.property
    @jsii.member(jsii_name="xInput")
    def x_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "xInput"))

    @builtins.property
    @jsii.member(jsii_name="yInput")
    def y_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "yInput"))

    @builtins.property
    @jsii.member(jsii_name="x")
    def x(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "x"))

    @x.setter
    def x(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5edb591bd8916840b430116c920de17e55db410c6f70eed43ce427a9d7d78d8d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "x", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="y")
    def y(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "y"))

    @y.setter
    def y(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf44ba98646c200b66b4ec2b9e614e767471eaa4b2ec633b0fca2db61e6cf983)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "y", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterestPolygon]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterestPolygon]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterestPolygon]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc0325fb580e63f127920108027dbb347e89f1199d9d1e77c8594ff7012d81d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettings",
    jsii_struct_bases=[],
    name_mapping={"connected_home": "connectedHome", "face_search": "faceSearch"},
)
class RekognitionStreamProcessorSettings:
    def __init__(
        self,
        *,
        connected_home: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorSettingsConnectedHome", typing.Dict[builtins.str, typing.Any]]]]] = None,
        face_search: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RekognitionStreamProcessorSettingsFaceSearch", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param connected_home: connected_home block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#connected_home RekognitionStreamProcessor#connected_home}
        :param face_search: face_search block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#face_search RekognitionStreamProcessor#face_search}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9da82aee6e63227d8fa713d26618cea5bec44b79d44b739190879a159415fdac)
            check_type(argname="argument connected_home", value=connected_home, expected_type=type_hints["connected_home"])
            check_type(argname="argument face_search", value=face_search, expected_type=type_hints["face_search"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if connected_home is not None:
            self._values["connected_home"] = connected_home
        if face_search is not None:
            self._values["face_search"] = face_search

    @builtins.property
    def connected_home(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorSettingsConnectedHome"]]]:
        '''connected_home block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#connected_home RekognitionStreamProcessor#connected_home}
        '''
        result = self._values.get("connected_home")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorSettingsConnectedHome"]]], result)

    @builtins.property
    def face_search(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorSettingsFaceSearch"]]]:
        '''face_search block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#face_search RekognitionStreamProcessor#face_search}
        '''
        result = self._values.get("face_search")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RekognitionStreamProcessorSettingsFaceSearch"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsConnectedHome",
    jsii_struct_bases=[],
    name_mapping={"labels": "labels", "min_confidence": "minConfidence"},
)
class RekognitionStreamProcessorSettingsConnectedHome:
    def __init__(
        self,
        *,
        labels: typing.Optional[typing.Sequence[builtins.str]] = None,
        min_confidence: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param labels: Specifies what you want to detect in the video, such as people, packages, or pets. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#labels RekognitionStreamProcessor#labels}
        :param min_confidence: The minimum confidence required to label an object in the video. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#min_confidence RekognitionStreamProcessor#min_confidence}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f74e94f93d8c9d3ec069dd17d9c9143f1061175e8aa6b8a4a84498713c19fd9)
            check_type(argname="argument labels", value=labels, expected_type=type_hints["labels"])
            check_type(argname="argument min_confidence", value=min_confidence, expected_type=type_hints["min_confidence"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if labels is not None:
            self._values["labels"] = labels
        if min_confidence is not None:
            self._values["min_confidence"] = min_confidence

    @builtins.property
    def labels(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Specifies what you want to detect in the video, such as people, packages, or pets.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#labels RekognitionStreamProcessor#labels}
        '''
        result = self._values.get("labels")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def min_confidence(self) -> typing.Optional[jsii.Number]:
        '''The minimum confidence required to label an object in the video.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#min_confidence RekognitionStreamProcessor#min_confidence}
        '''
        result = self._values.get("min_confidence")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorSettingsConnectedHome(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RekognitionStreamProcessorSettingsConnectedHomeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsConnectedHomeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2a8c602def8d61a1c9dcbae7d18abeda05f2e134d84e5a33f620791a7270eef4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorSettingsConnectedHomeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d1054d391f067df8cd40b76e658e44df0d4ea599e19352225d7c2963d0fc9fa)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorSettingsConnectedHomeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b8db83a709790222b475484472702ab567885b1196c1af8462d11ce11166119)
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
            type_hints = typing.get_type_hints(_typecheckingstub__684811c732ccaa36353ae93820fc59d08d78ceb7bc3c13a352418bd226f4a34c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__64abc03d63b706a96103fc59968a710285e4325320121fbfc9429f8f173719f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsConnectedHome]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsConnectedHome]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsConnectedHome]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7d3c07f83ccc8236e6efd74e45bfba5d0d979c6e7fab58cc05bf6b9ed80c065)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorSettingsConnectedHomeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsConnectedHomeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__61de0fb66e3033a9d6721881e8ff55f5761bdf8bdb21aefb517990ee1eb976c6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetLabels")
    def reset_labels(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLabels", []))

    @jsii.member(jsii_name="resetMinConfidence")
    def reset_min_confidence(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinConfidence", []))

    @builtins.property
    @jsii.member(jsii_name="labelsInput")
    def labels_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "labelsInput"))

    @builtins.property
    @jsii.member(jsii_name="minConfidenceInput")
    def min_confidence_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minConfidenceInput"))

    @builtins.property
    @jsii.member(jsii_name="labels")
    def labels(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "labels"))

    @labels.setter
    def labels(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f034cb53d4825f41072de9d02e762c49b5329a7c58a667e1ef0cec849cb2716)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "labels", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minConfidence")
    def min_confidence(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minConfidence"))

    @min_confidence.setter
    def min_confidence(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8077af76e8aa720ac5b0d2c55074e1c116238f4017decf56a6995d35b7a5ec37)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minConfidence", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettingsConnectedHome]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettingsConnectedHome]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettingsConnectedHome]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df423a61c5774a8c66b2035f2bdbb1efbd6667845c61be02bd4045964de097e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsFaceSearch",
    jsii_struct_bases=[],
    name_mapping={
        "collection_id": "collectionId",
        "face_match_threshold": "faceMatchThreshold",
    },
)
class RekognitionStreamProcessorSettingsFaceSearch:
    def __init__(
        self,
        *,
        collection_id: builtins.str,
        face_match_threshold: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param collection_id: The ID of a collection that contains faces that you want to search for. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#collection_id RekognitionStreamProcessor#collection_id}
        :param face_match_threshold: Minimum face match confidence score that must be met to return a result for a recognized face. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#face_match_threshold RekognitionStreamProcessor#face_match_threshold}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__464e726b6c8f1f5856632977674279d71ee1c9a9f8fb2a4be8901007fc91a039)
            check_type(argname="argument collection_id", value=collection_id, expected_type=type_hints["collection_id"])
            check_type(argname="argument face_match_threshold", value=face_match_threshold, expected_type=type_hints["face_match_threshold"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "collection_id": collection_id,
        }
        if face_match_threshold is not None:
            self._values["face_match_threshold"] = face_match_threshold

    @builtins.property
    def collection_id(self) -> builtins.str:
        '''The ID of a collection that contains faces that you want to search for.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#collection_id RekognitionStreamProcessor#collection_id}
        '''
        result = self._values.get("collection_id")
        assert result is not None, "Required property 'collection_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def face_match_threshold(self) -> typing.Optional[jsii.Number]:
        '''Minimum face match confidence score that must be met to return a result for a recognized face.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#face_match_threshold RekognitionStreamProcessor#face_match_threshold}
        '''
        result = self._values.get("face_match_threshold")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorSettingsFaceSearch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RekognitionStreamProcessorSettingsFaceSearchList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsFaceSearchList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4b325aa0f3f720947a89297a64fd8ef4809940320bd83589b79ee20daada702a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorSettingsFaceSearchOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__89724708ba0a4e8c09593a968a90d54a45ec6bc98903261dc12be04b1f6c3a09)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorSettingsFaceSearchOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b4a30f9e115ef1bf41b6406a60c08a281c6c1b0c099eb29077e8f4e76584243)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4fe85b4099c1a40c4145b04c8364fe8406bbcd932104172a070e63336c8abdf2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__74787cfef2574f28f72018333998dd049b94e97c1ce4b5259c3fa829e292dff0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsFaceSearch]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsFaceSearch]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsFaceSearch]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__975f9a19a3547ff3c4d4942e9ef8729468e39dfeb35f1ddcabaeec108a512e2d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorSettingsFaceSearchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsFaceSearchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__40c8f780bcf3114bc6e754560dbfeeed85c304d17b416787341a5da8d896cda8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetFaceMatchThreshold")
    def reset_face_match_threshold(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFaceMatchThreshold", []))

    @builtins.property
    @jsii.member(jsii_name="collectionIdInput")
    def collection_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "collectionIdInput"))

    @builtins.property
    @jsii.member(jsii_name="faceMatchThresholdInput")
    def face_match_threshold_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "faceMatchThresholdInput"))

    @builtins.property
    @jsii.member(jsii_name="collectionId")
    def collection_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "collectionId"))

    @collection_id.setter
    def collection_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__994e62fa8e3bb936995765e8c7d511127231935e27a7c0212f746773a08ebf80)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "collectionId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="faceMatchThreshold")
    def face_match_threshold(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "faceMatchThreshold"))

    @face_match_threshold.setter
    def face_match_threshold(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85be2edee4937066961e4f83542c71f4984d443d1b5dbc476d12799c32e0f6e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "faceMatchThreshold", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettingsFaceSearch]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettingsFaceSearch]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettingsFaceSearch]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6fe567fed6a0a32a5265fda2e4939fc228e341a34a9038bd41da49268bfa2812)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorSettingsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a84ed9882005f1e6f010bd7135a720c17e4a70011b57e9da1204cc0a1d9b9558)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "RekognitionStreamProcessorSettingsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d840ecf1f9ec226bce0eb155d2f607e2a8e8db3f0900e9fd4c761af860207987)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RekognitionStreamProcessorSettingsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cbbc328179746adbf814afe38df324f3fd831eded357fb714aac93cca8450ff2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__172f7492495a2ee3dfc583d2eb87dd1f678d6e1244638cefc838abf41eec6b5b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5acf8d533f4e06bd35fa60787837fae6e6823f69ae1527619272d96fb7427f1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettings]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettings]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dae1740b00171d8346f3ee7832137c7c3d7ed9a6512a702f2992c595fa9950ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RekognitionStreamProcessorSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__46838c58ec00443d29b516aacc464fd003cc7905c89ee4a8d07fd012a81ea3ad)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putConnectedHome")
    def put_connected_home(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorSettingsConnectedHome, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__80bf2cde6032e9f965b482a27d0096939d90b5608d3f4170d41c29b3f3f26beb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putConnectedHome", [value]))

    @jsii.member(jsii_name="putFaceSearch")
    def put_face_search(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorSettingsFaceSearch, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b016b048a08f698aaa5ee3f43e5cbf64919b7fd8d3436c2f213d2dfa8aaaa5c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFaceSearch", [value]))

    @jsii.member(jsii_name="resetConnectedHome")
    def reset_connected_home(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConnectedHome", []))

    @jsii.member(jsii_name="resetFaceSearch")
    def reset_face_search(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFaceSearch", []))

    @builtins.property
    @jsii.member(jsii_name="connectedHome")
    def connected_home(self) -> RekognitionStreamProcessorSettingsConnectedHomeList:
        return typing.cast(RekognitionStreamProcessorSettingsConnectedHomeList, jsii.get(self, "connectedHome"))

    @builtins.property
    @jsii.member(jsii_name="faceSearch")
    def face_search(self) -> RekognitionStreamProcessorSettingsFaceSearchList:
        return typing.cast(RekognitionStreamProcessorSettingsFaceSearchList, jsii.get(self, "faceSearch"))

    @builtins.property
    @jsii.member(jsii_name="connectedHomeInput")
    def connected_home_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsConnectedHome]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsConnectedHome]]], jsii.get(self, "connectedHomeInput"))

    @builtins.property
    @jsii.member(jsii_name="faceSearchInput")
    def face_search_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsFaceSearch]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsFaceSearch]]], jsii.get(self, "faceSearchInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettings]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettings]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettings]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a714522906a64b6faf6fc9d47386c4412a187fd94760ee32f99a470d5cce595)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class RekognitionStreamProcessorTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#create RekognitionStreamProcessor#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#delete RekognitionStreamProcessor#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#update RekognitionStreamProcessor#update}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41945d7c1a6d5e58c15926b5e412a9d6005a04b1b7ae15d0c60eaa74b998c57c)
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

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#create RekognitionStreamProcessor#create}
        '''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#delete RekognitionStreamProcessor#delete}
        '''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#update RekognitionStreamProcessor#update}
        '''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RekognitionStreamProcessorTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RekognitionStreamProcessorTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rekognitionStreamProcessor.RekognitionStreamProcessorTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ffd010e5d136cefb54525d05ad148f435b0dc5fb436324e811e9b9db2d73db1f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d929efcac21ee131303508d1ba73ca461f5ffb766a75744277fc215c503c45ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78ce04cb6637a5fef243ceb1ffbb5129bb03672d97eb48082dd605178ac7b24e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24863dec1eea29ec9e970f82e52a49f402dc4d917429a10619722ae1354611c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6302480bbabf4448f0a19387d83f85ecaf854209297edd2517ce68f0165eb46e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "RekognitionStreamProcessor",
    "RekognitionStreamProcessorConfig",
    "RekognitionStreamProcessorDataSharingPreference",
    "RekognitionStreamProcessorDataSharingPreferenceList",
    "RekognitionStreamProcessorDataSharingPreferenceOutputReference",
    "RekognitionStreamProcessorInput",
    "RekognitionStreamProcessorInputKinesisVideoStream",
    "RekognitionStreamProcessorInputKinesisVideoStreamList",
    "RekognitionStreamProcessorInputKinesisVideoStreamOutputReference",
    "RekognitionStreamProcessorInputList",
    "RekognitionStreamProcessorInputOutputReference",
    "RekognitionStreamProcessorNotificationChannel",
    "RekognitionStreamProcessorNotificationChannelList",
    "RekognitionStreamProcessorNotificationChannelOutputReference",
    "RekognitionStreamProcessorOutput",
    "RekognitionStreamProcessorOutputKinesisDataStream",
    "RekognitionStreamProcessorOutputKinesisDataStreamList",
    "RekognitionStreamProcessorOutputKinesisDataStreamOutputReference",
    "RekognitionStreamProcessorOutputList",
    "RekognitionStreamProcessorOutputOutputReference",
    "RekognitionStreamProcessorOutputS3Destination",
    "RekognitionStreamProcessorOutputS3DestinationList",
    "RekognitionStreamProcessorOutputS3DestinationOutputReference",
    "RekognitionStreamProcessorRegionsOfInterest",
    "RekognitionStreamProcessorRegionsOfInterestBoundingBox",
    "RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference",
    "RekognitionStreamProcessorRegionsOfInterestList",
    "RekognitionStreamProcessorRegionsOfInterestOutputReference",
    "RekognitionStreamProcessorRegionsOfInterestPolygon",
    "RekognitionStreamProcessorRegionsOfInterestPolygonList",
    "RekognitionStreamProcessorRegionsOfInterestPolygonOutputReference",
    "RekognitionStreamProcessorSettings",
    "RekognitionStreamProcessorSettingsConnectedHome",
    "RekognitionStreamProcessorSettingsConnectedHomeList",
    "RekognitionStreamProcessorSettingsConnectedHomeOutputReference",
    "RekognitionStreamProcessorSettingsFaceSearch",
    "RekognitionStreamProcessorSettingsFaceSearchList",
    "RekognitionStreamProcessorSettingsFaceSearchOutputReference",
    "RekognitionStreamProcessorSettingsList",
    "RekognitionStreamProcessorSettingsOutputReference",
    "RekognitionStreamProcessorTimeouts",
    "RekognitionStreamProcessorTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__235738e9758cd8ee4a3c057c719d0c02cd137b736c198539d35a6cbbe487f19b(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    name: builtins.str,
    role_arn: builtins.str,
    data_sharing_preference: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorDataSharingPreference, typing.Dict[builtins.str, typing.Any]]]]] = None,
    input: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorInput, typing.Dict[builtins.str, typing.Any]]]]] = None,
    kms_key_id: typing.Optional[builtins.str] = None,
    notification_channel: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorNotificationChannel, typing.Dict[builtins.str, typing.Any]]]]] = None,
    output: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorOutput, typing.Dict[builtins.str, typing.Any]]]]] = None,
    regions_of_interest: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorRegionsOfInterest, typing.Dict[builtins.str, typing.Any]]]]] = None,
    settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorSettings, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[RekognitionStreamProcessorTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__13c208a1e4284c916ff0e62520f612a9da46bbc35fedbf628ea5c7cbbdb6dc5f(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57a0ac3b2fd81ce935b1c5e0951ab2ed0430be2f735f66fdb2943e72f07b2cec(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorDataSharingPreference, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ab053dec91f35298441c32f7251ae15d7b1724318af5ea01e22d4bf40e7e062(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorInput, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eed3658c0d3b23200c73e26cc9d4b83f279d69ad51848d05955c6ab1106728dd(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorNotificationChannel, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13a701f92c8789ef9756af2d02a225bbbb57c680d53d79dd23ae07348f58f391(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorOutput, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ddf8cc0f023bb5f941a8ccde2033a13d5921064a597fc31b475ea7ebecc92ea(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorRegionsOfInterest, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fcd2bc30044939c29c0af02796d24790a201284802c37e4e7e89b3ff0fc13779(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorSettings, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8092b76fa590d79b3f57fcc5a2598d6a41caa1421496e2676028719d756751d1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__232be9eaf76df87c21675e23cbde96415ec5485a8c4c177e4150051472ea39f1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08d1a8c549fe80219aa8c64e90830ba409c65e483b42d311997575090096a2ed(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c018311db6c0c89e5df42fd72458e9447a42e6cc6c947ceecf92ca37500f8884(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d1a6a790f71dfde358af8a3f9d934de1502c2ea7e2edaef5fef550de707bf33(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    name: builtins.str,
    role_arn: builtins.str,
    data_sharing_preference: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorDataSharingPreference, typing.Dict[builtins.str, typing.Any]]]]] = None,
    input: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorInput, typing.Dict[builtins.str, typing.Any]]]]] = None,
    kms_key_id: typing.Optional[builtins.str] = None,
    notification_channel: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorNotificationChannel, typing.Dict[builtins.str, typing.Any]]]]] = None,
    output: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorOutput, typing.Dict[builtins.str, typing.Any]]]]] = None,
    regions_of_interest: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorRegionsOfInterest, typing.Dict[builtins.str, typing.Any]]]]] = None,
    settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorSettings, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[RekognitionStreamProcessorTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7fdf709ae12c1df6c8d7e3cc4eee8e76fe1cbb1c0101f15f0ee7a9b75c45d4d7(
    *,
    opt_in: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e0a1c257d79059a6a1fb180d20116b771c539fa835425511410cae71109c937(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6896290bcf335e652cc037b54b96817092d6b82fb6ccfaeabbf661afaf86bf4f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07d675159a3104138e198ea23a8e8b5a03a3ab5b291ec1c138492c99c047e342(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9e6c433401460605ee0fe003edd4b84dfd07bcd2849835c72be96da13643541(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ddfc12e5427b4185ab3fe6ffbe7e4479c55b6df43e785138bd96e0efa1f8273(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0af562749e0343766c6ec8aca49695c7f5c1a252b26d5abe828622bb41d9f5ff(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorDataSharingPreference]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99351ba6857ee05f2505a295984a5dbc6beceb61467449a6f8d7bbb9f1ed8e5d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3173cc776a878ff3422aced4e612b3525c1c8ce31e95fbb9738dcca2371eeefb(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__419d415a79a6e8e0817c9eb75d12adfb3f8ed91a05ae1fb58388e3497cfbae6d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorDataSharingPreference]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85004db3c5cc4d0ac5085e6681c456e7c1db451503a80aae099ee84a973eda19(
    *,
    kinesis_video_stream: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorInputKinesisVideoStream, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c104946af6c40860da05cb87b59a3d7c0cc9d4f31561c3a9aa2fc1032e1c747(
    *,
    arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93de3ffe45083935ae2c1728e872f88efc73a6868c410ee24c8f014e29826d56(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea557c62768784f5394b71813ed0b3ec16943737d23d85849b4fce1ed0c7ffc9(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77da5e497472ee81f0b86fc1783e63a91e7f32f8c8d708d87cfc1957c1cbb31a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6486d8c34fbebbac7cd642d0a5b5e3ef4e81d7a45e9571c0086e31e5d09d919(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__259dfff30135bc54ad9663713ee544a5a661ca7d1db4cedcb763fc968d9064e9(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc328b53bf7051b7bb5ca5b9d604ad45016a2b2bf5cedf7d7f46628c4334c48a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorInputKinesisVideoStream]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35b9711dcfbcb53568ba23e76c9bb9e53a82ab53a97da17eceed14bccc3ca183(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2fb77a5ccf9f4de8751cdec2ec770925ccd47d45f7153fa6369c8712d424fbb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64a37817101f57a4af73ff459d67c310e77a078770aacef068978419f9af5039(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorInputKinesisVideoStream]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f5c5a5847aec40c5fe3df8deb122428db2128dab72dbe5bb9a5235fe42bdf0c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd66ad980bb5100a5d57a302f546958a146311b690a3d7a57e8aee6bfaff8b00(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b356967ce3978072f7dea863d1faaca679709499edde8eed66fce46366cee71a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5df91f99eab8696605b5a29d0a1b2ce7ffcf76d6c2239f88671f3098e1826c96(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18d52a2908bf1518e2cf3e63a6df67c35f56b450d867ceef75b83657a44d1915(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__994aeb8796a4b7bd76bb1773c24020ea23bff8f44302e55eaa9dcd60b811eb6f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorInput]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__885d36e351cc0f945f87b0a0f61106e9b4ab687cd1ce6a2a010950091270d531(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e19ac1b87930b36b6e2166381b938db936d934d7fcc4574c783742bbd509757(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorInputKinesisVideoStream, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a68c16d143d4a716ac0b461f7dd7bcc3fa0dbdbe28d4138a226d09499af66eb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorInput]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e70e40cba2afccc26942c2676801e613de13644a5bdfbe447fcd2f7182f14dea(
    *,
    sns_topic_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92886857c14efb77fa40ee3e9d5ff77e701763e3d4efadf5fcf1cfd521028694(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a73f73ec3337bb9cf4ea2ace6b5bbf936dedb6f4dfdc80c3163b9d5f1836ed7(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc32000010b6129ed656c06ab229fd1ee8dbd5bf31d06bf82f18b007d2290981(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4775076ab47bdb57fca3ed75e9b761c824e726031142ee4e4515bae4df03d94c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a725da5323dac8c87252c6550d78aeeeec3ab21b0f8370dad3b585f611677257(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fee6f9e9cacfed5637ea63548622c6562d157a8c64f732dac0c977bb195579e7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorNotificationChannel]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f50a6a55c967749e38a1019d94af67062521ca38b334454672d552fc77e7d685(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10947259f9012d0b9cbb8dba692a6e01452b2e0b8bd3919c0f469fbd963a3505(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37fa19da0f879cef5c735baa0aedd16144b6df24e53e04766b7e21d95ae443c2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorNotificationChannel]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a164cba6fca1bb062445079c1c5184cdea882c4cb33ddca66f918f832efa0f43(
    *,
    kinesis_data_stream: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorOutputKinesisDataStream, typing.Dict[builtins.str, typing.Any]]]]] = None,
    s3_destination: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorOutputS3Destination, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d627e52f9a3f96c7a3874cf8ee4fe73c2bac229f2527c3ac0f24fe75f4f3caae(
    *,
    arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da5c4577ce518924b04ddb280b4c67aa0581b5b176b2b2a02564d9f8cd3588b2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43dcfbf492e148f5c96518d86ca6ca393c1773fc898fab6e6defbc48df031c33(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__acaaf3f41918cc96f3f1499a7dc9a3bc76ba6275440ef9d44974726568e78a53(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d26b482836a78d103de22e02862f140fee5936dfd5d8f3c4236d346faf733cb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7184782611e196e46aa91ce12f0311565f3c64e2e41705e854c6d27f89cfe062(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52513a7c36c57400edd1b0560a3f6fc39c4065edc3b1999dd4a062266443c899(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutputKinesisDataStream]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6745ed0ab2d41f87df5bdef6dd5f1754533f706437a8403bca62c6170f36d769(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43e1aef442596e8e9c085adea749f019e45f5e785ab4eb02b1dbbcac05231ba7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e52930f60a2dce5958875e6b72bf459054aa02e75fa127ef7d3b973e1d591e4f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutputKinesisDataStream]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d75744573d393f067c2c0f08d56d63f725316d7f34de1285eb9336dd8e143901(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c730a93161e57a7a1eeec9879083aa4c5ff2631f8aefa89094e935c939814d76(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25f4d68631fbb60cc5f64511eb7d873f725e7b47b727d610ab63b118be8a6621(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04e9c8114e44f11b26aff1ca07d63d06ebfedeaff498ee8a11ab125fc1f849af(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0790d4506992ec8aa4e12304d02605ce4d027d37138fa1574b5fb1017a86179(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad0394a13c79de08976cab7c19a52921bad69dd4c9cd6a0369bba78425d25d33(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutput]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95b10224b92848a020eedfaa1695a6e942bc7f807f56dc35e66cb0797fa865e8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__337485064f6b87f1c49105418c3d92fefdd49c1d55b33fe4fefb5b7e66cae3d6(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorOutputKinesisDataStream, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15e81c0859b46e67671818aeffa6ba577584984e20029a3721e41404e84dddc1(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorOutputS3Destination, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e33517992c2b526d88a7ab473b5c0be64a8d0814021c7cce3327218d8b8d263b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutput]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61018b3e80f76515460a62194a2cb8069e49f8967ce31d3a0efd3126b1154a13(
    *,
    bucket: typing.Optional[builtins.str] = None,
    key_prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__982feff828b6017753818ab6bf87b897502b1fd67244c50faed0ccce9c8e2319(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2897d4d9abccefabceedf88276a8b4d7e67fa9886c5302aa073c048468e7915(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7841831fefab4c9199858348d64827e7b11d9486ea27dbfff0711ab51adb8ad4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64a3b0fda221a295078a83273a58afe8c77103c896e7fcb653ec61e16587da6b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1321ba605c251b0db761902d52e217a1ad8480543a15fec4b81941b768d8a82(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c68cee3507926dfebab36c203511ba450dc65a7cc393796a44fc1760399f6b8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorOutputS3Destination]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b12aa01961d83c00af64773098135c626384e30d8d41301beb0d1cbe304497d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c8473850bdce608d6bd0b0153b303a6e944574fe67fa8a8df82ae6093bf5164(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4e3631e6ea3a36313389f3be0ccac413593a138349bdeb2e67876379ca415a8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a08feef16946bc7f7ed7ab005fcf351625c2043cceab5f4b27111154c8f1b10(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorOutputS3Destination]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0423c62908892e5280c2e6baccdd398b157d1e10c60db49a468934aa72bcc27e(
    *,
    bounding_box: typing.Optional[typing.Union[RekognitionStreamProcessorRegionsOfInterestBoundingBox, typing.Dict[builtins.str, typing.Any]]] = None,
    polygon: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorRegionsOfInterestPolygon, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58ca87d812c372856bab505c3ba82b16dfd1cd7def2bb1c615801ead207b9d1a(
    *,
    height: typing.Optional[jsii.Number] = None,
    left: typing.Optional[jsii.Number] = None,
    top: typing.Optional[jsii.Number] = None,
    width: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32a32094266b946a38189bb2d8853e2138155867cb2df58d53dc558743405ba3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d669672dd06a3ab242e5ecf1ee900098592440818cb5c05671ce27941374758f(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a4d15484d2bb1cf19f5e9681b5393fd7021ff7dbb62ffac804428e7335bc750(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c68d93858afc5514c03a2ae2ca6f7d010c915b447c25b12edae3f88e6c6b5ac5(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ad2063e363cf3a88dc5dfbf85589e3e324cf3bffae5689e21c79e6d32d2d314(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4362ff6221aa7c6463656bab9e57dc08e5e5add670bff84c58bd9dc8bfb83fbb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterestBoundingBox]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be2579315d15ba1918b6a406890160c6b9e6df466a289288611a54d690487762(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e5e4731ca1addf07868fab182dfb368d2f853eee1e2d320ba6129923ec2b8c2(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc73f6f963d0de506c7275ad58134ac92d8ba4a6a0313082ff457ce3340dfee5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7abb6e2a21a070c10add77fc25b67a3375848ece3de6900fd763c1a50385fcf2(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b99f6dd4238be5f374b7b5e480dfcf19e19b4cf98a4b6ac22235e9c30707a609(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3ee7f21256005fcc048e2a5c3a0885794d107f296de095609205e77eb1dd960(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorRegionsOfInterest]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__877a8f593f46b682958789f84ff3d8c419e8ba68e77cd41910e3faf6c44e6306(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__666b1466ca829acf2e92cc97e5f08c0a6395ef8b9362043bf7f990f522302658(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorRegionsOfInterestPolygon, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32c700c9c3450c088f6b31b630928ab676ee74361805a5648e7c3993e20c1216(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterest]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32a69be62a551a21fac84574e154c6332852ead9f6d3da21f344010da7809db3(
    *,
    x: typing.Optional[jsii.Number] = None,
    y: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e376b99ae2ee51e8be46f413fb8829685954756b13d22abe8df1129cca3c0ed5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac97d5bd06e2bcaa1def5b638adc2c0beca41f2d7e88dc2101c321f3b337d99c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b0a122281fd33605dde85d1ef6639e953ec2424ed6694fa100d4fddf490f0fd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__427cf0914d8897297ada49d7e2591cb296aeaebeaabdc5505f13c2f7926ed82c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__922ab2a053990e476f1d4f932927a506b999db8293b43c5b665866967c4c0a53(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8dde75ee75b3bec60aaf5a7d36dbf65786f7322e332e6651f986c6c0f88681b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorRegionsOfInterestPolygon]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5df7ca5f5aee0d62889030386abe542b95a9878c7293c69af3926eeefb8f054e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5edb591bd8916840b430116c920de17e55db410c6f70eed43ce427a9d7d78d8d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf44ba98646c200b66b4ec2b9e614e767471eaa4b2ec633b0fca2db61e6cf983(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc0325fb580e63f127920108027dbb347e89f1199d9d1e77c8594ff7012d81d9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorRegionsOfInterestPolygon]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9da82aee6e63227d8fa713d26618cea5bec44b79d44b739190879a159415fdac(
    *,
    connected_home: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorSettingsConnectedHome, typing.Dict[builtins.str, typing.Any]]]]] = None,
    face_search: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorSettingsFaceSearch, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f74e94f93d8c9d3ec069dd17d9c9143f1061175e8aa6b8a4a84498713c19fd9(
    *,
    labels: typing.Optional[typing.Sequence[builtins.str]] = None,
    min_confidence: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a8c602def8d61a1c9dcbae7d18abeda05f2e134d84e5a33f620791a7270eef4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d1054d391f067df8cd40b76e658e44df0d4ea599e19352225d7c2963d0fc9fa(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b8db83a709790222b475484472702ab567885b1196c1af8462d11ce11166119(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__684811c732ccaa36353ae93820fc59d08d78ceb7bc3c13a352418bd226f4a34c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64abc03d63b706a96103fc59968a710285e4325320121fbfc9429f8f173719f0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7d3c07f83ccc8236e6efd74e45bfba5d0d979c6e7fab58cc05bf6b9ed80c065(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsConnectedHome]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61de0fb66e3033a9d6721881e8ff55f5761bdf8bdb21aefb517990ee1eb976c6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f034cb53d4825f41072de9d02e762c49b5329a7c58a667e1ef0cec849cb2716(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8077af76e8aa720ac5b0d2c55074e1c116238f4017decf56a6995d35b7a5ec37(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df423a61c5774a8c66b2035f2bdbb1efbd6667845c61be02bd4045964de097e4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettingsConnectedHome]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__464e726b6c8f1f5856632977674279d71ee1c9a9f8fb2a4be8901007fc91a039(
    *,
    collection_id: builtins.str,
    face_match_threshold: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b325aa0f3f720947a89297a64fd8ef4809940320bd83589b79ee20daada702a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__89724708ba0a4e8c09593a968a90d54a45ec6bc98903261dc12be04b1f6c3a09(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b4a30f9e115ef1bf41b6406a60c08a281c6c1b0c099eb29077e8f4e76584243(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4fe85b4099c1a40c4145b04c8364fe8406bbcd932104172a070e63336c8abdf2(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74787cfef2574f28f72018333998dd049b94e97c1ce4b5259c3fa829e292dff0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__975f9a19a3547ff3c4d4942e9ef8729468e39dfeb35f1ddcabaeec108a512e2d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettingsFaceSearch]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40c8f780bcf3114bc6e754560dbfeeed85c304d17b416787341a5da8d896cda8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__994e62fa8e3bb936995765e8c7d511127231935e27a7c0212f746773a08ebf80(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85be2edee4937066961e4f83542c71f4984d443d1b5dbc476d12799c32e0f6e9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fe567fed6a0a32a5265fda2e4939fc228e341a34a9038bd41da49268bfa2812(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettingsFaceSearch]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a84ed9882005f1e6f010bd7135a720c17e4a70011b57e9da1204cc0a1d9b9558(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d840ecf1f9ec226bce0eb155d2f607e2a8e8db3f0900e9fd4c761af860207987(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbbc328179746adbf814afe38df324f3fd831eded357fb714aac93cca8450ff2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__172f7492495a2ee3dfc583d2eb87dd1f678d6e1244638cefc838abf41eec6b5b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5acf8d533f4e06bd35fa60787837fae6e6823f69ae1527619272d96fb7427f1c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dae1740b00171d8346f3ee7832137c7c3d7ed9a6512a702f2992c595fa9950ff(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RekognitionStreamProcessorSettings]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46838c58ec00443d29b516aacc464fd003cc7905c89ee4a8d07fd012a81ea3ad(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__80bf2cde6032e9f965b482a27d0096939d90b5608d3f4170d41c29b3f3f26beb(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorSettingsConnectedHome, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b016b048a08f698aaa5ee3f43e5cbf64919b7fd8d3436c2f213d2dfa8aaaa5c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RekognitionStreamProcessorSettingsFaceSearch, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a714522906a64b6faf6fc9d47386c4412a187fd94760ee32f99a470d5cce595(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorSettings]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41945d7c1a6d5e58c15926b5e412a9d6005a04b1b7ae15d0c60eaa74b998c57c(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ffd010e5d136cefb54525d05ad148f435b0dc5fb436324e811e9b9db2d73db1f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d929efcac21ee131303508d1ba73ca461f5ffb766a75744277fc215c503c45ec(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78ce04cb6637a5fef243ceb1ffbb5129bb03672d97eb48082dd605178ac7b24e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24863dec1eea29ec9e970f82e52a49f402dc4d917429a10619722ae1354611c6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6302480bbabf4448f0a19387d83f85ecaf854209297edd2517ce68f0165eb46e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RekognitionStreamProcessorTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
