package imports.aws.codegurureviewer_repository_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.328Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codegurureviewerRepositoryAssociation.CodegurureviewerRepositoryAssociationRepositoryBitbucket")
@software.amazon.jsii.Jsii.Proxy(CodegurureviewerRepositoryAssociationRepositoryBitbucket.Jsii$Proxy.class)
public interface CodegurureviewerRepositoryAssociationRepositoryBitbucket extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#connection_arn CodegurureviewerRepositoryAssociation#connection_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectionArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#name CodegurureviewerRepositoryAssociation#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#owner CodegurureviewerRepositoryAssociation#owner}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOwner();

    /**
     * @return a {@link Builder} of {@link CodegurureviewerRepositoryAssociationRepositoryBitbucket}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodegurureviewerRepositoryAssociationRepositoryBitbucket}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodegurureviewerRepositoryAssociationRepositoryBitbucket> {
        java.lang.String connectionArn;
        java.lang.String name;
        java.lang.String owner;

        /**
         * Sets the value of {@link CodegurureviewerRepositoryAssociationRepositoryBitbucket#getConnectionArn}
         * @param connectionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#connection_arn CodegurureviewerRepositoryAssociation#connection_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectionArn(java.lang.String connectionArn) {
            this.connectionArn = connectionArn;
            return this;
        }

        /**
         * Sets the value of {@link CodegurureviewerRepositoryAssociationRepositoryBitbucket#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#name CodegurureviewerRepositoryAssociation#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CodegurureviewerRepositoryAssociationRepositoryBitbucket#getOwner}
         * @param owner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#owner CodegurureviewerRepositoryAssociation#owner}. This parameter is required.
         * @return {@code this}
         */
        public Builder owner(java.lang.String owner) {
            this.owner = owner;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodegurureviewerRepositoryAssociationRepositoryBitbucket}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodegurureviewerRepositoryAssociationRepositoryBitbucket build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodegurureviewerRepositoryAssociationRepositoryBitbucket}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodegurureviewerRepositoryAssociationRepositoryBitbucket {
        private final java.lang.String connectionArn;
        private final java.lang.String name;
        private final java.lang.String owner;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectionArn = software.amazon.jsii.Kernel.get(this, "connectionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.owner = software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectionArn = java.util.Objects.requireNonNull(builder.connectionArn, "connectionArn is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.owner = java.util.Objects.requireNonNull(builder.owner, "owner is required");
        }

        @Override
        public final java.lang.String getConnectionArn() {
            return this.connectionArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getOwner() {
            return this.owner;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("connectionArn", om.valueToTree(this.getConnectionArn()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("owner", om.valueToTree(this.getOwner()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codegurureviewerRepositoryAssociation.CodegurureviewerRepositoryAssociationRepositoryBitbucket"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodegurureviewerRepositoryAssociationRepositoryBitbucket.Jsii$Proxy that = (CodegurureviewerRepositoryAssociationRepositoryBitbucket.Jsii$Proxy) o;

            if (!connectionArn.equals(that.connectionArn)) return false;
            if (!name.equals(that.name)) return false;
            return this.owner.equals(that.owner);
        }

        @Override
        public final int hashCode() {
            int result = this.connectionArn.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.owner.hashCode());
            return result;
        }
    }
}
