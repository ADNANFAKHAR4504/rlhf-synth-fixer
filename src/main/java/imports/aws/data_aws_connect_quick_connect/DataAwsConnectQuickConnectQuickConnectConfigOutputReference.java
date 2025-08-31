package imports.aws.data_aws_connect_quick_connect;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.534Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsConnectQuickConnect.DataAwsConnectQuickConnectQuickConnectConfigOutputReference")
public class DataAwsConnectQuickConnectQuickConnectConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsConnectQuickConnectQuickConnectConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsConnectQuickConnectQuickConnectConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsConnectQuickConnectQuickConnectConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_quick_connect.DataAwsConnectQuickConnectQuickConnectConfigPhoneConfigList getPhoneConfig() {
        return software.amazon.jsii.Kernel.get(this, "phoneConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_quick_connect.DataAwsConnectQuickConnectQuickConnectConfigPhoneConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_quick_connect.DataAwsConnectQuickConnectQuickConnectConfigQueueConfigList getQueueConfig() {
        return software.amazon.jsii.Kernel.get(this, "queueConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_quick_connect.DataAwsConnectQuickConnectQuickConnectConfigQueueConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQuickConnectType() {
        return software.amazon.jsii.Kernel.get(this, "quickConnectType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_quick_connect.DataAwsConnectQuickConnectQuickConnectConfigUserConfigList getUserConfig() {
        return software.amazon.jsii.Kernel.get(this, "userConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_quick_connect.DataAwsConnectQuickConnectQuickConnectConfigUserConfigList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_connect_quick_connect.DataAwsConnectQuickConnectQuickConnectConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_quick_connect.DataAwsConnectQuickConnectQuickConnectConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_connect_quick_connect.DataAwsConnectQuickConnectQuickConnectConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
