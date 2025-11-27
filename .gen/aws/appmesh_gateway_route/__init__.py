r'''
# `aws_appmesh_gateway_route`

Refer to the Terraform Registry for docs: [`aws_appmesh_gateway_route`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route).
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


class AppmeshGatewayRoute(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRoute",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route aws_appmesh_gateway_route}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        mesh_name: builtins.str,
        name: builtins.str,
        spec: typing.Union["AppmeshGatewayRouteSpec", typing.Dict[builtins.str, typing.Any]],
        virtual_gateway_name: builtins.str,
        id: typing.Optional[builtins.str] = None,
        mesh_owner: typing.Optional[builtins.str] = None,
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
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route aws_appmesh_gateway_route} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param mesh_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#mesh_name AppmeshGatewayRoute#mesh_name}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.
        :param spec: spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#spec AppmeshGatewayRoute#spec}
        :param virtual_gateway_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_gateway_name AppmeshGatewayRoute#virtual_gateway_name}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#id AppmeshGatewayRoute#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param mesh_owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#mesh_owner AppmeshGatewayRoute#mesh_owner}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#tags AppmeshGatewayRoute#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#tags_all AppmeshGatewayRoute#tags_all}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e60d33798b71a225a7d1f2942dd246a1100cc356a144a34f58197f1ac05aabbc)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = AppmeshGatewayRouteConfig(
            mesh_name=mesh_name,
            name=name,
            spec=spec,
            virtual_gateway_name=virtual_gateway_name,
            id=id,
            mesh_owner=mesh_owner,
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
        '''Generates CDKTF code for importing a AppmeshGatewayRoute resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the AppmeshGatewayRoute to import.
        :param import_from_id: The id of the existing AppmeshGatewayRoute that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the AppmeshGatewayRoute to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a461e77d3918c5de48989bfbbf6ae314fb1c819148c40688ad4a545132fc464)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putSpec")
    def put_spec(
        self,
        *,
        grpc_route: typing.Optional[typing.Union["AppmeshGatewayRouteSpecGrpcRoute", typing.Dict[builtins.str, typing.Any]]] = None,
        http2_route: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2Route", typing.Dict[builtins.str, typing.Any]]] = None,
        http_route: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRoute", typing.Dict[builtins.str, typing.Any]]] = None,
        priority: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param grpc_route: grpc_route block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#grpc_route AppmeshGatewayRoute#grpc_route}
        :param http2_route: http2_route block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#http2_route AppmeshGatewayRoute#http2_route}
        :param http_route: http_route block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#http_route AppmeshGatewayRoute#http_route}
        :param priority: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#priority AppmeshGatewayRoute#priority}.
        '''
        value = AppmeshGatewayRouteSpec(
            grpc_route=grpc_route,
            http2_route=http2_route,
            http_route=http_route,
            priority=priority,
        )

        return typing.cast(None, jsii.invoke(self, "putSpec", [value]))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetMeshOwner")
    def reset_mesh_owner(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMeshOwner", []))

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
    @jsii.member(jsii_name="createdDate")
    def created_date(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "createdDate"))

    @builtins.property
    @jsii.member(jsii_name="lastUpdatedDate")
    def last_updated_date(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastUpdatedDate"))

    @builtins.property
    @jsii.member(jsii_name="resourceOwner")
    def resource_owner(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceOwner"))

    @builtins.property
    @jsii.member(jsii_name="spec")
    def spec(self) -> "AppmeshGatewayRouteSpecOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecOutputReference", jsii.get(self, "spec"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="meshNameInput")
    def mesh_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "meshNameInput"))

    @builtins.property
    @jsii.member(jsii_name="meshOwnerInput")
    def mesh_owner_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "meshOwnerInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="specInput")
    def spec_input(self) -> typing.Optional["AppmeshGatewayRouteSpec"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpec"], jsii.get(self, "specInput"))

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
    @jsii.member(jsii_name="virtualGatewayNameInput")
    def virtual_gateway_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "virtualGatewayNameInput"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e587e325912359a1611f4133e921b36e8cebb9fd0cdf584a0f2eab51e08c625)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="meshName")
    def mesh_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "meshName"))

    @mesh_name.setter
    def mesh_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3031a49d4ce416efe28766b7a5ae2908c34a138d87eb0f346f842e158415413b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "meshName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="meshOwner")
    def mesh_owner(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "meshOwner"))

    @mesh_owner.setter
    def mesh_owner(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce46ffdcd8eefcd444df38ae445888b443c90276232e84f272b7d849bbf19e74)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "meshOwner", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__97873d709654eab8a9700dabd17d36113957588483fb81714ce560fb10042974)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ffba99add67cf77e231c7d1476e5bc361e79a7b7b01676ac346ac5d17049008)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3822414f6a8bd589a8e153c2ec4155bdde84b8d25db5af17b30e58ebc54667d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="virtualGatewayName")
    def virtual_gateway_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "virtualGatewayName"))

    @virtual_gateway_name.setter
    def virtual_gateway_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6970ae0c3b698185d3698bf6fb594a016fe48662217d461ae91a2093f20b5855)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "virtualGatewayName", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "mesh_name": "meshName",
        "name": "name",
        "spec": "spec",
        "virtual_gateway_name": "virtualGatewayName",
        "id": "id",
        "mesh_owner": "meshOwner",
        "tags": "tags",
        "tags_all": "tagsAll",
    },
)
class AppmeshGatewayRouteConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        mesh_name: builtins.str,
        name: builtins.str,
        spec: typing.Union["AppmeshGatewayRouteSpec", typing.Dict[builtins.str, typing.Any]],
        virtual_gateway_name: builtins.str,
        id: typing.Optional[builtins.str] = None,
        mesh_owner: typing.Optional[builtins.str] = None,
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
        :param mesh_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#mesh_name AppmeshGatewayRoute#mesh_name}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.
        :param spec: spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#spec AppmeshGatewayRoute#spec}
        :param virtual_gateway_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_gateway_name AppmeshGatewayRoute#virtual_gateway_name}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#id AppmeshGatewayRoute#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param mesh_owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#mesh_owner AppmeshGatewayRoute#mesh_owner}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#tags AppmeshGatewayRoute#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#tags_all AppmeshGatewayRoute#tags_all}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(spec, dict):
            spec = AppmeshGatewayRouteSpec(**spec)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3eedc0182e1c2f6974092d2f3718ffe056cc08bc85cd4ad8a14c5b1e0c1dfb4)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument mesh_name", value=mesh_name, expected_type=type_hints["mesh_name"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument spec", value=spec, expected_type=type_hints["spec"])
            check_type(argname="argument virtual_gateway_name", value=virtual_gateway_name, expected_type=type_hints["virtual_gateway_name"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument mesh_owner", value=mesh_owner, expected_type=type_hints["mesh_owner"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "mesh_name": mesh_name,
            "name": name,
            "spec": spec,
            "virtual_gateway_name": virtual_gateway_name,
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
        if id is not None:
            self._values["id"] = id
        if mesh_owner is not None:
            self._values["mesh_owner"] = mesh_owner
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
    def mesh_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#mesh_name AppmeshGatewayRoute#mesh_name}.'''
        result = self._values.get("mesh_name")
        assert result is not None, "Required property 'mesh_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def spec(self) -> "AppmeshGatewayRouteSpec":
        '''spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#spec AppmeshGatewayRoute#spec}
        '''
        result = self._values.get("spec")
        assert result is not None, "Required property 'spec' is missing"
        return typing.cast("AppmeshGatewayRouteSpec", result)

    @builtins.property
    def virtual_gateway_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_gateway_name AppmeshGatewayRoute#virtual_gateway_name}.'''
        result = self._values.get("virtual_gateway_name")
        assert result is not None, "Required property 'virtual_gateway_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#id AppmeshGatewayRoute#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def mesh_owner(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#mesh_owner AppmeshGatewayRoute#mesh_owner}.'''
        result = self._values.get("mesh_owner")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#tags AppmeshGatewayRoute#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#tags_all AppmeshGatewayRoute#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpec",
    jsii_struct_bases=[],
    name_mapping={
        "grpc_route": "grpcRoute",
        "http2_route": "http2Route",
        "http_route": "httpRoute",
        "priority": "priority",
    },
)
class AppmeshGatewayRouteSpec:
    def __init__(
        self,
        *,
        grpc_route: typing.Optional[typing.Union["AppmeshGatewayRouteSpecGrpcRoute", typing.Dict[builtins.str, typing.Any]]] = None,
        http2_route: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2Route", typing.Dict[builtins.str, typing.Any]]] = None,
        http_route: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRoute", typing.Dict[builtins.str, typing.Any]]] = None,
        priority: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param grpc_route: grpc_route block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#grpc_route AppmeshGatewayRoute#grpc_route}
        :param http2_route: http2_route block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#http2_route AppmeshGatewayRoute#http2_route}
        :param http_route: http_route block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#http_route AppmeshGatewayRoute#http_route}
        :param priority: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#priority AppmeshGatewayRoute#priority}.
        '''
        if isinstance(grpc_route, dict):
            grpc_route = AppmeshGatewayRouteSpecGrpcRoute(**grpc_route)
        if isinstance(http2_route, dict):
            http2_route = AppmeshGatewayRouteSpecHttp2Route(**http2_route)
        if isinstance(http_route, dict):
            http_route = AppmeshGatewayRouteSpecHttpRoute(**http_route)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ee41fbde5295cf1ffa05c763927f1dc70e4bbba7dea173815b1ac1f01f45f40)
            check_type(argname="argument grpc_route", value=grpc_route, expected_type=type_hints["grpc_route"])
            check_type(argname="argument http2_route", value=http2_route, expected_type=type_hints["http2_route"])
            check_type(argname="argument http_route", value=http_route, expected_type=type_hints["http_route"])
            check_type(argname="argument priority", value=priority, expected_type=type_hints["priority"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if grpc_route is not None:
            self._values["grpc_route"] = grpc_route
        if http2_route is not None:
            self._values["http2_route"] = http2_route
        if http_route is not None:
            self._values["http_route"] = http_route
        if priority is not None:
            self._values["priority"] = priority

    @builtins.property
    def grpc_route(self) -> typing.Optional["AppmeshGatewayRouteSpecGrpcRoute"]:
        '''grpc_route block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#grpc_route AppmeshGatewayRoute#grpc_route}
        '''
        result = self._values.get("grpc_route")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecGrpcRoute"], result)

    @builtins.property
    def http2_route(self) -> typing.Optional["AppmeshGatewayRouteSpecHttp2Route"]:
        '''http2_route block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#http2_route AppmeshGatewayRoute#http2_route}
        '''
        result = self._values.get("http2_route")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2Route"], result)

    @builtins.property
    def http_route(self) -> typing.Optional["AppmeshGatewayRouteSpecHttpRoute"]:
        '''http_route block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#http_route AppmeshGatewayRoute#http_route}
        '''
        result = self._values.get("http_route")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRoute"], result)

    @builtins.property
    def priority(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#priority AppmeshGatewayRoute#priority}.'''
        result = self._values.get("priority")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecGrpcRoute",
    jsii_struct_bases=[],
    name_mapping={"action": "action", "match": "match"},
)
class AppmeshGatewayRouteSpecGrpcRoute:
    def __init__(
        self,
        *,
        action: typing.Union["AppmeshGatewayRouteSpecGrpcRouteAction", typing.Dict[builtins.str, typing.Any]],
        match: typing.Union["AppmeshGatewayRouteSpecGrpcRouteMatch", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        if isinstance(action, dict):
            action = AppmeshGatewayRouteSpecGrpcRouteAction(**action)
        if isinstance(match, dict):
            match = AppmeshGatewayRouteSpecGrpcRouteMatch(**match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e7dbb0f76051a578abee8e324f92b80a3d18851d7ef60ba935e6f5490eaa5313)
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument match", value=match, expected_type=type_hints["match"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action": action,
            "match": match,
        }

    @builtins.property
    def action(self) -> "AppmeshGatewayRouteSpecGrpcRouteAction":
        '''action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
        '''
        result = self._values.get("action")
        assert result is not None, "Required property 'action' is missing"
        return typing.cast("AppmeshGatewayRouteSpecGrpcRouteAction", result)

    @builtins.property
    def match(self) -> "AppmeshGatewayRouteSpecGrpcRouteMatch":
        '''match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        result = self._values.get("match")
        assert result is not None, "Required property 'match' is missing"
        return typing.cast("AppmeshGatewayRouteSpecGrpcRouteMatch", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecGrpcRoute(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecGrpcRouteAction",
    jsii_struct_bases=[],
    name_mapping={"target": "target"},
)
class AppmeshGatewayRouteSpecGrpcRouteAction:
    def __init__(
        self,
        *,
        target: typing.Union["AppmeshGatewayRouteSpecGrpcRouteActionTarget", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param target: target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
        '''
        if isinstance(target, dict):
            target = AppmeshGatewayRouteSpecGrpcRouteActionTarget(**target)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d1daf217b0f498e434ddc5e1298c8be353963d4edf2c5cdfff3424f6613a9c7)
            check_type(argname="argument target", value=target, expected_type=type_hints["target"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "target": target,
        }

    @builtins.property
    def target(self) -> "AppmeshGatewayRouteSpecGrpcRouteActionTarget":
        '''target block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
        '''
        result = self._values.get("target")
        assert result is not None, "Required property 'target' is missing"
        return typing.cast("AppmeshGatewayRouteSpecGrpcRouteActionTarget", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecGrpcRouteAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecGrpcRouteActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecGrpcRouteActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5b27f7d594f24628476be98172eba889c51755fcb01c01bd41444427aee06086)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putTarget")
    def put_target(
        self,
        *,
        virtual_service: typing.Union["AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService", typing.Dict[builtins.str, typing.Any]],
        port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param virtual_service: virtual_service block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service AppmeshGatewayRoute#virtual_service}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        '''
        value = AppmeshGatewayRouteSpecGrpcRouteActionTarget(
            virtual_service=virtual_service, port=port
        )

        return typing.cast(None, jsii.invoke(self, "putTarget", [value]))

    @builtins.property
    @jsii.member(jsii_name="target")
    def target(self) -> "AppmeshGatewayRouteSpecGrpcRouteActionTargetOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecGrpcRouteActionTargetOutputReference", jsii.get(self, "target"))

    @builtins.property
    @jsii.member(jsii_name="targetInput")
    def target_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecGrpcRouteActionTarget"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecGrpcRouteActionTarget"], jsii.get(self, "targetInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AppmeshGatewayRouteSpecGrpcRouteAction]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecGrpcRouteAction], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecGrpcRouteAction],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d43425c5a796c29e40ee45734ddf79929aae88b0dd1f83a84f02f7917b57af64)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecGrpcRouteActionTarget",
    jsii_struct_bases=[],
    name_mapping={"virtual_service": "virtualService", "port": "port"},
)
class AppmeshGatewayRouteSpecGrpcRouteActionTarget:
    def __init__(
        self,
        *,
        virtual_service: typing.Union["AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService", typing.Dict[builtins.str, typing.Any]],
        port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param virtual_service: virtual_service block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service AppmeshGatewayRoute#virtual_service}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        '''
        if isinstance(virtual_service, dict):
            virtual_service = AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService(**virtual_service)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d0db52090970c424d5719e8d5c3315c0bfe68a086b5fc8f40242af8c129120e)
            check_type(argname="argument virtual_service", value=virtual_service, expected_type=type_hints["virtual_service"])
            check_type(argname="argument port", value=port, expected_type=type_hints["port"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "virtual_service": virtual_service,
        }
        if port is not None:
            self._values["port"] = port

    @builtins.property
    def virtual_service(
        self,
    ) -> "AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService":
        '''virtual_service block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service AppmeshGatewayRoute#virtual_service}
        '''
        result = self._values.get("virtual_service")
        assert result is not None, "Required property 'virtual_service' is missing"
        return typing.cast("AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService", result)

    @builtins.property
    def port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.'''
        result = self._values.get("port")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecGrpcRouteActionTarget(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecGrpcRouteActionTargetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecGrpcRouteActionTargetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__164b7379690bfb045ce9d8cbf53011b9641d574f9e46459a3a18239e98cc3868)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putVirtualService")
    def put_virtual_service(self, *, virtual_service_name: builtins.str) -> None:
        '''
        :param virtual_service_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service_name AppmeshGatewayRoute#virtual_service_name}.
        '''
        value = AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService(
            virtual_service_name=virtual_service_name
        )

        return typing.cast(None, jsii.invoke(self, "putVirtualService", [value]))

    @jsii.member(jsii_name="resetPort")
    def reset_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPort", []))

    @builtins.property
    @jsii.member(jsii_name="virtualService")
    def virtual_service(
        self,
    ) -> "AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualServiceOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualServiceOutputReference", jsii.get(self, "virtualService"))

    @builtins.property
    @jsii.member(jsii_name="portInput")
    def port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "portInput"))

    @builtins.property
    @jsii.member(jsii_name="virtualServiceInput")
    def virtual_service_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService"], jsii.get(self, "virtualServiceInput"))

    @builtins.property
    @jsii.member(jsii_name="port")
    def port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "port"))

    @port.setter
    def port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5c77a0a5fa89a27f1a499a107ac713251ccb6ace0ff125841ab6eaa9c37ba26)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "port", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecGrpcRouteActionTarget]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecGrpcRouteActionTarget], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecGrpcRouteActionTarget],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__696e5f59073b72d6ff5bc0d7ce618d26e949655ef7193c1e8aee0980eb6b529d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService",
    jsii_struct_bases=[],
    name_mapping={"virtual_service_name": "virtualServiceName"},
)
class AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService:
    def __init__(self, *, virtual_service_name: builtins.str) -> None:
        '''
        :param virtual_service_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service_name AppmeshGatewayRoute#virtual_service_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41b4e7df913f68fd6b67a3783be159e2117f5821d73d50caa65320a5eb647d85)
            check_type(argname="argument virtual_service_name", value=virtual_service_name, expected_type=type_hints["virtual_service_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "virtual_service_name": virtual_service_name,
        }

    @builtins.property
    def virtual_service_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service_name AppmeshGatewayRoute#virtual_service_name}.'''
        result = self._values.get("virtual_service_name")
        assert result is not None, "Required property 'virtual_service_name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualServiceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualServiceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bbadf1254c179b7811d557075da006b5b05098b904cf5e07d462164a9a67f6a3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="virtualServiceNameInput")
    def virtual_service_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "virtualServiceNameInput"))

    @builtins.property
    @jsii.member(jsii_name="virtualServiceName")
    def virtual_service_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "virtualServiceName"))

    @virtual_service_name.setter
    def virtual_service_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3c9fe8ddb636bb6c6cd0ede052b9391baa204bd0ba15257eefc66f6f069c685c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "virtualServiceName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6f373a92aac69d2a38d10d097f05cd342f1fadd2636d59b72848be2ecffbe29)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecGrpcRouteMatch",
    jsii_struct_bases=[],
    name_mapping={"service_name": "serviceName", "port": "port"},
)
class AppmeshGatewayRouteSpecGrpcRouteMatch:
    def __init__(
        self,
        *,
        service_name: builtins.str,
        port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param service_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#service_name AppmeshGatewayRoute#service_name}.
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__592a13e8cf7d8b7449cb676b6a5f804bd709019f7dfe8a4dd8251e1b272b6257)
            check_type(argname="argument service_name", value=service_name, expected_type=type_hints["service_name"])
            check_type(argname="argument port", value=port, expected_type=type_hints["port"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "service_name": service_name,
        }
        if port is not None:
            self._values["port"] = port

    @builtins.property
    def service_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#service_name AppmeshGatewayRoute#service_name}.'''
        result = self._values.get("service_name")
        assert result is not None, "Required property 'service_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.'''
        result = self._values.get("port")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecGrpcRouteMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecGrpcRouteMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecGrpcRouteMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__450c94714afd1336eba6e944237cd7fe275eac61e64f7e26ac377ed54a0ba0d1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetPort")
    def reset_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPort", []))

    @builtins.property
    @jsii.member(jsii_name="portInput")
    def port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "portInput"))

    @builtins.property
    @jsii.member(jsii_name="serviceNameInput")
    def service_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "serviceNameInput"))

    @builtins.property
    @jsii.member(jsii_name="port")
    def port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "port"))

    @port.setter
    def port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bc110e29f8417f3976c9983fee9e8c9a6ae27d5b9c261141635eecc2e817995f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "port", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="serviceName")
    def service_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "serviceName"))

    @service_name.setter
    def service_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8bcb67d2a5144e9def022b33b6c7da088acf9c975ffb6d9a98ffd310154b2a40)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "serviceName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AppmeshGatewayRouteSpecGrpcRouteMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecGrpcRouteMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecGrpcRouteMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__713a6f086d58c1ea51ce6c5b11e30fb64e380ba5b4a219db8d3267d60224250f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecGrpcRouteOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecGrpcRouteOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5d56eeefeb64483322d2ec8c56907216621fdaf8470cdebc7391008d6944d647)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAction")
    def put_action(
        self,
        *,
        target: typing.Union[AppmeshGatewayRouteSpecGrpcRouteActionTarget, typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param target: target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
        '''
        value = AppmeshGatewayRouteSpecGrpcRouteAction(target=target)

        return typing.cast(None, jsii.invoke(self, "putAction", [value]))

    @jsii.member(jsii_name="putMatch")
    def put_match(
        self,
        *,
        service_name: builtins.str,
        port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param service_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#service_name AppmeshGatewayRoute#service_name}.
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        '''
        value = AppmeshGatewayRouteSpecGrpcRouteMatch(
            service_name=service_name, port=port
        )

        return typing.cast(None, jsii.invoke(self, "putMatch", [value]))

    @builtins.property
    @jsii.member(jsii_name="action")
    def action(self) -> AppmeshGatewayRouteSpecGrpcRouteActionOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecGrpcRouteActionOutputReference, jsii.get(self, "action"))

    @builtins.property
    @jsii.member(jsii_name="match")
    def match(self) -> AppmeshGatewayRouteSpecGrpcRouteMatchOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecGrpcRouteMatchOutputReference, jsii.get(self, "match"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(self) -> typing.Optional[AppmeshGatewayRouteSpecGrpcRouteAction]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecGrpcRouteAction], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="matchInput")
    def match_input(self) -> typing.Optional[AppmeshGatewayRouteSpecGrpcRouteMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecGrpcRouteMatch], jsii.get(self, "matchInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AppmeshGatewayRouteSpecGrpcRoute]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecGrpcRoute], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecGrpcRoute],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3599e43427c491b43fae0e0618ee02dc803f15421117f826178815522f2e9bee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2Route",
    jsii_struct_bases=[],
    name_mapping={"action": "action", "match": "match"},
)
class AppmeshGatewayRouteSpecHttp2Route:
    def __init__(
        self,
        *,
        action: typing.Union["AppmeshGatewayRouteSpecHttp2RouteAction", typing.Dict[builtins.str, typing.Any]],
        match: typing.Union["AppmeshGatewayRouteSpecHttp2RouteMatch", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        if isinstance(action, dict):
            action = AppmeshGatewayRouteSpecHttp2RouteAction(**action)
        if isinstance(match, dict):
            match = AppmeshGatewayRouteSpecHttp2RouteMatch(**match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5dc3d5d7beacd2020c67bb018d60de37fb98a8885bb6ea9e87e81bb12feff5a4)
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument match", value=match, expected_type=type_hints["match"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action": action,
            "match": match,
        }

    @builtins.property
    def action(self) -> "AppmeshGatewayRouteSpecHttp2RouteAction":
        '''action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
        '''
        result = self._values.get("action")
        assert result is not None, "Required property 'action' is missing"
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteAction", result)

    @builtins.property
    def match(self) -> "AppmeshGatewayRouteSpecHttp2RouteMatch":
        '''match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        result = self._values.get("match")
        assert result is not None, "Required property 'match' is missing"
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteMatch", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2Route(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteAction",
    jsii_struct_bases=[],
    name_mapping={"target": "target", "rewrite": "rewrite"},
)
class AppmeshGatewayRouteSpecHttp2RouteAction:
    def __init__(
        self,
        *,
        target: typing.Union["AppmeshGatewayRouteSpecHttp2RouteActionTarget", typing.Dict[builtins.str, typing.Any]],
        rewrite: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteActionRewrite", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param target: target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
        :param rewrite: rewrite block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#rewrite AppmeshGatewayRoute#rewrite}
        '''
        if isinstance(target, dict):
            target = AppmeshGatewayRouteSpecHttp2RouteActionTarget(**target)
        if isinstance(rewrite, dict):
            rewrite = AppmeshGatewayRouteSpecHttp2RouteActionRewrite(**rewrite)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__879f60664815ac30c796c8f1023f6b22be62e393a692afe9cb5fd7a854239c91)
            check_type(argname="argument target", value=target, expected_type=type_hints["target"])
            check_type(argname="argument rewrite", value=rewrite, expected_type=type_hints["rewrite"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "target": target,
        }
        if rewrite is not None:
            self._values["rewrite"] = rewrite

    @builtins.property
    def target(self) -> "AppmeshGatewayRouteSpecHttp2RouteActionTarget":
        '''target block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
        '''
        result = self._values.get("target")
        assert result is not None, "Required property 'target' is missing"
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteActionTarget", result)

    @builtins.property
    def rewrite(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewrite"]:
        '''rewrite block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#rewrite AppmeshGatewayRoute#rewrite}
        '''
        result = self._values.get("rewrite")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewrite"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d714c07e1cb1c488d7f1980334607e1681a7ffce93c8faa054819443c3b69211)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRewrite")
    def put_rewrite(
        self,
        *,
        hostname: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname", typing.Dict[builtins.str, typing.Any]]] = None,
        path: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteActionRewritePath", typing.Dict[builtins.str, typing.Any]]] = None,
        prefix: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param hostname: hostname block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        :param path: path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        :param prefix: prefix block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteActionRewrite(
            hostname=hostname, path=path, prefix=prefix
        )

        return typing.cast(None, jsii.invoke(self, "putRewrite", [value]))

    @jsii.member(jsii_name="putTarget")
    def put_target(
        self,
        *,
        virtual_service: typing.Union["AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService", typing.Dict[builtins.str, typing.Any]],
        port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param virtual_service: virtual_service block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service AppmeshGatewayRoute#virtual_service}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteActionTarget(
            virtual_service=virtual_service, port=port
        )

        return typing.cast(None, jsii.invoke(self, "putTarget", [value]))

    @jsii.member(jsii_name="resetRewrite")
    def reset_rewrite(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRewrite", []))

    @builtins.property
    @jsii.member(jsii_name="rewrite")
    def rewrite(
        self,
    ) -> "AppmeshGatewayRouteSpecHttp2RouteActionRewriteOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteActionRewriteOutputReference", jsii.get(self, "rewrite"))

    @builtins.property
    @jsii.member(jsii_name="target")
    def target(self) -> "AppmeshGatewayRouteSpecHttp2RouteActionTargetOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteActionTargetOutputReference", jsii.get(self, "target"))

    @builtins.property
    @jsii.member(jsii_name="rewriteInput")
    def rewrite_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewrite"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewrite"], jsii.get(self, "rewriteInput"))

    @builtins.property
    @jsii.member(jsii_name="targetInput")
    def target_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionTarget"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionTarget"], jsii.get(self, "targetInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteAction]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteAction], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteAction],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73311656927a476df9e30fa8192c95004d069a8ba782e31e1fc7099a9c8778d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewrite",
    jsii_struct_bases=[],
    name_mapping={"hostname": "hostname", "path": "path", "prefix": "prefix"},
)
class AppmeshGatewayRouteSpecHttp2RouteActionRewrite:
    def __init__(
        self,
        *,
        hostname: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname", typing.Dict[builtins.str, typing.Any]]] = None,
        path: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteActionRewritePath", typing.Dict[builtins.str, typing.Any]]] = None,
        prefix: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param hostname: hostname block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        :param path: path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        :param prefix: prefix block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}
        '''
        if isinstance(hostname, dict):
            hostname = AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname(**hostname)
        if isinstance(path, dict):
            path = AppmeshGatewayRouteSpecHttp2RouteActionRewritePath(**path)
        if isinstance(prefix, dict):
            prefix = AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix(**prefix)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__003a6c2fac0d1710578cc8cc6490a0a9da88c66f235246fa0eb5772a4203f719)
            check_type(argname="argument hostname", value=hostname, expected_type=type_hints["hostname"])
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if hostname is not None:
            self._values["hostname"] = hostname
        if path is not None:
            self._values["path"] = path
        if prefix is not None:
            self._values["prefix"] = prefix

    @builtins.property
    def hostname(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname"]:
        '''hostname block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        '''
        result = self._values.get("hostname")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname"], result)

    @builtins.property
    def path(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewritePath"]:
        '''path block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        '''
        result = self._values.get("path")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewritePath"], result)

    @builtins.property
    def prefix(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix"]:
        '''prefix block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}
        '''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteActionRewrite(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname",
    jsii_struct_bases=[],
    name_mapping={"default_target_hostname": "defaultTargetHostname"},
)
class AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname:
    def __init__(self, *, default_target_hostname: builtins.str) -> None:
        '''
        :param default_target_hostname: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_target_hostname AppmeshGatewayRoute#default_target_hostname}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0bf7c9a3f58c1e3762b23365ef15cdb912bbaa6c24e0a939cf478417cb02f63)
            check_type(argname="argument default_target_hostname", value=default_target_hostname, expected_type=type_hints["default_target_hostname"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_target_hostname": default_target_hostname,
        }

    @builtins.property
    def default_target_hostname(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_target_hostname AppmeshGatewayRoute#default_target_hostname}.'''
        result = self._values.get("default_target_hostname")
        assert result is not None, "Required property 'default_target_hostname' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostnameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostnameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4f21de293b0d2f7798760f8f21512068d1be689066960a6b067be5fd4bc0dd92)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="defaultTargetHostnameInput")
    def default_target_hostname_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultTargetHostnameInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultTargetHostname")
    def default_target_hostname(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultTargetHostname"))

    @default_target_hostname.setter
    def default_target_hostname(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b83dbd685badd8e84f2f674b183bcd558418559bf6a9fb3e27203463385ef7ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultTargetHostname", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59f4c7546c66f9e14748c8d6677ed6e2c4497410e479be3538f89700b83844ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecHttp2RouteActionRewriteOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewriteOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b8e8b8f5690e0c54f2a534a600323b461b23a32e1ad88fc0c84aff8ea5cf65c9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putHostname")
    def put_hostname(self, *, default_target_hostname: builtins.str) -> None:
        '''
        :param default_target_hostname: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_target_hostname AppmeshGatewayRoute#default_target_hostname}.
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname(
            default_target_hostname=default_target_hostname
        )

        return typing.cast(None, jsii.invoke(self, "putHostname", [value]))

    @jsii.member(jsii_name="putPath")
    def put_path(self, *, exact: builtins.str) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteActionRewritePath(exact=exact)

        return typing.cast(None, jsii.invoke(self, "putPath", [value]))

    @jsii.member(jsii_name="putPrefix")
    def put_prefix(
        self,
        *,
        default_prefix: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_prefix AppmeshGatewayRoute#default_prefix}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#value AppmeshGatewayRoute#value}.
        '''
        value_ = AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix(
            default_prefix=default_prefix, value=value
        )

        return typing.cast(None, jsii.invoke(self, "putPrefix", [value_]))

    @jsii.member(jsii_name="resetHostname")
    def reset_hostname(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHostname", []))

    @jsii.member(jsii_name="resetPath")
    def reset_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPath", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="hostname")
    def hostname(
        self,
    ) -> AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostnameOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostnameOutputReference, jsii.get(self, "hostname"))

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(
        self,
    ) -> "AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference", jsii.get(self, "path"))

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(
        self,
    ) -> "AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefixOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefixOutputReference", jsii.get(self, "prefix"))

    @builtins.property
    @jsii.member(jsii_name="hostnameInput")
    def hostname_input(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname], jsii.get(self, "hostnameInput"))

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewritePath"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewritePath"], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix"], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewrite]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewrite], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewrite],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__572d2727240e7ac54c5a39bf20616e6b558d1a71704e035e812e84f2b5d385a1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath",
    jsii_struct_bases=[],
    name_mapping={"exact": "exact"},
)
class AppmeshGatewayRouteSpecHttp2RouteActionRewritePath:
    def __init__(self, *, exact: builtins.str) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41703802274509a00686198ce14134923cfc7a8145d76d62c982e2cdd192f34a)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "exact": exact,
        }

    @builtins.property
    def exact(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.'''
        result = self._values.get("exact")
        assert result is not None, "Required property 'exact' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteActionRewritePath(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a06eda91c47c9c68971d1641351344d318aef0cf57ca2e2a7881e9ca25d2f8a3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__852005a82017c1be76339f4e6b50e04b37add5526042224346ccb9098a2e02b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewritePath]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewritePath], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewritePath],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02aadb3fe96bcaa08697085d7d44c400fb2a9ffa7b65d78ec892f9214ab5590a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix",
    jsii_struct_bases=[],
    name_mapping={"default_prefix": "defaultPrefix", "value": "value"},
)
class AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix:
    def __init__(
        self,
        *,
        default_prefix: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_prefix AppmeshGatewayRoute#default_prefix}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#value AppmeshGatewayRoute#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8556e3e051d28a50aa4da32e62b4198b9bb871f70451a8131f47d77e944d95f)
            check_type(argname="argument default_prefix", value=default_prefix, expected_type=type_hints["default_prefix"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if default_prefix is not None:
            self._values["default_prefix"] = default_prefix
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def default_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_prefix AppmeshGatewayRoute#default_prefix}.'''
        result = self._values.get("default_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#value AppmeshGatewayRoute#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefixOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefixOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__268ac17d728dfed31c8840811a94d61c24ff8916cdee6565736ddda53b7deca4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDefaultPrefix")
    def reset_default_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultPrefix", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="defaultPrefixInput")
    def default_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultPrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultPrefix")
    def default_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultPrefix"))

    @default_prefix.setter
    def default_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49d9441c402363512c4773e0633fde298b4ba1703a9e51cc14c39def3f25fac0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultPrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__780a3cb1dc52a936c63bbe1d2f0ccfc4c7fc8e1ffece72ab2c9b8cfd453164f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84c620a06d042aa3d7bf7d3c600f038755e37876bdc5ebec890744585a435d5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionTarget",
    jsii_struct_bases=[],
    name_mapping={"virtual_service": "virtualService", "port": "port"},
)
class AppmeshGatewayRouteSpecHttp2RouteActionTarget:
    def __init__(
        self,
        *,
        virtual_service: typing.Union["AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService", typing.Dict[builtins.str, typing.Any]],
        port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param virtual_service: virtual_service block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service AppmeshGatewayRoute#virtual_service}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        '''
        if isinstance(virtual_service, dict):
            virtual_service = AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService(**virtual_service)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__434bff24fa465804651d514f74bf543ba3cac61544d896955bd373a961f71f5c)
            check_type(argname="argument virtual_service", value=virtual_service, expected_type=type_hints["virtual_service"])
            check_type(argname="argument port", value=port, expected_type=type_hints["port"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "virtual_service": virtual_service,
        }
        if port is not None:
            self._values["port"] = port

    @builtins.property
    def virtual_service(
        self,
    ) -> "AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService":
        '''virtual_service block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service AppmeshGatewayRoute#virtual_service}
        '''
        result = self._values.get("virtual_service")
        assert result is not None, "Required property 'virtual_service' is missing"
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService", result)

    @builtins.property
    def port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.'''
        result = self._values.get("port")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteActionTarget(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteActionTargetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionTargetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__387256da9c1f06575b339ba2bff7e1566241a48fdda4cc050ce2b0140e30810b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putVirtualService")
    def put_virtual_service(self, *, virtual_service_name: builtins.str) -> None:
        '''
        :param virtual_service_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service_name AppmeshGatewayRoute#virtual_service_name}.
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService(
            virtual_service_name=virtual_service_name
        )

        return typing.cast(None, jsii.invoke(self, "putVirtualService", [value]))

    @jsii.member(jsii_name="resetPort")
    def reset_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPort", []))

    @builtins.property
    @jsii.member(jsii_name="virtualService")
    def virtual_service(
        self,
    ) -> "AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualServiceOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualServiceOutputReference", jsii.get(self, "virtualService"))

    @builtins.property
    @jsii.member(jsii_name="portInput")
    def port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "portInput"))

    @builtins.property
    @jsii.member(jsii_name="virtualServiceInput")
    def virtual_service_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService"], jsii.get(self, "virtualServiceInput"))

    @builtins.property
    @jsii.member(jsii_name="port")
    def port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "port"))

    @port.setter
    def port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4691fa3c75a9fa4fa790003624b6d01f386b5349e1e9bdb7476f3640085b32b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "port", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionTarget]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionTarget], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionTarget],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__694d60667dc4ef9c437185d45be15f361c19fd5cc5b68fbcfbaba18aa263f791)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService",
    jsii_struct_bases=[],
    name_mapping={"virtual_service_name": "virtualServiceName"},
)
class AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService:
    def __init__(self, *, virtual_service_name: builtins.str) -> None:
        '''
        :param virtual_service_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service_name AppmeshGatewayRoute#virtual_service_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1c201730fca46745c36321029271f2514c33617dca813bd1745ee54971172e9)
            check_type(argname="argument virtual_service_name", value=virtual_service_name, expected_type=type_hints["virtual_service_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "virtual_service_name": virtual_service_name,
        }

    @builtins.property
    def virtual_service_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service_name AppmeshGatewayRoute#virtual_service_name}.'''
        result = self._values.get("virtual_service_name")
        assert result is not None, "Required property 'virtual_service_name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualServiceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualServiceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1141f8c76ed73083cc051351b072b192daaf599103d9733a50270aedccb93f8c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="virtualServiceNameInput")
    def virtual_service_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "virtualServiceNameInput"))

    @builtins.property
    @jsii.member(jsii_name="virtualServiceName")
    def virtual_service_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "virtualServiceName"))

    @virtual_service_name.setter
    def virtual_service_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a68b2aa825554597a559f57e79bf78f719b3f0a372e2f7c0c55873b2ae710555)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "virtualServiceName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a8c3cd9296c5a48e940e402a386db8872bbd6b2eb2ec8f42bebefa0b407623d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatch",
    jsii_struct_bases=[],
    name_mapping={
        "header": "header",
        "hostname": "hostname",
        "path": "path",
        "port": "port",
        "prefix": "prefix",
        "query_parameter": "queryParameter",
    },
)
class AppmeshGatewayRouteSpecHttp2RouteMatch:
    def __init__(
        self,
        *,
        header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AppmeshGatewayRouteSpecHttp2RouteMatchHeader", typing.Dict[builtins.str, typing.Any]]]]] = None,
        hostname: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteMatchHostname", typing.Dict[builtins.str, typing.Any]]] = None,
        path: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteMatchPath", typing.Dict[builtins.str, typing.Any]]] = None,
        port: typing.Optional[jsii.Number] = None,
        prefix: typing.Optional[builtins.str] = None,
        query_parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param header: header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#header AppmeshGatewayRoute#header}
        :param hostname: hostname block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        :param path: path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.
        :param query_parameter: query_parameter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#query_parameter AppmeshGatewayRoute#query_parameter}
        '''
        if isinstance(hostname, dict):
            hostname = AppmeshGatewayRouteSpecHttp2RouteMatchHostname(**hostname)
        if isinstance(path, dict):
            path = AppmeshGatewayRouteSpecHttp2RouteMatchPath(**path)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0918b8b9e29543ae3482336c78c43cc7102ba8f721ded8ea2784937843c347c)
            check_type(argname="argument header", value=header, expected_type=type_hints["header"])
            check_type(argname="argument hostname", value=hostname, expected_type=type_hints["hostname"])
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
            check_type(argname="argument port", value=port, expected_type=type_hints["port"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
            check_type(argname="argument query_parameter", value=query_parameter, expected_type=type_hints["query_parameter"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if header is not None:
            self._values["header"] = header
        if hostname is not None:
            self._values["hostname"] = hostname
        if path is not None:
            self._values["path"] = path
        if port is not None:
            self._values["port"] = port
        if prefix is not None:
            self._values["prefix"] = prefix
        if query_parameter is not None:
            self._values["query_parameter"] = query_parameter

    @builtins.property
    def header(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttp2RouteMatchHeader"]]]:
        '''header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#header AppmeshGatewayRoute#header}
        '''
        result = self._values.get("header")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttp2RouteMatchHeader"]]], result)

    @builtins.property
    def hostname(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchHostname"]:
        '''hostname block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        '''
        result = self._values.get("hostname")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchHostname"], result)

    @builtins.property
    def path(self) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchPath"]:
        '''path block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        '''
        result = self._values.get("path")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchPath"], result)

    @builtins.property
    def port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.'''
        result = self._values.get("port")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def query_parameter(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter"]]]:
        '''query_parameter block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#query_parameter AppmeshGatewayRoute#query_parameter}
        '''
        result = self._values.get("query_parameter")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "invert": "invert", "match": "match"},
)
class AppmeshGatewayRouteSpecHttp2RouteMatchHeader:
    def __init__(
        self,
        *,
        name: builtins.str,
        invert: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        match: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.
        :param invert: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#invert AppmeshGatewayRoute#invert}.
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        if isinstance(match, dict):
            match = AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch(**match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3a25a159429f9be1119d288044e6bc3dd925fdf58838f0ced39b9c6164fa45c)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument invert", value=invert, expected_type=type_hints["invert"])
            check_type(argname="argument match", value=match, expected_type=type_hints["match"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
        }
        if invert is not None:
            self._values["invert"] = invert
        if match is not None:
            self._values["match"] = match

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def invert(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#invert AppmeshGatewayRoute#invert}.'''
        result = self._values.get("invert")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def match(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch"]:
        '''match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        result = self._values.get("match")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteMatchHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteMatchHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__999291086dd9a14a83cb5eb5ca9383a576d5c31708392bcca510b41a28661172)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "AppmeshGatewayRouteSpecHttp2RouteMatchHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75d6c190e612b4ae19984a9a54a93fc93c63488a99fec314bbad839064ae588d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteMatchHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ea06c3794833dea0368cf2811aef7e7b7c4fa288f1168e5194fb307fe83ab58)
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
            type_hints = typing.get_type_hints(_typecheckingstub__584124aa0934acb8cf9effed0d89f05b27f9441fa4728503502f7fb8960e8ac5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4346d406783cbe7813745921abfc0a6b7fb6239f7ad9265b1aa719f8ac308960)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttp2RouteMatchHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttp2RouteMatchHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttp2RouteMatchHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__941a68abca14d55f3469f99464ac11501652b8aceb99ad5b847970a9fedea692)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch",
    jsii_struct_bases=[],
    name_mapping={
        "exact": "exact",
        "prefix": "prefix",
        "range": "range",
        "regex": "regex",
        "suffix": "suffix",
    },
)
class AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch:
    def __init__(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        prefix: typing.Optional[builtins.str] = None,
        range: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange", typing.Dict[builtins.str, typing.Any]]] = None,
        regex: typing.Optional[builtins.str] = None,
        suffix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.
        :param range: range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#range AppmeshGatewayRoute#range}
        :param regex: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.
        :param suffix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.
        '''
        if isinstance(range, dict):
            range = AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange(**range)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73616bdfd2cbbdca0375bb59dfcc7c284bb11e015bae70c9dc21dc33c43d01b2)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
            check_type(argname="argument range", value=range, expected_type=type_hints["range"])
            check_type(argname="argument regex", value=regex, expected_type=type_hints["regex"])
            check_type(argname="argument suffix", value=suffix, expected_type=type_hints["suffix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if exact is not None:
            self._values["exact"] = exact
        if prefix is not None:
            self._values["prefix"] = prefix
        if range is not None:
            self._values["range"] = range
        if regex is not None:
            self._values["regex"] = regex
        if suffix is not None:
            self._values["suffix"] = suffix

    @builtins.property
    def exact(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.'''
        result = self._values.get("exact")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def range(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange"]:
        '''range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#range AppmeshGatewayRoute#range}
        '''
        result = self._values.get("range")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange"], result)

    @builtins.property
    def regex(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.'''
        result = self._values.get("regex")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def suffix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.'''
        result = self._values.get("suffix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b92e5d3cc614c83d8d9675c32101ae873d34d7bb4f417348231e7045f3628f8b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRange")
    def put_range(self, *, end: jsii.Number, start: jsii.Number) -> None:
        '''
        :param end: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#end AppmeshGatewayRoute#end}.
        :param start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#start AppmeshGatewayRoute#start}.
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange(
            end=end, start=start
        )

        return typing.cast(None, jsii.invoke(self, "putRange", [value]))

    @jsii.member(jsii_name="resetExact")
    def reset_exact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExact", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @jsii.member(jsii_name="resetRange")
    def reset_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRange", []))

    @jsii.member(jsii_name="resetRegex")
    def reset_regex(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegex", []))

    @jsii.member(jsii_name="resetSuffix")
    def reset_suffix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSuffix", []))

    @builtins.property
    @jsii.member(jsii_name="range")
    def range(
        self,
    ) -> "AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRangeOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRangeOutputReference", jsii.get(self, "range"))

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="rangeInput")
    def range_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange"], jsii.get(self, "rangeInput"))

    @builtins.property
    @jsii.member(jsii_name="regexInput")
    def regex_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regexInput"))

    @builtins.property
    @jsii.member(jsii_name="suffixInput")
    def suffix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "suffixInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b386a457e52ba1440ee11cd5caf1f016b1a6fea32f35b7ea69c2969a85afb3bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2732eaaeea680be8956dceb09c4dec9b4edd9d8b0dd1d98f9984f9e880922e2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="regex")
    def regex(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "regex"))

    @regex.setter
    def regex(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d780f64852e48b0decc6be55b84f35c79053d6bb7a2d729020f4090261c30b0e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "regex", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="suffix")
    def suffix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "suffix"))

    @suffix.setter
    def suffix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87d7f544dc29a313e5f40124927d9feeade003d0939efdd81260d767cc04f0a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "suffix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14ae4685597ca2e940f086a0b1382d8887e1780e14a7c0cb31b9f9d5d35841ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange",
    jsii_struct_bases=[],
    name_mapping={"end": "end", "start": "start"},
)
class AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange:
    def __init__(self, *, end: jsii.Number, start: jsii.Number) -> None:
        '''
        :param end: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#end AppmeshGatewayRoute#end}.
        :param start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#start AppmeshGatewayRoute#start}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0fbae6b6454a490c30fc3c7c346364e550a770d4ca3c6e34a1eae3c2764ebe8)
            check_type(argname="argument end", value=end, expected_type=type_hints["end"])
            check_type(argname="argument start", value=start, expected_type=type_hints["start"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "end": end,
            "start": start,
        }

    @builtins.property
    def end(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#end AppmeshGatewayRoute#end}.'''
        result = self._values.get("end")
        assert result is not None, "Required property 'end' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def start(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#start AppmeshGatewayRoute#start}.'''
        result = self._values.get("start")
        assert result is not None, "Required property 'start' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3e5f8d6a36befb4863a86fe04ec029357ae3026ef36efe03001f5ebb2228e2f6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="endInput")
    def end_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "endInput"))

    @builtins.property
    @jsii.member(jsii_name="startInput")
    def start_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "startInput"))

    @builtins.property
    @jsii.member(jsii_name="end")
    def end(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "end"))

    @end.setter
    def end(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9d8b4020b8da433c25a210bb58686ecab14cedc2801a88da481429c2d0731da)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "end", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="start")
    def start(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "start"))

    @start.setter
    def start(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b98d18b26e8277348aae0fc46ed36b1eebc434d54a0370fcdc9b6fb8a9a40bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "start", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__28453dd76c177b94d538511b9502e812dd79ad21dd552c862f7a9f5dd36d6458)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecHttp2RouteMatchHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5103a764f8e05e1427208606947b3bc40ee6cc783dfa0b36b8473341287fa2d0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMatch")
    def put_match(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        prefix: typing.Optional[builtins.str] = None,
        range: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange, typing.Dict[builtins.str, typing.Any]]] = None,
        regex: typing.Optional[builtins.str] = None,
        suffix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.
        :param range: range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#range AppmeshGatewayRoute#range}
        :param regex: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.
        :param suffix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch(
            exact=exact, prefix=prefix, range=range, regex=regex, suffix=suffix
        )

        return typing.cast(None, jsii.invoke(self, "putMatch", [value]))

    @jsii.member(jsii_name="resetInvert")
    def reset_invert(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInvert", []))

    @jsii.member(jsii_name="resetMatch")
    def reset_match(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMatch", []))

    @builtins.property
    @jsii.member(jsii_name="match")
    def match(self) -> AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchOutputReference, jsii.get(self, "match"))

    @builtins.property
    @jsii.member(jsii_name="invertInput")
    def invert_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "invertInput"))

    @builtins.property
    @jsii.member(jsii_name="matchInput")
    def match_input(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch], jsii.get(self, "matchInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="invert")
    def invert(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "invert"))

    @invert.setter
    def invert(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__226762b4616ac2a7a11aa763ef932b81650d08b19256b3a159f1ec097cb6087a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "invert", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d35e67d58b8a620cc3c498edf84e619bfe2c00f6b8790475207575075d89e9c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttp2RouteMatchHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttp2RouteMatchHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttp2RouteMatchHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5c531fd628402195159f3e8c6d064a86755ce93355527f5ccc71b4c3946da51)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHostname",
    jsii_struct_bases=[],
    name_mapping={"exact": "exact", "suffix": "suffix"},
)
class AppmeshGatewayRouteSpecHttp2RouteMatchHostname:
    def __init__(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        suffix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param suffix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5da2b88496ec4d660d49886fc63c8b820015352281c865eec2c58c0ae68a90bd)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
            check_type(argname="argument suffix", value=suffix, expected_type=type_hints["suffix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if exact is not None:
            self._values["exact"] = exact
        if suffix is not None:
            self._values["suffix"] = suffix

    @builtins.property
    def exact(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.'''
        result = self._values.get("exact")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def suffix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.'''
        result = self._values.get("suffix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteMatchHostname(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteMatchHostnameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHostnameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1779a06e416cc939b475a5a128a9782b4b1acec7b0ce36ca6c0e81c33c19ea68)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExact")
    def reset_exact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExact", []))

    @jsii.member(jsii_name="resetSuffix")
    def reset_suffix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSuffix", []))

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="suffixInput")
    def suffix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "suffixInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fcbbd5d8f86e32c2aabd81c8cb90acdcffac69630eb98af2b3bab533215bddc7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="suffix")
    def suffix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "suffix"))

    @suffix.setter
    def suffix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b20320ff05e8cbc494267b4cd955eb644941c4a2e756d608eeeafa8b9ff7ebaf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "suffix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHostname]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHostname], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHostname],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1935cf360c51204f58faaee1e26f275dfeeec6ce6390c2789ed074132010a6c3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecHttp2RouteMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__074339a247df0727aad27b639a0eedc60bada052335be024bfa974ac71136db9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putHeader")
    def put_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d373eaf733e7a3d298df0b70c034bba223d11bd76d4df2aa640709a2e4f9d048)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putHeader", [value]))

    @jsii.member(jsii_name="putHostname")
    def put_hostname(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        suffix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param suffix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteMatchHostname(
            exact=exact, suffix=suffix
        )

        return typing.cast(None, jsii.invoke(self, "putHostname", [value]))

    @jsii.member(jsii_name="putPath")
    def put_path(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        regex: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param regex: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteMatchPath(exact=exact, regex=regex)

        return typing.cast(None, jsii.invoke(self, "putPath", [value]))

    @jsii.member(jsii_name="putQueryParameter")
    def put_query_parameter(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__afc13e98d771b21a97aeba8125d66048744290055fc823025a9e36c07a78c5f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putQueryParameter", [value]))

    @jsii.member(jsii_name="resetHeader")
    def reset_header(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHeader", []))

    @jsii.member(jsii_name="resetHostname")
    def reset_hostname(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHostname", []))

    @jsii.member(jsii_name="resetPath")
    def reset_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPath", []))

    @jsii.member(jsii_name="resetPort")
    def reset_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPort", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @jsii.member(jsii_name="resetQueryParameter")
    def reset_query_parameter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQueryParameter", []))

    @builtins.property
    @jsii.member(jsii_name="header")
    def header(self) -> AppmeshGatewayRouteSpecHttp2RouteMatchHeaderList:
        return typing.cast(AppmeshGatewayRouteSpecHttp2RouteMatchHeaderList, jsii.get(self, "header"))

    @builtins.property
    @jsii.member(jsii_name="hostname")
    def hostname(self) -> AppmeshGatewayRouteSpecHttp2RouteMatchHostnameOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttp2RouteMatchHostnameOutputReference, jsii.get(self, "hostname"))

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(self) -> "AppmeshGatewayRouteSpecHttp2RouteMatchPathOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteMatchPathOutputReference", jsii.get(self, "path"))

    @builtins.property
    @jsii.member(jsii_name="queryParameter")
    def query_parameter(
        self,
    ) -> "AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterList":
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterList", jsii.get(self, "queryParameter"))

    @builtins.property
    @jsii.member(jsii_name="headerInput")
    def header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttp2RouteMatchHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttp2RouteMatchHeader]]], jsii.get(self, "headerInput"))

    @builtins.property
    @jsii.member(jsii_name="hostnameInput")
    def hostname_input(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHostname]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHostname], jsii.get(self, "hostnameInput"))

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchPath"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchPath"], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="portInput")
    def port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "portInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="queryParameterInput")
    def query_parameter_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter"]]], jsii.get(self, "queryParameterInput"))

    @builtins.property
    @jsii.member(jsii_name="port")
    def port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "port"))

    @port.setter
    def port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3997576df0d70be134b6b32a3103d8bee573ee16c3cf1b6e05da49c6b5aa539e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "port", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ddd412045304c5ab9bdc11a39ee1d9160178578905f8695c9b7cf01cb9c175c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4397fcf97d0bf76179070b7a1c4f40e90cf682e24f82b869cb87ea66d2c2bfb5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchPath",
    jsii_struct_bases=[],
    name_mapping={"exact": "exact", "regex": "regex"},
)
class AppmeshGatewayRouteSpecHttp2RouteMatchPath:
    def __init__(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        regex: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param regex: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f4777b2fd6eb88c8040588607c923048cdb7e8ed074f5cb1bf9f51e615a41f4)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
            check_type(argname="argument regex", value=regex, expected_type=type_hints["regex"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if exact is not None:
            self._values["exact"] = exact
        if regex is not None:
            self._values["regex"] = regex

    @builtins.property
    def exact(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.'''
        result = self._values.get("exact")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def regex(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.'''
        result = self._values.get("regex")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteMatchPath(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteMatchPathOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchPathOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__19ea6d3f29f8b2ba4b4f6347cbf457e9b56e5d01a2f1657560d1b359253326ae)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExact")
    def reset_exact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExact", []))

    @jsii.member(jsii_name="resetRegex")
    def reset_regex(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegex", []))

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="regexInput")
    def regex_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regexInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d6695e20a2ba32d3566b72107906547387b2cf2003addc6fc591563a004f2c4c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="regex")
    def regex(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "regex"))

    @regex.setter
    def regex(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ffd2b64b981a7a3ebfcba6ea097010431eba115d4e2edfe444938ffc65a5d5f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "regex", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchPath]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchPath], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchPath],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__587f03a8c6c700c12b37f211baed9088a47419f2c2238d52dbaefe3184eedda7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "match": "match"},
)
class AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter:
    def __init__(
        self,
        *,
        name: builtins.str,
        match: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        if isinstance(match, dict):
            match = AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch(**match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cfd3dd7c0e3279e61270b846ca581ef869aa469bd665f3221a27c37401286667)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument match", value=match, expected_type=type_hints["match"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
        }
        if match is not None:
            self._values["match"] = match

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def match(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch"]:
        '''match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        result = self._values.get("match")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bf1d895a7351d2902ec466784d622b38ea48cb173d8e8f1350ba1fd54c49c4ac)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__584eff82c1f070578872f448be80c6987cdd6248881d234f7f5f9a4f56c9d6ec)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e5b651505c4e37d156672e5453ed4ea6e072ecfe992bcf656ec97ed40b3375b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__38ae76e49a4cffbe801d2145ca31b462d07eb62f22b799d9602cf31efb5e3a43)
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
            type_hints = typing.get_type_hints(_typecheckingstub__113ca60cd1cb6f3c3ea68385122794c83abd48e4db5912f3cd059257caf10bc4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__539ce21d55058743bcd284f5841cedf2bc47ecf1dbc2f01078367cc90cb5d4ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch",
    jsii_struct_bases=[],
    name_mapping={"exact": "exact"},
)
class AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch:
    def __init__(self, *, exact: typing.Optional[builtins.str] = None) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02582c4e4a67f0177523422db55e9001f1de918032c8b3211e823b7e1242a474)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if exact is not None:
            self._values["exact"] = exact

    @builtins.property
    def exact(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.'''
        result = self._values.get("exact")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f714142f0e8178ab98bc1213f64867aa89f5df243f57cfca5db3cad2e3d9bb00)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExact")
    def reset_exact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExact", []))

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3ccd65f4c2fc4cbfc37f959ffe0463ff05298a3d3c400d87fd2877456077a46)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff17f2e2e783644331ee0f333d9d170c8a8dd8ceeffb7234147028415a1ba285)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fd56099291b9e29e9a87b9a6239f292d8ef27929936bb74364a9262bff74cf1e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMatch")
    def put_match(self, *, exact: typing.Optional[builtins.str] = None) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch(exact=exact)

        return typing.cast(None, jsii.invoke(self, "putMatch", [value]))

    @jsii.member(jsii_name="resetMatch")
    def reset_match(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMatch", []))

    @builtins.property
    @jsii.member(jsii_name="match")
    def match(
        self,
    ) -> AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatchOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatchOutputReference, jsii.get(self, "match"))

    @builtins.property
    @jsii.member(jsii_name="matchInput")
    def match_input(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch], jsii.get(self, "matchInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__34ec0059622f597968af21f121fd8d1fe2d6f6306d1d442b3b2fafa899d07a5d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0138e48777a168179749d327e1cc6c07ce989308751e33096e3e855b689764aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecHttp2RouteOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a3da95e7e7595f6066727ff9fa0662ec0bf16f220accfcca00e43435009c9516)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAction")
    def put_action(
        self,
        *,
        target: typing.Union[AppmeshGatewayRouteSpecHttp2RouteActionTarget, typing.Dict[builtins.str, typing.Any]],
        rewrite: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteActionRewrite, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param target: target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
        :param rewrite: rewrite block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#rewrite AppmeshGatewayRoute#rewrite}
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteAction(target=target, rewrite=rewrite)

        return typing.cast(None, jsii.invoke(self, "putAction", [value]))

    @jsii.member(jsii_name="putMatch")
    def put_match(
        self,
        *,
        header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchHeader, typing.Dict[builtins.str, typing.Any]]]]] = None,
        hostname: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchHostname, typing.Dict[builtins.str, typing.Any]]] = None,
        path: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchPath, typing.Dict[builtins.str, typing.Any]]] = None,
        port: typing.Optional[jsii.Number] = None,
        prefix: typing.Optional[builtins.str] = None,
        query_parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param header: header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#header AppmeshGatewayRoute#header}
        :param hostname: hostname block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        :param path: path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.
        :param query_parameter: query_parameter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#query_parameter AppmeshGatewayRoute#query_parameter}
        '''
        value = AppmeshGatewayRouteSpecHttp2RouteMatch(
            header=header,
            hostname=hostname,
            path=path,
            port=port,
            prefix=prefix,
            query_parameter=query_parameter,
        )

        return typing.cast(None, jsii.invoke(self, "putMatch", [value]))

    @builtins.property
    @jsii.member(jsii_name="action")
    def action(self) -> AppmeshGatewayRouteSpecHttp2RouteActionOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttp2RouteActionOutputReference, jsii.get(self, "action"))

    @builtins.property
    @jsii.member(jsii_name="match")
    def match(self) -> AppmeshGatewayRouteSpecHttp2RouteMatchOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttp2RouteMatchOutputReference, jsii.get(self, "match"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(self) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteAction]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteAction], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="matchInput")
    def match_input(self) -> typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatch], jsii.get(self, "matchInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AppmeshGatewayRouteSpecHttp2Route]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2Route], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttp2Route],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6556172d0c127901a9219e1c554438e1b42facc6e174980cad70f1902f9dee4c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRoute",
    jsii_struct_bases=[],
    name_mapping={"action": "action", "match": "match"},
)
class AppmeshGatewayRouteSpecHttpRoute:
    def __init__(
        self,
        *,
        action: typing.Union["AppmeshGatewayRouteSpecHttpRouteAction", typing.Dict[builtins.str, typing.Any]],
        match: typing.Union["AppmeshGatewayRouteSpecHttpRouteMatch", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        if isinstance(action, dict):
            action = AppmeshGatewayRouteSpecHttpRouteAction(**action)
        if isinstance(match, dict):
            match = AppmeshGatewayRouteSpecHttpRouteMatch(**match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33ead66e1ef18e39230de37b614acc7dbebc3d8f7105ca6e0257f489fb42354c)
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument match", value=match, expected_type=type_hints["match"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action": action,
            "match": match,
        }

    @builtins.property
    def action(self) -> "AppmeshGatewayRouteSpecHttpRouteAction":
        '''action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
        '''
        result = self._values.get("action")
        assert result is not None, "Required property 'action' is missing"
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteAction", result)

    @builtins.property
    def match(self) -> "AppmeshGatewayRouteSpecHttpRouteMatch":
        '''match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        result = self._values.get("match")
        assert result is not None, "Required property 'match' is missing"
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteMatch", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRoute(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteAction",
    jsii_struct_bases=[],
    name_mapping={"target": "target", "rewrite": "rewrite"},
)
class AppmeshGatewayRouteSpecHttpRouteAction:
    def __init__(
        self,
        *,
        target: typing.Union["AppmeshGatewayRouteSpecHttpRouteActionTarget", typing.Dict[builtins.str, typing.Any]],
        rewrite: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteActionRewrite", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param target: target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
        :param rewrite: rewrite block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#rewrite AppmeshGatewayRoute#rewrite}
        '''
        if isinstance(target, dict):
            target = AppmeshGatewayRouteSpecHttpRouteActionTarget(**target)
        if isinstance(rewrite, dict):
            rewrite = AppmeshGatewayRouteSpecHttpRouteActionRewrite(**rewrite)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b597a6255dc21725f3b54c30a8cf96c3512d9abe1742323a5f6d28cd737d3f59)
            check_type(argname="argument target", value=target, expected_type=type_hints["target"])
            check_type(argname="argument rewrite", value=rewrite, expected_type=type_hints["rewrite"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "target": target,
        }
        if rewrite is not None:
            self._values["rewrite"] = rewrite

    @builtins.property
    def target(self) -> "AppmeshGatewayRouteSpecHttpRouteActionTarget":
        '''target block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
        '''
        result = self._values.get("target")
        assert result is not None, "Required property 'target' is missing"
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteActionTarget", result)

    @builtins.property
    def rewrite(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewrite"]:
        '''rewrite block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#rewrite AppmeshGatewayRoute#rewrite}
        '''
        result = self._values.get("rewrite")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewrite"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dcd5873c8b03f866f16b110fc1937cfef6886b1f78c345c2390b78e4e13b26da)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRewrite")
    def put_rewrite(
        self,
        *,
        hostname: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname", typing.Dict[builtins.str, typing.Any]]] = None,
        path: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteActionRewritePath", typing.Dict[builtins.str, typing.Any]]] = None,
        prefix: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param hostname: hostname block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        :param path: path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        :param prefix: prefix block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}
        '''
        value = AppmeshGatewayRouteSpecHttpRouteActionRewrite(
            hostname=hostname, path=path, prefix=prefix
        )

        return typing.cast(None, jsii.invoke(self, "putRewrite", [value]))

    @jsii.member(jsii_name="putTarget")
    def put_target(
        self,
        *,
        virtual_service: typing.Union["AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService", typing.Dict[builtins.str, typing.Any]],
        port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param virtual_service: virtual_service block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service AppmeshGatewayRoute#virtual_service}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        '''
        value = AppmeshGatewayRouteSpecHttpRouteActionTarget(
            virtual_service=virtual_service, port=port
        )

        return typing.cast(None, jsii.invoke(self, "putTarget", [value]))

    @jsii.member(jsii_name="resetRewrite")
    def reset_rewrite(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRewrite", []))

    @builtins.property
    @jsii.member(jsii_name="rewrite")
    def rewrite(self) -> "AppmeshGatewayRouteSpecHttpRouteActionRewriteOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteActionRewriteOutputReference", jsii.get(self, "rewrite"))

    @builtins.property
    @jsii.member(jsii_name="target")
    def target(self) -> "AppmeshGatewayRouteSpecHttpRouteActionTargetOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteActionTargetOutputReference", jsii.get(self, "target"))

    @builtins.property
    @jsii.member(jsii_name="rewriteInput")
    def rewrite_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewrite"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewrite"], jsii.get(self, "rewriteInput"))

    @builtins.property
    @jsii.member(jsii_name="targetInput")
    def target_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionTarget"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionTarget"], jsii.get(self, "targetInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteAction]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteAction], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteAction],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__951c906eecc4980e254099a3bdbc3bfb97c75f291ed30f6f3ffa262f1ed4687e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionRewrite",
    jsii_struct_bases=[],
    name_mapping={"hostname": "hostname", "path": "path", "prefix": "prefix"},
)
class AppmeshGatewayRouteSpecHttpRouteActionRewrite:
    def __init__(
        self,
        *,
        hostname: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname", typing.Dict[builtins.str, typing.Any]]] = None,
        path: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteActionRewritePath", typing.Dict[builtins.str, typing.Any]]] = None,
        prefix: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param hostname: hostname block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        :param path: path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        :param prefix: prefix block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}
        '''
        if isinstance(hostname, dict):
            hostname = AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname(**hostname)
        if isinstance(path, dict):
            path = AppmeshGatewayRouteSpecHttpRouteActionRewritePath(**path)
        if isinstance(prefix, dict):
            prefix = AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix(**prefix)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6715a64235161d1d1dd6516dc9d4838534f47f68f0d313a88c83b11031b1f845)
            check_type(argname="argument hostname", value=hostname, expected_type=type_hints["hostname"])
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if hostname is not None:
            self._values["hostname"] = hostname
        if path is not None:
            self._values["path"] = path
        if prefix is not None:
            self._values["prefix"] = prefix

    @builtins.property
    def hostname(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname"]:
        '''hostname block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        '''
        result = self._values.get("hostname")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname"], result)

    @builtins.property
    def path(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewritePath"]:
        '''path block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        '''
        result = self._values.get("path")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewritePath"], result)

    @builtins.property
    def prefix(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix"]:
        '''prefix block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}
        '''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteActionRewrite(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname",
    jsii_struct_bases=[],
    name_mapping={"default_target_hostname": "defaultTargetHostname"},
)
class AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname:
    def __init__(self, *, default_target_hostname: builtins.str) -> None:
        '''
        :param default_target_hostname: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_target_hostname AppmeshGatewayRoute#default_target_hostname}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76998c61b8bcae2218bccedf1343f4804e97f1205d475dfada177154f348ba0b)
            check_type(argname="argument default_target_hostname", value=default_target_hostname, expected_type=type_hints["default_target_hostname"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_target_hostname": default_target_hostname,
        }

    @builtins.property
    def default_target_hostname(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_target_hostname AppmeshGatewayRoute#default_target_hostname}.'''
        result = self._values.get("default_target_hostname")
        assert result is not None, "Required property 'default_target_hostname' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteActionRewriteHostnameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionRewriteHostnameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__15d3b9760cc5f4796b5be73f04876f3fe0dc5646ee7e405c548505c941e36a57)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="defaultTargetHostnameInput")
    def default_target_hostname_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultTargetHostnameInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultTargetHostname")
    def default_target_hostname(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultTargetHostname"))

    @default_target_hostname.setter
    def default_target_hostname(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__91ebf8adefe30e9b63daca56537b00687c89b8a972aa6581ef6e1d98773baaa9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultTargetHostname", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b5594156d6d19d69c51cad00446f58d71e90347f193240f93217bf86ccab1504)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecHttpRouteActionRewriteOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionRewriteOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__590d81ca5027b731a8c720e0813fd94d18dd5668ce2c38f83d9f71f423588e21)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putHostname")
    def put_hostname(self, *, default_target_hostname: builtins.str) -> None:
        '''
        :param default_target_hostname: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_target_hostname AppmeshGatewayRoute#default_target_hostname}.
        '''
        value = AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname(
            default_target_hostname=default_target_hostname
        )

        return typing.cast(None, jsii.invoke(self, "putHostname", [value]))

    @jsii.member(jsii_name="putPath")
    def put_path(self, *, exact: builtins.str) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        '''
        value = AppmeshGatewayRouteSpecHttpRouteActionRewritePath(exact=exact)

        return typing.cast(None, jsii.invoke(self, "putPath", [value]))

    @jsii.member(jsii_name="putPrefix")
    def put_prefix(
        self,
        *,
        default_prefix: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_prefix AppmeshGatewayRoute#default_prefix}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#value AppmeshGatewayRoute#value}.
        '''
        value_ = AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix(
            default_prefix=default_prefix, value=value
        )

        return typing.cast(None, jsii.invoke(self, "putPrefix", [value_]))

    @jsii.member(jsii_name="resetHostname")
    def reset_hostname(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHostname", []))

    @jsii.member(jsii_name="resetPath")
    def reset_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPath", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="hostname")
    def hostname(
        self,
    ) -> AppmeshGatewayRouteSpecHttpRouteActionRewriteHostnameOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttpRouteActionRewriteHostnameOutputReference, jsii.get(self, "hostname"))

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(
        self,
    ) -> "AppmeshGatewayRouteSpecHttpRouteActionRewritePathOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteActionRewritePathOutputReference", jsii.get(self, "path"))

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(
        self,
    ) -> "AppmeshGatewayRouteSpecHttpRouteActionRewritePrefixOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteActionRewritePrefixOutputReference", jsii.get(self, "prefix"))

    @builtins.property
    @jsii.member(jsii_name="hostnameInput")
    def hostname_input(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname], jsii.get(self, "hostnameInput"))

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewritePath"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewritePath"], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix"], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewrite]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewrite], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewrite],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fbbc6c0a7908801c9c7bc7266b85ab76492ca44c65c9b55dca4522ec8c8ab623)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionRewritePath",
    jsii_struct_bases=[],
    name_mapping={"exact": "exact"},
)
class AppmeshGatewayRouteSpecHttpRouteActionRewritePath:
    def __init__(self, *, exact: builtins.str) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5f9d885ff8b86e5d725a37ed20647de74aa03d2d9c079939908ee44b4a90a9b)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "exact": exact,
        }

    @builtins.property
    def exact(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.'''
        result = self._values.get("exact")
        assert result is not None, "Required property 'exact' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteActionRewritePath(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteActionRewritePathOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionRewritePathOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d553db971eac2029c8af9bef1437c8ad53fb5caa82dab4aee1b4d9f751bd5efe)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__166529b97578ebd7dd635745fd1c6957a28eb4a9ab1e83cfbf098b0c23ff4870)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewritePath]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewritePath], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewritePath],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb56b4713f60cc1248c9c508249a0579d314ea3afc7f32452329fde26a33ea96)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix",
    jsii_struct_bases=[],
    name_mapping={"default_prefix": "defaultPrefix", "value": "value"},
)
class AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix:
    def __init__(
        self,
        *,
        default_prefix: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_prefix AppmeshGatewayRoute#default_prefix}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#value AppmeshGatewayRoute#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02195a58e0ff18a5bcabe0dc802883be5e8a1a7ec58213c12cec3e7554b50653)
            check_type(argname="argument default_prefix", value=default_prefix, expected_type=type_hints["default_prefix"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if default_prefix is not None:
            self._values["default_prefix"] = default_prefix
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def default_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_prefix AppmeshGatewayRoute#default_prefix}.'''
        result = self._values.get("default_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#value AppmeshGatewayRoute#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteActionRewritePrefixOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionRewritePrefixOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c6c09c06bcf7ec47aff366090c03594f512ca5239634ef77590812df205aec69)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDefaultPrefix")
    def reset_default_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultPrefix", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="defaultPrefixInput")
    def default_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultPrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultPrefix")
    def default_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultPrefix"))

    @default_prefix.setter
    def default_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca53ad288d996b98bec434a89f39649d0576e377e4e4e87055f87c2b4bbaed66)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultPrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d16a09876d794a30f61d14db43dfdf84f910d9dfaba23410c40e1881ec8a46ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc4302a94cb3da7cf705e0c6bef0f1275f9368286b83b5861e9d09fff0cbd12c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionTarget",
    jsii_struct_bases=[],
    name_mapping={"virtual_service": "virtualService", "port": "port"},
)
class AppmeshGatewayRouteSpecHttpRouteActionTarget:
    def __init__(
        self,
        *,
        virtual_service: typing.Union["AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService", typing.Dict[builtins.str, typing.Any]],
        port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param virtual_service: virtual_service block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service AppmeshGatewayRoute#virtual_service}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        '''
        if isinstance(virtual_service, dict):
            virtual_service = AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService(**virtual_service)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86cfa0c1d7066bacb3d23840e507e908d262811eb617e119c936b1bbaf753349)
            check_type(argname="argument virtual_service", value=virtual_service, expected_type=type_hints["virtual_service"])
            check_type(argname="argument port", value=port, expected_type=type_hints["port"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "virtual_service": virtual_service,
        }
        if port is not None:
            self._values["port"] = port

    @builtins.property
    def virtual_service(
        self,
    ) -> "AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService":
        '''virtual_service block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service AppmeshGatewayRoute#virtual_service}
        '''
        result = self._values.get("virtual_service")
        assert result is not None, "Required property 'virtual_service' is missing"
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService", result)

    @builtins.property
    def port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.'''
        result = self._values.get("port")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteActionTarget(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteActionTargetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionTargetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6c48a0cb14c2c8e2d20c81f5a373c1e1435eb4867a1a136f5637e2c8c4bbf5ea)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putVirtualService")
    def put_virtual_service(self, *, virtual_service_name: builtins.str) -> None:
        '''
        :param virtual_service_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service_name AppmeshGatewayRoute#virtual_service_name}.
        '''
        value = AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService(
            virtual_service_name=virtual_service_name
        )

        return typing.cast(None, jsii.invoke(self, "putVirtualService", [value]))

    @jsii.member(jsii_name="resetPort")
    def reset_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPort", []))

    @builtins.property
    @jsii.member(jsii_name="virtualService")
    def virtual_service(
        self,
    ) -> "AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualServiceOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualServiceOutputReference", jsii.get(self, "virtualService"))

    @builtins.property
    @jsii.member(jsii_name="portInput")
    def port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "portInput"))

    @builtins.property
    @jsii.member(jsii_name="virtualServiceInput")
    def virtual_service_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService"], jsii.get(self, "virtualServiceInput"))

    @builtins.property
    @jsii.member(jsii_name="port")
    def port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "port"))

    @port.setter
    def port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14646bfea9d7c15b56ddac455fb108042ca0ae19a8621e9366991c679a88bd15)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "port", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionTarget]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionTarget], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionTarget],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4133a930d1303b872fe28732879377c1e24a4566019358e19ae794b9efce48f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService",
    jsii_struct_bases=[],
    name_mapping={"virtual_service_name": "virtualServiceName"},
)
class AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService:
    def __init__(self, *, virtual_service_name: builtins.str) -> None:
        '''
        :param virtual_service_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service_name AppmeshGatewayRoute#virtual_service_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79216cbe1eb67d9ab4f0509f2dec3c0343f83df99cb7881ba3c05de35320a925)
            check_type(argname="argument virtual_service_name", value=virtual_service_name, expected_type=type_hints["virtual_service_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "virtual_service_name": virtual_service_name,
        }

    @builtins.property
    def virtual_service_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#virtual_service_name AppmeshGatewayRoute#virtual_service_name}.'''
        result = self._values.get("virtual_service_name")
        assert result is not None, "Required property 'virtual_service_name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualServiceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualServiceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__07a568c80caad0228f32ffd35f6c940d0fbb5f91fe1334e2f411e04e50c993fa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="virtualServiceNameInput")
    def virtual_service_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "virtualServiceNameInput"))

    @builtins.property
    @jsii.member(jsii_name="virtualServiceName")
    def virtual_service_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "virtualServiceName"))

    @virtual_service_name.setter
    def virtual_service_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46de8222c679f4affd2d701c48602197049bcc7109b84ab0b19d57ff5b179e8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "virtualServiceName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e4df9a30985ab336d61cf822ab08fa3ae3f84acba724925b2d8fff7a55df7caa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatch",
    jsii_struct_bases=[],
    name_mapping={
        "header": "header",
        "hostname": "hostname",
        "path": "path",
        "port": "port",
        "prefix": "prefix",
        "query_parameter": "queryParameter",
    },
)
class AppmeshGatewayRouteSpecHttpRouteMatch:
    def __init__(
        self,
        *,
        header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AppmeshGatewayRouteSpecHttpRouteMatchHeader", typing.Dict[builtins.str, typing.Any]]]]] = None,
        hostname: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteMatchHostname", typing.Dict[builtins.str, typing.Any]]] = None,
        path: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteMatchPath", typing.Dict[builtins.str, typing.Any]]] = None,
        port: typing.Optional[jsii.Number] = None,
        prefix: typing.Optional[builtins.str] = None,
        query_parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param header: header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#header AppmeshGatewayRoute#header}
        :param hostname: hostname block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        :param path: path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.
        :param query_parameter: query_parameter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#query_parameter AppmeshGatewayRoute#query_parameter}
        '''
        if isinstance(hostname, dict):
            hostname = AppmeshGatewayRouteSpecHttpRouteMatchHostname(**hostname)
        if isinstance(path, dict):
            path = AppmeshGatewayRouteSpecHttpRouteMatchPath(**path)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e7587cfcf9964652f282ea89969e68ddcba711e40c1eed026d26e8242419b474)
            check_type(argname="argument header", value=header, expected_type=type_hints["header"])
            check_type(argname="argument hostname", value=hostname, expected_type=type_hints["hostname"])
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
            check_type(argname="argument port", value=port, expected_type=type_hints["port"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
            check_type(argname="argument query_parameter", value=query_parameter, expected_type=type_hints["query_parameter"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if header is not None:
            self._values["header"] = header
        if hostname is not None:
            self._values["hostname"] = hostname
        if path is not None:
            self._values["path"] = path
        if port is not None:
            self._values["port"] = port
        if prefix is not None:
            self._values["prefix"] = prefix
        if query_parameter is not None:
            self._values["query_parameter"] = query_parameter

    @builtins.property
    def header(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttpRouteMatchHeader"]]]:
        '''header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#header AppmeshGatewayRoute#header}
        '''
        result = self._values.get("header")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttpRouteMatchHeader"]]], result)

    @builtins.property
    def hostname(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchHostname"]:
        '''hostname block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        '''
        result = self._values.get("hostname")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchHostname"], result)

    @builtins.property
    def path(self) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchPath"]:
        '''path block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        '''
        result = self._values.get("path")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchPath"], result)

    @builtins.property
    def port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.'''
        result = self._values.get("port")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def query_parameter(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter"]]]:
        '''query_parameter block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#query_parameter AppmeshGatewayRoute#query_parameter}
        '''
        result = self._values.get("query_parameter")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "invert": "invert", "match": "match"},
)
class AppmeshGatewayRouteSpecHttpRouteMatchHeader:
    def __init__(
        self,
        *,
        name: builtins.str,
        invert: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        match: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.
        :param invert: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#invert AppmeshGatewayRoute#invert}.
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        if isinstance(match, dict):
            match = AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch(**match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c11c39c770cde7f8c7f6fe3d07880bcd14defc7312b3ea0f833dd2e713103fc5)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument invert", value=invert, expected_type=type_hints["invert"])
            check_type(argname="argument match", value=match, expected_type=type_hints["match"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
        }
        if invert is not None:
            self._values["invert"] = invert
        if match is not None:
            self._values["match"] = match

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def invert(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#invert AppmeshGatewayRoute#invert}.'''
        result = self._values.get("invert")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def match(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch"]:
        '''match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        result = self._values.get("match")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteMatchHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteMatchHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d8b10bfe3a358e3517ea222686e206687e45d8bab1b3cbe29607a637defa5449)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "AppmeshGatewayRouteSpecHttpRouteMatchHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d509f126766b40540476d4bfd132d9ae02ee6ad04c199b29acc0eeb738b0017b)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteMatchHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__381b9c7e10c65402649f2de48a22ec12233c72f9b37b1083a02a6f20dbdda5c0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0c9c655d3d2c9e865c9eb050c4172de0d4dc7a5694659f1247691f7bb57cc883)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a9043d789a35236f743b2ac2347f4e30c43740b154dfdb27f9a9faa2691c7c0e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttpRouteMatchHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttpRouteMatchHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttpRouteMatchHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5e6b2092a1b23697d3bc3d53094998883d0dcd10663cbc7d2ef66cfcb237f50)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch",
    jsii_struct_bases=[],
    name_mapping={
        "exact": "exact",
        "prefix": "prefix",
        "range": "range",
        "regex": "regex",
        "suffix": "suffix",
    },
)
class AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch:
    def __init__(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        prefix: typing.Optional[builtins.str] = None,
        range: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange", typing.Dict[builtins.str, typing.Any]]] = None,
        regex: typing.Optional[builtins.str] = None,
        suffix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.
        :param range: range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#range AppmeshGatewayRoute#range}
        :param regex: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.
        :param suffix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.
        '''
        if isinstance(range, dict):
            range = AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange(**range)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a842d907f04a4a153fdcd472af6b70787f49ba5ece9dd4cd3c1781fe83c14a0f)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
            check_type(argname="argument range", value=range, expected_type=type_hints["range"])
            check_type(argname="argument regex", value=regex, expected_type=type_hints["regex"])
            check_type(argname="argument suffix", value=suffix, expected_type=type_hints["suffix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if exact is not None:
            self._values["exact"] = exact
        if prefix is not None:
            self._values["prefix"] = prefix
        if range is not None:
            self._values["range"] = range
        if regex is not None:
            self._values["regex"] = regex
        if suffix is not None:
            self._values["suffix"] = suffix

    @builtins.property
    def exact(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.'''
        result = self._values.get("exact")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def range(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange"]:
        '''range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#range AppmeshGatewayRoute#range}
        '''
        result = self._values.get("range")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange"], result)

    @builtins.property
    def regex(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.'''
        result = self._values.get("regex")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def suffix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.'''
        result = self._values.get("suffix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a3f8b8ca5ac772adb0b40a1fb63a1ca6db882aee878edbe6715a8579fc0dd166)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRange")
    def put_range(self, *, end: jsii.Number, start: jsii.Number) -> None:
        '''
        :param end: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#end AppmeshGatewayRoute#end}.
        :param start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#start AppmeshGatewayRoute#start}.
        '''
        value = AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange(
            end=end, start=start
        )

        return typing.cast(None, jsii.invoke(self, "putRange", [value]))

    @jsii.member(jsii_name="resetExact")
    def reset_exact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExact", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @jsii.member(jsii_name="resetRange")
    def reset_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRange", []))

    @jsii.member(jsii_name="resetRegex")
    def reset_regex(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegex", []))

    @jsii.member(jsii_name="resetSuffix")
    def reset_suffix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSuffix", []))

    @builtins.property
    @jsii.member(jsii_name="range")
    def range(
        self,
    ) -> "AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRangeOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRangeOutputReference", jsii.get(self, "range"))

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="rangeInput")
    def range_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange"], jsii.get(self, "rangeInput"))

    @builtins.property
    @jsii.member(jsii_name="regexInput")
    def regex_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regexInput"))

    @builtins.property
    @jsii.member(jsii_name="suffixInput")
    def suffix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "suffixInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d7bd48beef378caea3ec12b7aadb7643d3278df7bc13a7032ece988123c911a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb54b6df8a5c9cd7af1187fce035aac3a14ee3048a8574243fe41914c9ae67b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="regex")
    def regex(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "regex"))

    @regex.setter
    def regex(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a9c4e4d5bb72d60de0df932d3e763b987f8c7ea50e540f0c116a92a340ce062)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "regex", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="suffix")
    def suffix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "suffix"))

    @suffix.setter
    def suffix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bde0ec48291caf2c6a351c95ebc4a866791ca3a1572d4edd34f4036e28b53be8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "suffix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a612bb78fe5c8e91a3bb5930eb0d5e57991675ebb8cb156d49dcae65c94d943)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange",
    jsii_struct_bases=[],
    name_mapping={"end": "end", "start": "start"},
)
class AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange:
    def __init__(self, *, end: jsii.Number, start: jsii.Number) -> None:
        '''
        :param end: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#end AppmeshGatewayRoute#end}.
        :param start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#start AppmeshGatewayRoute#start}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__91eb396172f76ef7a1688d973c2316d5ce6fa4b034132a75f6e751618588add8)
            check_type(argname="argument end", value=end, expected_type=type_hints["end"])
            check_type(argname="argument start", value=start, expected_type=type_hints["start"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "end": end,
            "start": start,
        }

    @builtins.property
    def end(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#end AppmeshGatewayRoute#end}.'''
        result = self._values.get("end")
        assert result is not None, "Required property 'end' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def start(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#start AppmeshGatewayRoute#start}.'''
        result = self._values.get("start")
        assert result is not None, "Required property 'start' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b3d6bd7c21e2ab469b61858a677025c96a8b54e4075a24de446c9edff49ca09e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="endInput")
    def end_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "endInput"))

    @builtins.property
    @jsii.member(jsii_name="startInput")
    def start_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "startInput"))

    @builtins.property
    @jsii.member(jsii_name="end")
    def end(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "end"))

    @end.setter
    def end(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2989cdd0188bbe1031e721bb656055e0770ca5d5ba37b20dc4ed203d8e8edba4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "end", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="start")
    def start(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "start"))

    @start.setter
    def start(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dad35e4e2eb1dd20bffd6344cacdd3875f0b6b343b3536bf286f38703c2a6824)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "start", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__60fc4834580adc1d227b5f10f8dcad43f4cdfd7db29f674a1ec1c16889067e57)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecHttpRouteMatchHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1c0f55e6a3099c7bf80ce4b80340ce30b20beb0a62d257d21d5ecd3f6fd3582b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMatch")
    def put_match(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        prefix: typing.Optional[builtins.str] = None,
        range: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange, typing.Dict[builtins.str, typing.Any]]] = None,
        regex: typing.Optional[builtins.str] = None,
        suffix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.
        :param range: range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#range AppmeshGatewayRoute#range}
        :param regex: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.
        :param suffix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.
        '''
        value = AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch(
            exact=exact, prefix=prefix, range=range, regex=regex, suffix=suffix
        )

        return typing.cast(None, jsii.invoke(self, "putMatch", [value]))

    @jsii.member(jsii_name="resetInvert")
    def reset_invert(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInvert", []))

    @jsii.member(jsii_name="resetMatch")
    def reset_match(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMatch", []))

    @builtins.property
    @jsii.member(jsii_name="match")
    def match(self) -> AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchOutputReference, jsii.get(self, "match"))

    @builtins.property
    @jsii.member(jsii_name="invertInput")
    def invert_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "invertInput"))

    @builtins.property
    @jsii.member(jsii_name="matchInput")
    def match_input(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch], jsii.get(self, "matchInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="invert")
    def invert(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "invert"))

    @invert.setter
    def invert(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e033be498f71202b94f3e803a7dae16cb1e01c9288f6c4f3db8db917df58d67)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "invert", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e94ae54a60cfb6ac901c6e1d1cbc7b35d8f0f7c9d14349da2055f59749f503ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttpRouteMatchHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttpRouteMatchHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttpRouteMatchHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ecde63c73fceec426c8402901580c36370aface066e26f87c9b01c41213edf4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchHostname",
    jsii_struct_bases=[],
    name_mapping={"exact": "exact", "suffix": "suffix"},
)
class AppmeshGatewayRouteSpecHttpRouteMatchHostname:
    def __init__(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        suffix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param suffix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__958b0129fd819287ee91040a95b8c931457242374a3d7bdadf44d07d72f1f061)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
            check_type(argname="argument suffix", value=suffix, expected_type=type_hints["suffix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if exact is not None:
            self._values["exact"] = exact
        if suffix is not None:
            self._values["suffix"] = suffix

    @builtins.property
    def exact(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.'''
        result = self._values.get("exact")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def suffix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.'''
        result = self._values.get("suffix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteMatchHostname(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteMatchHostnameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchHostnameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__66521b969d496992844e3dc537d6a521de5ddf2bec7f0a5529e912a9bc5bd860)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExact")
    def reset_exact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExact", []))

    @jsii.member(jsii_name="resetSuffix")
    def reset_suffix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSuffix", []))

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="suffixInput")
    def suffix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "suffixInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b711a44de00acf63f0f61cd6a63ae2df67ba250fe0ca1e29d0945fc63055ef13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="suffix")
    def suffix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "suffix"))

    @suffix.setter
    def suffix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42d6c23cb7362e66a31643e1696c9b52214e16db1290109e9852bbf20b69accb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "suffix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHostname]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHostname], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHostname],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__988c69332d9baca89a4e4a878aebbe004de99896ea90a11352225523c178f32c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecHttpRouteMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f30448249dcf21f0899e9ccd3caa9f694f18ee62d4229decf0fc4205fd975a54)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putHeader")
    def put_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f8fbfa2936085d7662b4ca15d65a7f8eb019204d23fee90c232fcef27efdd13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putHeader", [value]))

    @jsii.member(jsii_name="putHostname")
    def put_hostname(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        suffix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param suffix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.
        '''
        value = AppmeshGatewayRouteSpecHttpRouteMatchHostname(
            exact=exact, suffix=suffix
        )

        return typing.cast(None, jsii.invoke(self, "putHostname", [value]))

    @jsii.member(jsii_name="putPath")
    def put_path(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        regex: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param regex: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.
        '''
        value = AppmeshGatewayRouteSpecHttpRouteMatchPath(exact=exact, regex=regex)

        return typing.cast(None, jsii.invoke(self, "putPath", [value]))

    @jsii.member(jsii_name="putQueryParameter")
    def put_query_parameter(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6922f8ff706bbed6de114a866ab42badcbf37338318982b3c3c380b5317076ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putQueryParameter", [value]))

    @jsii.member(jsii_name="resetHeader")
    def reset_header(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHeader", []))

    @jsii.member(jsii_name="resetHostname")
    def reset_hostname(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHostname", []))

    @jsii.member(jsii_name="resetPath")
    def reset_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPath", []))

    @jsii.member(jsii_name="resetPort")
    def reset_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPort", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @jsii.member(jsii_name="resetQueryParameter")
    def reset_query_parameter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQueryParameter", []))

    @builtins.property
    @jsii.member(jsii_name="header")
    def header(self) -> AppmeshGatewayRouteSpecHttpRouteMatchHeaderList:
        return typing.cast(AppmeshGatewayRouteSpecHttpRouteMatchHeaderList, jsii.get(self, "header"))

    @builtins.property
    @jsii.member(jsii_name="hostname")
    def hostname(self) -> AppmeshGatewayRouteSpecHttpRouteMatchHostnameOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttpRouteMatchHostnameOutputReference, jsii.get(self, "hostname"))

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(self) -> "AppmeshGatewayRouteSpecHttpRouteMatchPathOutputReference":
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteMatchPathOutputReference", jsii.get(self, "path"))

    @builtins.property
    @jsii.member(jsii_name="queryParameter")
    def query_parameter(
        self,
    ) -> "AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterList":
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterList", jsii.get(self, "queryParameter"))

    @builtins.property
    @jsii.member(jsii_name="headerInput")
    def header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttpRouteMatchHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttpRouteMatchHeader]]], jsii.get(self, "headerInput"))

    @builtins.property
    @jsii.member(jsii_name="hostnameInput")
    def hostname_input(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHostname]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHostname], jsii.get(self, "hostnameInput"))

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchPath"]:
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchPath"], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="portInput")
    def port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "portInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="queryParameterInput")
    def query_parameter_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter"]]], jsii.get(self, "queryParameterInput"))

    @builtins.property
    @jsii.member(jsii_name="port")
    def port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "port"))

    @port.setter
    def port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be4d67edbd244db74ff80d9c68df645159438cd696aacc37fdcebb99db8eabec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "port", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33a17ce01c8147c8988e94f3e548fb6c6fccd730d1049fa4cf2f1e15013668dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eaeae8024ec7f4ad29fc38816bfcfe1fef97b2ec1c76722190a4313f34b14077)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchPath",
    jsii_struct_bases=[],
    name_mapping={"exact": "exact", "regex": "regex"},
)
class AppmeshGatewayRouteSpecHttpRouteMatchPath:
    def __init__(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        regex: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        :param regex: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c9e03867b1bd65431225e3f57ca301786348a4e2b66e742e6b240e7746f8a65d)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
            check_type(argname="argument regex", value=regex, expected_type=type_hints["regex"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if exact is not None:
            self._values["exact"] = exact
        if regex is not None:
            self._values["regex"] = regex

    @builtins.property
    def exact(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.'''
        result = self._values.get("exact")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def regex(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.'''
        result = self._values.get("regex")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteMatchPath(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteMatchPathOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchPathOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bc8797de2e9f333db564c6f2f99f06731cac496029a0e7a36a6a67378f6cf27d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExact")
    def reset_exact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExact", []))

    @jsii.member(jsii_name="resetRegex")
    def reset_regex(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegex", []))

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="regexInput")
    def regex_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regexInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb9dfdbf2d8dff49b82c57b8ce650f92fc359042de2b4c193b570f151afe7132)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="regex")
    def regex(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "regex"))

    @regex.setter
    def regex(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7fb9e13a9bb841c7aa29a7ad8d8e7389641d6b0020265127b913ec726f64b975)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "regex", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchPath]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchPath], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchPath],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c316606fca99036411f39fb24722ebe3520f0d439640f3b1528672528f0715fe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "match": "match"},
)
class AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter:
    def __init__(
        self,
        *,
        name: builtins.str,
        match: typing.Optional[typing.Union["AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        if isinstance(match, dict):
            match = AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch(**match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3b923a75bf133cdf0d17dc68e99f6716a717e6fc47530712a9652d975dcc45b)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument match", value=match, expected_type=type_hints["match"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
        }
        if match is not None:
            self._values["match"] = match

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def match(
        self,
    ) -> typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch"]:
        '''match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        result = self._values.get("match")
        return typing.cast(typing.Optional["AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b3b0c6a285dfd99119f3e5664821c0c5d6283a6a416e18f191ff2293ba1bd0b2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e6087738a868a65c7b73594f32457da6045a0bc1e9dee1230441d0617d27573)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9282f68efd43b00b254516475eca62f187b3ce8ec1d80a6506854cb086183d09)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bed2f8e59eeb0e6a5bf8cc393c84179572536aea00796f3e9c8f7563dc96712b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4fe92118116eaf307db499c53f5f27def0d3d91b2ffa0ecbb72abc81fbfebc50)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15eccff3cdcd6fbb858f105ddb9194f7813226a580e9d4973dd1cd9cb9fa895b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch",
    jsii_struct_bases=[],
    name_mapping={"exact": "exact"},
)
class AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch:
    def __init__(self, *, exact: typing.Optional[builtins.str] = None) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__baf1f2cfeb34b792c77dbe76b40d2815c42c986585636928aa4659844d4370bf)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if exact is not None:
            self._values["exact"] = exact

    @builtins.property
    def exact(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.'''
        result = self._values.get("exact")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__495af5fd016f6bb6c10fda9e3896a38f64dd2c31c30acd0efcfb98b43cc8102f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExact")
    def reset_exact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExact", []))

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c5e3e2cdbce71a3757e966688199b719cddbc516cd4c297ce6a7a28a8fe2bd5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ce24a3449aaa359ad3cb912dc83f1b2b2f08ef12e42ecfd373dfa690d4328d8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e050410877090f68cf112a23588d79debe80a889d91f656301e167cdc2388a81)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMatch")
    def put_match(self, *, exact: typing.Optional[builtins.str] = None) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
        '''
        value = AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch(exact=exact)

        return typing.cast(None, jsii.invoke(self, "putMatch", [value]))

    @jsii.member(jsii_name="resetMatch")
    def reset_match(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMatch", []))

    @builtins.property
    @jsii.member(jsii_name="match")
    def match(
        self,
    ) -> AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatchOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatchOutputReference, jsii.get(self, "match"))

    @builtins.property
    @jsii.member(jsii_name="matchInput")
    def match_input(
        self,
    ) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch], jsii.get(self, "matchInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__0bda7c3e3416e30185a8b9aeccbd41bb3df37fb196f379357cdca66099f6090e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__acd9b696b028f5ca372af5752089f7339a6dfd66c824c02d665989303ce1ae60)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecHttpRouteOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aa5be6974ed2d1ba1190a2fa5eabc9ab1f097683444d278acfa87a38a8e1c827)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAction")
    def put_action(
        self,
        *,
        target: typing.Union[AppmeshGatewayRouteSpecHttpRouteActionTarget, typing.Dict[builtins.str, typing.Any]],
        rewrite: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteActionRewrite, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param target: target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
        :param rewrite: rewrite block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#rewrite AppmeshGatewayRoute#rewrite}
        '''
        value = AppmeshGatewayRouteSpecHttpRouteAction(target=target, rewrite=rewrite)

        return typing.cast(None, jsii.invoke(self, "putAction", [value]))

    @jsii.member(jsii_name="putMatch")
    def put_match(
        self,
        *,
        header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchHeader, typing.Dict[builtins.str, typing.Any]]]]] = None,
        hostname: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchHostname, typing.Dict[builtins.str, typing.Any]]] = None,
        path: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchPath, typing.Dict[builtins.str, typing.Any]]] = None,
        port: typing.Optional[jsii.Number] = None,
        prefix: typing.Optional[builtins.str] = None,
        query_parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param header: header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#header AppmeshGatewayRoute#header}
        :param hostname: hostname block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
        :param path: path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.
        :param query_parameter: query_parameter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#query_parameter AppmeshGatewayRoute#query_parameter}
        '''
        value = AppmeshGatewayRouteSpecHttpRouteMatch(
            header=header,
            hostname=hostname,
            path=path,
            port=port,
            prefix=prefix,
            query_parameter=query_parameter,
        )

        return typing.cast(None, jsii.invoke(self, "putMatch", [value]))

    @builtins.property
    @jsii.member(jsii_name="action")
    def action(self) -> AppmeshGatewayRouteSpecHttpRouteActionOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttpRouteActionOutputReference, jsii.get(self, "action"))

    @builtins.property
    @jsii.member(jsii_name="match")
    def match(self) -> AppmeshGatewayRouteSpecHttpRouteMatchOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttpRouteMatchOutputReference, jsii.get(self, "match"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(self) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteAction]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteAction], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="matchInput")
    def match_input(self) -> typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatch]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatch], jsii.get(self, "matchInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AppmeshGatewayRouteSpecHttpRoute]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRoute], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AppmeshGatewayRouteSpecHttpRoute],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9ba3910886cd136eebe6ecea9cfeb65ff093280d749c7b0be57bb0bbb98fc350)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AppmeshGatewayRouteSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3da4d8e4b31d8d63c10cbc5c2f89480d4feab77388de18c528e7d3b6e08120c7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putGrpcRoute")
    def put_grpc_route(
        self,
        *,
        action: typing.Union[AppmeshGatewayRouteSpecGrpcRouteAction, typing.Dict[builtins.str, typing.Any]],
        match: typing.Union[AppmeshGatewayRouteSpecGrpcRouteMatch, typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        value = AppmeshGatewayRouteSpecGrpcRoute(action=action, match=match)

        return typing.cast(None, jsii.invoke(self, "putGrpcRoute", [value]))

    @jsii.member(jsii_name="putHttp2Route")
    def put_http2_route(
        self,
        *,
        action: typing.Union[AppmeshGatewayRouteSpecHttp2RouteAction, typing.Dict[builtins.str, typing.Any]],
        match: typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatch, typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        value = AppmeshGatewayRouteSpecHttp2Route(action=action, match=match)

        return typing.cast(None, jsii.invoke(self, "putHttp2Route", [value]))

    @jsii.member(jsii_name="putHttpRoute")
    def put_http_route(
        self,
        *,
        action: typing.Union[AppmeshGatewayRouteSpecHttpRouteAction, typing.Dict[builtins.str, typing.Any]],
        match: typing.Union[AppmeshGatewayRouteSpecHttpRouteMatch, typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
        '''
        value = AppmeshGatewayRouteSpecHttpRoute(action=action, match=match)

        return typing.cast(None, jsii.invoke(self, "putHttpRoute", [value]))

    @jsii.member(jsii_name="resetGrpcRoute")
    def reset_grpc_route(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGrpcRoute", []))

    @jsii.member(jsii_name="resetHttp2Route")
    def reset_http2_route(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHttp2Route", []))

    @jsii.member(jsii_name="resetHttpRoute")
    def reset_http_route(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHttpRoute", []))

    @jsii.member(jsii_name="resetPriority")
    def reset_priority(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPriority", []))

    @builtins.property
    @jsii.member(jsii_name="grpcRoute")
    def grpc_route(self) -> AppmeshGatewayRouteSpecGrpcRouteOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecGrpcRouteOutputReference, jsii.get(self, "grpcRoute"))

    @builtins.property
    @jsii.member(jsii_name="http2Route")
    def http2_route(self) -> AppmeshGatewayRouteSpecHttp2RouteOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttp2RouteOutputReference, jsii.get(self, "http2Route"))

    @builtins.property
    @jsii.member(jsii_name="httpRoute")
    def http_route(self) -> AppmeshGatewayRouteSpecHttpRouteOutputReference:
        return typing.cast(AppmeshGatewayRouteSpecHttpRouteOutputReference, jsii.get(self, "httpRoute"))

    @builtins.property
    @jsii.member(jsii_name="grpcRouteInput")
    def grpc_route_input(self) -> typing.Optional[AppmeshGatewayRouteSpecGrpcRoute]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecGrpcRoute], jsii.get(self, "grpcRouteInput"))

    @builtins.property
    @jsii.member(jsii_name="http2RouteInput")
    def http2_route_input(self) -> typing.Optional[AppmeshGatewayRouteSpecHttp2Route]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttp2Route], jsii.get(self, "http2RouteInput"))

    @builtins.property
    @jsii.member(jsii_name="httpRouteInput")
    def http_route_input(self) -> typing.Optional[AppmeshGatewayRouteSpecHttpRoute]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpecHttpRoute], jsii.get(self, "httpRouteInput"))

    @builtins.property
    @jsii.member(jsii_name="priorityInput")
    def priority_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "priorityInput"))

    @builtins.property
    @jsii.member(jsii_name="priority")
    def priority(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "priority"))

    @priority.setter
    def priority(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__65b0434af011e0018c3a24e9a209ee077bacac9706c15297947c0ad2d09583d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "priority", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AppmeshGatewayRouteSpec]:
        return typing.cast(typing.Optional[AppmeshGatewayRouteSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[AppmeshGatewayRouteSpec]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0c0498fa17dfb393c132679b4191916d8dc36de9e78862054d491ea14d20568)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "AppmeshGatewayRoute",
    "AppmeshGatewayRouteConfig",
    "AppmeshGatewayRouteSpec",
    "AppmeshGatewayRouteSpecGrpcRoute",
    "AppmeshGatewayRouteSpecGrpcRouteAction",
    "AppmeshGatewayRouteSpecGrpcRouteActionOutputReference",
    "AppmeshGatewayRouteSpecGrpcRouteActionTarget",
    "AppmeshGatewayRouteSpecGrpcRouteActionTargetOutputReference",
    "AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService",
    "AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualServiceOutputReference",
    "AppmeshGatewayRouteSpecGrpcRouteMatch",
    "AppmeshGatewayRouteSpecGrpcRouteMatchOutputReference",
    "AppmeshGatewayRouteSpecGrpcRouteOutputReference",
    "AppmeshGatewayRouteSpecHttp2Route",
    "AppmeshGatewayRouteSpecHttp2RouteAction",
    "AppmeshGatewayRouteSpecHttp2RouteActionOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteActionRewrite",
    "AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname",
    "AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostnameOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteActionRewriteOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteActionRewritePath",
    "AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix",
    "AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefixOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteActionTarget",
    "AppmeshGatewayRouteSpecHttp2RouteActionTargetOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService",
    "AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualServiceOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteMatch",
    "AppmeshGatewayRouteSpecHttp2RouteMatchHeader",
    "AppmeshGatewayRouteSpecHttp2RouteMatchHeaderList",
    "AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch",
    "AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange",
    "AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRangeOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteMatchHeaderOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteMatchHostname",
    "AppmeshGatewayRouteSpecHttp2RouteMatchHostnameOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteMatchOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteMatchPath",
    "AppmeshGatewayRouteSpecHttp2RouteMatchPathOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter",
    "AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterList",
    "AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch",
    "AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatchOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterOutputReference",
    "AppmeshGatewayRouteSpecHttp2RouteOutputReference",
    "AppmeshGatewayRouteSpecHttpRoute",
    "AppmeshGatewayRouteSpecHttpRouteAction",
    "AppmeshGatewayRouteSpecHttpRouteActionOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteActionRewrite",
    "AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname",
    "AppmeshGatewayRouteSpecHttpRouteActionRewriteHostnameOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteActionRewriteOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteActionRewritePath",
    "AppmeshGatewayRouteSpecHttpRouteActionRewritePathOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix",
    "AppmeshGatewayRouteSpecHttpRouteActionRewritePrefixOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteActionTarget",
    "AppmeshGatewayRouteSpecHttpRouteActionTargetOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService",
    "AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualServiceOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteMatch",
    "AppmeshGatewayRouteSpecHttpRouteMatchHeader",
    "AppmeshGatewayRouteSpecHttpRouteMatchHeaderList",
    "AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch",
    "AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange",
    "AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRangeOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteMatchHeaderOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteMatchHostname",
    "AppmeshGatewayRouteSpecHttpRouteMatchHostnameOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteMatchOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteMatchPath",
    "AppmeshGatewayRouteSpecHttpRouteMatchPathOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter",
    "AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterList",
    "AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch",
    "AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatchOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterOutputReference",
    "AppmeshGatewayRouteSpecHttpRouteOutputReference",
    "AppmeshGatewayRouteSpecOutputReference",
]

publication.publish()

def _typecheckingstub__e60d33798b71a225a7d1f2942dd246a1100cc356a144a34f58197f1ac05aabbc(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    mesh_name: builtins.str,
    name: builtins.str,
    spec: typing.Union[AppmeshGatewayRouteSpec, typing.Dict[builtins.str, typing.Any]],
    virtual_gateway_name: builtins.str,
    id: typing.Optional[builtins.str] = None,
    mesh_owner: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__0a461e77d3918c5de48989bfbbf6ae314fb1c819148c40688ad4a545132fc464(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e587e325912359a1611f4133e921b36e8cebb9fd0cdf584a0f2eab51e08c625(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3031a49d4ce416efe28766b7a5ae2908c34a138d87eb0f346f842e158415413b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce46ffdcd8eefcd444df38ae445888b443c90276232e84f272b7d849bbf19e74(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__97873d709654eab8a9700dabd17d36113957588483fb81714ce560fb10042974(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ffba99add67cf77e231c7d1476e5bc361e79a7b7b01676ac346ac5d17049008(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3822414f6a8bd589a8e153c2ec4155bdde84b8d25db5af17b30e58ebc54667d(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6970ae0c3b698185d3698bf6fb594a016fe48662217d461ae91a2093f20b5855(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3eedc0182e1c2f6974092d2f3718ffe056cc08bc85cd4ad8a14c5b1e0c1dfb4(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    mesh_name: builtins.str,
    name: builtins.str,
    spec: typing.Union[AppmeshGatewayRouteSpec, typing.Dict[builtins.str, typing.Any]],
    virtual_gateway_name: builtins.str,
    id: typing.Optional[builtins.str] = None,
    mesh_owner: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ee41fbde5295cf1ffa05c763927f1dc70e4bbba7dea173815b1ac1f01f45f40(
    *,
    grpc_route: typing.Optional[typing.Union[AppmeshGatewayRouteSpecGrpcRoute, typing.Dict[builtins.str, typing.Any]]] = None,
    http2_route: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2Route, typing.Dict[builtins.str, typing.Any]]] = None,
    http_route: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRoute, typing.Dict[builtins.str, typing.Any]]] = None,
    priority: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7dbb0f76051a578abee8e324f92b80a3d18851d7ef60ba935e6f5490eaa5313(
    *,
    action: typing.Union[AppmeshGatewayRouteSpecGrpcRouteAction, typing.Dict[builtins.str, typing.Any]],
    match: typing.Union[AppmeshGatewayRouteSpecGrpcRouteMatch, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d1daf217b0f498e434ddc5e1298c8be353963d4edf2c5cdfff3424f6613a9c7(
    *,
    target: typing.Union[AppmeshGatewayRouteSpecGrpcRouteActionTarget, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b27f7d594f24628476be98172eba889c51755fcb01c01bd41444427aee06086(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d43425c5a796c29e40ee45734ddf79929aae88b0dd1f83a84f02f7917b57af64(
    value: typing.Optional[AppmeshGatewayRouteSpecGrpcRouteAction],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d0db52090970c424d5719e8d5c3315c0bfe68a086b5fc8f40242af8c129120e(
    *,
    virtual_service: typing.Union[AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService, typing.Dict[builtins.str, typing.Any]],
    port: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__164b7379690bfb045ce9d8cbf53011b9641d574f9e46459a3a18239e98cc3868(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5c77a0a5fa89a27f1a499a107ac713251ccb6ace0ff125841ab6eaa9c37ba26(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__696e5f59073b72d6ff5bc0d7ce618d26e949655ef7193c1e8aee0980eb6b529d(
    value: typing.Optional[AppmeshGatewayRouteSpecGrpcRouteActionTarget],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41b4e7df913f68fd6b67a3783be159e2117f5821d73d50caa65320a5eb647d85(
    *,
    virtual_service_name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bbadf1254c179b7811d557075da006b5b05098b904cf5e07d462164a9a67f6a3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c9fe8ddb636bb6c6cd0ede052b9391baa204bd0ba15257eefc66f6f069c685c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6f373a92aac69d2a38d10d097f05cd342f1fadd2636d59b72848be2ecffbe29(
    value: typing.Optional[AppmeshGatewayRouteSpecGrpcRouteActionTargetVirtualService],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__592a13e8cf7d8b7449cb676b6a5f804bd709019f7dfe8a4dd8251e1b272b6257(
    *,
    service_name: builtins.str,
    port: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__450c94714afd1336eba6e944237cd7fe275eac61e64f7e26ac377ed54a0ba0d1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc110e29f8417f3976c9983fee9e8c9a6ae27d5b9c261141635eecc2e817995f(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8bcb67d2a5144e9def022b33b6c7da088acf9c975ffb6d9a98ffd310154b2a40(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__713a6f086d58c1ea51ce6c5b11e30fb64e380ba5b4a219db8d3267d60224250f(
    value: typing.Optional[AppmeshGatewayRouteSpecGrpcRouteMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d56eeefeb64483322d2ec8c56907216621fdaf8470cdebc7391008d6944d647(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3599e43427c491b43fae0e0618ee02dc803f15421117f826178815522f2e9bee(
    value: typing.Optional[AppmeshGatewayRouteSpecGrpcRoute],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5dc3d5d7beacd2020c67bb018d60de37fb98a8885bb6ea9e87e81bb12feff5a4(
    *,
    action: typing.Union[AppmeshGatewayRouteSpecHttp2RouteAction, typing.Dict[builtins.str, typing.Any]],
    match: typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatch, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__879f60664815ac30c796c8f1023f6b22be62e393a692afe9cb5fd7a854239c91(
    *,
    target: typing.Union[AppmeshGatewayRouteSpecHttp2RouteActionTarget, typing.Dict[builtins.str, typing.Any]],
    rewrite: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteActionRewrite, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d714c07e1cb1c488d7f1980334607e1681a7ffce93c8faa054819443c3b69211(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73311656927a476df9e30fa8192c95004d069a8ba782e31e1fc7099a9c8778d3(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteAction],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__003a6c2fac0d1710578cc8cc6490a0a9da88c66f235246fa0eb5772a4203f719(
    *,
    hostname: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname, typing.Dict[builtins.str, typing.Any]]] = None,
    path: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteActionRewritePath, typing.Dict[builtins.str, typing.Any]]] = None,
    prefix: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0bf7c9a3f58c1e3762b23365ef15cdb912bbaa6c24e0a939cf478417cb02f63(
    *,
    default_target_hostname: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f21de293b0d2f7798760f8f21512068d1be689066960a6b067be5fd4bc0dd92(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b83dbd685badd8e84f2f674b183bcd558418559bf6a9fb3e27203463385ef7ab(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59f4c7546c66f9e14748c8d6677ed6e2c4497410e479be3538f89700b83844ed(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8e8b8f5690e0c54f2a534a600323b461b23a32e1ad88fc0c84aff8ea5cf65c9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__572d2727240e7ac54c5a39bf20616e6b558d1a71704e035e812e84f2b5d385a1(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewrite],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41703802274509a00686198ce14134923cfc7a8145d76d62c982e2cdd192f34a(
    *,
    exact: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a06eda91c47c9c68971d1641351344d318aef0cf57ca2e2a7881e9ca25d2f8a3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__852005a82017c1be76339f4e6b50e04b37add5526042224346ccb9098a2e02b4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02aadb3fe96bcaa08697085d7d44c400fb2a9ffa7b65d78ec892f9214ab5590a(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewritePath],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8556e3e051d28a50aa4da32e62b4198b9bb871f70451a8131f47d77e944d95f(
    *,
    default_prefix: typing.Optional[builtins.str] = None,
    value: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__268ac17d728dfed31c8840811a94d61c24ff8916cdee6565736ddda53b7deca4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49d9441c402363512c4773e0633fde298b4ba1703a9e51cc14c39def3f25fac0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__780a3cb1dc52a936c63bbe1d2f0ccfc4c7fc8e1ffece72ab2c9b8cfd453164f4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84c620a06d042aa3d7bf7d3c600f038755e37876bdc5ebec890744585a435d5e(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__434bff24fa465804651d514f74bf543ba3cac61544d896955bd373a961f71f5c(
    *,
    virtual_service: typing.Union[AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService, typing.Dict[builtins.str, typing.Any]],
    port: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__387256da9c1f06575b339ba2bff7e1566241a48fdda4cc050ce2b0140e30810b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4691fa3c75a9fa4fa790003624b6d01f386b5349e1e9bdb7476f3640085b32b0(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__694d60667dc4ef9c437185d45be15f361c19fd5cc5b68fbcfbaba18aa263f791(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionTarget],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1c201730fca46745c36321029271f2514c33617dca813bd1745ee54971172e9(
    *,
    virtual_service_name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1141f8c76ed73083cc051351b072b192daaf599103d9733a50270aedccb93f8c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a68b2aa825554597a559f57e79bf78f719b3f0a372e2f7c0c55873b2ae710555(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a8c3cd9296c5a48e940e402a386db8872bbd6b2eb2ec8f42bebefa0b407623d(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteActionTargetVirtualService],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0918b8b9e29543ae3482336c78c43cc7102ba8f721ded8ea2784937843c347c(
    *,
    header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchHeader, typing.Dict[builtins.str, typing.Any]]]]] = None,
    hostname: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchHostname, typing.Dict[builtins.str, typing.Any]]] = None,
    path: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchPath, typing.Dict[builtins.str, typing.Any]]] = None,
    port: typing.Optional[jsii.Number] = None,
    prefix: typing.Optional[builtins.str] = None,
    query_parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3a25a159429f9be1119d288044e6bc3dd925fdf58838f0ced39b9c6164fa45c(
    *,
    name: builtins.str,
    invert: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    match: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__999291086dd9a14a83cb5eb5ca9383a576d5c31708392bcca510b41a28661172(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75d6c190e612b4ae19984a9a54a93fc93c63488a99fec314bbad839064ae588d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ea06c3794833dea0368cf2811aef7e7b7c4fa288f1168e5194fb307fe83ab58(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__584124aa0934acb8cf9effed0d89f05b27f9441fa4728503502f7fb8960e8ac5(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4346d406783cbe7813745921abfc0a6b7fb6239f7ad9265b1aa719f8ac308960(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__941a68abca14d55f3469f99464ac11501652b8aceb99ad5b847970a9fedea692(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttp2RouteMatchHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73616bdfd2cbbdca0375bb59dfcc7c284bb11e015bae70c9dc21dc33c43d01b2(
    *,
    exact: typing.Optional[builtins.str] = None,
    prefix: typing.Optional[builtins.str] = None,
    range: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange, typing.Dict[builtins.str, typing.Any]]] = None,
    regex: typing.Optional[builtins.str] = None,
    suffix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b92e5d3cc614c83d8d9675c32101ae873d34d7bb4f417348231e7045f3628f8b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b386a457e52ba1440ee11cd5caf1f016b1a6fea32f35b7ea69c2969a85afb3bf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2732eaaeea680be8956dceb09c4dec9b4edd9d8b0dd1d98f9984f9e880922e2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d780f64852e48b0decc6be55b84f35c79053d6bb7a2d729020f4090261c30b0e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87d7f544dc29a313e5f40124927d9feeade003d0939efdd81260d767cc04f0a0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14ae4685597ca2e940f086a0b1382d8887e1780e14a7c0cb31b9f9d5d35841ab(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0fbae6b6454a490c30fc3c7c346364e550a770d4ca3c6e34a1eae3c2764ebe8(
    *,
    end: jsii.Number,
    start: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e5f8d6a36befb4863a86fe04ec029357ae3026ef36efe03001f5ebb2228e2f6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9d8b4020b8da433c25a210bb58686ecab14cedc2801a88da481429c2d0731da(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b98d18b26e8277348aae0fc46ed36b1eebc434d54a0370fcdc9b6fb8a9a40bc(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28453dd76c177b94d538511b9502e812dd79ad21dd552c862f7a9f5dd36d6458(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatchRange],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5103a764f8e05e1427208606947b3bc40ee6cc783dfa0b36b8473341287fa2d0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__226762b4616ac2a7a11aa763ef932b81650d08b19256b3a159f1ec097cb6087a(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d35e67d58b8a620cc3c498edf84e619bfe2c00f6b8790475207575075d89e9c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5c531fd628402195159f3e8c6d064a86755ce93355527f5ccc71b4c3946da51(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttp2RouteMatchHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5da2b88496ec4d660d49886fc63c8b820015352281c865eec2c58c0ae68a90bd(
    *,
    exact: typing.Optional[builtins.str] = None,
    suffix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1779a06e416cc939b475a5a128a9782b4b1acec7b0ce36ca6c0e81c33c19ea68(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fcbbd5d8f86e32c2aabd81c8cb90acdcffac69630eb98af2b3bab533215bddc7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b20320ff05e8cbc494267b4cd955eb644941c4a2e756d608eeeafa8b9ff7ebaf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1935cf360c51204f58faaee1e26f275dfeeec6ce6390c2789ed074132010a6c3(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchHostname],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__074339a247df0727aad27b639a0eedc60bada052335be024bfa974ac71136db9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d373eaf733e7a3d298df0b70c034bba223d11bd76d4df2aa640709a2e4f9d048(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afc13e98d771b21a97aeba8125d66048744290055fc823025a9e36c07a78c5f3(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3997576df0d70be134b6b32a3103d8bee573ee16c3cf1b6e05da49c6b5aa539e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ddd412045304c5ab9bdc11a39ee1d9160178578905f8695c9b7cf01cb9c175c8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4397fcf97d0bf76179070b7a1c4f40e90cf682e24f82b869cb87ea66d2c2bfb5(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f4777b2fd6eb88c8040588607c923048cdb7e8ed074f5cb1bf9f51e615a41f4(
    *,
    exact: typing.Optional[builtins.str] = None,
    regex: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19ea6d3f29f8b2ba4b4f6347cbf457e9b56e5d01a2f1657560d1b359253326ae(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6695e20a2ba32d3566b72107906547387b2cf2003addc6fc591563a004f2c4c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ffd2b64b981a7a3ebfcba6ea097010431eba115d4e2edfe444938ffc65a5d5f5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__587f03a8c6c700c12b37f211baed9088a47419f2c2238d52dbaefe3184eedda7(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchPath],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cfd3dd7c0e3279e61270b846ca581ef869aa469bd665f3221a27c37401286667(
    *,
    name: builtins.str,
    match: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf1d895a7351d2902ec466784d622b38ea48cb173d8e8f1350ba1fd54c49c4ac(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__584eff82c1f070578872f448be80c6987cdd6248881d234f7f5f9a4f56c9d6ec(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e5b651505c4e37d156672e5453ed4ea6e072ecfe992bcf656ec97ed40b3375b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__38ae76e49a4cffbe801d2145ca31b462d07eb62f22b799d9602cf31efb5e3a43(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__113ca60cd1cb6f3c3ea68385122794c83abd48e4db5912f3cd059257caf10bc4(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__539ce21d55058743bcd284f5841cedf2bc47ecf1dbc2f01078367cc90cb5d4ef(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02582c4e4a67f0177523422db55e9001f1de918032c8b3211e823b7e1242a474(
    *,
    exact: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f714142f0e8178ab98bc1213f64867aa89f5df243f57cfca5db3cad2e3d9bb00(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3ccd65f4c2fc4cbfc37f959ffe0463ff05298a3d3c400d87fd2877456077a46(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff17f2e2e783644331ee0f333d9d170c8a8dd8ceeffb7234147028415a1ba285(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameterMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd56099291b9e29e9a87b9a6239f292d8ef27929936bb74364a9262bff74cf1e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__34ec0059622f597968af21f121fd8d1fe2d6f6306d1d442b3b2fafa899d07a5d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0138e48777a168179749d327e1cc6c07ce989308751e33096e3e855b689764aa(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a3da95e7e7595f6066727ff9fa0662ec0bf16f220accfcca00e43435009c9516(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6556172d0c127901a9219e1c554438e1b42facc6e174980cad70f1902f9dee4c(
    value: typing.Optional[AppmeshGatewayRouteSpecHttp2Route],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33ead66e1ef18e39230de37b614acc7dbebc3d8f7105ca6e0257f489fb42354c(
    *,
    action: typing.Union[AppmeshGatewayRouteSpecHttpRouteAction, typing.Dict[builtins.str, typing.Any]],
    match: typing.Union[AppmeshGatewayRouteSpecHttpRouteMatch, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b597a6255dc21725f3b54c30a8cf96c3512d9abe1742323a5f6d28cd737d3f59(
    *,
    target: typing.Union[AppmeshGatewayRouteSpecHttpRouteActionTarget, typing.Dict[builtins.str, typing.Any]],
    rewrite: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteActionRewrite, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dcd5873c8b03f866f16b110fc1937cfef6886b1f78c345c2390b78e4e13b26da(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__951c906eecc4980e254099a3bdbc3bfb97c75f291ed30f6f3ffa262f1ed4687e(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteAction],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6715a64235161d1d1dd6516dc9d4838534f47f68f0d313a88c83b11031b1f845(
    *,
    hostname: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname, typing.Dict[builtins.str, typing.Any]]] = None,
    path: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteActionRewritePath, typing.Dict[builtins.str, typing.Any]]] = None,
    prefix: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76998c61b8bcae2218bccedf1343f4804e97f1205d475dfada177154f348ba0b(
    *,
    default_target_hostname: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15d3b9760cc5f4796b5be73f04876f3fe0dc5646ee7e405c548505c941e36a57(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91ebf8adefe30e9b63daca56537b00687c89b8a972aa6581ef6e1d98773baaa9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5594156d6d19d69c51cad00446f58d71e90347f193240f93217bf86ccab1504(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewriteHostname],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__590d81ca5027b731a8c720e0813fd94d18dd5668ce2c38f83d9f71f423588e21(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fbbc6c0a7908801c9c7bc7266b85ab76492ca44c65c9b55dca4522ec8c8ab623(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewrite],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5f9d885ff8b86e5d725a37ed20647de74aa03d2d9c079939908ee44b4a90a9b(
    *,
    exact: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d553db971eac2029c8af9bef1437c8ad53fb5caa82dab4aee1b4d9f751bd5efe(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__166529b97578ebd7dd635745fd1c6957a28eb4a9ab1e83cfbf098b0c23ff4870(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb56b4713f60cc1248c9c508249a0579d314ea3afc7f32452329fde26a33ea96(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewritePath],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02195a58e0ff18a5bcabe0dc802883be5e8a1a7ec58213c12cec3e7554b50653(
    *,
    default_prefix: typing.Optional[builtins.str] = None,
    value: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6c09c06bcf7ec47aff366090c03594f512ca5239634ef77590812df205aec69(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca53ad288d996b98bec434a89f39649d0576e377e4e4e87055f87c2b4bbaed66(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d16a09876d794a30f61d14db43dfdf84f910d9dfaba23410c40e1881ec8a46ce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc4302a94cb3da7cf705e0c6bef0f1275f9368286b83b5861e9d09fff0cbd12c(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionRewritePrefix],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86cfa0c1d7066bacb3d23840e507e908d262811eb617e119c936b1bbaf753349(
    *,
    virtual_service: typing.Union[AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService, typing.Dict[builtins.str, typing.Any]],
    port: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c48a0cb14c2c8e2d20c81f5a373c1e1435eb4867a1a136f5637e2c8c4bbf5ea(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14646bfea9d7c15b56ddac455fb108042ca0ae19a8621e9366991c679a88bd15(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4133a930d1303b872fe28732879377c1e24a4566019358e19ae794b9efce48f9(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionTarget],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79216cbe1eb67d9ab4f0509f2dec3c0343f83df99cb7881ba3c05de35320a925(
    *,
    virtual_service_name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07a568c80caad0228f32ffd35f6c940d0fbb5f91fe1334e2f411e04e50c993fa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46de8222c679f4affd2d701c48602197049bcc7109b84ab0b19d57ff5b179e8c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4df9a30985ab336d61cf822ab08fa3ae3f84acba724925b2d8fff7a55df7caa(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteActionTargetVirtualService],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7587cfcf9964652f282ea89969e68ddcba711e40c1eed026d26e8242419b474(
    *,
    header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchHeader, typing.Dict[builtins.str, typing.Any]]]]] = None,
    hostname: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchHostname, typing.Dict[builtins.str, typing.Any]]] = None,
    path: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchPath, typing.Dict[builtins.str, typing.Any]]] = None,
    port: typing.Optional[jsii.Number] = None,
    prefix: typing.Optional[builtins.str] = None,
    query_parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c11c39c770cde7f8c7f6fe3d07880bcd14defc7312b3ea0f833dd2e713103fc5(
    *,
    name: builtins.str,
    invert: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    match: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8b10bfe3a358e3517ea222686e206687e45d8bab1b3cbe29607a637defa5449(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d509f126766b40540476d4bfd132d9ae02ee6ad04c199b29acc0eeb738b0017b(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__381b9c7e10c65402649f2de48a22ec12233c72f9b37b1083a02a6f20dbdda5c0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c9c655d3d2c9e865c9eb050c4172de0d4dc7a5694659f1247691f7bb57cc883(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9043d789a35236f743b2ac2347f4e30c43740b154dfdb27f9a9faa2691c7c0e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5e6b2092a1b23697d3bc3d53094998883d0dcd10663cbc7d2ef66cfcb237f50(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttpRouteMatchHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a842d907f04a4a153fdcd472af6b70787f49ba5ece9dd4cd3c1781fe83c14a0f(
    *,
    exact: typing.Optional[builtins.str] = None,
    prefix: typing.Optional[builtins.str] = None,
    range: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange, typing.Dict[builtins.str, typing.Any]]] = None,
    regex: typing.Optional[builtins.str] = None,
    suffix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a3f8b8ca5ac772adb0b40a1fb63a1ca6db882aee878edbe6715a8579fc0dd166(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d7bd48beef378caea3ec12b7aadb7643d3278df7bc13a7032ece988123c911a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb54b6df8a5c9cd7af1187fce035aac3a14ee3048a8574243fe41914c9ae67b2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a9c4e4d5bb72d60de0df932d3e763b987f8c7ea50e540f0c116a92a340ce062(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bde0ec48291caf2c6a351c95ebc4a866791ca3a1572d4edd34f4036e28b53be8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a612bb78fe5c8e91a3bb5930eb0d5e57991675ebb8cb156d49dcae65c94d943(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91eb396172f76ef7a1688d973c2316d5ce6fa4b034132a75f6e751618588add8(
    *,
    end: jsii.Number,
    start: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3d6bd7c21e2ab469b61858a677025c96a8b54e4075a24de446c9edff49ca09e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2989cdd0188bbe1031e721bb656055e0770ca5d5ba37b20dc4ed203d8e8edba4(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dad35e4e2eb1dd20bffd6344cacdd3875f0b6b343b3536bf286f38703c2a6824(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60fc4834580adc1d227b5f10f8dcad43f4cdfd7db29f674a1ec1c16889067e57(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHeaderMatchRange],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c0f55e6a3099c7bf80ce4b80340ce30b20beb0a62d257d21d5ecd3f6fd3582b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e033be498f71202b94f3e803a7dae16cb1e01c9288f6c4f3db8db917df58d67(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e94ae54a60cfb6ac901c6e1d1cbc7b35d8f0f7c9d14349da2055f59749f503ab(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ecde63c73fceec426c8402901580c36370aface066e26f87c9b01c41213edf4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttpRouteMatchHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__958b0129fd819287ee91040a95b8c931457242374a3d7bdadf44d07d72f1f061(
    *,
    exact: typing.Optional[builtins.str] = None,
    suffix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66521b969d496992844e3dc537d6a521de5ddf2bec7f0a5529e912a9bc5bd860(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b711a44de00acf63f0f61cd6a63ae2df67ba250fe0ca1e29d0945fc63055ef13(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42d6c23cb7362e66a31643e1696c9b52214e16db1290109e9852bbf20b69accb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__988c69332d9baca89a4e4a878aebbe004de99896ea90a11352225523c178f32c(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchHostname],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f30448249dcf21f0899e9ccd3caa9f694f18ee62d4229decf0fc4205fd975a54(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f8fbfa2936085d7662b4ca15d65a7f8eb019204d23fee90c232fcef27efdd13(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6922f8ff706bbed6de114a866ab42badcbf37338318982b3c3c380b5317076ba(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be4d67edbd244db74ff80d9c68df645159438cd696aacc37fdcebb99db8eabec(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33a17ce01c8147c8988e94f3e548fb6c6fccd730d1049fa4cf2f1e15013668dd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eaeae8024ec7f4ad29fc38816bfcfe1fef97b2ec1c76722190a4313f34b14077(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c9e03867b1bd65431225e3f57ca301786348a4e2b66e742e6b240e7746f8a65d(
    *,
    exact: typing.Optional[builtins.str] = None,
    regex: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc8797de2e9f333db564c6f2f99f06731cac496029a0e7a36a6a67378f6cf27d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb9dfdbf2d8dff49b82c57b8ce650f92fc359042de2b4c193b570f151afe7132(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7fb9e13a9bb841c7aa29a7ad8d8e7389641d6b0020265127b913ec726f64b975(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c316606fca99036411f39fb24722ebe3520f0d439640f3b1528672528f0715fe(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchPath],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3b923a75bf133cdf0d17dc68e99f6716a717e6fc47530712a9652d975dcc45b(
    *,
    name: builtins.str,
    match: typing.Optional[typing.Union[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3b0c6a285dfd99119f3e5664821c0c5d6283a6a416e18f191ff2293ba1bd0b2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e6087738a868a65c7b73594f32457da6045a0bc1e9dee1230441d0617d27573(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9282f68efd43b00b254516475eca62f187b3ce8ec1d80a6506854cb086183d09(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bed2f8e59eeb0e6a5bf8cc393c84179572536aea00796f3e9c8f7563dc96712b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4fe92118116eaf307db499c53f5f27def0d3d91b2ffa0ecbb72abc81fbfebc50(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15eccff3cdcd6fbb858f105ddb9194f7813226a580e9d4973dd1cd9cb9fa895b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__baf1f2cfeb34b792c77dbe76b40d2815c42c986585636928aa4659844d4370bf(
    *,
    exact: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__495af5fd016f6bb6c10fda9e3896a38f64dd2c31c30acd0efcfb98b43cc8102f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c5e3e2cdbce71a3757e966688199b719cddbc516cd4c297ce6a7a28a8fe2bd5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ce24a3449aaa359ad3cb912dc83f1b2b2f08ef12e42ecfd373dfa690d4328d8(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRouteMatchQueryParameterMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e050410877090f68cf112a23588d79debe80a889d91f656301e167cdc2388a81(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0bda7c3e3416e30185a8b9aeccbd41bb3df37fb196f379357cdca66099f6090e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__acd9b696b028f5ca372af5752089f7339a6dfd66c824c02d665989303ce1ae60(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AppmeshGatewayRouteSpecHttpRouteMatchQueryParameter]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa5be6974ed2d1ba1190a2fa5eabc9ab1f097683444d278acfa87a38a8e1c827(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ba3910886cd136eebe6ecea9cfeb65ff093280d749c7b0be57bb0bbb98fc350(
    value: typing.Optional[AppmeshGatewayRouteSpecHttpRoute],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3da4d8e4b31d8d63c10cbc5c2f89480d4feab77388de18c528e7d3b6e08120c7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65b0434af011e0018c3a24e9a209ee077bacac9706c15297947c0ad2d09583d0(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0c0498fa17dfb393c132679b4191916d8dc36de9e78862054d491ea14d20568(
    value: typing.Optional[AppmeshGatewayRouteSpec],
) -> None:
    """Type checking stubs"""
    pass
