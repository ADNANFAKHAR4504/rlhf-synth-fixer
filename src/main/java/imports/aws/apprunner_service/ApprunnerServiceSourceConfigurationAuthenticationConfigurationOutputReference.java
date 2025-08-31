package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceSourceConfigurationAuthenticationConfigurationOutputReference")
public class ApprunnerServiceSourceConfigurationAuthenticationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApprunnerServiceSourceConfigurationAuthenticationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApprunnerServiceSourceConfigurationAuthenticationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApprunnerServiceSourceConfigurationAuthenticationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAccessRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetAccessRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionArn() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccessRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "accessRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionArnInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "accessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccessRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accessRoleArn", java.util.Objects.requireNonNull(value, "accessRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionArn() {
        return software.amazon.jsii.Kernel.get(this, "connectionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionArn", java.util.Objects.requireNonNull(value, "connectionArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
