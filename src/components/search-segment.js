import {Search, Segment} from "semantic-ui-react";
import {connect} from "react-redux";
import React from "react";
import ModalDialogFresh from "./modal-dialog-fresh";

const SearchSegment = ({proposalRecords}) => {

    // Reducer for the actual search.
    function resultReducer(state, action) {
        switch (action.type) {
            case 'CLEAN_QUERY':
                return initialState
            case 'START_SEARCH':
                return {...state, loading: true, value: action.query}
            case 'FINISH_SEARCH':
                return {...state, loading: false, results: action.results}
            case 'UPDATE_SELECTION':
                return {...state, value: action.selection}
            default:
                throw new Error()
        }
    }

    // helper methods
    const _ = require("lodash");

    // States
    const initialState = {
        loading: false,
        results: [],
        value: '',
    }
    const [state, dispatch] = React.useReducer(resultReducer, initialState)
    const {loading, results, value} = state
    const timeoutRef = React.useRef()
    const [searchResultElement, setSearchResultElement] = React.useState();
    const [searchableItems, setSearchableItems] = React.useState(() => proposalRecords);
    const [showModal, setShowModal] = React.useState(false);

    React.useEffect(() => {
        setSearchableItems(prepareSearchElements(proposalRecords.howabouts));
    }, [proposalRecords])

    // Returns a list of searchable proposals compliant to the format of the search component.
    function prepareSearchElements(searchables) {
        const tmp = [];
        if (searchables) {
            for (let el of searchables) {
                const elJson = {
                    title: el?.metadata?.header ?? 'NOT_PROVIDED',
                    description: el?.metadata?.creationDate ?? 'NOT_PROVIDED',
                    skylink: el?.skylink ?? 'NOT_PROVIDED',
                    commentsSkylink: el?.commentsSkylink ?? 'NOT_PROVIDED',
                    likes: el?.likes ?? 'NOT_PROVIDED',
                    header: el?.metadata?.header ?? 'NOT_PROVIDED',
                    creator: el?.metadata?.creator ?? 'NOT_PROVIDED',
                    creationdate: el?.metadata?.creationDate ?? 'NOT_PROVIDED'
                }
                tmp.push(elJson);
            }
        }
        return tmp;
    }


    // Handles the actual search event.
    const handleSearchChange = React.useCallback((e, data) => {
        clearTimeout(timeoutRef.current)

        dispatch({type: 'START_SEARCH', query: data.value})
        timeoutRef.current = setTimeout(() => {
            // Return directly when no searchable content has been set.
            if (!searchableItems || searchableItems.length === 0) {
                console.error(`SearchSegment: Unexpected; searchable content not set: ${JSON.stringify(searchableItems)}`);
                clearTimeout(timeoutRef.current);
                dispatch({type: 'CLEAN_QUERY'});
                return;
            }

            // Return directly when not search term has been provided
            if (data.value.length === 0) {
                dispatch({type: 'CLEAN_QUERY'});
                return;
            }

            const regExp = new RegExp(_.escapeRegExp(data.value), 'i')
            const isMatch = (result) => {
                const regexResult = regExp.test(result.header);
                console.debug(`SearchSegment: Regexing header with search term; result=${regexResult}[${result.header}][${data.value}]; `);
                return regexResult;
            }
            dispatch({
                type: 'FINISH_SEARCH',
                results: _.filter(searchableItems, isMatch)
            })
        }, 750)
    }, [searchableItems, _]);


    // Clear timeout
    React.useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current)
        }
    }, [])

    // Handle search result item click
    const handleOnSearchItemClick = (item) => {
        console.debug(`SearchSegment.handleOnSearchItemClick(); data=${JSON.stringify(item.result)}`);
        dispatch({type: 'UPDATE_SELECTION', selection: item.result.header});
        setSearchResultElement(item.result);
        setShowModal(true);
    }


    const onDialogClose = React.useCallback((requiresReload) => {
        console.debug(`${SearchSegment.name}: Modal closed -> reloading=${requiresReload}`);
        setShowModal(false);
        setSearchResultElement(null);
        dispatch({type: 'CLEAN_QUERY'});

        // FIXME: update proposals elegantly
        if (requiresReload) {
            window.location.reload(true);
        }
    }, [])


    // Render
    return (
        <>
            <Segment>
                <Search
                    loading={loading}
                    onResultSelect={(e, data) => {
                        handleOnSearchItemClick(data)
                    }}
                    fluid={true}
                    onSearchChange={handleSearchChange}
                    results={results}
                    value={value}
                    maxLength={100}
                    placeholder={'Search...'}
                />
            </Segment>

            <ModalDialogFresh
                showDialog={showModal}
                hideTriggerButton={true}
                onDialogCloseAction={onDialogClose}
                proposalSkylink={searchResultElement?.skylink}
                proposalCommentsSkylink={searchResultElement?.commentsSkylink}
                proposalHeader={searchResultElement?.header}
                proposalCreationDate={searchResultElement?.creationdate}
                proposalCreator={searchResultElement?.creator}/>
        </>
    )
};

const mapStateToProps = state => ({
    isLoggedIn: state.isLoggedIn,
    proposalRecords: state.proposalRecords,
    mySkyUserPublicKey: state.mySkyUserPublicKey,
    mySkyInstance: state.mySkyInstance
});

const mapDispatchToProps = dispatch => {
    return {
        dispatch
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SearchSegment);