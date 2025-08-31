package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolUserPoolAddOnsOutputReference")
public class CognitoUserPoolUserPoolAddOnsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolUserPoolAddOnsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolUserPoolAddOnsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolUserPoolAddOnsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAdvancedSecurityAdditionalFlows(final @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows value) {
        software.amazon.jsii.Kernel.call(this, "putAdvancedSecurityAdditionalFlows", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdvancedSecurityAdditionalFlows() {
        software.amazon.jsii.Kernel.call(this, "resetAdvancedSecurityAdditionalFlows", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlowsOutputReference getAdvancedSecurityAdditionalFlows() {
        return software.amazon.jsii.Kernel.get(this, "advancedSecurityAdditionalFlows", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlowsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows getAdvancedSecurityAdditionalFlowsInput() {
        return software.amazon.jsii.Kernel.get(this, "advancedSecurityAdditionalFlowsInput", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdvancedSecurityModeInput() {
        return software.amazon.jsii.Kernel.get(this, "advancedSecurityModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdvancedSecurityMode() {
        return software.amazon.jsii.Kernel.get(this, "advancedSecurityMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdvancedSecurityMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "advancedSecurityMode", java.util.Objects.requireNonNull(value, "advancedSecurityMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOns getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOns.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOns value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
