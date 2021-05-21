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
import {connect} from 'react-redux';
import * as ActionTypes from "./store/action-types";
import {
    SET_IS_LOGGED_IN,
    SET_MYSKY_INSTANCE,
    SET_MYSKY_USER_PROPOSALS_LIKED,
    SET_MYSKY_USER_PUBLIC_KEY
} from "./store/action-types";
import {
    contentRecord,
    isLocalhost,
    MYSKY_LIKES_FILE_PATH,
    SKAPP_DATA_DOMAIN,
    SKAPP_DATA_KEY,
    skynetClient,
    userProfile
} from "./utils/skynet-utils";
import {readJsonFromMySky, readJsonFromSkyDB, writeJsonToSkyDB,} from "./utils/skynet-ops";

// Actual app.
function App({mySkyInstance, mySkyUserPublicKey, isLoggedIn, proposalRecords, mySkyUserProposalsLiked, dispatch}) {

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
    }, [isLoggedIn, mySkyInstance, dispatch]);

    // On initial run, start initialization of MySky.
    useEffect(() => {
        // define async setup function
        async function initMySky() {
            try {
                setIsLoading(true);
                // Load invisible iframe and define app's data domain need for permission to write.
                const mySky = await skynetClient.loadMySky(SKAPP_DATA_DOMAIN, {
                    dev: isLocalhost,
                    debug: isLocalhost
                });
                // Load necessary DACs and permissions.
                await mySky.loadDacs(contentRecord, userProfile);
                // Check if the user is already logged in with permissions.
                const loggedIn = await mySky.checkLogin();
                console.debug(loggedIn ? `Already logged into MySky;` : `MySky requires login;`);
                // Set react state for login status and to access mySky in rest of app.
                // setMySky(mySky);
                dispatch({type: SET_IS_LOGGED_IN, payload: loggedIn});
                dispatch({type: SET_MYSKY_INSTANCE, payload: mySky});
                // setLoggedIn(loggedIn);
                if (loggedIn) {
                    const userID = await mySky.userID();
                    dispatch({type: SET_MYSKY_USER_PUBLIC_KEY, payload: userID});
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
                        dispatch({type: SET_MYSKY_INSTANCE, payload: null});
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

    const handleDebugFileInput = async (event) => {
        const input = document.querySelector("#input");
        const file = input.files.item(0);
        fileToText(file, async (text) => {
            const jsontoWrite = JSON.parse(text);
            alert(JSON.stringify(jsontoWrite));
            await writeJsonToSkyDB(SKAPP_DATA_KEY, jsontoWrite);
        });
    }

    function fileToText(file, callback) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async () => {
            callback(reader.result);
        };
    }

    // This is the actual layout; not a beauty but it's something :)
    return (
        <SegmentGroup>
            {isLocalhost &&
            <Button content={'Debug Outputs'} onClick={() => {
                handleDebug()
            }}/>
            }

            {isLocalhost &&
                <input id="input" type="file" accept="text/plain" onChange={(event => {handleDebugFileInput(event)})}/>
            }

            <HeaderSegment/>
            <Dimmer page active={isLoading}>
                <Loader indeterminate={true} active={isLoading} size={"large"}>Working...</Loader>
            </Dimmer>
            <MemberSegment/>
            <IdeaSharedListSegment/>
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
