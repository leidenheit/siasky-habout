import {createStore} from 'redux';
import * as ActionTypes from "./action-types";
import {CLEAR_SUBMIT_PROPOSAL_MASK} from "./action-types";

/**
 * A reducer is just a function that takes two arguments and
 * returns your app's current state.
 */
const initialState = {
    isLoggedIn: false,

    mySkyInstance: null,

    mySkyUserPublicKey: '',
    mySkyUserProposalsLiked: [],

    proposalCommentsSkylink: '',

    proposalRecords: [],


    modalDetailsPopupIsOpen: false,

}
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case ActionTypes.SET_IS_LOGGED_IN: {
            return {
                ...state,
                isLoggedIn: action.payload
            }
        }
        case ActionTypes.SET_MYSKY_USER_PUBLIC_KEY: {
            return {
                ...state,
                mySkyUserPublicKey: action.payload
            }
        }
        case ActionTypes.SET_MYSKY_USER_PROPOSALS_LIKED: {
            return {
                ...state,
                mySkyUserProposalsLiked: action.payload
            }
        }
        case ActionTypes.SET_PROPOSAL_RECORDS: {
            return {
                ...state,
                proposalRecords: action.payload
            }
        }
        case ActionTypes.SET_PROPOSAL_COMMENTS_SKYLINK: {
            return {
                ...state,
                proposalCommentsSkylink: action.payload
            }
        }
        case ActionTypes.SET_MYSKY_INSTANCE: {
            return {
                ...state,
                mySkyInstance: action.payload
            }
        }
        case ActionTypes.SET_IS_MODAL_DETAILS_POPUP_OPEN: {
            return {
                ...state,
                modalDetailsPopupIsOpen: action.payload
            }
        }

        default: {
            return state;
        }
    }
}


/**
 * The central location in which we store the state is called
 * a store.
 */
const store = createStore(reducer)

export default store