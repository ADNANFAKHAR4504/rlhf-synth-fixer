package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.523Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplatePrivateDnsNameOptionsOutputReference")
public class LaunchTemplatePrivateDnsNameOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LaunchTemplatePrivateDnsNameOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchTemplatePrivateDnsNameOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LaunchTemplatePrivateDnsNameOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEnableResourceNameDnsAaaaRecord() {
        software.amazon.jsii.Kernel.call(this, "resetEnableResourceNameDnsAaaaRecord", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableResourceNameDnsARecord() {
        software.amazon.jsii.Kernel.call(this, "resetEnableResourceNameDnsARecord", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostnameType() {
        software.amazon.jsii.Kernel.call(this, "resetHostnameType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableResourceNameDnsAaaaRecordInput() {
        return software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsAaaaRecordInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableResourceNameDnsARecordInput() {
        return software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsARecordInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostnameTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "hostnameTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableResourceNameDnsAaaaRecord() {
        return software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsAaaaRecord", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableResourceNameDnsAaaaRecord(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableResourceNameDnsAaaaRecord", java.util.Objects.requireNonNull(value, "enableResourceNameDnsAaaaRecord is required"));
    }

    public void setEnableResourceNameDnsAaaaRecord(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableResourceNameDnsAaaaRecord", java.util.Objects.requireNonNull(value, "enableResourceNameDnsAaaaRecord is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableResourceNameDnsARecord() {
        return software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsARecord", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableResourceNameDnsARecord(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableResourceNameDnsARecord", java.util.Objects.requireNonNull(value, "enableResourceNameDnsARecord is required"));
    }

    public void setEnableResourceNameDnsARecord(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableResourceNameDnsARecord", java.util.Objects.requireNonNull(value, "enableResourceNameDnsARecord is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostnameType() {
        return software.amazon.jsii.Kernel.get(this, "hostnameType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostnameType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostnameType", java.util.Objects.requireNonNull(value, "hostnameType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
