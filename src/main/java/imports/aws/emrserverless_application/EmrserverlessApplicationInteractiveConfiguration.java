package imports.aws.emrserverless_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrserverlessApplication.EmrserverlessApplicationInteractiveConfiguration")
@software.amazon.jsii.Jsii.Proxy(EmrserverlessApplicationInteractiveConfiguration.Jsii$Proxy.class)
public interface EmrserverlessApplicationInteractiveConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#livy_endpoint_enabled EmrserverlessApplication#livy_endpoint_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLivyEndpointEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#studio_enabled EmrserverlessApplication#studio_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStudioEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrserverlessApplicationInteractiveConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrserverlessApplicationInteractiveConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrserverlessApplicationInteractiveConfiguration> {
        java.lang.Object livyEndpointEnabled;
        java.lang.Object studioEnabled;

        /**
         * Sets the value of {@link EmrserverlessApplicationInteractiveConfiguration#getLivyEndpointEnabled}
         * @param livyEndpointEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#livy_endpoint_enabled EmrserverlessApplication#livy_endpoint_enabled}.
         * @return {@code this}
         */
        public Builder livyEndpointEnabled(java.lang.Boolean livyEndpointEnabled) {
            this.livyEndpointEnabled = livyEndpointEnabled;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationInteractiveConfiguration#getLivyEndpointEnabled}
         * @param livyEndpointEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#livy_endpoint_enabled EmrserverlessApplication#livy_endpoint_enabled}.
         * @return {@code this}
         */
        public Builder livyEndpointEnabled(com.hashicorp.cdktf.IResolvable livyEndpointEnabled) {
            this.livyEndpointEnabled = livyEndpointEnabled;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationInteractiveConfiguration#getStudioEnabled}
         * @param studioEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#studio_enabled EmrserverlessApplication#studio_enabled}.
         * @return {@code this}
         */
        public Builder studioEnabled(java.lang.Boolean studioEnabled) {
            this.studioEnabled = studioEnabled;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationInteractiveConfiguration#getStudioEnabled}
         * @param studioEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#studio_enabled EmrserverlessApplication#studio_enabled}.
         * @return {@code this}
         */
        public Builder studioEnabled(com.hashicorp.cdktf.IResolvable studioEnabled) {
            this.studioEnabled = studioEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrserverlessApplicationInteractiveConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrserverlessApplicationInteractiveConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrserverlessApplicationInteractiveConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrserverlessApplicationInteractiveConfiguration {
        private final java.lang.Object livyEndpointEnabled;
        private final java.lang.Object studioEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.livyEndpointEnabled = software.amazon.jsii.Kernel.get(this, "livyEndpointEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.studioEnabled = software.amazon.jsii.Kernel.get(this, "studioEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.livyEndpointEnabled = builder.livyEndpointEnabled;
            this.studioEnabled = builder.studioEnabled;
        }

        @Override
        public final java.lang.Object getLivyEndpointEnabled() {
            return this.livyEndpointEnabled;
        }

        @Override
        public final java.lang.Object getStudioEnabled() {
            return this.studioEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLivyEndpointEnabled() != null) {
                data.set("livyEndpointEnabled", om.valueToTree(this.getLivyEndpointEnabled()));
            }
            if (this.getStudioEnabled() != null) {
                data.set("studioEnabled", om.valueToTree(this.getStudioEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrserverlessApplication.EmrserverlessApplicationInteractiveConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrserverlessApplicationInteractiveConfiguration.Jsii$Proxy that = (EmrserverlessApplicationInteractiveConfiguration.Jsii$Proxy) o;

            if (this.livyEndpointEnabled != null ? !this.livyEndpointEnabled.equals(that.livyEndpointEnabled) : that.livyEndpointEnabled != null) return false;
            return this.studioEnabled != null ? this.studioEnabled.equals(that.studioEnabled) : that.studioEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.livyEndpointEnabled != null ? this.livyEndpointEnabled.hashCode() : 0;
            result = 31 * result + (this.studioEnabled != null ? this.studioEnabled.hashCode() : 0);
            return result;
        }
    }
}
