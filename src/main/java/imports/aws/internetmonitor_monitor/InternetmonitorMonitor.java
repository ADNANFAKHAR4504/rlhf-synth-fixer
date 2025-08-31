package imports.aws.internetmonitor_monitor;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor aws_internetmonitor_monitor}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.internetmonitorMonitor.InternetmonitorMonitor")
public class InternetmonitorMonitor extends com.hashicorp.cdktf.TerraformResource {

    protected InternetmonitorMonitor(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected InternetmonitorMonitor(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.internetmonitor_monitor.InternetmonitorMonitor.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor aws_internetmonitor_monitor} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public InternetmonitorMonitor(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.internetmonitor_monitor.InternetmonitorMonitorConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a InternetmonitorMonitor resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the InternetmonitorMonitor to import. This parameter is required.
     * @param importFromId The id of the existing InternetmonitorMonitor that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the InternetmonitorMonitor to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.internetmonitor_monitor.InternetmonitorMonitor.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a InternetmonitorMonitor resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the InternetmonitorMonitor to import. This parameter is required.
     * @param importFromId The id of the existing InternetmonitorMonitor that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.internetmonitor_monitor.InternetmonitorMonitor.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putHealthEventsConfig(final @org.jetbrains.annotations.NotNull imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig value) {
        software.amazon.jsii.Kernel.call(this, "putHealthEventsConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInternetMeasurementsLogDelivery(final @org.jetbrains.annotations.NotNull imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery value) {
        software.amazon.jsii.Kernel.call(this, "putInternetMeasurementsLogDelivery", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHealthEventsConfig() {
        software.amazon.jsii.Kernel.call(this, "resetHealthEventsConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInternetMeasurementsLogDelivery() {
        software.amazon.jsii.Kernel.call(this, "resetInternetMeasurementsLogDelivery", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxCityNetworksToMonitor() {
        software.amazon.jsii.Kernel.call(this, "resetMaxCityNetworksToMonitor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResources() {
        software.amazon.jsii.Kernel.call(this, "resetResources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatus() {
        software.amazon.jsii.Kernel.call(this, "resetStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrafficPercentageToMonitor() {
        software.amazon.jsii.Kernel.call(this, "resetTrafficPercentageToMonitor", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfigOutputReference getHealthEventsConfig() {
        return software.amazon.jsii.Kernel.get(this, "healthEventsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference getInternetMeasurementsLogDelivery() {
        return software.amazon.jsii.Kernel.get(this, "internetMeasurementsLogDelivery", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig getHealthEventsConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "healthEventsConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery getInternetMeasurementsLogDeliveryInput() {
        return software.amazon.jsii.Kernel.get(this, "internetMeasurementsLogDeliveryInput", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxCityNetworksToMonitorInput() {
        return software.amazon.jsii.Kernel.get(this, "maxCityNetworksToMonitorInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMonitorNameInput() {
        return software.amazon.jsii.Kernel.get(this, "monitorNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourcesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "resourcesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTrafficPercentageToMonitorInput() {
        return software.amazon.jsii.Kernel.get(this, "trafficPercentageToMonitorInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxCityNetworksToMonitor() {
        return software.amazon.jsii.Kernel.get(this, "maxCityNetworksToMonitor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxCityNetworksToMonitor(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxCityNetworksToMonitor", java.util.Objects.requireNonNull(value, "maxCityNetworksToMonitor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMonitorName() {
        return software.amazon.jsii.Kernel.get(this, "monitorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMonitorName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "monitorName", java.util.Objects.requireNonNull(value, "monitorName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getResources() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "resources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResources(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "resources", java.util.Objects.requireNonNull(value, "resources is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTrafficPercentageToMonitor() {
        return software.amazon.jsii.Kernel.get(this, "trafficPercentageToMonitor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTrafficPercentageToMonitor(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "trafficPercentageToMonitor", java.util.Objects.requireNonNull(value, "trafficPercentageToMonitor is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.internetmonitor_monitor.InternetmonitorMonitor}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.internetmonitor_monitor.InternetmonitorMonitor> {
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
        private final imports.aws.internetmonitor_monitor.InternetmonitorMonitorConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.internetmonitor_monitor.InternetmonitorMonitorConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#monitor_name InternetmonitorMonitor#monitor_name}.
         * <p>
         * @return {@code this}
         * @param monitorName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#monitor_name InternetmonitorMonitor#monitor_name}. This parameter is required.
         */
        public Builder monitorName(final java.lang.String monitorName) {
            this.config.monitorName(monitorName);
            return this;
        }

        /**
         * health_events_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#health_events_config InternetmonitorMonitor#health_events_config}
         * <p>
         * @return {@code this}
         * @param healthEventsConfig health_events_config block. This parameter is required.
         */
        public Builder healthEventsConfig(final imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig healthEventsConfig) {
            this.config.healthEventsConfig(healthEventsConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#id InternetmonitorMonitor#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#id InternetmonitorMonitor#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * internet_measurements_log_delivery block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#internet_measurements_log_delivery InternetmonitorMonitor#internet_measurements_log_delivery}
         * <p>
         * @return {@code this}
         * @param internetMeasurementsLogDelivery internet_measurements_log_delivery block. This parameter is required.
         */
        public Builder internetMeasurementsLogDelivery(final imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery internetMeasurementsLogDelivery) {
            this.config.internetMeasurementsLogDelivery(internetMeasurementsLogDelivery);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#max_city_networks_to_monitor InternetmonitorMonitor#max_city_networks_to_monitor}.
         * <p>
         * @return {@code this}
         * @param maxCityNetworksToMonitor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#max_city_networks_to_monitor InternetmonitorMonitor#max_city_networks_to_monitor}. This parameter is required.
         */
        public Builder maxCityNetworksToMonitor(final java.lang.Number maxCityNetworksToMonitor) {
            this.config.maxCityNetworksToMonitor(maxCityNetworksToMonitor);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#resources InternetmonitorMonitor#resources}.
         * <p>
         * @return {@code this}
         * @param resources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#resources InternetmonitorMonitor#resources}. This parameter is required.
         */
        public Builder resources(final java.util.List<java.lang.String> resources) {
            this.config.resources(resources);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#status InternetmonitorMonitor#status}.
         * <p>
         * @return {@code this}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#status InternetmonitorMonitor#status}. This parameter is required.
         */
        public Builder status(final java.lang.String status) {
            this.config.status(status);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags InternetmonitorMonitor#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags InternetmonitorMonitor#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags_all InternetmonitorMonitor#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags_all InternetmonitorMonitor#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#traffic_percentage_to_monitor InternetmonitorMonitor#traffic_percentage_to_monitor}.
         * <p>
         * @return {@code this}
         * @param trafficPercentageToMonitor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#traffic_percentage_to_monitor InternetmonitorMonitor#traffic_percentage_to_monitor}. This parameter is required.
         */
        public Builder trafficPercentageToMonitor(final java.lang.Number trafficPercentageToMonitor) {
            this.config.trafficPercentageToMonitor(trafficPercentageToMonitor);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.internetmonitor_monitor.InternetmonitorMonitor}.
         */
        @Override
        public imports.aws.internetmonitor_monitor.InternetmonitorMonitor build() {
            return new imports.aws.internetmonitor_monitor.InternetmonitorMonitor(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
