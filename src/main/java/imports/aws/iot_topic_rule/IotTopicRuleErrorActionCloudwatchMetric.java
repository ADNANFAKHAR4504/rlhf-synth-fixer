package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.415Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleErrorActionCloudwatchMetric")
@software.amazon.jsii.Jsii.Proxy(IotTopicRuleErrorActionCloudwatchMetric.Jsii$Proxy.class)
public interface IotTopicRuleErrorActionCloudwatchMetric extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#metric_name IotTopicRule#metric_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMetricName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#metric_namespace IotTopicRule#metric_namespace}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMetricNamespace();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#metric_unit IotTopicRule#metric_unit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMetricUnit();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#metric_value IotTopicRule#metric_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMetricValue();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#metric_timestamp IotTopicRule#metric_timestamp}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetricTimestamp() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotTopicRuleErrorActionCloudwatchMetric}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotTopicRuleErrorActionCloudwatchMetric}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotTopicRuleErrorActionCloudwatchMetric> {
        java.lang.String metricName;
        java.lang.String metricNamespace;
        java.lang.String metricUnit;
        java.lang.String metricValue;
        java.lang.String roleArn;
        java.lang.String metricTimestamp;

        /**
         * Sets the value of {@link IotTopicRuleErrorActionCloudwatchMetric#getMetricName}
         * @param metricName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#metric_name IotTopicRule#metric_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder metricName(java.lang.String metricName) {
            this.metricName = metricName;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionCloudwatchMetric#getMetricNamespace}
         * @param metricNamespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#metric_namespace IotTopicRule#metric_namespace}. This parameter is required.
         * @return {@code this}
         */
        public Builder metricNamespace(java.lang.String metricNamespace) {
            this.metricNamespace = metricNamespace;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionCloudwatchMetric#getMetricUnit}
         * @param metricUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#metric_unit IotTopicRule#metric_unit}. This parameter is required.
         * @return {@code this}
         */
        public Builder metricUnit(java.lang.String metricUnit) {
            this.metricUnit = metricUnit;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionCloudwatchMetric#getMetricValue}
         * @param metricValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#metric_value IotTopicRule#metric_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder metricValue(java.lang.String metricValue) {
            this.metricValue = metricValue;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionCloudwatchMetric#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionCloudwatchMetric#getMetricTimestamp}
         * @param metricTimestamp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#metric_timestamp IotTopicRule#metric_timestamp}.
         * @return {@code this}
         */
        public Builder metricTimestamp(java.lang.String metricTimestamp) {
            this.metricTimestamp = metricTimestamp;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotTopicRuleErrorActionCloudwatchMetric}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotTopicRuleErrorActionCloudwatchMetric build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotTopicRuleErrorActionCloudwatchMetric}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotTopicRuleErrorActionCloudwatchMetric {
        private final java.lang.String metricName;
        private final java.lang.String metricNamespace;
        private final java.lang.String metricUnit;
        private final java.lang.String metricValue;
        private final java.lang.String roleArn;
        private final java.lang.String metricTimestamp;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metricName = software.amazon.jsii.Kernel.get(this, "metricName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metricNamespace = software.amazon.jsii.Kernel.get(this, "metricNamespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metricUnit = software.amazon.jsii.Kernel.get(this, "metricUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metricValue = software.amazon.jsii.Kernel.get(this, "metricValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metricTimestamp = software.amazon.jsii.Kernel.get(this, "metricTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metricName = java.util.Objects.requireNonNull(builder.metricName, "metricName is required");
            this.metricNamespace = java.util.Objects.requireNonNull(builder.metricNamespace, "metricNamespace is required");
            this.metricUnit = java.util.Objects.requireNonNull(builder.metricUnit, "metricUnit is required");
            this.metricValue = java.util.Objects.requireNonNull(builder.metricValue, "metricValue is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.metricTimestamp = builder.metricTimestamp;
        }

        @Override
        public final java.lang.String getMetricName() {
            return this.metricName;
        }

        @Override
        public final java.lang.String getMetricNamespace() {
            return this.metricNamespace;
        }

        @Override
        public final java.lang.String getMetricUnit() {
            return this.metricUnit;
        }

        @Override
        public final java.lang.String getMetricValue() {
            return this.metricValue;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getMetricTimestamp() {
            return this.metricTimestamp;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("metricName", om.valueToTree(this.getMetricName()));
            data.set("metricNamespace", om.valueToTree(this.getMetricNamespace()));
            data.set("metricUnit", om.valueToTree(this.getMetricUnit()));
            data.set("metricValue", om.valueToTree(this.getMetricValue()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getMetricTimestamp() != null) {
                data.set("metricTimestamp", om.valueToTree(this.getMetricTimestamp()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotTopicRule.IotTopicRuleErrorActionCloudwatchMetric"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotTopicRuleErrorActionCloudwatchMetric.Jsii$Proxy that = (IotTopicRuleErrorActionCloudwatchMetric.Jsii$Proxy) o;

            if (!metricName.equals(that.metricName)) return false;
            if (!metricNamespace.equals(that.metricNamespace)) return false;
            if (!metricUnit.equals(that.metricUnit)) return false;
            if (!metricValue.equals(that.metricValue)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            return this.metricTimestamp != null ? this.metricTimestamp.equals(that.metricTimestamp) : that.metricTimestamp == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metricName.hashCode();
            result = 31 * result + (this.metricNamespace.hashCode());
            result = 31 * result + (this.metricUnit.hashCode());
            result = 31 * result + (this.metricValue.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.metricTimestamp != null ? this.metricTimestamp.hashCode() : 0);
            return result;
        }
    }
}
