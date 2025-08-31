package imports.aws.appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.029Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshRoute.AppmeshRouteSpecGrpcRouteOutputReference")
public class AppmeshRouteSpecGrpcRouteOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshRouteSpecGrpcRouteOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshRouteSpecGrpcRouteOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshRouteSpecGrpcRouteOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAction(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteAction value) {
        software.amazon.jsii.Kernel.call(this, "putAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMatch(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteMatch value) {
        software.amazon.jsii.Kernel.call(this, "putMatch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRetryPolicy(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putRetryPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeout(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteTimeout value) {
        software.amazon.jsii.Kernel.call(this, "putTimeout", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMatch() {
        software.amazon.jsii.Kernel.call(this, "resetMatch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetryPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetRetryPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteActionOutputReference getAction() {
        return software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteActionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteMatchOutputReference getMatch() {
        return software.amazon.jsii.Kernel.get(this, "match", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteMatchOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicyOutputReference getRetryPolicy() {
        return software.amazon.jsii.Kernel.get(this, "retryPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteTimeoutOutputReference getTimeout() {
        return software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteTimeoutOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteAction getActionInput() {
        return software.amazon.jsii.Kernel.get(this, "actionInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteAction.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteMatch getMatchInput() {
        return software.amazon.jsii.Kernel.get(this, "matchInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteMatch.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicy getRetryPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "retryPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteTimeout getTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteTimeout.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecGrpcRoute getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRoute.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecGrpcRoute value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
