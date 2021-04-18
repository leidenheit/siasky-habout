import {Button, Container, Divider, Form, Header, SegmentGroup} from "semantic-ui-react";
import * as React from "react";
import IdeaSubmitSegment from "./idea-submit-segment";
import SearchSegment from "./search-segment";

const MemberSegment = (props) => {

    return (
        <>
            <Container textAlign='left' floated='right'>
                <Form>
                    {props.loggedIn
                        ? <Button onClick={props.handleMySkyLogout}>Logout</Button>
                        : <Button positive onClick={props.handleMySkyLogin}>Login</Button>
                    }
                </Form>
                {props.loggedIn &&
                    <Divider horizontal>
                        <Header size='large'>Member Area</Header>
                    </Divider>
                }
                {props.loggedIn && <br/>}
                {props.loggedIn &&
                    <SegmentGroup>
                        <SearchSegment {...props}/>
                        <IdeaSubmitSegment {...props}/>
                    </SegmentGroup>
                }
            </Container>
            <br/>
            <br/>
        </>
    );
};

export default MemberSegment;