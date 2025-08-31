package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.022Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewriteOutputReference")
public class AppmeshGatewayRouteSpecHttp2RouteActionRewriteOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshGatewayRouteSpecHttp2RouteActionRewriteOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshGatewayRouteSpecHttp2RouteActionRewriteOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshGatewayRouteSpecHttp2RouteActionRewriteOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putHostname(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname value) {
        software.amazon.jsii.Kernel.call(this, "putHostname", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPath(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath value) {
        software.amazon.jsii.Kernel.call(this, "putPath", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPrefix(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix value) {
        software.amazon.jsii.Kernel.call(this, "putPrefix", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHostname() {
        software.amazon.jsii.Kernel.call(this, "resetHostname", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPath() {
        software.amazon.jsii.Kernel.call(this, "resetPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostnameOutputReference getHostname() {
        return software.amazon.jsii.Kernel.get(this, "hostname", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostnameOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference getPath() {
        return software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefixOutputReference getPrefix() {
        return software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefixOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname getHostnameInput() {
        return software.amazon.jsii.Kernel.get(this, "hostnameInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath getPathInput() {
        return software.amazon.jsii.Kernel.get(this, "pathInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix getPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewrite getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewrite.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewrite value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
