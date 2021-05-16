// Saves a user's how about to skydb.
import {
    contentRecord, MYSKY_LIKES_FILE_PATH,
    MYSKY_PROPOSALS_FILE_PATH, SKAPP_DATA_KEY, SKAPP_DATA_KEY_COMMENTS,
    SKAPP_PRIVATE_KEY,
    SKAPP_PUBLIC_KEY,
    skynetClient,
    userProfile
} from "./skynet-utils";
import {
    SET_IS_LOGGED_IN, SET_MYSKY_USER_PROPOSALS_LIKED, SET_MYSKY_USER_PUBLIC_KEY,
    SET_PROPOSAL_COMMENTS_SKYLINK
} from "../store/action-types";
import * as ActionTypes from "../store/action-types";

// Writes related data to skydb.
export async function writeJsonToSkyDB(dataKey, toWriteJson) {
    try {
        const res = await skynetClient.db.setJSON(SKAPP_PRIVATE_KEY, dataKey, toWriteJson);
        console.debug(`Writing JSON to SkyDB:\n\tdataKey=${dataKey}\n\ttoWriteJson=${JSON.stringify(toWriteJson)}\n\t->res=${JSON.stringify(res)}`);
        return res;
    } catch (e) {
        console.error(`Error writing data to SkyDB: ${e.message}`);
    }
}

// Reads related data from sky db.
export async function readJsonFromSkyDB(dataKey) {
    try {
        const res = await skynetClient.db.getJSON(SKAPP_PUBLIC_KEY, dataKey);
        console.debug(`Reading JSON from SkyDB():\n\tdataKey=${dataKey}\n\t->res=${JSON.stringify(res)}`);
        return res;
    } catch (e) {
        console.error(`Error reading data from SkyDB: ${e.message}`);
    }
}

// Reads file content from a given skylink and returns it's data object.
export async function readFileContentFromSkylink(skylink) {
    try {
        const {data} = await skynetClient.getFileContent(skylink);
        console.debug(`Reading file content from skylink:\n\tskylink=${skylink}\n\t->res=${JSON.stringify(data)}`);
        return data;
    } catch (e) {
        console.error(`Error reading file content: ${e.message}`);
    }
}

// Adds an interaction to content record DAC.
export async function recordInteraction(skylink, action) {
    try {
        console.debug(`Recording content interaction:\n\tskylink=${JSON.stringify(skylink)}\n\taction=${JSON.stringify(action)}`);
        return await contentRecord.recordInteraction({
            skylink: skylink,
            metadata: {
                action: action
            }
        });
    } catch (e) {
        console.error(`Error recording content interaction: ${e.message}`);
    }
}

// Adds a new entry to content record DAC.
export async function recordNew(skylink) {
    try {
        console.debug(`Recording new content:\n\tskylink=${JSON.stringify(skylink)}`);
        return await contentRecord.recordNewContent({
            skylink: skylink
        });
    } catch (e) {
        console.error(`Error recording new content: ${e.message}`);
    }
}

// Reads data from MySky scope.
export async function readJsonFromMySky(mySkyInstance, filePath) {
    try {
        const res = await mySkyInstance.getJSON(filePath);
        console.debug(`Reading JSON from MySky:\n\tfilePath=${filePath}\n\t->res=${JSON.stringify(res)}`);
        return res;
    } catch (e) {
        console.error(`Error reading JSON from MySky: ${e.message}`);
    }
}

// Write JSON to a given MySky instance.
export async function writeJsonToMySky(mySkyInstance, filePathToWriteTo, toWriteJson) {
    try {
        const res = await mySkyInstance.setJSON(filePathToWriteTo, toWriteJson);
        console.debug(`Writing JSON to MySky:\n\tfilePathToWriteTo=${filePathToWriteTo}\n\ttoWriteJson=${toWriteJson}\n\t->res=${JSON.stringify(res)}`);
        return res;
    } catch (e) {
        console.error(`Error writing JSON to MySky: ${e.message}`);
    }
}

// Returns the profile of a given public key from the UserProfile DAC.
export async function readProfileFromPublicKey(userPublicKey) {
    try {
        const res = await userProfile.getProfile(userPublicKey);
        console.debug(`Reading profile information of user:\n\tpublicKey=${userPublicKey}\n\t->res=${JSON.stringify(res)}`);
        return res;
    } catch (e) {
        console.error(`: ${e.message}`);
    }
}

// Handle a user's login action.
export async function handleMySkyLogin(mySkyInstance, dispatch) {
    try {
        // Try login again, opening popup. Returns true if successful.
        const status = await mySkyInstance.requestLoginAccess();
        dispatch({type: SET_IS_LOGGED_IN, payload: status});
        if (status) {
            await mySkyInstance.userID().then((res) => {
                dispatch({type: ActionTypes.SET_MYSKY_USER_PUBLIC_KEY, payload: res});
            });
        }
    } catch (e) {
        console.error(`Error logging into MySky: ${e.message}`);
    }
}

// Handle a user's logout action.
export async function handleMySkyLogout(mySkyInstance, dispatch) {
    try {
        await mySkyInstance.logout();
        dispatch({type: SET_IS_LOGGED_IN, payload: false});
        dispatch({type: SET_MYSKY_USER_PROPOSALS_LIKED, payload: []});
        dispatch({type: SET_MYSKY_USER_PUBLIC_KEY, payload: ''});
    } catch (e) {
        console.error(`Error logging out from MySky: ${e.message}`);
    }
}

// Writes comments of a proposal to SkyDB.
export async function writeProposalCommentsToSkyDB(proposalComments) {
    try {
        const res = await writeJsonToSkyDB(SKAPP_DATA_KEY_COMMENTS, proposalComments);
        // Tell contentRecord that we commented a proposal
        await recordInteraction(res.dataLink, 'commentedAction'); // TODO move to centralized const file.
        return res;
    } catch (e) {
        console.error(`Error while handling comment: ${e.message}`);
    }
}

// Handles a user's like/unlike action.
export async function handleLikeProposal(proposalsLiked, likedHowabout, header, creatorPublicKey, mySkyInstance, dispatch) {
    try {
        // Determine if the user has liked the first time or unlike a previous one.
        const firstTimeLike = proposalsLiked.findIndex((k) => k.skylink === likedHowabout.skylink) < 0;
        if (firstTimeLike) {
            // Save user's like to MySky and increase like counter on skapp's SkyDB.
            console.debug(`Saving like to SkyDB and MySky.`);

            // User
            const likedContent = {skylink: likedHowabout.skylink};
            proposalsLiked.push(likedContent);
            const res = await writeJsonToMySky(mySkyInstance, MYSKY_LIKES_FILE_PATH, proposalsLiked);
            dispatch({type: SET_MYSKY_USER_PROPOSALS_LIKED, payload: res.data});

            dispatch({type: ActionTypes.SET_MYSKY_USER_PROPOSALS_LIKED, payload: proposalsLiked});
            // Skapp
            const modifiedLikes = likedHowabout.likes <= 0 ? 1 : likedHowabout.likes + 1
            await storeHowAbout(likedHowabout.skylink, null, modifiedLikes, header, creatorPublicKey, dispatch);
        } else {
            // Remove user's like from MySky and decrease like counter on skapp's SkyDB.
            console.debug(`Removing like from SkyDB and MySky.`);
            // User
            const filtered = proposalsLiked.filter(h => h.skylink !== likedHowabout.skylink);
            await writeJsonToMySky(mySkyInstance, MYSKY_LIKES_FILE_PATH, filtered);
            dispatch({type: ActionTypes.SET_MYSKY_USER_PROPOSALS_LIKED, payload: filtered});
            // Skapp
            const modifiedLikes = likedHowabout.likes <= 0 ? 0 : likedHowabout.likes - 1;
            await storeHowAbout(likedHowabout.skylink,null, modifiedLikes, header, creatorPublicKey, dispatch);
        }
        // Tell contentRecord that we updated the likes
        await recordInteraction(likedHowabout.skylink, 'updatedLikesAction'); // TODO move to centralized const file.
    } catch (e) {
        console.error(`Error liking proposal: ${e.message}`);
    }
}

// Dispatch a user's comment action.
export async function handleShareProposalComment(commentText, proposalCommentsSkylink, proposalSkylink, proposalHeader, proposalCreator, mySkyUserPublicKey, mySkyInstance, dispatch) {
    try {
        const commentJson = {
            comment: commentText,
            author: mySkyUserPublicKey,
            creationDate: new Date().toUTCString()
        }

        let comments = await lazyLoadFromSkylink(proposalCommentsSkylink);
        if (!comments) {
            comments = [];
        }
        console.debug(`Sharing proposal comment: comment=${JSON.stringify(commentJson)} into ${JSON.stringify(comments)}`);
        comments.push(commentJson);

        const resSkylink = await writeProposalCommentsToSkyDB(comments, mySkyInstance, dispatch);
        if (resSkylink) {
            const resUpdatedComments = await lazyLoadFromSkylink(resSkylink.dataLink);
            const res = await storeHowAbout(proposalSkylink, resSkylink.dataLink, null, proposalHeader, proposalCreator, dispatch)
            console.debug(`Updating HowAbouts's comments:\n\t->res=${JSON.stringify(res)}`);
            dispatch({type: SET_PROPOSAL_COMMENTS_SKYLINK, payload: resSkylink});
            return resUpdatedComments;
        }
    } catch (e) {
        console.error(`Error sharing proposal comment: ${e.message}`);
    }
}

// Handle a user's proposal save action.
export async function handleShareProposal(headlineText, detailText, imageFile, creatorPublicKey, mySkyInstance, dispatch) {
    try {
        // When provided, upload image of proposal.
        let imageSkylinkUrl = null;
        if (imageFile) {
            console.debug(`Proposal has an image to be uploaded:\n\t${JSON.stringify(imageFile)}`);
            const {skylink} = await skynetClient.uploadFile(imageFile);
            // skylinks start with \`sia://\` and don't specify a portal URL
            // we can generate URLs for our current portal though.
            imageSkylinkUrl = await skynetClient.getSkylinkUrl(skylink);
            console.debug(`Image uploaded to Skynet:\n\t${JSON.stringify(imageSkylinkUrl)}`);
        }

        const proposal = {
            text: detailText ?? "NOT_PROVIDED",
            imageSkylink: imageSkylinkUrl ?? null
        };
        const res = await writeJsonToMySky(mySkyInstance, MYSKY_PROPOSALS_FILE_PATH, proposal);
        await storeHowAbout(res.dataLink, null, 0, headlineText, creatorPublicKey, dispatch);
        await recordNew(res.dataLink);
    } catch (error) {
        console.error(`Error sharing proposal: ${error.message}`);
    }
}

// Returns the _data from a lazy loaded skylink.
export async function lazyLoadFromSkylink(skylink) {
    const data = await readFileContentFromSkylink(skylink);
    console.debug(`Lazy loading file content:\n\tskylink=${JSON.stringify(skylink)}\n\t->res=${JSON.stringify(data)}`);
    return data?._data;
}

// Saves a user's how about to skydb.
export async function storeHowAbout(howAboutSkylink, commentsSkylink, likes, header, creatorPublicKey, dispatch) {
    try {
        const howAboutJson = {
            skylink: howAboutSkylink,
            commentsSkylink: commentsSkylink,
            likes: likes,
            metadata: {
                header: header ?? "NOT_PROVIDED",
                creator: creatorPublicKey ?? generateDynamicName(),
                creationDate: new Date().toUTCString()
            }
        };
        console.debug(`Storing howabout to SkyDB:
            howabout=${JSON.stringify(howAboutJson)}
            howaboutSkylink=${JSON.stringify(howAboutSkylink)}
            likes=${likes}`);

        // FIX: proposals records must be updated first:
        const {data} = await readJsonFromSkyDB(SKAPP_DATA_KEY);

        const index = data.howabouts.findIndex(h => h.skylink === howAboutSkylink);
        if (index >= 0) {
            const old = data.howabouts[index];
            howAboutJson.metadata.creationDate = old.metadata.creationDate;
            howAboutJson.metadata.creator = old.metadata.creator;
            howAboutJson.commentsSkylink = commentsSkylink ? commentsSkylink : old.commentsSkylink;
            if (likes === null) {
                howAboutJson.likes = old.likes;
            }
            data.howabouts[index] = howAboutJson;
        } else {
            data.howabouts.push(howAboutJson);
        }

        const res = await writeJsonToSkyDB(SKAPP_DATA_KEY, data);
        console.debug(`Stored proposals into SkyDB:\n\t${JSON.stringify(res)}`);

        // TODO investigate dispatch({type: ActionTypes.SET_PROPOSAL_RECORDS, payload: res.data});

        return res;
    } catch (e) {
        console.error(`Error saving skapp member to SkyDB: ${e.message}`);
    }
}

// Returns a dynamic name, e.g. for a member.
function generateDynamicName() {
    const names = ["David", "Chris", "Steve", "Matt", "Manasi", "PJ", "Marcin", "Karol", "Ivaylo", "Filip", "Nicole", "Daniel"]
    const dynamicName = names[Math.floor(Math.random() * names.length)];
    const suffix = Math.random().toString(16).substr(2, 8);
    console.debug(`Generated dynamic name: ${dynamicName}; Suffix: ${suffix}`);
    return dynamicName.concat("_PLACEHOLDER", "-", suffix);
}

export const noop = () => {};