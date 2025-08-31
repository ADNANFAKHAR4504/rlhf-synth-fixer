package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlowsOutputReference")
public class CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlowsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlowsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlowsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlowsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCustomAuthMode() {
        software.amazon.jsii.Kernel.call(this, "resetCustomAuthMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomAuthModeInput() {
        return software.amazon.jsii.Kernel.get(this, "customAuthModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomAuthMode() {
        return software.amazon.jsii.Kernel.get(this, "customAuthMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomAuthMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customAuthMode", java.util.Objects.requireNonNull(value, "customAuthMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
