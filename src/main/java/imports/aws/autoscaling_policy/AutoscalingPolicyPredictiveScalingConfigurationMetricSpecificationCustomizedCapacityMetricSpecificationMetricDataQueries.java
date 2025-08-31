package imports.aws.autoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.101Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries")
@software.amazon.jsii.Jsii.Proxy(AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries.Jsii$Proxy.class)
public interface AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#id AutoscalingPolicy#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#expression AutoscalingPolicy#expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#label AutoscalingPolicy#label}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLabel() {
        return null;
    }

    /**
     * metric_stat block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_stat AutoscalingPolicy#metric_stat}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueriesMetricStat getMetricStat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#return_data AutoscalingPolicy#return_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReturnData() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries> {
        java.lang.String id;
        java.lang.String expression;
        java.lang.String label;
        imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueriesMetricStat metricStat;
        java.lang.Object returnData;

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#id AutoscalingPolicy#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries#getExpression}
         * @param expression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#expression AutoscalingPolicy#expression}.
         * @return {@code this}
         */
        public Builder expression(java.lang.String expression) {
            this.expression = expression;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries#getLabel}
         * @param label Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#label AutoscalingPolicy#label}.
         * @return {@code this}
         */
        public Builder label(java.lang.String label) {
            this.label = label;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries#getMetricStat}
         * @param metricStat metric_stat block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_stat AutoscalingPolicy#metric_stat}
         * @return {@code this}
         */
        public Builder metricStat(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueriesMetricStat metricStat) {
            this.metricStat = metricStat;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries#getReturnData}
         * @param returnData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#return_data AutoscalingPolicy#return_data}.
         * @return {@code this}
         */
        public Builder returnData(java.lang.Boolean returnData) {
            this.returnData = returnData;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries#getReturnData}
         * @param returnData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#return_data AutoscalingPolicy#return_data}.
         * @return {@code this}
         */
        public Builder returnData(com.hashicorp.cdktf.IResolvable returnData) {
            this.returnData = returnData;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries {
        private final java.lang.String id;
        private final java.lang.String expression;
        private final java.lang.String label;
        private final imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueriesMetricStat metricStat;
        private final java.lang.Object returnData;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.expression = software.amazon.jsii.Kernel.get(this, "expression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.label = software.amazon.jsii.Kernel.get(this, "label", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metricStat = software.amazon.jsii.Kernel.get(this, "metricStat", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueriesMetricStat.class));
            this.returnData = software.amazon.jsii.Kernel.get(this, "returnData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.expression = builder.expression;
            this.label = builder.label;
            this.metricStat = builder.metricStat;
            this.returnData = builder.returnData;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getExpression() {
            return this.expression;
        }

        @Override
        public final java.lang.String getLabel() {
            return this.label;
        }

        @Override
        public final imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueriesMetricStat getMetricStat() {
            return this.metricStat;
        }

        @Override
        public final java.lang.Object getReturnData() {
            return this.returnData;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            if (this.getExpression() != null) {
                data.set("expression", om.valueToTree(this.getExpression()));
            }
            if (this.getLabel() != null) {
                data.set("label", om.valueToTree(this.getLabel()));
            }
            if (this.getMetricStat() != null) {
                data.set("metricStat", om.valueToTree(this.getMetricStat()));
            }
            if (this.getReturnData() != null) {
                data.set("returnData", om.valueToTree(this.getReturnData()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingPolicy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries.Jsii$Proxy that = (AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationCustomizedCapacityMetricSpecificationMetricDataQueries.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            if (this.expression != null ? !this.expression.equals(that.expression) : that.expression != null) return false;
            if (this.label != null ? !this.label.equals(that.label) : that.label != null) return false;
            if (this.metricStat != null ? !this.metricStat.equals(that.metricStat) : that.metricStat != null) return false;
            return this.returnData != null ? this.returnData.equals(that.returnData) : that.returnData == null;
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.expression != null ? this.expression.hashCode() : 0);
            result = 31 * result + (this.label != null ? this.label.hashCode() : 0);
            result = 31 * result + (this.metricStat != null ? this.metricStat.hashCode() : 0);
            result = 31 * result + (this.returnData != null ? this.returnData.hashCode() : 0);
            return result;
        }
    }
}
