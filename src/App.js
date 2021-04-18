// Import react components
import * as React from 'react';
import {useEffect, useState} from 'react';
import {Dimmer, Loader, SegmentGroup} from "semantic-ui-react";
// sia & skynet ecosystem
import {genKeyPairFromSeed, SkynetClient} from "skynet-js";
import {ContentRecordDAC} from "@skynethq/content-record-library";
// custom
import './App.css';
import IdeaSharedListSegment from "./components/idea-shared-list-segment";
import FooterSegment from "./components/footer-segment";
import MemberSegment from "./components/member-segment";
import HeaderSegment from "./components/header-segment";


// Comment this line out in order to get debug logs.
// console.debug = function () {}


// Determine if we running on local machine.
const isLocalhost = window.location.hostname === 'localhost';
console.debug(`Running on Localhost: ${isLocalhost}`);


// We'll define a portal to allow for developing on localhost.
// When hosted on a skynet portal, SkynetClient doesn't need any arguments.
const skynetPortal = isLocalhost ? 'https://siasky.net/' : undefined;
const skynetClient = new SkynetClient(skynetPortal);


// Global secret for generating seed.
const SKAPP_SECRET = "sup3rs3cr3t";


const SKAPP_DATA_KEY = isLocalhost ?  "howabouts-dev" : "howabouts-prod"
const SKAPP_DATA_DOMAIN = isLocalhost ? "how-about-skapp-dev" : "how-about-skapp-prod";
const MYSKY_LIKES_FILE_PATH = SKAPP_DATA_DOMAIN + "/mysky-likes";
const MYSKY_PROPOSALS_FILE_PATH = SKAPP_DATA_DOMAIN + "/mysky-proposals";


// Used to call method against the Content Record DAC's API.
const contentRecord = new ContentRecordDAC();


// Actual app.
function App() {
    // Define reused constants.
    const SKAPP_PRIVATE_KEY = genKeyPairFromSeed(SKAPP_SECRET).privateKey;
    const SKAPP_PUBLIC_KEY = genKeyPairFromSeed(SKAPP_SECRET).publicKey;
    const ERROR_MSG = "***Something went wrong here :(***";


    // Define app state helpers.
    const [mySky, setMySky] = useState();
    const [userID, setUserID] = useState();
    const [loggedIn, setLoggedIn] = useState();
    const [loading, setLoading] = useState(false);
    const [displaySuccess, setDisplaySuccess] = useState(false);
    const [idea, setIdea] = useState();
    const [ideaHeadline, setIdeaHeadline] = useState();
    const [howAboutData, setHowAboutData] = useState({howabouts: []});
    const [howAboutsLikedByMember, setHowAboutsLikedByMember] = useState([]);


    // On initial run, start initialization of MySky.
    useEffect(() => {
        // define async setup function
        async function initMySky() {
            setLoading(true);
            try {
                // Load invisible iframe and define app's data domain need for permission to write.
                const mySky = await skynetClient.loadMySky(SKAPP_DATA_DOMAIN, { dev: true /*isLocalhost*/});
                // Load necessary DACs and permissions.
                await mySky.loadDacs(contentRecord);
                // Check if the user is already logged in with permissions.
                const loggedIn = await mySky.checkLogin();
                console.debug(loggedIn ? `Already logged into MySky;` : `MySky requires login;`);
                // Set react state for login status and to access mySky in rest of app.
                setMySky(mySky);
                setLoggedIn(loggedIn);
                if (loggedIn) {
                    setUserID(await mySky.userID());
                    await handleLoadMySkyMemberLikes();
                }
            } catch (e) {
                console.error(`Error while initializing MySky: ${e.message}`);
            } finally {
                setLoading(false);
            }
        }

        // Init MySky
        initMySky().then(() => {
            console.debug(`MySky initialized;`);

            // Load related data this skapp
            try {
                setLoading(true);
                readSkappDataFromSkyDB(SKAPP_DATA_KEY).then((res) => {
                    if (res.data) {
                        setHowAboutData(res.data);
                    } else {
                        setHowAboutData({howabouts: []});
                    }
                });
            } finally {
                setLoading(false);
            }
        });

        // Specify how to clean up after this effect:
        return function cleanup() {
            async function destroyMySky() {
                setLoading(true);
                try {
                    if (mySky) {
                        await mySky.destroy();
                    }
                } catch (e) {
                    console.error(`Error while destroying MySky: ${e.message}`);
                } finally {
                    setLoading(false);
                }
            }

            destroyMySky().then(() => {
                console.debug('MySky has been destroyed.');
            });
        };
    }, [mySky]);


    // Use this to print debug information.
    const handleDebug = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            console.debug(`portal=${await skynetClient.portalUrl()}`);
            setLoading(false);
        } catch (e) {
            throw new Error(e.message);
        } finally {
            setLoading(false);
        }
    }


    // Returns all shared proposals the user has liked as skylink array.
    async function handleLoadMySkyMemberLikes() {
        setLoading(true);
        try {
            if (mySky) {
                mySky.getJSON(MYSKY_LIKES_FILE_PATH).then((res) => {
                    if (res.data) {
                        setHowAboutsLikedByMember(res.data);
                    }
                    console.debug(`Loaded like data: res=${JSON.stringify(res)}`);
                    return res;
                });
            }
        } catch (e) {
            console.error(`Error while loading member likes; status=${e.message}`);
        } finally {
            setLoading(false);
        }
    }


    // Handle a user's login action.
    async function handleMySkyLogin(event) {
        event.preventDefault();
        setLoading(true);
        try {
            // Try login again, opening popup. Returns true if successful.
            const status = await mySky.requestLoginAccess();
            // Apply react status.
            setLoggedIn(status);
            if (status) {
                // Apply react state.
                await mySky.userID().then((res) => {
                    console.debug(`userID=${res}`);
                    setUserID(res);
                });
                // Load the likes of the user.
                await handleLoadMySkyMemberLikes();
            } else {
                console.error(`Error while log into MySky; status=${status}`);
            }
        } finally {
            setLoading(false);
        }
    }


    // Handle a user's logout action.
    async function handleMySkyLogout(event) {
        event.preventDefault();
        setLoading(true);
        try {
            console.debug('handleMySkyLogout()');
            await mySky.logout();
            // Apply react state.
            setLoggedIn(false);
            setUserID('');
            setLoading(false);
            setIdea('');
            setIdeaHeadline('');
            setHowAboutsLikedByMember([]);
        } catch (e) {
            console.error(`Error while logging out from MySky: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }


    // Handle a user's proposal save action.
    async function handleSetProposal (event) {
        event.preventDefault();
        setLoading(true);
        try {
            const proposal = {text: idea ?? ERROR_MSG};
            await handleMySkyWrite(MYSKY_PROPOSALS_FILE_PATH, proposal).then((res) => {
                saveUserHowAboutToSkapp(res.skylink, 0, ideaHeadline).then((res) => {
                    console.debug(`Saved how about to skapp data: ${JSON.stringify(res)}`);
                });

                // Tell contentRecord that we created a new proposal
                contentRecord.recordNewContent({
                    skylink: res.skylink
                });

                // Reset idea and headline states
                setIdea('');
                setIdeaHeadline('');
            });
        } catch (error) {
            console.error(`Error while handling set proposal: ${error.message}`);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }


    // Handle a user's write action to MySky.
    async function handleMySkyWrite(filePathToWriteTo, toWriteJson) {
        try {
            console.debug(`MySky.setJSON; filePathToWriteTo=${filePathToWriteTo};`);
            // Use setJSON to save the user's information to MySky file
            return await mySky.setJSON(filePathToWriteTo, toWriteJson).then((res) => {
                console.debug(`MySky.setJSON; filePathWrittenTo=${filePathToWriteTo}; res=${JSON.stringify(res)}`);
                return res;
            });
        } catch (e) {
            console.error(`Error while writing data to MySky -> setJSON: ${e.message}`);
        }
    }


    // Reads skapp related data from sky db.
    async function readSkappDataFromSkyDB(dataKey) {
        try {
            return await skynetClient.db.getJSON(SKAPP_PUBLIC_KEY, dataKey).then((res) => {
                console.debug(`db.getJSON=${JSON.stringify(res)}`);
                return res;
            })
        } catch (e) {
            console.error(`Error reading skapp data from SkyDB: ${e.message}`);
        }
    }


    // Writes skapp related data to skydb.
    async function writeSkappDataToSkyDB(dataKey, toWriteJson) {
        try {
            return await skynetClient.db.setJSON(SKAPP_PRIVATE_KEY, dataKey, toWriteJson).then((res) => {
                console.debug(`SkyDB.setJSON=${JSON.stringify(res)}`);
                return res;
            })
        } catch (e) {
            console.error(`Error writing skapp data to SkyDB: ${e.message}`);
        }
    }


    // Saves a user's how about to skydb.
    async function saveUserHowAboutToSkapp(howAboutSkylink, likes, header) {
        try {
            const howAboutJson = {
                skylink: howAboutSkylink,
                likes: likes,
                metadata: {
                    header: header ?? ERROR_MSG,
                    creator: generateDynamicName(),
                    creationDate: new Date().toDateString()
                }
            };
            const index = howAboutData.howabouts.findIndex(h => h.skylink === howAboutSkylink);
            if (index >= 0) {
                const old = howAboutData.howabouts[index];
                howAboutJson.metadata.creationDate = old.metadata.creationDate;
                howAboutJson.metadata.creator = old.metadata.creator;
                howAboutData.howabouts[index] = howAboutJson;
                setHowAboutData(howAboutData);
            } else {
                howAboutData.howabouts.push(howAboutJson);
                setHowAboutData(howAboutData);
            }

            return await writeSkappDataToSkyDB(SKAPP_DATA_KEY, howAboutData).then((res) => {
                return res;
            });
        } catch (e) {
            console.error(`Error saving skapp member to SkyDB: ${e.message}`);
        }
    }


    // Lazy loads the content of a shared proposal directly from a skylink.
    async function handleLazyLoad(skylink) {
        const {data} = await skynetClient.getFileContent(skylink);
        // Tell contentRecord that we requested the details of a proposal
        await contentRecord.recordInteraction({
            skylink: skylink,
            metadata: {action: 'readMoreAction'}
        });
        return data._data.text;
    }


    // Returns a dynamic name, e.g. for a member.
    function generateDynamicName() {
        const names = ["David", "Chris", "Steve", "Matt", "Manasi", "PJ", "Marcin", "Karol", "Ivaylo", "Filip", "Nicole", "Daniel"]
        const dynamicName = names[Math.floor(Math.random() * names.length)];
        const suffix = Math.random().toString(16).substr(2, 8);
        console.debug(`Generated dynamic name: ${dynamicName}; Suffix: ${suffix}`);
        return dynamicName.concat("-", suffix);
    }


    // Handles a user's like/unlike action.
    async function handleLikeAction(event, likedHowabout, header) {
        setLoading(true);
        try {
            console.debug(`App.handleLikeAction: likedHowAbout=${JSON.stringify(likedHowabout)}`);
            console.debug(`App.handleLikeAction: currentSkappData=${JSON.stringify(howAboutData)}`);
            console.debug(`App.handleLikeAction: howAboutsLikedByMember=${JSON.stringify(howAboutsLikedByMember)}`);

            // Determine if the user has liked the first time or unlike a previous one.
            const firstTimeLike = howAboutsLikedByMember.findIndex((k) => k.skylink === likedHowabout.skylink) < 0;
            if (firstTimeLike) {
                // Save user's like to MySky and increase like counter on skapp's SkyDB.
                console.debug(`App.handleLikeAction: saving like to skapp's SkyDB and MySky.`);

                // User
                const likedContent = {skylink: likedHowabout.skylink};
                howAboutsLikedByMember.push(likedContent);
                await handleMySkyWrite(MYSKY_LIKES_FILE_PATH, howAboutsLikedByMember);
                // Skapp
                const modifiedLikes = likedHowabout.likes + 1;
                await saveUserHowAboutToSkapp(likedHowabout.skylink, modifiedLikes, header);
            } else {
                // Remove user's like from MySky and decrease like counter on skapp's SkyDB.
                console.debug(`App.handleLikeAction: removing like from skapp's SkyDB and MySky.`);
                // User
                const filtered = howAboutsLikedByMember.filter(h => h.skylink !== likedHowabout.skylink);
                await handleMySkyWrite(MYSKY_LIKES_FILE_PATH, filtered).then(() => {
                    setHowAboutsLikedByMember(filtered);
                });

                // Skapp
                const modifiedLikes = likedHowabout.likes - 1;
                await saveUserHowAboutToSkapp(likedHowabout.skylink, modifiedLikes, header);
            }
            // Tell contentRecord that we updated the likes
            await contentRecord.recordInteraction({
                skylink: likedHowabout.skylink,
                metadata: {action: 'updatedLikes'}
            });
        } catch (e) {
            console.error(`Error while handling like: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }


    // Define args to be passed into forms.
    const formProps = {
        idea,
        ideaHeadline,
        mySky,
        loggedIn,
        userID,
        loading,
        displaySuccess,
        howAboutData,
        howAboutsLikedByMember,
        setMySky,
        setLoggedIn,
        setDisplaySuccess,
        setIdea,
        setIdeaHeadline,
        setHowAboutData,
        setHowAboutsLikedByMember,

        handleDebug,
        handleSetProposal,
        handleMySkyLogin,
        handleMySkyLogout,

        handleLazyLoad,
        handleLikeAction,
        handleLoadMySkyMemberLikes
    };


    // This is the actual layout; not a beauty but it's something :)
    return (
        <div
            className="bg-background min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <SegmentGroup>
                    <HeaderSegment {...formProps}/>
                    <Dimmer active={loading}>
                        <Loader indeterminate={true} active={loading}>Working...</Loader>
                    </Dimmer>
                    <MemberSegment  {...formProps}/>
                    <IdeaSharedListSegment {...formProps}/>
                    <FooterSegment {...formProps}/>
                </SegmentGroup>
            </div>
        </div>
    );
}

export default App;
