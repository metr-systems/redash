#!/bin/bash

function print_help() {
echo """
usage: $0 [--tag <tag>] [--build-only]

Builds and (optionally) tags and pushes docker images to METRs private registry.

Optional arguments:

  -t --tag		The tag to be used for the final docker
     			image in the repository.

  --build-only	      	Only builds the images, without tagging and
  		      	pushing to the registry.

  --no-cache		Do not use cache when building the image.

"""

}


BUILD_ONLY="False"
DOCKER_CACHE_FLAG=""

while [ -n "$1" ]
do
    case $1 in
	-t|--tag)
	    shift
	    TAG="$1"
	    shift;
	    ;;
	--build-only)
	    BUILD_ONLY="True"
	    shift
	    ;;

	--no-cache)
	    DOCKER_CACHE_FLAG="--no-cache"
	    shift
	    ;;
	*)
	    print_help
	    exit 0
	    ;;
    esac
done


if [ -z $TAG ] && [ $BUILD_ONLY != "True" ]
then
	current_branch=$(git rev-parse --abbrev-ref HEAD )
	if [ $current_branch = "metr-main" ]
	then
		TAG=$(git describe --tags metr-main)
	else
		echo "You need to provide a tag in order to push the image to registry."
		echo "If you only want to build the image, use --build-only."
		exit 1
	fi
fi

set -e


docker build $DOCKER_CACHE_FLAG --platform x86_64 -t redash-metr .


function tag_and_push_image() {
    NAME="$1"
    docker tag ${NAME} swr.eu-de.otc.t-systems.com/metr/${NAME}:${TAG}
    docker push swr.eu-de.otc.t-systems.com/metr/${NAME}:${TAG}
}


if [ $BUILD_ONLY != "True" ]
then
    echo "Tagging images with $TAG and pushing to registry"
    tag_and_push_image redash-metr
fi
