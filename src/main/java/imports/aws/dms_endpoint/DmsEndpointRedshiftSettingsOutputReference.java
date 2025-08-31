package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointRedshiftSettingsOutputReference")
public class DmsEndpointRedshiftSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DmsEndpointRedshiftSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DmsEndpointRedshiftSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DmsEndpointRedshiftSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBucketFolder() {
        software.amazon.jsii.Kernel.call(this, "resetBucketFolder", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBucketName() {
        software.amazon.jsii.Kernel.call(this, "resetBucketName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionMode() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerSideEncryptionKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetServerSideEncryptionKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceAccessRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetServiceAccessRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketFolderInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketFolderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncryptionModeInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServerSideEncryptionKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryptionKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceAccessRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketFolder() {
        return software.amazon.jsii.Kernel.get(this, "bucketFolder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketFolder(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketFolder", java.util.Objects.requireNonNull(value, "bucketFolder is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketName", java.util.Objects.requireNonNull(value, "bucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncryptionMode() {
        return software.amazon.jsii.Kernel.get(this, "encryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncryptionMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encryptionMode", java.util.Objects.requireNonNull(value, "encryptionMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServerSideEncryptionKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryptionKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServerSideEncryptionKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serverSideEncryptionKmsKeyId", java.util.Objects.requireNonNull(value, "serverSideEncryptionKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceAccessRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceAccessRoleArn", java.util.Objects.requireNonNull(value, "serviceAccessRoleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointRedshiftSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointRedshiftSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointRedshiftSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
