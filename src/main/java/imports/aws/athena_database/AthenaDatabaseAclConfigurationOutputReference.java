package imports.aws.athena_database;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.080Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.athenaDatabase.AthenaDatabaseAclConfigurationOutputReference")
public class AthenaDatabaseAclConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AthenaDatabaseAclConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AthenaDatabaseAclConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AthenaDatabaseAclConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3AclOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "s3AclOptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3AclOption() {
        return software.amazon.jsii.Kernel.get(this, "s3AclOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3AclOption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3AclOption", java.util.Objects.requireNonNull(value, "s3AclOption is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.athena_database.AthenaDatabaseAclConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.athena_database.AthenaDatabaseAclConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.athena_database.AthenaDatabaseAclConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
