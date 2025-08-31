package imports.aws.quicksight_refresh_schedule;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule aws_quicksight_refresh_schedule}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.122Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightRefreshSchedule.QuicksightRefreshSchedule")
public class QuicksightRefreshSchedule extends com.hashicorp.cdktf.TerraformResource {

    protected QuicksightRefreshSchedule(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightRefreshSchedule(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.quicksight_refresh_schedule.QuicksightRefreshSchedule.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule aws_quicksight_refresh_schedule} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public QuicksightRefreshSchedule(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a QuicksightRefreshSchedule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightRefreshSchedule to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightRefreshSchedule that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the QuicksightRefreshSchedule to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_refresh_schedule.QuicksightRefreshSchedule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a QuicksightRefreshSchedule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightRefreshSchedule to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightRefreshSchedule that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_refresh_schedule.QuicksightRefreshSchedule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putSchedule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleSchedule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleSchedule> __cast_cd4240 = (java.util.List<imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleSchedule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleSchedule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSchedule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchedule() {
        software.amazon.jsii.Kernel.call(this, "resetSchedule", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleList getSchedule() {
        return software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleIdInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getScheduleInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsAccountId() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsAccountId", java.util.Objects.requireNonNull(value, "awsAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSetId() {
        return software.amazon.jsii.Kernel.get(this, "dataSetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSetId", java.util.Objects.requireNonNull(value, "dataSetId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduleId() {
        return software.amazon.jsii.Kernel.get(this, "scheduleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduleId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduleId", java.util.Objects.requireNonNull(value, "scheduleId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.quicksight_refresh_schedule.QuicksightRefreshSchedule}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.quicksight_refresh_schedule.QuicksightRefreshSchedule> {
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
        private final imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#data_set_id QuicksightRefreshSchedule#data_set_id}.
         * <p>
         * @return {@code this}
         * @param dataSetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#data_set_id QuicksightRefreshSchedule#data_set_id}. This parameter is required.
         */
        public Builder dataSetId(final java.lang.String dataSetId) {
            this.config.dataSetId(dataSetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#schedule_id QuicksightRefreshSchedule#schedule_id}.
         * <p>
         * @return {@code this}
         * @param scheduleId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#schedule_id QuicksightRefreshSchedule#schedule_id}. This parameter is required.
         */
        public Builder scheduleId(final java.lang.String scheduleId) {
            this.config.scheduleId(scheduleId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#aws_account_id QuicksightRefreshSchedule#aws_account_id}.
         * <p>
         * @return {@code this}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#aws_account_id QuicksightRefreshSchedule#aws_account_id}. This parameter is required.
         */
        public Builder awsAccountId(final java.lang.String awsAccountId) {
            this.config.awsAccountId(awsAccountId);
            return this;
        }

        /**
         * schedule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#schedule QuicksightRefreshSchedule#schedule}
         * <p>
         * @return {@code this}
         * @param schedule schedule block. This parameter is required.
         */
        public Builder schedule(final com.hashicorp.cdktf.IResolvable schedule) {
            this.config.schedule(schedule);
            return this;
        }
        /**
         * schedule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#schedule QuicksightRefreshSchedule#schedule}
         * <p>
         * @return {@code this}
         * @param schedule schedule block. This parameter is required.
         */
        public Builder schedule(final java.util.List<? extends imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleSchedule> schedule) {
            this.config.schedule(schedule);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.quicksight_refresh_schedule.QuicksightRefreshSchedule}.
         */
        @Override
        public imports.aws.quicksight_refresh_schedule.QuicksightRefreshSchedule build() {
            return new imports.aws.quicksight_refresh_schedule.QuicksightRefreshSchedule(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
