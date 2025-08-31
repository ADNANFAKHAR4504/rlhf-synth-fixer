package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.022Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference")
public class AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshGatewayRouteSpecHttp2RouteActionRewritePathOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExactInput() {
        return software.amazon.jsii.Kernel.get(this, "exactInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExact() {
        return software.amazon.jsii.Kernel.get(this, "exact", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExact(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "exact", java.util.Objects.requireNonNull(value, "exact is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
