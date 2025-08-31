package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointMongodbSettings")
@software.amazon.jsii.Jsii.Proxy(DmsEndpointMongodbSettings.Jsii$Proxy.class)
public interface DmsEndpointMongodbSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_mechanism DmsEndpoint#auth_mechanism}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthMechanism() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_source DmsEndpoint#auth_source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_type DmsEndpoint#auth_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#docs_to_investigate DmsEndpoint#docs_to_investigate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocsToInvestigate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#extract_doc_id DmsEndpoint#extract_doc_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExtractDocId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#nesting_level DmsEndpoint#nesting_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNestingLevel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DmsEndpointMongodbSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DmsEndpointMongodbSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DmsEndpointMongodbSettings> {
        java.lang.String authMechanism;
        java.lang.String authSource;
        java.lang.String authType;
        java.lang.String docsToInvestigate;
        java.lang.String extractDocId;
        java.lang.String nestingLevel;

        /**
         * Sets the value of {@link DmsEndpointMongodbSettings#getAuthMechanism}
         * @param authMechanism Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_mechanism DmsEndpoint#auth_mechanism}.
         * @return {@code this}
         */
        public Builder authMechanism(java.lang.String authMechanism) {
            this.authMechanism = authMechanism;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointMongodbSettings#getAuthSource}
         * @param authSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_source DmsEndpoint#auth_source}.
         * @return {@code this}
         */
        public Builder authSource(java.lang.String authSource) {
            this.authSource = authSource;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointMongodbSettings#getAuthType}
         * @param authType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_type DmsEndpoint#auth_type}.
         * @return {@code this}
         */
        public Builder authType(java.lang.String authType) {
            this.authType = authType;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointMongodbSettings#getDocsToInvestigate}
         * @param docsToInvestigate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#docs_to_investigate DmsEndpoint#docs_to_investigate}.
         * @return {@code this}
         */
        public Builder docsToInvestigate(java.lang.String docsToInvestigate) {
            this.docsToInvestigate = docsToInvestigate;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointMongodbSettings#getExtractDocId}
         * @param extractDocId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#extract_doc_id DmsEndpoint#extract_doc_id}.
         * @return {@code this}
         */
        public Builder extractDocId(java.lang.String extractDocId) {
            this.extractDocId = extractDocId;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointMongodbSettings#getNestingLevel}
         * @param nestingLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#nesting_level DmsEndpoint#nesting_level}.
         * @return {@code this}
         */
        public Builder nestingLevel(java.lang.String nestingLevel) {
            this.nestingLevel = nestingLevel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DmsEndpointMongodbSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DmsEndpointMongodbSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DmsEndpointMongodbSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DmsEndpointMongodbSettings {
        private final java.lang.String authMechanism;
        private final java.lang.String authSource;
        private final java.lang.String authType;
        private final java.lang.String docsToInvestigate;
        private final java.lang.String extractDocId;
        private final java.lang.String nestingLevel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authMechanism = software.amazon.jsii.Kernel.get(this, "authMechanism", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authSource = software.amazon.jsii.Kernel.get(this, "authSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authType = software.amazon.jsii.Kernel.get(this, "authType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.docsToInvestigate = software.amazon.jsii.Kernel.get(this, "docsToInvestigate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.extractDocId = software.amazon.jsii.Kernel.get(this, "extractDocId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nestingLevel = software.amazon.jsii.Kernel.get(this, "nestingLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authMechanism = builder.authMechanism;
            this.authSource = builder.authSource;
            this.authType = builder.authType;
            this.docsToInvestigate = builder.docsToInvestigate;
            this.extractDocId = builder.extractDocId;
            this.nestingLevel = builder.nestingLevel;
        }

        @Override
        public final java.lang.String getAuthMechanism() {
            return this.authMechanism;
        }

        @Override
        public final java.lang.String getAuthSource() {
            return this.authSource;
        }

        @Override
        public final java.lang.String getAuthType() {
            return this.authType;
        }

        @Override
        public final java.lang.String getDocsToInvestigate() {
            return this.docsToInvestigate;
        }

        @Override
        public final java.lang.String getExtractDocId() {
            return this.extractDocId;
        }

        @Override
        public final java.lang.String getNestingLevel() {
            return this.nestingLevel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAuthMechanism() != null) {
                data.set("authMechanism", om.valueToTree(this.getAuthMechanism()));
            }
            if (this.getAuthSource() != null) {
                data.set("authSource", om.valueToTree(this.getAuthSource()));
            }
            if (this.getAuthType() != null) {
                data.set("authType", om.valueToTree(this.getAuthType()));
            }
            if (this.getDocsToInvestigate() != null) {
                data.set("docsToInvestigate", om.valueToTree(this.getDocsToInvestigate()));
            }
            if (this.getExtractDocId() != null) {
                data.set("extractDocId", om.valueToTree(this.getExtractDocId()));
            }
            if (this.getNestingLevel() != null) {
                data.set("nestingLevel", om.valueToTree(this.getNestingLevel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dmsEndpoint.DmsEndpointMongodbSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DmsEndpointMongodbSettings.Jsii$Proxy that = (DmsEndpointMongodbSettings.Jsii$Proxy) o;

            if (this.authMechanism != null ? !this.authMechanism.equals(that.authMechanism) : that.authMechanism != null) return false;
            if (this.authSource != null ? !this.authSource.equals(that.authSource) : that.authSource != null) return false;
            if (this.authType != null ? !this.authType.equals(that.authType) : that.authType != null) return false;
            if (this.docsToInvestigate != null ? !this.docsToInvestigate.equals(that.docsToInvestigate) : that.docsToInvestigate != null) return false;
            if (this.extractDocId != null ? !this.extractDocId.equals(that.extractDocId) : that.extractDocId != null) return false;
            return this.nestingLevel != null ? this.nestingLevel.equals(that.nestingLevel) : that.nestingLevel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authMechanism != null ? this.authMechanism.hashCode() : 0;
            result = 31 * result + (this.authSource != null ? this.authSource.hashCode() : 0);
            result = 31 * result + (this.authType != null ? this.authType.hashCode() : 0);
            result = 31 * result + (this.docsToInvestigate != null ? this.docsToInvestigate.hashCode() : 0);
            result = 31 * result + (this.extractDocId != null ? this.extractDocId.hashCode() : 0);
            result = 31 * result + (this.nestingLevel != null ? this.nestingLevel.hashCode() : 0);
            return result;
        }
    }
}
