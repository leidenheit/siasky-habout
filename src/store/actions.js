import * as ActionTypes from './action-types';

export const setMySkyUserPublicKey = (publicKey) => ({
    type: ActionTypes.SET_MYSKY_USER_PUBLIC_KEY,
    payload: publicKey
});

export const setMySkyUserProposalsLiked = (likedProposals) => ({
    type: ActionTypes.SET_MYSKY_USER_PROPOSALS_LIKED,
    payload: likedProposals
});

export const setProposalRecords = proposals => ({
    type: ActionTypes.SET_PROPOSAL_RECORDS,
    payload: proposals
});

export const setIsLoggedIn = (isLoggedIn) => ({
    type: ActionTypes.SET_IS_LOGGED_IN,
    payload: isLoggedIn
});

export const setIsLoading = (isLoading) => ({
    type: ActionTypes.SET_IS_LOADING,
    payload: isLoading
});