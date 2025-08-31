package imports.aws.codegurureviewer_repository_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.328Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codegurureviewerRepositoryAssociation.CodegurureviewerRepositoryAssociationRepository")
@software.amazon.jsii.Jsii.Proxy(CodegurureviewerRepositoryAssociationRepository.Jsii$Proxy.class)
public interface CodegurureviewerRepositoryAssociationRepository extends software.amazon.jsii.JsiiSerializable {

    /**
     * bitbucket block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#bitbucket CodegurureviewerRepositoryAssociation#bitbucket}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucket getBitbucket() {
        return null;
    }

    /**
     * codecommit block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#codecommit CodegurureviewerRepositoryAssociation#codecommit}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommit getCodecommit() {
        return null;
    }

    /**
     * github_enterprise_server block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#github_enterprise_server CodegurureviewerRepositoryAssociation#github_enterprise_server}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServer getGithubEnterpriseServer() {
        return null;
    }

    /**
     * s3_bucket block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#s3_bucket CodegurureviewerRepositoryAssociation#s3_bucket}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3Bucket getS3Bucket() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodegurureviewerRepositoryAssociationRepository}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodegurureviewerRepositoryAssociationRepository}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodegurureviewerRepositoryAssociationRepository> {
        imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucket bitbucket;
        imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommit codecommit;
        imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServer githubEnterpriseServer;
        imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3Bucket s3Bucket;

        /**
         * Sets the value of {@link CodegurureviewerRepositoryAssociationRepository#getBitbucket}
         * @param bitbucket bitbucket block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#bitbucket CodegurureviewerRepositoryAssociation#bitbucket}
         * @return {@code this}
         */
        public Builder bitbucket(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucket bitbucket) {
            this.bitbucket = bitbucket;
            return this;
        }

        /**
         * Sets the value of {@link CodegurureviewerRepositoryAssociationRepository#getCodecommit}
         * @param codecommit codecommit block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#codecommit CodegurureviewerRepositoryAssociation#codecommit}
         * @return {@code this}
         */
        public Builder codecommit(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommit codecommit) {
            this.codecommit = codecommit;
            return this;
        }

        /**
         * Sets the value of {@link CodegurureviewerRepositoryAssociationRepository#getGithubEnterpriseServer}
         * @param githubEnterpriseServer github_enterprise_server block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#github_enterprise_server CodegurureviewerRepositoryAssociation#github_enterprise_server}
         * @return {@code this}
         */
        public Builder githubEnterpriseServer(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServer githubEnterpriseServer) {
            this.githubEnterpriseServer = githubEnterpriseServer;
            return this;
        }

        /**
         * Sets the value of {@link CodegurureviewerRepositoryAssociationRepository#getS3Bucket}
         * @param s3Bucket s3_bucket block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#s3_bucket CodegurureviewerRepositoryAssociation#s3_bucket}
         * @return {@code this}
         */
        public Builder s3Bucket(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3Bucket s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodegurureviewerRepositoryAssociationRepository}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodegurureviewerRepositoryAssociationRepository build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodegurureviewerRepositoryAssociationRepository}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodegurureviewerRepositoryAssociationRepository {
        private final imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucket bitbucket;
        private final imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommit codecommit;
        private final imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServer githubEnterpriseServer;
        private final imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3Bucket s3Bucket;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bitbucket = software.amazon.jsii.Kernel.get(this, "bitbucket", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucket.class));
            this.codecommit = software.amazon.jsii.Kernel.get(this, "codecommit", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommit.class));
            this.githubEnterpriseServer = software.amazon.jsii.Kernel.get(this, "githubEnterpriseServer", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServer.class));
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3Bucket.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bitbucket = builder.bitbucket;
            this.codecommit = builder.codecommit;
            this.githubEnterpriseServer = builder.githubEnterpriseServer;
            this.s3Bucket = builder.s3Bucket;
        }

        @Override
        public final imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucket getBitbucket() {
            return this.bitbucket;
        }

        @Override
        public final imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommit getCodecommit() {
            return this.codecommit;
        }

        @Override
        public final imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServer getGithubEnterpriseServer() {
            return this.githubEnterpriseServer;
        }

        @Override
        public final imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3Bucket getS3Bucket() {
            return this.s3Bucket;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBitbucket() != null) {
                data.set("bitbucket", om.valueToTree(this.getBitbucket()));
            }
            if (this.getCodecommit() != null) {
                data.set("codecommit", om.valueToTree(this.getCodecommit()));
            }
            if (this.getGithubEnterpriseServer() != null) {
                data.set("githubEnterpriseServer", om.valueToTree(this.getGithubEnterpriseServer()));
            }
            if (this.getS3Bucket() != null) {
                data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codegurureviewerRepositoryAssociation.CodegurureviewerRepositoryAssociationRepository"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodegurureviewerRepositoryAssociationRepository.Jsii$Proxy that = (CodegurureviewerRepositoryAssociationRepository.Jsii$Proxy) o;

            if (this.bitbucket != null ? !this.bitbucket.equals(that.bitbucket) : that.bitbucket != null) return false;
            if (this.codecommit != null ? !this.codecommit.equals(that.codecommit) : that.codecommit != null) return false;
            if (this.githubEnterpriseServer != null ? !this.githubEnterpriseServer.equals(that.githubEnterpriseServer) : that.githubEnterpriseServer != null) return false;
            return this.s3Bucket != null ? this.s3Bucket.equals(that.s3Bucket) : that.s3Bucket == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bitbucket != null ? this.bitbucket.hashCode() : 0;
            result = 31 * result + (this.codecommit != null ? this.codecommit.hashCode() : 0);
            result = 31 * result + (this.githubEnterpriseServer != null ? this.githubEnterpriseServer.hashCode() : 0);
            result = 31 * result + (this.s3Bucket != null ? this.s3Bucket.hashCode() : 0);
            return result;
        }
    }
}
