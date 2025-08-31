package imports.aws.glue_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.287Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueConnection.GlueConnectionPhysicalConnectionRequirementsOutputReference")
public class GlueConnectionPhysicalConnectionRequirementsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueConnectionPhysicalConnectionRequirementsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueConnectionPhysicalConnectionRequirementsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueConnectionPhysicalConnectionRequirementsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIdList() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIdList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetId() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZone", java.util.Objects.requireNonNull(value, "availabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIdList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupIdList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupIdList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupIdList", java.util.Objects.requireNonNull(value, "securityGroupIdList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubnetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subnetId", java.util.Objects.requireNonNull(value, "subnetId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_connection.GlueConnectionPhysicalConnectionRequirements getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_connection.GlueConnectionPhysicalConnectionRequirements.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_connection.GlueConnectionPhysicalConnectionRequirements value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
