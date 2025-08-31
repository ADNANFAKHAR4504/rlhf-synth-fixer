package imports.aws.glue_data_catalog_encryption_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueDataCatalogEncryptionSettings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsOutputReference")
public class GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putConnectionPasswordEncryption(final @org.jetbrains.annotations.NotNull imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption value) {
        software.amazon.jsii.Kernel.call(this, "putConnectionPasswordEncryption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEncryptionAtRest(final @org.jetbrains.annotations.NotNull imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest value) {
        software.amazon.jsii.Kernel.call(this, "putEncryptionAtRest", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryptionOutputReference getConnectionPasswordEncryption() {
        return software.amazon.jsii.Kernel.get(this, "connectionPasswordEncryption", software.amazon.jsii.NativeType.forClass(imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRestOutputReference getEncryptionAtRest() {
        return software.amazon.jsii.Kernel.get(this, "encryptionAtRest", software.amazon.jsii.NativeType.forClass(imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRestOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption getConnectionPasswordEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionPasswordEncryptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest getEncryptionAtRestInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionAtRestInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_data_catalog_encryption_settings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
