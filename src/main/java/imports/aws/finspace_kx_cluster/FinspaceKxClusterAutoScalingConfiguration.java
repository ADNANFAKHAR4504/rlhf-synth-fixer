package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterAutoScalingConfiguration")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxClusterAutoScalingConfiguration.Jsii$Proxy.class)
public interface FinspaceKxClusterAutoScalingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_metric FinspaceKxCluster#auto_scaling_metric}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAutoScalingMetric();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#max_node_count FinspaceKxCluster#max_node_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxNodeCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#metric_target FinspaceKxCluster#metric_target}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMetricTarget();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#min_node_count FinspaceKxCluster#min_node_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinNodeCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scale_in_cooldown_seconds FinspaceKxCluster#scale_in_cooldown_seconds}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getScaleInCooldownSeconds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scale_out_cooldown_seconds FinspaceKxCluster#scale_out_cooldown_seconds}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getScaleOutCooldownSeconds();

    /**
     * @return a {@link Builder} of {@link FinspaceKxClusterAutoScalingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxClusterAutoScalingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxClusterAutoScalingConfiguration> {
        java.lang.String autoScalingMetric;
        java.lang.Number maxNodeCount;
        java.lang.Number metricTarget;
        java.lang.Number minNodeCount;
        java.lang.Number scaleInCooldownSeconds;
        java.lang.Number scaleOutCooldownSeconds;

        /**
         * Sets the value of {@link FinspaceKxClusterAutoScalingConfiguration#getAutoScalingMetric}
         * @param autoScalingMetric Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_metric FinspaceKxCluster#auto_scaling_metric}. This parameter is required.
         * @return {@code this}
         */
        public Builder autoScalingMetric(java.lang.String autoScalingMetric) {
            this.autoScalingMetric = autoScalingMetric;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterAutoScalingConfiguration#getMaxNodeCount}
         * @param maxNodeCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#max_node_count FinspaceKxCluster#max_node_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxNodeCount(java.lang.Number maxNodeCount) {
            this.maxNodeCount = maxNodeCount;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterAutoScalingConfiguration#getMetricTarget}
         * @param metricTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#metric_target FinspaceKxCluster#metric_target}. This parameter is required.
         * @return {@code this}
         */
        public Builder metricTarget(java.lang.Number metricTarget) {
            this.metricTarget = metricTarget;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterAutoScalingConfiguration#getMinNodeCount}
         * @param minNodeCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#min_node_count FinspaceKxCluster#min_node_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder minNodeCount(java.lang.Number minNodeCount) {
            this.minNodeCount = minNodeCount;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterAutoScalingConfiguration#getScaleInCooldownSeconds}
         * @param scaleInCooldownSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scale_in_cooldown_seconds FinspaceKxCluster#scale_in_cooldown_seconds}. This parameter is required.
         * @return {@code this}
         */
        public Builder scaleInCooldownSeconds(java.lang.Number scaleInCooldownSeconds) {
            this.scaleInCooldownSeconds = scaleInCooldownSeconds;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterAutoScalingConfiguration#getScaleOutCooldownSeconds}
         * @param scaleOutCooldownSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scale_out_cooldown_seconds FinspaceKxCluster#scale_out_cooldown_seconds}. This parameter is required.
         * @return {@code this}
         */
        public Builder scaleOutCooldownSeconds(java.lang.Number scaleOutCooldownSeconds) {
            this.scaleOutCooldownSeconds = scaleOutCooldownSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxClusterAutoScalingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxClusterAutoScalingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxClusterAutoScalingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxClusterAutoScalingConfiguration {
        private final java.lang.String autoScalingMetric;
        private final java.lang.Number maxNodeCount;
        private final java.lang.Number metricTarget;
        private final java.lang.Number minNodeCount;
        private final java.lang.Number scaleInCooldownSeconds;
        private final java.lang.Number scaleOutCooldownSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoScalingMetric = software.amazon.jsii.Kernel.get(this, "autoScalingMetric", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxNodeCount = software.amazon.jsii.Kernel.get(this, "maxNodeCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.metricTarget = software.amazon.jsii.Kernel.get(this, "metricTarget", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minNodeCount = software.amazon.jsii.Kernel.get(this, "minNodeCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scaleInCooldownSeconds = software.amazon.jsii.Kernel.get(this, "scaleInCooldownSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scaleOutCooldownSeconds = software.amazon.jsii.Kernel.get(this, "scaleOutCooldownSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoScalingMetric = java.util.Objects.requireNonNull(builder.autoScalingMetric, "autoScalingMetric is required");
            this.maxNodeCount = java.util.Objects.requireNonNull(builder.maxNodeCount, "maxNodeCount is required");
            this.metricTarget = java.util.Objects.requireNonNull(builder.metricTarget, "metricTarget is required");
            this.minNodeCount = java.util.Objects.requireNonNull(builder.minNodeCount, "minNodeCount is required");
            this.scaleInCooldownSeconds = java.util.Objects.requireNonNull(builder.scaleInCooldownSeconds, "scaleInCooldownSeconds is required");
            this.scaleOutCooldownSeconds = java.util.Objects.requireNonNull(builder.scaleOutCooldownSeconds, "scaleOutCooldownSeconds is required");
        }

        @Override
        public final java.lang.String getAutoScalingMetric() {
            return this.autoScalingMetric;
        }

        @Override
        public final java.lang.Number getMaxNodeCount() {
            return this.maxNodeCount;
        }

        @Override
        public final java.lang.Number getMetricTarget() {
            return this.metricTarget;
        }

        @Override
        public final java.lang.Number getMinNodeCount() {
            return this.minNodeCount;
        }

        @Override
        public final java.lang.Number getScaleInCooldownSeconds() {
            return this.scaleInCooldownSeconds;
        }

        @Override
        public final java.lang.Number getScaleOutCooldownSeconds() {
            return this.scaleOutCooldownSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("autoScalingMetric", om.valueToTree(this.getAutoScalingMetric()));
            data.set("maxNodeCount", om.valueToTree(this.getMaxNodeCount()));
            data.set("metricTarget", om.valueToTree(this.getMetricTarget()));
            data.set("minNodeCount", om.valueToTree(this.getMinNodeCount()));
            data.set("scaleInCooldownSeconds", om.valueToTree(this.getScaleInCooldownSeconds()));
            data.set("scaleOutCooldownSeconds", om.valueToTree(this.getScaleOutCooldownSeconds()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxCluster.FinspaceKxClusterAutoScalingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxClusterAutoScalingConfiguration.Jsii$Proxy that = (FinspaceKxClusterAutoScalingConfiguration.Jsii$Proxy) o;

            if (!autoScalingMetric.equals(that.autoScalingMetric)) return false;
            if (!maxNodeCount.equals(that.maxNodeCount)) return false;
            if (!metricTarget.equals(that.metricTarget)) return false;
            if (!minNodeCount.equals(that.minNodeCount)) return false;
            if (!scaleInCooldownSeconds.equals(that.scaleInCooldownSeconds)) return false;
            return this.scaleOutCooldownSeconds.equals(that.scaleOutCooldownSeconds);
        }

        @Override
        public final int hashCode() {
            int result = this.autoScalingMetric.hashCode();
            result = 31 * result + (this.maxNodeCount.hashCode());
            result = 31 * result + (this.metricTarget.hashCode());
            result = 31 * result + (this.minNodeCount.hashCode());
            result = 31 * result + (this.scaleInCooldownSeconds.hashCode());
            result = 31 * result + (this.scaleOutCooldownSeconds.hashCode());
            return result;
        }
    }
}
