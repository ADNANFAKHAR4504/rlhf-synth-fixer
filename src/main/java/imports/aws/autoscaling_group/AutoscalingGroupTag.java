package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.098Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupTag")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupTag.Jsii$Proxy.class)
public interface AutoscalingGroupTag extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#key AutoscalingGroup#key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#propagate_at_launch AutoscalingGroup#propagate_at_launch}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getPropagateAtLaunch();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#value AutoscalingGroup#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupTag}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupTag}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupTag> {
        java.lang.String key;
        java.lang.Object propagateAtLaunch;
        java.lang.String value;

        /**
         * Sets the value of {@link AutoscalingGroupTag#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#key AutoscalingGroup#key}. This parameter is required.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupTag#getPropagateAtLaunch}
         * @param propagateAtLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#propagate_at_launch AutoscalingGroup#propagate_at_launch}. This parameter is required.
         * @return {@code this}
         */
        public Builder propagateAtLaunch(java.lang.Boolean propagateAtLaunch) {
            this.propagateAtLaunch = propagateAtLaunch;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupTag#getPropagateAtLaunch}
         * @param propagateAtLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#propagate_at_launch AutoscalingGroup#propagate_at_launch}. This parameter is required.
         * @return {@code this}
         */
        public Builder propagateAtLaunch(com.hashicorp.cdktf.IResolvable propagateAtLaunch) {
            this.propagateAtLaunch = propagateAtLaunch;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupTag#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#value AutoscalingGroup#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupTag}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupTag build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupTag}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupTag {
        private final java.lang.String key;
        private final java.lang.Object propagateAtLaunch;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.propagateAtLaunch = software.amazon.jsii.Kernel.get(this, "propagateAtLaunch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.key = java.util.Objects.requireNonNull(builder.key, "key is required");
            this.propagateAtLaunch = java.util.Objects.requireNonNull(builder.propagateAtLaunch, "propagateAtLaunch is required");
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        public final java.lang.Object getPropagateAtLaunch() {
            return this.propagateAtLaunch;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("key", om.valueToTree(this.getKey()));
            data.set("propagateAtLaunch", om.valueToTree(this.getPropagateAtLaunch()));
            data.set("value", om.valueToTree(this.getValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupTag"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupTag.Jsii$Proxy that = (AutoscalingGroupTag.Jsii$Proxy) o;

            if (!key.equals(that.key)) return false;
            if (!propagateAtLaunch.equals(that.propagateAtLaunch)) return false;
            return this.value.equals(that.value);
        }

        @Override
        public final int hashCode() {
            int result = this.key.hashCode();
            result = 31 * result + (this.propagateAtLaunch.hashCode());
            result = 31 * result + (this.value.hashCode());
            return result;
        }
    }
}
