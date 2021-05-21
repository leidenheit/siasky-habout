import {Button, Container, Dimmer, Label, List, Loader, Pagination, Segment, SegmentGroup} from "semantic-ui-react";
import {generateUniqueID} from "web-vitals/dist/modules/lib/generateUniqueID";
import {connect} from "react-redux";
import {handleLikeProposal, readJsonFromMySky} from "../utils/skynet-ops";
import ModalDialogFresh from "./modal-dialog-fresh";
import React, {useState} from "react";
import SearchSegment from "./search-segment";
import {MYSKY_LIKES_FILE_PATH} from "../utils/skynet-utils";

const IdeaSharedListSegment = ({
                                   proposalRecords,
                                   mySkyUserProposalsLiked,
                                   isLoggedIn,
                                   mySkyUserPublicKey,
                                   mySkyInstance,
                                   dispatch
                               }) => {

    // helper methods
    const _ = require("lodash");

    // Given
    const [orderByMostPopular, setOrderByMostPopular] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(false);
    // const [proposals, setProposals] = React.useState(proposalRecords);

    const [uiProposals, setUiProposals] = useState([]);
    const [renderItems, setRenderItems] = useState([]);
    const [slicedRenderItems, setSlicedRenderItems] = useState(renderItems);
    // const [userPublicKeys, setUserPublicKeys] = useState(null);
    React.useEffect(() => {
        const prepareContent = async () => {
            return await prepareProposalsForUi(proposalRecords);
        }

        if (proposalRecords?.howabouts && proposalRecords.howabouts.length > 0) {
            prepareContent().then((res) => {
                setUiProposals(res);
            });
        }
    }, [proposalRecords, orderByMostPopular]);

    // Rendering of the list content.
    React.useEffect(() => {
        /*
        const readUserNames = async (proposals) => {
            let publickeys = {};
            for(let proposal of proposals) {
                // extract public key
                // console.debug(`AVa: currentprop=${JSON.stringify(proposal)}`);
                if (proposal.creator) {
                    const x = proposal.creator;
                    if (!(x in publickeys)) {
                        // console.debug(`AVa: public key added -> pk=${JSON.stringify(x)}`);
                        const authorProfile = await readProfileFromPublicKey(proposal.creator);
                        // console.debug(`AVa: Preparing list entry: modified authorId ${proposal.author} into ${authorProfile?.username}`);
                        const author = authorProfile?.username ?? 'NOT_PROVIDED';
                        // console.debug(`AVa: ! -> x=${JSON.stringify(x)}; author=${JSON.stringify(author)}`);
                        publickeys[x] = author;
                    } else {
                        // console.debug(`AVa: public key added -> pk=${JSON.stringify(x)}`);
                    }
                }
            }
            setUserPublicKeys(publickeys);
        }
         */
        if (uiProposals) {
            renderContent(uiProposals);
        }
    }, [uiProposals, isLoggedIn])

    // Pagination
    const ITEMS_PER_PAGE = 10;
    const [page, setPage] = React.useState(1);
    const [itemsPerPage] = React.useState(ITEMS_PER_PAGE);
    let setPageNum = (event, {activePage}) => {
        setPage(Math.ceil(activePage));
    }

    // Handle modal dialog close event.
    const handleOnModalClose = React.useCallback((requiresReload) => {
        // FIXME: update proposals elegantly
        console.debug(`${IdeaSharedListSegment.name}: Modal closed -> reloading=${requiresReload}`);
        if (requiresReload) {
            window.location.reload(true);
        }
    }, []);

    // Provide a single list to render with the information of both, every shared proposal and the likes of the user.
    const prepareProposalsForUi = async (proposals) => {
        try {
            setIsLoading(true);
            let res = [];
            if (proposals?.howabouts) {
                for (const proposal of proposals?.howabouts) {
                    const matchingProposalThatWasLiked = mySkyUserProposalsLiked.findIndex(likedByMemberProposal =>
                        likedByMemberProposal.skylink === proposal.skylink) >= 0;
                    const uiProposal = {
                        id: generateUniqueID(),
                        skylink: proposal.skylink,
                        commentsSkylink: proposal.commentsSkylink ?? null,
                        likesCount: proposal.likes ?? "NOT_PROVIDED",
                        header: proposal.metadata?.header ?? "NOT_PROVIDED",
                        creator: proposal.metadata?.creator.substr(1, 8) + "..." ?? "NOT_PROVIDED",
                        creationDate: proposal.metadata?.creationDate ?? "NOT_PROVIDED",
                        likedByMember: matchingProposalThatWasLiked,
                        rawProposal: proposal,
                    };
                    res.push(uiProposal);
                }
            }
            return res;
        } finally {
            setIsLoading(false);
        }
    }

    // Dispatch a user's like action.
    let handleClick = async (event, raw, header) => {
        try {
            setIsLoading(true);
            const likedProposals = await readJsonFromMySky(mySkyInstance, MYSKY_LIKES_FILE_PATH);
            await handleLikeProposal(likedProposals.data ?? [], raw, header, mySkyUserPublicKey, mySkyInstance, dispatch);
        } finally {
            setIsLoading(false);
        }
    }

    // Ordering
    const orderProposals = (toOrderProposals) => {
        if (orderByMostPopular) {
            // most popular
            return _.orderBy(toOrderProposals, [
                function (item) {
                    return item.likesCount;
                },
                function (item) {
                    return item.commentsSkylink !== null
                },
                function (item) {
                    return item.header
                }
            ], ['desc', 'desc', 'asc']);
        } else {
            // most recent
            return _.orderBy(toOrderProposals, [
                function (item) {
                    return new Date(item.creationDate);
                },
                function (item) {
                    return item.likesCount;
                },
                function (item) {
                    return item.header
                }
            ], ['desc', 'desc', 'asc']);
        }
    }

    // Prepare items for rendering.
    const [totalPages, setTotalPages] = useState(0);
    const renderContent = async (toRenderElements) => {
        try {
            setIsLoading(true);
            const ordered = orderProposals(toRenderElements);
            const res = ordered.map((sharedProposal, index) => {
                return (
                    <List.Item key={sharedProposal.id}>
                        {sharedProposal.commentsSkylink !== null &&
                        <Container>
                            <Label ribbon image size={'tiny'} color={'green'} icon={'group'}
                                   content={'Discussed by the Community!'}/>
                            <br/>
                            <br/>
                        </Container>
                        }
                        <List.Content floated='left'>
                            <List.Header as={'h4'}>{sharedProposal.header}</List.Header>
                            <List.Content>
                                <List.Description>
                                    <Label size='mini'>
                                        Shared by {sharedProposal.creator}
                                        <Label.Detail>{sharedProposal.creationDate}</Label.Detail>
                                    </Label>
                                    <br/>
                                    <br/>
                                    <Button size={'tiny'} floated='left'
                                            color={sharedProposal.likedByMember && isLoggedIn ? 'green' : 'grey'}
                                            content={isLoggedIn ? 'Likes' : 'Login required'}
                                            icon={sharedProposal.likedByMember && isLoggedIn ? 'heart' : 'heart outline'}
                                            label={{
                                                color: sharedProposal.likedByMember && isLoggedIn ? 'green' : 'grey',
                                                pointing: 'right',
                                                content: sharedProposal.likesCount
                                            }}
                                            labelPosition={'left'}
                                            onClick={(event) => handleClick(event, sharedProposal.rawProposal, sharedProposal.header)}
                                            disabled={(isLoggedIn && isLoading) || !isLoggedIn}/>
                                    <ModalDialogFresh proposalSkylink={sharedProposal.skylink}
                                                      proposalCommentsSkylink={sharedProposal.commentsSkylink}
                                                      proposalHeader={sharedProposal.header}
                                                      proposalCreationDate={sharedProposal.creationDate}
                                                      proposalCreator={sharedProposal.creator}
                                                      onDialogCloseAction={handleOnModalClose}/>

                                    <br/>
                                    <br/>
                                </List.Description>
                            </List.Content>
                        </List.Content>
                        <br/>
                        <br/>
                    </List.Item>
                )
            });
            setRenderItems(res);
        } finally {
            setIsLoading(false);
        }
    }

    // Pagination of rendered items.
    React.useEffect(() => {
        const startIndex = (page - 1) * itemsPerPage;
        setTotalPages(Math.ceil(renderItems.length / itemsPerPage));
        const endIndex = Math.min(startIndex + itemsPerPage, renderItems.length);
        setSlicedRenderItems(renderItems.slice(
            startIndex,
            endIndex
        ));
    }, [renderItems, page]);

    // Actual rendering.
    return (
        <>
            <Container>
                <Dimmer page active={isLoading}>
                    <Loader indeterminate={true} active={isLoading} size={'large'}>Working...</Loader>
                </Dimmer>
                <Label attached={'top right'}>Total Count: {uiProposals.length ?? 'n/a'}</Label>
                <SegmentGroup raised size={"small"}>
                    <SearchSegment/>
                    <Segment>
                        <Button.Group attached={"left"} vertical={true} labeled={true} size='mini' fluid={true}>
                            <Button color={orderByMostPopular ? 'green' : 'grey'} compact={true}
                                    onClick={(event) => {
                                        setOrderByMostPopular(true);
                                        setPage(1)
                                    }}
                                    icon={'fire'}
                                    labelPosition={"left"}
                                    content='Order By Most Popular'/>
                            <Button color={!orderByMostPopular ? 'green' : 'grey'} compact={true}
                                    onClick={(event) => {
                                        setOrderByMostPopular(false);
                                        setPage(1)
                                    }}
                                    icon={'calendar outline'}
                                    labelPosition={"left"}
                                    content='Order by Most Recent'/>
                        </Button.Group>
                        <br/>
                        <Container textAlign='left'>
                            <Pagination
                                secondary
                                boundaryRange={0}
                                siblingRange={1}
                                activePage={page}
                                totalPages={totalPages}
                                onPageChange={setPageNum}/>
                        </Container>
                    </Segment>
                    <Segment>
                        <Container textAlign='justified'>
                            <List size='massive'
                                  items={slicedRenderItems}
                                  divided={true}
                                  verticalAlign='top'
                                  selection={false}/>
                        </Container>
                    </Segment>
                    <Segment>
                        <Container textAlign='left'>
                            <Pagination
                                secondary
                                boundaryRange={0}
                                siblingRange={1}
                                activePage={page}
                                totalPages={totalPages}
                                onPageChange={setPageNum}/>
                        </Container>
                    </Segment>
                </SegmentGroup>
            </Container>
            <br/>
            <br/>
        </>
    );
}

const mapStateToProps = state => ({
    proposalRecords: state.proposalRecords,
    mySkyUserProposalsLiked: state.mySkyUserProposalsLiked,
    mySkyUserPublicKey: state.mySkyUserPublicKey,
    mySkyInstance: state.mySkyInstance,
    isLoggedIn: state.isLoggedIn
});

const mapDispatchToProps = dispatch => {
    return {
        dispatch
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(IdeaSharedListSegment);