package imports.aws.glue_catalog_database;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.278Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogDatabase.GlueCatalogDatabaseFederatedDatabase")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogDatabaseFederatedDatabase.Jsii$Proxy.class)
public interface GlueCatalogDatabaseFederatedDatabase extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#connection_name GlueCatalogDatabase#connection_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#identifier GlueCatalogDatabase#identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentifier() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCatalogDatabaseFederatedDatabase}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogDatabaseFederatedDatabase}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogDatabaseFederatedDatabase> {
        java.lang.String connectionName;
        java.lang.String identifier;

        /**
         * Sets the value of {@link GlueCatalogDatabaseFederatedDatabase#getConnectionName}
         * @param connectionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#connection_name GlueCatalogDatabase#connection_name}.
         * @return {@code this}
         */
        public Builder connectionName(java.lang.String connectionName) {
            this.connectionName = connectionName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseFederatedDatabase#getIdentifier}
         * @param identifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#identifier GlueCatalogDatabase#identifier}.
         * @return {@code this}
         */
        public Builder identifier(java.lang.String identifier) {
            this.identifier = identifier;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCatalogDatabaseFederatedDatabase}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogDatabaseFederatedDatabase build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogDatabaseFederatedDatabase}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogDatabaseFederatedDatabase {
        private final java.lang.String connectionName;
        private final java.lang.String identifier;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectionName = software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identifier = software.amazon.jsii.Kernel.get(this, "identifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectionName = builder.connectionName;
            this.identifier = builder.identifier;
        }

        @Override
        public final java.lang.String getConnectionName() {
            return this.connectionName;
        }

        @Override
        public final java.lang.String getIdentifier() {
            return this.identifier;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConnectionName() != null) {
                data.set("connectionName", om.valueToTree(this.getConnectionName()));
            }
            if (this.getIdentifier() != null) {
                data.set("identifier", om.valueToTree(this.getIdentifier()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCatalogDatabase.GlueCatalogDatabaseFederatedDatabase"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogDatabaseFederatedDatabase.Jsii$Proxy that = (GlueCatalogDatabaseFederatedDatabase.Jsii$Proxy) o;

            if (this.connectionName != null ? !this.connectionName.equals(that.connectionName) : that.connectionName != null) return false;
            return this.identifier != null ? this.identifier.equals(that.identifier) : that.identifier == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectionName != null ? this.connectionName.hashCode() : 0;
            result = 31 * result + (this.identifier != null ? this.identifier.hashCode() : 0);
            return result;
        }
    }
}
