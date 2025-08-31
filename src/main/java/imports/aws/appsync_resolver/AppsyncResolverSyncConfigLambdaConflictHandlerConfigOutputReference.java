package imports.aws.appsync_resolver;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncResolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfigOutputReference")
public class AppsyncResolverSyncConfigLambdaConflictHandlerConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppsyncResolverSyncConfigLambdaConflictHandlerConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncResolverSyncConfigLambdaConflictHandlerConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppsyncResolverSyncConfigLambdaConflictHandlerConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetLambdaConflictHandlerArn() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaConflictHandlerArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLambdaConflictHandlerArnInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaConflictHandlerArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLambdaConflictHandlerArn() {
        return software.amazon.jsii.Kernel.get(this, "lambdaConflictHandlerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLambdaConflictHandlerArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lambdaConflictHandlerArn", java.util.Objects.requireNonNull(value, "lambdaConflictHandlerArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
