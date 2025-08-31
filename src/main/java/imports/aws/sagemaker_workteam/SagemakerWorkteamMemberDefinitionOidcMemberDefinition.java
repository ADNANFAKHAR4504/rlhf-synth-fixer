package imports.aws.sagemaker_workteam;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkteam.SagemakerWorkteamMemberDefinitionOidcMemberDefinition")
@software.amazon.jsii.Jsii.Proxy(SagemakerWorkteamMemberDefinitionOidcMemberDefinition.Jsii$Proxy.class)
public interface SagemakerWorkteamMemberDefinitionOidcMemberDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workteam#groups SagemakerWorkteam#groups}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getGroups();

    /**
     * @return a {@link Builder} of {@link SagemakerWorkteamMemberDefinitionOidcMemberDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerWorkteamMemberDefinitionOidcMemberDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerWorkteamMemberDefinitionOidcMemberDefinition> {
        java.util.List<java.lang.String> groups;

        /**
         * Sets the value of {@link SagemakerWorkteamMemberDefinitionOidcMemberDefinition#getGroups}
         * @param groups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workteam#groups SagemakerWorkteam#groups}. This parameter is required.
         * @return {@code this}
         */
        public Builder groups(java.util.List<java.lang.String> groups) {
            this.groups = groups;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerWorkteamMemberDefinitionOidcMemberDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerWorkteamMemberDefinitionOidcMemberDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerWorkteamMemberDefinitionOidcMemberDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerWorkteamMemberDefinitionOidcMemberDefinition {
        private final java.util.List<java.lang.String> groups;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.groups = software.amazon.jsii.Kernel.get(this, "groups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.groups = java.util.Objects.requireNonNull(builder.groups, "groups is required");
        }

        @Override
        public final java.util.List<java.lang.String> getGroups() {
            return this.groups;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("groups", om.valueToTree(this.getGroups()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerWorkteam.SagemakerWorkteamMemberDefinitionOidcMemberDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerWorkteamMemberDefinitionOidcMemberDefinition.Jsii$Proxy that = (SagemakerWorkteamMemberDefinitionOidcMemberDefinition.Jsii$Proxy) o;

            return this.groups.equals(that.groups);
        }

        @Override
        public final int hashCode() {
            int result = this.groups.hashCode();
            return result;
        }
    }
}
