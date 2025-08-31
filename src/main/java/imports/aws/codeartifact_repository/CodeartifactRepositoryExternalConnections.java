package imports.aws.codeartifact_repository;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.297Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codeartifactRepository.CodeartifactRepositoryExternalConnections")
@software.amazon.jsii.Jsii.Proxy(CodeartifactRepositoryExternalConnections.Jsii$Proxy.class)
public interface CodeartifactRepositoryExternalConnections extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository#external_connection_name CodeartifactRepository#external_connection_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExternalConnectionName();

    /**
     * @return a {@link Builder} of {@link CodeartifactRepositoryExternalConnections}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodeartifactRepositoryExternalConnections}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodeartifactRepositoryExternalConnections> {
        java.lang.String externalConnectionName;

        /**
         * Sets the value of {@link CodeartifactRepositoryExternalConnections#getExternalConnectionName}
         * @param externalConnectionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository#external_connection_name CodeartifactRepository#external_connection_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder externalConnectionName(java.lang.String externalConnectionName) {
            this.externalConnectionName = externalConnectionName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodeartifactRepositoryExternalConnections}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodeartifactRepositoryExternalConnections build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodeartifactRepositoryExternalConnections}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodeartifactRepositoryExternalConnections {
        private final java.lang.String externalConnectionName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.externalConnectionName = software.amazon.jsii.Kernel.get(this, "externalConnectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.externalConnectionName = java.util.Objects.requireNonNull(builder.externalConnectionName, "externalConnectionName is required");
        }

        @Override
        public final java.lang.String getExternalConnectionName() {
            return this.externalConnectionName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("externalConnectionName", om.valueToTree(this.getExternalConnectionName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codeartifactRepository.CodeartifactRepositoryExternalConnections"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodeartifactRepositoryExternalConnections.Jsii$Proxy that = (CodeartifactRepositoryExternalConnections.Jsii$Proxy) o;

            return this.externalConnectionName.equals(that.externalConnectionName);
        }

        @Override
        public final int hashCode() {
            int result = this.externalConnectionName.hashCode();
            return result;
        }
    }
}
