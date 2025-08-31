package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.355Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolDeviceConfigurationOutputReference")
public class CognitoUserPoolDeviceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolDeviceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolDeviceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolDeviceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetChallengeRequiredOnNewDevice() {
        software.amazon.jsii.Kernel.call(this, "resetChallengeRequiredOnNewDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceOnlyRememberedOnUserPrompt() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceOnlyRememberedOnUserPrompt", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getChallengeRequiredOnNewDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "challengeRequiredOnNewDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeviceOnlyRememberedOnUserPromptInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceOnlyRememberedOnUserPromptInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getChallengeRequiredOnNewDevice() {
        return software.amazon.jsii.Kernel.get(this, "challengeRequiredOnNewDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setChallengeRequiredOnNewDevice(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "challengeRequiredOnNewDevice", java.util.Objects.requireNonNull(value, "challengeRequiredOnNewDevice is required"));
    }

    public void setChallengeRequiredOnNewDevice(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "challengeRequiredOnNewDevice", java.util.Objects.requireNonNull(value, "challengeRequiredOnNewDevice is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeviceOnlyRememberedOnUserPrompt() {
        return software.amazon.jsii.Kernel.get(this, "deviceOnlyRememberedOnUserPrompt", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeviceOnlyRememberedOnUserPrompt(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deviceOnlyRememberedOnUserPrompt", java.util.Objects.requireNonNull(value, "deviceOnlyRememberedOnUserPrompt is required"));
    }

    public void setDeviceOnlyRememberedOnUserPrompt(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deviceOnlyRememberedOnUserPrompt", java.util.Objects.requireNonNull(value, "deviceOnlyRememberedOnUserPrompt is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolDeviceConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolDeviceConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolDeviceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
