package imports.aws.cleanrooms_collaboration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cleanroomsCollaboration.CleanroomsCollaborationDataEncryptionMetadataOutputReference")
public class CleanroomsCollaborationDataEncryptionMetadataOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CleanroomsCollaborationDataEncryptionMetadataOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CleanroomsCollaborationDataEncryptionMetadataOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CleanroomsCollaborationDataEncryptionMetadataOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowClearTextInput() {
        return software.amazon.jsii.Kernel.get(this, "allowClearTextInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowDuplicatesInput() {
        return software.amazon.jsii.Kernel.get(this, "allowDuplicatesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowJoinsOnColumnsWithDifferentNamesInput() {
        return software.amazon.jsii.Kernel.get(this, "allowJoinsOnColumnsWithDifferentNamesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPreserveNullsInput() {
        return software.amazon.jsii.Kernel.get(this, "preserveNullsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowClearText() {
        return software.amazon.jsii.Kernel.get(this, "allowClearText", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowClearText(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowClearText", java.util.Objects.requireNonNull(value, "allowClearText is required"));
    }

    public void setAllowClearText(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowClearText", java.util.Objects.requireNonNull(value, "allowClearText is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowDuplicates() {
        return software.amazon.jsii.Kernel.get(this, "allowDuplicates", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowDuplicates(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowDuplicates", java.util.Objects.requireNonNull(value, "allowDuplicates is required"));
    }

    public void setAllowDuplicates(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowDuplicates", java.util.Objects.requireNonNull(value, "allowDuplicates is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowJoinsOnColumnsWithDifferentNames() {
        return software.amazon.jsii.Kernel.get(this, "allowJoinsOnColumnsWithDifferentNames", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowJoinsOnColumnsWithDifferentNames(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowJoinsOnColumnsWithDifferentNames", java.util.Objects.requireNonNull(value, "allowJoinsOnColumnsWithDifferentNames is required"));
    }

    public void setAllowJoinsOnColumnsWithDifferentNames(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowJoinsOnColumnsWithDifferentNames", java.util.Objects.requireNonNull(value, "allowJoinsOnColumnsWithDifferentNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPreserveNulls() {
        return software.amazon.jsii.Kernel.get(this, "preserveNulls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPreserveNulls(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "preserveNulls", java.util.Objects.requireNonNull(value, "preserveNulls is required"));
    }

    public void setPreserveNulls(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "preserveNulls", java.util.Objects.requireNonNull(value, "preserveNulls is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cleanrooms_collaboration.CleanroomsCollaborationDataEncryptionMetadata getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cleanrooms_collaboration.CleanroomsCollaborationDataEncryptionMetadata.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cleanrooms_collaboration.CleanroomsCollaborationDataEncryptionMetadata value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
