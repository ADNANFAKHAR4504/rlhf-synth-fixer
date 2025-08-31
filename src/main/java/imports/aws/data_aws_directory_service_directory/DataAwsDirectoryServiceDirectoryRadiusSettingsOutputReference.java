package imports.aws.data_aws_directory_service_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.553Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsDirectoryServiceDirectory.DataAwsDirectoryServiceDirectoryRadiusSettingsOutputReference")
public class DataAwsDirectoryServiceDirectoryRadiusSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsDirectoryServiceDirectoryRadiusSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsDirectoryServiceDirectoryRadiusSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsDirectoryServiceDirectoryRadiusSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationProtocol() {
        return software.amazon.jsii.Kernel.get(this, "authenticationProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayLabel() {
        return software.amazon.jsii.Kernel.get(this, "displayLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRadiusPort() {
        return software.amazon.jsii.Kernel.get(this, "radiusPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRadiusRetries() {
        return software.amazon.jsii.Kernel.get(this, "radiusRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRadiusServers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "radiusServers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRadiusTimeout() {
        return software.amazon.jsii.Kernel.get(this, "radiusTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getUseSameUsername() {
        return software.amazon.jsii.Kernel.get(this, "useSameUsername", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_directory_service_directory.DataAwsDirectoryServiceDirectoryRadiusSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_directory_service_directory.DataAwsDirectoryServiceDirectoryRadiusSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_directory_service_directory.DataAwsDirectoryServiceDirectoryRadiusSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
