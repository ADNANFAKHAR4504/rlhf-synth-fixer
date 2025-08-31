package imports.aws.ses_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.441Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesConfigurationSet.SesConfigurationSetConfig")
@software.amazon.jsii.Jsii.Proxy(SesConfigurationSetConfig.Jsii$Proxy.class)
public interface SesConfigurationSetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#name SesConfigurationSet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * delivery_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#delivery_options SesConfigurationSet#delivery_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions getDeliveryOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#id SesConfigurationSet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#reputation_metrics_enabled SesConfigurationSet#reputation_metrics_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReputationMetricsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#sending_enabled SesConfigurationSet#sending_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSendingEnabled() {
        return null;
    }

    /**
     * tracking_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#tracking_options SesConfigurationSet#tracking_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions getTrackingOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SesConfigurationSetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SesConfigurationSetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SesConfigurationSetConfig> {
        java.lang.String name;
        imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions deliveryOptions;
        java.lang.String id;
        java.lang.Object reputationMetricsEnabled;
        java.lang.Object sendingEnabled;
        imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions trackingOptions;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#name SesConfigurationSet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getDeliveryOptions}
         * @param deliveryOptions delivery_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#delivery_options SesConfigurationSet#delivery_options}
         * @return {@code this}
         */
        public Builder deliveryOptions(imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions deliveryOptions) {
            this.deliveryOptions = deliveryOptions;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#id SesConfigurationSet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getReputationMetricsEnabled}
         * @param reputationMetricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#reputation_metrics_enabled SesConfigurationSet#reputation_metrics_enabled}.
         * @return {@code this}
         */
        public Builder reputationMetricsEnabled(java.lang.Boolean reputationMetricsEnabled) {
            this.reputationMetricsEnabled = reputationMetricsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getReputationMetricsEnabled}
         * @param reputationMetricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#reputation_metrics_enabled SesConfigurationSet#reputation_metrics_enabled}.
         * @return {@code this}
         */
        public Builder reputationMetricsEnabled(com.hashicorp.cdktf.IResolvable reputationMetricsEnabled) {
            this.reputationMetricsEnabled = reputationMetricsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getSendingEnabled}
         * @param sendingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#sending_enabled SesConfigurationSet#sending_enabled}.
         * @return {@code this}
         */
        public Builder sendingEnabled(java.lang.Boolean sendingEnabled) {
            this.sendingEnabled = sendingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getSendingEnabled}
         * @param sendingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#sending_enabled SesConfigurationSet#sending_enabled}.
         * @return {@code this}
         */
        public Builder sendingEnabled(com.hashicorp.cdktf.IResolvable sendingEnabled) {
            this.sendingEnabled = sendingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getTrackingOptions}
         * @param trackingOptions tracking_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#tracking_options SesConfigurationSet#tracking_options}
         * @return {@code this}
         */
        public Builder trackingOptions(imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions trackingOptions) {
            this.trackingOptions = trackingOptions;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getDependsOn}
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
         * Sets the value of {@link SesConfigurationSetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SesConfigurationSetConfig#getProvisioners}
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
         * @return a new instance of {@link SesConfigurationSetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SesConfigurationSetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SesConfigurationSetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SesConfigurationSetConfig {
        private final java.lang.String name;
        private final imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions deliveryOptions;
        private final java.lang.String id;
        private final java.lang.Object reputationMetricsEnabled;
        private final java.lang.Object sendingEnabled;
        private final imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions trackingOptions;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deliveryOptions = software.amazon.jsii.Kernel.get(this, "deliveryOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.reputationMetricsEnabled = software.amazon.jsii.Kernel.get(this, "reputationMetricsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sendingEnabled = software.amazon.jsii.Kernel.get(this, "sendingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.trackingOptions = software.amazon.jsii.Kernel.get(this, "trackingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.deliveryOptions = builder.deliveryOptions;
            this.id = builder.id;
            this.reputationMetricsEnabled = builder.reputationMetricsEnabled;
            this.sendingEnabled = builder.sendingEnabled;
            this.trackingOptions = builder.trackingOptions;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions getDeliveryOptions() {
            return this.deliveryOptions;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getReputationMetricsEnabled() {
            return this.reputationMetricsEnabled;
        }

        @Override
        public final java.lang.Object getSendingEnabled() {
            return this.sendingEnabled;
        }

        @Override
        public final imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions getTrackingOptions() {
            return this.trackingOptions;
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

            data.set("name", om.valueToTree(this.getName()));
            if (this.getDeliveryOptions() != null) {
                data.set("deliveryOptions", om.valueToTree(this.getDeliveryOptions()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getReputationMetricsEnabled() != null) {
                data.set("reputationMetricsEnabled", om.valueToTree(this.getReputationMetricsEnabled()));
            }
            if (this.getSendingEnabled() != null) {
                data.set("sendingEnabled", om.valueToTree(this.getSendingEnabled()));
            }
            if (this.getTrackingOptions() != null) {
                data.set("trackingOptions", om.valueToTree(this.getTrackingOptions()));
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
            struct.set("fqn", om.valueToTree("aws.sesConfigurationSet.SesConfigurationSetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SesConfigurationSetConfig.Jsii$Proxy that = (SesConfigurationSetConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.deliveryOptions != null ? !this.deliveryOptions.equals(that.deliveryOptions) : that.deliveryOptions != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.reputationMetricsEnabled != null ? !this.reputationMetricsEnabled.equals(that.reputationMetricsEnabled) : that.reputationMetricsEnabled != null) return false;
            if (this.sendingEnabled != null ? !this.sendingEnabled.equals(that.sendingEnabled) : that.sendingEnabled != null) return false;
            if (this.trackingOptions != null ? !this.trackingOptions.equals(that.trackingOptions) : that.trackingOptions != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.deliveryOptions != null ? this.deliveryOptions.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.reputationMetricsEnabled != null ? this.reputationMetricsEnabled.hashCode() : 0);
            result = 31 * result + (this.sendingEnabled != null ? this.sendingEnabled.hashCode() : 0);
            result = 31 * result + (this.trackingOptions != null ? this.trackingOptions.hashCode() : 0);
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
