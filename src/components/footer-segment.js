import {Container, Header, List, Segment} from "semantic-ui-react";
import * as React from "react";

const FooterSegment = (props) => {

    return (
        <>
            <Container>
                <footer className="mt-6 text-center text-sm leading-5 text-gray-300">
                    <Segment>
                        <Container textAlign='justified'>
                            <Header size='medium'>About</Header>
                            <List>
                                <List.Item
                                    icon='sticky note outline'
                                    content='This project was built during the "Built to Explore - A Dream of the Future" hackathon.'/>
                                <List.Item
                                    icon='github'
                                    content={<a href='https://github.com/devAttila87/siasky-habout'>See the source on GitHub</a>}
                                />
                            </List>
                        </Container>
                    </Segment>
                </footer>
            </Container>
            <br/>
            <br/>
        </>
    );
};

export default FooterSegment;