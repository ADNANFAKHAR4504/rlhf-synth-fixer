package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolWebAuthnConfigurationOutputReference")
public class CognitoUserPoolWebAuthnConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolWebAuthnConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolWebAuthnConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolWebAuthnConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetRelyingPartyId() {
        software.amazon.jsii.Kernel.call(this, "resetRelyingPartyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserVerification() {
        software.amazon.jsii.Kernel.call(this, "resetUserVerification", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRelyingPartyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "relyingPartyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserVerificationInput() {
        return software.amazon.jsii.Kernel.get(this, "userVerificationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRelyingPartyId() {
        return software.amazon.jsii.Kernel.get(this, "relyingPartyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRelyingPartyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "relyingPartyId", java.util.Objects.requireNonNull(value, "relyingPartyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserVerification() {
        return software.amazon.jsii.Kernel.get(this, "userVerification", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserVerification(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userVerification", java.util.Objects.requireNonNull(value, "userVerification is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolWebAuthnConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolWebAuthnConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolWebAuthnConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
