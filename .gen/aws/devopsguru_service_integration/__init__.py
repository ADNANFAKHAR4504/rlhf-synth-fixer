r'''
# `aws_devopsguru_service_integration`

Refer to the Terraform Registry for docs: [`aws_devopsguru_service_integration`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration).
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


class DevopsguruServiceIntegration(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegration",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration aws_devopsguru_service_integration}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        kms_server_side_encryption: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DevopsguruServiceIntegrationKmsServerSideEncryption", typing.Dict[builtins.str, typing.Any]]]]] = None,
        logs_anomaly_detection: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DevopsguruServiceIntegrationLogsAnomalyDetection", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ops_center: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DevopsguruServiceIntegrationOpsCenter", typing.Dict[builtins.str, typing.Any]]]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration aws_devopsguru_service_integration} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param kms_server_side_encryption: kms_server_side_encryption block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_server_side_encryption DevopsguruServiceIntegration#kms_server_side_encryption}
        :param logs_anomaly_detection: logs_anomaly_detection block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#logs_anomaly_detection DevopsguruServiceIntegration#logs_anomaly_detection}
        :param ops_center: ops_center block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#ops_center DevopsguruServiceIntegration#ops_center}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__17c38f80d9b09d0be1206207123beafc7b011b70c53fd5a842c819b6c51c5ff6)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = DevopsguruServiceIntegrationConfig(
            kms_server_side_encryption=kms_server_side_encryption,
            logs_anomaly_detection=logs_anomaly_detection,
            ops_center=ops_center,
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
        '''Generates CDKTF code for importing a DevopsguruServiceIntegration resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the DevopsguruServiceIntegration to import.
        :param import_from_id: The id of the existing DevopsguruServiceIntegration that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the DevopsguruServiceIntegration to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09581bde90021afc60caa8cdb7bc254f2b93808ea605425316ee98b9e2b83696)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putKmsServerSideEncryption")
    def put_kms_server_side_encryption(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DevopsguruServiceIntegrationKmsServerSideEncryption", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ceac254b2b61c8fefc32abf08a89890751717f85f5036effb9a1f61e718a74bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putKmsServerSideEncryption", [value]))

    @jsii.member(jsii_name="putLogsAnomalyDetection")
    def put_logs_anomaly_detection(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DevopsguruServiceIntegrationLogsAnomalyDetection", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__322aa32eecd43a6eed6821f9f452b2b619c2c81f35075f5ff4e7b21bf7348ac8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLogsAnomalyDetection", [value]))

    @jsii.member(jsii_name="putOpsCenter")
    def put_ops_center(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DevopsguruServiceIntegrationOpsCenter", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c92ba15e3e1837bfba0993c52a55076de39fae3891473d08ca624612c2dc9f20)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putOpsCenter", [value]))

    @jsii.member(jsii_name="resetKmsServerSideEncryption")
    def reset_kms_server_side_encryption(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKmsServerSideEncryption", []))

    @jsii.member(jsii_name="resetLogsAnomalyDetection")
    def reset_logs_anomaly_detection(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLogsAnomalyDetection", []))

    @jsii.member(jsii_name="resetOpsCenter")
    def reset_ops_center(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOpsCenter", []))

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
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="kmsServerSideEncryption")
    def kms_server_side_encryption(
        self,
    ) -> "DevopsguruServiceIntegrationKmsServerSideEncryptionList":
        return typing.cast("DevopsguruServiceIntegrationKmsServerSideEncryptionList", jsii.get(self, "kmsServerSideEncryption"))

    @builtins.property
    @jsii.member(jsii_name="logsAnomalyDetection")
    def logs_anomaly_detection(
        self,
    ) -> "DevopsguruServiceIntegrationLogsAnomalyDetectionList":
        return typing.cast("DevopsguruServiceIntegrationLogsAnomalyDetectionList", jsii.get(self, "logsAnomalyDetection"))

    @builtins.property
    @jsii.member(jsii_name="opsCenter")
    def ops_center(self) -> "DevopsguruServiceIntegrationOpsCenterList":
        return typing.cast("DevopsguruServiceIntegrationOpsCenterList", jsii.get(self, "opsCenter"))

    @builtins.property
    @jsii.member(jsii_name="kmsServerSideEncryptionInput")
    def kms_server_side_encryption_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationKmsServerSideEncryption"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationKmsServerSideEncryption"]]], jsii.get(self, "kmsServerSideEncryptionInput"))

    @builtins.property
    @jsii.member(jsii_name="logsAnomalyDetectionInput")
    def logs_anomaly_detection_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationLogsAnomalyDetection"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationLogsAnomalyDetection"]]], jsii.get(self, "logsAnomalyDetectionInput"))

    @builtins.property
    @jsii.member(jsii_name="opsCenterInput")
    def ops_center_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationOpsCenter"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationOpsCenter"]]], jsii.get(self, "opsCenterInput"))


@jsii.data_type(
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "kms_server_side_encryption": "kmsServerSideEncryption",
        "logs_anomaly_detection": "logsAnomalyDetection",
        "ops_center": "opsCenter",
    },
)
class DevopsguruServiceIntegrationConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        kms_server_side_encryption: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DevopsguruServiceIntegrationKmsServerSideEncryption", typing.Dict[builtins.str, typing.Any]]]]] = None,
        logs_anomaly_detection: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DevopsguruServiceIntegrationLogsAnomalyDetection", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ops_center: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["DevopsguruServiceIntegrationOpsCenter", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param kms_server_side_encryption: kms_server_side_encryption block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_server_side_encryption DevopsguruServiceIntegration#kms_server_side_encryption}
        :param logs_anomaly_detection: logs_anomaly_detection block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#logs_anomaly_detection DevopsguruServiceIntegration#logs_anomaly_detection}
        :param ops_center: ops_center block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#ops_center DevopsguruServiceIntegration#ops_center}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c44d1c87611705fd2c8cbb105ae81f09045e3fa1efc470fbec1346666e81d0f1)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument kms_server_side_encryption", value=kms_server_side_encryption, expected_type=type_hints["kms_server_side_encryption"])
            check_type(argname="argument logs_anomaly_detection", value=logs_anomaly_detection, expected_type=type_hints["logs_anomaly_detection"])
            check_type(argname="argument ops_center", value=ops_center, expected_type=type_hints["ops_center"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
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
        if kms_server_side_encryption is not None:
            self._values["kms_server_side_encryption"] = kms_server_side_encryption
        if logs_anomaly_detection is not None:
            self._values["logs_anomaly_detection"] = logs_anomaly_detection
        if ops_center is not None:
            self._values["ops_center"] = ops_center

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
    def kms_server_side_encryption(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationKmsServerSideEncryption"]]]:
        '''kms_server_side_encryption block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_server_side_encryption DevopsguruServiceIntegration#kms_server_side_encryption}
        '''
        result = self._values.get("kms_server_side_encryption")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationKmsServerSideEncryption"]]], result)

    @builtins.property
    def logs_anomaly_detection(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationLogsAnomalyDetection"]]]:
        '''logs_anomaly_detection block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#logs_anomaly_detection DevopsguruServiceIntegration#logs_anomaly_detection}
        '''
        result = self._values.get("logs_anomaly_detection")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationLogsAnomalyDetection"]]], result)

    @builtins.property
    def ops_center(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationOpsCenter"]]]:
        '''ops_center block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#ops_center DevopsguruServiceIntegration#ops_center}
        '''
        result = self._values.get("ops_center")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["DevopsguruServiceIntegrationOpsCenter"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DevopsguruServiceIntegrationConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationKmsServerSideEncryption",
    jsii_struct_bases=[],
    name_mapping={
        "kms_key_id": "kmsKeyId",
        "opt_in_status": "optInStatus",
        "type": "type",
    },
)
class DevopsguruServiceIntegrationKmsServerSideEncryption:
    def __init__(
        self,
        *,
        kms_key_id: typing.Optional[builtins.str] = None,
        opt_in_status: typing.Optional[builtins.str] = None,
        type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_key_id DevopsguruServiceIntegration#kms_key_id}.
        :param opt_in_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#opt_in_status DevopsguruServiceIntegration#opt_in_status}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#type DevopsguruServiceIntegration#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__824cae3d85e34f465e71ff79a83a1db1f7ddefcb0189c151b9270ba3ac918f81)
            check_type(argname="argument kms_key_id", value=kms_key_id, expected_type=type_hints["kms_key_id"])
            check_type(argname="argument opt_in_status", value=opt_in_status, expected_type=type_hints["opt_in_status"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if kms_key_id is not None:
            self._values["kms_key_id"] = kms_key_id
        if opt_in_status is not None:
            self._values["opt_in_status"] = opt_in_status
        if type is not None:
            self._values["type"] = type

    @builtins.property
    def kms_key_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_key_id DevopsguruServiceIntegration#kms_key_id}.'''
        result = self._values.get("kms_key_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def opt_in_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#opt_in_status DevopsguruServiceIntegration#opt_in_status}.'''
        result = self._values.get("opt_in_status")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#type DevopsguruServiceIntegration#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DevopsguruServiceIntegrationKmsServerSideEncryption(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DevopsguruServiceIntegrationKmsServerSideEncryptionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationKmsServerSideEncryptionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__657de4ed4f929c4ad301697afbdf996cd242762195cdbef83ea250ee7ae4e84e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "DevopsguruServiceIntegrationKmsServerSideEncryptionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__693d7b276cee11c4af4c579d13284204223e1b7485ec505e0377145b10e272cc)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("DevopsguruServiceIntegrationKmsServerSideEncryptionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__781f7f2a9d7e08898b6c8b0baab2ae13feeff2a53862246de369964fd846f96b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d86e24349c80c71eaf86959de18d8f4da0d96c53512cae94b41b71a1664549cf)
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
            type_hints = typing.get_type_hints(_typecheckingstub__06b1efd97b39a9abaaffb3b6a7a9e444a8d0a9302335a7caf34c710acb9c1cc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationKmsServerSideEncryption]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationKmsServerSideEncryption]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationKmsServerSideEncryption]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d13ee93c78f1dd620e38c37f3293f0d5d2761a6272218e1702d1d1568a9e2aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class DevopsguruServiceIntegrationKmsServerSideEncryptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationKmsServerSideEncryptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__46f24968f0e5c602b39d85eaff525fe8cbdc7ee03982d5203a409ea3f3232f39)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetKmsKeyId")
    def reset_kms_key_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKmsKeyId", []))

    @jsii.member(jsii_name="resetOptInStatus")
    def reset_opt_in_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOptInStatus", []))

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyIdInput")
    def kms_key_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "kmsKeyIdInput"))

    @builtins.property
    @jsii.member(jsii_name="optInStatusInput")
    def opt_in_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "optInStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyId")
    def kms_key_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "kmsKeyId"))

    @kms_key_id.setter
    def kms_key_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64f460f6ccb7f33a536d245bfd4ccf2f5a0da9af9f822f28a0ddfa8bd1736122)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "kmsKeyId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="optInStatus")
    def opt_in_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "optInStatus"))

    @opt_in_status.setter
    def opt_in_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a4468e40fe22b5479ddcc4a4111ecb6aff3488ff00a4e6412a1d26dbe361768)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "optInStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__70ec86388a0a781ec0a1b83b0d2689c94ca12625f1fef256ddaf2f923411a79c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationKmsServerSideEncryption]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationKmsServerSideEncryption]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationKmsServerSideEncryption]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ddf4500baa6826b35a9ce7b6d7a62f1c7083ccc81b36f9d021529dbc9a567803)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationLogsAnomalyDetection",
    jsii_struct_bases=[],
    name_mapping={"opt_in_status": "optInStatus"},
)
class DevopsguruServiceIntegrationLogsAnomalyDetection:
    def __init__(self, *, opt_in_status: typing.Optional[builtins.str] = None) -> None:
        '''
        :param opt_in_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#opt_in_status DevopsguruServiceIntegration#opt_in_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dfc339329e836d597cf16818ce03418f324e275e8f38395fcf98429ddc9b7f4f)
            check_type(argname="argument opt_in_status", value=opt_in_status, expected_type=type_hints["opt_in_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if opt_in_status is not None:
            self._values["opt_in_status"] = opt_in_status

    @builtins.property
    def opt_in_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#opt_in_status DevopsguruServiceIntegration#opt_in_status}.'''
        result = self._values.get("opt_in_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DevopsguruServiceIntegrationLogsAnomalyDetection(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DevopsguruServiceIntegrationLogsAnomalyDetectionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationLogsAnomalyDetectionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f79447ca1f467ee1b4727a1b2a5eb507a42fac3fb63b0e69a7d1ad8396c61f16)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "DevopsguruServiceIntegrationLogsAnomalyDetectionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43b6992da870015301d47318c370e1abc44beeb399a94e06e16e72f26f13aa4c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("DevopsguruServiceIntegrationLogsAnomalyDetectionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__616c18e6269f4ddd0733e6b345b8f231c210b0e06e1dcfb0a83636702b422a6b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f4cf4f1985e57b6ac11a28c292311104b3127881e800a7e0e8fde980fdd2b868)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9ae65c3960caaafa9d05c88eae09160ece3b4d0becf5308c3f08c4229e627e4f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationLogsAnomalyDetection]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationLogsAnomalyDetection]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationLogsAnomalyDetection]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01f0df2bafa4989e5b8ceb40140c979ea29a32cb85e607e07bdd8177d2c96d44)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class DevopsguruServiceIntegrationLogsAnomalyDetectionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationLogsAnomalyDetectionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b8e47c1bd808501949786707ddd7079022378de7af9647f77d38b3f9d7594f41)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetOptInStatus")
    def reset_opt_in_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOptInStatus", []))

    @builtins.property
    @jsii.member(jsii_name="optInStatusInput")
    def opt_in_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "optInStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="optInStatus")
    def opt_in_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "optInStatus"))

    @opt_in_status.setter
    def opt_in_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e9ad6c18d447df24762d6fec32b2ad9f21f163ed3de643da70ca1418f826193e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "optInStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationLogsAnomalyDetection]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationLogsAnomalyDetection]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationLogsAnomalyDetection]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86b1d2b4135f39c82b7176e5c8cd1e600fd4b93506814374349c4e072c17e873)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationOpsCenter",
    jsii_struct_bases=[],
    name_mapping={"opt_in_status": "optInStatus"},
)
class DevopsguruServiceIntegrationOpsCenter:
    def __init__(self, *, opt_in_status: typing.Optional[builtins.str] = None) -> None:
        '''
        :param opt_in_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#opt_in_status DevopsguruServiceIntegration#opt_in_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3ebd3b134604f13db1081a20a59e584a235274a460622d2c55ff6cac2e6fd45)
            check_type(argname="argument opt_in_status", value=opt_in_status, expected_type=type_hints["opt_in_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if opt_in_status is not None:
            self._values["opt_in_status"] = opt_in_status

    @builtins.property
    def opt_in_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#opt_in_status DevopsguruServiceIntegration#opt_in_status}.'''
        result = self._values.get("opt_in_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "DevopsguruServiceIntegrationOpsCenter(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class DevopsguruServiceIntegrationOpsCenterList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationOpsCenterList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a882080dc1a2444ce9100789eeb94c159f342e1ba06efb436e7015cef46d276b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "DevopsguruServiceIntegrationOpsCenterOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__89155666ef14adc755f47fa18b885f845fc2272a30edd22e7a0cda8bd7b04861)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("DevopsguruServiceIntegrationOpsCenterOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22a69e09b67b18db019bc7d631b448a51941a8ca387a7d87c77e7f51279016f4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8d26fd3b8bdec474b0cb23d60c95d83581ed0978118499677e86abfe37f31a2a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3e8181e6ca289a5ce8bdd5c6c026ddd12121018414ec95adf00d72ce71eafa10)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationOpsCenter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationOpsCenter]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationOpsCenter]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07c6257181202cff99fc65e7ef6bc7316ab8c2d80e03d239e41328ccae31541e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class DevopsguruServiceIntegrationOpsCenterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationOpsCenterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9370eea875866f56c3fdb02bff072290240b9768f2701190c23ee338ebdd440e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetOptInStatus")
    def reset_opt_in_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOptInStatus", []))

    @builtins.property
    @jsii.member(jsii_name="optInStatusInput")
    def opt_in_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "optInStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="optInStatus")
    def opt_in_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "optInStatus"))

    @opt_in_status.setter
    def opt_in_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5733d180b34b9ee7e1cf0af2beba32bb518af4c3d96befe7a53f52c19b72324a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "optInStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationOpsCenter]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationOpsCenter]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationOpsCenter]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e89e52e61b4264386da4b4a369519d4ac345b0118601080159d5cbcb8d13317)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "DevopsguruServiceIntegration",
    "DevopsguruServiceIntegrationConfig",
    "DevopsguruServiceIntegrationKmsServerSideEncryption",
    "DevopsguruServiceIntegrationKmsServerSideEncryptionList",
    "DevopsguruServiceIntegrationKmsServerSideEncryptionOutputReference",
    "DevopsguruServiceIntegrationLogsAnomalyDetection",
    "DevopsguruServiceIntegrationLogsAnomalyDetectionList",
    "DevopsguruServiceIntegrationLogsAnomalyDetectionOutputReference",
    "DevopsguruServiceIntegrationOpsCenter",
    "DevopsguruServiceIntegrationOpsCenterList",
    "DevopsguruServiceIntegrationOpsCenterOutputReference",
]

publication.publish()

def _typecheckingstub__17c38f80d9b09d0be1206207123beafc7b011b70c53fd5a842c819b6c51c5ff6(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    kms_server_side_encryption: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DevopsguruServiceIntegrationKmsServerSideEncryption, typing.Dict[builtins.str, typing.Any]]]]] = None,
    logs_anomaly_detection: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DevopsguruServiceIntegrationLogsAnomalyDetection, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ops_center: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DevopsguruServiceIntegrationOpsCenter, typing.Dict[builtins.str, typing.Any]]]]] = None,
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

def _typecheckingstub__09581bde90021afc60caa8cdb7bc254f2b93808ea605425316ee98b9e2b83696(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ceac254b2b61c8fefc32abf08a89890751717f85f5036effb9a1f61e718a74bd(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DevopsguruServiceIntegrationKmsServerSideEncryption, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__322aa32eecd43a6eed6821f9f452b2b619c2c81f35075f5ff4e7b21bf7348ac8(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DevopsguruServiceIntegrationLogsAnomalyDetection, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c92ba15e3e1837bfba0993c52a55076de39fae3891473d08ca624612c2dc9f20(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DevopsguruServiceIntegrationOpsCenter, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c44d1c87611705fd2c8cbb105ae81f09045e3fa1efc470fbec1346666e81d0f1(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    kms_server_side_encryption: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DevopsguruServiceIntegrationKmsServerSideEncryption, typing.Dict[builtins.str, typing.Any]]]]] = None,
    logs_anomaly_detection: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DevopsguruServiceIntegrationLogsAnomalyDetection, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ops_center: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[DevopsguruServiceIntegrationOpsCenter, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__824cae3d85e34f465e71ff79a83a1db1f7ddefcb0189c151b9270ba3ac918f81(
    *,
    kms_key_id: typing.Optional[builtins.str] = None,
    opt_in_status: typing.Optional[builtins.str] = None,
    type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__657de4ed4f929c4ad301697afbdf996cd242762195cdbef83ea250ee7ae4e84e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__693d7b276cee11c4af4c579d13284204223e1b7485ec505e0377145b10e272cc(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__781f7f2a9d7e08898b6c8b0baab2ae13feeff2a53862246de369964fd846f96b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d86e24349c80c71eaf86959de18d8f4da0d96c53512cae94b41b71a1664549cf(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06b1efd97b39a9abaaffb3b6a7a9e444a8d0a9302335a7caf34c710acb9c1cc9(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d13ee93c78f1dd620e38c37f3293f0d5d2761a6272218e1702d1d1568a9e2aa(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationKmsServerSideEncryption]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46f24968f0e5c602b39d85eaff525fe8cbdc7ee03982d5203a409ea3f3232f39(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64f460f6ccb7f33a536d245bfd4ccf2f5a0da9af9f822f28a0ddfa8bd1736122(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a4468e40fe22b5479ddcc4a4111ecb6aff3488ff00a4e6412a1d26dbe361768(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70ec86388a0a781ec0a1b83b0d2689c94ca12625f1fef256ddaf2f923411a79c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ddf4500baa6826b35a9ce7b6d7a62f1c7083ccc81b36f9d021529dbc9a567803(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationKmsServerSideEncryption]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dfc339329e836d597cf16818ce03418f324e275e8f38395fcf98429ddc9b7f4f(
    *,
    opt_in_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f79447ca1f467ee1b4727a1b2a5eb507a42fac3fb63b0e69a7d1ad8396c61f16(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43b6992da870015301d47318c370e1abc44beeb399a94e06e16e72f26f13aa4c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__616c18e6269f4ddd0733e6b345b8f231c210b0e06e1dcfb0a83636702b422a6b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4cf4f1985e57b6ac11a28c292311104b3127881e800a7e0e8fde980fdd2b868(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ae65c3960caaafa9d05c88eae09160ece3b4d0becf5308c3f08c4229e627e4f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01f0df2bafa4989e5b8ceb40140c979ea29a32cb85e607e07bdd8177d2c96d44(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationLogsAnomalyDetection]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8e47c1bd808501949786707ddd7079022378de7af9647f77d38b3f9d7594f41(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9ad6c18d447df24762d6fec32b2ad9f21f163ed3de643da70ca1418f826193e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86b1d2b4135f39c82b7176e5c8cd1e600fd4b93506814374349c4e072c17e873(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationLogsAnomalyDetection]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3ebd3b134604f13db1081a20a59e584a235274a460622d2c55ff6cac2e6fd45(
    *,
    opt_in_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a882080dc1a2444ce9100789eeb94c159f342e1ba06efb436e7015cef46d276b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__89155666ef14adc755f47fa18b885f845fc2272a30edd22e7a0cda8bd7b04861(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22a69e09b67b18db019bc7d631b448a51941a8ca387a7d87c77e7f51279016f4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d26fd3b8bdec474b0cb23d60c95d83581ed0978118499677e86abfe37f31a2a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e8181e6ca289a5ce8bdd5c6c026ddd12121018414ec95adf00d72ce71eafa10(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07c6257181202cff99fc65e7ef6bc7316ab8c2d80e03d239e41328ccae31541e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[DevopsguruServiceIntegrationOpsCenter]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9370eea875866f56c3fdb02bff072290240b9768f2701190c23ee338ebdd440e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5733d180b34b9ee7e1cf0af2beba32bb518af4c3d96befe7a53f52c19b72324a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e89e52e61b4264386da4b4a369519d4ac345b0118601080159d5cbcb8d13317(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, DevopsguruServiceIntegrationOpsCenter]],
) -> None:
    """Type checking stubs"""
    pass
