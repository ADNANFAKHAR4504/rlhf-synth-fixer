package imports.aws.gamelift_game_server_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.265Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftGameServerGroup.GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfigurationOutputReference")
public class GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTargetValueInput() {
        return software.amazon.jsii.Kernel.get(this, "targetValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetValue() {
        return software.amazon.jsii.Kernel.get(this, "targetValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetValue(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetValue", java.util.Objects.requireNonNull(value, "targetValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
