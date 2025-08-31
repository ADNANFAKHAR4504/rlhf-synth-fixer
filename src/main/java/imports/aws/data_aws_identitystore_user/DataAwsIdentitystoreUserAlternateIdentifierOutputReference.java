package imports.aws.data_aws_identitystore_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.681Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreUser.DataAwsIdentitystoreUserAlternateIdentifierOutputReference")
public class DataAwsIdentitystoreUserAlternateIdentifierOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsIdentitystoreUserAlternateIdentifierOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsIdentitystoreUserAlternateIdentifierOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsIdentitystoreUserAlternateIdentifierOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putExternalId(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalId value) {
        software.amazon.jsii.Kernel.call(this, "putExternalId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUniqueAttribute(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttribute value) {
        software.amazon.jsii.Kernel.call(this, "putUniqueAttribute", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetExternalId() {
        software.amazon.jsii.Kernel.call(this, "resetExternalId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUniqueAttribute() {
        software.amazon.jsii.Kernel.call(this, "resetUniqueAttribute", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalIdOutputReference getExternalId() {
        return software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalIdOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttributeOutputReference getUniqueAttribute() {
        return software.amazon.jsii.Kernel.get(this, "uniqueAttribute", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttributeOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalId getExternalIdInput() {
        return software.amazon.jsii.Kernel.get(this, "externalIdInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalId.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttribute getUniqueAttributeInput() {
        return software.amazon.jsii.Kernel.get(this, "uniqueAttributeInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttribute.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifier getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifier.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifier value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
