const {httpCallKeycloakGetIpds, httpCallKeycloakGetIpdDescription} = require('./src/http')
const {from, of} = require('rxjs')
const {map, mergeMap, toArray} = require('rxjs/operators')

const getKeycloakIdPs$ = from(httpCallKeycloakGetIpds()).pipe(mergeMap(httpResponse => from(httpResponse.data)))
const idpsModelToMerge$ = getKeycloakIdPs$
    .pipe(mergeMap(keycloakIdpRepresentation => from(httpCallKeycloakGetIpdDescription(keycloakIdpRepresentation.alias))))
    .pipe(map(response => response.data))
    .pipe(toArray())

idpsModelToMerge$.subscribe(console.log)
