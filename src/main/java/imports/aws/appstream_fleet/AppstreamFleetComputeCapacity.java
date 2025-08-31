package imports.aws.appstream_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.059Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamFleet.AppstreamFleetComputeCapacity")
@software.amazon.jsii.Jsii.Proxy(AppstreamFleetComputeCapacity.Jsii$Proxy.class)
public interface AppstreamFleetComputeCapacity extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#desired_instances AppstreamFleet#desired_instances}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDesiredInstances() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#desired_sessions AppstreamFleet#desired_sessions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDesiredSessions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppstreamFleetComputeCapacity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamFleetComputeCapacity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamFleetComputeCapacity> {
        java.lang.Number desiredInstances;
        java.lang.Number desiredSessions;

        /**
         * Sets the value of {@link AppstreamFleetComputeCapacity#getDesiredInstances}
         * @param desiredInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#desired_instances AppstreamFleet#desired_instances}.
         * @return {@code this}
         */
        public Builder desiredInstances(java.lang.Number desiredInstances) {
            this.desiredInstances = desiredInstances;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetComputeCapacity#getDesiredSessions}
         * @param desiredSessions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#desired_sessions AppstreamFleet#desired_sessions}.
         * @return {@code this}
         */
        public Builder desiredSessions(java.lang.Number desiredSessions) {
            this.desiredSessions = desiredSessions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppstreamFleetComputeCapacity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamFleetComputeCapacity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamFleetComputeCapacity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamFleetComputeCapacity {
        private final java.lang.Number desiredInstances;
        private final java.lang.Number desiredSessions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.desiredInstances = software.amazon.jsii.Kernel.get(this, "desiredInstances", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.desiredSessions = software.amazon.jsii.Kernel.get(this, "desiredSessions", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.desiredInstances = builder.desiredInstances;
            this.desiredSessions = builder.desiredSessions;
        }

        @Override
        public final java.lang.Number getDesiredInstances() {
            return this.desiredInstances;
        }

        @Override
        public final java.lang.Number getDesiredSessions() {
            return this.desiredSessions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDesiredInstances() != null) {
                data.set("desiredInstances", om.valueToTree(this.getDesiredInstances()));
            }
            if (this.getDesiredSessions() != null) {
                data.set("desiredSessions", om.valueToTree(this.getDesiredSessions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appstreamFleet.AppstreamFleetComputeCapacity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamFleetComputeCapacity.Jsii$Proxy that = (AppstreamFleetComputeCapacity.Jsii$Proxy) o;

            if (this.desiredInstances != null ? !this.desiredInstances.equals(that.desiredInstances) : that.desiredInstances != null) return false;
            return this.desiredSessions != null ? this.desiredSessions.equals(that.desiredSessions) : that.desiredSessions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.desiredInstances != null ? this.desiredInstances.hashCode() : 0;
            result = 31 * result + (this.desiredSessions != null ? this.desiredSessions.hashCode() : 0);
            return result;
        }
    }
}
