package imports.aws.eks_access_policy_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksAccessPolicyAssociation.EksAccessPolicyAssociationAccessScope")
@software.amazon.jsii.Jsii.Proxy(EksAccessPolicyAssociationAccessScope.Jsii$Proxy.class)
public interface EksAccessPolicyAssociationAccessScope extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#type EksAccessPolicyAssociation#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#namespaces EksAccessPolicyAssociation#namespaces}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNamespaces() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksAccessPolicyAssociationAccessScope}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksAccessPolicyAssociationAccessScope}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksAccessPolicyAssociationAccessScope> {
        java.lang.String type;
        java.util.List<java.lang.String> namespaces;

        /**
         * Sets the value of {@link EksAccessPolicyAssociationAccessScope#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#type EksAccessPolicyAssociation#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationAccessScope#getNamespaces}
         * @param namespaces Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#namespaces EksAccessPolicyAssociation#namespaces}.
         * @return {@code this}
         */
        public Builder namespaces(java.util.List<java.lang.String> namespaces) {
            this.namespaces = namespaces;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksAccessPolicyAssociationAccessScope}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksAccessPolicyAssociationAccessScope build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksAccessPolicyAssociationAccessScope}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksAccessPolicyAssociationAccessScope {
        private final java.lang.String type;
        private final java.util.List<java.lang.String> namespaces;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namespaces = software.amazon.jsii.Kernel.get(this, "namespaces", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.namespaces = builder.namespaces;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.util.List<java.lang.String> getNamespaces() {
            return this.namespaces;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getNamespaces() != null) {
                data.set("namespaces", om.valueToTree(this.getNamespaces()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksAccessPolicyAssociation.EksAccessPolicyAssociationAccessScope"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksAccessPolicyAssociationAccessScope.Jsii$Proxy that = (EksAccessPolicyAssociationAccessScope.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.namespaces != null ? this.namespaces.equals(that.namespaces) : that.namespaces == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.namespaces != null ? this.namespaces.hashCode() : 0);
            return result;
        }
    }
}
