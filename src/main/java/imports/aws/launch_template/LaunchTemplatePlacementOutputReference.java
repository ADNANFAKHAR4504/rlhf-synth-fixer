package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.523Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplatePlacementOutputReference")
public class LaunchTemplatePlacementOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LaunchTemplatePlacementOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchTemplatePlacementOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LaunchTemplatePlacementOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAffinity() {
        software.amazon.jsii.Kernel.call(this, "resetAffinity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostId() {
        software.amazon.jsii.Kernel.call(this, "resetHostId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostResourceGroupArn() {
        software.amazon.jsii.Kernel.call(this, "resetHostResourceGroupArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPartitionNumber() {
        software.amazon.jsii.Kernel.call(this, "resetPartitionNumber", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpreadDomain() {
        software.amazon.jsii.Kernel.call(this, "resetSpreadDomain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTenancy() {
        software.amazon.jsii.Kernel.call(this, "resetTenancy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAffinityInput() {
        return software.amazon.jsii.Kernel.get(this, "affinityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "groupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostIdInput() {
        return software.amazon.jsii.Kernel.get(this, "hostIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostResourceGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "hostResourceGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPartitionNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "partitionNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpreadDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "spreadDomainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTenancyInput() {
        return software.amazon.jsii.Kernel.get(this, "tenancyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAffinity() {
        return software.amazon.jsii.Kernel.get(this, "affinity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAffinity(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "affinity", java.util.Objects.requireNonNull(value, "affinity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZone", java.util.Objects.requireNonNull(value, "availabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGroupName() {
        return software.amazon.jsii.Kernel.get(this, "groupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "groupName", java.util.Objects.requireNonNull(value, "groupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostId() {
        return software.amazon.jsii.Kernel.get(this, "hostId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostId", java.util.Objects.requireNonNull(value, "hostId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostResourceGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "hostResourceGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostResourceGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostResourceGroupArn", java.util.Objects.requireNonNull(value, "hostResourceGroupArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPartitionNumber() {
        return software.amazon.jsii.Kernel.get(this, "partitionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPartitionNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "partitionNumber", java.util.Objects.requireNonNull(value, "partitionNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpreadDomain() {
        return software.amazon.jsii.Kernel.get(this, "spreadDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpreadDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spreadDomain", java.util.Objects.requireNonNull(value, "spreadDomain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTenancy() {
        return software.amazon.jsii.Kernel.get(this, "tenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTenancy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tenancy", java.util.Objects.requireNonNull(value, "tenancy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplatePlacement getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplatePlacement.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplatePlacement value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
