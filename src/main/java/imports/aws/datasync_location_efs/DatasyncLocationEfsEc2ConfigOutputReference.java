package imports.aws.datasync_location_efs;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.945Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationEfs.DatasyncLocationEfsEc2ConfigOutputReference")
public class DatasyncLocationEfsEc2ConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatasyncLocationEfsEc2ConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncLocationEfsEc2ConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DatasyncLocationEfsEc2ConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetArnInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupArns", java.util.Objects.requireNonNull(value, "securityGroupArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetArn() {
        return software.amazon.jsii.Kernel.get(this, "subnetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubnetArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subnetArn", java.util.Objects.requireNonNull(value, "subnetArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_location_efs.DatasyncLocationEfsEc2Config getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_efs.DatasyncLocationEfsEc2Config.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datasync_location_efs.DatasyncLocationEfsEc2Config value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
