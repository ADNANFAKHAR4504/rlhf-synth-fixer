package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupInstanceMaintenancePolicy")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupInstanceMaintenancePolicy.Jsii$Proxy.class)
public interface AutoscalingGroupInstanceMaintenancePolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_healthy_percentage AutoscalingGroup#max_healthy_percentage}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxHealthyPercentage();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_healthy_percentage AutoscalingGroup#min_healthy_percentage}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinHealthyPercentage();

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupInstanceMaintenancePolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupInstanceMaintenancePolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupInstanceMaintenancePolicy> {
        java.lang.Number maxHealthyPercentage;
        java.lang.Number minHealthyPercentage;

        /**
         * Sets the value of {@link AutoscalingGroupInstanceMaintenancePolicy#getMaxHealthyPercentage}
         * @param maxHealthyPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_healthy_percentage AutoscalingGroup#max_healthy_percentage}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxHealthyPercentage(java.lang.Number maxHealthyPercentage) {
            this.maxHealthyPercentage = maxHealthyPercentage;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceMaintenancePolicy#getMinHealthyPercentage}
         * @param minHealthyPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_healthy_percentage AutoscalingGroup#min_healthy_percentage}. This parameter is required.
         * @return {@code this}
         */
        public Builder minHealthyPercentage(java.lang.Number minHealthyPercentage) {
            this.minHealthyPercentage = minHealthyPercentage;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupInstanceMaintenancePolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupInstanceMaintenancePolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupInstanceMaintenancePolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupInstanceMaintenancePolicy {
        private final java.lang.Number maxHealthyPercentage;
        private final java.lang.Number minHealthyPercentage;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxHealthyPercentage = software.amazon.jsii.Kernel.get(this, "maxHealthyPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minHealthyPercentage = software.amazon.jsii.Kernel.get(this, "minHealthyPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxHealthyPercentage = java.util.Objects.requireNonNull(builder.maxHealthyPercentage, "maxHealthyPercentage is required");
            this.minHealthyPercentage = java.util.Objects.requireNonNull(builder.minHealthyPercentage, "minHealthyPercentage is required");
        }

        @Override
        public final java.lang.Number getMaxHealthyPercentage() {
            return this.maxHealthyPercentage;
        }

        @Override
        public final java.lang.Number getMinHealthyPercentage() {
            return this.minHealthyPercentage;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxHealthyPercentage", om.valueToTree(this.getMaxHealthyPercentage()));
            data.set("minHealthyPercentage", om.valueToTree(this.getMinHealthyPercentage()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupInstanceMaintenancePolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupInstanceMaintenancePolicy.Jsii$Proxy that = (AutoscalingGroupInstanceMaintenancePolicy.Jsii$Proxy) o;

            if (!maxHealthyPercentage.equals(that.maxHealthyPercentage)) return false;
            return this.minHealthyPercentage.equals(that.minHealthyPercentage);
        }

        @Override
        public final int hashCode() {
            int result = this.maxHealthyPercentage.hashCode();
            result = 31 * result + (this.minHealthyPercentage.hashCode());
            return result;
        }
    }
}
