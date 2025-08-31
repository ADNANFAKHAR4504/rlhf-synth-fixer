package imports.aws.ecr_repository;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.121Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrRepository.EcrRepositoryTimeouts")
@software.amazon.jsii.Jsii.Proxy(EcrRepositoryTimeouts.Jsii$Proxy.class)
public interface EcrRepositoryTimeouts extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository#delete EcrRepository#delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDelete() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcrRepositoryTimeouts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcrRepositoryTimeouts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcrRepositoryTimeouts> {
        java.lang.String delete;

        /**
         * Sets the value of {@link EcrRepositoryTimeouts#getDelete}
         * @param delete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository#delete EcrRepository#delete}.
         * @return {@code this}
         */
        public Builder delete(java.lang.String delete) {
            this.delete = delete;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcrRepositoryTimeouts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcrRepositoryTimeouts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcrRepositoryTimeouts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcrRepositoryTimeouts {
        private final java.lang.String delete;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.delete = software.amazon.jsii.Kernel.get(this, "delete", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.delete = builder.delete;
        }

        @Override
        public final java.lang.String getDelete() {
            return this.delete;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDelete() != null) {
                data.set("delete", om.valueToTree(this.getDelete()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecrRepository.EcrRepositoryTimeouts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcrRepositoryTimeouts.Jsii$Proxy that = (EcrRepositoryTimeouts.Jsii$Proxy) o;

            return this.delete != null ? this.delete.equals(that.delete) : that.delete == null;
        }

        @Override
        public final int hashCode() {
            int result = this.delete != null ? this.delete.hashCode() : 0;
            return result;
        }
    }
}
