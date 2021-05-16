import {Button, Container, Segment, SegmentGroup} from "semantic-ui-react";
import * as React from "react";
import IdeaSubmitSegment from "./idea-submit-segment";
import {connect} from "react-redux";
import {handleMySkyLogin, handleMySkyLogout} from "../utils/skynet-ops";

const MemberSegment = ({mySkyInstance, mySkyUserPublicKey, isLoggedIn, dispatch}) => {

    return (
        <>
            <Container textAlign='left' floated='right'>
                <SegmentGroup size={"tiny"}>
                    <Segment>
                        {isLoggedIn
                            ? <Button onClick={async () => {await handleMySkyLogout(mySkyInstance, dispatch)}}>Logout from MySky</Button>
                            : <Button positive onClick={async () => {await handleMySkyLogin(mySkyInstance, dispatch)}}>Login with MySky</Button>
                        }
                    </Segment>

                    {isLoggedIn &&
                        <IdeaSubmitSegment />
                    }
                </SegmentGroup>
            </Container>
            <br/>
            <br/>
        </>
    );
};


const mapStateToProps = state => ({
    isLoggedIn: state.isLoggedIn,
    mySkyInstance: state.mySkyInstance,
    mySkyUserPublicKey: state.mySkyUserPublicKey,
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
(MemberSegment);