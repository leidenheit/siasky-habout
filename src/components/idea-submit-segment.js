import {Container, Form, Header, Segment} from "semantic-ui-react";
import * as React from "react";

const IdeaSubmitSegment = (props) => {

    // React states
    const [headlineAvailable, setHeadlineAvailable] = React.useState(false);
    const [detailsAvailable, setDetailsAvailable] = React.useState(false);
    const handleHeadlineInputChange = (e) => {
        setHeadlineAvailable(e.target.value.length > 0);
        props.setIdeaHeadline(e.target.value)
    }
    const handleDetailsInputChange = (e) => {
        setDetailsAvailable(e.target.value.length > 0);
        props.setIdea(e.target.value)
    }


    // Actual render
    return (
        <>
            <Segment>
                <Container textAlign='justified'>
                    <Header size='medium'>Share your Skapp Idea</Header>
                    <Form>
                        <Form.Input
                            label='Short head line of your proposal:'
                            placeholder='Enter headline...'
                            required={true}
                            autoFocus={true}
                            maxLength={64}
                            value={props.ideaHeadline}
                            onChange={handleHeadlineInputChange}
                            disabled={(props.loggedIn && props.loading) || !props.loggedIn}/>
                        <Form.TextArea
                            label='Write down you proposal in detail below:'
                            placeholder='Enter details...'
                            rows={5}
                            maxLength={1024}
                            required={true}
                            autoFocus={false}
                            value={props.idea}
                            onChange={handleDetailsInputChange}
                            disabled={(props.loggedIn && props.loading) || !props.loggedIn}
                        />

                        <Form.Button onClick={props.handleSetProposal}
                                     disabled={(props.loggedIn && props.loading) || !props.loggedIn || !detailsAvailable || !headlineAvailable}>
                            {props.loading ? "Sharing..." : "Share with our Community"}
                        </Form.Button>

                        {props.displaySuccess && (
                            <Form.Field label='Your idea has been saved!'/>
                        )}
                    </Form>
                </Container>
            </Segment>
        </>
    );
};

export default IdeaSubmitSegment;