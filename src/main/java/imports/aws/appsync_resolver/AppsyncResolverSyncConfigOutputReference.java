package imports.aws.appsync_resolver;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncResolver.AppsyncResolverSyncConfigOutputReference")
public class AppsyncResolverSyncConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppsyncResolverSyncConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncResolverSyncConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppsyncResolverSyncConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putLambdaConflictHandlerConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig value) {
        software.amazon.jsii.Kernel.call(this, "putLambdaConflictHandlerConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConflictDetection() {
        software.amazon.jsii.Kernel.call(this, "resetConflictDetection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConflictHandler() {
        software.amazon.jsii.Kernel.call(this, "resetConflictHandler", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaConflictHandlerConfig() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaConflictHandlerConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfigOutputReference getLambdaConflictHandlerConfig() {
        return software.amazon.jsii.Kernel.get(this, "lambdaConflictHandlerConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConflictDetectionInput() {
        return software.amazon.jsii.Kernel.get(this, "conflictDetectionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConflictHandlerInput() {
        return software.amazon.jsii.Kernel.get(this, "conflictHandlerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig getLambdaConflictHandlerConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaConflictHandlerConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConflictDetection() {
        return software.amazon.jsii.Kernel.get(this, "conflictDetection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConflictDetection(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "conflictDetection", java.util.Objects.requireNonNull(value, "conflictDetection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConflictHandler() {
        return software.amazon.jsii.Kernel.get(this, "conflictHandler", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConflictHandler(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "conflictHandler", java.util.Objects.requireNonNull(value, "conflictHandler is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverSyncConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverSyncConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverSyncConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
