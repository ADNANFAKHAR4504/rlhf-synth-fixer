package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.015Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva.Jsii$Proxy.class)
public interface AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object AppflowFlow#object}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getObject();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#document_type AppflowFlow#document_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocumentType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_all_versions AppflowFlow#include_all_versions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeAllVersions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_renditions AppflowFlow#include_renditions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeRenditions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_source_files AppflowFlow#include_source_files}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeSourceFiles() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva> {
        java.lang.String object;
        java.lang.String documentType;
        java.lang.Object includeAllVersions;
        java.lang.Object includeRenditions;
        java.lang.Object includeSourceFiles;

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva#getObject}
         * @param object Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object AppflowFlow#object}. This parameter is required.
         * @return {@code this}
         */
        public Builder object(java.lang.String object) {
            this.object = object;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva#getDocumentType}
         * @param documentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#document_type AppflowFlow#document_type}.
         * @return {@code this}
         */
        public Builder documentType(java.lang.String documentType) {
            this.documentType = documentType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva#getIncludeAllVersions}
         * @param includeAllVersions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_all_versions AppflowFlow#include_all_versions}.
         * @return {@code this}
         */
        public Builder includeAllVersions(java.lang.Boolean includeAllVersions) {
            this.includeAllVersions = includeAllVersions;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva#getIncludeAllVersions}
         * @param includeAllVersions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_all_versions AppflowFlow#include_all_versions}.
         * @return {@code this}
         */
        public Builder includeAllVersions(com.hashicorp.cdktf.IResolvable includeAllVersions) {
            this.includeAllVersions = includeAllVersions;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva#getIncludeRenditions}
         * @param includeRenditions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_renditions AppflowFlow#include_renditions}.
         * @return {@code this}
         */
        public Builder includeRenditions(java.lang.Boolean includeRenditions) {
            this.includeRenditions = includeRenditions;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva#getIncludeRenditions}
         * @param includeRenditions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_renditions AppflowFlow#include_renditions}.
         * @return {@code this}
         */
        public Builder includeRenditions(com.hashicorp.cdktf.IResolvable includeRenditions) {
            this.includeRenditions = includeRenditions;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva#getIncludeSourceFiles}
         * @param includeSourceFiles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_source_files AppflowFlow#include_source_files}.
         * @return {@code this}
         */
        public Builder includeSourceFiles(java.lang.Boolean includeSourceFiles) {
            this.includeSourceFiles = includeSourceFiles;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva#getIncludeSourceFiles}
         * @param includeSourceFiles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_source_files AppflowFlow#include_source_files}.
         * @return {@code this}
         */
        public Builder includeSourceFiles(com.hashicorp.cdktf.IResolvable includeSourceFiles) {
            this.includeSourceFiles = includeSourceFiles;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva {
        private final java.lang.String object;
        private final java.lang.String documentType;
        private final java.lang.Object includeAllVersions;
        private final java.lang.Object includeRenditions;
        private final java.lang.Object includeSourceFiles;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.object = software.amazon.jsii.Kernel.get(this, "object", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documentType = software.amazon.jsii.Kernel.get(this, "documentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeAllVersions = software.amazon.jsii.Kernel.get(this, "includeAllVersions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeRenditions = software.amazon.jsii.Kernel.get(this, "includeRenditions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeSourceFiles = software.amazon.jsii.Kernel.get(this, "includeSourceFiles", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.object = java.util.Objects.requireNonNull(builder.object, "object is required");
            this.documentType = builder.documentType;
            this.includeAllVersions = builder.includeAllVersions;
            this.includeRenditions = builder.includeRenditions;
            this.includeSourceFiles = builder.includeSourceFiles;
        }

        @Override
        public final java.lang.String getObject() {
            return this.object;
        }

        @Override
        public final java.lang.String getDocumentType() {
            return this.documentType;
        }

        @Override
        public final java.lang.Object getIncludeAllVersions() {
            return this.includeAllVersions;
        }

        @Override
        public final java.lang.Object getIncludeRenditions() {
            return this.includeRenditions;
        }

        @Override
        public final java.lang.Object getIncludeSourceFiles() {
            return this.includeSourceFiles;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("object", om.valueToTree(this.getObject()));
            if (this.getDocumentType() != null) {
                data.set("documentType", om.valueToTree(this.getDocumentType()));
            }
            if (this.getIncludeAllVersions() != null) {
                data.set("includeAllVersions", om.valueToTree(this.getIncludeAllVersions()));
            }
            if (this.getIncludeRenditions() != null) {
                data.set("includeRenditions", om.valueToTree(this.getIncludeRenditions()));
            }
            if (this.getIncludeSourceFiles() != null) {
                data.set("includeSourceFiles", om.valueToTree(this.getIncludeSourceFiles()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva.Jsii$Proxy that = (AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva.Jsii$Proxy) o;

            if (!object.equals(that.object)) return false;
            if (this.documentType != null ? !this.documentType.equals(that.documentType) : that.documentType != null) return false;
            if (this.includeAllVersions != null ? !this.includeAllVersions.equals(that.includeAllVersions) : that.includeAllVersions != null) return false;
            if (this.includeRenditions != null ? !this.includeRenditions.equals(that.includeRenditions) : that.includeRenditions != null) return false;
            return this.includeSourceFiles != null ? this.includeSourceFiles.equals(that.includeSourceFiles) : that.includeSourceFiles == null;
        }

        @Override
        public final int hashCode() {
            int result = this.object.hashCode();
            result = 31 * result + (this.documentType != null ? this.documentType.hashCode() : 0);
            result = 31 * result + (this.includeAllVersions != null ? this.includeAllVersions.hashCode() : 0);
            result = 31 * result + (this.includeRenditions != null ? this.includeRenditions.hashCode() : 0);
            result = 31 * result + (this.includeSourceFiles != null ? this.includeSourceFiles.hashCode() : 0);
            return result;
        }
    }
}
