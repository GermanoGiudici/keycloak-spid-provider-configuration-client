# Configuration Client
It allows the configuration of a Keycloak instance with the https://github.com/italia/keycloak-spid-provider plugin already installed.

## Requirements
* node
* npm

## Configuration
```
npm install
```

copy `.env-example` to `.env`, configure it and wipe out the comments then


```
npm run create-idps
```
downloads the metadata from the official IdP repository (https://registry.spid.gov.it/assets/data/idp.json) and builds all the SPID identity providers in Keycloak. It creates also all the suggested mappers (https://github.com/italia/spid-keycloak-provider/wiki/Mapping-SPID-attributes).

If you want to have official AgID SPID Demo Validator (https://demo.spid.gov.it/validator) enabled, set the following `.env` file properties

```
createSpidDemoIdP = true 
```

If you want to have official AgID SPID Validator (https://validator.spid.gov.it) enabled, set the following `.env` file properties

```
createSpidValidatorIdP = true 
``` 

If you have a spid test idP (https://github.com/italia/spid-testenv2) deployed somewhere, set the following `.env` file properties

```
createSpidTestIdP = true 
spidTestIdPAlias = spid-testenv2
spidTestIdPMetadataURL = http://localhost:8088/metadata
```

This project is released under the Apache License 2.0, same as the main Keycloak
package.