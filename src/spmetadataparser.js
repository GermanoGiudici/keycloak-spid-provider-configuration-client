const acRE = /<md:AssertionConsumerService.*\/>/gms
const isDefaultRE = /isDefault.*=.*"true"|"false"/gms
const certificateRE = /<ds:X509Certificate>(.[^(><.)]+)<\/ds:X509Certificate>/s

exports.getAssertionConsumerServiceToken = function (toParse) {
    let myMatches = toParse.match(acRE);
    let result = myMatches[0].replace(isDefaultRE, "")
    console.log('assertionConsumerServiceToken:', result)
    return result
}
exports.getCertificateToken = function (toParse) {
    let myMatches = toParse.match(certificateRE);
    let result = myMatches[1].replace(/^\s+|\s+$/g, '')
    console.log('getCertificateToken:', result)
    return result
}

