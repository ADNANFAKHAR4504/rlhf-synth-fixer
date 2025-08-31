package imports.aws.glue_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.296Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueJob.GlueJobSourceControlDetails")
@software.amazon.jsii.Jsii.Proxy(GlueJobSourceControlDetails.Jsii$Proxy.class)
public interface GlueJobSourceControlDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#auth_strategy GlueJob#auth_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#auth_token GlueJob#auth_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#branch GlueJob#branch}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBranch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#folder GlueJob#folder}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFolder() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#last_commit_id GlueJob#last_commit_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLastCommitId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#owner GlueJob#owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#provider GlueJob#provider}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProvider() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#repository GlueJob#repository}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRepository() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueJobSourceControlDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueJobSourceControlDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueJobSourceControlDetails> {
        java.lang.String authStrategy;
        java.lang.String authToken;
        java.lang.String branch;
        java.lang.String folder;
        java.lang.String lastCommitId;
        java.lang.String owner;
        java.lang.String provider;
        java.lang.String repository;

        /**
         * Sets the value of {@link GlueJobSourceControlDetails#getAuthStrategy}
         * @param authStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#auth_strategy GlueJob#auth_strategy}.
         * @return {@code this}
         */
        public Builder authStrategy(java.lang.String authStrategy) {
            this.authStrategy = authStrategy;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobSourceControlDetails#getAuthToken}
         * @param authToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#auth_token GlueJob#auth_token}.
         * @return {@code this}
         */
        public Builder authToken(java.lang.String authToken) {
            this.authToken = authToken;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobSourceControlDetails#getBranch}
         * @param branch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#branch GlueJob#branch}.
         * @return {@code this}
         */
        public Builder branch(java.lang.String branch) {
            this.branch = branch;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobSourceControlDetails#getFolder}
         * @param folder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#folder GlueJob#folder}.
         * @return {@code this}
         */
        public Builder folder(java.lang.String folder) {
            this.folder = folder;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobSourceControlDetails#getLastCommitId}
         * @param lastCommitId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#last_commit_id GlueJob#last_commit_id}.
         * @return {@code this}
         */
        public Builder lastCommitId(java.lang.String lastCommitId) {
            this.lastCommitId = lastCommitId;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobSourceControlDetails#getOwner}
         * @param owner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#owner GlueJob#owner}.
         * @return {@code this}
         */
        public Builder owner(java.lang.String owner) {
            this.owner = owner;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobSourceControlDetails#getProvider}
         * @param provider Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#provider GlueJob#provider}.
         * @return {@code this}
         */
        public Builder provider(java.lang.String provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobSourceControlDetails#getRepository}
         * @param repository Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#repository GlueJob#repository}.
         * @return {@code this}
         */
        public Builder repository(java.lang.String repository) {
            this.repository = repository;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueJobSourceControlDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueJobSourceControlDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueJobSourceControlDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueJobSourceControlDetails {
        private final java.lang.String authStrategy;
        private final java.lang.String authToken;
        private final java.lang.String branch;
        private final java.lang.String folder;
        private final java.lang.String lastCommitId;
        private final java.lang.String owner;
        private final java.lang.String provider;
        private final java.lang.String repository;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authStrategy = software.amazon.jsii.Kernel.get(this, "authStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authToken = software.amazon.jsii.Kernel.get(this, "authToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.branch = software.amazon.jsii.Kernel.get(this, "branch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.folder = software.amazon.jsii.Kernel.get(this, "folder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lastCommitId = software.amazon.jsii.Kernel.get(this, "lastCommitId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.owner = software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.repository = software.amazon.jsii.Kernel.get(this, "repository", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authStrategy = builder.authStrategy;
            this.authToken = builder.authToken;
            this.branch = builder.branch;
            this.folder = builder.folder;
            this.lastCommitId = builder.lastCommitId;
            this.owner = builder.owner;
            this.provider = builder.provider;
            this.repository = builder.repository;
        }

        @Override
        public final java.lang.String getAuthStrategy() {
            return this.authStrategy;
        }

        @Override
        public final java.lang.String getAuthToken() {
            return this.authToken;
        }

        @Override
        public final java.lang.String getBranch() {
            return this.branch;
        }

        @Override
        public final java.lang.String getFolder() {
            return this.folder;
        }

        @Override
        public final java.lang.String getLastCommitId() {
            return this.lastCommitId;
        }

        @Override
        public final java.lang.String getOwner() {
            return this.owner;
        }

        @Override
        public final java.lang.String getProvider() {
            return this.provider;
        }

        @Override
        public final java.lang.String getRepository() {
            return this.repository;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAuthStrategy() != null) {
                data.set("authStrategy", om.valueToTree(this.getAuthStrategy()));
            }
            if (this.getAuthToken() != null) {
                data.set("authToken", om.valueToTree(this.getAuthToken()));
            }
            if (this.getBranch() != null) {
                data.set("branch", om.valueToTree(this.getBranch()));
            }
            if (this.getFolder() != null) {
                data.set("folder", om.valueToTree(this.getFolder()));
            }
            if (this.getLastCommitId() != null) {
                data.set("lastCommitId", om.valueToTree(this.getLastCommitId()));
            }
            if (this.getOwner() != null) {
                data.set("owner", om.valueToTree(this.getOwner()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getRepository() != null) {
                data.set("repository", om.valueToTree(this.getRepository()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueJob.GlueJobSourceControlDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueJobSourceControlDetails.Jsii$Proxy that = (GlueJobSourceControlDetails.Jsii$Proxy) o;

            if (this.authStrategy != null ? !this.authStrategy.equals(that.authStrategy) : that.authStrategy != null) return false;
            if (this.authToken != null ? !this.authToken.equals(that.authToken) : that.authToken != null) return false;
            if (this.branch != null ? !this.branch.equals(that.branch) : that.branch != null) return false;
            if (this.folder != null ? !this.folder.equals(that.folder) : that.folder != null) return false;
            if (this.lastCommitId != null ? !this.lastCommitId.equals(that.lastCommitId) : that.lastCommitId != null) return false;
            if (this.owner != null ? !this.owner.equals(that.owner) : that.owner != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.repository != null ? this.repository.equals(that.repository) : that.repository == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authStrategy != null ? this.authStrategy.hashCode() : 0;
            result = 31 * result + (this.authToken != null ? this.authToken.hashCode() : 0);
            result = 31 * result + (this.branch != null ? this.branch.hashCode() : 0);
            result = 31 * result + (this.folder != null ? this.folder.hashCode() : 0);
            result = 31 * result + (this.lastCommitId != null ? this.lastCommitId.hashCode() : 0);
            result = 31 * result + (this.owner != null ? this.owner.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.repository != null ? this.repository.hashCode() : 0);
            return result;
        }
    }
}
