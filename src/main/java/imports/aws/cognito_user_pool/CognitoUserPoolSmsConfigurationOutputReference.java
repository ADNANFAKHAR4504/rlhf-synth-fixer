package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolSmsConfigurationOutputReference")
public class CognitoUserPoolSmsConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolSmsConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolSmsConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolSmsConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSnsRegion() {
        software.amazon.jsii.Kernel.call(this, "resetSnsRegion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExternalIdInput() {
        return software.amazon.jsii.Kernel.get(this, "externalIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnsCallerArnInput() {
        return software.amazon.jsii.Kernel.get(this, "snsCallerArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnsRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "snsRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExternalId() {
        return software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExternalId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "externalId", java.util.Objects.requireNonNull(value, "externalId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnsCallerArn() {
        return software.amazon.jsii.Kernel.get(this, "snsCallerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnsCallerArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snsCallerArn", java.util.Objects.requireNonNull(value, "snsCallerArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnsRegion() {
        return software.amazon.jsii.Kernel.get(this, "snsRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnsRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snsRegion", java.util.Objects.requireNonNull(value, "snsRegion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSmsConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSmsConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSmsConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
