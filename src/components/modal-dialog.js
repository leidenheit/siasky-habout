import {Button, Dimmer, Header, Label, Loader, Modal, Segment} from "semantic-ui-react";
import * as React from "react";

const ModalDialog = (props) => {

    const [popupIsOpen, setPopupIsOpen] = React.useState(false);
    const [lazyLoadedDetails, setLazyLoadedDetails] = React.useState("Loading...");
    const [loading, setLoading] = React.useState(false);
    const [isLoggedIn, setIsLoggedIn] = React.useState(props.loggedIn);

    // Apply react state.
    React.useEffect(() => {
        setIsLoggedIn(props.loggedIn);
    }, [
        props.loggedIn
    ]);

    let handleClick = async (event, skylink) => {
        try {
            setLoading(true);
            const res = await props.handleLazyLoad(skylink);
            console.debug(`Dialog lazy loading details from skynet; skylink=${JSON.stringify(skylink)}; lazyloaded=${JSON.stringify(res)}`);
            setLazyLoadedDetails(res);
            return (<div>{res}</div>)
        } catch (e) {
            console.log.error(e.message);
        } finally {
            setLoading(false);
        }
    }

    // TODO <Label>By {props.proposalCreator}</Label>
    return (
        <>
            <Modal
                onClose={() => setPopupIsOpen(false)}
                onOpen={() => setPopupIsOpen(true)}
                open={popupIsOpen}
                trigger={<Button size={'small'}
                                 onClick={(event => handleClick(event, props.proposalSkylink))}
                                 disabled={!isLoggedIn}
                                 content={!isLoggedIn ? 'Login required': 'Read more...'} />}>

                <Modal.Header>Details of Skapp Idea</Modal.Header>
                <Modal.Content>
                    <Modal.Description>
                        <Header>{props.proposalHeader}</Header>
                        <Segment>
                            <Dimmer active={loading}>
                                <Loader active={loading}/>
                            </Dimmer>
                            {lazyLoadedDetails}
                        </Segment>
                        <Label>{props.proposalCreationDate}</Label>
                    </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                    <Button color='grey' onClick={() => setPopupIsOpen(false)}>
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    )
}

export default ModalDialog;