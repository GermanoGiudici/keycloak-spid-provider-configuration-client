const {from, of, concat} = require('rxjs')
const {map, mergeMap, take} = require('rxjs/operators')
const {config, patchTemplate, enrichIdpWithConfigData} = require('./src/common')
const {
    httpGrabIdPsMetadata,
    httpCallKeycloakImportConfig,
    httpCallKeycloakCreateIdP,
    httpCallKeycloakDeleteIdP,
    httpCallKeycloakCreateAllMappers
} = require('./src/http')


const idPTemplate = JSON.parse(patchTemplate('./template/idpmodel.json'))


//recupero url metadati
var getOfficialSpididPsMetadata$ = from(httpGrabIdPsMetadata())
    .pipe(mergeMap(httpResponse => from(httpResponse.data.data.filter(idp => !config.singleIdp || idp.ipa_entity_code == config.singleIdp).map(idp => enrichIdpWithConfigData(idp)))));

if (config.createSpidTestIdP === 'true') {
    let spidTestIdPOfficialMetadata = {
        ipa_entity_code: config.spidTestIdPAlias,
        entity_id: config.spidTestIdPAlias,
        entity_name: config.spidTestIdPAlias,
        metadata_url: config.spidTestIdPMetadataURL,
        entity_type: 'IdP'
    }

    getOfficialSpididPsMetadata$ = concat(getOfficialSpididPsMetadata$, of(enrichIdpWithConfigData(spidTestIdPOfficialMetadata)))

}

if (config.createSpidValidatorIdP === 'true') {
    let spidValidatorIdPOfficialMetadata = {
        ipa_entity_code: config.spidValidatorIdPAlias,
        entity_id: config.spidValidatorIdPAlias,
        entity_name: config.spidValidatorIdPAlias,
        metadata_url: config.spidValidatorIdPMetadataURL,
        displayName: config.spidValidatorIdPDisplayName,
        entity_type: 'IdP'
    }

    getOfficialSpididPsMetadata$ = concat(getOfficialSpididPsMetadata$, of(enrichIdpWithConfigData(spidValidatorIdPOfficialMetadata)))

}

if (config.createSpidDemoIdP === 'true') {
    let spidDemoIdPOfficialMetadata = {
        ipa_entity_code: config.spidDemoIdPAlias,
        entity_id: config.spidDemoIdPAlias,
        entity_name: config.spidDemoIdPAlias,
        metadata_url: config.spidDemoIdPMetadataURL,
        hideOnLoginPage: "false",
        entity_type: 'IdP'
    }

    getOfficialSpididPsMetadata$ = concat(getOfficialSpididPsMetadata$, of(enrichIdpWithConfigData(spidDemoIdPOfficialMetadata)))

}

//getOfficialSpididPsMetadata$.subscribe(console.log)

//richiesta cancellazione degli idPs da keycloak
var deleteKeycloakSpidIdPs$ = getOfficialSpididPsMetadata$
    .pipe(mergeMap(spidIdPOfficialMetadata => from(httpCallKeycloakDeleteIdP(spidIdPOfficialMetadata.alias).then(httpResponse => spidIdPOfficialMetadata))))


//richiesta conversione in import-config model [idP,import-config-response]
var getKeycloakImportConfigModels$ = deleteKeycloakSpidIdPs$
    .pipe(mergeMap(spidIdPOfficialMetadata => from(httpCallKeycloakImportConfig(spidIdPOfficialMetadata.metadata_url).then(httpResponse => [spidIdPOfficialMetadata, httpResponse.data]))))

//trasformazione ed arricchimento => modello per creare l'idP su keycloak
var enrichedModels$ = getKeycloakImportConfigModels$
    .pipe(map(spidIdPOfficialMetadataWithImportConfigModel => {
        let [idPOfficialMetadata, importConfigModel] = spidIdPOfficialMetadataWithImportConfigModel
        let configIdp = {...idPTemplate.config, ...importConfigModel, ...idPOfficialMetadata.config}
        let firstLevel = {
            alias: idPOfficialMetadata.alias,
            displayName: idPOfficialMetadata.displayName,
        }
        let merged = {...idPTemplate, ...firstLevel}
        merged.config = configIdp
        return merged
    }))

//creazione dello spid idP su keycloak
var createSpidIdPsOnKeycloak$ = enrichedModels$
    .pipe(mergeMap(idPToCreateModel => from(httpCallKeycloakCreateIdP(idPToCreateModel).then(httpResponse => [idPToCreateModel.alias, httpResponse]))))

//creazione dei mappers per lo spid id
var createKeycloackSpidIdPsMappers$ = createSpidIdPsOnKeycloak$.pipe(mergeMap(idPAliasWithHttpCreateResponse => {
    let [alias, createResponse] = idPAliasWithHttpCreateResponse
    return from(httpCallKeycloakCreateAllMappers(alias).then(response => {
        return {alias, create_response: createResponse, mapper_response: response}
    }))
}))


createKeycloackSpidIdPsMappers$.subscribe(console.log)
