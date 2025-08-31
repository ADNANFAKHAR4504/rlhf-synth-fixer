package imports.aws.data_aws_appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsAppmeshGatewayRoute.DataAwsAppmeshGatewayRouteSpecHttpRouteMatchOutputReference")
public class DataAwsAppmeshGatewayRouteSpecHttpRouteMatchOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsAppmeshGatewayRouteSpecHttpRouteMatchOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsAppmeshGatewayRouteSpecHttpRouteMatchOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsAppmeshGatewayRouteSpecHttpRouteMatchOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatchHeaderList getHeader() {
        return software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatchHeaderList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatchHostnameList getHostname() {
        return software.amazon.jsii.Kernel.get(this, "hostname", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatchHostnameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatchPathList getPath() {
        return software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatchPathList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrefix() {
        return software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatchQueryParameterList getQueryParameter() {
        return software.amazon.jsii.Kernel.get(this, "queryParameter", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatchQueryParameterList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatch getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatch.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_appmesh_gateway_route.DataAwsAppmeshGatewayRouteSpecHttpRouteMatch value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
