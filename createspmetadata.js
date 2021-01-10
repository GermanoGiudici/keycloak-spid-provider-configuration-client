const {httpCallKeycloakGetIpds, httpCallKeycloakGetIpdDescription} = require('./src/http')
const {getAssertionConsumerServiceToken, getCertificateToken} = require('./src/spmetadataparser')
const {from, of} = require('rxjs')
const {map, mergeMap, toArray, filter, take} = require('rxjs/operators')

//recupero idp configurati su keycloak
const getKeycloakIdPs$ = from(httpCallKeycloakGetIpds())
    .pipe(mergeMap(httpResponse => from(httpResponse.data)))
    .pipe(filter(keycloakIdpRepresentation => keycloakIdpRepresentation.providerId === 'spid'))

//recupero i dati che servono per produrre il file e li trasformo nel modello atteso per il merge
const idpsModelToMerge$ = getKeycloakIdPs$
    .pipe(mergeMap(keycloakIdpRepresentation => from(httpCallKeycloakGetIpdDescription(keycloakIdpRepresentation.alias).then(httpResponse => [keycloakIdpRepresentation, httpResponse.data]))))
    .pipe(map(tupla => {
        let [keycloakIdpRepresentation, httpResponse] = tupla
        let assertionCostumerServiceXmlToken = getAssertionConsumerServiceToken(httpResponse, keycloakIdpRepresentation.config.attributeConsumingServiceIndex)
        let certificateToken = getCertificateToken(httpResponse)
        keycloakIdpRepresentation['assertionCostumerServiceXmlToken'] = assertionCostumerServiceXmlToken
        keycloakIdpRepresentation['certificateToken'] = certificateToken
        return keycloakIdpRepresentation
    }))
    .pipe(toArray())

idpsModelToMerge$
    .pipe(map(JSON.stringify))
    .pipe(map(data=>{
            const fs = require('fs')
            fs.writeFile("output.json", data, 'utf8', function (err) {
                    if (err) {
                            console.log("An error occured while writing JSON Object to File.");
                            return console.log(err);
                    }

                    console.log("JSON file has been saved.");
            });
    }))
    .subscribe(console.log)
//idpsModelToMerge$.subscribe(data => console.log(JSON.stringify(data)))
