// Import react components
import * as React from 'react';
import {useEffect, useState} from 'react';
import {Button, Dimmer, Loader, SegmentGroup} from "semantic-ui-react";
// custom
import './App.css';
import IdeaSharedListSegment from "./components/idea-shared-list-segment";
import FooterSegment from "./components/footer-segment";
import MemberSegment from "./components/member-segment";
import HeaderSegment from "./components/header-segment";
import {UserProfileDAC} from "@skynethub/userprofile-library";

// redux
import {connect} from 'react-redux';
import * as ActionTypes from "./store/action-types";
import {
    contentRecord, isLocalhost,
    MYSKY_LIKES_FILE_PATH, SKAPP_DATA_DOMAIN,
    SKAPP_DATA_KEY, skynetClient,
    userProfile
} from "./utils/skynet-utils";
import {
    SET_IS_LOGGED_IN,
    SET_MYSKY_INSTANCE,
    SET_MYSKY_USER_PROPOSALS_LIKED,
    SET_MYSKY_USER_PUBLIC_KEY
} from "./store/action-types";
import {
    readJsonFromMySky, readJsonFromSkyDB,


} from "./utils/skynet-ops";

/*
// Determine if we running on local machine.
const isLocalhost = window.location.hostname === 'localhost';
console.debug(`Running on Localhost: ${isLocalhost}`);


// Comment this line out in order to get debug logs.
if (!isLocalhost) {
    console.debug = function () {
    }
}


// We'll define a portal to allow for developing on localhost.
// When hosted on a skynet portal, SkynetClient doesn't need any arguments.
const skynetPortal = isLocalhost ? 'https://siasky.net/' : undefined;
const skynetClient = new SkynetClient(skynetPortal);


// Global secret for generating seed.
const SKAPP_SECRET = "sup3rs3cr3t";


const SKAPP_DATA_KEY = isLocalhost ? "howabouts-dev-release-candidate-r42" : "howabouts-prod-beta-r42"
const SKAPP_DATA_DOMAIN = isLocalhost ? "how-about-skapp-dev-release-candidate-r42" : "how-about-skapp-prod-beta-r42";
const SKAPP_DATA_KEY_COMMENTS = isLocalhost ? "howabouts-dev-comment-release-candidate-r42" : "howabouts-prod-comments-beta-r42"
const MYSKY_LIKES_FILE_PATH = SKAPP_DATA_DOMAIN + "/mysky-likes";
const MYSKY_PROPOSALS_FILE_PATH = SKAPP_DATA_DOMAIN + "/mysky-proposals";


// Used to call method against the Content Record DAC's API.
const contentRecord = new ContentRecordDAC();
// Used to call method against the User Profile DAC's API.
const userProfile = new UserProfileDAC();
*/

// Actual app.
function App({mySkyInstance,  mySkyUserPublicKey, isLoggedIn, proposalRecords, mySkyUserProposalsLiked, dispatch}) {

    const [isLoading, setIsLoading] = useState(false);

    // On changes to logged in state we use the effect to load the likes of the member.
    useEffect(() => {
        async function prepareLikes() {
            const likes = await readJsonFromMySky(mySkyInstance, MYSKY_LIKES_FILE_PATH);
            dispatch({type: SET_MYSKY_USER_PROPOSALS_LIKED, payload: likes.data ?? []});
        }

        if (isLoggedIn && mySkyInstance) {
            prepareLikes();
        }
    }, [isLoggedIn, mySkyInstance]);

    // On initial run, start initialization of MySky.
    useEffect(() => {
        // define async setup function
        async function initMySky() {
            try {
                setIsLoading(true);
                // Load invisible iframe and define app's data domain need for permission to write.
                const mySky = await skynetClient.loadMySky(SKAPP_DATA_DOMAIN, {dev: isLocalhost, debug: false /*TODO isLocalhost*/});
                // Load necessary DACs and permissions.
                await mySky.loadDacs(contentRecord, userProfile);
                // Check if the user is already logged in with permissions.
                const loggedIn = await mySky.checkLogin();
                console.debug(loggedIn ? `Already logged into MySky;` : `MySky requires login;`);
                // Set react state for login status and to access mySky in rest of app.
                // setMySky(mySky);
                dispatch({ type: SET_IS_LOGGED_IN, payload: loggedIn});
                dispatch({ type: SET_MYSKY_INSTANCE, payload: mySky });
                // setLoggedIn(loggedIn);
                if (loggedIn) {
                    const userID = await mySky.userID();
                    dispatch({ type: SET_MYSKY_USER_PUBLIC_KEY, payload: userID});
                }
            } catch (e) {
                console.error(`Error while initializing MySky: ${e.message}`);
            } finally {
                setIsLoading(false);
            }
        }

        // Init MySky
        initMySky().then(() => {
            console.debug(`MySky initialized;`);

            // Load related data this skapp
            try {
                setIsLoading(true);
                readJsonFromSkyDB(SKAPP_DATA_KEY).then((res) => {
                    if (res?.data) {
                        dispatch({type: ActionTypes.SET_PROPOSAL_RECORDS, payload: res.data})
                    }
                });
            } finally {
                setIsLoading(false);
            }
        });

        // Specify how to clean up after this effect:
        return function cleanup() {
            async function destroyMySky() {
                setIsLoading(true);
                try {
                    if (mySkyInstance) {
                        await mySkyInstance.destroy();
                        dispatch({ type: SET_MYSKY_INSTANCE, payload: null});
                    }
                } catch (e) {
                    console.error(`Error while destroying MySky: ${e.message}`);
                } finally {
                    setIsLoading(false);
                }
            }

            destroyMySky().then(() => {
                console.debug('MySky has been destroyed.');
            });
        };
    }, []);


    // Use this to print debug information.
    const handleDebug = async () => {

        console.debug(`Debugging Outputs:
            ${await skynetClient.portalUrl()}
            isLoading=${isLoading}
            isLoggedIn=${isLoggedIn}
            dispatchIsNotNull=${dispatch !== null}
            mySkyInstance=${mySkyInstance}
            mySkyUserPublicKey=${mySkyUserPublicKey}
            mySkyUserProposalsLiked=${JSON.stringify(mySkyUserProposalsLiked)}
            proposalRecords=${JSON.stringify(proposalRecords)}`);
    }


    // Handle a user's login action.
    /*
    async function handleMySkyLogin(event) {
        event.preventDefault();
        setLoading(true);
        try {
            // Try login again, opening popup. Returns true if successful.
            const status = await mySky.requestLoginAccess();
            // Apply react status.
            dispatch({ type: SET_IS_LOGGED_IN, payload: status});
            setLoggedIn(status);
            if (status) {
                // Apply react state.
                await mySky.userID().then((res) => {
                    console.debug(`userID=${res}`);
                    setUserID(res);
                });
                // Load the likes of the user.
                await handleLoadMySkyMemberLikes(mySky);
            } else {
                console.error(`Error while log into MySky; status=${status}`);
            }
        } finally {
            setLoading(false);
        }
    }
     */


    // Handle a user's logout action.
    /*
    async function handleMySkyLogout(event) {
        event.preventDefault();
        setLoading(true);
        try {
            console.debug('handleMySkyLogout()');
            await mySky.logout();
            // Apply react state.

            dispatch({ type: SET_IS_LOGGED_IN, payload: false});
            setLoggedIn(false);
            setUserID('');
            setLoading(false);
            setIdea('');
            setIdeaHeadline('');
            setFileSkylink('');
            setFile('');
            setHowAboutsLikedByMember([]);
        } catch (e) {
            console.error(`Error while logging out from MySky: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }
     */


    // Handle a user's proposal save action.
    /* TODO marked to delete
    async function handleSetProposal(event, headlineText, detailText, imageFile) {
        event.preventDefault();
        setLoading(true);
        try {
            // When provided, upload image of proposal.
            let imageSkylinkUrl = null;
            if (imageFile) {
                console.debug(`Proposal has an image to be uploaded: ${JSON.stringify(imageFile)}`);
                const {skylink} = await skynetClient.uploadFile(imageFile);
                // skylinks start with \`sia://\` and don't specify a portal URL
                // we can generate URLs for our current portal though.
                imageSkylinkUrl = await skynetClient.getSkylinkUrl(skylink);
                console.debug(`Image uploaded to Skynet: ${JSON.stringify(imageSkylinkUrl)}`);
            }

            const proposal = {
                text: detailText ?? ERROR_MSG,
                imageSkylink: imageSkylinkUrl ?? null
            };
            await writeJsonToMySky(mySky, MYSKY_PROPOSALS_FILE_PATH, proposal).then((res) => {
                saveUserHowAboutToSkapp(res.dataLink, null, 0, headlineText).then((res) => {
                    console.debug(`Saved how about to skapp data: ${JSON.stringify(res)}`);
                });
                recordNew(res.dataLink);

                // Reset idea and headline states
                setIdea('');
                setIdeaHeadline('');
                setFile('');
                setFileSkylink('');
            });
        } catch (error) {
            console.error(`Error while handling set proposal: ${error.message}`);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }
    */

    /*
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
     */

    /* TODO marked to delete
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
    */

    /* TODO marked to delete
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
     */


    // Saves a user's how about to skydb.
    /* TODO marked to delete
    async function saveUserHowAboutToSkapp(howAboutSkylink, commentsSkylink, likes, header) {
        try {
            const howAboutJson = {
                skylink: howAboutSkylink,
                commentsSkylink: commentsSkylink,
                likes: likes,
                metadata: {
                    header: header ?? ERROR_MSG,
                    creator: userID ?? generateDynamicName(),
                    creationDate: new Date().toUTCString()
                }
            };
            const index = proposalRecords.howabouts.findIndex(h => h.skylink === howAboutSkylink);
            if (index >= 0) {
                const old = proposalRecords.howabouts[index];
                howAboutJson.metadata.creationDate = old.metadata.creationDate;
                howAboutJson.metadata.creator = old.metadata.creator;
                howAboutJson.likes = likes ? likes : old.likes;
                howAboutJson.commentsSkylink = commentsSkylink ? commentsSkylink : old.commentsSkylink;
                proposalRecords.howabouts[index] = howAboutJson;
                dispatch({type: ActionTypes.SET_PROPOSAL_RECORDS, payload: proposalRecords});
            } else {
                proposalRecords.howabouts.push(howAboutJson);
                dispatch({type: ActionTypes.SET_PROPOSAL_RECORDS, payload: proposalRecords});
            }

            return await writeJsonToSkyDB(SKAPP_DATA_KEY, proposalRecords).then((res) => {
                return res;
            });
        } catch (e) {
            console.error(`Error saving skapp member to SkyDB: ${e.message}`);
        }
    }

     */


    // Lazy loads the content of a shared proposal directly from a skylink.
    /*
    async function handleLazyLoad(skylink) {
        // const {data} = await skynetClient.getFileContent(skylink);
        const data = await readFileContentFromSkylink(skylink);
        console.debug(`${App.name}.handleLazyLoad() -> data=${JSON.stringify(data)}`);
        // Tell contentRecord that we requested the details of a proposal
        // TODO move to skynet-ops.js
        await recordInteraction(skylink, 'readMoreAction'); // TODO move to centralized const file
        return data._data;
    }
    */





    // Handles a user's like/unlike action.
    /*
    async function handleLikeAction(event, likedHowabout, header) {
        setLoading(true);
        try {
            console.debug(`App.handleLikeAction: likedHowAbout=${JSON.stringify(likedHowabout)}`);
            console.debug(`App.handleLikeAction: currentSkappData=${JSON.stringify(proposalRecords)}`);
            console.debug(`App.handleLikeAction: howAboutsLikedByMember=${JSON.stringify(howAboutsLikedByMember)}`);

            // Determine if the user has liked the first time or unlike a previous one.
            const firstTimeLike = howAboutsLikedByMember.findIndex((k) => k.skylink === likedHowabout.skylink) < 0;
            if (firstTimeLike) {
                // Save user's like to MySky and increase like counter on skapp's SkyDB.
                console.debug(`App.handleLikeAction: saving like to skapp's SkyDB and MySky.`);

                // User
                const likedContent = {skylink: likedHowabout.skylink};
                howAboutsLikedByMember.push(likedContent);
                await writeJsonToMySky(mySky, MYSKY_LIKES_FILE_PATH, howAboutsLikedByMember);
                // Skapp
                const modifiedLikes = likedHowabout.likes + 1;
                await saveUserHowAboutToSkapp(likedHowabout.skylink, null, modifiedLikes, header);
            } else {
                // Remove user's like from MySky and decrease like counter on skapp's SkyDB.
                console.debug(`App.handleLikeAction: removing like from skapp's SkyDB and MySky.`);
                // User
                const filtered = howAboutsLikedByMember.filter(h => h.skylink !== likedHowabout.skylink);
                await writeJsonToMySky(mySky, MYSKY_LIKES_FILE_PATH, filtered).then(() => {
                    dispatch({type: ActionTypes.SET_MYSKY_USER_PROPOSALS_LIKED, payload: filtered})
                    setHowAboutsLikedByMember(filtered);
                });

                // Skapp
                const modifiedLikes = likedHowabout.likes - 1;
                await saveUserHowAboutToSkapp(likedHowabout.skylink, null, modifiedLikes, header);
            }
            // Tell contentRecord that we updated the likes
            await recordInteraction(likedHowabout.skylink, 'updatedLikesAction'); // TODO move to centralized const file.
        } catch (e) {
            console.error(`Error while handling like: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

     */


    // Handles a user's comment action.
    /* TODO marked to delete
    async function handleCommentAction(event, comments) {
        try {
            setLoading(true);
            console.debug(`App.handleCommentAction: comments=${JSON.stringify(comments)}`);
            const res = await writeJsonToSkyDB(SKAPP_DATA_KEY_COMMENTS, comments);
            // Tell contentRecord that we commented a proposal
            await recordInteraction(res.dataLink, 'commentedAction'); // TODO move to centralized const file.
            return res;
        } catch (e) {
            console.error(`Error while handling comment: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

     */


    // Props to pass to the components.
    const propsSegmentMemberArea = {
        // variables
        // proposalRecords,
        // ideaHeadline,
        // setIdeaHeadline,
        // idea,
        // setIdea,
        // fileSkylink,
        // setFileSkylink,
        // file,
        // setFile,
        // loading,
        // loggedIn,

        // mysky and dacs
        // userID,
        // mySky,
        // contentRecord,
        // userProfile,

        // SKAPP_DATA_KEY_COMMENTS,

        // methods
        // handleMySkyLogin,
        // handleMySkyLogout,
        // handleSetProposal,
        // handleLazyLoad,
        // handleCommentAction,
        // saveUserHowAboutToSkapp
    };
    const propsSegmentShared = {
        // variables
        // proposalRecords,
        // howAboutsLikedByMember,
        // loggedIn,
        // loading,

        // mysky and dacs
        // userID,
        // mySky,
        // contentRecord,
        // userProfile,


        // SKAPP_DATA_KEY_COMMENTS,

        // methods
        // handleLikeAction,
        // handleLazyLoad,
        // handleCommentAction,
        // saveUserHowAboutToSkapp
    }

    // This is the actual layout; not a beauty but it's something :)
    return (
        <SegmentGroup>
            {isLocalhost &&
            <Button content={'Debug Outputs'} onClick={() => {
                handleDebug()
            }}/>
            }
            <HeaderSegment/>
            <Dimmer page active={isLoading}>
                <Loader indeterminate={true} active={isLoading} size={"large"}>Working...</Loader>
            </Dimmer>
            <MemberSegment />
            <IdeaSharedListSegment />
            <FooterSegment/>
        </SegmentGroup>
    );
}

const mapStateToProps = state => ({
    proposalRecords: state.proposalRecords,
    mySkyUserPublicKey: state.mySkyUserPublicKey,
    mySkyInstance: state.mySkyInstance,
    isLoggedIn: state.isLoggedIn,
    mySkyUserProposalsLiked: state.mySkyUserProposalsLiked,
});

const mapDispatchToProps = dispatch => {
    return {
        dispatch
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);
