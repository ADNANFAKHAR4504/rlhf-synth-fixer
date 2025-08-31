package imports.aws.connect_instance_storage_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.385Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigOutputReference")
public class ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEncryptionConfig(final @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig value) {
        software.amazon.jsii.Kernel.call(this, "putEncryptionConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfigOutputReference getEncryptionConfig() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig getEncryptionConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetentionPeriodHoursInput() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodHoursInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrefix() {
        return software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "prefix", java.util.Objects.requireNonNull(value, "prefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetentionPeriodHours() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodHours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetentionPeriodHours(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retentionPeriodHours", java.util.Objects.requireNonNull(value, "retentionPeriodHours is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
