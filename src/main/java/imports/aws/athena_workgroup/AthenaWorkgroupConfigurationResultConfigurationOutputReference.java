package imports.aws.athena_workgroup;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.082Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.athenaWorkgroup.AthenaWorkgroupConfigurationResultConfigurationOutputReference")
public class AthenaWorkgroupConfigurationResultConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AthenaWorkgroupConfigurationResultConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AthenaWorkgroupConfigurationResultConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AthenaWorkgroupConfigurationResultConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAclConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAclConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEncryptionConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putEncryptionConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAclConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAclConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExpectedBucketOwner() {
        software.amazon.jsii.Kernel.call(this, "resetExpectedBucketOwner", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputLocation() {
        software.amazon.jsii.Kernel.call(this, "resetOutputLocation", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfigurationOutputReference getAclConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "aclConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfigurationOutputReference getEncryptionConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration getAclConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "aclConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration getEncryptionConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExpectedBucketOwnerInput() {
        return software.amazon.jsii.Kernel.get(this, "expectedBucketOwnerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "outputLocationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExpectedBucketOwner() {
        return software.amazon.jsii.Kernel.get(this, "expectedBucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExpectedBucketOwner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "expectedBucketOwner", java.util.Objects.requireNonNull(value, "expectedBucketOwner is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputLocation() {
        return software.amazon.jsii.Kernel.get(this, "outputLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputLocation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputLocation", java.util.Objects.requireNonNull(value, "outputLocation is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
