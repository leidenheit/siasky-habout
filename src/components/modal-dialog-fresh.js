import {
    Button,
    Container, Dimmer,
    Divider,
    Form,
    Header,
    Image,
    Label,
    List, Loader,
    Modal,
    Segment,
    SegmentGroup
} from "semantic-ui-react";
import * as React from "react";
import {trim} from "lodash";
import {connect} from "react-redux";
import {
    handleShareProposalComment,
    lazyLoadFromSkylink, readProfileFromPublicKey,
    recordInteraction
} from "../utils/skynet-ops";
import {generateUniqueID} from "web-vitals/dist/modules/lib/generateUniqueID";

const ModalDialogFresh = ({
                              isLoggedIn,
                              mySkyUserPublicKey,
                              proposalSkylink,
                              proposalCommentsSkylink,
                              proposalHeader,
                              proposalCreationDate,
                              proposalCreator,
                              showDialog,
                              hideTriggerButton,
                              onDialogCloseAction,
                              mySkyInstance,
                              dispatch
                          }) => {

    const [popupIsOpen, setPopupIsOpen] = React.useState(showDialog);
    const [isLoading, setIsLoading] = React.useState(false);

    const [lazyLoadedProposalDetailsText, setLazyLoadedProposalDetailsText] = React.useState('');
    const [lazyLoadedProposalDetailsImageLink, setLazyLoadedProposalDetailsImageLink] = React.useState('');
    const [lazyLoadedProposalCreator, setLazyLoadedProposalCreator] = React.useState('');
    const [lazyLoadedProposalComments, setLazyLoadedProposalComments] = React.useState([]);

    const [uiComments, setUiComments] = React.useState([]);

    const [commentAvailable, setCommentAvailable] = React.useState(false);
    const [commentText, setCommentText] = React.useState('');

    // FIXME: used to tell parent if reload must be forced.
    const [contentUpdated, setContentUpdated] = React.useState(false);

    // Weird handling for forced opening from outside.
    React.useEffect(() => {
        if (proposalSkylink && proposalCreator) {
            setPopupIsOpen(showDialog);
        }
    }, [showDialog, proposalCreator, proposalSkylink])

    // Lazy load content.
    React.useEffect(() => {
        async function prepareContent(proposalCreator, proposalSkylink) {
            try {
                setIsLoading(true);
                const proposalCreatorProfile = await readProfileFromPublicKey(proposalCreator);
                const proposalDetails = await lazyLoadFromSkylink(proposalSkylink);

                setLazyLoadedProposalCreator(proposalCreatorProfile.username);
                setLazyLoadedProposalDetailsText(proposalDetails.text);
                setLazyLoadedProposalDetailsImageLink(proposalDetails.imageSkylink);

                if (proposalCommentsSkylink) {
                    const proposalComments = await lazyLoadFromSkylink(proposalCommentsSkylink);
                    for (let comment of proposalComments) {
                        const authorProfile = await readProfileFromPublicKey(comment.author);
                        console.debug(`Preparing comments: modified authorId ${comment.author} into ${authorProfile.username}`);
                        comment.author = authorProfile?.username ?? 'NOT_PROVIDED';
                    }

                    setLazyLoadedProposalComments(proposalComments);
                }
            } finally {
                setIsLoading(false);
            }
        }

        if (proposalSkylink && proposalCreator && popupIsOpen)
            prepareContent(proposalCreator, proposalSkylink);

    }, [popupIsOpen, proposalCreator, proposalSkylink, proposalCommentsSkylink])

    // Render comments as ui elements when available.
    React.useEffect(() => {

        function prepareComments(comments) {
            if (comments && comments.length > 0) {
                const renderItems = renderComments(comments);
                setUiComments(renderItems);
            }
        }

        if (popupIsOpen)
            prepareComments(lazyLoadedProposalComments);

    }, [popupIsOpen, lazyLoadedProposalComments]);

    // Render comments for the UI.
    const renderComments = (comments) => {
        try {
            return comments.map((feed) => {
                return (
                    <List.Item key={generateUniqueID()}>
                        <List.Content>
                            <List.Header as='a' size={'mini'}>
                                <Label
                                    circular><i>{feed.creationDate ?? "NOT_PROVIDED"}</i>&nbsp; by {feed.author ?? "NOT_PROVIDED"}
                                </Label>
                            </List.Header>
                            <List.Description>
                                {feed.comment}
                            </List.Description>
                        </List.Content>
                    </List.Item>
                )
            });
        } catch (e) {
            console.error(`Error rendering comments: ${e.message}`);
        }
    }

    // Handle comment input changes.
    const handleCommentInputChange = (e) => {
        setCommentAvailable(trim(e.target.value).length > 0);
        setCommentText(e.target.value);
    }

    // Handle the trigger click event.
    const handleModalTriggerClick = async (proposalSkylink, commentsSkylink) => {
        try {
            console.debug(`${ModalDialogFresh.name}.handleModalTriggerClick:
                proposalSkylink=${proposalSkylink}
                commentsSkylink=${commentsSkylink}`);
            if (proposalSkylink && isLoggedIn) {
                await recordInteraction(proposalSkylink, 'readMoreAction');
            }
        } catch (e) {
            console.error(e.message);
        }
    }


    // Handles modal onOpen and onClose events.
    const handleDialogStateIsOpen = async (popupOpen) => {
        try {
            if (!isLoading) {
                console.debug(`handleDialogStateIsOpen: popupOpen=${popupOpen}`)
                setPopupIsOpen(popupOpen);
                if (!popupOpen) {
                    setCommentText('');
                    setCommentAvailable(false);
                    if (onDialogCloseAction !== undefined) {
                        onDialogCloseAction(contentUpdated);
                    }
                } else {
                    setContentUpdated(false);
                }
            }
        } catch (e) {
            console.error(e.message);
        }
    }

    // Handle commenting on a proposal.
    const handlePublishComment = async () => {
        try {
            setIsLoading(true);
            const res = await handleShareProposalComment(commentText, proposalCommentsSkylink, proposalSkylink, proposalHeader,
                mySkyUserPublicKey, mySkyUserPublicKey, mySkyInstance, dispatch);
            if (res) {
                for (let comment of res) {
                    const authorProfile = await readProfileFromPublicKey(comment.author);
                    console.debug(`Preparing comments: modified authorId ${comment?.author} into ${authorProfile?.username}`);
                    comment.author = authorProfile?.username ?? 'NOT_PROVIDED';
                }
                setLazyLoadedProposalComments(res);
            }
            setCommentText('');
            setContentUpdated(true);
        } finally {
            setIsLoading(false);
        }
    }

    // Actual rendering.
    return (
        <>
            <Modal
                onClose={() => handleDialogStateIsOpen(false)}
                onOpen={() => handleDialogStateIsOpen(true)}
                open={popupIsOpen}
                trigger={!hideTriggerButton && <Button size={'small'}
                                                       onClick={async () => handleModalTriggerClick(proposalSkylink, proposalCommentsSkylink)}
                                                       content={'More...'}/>}>



                <Modal.Header>{proposalHeader}</Modal.Header>
                <Label attached={'top right'} size={'mini'}
                       content={`Shared by ${lazyLoadedProposalCreator} at ${proposalCreationDate}`}/>
                <Modal.Content>
                    <Dimmer active={isLoading}>
                        <Loader size={"large"} active={isLoading}>Working...</Loader>
                    </Dimmer>
                    <Modal.Description>
                        <SegmentGroup>
                            <Segment color='green'>
                                {lazyLoadedProposalDetailsText}
                            </Segment>
                            {lazyLoadedProposalDetailsImageLink &&
                                <Segment secondary textAlign={'center'} >
                                    <Image src={lazyLoadedProposalDetailsImageLink} size={'huge'} as='a'
                                           href={lazyLoadedProposalDetailsImageLink} target='_blank'
                                           label={{
                                               attached: 'top left',
                                               color: 'grey',
                                               content: 'Click on the Illustration to open directly on Skynet!',
                                               size: 'mini'
                                           }}/>
                                </Segment>
                            }
                            <Segment secondary attached={'bottom'}>
                                <Header icon={'comments'} content={'Comments by the Community'}
                                        size={'small'}/>
                                <Container>
                                    <Form>
                                        <Form.TextArea floated={'left'}
                                                       style={{minHeight: 42}}
                                                       placeholder='max. 512 characters'
                                                       maxLength={512}
                                                       required={true}
                                                       autoFocus={false}
                                                       value={commentText}
                                                       onChange={handleCommentInputChange} />
                                        <Form.Button color={"green"} size={'tiny'} floated={'left'}
                                                     content={isLoggedIn ? 'Share Comment' : 'Login required'}
                                                     onClick={async () => handlePublishComment()}
                                                     disabled={(isLoggedIn && !commentAvailable) || !isLoggedIn}/>
                                    </Form>
                                </Container>
                                <br/>
                                <Divider section/>
                                <List divided={true} items={uiComments}/>
                                {uiComments.length === 0 &&
                                    <Label circular content={'No Comments found. Be the First!'}/>
                                }
                            </Segment>
                        </SegmentGroup>
                    </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                    <Button color='grey' onClick={() => handleDialogStateIsOpen(false)}>
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    )
}

const mapStateToProps = state => ({
    isLoggedIn: state.isLoggedIn,
    proposalRecords: state.proposalRecords,
    proposalComments: state.proposalComments,
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
)
(ModalDialogFresh);