import {Header, Search, Segment} from "semantic-ui-react";
import * as React from "react";
import {useState} from "react";

const SearchSegment = (props) => {

    // Reducer for the actual search.
    function resultReducer(state, action) {
        // console.debug(`Search; Reducer called; state=${JSON.stringify(state)}; action=${JSON.stringify(action)}`);
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
    const [searchResultElement, setSearchResultElement] = useState();
    const [searchableItems, setSearchableItems] = useState(() => props.howAboutData.howabouts);
    React.useEffect(() => {
        setSearchableItems(prepareSearchElements(props.howAboutData.howabouts));
    }, [props.howAboutData.howabouts])


    // Returns a list of searchable proposals compliant to the format of the search component.
    function prepareSearchElements(searchables) {
        const tmp = [];
        for (let el of searchables) {
            const elJson = {
                title: el?.metadata?.header ?? '***NOT_PROVIDED***',
                description: el?.metadata?.creationDate ?? '***NOT_PROVIDED***',
                skylink: el?.skylink ?? '***NOT_PROVIDED***',
                likes: el?.likes ?? '***NOT_PROVIDED***',
                header: el?.metadata?.header ?? '***NOT_PROVIDED***',
                creator: el?.metadata?.creator ?? '***NOT_PROVIDED***',
                creationdate: el?.metadata?.creationDate ?? '***NOT_PROVIDED***'
            }
            tmp.push(elJson);
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
    }, [searchableItems]);


    // Clear timeout
    React.useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current)
        }
    }, [])


    // Render
    return (
        <>
            <Segment>
                <Header size='small'>Lookup Ideas (experimental)</Header>
                You can check if the idea you have in mind was already shared.
                <br/>
                In addition you can click on a result item to see a little more details.
                <br/>
                <br/>
                <Search
                    loading={loading}
                    onResultSelect={(e, data) => {
                        dispatch({type: 'UPDATE_SELECTION', selection: data.result.header});
                        console.debug(`Search; result was clicked; data=${JSON.stringify(data)}`);
                        alert(`${data.result.header}\n\nBy ${data.result.creator} at ${data.result.creationdate}\n\nLikes: ${data.result.likes}`)
                        setSearchResultElement(data.result);
                    }}
                    onSearchChange={handleSearchChange}
                    results={results}
                    value={value}
                    placeholder={'Enter a buzz word...'}
                />
            </Segment>
        </>
    );
}

export default SearchSegment;