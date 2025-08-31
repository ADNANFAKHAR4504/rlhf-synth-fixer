package imports.aws.verifiedpermissions_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.582Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsPolicy.VerifiedpermissionsPolicyDefinitionStatic")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsPolicyDefinitionStatic.Jsii$Proxy.class)
public interface VerifiedpermissionsPolicyDefinitionStatic extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#statement VerifiedpermissionsPolicy#statement}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatement();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#description VerifiedpermissionsPolicy#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedpermissionsPolicyDefinitionStatic}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsPolicyDefinitionStatic}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsPolicyDefinitionStatic> {
        java.lang.String statement;
        java.lang.String description;

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinitionStatic#getStatement}
         * @param statement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#statement VerifiedpermissionsPolicy#statement}. This parameter is required.
         * @return {@code this}
         */
        public Builder statement(java.lang.String statement) {
            this.statement = statement;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinitionStatic#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#description VerifiedpermissionsPolicy#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsPolicyDefinitionStatic}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsPolicyDefinitionStatic build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsPolicyDefinitionStatic}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsPolicyDefinitionStatic {
        private final java.lang.String statement;
        private final java.lang.String description;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.statement = software.amazon.jsii.Kernel.get(this, "statement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.statement = java.util.Objects.requireNonNull(builder.statement, "statement is required");
            this.description = builder.description;
        }

        @Override
        public final java.lang.String getStatement() {
            return this.statement;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("statement", om.valueToTree(this.getStatement()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsPolicy.VerifiedpermissionsPolicyDefinitionStatic"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsPolicyDefinitionStatic.Jsii$Proxy that = (VerifiedpermissionsPolicyDefinitionStatic.Jsii$Proxy) o;

            if (!statement.equals(that.statement)) return false;
            return this.description != null ? this.description.equals(that.description) : that.description == null;
        }

        @Override
        public final int hashCode() {
            int result = this.statement.hashCode();
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            return result;
        }
    }
}
