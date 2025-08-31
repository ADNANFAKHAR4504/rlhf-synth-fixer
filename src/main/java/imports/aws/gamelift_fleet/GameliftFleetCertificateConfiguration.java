package imports.aws.gamelift_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.264Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftFleet.GameliftFleetCertificateConfiguration")
@software.amazon.jsii.Jsii.Proxy(GameliftFleetCertificateConfiguration.Jsii$Proxy.class)
public interface GameliftFleetCertificateConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#certificate_type GameliftFleet#certificate_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GameliftFleetCertificateConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GameliftFleetCertificateConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GameliftFleetCertificateConfiguration> {
        java.lang.String certificateType;

        /**
         * Sets the value of {@link GameliftFleetCertificateConfiguration#getCertificateType}
         * @param certificateType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#certificate_type GameliftFleet#certificate_type}.
         * @return {@code this}
         */
        public Builder certificateType(java.lang.String certificateType) {
            this.certificateType = certificateType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GameliftFleetCertificateConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GameliftFleetCertificateConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GameliftFleetCertificateConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GameliftFleetCertificateConfiguration {
        private final java.lang.String certificateType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.certificateType = software.amazon.jsii.Kernel.get(this, "certificateType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.certificateType = builder.certificateType;
        }

        @Override
        public final java.lang.String getCertificateType() {
            return this.certificateType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCertificateType() != null) {
                data.set("certificateType", om.valueToTree(this.getCertificateType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.gameliftFleet.GameliftFleetCertificateConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GameliftFleetCertificateConfiguration.Jsii$Proxy that = (GameliftFleetCertificateConfiguration.Jsii$Proxy) o;

            return this.certificateType != null ? this.certificateType.equals(that.certificateType) : that.certificateType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.certificateType != null ? this.certificateType.hashCode() : 0;
            return result;
        }
    }
}
