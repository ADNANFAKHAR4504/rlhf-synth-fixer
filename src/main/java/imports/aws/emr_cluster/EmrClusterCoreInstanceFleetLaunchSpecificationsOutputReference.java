package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.197Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterCoreInstanceFleetLaunchSpecificationsOutputReference")
public class EmrClusterCoreInstanceFleetLaunchSpecificationsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrClusterCoreInstanceFleetLaunchSpecificationsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrClusterCoreInstanceFleetLaunchSpecificationsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrClusterCoreInstanceFleetLaunchSpecificationsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putOnDemandSpecification(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsOnDemandSpecification>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsOnDemandSpecification> __cast_cd4240 = (java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsOnDemandSpecification>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsOnDemandSpecification __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOnDemandSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSpotSpecification(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecification>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecification> __cast_cd4240 = (java.util.List<imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecification>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecification __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSpotSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetOnDemandSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetSpotSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsOnDemandSpecificationList getOnDemandSpecification() {
        return software.amazon.jsii.Kernel.get(this, "onDemandSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsOnDemandSpecificationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecificationList getSpotSpecification() {
        return software.amazon.jsii.Kernel.get(this, "spotSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecificationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOnDemandSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandSpecificationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSpotSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "spotSpecificationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecifications getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecifications.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecifications value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
