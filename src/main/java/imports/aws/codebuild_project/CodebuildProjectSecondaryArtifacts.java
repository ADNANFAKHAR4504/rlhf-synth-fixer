package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectSecondaryArtifacts")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectSecondaryArtifacts.Jsii$Proxy.class)
public interface CodebuildProjectSecondaryArtifacts extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#artifact_identifier CodebuildProject#artifact_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getArtifactIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#type CodebuildProject#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#bucket_owner_access CodebuildProject#bucket_owner_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketOwnerAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#encryption_disabled CodebuildProject#encryption_disabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionDisabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#location CodebuildProject#location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#name CodebuildProject#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#namespace_type CodebuildProject#namespace_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamespaceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#override_artifact_name CodebuildProject#override_artifact_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOverrideArtifactName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#packaging CodebuildProject#packaging}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPackaging() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#path CodebuildProject#path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectSecondaryArtifacts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectSecondaryArtifacts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectSecondaryArtifacts> {
        java.lang.String artifactIdentifier;
        java.lang.String type;
        java.lang.String bucketOwnerAccess;
        java.lang.Object encryptionDisabled;
        java.lang.String location;
        java.lang.String name;
        java.lang.String namespaceType;
        java.lang.Object overrideArtifactName;
        java.lang.String packaging;
        java.lang.String path;

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getArtifactIdentifier}
         * @param artifactIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#artifact_identifier CodebuildProject#artifact_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder artifactIdentifier(java.lang.String artifactIdentifier) {
            this.artifactIdentifier = artifactIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#type CodebuildProject#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getBucketOwnerAccess}
         * @param bucketOwnerAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#bucket_owner_access CodebuildProject#bucket_owner_access}.
         * @return {@code this}
         */
        public Builder bucketOwnerAccess(java.lang.String bucketOwnerAccess) {
            this.bucketOwnerAccess = bucketOwnerAccess;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getEncryptionDisabled}
         * @param encryptionDisabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#encryption_disabled CodebuildProject#encryption_disabled}.
         * @return {@code this}
         */
        public Builder encryptionDisabled(java.lang.Boolean encryptionDisabled) {
            this.encryptionDisabled = encryptionDisabled;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getEncryptionDisabled}
         * @param encryptionDisabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#encryption_disabled CodebuildProject#encryption_disabled}.
         * @return {@code this}
         */
        public Builder encryptionDisabled(com.hashicorp.cdktf.IResolvable encryptionDisabled) {
            this.encryptionDisabled = encryptionDisabled;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getLocation}
         * @param location Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#location CodebuildProject#location}.
         * @return {@code this}
         */
        public Builder location(java.lang.String location) {
            this.location = location;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#name CodebuildProject#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getNamespaceType}
         * @param namespaceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#namespace_type CodebuildProject#namespace_type}.
         * @return {@code this}
         */
        public Builder namespaceType(java.lang.String namespaceType) {
            this.namespaceType = namespaceType;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getOverrideArtifactName}
         * @param overrideArtifactName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#override_artifact_name CodebuildProject#override_artifact_name}.
         * @return {@code this}
         */
        public Builder overrideArtifactName(java.lang.Boolean overrideArtifactName) {
            this.overrideArtifactName = overrideArtifactName;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getOverrideArtifactName}
         * @param overrideArtifactName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#override_artifact_name CodebuildProject#override_artifact_name}.
         * @return {@code this}
         */
        public Builder overrideArtifactName(com.hashicorp.cdktf.IResolvable overrideArtifactName) {
            this.overrideArtifactName = overrideArtifactName;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getPackaging}
         * @param packaging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#packaging CodebuildProject#packaging}.
         * @return {@code this}
         */
        public Builder packaging(java.lang.String packaging) {
            this.packaging = packaging;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondaryArtifacts#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#path CodebuildProject#path}.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectSecondaryArtifacts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectSecondaryArtifacts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectSecondaryArtifacts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectSecondaryArtifacts {
        private final java.lang.String artifactIdentifier;
        private final java.lang.String type;
        private final java.lang.String bucketOwnerAccess;
        private final java.lang.Object encryptionDisabled;
        private final java.lang.String location;
        private final java.lang.String name;
        private final java.lang.String namespaceType;
        private final java.lang.Object overrideArtifactName;
        private final java.lang.String packaging;
        private final java.lang.String path;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.artifactIdentifier = software.amazon.jsii.Kernel.get(this, "artifactIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketOwnerAccess = software.amazon.jsii.Kernel.get(this, "bucketOwnerAccess", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionDisabled = software.amazon.jsii.Kernel.get(this, "encryptionDisabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.location = software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namespaceType = software.amazon.jsii.Kernel.get(this, "namespaceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.overrideArtifactName = software.amazon.jsii.Kernel.get(this, "overrideArtifactName", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.packaging = software.amazon.jsii.Kernel.get(this, "packaging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.artifactIdentifier = java.util.Objects.requireNonNull(builder.artifactIdentifier, "artifactIdentifier is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.bucketOwnerAccess = builder.bucketOwnerAccess;
            this.encryptionDisabled = builder.encryptionDisabled;
            this.location = builder.location;
            this.name = builder.name;
            this.namespaceType = builder.namespaceType;
            this.overrideArtifactName = builder.overrideArtifactName;
            this.packaging = builder.packaging;
            this.path = builder.path;
        }

        @Override
        public final java.lang.String getArtifactIdentifier() {
            return this.artifactIdentifier;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getBucketOwnerAccess() {
            return this.bucketOwnerAccess;
        }

        @Override
        public final java.lang.Object getEncryptionDisabled() {
            return this.encryptionDisabled;
        }

        @Override
        public final java.lang.String getLocation() {
            return this.location;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamespaceType() {
            return this.namespaceType;
        }

        @Override
        public final java.lang.Object getOverrideArtifactName() {
            return this.overrideArtifactName;
        }

        @Override
        public final java.lang.String getPackaging() {
            return this.packaging;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("artifactIdentifier", om.valueToTree(this.getArtifactIdentifier()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getBucketOwnerAccess() != null) {
                data.set("bucketOwnerAccess", om.valueToTree(this.getBucketOwnerAccess()));
            }
            if (this.getEncryptionDisabled() != null) {
                data.set("encryptionDisabled", om.valueToTree(this.getEncryptionDisabled()));
            }
            if (this.getLocation() != null) {
                data.set("location", om.valueToTree(this.getLocation()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamespaceType() != null) {
                data.set("namespaceType", om.valueToTree(this.getNamespaceType()));
            }
            if (this.getOverrideArtifactName() != null) {
                data.set("overrideArtifactName", om.valueToTree(this.getOverrideArtifactName()));
            }
            if (this.getPackaging() != null) {
                data.set("packaging", om.valueToTree(this.getPackaging()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectSecondaryArtifacts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectSecondaryArtifacts.Jsii$Proxy that = (CodebuildProjectSecondaryArtifacts.Jsii$Proxy) o;

            if (!artifactIdentifier.equals(that.artifactIdentifier)) return false;
            if (!type.equals(that.type)) return false;
            if (this.bucketOwnerAccess != null ? !this.bucketOwnerAccess.equals(that.bucketOwnerAccess) : that.bucketOwnerAccess != null) return false;
            if (this.encryptionDisabled != null ? !this.encryptionDisabled.equals(that.encryptionDisabled) : that.encryptionDisabled != null) return false;
            if (this.location != null ? !this.location.equals(that.location) : that.location != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namespaceType != null ? !this.namespaceType.equals(that.namespaceType) : that.namespaceType != null) return false;
            if (this.overrideArtifactName != null ? !this.overrideArtifactName.equals(that.overrideArtifactName) : that.overrideArtifactName != null) return false;
            if (this.packaging != null ? !this.packaging.equals(that.packaging) : that.packaging != null) return false;
            return this.path != null ? this.path.equals(that.path) : that.path == null;
        }

        @Override
        public final int hashCode() {
            int result = this.artifactIdentifier.hashCode();
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.bucketOwnerAccess != null ? this.bucketOwnerAccess.hashCode() : 0);
            result = 31 * result + (this.encryptionDisabled != null ? this.encryptionDisabled.hashCode() : 0);
            result = 31 * result + (this.location != null ? this.location.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namespaceType != null ? this.namespaceType.hashCode() : 0);
            result = 31 * result + (this.overrideArtifactName != null ? this.overrideArtifactName.hashCode() : 0);
            result = 31 * result + (this.packaging != null ? this.packaging.hashCode() : 0);
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            return result;
        }
    }
}
