package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolSchemaStringAttributeConstraintsOutputReference")
public class CognitoUserPoolSchemaStringAttributeConstraintsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolSchemaStringAttributeConstraintsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolSchemaStringAttributeConstraintsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolSchemaStringAttributeConstraintsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaxLength() {
        software.amazon.jsii.Kernel.call(this, "resetMaxLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinLength() {
        software.amazon.jsii.Kernel.call(this, "resetMinLength", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "maxLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMinLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "minLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxLength() {
        return software.amazon.jsii.Kernel.get(this, "maxLength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxLength(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxLength", java.util.Objects.requireNonNull(value, "maxLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMinLength() {
        return software.amazon.jsii.Kernel.get(this, "minLength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMinLength(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "minLength", java.util.Objects.requireNonNull(value, "minLength is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
