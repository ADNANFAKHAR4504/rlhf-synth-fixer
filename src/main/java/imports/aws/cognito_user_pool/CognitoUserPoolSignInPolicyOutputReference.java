package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolSignInPolicyOutputReference")
public class CognitoUserPoolSignInPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolSignInPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolSignInPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolSignInPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAllowedFirstAuthFactors() {
        software.amazon.jsii.Kernel.call(this, "resetAllowedFirstAuthFactors", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedFirstAuthFactorsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allowedFirstAuthFactorsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowedFirstAuthFactors() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "allowedFirstAuthFactors", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllowedFirstAuthFactors(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allowedFirstAuthFactors", java.util.Objects.requireNonNull(value, "allowedFirstAuthFactors is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSignInPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSignInPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSignInPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
