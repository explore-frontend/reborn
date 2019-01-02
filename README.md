# @ks/vue-apollo-model

## Install

> TODO

## Develop

```bash
# in current dir
yarn
npm run build
npm link

# in project dir
npm link @ks/vue-apollo-model

```

修改 tsconfig.json

```
"compilerOptions" {
     ....
    "baseUrl": "./",
    "paths": {
        "vue": ["node_modules/vue"],
        "vue/*": ["node_modules/vue/*"],
        "vue-router": ["node_modules/vue-router"],
        "apollo-client": ["node_modules/apollo-client"]
    }
   ...
}

```
