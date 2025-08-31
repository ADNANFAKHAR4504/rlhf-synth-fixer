package imports.aws.connect_instance_storage_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.386Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfigS3ConfigOutputReference")
public class ConnectInstanceStorageConfigStorageConfigS3ConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConnectInstanceStorageConfigStorageConfigS3ConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConnectInstanceStorageConfigStorageConfigS3ConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConnectInstanceStorageConfigStorageConfigS3ConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEncryptionConfig(final @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfig value) {
        software.amazon.jsii.Kernel.call(this, "putEncryptionConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEncryptionConfig() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfigOutputReference getEncryptionConfig() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfig getEncryptionConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketName", java.util.Objects.requireNonNull(value, "bucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketPrefix() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketPrefix", java.util.Objects.requireNonNull(value, "bucketPrefix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
