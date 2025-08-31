package imports.aws.connect_instance_storage_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.385Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfigOutputReference")
public class ConnectInstanceStorageConfigStorageConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConnectInstanceStorageConfigStorageConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConnectInstanceStorageConfigStorageConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConnectInstanceStorageConfigStorageConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putKinesisFirehoseConfig(final @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfig value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisFirehoseConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisStreamConfig(final @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisStreamConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisVideoStreamConfig(final @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisVideoStreamConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Config(final @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config value) {
        software.amazon.jsii.Kernel.call(this, "putS3Config", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetKinesisFirehoseConfig() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisFirehoseConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisStreamConfig() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisStreamConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisVideoStreamConfig() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisVideoStreamConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Config() {
        software.amazon.jsii.Kernel.call(this, "resetS3Config", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfigOutputReference getKinesisFirehoseConfig() {
        return software.amazon.jsii.Kernel.get(this, "kinesisFirehoseConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfigOutputReference getKinesisStreamConfig() {
        return software.amazon.jsii.Kernel.get(this, "kinesisStreamConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigOutputReference getKinesisVideoStreamConfig() {
        return software.amazon.jsii.Kernel.get(this, "kinesisVideoStreamConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigOutputReference getS3Config() {
        return software.amazon.jsii.Kernel.get(this, "s3Config", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfig getKinesisFirehoseConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisFirehoseConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig getKinesisStreamConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisStreamConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig getKinesisVideoStreamConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisVideoStreamConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config getS3ConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStorageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "storageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageType() {
        return software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStorageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "storageType", java.util.Objects.requireNonNull(value, "storageType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
