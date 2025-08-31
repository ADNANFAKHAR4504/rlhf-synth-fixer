package imports.aws.cloudwatch_metric_alarm;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.289Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchMetricAlarm.CloudwatchMetricAlarmMetricQuery")
@software.amazon.jsii.Jsii.Proxy(CloudwatchMetricAlarmMetricQuery.Jsii$Proxy.class)
public interface CloudwatchMetricAlarmMetricQuery extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#id CloudwatchMetricAlarm#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#account_id CloudwatchMetricAlarm#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#expression CloudwatchMetricAlarm#expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#label CloudwatchMetricAlarm#label}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLabel() {
        return null;
    }

    /**
     * metric block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#metric CloudwatchMetricAlarm#metric}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetric getMetric() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#period CloudwatchMetricAlarm#period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#return_data CloudwatchMetricAlarm#return_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReturnData() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchMetricAlarmMetricQuery}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchMetricAlarmMetricQuery}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchMetricAlarmMetricQuery> {
        java.lang.String id;
        java.lang.String accountId;
        java.lang.String expression;
        java.lang.String label;
        imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetric metric;
        java.lang.Number period;
        java.lang.Object returnData;

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQuery#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#id CloudwatchMetricAlarm#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQuery#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#account_id CloudwatchMetricAlarm#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQuery#getExpression}
         * @param expression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#expression CloudwatchMetricAlarm#expression}.
         * @return {@code this}
         */
        public Builder expression(java.lang.String expression) {
            this.expression = expression;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQuery#getLabel}
         * @param label Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#label CloudwatchMetricAlarm#label}.
         * @return {@code this}
         */
        public Builder label(java.lang.String label) {
            this.label = label;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQuery#getMetric}
         * @param metric metric block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#metric CloudwatchMetricAlarm#metric}
         * @return {@code this}
         */
        public Builder metric(imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetric metric) {
            this.metric = metric;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQuery#getPeriod}
         * @param period Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#period CloudwatchMetricAlarm#period}.
         * @return {@code this}
         */
        public Builder period(java.lang.Number period) {
            this.period = period;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQuery#getReturnData}
         * @param returnData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#return_data CloudwatchMetricAlarm#return_data}.
         * @return {@code this}
         */
        public Builder returnData(java.lang.Boolean returnData) {
            this.returnData = returnData;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQuery#getReturnData}
         * @param returnData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#return_data CloudwatchMetricAlarm#return_data}.
         * @return {@code this}
         */
        public Builder returnData(com.hashicorp.cdktf.IResolvable returnData) {
            this.returnData = returnData;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchMetricAlarmMetricQuery}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchMetricAlarmMetricQuery build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchMetricAlarmMetricQuery}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchMetricAlarmMetricQuery {
        private final java.lang.String id;
        private final java.lang.String accountId;
        private final java.lang.String expression;
        private final java.lang.String label;
        private final imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetric metric;
        private final java.lang.Number period;
        private final java.lang.Object returnData;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.expression = software.amazon.jsii.Kernel.get(this, "expression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.label = software.amazon.jsii.Kernel.get(this, "label", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metric = software.amazon.jsii.Kernel.get(this, "metric", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetric.class));
            this.period = software.amazon.jsii.Kernel.get(this, "period", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.returnData = software.amazon.jsii.Kernel.get(this, "returnData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.accountId = builder.accountId;
            this.expression = builder.expression;
            this.label = builder.label;
            this.metric = builder.metric;
            this.period = builder.period;
            this.returnData = builder.returnData;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
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
        public final imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetric getMetric() {
            return this.metric;
        }

        @Override
        public final java.lang.Number getPeriod() {
            return this.period;
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
            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getExpression() != null) {
                data.set("expression", om.valueToTree(this.getExpression()));
            }
            if (this.getLabel() != null) {
                data.set("label", om.valueToTree(this.getLabel()));
            }
            if (this.getMetric() != null) {
                data.set("metric", om.valueToTree(this.getMetric()));
            }
            if (this.getPeriod() != null) {
                data.set("period", om.valueToTree(this.getPeriod()));
            }
            if (this.getReturnData() != null) {
                data.set("returnData", om.valueToTree(this.getReturnData()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchMetricAlarm.CloudwatchMetricAlarmMetricQuery"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchMetricAlarmMetricQuery.Jsii$Proxy that = (CloudwatchMetricAlarmMetricQuery.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            if (this.expression != null ? !this.expression.equals(that.expression) : that.expression != null) return false;
            if (this.label != null ? !this.label.equals(that.label) : that.label != null) return false;
            if (this.metric != null ? !this.metric.equals(that.metric) : that.metric != null) return false;
            if (this.period != null ? !this.period.equals(that.period) : that.period != null) return false;
            return this.returnData != null ? this.returnData.equals(that.returnData) : that.returnData == null;
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.accountId != null ? this.accountId.hashCode() : 0);
            result = 31 * result + (this.expression != null ? this.expression.hashCode() : 0);
            result = 31 * result + (this.label != null ? this.label.hashCode() : 0);
            result = 31 * result + (this.metric != null ? this.metric.hashCode() : 0);
            result = 31 * result + (this.period != null ? this.period.hashCode() : 0);
            result = 31 * result + (this.returnData != null ? this.returnData.hashCode() : 0);
            return result;
        }
    }
}
