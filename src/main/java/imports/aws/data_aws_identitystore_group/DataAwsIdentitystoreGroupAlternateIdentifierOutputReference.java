package imports.aws.data_aws_identitystore_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.679Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreGroup.DataAwsIdentitystoreGroupAlternateIdentifierOutputReference")
public class DataAwsIdentitystoreGroupAlternateIdentifierOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsIdentitystoreGroupAlternateIdentifierOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsIdentitystoreGroupAlternateIdentifierOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsIdentitystoreGroupAlternateIdentifierOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putExternalId(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalId value) {
        software.amazon.jsii.Kernel.call(this, "putExternalId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUniqueAttribute(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute value) {
        software.amazon.jsii.Kernel.call(this, "putUniqueAttribute", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetExternalId() {
        software.amazon.jsii.Kernel.call(this, "resetExternalId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUniqueAttribute() {
        software.amazon.jsii.Kernel.call(this, "resetUniqueAttribute", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalIdOutputReference getExternalId() {
        return software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalIdOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttributeOutputReference getUniqueAttribute() {
        return software.amazon.jsii.Kernel.get(this, "uniqueAttribute", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttributeOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalId getExternalIdInput() {
        return software.amazon.jsii.Kernel.get(this, "externalIdInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalId.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute getUniqueAttributeInput() {
        return software.amazon.jsii.Kernel.get(this, "uniqueAttributeInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifier getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifier.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifier value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
