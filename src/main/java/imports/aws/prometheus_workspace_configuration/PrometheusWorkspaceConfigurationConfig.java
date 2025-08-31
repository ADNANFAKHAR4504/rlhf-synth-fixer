package imports.aws.prometheus_workspace_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.prometheusWorkspaceConfiguration.PrometheusWorkspaceConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(PrometheusWorkspaceConfigurationConfig.Jsii$Proxy.class)
public interface PrometheusWorkspaceConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#workspace_id PrometheusWorkspaceConfiguration#workspace_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWorkspaceId();

    /**
     * limits_per_label_set block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#limits_per_label_set PrometheusWorkspaceConfiguration#limits_per_label_set}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLimitsPerLabelSet() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#retention_period_in_days PrometheusWorkspaceConfiguration#retention_period_in_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetentionPeriodInDays() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#timeouts PrometheusWorkspaceConfiguration#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PrometheusWorkspaceConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PrometheusWorkspaceConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PrometheusWorkspaceConfigurationConfig> {
        java.lang.String workspaceId;
        java.lang.Object limitsPerLabelSet;
        java.lang.Number retentionPeriodInDays;
        imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getWorkspaceId}
         * @param workspaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#workspace_id PrometheusWorkspaceConfiguration#workspace_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder workspaceId(java.lang.String workspaceId) {
            this.workspaceId = workspaceId;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getLimitsPerLabelSet}
         * @param limitsPerLabelSet limits_per_label_set block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#limits_per_label_set PrometheusWorkspaceConfiguration#limits_per_label_set}
         * @return {@code this}
         */
        public Builder limitsPerLabelSet(com.hashicorp.cdktf.IResolvable limitsPerLabelSet) {
            this.limitsPerLabelSet = limitsPerLabelSet;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getLimitsPerLabelSet}
         * @param limitsPerLabelSet limits_per_label_set block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#limits_per_label_set PrometheusWorkspaceConfiguration#limits_per_label_set}
         * @return {@code this}
         */
        public Builder limitsPerLabelSet(java.util.List<? extends imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationLimitsPerLabelSet> limitsPerLabelSet) {
            this.limitsPerLabelSet = limitsPerLabelSet;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getRetentionPeriodInDays}
         * @param retentionPeriodInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#retention_period_in_days PrometheusWorkspaceConfiguration#retention_period_in_days}.
         * @return {@code this}
         */
        public Builder retentionPeriodInDays(java.lang.Number retentionPeriodInDays) {
            this.retentionPeriodInDays = retentionPeriodInDays;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#timeouts PrometheusWorkspaceConfiguration#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getDependsOn}
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
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationConfig#getProvisioners}
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
         * @return a new instance of {@link PrometheusWorkspaceConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PrometheusWorkspaceConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PrometheusWorkspaceConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PrometheusWorkspaceConfigurationConfig {
        private final java.lang.String workspaceId;
        private final java.lang.Object limitsPerLabelSet;
        private final java.lang.Number retentionPeriodInDays;
        private final imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationTimeouts timeouts;
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
            this.workspaceId = software.amazon.jsii.Kernel.get(this, "workspaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.limitsPerLabelSet = software.amazon.jsii.Kernel.get(this, "limitsPerLabelSet", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.retentionPeriodInDays = software.amazon.jsii.Kernel.get(this, "retentionPeriodInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationTimeouts.class));
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
            this.workspaceId = java.util.Objects.requireNonNull(builder.workspaceId, "workspaceId is required");
            this.limitsPerLabelSet = builder.limitsPerLabelSet;
            this.retentionPeriodInDays = builder.retentionPeriodInDays;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getWorkspaceId() {
            return this.workspaceId;
        }

        @Override
        public final java.lang.Object getLimitsPerLabelSet() {
            return this.limitsPerLabelSet;
        }

        @Override
        public final java.lang.Number getRetentionPeriodInDays() {
            return this.retentionPeriodInDays;
        }

        @Override
        public final imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("workspaceId", om.valueToTree(this.getWorkspaceId()));
            if (this.getLimitsPerLabelSet() != null) {
                data.set("limitsPerLabelSet", om.valueToTree(this.getLimitsPerLabelSet()));
            }
            if (this.getRetentionPeriodInDays() != null) {
                data.set("retentionPeriodInDays", om.valueToTree(this.getRetentionPeriodInDays()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.prometheusWorkspaceConfiguration.PrometheusWorkspaceConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PrometheusWorkspaceConfigurationConfig.Jsii$Proxy that = (PrometheusWorkspaceConfigurationConfig.Jsii$Proxy) o;

            if (!workspaceId.equals(that.workspaceId)) return false;
            if (this.limitsPerLabelSet != null ? !this.limitsPerLabelSet.equals(that.limitsPerLabelSet) : that.limitsPerLabelSet != null) return false;
            if (this.retentionPeriodInDays != null ? !this.retentionPeriodInDays.equals(that.retentionPeriodInDays) : that.retentionPeriodInDays != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.workspaceId.hashCode();
            result = 31 * result + (this.limitsPerLabelSet != null ? this.limitsPerLabelSet.hashCode() : 0);
            result = 31 * result + (this.retentionPeriodInDays != null ? this.retentionPeriodInDays.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
