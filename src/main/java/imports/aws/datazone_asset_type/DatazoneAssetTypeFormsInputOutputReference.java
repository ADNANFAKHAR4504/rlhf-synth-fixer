package imports.aws.datazone_asset_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneAssetType.DatazoneAssetTypeFormsInputOutputReference")
public class DatazoneAssetTypeFormsInputOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatazoneAssetTypeFormsInputOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatazoneAssetTypeFormsInputOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DatazoneAssetTypeFormsInputOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetRequired() {
        software.amazon.jsii.Kernel.call(this, "resetRequired", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMapBlockKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "mapBlockKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequiredInput() {
        return software.amazon.jsii.Kernel.get(this, "requiredInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "typeIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeRevisionInput() {
        return software.amazon.jsii.Kernel.get(this, "typeRevisionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMapBlockKey() {
        return software.amazon.jsii.Kernel.get(this, "mapBlockKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMapBlockKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mapBlockKey", java.util.Objects.requireNonNull(value, "mapBlockKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequired() {
        return software.amazon.jsii.Kernel.get(this, "required", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequired(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "required", java.util.Objects.requireNonNull(value, "required is required"));
    }

    public void setRequired(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "required", java.util.Objects.requireNonNull(value, "required is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTypeIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "typeIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTypeIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "typeIdentifier", java.util.Objects.requireNonNull(value, "typeIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTypeRevision() {
        return software.amazon.jsii.Kernel.get(this, "typeRevision", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTypeRevision(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "typeRevision", java.util.Objects.requireNonNull(value, "typeRevision is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datazone_asset_type.DatazoneAssetTypeFormsInput value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
