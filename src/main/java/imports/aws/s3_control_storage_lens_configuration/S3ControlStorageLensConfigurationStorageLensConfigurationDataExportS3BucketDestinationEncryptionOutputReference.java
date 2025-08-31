package imports.aws.s3_control_storage_lens_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionOutputReference")
public class S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSseKms(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseKms value) {
        software.amazon.jsii.Kernel.call(this, "putSseKms", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSseS3(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseS3>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseS3> __cast_cd4240 = (java.util.List<imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseS3>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseS3 __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSseS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSseKms() {
        software.amazon.jsii.Kernel.call(this, "resetSseKms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSseS3() {
        software.amazon.jsii.Kernel.call(this, "resetSseS3", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseKmsOutputReference getSseKms() {
        return software.amazon.jsii.Kernel.get(this, "sseKms", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseKmsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseS3List getSseS3() {
        return software.amazon.jsii.Kernel.get(this, "sseS3", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseS3List.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseKms getSseKmsInput() {
        return software.amazon.jsii.Kernel.get(this, "sseKmsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryptionSseKms.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSseS3Input() {
        return software.amazon.jsii.Kernel.get(this, "sseS3Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryption getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryption.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestinationEncryption value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
