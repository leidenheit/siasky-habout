import * as React from "react";
import {useEffect, useState} from "react";
import {
    Button,
    Container,
    Divider,
    Header,
    Image,
    Label,
    List,
    Pagination,
    Segment,
    SegmentGroup
} from "semantic-ui-react";
import imageSkynet from '../assets/skynet-logo.svg'
import {generateUniqueID} from "web-vitals/dist/modules/lib/generateUniqueID";
import ModalDialog from "./modal-dialog";

const IdeaSharedListSegment = (props) => {

    // helper methods
    const _ = require("lodash");

    // Given
    const [sharedProposals, setSharedProposals] = useState(props.howAboutData.howabouts);
    const [likedProposals, setLikedProposals] = useState(props.howAboutsLikedByMember);
    const [isLoggedIn, setIsLoggedIn] = useState(props.loggedIn);


    // Pagination
    const ITEMS_PER_PAGE = 5;
    const [page, setPage] = useState(1);
    const [itemsPerPage] = useState(ITEMS_PER_PAGE);
    let setPageNum = (event, {activePage}) => {
        setPage(Math.ceil(activePage));
    }


    // Apply react state.
    useEffect(() => {
        console.debug(`IdeaSharedListSegment: useEffect: howAbouts=${JSON.stringify(props.howAboutData.howabouts)}`);
        setSharedProposals(props.howAboutData.howabouts);
        setLikedProposals(props.howAboutsLikedByMember)
        setIsLoggedIn(props.loggedIn);
    }, [
        props.howAboutData.howabouts,
        props.howAboutsLikedByMember,
        props.loggedIn
    ]);


    // Provide a single list to render with the information of both, every shared proposal and the likes of the user.
    let uiProposals = [];
    for (const proposal of sharedProposals) {

        const matchingProposalThatWasLiked = likedProposals.findIndex(likedByMemberProposal =>
            likedByMemberProposal.skylink === proposal.skylink) >= 0;
        if (matchingProposalThatWasLiked) {
            console.debug(`Found a matching proposal the user liked before; skylink=${proposal.skylink}`);
        }
        const uiProposal = {
            id: generateUniqueID(),
            skylink: proposal.skylink,
            likesCount: proposal.likes ?? "Likes not provided",
            header: proposal.metadata?.header ?? "Header not provided",
            creator: proposal.metadata?.creator ?? "Creator not provided",
            creationDate: proposal.metadata?.creationDate ?? "CreationData not provided",
            likedByMember: matchingProposalThatWasLiked,
            rawProposal: proposal,
        };
        uiProposals.push(uiProposal);
    }


    // Dispatch a user's like action.
    let handleClick = (event, raw, header) => {
        props.handleLikeAction(event, raw, header);
    }


    // Prepare items for rendering.
    // TODO <Label size='mini'>friendly {sharedProposal.creator}</Label>
    let renderItems = [];
    if (uiProposals.length > 0) {
        let ordered = _.orderBy(uiProposals, [
            function (item) {
                return item.creationDate;
            },
            function (item) {
                return item.likesCount;
            }
        ], ['asc', 'desc']);
        renderItems = ordered.map((sharedProposal) =>
            <List.Item key={sharedProposal.id}>
                <br/>
                <br/>
                <Image floated={'left'} rounded={true} size={'tiny'} src={imageSkynet}/>
                <Button.Group size='medium' floated='right'>
                    <Button
                        color={sharedProposal.likedByMember && isLoggedIn ? 'green' : 'grey'}
                        content={isLoggedIn ? 'Great Idea!' : 'Login required'}
                        icon={sharedProposal.likedByMember && isLoggedIn ? 'thumbs up' : 'thumbs up outline'}
                        label={{
                            color: sharedProposal.likedByMember && isLoggedIn ? 'green' : 'grey',
                            circular: true,
                            pointing: 'left',
                            content: sharedProposal.likesCount
                        }}
                        onClick={(event) => handleClick(event, sharedProposal.rawProposal, sharedProposal.header)}
                        disabled={(props.loggedIn && props.loading) || !props.loggedIn}/>
                </Button.Group>
                <List.Content floated='left'>
                    <List.Header as={'h3'}>{sharedProposal.header}</List.Header>
                    <br/>
                    <List.Content>
                        <ModalDialog {...props}
                                     proposalSkylink={sharedProposal.skylink}
                                     proposalHeader={sharedProposal.header}
                                     proposalCreationDate={sharedProposal.creationDate}
                                     proposalCreator={sharedProposal.creator}/>
                    </List.Content>
                    <br/>
                    <List.Description>
                        <Label size='mini'>Shared on {sharedProposal.creationDate}</Label>
                    </List.Description>
                    <br/>
                </List.Content>
                <br/>
                <br/>
            </List.Item>
        );
    }
    // Prepare pagination pages
    const TOTAL_PAGES = renderItems.length / itemsPerPage;
    renderItems = renderItems.slice(
        (page - 1) * itemsPerPage,
        (page - 1) * itemsPerPage + itemsPerPage
    );


    // Actual rendering.
    /* TODO Ordering
    <Segment>
        <Button.Group attached={true} vertical={false} size='mini'>
            <Button compact={true}
                    onClick={(event) => console.error("NOT IMPLEMENTED")}>
                Most Popular
            </Button>
            <Button.Or/>
            <Button compact={true} onClick={(event) => console.error("NOT IMPLEMENTED")}>
                Most Recent
            </Button>
        </Button.Group>
    </Segment>
     */
    return (
        <>
            <Container>
                <Divider horizontal>
                    <Header size='large'>Ideas Shared by the Skynet Community</Header>
                </Divider>
                <br/>
                <SegmentGroup>
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

export default IdeaSharedListSegment;