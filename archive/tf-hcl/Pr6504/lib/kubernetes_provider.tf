data "aws_eks_cluster" "current" {
  name       = aws_eks_cluster.main.name
  depends_on = [aws_eks_cluster.main]
}

data "aws_eks_cluster_auth" "current" {
  name       = aws_eks_cluster.main.name
  depends_on = [aws_eks_cluster.main]
}
