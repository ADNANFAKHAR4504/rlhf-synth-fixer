package imports.aws.codebuild_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.298Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildFleet.CodebuildFleetScalingConfigurationOutputReference")
public class CodebuildFleetScalingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildFleetScalingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildFleetScalingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodebuildFleetScalingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putTargetTrackingScalingConfigs(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codebuild_fleet.CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codebuild_fleet.CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs> __cast_cd4240 = (java.util.List<imports.aws.codebuild_fleet.CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codebuild_fleet.CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTargetTrackingScalingConfigs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMaxCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetMaxCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScalingType() {
        software.amazon.jsii.Kernel.call(this, "resetScalingType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetTrackingScalingConfigs() {
        software.amazon.jsii.Kernel.call(this, "resetTargetTrackingScalingConfigs", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDesiredCapacity() {
        return software.amazon.jsii.Kernel.get(this, "desiredCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_fleet.CodebuildFleetScalingConfigurationTargetTrackingScalingConfigsList getTargetTrackingScalingConfigs() {
        return software.amazon.jsii.Kernel.get(this, "targetTrackingScalingConfigs", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetScalingConfigurationTargetTrackingScalingConfigsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScalingTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetTrackingScalingConfigsInput() {
        return software.amazon.jsii.Kernel.get(this, "targetTrackingScalingConfigsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxCapacity() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxCapacity", java.util.Objects.requireNonNull(value, "maxCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScalingType() {
        return software.amazon.jsii.Kernel.get(this, "scalingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScalingType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scalingType", java.util.Objects.requireNonNull(value, "scalingType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
