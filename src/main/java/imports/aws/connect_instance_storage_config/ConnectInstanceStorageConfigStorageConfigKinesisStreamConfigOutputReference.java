package imports.aws.connect_instance_storage_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.385Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfigOutputReference")
public class ConnectInstanceStorageConfigStorageConfigKinesisStreamConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConnectInstanceStorageConfigStorageConfigKinesisStreamConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConnectInstanceStorageConfigStorageConfigKinesisStreamConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConnectInstanceStorageConfigStorageConfigKinesisStreamConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStreamArnInput() {
        return software.amazon.jsii.Kernel.get(this, "streamArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStreamArn() {
        return software.amazon.jsii.Kernel.get(this, "streamArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStreamArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "streamArn", java.util.Objects.requireNonNull(value, "streamArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
