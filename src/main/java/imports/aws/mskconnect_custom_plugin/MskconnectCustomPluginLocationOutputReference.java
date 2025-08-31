package imports.aws.mskconnect_custom_plugin;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.921Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectCustomPlugin.MskconnectCustomPluginLocationOutputReference")
public class MskconnectCustomPluginLocationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskconnectCustomPluginLocationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskconnectCustomPluginLocationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskconnectCustomPluginLocationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocationS3 value) {
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocationS3OutputReference getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocationS3OutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocationS3 getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocationS3.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocation getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocation.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mskconnect_custom_plugin.MskconnectCustomPluginLocation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
