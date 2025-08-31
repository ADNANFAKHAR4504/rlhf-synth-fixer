package imports.aws.autoscaling_schedule;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule aws_autoscaling_schedule}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.109Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingSchedule.AutoscalingSchedule")
public class AutoscalingSchedule extends com.hashicorp.cdktf.TerraformResource {

    protected AutoscalingSchedule(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingSchedule(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.autoscaling_schedule.AutoscalingSchedule.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule aws_autoscaling_schedule} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AutoscalingSchedule(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_schedule.AutoscalingScheduleConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AutoscalingSchedule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AutoscalingSchedule to import. This parameter is required.
     * @param importFromId The id of the existing AutoscalingSchedule that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AutoscalingSchedule to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.autoscaling_schedule.AutoscalingSchedule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AutoscalingSchedule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AutoscalingSchedule to import. This parameter is required.
     * @param importFromId The id of the existing AutoscalingSchedule that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.autoscaling_schedule.AutoscalingSchedule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetDesiredCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetDesiredCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndTime() {
        software.amazon.jsii.Kernel.call(this, "resetEndTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxSize() {
        software.amazon.jsii.Kernel.call(this, "resetMaxSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinSize() {
        software.amazon.jsii.Kernel.call(this, "resetMinSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecurrence() {
        software.amazon.jsii.Kernel.call(this, "resetRecurrence", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartTime() {
        software.amazon.jsii.Kernel.call(this, "resetStartTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeZone() {
        software.amazon.jsii.Kernel.call(this, "resetTimeZone", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoscalingGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "autoscalingGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDesiredCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "endTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "minSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecurrenceInput() {
        return software.amazon.jsii.Kernel.get(this, "recurrenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduledActionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduledActionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "startTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimeZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "timeZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoscalingGroupName() {
        return software.amazon.jsii.Kernel.get(this, "autoscalingGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoscalingGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoscalingGroupName", java.util.Objects.requireNonNull(value, "autoscalingGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDesiredCapacity() {
        return software.amazon.jsii.Kernel.get(this, "desiredCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDesiredCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "desiredCapacity", java.util.Objects.requireNonNull(value, "desiredCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndTime() {
        return software.amazon.jsii.Kernel.get(this, "endTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endTime", java.util.Objects.requireNonNull(value, "endTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxSize() {
        return software.amazon.jsii.Kernel.get(this, "maxSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxSize", java.util.Objects.requireNonNull(value, "maxSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinSize() {
        return software.amazon.jsii.Kernel.get(this, "minSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minSize", java.util.Objects.requireNonNull(value, "minSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecurrence() {
        return software.amazon.jsii.Kernel.get(this, "recurrence", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecurrence(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recurrence", java.util.Objects.requireNonNull(value, "recurrence is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduledActionName() {
        return software.amazon.jsii.Kernel.get(this, "scheduledActionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduledActionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduledActionName", java.util.Objects.requireNonNull(value, "scheduledActionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartTime() {
        return software.amazon.jsii.Kernel.get(this, "startTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startTime", java.util.Objects.requireNonNull(value, "startTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimeZone() {
        return software.amazon.jsii.Kernel.get(this, "timeZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimeZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timeZone", java.util.Objects.requireNonNull(value, "timeZone is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.autoscaling_schedule.AutoscalingSchedule}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.autoscaling_schedule.AutoscalingSchedule> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.autoscaling_schedule.AutoscalingScheduleConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.autoscaling_schedule.AutoscalingScheduleConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#autoscaling_group_name AutoscalingSchedule#autoscaling_group_name}.
         * <p>
         * @return {@code this}
         * @param autoscalingGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#autoscaling_group_name AutoscalingSchedule#autoscaling_group_name}. This parameter is required.
         */
        public Builder autoscalingGroupName(final java.lang.String autoscalingGroupName) {
            this.config.autoscalingGroupName(autoscalingGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#scheduled_action_name AutoscalingSchedule#scheduled_action_name}.
         * <p>
         * @return {@code this}
         * @param scheduledActionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#scheduled_action_name AutoscalingSchedule#scheduled_action_name}. This parameter is required.
         */
        public Builder scheduledActionName(final java.lang.String scheduledActionName) {
            this.config.scheduledActionName(scheduledActionName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#desired_capacity AutoscalingSchedule#desired_capacity}.
         * <p>
         * @return {@code this}
         * @param desiredCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#desired_capacity AutoscalingSchedule#desired_capacity}. This parameter is required.
         */
        public Builder desiredCapacity(final java.lang.Number desiredCapacity) {
            this.config.desiredCapacity(desiredCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#end_time AutoscalingSchedule#end_time}.
         * <p>
         * @return {@code this}
         * @param endTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#end_time AutoscalingSchedule#end_time}. This parameter is required.
         */
        public Builder endTime(final java.lang.String endTime) {
            this.config.endTime(endTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#id AutoscalingSchedule#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#id AutoscalingSchedule#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#max_size AutoscalingSchedule#max_size}.
         * <p>
         * @return {@code this}
         * @param maxSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#max_size AutoscalingSchedule#max_size}. This parameter is required.
         */
        public Builder maxSize(final java.lang.Number maxSize) {
            this.config.maxSize(maxSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#min_size AutoscalingSchedule#min_size}.
         * <p>
         * @return {@code this}
         * @param minSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#min_size AutoscalingSchedule#min_size}. This parameter is required.
         */
        public Builder minSize(final java.lang.Number minSize) {
            this.config.minSize(minSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#recurrence AutoscalingSchedule#recurrence}.
         * <p>
         * @return {@code this}
         * @param recurrence Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#recurrence AutoscalingSchedule#recurrence}. This parameter is required.
         */
        public Builder recurrence(final java.lang.String recurrence) {
            this.config.recurrence(recurrence);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#start_time AutoscalingSchedule#start_time}.
         * <p>
         * @return {@code this}
         * @param startTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#start_time AutoscalingSchedule#start_time}. This parameter is required.
         */
        public Builder startTime(final java.lang.String startTime) {
            this.config.startTime(startTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#time_zone AutoscalingSchedule#time_zone}.
         * <p>
         * @return {@code this}
         * @param timeZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_schedule#time_zone AutoscalingSchedule#time_zone}. This parameter is required.
         */
        public Builder timeZone(final java.lang.String timeZone) {
            this.config.timeZone(timeZone);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.autoscaling_schedule.AutoscalingSchedule}.
         */
        @Override
        public imports.aws.autoscaling_schedule.AutoscalingSchedule build() {
            return new imports.aws.autoscaling_schedule.AutoscalingSchedule(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
