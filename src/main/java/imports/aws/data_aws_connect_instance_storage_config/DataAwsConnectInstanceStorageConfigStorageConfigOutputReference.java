package imports.aws.data_aws_connect_instance_storage_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.530Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsConnectInstanceStorageConfig.DataAwsConnectInstanceStorageConfigStorageConfigOutputReference")
public class DataAwsConnectInstanceStorageConfigStorageConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsConnectInstanceStorageConfigStorageConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsConnectInstanceStorageConfigStorageConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsConnectInstanceStorageConfigStorageConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfigList getKinesisFirehoseConfig() {
        return software.amazon.jsii.Kernel.get(this, "kinesisFirehoseConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfigKinesisStreamConfigList getKinesisStreamConfig() {
        return software.amazon.jsii.Kernel.get(this, "kinesisStreamConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfigKinesisStreamConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigList getKinesisVideoStreamConfig() {
        return software.amazon.jsii.Kernel.get(this, "kinesisVideoStreamConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfigS3ConfigList getS3Config() {
        return software.amazon.jsii.Kernel.get(this, "s3Config", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfigS3ConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageType() {
        return software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_connect_instance_storage_config.DataAwsConnectInstanceStorageConfigStorageConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
