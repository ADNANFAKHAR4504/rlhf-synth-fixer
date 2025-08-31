package imports.aws.appstream_directory_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.059Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamDirectoryConfig.AppstreamDirectoryConfigServiceAccountCredentialsOutputReference")
public class AppstreamDirectoryConfigServiceAccountCredentialsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppstreamDirectoryConfigServiceAccountCredentialsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppstreamDirectoryConfigServiceAccountCredentialsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppstreamDirectoryConfigServiceAccountCredentialsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountNameInput() {
        return software.amazon.jsii.Kernel.get(this, "accountNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "accountPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountName() {
        return software.amazon.jsii.Kernel.get(this, "accountName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountName", java.util.Objects.requireNonNull(value, "accountName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountPassword() {
        return software.amazon.jsii.Kernel.get(this, "accountPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountPassword", java.util.Objects.requireNonNull(value, "accountPassword is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appstream_directory_config.AppstreamDirectoryConfigServiceAccountCredentials getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_directory_config.AppstreamDirectoryConfigServiceAccountCredentials.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appstream_directory_config.AppstreamDirectoryConfigServiceAccountCredentials value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
