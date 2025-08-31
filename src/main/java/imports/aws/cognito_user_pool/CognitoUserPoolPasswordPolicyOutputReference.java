package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolPasswordPolicyOutputReference")
public class CognitoUserPoolPasswordPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolPasswordPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolPasswordPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolPasswordPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMinimumLength() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPasswordHistorySize() {
        software.amazon.jsii.Kernel.call(this, "resetPasswordHistorySize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireLowercase() {
        software.amazon.jsii.Kernel.call(this, "resetRequireLowercase", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireNumbers() {
        software.amazon.jsii.Kernel.call(this, "resetRequireNumbers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireSymbols() {
        software.amazon.jsii.Kernel.call(this, "resetRequireSymbols", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireUppercase() {
        software.amazon.jsii.Kernel.call(this, "resetRequireUppercase", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemporaryPasswordValidityDays() {
        software.amazon.jsii.Kernel.call(this, "resetTemporaryPasswordValidityDays", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinimumLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPasswordHistorySizeInput() {
        return software.amazon.jsii.Kernel.get(this, "passwordHistorySizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireLowercaseInput() {
        return software.amazon.jsii.Kernel.get(this, "requireLowercaseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireNumbersInput() {
        return software.amazon.jsii.Kernel.get(this, "requireNumbersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireSymbolsInput() {
        return software.amazon.jsii.Kernel.get(this, "requireSymbolsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireUppercaseInput() {
        return software.amazon.jsii.Kernel.get(this, "requireUppercaseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTemporaryPasswordValidityDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "temporaryPasswordValidityDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinimumLength() {
        return software.amazon.jsii.Kernel.get(this, "minimumLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinimumLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minimumLength", java.util.Objects.requireNonNull(value, "minimumLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPasswordHistorySize() {
        return software.amazon.jsii.Kernel.get(this, "passwordHistorySize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPasswordHistorySize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "passwordHistorySize", java.util.Objects.requireNonNull(value, "passwordHistorySize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireLowercase() {
        return software.amazon.jsii.Kernel.get(this, "requireLowercase", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireLowercase(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireLowercase", java.util.Objects.requireNonNull(value, "requireLowercase is required"));
    }

    public void setRequireLowercase(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireLowercase", java.util.Objects.requireNonNull(value, "requireLowercase is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireNumbers() {
        return software.amazon.jsii.Kernel.get(this, "requireNumbers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireNumbers(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireNumbers", java.util.Objects.requireNonNull(value, "requireNumbers is required"));
    }

    public void setRequireNumbers(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireNumbers", java.util.Objects.requireNonNull(value, "requireNumbers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireSymbols() {
        return software.amazon.jsii.Kernel.get(this, "requireSymbols", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireSymbols(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireSymbols", java.util.Objects.requireNonNull(value, "requireSymbols is required"));
    }

    public void setRequireSymbols(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireSymbols", java.util.Objects.requireNonNull(value, "requireSymbols is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireUppercase() {
        return software.amazon.jsii.Kernel.get(this, "requireUppercase", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireUppercase(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireUppercase", java.util.Objects.requireNonNull(value, "requireUppercase is required"));
    }

    public void setRequireUppercase(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireUppercase", java.util.Objects.requireNonNull(value, "requireUppercase is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTemporaryPasswordValidityDays() {
        return software.amazon.jsii.Kernel.get(this, "temporaryPasswordValidityDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTemporaryPasswordValidityDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "temporaryPasswordValidityDays", java.util.Objects.requireNonNull(value, "temporaryPasswordValidityDays is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolPasswordPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolPasswordPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolPasswordPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
