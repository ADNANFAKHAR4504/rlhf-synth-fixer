package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.197Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterEc2AttributesOutputReference")
public class EmrClusterEc2AttributesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrClusterEc2AttributesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrClusterEc2AttributesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrClusterEc2AttributesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAdditionalMasterSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetAdditionalMasterSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdditionalSlaveSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetAdditionalSlaveSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmrManagedMasterSecurityGroup() {
        software.amazon.jsii.Kernel.call(this, "resetEmrManagedMasterSecurityGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmrManagedSlaveSecurityGroup() {
        software.amazon.jsii.Kernel.call(this, "resetEmrManagedSlaveSecurityGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyName() {
        software.amazon.jsii.Kernel.call(this, "resetKeyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceAccessSecurityGroup() {
        software.amazon.jsii.Kernel.call(this, "resetServiceAccessSecurityGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetId() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetIds() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetIds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdditionalMasterSecurityGroupsInput() {
        return software.amazon.jsii.Kernel.get(this, "additionalMasterSecurityGroupsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdditionalSlaveSecurityGroupsInput() {
        return software.amazon.jsii.Kernel.get(this, "additionalSlaveSecurityGroupsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmrManagedMasterSecurityGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "emrManagedMasterSecurityGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmrManagedSlaveSecurityGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "emrManagedSlaveSecurityGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceProfileInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceProfileInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "keyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceAccessSecurityGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessSecurityGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "subnetIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdditionalMasterSecurityGroups() {
        return software.amazon.jsii.Kernel.get(this, "additionalMasterSecurityGroups", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdditionalMasterSecurityGroups(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "additionalMasterSecurityGroups", java.util.Objects.requireNonNull(value, "additionalMasterSecurityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdditionalSlaveSecurityGroups() {
        return software.amazon.jsii.Kernel.get(this, "additionalSlaveSecurityGroups", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdditionalSlaveSecurityGroups(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "additionalSlaveSecurityGroups", java.util.Objects.requireNonNull(value, "additionalSlaveSecurityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmrManagedMasterSecurityGroup() {
        return software.amazon.jsii.Kernel.get(this, "emrManagedMasterSecurityGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmrManagedMasterSecurityGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emrManagedMasterSecurityGroup", java.util.Objects.requireNonNull(value, "emrManagedMasterSecurityGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmrManagedSlaveSecurityGroup() {
        return software.amazon.jsii.Kernel.get(this, "emrManagedSlaveSecurityGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmrManagedSlaveSecurityGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emrManagedSlaveSecurityGroup", java.util.Objects.requireNonNull(value, "emrManagedSlaveSecurityGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceProfile() {
        return software.amazon.jsii.Kernel.get(this, "instanceProfile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceProfile(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceProfile", java.util.Objects.requireNonNull(value, "instanceProfile is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyName() {
        return software.amazon.jsii.Kernel.get(this, "keyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyName", java.util.Objects.requireNonNull(value, "keyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceAccessSecurityGroup() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessSecurityGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceAccessSecurityGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceAccessSecurityGroup", java.util.Objects.requireNonNull(value, "serviceAccessSecurityGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubnetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subnetId", java.util.Objects.requireNonNull(value, "subnetId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSubnetIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "subnetIds", java.util.Objects.requireNonNull(value, "subnetIds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterEc2Attributes getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterEc2Attributes.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterEc2Attributes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
