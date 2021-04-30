import {
    Button,
    Container, Dimmer,
    Divider,
    Header,
    Image,
    Label,
    List, Loader,
    Pagination,
    Segment,
    SegmentGroup
} from "semantic-ui-react";
import imageSkynet from '../assets/skynet-logo.svg'
import imageSia from '../assets/sia-logo.svg'
import {generateUniqueID} from "web-vitals/dist/modules/lib/generateUniqueID";
import {connect} from "react-redux";
import {handleLikeProposal} from "../utils/skynet-ops";
import ModalDialogFresh from "./modal-dialog-fresh";
import React from "react";
import SearchSegment from "./search-segment";

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
    const [orderByMostPopular, setOrderByMostPopular] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    // Pagination
    const ITEMS_PER_PAGE = 8;
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
    }, [proposalRecords]);

    // Provide a single list to render with the information of both, every shared proposal and the likes of the user.
    let uiProposals = [];
    if (proposalRecords?.howabouts) {
        for (const proposal of proposalRecords?.howabouts) {
            const matchingProposalThatWasLiked = mySkyUserProposalsLiked.findIndex(likedByMemberProposal =>
                likedByMemberProposal.skylink === proposal.skylink) >= 0;
            const uiProposal = {
                id: generateUniqueID(),
                skylink: proposal.skylink,
                commentsSkylink: proposal.commentsSkylink ?? null,
                likesCount: proposal.likes ?? "NOT_PROVIDED",
                header: proposal.metadata?.header ?? "NOT_PROVIDED",
                creator: proposal.metadata?.creator ?? "NOT_PROVIDED", // TODO consider retrieving userprofile here
                creationDate: proposal.metadata?.creationDate ?? "NOT_PROVIDED",
                likedByMember: matchingProposalThatWasLiked,
                rawProposal: proposal,
            };
            uiProposals.push(uiProposal);
        }
    }

    // Dispatch a user's like action.
    let handleClick = async (event, raw, header) => {
        try {
            setIsLoading(true);
            await handleLikeProposal(proposalRecords, mySkyUserProposalsLiked, raw, header, mySkyUserPublicKey, mySkyInstance, dispatch);
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
                }
            ], ['desc']);
        } else {
            // most recent
            return _.orderBy(toOrderProposals, [
                function (item) {
                    return new Date(item.creationDate);
                },
                function (item) {
                    return item.likesCount;
                }
            ], ['desc', 'desc']);
        }
    }

    // Prepare items for rendering.
    let renderItems = [];
    if (uiProposals.length > 0) {
        const ordered = orderProposals(uiProposals);
        renderItems = ordered.map((sharedProposal, index) => {
            // console.debug(`ProposalToRender=${JSON.stringify(sharedProposal)}`);
            return (
            <List.Item key={sharedProposal.id}>
                <br/>
                <br/>
                <Image floated={'left'} rounded={true} size={'tiny'} src={index % 2 === 0 ? imageSkynet : imageSia}/>
                <Button floated='right'
                        color={sharedProposal.likedByMember && isLoggedIn ? 'green' : 'grey'}
                        content={isLoggedIn ? 'Like' : 'Login required'}
                        icon={sharedProposal.likedByMember && isLoggedIn ? 'heart' : 'heart outline'}
                        label={{
                            color: sharedProposal.likedByMember && isLoggedIn ? 'green' : 'grey',
                            pointing: 'left',
                            content: sharedProposal.likesCount
                        }}
                        onClick={(event) => handleClick(event, sharedProposal.rawProposal, sharedProposal.header)}
                        disabled={(isLoggedIn && isLoading) || !isLoggedIn}/>

                <List.Content floated='left'>
                    <List.Header as={'h4'}>{sharedProposal.header}</List.Header>
                    <br/>
                    <List.Content>
                        <ModalDialogFresh proposalSkylink={sharedProposal.skylink}
                                          proposalCommentsSkylink={sharedProposal.commentsSkylink}
                                          proposalHeader={sharedProposal.header}
                                          proposalCreationDate={sharedProposal.creationDate}
                                          proposalCreator={sharedProposal.creator}
                                          onDialogCloseAction={handleOnModalClose}/>
                    </List.Content>
                    <br/>
                    <List.Description>
                        <Label size='mini'>Shared at {sharedProposal.creationDate}</Label>
                    </List.Description>
                    <br/>
                </List.Content>
                <br/>
                <br/>
            </List.Item>
            )}
        );
    }

    // Prepare pagination pages
    const TOTAL_PAGES = renderItems.length / itemsPerPage;
    renderItems = renderItems.slice(
        (page - 1) * itemsPerPage,
        (page - 1) * itemsPerPage + itemsPerPage
    );


    // Actual rendering.
    return (
        <>
            <Container>
                <Dimmer page active={isLoading}>
                    <Loader indeterminate={true} active={isLoading} size={'large'}>Working...</Loader>
                </Dimmer>
                <SegmentGroup raised size={"small"}>

                    <SearchSegment />
                    <Segment>
                        <Button.Group attached={true} vertical={false} size='mini'>
                            <Button color={!orderByMostPopular ? 'green' : 'grey'} compact={true}
                                    onClick={(event) => setOrderByMostPopular(false)}>
                                Order by Most Recent
                            </Button>
                            <Button.Or/>
                            <Button color={orderByMostPopular ? 'green' : 'grey'} compact={true}
                                    onClick={(event) => setOrderByMostPopular(true)}>
                                Order By Most Popular
                            </Button>
                        </Button.Group>
                    </Segment>
                    <Segment>
                        <Container textAlign='center'>
                            <Pagination
                                pointing
                                secondary
                                firstItem={null}
                                lastItem={null}
                                activePage={page}
                                totalPages={TOTAL_PAGES}
                                siblingRange={1}
                                onPageChange={setPageNum}/>
                        </Container>
                    </Segment>
                    <Segment>
                        <Container textAlign='justified'>
                            <List size='large'
                                  items={renderItems}
                                  divided={true}
                                  animated={true}
                                  verticalAlign='top'/>
                        </Container>
                    </Segment>
                    <Segment>
                        <Container textAlign='center'>
                            <Pagination
                                pointing
                                secondary
                                firstItem={null}
                                lastItem={null}
                                activePage={page}
                                totalPages={TOTAL_PAGES}
                                siblingRange={1}
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