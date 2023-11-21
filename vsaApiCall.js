import axios from 'axios';
import crypto from 'crypto'; // TODO: use core node crypto.
import https from 'https';
import { useProxy, proxyUrl, agent, baseUrl, randName,  iterateUrlObj } from './index.js';

function genAuthToken(payload) {
	const username = payload.usernameAPI;
	if (payload.password) {
		const rand = Math.floor(Math.random() * 1000000);
		const password = payload.password;

		const RawSHA256Hash = crypto.createHash('sha256').update(password).digest('hex');
		const CoveredSHA256HashTemp = crypto.createHash('sha256').update(password+username).digest('hex');
		const CoveredSHA256Hash = crypto.createHash('sha256').update(CoveredSHA256HashTemp+rand).digest('hex');

		const RawSHA1Hash = crypto.createHash('sha1').update(password).digest('hex');
		const CoveredSHA1HashTemp = crypto.createHash('sha1').update(password+username).digest('hex');
		const CoveredSHA1Hash = crypto.createHash('sha1').update(CoveredSHA1HashTemp+rand).digest('hex');

		const authStringVar = `user=${username},pass2=${CoveredSHA256Hash},pass1=${CoveredSHA1Hash},rpass2=${RawSHA256Hash},rpass1=${RawSHA1Hash},rand2=${rand}`;
		const authStringVarbase64Var = new Buffer(authStringVar).toString('base64');
		if (authStringVarbase64Var) {
			return authStringVarbase64Var;
		} else {
			throw new Error('genAuthToken called but unable to generate auth token - payload is '+JSON.stringify(payload));
		}
	} else if (payload.authToken) {
		const authStringVar = `${username}:${payload.authToken}`;
		return Buffer.from(authStringVar).toString("base64");
	} else {
		console.log('genAuthToken - missing auth credentials, full payload: ', payload);
		throw new Error('error: missing auth credentials: ');
	}
}

export default function vsaApiCall(payload, i) {
	let token;
	iterateUrlObj.iterateUrlNum = i;
	// use the endpoint we are being sent.
	let requestEndpoint = payload.endpoint;
	// we can be called with no method - default to GET.
	let method = payload.method || 'GET';
	// authentication parameters for authentication and getting a bearer token.
	let optionalParameters = payload.optionalParameters;
	if (!requestEndpoint){
		throw new Error('vsaAPICall - endpoint missing!');
	}
	if (!baseUrl){
		throw new Error('vsaAPICall - baseUrl missing!');
	}
	// if the callee typod the method, catch it.
	if (!method || (method !== 'GET' && method !== 'PUT' && method !== 'POST')){
		throw new Error('vsaAPICall - method missing or invalid! method is '+method);
	}
	// init the variable that lets us decide if we are authenticating or requesting data.
	let headerAuthType;
	// if we were not initially sent a token, OR we dont yet have one stored from a previous authentication attempt
	// we default to trying to authenticate in order to get a token.
	if (!payload.token) {
		method = 'GET';
		requestEndpoint = '/auth';
		// this isnt really the token, but our authentication request hash.
		token = genAuthToken(payload);
		headerAuthType = 'Basic';
		optionalParameters = undefined;
	} else {
		// we already have a token, time to request our data with the Bearer token.
		token = payload.token;
		headerAuthType = 'Bearer';
	}
	// console.log(`vsaAPICall: requesting data from "${endpoint}" for server "${baseUrl}" with token "${token}" and method "${method}" - optionalParameters are "${JSON.stringify(optionalParameters)}"`);
	try {
		// make the request. we may be an auth request, or we may be a normal request.
		return new Promise((resolve, reject) => {
			const url = baseUrl+`/api/v1.0${requestEndpoint}`;
			const requestObj = {
				url,
				method,
			};
			// this sets the query string if we were called with optionalParameters
			// if (method === 'GET' && optionalParameters) {
			// 	requestObj.qs = optionalParameters;
			// }
			// sets the JSON payload we sent if we are making a PUT/POST call
			if ((method === 'PUT' || method === 'POST') && optionalParameters) {
				requestObj.data = optionalParameters;
			}
			requestObj.headers = {
				'Authorization': `${headerAuthType} ${token}`
			};
			if (useProxy && proxyUrl && proxyUrl.length && agent) {
				requestObj.agent = agent;
			}
			requestObj.httpsAgent= new https.Agent({
				rejectUnauthorized: false,
			});
			console.log('axios requestObj url: ', requestObj.url);
			try {
				axios(requestObj)
					.then(function (response) {
						const Result = response && response.data && response.data.Result;
						if (response.status === 200) {
							if (Result && Result.Token) {
								// We have a token - this is an authentication request.
								// The auth request includes the tenant Id which we need in other functions. Store it.
								// Store the token to be used for our next request.
								payload.token = Result.Token;
								// Now run a request again since we are authenticated.
								console.log('*** SUCCESSFULLY AUTHENTICATED ***');
								resolve(vsaApiCall(payload, i));
							} else {
								// we did not hit an error, and we are not receiving an authentication request result - return the result, and return the tenantId we stored from our earlier authentication request.
								console.log('response success: ', response.status);
								resolve(Result);
							}
						} else if (response.status === 204) {
							console.log('response success: ', response.status);
							resolve(Result);
						}  else {
							console.log('response ERROR - statusCode: ', response.status);
							console.log('response ERROR - requestObj: ', requestObj);
							reject();
						}
					});
			} catch (e) {
				console.log('vsaAPICall - error attempting to make request - requestObj: ', requestObj,' || error: ', e);
				reject();
			}
		});
	} catch (e) {
		throw new Error(`vsaAPICall - error - error code: ${e.statusCode} | message: ${(e.error && e.error.Error) || e.error || JSON.stringify(e)}`);
	}
}

