package imports.aws.ssm_maintenance_window;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.497Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindow.SsmMaintenanceWindowConfig")
@software.amazon.jsii.Jsii.Proxy(SsmMaintenanceWindowConfig.Jsii$Proxy.class)
public interface SsmMaintenanceWindowConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#cutoff SsmMaintenanceWindow#cutoff}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getCutoff();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#duration SsmMaintenanceWindow#duration}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDuration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#name SsmMaintenanceWindow#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#schedule SsmMaintenanceWindow#schedule}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSchedule();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#allow_unassociated_targets SsmMaintenanceWindow#allow_unassociated_targets}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowUnassociatedTargets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#description SsmMaintenanceWindow#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#enabled SsmMaintenanceWindow#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#end_date SsmMaintenanceWindow#end_date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndDate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#id SsmMaintenanceWindow#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#schedule_offset SsmMaintenanceWindow#schedule_offset}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getScheduleOffset() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#schedule_timezone SsmMaintenanceWindow#schedule_timezone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScheduleTimezone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#start_date SsmMaintenanceWindow#start_date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartDate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#tags SsmMaintenanceWindow#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#tags_all SsmMaintenanceWindow#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmMaintenanceWindowConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmMaintenanceWindowConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmMaintenanceWindowConfig> {
        java.lang.Number cutoff;
        java.lang.Number duration;
        java.lang.String name;
        java.lang.String schedule;
        java.lang.Object allowUnassociatedTargets;
        java.lang.String description;
        java.lang.Object enabled;
        java.lang.String endDate;
        java.lang.String id;
        java.lang.Number scheduleOffset;
        java.lang.String scheduleTimezone;
        java.lang.String startDate;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getCutoff}
         * @param cutoff Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#cutoff SsmMaintenanceWindow#cutoff}. This parameter is required.
         * @return {@code this}
         */
        public Builder cutoff(java.lang.Number cutoff) {
            this.cutoff = cutoff;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getDuration}
         * @param duration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#duration SsmMaintenanceWindow#duration}. This parameter is required.
         * @return {@code this}
         */
        public Builder duration(java.lang.Number duration) {
            this.duration = duration;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#name SsmMaintenanceWindow#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getSchedule}
         * @param schedule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#schedule SsmMaintenanceWindow#schedule}. This parameter is required.
         * @return {@code this}
         */
        public Builder schedule(java.lang.String schedule) {
            this.schedule = schedule;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getAllowUnassociatedTargets}
         * @param allowUnassociatedTargets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#allow_unassociated_targets SsmMaintenanceWindow#allow_unassociated_targets}.
         * @return {@code this}
         */
        public Builder allowUnassociatedTargets(java.lang.Boolean allowUnassociatedTargets) {
            this.allowUnassociatedTargets = allowUnassociatedTargets;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getAllowUnassociatedTargets}
         * @param allowUnassociatedTargets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#allow_unassociated_targets SsmMaintenanceWindow#allow_unassociated_targets}.
         * @return {@code this}
         */
        public Builder allowUnassociatedTargets(com.hashicorp.cdktf.IResolvable allowUnassociatedTargets) {
            this.allowUnassociatedTargets = allowUnassociatedTargets;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#description SsmMaintenanceWindow#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#enabled SsmMaintenanceWindow#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#enabled SsmMaintenanceWindow#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getEndDate}
         * @param endDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#end_date SsmMaintenanceWindow#end_date}.
         * @return {@code this}
         */
        public Builder endDate(java.lang.String endDate) {
            this.endDate = endDate;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#id SsmMaintenanceWindow#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getScheduleOffset}
         * @param scheduleOffset Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#schedule_offset SsmMaintenanceWindow#schedule_offset}.
         * @return {@code this}
         */
        public Builder scheduleOffset(java.lang.Number scheduleOffset) {
            this.scheduleOffset = scheduleOffset;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getScheduleTimezone}
         * @param scheduleTimezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#schedule_timezone SsmMaintenanceWindow#schedule_timezone}.
         * @return {@code this}
         */
        public Builder scheduleTimezone(java.lang.String scheduleTimezone) {
            this.scheduleTimezone = scheduleTimezone;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getStartDate}
         * @param startDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#start_date SsmMaintenanceWindow#start_date}.
         * @return {@code this}
         */
        public Builder startDate(java.lang.String startDate) {
            this.startDate = startDate;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#tags SsmMaintenanceWindow#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window#tags_all SsmMaintenanceWindow#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmMaintenanceWindowConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmMaintenanceWindowConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmMaintenanceWindowConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmMaintenanceWindowConfig {
        private final java.lang.Number cutoff;
        private final java.lang.Number duration;
        private final java.lang.String name;
        private final java.lang.String schedule;
        private final java.lang.Object allowUnassociatedTargets;
        private final java.lang.String description;
        private final java.lang.Object enabled;
        private final java.lang.String endDate;
        private final java.lang.String id;
        private final java.lang.Number scheduleOffset;
        private final java.lang.String scheduleTimezone;
        private final java.lang.String startDate;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cutoff = software.amazon.jsii.Kernel.get(this, "cutoff", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.duration = software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schedule = software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allowUnassociatedTargets = software.amazon.jsii.Kernel.get(this, "allowUnassociatedTargets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.endDate = software.amazon.jsii.Kernel.get(this, "endDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scheduleOffset = software.amazon.jsii.Kernel.get(this, "scheduleOffset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scheduleTimezone = software.amazon.jsii.Kernel.get(this, "scheduleTimezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startDate = software.amazon.jsii.Kernel.get(this, "startDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cutoff = java.util.Objects.requireNonNull(builder.cutoff, "cutoff is required");
            this.duration = java.util.Objects.requireNonNull(builder.duration, "duration is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.schedule = java.util.Objects.requireNonNull(builder.schedule, "schedule is required");
            this.allowUnassociatedTargets = builder.allowUnassociatedTargets;
            this.description = builder.description;
            this.enabled = builder.enabled;
            this.endDate = builder.endDate;
            this.id = builder.id;
            this.scheduleOffset = builder.scheduleOffset;
            this.scheduleTimezone = builder.scheduleTimezone;
            this.startDate = builder.startDate;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getCutoff() {
            return this.cutoff;
        }

        @Override
        public final java.lang.Number getDuration() {
            return this.duration;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getSchedule() {
            return this.schedule;
        }

        @Override
        public final java.lang.Object getAllowUnassociatedTargets() {
            return this.allowUnassociatedTargets;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getEndDate() {
            return this.endDate;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getScheduleOffset() {
            return this.scheduleOffset;
        }

        @Override
        public final java.lang.String getScheduleTimezone() {
            return this.scheduleTimezone;
        }

        @Override
        public final java.lang.String getStartDate() {
            return this.startDate;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cutoff", om.valueToTree(this.getCutoff()));
            data.set("duration", om.valueToTree(this.getDuration()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("schedule", om.valueToTree(this.getSchedule()));
            if (this.getAllowUnassociatedTargets() != null) {
                data.set("allowUnassociatedTargets", om.valueToTree(this.getAllowUnassociatedTargets()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getEndDate() != null) {
                data.set("endDate", om.valueToTree(this.getEndDate()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getScheduleOffset() != null) {
                data.set("scheduleOffset", om.valueToTree(this.getScheduleOffset()));
            }
            if (this.getScheduleTimezone() != null) {
                data.set("scheduleTimezone", om.valueToTree(this.getScheduleTimezone()));
            }
            if (this.getStartDate() != null) {
                data.set("startDate", om.valueToTree(this.getStartDate()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmMaintenanceWindow.SsmMaintenanceWindowConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmMaintenanceWindowConfig.Jsii$Proxy that = (SsmMaintenanceWindowConfig.Jsii$Proxy) o;

            if (!cutoff.equals(that.cutoff)) return false;
            if (!duration.equals(that.duration)) return false;
            if (!name.equals(that.name)) return false;
            if (!schedule.equals(that.schedule)) return false;
            if (this.allowUnassociatedTargets != null ? !this.allowUnassociatedTargets.equals(that.allowUnassociatedTargets) : that.allowUnassociatedTargets != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.endDate != null ? !this.endDate.equals(that.endDate) : that.endDate != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.scheduleOffset != null ? !this.scheduleOffset.equals(that.scheduleOffset) : that.scheduleOffset != null) return false;
            if (this.scheduleTimezone != null ? !this.scheduleTimezone.equals(that.scheduleTimezone) : that.scheduleTimezone != null) return false;
            if (this.startDate != null ? !this.startDate.equals(that.startDate) : that.startDate != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cutoff.hashCode();
            result = 31 * result + (this.duration.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.schedule.hashCode());
            result = 31 * result + (this.allowUnassociatedTargets != null ? this.allowUnassociatedTargets.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.endDate != null ? this.endDate.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.scheduleOffset != null ? this.scheduleOffset.hashCode() : 0);
            result = 31 * result + (this.scheduleTimezone != null ? this.scheduleTimezone.hashCode() : 0);
            result = 31 * result + (this.startDate != null ? this.startDate.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
