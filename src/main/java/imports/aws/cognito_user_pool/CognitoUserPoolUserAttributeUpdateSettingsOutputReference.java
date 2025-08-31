package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolUserAttributeUpdateSettingsOutputReference")
public class CognitoUserPoolUserAttributeUpdateSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolUserAttributeUpdateSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolUserAttributeUpdateSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolUserAttributeUpdateSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAttributesRequireVerificationBeforeUpdateInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "attributesRequireVerificationBeforeUpdateInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAttributesRequireVerificationBeforeUpdate() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "attributesRequireVerificationBeforeUpdate", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAttributesRequireVerificationBeforeUpdate(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "attributesRequireVerificationBeforeUpdate", java.util.Objects.requireNonNull(value, "attributesRequireVerificationBeforeUpdate is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUserAttributeUpdateSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolUserAttributeUpdateSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUserAttributeUpdateSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
