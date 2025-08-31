package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.199Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterMasterInstanceFleetOutputReference")
public class EmrClusterMasterInstanceFleetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrClusterMasterInstanceFleetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrClusterMasterInstanceFleetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrClusterMasterInstanceFleetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putInstanceTypeConfigs(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emr_cluster.EmrClusterMasterInstanceFleetInstanceTypeConfigs>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emr_cluster.EmrClusterMasterInstanceFleetInstanceTypeConfigs> __cast_cd4240 = (java.util.List<imports.aws.emr_cluster.EmrClusterMasterInstanceFleetInstanceTypeConfigs>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emr_cluster.EmrClusterMasterInstanceFleetInstanceTypeConfigs __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInstanceTypeConfigs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchSpecifications(final @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecifications value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchSpecifications", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetInstanceTypeConfigs() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceTypeConfigs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchSpecifications() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchSpecifications", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetOnDemandCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetTargetOnDemandCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetSpotCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetTargetSpotCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterMasterInstanceFleetInstanceTypeConfigsList getInstanceTypeConfigs() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeConfigs", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceFleetInstanceTypeConfigsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecificationsOutputReference getLaunchSpecifications() {
        return software.amazon.jsii.Kernel.get(this, "launchSpecifications", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecificationsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProvisionedOnDemandCapacity() {
        return software.amazon.jsii.Kernel.get(this, "provisionedOnDemandCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProvisionedSpotCapacity() {
        return software.amazon.jsii.Kernel.get(this, "provisionedSpotCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInstanceTypeConfigsInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeConfigsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecifications getLaunchSpecificationsInput() {
        return software.amazon.jsii.Kernel.get(this, "launchSpecificationsInput", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecifications.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTargetOnDemandCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "targetOnDemandCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTargetSpotCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "targetSpotCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetOnDemandCapacity() {
        return software.amazon.jsii.Kernel.get(this, "targetOnDemandCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetOnDemandCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetOnDemandCapacity", java.util.Objects.requireNonNull(value, "targetOnDemandCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetSpotCapacity() {
        return software.amazon.jsii.Kernel.get(this, "targetSpotCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetSpotCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetSpotCapacity", java.util.Objects.requireNonNull(value, "targetSpotCapacity is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterMasterInstanceFleet getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceFleet.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterMasterInstanceFleet value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
