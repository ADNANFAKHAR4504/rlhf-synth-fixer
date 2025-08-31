package imports.aws.data_aws_identitystore_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.682Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreUser.DataAwsIdentitystoreUserFilterOutputReference")
public class DataAwsIdentitystoreUserFilterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsIdentitystoreUserFilterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsIdentitystoreUserFilterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsIdentitystoreUserFilterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAttributePathInput() {
        return software.amazon.jsii.Kernel.get(this, "attributePathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAttributeValueInput() {
        return software.amazon.jsii.Kernel.get(this, "attributeValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAttributePath() {
        return software.amazon.jsii.Kernel.get(this, "attributePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAttributePath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "attributePath", java.util.Objects.requireNonNull(value, "attributePath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAttributeValue() {
        return software.amazon.jsii.Kernel.get(this, "attributeValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAttributeValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "attributeValue", java.util.Objects.requireNonNull(value, "attributeValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserFilter getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserFilter.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserFilter value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
