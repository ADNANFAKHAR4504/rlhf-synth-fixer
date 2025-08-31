package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetailsScheduleCreateRule.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetailsScheduleCreateRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cron_expression DlmLifecyclePolicy#cron_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCronExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#interval DlmLifecyclePolicy#interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#interval_unit DlmLifecyclePolicy#interval_unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIntervalUnit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#location DlmLifecyclePolicy#location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#times DlmLifecyclePolicy#times}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTimes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetailsScheduleCreateRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetailsScheduleCreateRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetailsScheduleCreateRule> {
        java.lang.String cronExpression;
        java.lang.Number interval;
        java.lang.String intervalUnit;
        java.lang.String location;
        java.util.List<java.lang.String> times;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCreateRule#getCronExpression}
         * @param cronExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cron_expression DlmLifecyclePolicy#cron_expression}.
         * @return {@code this}
         */
        public Builder cronExpression(java.lang.String cronExpression) {
            this.cronExpression = cronExpression;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCreateRule#getInterval}
         * @param interval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#interval DlmLifecyclePolicy#interval}.
         * @return {@code this}
         */
        public Builder interval(java.lang.Number interval) {
            this.interval = interval;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCreateRule#getIntervalUnit}
         * @param intervalUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#interval_unit DlmLifecyclePolicy#interval_unit}.
         * @return {@code this}
         */
        public Builder intervalUnit(java.lang.String intervalUnit) {
            this.intervalUnit = intervalUnit;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCreateRule#getLocation}
         * @param location Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#location DlmLifecyclePolicy#location}.
         * @return {@code this}
         */
        public Builder location(java.lang.String location) {
            this.location = location;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCreateRule#getTimes}
         * @param times Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#times DlmLifecyclePolicy#times}.
         * @return {@code this}
         */
        public Builder times(java.util.List<java.lang.String> times) {
            this.times = times;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetailsScheduleCreateRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetailsScheduleCreateRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetailsScheduleCreateRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetailsScheduleCreateRule {
        private final java.lang.String cronExpression;
        private final java.lang.Number interval;
        private final java.lang.String intervalUnit;
        private final java.lang.String location;
        private final java.util.List<java.lang.String> times;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cronExpression = software.amazon.jsii.Kernel.get(this, "cronExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.interval = software.amazon.jsii.Kernel.get(this, "interval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.intervalUnit = software.amazon.jsii.Kernel.get(this, "intervalUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.location = software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.times = software.amazon.jsii.Kernel.get(this, "times", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cronExpression = builder.cronExpression;
            this.interval = builder.interval;
            this.intervalUnit = builder.intervalUnit;
            this.location = builder.location;
            this.times = builder.times;
        }

        @Override
        public final java.lang.String getCronExpression() {
            return this.cronExpression;
        }

        @Override
        public final java.lang.Number getInterval() {
            return this.interval;
        }

        @Override
        public final java.lang.String getIntervalUnit() {
            return this.intervalUnit;
        }

        @Override
        public final java.lang.String getLocation() {
            return this.location;
        }

        @Override
        public final java.util.List<java.lang.String> getTimes() {
            return this.times;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCronExpression() != null) {
                data.set("cronExpression", om.valueToTree(this.getCronExpression()));
            }
            if (this.getInterval() != null) {
                data.set("interval", om.valueToTree(this.getInterval()));
            }
            if (this.getIntervalUnit() != null) {
                data.set("intervalUnit", om.valueToTree(this.getIntervalUnit()));
            }
            if (this.getLocation() != null) {
                data.set("location", om.valueToTree(this.getLocation()));
            }
            if (this.getTimes() != null) {
                data.set("times", om.valueToTree(this.getTimes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetailsScheduleCreateRule.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetailsScheduleCreateRule.Jsii$Proxy) o;

            if (this.cronExpression != null ? !this.cronExpression.equals(that.cronExpression) : that.cronExpression != null) return false;
            if (this.interval != null ? !this.interval.equals(that.interval) : that.interval != null) return false;
            if (this.intervalUnit != null ? !this.intervalUnit.equals(that.intervalUnit) : that.intervalUnit != null) return false;
            if (this.location != null ? !this.location.equals(that.location) : that.location != null) return false;
            return this.times != null ? this.times.equals(that.times) : that.times == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cronExpression != null ? this.cronExpression.hashCode() : 0;
            result = 31 * result + (this.interval != null ? this.interval.hashCode() : 0);
            result = 31 * result + (this.intervalUnit != null ? this.intervalUnit.hashCode() : 0);
            result = 31 * result + (this.location != null ? this.location.hashCode() : 0);
            result = 31 * result + (this.times != null ? this.times.hashCode() : 0);
            return result;
        }
    }
}
