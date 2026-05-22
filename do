#!/bin/sh

FIRST_ARGUMENT="$1"
SECOND_ARGUMENT="$2"
THIRD_ARGUMENT="$3"
CURDIR="$(pwd)"


if [ $FIRST_ARGUMENT == "pub" ] 
then
  npx ts-node publish/publish.ts
fi


if [ $FIRST_ARGUMENT == "metacodi" ] 
then
  pnpm update --latest --recursive "@metacodi/*" -D
  pnpm i --workspace-root --save-peer "@metacodi/node-utils@latest"
  pnpm i --workspace-root --save-peer "@metacodi/node-api-client@latest"
fi

