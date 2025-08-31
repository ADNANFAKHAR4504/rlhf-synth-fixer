package imports.aws.internetmonitor_monitor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.internetmonitorMonitor.InternetmonitorMonitorConfig")
@software.amazon.jsii.Jsii.Proxy(InternetmonitorMonitorConfig.Jsii$Proxy.class)
public interface InternetmonitorMonitorConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#monitor_name InternetmonitorMonitor#monitor_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMonitorName();

    /**
     * health_events_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#health_events_config InternetmonitorMonitor#health_events_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig getHealthEventsConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#id InternetmonitorMonitor#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * internet_measurements_log_delivery block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#internet_measurements_log_delivery InternetmonitorMonitor#internet_measurements_log_delivery}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery getInternetMeasurementsLogDelivery() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#max_city_networks_to_monitor InternetmonitorMonitor#max_city_networks_to_monitor}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxCityNetworksToMonitor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#resources InternetmonitorMonitor#resources}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResources() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#status InternetmonitorMonitor#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags InternetmonitorMonitor#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags_all InternetmonitorMonitor#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#traffic_percentage_to_monitor InternetmonitorMonitor#traffic_percentage_to_monitor}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTrafficPercentageToMonitor() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link InternetmonitorMonitorConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link InternetmonitorMonitorConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<InternetmonitorMonitorConfig> {
        java.lang.String monitorName;
        imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig healthEventsConfig;
        java.lang.String id;
        imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery internetMeasurementsLogDelivery;
        java.lang.Number maxCityNetworksToMonitor;
        java.util.List<java.lang.String> resources;
        java.lang.String status;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Number trafficPercentageToMonitor;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getMonitorName}
         * @param monitorName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#monitor_name InternetmonitorMonitor#monitor_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder monitorName(java.lang.String monitorName) {
            this.monitorName = monitorName;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getHealthEventsConfig}
         * @param healthEventsConfig health_events_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#health_events_config InternetmonitorMonitor#health_events_config}
         * @return {@code this}
         */
        public Builder healthEventsConfig(imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig healthEventsConfig) {
            this.healthEventsConfig = healthEventsConfig;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#id InternetmonitorMonitor#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getInternetMeasurementsLogDelivery}
         * @param internetMeasurementsLogDelivery internet_measurements_log_delivery block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#internet_measurements_log_delivery InternetmonitorMonitor#internet_measurements_log_delivery}
         * @return {@code this}
         */
        public Builder internetMeasurementsLogDelivery(imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery internetMeasurementsLogDelivery) {
            this.internetMeasurementsLogDelivery = internetMeasurementsLogDelivery;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getMaxCityNetworksToMonitor}
         * @param maxCityNetworksToMonitor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#max_city_networks_to_monitor InternetmonitorMonitor#max_city_networks_to_monitor}.
         * @return {@code this}
         */
        public Builder maxCityNetworksToMonitor(java.lang.Number maxCityNetworksToMonitor) {
            this.maxCityNetworksToMonitor = maxCityNetworksToMonitor;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getResources}
         * @param resources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#resources InternetmonitorMonitor#resources}.
         * @return {@code this}
         */
        public Builder resources(java.util.List<java.lang.String> resources) {
            this.resources = resources;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#status InternetmonitorMonitor#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags InternetmonitorMonitor#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags_all InternetmonitorMonitor#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getTrafficPercentageToMonitor}
         * @param trafficPercentageToMonitor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#traffic_percentage_to_monitor InternetmonitorMonitor#traffic_percentage_to_monitor}.
         * @return {@code this}
         */
        public Builder trafficPercentageToMonitor(java.lang.Number trafficPercentageToMonitor) {
            this.trafficPercentageToMonitor = trafficPercentageToMonitor;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getDependsOn}
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
         * Sets the value of {@link InternetmonitorMonitorConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorConfig#getProvisioners}
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
         * @return a new instance of {@link InternetmonitorMonitorConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public InternetmonitorMonitorConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link InternetmonitorMonitorConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements InternetmonitorMonitorConfig {
        private final java.lang.String monitorName;
        private final imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig healthEventsConfig;
        private final java.lang.String id;
        private final imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery internetMeasurementsLogDelivery;
        private final java.lang.Number maxCityNetworksToMonitor;
        private final java.util.List<java.lang.String> resources;
        private final java.lang.String status;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Number trafficPercentageToMonitor;
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
            this.monitorName = software.amazon.jsii.Kernel.get(this, "monitorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.healthEventsConfig = software.amazon.jsii.Kernel.get(this, "healthEventsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.internetMeasurementsLogDelivery = software.amazon.jsii.Kernel.get(this, "internetMeasurementsLogDelivery", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery.class));
            this.maxCityNetworksToMonitor = software.amazon.jsii.Kernel.get(this, "maxCityNetworksToMonitor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.resources = software.amazon.jsii.Kernel.get(this, "resources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.trafficPercentageToMonitor = software.amazon.jsii.Kernel.get(this, "trafficPercentageToMonitor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.monitorName = java.util.Objects.requireNonNull(builder.monitorName, "monitorName is required");
            this.healthEventsConfig = builder.healthEventsConfig;
            this.id = builder.id;
            this.internetMeasurementsLogDelivery = builder.internetMeasurementsLogDelivery;
            this.maxCityNetworksToMonitor = builder.maxCityNetworksToMonitor;
            this.resources = builder.resources;
            this.status = builder.status;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.trafficPercentageToMonitor = builder.trafficPercentageToMonitor;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getMonitorName() {
            return this.monitorName;
        }

        @Override
        public final imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig getHealthEventsConfig() {
            return this.healthEventsConfig;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery getInternetMeasurementsLogDelivery() {
            return this.internetMeasurementsLogDelivery;
        }

        @Override
        public final java.lang.Number getMaxCityNetworksToMonitor() {
            return this.maxCityNetworksToMonitor;
        }

        @Override
        public final java.util.List<java.lang.String> getResources() {
            return this.resources;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
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
        public final java.lang.Number getTrafficPercentageToMonitor() {
            return this.trafficPercentageToMonitor;
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

            data.set("monitorName", om.valueToTree(this.getMonitorName()));
            if (this.getHealthEventsConfig() != null) {
                data.set("healthEventsConfig", om.valueToTree(this.getHealthEventsConfig()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInternetMeasurementsLogDelivery() != null) {
                data.set("internetMeasurementsLogDelivery", om.valueToTree(this.getInternetMeasurementsLogDelivery()));
            }
            if (this.getMaxCityNetworksToMonitor() != null) {
                data.set("maxCityNetworksToMonitor", om.valueToTree(this.getMaxCityNetworksToMonitor()));
            }
            if (this.getResources() != null) {
                data.set("resources", om.valueToTree(this.getResources()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTrafficPercentageToMonitor() != null) {
                data.set("trafficPercentageToMonitor", om.valueToTree(this.getTrafficPercentageToMonitor()));
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
            struct.set("fqn", om.valueToTree("aws.internetmonitorMonitor.InternetmonitorMonitorConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            InternetmonitorMonitorConfig.Jsii$Proxy that = (InternetmonitorMonitorConfig.Jsii$Proxy) o;

            if (!monitorName.equals(that.monitorName)) return false;
            if (this.healthEventsConfig != null ? !this.healthEventsConfig.equals(that.healthEventsConfig) : that.healthEventsConfig != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.internetMeasurementsLogDelivery != null ? !this.internetMeasurementsLogDelivery.equals(that.internetMeasurementsLogDelivery) : that.internetMeasurementsLogDelivery != null) return false;
            if (this.maxCityNetworksToMonitor != null ? !this.maxCityNetworksToMonitor.equals(that.maxCityNetworksToMonitor) : that.maxCityNetworksToMonitor != null) return false;
            if (this.resources != null ? !this.resources.equals(that.resources) : that.resources != null) return false;
            if (this.status != null ? !this.status.equals(that.status) : that.status != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.trafficPercentageToMonitor != null ? !this.trafficPercentageToMonitor.equals(that.trafficPercentageToMonitor) : that.trafficPercentageToMonitor != null) return false;
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
            int result = this.monitorName.hashCode();
            result = 31 * result + (this.healthEventsConfig != null ? this.healthEventsConfig.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.internetMeasurementsLogDelivery != null ? this.internetMeasurementsLogDelivery.hashCode() : 0);
            result = 31 * result + (this.maxCityNetworksToMonitor != null ? this.maxCityNetworksToMonitor.hashCode() : 0);
            result = 31 * result + (this.resources != null ? this.resources.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.trafficPercentageToMonitor != null ? this.trafficPercentageToMonitor.hashCode() : 0);
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
