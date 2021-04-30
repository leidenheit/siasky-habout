// Determine if we running on local machine.
import {genKeyPairFromSeed, SkynetClient} from "skynet-js";
import {ContentRecordDAC} from "@skynethq/content-record-library";
import {UserProfileDAC} from "@skynethub/userprofile-library";

export const isLocalhost = window.location.hostname === 'localhost';
console.debug(`Running on Localhost: ${isLocalhost}`);


// Comment this line out in order to get debug logs.
if (!isLocalhost) {
    console.debug = function () {
    }
}


// We'll define a portal to allow for developing on localhost.
// When hosted on a skynet portal, SkynetClient doesn't need any arguments.
export const skynetPortal = isLocalhost ? 'https://siasky.net/' : undefined;
export const skynetClient = new SkynetClient(skynetPortal);


// Global secret for generating seed.
export const SKAPP_SECRET = "sup3rs3cr3t";
export const SKAPP_PRIVATE_KEY = genKeyPairFromSeed(SKAPP_SECRET).privateKey;
export const SKAPP_PUBLIC_KEY = genKeyPairFromSeed(SKAPP_SECRET).publicKey;


export const SKAPP_DATA_KEY = isLocalhost ? "howabouts-dev-release-candidate-r42" : "howabouts-prod-beta-r42"
export const SKAPP_DATA_DOMAIN = isLocalhost ? "how-about-skapp-dev-release-candidate-r42" : "how-about-skapp-prod-beta-r42";
export const SKAPP_DATA_KEY_COMMENTS = isLocalhost ? "howabouts-dev-comment-release-candidate-r42" : "howabouts-prod-comments-beta-r42"
export const MYSKY_LIKES_FILE_PATH = SKAPP_DATA_DOMAIN + "/mysky-likes";
export const MYSKY_PROPOSALS_FILE_PATH = SKAPP_DATA_DOMAIN + "/mysky-proposals";


// Used to call method against the Content Record DAC's API.
export const contentRecord = new ContentRecordDAC();
// Used to call method against the User Profile DAC's API.
export const userProfile = new UserProfileDAC();

export const noop = () => {};