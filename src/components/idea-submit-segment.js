import {
    Container,
    Dimmer,
    Form,
    Header,
    Icon,
    Image,
    Label,
    Loader,
    Segment,
    SegmentGroup
} from "semantic-ui-react";
import * as React from "react";
import FileDrop from "./filedrop";
import {trim} from "lodash/string";
import {connect} from "react-redux";
import {handleShareProposal, readProfileFromPublicKey} from "../utils/skynet-ops";
import imageSia from "../assets/sia-logo.svg";

const IdeaSubmitSegment = ({isLoggedIn, proposalRecords, mySkyUserPublicKey, mySkyInstance, dispatch}) => {

    // React states
    const [isLoading, setIsLoading] = React.useState(false);
    const [headlineAvailable, setHeadlineAvailable] = React.useState(false);
    const [detailsAvailable, setDetailsAvailable] = React.useState(false);
    const [proposalHeadlineText, setProposalHeadlineText] = React.useState('');
    const [proposalDetailText, setProposalDetailText] = React.useState('');
    const [uploadPreview, setUploadPreview] = React.useState('');
    const [file, setFile] = React.useState('');
    const [currentUser, setCurrentUser] = React.useState("Loading Username...");
    const [currentUserAvatar, setCurrentUserAvatar] = React.useState("Loading Avatar...");

    React.useEffect( () => {
        if (mySkyUserPublicKey) {
            readProfileFromPublicKey(mySkyUserPublicKey).then((res) => {
                setCurrentUser(res.username);
                setCurrentUserAvatar(res.avatar);
            });
        }
    }, [mySkyUserPublicKey])

    const handleHeadlineInputChange = (e) => {
        setHeadlineAvailable(trim(e.target.value).length > 0);
        setProposalHeadlineText(e.target.value);
    }
    const handleDetailsInputChange = (e) => {
        setDetailsAvailable(trim(e.target.value).length > 0);
        setProposalDetailText(e.target.value);
    }

    const clearInputs = () => {
        setHeadlineAvailable(false);
        setDetailsAvailable(false);
        setProposalHeadlineText('');
        setProposalDetailText('');
        setFile('');
        setUploadPreview('');
    }

    const handleSubmit = async (e) => {
        try {
            setIsLoading(true);
            await handleShareProposal(proposalRecords,
                proposalHeadlineText, proposalDetailText, file, mySkyUserPublicKey,
                mySkyInstance, dispatch);
            clearInputs();

            // FIXME: refresh shared more elegantly
            window.location.reload(true);
        } catch (e) {
          console.error(`Submitting proposal failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }


    // Actual render
    return (
        <>
            <Segment>
                <Container textAlign='justified'>
                    <Dimmer page active={isLoading}>
                        <Loader indeterminate={true} active={isLoading} size={'large'}>Working...</Loader>
                    </Dimmer>
                    <Header size='medium'>
                        {`Welcome ${currentUser}`} &nbsp; <Image circular size={'mini'} src={currentUserAvatar?.url ?? imageSia}/>
                    </Header>
                    <Form>
                        <SegmentGroup size={"tiny"}>
                            <Segment>
                                <Form.Input
                                    label='Title of your idea'
                                    placeholder='max. 100 characters'
                                    required={true}
                                    autoFocus={true}
                                    maxLength={100}
                                    value={proposalHeadlineText}
                                    onChange={handleHeadlineInputChange}
                                    disabled={(isLoggedIn && isLoading) || !isLoggedIn}/>
                                <Form.TextArea
                                    style={{minHeight: 100}}
                                    label='Explain your idea'
                                    placeholder='max. 4096 characters'
                                    maxLength={4096}
                                    required={true}
                                    autoFocus={false}
                                    value={proposalDetailText}
                                    onChange={handleDetailsInputChange}
                                    disabled={(isLoggedIn && isLoading) || !isLoggedIn}
                                />
                            </Segment>
                            <SegmentGroup horizontal={true}>
                                <Segment clearing>
                                    <Form.Field>
                                        <label>Optionally, upload an illustration of your idea:</label>
                                        <FileDrop
                                            setFile={setFile}
                                            setUploadPreview={setUploadPreview}
                                        />
                                    </Form.Field>
                                </Segment>
                                {file &&
                                <Segment.Inline>
                                    <Segment tertiary clearing>
                                        <Image
                                            size={'small'}
                                            label={{
                                                basic: true,
                                                color: 'grey',
                                                content: 'Preview',
                                                ribbon: true,
                                                size: 'mini'
                                            }}
                                            src={uploadPreview}/>
                                    </Segment>
                                </Segment.Inline>
                                }
                            </SegmentGroup>
                            <Segment color='green'>
                                <Form.Group inline>
                                    <Form.Button color={'green'}
                                                 onClick={(event => handleSubmit(event))}
                                                 disabled={
                                                     (isLoggedIn && isLoading) || !isLoggedIn || !detailsAvailable
                                                     || !headlineAvailable}>
                                        <Icon name={'share alternate'}/>
                                        {isLoading ? "Sharing..." : "Share It!"}
                                    </Form.Button>
                                    <Label basic pointing={'left'} color={'grey'}>
                                        Any submission shared with Skynet is immutable at the moment.
                                    </Label>
                                </Form.Group>
                            </Segment>
                        </SegmentGroup>
                    </Form>
                </Container>
            </Segment>
        </>
    );
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
)
(IdeaSubmitSegment);