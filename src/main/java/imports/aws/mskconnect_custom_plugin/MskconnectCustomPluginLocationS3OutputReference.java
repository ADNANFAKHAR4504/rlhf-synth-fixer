package imports.aws.mskconnect_custom_plugin;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.921Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectCustomPlugin.MskconnectCustomPluginLocationS3OutputReference")
public class MskconnectCustomPluginLocationS3OutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskconnectCustomPluginLocationS3OutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskconnectCustomPluginLocationS3OutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskconnectCustomPluginLocationS3OutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetObjectVersion() {
        software.amazon.jsii.Kernel.call(this, "resetObjectVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketArnInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "fileKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "objectVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketArn() {
        return software.amazon.jsii.Kernel.get(this, "bucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketArn", java.util.Objects.requireNonNull(value, "bucketArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileKey() {
        return software.amazon.jsii.Kernel.get(this, "fileKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileKey", java.util.Objects.requireNonNull(value, "fileKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObjectVersion() {
        return software.amazon.jsii.Kernel.get(this, "objectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObjectVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "objectVersion", java.util.Objects.requireNonNull(value, "objectVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocationS3 getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocationS3.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocationS3 value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
