#!/bin/bash
set -euo pipefail

APP_NAME=$1
IMAGE_NAME=$2
IMAGE_TAG=$3
INFRA_APP_NAME=$4

# Need to init module when running in CD since GitHub actions does a fresh checkout of repo
terraform -chdir=infra/$INFRA_APP_NAME/build-repository init
REGION=$(terraform -chdir=infra/$INFRA_APP_NAME/build-repository output -raw region)
IMAGE_REGISTRY=$(terraform -chdir=infra/$INFRA_APP_NAME/build-repository output -raw image_registry)
IMAGE_REPOSITORY_URL=$(terraform -chdir=infra/$INFRA_APP_NAME/build-repository output -raw "${APP_NAME}_image_repository_url")


echo "--------------------------"
echo "Publish release parameters"
echo "--------------------------"
echo "APP_NAME=$APP_NAME"
echo "IMAGE_NAME=$IMAGE_NAME"
echo "IMAGE_TAG=$IMAGE_TAG"
echo "REGION=$REGION"
echo "IMAGE_REGISTRY=$IMAGE_REGISTRY"
echo "IMAGE_REPOSITORY_URL=$IMAGE_REPOSITORY_URL"
echo "INFRA_APP_NAME=$INFRA_APP_NAME"
echo
echo "Authenticating Docker with ECR"
aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin $IMAGE_REGISTRY
echo
echo "Publishing image"
docker tag $IMAGE_NAME:$IMAGE_TAG $IMAGE_REPOSITORY_URL:$IMAGE_TAG
docker push $IMAGE_REPOSITORY_URL:$IMAGE_TAG
