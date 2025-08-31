package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#availability_zones DlmLifecyclePolicy#availability_zones}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAvailabilityZones();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#count DlmLifecyclePolicy#count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCount() {
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
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule> {
        java.util.List<java.lang.String> availabilityZones;
        java.lang.Number count;
        java.lang.Number interval;
        java.lang.String intervalUnit;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule#getAvailabilityZones}
         * @param availabilityZones Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#availability_zones DlmLifecyclePolicy#availability_zones}. This parameter is required.
         * @return {@code this}
         */
        public Builder availabilityZones(java.util.List<java.lang.String> availabilityZones) {
            this.availabilityZones = availabilityZones;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule#getCount}
         * @param count Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#count DlmLifecyclePolicy#count}.
         * @return {@code this}
         */
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule#getInterval}
         * @param interval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#interval DlmLifecyclePolicy#interval}.
         * @return {@code this}
         */
        public Builder interval(java.lang.Number interval) {
            this.interval = interval;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule#getIntervalUnit}
         * @param intervalUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#interval_unit DlmLifecyclePolicy#interval_unit}.
         * @return {@code this}
         */
        public Builder intervalUnit(java.lang.String intervalUnit) {
            this.intervalUnit = intervalUnit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule {
        private final java.util.List<java.lang.String> availabilityZones;
        private final java.lang.Number count;
        private final java.lang.Number interval;
        private final java.lang.String intervalUnit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.availabilityZones = software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.interval = software.amazon.jsii.Kernel.get(this, "interval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.intervalUnit = software.amazon.jsii.Kernel.get(this, "intervalUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.availabilityZones = java.util.Objects.requireNonNull(builder.availabilityZones, "availabilityZones is required");
            this.count = builder.count;
            this.interval = builder.interval;
            this.intervalUnit = builder.intervalUnit;
        }

        @Override
        public final java.util.List<java.lang.String> getAvailabilityZones() {
            return this.availabilityZones;
        }

        @Override
        public final java.lang.Number getCount() {
            return this.count;
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
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("availabilityZones", om.valueToTree(this.getAvailabilityZones()));
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getInterval() != null) {
                data.set("interval", om.valueToTree(this.getInterval()));
            }
            if (this.getIntervalUnit() != null) {
                data.set("intervalUnit", om.valueToTree(this.getIntervalUnit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule.Jsii$Proxy) o;

            if (!availabilityZones.equals(that.availabilityZones)) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.interval != null ? !this.interval.equals(that.interval) : that.interval != null) return false;
            return this.intervalUnit != null ? this.intervalUnit.equals(that.intervalUnit) : that.intervalUnit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.availabilityZones.hashCode();
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.interval != null ? this.interval.hashCode() : 0);
            result = 31 * result + (this.intervalUnit != null ? this.intervalUnit.hashCode() : 0);
            return result;
        }
    }
}
