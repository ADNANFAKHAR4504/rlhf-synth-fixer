package imports.aws.appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.033Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshRoute.AppmeshRouteSpecOutputReference")
public class AppmeshRouteSpecOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshRouteSpecOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshRouteSpecOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshRouteSpecOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putGrpcRoute(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRoute value) {
        software.amazon.jsii.Kernel.call(this, "putGrpcRoute", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttp2Route(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecHttp2Route value) {
        software.amazon.jsii.Kernel.call(this, "putHttp2Route", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttpRoute(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecHttpRoute value) {
        software.amazon.jsii.Kernel.call(this, "putHttpRoute", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTcpRoute(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecTcpRoute value) {
        software.amazon.jsii.Kernel.call(this, "putTcpRoute", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetGrpcRoute() {
        software.amazon.jsii.Kernel.call(this, "resetGrpcRoute", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttp2Route() {
        software.amazon.jsii.Kernel.call(this, "resetHttp2Route", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpRoute() {
        software.amazon.jsii.Kernel.call(this, "resetHttpRoute", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPriority() {
        software.amazon.jsii.Kernel.call(this, "resetPriority", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTcpRoute() {
        software.amazon.jsii.Kernel.call(this, "resetTcpRoute", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteOutputReference getGrpcRoute() {
        return software.amazon.jsii.Kernel.get(this, "grpcRoute", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteOutputReference getHttp2Route() {
        return software.amazon.jsii.Kernel.get(this, "http2Route", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteOutputReference getHttpRoute() {
        return software.amazon.jsii.Kernel.get(this, "httpRoute", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecTcpRouteOutputReference getTcpRoute() {
        return software.amazon.jsii.Kernel.get(this, "tcpRoute", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecTcpRouteOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecGrpcRoute getGrpcRouteInput() {
        return software.amazon.jsii.Kernel.get(this, "grpcRouteInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRoute.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecHttp2Route getHttp2RouteInput() {
        return software.amazon.jsii.Kernel.get(this, "http2RouteInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttp2Route.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecHttpRoute getHttpRouteInput() {
        return software.amazon.jsii.Kernel.get(this, "httpRouteInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttpRoute.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPriorityInput() {
        return software.amazon.jsii.Kernel.get(this, "priorityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecTcpRoute getTcpRouteInput() {
        return software.amazon.jsii.Kernel.get(this, "tcpRouteInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecTcpRoute.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPriority() {
        return software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPriority(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "priority", java.util.Objects.requireNonNull(value, "priority is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpec getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpec.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpec value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
