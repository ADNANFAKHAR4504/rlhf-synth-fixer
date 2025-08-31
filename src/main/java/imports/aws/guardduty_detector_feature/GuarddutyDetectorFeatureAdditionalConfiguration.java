package imports.aws.guardduty_detector_feature;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.316Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyDetectorFeature.GuarddutyDetectorFeatureAdditionalConfiguration")
@software.amazon.jsii.Jsii.Proxy(GuarddutyDetectorFeatureAdditionalConfiguration.Jsii$Proxy.class)
public interface GuarddutyDetectorFeatureAdditionalConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_detector_feature#name GuarddutyDetectorFeature#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_detector_feature#status GuarddutyDetectorFeature#status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatus();

    /**
     * @return a {@link Builder} of {@link GuarddutyDetectorFeatureAdditionalConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GuarddutyDetectorFeatureAdditionalConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GuarddutyDetectorFeatureAdditionalConfiguration> {
        java.lang.String name;
        java.lang.String status;

        /**
         * Sets the value of {@link GuarddutyDetectorFeatureAdditionalConfiguration#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_detector_feature#name GuarddutyDetectorFeature#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyDetectorFeatureAdditionalConfiguration#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_detector_feature#status GuarddutyDetectorFeature#status}. This parameter is required.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GuarddutyDetectorFeatureAdditionalConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GuarddutyDetectorFeatureAdditionalConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GuarddutyDetectorFeatureAdditionalConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GuarddutyDetectorFeatureAdditionalConfiguration {
        private final java.lang.String name;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.status = java.util.Objects.requireNonNull(builder.status, "status is required");
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("status", om.valueToTree(this.getStatus()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.guarddutyDetectorFeature.GuarddutyDetectorFeatureAdditionalConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GuarddutyDetectorFeatureAdditionalConfiguration.Jsii$Proxy that = (GuarddutyDetectorFeatureAdditionalConfiguration.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            return this.status.equals(that.status);
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.status.hashCode());
            return result;
        }
    }
}
