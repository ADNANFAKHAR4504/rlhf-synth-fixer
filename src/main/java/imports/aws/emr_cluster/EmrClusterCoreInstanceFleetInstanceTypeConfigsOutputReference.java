package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.196Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsOutputReference")
public class EmrClusterCoreInstanceFleetInstanceTypeConfigsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrClusterCoreInstanceFleetInstanceTypeConfigsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrClusterCoreInstanceFleetInstanceTypeConfigsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public EmrClusterCoreInstanceFleetInstanceTypeConfigsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putConfigurations(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsConfigurations>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsConfigurations> __cast_cd4240 = (java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsConfigurations>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsConfigurations __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConfigurations", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEbsConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsEbsConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsEbsConfig> __cast_cd4240 = (java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsEbsConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsEbsConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEbsConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBidPrice() {
        software.amazon.jsii.Kernel.call(this, "resetBidPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBidPriceAsPercentageOfOnDemandPrice() {
        software.amazon.jsii.Kernel.call(this, "resetBidPriceAsPercentageOfOnDemandPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConfigurations() {
        software.amazon.jsii.Kernel.call(this, "resetConfigurations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsConfig() {
        software.amazon.jsii.Kernel.call(this, "resetEbsConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWeightedCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetWeightedCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsConfigurationsList getConfigurations() {
        return software.amazon.jsii.Kernel.get(this, "configurations", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsConfigurationsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsEbsConfigList getEbsConfig() {
        return software.amazon.jsii.Kernel.get(this, "ebsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigsEbsConfigList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBidPriceAsPercentageOfOnDemandPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "bidPriceAsPercentageOfOnDemandPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBidPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "bidPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConfigurationsInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEbsConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWeightedCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "weightedCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBidPrice() {
        return software.amazon.jsii.Kernel.get(this, "bidPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBidPrice(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bidPrice", java.util.Objects.requireNonNull(value, "bidPrice is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBidPriceAsPercentageOfOnDemandPrice() {
        return software.amazon.jsii.Kernel.get(this, "bidPriceAsPercentageOfOnDemandPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBidPriceAsPercentageOfOnDemandPrice(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bidPriceAsPercentageOfOnDemandPrice", java.util.Objects.requireNonNull(value, "bidPriceAsPercentageOfOnDemandPrice is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWeightedCapacity() {
        return software.amazon.jsii.Kernel.get(this, "weightedCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWeightedCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "weightedCapacity", java.util.Objects.requireNonNull(value, "weightedCapacity is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterCoreInstanceFleetInstanceTypeConfigs value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
